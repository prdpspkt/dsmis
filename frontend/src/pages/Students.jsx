'use client'

import { useQuery, useMutation } from '@apollo/client'
import Link from 'next/link'
import { GET_ALL_STUDENTS, DELETE_STUDENT } from '../graphql/studentQueries'
import styles from './Students.module.css'

function Students() {
  const { loading, error, data, refetch } = useQuery(GET_ALL_STUDENTS)
  const [deleteStudent] = useMutation(DELETE_STUDENT, {
    onCompleted: () => refetch()
  })

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete student ${name}?`)) {
      try {
        await deleteStudent({ variables: { id } })
        alert('Student deleted successfully')
      } catch (err) {
        alert('Error deleting student: ' + err.message)
      }
    }
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-success'
      case 'COMPLETED': return 'bg-primary'
      case 'DROPPED': return 'bg-danger'
      default: return 'bg-secondary'
    }
  }

  if (loading) return <div className="text-center mt-5"><div className="spinner-border" role="status"></div></div>
  if (error) return <div className="alert alert-danger m-4">Error: {error.message}</div>

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Students</h2>
            <Link href="/students/new" className="btn btn-primary">
              + Add Student
            </Link>
          </div>

          {data?.allStudents?.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <p className="text-muted mb-0">No students found. Add your first student!</p>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Student ID</th>
                        <th>Name</th>
                        <th>Contact</th>
                        <th>Course</th>
                        <th>Progress</th>
                        <th>Status</th>
                        <th>Fee Due</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.allStudents?.map(student => (
                        <tr key={student.id}>
                          <td><strong>{student.studentId}</strong></td>
                          <td>
                            {student.fullName}
                            {student.email && <small className="d-block text-muted">{student.email}</small>}
                          </td>
                          <td>{student.contact}</td>
                          <td>{student.course?.name}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="flex-grow-1 me-2">
                                <div className={`progress ${styles.progressThin}`}>
                                  <div
                                    className={`progress-bar ${student.progressPercentage === 100 ? 'bg-success' : student.progressPercentage > 70 ? 'bg-warning' : 'bg-primary'}`}
                                    role="progressbar"
                                    style={{ width: `${student.progressPercentage || 0}%` }}
                                  ></div>
                                </div>
                                <small className="text-muted">
                                  {student.remainingHours || 0}h left
                                </small>
                              </div>
                              <small className="text-muted">{student.progressPercentage || 0}%</small>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${getStatusClass(student.status)}`}>
                              {student.status}
                            </span>
                          </td>
                          <td className={student.feeDue > 0 ? 'text-danger fw-bold' : 'text-success'}>
                            ₹{student.feeDue}
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm" role="group">
                              <Link href={`/students/${student.id}`} className="btn btn-outline-primary">
                                View
                              </Link>
                              <Link href={`/students/${student.id}/edit`} className="btn btn-outline-secondary">
                                Edit
                              </Link>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => handleDelete(student.id, student.fullName)}
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Students
