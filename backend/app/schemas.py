from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from .models import OrderStatus


class ProductBase(BaseModel):
    sku: str = Field(min_length=1, max_length=40)
    name: str = Field(min_length=1, max_length=120)
    description: str | None = None
    unit: str = "kg"


class ProductCreate(ProductBase):
    pass


class ProductOut(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class StageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sequence: int
    name: str
    started_at: datetime | None
    finished_at: datetime | None


class OrderCreate(BaseModel):
    product_id: int
    quantity: float = Field(gt=0)
    customer: str | None = None
    due_date: datetime | None = None
    routing: list[str] | None = None  # defaults to DEFAULT_ROUTING


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    product: ProductOut
    quantity: float
    status: OrderStatus
    customer: str | None
    due_date: datetime | None
    created_at: datetime
    stages: list[StageOut]


class DashboardOut(BaseModel):
    orders_by_status: dict[str, int]
    open_quantity_kg: float
    overdue_count: int  # open orders past their due date — the on-time-delivery miss count
    stage_load: dict[str, int]  # stage name -> nr of orders currently sitting there
    avg_lead_time_hours: float | None  # mean wall-clock hours for completed orders
    stage_avg_hours: dict[str, float]  # stage name -> mean hours spent in that stage
    bottleneck_stage: str | None  # stage with the highest average time — where work piles up
    recent_orders: list[OrderOut]
