def make_product(client, sku="FAB-001"):
    resp = client.post(
        "/api/products",
        json={"sku": sku, "name": "Cotton Jersey 160g", "unit": "m"},
    )
    assert resp.status_code == 201
    return resp.json()


def make_order(client, product_id, **extra):
    resp = client.post(
        "/api/orders",
        json={"product_id": product_id, "quantity": 500, **extra},
    )
    assert resp.status_code == 201
    return resp.json()


def test_duplicate_sku_is_rejected(client):
    make_product(client)
    resp = client.post(
        "/api/products", json={"sku": "FAB-001", "name": "Duplicate", "unit": "m"}
    )
    assert resp.status_code == 409


def test_order_gets_default_routing_and_code(client):
    product = make_product(client)
    order = make_order(client, product["id"])
    assert order["status"] == "planned"
    assert [s["name"] for s in order["stages"]] == [
        "Weaving", "Dyeing", "Finishing", "Quality Check",
    ]
    assert order["code"].startswith("PO-")


def test_advance_walks_the_full_routing(client):
    product = make_product(client)
    order = make_order(client, product["id"], routing=["Dyeing", "Quality Check"])

    # 2 stages = 4 advances: start/finish each
    states = []
    for _ in range(4):
        resp = client.post(f"/api/orders/{order['id']}/advance")
        assert resp.status_code == 200
        states.append(resp.json()["status"])

    assert states == ["in_progress", "in_progress", "in_progress", "done"]

    # advancing a finished order is a conflict
    resp = client.post(f"/api/orders/{order['id']}/advance")
    assert resp.status_code == 409


def test_cancel_blocks_completed_orders(client):
    product = make_product(client)
    order = make_order(client, product["id"], routing=["Dyeing"])
    for _ in range(2):
        client.post(f"/api/orders/{order['id']}/advance")

    resp = client.post(f"/api/orders/{order['id']}/cancel")
    assert resp.status_code == 409


def test_dashboard_counts(client):
    product = make_product(client)
    make_order(client, product["id"])
    order2 = make_order(client, product["id"])
    client.post(f"/api/orders/{order2['id']}/advance")

    data = client.get("/api/dashboard").json()
    assert data["orders_by_status"]["planned"] == 1
    assert data["orders_by_status"]["in_progress"] == 1
    assert data["open_quantity_kg"] == 1000.0
    assert len(data["recent_orders"]) == 2
