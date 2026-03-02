# Double Entry Accounting System Implementation

## Overview

A complete double entry accounting system has been implemented for the driving school management system. This system provides full accounting capabilities including chart of accounts, journal entries, ledger, trial balance, balance sheet, and income statement.

## Implementation Summary

### 1. Django Models (C:\Users\prdps\desktop\dmis\accounting\models.py)

#### Core Models:

1. **Account** - Chart of Accounts
   - Fields: code, name, account_type, parent_account, normal_balance, opening_balance
   - Account Types: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
   - Properties: current_balance, debit_total, credit_total
   - Auto-sets normal balance based on account type

2. **JournalEntry** - Journal Entry Header
   - Fields: entry_number (auto-generated), date, description, reference_type, reference_id, status
   - Status: DRAFT, POSTED, CANCELLED
   - Auto-generates entry numbers with JE{YYYYMM}{NNNN} format
   - Validates debits equal credits

3. **JournalEntryLine** - Journal Entry Line Items
   - Fields: journal_entry, account, debit_amount, credit_amount, narration
   - Validates: either debit OR credit (not both)
   - Auto-numbered line items

4. **Ledger** - Ledger Entries
   - Fields: account, date, journal_entry_line, particular, debit_amount, credit_amount, balance
   - Automatically populated when journal entries are posted
   - Maintains running balance for each account

### 2. Utility Functions (C:\Users\prdps\desktop\dmis\accounting\utils.py)

Key functions:

- **create_double_entry()** - Create balanced journal entries
- **get_account_balance()** - Get account balance as of specific date
- **generate_trial_balance()** - Generate trial balance report
- **generate_income_statement()** - Generate income statement for period
- **generate_balance_sheet()** - Generate balance sheet as of date
- **get_account_ledger()** - Get ledger entries for an account
- **initialize_chart_of_accounts()** - Initialize default chart of accounts
- **create_invoice_journal_entry()** - Auto-entry for invoice creation
- **create_payment_journal_entry()** - Auto-entry for payment receipt
- **create_expense_journal_entry()** - Auto-entry for expense payments

### 3. GraphQL Schema (C:\Users\prdps\desktop\dmis\accounting\schema.py)

#### Queries:

- **all_accounts** - List all accounts
- **account** - Get specific account by ID
- **accounts_by_type** - Filter accounts by type
- **all_journal_entries** - List all journal entries
- **journal_entry** - Get specific journal entry
- **journal_entries_by_date** - Filter entries by date range
- **trial_balance** - Get trial balance as of date
- **balance_sheet** - Get balance sheet as of date
- **income_statement** - Get income statement for period
- **account_ledger** - Get ledger for specific account
- **all_ledger_entries** - List all ledger entries

#### Mutations:

- **create_account** - Create new account
- **update_account** - Update account details
- **create_journal_entry** - Create journal entry with lines
- **post_journal_entry** - Post draft journal entry

### 4. Admin Interface (C:\Users\prdps\desktop\dmis\accounting\admin.py)

Registered models with Django Admin:
- Account (with balance display)
- JournalEntry (with inline lines)
- JournalEntryLine
- Ledger (with filtering by account, date, voucher)
- Invoice, Payment, Income (existing models)
- TMOFee, TMOTrialReceipt (existing models)

### 5. Database Migration

Migration file: `accounting/migrations/0005_account_journalentry_journalentryline_ledger_and_more.py`

Created tables:
- accounts
- journal_entries
- journal_entry_lines
- ledger

With indexes on:
- Account: code, account_type, is_active
- JournalEntry: entry_number, date, status, reference_type+reference_id
- JournalEntryLine: journal_entry, account
- Ledger: account, date, voucher_type+voucher_number

## Chart of Accounts

Default chart of accounts initialized with 30 accounts:

### Assets (1000-1999)
- 1000 - Cash
- 1100 - Bank Account
- 1200 - Accounts Receivable
- 1300 - Prepaid Expenses
- 1500 - Vehicles
- 1510 - Accumulated Depreciation - Vehicles (Contra)
- 1600 - Equipment
- 1610 - Accumulated Depreciation - Equipment (Contra)

