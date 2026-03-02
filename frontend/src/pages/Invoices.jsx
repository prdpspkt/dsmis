'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import Link from 'next/link'
import { GET_ALL_INVOICES, GET_INVOICE, CREATE_INVOICE, ADD_PAYMENT, UPDATE_INVOICE, DELETE_INVOICE } from '../graphql/invoiceQueries'
import { GET_ALL_STUDENTS } from '../graphql/studentQueries'
import styles from './Invoices.module.css'

function Invoices() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(null)

  // Queries
  const { data: invoicesData, refetch } = useQuery(GET_ALL_INVOICES)
  const { data: studentsData } = useQuery(GET_ALL_STUDENTS)

  // Mutations
  const [createInvoice] = useMutation(CREATE_INVOICE, {
    onCompleted: () => {
      refetch()
      setShowCreateForm(false)
      alert('Invoice created successfully!')
    },
    onError: (err) => alert('Error: ' + err.message)
  })

  const [addPayment] = useMutation(ADD_PAYMENT, {
    onCompleted: () => {
      refetch()
      setShowPaymentModal(null)
      alert('Payment added successfully!')
    },
    onError: (err) => alert('Error: ' + err.message)
  })

  const [updateInvoice] = useMutation(UPDATE_INVOICE, {
    onCompleted: () => {
      refetch()
      setSelectedInvoice(null)
      alert('Invoice updated successfully!')
    },
    onError: (err) => alert('Error: ' + err.message)
  })

  const [deleteInvoice] = useMutation(DELETE_INVOICE, {
    onCompleted: () => {
      refetch()
      alert('Invoice deleted successfully!')
    },
    onError: (err) => alert('Error: ' + err.message)
  })

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      await deleteInvoice({ variables: { id } })
    }
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'PAID': return 'bg-success'
      case 'PARTIALLY_PAID': return 'bg-warning'
      case 'SENT': return 'bg-info'
      case 'DRAFT': return 'bg-secondary'
      case 'OVERDUE': return 'bg-danger'
      case 'CANCELLED': return 'bg-dark'
      default: return 'bg-secondary'
    }
  }

  // Create Invoice Form Component
  const CreateInvoiceForm = () => {
    const [formData, setFormData] = useState({
      studentId: '',
      items: [{ description: '', quantity: 1, unit_price: 0, item_type: 'COURSE_FEE' }],
      discount: 0,
      tax: 0,
      dueDate: '',
      notes: ''
    })

    const addItem = () => {
      setFormData({
        ...formData,
        items: [...formData.items, { description: '', quantity: 1, unit_price: 0, item_type: 'OTHER' }]
      })
    }

    const removeItem = (index) => {
      const newItems = formData.items.filter((_, i) => i !== index)
      setFormData({ ...formData, items: newItems })
    }

    const updateItem = (index, field, value) => {
      const newItems = [...formData.items]
      newItems[index] = { ...newItems[index], [field]: value }
      setFormData({ ...formData, items: newItems })
    }

    const calculateTotal = () => {
      const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
      return {
        subtotal,
        total: subtotal + parseFloat(formData.tax || 0) - parseFloat(formData.discount || 0)
      }
    }

    const handleSubmit = async (e) => {
      e.preventDefault()
      const itemsJson = formData.items.map(item => JSON.stringify(item))
      await createInvoice({
        variables: {
          ...formData,
          items: itemsJson
        }
      })
    }

    const { subtotal, total } = calculateTotal()

    return (
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Create New Invoice</h5>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowCreateForm(false)}>✕</button>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Student *</label>
                <select
                  className="form-select"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  required
                >
                  <option value="">Select Student</option>
                  {studentsData?.allStudents?.map(s => (
                    <option key={s.id} value={s.id}>{s.studentId} - {s.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>

            <h6 className="mb-3">Invoice Items</h6>
            {formData.items.map((item, index) => (
              <div className="row mb-3 align-items-end" key={index}>
                <div className="col-md-4">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Course fee / Token / etc."
                    required
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    className="form-control"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                    min="1"
                    required
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Unit Price</label>
                  <input
                    type="number"
                    className="form-control"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                    step="0.01"
                    required
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Amount</label>
                  <input
                    type="text"
                    className="form-control"
                    value={`₹${(item.quantity * item.unit_price).toFixed(2)}`}
                    disabled
                  />
                </div>
                <div className="col-md-2">
                  <button
                    type="button"
                    className="btn btn-outline-danger w-100"
                    onClick={() => removeItem(index)}
                    disabled={formData.items.length === 1}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm mb-3"
              onClick={addItem}
            >
              + Add Item
            </button>

            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Discount</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) })}
                  step="0.01"
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Tax</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.tax}
                  onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) })}
                  step="0.01"
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-control"
                  rows="1"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                ></textarea>
              </div>
            </div>

            <div className="alert alert-info">
              <div className="d-flex justify-content-between">
                <span>Subtotal:</span>
                <strong>₹{subtotal.toFixed(2)}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Total:</span>
                <strong>₹{total.toFixed(2)}</strong>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCreateForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create Invoice</button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // Payment Modal Component
  const PaymentModal = ({ invoice, onClose }) => {
    const [paymentData, setPaymentData] = useState({
      amount: invoice?.dueAmount || 0,
      mode: 'CASH',
      transactionId: '',
      notes: '',
      receivedBy: ''
    })

    const handleSubmit = async (e) => {
      e.preventDefault()
      await addPayment({
        variables: {
          invoiceId: invoice.id,
          ...paymentData,
          amount: parseFloat(paymentData.amount)
        }
      })
    }

    return (
      <div className={`modal show d-block ${styles.modalBackdrop}`} tabIndex="-1">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add Payment - {invoice?.invoiceNumber}</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Amount Due: ₹{invoice?.dueAmount}</label>
                  <input
                    type="number"
                    className="form-control"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    max={invoice?.dueAmount}
                    step="0.01"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Payment Mode</label>
                  <select
                    className="form-select"
                    value={paymentData.mode}
                    onChange={(e) => setPaymentData({ ...paymentData, mode: e.target.value })}
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="ONLINE">Online Payment</option>
                    <option value="CARD">Card</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Transaction ID</label>
                  <input
                    type="text"
                    className="form-control"
                    value={paymentData.transactionId}
                    onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Received By</label>
                  <input
                    type="text"
                    className="form-control"
                    value={paymentData.receivedBy}
                    onChange={(e) => setPaymentData({ ...paymentData, receivedBy: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-control"
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  ></textarea>
                </div>
                <div className="d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
                  <button type="submit" className="btn btn-success">Add Payment</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Invoices</h2>
            <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
              + Create Invoice
            </button>
          </div>

          {showCreateForm && <CreateInvoiceForm />}
          {showPaymentModal && <PaymentModal invoice={showPaymentModal} onClose={() => setShowPaymentModal(null)} />}

          {/* Summary Cards */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card text-white bg-info">
                <div className="card-body">
                  <h6 className="card-title">Total Invoices</h6>
                  <h3>{invoicesData?.allInvoices?.length || 0}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-white bg-warning">
                <div className="card-body">
                  <h6 className="card-title">Pending</h6>
                  <h3>{invoicesData?.allInvoices?.filter(i => i.status === 'SENT' || i.status === 'PARTIALLY_PAID').length || 0}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-white bg-success">
                <div className="card-body">
                  <h6 className="card-title">Total Collected</h6>
                  <h3>₹{(invoicesData?.allInvoices?.reduce((sum, i) => sum + parseFloat(i.paidAmount), 0) || 0).toLocaleString()}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-white bg-danger">
                <div className="card-body">
                  <h6 className="card-title">Total Due</h6>
                  <h3>₹{(invoicesData?.allInvoices?.reduce((sum, i) => sum + parseFloat(i.dueAmount), 0) || 0).toLocaleString()}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">All Invoices</h5>
            </div>
            <div className="card-body">
              {invoicesData?.allInvoices?.length === 0 ? (
                <p className="text-muted text-center mb-0">No invoices found. Create your first invoice!</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Student</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Paid</th>
                        <th>Due</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoicesData?.allInvoices?.map(invoice => (
                        <tr key={invoice.id}>
                          <td><strong>{invoice.invoiceNumber}</strong></td>
                          <td>{invoice.student.fullName}</td>
                          <td>{invoice.invoiceDate}</td>
                          <td>₹{invoice.total}</td>
                          <td className="text-success">₹{invoice.paidAmount}</td>
                          <td className={invoice.dueAmount > 0 ? 'text-danger' : 'text-success'}>
                            ₹{invoice.dueAmount}
                          </td>
                          <td>
                            <span className={`badge ${getStatusClass(invoice.status)}`}>
                              {invoice.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              {invoice.dueAmount > 0 && (
                                <button
                                  className="btn btn-outline-success"
                                  onClick={() => setShowPaymentModal(invoice)}
                                  title="Add Payment"
                                >
                                  Pay
                                </button>
                              )}
                              <Link href={`/invoices/${invoice.id}`} className="btn btn-outline-primary">
                                View
                              </Link>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => handleDelete(invoice.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Invoices
