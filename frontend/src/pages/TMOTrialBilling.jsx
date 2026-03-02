'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import styles from './TMOTrialBilling.module.css'

const GET_ALL_TMO_FEES = gql`
  query GetAllTMOFees {
    allTmoFees {
      id
      category
      feeAmount
      description
    }
  }
`

const CREATE_TMO_TRIAL_RECEIPT = gql`
  mutation CreateTMOTrialReceipt(
    $applicantName: String!
    $applicantId: String!
    $category: String!
    $paymentMode: String
  ) {
    createTmoTrialReceipt(
      applicantName: $applicantName
      applicantId: $applicantId
      category: $category
      paymentMode: $paymentMode
    ) {
      receipt {
        id
        receiptNumber
        applicantName
        applicantId
        category
        feeAmount
        receiptDate
        paymentMode
      }
    }
  }
`

function TMOTrialBilling() {
  const [formData, setFormData] = useState({
    applicantName: '',
    applicantId: '',
    category: '',
    paymentMode: 'CASH'
  })

  const [createdReceipt, setCreatedReceipt] = useState(null)
  const [loading, setLoading] = useState(false)

  const { data: feesData, loading: feesLoading } = useQuery(GET_ALL_TMO_FEES)
  const [createReceipt] = useMutation(CREATE_TMO_TRIAL_RECEIPT, {
    onCompleted: (data) => {
      setCreatedReceipt(data.createTmoTrialReceipt.receipt)
      setLoading(false)
      setTimeout(() => handlePrint(), 500)
    },
    onError: (err) => {
      alert('Error: ' + err.message)
      setLoading(false)
    }
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createReceipt({
        variables: {
          applicantName: formData.applicantName,
          applicantId: formData.applicantId,
          category: formData.category,
          paymentMode: formData.paymentMode
        }
      })
    } catch (err) {
      console.error('Error creating receipt:', err)
      setLoading(false)
    }
  }

  const handlePrint = () => {
    const printContent = document.getElementById('thermal-tmo-receipt')
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>TMO Receipt - ${createdReceipt?.receiptNumber}</title>
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
            .receipt-header {
              border-bottom: 2px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .receipt-number {
              font-size: 16px;
              font-weight: bold;
              margin: 10px 0;
            }
            .receipt-details {
              margin: 10px 0;
            }
            .receipt-details div {
              margin: 5px 0;
            }
            .receipt-amount {
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
              padding: 10px 0;
              margin: 10px 0;
            }
            .receipt-footer {
              border-top: 1px dashed #000;
              padding-top: 10px;
              text-align: center;
              font-size: 10px;
            }
            .tmo-info {
              background: #f0f0f0;
              padding: 10px;
              margin: 10px 0;
              text-align: center;
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
    setCreatedReceipt(null)
    setFormData({
      applicantName: '',
      applicantId: '',
      category: '',
      paymentMode: 'CASH'
    })
  }

  const getCategoryLabel = (category) => {
    const labels = {
      'MOTORCYCLE': 'Motorcycle',
      'SCOOTER': 'Scooter',
      'MOPED': 'Moped',
      'CAR': 'Car (LMV)',
      'HEAVY_VEHICLE': 'Heavy Vehicle',
      'TRAILER': 'Trailer'
    }
    return labels[category] || category
  }

  if (createdReceipt) {
    return (
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0"><i className="fas fa-check-circle me-2"></i>TMO Trial Receipt Created!</h5>
              </div>
              <div className="card-body">
                {/* Thermal Printer Receipt */}
                <div id="thermal-tmo-receipt" className={styles.hidden}>
                  <div className="receipt-header center">
                    <h2 className="bold">DRIVING SCHOOL</h2>
                    <p>Training Institute</p>
                  </div>

                  <div className="receipt-number center">
                    TMO TRIAL RECEIPT
                  </div>

                  <div className="center">
                    <strong>{createdReceipt.receiptNumber}</strong>
                  </div>

                  <div className="receipt-details">
                    <div><strong>Date:</strong> {new Date(createdReceipt.receiptDate).toLocaleDateString()}</div>
                    <div><strong>Applicant:</strong> {createdReceipt.applicantName}</div>
                    <div><strong>Applicant ID:</strong> {createdReceipt.applicantId}</div>
                    <div><strong>Category:</strong> {getCategoryLabel(createdReceipt.category)}</div>
                  </div>

                  <div className="receipt-amount">
                    <div className="center">
                      <small>Trial Fee</small><br/>
                      <strong className={styles.receiptAmount}>₹{createdReceipt.feeAmount}</strong>
                    </div>
                  </div>

                  <div className="tmo-info">
                    <div><strong>TRANSPORT MANAGEMENT OFFICE</strong></div>
                    <div>Trial Test Fee</div>
                  </div>

                  <div className="receipt-footer">
                    <p><strong>Payment Mode:</strong> {createdReceipt.paymentMode}</p>
                    <p className="mb-1">Receipt is valid for TMO Trial Test</p>
                    <p className="mb-0">Thank you!</p>
                  </div>
                </div>

                {/* Preview */}
                <div className={`card mb-3 ${styles.receiptPreview}`}>
                  <div className="text-center">
                    <h4 className="bold">DRIVING SCHOOL</h4>
                    <p className="mb-1">Training Institute</p>
                  </div>
                  <hr />
                  <div className="text-center">
                    <strong>TMO TRIAL RECEIPT</strong><br/>
                    <strong>{createdReceipt.receiptNumber}</strong><br/>
                    {new Date(createdReceipt.receiptDate).toLocaleDateString()}
                  </div>
                  <hr />
                  <div>
                    <strong>Applicant:</strong> {createdReceipt.applicantName}<br/>
                    <strong>Applicant ID:</strong> {createdReceipt.applicantId}<br/>
                    <strong>Category:</strong> {getCategoryLabel(createdReceipt.category)}
                  </div>
                  <hr />
                  <div className={`text-center p-3 ${styles.receiptBorder}`}>
                    <small>TRIAL FEE</small><br/>
                    <h3 className="my-2">₹{createdReceipt.feeAmount}</h3>
                  </div>
                  <hr />
                  <div className="text-center p-3 bg-light">
                    <strong>TRANSPORT MANAGEMENT OFFICE</strong><br/>
                    Trial Test Fee
                  </div>
                  <hr />
                  <div className="text-center">
                    <p className="mb-1"><strong>Payment Mode:</strong> {createdReceipt.paymentMode}</p>
                    <p className="mb-1">Receipt is valid for TMO Trial Test</p>
                    <p className="mb-0">Thank you!</p>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button className="btn btn-primary flex-grow-1" onClick={handlePrint}>
                    <i className="fas fa-print me-2"></i>Print Receipt
                  </button>
                  <button className="btn btn-success flex-grow-1" onClick={handleReset}>
                    <i className="fas fa-plus me-2"></i>New Receipt
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
            <h2><i className="fas fa-file-invoice me-2"></i>TMO Trial Billing</h2>
          </div>

          <div className="card">
            <div className="card-header">
              <h5 className="mb-0"><i className="fas fa-file-alt me-2"></i>Create TMO Trial Receipt</h5>
            </div>
            <div className="card-body">
              {feesLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border" role="status"></div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-12 mb-3">
                      <h6 className="border-bottom pb-2"><i className="fas fa-user me-2"></i>Applicant Information</h6>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Applicant Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.applicantName}
                        onChange={(e) => setFormData({...formData, applicantName: e.target.value})}
                        required
                        placeholder="Enter applicant name"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Applicant ID *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.applicantId}
                        onChange={(e) => setFormData({...formData, applicantId: e.target.value})}
                        required
                        placeholder="Enter applicant ID"
                      />
                    </div>

                    <div className="col-12 mb-3">
                      <h6 className="border-bottom pb-2 mt-4"><i className="fas fa-car me-2"></i>Trial Category</h6>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Vehicle Category *</label>
                      <select
                        className="form-select"
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        required
                      >
                        <option value="">Select Category</option>
                        {feesData?.allTmoFees?.map(fee => (
                          <option key={fee.id} value={fee.category}>
                            {getCategoryLabel(fee.category)} - ₹{fee.feeAmount}
                          </option>
                        ))}
                      </select>
                      {formData.category && (
                        <small className="text-success">
                          Fee: ₹{feesData?.allTmoFees?.find(f => f.category === formData.category)?.feeAmount}
                        </small>
                      )}
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Payment Mode</label>
                      <select
                        className="form-select"
                        value={formData.paymentMode}
                        onChange={(e) => setFormData({...formData, paymentMode: e.target.value})}
                      >
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="CARD">Card</option>
                        <option value="ONLINE">Online</option>
                      </select>
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
                              Generate Receipt
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
              )}
            </div>
          </div>

          {/* Fee Info Card */}
          <div className="card mt-4">
            <div className="card-header">
              <h6 className="mb-0"><i className="fas fa-info-circle me-2"></i>TMO Trial Fee Structure</h6>
            </div>
            <div className="card-body">
              <div className="row">
                {feesData?.allTmoFees?.map(fee => (
                  <div key={fee.id} className="col-md-4 col-sm-6 mb-2">
                    <div className="card text-center">
                      <div className="card-body p-2">
                        <h6 className="mb-1">{getCategoryLabel(fee.category)}</h6>
                        <strong className="text-primary">₹{fee.feeAmount}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TMOTrialBilling
