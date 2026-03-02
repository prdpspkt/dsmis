'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { GET_ALL_ASSETS, DELETE_ASSET, REEVALUATE_ASSET, CALCULATE_DEPRECIATION, CREATE_ASSET, UPDATE_ASSET } from '../graphql/assetQueries'
import styles from './Assets.module.css'

function Assets() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showReevaluationModal, setShowReevaluationModal] = useState(false)
  const [showDepreciationModal, setShowDepreciationModal] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [reevaluationData, setReevaluationData] = useState({ newValue: '', reason: '' })
  const [formData, setFormData] = useState({
    name: '',
    assetType: 'EQUIPMENT',
    description: '',
    purchaseDate: '',
    purchasePrice: '',
    depreciationRate: 0,
    usefulLife: 5,
    status: 'ACTIVE',
    location: ''
  })

  const { data, loading, refetch } = useQuery(GET_ALL_ASSETS)
  const [deleteAsset] = useMutation(DELETE_ASSET, {
    onCompleted: () => {
      alert('Asset deleted successfully!')
      refetch()
    }
  })
  const [reevaluateAsset] = useMutation(REEVALUATE_ASSET, {
    onCompleted: () => {
      alert('Asset reevaluated successfully!')
      setShowReevaluationModal(false)
      setReevaluationData({ newValue: '', reason: '' })
      refetch()
    }
  })
  const [createAsset] = useMutation(CREATE_ASSET, {
    onCompleted: () => {
      alert('Asset created successfully!')
      setShowCreateModal(false)
      resetFormData()
      refetch()
    },
    onError: (err) => {
      alert('Error creating asset: ' + err.message)
    }
  })
  const [updateAsset] = useMutation(UPDATE_ASSET, {
    onCompleted: () => {
      alert('Asset updated successfully!')
      setShowCreateModal(false)
      resetFormData()
      setSelectedAsset(null)
      refetch()
    },
    onError: (err) => {
      alert('Error updating asset: ' + err.message)
    }
  })

  const resetFormData = () => {
    setFormData({
      name: '',
      assetType: 'EQUIPMENT',
      description: '',
      purchaseDate: '',
      purchasePrice: '',
      depreciationRate: 0,
      usefulLife: 5,
      status: 'ACTIVE',
      location: ''
    })
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      deleteAsset({ variables: { id } })
    }
  }

  const handleReevaluation = (e) => {
    e.preventDefault()
    reevaluateAsset({
      variables: {
        id: selectedAsset.id,
        newValue: parseFloat(reevaluationData.newValue),
        reason: reevaluationData.reason
      }
    })
  }

  const handleCreateSubmit = (e) => {
    e.preventDefault()
    if (selectedAsset) {
      // Edit mode
      updateAsset({
        variables: {
          id: selectedAsset.id,
          ...formData,
          purchasePrice: parseFloat(formData.purchasePrice),
          depreciationRate: parseFloat(formData.depreciationRate || 0),
          usefulLife: parseInt(formData.usefulLife || 5)
        }
      })
    } else {
      // Create mode
      createAsset({
        variables: {
          ...formData,
          purchasePrice: parseFloat(formData.purchasePrice),
          depreciationRate: parseFloat(formData.depreciationRate || 0),
          usefulLife: parseInt(formData.usefulLife || 5)
        }
      })
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const calculateDepreciation = (asset) => {
    const yearsOwned = new Date().getFullYear() - new Date(asset.purchaseDate).getFullYear()
    const depreciationRate = asset.depreciationRate || 0
    const accumulatedDepreciation = asset.purchasePrice * (depreciationRate / 100) * yearsOwned
    const netBookValue = asset.purchasePrice - accumulatedDepreciation

    return {
      yearsOwned,
      accumulatedDepreciation: accumulatedDepreciation.toFixed(2),
      netBookValue: netBookValue.toFixed(2),
      remainingLife: asset.usefulLife ? Math.max(0, asset.usefulLife - yearsOwned) : 'N/A'
    }
  }

  const getAssetTypeBadgeColor = (type) => {
    const colors = {
      'VEHICLE': 'bg-primary',
      'EQUIPMENT': 'bg-info',
      'FURNITURE': 'bg-success',
      'BUILDING': 'bg-warning',
      'LAND': 'bg-secondary',
      'ELECTRONICS': 'bg-danger'
    }
    return colors[type] || 'bg-secondary'
  }

  const getStatusBadgeColor = (status) => {
    const colors = {
      'ACTIVE': 'bg-success',
      'INACTIVE': 'bg-secondary',
      'UNDER_MAINTENANCE': 'bg-warning',
      'DISPOSED': 'bg-danger'
    }
    return colors[status] || 'bg-secondary'
  }

  const formatAssetType = (type) => {
    return type?.charAt(0) + type?.slice(1).toLowerCase() || type
  }

  const formatStatus = (status) => {
    const statusMap = {
      'ACTIVE': 'Active',
      'INACTIVE': 'Inactive',
      'UNDER_MAINTENANCE': 'Under Maintenance',
      'DISPOSED': 'Disposed'
    }
    return statusMap[status] || status
  }

  if (loading) {
    return <div className="text-center mt-5"><div className="spinner-border" role="status"></div></div>
  }

  const totalAssetValue = data?.allAssets?.filter(asset => asset != null)?.reduce((sum, asset) => sum + parseFloat(asset.currentValue ?? asset.purchasePrice ?? 0), 0) || 0

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Assets Management</h2>
          <p className="text-muted mb-0">Manage company assets, track depreciation, and reevaluations</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <i className="fas fa-plus me-2"></i>Add Asset
        </button>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className={`info-box ${styles.infoBox}`}>
            <span className="info-box-icon bg-primary"><i className="fas fa-boxes"></i></span>
            <div className="info-box-content">
              <span className="info-box-text">Total Assets</span>
              <span className="info-box-number">{data?.allAssets?.length || 0}</span>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className={`info-box ${styles.infoBox}`}>
            <span className="info-box-icon bg-success"><i className="fas fa-rupee-sign"></i></span>
            <div className="info-box-content">
              <span className="info-box-text">Total Value</span>
              <span className="info-box-number">₹{totalAssetValue.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className={`info-box ${styles.infoBox}`}>
            <span className="info-box-icon bg-info"><i className="fas fa-check-circle"></i></span>
            <div className="info-box-content">
              <span className="info-box-text">Active Assets</span>
              <span className="info-box-number">
                {data?.allAssets?.filter(a => a != null && a.status === 'ACTIVE').length || 0}
              </span>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className={`info-box ${styles.infoBox}`}>
            <span className="info-box-icon bg-warning"><i className="fas fa-chart-line"></i></span>
            <div className="info-box-content">
              <span className="info-box-text">Under Maintenance</span>
              <span className="info-box-number">
                {data?.allAssets?.filter(a => a != null && a.status === 'UNDER_MAINTENANCE').length || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title mb-0">All Assets</h3>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Purchase Date</th>
                  <th>Purchase Price</th>
                  <th>Current Value</th>
                  <th>Depreciation Rate</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.allAssets?.filter(asset => asset != null).map((asset) => {
                  const depreciation = calculateDepreciation(asset)
                  return (
                    <tr key={asset.id}>
                      <td>
                        <strong>{asset.name}</strong>
                        {asset.description && (
                          <small className="d-block text-muted">{asset.description}</small>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${getAssetTypeBadgeColor(asset.assetType)}`}>
                          {formatAssetType(asset.assetType)}
                        </span>
                      </td>
                      <td>{new Date(asset.purchaseDate).toLocaleDateString()}</td>
                      <td>₹{parseFloat(asset.purchasePrice).toLocaleString()}</td>
                      <td>
                        <strong>₹{parseFloat(asset.currentValue ?? asset.purchasePrice ?? 0).toLocaleString()}</strong>
                        <small className="d-block text-muted">
                          NBV: ₹{depreciation.netBookValue}
                        </small>
                      </td>
                      <td>{asset.depreciationRate || 0}%</td>
                      <td>
                        <span className={`badge ${getStatusBadgeColor(asset.status)}`}>
                          {formatStatus(asset.status)}
                        </span>
                      </td>
                      <td>{asset.location || '-'}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-secondary"
                            title="Edit"
                            onClick={() => {
                              setSelectedAsset(asset)
                              setFormData({
                                name: asset.name,
                                assetType: asset.assetType,
                                description: asset.description || '',
                                purchaseDate: asset.purchaseDate?.split('T')[0] || '',
                                purchasePrice: asset.purchasePrice,
                                depreciationRate: asset.depreciationRate || 0,
                                usefulLife: asset.usefulLife || 5,
                                status: asset.status,
                                location: asset.location || ''
                              })
                              setShowCreateModal(true)
                            }}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-outline-primary"
                            title="Reevaluate"
                            onClick={() => {
                              setSelectedAsset(asset)
                              setShowReevaluationModal(true)
                            }}
                          >
                            <i className="fas fa-sync-alt"></i>
                          </button>
                          <button
                            className="btn btn-outline-info"
                            title="View Depreciation"
                            onClick={() => {
                              setSelectedAsset(asset)
                              setShowDepreciationModal(true)
                            }}
                          >
                            <i className="fas fa-chart-line"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            title="Delete"
                            onClick={() => handleDelete(asset.id)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {(!data?.allAssets || data.allAssets.filter(a => a != null).length === 0) && (
                  <tr>
                    <td colSpan="9" className="text-center text-muted py-4">
                      No assets found. Click "Add Asset" to create your first asset.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Asset Modal */}
      {showCreateModal && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selectedAsset ? 'Edit Asset' : 'Add New Asset'}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowCreateModal(false)
                    resetFormData()
                    setSelectedAsset(null)
                  }}
                ></button>
              </div>
              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Asset Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Asset Type *</label>
                      <select
                        className="form-select"
                        name="assetType"
                        value={formData.assetType}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="EQUIPMENT">Equipment</option>
                        <option value="VEHICLE">Vehicle</option>
                        <option value="FURNITURE">Furniture</option>
                        <option value="BUILDING">Building</option>
                        <option value="LAND">Land</option>
                        <option value="ELECTRONICS">Electronics</option>
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Purchase Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        name="purchaseDate"
                        value={formData.purchaseDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Purchase Price (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        name="purchasePrice"
                        value={formData.purchasePrice}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Depreciation Rate (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        className="form-control"
                        name="depreciationRate"
                        value={formData.depreciationRate}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Useful Life (years)</label>
                      <input
                        type="number"
                        min="1"
                        className="form-control"
                        name="usefulLife"
                        value={formData.usefulLife}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Status *</label>
                      <select
                        className="form-select"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Location</label>
                      <input
                        type="text"
                        className="form-control"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="e.g., Office, Branch 1"
                      />
                    </div>

                    <div className="col-12 mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        name="description"
                        rows="3"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Additional details about the asset"
                      ></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowCreateModal(false)
                      resetFormData()
                      setSelectedAsset(null)
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {selectedAsset ? 'Update Asset' : 'Create Asset'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reevaluation Modal */}
      {showReevaluationModal && selectedAsset && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reevaluate Asset</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowReevaluationModal(false)
                    setReevaluationData({ newValue: '', reason: '' })
                  }}
                ></button>
              </div>
              <form onSubmit={handleReevaluation}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Asset Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedAsset.name}
                      disabled
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Current Value</label>
                    <input
                      type="text"
                      className="form-control"
                      value={`₹${parseFloat(selectedAsset.currentValue || 0).toLocaleString()}`}
                      disabled
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">New Value *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={reevaluationData.newValue}
                      onChange={(e) => setReevaluationData({ ...reevaluationData, newValue: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Reason for Reevaluation *</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={reevaluationData.reason}
                      onChange={(e) => setReevaluationData({ ...reevaluationData, reason: e.target.value })}
                      required
                      placeholder="Explain why this asset is being reevaluated"
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowReevaluationModal(false)
                      setReevaluationData({ newValue: '', reason: '' })
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Update Value
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Depreciation Details Modal */}
      {showDepreciationModal && selectedAsset && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Depreciation Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDepreciationModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <h6>{selectedAsset.name}</h6>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <p className="mb-1"><strong>Purchase Price:</strong> ₹{parseFloat(selectedAsset.purchasePrice).toLocaleString()}</p>
                    <p className="mb-1"><strong>Purchase Date:</strong> {new Date(selectedAsset.purchaseDate).toLocaleDateString()}</p>
                    <p className="mb-1"><strong>Depreciation Rate:</strong> {selectedAsset.depreciationRate || 0}% per year</p>
                    <p className="mb-1"><strong>Useful Life:</strong> {selectedAsset.usefulLife || 'N/A'} years</p>
                  </div>
                  <div className="col-md-6">
                    {(() => {
                      const dep = calculateDepreciation(selectedAsset)
                      return (
                        <>
                          <p className="mb-1"><strong>Years Owned:</strong> {dep.yearsOwned} years</p>
                          <p className="mb-1"><strong>Accumulated Depreciation:</strong> ₹{dep.accumulatedDepreciation}</p>
                          <p className="mb-1"><strong>Net Book Value:</strong> ₹{dep.netBookValue}</p>
                          <p className="mb-1"><strong>Remaining Life:</strong> {dep.remainingLife}</p>
                        </>
                      )
                    })()}
                  </div>
                </div>

                <div className="alert alert-info">
                  <strong>Note:</strong> Depreciation is calculated using the straight-line method based on the asset's depreciation rate and time elapsed since purchase.
                </div>

                <h6>Depreciation Schedule</h6>
                <div className="table-responsive">
                  <table className="table table-sm table-bordered">
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Beginning Value</th>
                        <th>Depreciation</th>
                        <th>Ending Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const depreciation = calculateDepreciation(selectedAsset)
                        const yearsOwned = depreciation.yearsOwned
                        const rows = []
                        let currentValue = parseFloat(selectedAsset.purchasePrice)
                        const annualDepreciation = currentValue * ((selectedAsset.depreciationRate || 0) / 100)

                        for (let year = 1; year <= (selectedAsset.usefulLife || yearsOwned + 5); year++) {
                          const beginningValue = currentValue
                          const depreciationAmount = annualDepreciation
                          currentValue = Math.max(0, currentValue - annualDepreciation)

                          rows.push(
                            <tr key={year} className={year <= yearsOwned ? 'table-success' : ''}>
                              <td>{year}</td>
                              <td>₹{beginningValue.toLocaleString()}</td>
                              <td>₹{depreciationAmount.toLocaleString()}</td>
                              <td>₹{currentValue.toLocaleString()}</td>
                            </tr>
                          )
                        }
                        return rows
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDepreciationModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Assets