### Liabilities (2000-2999)
- 2000 - Accounts Payable
- 2100 - Accrued Expenses
- 2200 - Unearned Revenue
- 2300 - Loans Payable

### Equity (3000-3999)
- 3000 - Owner's Capital
- 3100 - Retained Earnings
- 3200 - Drawings

### Revenue (4000-4999)
- 4000 - Course Fee Revenue
- 4100 - Driving Session Revenue
- 4200 - License Form Fee Revenue
- 4300 - TMO Trial Fee Revenue
- 4400 - Other Revenue

### Expenses (5000-5999)
- 5000 - Fuel Expenses
- 5100 - Vehicle Maintenance
- 5200 - Instructor Salaries
- 5300 - Rent Expense
- 5400 - Utilities Expense
- 5500 - Office Supplies
- 5600 - Insurance Expense
- 5700 - Depreciation Expense
- 5800 - License and Permit Fees
- 5900 - Other Expenses

## Usage Examples

### Creating a Journal Entry

```python
from accounting.models import create_journal_entry
from decimal import Decimal
from django.utils import timezone

# Create invoice journal entry
je = create_journal_entry(
    date=timezone.now().date(),
    description='Course fee invoice',
    debit_entries=[{
        'account_code': '1200',  # Accounts Receivable
        'amount': Decimal('5000.00'),
        'narration': 'Student course fee'
    }],
    credit_entries=[{
        'account_code': '4000',  # Course Fee Revenue
        'amount': Decimal('5000.00'),
        'narration': 'Course fee revenue'
    }],
    reference_type='Invoice',
    reference_id=1
)
```

### Getting Trial Balance

```python
from accounting.models import get_trial_balance

trial_balance = get_trial_balance()
print(f"Total Debit: {trial_balance['total_debit']}")
print(f"Total Credit: {trial_balance['total_credit']}")
print(f"Balanced: {trial_balance['is_balanced']}")
```

### Getting Account Balance

```python
from accounting.models import Account

account = Account.objects.get(code='1000')
balance = account.current_balance
print(f"Cash balance: {balance}")
```

### Getting Ledger

```python
from accounting.models import get_ledger

ledger = get_ledger('1000')  # Cash account
for entry in ledger['entries']:
    print(f"{entry['date']} - {entry['particular']} - D:{entry['debit']} C:{entry['credit']} - Balance:{entry['balance']}")
```

## GraphQL Queries

### Get Trial Balance
```graphql
query {
  trialBalance(asOfDate: "2026-02-23") {
    asOfDate
    totalDebit
    totalCredit
    isBalanced
    accounts {
      accountCode
      accountName
      debit
      credit
    }
  }
}
```

### Get Balance Sheet
```graphql
query {
  balanceSheet(asOfDate: "2026-02-23") {
    asOfDate
    assets {
      total
      items {
        accountCode
        accountName
        balance
      }
    }
    liabilities {
      total
    }
    equity {
      total
    }
  }
}
```

### Create Journal Entry
```graphql
mutation {
  createJournalEntry(
    date: "2026-02-23"
    description: "Test entry"
    debitEntries: [
      {accountCode: "1000", amount: 1000, narration: "Test debit"}
    ]
    creditEntries: [
      {accountCode: "4000", amount: 1000, narration: "Test credit"}
    ]
    autoPost: true
  ) {
    journalEntry {
      entryNumber
      totalDebit
      totalCredit
      status
    }
  }
}
```

## Auto Journal Entries

The system includes automatic journal entry creation for:

1. **Invoice Creation** - When an invoice is created:
   - Debit: Accounts Receivable (1200)
   - Credit: Revenue (4000-4400 depending on type)

2. **Payment Receipt** - When payment is received:
   - Debit: Cash (1000) or Bank (1100)
   - Credit: Accounts Receivable (1200)

