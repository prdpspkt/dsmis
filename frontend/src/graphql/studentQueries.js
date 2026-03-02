import { gql } from '@apollo/client'

// Queries
export const GET_ALL_STUDENTS = gql`
  query GetAllStudents {
    allStudents {
      id
      studentId
      firstName
      lastName
      fullName
      contact
      email
      address
      citizenshipNumber
      dateOfBirth
      status
      course {
        id
        name
        fee
        duration
      }
      instructor {
        id
        name
      }
      batchNumber
      admissionDate
      admissionFee
      feePaid
      feeDue
      photo
      totalPurchasedMinutes
      totalUsedMinutes
      remainingMinutes
      remainingHours
      progressPercentage
      isTimeCompleted
    }
  }
`

export const GET_STUDENT = gql`
  query GetStudent($id: ID!) {
    student(id: $id) {
      id
      studentId
      firstName
      lastName
      fullName
      contact
      email
      address
      citizenshipNumber
      dateOfBirth
      status
      course {
        id
        name
        fee
        duration
      }
      instructor {
        id
        name
      }
      batchNumber
      admissionDate
      admissionFee
      feePaid
      feeDue
      photo
      idProof
    }
  }
`

export const GET_STUDENTS_BY_STATUS = gql`
  query GetStudentsByStatus($status: String!) {
    studentsByStatus(status: $status) {
      id
      studentId
      fullName
      contact
      status
      course {
        name
      }
      feeDue
    }
  }
`

export const GET_ALL_COURSES = gql`
  query GetAllCourses {
    allCourses {
      id
      name
      fee
      duration
      description
    }
  }
`

export const GET_ALL_INSTRUCTORS = gql`
  query GetAllInstructors {
    allInstructors {
      id
      name
      specialization
      licenseNumber
    }
  }
`

export const GET_ALL_VEHICLES = gql`
  query GetAllVehicles {
    allVehicles {
      id
      modelName
      licensePlate
      vehicleType
      isActive
    }
  }
`

// Mutations
export const CREATE_STUDENT = gql`
  mutation CreateStudent(
    $firstName: String!
    $lastName: String!
    $address: String!
    $contact: String!
    $citizenshipNumber: String!
    $dateOfBirth: Date!
    $courseId: ID!
    $instructorId: ID
    $batchNumber: String
    $email: String
    $admissionFee: DecimalType
  ) {
    createStudent(
      firstName: $firstName
      lastName: $lastName
      address: $address
      contact: $contact
      citizenshipNumber: $citizenshipNumber
      dateOfBirth: $dateOfBirth
      courseId: $courseId
      instructorId: $instructorId
      batchNumber: $batchNumber
      email: $email
      admissionFee: $admissionFee
    ) {
      student {
        id
        studentId
        fullName
      }
    }
  }
`

export const UPDATE_STUDENT = gql`
  mutation UpdateStudent(
    $id: ID!
    $firstName: String
    $lastName: String
    $address: String
    $contact: String
    $email: String
    $batchNumber: String
    $instructorId: ID
    $status: String
    $feePaid: DecimalType
  ) {
    updateStudent(
      id: $id
      firstName: $firstName
      lastName: $lastName
      address: $address
      contact: $contact
      email: $email
      batchNumber: $batchNumber
      instructorId: $instructorId
      status: $status
      feePaid: $feePaid
    ) {
      student {
        id
        studentId
        fullName
        status
        feePaid
        feeDue
      }
    }
  }
`

export const DELETE_STUDENT = gql`
  mutation DeleteStudent($id: ID!) {
    deleteStudent(id: $id) {
      success
    }
  }
`

// Token Queries & Mutations
export const GET_DAILY_SCHEDULE = gql`
  query GetDailySchedule($date: String!) {
    dailySchedule(date: $date) {
      id
      date
      startTime
      endTime
      status
      student {
        id
        fullName
        contact
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
        fullName
        contact
      }
      duration {
        id
        name
        tokenDuration
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
      notes
    }
  }
`

export const GET_ALL_TOKEN_DURATIONS = gql`
  query GetAllTokenDurations {
    allTokenDurations {
      id
      name
      tokenDuration
      description
    }
  }
`

export const CREATE_TOKEN = gql`
  mutation CreateToken(
    $studentId: ID!
    $instructorId: ID!
    $vehicleId: ID!
    $date: Date!
    $startTime: String!
    $endTime: String!
    $notes: String
  ) {
    createToken(
      studentId: $studentId
      instructorId: $instructorId
      vehicleId: $vehicleId
      date: $date
      startTime: $startTime
      endTime: $endTime
      notes: $notes
    ) {
      token {
        id
        date
        startTime
        endTime
        status
      }
    }
  }
`

export const UPDATE_TOKEN = gql`
  mutation UpdateToken(
    $id: ID!
    $instructorId: ID
    $vehicleId: ID
    $date: Date
    $startTime: String
    $endTime: String
    $status: String
    $notes: String
  ) {
    updateToken(
      id: $id
      instructorId: $instructorId
      vehicleId: $vehicleId
      date: $date
      startTime: $startTime
      endTime: $endTime
      status: $status
      notes: $notes
    ) {
      token {
        id
        date
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
