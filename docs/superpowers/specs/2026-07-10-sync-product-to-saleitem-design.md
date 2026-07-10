# Design Spec: Sync Product Information to SaleItem

We need to propagate the updated product details from the `Product` table to the `SaleItem` table (which acts as a snapshot). However, we must preserve all price/financial fields and only update other metadata fields as specified by the user.

## Objectives
- Update the following snapshot fields in `SaleItem` from the corresponding `Product` data:
  - `brand`
  - `commonName`
  - `name`
  - `productABCTypeId`
  - `tradeNameGroupId`
  - `categoryId`
  - `categoryName` (derived from `ProductCategory.description` of the `Product`'s category)
  - `productABCTypeName` (derived from `ProductABCTypes.name` of the `Product`'s productABCType)
  - `productGroupId`
  - `productGroupName` (derived from `ProductGroup.name` of the `Product`'s productGroup)
- Do **NOT** update the following fields in `SaleItem`:
  - Prices/totals: `price`, `cartonPrice`, `promotionBudget`, `unitPrice`, `originalPrice`, `totalPrice`, `priceModified`
  - Quantities/metadata: `saleId`, `productId`, `quantity`, `stockAtSale`, `createdAt`, `updatedAt`, `pointPerUnit`, `productCode`, `unit`, `packageSizeUnit`, `packageSize`, `packageSizePerBox`, `totalPackageSizePerBox`
- Filter the update scope:
  - Parent `Sale` must NOT be soft-deleted (`deletedAt: null`).
  - Parent `Sale` must have a `saleDate` within the current year (2026).

## Proposed Architecture
We will implement a standalone migration script: `scripts/sync-product-to-saleitem.ts`.

### Script Capabilities
1. **Dry-Run Support**:
   - Running with `--dry-run` logs the count of items that would be updated and shows sample records before making DB writes.
   - Running without `--dry-run` performs actual writes.
2. **Date Filtering**:
   - Filter `Sale` documents where `saleDate` is between `2026-01-01T00:00:00.000Z` and `2026-12-31T23:59:59.999Z`.
3. **Transaction Batching**:
   - Perform updates sequentially or in batches (e.g. 100 items per transaction) to prevent database locks and memory overflow.
4. **Data Verification**:
   - Ensure the related `Product` (and its nested relations like `category`, `productGroup`, `productABCType`, `tradeNameGroup`) are retrieved.

## Detailed Plan
1. Retrieve all `SaleItem` entries fitting the criteria.
2. For each `SaleItem`, retrieve the matching `Product` and its associations.
3. Compute the update payload.
4. Perform the update and report logs.
