import { gql } from '@apollo/client'

// Queries
export const GET_ALL_FISCAL_YEARS = gql`
  query GetAllFiscalYears {
    allFiscalYears {
      id
      name
      startDate
      endDate
      startDateBs
      endDateBs
      startDateBsLong
      endDateBsLong
      isClosed
      isCurrent
      totalRevenue
      totalExpenses
      netIncome
      notes
      createdAt
      updatedAt
      closedAt
    }
  }
`

export const GET_FISCAL_YEAR = gql`
  query GetFiscalYear($id: ID!) {
    fiscalYear(id: $id) {
      id
      name
      startDate
      endDate
      startDateBs
      endDateBs
      startDateBsLong
      endDateBsLong
      isClosed
      isCurrent
      totalRevenue
      totalExpenses
      netIncome
      notes
      createdAt
      updatedAt
      closedAt
    }
  }
`

export const GET_CURRENT_FISCAL_YEAR = gql`
  query GetCurrentFiscalYear {
    currentFiscalYear {
      id
      name
      startDate
      endDate
      startDateBs
      endDateBs
      isClosed
      isCurrent
      totalRevenue
      totalExpenses
      netIncome
      notes
    }
  }
`

// Mutations
export const CREATE_FISCAL_YEAR = gql`
  mutation CreateFiscalYear(
    $name: String!
    $startDate: Date!
    $endDate: Date!
    $notes: String
  ) {
    createFiscalYear(
      name: $name
      startDate: $startDate
      endDate: $endDate
      notes: $notes
    ) {
      fiscalYear {
        id
        name
        startDate
        endDate
        startDateBs
        endDateBs
        isClosed
        notes
      }
    }
  }
`

export const UPDATE_FISCAL_YEAR = gql`
  mutation UpdateFiscalYear(
    $id: ID!
    $name: String
    $startDate: Date
    $endDate: Date
    $notes: String
  ) {
    updateFiscalYear(
      id: $id
      name: $name
      startDate: $startDate
      endDate: $endDate
      notes: $notes
    ) {
      fiscalYear {
        id
        name
        startDate
        endDate
        startDateBs
        endDateBs
        isClosed
        notes
      }
    }
  }
`

export const CLOSE_FISCAL_YEAR = gql`
  mutation CloseFiscalYear($id: ID!) {
    closeFiscalYear(id: $id) {
      fiscalYear {
        id
        name
        isClosed
        closedAt
      }
    }
  }
`

export const DELETE_FISCAL_YEAR = gql`
  mutation DeleteFiscalYear($id: ID!) {
    deleteFiscalYear(id: $id) {
      success
    }
  }
`
