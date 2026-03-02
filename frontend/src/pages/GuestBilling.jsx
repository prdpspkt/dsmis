'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { CREATE_GUEST_INVOICE_AND_TOKEN } from '../graphql/invoiceQueries'
import { GET_ALL_TOKEN_DURATIONS, GET_ALL_INSTRUCTORS, GET_ALL_VEHICLES } from '../graphql/studentQueries'
import styles from './GuestBilling.module.css'

function GuestBilling() {
  const [formData, setFormData] = useState({
    guestName: '',
    guestAddress: '',
    guestContact: '',
    sessionDurationId: '',
    sessionDate: new Date().toISOString().split('T')[0],
    sessionStartTime: '',
    instructorId: '',
    vehicleId: '',
    amount: '',
    notes: ''
  })

  const [createdInvoice, setCreatedInvoice] = useState(null)
  const [createdToken, setCreatedToken] = useState(null)
  const [loading, setLoading] = useState(false)

  const [createGuestInvoiceAndToken] = useMutation(CREATE_GUEST_INVOICE_AND_TOKEN, {
    onCompleted: (data) => {
      setCreatedInvoice(data.createGuestInvoiceAndToken.invoice)
      setCreatedToken(data.createGuestInvoiceAndToken.token)
      setLoading(false)
      // Print automatically after creation
      setTimeout(() => handlePrint(), 500)
    },
    onError: (err) => {
      alert('Error: ' + err.message)
      setLoading(false)
    }
  })

  const { data: durationsData } = useQuery(GET_ALL_TOKEN_DURATIONS)
  const { data: instructorsData } = useQuery(GET_ALL_INSTRUCTORS)
  const { data: vehiclesData } = useQuery(GET_ALL_VEHICLES)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await createGuestInvoiceAndToken({
        variables: {
          guestName: formData.guestName,
          guestAddress: formData.guestAddress,
          guestContact: formData.guestContact,
          sessionDurationId: formData.sessionDurationId,
          sessionDate: formData.sessionDate,
          sessionStartTime: formData.sessionStartTime,
          instructorId: formData.instructorId || null,
          vehicleId: formData.vehicleId || null,
          amount: parseFloat(formData.amount),
          notes: formData.notes
        }
      })
    } catch (err) {
      console.error('Error creating guest invoice:', err)
      setLoading(false)
    }
  }

  const handlePrint = () => {
    const printContent = document.getElementById('thermal-invoice')
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${createdInvoice?.invoiceNumber}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              width: 80mm;
              padding: 5mm;
            }
            .center {
              text-align: center;
            }
            .bold {
              font-weight: bold;
            }
            .invoice-header {
              border-bottom: 1px dashed #000;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            .invoice-details {
              margin-bottom: 10px;
            }
            .invoice-details div {
              margin: 3px 0;
            }
            .invoice-items {
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
              padding: 10px 0;
              margin-bottom: 10px;
            }
            .invoice-items table {
              width: 100%;
            }
            .invoice-items td {
              padding: 3px 0;
            }
            .invoice-total {
              text-align: right;
              margin-bottom: 10px;
            }
            .invoice-footer {
              border-top: 1px dashed #000;
              padding-top: 10px;
              text-align: center;
              font-size: 10px;
            }
            .token-info {
              border: 1px solid #000;
              padding: 10px;
              margin: 10px 0;
              text-align: center;
            }
            .token-number {
              font-size: 16px;
              font-weight: bold;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }

  const handleReset = () => {
    setCreatedInvoice(null)
    setCreatedToken(null)
    setFormData({
      guestName: '',
      guestAddress: '',
      guestContact: '',
      sessionDurationId: '',
      sessionDate: new Date().toISOString().split('T')[0],
      sessionStartTime: '',
      instructorId: '',
      vehicleId: '',
      amount: '',
      notes: ''
    })
  }

  if (createdInvoice && createdToken) {
    return (
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0"><i className="fas fa-check-circle me-2"></i>Invoice Created Successfully!</h5>
              </div>
              <div className="card-body">
                {/* Thermal Printer Invoice */}
                <div id="thermal-invoice" className={styles.hidden}>
                  <div className="center">
                    <h2 className="bold">DRIVING SCHOOL</h2>
                    <p>Driving Training Institute</p>
                    <p>Phone: +91 XXXXXXXXXX</p>
                  </div>

                  <div className="invoice-header">
                    <div className="center bold">INVOICE</div>
                    <div className="center">{createdInvoice.invoiceNumber}</div>
                    <div className="center">{new Date(createdInvoice.invoiceDate).toLocaleDateString()}</div>
                  </div>

                  <div className="invoice-details">
                    <div><span className="bold">Name:</span> {createdInvoice.guestName}</div>
                    <div><span className="bold">Address:</span> {createdInvoice.guestAddress}</div>
                    {createdInvoice.guestContact && <div><span className="bold">Contact:</span> {createdInvoice.guestContact}</div>}
                  </div>

                  <div className="invoice-items">
                    <table>
                      <thead>
                        <tr className={styles.dashedBorderBottom}>
                          <th className="center">Item</th>
                          <th className="center">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Driving Session</td>
                          <td className="center">₹{createdInvoice.total}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="invoice-total">
                    <div className={`bold ${styles.receiptTotal}`}>TOTAL: ₹{createdInvoice.total}</div>
                  </div>

                  <div className="token-info">
                    <div className="bold">TOKEN</div>
                    <div className="token-number">{createdToken.tokenNumber}</div>
                    <div><strong>Date:</strong> {new Date(createdToken.date).toLocaleDateString()}</div>
                    <div><strong>Time:</strong> {createdToken.startTime} - {createdToken.endTime}</div>
                  </div>

                  <div className="invoice-footer">
                    <p>Thank you for your payment!</p>
                    <p>Visit again</p>
                  </div>
                </div>

                {/* Preview */}
                <div className={`card mb-3 ${styles.receiptPreview}`}>
                  <div className="text-center">
                    <h4 className="bold">DRIVING SCHOOL</h4>
                    <p className="mb-1">Driving Training Institute</p>
                  </div>
                  <hr />
                  <div className="text-center">
                    <strong>INVOICE</strong><br />
                    {createdInvoice.invoiceNumber}<br />
                    {new Date(createdInvoice.invoiceDate).toLocaleDateString()}
                  </div>
                  <hr />
                  <div>
                    <strong>Name:</strong> {createdInvoice.guestName}<br />
                    <strong>Address:</strong> {createdInvoice.guestAddress}<br />
                    {createdInvoice.guestContact && <><strong>Contact:</strong> {createdInvoice.guestContact}</>}
                  </div>
                  <hr />
                  <table className="table table-sm table-bordered">
                    <thead>
                      <tr><th className="text-center">Item</th><th className="text-center">Amount</th></tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Driving Session</td>
                        <td className="text-center">₹{createdInvoice.total}</td>
                      </tr>
                    </tbody>
                  </table>
                  <hr />
                  <div className="text-end">
                    <h4 className="bold">TOTAL: ₹{createdInvoice.total}</h4>
                  </div>
                  <hr />
                  <div className={`text-center p-3 ${styles.receiptBorder}`}>
                    <strong>TOKEN</strong><br />
                    <h3 className="my-2">{createdToken.tokenNumber}</h3>
                    <strong>Date:</strong> {new Date(createdToken.date).toLocaleDateString()}<br />
                    <strong>Time:</strong> {createdToken.startTime} - {createdToken.endTime}
                  </div>
                  <hr />
                  <div className="text-center">
                    <p className="mb-1">Thank you for your payment!</p>
                    <p className="mb-0">Visit again</p>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button className="btn btn-primary flex-grow-1" onClick={handlePrint}>
                    <i className="fas fa-print me-2"></i>Print Invoice
                  </button>
                  <button className="btn btn-success flex-grow-1" onClick={handleReset}>
                    <i className="fas fa-plus me-2"></i>New Guest
                  </button>
                </div>
              </div>
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
            <h2><i className="fas fa-user-clock me-2"></i>Walk-in Guest Billing</h2>
          </div>

          <div className="card">
            <div className="card-header">
              <h5 className="mb-0"><i className="fas fa-file-invoice me-2"></i>Create Guest Invoice & Token</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  {/* Guest Information */}
                  <div className="col-12 mb-3">
                    <h6 className="border-bottom pb-2"><i className="fas fa-user me-2"></i>Guest Information</h6>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.guestName}
                      onChange={(e) => setFormData({...formData, guestName: e.target.value})}
                      required
                      placeholder="Enter guest name"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Contact Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.guestContact}
                      onChange={(e) => setFormData({...formData, guestContact: e.target.value})}
                      placeholder="Enter contact number"
                    />
                  </div>

                  <div className="col-12 mb-3">
                    <label className="form-label">Address *</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={formData.guestAddress}
                      onChange={(e) => setFormData({...formData, guestAddress: e.target.value})}
                      required
                      placeholder="Enter guest address"
                    ></textarea>
                  </div>

                  {/* Session Information */}
                  <div className="col-12 mb-3">
                    <h6 className="border-bottom pb-2 mt-4"><i className="fas fa-clock me-2"></i>Session Details</h6>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Session Duration *</label>
                    <select
                      className="form-select"
                      value={formData.sessionDurationId}
                      onChange={(e) => setFormData({...formData, sessionDurationId: e.target.value})}
                      required
                    >
                      <option value="">Select Duration</option>
                      {durationsData?.allTokenDurations?.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.minutes} min)</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Amount (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      required
                      placeholder="Enter session fee"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.sessionDate}
                      onChange={(e) => setFormData({...formData, sessionDate: e.target.value})}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Start Time *</label>
                    <input
                      type="time"
                      className="form-control"
                      value={formData.sessionStartTime}
                      onChange={(e) => setFormData({...formData, sessionStartTime: e.target.value})}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Instructor (Optional)</label>
                    <select
                      className="form-select"
                      value={formData.instructorId}
                      onChange={(e) => setFormData({...formData, instructorId: e.target.value})}
                    >
                      <option value="">Select Instructor</option>
                      {instructorsData?.allInstructors?.map(i => (
                        <option key={i.id} value={i.id}>{i.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Vehicle (Optional)</label>
                    <select
                      className="form-select"
                      value={formData.vehicleId}
                      onChange={(e) => setFormData({...formData, vehicleId: e.target.value})}
                    >
                      <option value="">Select Vehicle</option>
                      {vehiclesData?.allVehicles?.filter(v => v.isActive)?.map(v => (
                        <option key={v.id} value={v.id}>{v.modelName} ({v.licensePlate})</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 mb-3">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Any additional notes"
                    ></textarea>
                  </div>

                  <div className="col-12">
                    <div className="d-flex gap-2">
                      <button
                        type="submit"
                        className="btn btn-primary flex-grow-1"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Creating...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-check-circle me-2"></i>
                            Create Invoice & Token
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={handleReset}
                      >
                        <i className="fas fa-redo me-2"></i>
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GuestBilling
