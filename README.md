# 🏭 ShopFloor

**See every job on your floor and catch the late ones before your customer does — without a
whiteboard.**

**ShopFloor** is production tracking **for print & embroidery shops** (2–20 people) that run today
on whiteboards, paper tickets, and a Google Sheet. Jobs move through a configurable routing and
the dashboard shows what's on the floor right now, per stage — plus which orders are about to be
late.

> **Who it's for:** owners and production managers of US screen-print / embroidery shops with
> 20–150 open jobs and no reliable answer to "which jobs are about to slip?" Routing is
> configurable, so adjacent verticals (sign/CNC, food) fit later.

> **Status:** the production **engine is done** — configurable routing, stage timestamps,
> automatic lead-time & bottleneck math, and **at-risk detection** (`GET /api/orders/at-risk`).
> The **SaaS shell** (auth, multi-tenant orgs, billing, roles) is on the roadmap — see
> [`docs/PRODUCT.md`](docs/PRODUCT.md).

[![CI](https://github.com/danbws/factory-flow/actions/workflows/ci.yml/badge.svg)](https://github.com/danbws/factory-flow/actions/workflows/ci.yml)

![Dashboard screenshot](docs/dashboard.png)

## Why this project

Shops don't lose money in code — they lose it between stages: a job waiting two days on approval,
an order nobody pressed. ShopFloor models the smallest set of concepts that makes that visible:

- **Product** — what gets produced (a garment, a design)
- **Production Order** — a quantity of a product, for a customer, with a due date
- **Routing** — the ordered stages the job walks through, with start/finish timestamps

One endpoint — `POST /orders/{id}/advance` — drives the whole lifecycle: it starts the current
stage or finishes it and starts the next, completing the order at the end. State transitions are
guarded (no advancing finished orders, no cancelling completed ones) and covered by tests.

## Stack

| Layer    | Tech                                              |
|----------|---------------------------------------------------|
| Backend  | Python 3.12 · FastAPI · SQLAlchemy 2.0 · Pydantic |
| Database | PostgreSQL 16 (SQLite in-memory for tests)        |
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS 4     |
| Infra    | Docker Compose                                    |

## Run it

```bash
docker compose up --build
```

Then seed demo data and open the app:

```bash
docker compose exec backend python -m app.seed
```

- Frontend: http://localhost:5173
- API docs (Swagger): http://localhost:8000/docs

### Local development (without Docker)

```bash
# Backend — needs a local PostgreSQL, or set DATABASE_URL
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

### Tests

```bash
cd backend
pytest
```

## API at a glance

| Method | Path                      | Purpose                                  |
|--------|---------------------------|------------------------------------------|
| GET    | `/api/dashboard`          | KPIs, WIP per stage, recent orders       |
| GET    | `/api/products`           | List products                            |
| POST   | `/api/products`           | Create product (unique SKU)              |
| GET    | `/api/orders`             | List orders (filter by `status`, paged)  |
| GET    | `/api/orders/at-risk`     | Open orders overdue or due soon (`within_hours`) |
| GET    | `/api/orders/export.csv`  | Download orders as CSV (honors `status`) |
| POST   | `/api/orders`             | Create order with default/custom routing |
| POST   | `/api/orders/{id}/advance`| Start/finish stages, complete the order  |
| POST   | `/api/orders/{id}/cancel` | Cancel (unless already completed)        |

## About me

I'm Daniel Bichof — full-stack developer with 10 years building ERP systems for textile and
chemical manufacturers in Brazil. The production system this project is inspired by issues
20,000+ electronic invoices a year and tracks 250,000+ dyeing batches.

[LinkedIn](https://www.linkedin.com/in/danbichof) · daniel@websys.ind.br

## License

MIT
