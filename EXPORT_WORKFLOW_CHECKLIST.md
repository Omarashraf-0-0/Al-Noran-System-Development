# 📦 Export (UCR) System - Complete Workflow Checklist

## 🎯 MASTER WORKFLOW OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EXPORT SHIPMENT LIFECYCLE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CLIENT PHASE                    EMPLOYEE PHASE                             │
│  ═══════════════                 ══════════════                             │
│                                                                             │
│  1. Create UCR Request    →   2. Review & Lock Request                      │
│     (pending)                    (under_review)                             │
│                                                                             │
│                               3. Decision:                                  │
│                                  ├─ Approve ✅ (approved)                   │
│                                  ├─ Request Revision ⚠️ (needs_revision)   │
│                                  └─ Reject ❌ (rejected)                    │
│                                                                             │
│  4. Edit if revision     ←    [If needs_revision, client edits]            │
│                                                                             │
│                               5. Issue UCR Number                           │
│                                  (ucr_issued)                               │
│                                  → AUTO-CREATE EXPORT SHIPMENT              │
│                                                                             │
│ ═══════════════════════════════════════════════════════════════════════════│
│                                                                             │
│  EXPORT SHIPMENT PHASE (After UCR Issued)                                   │
│  ═════════════════════════════════════════                                  │
│                                                                             │
│  📄 documents_submitted  →  ✅ documents_verified  →  🔍 regulatory_check  │
│           ↓                                                                 │
│  🏛️ customs_clearance   →  📦 ready_to_ship      →  🚀 shipped            │
│           ↓                                                                 │
│  ✨ completed                                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 PHASE 1: UCR REQUEST WORKFLOW

### 1.1 Client Creates UCR Request
- **Page:** `/ucr-request` (UCRRequestPage.jsx)
- **Action:** Client fills form with:
  - Certification type (noran/client)
  - Shipping method (air/sea)
  - Destination country/port
  - Goods description, weight, packages
  - Invoice details
  - Required documents upload
- **Initial Status:** `pending`
- **Trigger:** Form submission

### 1.2 Client Views UCR Requests List
- **Page:** `/ucr-requests` (UCRRequestsPage.jsx)
- **Shows:** All client's UCR requests with status badges
- **Actions:** View details, create new request

### 1.3 Client Views UCR Request Details
- **Page:** `/ucr-request/:requestId` (UCRRequestDetailsPage.jsx)
- **Shows:** Full request details + progress indicator
- **Progress Bar Logic:**
  - Step 1: `pending` - قيد المراجعة
  - Step 2: `under_review` - قيد التدقيق  
  - Step 3: `approved` - معتمد
- **Actions based on status:**
  - `pending`: Edit, Delete
  - `needs_revision`: Edit (resubmit)
  - `approved`: Wait for UCR issuance
  - `ucr_issued`+`hasExportShipment`: "متابعة الشحنة" button

---

## 📋 PHASE 2: EMPLOYEE UCR MANAGEMENT

### 2.1 Employee Views UCR Requests
- **Page:** `/employee/ucr-requests` (EmployeeUCRRequestsPage.jsx)
- **Shows:** All UCR requests from all clients
- **Actions per status:**
  - `pending`: 🔒 Lock for review
  - `pending`+locked / `under_review`: ✅ Approve, ⚠️ Request Revision, ❌ Reject
  - `approved`: 📋 Issue UCR (opens modal)
  - `ucr_issued`+`hasExportShipment`: 📦 Track Shipment

### 2.2 Employee Views UCR Request Details
- **Page:** `/employee/ucr-request/:requestId` (UCRRequestDetailsPage.jsx)
- **Same as client view but with employee actions

### 2.3 Issue UCR Number (CRITICAL STEP)
- **Trigger:** Employee clicks "إصدار UCR" on approved request
- **Modal:** Enter UCR number from النافذة الواحدة
- **Backend Action:**
  1. Update UCR status to `ucr_issued`
  2. **AUTO-CREATE ExportShipment** record
  3. Link shipment to UCR request
- **Result:** Export shipment now trackable

