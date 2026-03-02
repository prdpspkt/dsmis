import { gql } from '@apollo/client'

// Session Duration Queries
export const GET_ALL_TOKEN_DURATIONS = gql`
  query GetAllTokenDurations {
    allTokenDurations {
      id
      name
      minutes
      isActive
    }
  }
`

export const CREATE_TOKEN_DURATION = gql`
  mutation CreateTokenDuration($name: String!, $minutes: Int!) {
    createTokenDuration(name: $name, minutes: $minutes) {
      duration {
        id
        name
        minutes
        isActive
      }
    }
  }
`

export const UPDATE_TOKEN_DURATION = gql`
  mutation UpdateTokenDuration($id: ID!, $name: String, $minutes: Int, $isActive: Boolean) {
    updateTokenDuration(id: $id, name: $name, minutes: $minutes, isActive: $isActive) {
      duration {
        id
        name
        minutes
        isActive
      }
    }
  }
`

export const DELETE_TOKEN_DURATION = gql`
  mutation DeleteTokenDuration($id: ID!) {
    deleteTokenDuration(id: $id) {
      success
    }
  }
`

// TMO Fee Queries
export const GET_ALL_TMO_FEES = gql`
  query GetAllTMOFees {
    allTmoFees {
      id
      category
      feeAmount
      description
      isActive
      effectiveFrom
    }
  }
`

export const CREATE_TMO_FEE = gql`
  mutation CreateTMOFee($category: String!, $feeAmount: Float!, $description: String) {
    createTmoFee(category: $category, feeAmount: $feeAmount, description: $description) {
      fee {
        id
        category
        feeAmount
        description
        isActive
      }
    }
  }
`

export const UPDATE_TMO_FEE = gql`
  mutation UpdateTMOFee($id: ID!, $feeAmount: Float, $description: String, $isActive: Boolean) {
    updateTmoFee(id: $id, feeAmount: $feeAmount, description: $description, isActive: $isActive) {
      fee {
        id
        category
        feeAmount
        description
        isActive
      }
    }
  }
`

export const DELETE_TMO_FEE = gql`
  mutation DeleteTMOFee($id: ID!) {
    deleteTmoFee(id: $id) {
      success
    }
  }
`

// Course Package Queries
export const GET_ALL_COURSE_PACKAGES = gql`
  query GetAllCoursePackages {
    allCoursePackages {
      id
      name
      packageType
      course {
        id
        name
      }
      totalSessions
      sessionDuration {
        id
        name
        minutes
      }
      fee
      description
      includesLicenseFee
      includesMaterials
      validityDays
      isActive
    }
  }
`

export const GET_ACTIVE_COURSE_PACKAGES = gql`
  query GetActiveCoursePackages {
    activeCoursePackages {
      id
      name
      packageType
      course {
        id
        name
      }
      totalSessions
      sessionDuration {
        id
        name
        minutes
      }
      fee
      description
      includesLicenseFee
      includesMaterials
      validityDays
      isActive
    }
  }
`

export const CREATE_COURSE_PACKAGE = gql`
  mutation CreateCoursePackage(
    $name: String!,
    $packageType: String,
    $courseId: ID!,
    $totalSessions: Int!,
    $sessionDurationId: ID!,
    $fee: Float!,
    $description: String,
    $includesLicenseFee: Boolean,
    $includesMaterials: Boolean,
    $validityDays: Int
  ) {
    createCoursePackage(
      name: $name,
      packageType: $packageType,
      courseId: $courseId,
      totalSessions: $totalSessions,
      sessionDurationId: $sessionDurationId,
      fee: $fee,
      description: $description,
      includesLicenseFee: $includesLicenseFee,
      includesMaterials: $includesMaterials,
      validityDays: $validityDays
    ) {
      coursePackage {
        id
        name
        packageType
        course {
          id
          name
        }
        totalSessions
        sessionDuration {
          id
          name
          minutes
        }
        fee
        description
        includesLicenseFee
        includesMaterials
        validityDays
        isActive
      }
    }
  }
`

