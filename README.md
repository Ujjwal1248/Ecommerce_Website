# Ecommerce Website

Node.js and Express ecommerce application using MongoDB, Passport, EJS, and Stripe.

## Local setup

```sh
npm install
cp .env.example .env
npm start
```

Set `MONGODB_URI` to a MongoDB Atlas connection string. Set `SESSION_SECRET` to a long random value. Stripe variables are optional until payment features are needed.

## Render deployment

1. Push this repository to GitHub.
2. Create a new Blueprint in Render and select this repository.
3. Add `MONGODB_URI` to the generated service.
4. Optionally add `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY`.
5. Deploy. Render will use `/healthz` for health checks.
