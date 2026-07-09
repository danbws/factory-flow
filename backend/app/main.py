from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import dashboard, orders, products


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Demo-friendly bootstrap; swap for Alembic migrations in real deployments.
    Base.metadata.create_all(engine)
    yield


app = FastAPI(
    title="ShopFloor",
    description="Production tracking for print & embroidery shops.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(orders.router)
app.include_router(dashboard.router)


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok"}