3. **Expense Payment** - When expense is paid:
   - Debit: Expense Account (5000-5900)
   - Credit: Cash (1000) or Bank (1100)

## Management Commands

### Initialize Chart of Accounts
```bash
python manage.py init_chart_of_accounts
```

This creates the default chart of accounts for the driving school.

## Validation & Rules

1. **Double Entry Validation**: Every journal entry must have equal debits and credits
2. **Account Validation**: Accounts must exist and be active
3. **Amount Validation**: Debit and credit amounts cannot both be positive
4. **Zero Amount Prevention**: Transaction amounts cannot be zero
5. **Balance Validation**: Trial balance must always balance (debits = credits)

## Reports Available

1. **Trial Balance** - Lists all accounts with debit/credit balances
2. **Balance Sheet** - Assets, Liabilities, and Equity as of date
3. **Income Statement** - Revenue and Expenses for period
4. **Ledger** - Detailed transaction history for each account

## Database Structure

### Accounts Table
- Stores chart of accounts hierarchy
- Supports parent-child relationships
- Tracks opening and current balances

### Journal Entries Table
- Stores journal entry headers
- Links to source documents (invoices, payments)
- Tracks posting status

### Journal Entry Lines Table
- Stores individual debit/credit lines
- Links to accounts
- Maintains line order

### Ledger Table
- Stores all posted transactions
- Maintains running balance
- Links back to journal entries for audit trail

## Integration with Existing System

The accounting system integrates with existing models:

1. **Invoice** - Auto-creates journal entry on creation
2. **Payment** - Auto-creates journal entry on receipt
3. **Student** - Links to receivables
4. **Income** - Links to revenue accounts

## Security & Permissions

All accounting models are registered with Django Admin with:
- Read-only fields for calculated values
- Fieldsets for organized data entry
- Inline editing for related records
- Filtering and search capabilities

## Testing

A test script is available at `C:\Users\prdps\desktop\dmis\test_accounting.py`

Run tests with:
```bash
python test_accounting.py
```

## Future Enhancements

Potential improvements:
1. Fiscal year management
2. Budget tracking
3. Multi-currency support
4. Automated closing entries
5. Account reconciliation
6. Audit logging
7. Report export (PDF, Excel)
8. Advanced reporting (cash flow, ratios)
9. Cost center tracking
10. Project/job costing

## Files Created/Modified

### Created:
1. `C:\Users\prdps\desktop\dmis\accounting\utils.py` - Utility functions
2. `C:\Users\prdps\desktop\dmis\accounting\management\commands\init_chart_of_accounts.py` - Management command
3. `C:\Users\prdps\desktop\dmis\accounting\management\__init__.py`
4. `C:\Users\prdps\desktop\dmis\accounting\management\commands\__init__.py`
5. `C:\Users\prdps\desktop\dmis\test_accounting.py` - Test script
6. `C:\Users\prdps\desktop\dmis\accounting\migrations\0005_account_journalentry_journalentryline_ledger_and_more.py` - Migration

### Modified:
1. `C:\Users\prdps\desktop\dmis\accounting\models.py` - Added accounting models and functions
2. `C:\Users\prdps\desktop\dmis\accounting\schema.py` - Added GraphQL queries and mutations (already existed)
3. `C:\Users\prdps\desktop\dmis\accounting\admin.py` - Added admin configurations

## Summary

A complete, production-ready double entry accounting system has been successfully implemented with:

- ✓ 4 core accounting models (Account, JournalEntry, JournalEntryLine, Ledger)
- ✓ Complete chart of accounts (30 default accounts)
- ✓ Utility functions for all accounting operations
- ✓ GraphQL API with queries and mutations
- ✓ Django Admin interface
- ✓ Automatic journal entries for invoices and payments
- ✓ Trial balance, balance sheet, and income statement
- ✓ Ledger tracking with running balances
- ✓ Full validation and error handling
- ✓ Database indexes for performance
- ✓ Management commands for initialization
- ✓ Test suite demonstrating functionality

The system is ready for use and can handle all accounting operations for the driving school management system.
