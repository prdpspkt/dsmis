'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { GET_DAILY_SCHEDULE, GET_ALL_TOKENS, GET_ALL_TOKEN_DURATIONS, GET_ALL_STUDENTS, GET_ALL_INSTRUCTORS, GET_ALL_VEHICLES, CREATE_TOKEN, UPDATE_TOKEN, DELETE_TOKEN } from '../graphql/studentQueries'
import { GET_DAILY_SCHEDULE as GET_DAILY_SCHEDULE_TOKENS } from '../graphql/tokenQueries'

function Tokens() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [selectedToken, setSelectedToken] = useState(null)

  // Queries
  const { data: scheduleData, refetch: refetchSchedule } = useQuery(GET_DAILY_SCHEDULE, {
    variables: { date: selectedDate }
  })
  const { data: allTokensData, refetch: refetchAllTokens } = useQuery(GET_ALL_TOKENS)
  const { data: durationsData } = useQuery(GET_ALL_TOKEN_DURATIONS)
  const { data: studentsData } = useQuery(GET_ALL_STUDENTS)
  const { data: instructorsData } = useQuery(GET_ALL_INSTRUCTORS)
  const { data: vehiclesData } = useQuery(GET_ALL_VEHICLES)

  // Mutations
  const [createToken] = useMutation(CREATE_TOKEN, {
    onCompleted: () => {
      refetchSchedule()
      refetchAllTokens()
      setShowBookingForm(false)
      alert('Token created successfully!')
    },
    onError: (err) => alert('Error: ' + err.message)
  })

  const [updateToken] = useMutation(UPDATE_TOKEN, {
    onCompleted: () => {
      refetchSchedule()
      refetchAllTokens()
      setSelectedToken(null)
      alert('Token updated successfully!')
    },
    onError: (err) => alert('Error: ' + err.message)
  })

  const [deleteToken] = useMutation(DELETE_TOKEN, {
    onCompleted: () => {
      refetchSchedule()
      refetchAllTokens()
      alert('Token deleted successfully!')
    },
    onError: (err) => alert('Error: ' + err.message)
  })

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this token?')) {
      await deleteToken({ variables: { id } })
    }
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-primary'
      case 'IN_PROGRESS': return 'bg-warning'
      case 'COMPLETED': return 'bg-success'
      case 'CANCELLED': return 'bg-danger'
      case 'EXPIRED': return 'bg-secondary'
      default: return 'bg-secondary'
    }
  }

  const TokenForm = ({ token, onClose }) => {
    const [formData, setFormData] = useState({
      studentId: token?.student?.id || '',
      durationId: token?.duration?.id || '',
      date: token?.date || selectedDate,
      startTime: token?.startTime || '',
      instructorId: token?.instructor?.id || '',
      vehicleId: token?.vehicle?.id || '',
      notes: token?.notes || '',
      status: token?.status || 'SCHEDULED'
    })

    const handleSubmit = async (e) => {
      e.preventDefault()
      if (token) {
        await updateToken({
          variables: {
            id: token.id,
            ...formData,
            instructorId: formData.instructorId || null,
            vehicleId: formData.vehicleId || null
          }
        })
      } else {
        await createToken({
          variables: {
            ...formData,
            instructorId: formData.instructorId || null,
            vehicleId: formData.vehicleId || null
          }
        })
      }
    }

    return (
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">{token ? 'Edit Token' : 'Book New Token'}</h5>
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>✕</button>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Student *</label>
                <select
                  className="form-select"
                  value={formData.studentId}
                  onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                  required
                  disabled={!!token}
                >
                  <option value="">Select Student</option>
                  {studentsData?.allStudents?.filter(s => s.status === 'ACTIVE')?.map(s => (
                    <option key={s.id} value={s.id}>{s.studentId} - {s.fullName} ({s.remainingHours || 0}h remaining)</option>
                  ))}
                </select>
                {formData.studentId && (() => {
                  const selectedStudent = studentsData?.allStudents?.find(s => s.id === formData.studentId)
                  if (selectedStudent) {
                    const isLowTime = selectedStudent.remainingMinutes < 60
                    const isNoTime = selectedStudent.remainingMinutes === 0
                    return (
                      <div className={`alert ${isNoTime ? 'alert-danger' : isLowTime ? 'alert-warning' : 'alert-info'} mt-2 mb-0 py-2`}>
                        <small className="mb-0">
                          <strong>Time Balance:</strong> {selectedStudent.remainingMinutes} minutes ({selectedStudent.remainingHours} hours) remaining
                          {isNoTime && ' - Course completed!'}
                          {isLowTime && !isNoTime && ' - Low time remaining!'}
                        </small>
                      </div>
                    )
                  }
                  return null
                })()}
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Duration *</label>
                <select
                  className="form-select"
                  value={formData.durationId}
                  onChange={(e) => setFormData({...formData, durationId: e.target.value})}
                  required
                  disabled={!!token}
                >
                  <option value="">Select Duration</option>
                  {durationsData?.allTokenDurations?.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.minutes} min)</option>
                  ))}
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                  disabled={!!token}
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Start Time *</label>
                <input
                  type="time"
                  className="form-control"
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  required
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Instructor</label>
                <select
                  className="form-select"
                  value={formData.instructorId}
                  onChange={(e) => setFormData({...formData, instructorId: e.target.value})}
                >
                  <option value="">Select Instructor</option>
                  {instructorsData?.allInstructors?.map(i => (
                    <option key={i.id} value={i.id}>{i.name} ({i.specialization})</option>
                  ))}
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Vehicle</label>
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

              {token && (
                <div className="col-md-6 mb-3">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </div>
              )}

              <div className="col-12 mb-3">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                ></textarea>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">
                {token ? 'Update' : 'Book'} Token
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Token Management</h2>
            <button className="btn btn-primary" onClick={() => setShowBookingForm(true)}>
              + Book Token
            </button>
          </div>

          {showBookingForm && (
            <div className="mb-4">
              <TokenForm token={null} onClose={() => setShowBookingForm(false)} />
            </div>
          )}

          {selectedToken && (
            <div className="mb-4">
              <TokenForm token={selectedToken} onClose={() => setSelectedToken(null)} />
            </div>
          )}

          {/* Date Filter */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-3">
                  <label className="form-label fw-bold">Select Date:</label>
                  <input
                    type="date"
                    className="form-control"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
                <div className="col-md-9">
                  <h5 className="mb-0">
                    Daily Schedule: {new Date(selectedDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h5>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Schedule */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Scheduled Tokens</h5>
            </div>
            <div className="card-body">
              {scheduleData?.dailySchedule?.length === 0 ? (
                <p className="text-muted text-center mb-0">No tokens scheduled for this date.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Token #</th>
                        <th>Student</th>
                        <th>Instructor</th>
                        <th>Vehicle</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scheduleData?.dailySchedule?.map(token => (
                        <tr key={token.id}>
                          <td>
                            <strong>{token.startTime}</strong> - {token.endTime}
                          </td>
                          <td>{token.tokenNumber}</td>
                          <td>
                            {token.student.fullName}
                            <small className="d-block text-muted">{token.student.studentId}</small>
                          </td>
                          <td>{token.instructor?.name || '-'}</td>
                          <td>{token.vehicle?.modelName || '-'}</td>
                          <td>
                            <span className={`badge ${getStatusClass(token.status)}`}>
                              {token.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-secondary"
                                onClick={() => setSelectedToken(token)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => handleDelete(token.id)}
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

          {/* All Tokens List */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">All Tokens</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Token #</th>
                      <th>Student</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Duration</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTokensData?.allTokens?.slice(0, 10)?.map(token => (
                      <tr key={token.id}>
                        <td>{token.tokenNumber}</td>
                        <td>{token.student.fullName}</td>
                        <td>{token.date}</td>
                        <td>{token.startTime}</td>
                        <td>{token.duration.name}</td>
                        <td>
                          <span className={`badge ${getStatusClass(token.status)}`}>
                            {token.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Tokens
