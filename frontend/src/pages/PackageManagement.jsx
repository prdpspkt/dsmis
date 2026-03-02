'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import {
  GET_ALL_TOKEN_DURATIONS,
  CREATE_TOKEN_DURATION,
  UPDATE_TOKEN_DURATION,
  DELETE_TOKEN_DURATION,
  GET_ALL_TMO_FEES,
  CREATE_TMO_FEE,
  UPDATE_TMO_FEE,
  DELETE_TMO_FEE,
  GET_ALL_COURSE_PACKAGES,
  GET_ALL_GUEST_PACKAGES,
  GET_ALL_COURSES,
  CREATE_COURSE_PACKAGE,
  UPDATE_COURSE_PACKAGE,
  DELETE_COURSE_PACKAGE,
  CREATE_GUEST_PACKAGE,
  UPDATE_GUEST_PACKAGE,
  DELETE_GUEST_PACKAGE,
} from '../graphql/packageQueries'

function PackageManagement() {
  const [activeTab, setActiveTab] = useState('durations')

  // ===== SESSION DURATIONS =====
  const { data: durationsData, refetch: refetchDurations } = useQuery(GET_ALL_TOKEN_DURATIONS)
  const [createDuration] = useMutation(CREATE_TOKEN_DURATION, {
    onCompleted: () => {
      refetchDurations()
      alert('Session duration created successfully!')
    },
    onError: (err) => alert('Error: ' + err.message)
  })

  const [updateDuration] = useMutation(UPDATE_TOKEN_DURATION, {
    onCompleted: () => {
      refetchDurations()
      alert('Session duration updated successfully!')
    },
    onError: (err) => alert('Error: ' + err.message)
  })

  const [deleteDuration] = useMutation(DELETE_TOKEN_DURATION, {
    onCompleted: () => {
      refetchDurations()
      alert('Session duration deleted successfully!')
    },
    onError: (err) => alert('Error: ' + err.message)
  })

  // ===== TMO FEES =====
  const { data: feesData, refetch: refetchFees } = useQuery(GET_ALL_TMO_FEES)
  const [createFee] = useMutation(CREATE_TMO_FEE, {
    onCompleted: () => {
      refetchFees()
      alert('TMO Fee created successfully!')
    },
    onError: (err) => alert('Error: ' + err.message)
  })

  const [updateFee] = useMutation(UPDATE_TMO_FEE, {
    onCompleted: () => {
      refetchFees()
      alert('TMO Fee updated successfully!')
    },
    onError: (err) => alert('Error: ' + err.message)
  })

  const [deleteFee] = useMutation(DELETE_TMO_FEE, {
    onCompleted: () => {
      refetchFees()
      alert('TMO Fee deleted successfully!')
    },
    onError: (err) => alert('Error: ' + err.message)
  })

  // ===== COURSE PACKAGES =====
  const { data: coursesData } = useQuery(GET_ALL_COURSES)
  const { data: coursePackagesData, refetch: refetchCoursePackages } = useQuery(GET_ALL_COURSE_PACKAGES)
  const [createCoursePackage] = useMutation(CREATE_COURSE_PACKAGE, {
    onCompleted: () => {
      refetchCoursePackages()
      alert('Course package created successfully!')
    },
    onError: (err) => alert('Error: ' + err.message)
  })

  const [updateCoursePackage] = useMutation(UPDATE_COURSE_PACKAGE, {
    onCompleted: () => {
      refetchCoursePackages()
      alert('Course package updated successfully!')
    },
    onError: (err) => alert('Error: ' + err.message)
  })

  const [deleteCoursePackage] = useMutation(DELETE_COURSE_PACKAGE, {
    onCompleted: () => {
      refetchCoursePackages()
      alert('Course package deleted successfully!')
    },
    onError: (err) => alert('Error: ' + err.message)
  })

  // ===== GUEST PACKAGES =====
  const { data: guestPackagesData, refetch: refetchGuestPackages } = useQuery(GET_ALL_GUEST_PACKAGES)
  const [createGuestPackage] = useMutation(CREATE_GUEST_PACKAGE, {
    onCompleted: () => {
      refetchGuestPackages()
      alert('Guest package created successfully!')
    },
    onError: (err) => alert('Error: ' + err.message)
  })

  const [updateGuestPackage] = useMutation(UPDATE_GUEST_PACKAGE, {
    onCompleted: () => {
      refetchGuestPackages()
      alert('Guest package updated successfully!')
    },
    onError: (err) => alert('Error: ' + err.message)
  })

  const [deleteGuestPackage] = useMutation(DELETE_GUEST_PACKAGE, {
    onCompleted: () => {
      refetchGuestPackages()
      alert('Guest package deleted successfully!')
    },
    onError: (err) => alert('Error: ' + err.message)
  })

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Package Management</h2>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'durations' ? 'active' : ''}`}
            onClick={() => setActiveTab('durations')}
          >
            Session Durations
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'tmo' ? 'active' : ''}`}
            onClick={() => setActiveTab('tmo')}
          >
            TMO Trial Fees
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'course' ? 'active' : ''}`}
            onClick={() => setActiveTab('course')}
          >
            Student Packages
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'guest' ? 'active' : ''}`}
            onClick={() => setActiveTab('guest')}
          >
            Guest Packages
          </button>
        </li>
      </ul>

      {/* Session Durations Tab */}
      {activeTab === 'durations' && (
        <SessionDurationsTab
          durations={durationsData?.allTokenDurations || []}
          onCreate={createDuration}
          onUpdate={updateDuration}
          onDelete={deleteDuration}
        />
      )}

      {/* TMO Fees Tab */}
      {activeTab === 'tmo' && (
        <TMOFeesTab
          fees={feesData?.allTmoFees || []}
          onCreate={createFee}
          onUpdate={updateFee}
          onDelete={deleteFee}
        />
      )}

      {/* Course Packages Tab */}
      {activeTab === 'course' && (
        <CoursePackagesTab
          packages={coursePackagesData?.allCoursePackages || []}
          courses={coursesData?.allCourses || []}
          durations={durationsData?.allTokenDurations || []}
          onCreate={createCoursePackage}
          onUpdate={updateCoursePackage}
          onDelete={deleteCoursePackage}
        />
      )}

      {/* Guest Packages Tab */}
      {activeTab === 'guest' && (
        <GuestPackagesTab
          packages={guestPackagesData?.allGuestPackages || []}
          durations={durationsData?.allTokenDurations || []}
          onCreate={createGuestPackage}
          onUpdate={updateGuestPackage}
          onDelete={deleteGuestPackage}
        />
      )}
    </div>
  )
}

