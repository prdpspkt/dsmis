import { gql } from '@apollo/client'

// Income Queries
export const GET_ALL_INCOME = gql`
  query GetAllIncome {
    allIncome {
      id
      date
      category
      amount
      description
      paymentMode
      relatedStudent {
        studentId
        fullName
      }
      invoice {
        invoiceNumber
      }
    }
  }
`

export const GET_INCOME_BY_DATE_RANGE = gql`
  query GetIncomeByDateRange($startDate: Date!, $endDate: Date!) {
    incomeByDateRange(startDate: $startDate, endDate: $endDate) {
      id
      date
      category
      amount
      paymentMode
      description
      relatedStudent {
        studentId
        fullName
      }
    }
  }
`

export const GET_DAILY_INCOME_SUMMARY = gql`
  query GetDailyIncomeSummary($startDate: Date, $endDate: Date) {
    dailyIncomeSummary(startDate: $startDate, endDate: $endDate) {
      date
      totalIncome
      admissionIncome
      sessionIncome
      otherIncome
    }
  }
`

export const GET_INCOME_BY_CATEGORY = gql`
  query GetIncomeByCategory($category: String!) {
    incomeByCategory(category: $category) {
      id
      date
      amount
      category
      description
      relatedStudent {
        fullName
      }
    }
  }
`

// Receivables Queries
export const GET_ALL_RECEIVABLES = gql`
  query GetAllReceivables {
    allReceivables {
      studentId
      studentName
      studentIdNumber
      totalDue
      invoicesCount
      overdueDays
    }
  }
`

export const GET_OVERDUE_RECEIVABLES = gql`
  query GetOverdueReceivables {
    overdueReceivables {
      studentId
      studentName
      studentIdNumber
      totalDue
      invoicesCount
      overdueDays
    }
  }
`

export const GET_AGING_REPORT = gql`
  query GetAgingReport {
    agingReport {
      studentId
      studentName
      studentIdNumber
      totalDue
      invoicesCount
      overdueDays
    }
  }
`

// Dashboard Queries
export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboardStats {
      totalStudents
      activeStudents
      totalTokensToday
      todayIncome
      pendingDues
      activeInstructors
      activeVehicles
    }
  }
`

export const GET_INSTRUCTOR_PERFORMANCE = gql`
  query GetInstructorPerformance {
    instructorPerformance {
      instructorId
      instructorName
      totalTokens
      completedTokens
      totalHours
      averageRating
      thisMonthTokens
    }
  }
`

export const GET_VEHICLE_UTILIZATION = gql`
  query GetVehicleUtilization {
    vehicleUtilization {
      vehicleId
      modelName
      licensePlate
      totalTokens
      totalHours
      utilizationRate
      thisMonthTokens
    }
  }
`

