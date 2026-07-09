from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.models import ProductionOrder
from tests.test_orders import make_order, make_product


def _advance(client, order_id, times):
    for _ in range(times):
        assert client.post(f"/api/orders/{order_id}/advance").status_code == 200


def test_at_risk_returns_overdue_and_due_soon_only(client, db_session):
    product = make_product(client)
    past_due = make_order(client, product["id"])                     # open, already late
    due_soon = make_order(client, product["id"])                     # open, due in 12h
    far_off = make_order(client, product["id"])                      # open, due in 5 days
    done = make_order(client, product["id"], routing=["Dyeing"])     # completed but past due
    _advance(client, done["id"], 2)  # 1 stage -> 2 advances -> DONE

    now = datetime.now(timezone.utc)
    orders = {o.id: o for o in db_session.scalars(select(ProductionOrder)).all()}
    orders[past_due["id"]].due_date = now - timedelta(days=1)
    orders[due_soon["id"]].due_date = now + timedelta(hours=12)
    orders[far_off["id"]].due_date = now + timedelta(days=5)
    orders[done["id"]].due_date = now - timedelta(days=1)
    db_session.commit()

    items = client.get("/api/orders/at-risk").json()

    # Exactly the past-due and due-in-12h orders — done and the 5-day one excluded.
    codes = {i["code"] for i in items}
    assert codes == {past_due["code"], due_soon["code"]}

    # Sorted by due_date ascending: the overdue one first.
    assert items[0]["code"] == past_due["code"]
    assert items[0]["risk"] == "overdue"
    assert items[0]["hours_to_due"] < 0

    assert items[1]["code"] == due_soon["code"]
    assert items[1]["risk"] == "at_risk"
    assert items[1]["hours_to_due"] > 0


def test_at_risk_window_boundary_is_respected(client, db_session):
    product = make_product(client)
    order = make_order(client, product["id"])

    now = datetime.now(timezone.utc)
    orders = {o.id: o for o in db_session.scalars(select(ProductionOrder)).all()}
    orders[order["id"]].due_date = now + timedelta(hours=30)
    db_session.commit()

    # Default window (48h) includes an order due in 30h...
    assert len(client.get("/api/orders/at-risk").json()) == 1
    # ...but a tighter 24h window excludes it.
    assert client.get("/api/orders/at-risk?within_hours=24").json() == []
