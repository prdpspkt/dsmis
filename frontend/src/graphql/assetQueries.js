import { gql } from '@apollo/client'

// Query all assets
export const GET_ALL_ASSETS = gql`
  query GetAllAssets {
    allAssets {
      id
      name
      assetType
      description
      purchaseDate
      purchasePrice
      currentValue
      depreciationRate
      usefulLife
      status
      location
      reevaluationDate
    }
  }
`

// Query single asset
export const GET_ASSET = gql`
  query GetAsset($id: ID!) {
    asset(id: $id) {
      id
      name
      assetType
      description
      purchaseDate
      purchasePrice
      currentValue
      depreciationRate
      usefulLife
      status
      location
      reevaluationDate
      reevaluationHistory {
        id
        previousValue
        newValue
        reevaluationDate
        reason
        evaluatedBy {
          username
        }
      }
    }
  }
`

// Create asset
export const CREATE_ASSET = gql`
  mutation CreateAsset(
    $name: String!
    $assetType: String!
    $description: String
    $purchaseDate: Date!
    $purchasePrice: DecimalType!
    $depreciationRate: DecimalType
    $usefulLife: Int
    $status: String
    $location: String
  ) {
    createAsset(
      name: $name
      assetType: $assetType
      description: $description
      purchaseDate: $purchaseDate
      purchasePrice: $purchasePrice
      depreciationRate: $depreciationRate
      usefulLife: $usefulLife
      status: $status
      location: $location
    ) {
      asset {
        id
        name
        assetType
        purchasePrice
        currentValue
      }
    }
  }
`

// Update asset
export const UPDATE_ASSET = gql`
  mutation UpdateAsset(
    $id: ID!
    $name: String
    $assetType: String
    $description: String
    $purchaseDate: Date
    $purchasePrice: DecimalType
    $depreciationRate: DecimalType
    $usefulLife: Int
    $status: String
    $location: String
  ) {
    updateAsset(
      id: $id
      name: $name
      assetType: $assetType
      description: $description
      purchaseDate: $purchaseDate
      purchasePrice: $purchasePrice
      depreciationRate: $depreciationRate
      usefulLife: $usefulLife
      status: $status
      location: $location
    ) {
      asset {
        id
        name
        assetType
        purchasePrice
        currentValue
      }
    }
  }
`

// Delete asset
export const DELETE_ASSET = gql`
  mutation DeleteAsset($id: ID!) {
    deleteAsset(id: $id) {
      success
      message
    }
  }
`

// Reevaluate asset
export const REEVALUATE_ASSET = gql`
  mutation ReevaluateAsset(
    $id: ID!
    $newValue: DecimalType!
    $reason: String!
  ) {
    reevaluateAsset(
      id: $id
      newValue: $newValue
      reason: $reason
    ) {
      asset {
        id
        name
        currentValue
        reevaluationDate
      }
    }
  }
`

// Calculate depreciation
export const CALCULATE_DEPRECIATION = gql`
  query CalculateDepreciation($id: ID!) {
    calculateDepreciation(id: $id) {
      asset {
        id
        name
        currentValue
        accumulatedDepreciation
        netBookValue
      }
      depreciationAmount
      remainingLife
    }
  }
`
