import { gql } from '@apollo/client'

// Queries
export const GET_ALL_TOKENS = gql`
  query GetAllTokens {
    allTokens {
      id
      tokenNumber
      date
      startTime
      endTime
      status
      student {
        id
        studentId
        fullName
        contact
      }
      duration {
        id
        name
        minutes
      }
      instructor {
        id
        name
        specialization
      }
      vehicle {
        id
        modelName
        licensePlate
      }
      notes
    }
  }
`

export const GET_DAILY_SCHEDULE = gql`
  query GetDailySchedule($date: Date!) {
    dailySchedule(date: $date) {
      id
      tokenNumber
      startTime
      endTime
      status
      student {
        id
        studentId
        fullName
        course {
          name
        }
      }
      instructor {
        id
        name
      }
      vehicle {
        id
        modelName
        licensePlate
      }
    }
  }
`

export const GET_TOKENS_BY_STUDENT = gql`
  query GetTokensByStudent($studentId: ID!) {
    tokensByStudent(studentId: $studentId) {
      id
      tokenNumber
      date
      startTime
      endTime
      status
      duration {
        name
        minutes
      }
      instructor {
        name
      }
      vehicle {
        modelName
        licensePlate
      }
      notes
    }
  }
`

export const GET_ALL_TOKEN_DURATIONS = gql`
  query GetAllTokenDurations {
    allTokenDurations {
      id
      name
      minutes
    }
  }
`

// Mutations
export const CREATE_TOKEN = gql`
  mutation CreateToken(
    $studentId: ID!
    $durationId: ID!
    $date: Date!
    $startTime: String!
    $instructorId: ID
    $vehicleId: ID
    $notes: String
  ) {
    createToken(
      studentId: $studentId
      durationId: $durationId
      date: $date
      startTime: $startTime
      instructorId: $instructorId
      vehicleId: $vehicleId
      notes: $notes
    ) {
      token {
        id
        tokenNumber
        date
        startTime
        endTime
      }
    }
  }
`

export const UPDATE_TOKEN = gql`
  mutation UpdateToken(
    $id: ID!
    $startTime: String
    $instructorId: ID
    $vehicleId: ID
    $status: String
    $notes: String
  ) {
    updateToken(
      id: $id
      startTime: $startTime
      instructorId: $instructorId
      vehicleId: $vehicleId
      status: $status
      notes: $notes
    ) {
      token {
        id
        tokenNumber
        startTime
        endTime
        status
      }
    }
  }
`

export const DELETE_TOKEN = gql`
  mutation DeleteToken($id: ID!) {
    deleteToken(id: $id) {
      success
    }
  }
`

