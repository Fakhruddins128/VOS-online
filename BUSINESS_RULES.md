# BUSINESS_RULES.md — VOS Online

## Vendor access
- Vendor login is based on `BusinessEmail` and password.
- Inactive vendors cannot log in.
- Vendor-specific order queries require a vendor ID and filter records to that vendor.
- Returned login data must not contain password or salt.

## Password rules
Change-password enforces:
- minimum 8 characters
- uppercase
- lowercase
- number
- special character
- new password must differ from old password

Forgot-password:
- generates a temporary password
- stores a salted PBKDF2 hash
- attempts to email the temporary password

## Pending Orders rules
The page is vendor-specific.
Current SQL excludes:
- Draft order masters
- Force Closed details
- Auto Closed details

Primary pending condition:
`OrderQty - RcvdQty - AutoClosedPenaltyQty > 0`

Additional QC-related rows:
`OrderQty - RcvdQty - AutoClosedPenaltyQty = 0` AND `InQCQty > 0`

Pending Orders supports:
- pagination
- sorting
- refresh
- print
- product image viewing when image path + picture are available

## Purchase Order Draft rules
Draft page supports exactly these categories:
- Material
- Preps
- Accessories
- Packaging
- Finish Product

The backend returns only orders where `OrderStat='Draft'` and `FK_VendorID=@vendorId`.

Each category uses its own variant/order tables and constructs an item code/description appropriate to that category.

## UI behavior
- Login, root, and forgot-password hide the sidebar.
- Other routes display the sidebar.
- Unknown frontend routes redirect to `/login`.
- Pending Orders and Purchase Order Draft provide image modals.
- Pending Orders prints the current sorted/paginated data.
- Purchase Order Draft prints the current category data.

## Rules requiring review
The current system does not appear to use a server-issued session/JWT token. The frontend has token-interceptor code, but the current login route does not return a token. Do not assume bearer authentication exists.
