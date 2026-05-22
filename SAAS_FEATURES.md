# GasManager.ma - SaaS Features & Roadmap

**Platform:** Cloud-based gas station management system for Morocco  
**Target Users:** Station owners (Directeurs), shift workers (Gérants), station managers  
**Status:** MVP In Development

---

## 📋 Table of Contents

1. [MVP Features (Current)](#mvp-features-current)
2. [Phase 2: Enhanced Operations](#phase-2-enhanced-operations)
3. [Phase 3: Inventory & Supply Chain](#phase-3-inventory--supply-chain)
4. [Phase 4: Analytics & Reporting](#phase-4-analytics--reporting)
5. [Phase 5: Advanced Management](#phase-5-advanced-management)
6. [User Roles & Permissions](#user-roles--permissions)
7. [Technical Architecture](#technical-architecture)
8. [Moroccan Compliance Requirements](#moroccan-compliance-requirements)

---

## MVP Features (Current)

### ✅ Authentication & Access Control
- [x] Email/password login with JWT tokens
- [x] Role-based access control (Gérant, Directeur)
- [x] Session management with NextAuth
- [x] Password hashing with bcryptjs
- [ ] Two-factor authentication (2FA)
- [ ] Single sign-on (SSO) integration
- [ ] Account recovery/password reset

### ✅ Shift Management (Gérant Dashboard)
- [x] Open shift (record opening cash amount)
- [x] Close shift (record closing cash amount)
- [x] View shift details and history
- [x] Track shift duration and timeline
- [ ] Shift handover notes/comments
- [ ] Shift approval workflow
- [ ] Shift templates (recurring shifts)
- [ ] Break time tracking

### ✅ Sales Recording (Real-time)
- [x] Record fuel sales by pump number
- [x] Support three fuel types: Gasoil, Essence, GPL
- [x] Track liters sold and amount in MAD
- [x] Calculate price per liter automatically
- [x] Real-time sales summary (total amount, total liters)
- [ ] Pump-specific sales trends
- [ ] Bulk import from pump sensors
- [ ] Discounts and promotional pricing

### ✅ Cash Management
- [x] Opening cash tracking per shift
- [x] Closing cash entry
- [x] Calculate cash difference (expected vs. actual)
- [ ] Cash reconciliation workflow
- [ ] Multi-currency support (MAD, EUR, USD)
- [ ] Bank deposit tracking
- [ ] Cash float management

### ✅ Basic Reporting
- [x] Today's shifts list
- [x] Sales breakdown by shift
- [ ] Daily summary report
- [ ] Export to PDF/Excel
- [ ] Email reports

---

## Phase 2: Enhanced Operations

### 📱 Mobile App
- [ ] Native iOS app (Gérant features)
- [ ] Native Android app (Gérant features)
- [ ] Offline-first capability
- [ ] Push notifications for shift alerts
- [ ] QR code for shift start/end
- [ ] Photo capture for cash count verification

### 📊 Shift Analytics
- [ ] Shift performance metrics
- [ ] Average sales per shift
- [ ] Peak hours analysis
- [ ] Gérant productivity rankings
- [ ] Fuel type preferences by time of day
- [ ] Customer traffic patterns (from sales data)

### 💬 Communication
- [ ] In-app messaging between Directeur and Gérant
- [ ] Shift announcements
- [ ] Emergency alerts
- [ ] SMS notifications for critical events
- [ ] WhatsApp integration for notifications

### 🔧 Station Configuration
- [ ] Pump management (add/edit/delete pumps)
- [ ] Station settings (name, address, manager, capacity)
- [ ] Operating hours configuration
- [ ] Holiday schedule management
- [ ] Station-specific fuel prices

---

## Phase 3: Inventory & Supply Chain

### 📦 Inventory Management
- [ ] Track fuel stock levels per pump
- [ ] Low stock alerts (configurable thresholds)
- [ ] Inventory discrepancy tracking
- [ ] Loss/waste reporting (evaporation, spills)
- [ ] Tank capacity management
- [ ] Multiple fuel quality grades per type

### 🚛 Fuel Deliveries
- [ ] Record incoming deliveries
- [ ] Track delivery date/time and quantity
- [ ] Supplier management
- [ ] Delivery cost tracking
- [ ] Quality inspection checklist
- [ ] Delivery receipt upload (PDF)
- [ ] Fuel consumption rate tracking

### 📈 Predictive Analytics
- [ ] Fuel consumption forecasting
- [ ] Automatic reorder recommendations
- [ ] Seasonal demand patterns
- [ ] Optimal stock level calculations
- [ ] Supply chain cost optimization

---

## Phase 4: Analytics & Reporting

### 📊 Dashboard & KPIs
- [ ] Real-time sales dashboard
- [ ] Daily/weekly/monthly summaries
- [ ] Revenue trends with graphs
- [ ] Fuel consumption by type
- [ ] Profitability analysis
- [ ] Cash flow forecasting
- [ ] Gérant performance scorecard

### 📋 Report Generation
- [ ] Daily operations report
- [ ] Weekly summary report
- [ ] Monthly financial report
- [ ] Fuel consumption analysis
- [ ] Gérant performance report
- [ ] Tax/compliance reports (for Morocco)
- [ ] Custom report builder
- [ ] Scheduled email reports
- [ ] PDF/Excel/CSV export
- [ ] Data visualization (charts, graphs)

### 🔍 Data Analysis
- [ ] Sales trends over time
- [ ] Seasonal pattern analysis
- [ ] Fuel type popularity trends
- [ ] Pump efficiency comparison
- [ ] Revenue per liter analysis
- [ ] Customer segmentation (if CRM added)

---

## Phase 5: Advanced Management

### 👥 Advanced User Management
- [ ] Multiple Gérants per station
- [ ] Admin/Super Admin role
- [ ] Directeur able to manage multiple stations
- [ ] User activity audit log
- [ ] Permission matrix customization
- [ ] Team management and assignments
- [ ] User performance ratings

### 💰 Financial Management
- [ ] Expense tracking (maintenance, utilities, etc.)
- [ ] Profit & loss statements
- [ ] Budget management and forecasting
- [ ] Cost per liter calculation
- [ ] Margin analysis by fuel type
- [ ] Break-even analysis
- [ ] Tax calculation and reporting

### 🏪 Multi-Station Management
- [ ] Central dashboard for all stations
- [ ] Compare performance across stations
- [ ] Consolidated reporting
- [ ] Chain-level analytics
- [ ] Station benchmarking
- [ ] Resource allocation optimization

### 🔐 Security & Compliance
- [ ] Audit trail for all transactions
- [ ] Role-based data access
- [ ] Data encryption (at rest and in transit)
- [ ] GDPR/Morocco data protection compliance
- [ ] Regular security audits
- [ ] Backup and disaster recovery
- [ ] API access tokens for integrations

### 🛒 POS Integration
- [ ] Connect to existing pump systems
- [ ] Real-time data sync from pumps
- [ ] Eliminate manual sales entry
- [ ] Transaction verification
- [ ] System synchronization alerts

### 📞 Customer Support
- [ ] In-app help/FAQ
- [ ] Live chat support
- [ ] Email support tickets
- [ ] Phone support (Arabic, French, English)
- [ ] Video tutorials
- [ ] Knowledge base

---

## User Roles & Permissions

### 👷 Gérant (Shift Worker)
**Responsibilities:** Daily shift operations, sales recording, cash management

| Feature | Permission | Notes |
|---------|-----------|-------|
| View own shifts | View | All shifts worked |
| Open shift | Create | Can open new shifts with opening cash |
| Close shift | Update | Can close shifts with closing cash |
| Record sales | Create | Add fuel sales during shift |
| View own sales | View | All sales recorded during their shifts |
| View shift summary | View | Cash difference, totals, trends |
| View announcements | View | Station-wide messages |
| Message directeur | Create | Request assistance or report issues |
| | | **Cannot:** Delete shifts, modify other's sales, access financials |

### 👔 Directeur (Station Owner/Manager)
**Responsibilities:** Station oversight, staff management, financial reporting, strategic decisions

| Feature | Permission | Notes |
|---------|-----------|-------|
| View all shifts | View | All shifts at their station(s) |
| View all sales | View | All sales across the station |
| Create Gérant accounts | Create | Assign to station |
| Manage Gérants | Update | Edit roles, suspend, view performance |
| View detailed reports | View | Daily, weekly, monthly summaries |
| Export reports | Export | PDF, Excel, CSV formats |
| Manage station config | Update | Pumps, hours, settings |
| View financials | View | Revenue, expenses, profit |
| Message Gérants | Create | Shift announcements, requests |
| Approve shifts | Approve | Optional workflow |
| View multi-station dashboard | View | If they own multiple stations |
| | | **Cannot:** Delete shift data (audit trail only), access other directeurs' data |

### 🔧 Admin (Platform Administrator)
**Responsibilities:** System management, user support, compliance, scaling

| Feature | Permission | Notes |
|---------|-----------|-------|
| Manage all users | Full | Create, edit, suspend, delete |
| View all stations | View | System-wide oversight |
| Create Directeur accounts | Create | Onboard new stations |
| View analytics | View | Platform-wide metrics |
| Export compliance reports | Export | Tax, audit reports for Morocco |
| Configure system settings | Update | Pricing, feature flags, etc. |
| Support user issues | Manage | Password resets, account recovery |
| | | **Only:** System administrators |

### Future Role: 📊 Station Manager (Phase 5)
- Reports to Directeur
- Can manage multiple Gérants
- Limited financial access
- Scheduling and shift management

---

## Technical Architecture

### Current Stack
- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Node.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** NextAuth v4.24.0, JWT tokens
- **Hosting:** Vercel (serverless)
- **Real-time:** (TBD - WebSockets or polling)

### Required Additions (Phase 2+)
- **Real-time:** Socket.io or Vercel KV for live updates
- **File Storage:** AWS S3 or Vercel Blob for PDF reports, receipts
- **Email:** SendGrid or Mailgun for report emails
- **SMS:** Twilio for WhatsApp/SMS notifications
- **Analytics:** Mixpanel or Amplitude for usage tracking
- **Monitoring:** Sentry for error tracking

### API Endpoints (MVP)

```
POST   /api/auth/login              - Login with credentials
GET    /api/auth/session            - Get current session

POST   /api/shifts/open             - Create new shift
POST   /api/shifts/close            - Close active shift
GET    /api/shifts/[id]             - Get shift details
GET    /api/gerant/shifts           - Get gérant's shifts (today)
GET    /api/shifts/station/[id]     - Get station's shifts (directeur)

POST   /api/sales/record            - Record fuel sale
GET    /api/sales/[shiftId]         - Get sales for shift

GET    /api/reports/daily           - Daily summary report
GET    /api/reports/weekly          - Weekly summary report
GET    /api/reports/monthly         - Monthly summary report
```

### Database Schema (MVP)

```
User
├── email (unique)
├── password (hashed)
├── firstName
├── lastName
├── role: "gerant" | "directeur"
├── station (ref: Station) - optional for gérant
└── createdAt

Station
├── name
├── address
├── owner (ref: User - directeur)
├── coordinates (lat, lng)
├── operatingHours
├── pumpCount
└── createdAt

Shift
├── gerant (ref: User)
├── station (ref: Station)
├── startTime
├── endTime
├── openingCash
├── closingCash
├── status: "open" | "closed"
├── notes
└── createdAt

Sale
├── shift (ref: Shift)
├── pumpNumber
├── fuelType: "gasoil" | "essence" | "gpl"
├── liters
├── amountMAD
└── createdAt
```

---

## Moroccan Compliance Requirements

### 🏛️ Regulatory Compliance
- [ ] Support Moroccan MAD currency (no currency conversion)
- [ ] Generate reports in French & Arabic
- [ ] Comply with Moroccan labor laws (shift hours, breaks)
- [ ] Tax calculation for Moroccan VAT rates (currently 20%)
- [ ] Data residency in Morocco or EU (GDPR compliant)
- [ ] Audit trail for all transactions (7-year retention)

### 📋 Industry Standards
- [ ] Track Calorific Value (PCI) for fuel quality
- [ ] Environmental compliance (fuel handling)
- [ ] Safety records and incident reporting
- [ ] Fuel excise tax tracking (for government reports)

### 🏪 Business Context
- [ ] Support traditional cash-heavy operations
- [ ] Integration with local payment systems
- [ ] Support for informal workforce
- [ ] Training in Arabic and French
- [ ] Local currency formatting (1.234,56 MAD)
- [ ] Support for Moroccan phone numbers
- [ ] WhatsApp as primary communication channel

---

## 🎯 Milestones & Timeline

### Q2 2026: MVP Release
- ✅ Authentication & login
- ✅ Shift management
- ✅ Sales recording
- ✅ Basic cash tracking
- ✅ Simple reporting
- **Target:** 5-10 paying stations

### Q3 2026: Phase 2 - Mobile & Enhanced UX
- [ ] Mobile app (iOS/Android)
- [ ] Improved dashboard
- [ ] Shift analytics
- [ ] Email reports
- **Target:** 25-50 stations

### Q4 2026: Phase 3 - Inventory
- [ ] Fuel inventory tracking
- [ ] Delivery management
- [ ] Predictive analytics
- **Target:** 100+ stations

### Q1 2027: Phase 4 - Advanced Reporting
- [ ] Advanced analytics dashboard
- [ ] Custom reports
- [ ] Tax compliance reports
- [ ] Multi-station management

### Q2 2027: Phase 5 - Enterprise Features
- [ ] POS system integration
- [ ] Advanced user roles
- [ ] Financial management
- [ ] API for third-party integrations

---

## 💡 Success Metrics

- **User Adoption:** 200+ stations by end of 2026
- **Daily Active Users:** 80%+ of gérants logging in daily
- **Data Quality:** 95%+ cash reconciliation rate
- **System Uptime:** 99.9% availability
- **Customer Satisfaction:** NPS > 50
- **Revenue:** (B2B SaaS model - pricing TBD)

---

## 📝 Notes

- All timestamps in UTC, displayed in user's timezone
- All amounts in MAD (Moroccan Dirham)
- Phone numbers must include +212 country code
- All dates follow DD/MM/YYYY format (Moroccan standard)
- Support Arabic (Darija), French, and English interfaces

---

**Last Updated:** May 2026  
**Next Review:** June 2026  
**Maintained By:** GasManager.ma Development Team
