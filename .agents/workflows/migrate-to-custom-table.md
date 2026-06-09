---
name: migrate-to-custom-table
description: Refactor a list-view module to replace ResponsiveDataView (Card layout) with CustomTable (Table layout on all screens).
---

# Migrate to CustomTable Only

This workflow guides the agent to refactor a module's list-view to exclusively use `CustomTable` and remove `ResponsiveDataView` (Card layouts on mobile).

## Prerequisites
- Target module path (e.g., `modules/customers/features/list-view`)

## Steps

### 1. Update the Main Table File (`[module]-table.tsx`)
- Open the target module's `-table.tsx` file.
- Remove the import for `ResponsiveDataView`.
- Remove the `<ResponsiveDataView />` component and its `renderCard` prop entirely.
- Replace it with a pure `<CustomTable />` component.
- Ensure the table is wrapped in a `<div className="w-full">` (do not use `overflow-x-auto` on the wrapper, as `CustomTable` handles its own scrolling).
- Remove any `className="w-full min-w-[700px]"` from the `CustomTable` props so it stays responsive.

### 2. Update the Main List View File (`[module]-list-view.tsx`)
- Find the outermost `<section>` or wrapper tag.
- Add `pb-24 md:pb-8` to its `className` to prevent mobile browser navigation bars from overlapping the pagination at the bottom.

### 3. Delete the Card Component File
- Identify the `<[Module]Cards />` or `<[Module]Card />` file (e.g., `customers-cards.tsx`).
- Use terminal commands or `replace_file_content` to safely remove or exclude this file.
- Update the module's `index.ts` to remove exports of the deleted card component.
- Update the module's `README.md` to remove references to the card file.

### 4. Update the Columns definition (`use-[module]-columns.tsx`)
- Open the `-columns.tsx` file.
- Review column widths (`minWidth`, `width`, `maxWidth`). Ensure they are adequate so headers don't truncate awkwardly.
- If headers use `headerAlign: "center"`, ensure the padding is sufficient so the sort icon doesn't overlap.
- Add `whitespace-nowrap` to cells that shouldn't break (e.g., Prices, Dates, Status).
- Enhance typography (e.g., `text-[14px]` instead of `text-sm`, `text-xs` for secondary info).

### 4. Verify Pagination
- Verify that `pagination` is correctly passed to `CustomTable`.
- The pagination should automatically use the updated `DefaultPagination` which is responsive.

## Completion
- Let the user know the migration is complete and ask them to test the mobile view.
