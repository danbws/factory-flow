"""Populate the database with demo data: python -m app.seed"""
import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from .database import Base, SessionLocal, engine
from .models import DEFAULT_ROUTING, OrderStage, OrderStatus, Product, ProductionOrder

PRODUCTS = [
    ("FAB-001", "Cotton Jersey 160g", "m"),
    ("FAB-002", "Polyamide Stretch 220g", "m"),
    ("FAB-003", "Viscose Twill 180g", "m"),
    ("YRN-010", "Dyed Yarn 30/1", "kg"),
    ("YRN-011", "Raw Yarn 24/2", "kg"),
]

CUSTOMERS = ["Hanier Textiles", "Saltorelli Group", "Zion Fabrics", "Beneficiadora Americana"]


def run() -> None:
    Base.metadata.create_all(engine)
    db = SessionLocal()
    try:
        if db.scalar(select(Product).limit(1)):
            print("Database already seeded; skipping.")
            return

        products = [Product(sku=sku, name=name, unit=unit) for sku, name, unit in PRODUCTS]
        db.add_all(products)
        db.flush()

        now = datetime.now(timezone.utc)
        for i in range(1, 13):
            stages = [OrderStage(sequence=n + 1, name=s) for n, s in enumerate(DEFAULT_ROUTING)]
            order = ProductionOrder(
                code=f"PO-{now:%Y}-{i:04d}",
                product_id=random.choice(products).id,
                quantity=round(random.uniform(80, 1200), 1),
                customer=random.choice(CUSTOMERS),
                due_date=now + timedelta(days=random.randint(5, 40)),
                stages=stages,
            )
            # Walk a random number of advance steps so the board looks alive
            steps = random.randint(0, 2 * len(stages))
            t = now - timedelta(days=random.randint(1, 20))
            for _ in range(steps):
                stage = next((s for s in stages if s.finished_at is None), None)
                if stage is None:
                    break
                t += timedelta(hours=random.randint(4, 36))
                if stage.started_at is None:
                    stage.started_at = t
                    order.status = OrderStatus.IN_PROGRESS
                else:
                    stage.finished_at = t
                    if all(s.finished_at is not None for s in stages):
                        order.status = OrderStatus.DONE
            db.add(order)

        db.commit()
        print(f"Seeded {len(PRODUCTS)} products and 12 production orders.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