---

## 📋 PHASE 3: EXPORT SHIPMENT TRACKING

### 3.1 Client Export Shipments List
- **Page:** `/export-shipments` (ExportShipmentsPage.jsx)
- **Shows:** All client's export shipments (auto-created from UCR)
- **Actions:** View details, filter by status

### 3.2 Client Export Shipment Details
- **Page:** `/export-shipment/:shipmentId` (ExportShipmentDetailsPage.jsx)
- **Shows:** Detailed shipment progress with 8-step tracker
- **Progress Steps:**
  1. pending_ucr → في انتظار UCR
  2. documents_submitted → المستندات مرفوعة
  3. documents_verified → المستندات موثقة
  4. regulatory_check → الفحص التنظيمي
  5. customs_clearance → التخليص الجمركي
  6. ready_to_ship → جاهز للشحن
  7. shipped → تم الشحن
  8. completed → مكتمل

### 3.3 Employee Export Shipments Management
- **Page:** `/employee/export-shipments` (EmployeeExportShipmentsPage.jsx)
- **Shows:** All export shipments
- **Actions:** Update status, view details

---

## 🔧 ISSUES TO FIX

### Issue 1: UCR Details Page Design
- [ ] Match design with ShipmentStatus.jsx (illustration, stepper, data fields)
- [ ] Use Stepper component for progress
- [ ] Add main illustration image
- [ ] Use Datafield components for info display

### Issue 2: Progress Bar Logic (3 stages)
Current: pending → under_review → approved
- [ ] Step 1 (قيد المراجعة): When `status === 'pending'`
- [ ] Step 2 (قيد التدقيق): When `status === 'under_review'`
- [ ] Step 3 (معتمد): When `status === 'approved'`
- [ ] After step 3, show "إصدار UCR" status when `ucr_issued`

### Issue 3: Button Navigation Fixes
- [ ] "متابعة الشحنة" → Navigate to specific export shipment
- [ ] Fix dashboard redirects → Navigate to correct pages
- [ ] Employee buttons → Correct employee routes

### Issue 4: End-to-End Workflow
- [ ] UCR approval should enable UCR issuance
- [ ] UCR issuance should auto-create export shipment
- [ ] Export shipment should link back to UCR
- [ ] All status transitions should work correctly

---

## 🛠️ IMPLEMENTATION TASKS

### Task 1: Redesign UCRRequestDetailsPage
```
- Add illustration image at top
- Use horizontal stepper (similar to ShipmentStatus)
- Use DataField components for data display
- Modernize card layouts
- Add notification bell
```

### Task 2: Fix Progress Step Logic
```javascript
// Progress should show:
// Status: pending → Step 1 active
// Status: under_review → Step 2 active, Step 1 complete
// Status: approved → Step 3 active, Steps 1-2 complete
// Status: ucr_issued → All 3 complete, show UCR info
```

### Task 3: Fix Navigation
```javascript
// UCRRequestDetailsPage
"متابعة الشحنة" → /export-shipment/{exportShipmentId} (client)
"متابعة الشحنة" → /employee/export-shipments (employee)

// EmployeeUCRRequestsPage  
"إصدار UCR" → Opens modal, creates shipment
"متابعة الشحنة" → /employee/export-shipments (after shipment created)
```

### Task 4: Backend Verification
- [ ] `POST /api/ucr/employee/:id/issue-ucr` creates ExportShipment ✅
- [ ] `GET /api/export-shipments` returns user's shipments
- [ ] `GET /api/export-shipments/employee/all` returns all shipments
- [ ] Status update endpoints work correctly

---

## ✅ VERIFICATION CHECKLIST

### Client Flow Test
1. [ ] Login as client
2. [ ] Create new UCR request → /ucr-request
3. [ ] View in list → /ucr-requests
4. [ ] View details → /ucr-request/:id (progress at step 1)
5. [ ] After employee approves → Progress at step 3
6. [ ] After UCR issued → "متابعة الشحنة" button appears
7. [ ] Click button → Goes to /export-shipment/:id
8. [ ] View export shipments list → /export-shipments

