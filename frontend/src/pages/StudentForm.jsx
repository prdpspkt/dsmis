import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { GET_STUDENT, GET_ALL_COURSES, GET_ALL_INSTRUCTORS, CREATE_STUDENT, UPDATE_STUDENT } from '../graphql/studentQueries'

function StudentForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    contact: '',
    email: '',
    citizenshipNumber: '',
    dateOfBirth: '',
    courseId: '',
    instructorId: '',
    batchNumber: '',
    admissionFee: ''
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // Queries
  const { data: coursesData } = useQuery(GET_ALL_COURSES)
  const { data: instructorsData } = useQuery(GET_ALL_INSTRUCTORS)
  const { data: studentData, loading: studentLoading } = useQuery(GET_STUDENT, {
    variables: { id },
    skip: !isEdit,
    onCompleted: (data) => {
      if (data?.student) {
        const s = data.student
        setFormData({
          firstName: s.firstName,
          lastName: s.lastName,
          address: s.address,
          contact: s.contact,
          email: s.email || '',
          citizenshipNumber: s.citizenshipNumber,
          dateOfBirth: s.dateOfBirth,
          courseId: s.course?.id,
          instructorId: s.instructor?.id || '',
          batchNumber: s.batchNumber || '',
          admissionFee: s.admissionFee
        })
      }
    }
  })

  // Mutations
  const [createStudent] = useMutation(CREATE_STUDENT, {
    onCompleted: (data) => {
      alert('Student created successfully!')
      navigate('/students')
    },
    onError: (err) => {
      alert('Error creating student: ' + err.message)
      setLoading(false)
    }
  })

  const [updateStudent] = useMutation(UPDATE_STUDENT, {
    onCompleted: (data) => {
      alert('Student updated successfully!')
      navigate('/students')
    },
    onError: (err) => {
      alert('Error updating student: ' + err.message)
      setLoading(false)
    }
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})

    // Validation
    const newErrors = {}
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.address.trim()) newErrors.address = 'Address is required'
    if (!formData.contact.trim()) newErrors.contact = 'Contact is required'
    if (!formData.citizenshipNumber.trim()) newErrors.citizenshipNumber = 'Citizenship number is required'
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required'
    if (!formData.courseId) newErrors.courseId = 'Course is required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)

    try {
      if (isEdit) {
        await updateStudent({
          variables: {
            id,
            ...formData
          }
        })
      } else {
        await createStudent({
          variables: {
            ...formData,
            admissionFee: formData.admissionFee || parseFloat(coursesData?.allCourses?.find(c => c.id === formData.courseId)?.fee || 0)
          }
        })
      }
    } catch (err) {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  if (studentLoading) {
    return <div className="text-center mt-5"><div className="spinner-border" role="status"></div></div>
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>{isEdit ? 'Edit Student' : 'New Student Admission'}</h2>
            <Link to="/students" className="btn btn-outline-secondary">
              Back to Students
            </Link>
          </div>

          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                {/* Personal Information */}
                <h5 className="mb-3">Personal Information</h5>
                <div className="row mb-4">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                    {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Last Name *</label>
                    <input
                      type="text"
                      className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                    {errors.lastName && <div className="invalid-feedback">{errors.lastName}</div>}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Contact *</label>
                    <input
                      type="text"
                      className={`form-control ${errors.contact ? 'is-invalid' : ''}`}
                      name="contact"
                      value={formData.contact}
                      onChange={handleChange}
                    />
                    {errors.contact && <div className="invalid-feedback">{errors.contact}</div>}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Date of Birth *</label>
                    <input
                      type="date"
                      className={`form-control ${errors.dateOfBirth ? 'is-invalid' : ''}`}
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                    />
                    {errors.dateOfBirth && <div className="invalid-feedback">{errors.dateOfBirth}</div>}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Citizenship Number *</label>
                    <input
                      type="text"
                      className={`form-control ${errors.citizenshipNumber ? 'is-invalid' : ''}`}
                      name="citizenshipNumber"
                      value={formData.citizenshipNumber}
                      onChange={handleChange}
                    />
                    {errors.citizenshipNumber && <div className="invalid-feedback">{errors.citizenshipNumber}</div>}
                  </div>

                  <div className="col-12 mb-3">
                    <label className="form-label">Address *</label>
                    <textarea
                      className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                      name="address"
                      rows="3"
                      value={formData.address}
                      onChange={handleChange}
                    ></textarea>
                    {errors.address && <div className="invalid-feedback">{errors.address}</div>}
                  </div>
                </div>

                {/* Course Information */}
                <h5 className="mb-3">Course Information</h5>
                <div className="row mb-4">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Course *</label>
                    <select
                      className={`form-select ${errors.courseId ? 'is-invalid' : ''}`}
                      name="courseId"
                      value={formData.courseId}
                      onChange={handleChange}
                    >
                      <option value="">Select Course</option>
                      {coursesData?.allCourses?.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.name} - ₹{course.fee} ({course.duration} hours)
                        </option>
                      ))}
                    </select>
                    {errors.courseId && <div className="invalid-feedback">{errors.courseId}</div>}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Instructor</label>
                    <select
                      className="form-select"
                      name="instructorId"
                      value={formData.instructorId}
                      onChange={handleChange}
                    >
                      <option value="">Select Instructor</option>
                      {instructorsData?.allInstructors?.map(instructor => (
                        <option key={instructor.id} value={instructor.id}>
                          {instructor.name} ({instructor.specialization})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Batch Number</label>
                    <input
                      type="text"
                      className="form-control"
                      name="batchNumber"
                      value={formData.batchNumber}
                      onChange={handleChange}
                      placeholder="e.g., BATCH-2024-01"
                    />
                  </div>

                  {!isEdit && (
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Admission Fee</label>
                      <input
                        type="number"
                        className="form-control"
                        name="admissionFee"
                        value={formData.admissionFee}
                        onChange={handleChange}
                        placeholder="Auto-filled from course fee"
                      />
                    </div>
                  )}
                </div>

                <div className="d-flex justify-content-between">
                  <Link to="/students" className="btn btn-outline-secondary">
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : isEdit ? 'Update Student' : 'Create Student'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentForm
