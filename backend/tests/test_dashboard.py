from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.models import OrderStage, ProductionOrder
from tests.test_orders import make_order, make_product


def _advance(client, order_id, times):
    for _ in range(times):
        assert client.post(f"/api/orders/{order_id}/advance").status_code == 200


def test_dashboard_reports_status_breakdown_and_open_quantity(client):
    product = make_product(client)
    make_order(client, product["id"])  # planned
    started = make_order(client, product["id"])
    _advance(client, started["id"], 1)  # in_progress

    data = client.get("/api/dashboard").json()

    assert data["orders_by_status"]["planned"] == 1
    assert data["orders_by_status"]["in_progress"] == 1
    assert data["open_quantity_kg"] == 1000  # two orders of 500
    assert data["avg_lead_time_hours"] is None  # nothing completed yet


def test_avg_lead_time_only_counts_completed_orders(client):
    product = make_product(client)
    order = make_order(client, product["id"], routing=["Dyeing", "Finishing"])
    # 2 stages → 4 advances drives it to DONE
    _advance(client, order["id"], 4)

    data = client.get("/api/dashboard").json()

    assert data["orders_by_status"]["done"] == 1
    # Completed in the same test run, so lead time is a small non-negative number
    assert data["avg_lead_time_hours"] is not None
    assert data["avg_lead_time_hours"] >= 0


def test_bottleneck_is_the_slowest_stage(client, db_session):
    product = make_product(client)
    order = make_order(client, product["id"], routing=["Weaving", "Dyeing"])

    # Inject controlled durations: Weaving = 1h, Dyeing = 5h (the bottleneck).
    now = datetime.now(timezone.utc)
    stages = db_session.scalars(
        select(OrderStage).where(OrderStage.order_id == order["id"])
    ).all()
    by_name = {s.name: s for s in stages}
    by_name["Weaving"].started_at = now - timedelta(hours=6)
    by_name["Weaving"].finished_at = now - timedelta(hours=5)
    by_name["Dyeing"].started_at = now - timedelta(hours=5)
    by_name["Dyeing"].finished_at = now
    db_session.commit()

    data = client.get("/api/dashboard").json()

    assert data["stage_avg_hours"]["Weaving"] == 1.0
    assert data["stage_avg_hours"]["Dyeing"] == 5.0
    assert data["bottleneck_stage"] == "Dyeing"


def test_overdue_counts_only_open_orders_past_due(client, db_session):
    product = make_product(client)
    late = make_order(client, product["id"])                     # open, will be past due
    make_order(client, product["id"])                            # open, no due date → not overdue
    on_time = make_order(client, product["id"])                  # open, future due date → not overdue
    done = make_order(client, product["id"], routing=["Dyeing"])  # completed, past due but settled
    _advance(client, done["id"], 2)  # 1 stage → 2 advances → DONE

    now = datetime.now(timezone.utc)
    orders = {o.id: o for o in db_session.scalars(select(ProductionOrder)).all()}
    orders[late["id"]].due_date = now - timedelta(days=2)
    orders[on_time["id"]].due_date = now + timedelta(days=5)
    orders[done["id"]].due_date = now - timedelta(days=1)
    db_session.commit()

    data = client.get("/api/dashboard").json()

    assert data["overdue_count"] == 1  # only the open, past-due order counts
