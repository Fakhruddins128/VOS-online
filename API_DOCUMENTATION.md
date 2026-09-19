# API_DOCUMENTATION.md — VOS Online

## Base URL
Development default:
`http://localhost:5000`

API prefix:
`/api`

Production URL is environment-dependent. Do not hard-code production secrets or credentials in this document.

## Backend endpoints confirmed from current source

### GET /
Returns:
```json
{"message":"VOS Backend API is running!"}
```

### GET /health
Returns HTTP 200 with status and timestamp.

### POST /api/users/login
Purpose: vendor login.

Expected body:
```json
{
  "BusinessEmail": "vendor@example.com",
  "password": "..."
}
```

Behavior:
- Finds `Vendor` by `BusinessEmail`.
- Checks active status.
- Uses salted PBKDF2 when `Salt` exists.
- Falls back to legacy plaintext comparison when no salt exists.
- Removes password/salt from returned vendor object.
- Maps database fields to frontend names including `VendorName`, `ContactPerson`, `PhoneNumber`, `Address`, and `created_at`.

### GET /api/users/vendors
Returns vendor email/company/active status. The route is explicitly marked as a debugging-oriented endpoint in source. Review security before exposing this in production.

### POST /api/users/change-password
Expected body:
```json
{
  "BusinessEmail": "...",
  "oldPassword": "...",
  "newPassword": "..."
}
```

New password policy:
- at least 8 characters
- uppercase
- lowercase
- number
- special character from the implemented policy

The endpoint verifies the old password, creates a new salt, hashes with PBKDF2, and updates `Vendor`.

### POST /api/users/forgot-password
Expected body:
```json
{
  "BusinessEmail": "..."
}
```

Behavior:
- Finds active vendor.
- Generates a temporary password.
- Stores salted PBKDF2 hash.
- Sends temporary password using Nodemailer.
- Returns success only if the email send succeeds.

### GET /api/pending-orders
Required query parameter:
- `vendorId`

Optional query parameters:
- `page` default 1
- `limit` default 10
- `sortBy` default `OrderNo`
- `sortOrder` default `DESC`

Supported sort keys:
- `OrderNo`
- `Date`
- `ItemCode`
- `Vendor`
- `Order`
- `Pending`
- `DeliveryDate`
- `ClosingDays`

Returns:
- `data`
- `pagination`
- `sorting`

The SQL combines two result sets:
1. orders with remaining pending quantity
2. orders whose remaining quantity is zero but QC quantity is still greater than zero

### GET /api/purchase-order-draft
Required query:
- `vendorId`
- `category` defaults to `Material`

Supported categories:
- `Material`
- `Preps`
- `Accessories`
- `Packaging`
- `Finish Product`

Returns:
```json
{
  "success": true,
  "data": [],
  "category": "Material",
  "count": 0
}
```

### GET /api/purchase-orders
Purpose: purchase orders (non-draft) per category. Mirrors `purchase-order-draft` but returns orders where `OrderStat != 'Draft'`.

Required query:
- `vendorId`
- `category` defaults to `Finish Product`

Supported categories:
- `Material`
- `Preps`
- `Accessories`
- `Packaging`
- `Finish Product`

Returns:
```json
{
  "success": true,
  "data": [],
  "category": "Finish Product",
  "count": 0
}
```

## Frontend API helper mismatch
`frontend/src/services/api.js` also defines:
- `/users`
- `/users/:id`
- `/products`
- `/products/:id`
- `/products/categories`

These routes are NOT currently mounted in `backend/server.js` and are therefore not confirmed as implemented backend APIs. Treat them as legacy/planned/unused helpers until verified.

## API change rule
Before changing an API:
1. Inspect all frontend callers.
2. Inspect the backend route.
3. Check deployment/environment assumptions.
4. Preserve existing response fields unless the change is explicitly approved.
5. Update this file and `CHANGELOG.md`.
