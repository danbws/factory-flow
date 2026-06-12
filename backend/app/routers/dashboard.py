from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import OrderStage, OrderStatus, ProductionOrder
from ..schemas import DashboardOut

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardOut)
def dashboard(db: Session = Depends(get_db)):
    by_status = dict(
        db.execute(
            select(ProductionOrder.status, func.count())
            .group_by(ProductionOrder.status)
        ).all()
    )

    open_qty = db.scalar(
        select(func.coalesce(func.sum(ProductionOrder.quantity), 0.0)).where(
            ProductionOrder.status.in_([OrderStatus.PLANNED, OrderStatus.IN_PROGRESS])
        )
    )

    # Orders currently sitting in each stage (started but not finished)
    stage_load = dict(
        db.execute(
            select(OrderStage.name, func.count())
            .join(ProductionOrder)
            .where(
                OrderStage.started_at.is_not(None),
                OrderStage.finished_at.is_(None),
                ProductionOrder.status == OrderStatus.IN_PROGRESS,
            )
            .group_by(OrderStage.name)
        ).all()
    )

    recent = db.scalars(
        select(ProductionOrder)
        .options(selectinload(ProductionOrder.stages), selectinload(ProductionOrder.product))
        .order_by(ProductionOrder.created_at.desc())
        .limit(5)
    ).all()

    return DashboardOut(
        orders_by_status={s.value: by_status.get(s, 0) for s in OrderStatus},
        open_quantity_kg=float(open_qty or 0),
        stage_load=stage_load,
        recent_orders=recent,
    )
