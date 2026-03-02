import { gql } from '@apollo/client'

// Query all shareholders
export const GET_ALL_SHAREHOLDERS = gql`
  query GetAllShareholders {
    allShareholders {
      id
      name
      shareholderType
      email
      phone
      address
      panNumber
      isActive
      ownershipPercentage
      totalShares
      totalEquityContribution
      dateBecameShareholder
      createdAt
      updatedAt
      shareHoldings {
        id
        shareClass
        numberOfShares
        faceValuePerShare
        amountPaid
        issueDate
        certificateNumber
      }
    }
  }
`

// Query single shareholder
export const GET_SHAREHOLDER = gql`
  query GetShareholder($id: ID!) {
    shareholder(id: $id) {
      id
      name
      shareholderType
      email
      phone
      address
      panNumber
      isActive
      ownershipPercentage
      totalShares
      totalEquityContribution
      dateBecameShareholder
      createdAt
      updatedAt
      shareHoldings {
        id
        shareClass
        numberOfShares
        faceValuePerShare
        amountPaid
        issueDate
        certificateNumber
      }
      transactions {
        id
        shareholder {
          id
          name
        }
        transactionType
        numberOfShares
        pricePerShare
        totalAmount
        transactionDate
        notes
      }
    }
  }
`

// Create shareholder
export const CREATE_SHAREHOLDER = gql`
  mutation CreateShareholder(
    $name: String!
    $shareholderType: String!
    $email: String
    $phone: String
    $address: String
    $panNumber: String
    $dateBecameShareholder: Date!
  ) {
    createShareholder(
      name: $name
      shareholderType: $shareholderType
      email: $email
      phone: $phone
      address: $address
      panNumber: $panNumber
      dateBecameShareholder: $dateBecameShareholder
    ) {
      shareholder {
        id
        name
        shareholderType
        email
        phone
        panNumber
        dateBecameShareholder
      }
    }
  }
`

// Update shareholder
export const UPDATE_SHAREHOLDER = gql`
  mutation UpdateShareholder(
    $id: ID!
    $name: String
    $shareholderType: String
    $email: String
    $phone: String
    $address: String
    $panNumber: String
    $isActive: Boolean
  ) {
    updateShareholder(
      id: $id
      name: $name
      shareholderType: $shareholderType
      email: $email
      phone: $phone
      address: $address
      panNumber: $panNumber
      isActive: $isActive
    ) {
      shareholder {
        id
        name
        shareholderType
        email
        phone
        panNumber
        isActive
      }
    }
  }
`

// Delete shareholder
export const DELETE_SHAREHOLDER = gql`
  mutation DeleteShareholder($id: ID!) {
    deleteShareholder(id: $id) {
      success
      message
    }
  }
`

// Query share holdings
export const GET_SHARE_HOLDINGS = gql`
  query GetShareHoldings {
    allShareHoldings {
      id
      shareholder {
        id
        name
      }
      shareClass
      numberOfShares
      faceValuePerShare
      amountPaid
      issueDate
      certificateNumber
    }
  }
`

// Query share transactions
export const GET_SHARE_TRANSACTIONS = gql`
  query GetShareTransactions {
    allShareTransactions {
      id
      shareholder {
        id
        name
      }
      transactionType
      numberOfShares
      pricePerShare
      totalAmount
      transactionDate
      notes
    }
  }
`

// Add share holding
export const ADD_SHARE_HOLDING = gql`
  mutation AddShareHolding(
    $shareholderId: ID!
    $shareClass: String!
    $numberOfShares: Int!
    $faceValuePerShare: DecimalType!
    $amountPaid: DecimalType!
    $certificateNumber: String
    $issueDate: Date!
    $isFullyPaid: Boolean
    $notes: String
  ) {
    addShareHolding(
      shareholderId: $shareholderId
      shareClass: $shareClass
      numberOfShares: $numberOfShares
      faceValuePerShare: $faceValuePerShare
      amountPaid: $amountPaid
      certificateNumber: $certificateNumber
      issueDate: $issueDate
      isFullyPaid: $isFullyPaid
      notes: $notes
    ) {
      shareHolding {
        id
        shareClass
        numberOfShares
        amountPaid
        certificateNumber
      }
    }
  }
`
