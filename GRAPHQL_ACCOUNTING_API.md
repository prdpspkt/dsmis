# GraphQL Accounting API Reference

## Base URL
```
http://localhost:8000/graphql/
```

## Queries

### Chart of Accounts

#### Get All Accounts
```graphql
query GetAllAccounts {
  allAccounts {
    id
    code
    name
    accountType
    normalBalance
    isActive
    currentBalance
    openingBalance
  }
}
```

#### Get Account by ID
```graphql
query GetAccount($id: ID!) {
  account(id: $id) {
    id
    code
    name
    accountType
    normalBalance
    currentBalance
    debitTotal
    creditTotal
    description
  }
}
```

#### Get Accounts by Type
```graphql
query GetAccountsByType($type: String!) {
  accountsByType(accountType: $type) {
    id
    code
    name
    accountType
    currentBalance
  }
}
```

### Journal Entries

#### Get All Journal Entries
```graphql
query GetAllJournalEntries {
  allJournalEntries {
    id
    entryNumber
    date
    description
    totalDebit
    totalCredit
    status
    createdBy {
      username
    }
    createdAt
    lines {
      id
      account {
        code
        name
      }
      debitAmount
      creditAmount
      narration
    }
  }
}
```

#### Get Journal Entry by ID
```graphql
query GetJournalEntry($id: ID!) {
  journalEntry(id: $id) {
    id
    entryNumber
    date
    description
    referenceType
    referenceId
    status
    totalDebit
    totalCredit
    lines {
      account {
        code
        name
      }
      debitAmount
      creditAmount
      narration
    }
  }
}
```

#### Get Journal Entries by Date Range
```graphql
query GetJournalEntriesByDate($startDate: Date!, $endDate: Date!) {
  journalEntriesByDate(startDate: $startDate, endDate: $endDate) {
    entryNumber
    date
    description
    totalDebit
    totalCredit
    status
  }
}
```

### Reports

#### Get Trial Balance
```graphql
query GetTrialBalance($asOfDate: Date) {
  trialBalance(asOfDate: $asOfDate) {
    asOfDate
    totalDebit
    totalCredit
    isBalanced
    accounts {
      accountCode
      accountName
      accountType
      debit
      credit
      balance
    }
  }
}
```

#### Get Balance Sheet
```graphql
query GetBalanceSheet($asOfDate: Date) {
  balanceSheet(asOfDate: $asOfDate) {
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
      items {
        accountCode
        accountName
        balance
      }
    }
    equity {
      total
      items {
        accountCode
        accountName
        balance
      }
    }
    totalLiabilitiesEquity
    isBalanced
  }
}
```

#### Get Income Statement
```graphql
query GetIncomeStatement($startDate: Date!, $endDate: Date!) {
  incomeStatement(startDate: $startDate, endDate: $endDate) {
    startDate
    endDate
    revenue {
      total
      items {
        accountCode
        accountName
        amount
      }
    }
    expenses {
      total
      items {
        accountCode
        accountName
        amount
      }
    }
    netIncome
  }
}
```

#### Get Account Ledger
```graphql
query GetAccountLedger($accountCode: String!, $asOfDate: Date) {
  accountLedger(accountCode: $accountCode, asOfDate: $asOfDate) {
    accountCode
    accountName
    accountType
    currentBalance
    entries {
      date
      particular
      voucherType
      voucherNumber
      debit
      credit
      balance
    }
  }
}
```

#### Get All Ledger Entries
```graphql
query GetAllLedgerEntries {
  allLedgerEntries {
    id
    account {
      code
      name
    }
    date
    particular
    debitAmount
    creditAmount
    balance
    voucherType
    voucherNumber
  }
}
```

## Mutations

### Create Account
```graphql
mutation CreateAccount($input: CreateAccountInput!) {
  createAccount(
    code: $input.code
    name: $input.name
    accountType: $input.accountType
    parentAccountId: $input.parentAccountId
    description: $input.description
    openingBalance: $input.openingBalance
  ) {
    account {
      id
      code
      name
      accountType
      normalBalance
    }
    success
    errors
  }
}
```

Example variables:
```json
{
  "input": {
    "code": "6000",
    "name": "New Account",
    "accountType": "EXPENSE",
    "description": "A new expense account",
    "openingBalance": 0
  }
}
```

### Update Account
```graphql
mutation UpdateAccount($id: ID!, $name: String, $description: String, $isActive: Boolean) {
  updateAccount(
    id: $id
    name: $name
    description: $description
    isActive: $isActive
  ) {
    account {
      id
      code
      name
      description
      isActive
    }
    success
    errors
  }
}
```