// ===== SESSION DURATIONS COMPONENT =====
function SessionDurationsTab({ durations, onCreate, onUpdate, onDelete }) {
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    minutes: 0,
    isActive: true
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (editingItem) {
      await onUpdate({
        variables: {
          id: editingItem.id,
          ...formData,
          minutes: parseInt(formData.minutes)
        }
      })
    } else {
      await onCreate({
        variables: {
          ...formData,
          minutes: parseInt(formData.minutes)
        }
      })
    }
    setEditingItem(null)
    setShowForm(false)
    setFormData({ name: '', minutes: 0, isActive: true })
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      minutes: item.minutes,
      isActive: item.isActive
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this session duration?')) {
      await onDelete({ variables: { id } })
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Session Durations</h5>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingItem(null)
            setShowForm(!showForm)
            if (!showForm) setFormData({ name: '', minutes: 0, isActive: true })
          }}
        >
          {showForm ? 'Cancel' : '+ Add Duration'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-3">
          <div className="card-body">
            <h6 className="card-title">{editingItem ? 'Edit Duration' : 'Add New Duration'}</h6>
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., 30 minutes"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Minutes *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.minutes}
                    onChange={(e) => setFormData({ ...formData, minutes: e.target.value })}
                    min="1"
                    required
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={formData.isActive.toString()}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div className="col-md-2 mb-3 d-flex align-items-end">
                  <button type="submit" className="btn btn-success w-100">
                    {editingItem ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          {durations.length === 0 ? (
            <p className="text-muted text-center mb-0">No session durations found.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Minutes</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {durations.map((duration) => (
                    <tr key={duration.id}>
                      <td><strong>{duration.name}</strong></td>
                      <td>{duration.minutes} min</td>
                      <td>
                        <span className={`badge ${duration.isActive ? 'bg-success' : 'bg-secondary'}`}>
                          {duration.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-outline-primary" onClick={() => handleEdit(duration)}>Edit</button>
                          <button className="btn btn-outline-danger" onClick={() => handleDelete(duration.id)}>Delete</button>
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
  )
}

// ===== TMO FEES COMPONENT =====
function TMOFeesTab({ fees, onCreate, onUpdate, onDelete }) {
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    category: '',
    feeAmount: 0,
    description: '',
    isActive: true
  })

  const TMO_CATEGORIES = [
    { value: 'MOTORCYCLE', label: 'Motorcycle' },
    { value: 'SCOOTER', label: 'Scooter' },
    { value: 'MOPED', label: 'Moped' },
    { value: 'CAR', label: 'Car (Light Motor Vehicle)' },
    { value: 'HEAVY_VEHICLE', label: 'Heavy Vehicle' },
    { value: 'TRAILER', label: 'Trailer' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (editingItem) {
      await onUpdate({
        variables: {
          id: editingItem.id,
          ...formData,
          feeAmount: parseFloat(formData.feeAmount)
        }
      })
    } else {
      await onCreate({
        variables: {
          ...formData,
          feeAmount: parseFloat(formData.feeAmount)
        }
      })
    }
    setEditingItem(null)
    setShowForm(false)
    setFormData({ category: '', feeAmount: 0, description: '', isActive: true })
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      category: item.category,
      feeAmount: item.feeAmount,
      description: item.description || '',
      isActive: item.isActive
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this TMO fee?')) {
      await onDelete({ variables: { id } })
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>TMO Trial Fees</h5>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingItem(null)
            setShowForm(!showForm)
            if (!showForm) setFormData({ category: '', feeAmount: 0, description: '', isActive: true })
          }}
        >
          {showForm ? 'Cancel' : '+ Add Fee'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-3">
          <div className="card-body">
            <h6 className="card-title">{editingItem ? 'Edit Fee' : 'Add New Fee'}</h6>
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-3 mb-3">
                  <label className="form-label">Vehicle Category *</label>
                  <select
                    className="form-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="">Select Category</option>
                    {TMO_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2 mb-3">
                  <label className="form-label">Fee Amount (₹) *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.feeAmount}
                    onChange={(e) => setFormData({ ...formData, feeAmount: e.target.value })}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Optional description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="col-md-2 mb-3">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={formData.isActive.toString()}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div className="col-md-2 mb-3 d-flex align-items-end">
                  <button type="submit" className="btn btn-success w-100">
                    {editingItem ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          {fees.length === 0 ? (
            <p className="text-muted text-center mb-0">No TMO fees found.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Vehicle Category</th>
                    <th>Fee Amount</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((fee) => (
                    <tr key={fee.id}>
                      <td><strong>{fee.category.replace('_', ' ')}</strong></td>
                      <td>₹{fee.feeAmount.toFixed(2)}</td>
                      <td>{fee.description || '-'}</td>
                      <td>
                        <span className={`badge ${fee.isActive ? 'bg-success' : 'bg-secondary'}`}>
                          {fee.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-outline-primary" onClick={() => handleEdit(fee)}>Edit</button>
                          <button className="btn btn-outline-danger" onClick={() => handleDelete(fee.id)}>Delete</button>
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
  )
}

// ===== COURSE PACKAGES COMPONENT =====
function CoursePackagesTab({ packages, courses, durations, onCreate, onUpdate, onDelete }) {
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    packageType: 'BASIC',
    courseId: '',
    totalSessions: 1,
    sessionDurationId: '',
    fee: 0,
    description: '',
    includesLicenseFee: false,
    includesMaterials: false,
    validityDays: '',
    isActive: true
  })

  const PACKAGE_TYPES = [
    { value: 'BASIC', label: 'Basic' },
    { value: 'STANDARD', label: 'Standard' },
    { value: 'PREMIUM', label: 'Premium' },
    { value: 'CUSTOM', label: 'Custom' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (editingItem) {
      await onUpdate({
        variables: {
          id: editingItem.id,
          ...formData,
          fee: parseFloat(formData.fee),
          totalSessions: parseInt(formData.totalSessions),
          validityDays: formData.validityDays ? parseInt(formData.validityDays) : null
        }
      })
    } else {
      await onCreate({
        variables: {
          ...formData,
          fee: parseFloat(formData.fee),
          totalSessions: parseInt(formData.totalSessions),
          validityDays: formData.validityDays ? parseInt(formData.validityDays) : null
        }
      })
    }
    setEditingItem(null)
    setShowForm(false)
    setFormData({
      name: '', packageType: 'BASIC', courseId: '', totalSessions: 1, sessionDurationId: '',
      fee: 0, description: '', includesLicenseFee: false, includesMaterials: false, validityDays: '', isActive: true
    })
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      packageType: item.packageType,
      courseId: item.course.id,
      totalSessions: item.totalSessions,
      sessionDurationId: item.sessionDuration.id,
      fee: item.fee,
      description: item.description || '',
      includesLicenseFee: item.includesLicenseFee,
      includesMaterials: item.includesMaterials,
      validityDays: item.validityDays || '',
      isActive: item.isActive
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this course package?')) {
      await onDelete({ variables: { id } })
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Student Course Packages</h5>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingItem(null)
            setShowForm(!showForm)
            if (!showForm) setFormData({
              name: '', packageType: 'BASIC', courseId: '', totalSessions: 1, sessionDurationId: '',
              fee: 0, description: '', includesLicenseFee: false, includesMaterials: false, validityDays: '', isActive: true
            })
          }}
        >
          {showForm ? 'Cancel' : '+ Add Package'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-3">
          <div className="card-body">
            <h6 className="card-title">{editingItem ? 'Edit Package' : 'Add New Package'}</h6>
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-3 mb-3">
                  <label className="form-label">Package Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Basic Car Course"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-2 mb-3">
                  <label className="form-label">Package Type</label>
                  <select
                    className="form-select"
                    value={formData.packageType}
                    onChange={(e) => setFormData({ ...formData, packageType: e.target.value })}
                  >
                    {PACKAGE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2 mb-3">
                  <label className="form-label">Course *</label>
                  <select
                    className="form-select"
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    required
                  >
                    <option value="">Select Course</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2 mb-3">
                  <label className="form-label">Sessions *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.totalSessions}
                    onChange={(e) => setFormData({ ...formData, totalSessions: e.target.value })}
                    min="1"
                    required
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Fee (₹) *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.fee}
                    onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-3 mb-3">
                  <label className="form-label">Session Duration *</label>
                  <select
                    className="form-select"
                    value={formData.sessionDurationId}
                    onChange={(e) => setFormData({ ...formData, sessionDurationId: e.target.value })}
                    required
                  >
                    <option value="">Select Duration</option>
                    {durations.map(dur => (
                      <option key={dur.id} value={dur.id}>{dur.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Validity (days)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Leave empty for unlimited"
                    value={formData.validityDays}
                    onChange={(e) => setFormData({ ...formData, validityDays: e.target.value })}
                    min="1"
                  />
                </div>
                <div className="col-md-6 mb-3 d-flex align-items-end gap-3">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={formData.includesLicenseFee}
                      onChange={(e) => setFormData({ ...formData, includesLicenseFee: e.target.checked })}
                    />
                    <label className="form-check-label">Includes License Fee</label>
                  </div>
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={formData.includesMaterials}
                      onChange={(e) => setFormData({ ...formData, includesMaterials: e.target.checked })}
                    />
                    <label className="form-check-label">Includes Materials</label>
                  </div>
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <label className="form-check-label">Active</label>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-12 mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    placeholder="Package description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="2"
                  ></textarea>
                </div>
              </div>
              <div className="row">
                <div className="col-md-2 d-flex align-items-end">
                  <button type="submit" className="btn btn-success w-100">
                    {editingItem ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          {packages.length === 0 ? (
            <p className="text-muted text-center mb-0">No course packages found.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Package Name</th>
                    <th>Type</th>
                    <th>Course</th>
                    <th>Sessions</th>
                    <th>Duration</th>
                    <th>Fee</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pkg) => (
                    <tr key={pkg.id}>
                      <td>
                        <strong>{pkg.name}</strong>
                        {pkg.includesLicenseFee && <span className="badge bg-info ms-2">License</span>}
                        {pkg.includesMaterials && <span className="badge bg-warning ms-1">Materials</span>}
                      </td>
                      <td>{pkg.packageType}</td>
                      <td>{pkg.course.name}</td>
                      <td>{pkg.totalSessions}</td>
                      <td>{pkg.sessionDuration.name}</td>
                      <td>₹{pkg.fee.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${pkg.isActive ? 'bg-success' : 'bg-secondary'}`}>
                          {pkg.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-outline-primary" onClick={() => handleEdit(pkg)}>Edit</button>
                          <button className="btn btn-outline-danger" onClick={() => handleDelete(pkg.id)}>Delete</button>
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
  )
}

// ===== GUEST PACKAGES COMPONENT =====
function GuestPackagesTab({ packages, durations, onCreate, onUpdate, onDelete }) {
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    packageType: 'SINGLE',
    vehicleType: 'CAR',
    totalSessions: 1,
    sessionDurationId: '',
    fee: 0,
    description: '',
    validityDays: '',
    isActive: true
  })

  const PACKAGE_TYPES = [
    { value: 'SINGLE', label: 'Single Session' },
    { value: 'TRIAL', label: 'Trial Pack' },
    { value: 'SHORT', label: 'Short Term' },
    { value: 'INTENSIVE', label: 'Intensive' }
  ]

  const VEHICLE_TYPES = [
    { value: 'CAR', label: 'Car' },
    { value: 'BIKE', label: 'Bike' },
    { value: 'SCOOTER', label: 'Scooter' },
    { value: 'HEAVY_VEHICLE', label: 'Heavy Vehicle' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (editingItem) {
      await onUpdate({
        variables: {
          id: editingItem.id,
          ...formData,
          fee: parseFloat(formData.fee),
          totalSessions: parseInt(formData.totalSessions),
          validityDays: formData.validityDays ? parseInt(formData.validityDays) : null
        }
      })
    } else {
      await onCreate({
        variables: {
          ...formData,
          fee: parseFloat(formData.fee),
          totalSessions: parseInt(formData.totalSessions),
          validityDays: formData.validityDays ? parseInt(formData.validityDays) : null
        }
      })
    }
    setEditingItem(null)
    setShowForm(false)
    setFormData({
      name: '', packageType: 'SINGLE', vehicleType: 'CAR', totalSessions: 1, sessionDurationId: '',
      fee: 0, description: '', validityDays: '', isActive: true
    })
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      packageType: item.packageType,
      vehicleType: item.vehicleType,
      totalSessions: item.totalSessions,
      sessionDurationId: item.sessionDuration.id,
      fee: item.fee,
      description: item.description || '',
      validityDays: item.validityDays || '',
      isActive: item.isActive
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this guest package?')) {
      await onDelete({ variables: { id } })
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Walk-in Guest Packages</h5>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingItem(null)
            setShowForm(!showForm)
            if (!showForm) setFormData({
              name: '', packageType: 'SINGLE', vehicleType: 'CAR', totalSessions: 1, sessionDurationId: '',
              fee: 0, description: '', validityDays: '', isActive: true
            })
          }}
        >
          {showForm ? 'Cancel' : '+ Add Package'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-3">
          <div className="card-body">
            <h6 className="card-title">{editingItem ? 'Edit Package' : 'Add New Package'}</h6>
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-3 mb-3">
                  <label className="form-label">Package Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Quick Car Session"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-2 mb-3">
                  <label className="form-label">Package Type</label>
                  <select
                    className="form-select"
                    value={formData.packageType}
                    onChange={(e) => setFormData({ ...formData, packageType: e.target.value })}
                  >
                    {PACKAGE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2 mb-3">
                  <label className="form-label">Vehicle Type *</label>
                  <select
                    className="form-select"
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    required
                  >
                    {VEHICLE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2 mb-3">
                  <label className="form-label">Sessions *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.totalSessions}
                    onChange={(e) => setFormData({ ...formData, totalSessions: e.target.value })}
                    min="1"
                    required
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Fee (₹) *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.fee}
                    onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-3 mb-3">
                  <label className="form-label">Session Duration *</label>
                  <select
                    className="form-select"
                    value={formData.sessionDurationId}
                    onChange={(e) => setFormData({ ...formData, sessionDurationId: e.target.value })}
                    required
                  >
                    <option value="">Select Duration</option>
                    {durations.map(dur => (
                      <option key={dur.id} value={dur.id}>{dur.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Validity (days)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Leave empty for unlimited"
                    value={formData.validityDays}
                    onChange={(e) => setFormData({ ...formData, validityDays: e.target.value })}
                    min="1"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    placeholder="Package description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="2"
                  ></textarea>
                </div>
              </div>
              <div className="row">
                <div className="col-md-2 mb-3 d-flex align-items-end">
                  <button type="submit" className="btn btn-success w-100">
                    {editingItem ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          {packages.length === 0 ? (
            <p className="text-muted text-center mb-0">No guest packages found.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Package Name</th>
                    <th>Type</th>
                    <th>Vehicle</th>
                    <th>Sessions</th>
                    <th>Duration</th>
                    <th>Fee</th>
                    <th>Validity</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pkg) => (
                    <tr key={pkg.id}>
                      <td><strong>{pkg.name}</strong></td>
                      <td>{pkg.packageType.replace('_', ' ')}</td>
                      <td>{pkg.vehicleType.replace('_', ' ')}</td>
                      <td>{pkg.totalSessions}</td>
                      <td>{pkg.sessionDuration.name}</td>
                      <td>₹{pkg.fee.toFixed(2)}</td>
                      <td>{pkg.validityDays ? `${pkg.validityDays} days` : 'Unlimited'}</td>
                      <td>
                        <span className={`badge ${pkg.isActive ? 'bg-success' : 'bg-secondary'}`}>
                          {pkg.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-outline-primary" onClick={() => handleEdit(pkg)}>Edit</button>
                          <button className="btn btn-outline-danger" onClick={() => handleDelete(pkg.id)}>Delete</button>
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
  )
}

export default PackageManagement
