# Admin Features Implementation Plan

## Overview
Implement missing admin features:
1. Mobile responsive admin sidebar
2. Bulk actions (select all, delete multiple, export CSV)
3. Advanced filtering (search, multi-select filters, date range)
4. Real-time notifications (SSE)
4. Export/Import CSV for ventures/variants

## Architecture

### Mobile Responsive Sidebar
- Add mobile drawer with hamburger menu
- Sheet component for mobile drawer
- Responsive breakpoints: hidden lg:flex (current) + mobile drawer

### Bulk Actions
- Checkbox column in tables
- Select all / deselect all
- Bulk delete with confirmation modal
- Export CSV with current filters

### Advanced Filtering
- Search input (debounced)
- Multi-select filters (category, status, etc.)
- Date range picker
- URL-synced filters (shareable URLs)

### Real-time Notifications (SSE)
- Server-Sent Events endpoint
- Notification bell in header
- Toast notifications
- Mark as read / mark all as read

### Export/Import CSV
- Export current filtered data
- Import with validation
- Progress indicator for large imports

## Implementation Order

### Phase 1: Foundation (Week 1)
1. Mobile responsive sidebar with drawer
2. Reusable DataTable component with:
   - Selection checkboxes
   - Sorting
   - Column visibility
2. Reusable FilterBar component

### Phase 2: Bulk Actions (Week 1-2)
1. Selection state management
2. Bulk delete API + confirmation modal
3. Export CSV with current filters

### Phase 3: Advanced Filtering (Week 2)
1. Search with debounce
2. Multi-select filters
3. Date range picker
5. URL sync

### Phase 3: Real-time Notifications (Week 2-3)
1. SSE endpoint
2. Notification context + provider
3. Notification bell + dropdown
5. Toast integration

### Phase 4: Export/Import (Week 3)
1. Export CSV (streaming for large datasets)
2. Import with validation
3. Progress tracking

## Technical Decisions

### State Management
- React Context for selection state
- URLSearchParams for filter sync
- TanStack Query for server state (if needed)

### Components to Create
1. `AdminSidebar` - mobile responsive with drawer
2. `DataTable` - generic, reusable
3. `FilterBar` - reusable
4. `BulkActionBar` - appears when items selected
5. `ExportDialog` / `ImportDialog`
6. `NotificationProvider` + `NotificationBell`
6. `SSE` hook

### API Endpoints Needed
- `POST /api/admin/ventures/bulk-delete`
- `POST /api/admin/variants/bulk-delete`
- `GET /api/admin/ventures/export`
- `POST /api/admin/ventures/import`
- `GET /api/admin/notifications/stream` (SSE)
- `PATCH /api/admin/notifications/read`

## File Structure
```
src/
├── components/
│   ├── admin/
│   │   ├── AdminSidebar.tsx (updated)
│   │   ├── DataTable.tsx
│   │   ├── FilterBar.tsx
│   │   ├── BulkActionBar.tsx
│   │   ├── ExportDialog.tsx
│   │   ├── ImportDialog.tsx
│   │   ├── NotificationBell.tsx
│   │   ├── NotificationProvider.tsx
│   │   ├── MobileDrawer.tsx
│   ├── ui/
│   │   ├── DataTable.tsx (moved from admin)
│   │   ├── ColumnSelector.tsx
│   │   ├── DateRangePicker.tsx
│   │   ├── MultiSelectFilter.tsx
├── hooks/
│   ├── useSelection.ts
│   ├── useFilters.ts
│   ├── useSSE.ts
│   ├── useDebounce.ts
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   ├── ventures/
│   │   │   │   ├── bulk-delete/route.ts
│   │   │   │   ├── export/route.ts
│   │   │   │   ├── import/route.ts
│   │   │   ├── variants/
│   │   │   │   ├── bulk-delete/route.ts
│   │   │   │   ├── export/route.ts
│   │   │   ├── notifications/
│   │   │   │   ├── stream/route.ts (SSE)
│   │   │   │   ├── read/route.ts
├── lib/
│   ├── csv.ts (export/import utilities)
│   ├── sse.ts (SSE utilities)
```

## Priority
1. Mobile responsive sidebar (immediate UX improvement)
2. Bulk delete + export (high value)
3. Advanced filters (usability)
4. Real-time notifications (engagement)
5. Import/Export (operational)

## Risks
- Large CSV exports: use streaming
- SSE connections: connection pooling
- Mobile drawer: focus trapping, escape key
- Bulk delete: confirmation, audit log