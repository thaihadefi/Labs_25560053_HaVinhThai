# Lab 4 Homework – ShopAdmin Backend

REST API for the provided ShopAdmin Web UI: register/login with a role, JWT authentication,
bcrypt password hashing, avatar upload with Multer, and admin-only management of categories and products.

```
Homework/
├── backend/    Express 5 + MongoDB (Mongoose) API, port 4000
└── frontend/   Provided ShopAdmin UI (unchanged)
```

## Requirements

- Node.js 18 or newer
- MongoDB running locally (default `mongodb://127.0.0.1:27017`)

## Setup

```bash
cd backend
npm install
cp .env.example .env      # then set JWT_SECRET to a long random string
npm start                 # ShopAdmin API running at: http://localhost:4000/api/v1
```

A random secret can be generated with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4000` | API port (must match `frontend/config.js`) |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/shop_admin_lab4_db` | MongoDB connection string |
| `JWT_SECRET` | – (required) | Secret used to sign and verify tokens |
| `JWT_EXPIRES_IN` | `1d` | Token lifetime |
| `CORS_ORIGIN` | any origin | Optional comma-separated list of allowed UI origins |

Then open `frontend/index.html` with Live Server / Five Server. `frontend/config.js` already points to
`http://localhost:4000/api/v1`.

## Database design (MongoDB)

| Collection | Fields | Rules |
|---|---|---|
| `users` | `fullName`, `age`, `gender`, `email`, `passwordHash`, `avatarUrl`, `type` | `email` unique (stored lower-case); `type` is `normal` or `admin`; `passwordHash` is never returned |
| `categories` | `name` | `name` unique |
| `products` | `categoryId`, `name`, `quantity`, `price` | `categoryId` references `categories`; `quantity` and `price` ≥ 0 |

Every response exposes `id` instead of `_id`. A product's `categoryId` is returned populated as `{ id, name }`.

## API

All responses are JSON: `{ success, message?, data? }`. Errors are `{ success: false, message }`.

| Method | URL | Access | Notes |
|---|---|---|---|
| POST | `/api/v1/auth/register` | public | `{ fullName, age, gender, email, password, type }`; duplicate email → `409` |
| POST | `/api/v1/auth/login` | public | `{ email, password }` → `{ data: { token, user } }`; wrong credentials → `401` |
| GET | `/api/v1/auth/me` | logged in | Own profile |
| PUT | `/api/v1/users/me` | logged in | Updates `fullName`, `age`, `gender` only |
| POST | `/api/v1/users/me/avatar` | logged in | `multipart/form-data`, field `avatar`, JPG/PNG/WEBP ≤ 2 MB |
| GET | `/api/v1/categories` | logged in | |
| POST / PUT / DELETE | `/api/v1/categories[/:id]` | admin | Deleting a category that still has products → `409` |
| GET | `/api/v1/products?categoryId=` | logged in | Optional category filter |
| POST / PUT / DELETE | `/api/v1/products[/:id]` | admin | |

## Authentication and permissions

- Passwords are hashed with `bcryptjs` (10 salt rounds) and checked with `bcrypt.compare` at login.
- Login signs a JWT whose payload is `{ id, type }`; the client sends it as `Authorization: Bearer <token>`.
- No token, or an invalid/expired token → `401 Unauthorized`.
- A valid token from a `normal` user on a create/edit/delete route → `403 Forbidden`
  (`"Forbidden: only admin users can perform this action."`).
- The avatar route always updates the user from the token (`req.user.id`), so users can only change their own avatar.
  The previous avatar file is deleted when it is replaced. Files are served from `/uploads/avatars/...`.
