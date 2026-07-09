import csv
import io
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import DEFAULT_ROUTING, OrderStage, OrderStatus, Product, ProductionOrder
from ..schemas import AtRiskOut, OrderCreate, OrderOut

router = APIRouter(prefix="/api/orders", tags=["orders"])

# Statuses that can still be "late": done/cancelled orders are settled.
OPEN_STATUSES = [OrderStatus.PLANNED, OrderStatus.IN_PROGRESS]


def _as_utc(dt: datetime) -> datetime:
    """SQLite hands datetimes back naive; treat them as the UTC we stored."""
    return dt if dt.tzinfo is not None else dt.replace(tzinfo=timezone.utc)


def _load(db: Session, order_id: int) -> ProductionOrder:
    order = db.scalar(
        select(ProductionOrder)
        .options(selectinload(ProductionOrder.stages), selectinload(ProductionOrder.product))
        .where(ProductionOrder.id == order_id)
    )
    if not order:
        raise HTTPException(404, detail="Order not found")
    return order


def _next_code(db: Session) -> str:
    seq = (db.scalar(select(func.count(ProductionOrder.id))) or 0) + 1
    return f"PO-{datetime.now(timezone.utc):%Y}-{seq:04d}"


@router.get("", response_model=list[OrderOut])
def list_orders(
    status: OrderStatus | None = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = (
        select(ProductionOrder)
        .options(selectinload(ProductionOrder.stages), selectinload(ProductionOrder.product))
        .order_by(ProductionOrder.created_at.desc())
    )
    if status:
        query = query.where(ProductionOrder.status == status)
    query = query.limit(limit).offset(offset)
    return db.scalars(query).all()


@router.get("/at-risk", response_model=list[AtRiskOut])
def orders_at_risk(
    within_hours: float = Query(48, gt=0),
    db: Session = Depends(get_db),
):
    """Open orders that are overdue or coming due within the window — the list a
    production manager works down every morning to stop a late shipment before
    the customer notices. Sorted by due date (most urgent first); orders without
    a due date can't be judged late, so they're excluded."""
    now = datetime.now(timezone.utc)
    threshold = now + timedelta(hours=within_hours)

    orders = db.scalars(
        select(ProductionOrder)
        .options(selectinload(ProductionOrder.stages), selectinload(ProductionOrder.product))
        .where(
            ProductionOrder.due_date.is_not(None),
            ProductionOrder.due_date <= threshold,
            ProductionOrder.status.in_(OPEN_STATUSES),
        )
        .order_by(ProductionOrder.due_date.asc())
    ).all()

    result: list[AtRiskOut] = []
    for o in orders:
        due = _as_utc(o.due_date)
        hours_to_due = (due - now).total_seconds() / 3600
        risk = "overdue" if due < now else "at_risk"
        base = OrderOut.model_validate(o).model_dump()
        result.append(AtRiskOut(**base, risk=risk, hours_to_due=round(hours_to_due, 2)))
    return result


@router.get("/export.csv")
def export_orders_csv(status: OrderStatus | None = None, db: Session = Depends(get_db)):
    """Download the orders as CSV — the format a plant manager drops into a
    spreadsheet. Honors the same status filter as the list endpoint."""
    query = (
        select(ProductionOrder)
        .options(selectinload(ProductionOrder.product))
        .order_by(ProductionOrder.created_at.desc())
    )
    if status:
        query = query.where(ProductionOrder.status == status)
    orders = db.scalars(query).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["code", "product", "quantity", "unit", "customer", "status", "created_at"])
    for o in orders:
        writer.writerow(
            [
                o.code,
                o.product.name,
                o.quantity,
                o.product.unit,
                o.customer or "",
                o.status.value,
                o.created_at.isoformat(),
            ]
        )

    return Response(
        content=buffer.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="production-orders.csv"'},
    )


@router.post("", response_model=OrderOut, status_code=201)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    if not db.get(Product, payload.product_id):
        raise HTTPException(404, detail="Product not found")

    routing = payload.routing or DEFAULT_ROUTING
    if not routing:
        raise HTTPException(422, detail="Routing must have at least one stage")

    order = ProductionOrder(
        code=_next_code(db),
        product_id=payload.product_id,
        quantity=payload.quantity,
        customer=payload.customer,
        due_date=payload.due_date,
        stages=[OrderStage(sequence=i + 1, name=name) for i, name in enumerate(routing)],
    )
    db.add(order)
    db.commit()
    return _load(db, order.id)


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    return _load(db, order_id)


@router.post("/{order_id}/advance", response_model=OrderOut)
def advance_order(order_id: int, db: Session = Depends(get_db)):
    """Move the order through its routing: start the current stage if pending,
    otherwise finish it and start the next one. Finishing the last stage
    completes the order."""
    order = _load(db, order_id)
    if order.status in (OrderStatus.DONE, OrderStatus.CANCELLED):
        raise HTTPException(409, detail=f"Order is already {order.status.value}")

    now = datetime.now(timezone.utc)
    stage = order.current_stage
    assert stage is not None  # guaranteed: order not DONE

    if stage.started_at is None:
        stage.started_at = now
        order.status = OrderStatus.IN_PROGRESS
    else:
        # Finishing a stage does NOT auto-start the next one: the gap between
        # finish and the next start is real queue time on the factory floor,
        # and making it visible is the whole point of this tracker.
        stage.finished_at = now
        if order.current_stage is None:
            order.status = OrderStatus.DONE

    db.commit()
    return _load(db, order_id)


@router.post("/{order_id}/cancel", response_model=OrderOut)
def cancel_order(order_id: int, db: Session = Depends(get_db)):
    order = _load(db, order_id)
    if order.status == OrderStatus.DONE:
        raise HTTPException(409, detail="Completed orders cannot be cancelled")
    order.status = OrderStatus.CANCELLED
    db.commit()
    return _load(db, order_id)
