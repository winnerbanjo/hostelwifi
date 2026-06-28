# Jendor The Plug Hostel Voucher Platform

Clean Next.js MVP for selling hostel internet vouchers for **Jendor The Plug 🔌**.

## What is included

- Public hostel selection, plan browsing, checkout, Paystack flow, bank-transfer pending flow, voucher checker, support form, and policy pages.
- Admin login and dashboard for metrics, hostels, plans, orders, vouchers, bank-transfer approval/rejection, support tickets, reports, customers, and editable policies.
- PostgreSQL + Prisma models for admin users, hostels, plans, orders, vouchers, payment logs, support tickets, customers, policies, and audit logs.
- Modular network integration layer in `src/lib/network-provider.ts`.
- MVP `InternalVoucherProvider` that generates unique `JTP-XXXX-XXXX` codes and stores them in the database.
- Placeholder provider classes for future MikroTik/RADIUS/UniFi style integration.
- Modular delivery providers in `src/lib/delivery.ts`; email is implemented through Resend, SMS and WhatsApp are ready to connect later.

## Setup

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Set at least:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/jendor_vouchers?schema=public"
ADMIN_SESSION_SECRET="use-a-long-random-secret"
ADMIN_BOOTSTRAP_EMAIL="admin@jendortheplug.com"
ADMIN_BOOTSTRAP_PASSWORD="change-this-password"
```

3. Optional live integrations:

```bash
PAYSTACK_SECRET_KEY="sk_live_or_test_key"
RESEND_API_KEY="re_..."
EMAIL_FROM="Jendor The Plug <support@yourdomain.com>"
APP_URL="https://your-domain.com"
```

If `PAYSTACK_SECRET_KEY` is empty, the app uses a demo redirect for local testing. Do not use demo mode in production.

4. Install, migrate, seed, and run:

```bash
npm install
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

5. Open:

```text
http://localhost:3000
http://localhost:3000/admin/login
```

## Important network note

This MVP generates and stores vouchers inside the web app only. It does not automatically provision a live router or hotspot user yet. Future integration should replace or extend `InternalVoucherProvider` with a real implementation for MikroTik Hotspot, MikroTik User Manager, FreeRADIUS, UniFi, or another provider.

## Verification

The project currently passes:

```bash
npm run build
```