export const UPDATE_COURSE_PACKAGE = gql`
  mutation UpdateCoursePackage(
    $id: ID!,
    $name: String,
    $packageType: String,
    $courseId: ID,
    $totalSessions: Int,
    $sessionDurationId: ID,
    $fee: Float,
    $description: String,
    $includesLicenseFee: Boolean,
    $includesMaterials: Boolean,
    $validityDays: Int,
    $isActive: Boolean
  ) {
    updateCoursePackage(
      id: $id,
      name: $name,
      packageType: $packageType,
      courseId: $courseId,
      totalSessions: $totalSessions,
      sessionDurationId: $sessionDurationId,
      fee: $fee,
      description: $description,
      includesLicenseFee: $includesLicenseFee,
      includesMaterials: $includesMaterials,
      validityDays: $validityDays,
      isActive: $isActive
    ) {
      coursePackage {
        id
        name
        packageType
        course {
          id
          name
        }
        totalSessions
        sessionDuration {
          id
          name
          minutes
        }
        fee
        description
        includesLicenseFee
        includesMaterials
        validityDays
        isActive
      }
    }
  }
`

export const DELETE_COURSE_PACKAGE = gql`
  mutation DeleteCoursePackage($id: ID!) {
    deleteCoursePackage(id: $id) {
      success
    }
  }
`

// Guest Package Queries
export const GET_ALL_GUEST_PACKAGES = gql`
  query GetAllGuestPackages {
    allGuestPackages {
      id
      name
      packageType
      vehicleType
      totalSessions
      sessionDuration {
        id
        name
        minutes
      }
      fee
      description
      validityDays
      isActive
    }
  }
`

export const GET_ACTIVE_GUEST_PACKAGES = gql`
  query GetActiveGuestPackages {
    activeGuestPackages {
      id
      name
      packageType
      vehicleType
      totalSessions
      sessionDuration {
        id
        name
        minutes
      }
      fee
      description
      validityDays
      isActive
    }
  }
`

export const CREATE_GUEST_PACKAGE = gql`
  mutation CreateGuestPackage(
    $name: String!,
    $packageType: String,
    $vehicleType: String!,
    $totalSessions: Int!,
    $sessionDurationId: ID!,
    $fee: Float!,
    $description: String,
    $validityDays: Int
  ) {
    createGuestPackage(
      name: $name,
      packageType: $packageType,
      vehicleType: $vehicleType,
      totalSessions: $totalSessions,
      sessionDurationId: $sessionDurationId,
      fee: $fee,
      description: $description,
      validityDays: $validityDays
    ) {
      guestPackage {
        id
        name
        packageType
        vehicleType
        totalSessions
        sessionDuration {
          id
          name
          minutes
        }
        fee
        description
        validityDays
        isActive
      }
    }
  }
`

export const UPDATE_GUEST_PACKAGE = gql`
  mutation UpdateGuestPackage(
    $id: ID!,
    $name: String,
    $packageType: String,
    $vehicleType: String,
    $totalSessions: Int,
    $sessionDurationId: ID,
    $fee: Float,
    $description: String,
    $validityDays: Int,
    $isActive: Boolean
  ) {
    updateGuestPackage(
      id: $id,
      name: $name,
      packageType: $packageType,
      vehicleType: $vehicleType,
      totalSessions: $totalSessions,
      sessionDurationId: $sessionDurationId,
      fee: $fee,
      description: $description,
      validityDays: $validityDays,
      isActive: $isActive
    ) {
      guestPackage {
        id
        name
        packageType
        vehicleType
        totalSessions
        sessionDuration {
          id
          name
          minutes
        }
        fee
        description
        validityDays
        isActive
      }
    }
  }
`

export const DELETE_GUEST_PACKAGE = gql`
  mutation DeleteGuestPackage($id: ID!) {
    deleteGuestPackage(id: $id) {
      success
    }
  }
`

// Get courses for dropdown
export const GET_ALL_COURSES = gql`
  query GetAllCourses {
    allCourses {
      id
      name
    }
  }
`
