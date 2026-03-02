'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useAuth } from '../contexts/AuthContext'
import {
  GET_ALL_USERS,
  GET_ACTIVE_CUSTOM_ROLES,
  GET_ALL_PERMISSIONS,
  CREATE_USER,
  UPDATE_USER,
  SET_USER_PASSWORD,
  DELETE_USER
} from '../graphql/roleQueries'

function Users() {
  const { user } = useAuth()
  const isSuperuser = user?.is_superuser || false

  const [showModal, setShowModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [passwordUser, setPasswordUser] = useState(null)
  const [selectedRole, setSelectedRole] = useState(null)
  const [selectedAdditionalPermissions, setSelectedAdditionalPermissions] = useState([])
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    password: '',
    isStaff: false,
    isActive: true
  })

  const { data: usersData, loading: usersLoading, refetch: refetchUsers } = useQuery(GET_ALL_USERS)
  const { data: rolesData } = useQuery(GET_ACTIVE_CUSTOM_ROLES)
  const { data: permissionsData } = useQuery(GET_ALL_PERMISSIONS)

  const [createUser] = useMutation(CREATE_USER, {
    onCompleted: () => {
      refetchUsers()
      handleCloseModal()
    },
    onError: (error) => {
      alert(error.message || 'Failed to create user')
    }
  })

  const [updateUser] = useMutation(UPDATE_USER, {
    onCompleted: () => {
      refetchUsers()
      handleCloseModal()
    },
    onError: (error) => {
      alert(error.message || 'Failed to update user')
    }
  })

  const [setUserPassword] = useMutation(SET_USER_PASSWORD, {
    onCompleted: () => {
      alert('Password updated successfully!')
      setShowPasswordModal(false)
      setPasswordUser(null)
    },
    onError: (error) => {
      alert(error.message || 'Failed to update password')
    }
  })

  const [deleteUser] = useMutation(DELETE_USER, {
    onCompleted: () => {
      refetchUsers()
    },
    onError: (error) => {
      alert(error.message || 'Failed to delete user')
    }
  })

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        username: user.username,
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        address: user.address || '',
        isStaff: user.isStaff || false,
        isActive: user.isActive
      })
      setSelectedRole(user.customRole?.id || null)
      setSelectedAdditionalPermissions(
        user.additionalPermissions?.map(p => p.id) || []
      )
    } else {
      setEditingUser(null)
      setFormData({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        password: '',
        isStaff: false,
        isActive: true
      })
      setSelectedRole(null)
      setSelectedAdditionalPermissions([])
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingUser(null)
    setFormData({
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      address: '',
      password: '',
      isStaff: false,
      isActive: true
    })
    setSelectedRole(null)
    setSelectedAdditionalPermissions([])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!editingUser && !formData.password) {
      alert('Password is required for new users')
      return
    }

    if (editingUser) {
      await updateUser({
        variables: {
          id: editingUser.id,
          username: formData.username,
          email: formData.email || null,
          firstName: formData.firstName || null,
          lastName: formData.lastName || null,
          phone: formData.phone || null,
          address: formData.address || null,
          customRoleId: selectedRole,
          additionalPermissionIds: selectedAdditionalPermissions,
          isStaff: formData.isStaff,
          isActive: formData.isActive
        }
      })
    } else {
      await createUser({
        variables: {
          username: formData.username,
          email: formData.email || null,
          firstName: formData.firstName || null,
          lastName: formData.lastName || null,
          password: formData.password,
          phone: formData.phone || null,
          address: formData.address || null,
          customRoleId: selectedRole,
          additionalPermissionIds: selectedAdditionalPermissions,
          isStaff: formData.isStaff,
          isActive: formData.isActive
        }
      })
    }
  }

  const handleSetPassword = (user) => {
    setPasswordUser(user)
    setShowPasswordModal(true)
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const password = formData.get('password')

    if (password.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }

    await setUserPassword({
      variables: {
        id: passwordUser.id,
        password
      }
    })
  }

  const handleDelete = async (user) => {
    if (user.isSuperuser) {
      alert('Cannot delete superuser accounts')
      return
    }

    if (user.id === user?.id) {
      alert('Cannot delete your own account')
      return
    }

    if (window.confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      await deleteUser({ variables: { id: user.id } })
    }
  }

  const toggleAdditionalPermission = (permissionId) => {
    setSelectedAdditionalPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  // Filter permissions - only show ones the current user has (unless superuser)
  const availablePermissions = isSuperuser
    ? permissionsData?.allPermissions || []
    : (permissionsData?.allPermissions || []).filter(perm =>
        user?.all_permissions?.includes(perm.name)
      )

  if (usersLoading) {
    return <div className="text-center mt-5"><div className="spinner-border" role="status"></div></div>
  }

  const users = usersData?.allUsers || []
  const roles = rolesData?.activeCustomRoles || []

  // Filter out superusers from the list (unless current user is superuser)
  const displayUsers = isSuperuser
    ? users
    : users.filter(u => !u.isSuperuser)

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>User Management</h2>
          <p className="text-muted mb-0">Create and manage users with roles and permissions</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <i className="fas fa-plus me-2"></i>Add User
        </button>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="info-box bg-info">
            <span className="info-box-icon"><i className="fas fa-users"></i></span>
            <div className="info-box-content">
              <span className="info-box-text">Total Users</span>
              <span className="info-box-number">{displayUsers.length}</span>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="info-box bg-success">
            <span className="info-box-icon"><i className="fas fa-user-check"></i></span>
            <div className="info-box-content">
              <span className="info-box-text">Active Users</span>
              <span className="info-box-number">{displayUsers.filter(u => u.isActive).length}</span>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="info-box bg-warning">
            <span className="info-box-icon"><i className="fas fa-user-tag"></i></span>
            <div className="info-box-content">
              <span className="info-box-text">Staff</span>
              <span className="info-box-number">{displayUsers.filter(u => u.isStaff).length}</span>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="info-box bg-primary">
            <span className="info-box-icon"><i className="fas fa-user-shield"></i></span>
            <div className="info-box-content">
              <span className="info-box-text">Roles</span>
              <span className="info-box-number">{roles.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title mb-0">All Users</h3>
        </div>
        <div className="card-body">
          {displayUsers.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Permissions</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayUsers.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.username}</strong>
                        {u.isSuperuser && (
                          <span className="badge bg-danger ms-2">Superuser</span>
                        )}
                      </td>
                      <td>
                        {u.firstName || u.lastName
                          ? `${u.firstName || ''} ${u.lastName || ''}`.trim()
                          : '-'}
                      </td>
                      <td>{u.email || '-'}</td>
                      <td>{u.customRoleName || '-'}</td>
                      <td>
                        <span className="badge bg-info">{u.permissionCount} permissions</span>
                      </td>
                      <td>
                        {u.isSuperuser ? (
                          <span className="badge bg-danger">Superuser</span>
                        ) : (
                          <>
                            <span className={`badge ${u.isActive ? 'bg-success' : 'bg-danger'}`}>
                              {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {u.isStaff && (
                              <span className="badge bg-warning ms-1">Staff</span>
                            )}
                          </>
                        )}
                      </td>
                      <td>{u.createdBy?.username || 'System'}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-info me-1"
                          onClick={() => handleOpenModal(u)}
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-warning me-1"
                          onClick={() => handleSetPassword(u)}
                          title="Change Password"
                        >
                          <i className="fas fa-key"></i>
                        </button>
                        {!u.isSuperuser && u.id !== user?.id && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(u)}
                            title="Delete"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-muted py-5">
              <i className="fas fa-users fa-3x mb-3"></i>
              <p>No users found. Create your first user to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Username <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          required
                        />
                      </div>
                    </div>
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
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">First Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Last Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {!editingUser && (
                    <div className="mb-3">
                      <label className="form-label">Password <span className="text-danger">*</span></label>
                      <input
                        type="password"
                        className="form-control"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength="6"
                      />
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label">Phone</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
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

                  <div className="mb-3">
                    <label className="form-label">Role</label>
                    <select
                      className="form-select"
                      value={selectedRole || ''}
                      onChange={(e) => setSelectedRole(e.target.value || null)}
                    >
                      <option value="">No Role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                    <small className="form-text text-muted">
                      Assign a role to grant predefined permissions
                    </small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Additional Permissions</label>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '4px', padding: '10px' }}>
                      {availablePermissions.length > 0 ? (
                        availablePermissions.map((permission) => (
                          <div key={permission.id} className="form-check">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id={`user-perm-${permission.id}`}
                              checked={selectedAdditionalPermissions.includes(permission.id)}
                              onChange={() => toggleAdditionalPermission(permission.id)}
                            />
                            <label className="form-check-label" htmlFor={`user-perm-${permission.id}`}>
                              {permission.display_name}
                            </label>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted">No permissions available</p>
                      )}
                    </div>
                    <small className="form-text text-muted">
                      {isSuperuser
                        ? 'Add extra permissions beyond the role'
                        : 'You can only grant permissions you have'}
                    </small>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-check mb-3">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="isStaff"
                          checked={formData.isStaff}
                          onChange={(e) => setFormData({ ...formData, isStaff: e.target.checked })}
                        />
                        <label className="form-check-label" htmlFor="isStaff">
                          Staff Status
                        </label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-check mb-3">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="isActive"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        />
                        <label className="form-check-label" htmlFor="isActive">
                          Active
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editingUser ? 'Update User' : 'Create User'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && passwordUser && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Change Password</h5>
                <button type="button" className="btn-close" onClick={() => setShowPasswordModal(false)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handlePasswordSubmit}>
                  <div className="mb-3">
                    <label className="form-label">User</label>
                    <input
                      type="text"
                      className="form-control"
                      value={passwordUser.username}
                      disabled
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">New Password <span className="text-danger">*</span></label>
                    <input
                      type="password"
                      name="password"
                      className="form-control"
                      required
                      minLength="6"
                      placeholder="Enter new password (min 6 characters)"
                    />
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Change Password
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

export default Users
