# Driving School Management System - 1 Week Development Plan

## Project Overview
**Tech Stack:**
- Backend: Django + Django ORM + Graphene-Django (GraphQL)
- Database: PostgreSQL
- Frontend: React + Apollo Client + Bootstrap 5
- Authentication: Session-based (Django sessions)

**Scope:** Phase 1 MVP - Core Student, Token, Billing & Basic Income modules

---

## Day 1: Project Setup & Foundation

### Backend Setup
- [ ] Initialize Django project with PostgreSQL configuration
- [ ] Install and configure Graphene-Django
- [ ] Set up session-based authentication system
- [ ] Create base Django models (User, Role management)
- [ ] Configure CORS and middleware

### Database Schema Design
- [ ] Design and create core tables:
  - `students` (id, name, address, contact, citizenship, course_type, status, photo, id_proof)
  - `instructors` (id, name, contact, specialization)
  - `vehicles` (id, type, model, license_plate, status)
  - `courses` (id, type, fee, duration)

### Frontend Setup
- [ ] Initialize React project with Vite/CRA
- [ ] Install Apollo Client and configure GraphQL endpoint
- [ ] Set up Bootstrap 5 and base layout
- [ ] Create authentication context and protected routes
- [ ] Build login/signup pages

**Deliverable:** Working project skeleton with auth flow

---

## Day 2: Student Admission Module

### Backend
- [ ] Create Student model with all fields
- [ ] Build GraphQL queries (listStudent, studentDetail)
- [ ] Build GraphQL mutations (createStudent, updateStudent, deleteStudent)
- [ ] Implement auto student ID generation
- [ ] Add document upload functionality (photo, ID proof)
- [ ] Create batch and instructor assignment logic

### Frontend
- [ ] Student registration form with validation
- [ ] Student list view with filters (status, course, batch)
- [ ] Student detail view
- [ ] Student edit/delete functionality
- [ ] Document upload UI
- [ ] Admission fee collection modal

**Deliverable:** Complete student admission CRUD functionality

---

## Day 3: Token & Driving Time Management

### Backend
- [ ] Create Token model (student, duration, date, time, vehicle, instructor, status)
- [ ] Create TokenDuration config model (15min, 30min, 45min, 1hr)
- [ ] Build GraphQL schema for token operations
- [ ] Implement slot availability check algorithm
- [ ] Create token issuance mutation with conflict detection
- [ ] Build daily schedule query
- [ ] Add token expiry logic

### Frontend
- [ ] Token creation form with slot picker
- [ ] Visual calendar/schedule view
- [ ] Available slots display
- [ ] Instructor and vehicle assignment dropdowns
- [ ] Token history view per student
- [ ] Daily driving schedule dashboard

**Deliverable:** Working token booking system with schedule visualization

---

## Day 4: Billing & Invoice System

### Backend
- [ ] Create Invoice model (student, invoice_no, total, discount, paid_amount, due_amount, status)
- [ ] Create InvoiceItem model (invoice, description, amount, quantity)
- [ ] Create Payment model (invoice, amount, mode, transaction_id, date)
- [ ] Auto invoice number generation
- [ ] Build invoice mutations (create, update, payment)
- [ ] Implement installment tracking
- [ ] Add due amount calculation logic

### Frontend
- [ ] Course fee invoice creation
- [ ] Token-based billing
- [ ] Invoice list view with filters
- [ ] Invoice detail with print functionality
- [ ] Payment collection modal (split payment support)
- [ ] Installment schedule view
- [ ] Due invoice alerts

**Deliverable:** Complete billing system with invoice generation

---

## Day 5: Income & Receivable Management

