import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class OrderStatus(str, enum.Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    CANCELLED = "cancelled"


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sku: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str | None] = mapped_column(Text, default=None)
    unit: Mapped[str] = mapped_column(String(10), default="kg")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    orders: Mapped[list["ProductionOrder"]] = relationship(back_populates="product")


class ProductionOrder(Base):
    __tablename__ = "production_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    quantity: Mapped[float] = mapped_column(Float)
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, values_callable=lambda e: [m.value for m in e]),
        default=OrderStatus.PLANNED,
    )
    customer: Mapped[str | None] = mapped_column(String(120), default=None)
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    product: Mapped[Product] = relationship(back_populates="orders")
    stages: Mapped[list["OrderStage"]] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="OrderStage.sequence",
    )

    @property
    def current_stage(self) -> "OrderStage | None":
        return next((s for s in self.stages if s.finished_at is None), None)

    @property
    def lead_time_hours(self) -> float | None:
        """Wall-clock hours from the first stage starting to the last finishing.

        Only defined once every stage is finished — a partially-run order has no
        meaningful lead time yet. This is the number a plant manager actually
        tracks: how long a batch really took, queue time included."""
        starts = [s.started_at for s in self.stages if s.started_at]
        finishes = [s.finished_at for s in self.stages if s.finished_at]
        if not starts or len(finishes) != len(self.stages):
            return None
        return (max(finishes) - min(starts)).total_seconds() / 3600


class OrderStage(Base):
    """One step of the production routing (e.g. weaving, dyeing, finishing)."""

    __tablename__ = "order_stages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("production_orders.id"))
    sequence: Mapped[int] = mapped_column(Integer)
    name: Mapped[str] = mapped_column(String(60))
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    order: Mapped[ProductionOrder] = relationship(back_populates="stages")

    @property
    def duration_hours(self) -> float | None:
        """Hours this stage took (start to finish). None until both are set."""
        if not self.started_at or not self.finished_at:
            return None
        return (self.finished_at - self.started_at).total_seconds() / 3600


DEFAULT_ROUTING = ["Weaving", "Dyeing", "Finishing", "Quality Check"]
