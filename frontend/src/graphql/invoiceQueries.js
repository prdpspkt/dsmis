import { gql } from '@apollo/client'

// Queries
export const GET_ALL_INVOICES = gql`
  query GetAllInvoices {
    allInvoices {
      id
      invoiceNumber
      invoiceDate
      dueDate
      subtotal
      discount
      tax
      total
      paidAmount
      dueAmount
      status
      notes
      isGuest
      guestName
      guestAddress
      guestContact
      student {
        id
        studentId
        fullName
        contact
      }
      itemsList {
        id
        description
        quantity
        unitPrice
        amount
        itemType
      }
      paymentsList {
        id
        amount
        mode
        transactionId
        paymentDate
      }
    }
  }
`

export const GET_INVOICE = gql`
  query GetInvoice($id: ID!) {
    invoice(id: $id) {
      id
      invoiceNumber
      invoiceDate
      dueDate
      subtotal
      discount
      tax
      total
      paidAmount
      dueAmount
      status
      notes
      student {
        id
        studentId
        fullName
        contact
        email
        address
      }
      itemsList {
        id
        description
        quantity
        unitPrice
        amount
        itemType
      }
      paymentsList {
        id
        amount
        mode
        transactionId
        paymentDate
        receivedBy
        notes
      }
    }
  }
`

export const GET_INVOICES_BY_STUDENT = gql`
  query GetInvoicesByStudent($studentId: ID!) {
    invoicesByStudent(studentId: $studentId) {
      id
      invoiceNumber
      invoiceDate
      total
      paidAmount
      dueAmount
      status
    }
  }
`

export const GET_INVOICES_BY_STATUS = gql`
  query GetInvoicesByStatus($status: String!) {
    invoicesByStatus(status: $status) {
      id
      invoiceNumber
      invoiceDate
      student {
        fullName
      }
      total
      paidAmount
      dueAmount
      status
    }
  }
`

// Mutations
export const CREATE_INVOICE = gql`
  mutation CreateInvoice(
    $studentId: ID!
    $items: [JSONString!]!
    $discount: Float
    $tax: Float
    $dueDate: Date
    $notes: String
  ) {
    createInvoice(
      studentId: $studentId
      items: $items
      discount: $discount
      tax: $tax
      dueDate: $dueDate
      notes: $notes
    ) {
      invoice {
        id
        invoiceNumber
        total
        dueAmount
      }
    }
  }
`

export const ADD_PAYMENT = gql`
  mutation AddPayment(
    $invoiceId: ID!
    $amount: Float!
    $mode: String
    $transactionId: String
    $notes: String
    $receivedBy: String
  ) {
    addPayment(
      invoiceId: $invoiceId
      amount: $amount
      mode: $mode
      transactionId: $transactionId
      notes: $notes
      receivedBy: $receivedBy
    ) {
      payment {
        id
        amount
        mode
      }
      invoice {
        id
        paidAmount
        dueAmount
        status
      }
    }
  }
`

export const UPDATE_INVOICE = gql`
  mutation UpdateInvoice(
    $id: ID!
    $discount: Float
    $tax: Float
    $dueDate: Date
    $status: String
    $notes: String
  ) {
    updateInvoice(
      id: $id
      discount: $discount
      tax: $tax
      dueDate: $dueDate
      status: $status
      notes: $notes
    ) {
      invoice {
        id
        invoiceNumber
        total
        dueAmount
        status
      }
    }
  }
`

export const DELETE_INVOICE = gql`
  mutation DeleteInvoice($id: ID!) {
    deleteInvoice(id: $id) {
      success
    }
  }
`

export const CREATE_GUEST_INVOICE_AND_TOKEN = gql`
  mutation CreateGuestInvoiceAndToken(
    $guestName: String!
    $guestAddress: String!
    $guestContact: String
    $sessionDurationId: ID!
    $sessionDate: Date!
    $sessionStartTime: String!
    $instructorId: ID
    $vehicleId: ID
    $amount: Float!
    $notes: String
  ) {
    createGuestInvoiceAndToken(
      guestName: $guestName
      guestAddress: $guestAddress
      guestContact: $guestContact
      sessionDurationId: $sessionDurationId
      sessionDate: $sessionDate
      sessionStartTime: $sessionStartTime
      instructorId: $instructorId
      vehicleId: $vehicleId
      amount: $amount
      notes: $notes
    ) {
      invoice {
        id
        invoiceNumber
        total
        status
        isGuest
        guestName
        guestAddress
        guestContact
        invoiceDate
      }
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
