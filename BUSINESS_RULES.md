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
The page is vendor-specific and now supports all five categories: `Material`, `Preps`, `Accessories`, `Packaging`, `Finish Product` (default `Finish Product`).
Current SQL excludes:
- Draft order masters
- Force Closed details
- Auto Closed details

Primary pending condition (Finish Product):
`OrderQty - RcvdQty - AutoClosedPenaltyQty > 0`

Additional QC-related rows (Finish Product):
`OrderQty - RcvdQty - AutoClosedPenaltyQty = 0` AND `InQCQty > 0`

For non-Finish-Product categories (`Material`, `Preps`, `Accessories`, `Packaging`):
- The same two conditions apply but without the penalty term: pending = `OrderQty - RcvdQty`, rows included when `pending > 0` or (`pending = 0` AND `InQCQty > 0`).
- Delivery date / final date / closing days do not exist on these order detail tables, so those columns return `NULL`.
- Price is derived as `FOBPrice × ExRate × remaining qty` (`FOBPrice`/`ExRate` are stored as `nvarchar` and read with `TRY_CAST`).
- Stock is shown only where available: `AccessoriesVariantDetail`/`PackagingVariantDetail`.`T_Stock`; Material uses `ApprovedVendorMaterial`.`InHand`; Preps has no stock column.
- Accessories tables are plural in the live schema: `AccessoriesOrderDetail`, `AccessoriesVariantDetail`, `ApprovedVendorAccessories`.

Pending Orders supports:
- pagination
- sorting
- category selection (resets search and pagination)
- refresh
- print (includes the selected category)
- product image viewing when image path + picture are available

Dashboard pending-order cards show totals grouped by `Category` (`C2.Description`) from `GET /api/pending-orders/counts`.
The dashboard **Purchase Orders** card shows only the pending order count per order category (`Material`, `Preps`, `Accessories`, `Packaging`, `Finish Product`), taken from `GET /api/pending-orders` `pagination.totalRecords` for each category.

## Purchase Order Draft rules
Draft page supports exactly these categories:
- Material
- Preps
- Accessories
- Packaging
- Finish Product

The backend returns only orders where `OrderStat='Draft'` and `FK_VendorID=@vendorId`.

Each category uses its own variant/order tables and constructs an item code/description appropriate to that category.

## Purchase Orders rules
The Purchase Orders page provides the same category filter as Purchase Order Draft but returns orders where `OrderStat!='Draft'` and `FK_VendorID=@vendorId`.

Default selected category for both Purchase Orders and Purchase Order Draft is `Finish Product`.

## UI behavior
- Login, root, and forgot-password hide the sidebar.
- Other routes display the sidebar.
- Unknown frontend routes redirect to `/login`.
- Pending Orders and Purchase Order Draft provide image modals.
- Pending Orders prints the current sorted/paginated data.
- Purchase Order Draft prints the current category data.

## Rules requiring review
The current system does not appear to use a server-issued session/JWT token. The frontend has token-interceptor code, but the current login route does not return a token. Do not assume bearer authentication exists.