### Create Journal Entry
```graphql
mutation CreateJournalEntry($input: CreateJournalEntryInput!) {
  createJournalEntry(
    date: $input.date
    description: $input.description
    debitEntries: $input.debitEntries
    creditEntries: $input.creditEntries
    referenceType: $input.referenceType
    referenceId: $input.referenceId
    autoPost: $input.autoPost
  ) {
    journalEntry {
      entryNumber
      date
      description
      totalDebit
      totalCredit
      status
      lines {
        account {
          code
          name
        }
        debitAmount
        creditAmount
        narration
      }
    }
    success
    errors
  }
}
```

Example variables:
```json
{
  "input": {
    "date": "2026-02-23",
    "description": "Course fee payment",
    "debitEntries": [
      {
        "accountCode": "1000",
        "amount": 5000,
        "narration": "Cash received for course fee"
      }
    ],
    "creditEntries": [
      {
        "accountCode": "4000",
        "amount": 5000,
        "narration": "Course fee revenue"
      }
    ],
    "referenceType": "Invoice",
    "referenceId": 1,
    "autoPost": true
  }
}
```

### Post Journal Entry
```graphql
mutation PostJournalEntry($id: ID!) {
  postJournalEntry(id: $id) {
    journalEntry {
      id
      entryNumber
      status
      postedAt
    }
    success
    errors
  }
}
```

## Account Types

Valid account types:
- `ASSET` - Assets (1000-1999)
- `LIABILITY` - Liabilities (2000-2999)
- `EQUITY` - Equity (3000-3999)
- `REVENUE` - Revenue (4000-4999)
- `EXPENSE` - Expenses (5000-5999)

## Journal Entry Status

Valid status values:
- `DRAFT` - Not yet posted
- `POSTED` - Posted to ledger
- `CANCELLED` - Cancelled entry

## Error Handling

All mutations return a `success` boolean and `errors` array:

```json
{
  "data": {
    "createJournalEntry": {
      "success": false,
      "errors": ["Debit total does not equal credit total"]
    }
  }
}
```

## Common Use Cases

### 1. Record Invoice
```graphql
mutation RecordInvoice {
  createJournalEntry(
    date: "2026-02-23"
    description: "Invoice INV2026020001"
    debitEntries: [{
      accountCode: "1200"
      amount: 5000
      narration: "Course fee - Student John Doe"
    }]
    creditEntries: [{
      accountCode: "4000"
      amount: 5000
      narration: "Course fee revenue"
    }]
    referenceType: "Invoice"
    referenceId: 1
    autoPost: true
  ) {
    journalEntry {
      entryNumber
    }
  }
}
```

### 2. Record Payment
```graphql
mutation RecordPayment {
  createJournalEntry(
    date: "2026-02-23"
    description: "Payment received"
    debitEntries: [{
      accountCode: "1000"
      amount: 3000
      narration: "Cash payment"
    }]
    creditEntries: [{
      accountCode: "1200"
      amount: 3000
      narration: "Payment received"
    }]
    referenceType: "Payment"
    referenceId: 1
    autoPost: true
  ) {
    journalEntry {
      entryNumber
    }
  }
}
```

### 3. Record Expense
```graphql
mutation RecordExpense {
  createJournalEntry(
    date: "2026-02-23"
    description: "Fuel expense"
    debitEntries: [{
      accountCode: "5000"
      amount: 2000
      narration: "Fuel for vehicles"
    }]
    creditEntries: [{
      accountCode: "1000"
      amount: 2000
      narration: "Cash payment"
    }]
    referenceType: "Expense"
    autoPost: true
  ) {
    journalEntry {
      entryNumber
    }
  }
}
```

### 4. Check Account Balance
```graphql
query CheckBalance {
  account(id: "1") {
    code
    name
    currentBalance
    debitTotal
    creditTotal
  }
}
```

### 5. View Trial Balance
```graphql
query ViewTrialBalance {
  trialBalance {
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

### 6. View Account Ledger
```graphql
query ViewLedger {
  accountLedger(accountCode: "1000") {
    accountName
    currentBalance
    entries {
      date
      particular
      debit
      credit
      balance
      voucherType
      voucherNumber
    }
  }
}
```

## Date Format

All dates should be in `YYYY-MM-DD` format:
```
2026-02-23
```

## Amount Format

All amounts should be in decimal format (no currency symbol):
```
5000.00
```

The system uses Indian Rupee (₹) as the default currency.
