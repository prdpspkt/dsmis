'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useAuth } from '../contexts/AuthContext'
import {
  GET_ALL_FISCAL_YEARS,
  CREATE_FISCAL_YEAR,
  UPDATE_FISCAL_YEAR,
  CLOSE_FISCAL_YEAR,
  DELETE_FISCAL_YEAR
} from '../graphql/fiscalYearQueries'

function FiscalYears() {
  const { user } = useAuth()
  const isSuperuser = user?.is_superuser || false

  const [showModal, setShowModal] = useState(false)
  const [editingFiscalYear, setEditingFiscalYear] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    notes: ''
  })

  const { data, loading, refetch } = useQuery(GET_ALL_FISCAL_YEARS)

  const [createFiscalYear] = useMutation(CREATE_FISCAL_YEAR, {
    onCompleted: () => {
      refetch()
      handleCloseModal()
    },
    onError: (error) => {
      alert(error.message || 'Failed to create fiscal year')
    }
  })

  const [updateFiscalYear] = useMutation(UPDATE_FISCAL_YEAR, {
    onCompleted: () => {
      refetch()
      handleCloseModal()
    },
    onError: (error) => {
      alert(error.message || 'Failed to update fiscal year')
    }
  })

  const [closeFiscalYear] = useMutation(CLOSE_FISCAL_YEAR, {
    onCompleted: () => {
      refetch()
      alert('Fiscal year closed successfully!')
    },
    onError: (error) => {
      alert(error.message || 'Failed to close fiscal year')
    }
  })

  const [deleteFiscalYear] = useMutation(DELETE_FISCAL_YEAR, {
    onCompleted: () => {
      refetch()
    },
    onError: (error) => {
      alert(error.message || 'Failed to delete fiscal year')
    }
  })

  const handleOpenModal = (fiscalYear = null) => {
    if (fiscalYear) {
      setEditingFiscalYear(fiscalYear)
      setFormData({
        name: fiscalYear.name,
        startDate: fiscalYear.startDate || '',
        endDate: fiscalYear.endDate || '',
        notes: fiscalYear.notes || ''
      })
    } else {
      setEditingFiscalYear(null)

      // Auto-populate with suggested Nepal fiscal year dates
      const currentYear = new Date().getFullYear()
      const startDate = `${currentYear}-07-16`  // Approximate Shrawan 1 in A.D.
      const endDate = `${currentYear + 1}-07-15`  // Approximate Ashad last in A.D.

      // Calculate fiscal year name (e.g., 2081/82 for 2024/2025)
      const bsYearOffset = currentYear - 2024 + 81
      const fiscalYearName = `${bsYearOffset}/${(bsYearOffset + 1) % 100}`.replace(/^0+/, '')

      setFormData({
        name: fiscalYearName,
        startDate: startDate,
        endDate: endDate,
        notes: ''
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingFiscalYear(null)
    setFormData({
      name: '',
      startDate: '',
      endDate: '',
      notes: ''
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isSuperuser) {
      alert('Only superusers can manage fiscal years')
      return
    }

    if (editingFiscalYear) {
      await updateFiscalYear({
        variables: {
          id: editingFiscalYear.id,
          name: formData.name,
          startDate: formData.startDate,
          endDate: formData.endDate,
          notes: formData.notes || null
        }
      })
    } else {
      await createFiscalYear({
        variables: {
          name: formData.name,
          startDate: formData.startDate,
          endDate: formData.endDate,
          notes: formData.notes || null
        }
      })
    }
  }

  const handleCloseFiscalYear = async (fiscalYear) => {
    if (!isSuperuser) {
      alert('Only superusers can close fiscal years')
      return
    }

    if (window.confirm(`Are you sure you want to close the fiscal year "${fiscalYear.name}"?\n\nThis will prevent any further transactions in this period.`)) {
      await closeFiscalYear({ variables: { id: fiscalYear.id } })
    }
  }

  const handleDelete = async (fiscalYear) => {
    if (!isSuperuser) {
      alert('Only superusers can delete fiscal years')
      return
    }

    if (fiscalYear.isClosed) {
      alert('Cannot delete a closed fiscal year.')
      return
    }

    if (window.confirm(`Are you sure you want to delete the fiscal year "${fiscalYear.name}"?`)) {
      await deleteFiscalYear({ variables: { id: fiscalYear.id } })
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount) => {
    if (!amount) return '₹0'
    return '₹' + parseFloat(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  if (loading) {
    return <div className="text-center mt-5"><div className="spinner-border" role="status"></div></div>
  }

  const fiscalYears = data?.allFiscalYears?.filter(fy => fy != null) || []

  // Calculate totals
  const totalRevenue = fiscalYears.reduce((sum, fy) => sum + (fy.totalRevenue || 0), 0)
  const totalExpenses = fiscalYears.reduce((sum, fy) => sum + (fy.totalExpenses || 0), 0)
  const totalNetIncome = fiscalYears.reduce((sum, fy) => sum + (fy.netIncome || 0), 0)
  const closedCount = fiscalYears.filter(fy => fy.isClosed).length
  const currentCount = fiscalYears.filter(fy => fy.isCurrent).length

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Fiscal Year Management</h2>
          <p className="text-muted mb-0">
            Nepal fiscal years: Shrawan 1 to Ashad last (A.D. dates stored for transaction filtering)
          </p>
        </div>
        {isSuperuser && (
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <i className="fas fa-plus me-2"></i>Add Fiscal Year
          </button>
        )}
        {!isSuperuser && (
          <div className="alert alert-warning mb-0 py-2 px-3">
            <i className="fas fa-lock me-2"></i>
            Only superusers can manage fiscal years
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="info-box bg-info">
            <span className="info-box-icon"><i className="fas fa-calendar"></i></span>
            <div className="info-box-content">
              <span className="info-box-text">Total Fiscal Years</span>
              <span className="info-box-number">{fiscalYears.length}</span>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="info-box bg-success">
            <span className="info-box-icon"><i className="fas fa-calendar-check"></i></span>
            <div className="info-box-content">
              <span className="info-box-text">Current</span>
              <span className="info-box-number">{currentCount}</span>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="info-box bg-warning">
            <span className="info-box-icon"><i className="fas fa-lock"></i></span>
            <div className="info-box-content">
              <span className="info-box-text">Closed</span>
              <span className="info-box-number">{closedCount}</span>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="info-box bg-primary">
            <span className="info-box-icon"><i className="fas fa-chart-line"></i></span>
            <div className="info-box-content">
              <span className="info-box-text">Total Net Income</span>
              <span className="info-box-number">{formatCurrency(totalNetIncome)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fiscal Years Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title mb-0">All Fiscal Years</h3>
        </div>
        <div className="card-body">
          {fiscalYears.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Start Date (A.D.)</th>
                    <th>End Date (A.D.)</th>
                    <th>Revenue</th>
                    <th>Expenses</th>
                    <th>Net Income</th>
                    <th>Status</th>
                    {isSuperuser && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {fiscalYears.map((fy) => (
                    <tr key={fy.id}>
                      <td>
                        <strong>{fy.name}</strong>
                        {fy.isCurrent && (
                          <span className="badge bg-success ms-2">Current</span>
                        )}
                      </td>
                      <td>
                        {formatDate(fy.startDate)}
                        {fy.startDateBs && (
                          <div>
                            <small className="text-muted">BS: {fy.startDateBs}</small>
                          </div>
                        )}
                      </td>
                      <td>
                        {formatDate(fy.endDate)}
                        {fy.endDateBs && (
                          <div>
                            <small className="text-muted">BS: {fy.endDateBs}</small>
                          </div>
                        )}
                      </td>
                      <td className="text-success">
                        <strong>{formatCurrency(fy.totalRevenue)}</strong>
                      </td>
                      <td className="text-danger">
                        <strong>{formatCurrency(fy.totalExpenses)}</strong>
                      </td>
                      <td className={fy.netIncome >= 0 ? 'text-success' : 'text-danger'}>
                        <strong>{formatCurrency(fy.netIncome)}</strong>
                      </td>
                      <td>
                        <span className={`badge ${fy.isClosed ? 'bg-danger' : 'bg-success'}`}>
                          {fy.isClosed ? 'Closed' : 'Open'}
                        </span>
                      </td>
                      {isSuperuser && (
                        <td>
                          <button
                            className="btn btn-sm btn-info me-1"
                            onClick={() => handleOpenModal(fy)}
                            title="Edit"
                            disabled={fy.isClosed}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          {!fy.isClosed && (
                            <button
                              className="btn btn-sm btn-warning me-1"
                              onClick={() => handleCloseFiscalYear(fy)}
                              title="Close Fiscal Year"
                            >
                              <i className="fas fa-lock"></i>
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(fy)}
                            title="Delete"
                            disabled={fy.isClosed}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-muted py-5">
              <i className="fas fa-calendar fa-3x mb-3"></i>
              <p>No fiscal years found. {isSuperuser ? 'Create your first fiscal year to get started.' : 'Ask a superuser to create fiscal years.'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingFiscalYear ? 'Edit Fiscal Year' : 'Add New Fiscal Year'}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Fiscal Year Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., 2081/82, 2082/83"
                      required
                    />
                    <small className="form-text text-muted">
                      Enter the Nepal fiscal year name (e.g., 2081/82 for Shrawan 2081 to Ashad 2082)
                    </small>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Start Date (A.D.) <span className="text-danger">*</span></label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          required
                        />
                        <small className="form-text text-muted">
                          Shrawan 1 (approximately mid-July)
                        </small>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">End Date (A.D.) <span className="text-danger">*</span></label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          min={formData.startDate}
                          required
                        />
                        <small className="form-text text-muted">
                          Ashad last of next year (approximately mid-July)
                        </small>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Duration</label>
                    <div className="form-control-plaintext">
                      {formData.startDate && formData.endDate ? (
                        `${Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24))} days`
                      ) : '-'}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Optional notes about this fiscal year..."
                    ></textarea>
                  </div>

                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    <strong>Nepal Government Fiscal Year:</strong> Nepal's fiscal year runs from <strong>Shrawan 1</strong> to <strong>Ashad last</strong> of the next year.
                    The dates vary each year in A.D. because B.S. months have different lengths.
                    <ul className="mb-0 mt-2">
                      <li>Transactions between the start and end dates (inclusive) belong to this fiscal year</li>
                      <li>Fiscal years are used for generating financial reports</li>
                      <li>Only superusers can create and manage fiscal years</li>
                    </ul>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editingFiscalYear ? 'Update Fiscal Year' : 'Create Fiscal Year'}
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

export default FiscalYears
