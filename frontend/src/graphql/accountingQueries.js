import { gql } from '@apollo/client'

// GET ALL ACCOUNTS
export const GET_ALL_ACCOUNTS = gql`
  query GetAllAccounts {
    allAccounts {
      id
      code
      name
      accountType
      normalBalance
      isActive
      openingBalance
      currentBalance
      debitTotal
      creditTotal
    }
  }
`

// GET ACCOUNT BY ID
export const GET_ACCOUNT = gql`
  query GetAccount($id: ID!) {
    account(id: $id) {
      id
      code
      name
      accountType
      normalBalance
      isActive
      openingBalance
      currentBalance
      debitTotal
      creditTotal
      description
    }
  }
`

// GET ACCOUNTS BY TYPE
export const GET_ACCOUNTS_BY_TYPE = gql`
  query GetAccountsByType($accountType: String!) {
    accountsByType(accountType: $accountType) {
      id
      code
      name
      accountType
      normalBalance
      currentBalance
    }
  }
`

// GET ALL JOURNAL ENTRIES
export const GET_ALL_JOURNAL_ENTRIES = gql`
  query GetAllJournalEntries {
    allJournalEntries {
      id
      entryNumber
      date
      description
      totalDebit
      totalCredit
      status
      referenceType
      referenceId
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
`

// GET JOURNAL ENTRY BY ID
export const GET_JOURNAL_ENTRY = gql`
  query GetJournalEntry($id: ID!) {
    journalEntry(id: $id) {
      id
      entryNumber
      date
      description
      totalDebit
      totalCredit
      status
      referenceType
      referenceId
      lines {
        id
        account {
          id
          code
          name
        }
        debitAmount
        creditAmount
        narration
      }
    }
  }
`

// GET TRIAL BALANCE
export const GET_TRIAL_BALANCE = gql`
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
`

// GET BALANCE SHEET
export const GET_BALANCE_SHEET = gql`
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
`

// GET INCOME STATEMENT
export const GET_INCOME_STATEMENT = gql`
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
`

// GET ACCOUNT LEDGER
export const GET_ACCOUNT_LEDGER = gql`
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
`

// CREATE ACCOUNT
export const CREATE_ACCOUNT = gql`
  mutation CreateAccount($code: String!, $name: String!, $accountType: String!, $parentAccountId: ID, $description: String, $openingBalance: Float) {
    createAccount(
      code: $code
      name: $name
      account_type: $accountType
      parent_account_id: $parentAccountId
      description: $description
      opening_balance: $openingBalance
    ) {
      account {
        id
        code
        name
        accountType
        normalBalance
      }
    }
  }
`

// UPDATE ACCOUNT
export const UPDATE_ACCOUNT = gql`
  mutation UpdateAccount($id: ID!, $name: String, $description: String, $isActive: Boolean) {
    updateAccount(id: $id, name: $name, description: $description, is_active: $isActive) {
      account {
        id
        code
        name
        description
        isActive
      }
    }
  }
`

// CREATE JOURNAL ENTRY
export const CREATE_JOURNAL_ENTRY = gql`
  mutation CreateJournalEntry($date: Date!, $description: String!, $debitEntries: [String]!, $creditEntries: [String]!, $referenceType: String, $referenceId: ID, $autoPost: Boolean) {
    create_journal_entry(
      date: $date
      description: $description
      debit_entries: $debitEntries
      credit_entries: $creditEntries
      reference_type: $referenceType
      reference_id: $referenceId
      auto_post: $autoPost
    ) {
      journal_entry {
        id
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
    }
  }
`

// POST JOURNAL ENTRY
export const POST_JOURNAL_ENTRY = gql`
  mutation PostJournalEntry($id: ID!) {
    post_journal_entry(id: $id) {
      journal_entry {
        id
        entryNumber
        status
        postedAt
      }
    }
  }
`
