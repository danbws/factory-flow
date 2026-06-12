from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import DEFAULT_ROUTING, OrderStage, OrderStatus, Product, ProductionOrder
from ..schemas import OrderCreate, OrderOut

router = APIRouter(prefix="/api/orders", tags=["orders"])


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
def list_orders(status: OrderStatus | None = None, db: Session = Depends(get_db)):
    query = (
        select(ProductionOrder)
        .options(selectinload(ProductionOrder.stages), selectinload(ProductionOrder.product))
        .order_by(ProductionOrder.created_at.desc())
    )
    if status:
        query = query.where(ProductionOrder.status == status)
    return db.scalars(query).all()


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
