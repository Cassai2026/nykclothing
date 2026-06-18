# Nyk Clothing

Node.js + Express API with a static storefront, PostgreSQL schema, Prisma ORM, and Stripe checkout.

## What this repo contains

- `server.js` – API + static storefront host
- `storefront/` – Frontend HTML/CSS/JS storefront
- `routes/payments.js` – Stripe checkout session route
- `prisma/schema.prisma` – Prisma data model
- `init.sql` / `seed_products.sql` – database setup and seed data
- `tests/` – API tests with Jest + Supertest

## Quick start

1. Install dependencies:
   ```bash
   npm ci
   ```
2. Copy env template and set real values:
   ```bash
   cp .env.example .env
   ```
3. Start PostgreSQL (Docker):
   ```bash
   docker compose up -d db
   ```
4. Start the app:
   ```bash
   npm start
   ```

## Environment variables

Required for core behavior:

- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGINS`

Required for checkout route:

- `STRIPE_SECRET_KEY`
- `STRIPE_SUCCESS_URL`
- `STRIPE_CANCEL_URL`

## Scripts

- `npm start` – run the server
- `npm test` – run tests
- `npm run lint` – run ESLint

## API endpoints

- `GET /api/health`
- `GET /api/products?page=1&limit=20`
- `POST /api/payments/create-checkout-session`

Checkout payload example shape:

```json
{
  "items": [
    { "product_variant_id": 1, "quantity": 2 }
  ]
}
```

Prices are sourced server-side from the database and are not accepted from the client payload.
