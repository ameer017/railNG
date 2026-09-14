# RailNG

Nigeria-focused train ticketing: passenger booking plus an operator console. Lagos–Ibadan and Abuja–Kaduna are seeded with NGN fares and WAT times. Payments are mocked for now.

## Setup

```bash
cd railng
npm install
cp .env.example .env
docker compose up -d
npm run db:setup
npm run dev
```

Local Postgres is `postgresql://railng:railng@localhost:5432/railng`. SQLite will not work on Netlify.

Open [http://localhost:3000](http://localhost:3000).

## Seed logins

| Role | Email | Password |
| --- | --- | --- |
| Operator | `admin@railng.ng` | `RailNG!admin` |
| Passenger | `amina@railng.ng` | `passenger123` |

## What is included

- Search trips by station and date (Africa/Lagos)
- Book Economy / Business / First Class with passenger names
- 15-minute seat holds, then mock checkout
- Ticket page with booking reference, coach/seat, and QR
- Admin: stations, trains, trips, fares, bookings, occupancy

## Payments

Checkout calls `paymentProvider.charge()` in `src/lib/payments.ts`. v1 uses `MockPaymentProvider`.

## Deploy on Netlify

1. Create a free [Neon](https://neon.tech) Postgres database. Copy the connection string (`sslmode=require`).
2. Import [ameer017/railNG](https://github.com/ameer017/railNG) in Netlify. Framework detection should set **Build command** `npm run build` and **Publish directory** `.next` (also in `netlify.toml`).
3. Site settings → Environment variables:

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Neon connection string |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `https://<your-site>.netlify.app` |

4. Trigger a deploy. The build runs `prisma generate` and `prisma db push` (schema only, no seed wipe).
5. Seed once from your machine (this recreates the demo operator/passenger and timetable):

```bash
DATABASE_URL="postgresql://..." npm run db:seed
```

Then log in with `admin@railng.ng` / `RailNG!admin` or `amina@railng.ng` / `passenger123`.
 
