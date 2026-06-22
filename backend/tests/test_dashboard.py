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
