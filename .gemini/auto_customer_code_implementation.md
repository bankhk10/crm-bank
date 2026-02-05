# Auto-Generated Customer Codes Implementation

## Overview
Implemented automatic customer code generation system for FARMER and BROKER customer types. Customer codes are now auto-generated based on customer type and current date, and cannot be manually edited.

## Format
Customer codes follow this pattern: `{PREFIX}{YY}{MM}{NNN}`

- **PREFIX**: Customer type identifier
  - `F` = FARMER (เกษตรกร)
  - `B` = BROKER (นายหน้า)
  - `D` = DEALER (ตัวแทนจำหน่าย)
  - `S` = SUBDEALER (ตัวแทนจำหน่ายย่อย)

- **YY**: Last 2 digits of Buddhist year (e.g., `69` for 2569)
- **MM**: Month (01-12)
- **NNN**: Running number (001-999)

### Examples
- **FARMER** on 05/02/2569: `F6902001`
- **BROKER** on 05/02/2569: `B6902001`
- **FARMER** on 15/02/2569: `F6902002` (second farmer in February 2569)

## Implementation Details

### 1. API Endpoint: `/api/customers/generate-code`
**File**: `app/api/customers/generate-code/route.ts`

- **Method**: GET
- **Query Parameter**: `type` (DEALER, SUBDEALER, FARMER, or BROKER)
- **Response**: `{ customerCode: "F6902001" }`

Features:
- Generates code based on current Thailand timezone
- Converts to Buddhist year automatically
- Finds the highest existing code for the current month
- Increments running number sequentially
- Returns error if maximum codes (9999) reached for the month

### 2. Updated Customer Creation API
**File**: `app/api/customers/route.ts`

Changes:
- Made `customerCode` optional in validation schema
- Added auto-generation logic if `customerCode` is not provided
- Uses same generation algorithm as the dedicated endpoint
- Ensures backward compatibility (still accepts manual codes if provided)

### 3. Updated FARMER Form
**File**: `features/customers/_components/forms/customer-form-farmer.tsx`

Changes:
- Auto-generates customer code on component mount for new customers
- Customer code field is now **read-only** (disabled)
- Shows "กำลังสร้างรหัส..." while generating
- Removed manual validation for customerCode
- Removed duplicate code checking (no longer needed)

### 4. Updated BROKER Form
**File**: `features/customers/_components/forms/customer-form-broker.tsx`

Changes:
- Same changes as FARMER form
- Auto-generates with `type=BROKER` parameter

## User Experience

### Creating New Customer
1. User navigates to create FARMER or BROKER customer
2. Customer code field shows "กำลังสร้างรหัส..." briefly
3. Auto-generated code appears (e.g., `F6902001`)
4. Field is disabled - user cannot edit
5. User fills in other required fields and saves

### Editing Existing Customer
- Customer code field shows existing code
- Field remains disabled (read-only)
- Code cannot be changed

## Technical Notes

### Date Handling
- Uses Thailand timezone (`Asia/Bangkok`)
- Converts to Buddhist year by adding 543 years
- Example: 2026 CE → 2569 BE → `69`

### Running Number Logic
- Resets to 0001 each month
- Searches for highest existing code with same prefix+year+month
- Increments by 1
- Maximum 9999 customers per type per month

### Error Handling
- Returns 400 if invalid customer type
- Returns 400 if maximum codes reached (9999)
- Returns 500 for database errors
- Frontend shows error message if generation fails

## Testing Recommendations

1. **Test Code Generation**
   - Create multiple FARMER customers in same month
   - Verify running numbers increment correctly (F6902001, F6902002, etc.)
   - Create BROKER customer and verify different prefix (B6902001)

2. **Test Month Rollover**
   - Change system date to next month
   - Verify running number resets to 0001

3. **Test Year Rollover**
   - Change system date to next year
   - Verify Buddhist year updates correctly

4. **Test Edit Mode**
   - Edit existing customer
   - Verify code field is disabled and shows existing code

## Future Enhancements

If needed for DEALER and SUBDEALER types:
1. Update their forms similarly to FARMER/BROKER
2. They will automatically use the same generation logic
3. Prefixes `D` and `S` are already configured

## Database Impact

- No schema changes required
- `customerCode` field remains unique constraint
- Auto-generated codes follow same format as manual codes
- Backward compatible with existing data
