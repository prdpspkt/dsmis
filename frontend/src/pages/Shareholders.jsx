'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { GET_ALL_SHAREHOLDERS, CREATE_SHAREHOLDER, UPDATE_SHAREHOLDER, DELETE_SHAREHOLDER, ADD_SHARE_HOLDING } from '../graphql/shareholderQueries'
import { GET_SHARE_HOLDINGS } from '../graphql/shareholderQueries'

function Shareholders() {
  const [showModal, setShowModal] = useState(false)
  const [editingShareholder, setEditingShareholder] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    shareholderType: 'INDIVIDUAL',
    email: '',
    phone: '',
    address: '',
    panNumber: '',
    dateBecameShareholder: new Date().toISOString().split('T')[0],
    isActive: true,
    // Share holding fields
    shareClass: 'EQUITY',
    numberOfShares: '',
    faceValuePerShare: '',
    amountPaid: '',
    certificateNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    isFullyPaid: true
  })

  const { data, loading, refetch } = useQuery(GET_ALL_SHAREHOLDERS)
  const { data: holdingsData } = useQuery(GET_SHARE_HOLDINGS)

  const [createShareholder] = useMutation(CREATE_SHAREHOLDER)
  const [addShareHolding] = useMutation(ADD_SHARE_HOLDING, {
    onCompleted: () => {
      refetch()
      handleCloseModal()
    }
  })

  const [updateShareholder] = useMutation(UPDATE_SHAREHOLDER, {
    onCompleted: () => {
      refetch()
      handleCloseModal()
    }
  })

  const [deleteShareholder] = useMutation(DELETE_SHAREHOLDER, {
    onCompleted: () => {
      refetch()
    }
  })

  const handleOpenModal = (shareholder = null) => {
    if (shareholder) {
      setEditingShareholder(shareholder)
      setFormData({
        name: shareholder.name,
        shareholderType: shareholder.shareholderType,
        email: shareholder.email || '',
        phone: shareholder.phone || '',
        address: shareholder.address || '',
        panNumber: shareholder.panNumber || '',
        dateBecameShareholder: shareholder.dateBecameShareholder,
        isActive: shareholder.isActive,
        // Share holding fields
        shareClass: 'EQUITY',
        numberOfShares: '',
        faceValuePerShare: '',
        amountPaid: '',
        certificateNumber: '',
        issueDate: new Date().toISOString().split('T')[0],
        isFullyPaid: true
      })
    } else {
      setEditingShareholder(null)
      setFormData({
        name: '',
        shareholderType: 'INDIVIDUAL',
        email: '',
        phone: '',
        address: '',
        panNumber: '',
        dateBecameShareholder: new Date().toISOString().split('T')[0],
        isActive: true,
        // Share holding fields
        shareClass: 'EQUITY',
        numberOfShares: '',
        faceValuePerShare: '',
        amountPaid: '',
        certificateNumber: '',
        issueDate: new Date().toISOString().split('T')[0],
        isFullyPaid: true
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingShareholder(null)
    setFormData({
      name: '',
      shareholderType: 'INDIVIDUAL',
      email: '',
      phone: '',
      address: '',
      panNumber: '',
      dateBecameShareholder: new Date().toISOString().split('T')[0],
      isActive: true,
      // Share holding fields
      shareClass: 'EQUITY',
      numberOfShares: '',
      faceValuePerShare: '',
      amountPaid: '',
      certificateNumber: '',
      issueDate: new Date().toISOString().split('T')[0],
      isFullyPaid: true
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (editingShareholder) {
      // Update existing shareholder
      await updateShareholder({
        variables: {
          id: editingShareholder.id,
          name: formData.name,
          shareholderType: formData.shareholderType,
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null,
          panNumber: formData.panNumber || null,
          isActive: formData.isActive
        }
      })
    } else {
      // Create new shareholder with share holding
      const shareholderResult = await createShareholder({
        variables: {
          name: formData.name,
          shareholderType: formData.shareholderType,
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null,
          panNumber: formData.panNumber || null,
          dateBecameShareholder: formData.dateBecameShareholder
        }
      })

      // Add share holding if share data is provided
      if (formData.numberOfShares && formData.amountPaid) {
        const shareholderId = shareholderResult.data.createShareholder.shareholder.id
        await addShareHolding({
          variables: {
            shareholderId: shareholderId,
            shareClass: formData.shareClass,
            numberOfShares: parseInt(formData.numberOfShares),
            faceValuePerShare: parseFloat(formData.faceValuePerShare || 0),
            amountPaid: parseFloat(formData.amountPaid),
            certificateNumber: formData.certificateNumber || null,
            issueDate: formData.issueDate,
            isFullyPaid: formData.isFullyPaid
          }
        })
      } else {
        refetch()
        handleCloseModal()
      }
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this shareholder?')) {
      await deleteShareholder({ variables: { id } })
    }
  }

  const formatShareholderType = (type) => {
    return type.charAt(0) + type.slice(1).toLowerCase()
  }

  if (loading) {
    return <div className="text-center mt-5"><div className="spinner-border" role="status"></div></div>
  }

  const shareholders = data?.allShareholders?.filter(s => s != null) || []

  // Calculate totals
  const totalShares = shareholders.reduce((sum, s) => sum + (s.totalShares || 0), 0)
  const totalInvestment = shareholders.reduce((sum, s) => sum + (s.totalEquityContribution || 0), 0)
  const activeShareholders = shareholders.filter(s => s.isActive).length

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Shareholder Management</h2>
          <p className="text-muted mb-0">Manage shareholders and their equity holdings</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <i className="fas fa-plus me-2"></i>Add Shareholder
        </button>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="info-box bg-info">
            <span className="info-box-icon"><i className="fas fa-users"></i></span>
            <div className="info-box-content">
              <span className="info-box-text">Total Shareholders</span>
              <span className="info-box-number">{shareholders.length}</span>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="info-box bg-success">
            <span className="info-box-icon"><i className="fas fa-user-check"></i></span>
            <div className="info-box-content">
              <span className="info-box-text">Active Shareholders</span>
              <span className="info-box-number">{activeShareholders}</span>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="info-box bg-warning">
            <span className="info-box-icon"><i className="fas fa-certificate"></i></span>
            <div className="info-box-content">
              <span className="info-box-text">Total Shares</span>
              <span className="info-box-number">{totalShares.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="info-box bg-primary">
            <span className="info-box-icon"><i className="fas fa-rupee-sign"></i></span>
            <div className="info-box-content">
              <span className="info-box-text">Total Investment</span>
              <span className="info-box-number">₹{totalInvestment.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shareholders Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title mb-0">All Shareholders</h3>
        </div>
        <div className="card-body">
          {shareholders.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>PAN Number</th>
                    <th>Shares</th>
                    <th>Ownership %</th>
                    <th>Investment</th>
                    <th>Status</th>
                    <th>Join Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shareholders.map((shareholder) => (
                    <tr key={shareholder.id}>
                      <td>
                        <strong>{shareholder.name}</strong>
                        {shareholder.email && <br />}
                        {shareholder.email && <small className="text-muted">{shareholder.email}</small>}
                      </td>
                      <td>
                        <span className={`badge ${shareholder.shareholderType === 'INDIVIDUAL' ? 'bg-primary' : 'bg-info'}`}>
                          {formatShareholderType(shareholder.shareholderType)}
                        </span>
                      </td>
                      <td>{shareholder.panNumber || '-'}</td>
                      <td>{shareholder.totalShares?.toLocaleString() || 0}</td>
                      <td>
                        <strong>{shareholder.ownershipPercentage?.toFixed(2) || 0}%</strong>
                      </td>
                      <td>₹{shareholder.totalEquityContribution?.toLocaleString() || 0}</td>
                      <td>
                        <span className={`badge ${shareholder.isActive ? 'bg-success' : 'bg-danger'}`}>
                          {shareholder.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{new Date(shareholder.dateBecameShareholder).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-info me-1"
                          onClick={() => handleOpenModal(shareholder)}
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(shareholder.id)}
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="fas fa-users fa-3x text-muted mb-3"></i>
              <p className="text-muted">No shareholders found. Add your first shareholder to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingShareholder ? 'Edit Shareholder' : 'Add New Shareholder'}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Name <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Type <span className="text-danger">*</span></label>
                        <select
                          className="form-select"
                          value={formData.shareholderType}
                          onChange={(e) => setFormData({ ...formData, shareholderType: e.target.value })}
                          required
                        >
                          <option value="INDIVIDUAL">Individual</option>
                          <option value="COMPANY">Company</option>
                          <option value="PARTNERSHIP">Partnership</option>
                          <option value="TRUST">Trust</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-control"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Phone</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Address</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">PAN Number</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.panNumber}
                          onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                          placeholder="ABCDE1234F"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Join Date <span className="text-danger">*</span></label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.dateBecameShareholder}
                          onChange={(e) => setFormData({ ...formData, dateBecameShareholder: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Share Holding Section - Only for new shareholders */}
                  {!editingShareholder && (
                    <>
                      <hr />
                      <h6 className="mb-3">Initial Share Holding</h6>
                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Share Class</label>
                            <select
                              className="form-select"
                              value={formData.shareClass}
                              onChange={(e) => setFormData({ ...formData, shareClass: e.target.value })}
                            >
                              <option value="EQUITY">Equity Shares</option>
                              <option value="PREFERENCE">Preference Shares</option>
                            </select>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Number of Shares <span className="text-danger">*</span></label>
                            <input
                              type="number"
                              className="form-control"
                              value={formData.numberOfShares}
                              onChange={(e) => setFormData({ ...formData, numberOfShares: e.target.value })}
                              placeholder="e.g., 1000"
                              min="1"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-4">
                          <div className="mb-3">
                            <label className="form-label">Face Value per Share (₹)</label>
                            <input
                              type="number"
                              className="form-control"
                              value={formData.faceValuePerShare}
                              onChange={(e) => setFormData({ ...formData, faceValuePerShare: e.target.value })}
                              placeholder="e.g., 10"
                              step="0.01"
                            />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-3">
                            <label className="form-label">Amount Paid (₹) <span className="text-danger">*</span></label>
                            <input
                              type="number"
                              className="form-control"
                              value={formData.amountPaid}
                              onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                              placeholder="Total amount paid"
                              step="0.01"
                            />
                            <small className="text-muted">Total investment amount</small>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-3">
                            <label className="form-label">Issue Date</label>
                            <input
                              type="date"
                              className="form-control"
                              value={formData.issueDate}
                              onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Certificate Number</label>
                            <input
                              type="text"
                              className="form-control"
                              value={formData.certificateNumber}
                              onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value.toUpperCase() })}
                              placeholder="e.g., CERT-001"
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <div className="form-check mt-4">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id="isFullyPaid"
                                checked={formData.isFullyPaid}
                                onChange={(e) => setFormData({ ...formData, isFullyPaid: e.target.checked })}
                              />
                              <label className="form-check-label" htmlFor="isFullyPaid">
                                Fully Paid Shares
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="alert alert-info">
                        <i className="fas fa-info-circle me-2"></i>
                        <strong>Total Investment:</strong> ₹{formData.numberOfShares && formData.amountPaid
                          ? (parseFloat(formData.amountPaid)).toLocaleString()
                          : '0'}
                        {formData.numberOfShares && formData.faceValuePerShare && (
                          <span className="ms-3">
                            <strong>Face Value:</strong> ₹{(parseInt(formData.numberOfShares) * parseFloat(formData.faceValuePerShare)).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </>
                  )}

                  {editingShareholder && (
                    <div className="mb-3">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="isActive"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        />
                        <label className="form-check-label" htmlFor="isActive">
                          Active Shareholder
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editingShareholder ? 'Update Shareholder' : 'Create Shareholder'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Shareholders
