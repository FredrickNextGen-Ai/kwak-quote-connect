# KWAK Auto Spare: Catalogue, Quotation & Manager Platform

A spare-parts catalogue and quotation system for **KWAK Auto Spare**, a car spare parts business on Kirinyaga Road, Nairobi. Customers browse parts and send one quotation request instead of going back and forth on WhatsApp. The manager reviews requests in an admin dashboard and gets live alerts and PDF quotations through a Telegram bot.

**Live site:** https://kwak-quote-connect.vercel.app

<!-- Add 2-3 screenshots: storefront (mobile), quote basket, admin dashboard. Use demo data only. -->
![Storefront](docs/screenshots/storefront.png)
![Admin dashboard](docs/screenshots/admin-dashboard.png)

## The problem

Most customers arrive from WhatsApp, Facebook, or TikTok on their phones. Parts are priced per request, so there is no checkout. This platform turns that conversation into a structured flow:

**Browse parts, then add to quote, then submit vehicle and contact details, then receive a reference number (e.g. `Q-2026-0001`).** The manager is notified immediately, prices the request, and replies with a professional PDF quotation.

## Features

**Customer storefront**
- Searchable, filterable parts catalogue (category, make, model, year, condition, availability, price)
- Part detail pages with vehicle compatibility
- Quote basket with quantity editing, kept across pages
- Quotation submission with a database-generated reference number and confirmation screen
- WhatsApp links with the part name pre-filled; configurable number
- Light and dark mode, mobile-first layout, skeleton loaders, empty and error states

**Admin portal** (authenticated, role-protected)
- Dashboard with quotation stats and recent activity
- Product management: create, edit, delete, availability, images, categories
- Quotation management: status workflow (Pending, Reviewing, Quoted, Completed, Cancelled), admin notes, discounts
- Customer records
- Analytics, reports, forecasting, and alerts views

**Telegram manager bot** (Python)
- Live notification whenever a new quotation arrives
- `/summary` and `/quotations` with period and status filters
- Generates and sends PDF quotations and reports (ReportLab)

## Architecture

```
Customer / Admin browser
        |
        v
TanStack Start + React (Vercel)  ----->  Supabase
  storefront + admin portal              Postgres, Auth, RLS
                                           ^
                                           |
Python service (Telegram bot, analytics, ReportLab PDFs)
```

| Layer | Tech |
|---|---|
| Frontend | React 19, TanStack Start / Router / Query, TypeScript, Vite, Tailwind CSS 4, Framer Motion, Recharts, shadcn/ui |
| Data and auth | Supabase (Postgres, Row Level Security, Supabase Auth) |
| Backend | Python 3.12: Telegram bot, analytics, ReportLab PDF generation |
| Hosting | Vercel (frontend) |

## Data model

`categories` and `products` (public read) | `customers`, `quotations`, `quotation_items` (managers only) | `user_roles` (`admin`, `staff`)

Quotations are created through a database function, `submit_quotation`, so the public site never needs read or write access to customer tables.

## Security design

- **Row Level Security on every table.** Anonymous visitors can read products and categories and nothing else.
- **Public submissions go through a `SECURITY DEFINER` function** that validates and length-limits input, caps item count and quantity, and takes prices from the products table instead of the browser.
- **Role checks happen in the database** (`has_role`, `is_manager`). Route guards in the UI are for convenience, not protection.
- **No secrets in the repository.** The browser only ever receives the public Supabase publishable key. The service-role key and Telegram token are server-side environment variables.

## Getting started

### 1. Database

Create a Supabase project and apply the SQL in `supabase/migrations/`. Then create your admin user in Supabase Auth and grant the role:

```sql
insert into public.user_roles (user_id, role)
values ('<your-auth-user-uuid>', 'admin');
```

### 2. Frontend

```sh
npm install
cp .env.example .env   # fill in your values
npm run dev
```

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public (publishable) key |
| `VITE_SUPABASE_PROJECT_ID` | Project reference |
| `VITE_WHATSAPP_NUMBER` | Number for WhatsApp links, digits only |
| `VITE_CONTACT_PHONE`, `VITE_CONTACT_EMAIL`, `VITE_CONTACT_ADDRESS`, `VITE_CONTACT_HOURS` | Optional contact overrides |

### 3. Python service

```sh
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # fill in your values
python -m app.telegram_bot
```

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side only. Never expose in the frontend |
| `TELEGRAM_BOT_TOKEN` | From BotFather |
| `TELEGRAM_CHAT_ID` | The manager's chat; the bot only responds to this chat |

## Project structure

```
src/
  routes/            File-based routes: storefront, /quote, /auth, /_authenticated/admin.*
  components/        site/ (storefront) and ui/ (shadcn)
  lib/               catalog, quote store, admin queries, site config
  integrations/      Supabase clients
supabase/migrations/ Schema, RLS policies, SQL functions
backend/app/         Telegram bot, analytics, PDF reports
```

## Roadmap

- Authenticated HTTP endpoint for PDF generation, so quotations can also be downloaded from the admin portal
- Automated tests for quotation submission and PDF totals
- Rate limiting and spam protection on public quote submissions
- Email or WhatsApp delivery of the finished quotation


