## Ecommerce Verina Backend

Simple Express + MongoDB (Mongoose) backend for an ecommerce MEAN project. It uses email/password authentication with JWT Bearer tokens and provides user, product, and cart APIs.

### Setup

- Install dependencies:

```bash
npm install
```

- Create a `.env` file based on `.env.example` and set:
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `JWT_EXPIRES_IN` (optional)
  - `PORT` (optional)

### Run

- Development:

```bash
npm run dev
```

- Production:

```bash
npm start
```

The API will be available at `http://localhost:5000` by default.

