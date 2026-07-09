# ShopFloor — Product Brief

> **See every job on your floor and catch the late ones before your customer does — without a whiteboard.**

**ShopFloor** is production tracking **for print & embroidery shops**. It replaces the
whiteboard, the paper work-order tickets, and the "where's that order?" Google Sheet with one
live view of every job and its stage. Routing is configurable, so adjacent verticals (sign/CNC,
food production, light assembly) come later without a rebuild.

---

## Positioning

Small screen-printing and embroidery shops don't lose money in software — they lose it between
stages: a job waiting three days on approval, a rush order nobody pressed, a due date that
quietly slipped. ShopFloor makes that visible. The pitch, in one line:

> **Your whiteboard can't tell you a job's about to be late. ShopFloor can.**

Platform name: **ShopFloor**, positioned *for print & embroidery shops*.

---

## ICP (Ideal Customer Profile)

- **Who:** owner or production manager of a US screen-print / embroidery shop.
- **Size:** 2–20 employees, roughly **$300K–$3M** annual revenue.
- **Load:** 20–150 open jobs at any time.
- **Today's stack:** a whiteboard, paper work-order tickets, and a Google Sheet — nobody has a
  reliable answer to "which jobs are about to be late?"
- **Buyer:** the owner. Hands-on, allergic to bloated ERPs, buys tools that pay for themselves
  in one saved rush-shipping charge or one caught late order.

---

## Pricing

| Plan | Price | Limits & capabilities |
|------|-------|-----------------------|
| **Free** | $0 | 1 user, up to **15 active jobs**. Board + stage tracking. The "try it on real jobs" tier. |
| **Shop** | **$49/mo** | Up to **5 users**, unlimited jobs, dashboard KPIs (lead time, WIP, bottleneck), CSV export. |
| **Pro** | **$99/mo** | Unlimited users, **shop-floor operator role**, overdue alerts, multiple routings, customer job-status link. |

Anchored to value: a single caught late shipment or avoided rush fee covers a month.

---

## Differentiators

1. **vs. spreadsheets & whiteboards** — a whiteboard is a snapshot with no memory. ShopFloor
   computes **lead time and bottleneck detection automatically** from stage timestamps, and flags
   at-risk jobs before they're late. The board can't do math; ShopFloor does it for you.
2. **vs. Katana / Fishbowl** — those are **inventory/BOM-first** MRP tools built for parts and
   stock. A print shop's problem isn't raw-material netting, it's **flow**: which job is in which
   stage and what's about to slip. ShopFloor is **stage/flow-first**, so it fits how a shop
   actually thinks.
3. **vs. Printavo / big print ERPs** — radically **simpler and cheaper**, and **mobile-friendly
   for operators** who just tap "advance" as a job moves from press to dryer to QC. No quoting
   suite to configure, no per-seat enterprise pricing, no onboarding project.

---

## Brand Identity

**Palette**

| Token | Hex | Use |
|-------|-----|-----|
| Ink Black | `#141414` | Sidebar, primary text, avatars |
| Safety Orange | `#FF5A1F` | Primary actions, links, active nav, WIP bars |
| Signal Amber | `#F5A524` | In progress / at-risk |
| Alert Red | `#E5484D` | Overdue / cancelled |
| Go Green | `#30A46C` | Done / healthy |
| Paper | `#FAF9F6` | App background |
| Steel Gray | `#6B7280` | Secondary text, borders |

**Fonts:** Space Grotesk (headings & labels), Inter (body & tables).

**Tone:** plainspoken, confident, floor-savvy. Talks like a shop owner, not a SaaS deck.

**Logo concept:** a squared bracket `[ ]` enclosing three ascending bars (throughput climbing),
with the accent orange on the tallest bar.

**Sample headline:** *"Your whiteboard can't tell you a job's about to be late. ShopFloor can."*

---

## Roadmap to Sellable

The production engine (routing, stage timestamps, lead-time & bottleneck math, at-risk detection)
is done. What stands between it and a chargeable SaaS:

### P0 — Multi-tenant foundation (blocks any paid launch)
- **Auth** and an **Organization / User** model (multi-tenant).
- `org_id` on `Product` and `ProductionOrder`, with **every query scoped to the caller's org**.
- **Alembic** migrations (today the app calls `create_all` at startup — fine for demo, not for a
  product with real customer data).
- Real **frontend auth flows** (sign up, log in, session).

### P1 — Monetization & operations
- **Stripe billing** wired to the Free / Shop / Pro plans and their limits.
- **Owner vs. operator roles** (operator = the tap-to-advance shop-floor view).
- **Per-org configurable routing** — stages are hardcoded to a textile routing today
  (Weaving → Dyeing → Finishing → QC); print/embroidery shops need their own (e.g.
  Art → Burn Screens → Print → Cure → QC / Digitize → Hoop → Embroider → Trim → QC).
- **Overdue push alerts** (email/push) driven by the existing at-risk logic.
- **Pagination** across list endpoints (started — bounded `limit`/`offset` on orders & products).

### P2 — Stickiness & polish
- **Customer-facing job-status link** (share a read-only "where's my order" page).
- **Audit log** of stage transitions.
- **shadcn/ui migration** for a component system.

### Known tech debt (noted, not this session)
- **`_next_code` race:** order codes are generated with a `COUNT(*) + 1` read-then-write, which
  can collide under concurrent creates. Needs a real sequence / unique-constraint retry once
  multi-tenant lands. Deferred deliberately.
- Auth/multi-tenant itself is **P0 above**, not attempted this session.
