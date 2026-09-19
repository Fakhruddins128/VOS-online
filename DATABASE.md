# DATABASE.md — VOS Online

## Database engine
Microsoft SQL Server via Node package `mssql`.

Connection configuration is read from environment variables:
- `DB_SERVER`
- `DB_DATABASE`
- `DB_USER`
- `DB_PASSWORD`
- `DB_PORT`
- `DB_ENCRYPT`
- `DB_TRUST_SERVER_CERTIFICATE`

Never document actual values.

## Connection wrapper
`backend/config/database.js`:
- uses a shared `mssql` connection pool
- max pool size 10
- min pool size 0
- idle timeout 30 seconds
- provides `connect()`, `disconnect()`, `query()`, and `testConnection()`

## Vendor table confirmed in local schema
`backend/sql/schema.sql` defines:
- `ID INT IDENTITY PRIMARY KEY`
- `BusinessEmail NVARCHAR(100) UNIQUE NOT NULL`
- `Password NVARCHAR(255) NOT NULL`
- `Salt NVARCHAR(255) NULL`
- `CompanyName NVARCHAR(100)`
- `Ref_Name NVARCHAR(100)`
- `BusinessPhone NVARCHAR(20)`
- `Address NVARCHAR(500)`
- `Since DATETIME2 DEFAULT GETDATE()`
- `updated_at DATETIME2 DEFAULT GETDATE()`
- `Is_Active BIT DEFAULT 1`

Important: the local schema is a minimal portal schema, not the complete production database.

## Production/reporting tables referenced by current SQL
Pending Orders and Purchase Order Draft queries reference many existing tables, including:
- Vendor
- FinishProductOrderMaster
- FinishProductOrderDetail
- FinishProductVariantDetail
- ItemMaster
- ItemType
- FP_MaterialMaster
- FP_ColorMaster
- Finish
- ApprovedVendorFinishProduct
- Unit
- Category2
- Category3
- FinishProductOrderDetail_Prep
- FinishProductPOReturn_Detail
- MaterialVariantDetail
- ApprovedVendorMaterial
- MaterialOrderMaster
- MaterialOrderDetail
- PrepVariantDetail
- ApprovedVendorPrep
- PrepOrderMaster
- PrepOrderDetail
- AccessoriesVariantDetail
- ApprovedVendorAccessories
- AccessoriesOrderMaster
- AccessoriesOrderDetail
- PackagingVariantDetail
- ApprovedVendorPackaging
- PackagingOrderMaster
- PackagingOrderDetail

These table relationships should be treated as confirmed only to the extent they are explicitly used in the current SQL. Do not infer a complete ERD from these queries.

## Important business-calculation fields in Pending Orders
Current SQL calculates/returns (Finish Product has the full set; non-Finish-Product categories omit the columns their order-detail tables do not have):
- Order
- Received
- QC
- Reject
- Pending
- Stock (only where the table provides it: Accessories/Packaging `T_Stock`, Material `InHand`, Preps none)
- Delivery Date (Finish Product only; `NULL` otherwise)
- Final Delivery Date (Finish Product only; `NULL` otherwise)
- Closing Days (Finish Product only; `NULL` otherwise)
- PR Status
- isCost
- Price
- LastReceive
- L_Receive
- AutoClosedPenaltyQty (Finish Product only; `NULL` otherwise)

Current Pending calculation:
- Finish Product: `OrderQty - RcvdQty - AutoClosedPenaltyQty`
- Non-Finish-Product categories: `OrderQty - RcvdQty`

Orders with positive Pending are included. A second result set includes rows where this remaining quantity is zero and `InQCQty > 0`.

## Database safety rules
- Never execute destructive SQL without approval.
- Use parameterized queries.
- For schema changes, create a migration/update SQL script.
- Back up before production schema/data changes.
- Never store real credentials in documentation.
