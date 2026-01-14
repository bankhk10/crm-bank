# 🔧 Import Path Migration Script
# Run this in PowerShell from the crm-bank directory

Write-Host "Starting import path migration..." -ForegroundColor Cyan

# Files to update (from @/lib/db to @/src/infrastructure/database)
$dbFiles = @(
    "app/api/products/route.ts",
    "app/api/products/[productId]/route.ts",
    "app/api/products/[productId]/images/route.ts",
    "app/api/products/[productId]/manage/route.ts",
    "app/api/products/brands/route.ts",
    "app/api/products/product-groups/route.ts",
    "app/api/customers/route.ts",
    "app/api/customers/[customerId]/route.ts",
    "app/api/customers/[customerId]/images/route.ts",
    "app/api/customers/next-code/route.ts",
    "app/api/employee/route.ts",
    "app/api/employee/[employeeId]/route.ts",
    "app/api/companies/route.ts",
    "app/api/companies/[companyId]/route.ts",
    "app/api/credit-limits/route.ts",
    "app/api/credit-limits/[creditLimitId]/route.ts",
    "app/api/temporary-credit-limits/route.ts",
    "app/api/temporary-credit-limits/[temporaryCreditLimitId]/route.ts",
    "app/api/temporary-credit-limits/[temporaryCreditLimitId]/approve/route.ts",
    "app/api/temporary-credit-limits/expire/route.ts",
    "app/api/rbac/roles/route.ts",
    "app/api/rbac/roles/[roleId]/route.ts",
    "app/api/rbac/roles/[roleId]/permissions/route.ts",
    "app/api/rbac/permissions/route.ts",
    "app/api/rbac/permissions/[permissionId]/route.ts",
    "app/api/rbac/departments/route.ts",
    "app/api/rbac/departments/[departmentId]/route.ts",
    "app/api/rbac/positions/route.ts",
    "app/api/rbac/positions/[positionId]/route.ts",
    "app/api/rbac/users/[userId]/roles/route.ts",
    "app/api/rbac/users/[userId]/overrides/route.ts",
    "app/api/rbac/summary/route.ts",
    "app/api/rbac/catalog/route.ts",
    "app/api/rbac/employees/create-with-user/route.ts",
    "app/(main)/rbac/[roleId]/page.tsx",
    "app/actions/dashboard.ts",
    "app/actions/logs.ts",
    "app/actions/sales-report.ts",
    "lib/logger/app-logger.ts",
    "lib/logger/audit-logger.ts",
    "lib/logger/security-logger.ts",
    "lib/sales-summary-service.ts",
    "lib/services/temporary-credit-expiry.service.ts",
    "lib/random-fill/sale.ts",
    "scripts/sync-sales-summary.ts"
)

# Update @/lib/db to @/src/infrastructure/database
foreach ($file in $dbFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content -match '@/lib/db') {
            $content = $content -replace 'from "@/lib/db"', 'from "@/src/infrastructure/database"'
            Set-Content $file $content -NoNewline
            Write-Host "✅ Updated: $file (db)" -ForegroundColor Green
        }
    }
}

# Files to update (from @/lib/rbac to @/src/core/rbac)
$rbacFiles = @(
    "app/api/products/[productId]/route.ts",
    "app/api/products/[productId]/images/route.ts",
    "app/api/products/[productId]/manage/route.ts",
    "app/api/products/brands/route.ts",
    "app/api/products/product-groups/route.ts",
    "app/api/customers/[customerId]/route.ts",
    "app/api/customers/next-code/route.ts",
    "app/api/employee/[employeeId]/route.ts",
    "app/api/companies/[companyId]/route.ts",
    "app/api/credit-limits/[creditLimitId]/route.ts",
    "app/api/temporary-credit-limits/[temporaryCreditLimitId]/route.ts",
    "app/api/temporary-credit-limits/[temporaryCreditLimitId]/approve/route.ts",
    "app/api/temporary-credit-limits/expire/route.ts",
    "app/api/temporary-credit-limits/expire/trigger/route.ts",
    "app/api/random-fill/images/route.ts",
    "app/(main)/rbac/[roleId]/page.tsx",
    "app/(main)/rbac/page.tsx",
    "app/(main)/layout.tsx",
    "app/(auth)/login/page.tsx",
    "components/features/layout/sidebar.tsx",
    "proxy.ts"
)

# Update @/lib/rbac to @/src/core/rbac
foreach ($file in $rbacFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content -match '@/lib/rbac') {
            $content = $content -replace 'from "@/lib/rbac"', 'from "@/src/core/rbac"'
            Set-Content $file $content -NoNewline
            Write-Host "✅ Updated: $file (rbac)" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "Migration complete!" -ForegroundColor Cyan
Write-Host "Please run 'pnpm tsc --noEmit' to verify no TypeScript errors." -ForegroundColor Yellow