### Backend
- [ ] Create Income model (type, amount, date, category, description, related_invoice)
- [ ] Create IncomeCategory model
- [ ] Implement double-entry accounting structure:
  - `AccountType` (Asset, Liability, Equity, Revenue, Expense)
  - `Account` (chart of accounts - code, name, type, parent, balance, normal_balance)
  - `JournalEntry` (date, description, status, related_voucher)
  - `JournalEntryLine` (account, debit_amount, credit_amount, narration)
  - `Ledger` (account, date, particular, debit, credit, balance)
- [ ] Create utility functions for double-entry validation
- [ ] Auto journal entry on invoice/payment creation
- [ ] Create receivable tracking logic
- [ ] Build accounting queries (trial balance, balance sheet, ledger)

### Frontend
- [ ] Income entry forms (admission, session, license assistance, other)
- [ ] Income report view (daily/monthly)
- [ ] Student due tracking view
- [ ] Aging report (30/60/90+ days)
- [ ] Payment reminder interface

**Deliverable:** Basic accounting with income tracking and receivables

---

## Day 6: Reports & Dashboard

### Backend
- [ ] Create summary queries for dashboard
- [ ] Build income statement query (total income - total expense)
- [ ] Create student statistics (active, completed, dropped)
- [ ] Build instructor performance query
- [ ] Create vehicle utilization report
- [ ] Token usage analytics

### Frontend
- [ ] Main dashboard with key metrics cards
  - Total students
  - Today's collection
  - Active tokens
  - Pending dues
- [ ] Chart.js integration for visualizations
  - Daily collection trend
  - Student enrollment chart
  - Income vs Expense
- [ ] Income statement report page
- [ ] Due report with filters
- [ ] Instructor performance report
- [ ] Vehicle utilization report

**Deliverable:** Analytics dashboard with key reports

---

## Day 7: Admin Features & Polish

### Backend
- [ ] User role management (Admin, Accountant, Instructor, Receptionist)
- [ ] Permission middleware for GraphQL
- [ ] Audit log model and tracking
- [ ] Database backup command
- [ ] SMS notification integration (basic - Twilio/MSG91)
- [ ] ID card generation endpoint

### Frontend
- [ ] Admin panel for user management
- [ ] Role-based UI rendering
- [ ] ID card print template
- [ ] Settings page (token duration, SMS config)
- [ ] Audit log viewer
- [ ] Backup/restore interface
- [ ] Global error handling
- [ ] Loading states and toasts
- [ ] Responsive design fixes

### Testing & Documentation
- [ ] Basic API testing
- [ ] End-to-end user flow testing
- [ ] README with setup instructions
- [ ] API documentation (GraphQL schema)

**Deliverable:** Production-ready MVP with admin features

---

## Post-MVP (Phase 2 & 3) - Future Scope

### Phase 2: Full Accounting
- Complete expense management
- Equity & liability modules
- Loan management
- Bank transaction & reconciliation
- Balance sheet

### Phase 3: Advanced Features
- SMS automation
- Advanced analytics
- Multi-branch support
- Mobile app version
- License form integration with RTO

---

## Success Criteria for Week 1

1. Can register and manage students
2. Can book and manage driving tokens/slots
3. Can generate and print invoices
4. Can track income and receivables
5. Dashboard shows key business metrics
6. Role-based access works
7. All basic CRUD operations functional
8. Data is persisted correctly in PostgreSQL

---

## Risk Mitigation

- **Complex Features Defer:** SMS integration, advanced analytics to Phase 3 if time runs out
- **UI Simplification:** Use Bootstrap components as-is, minimize custom CSS
- **GraphQL First:** Build backend APIs before complex UI
- **Core Paths Focus:** Prioritize happy path over edge cases
- **Manual Testing:** Defer automated tests to post-MVP

---

## Daily Workflow Suggestion

1. **Morning (2 hrs):** Backend GraphQL schema + resolvers
2. **Midday (2 hrs):** Database models and business logic
3. **Afternoon (3 hrs):** Frontend components and state management
4. **Evening (1 hr):** Integration testing and bug fixes

**Total: ~8 hours/day x 7 days = 56 hours for MVP**
