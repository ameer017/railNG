# RailNG

Nigeria-focused train ticketing: passenger booking plus an operator console. Lagos–Ibadan and Abuja–Kaduna are seeded with NGN fares and WAT times. Payments are mocked for now.

## Setup

```bash
cd railng
npm install
cp .env.example .env
npm run db:setup
npm run dev
```

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