### Employee Flow Test
1. [ ] Login as employee
2. [ ] View UCR requests → /employee/ucr-requests
3. [ ] Lock request → Status changes
4. [ ] Approve request → Status = approved
5. [ ] Issue UCR → Modal appears, enter number
6. [ ] Submit → ExportShipment created
7. [ ] View export shipments → /employee/export-shipments
8. [ ] Update shipment status → Status progresses

---

## 📝 STATUS MAPPING

### UCR Request Statuses
| Status | Arabic | Step | Description |
|--------|--------|------|-------------|
| pending | قيد المراجعة | 1 | Waiting for employee review |
| under_review | قيد التدقيق | 2 | Employee is reviewing |
| approved | معتمد | 3 | Approved, ready for UCR |
| needs_revision | يحتاج تعديل | 0 | Client needs to edit |
| rejected | مرفوض | -1 | Request rejected |
| ucr_issued | تم إصدار UCR | 4 | UCR number issued |

### Export Shipment Statuses
| Status | Arabic | Step |
|--------|--------|------|
| pending_ucr | في انتظار UCR | 1 |
| documents_submitted | المستندات مرفوعة | 2 |
| documents_verified | المستندات موثقة | 3 |
| regulatory_check | الفحص التنظيمي | 4 |
| customs_clearance | التخليص الجمركي | 5 |
| ready_to_ship | جاهز للشحن | 6 |
| shipped | تم الشحن | 7 |
| completed | مكتمل | 8 |

---

## 🎨 DESIGN SYNC

### Components to Use
- `Stepper` - Progress indicator (horizontal steps)
- `DataField` - Labeled data display
- `NotificationBell` - Updates notification
- `Header` / `Footer` - Layout components
- `BackgroundContainer` / `FormContainer` - Page wrapper

### Assets Needed
- Main illustration image (mainIllustration)
- Contract icon (contractIcon)
- Document icon (documentText)
- Support agent icon (supportAgent)

---

## ✅ SESSION 2 - COMPLETED FIXES

### 1. Design Consistency ✅
- **UCRRequestDetailsPage** - Redesigned to match ShipmentStatus.jsx
- **ExportShipmentDetailsPage** - Redesigned with same pattern
- Both pages now have:
  - Main illustration image at top
  - Horizontal stepper progress indicator
  - DataField grid for data display
  - Consistent color scheme and layout

### 2. Progress Bar Logic ✅
- **UCRStepper** (4 steps):
  1. pending (قيد المراجعة)
  2. under_review (قيد التدقيق)
  3. approved (معتمد)
  4. ucr_issued (تم إصدار UCR)

- **ExportStepper** (8 steps):
  1. pending_ucr → documents_submitted → documents_verified
  2. regulatory_check → customs_clearance → ready_to_ship
  3. shipped → completed

- Special handling for rejected/needs_revision (shown as error state)

### 3. Button Navigation ✅
- "متابعة الشحنة" button:
  - Client → `/export-shipment/{exportShipmentId}`
  - Employee → `/employee/export-shipments`
- Fixed route parameter mismatch (shipmentId vs id)

### 4. Backend Integration ✅
- `issueUCRNumber` endpoint auto-creates ExportShipment
- UCR Request linked to ExportShipment via `exportShipmentId`
- `hasExportShipment` flag properly updated

---

## 🧪 TESTING CHECKLIST

### As Client:
1. [ ] Create new UCR request at `/ucr-request`
2. [ ] View requests list at `/ucr-requests`
3. [ ] View request details at `/ucr-request/{id}`
4. [ ] See progress bar update as status changes
5. [ ] After UCR issued, click "متابعة الشحنة" → goes to export shipment page
6. [ ] View export shipments at `/export-shipments`

### As Employee:
1. [ ] View all UCR requests at `/employee/ucr-requests`
2. [ ] Change status: pending → under_review → approved
3. [ ] Issue UCR number (auto-creates export shipment)
4. [ ] View export shipments at `/employee/export-shipments`
5. [ ] Update shipment status through workflow
