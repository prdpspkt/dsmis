'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useAuth } from '../contexts/AuthContext'
import {
  GET_ALL_CUSTOM_ROLES,
  GET_ALL_PERMISSIONS,
  CREATE_CUSTOM_ROLE,
  UPDATE_CUSTOM_ROLE,
  DELETE_CUSTOM_ROLE
} from '../graphql/roleQueries'

function Roles() {
  const { user } = useAuth()
  const isSuperuser = user?.is_superuser || false

  const [showModal, setShowModal] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [selectedPermissions, setSelectedPermissions] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  })

  const { data: rolesData, loading: rolesLoading, refetch: refetchRoles } = useQuery(GET_ALL_CUSTOM_ROLES)
  const { data: permissionsData } = useQuery(GET_ALL_PERMISSIONS)

  const [createRole] = useMutation(CREATE_CUSTOM_ROLE, {
    onCompleted: () => {
      refetchRoles()
      handleCloseModal()
    },
    onError: (error) => {
      alert(error.message || 'Failed to create role')
    }
  })

  const [updateRole] = useMutation(UPDATE_CUSTOM_ROLE, {
    onCompleted: () => {
      refetchRoles()
      handleCloseModal()
    },
    onError: (error) => {
      alert(error.message || 'Failed to update role')
    }
  })

  const [deleteRole] = useMutation(DELETE_CUSTOM_ROLE, {
    onCompleted: () => {
      refetchRoles()
    },
    onError: (error) => {
      alert(error.message || 'Failed to delete role')
    }
  })

  const handleOpenModal = (role = null) => {
    if (role) {
      setEditingRole(role)
      setFormData({
        name: role.name,
        description: role.description || '',
        isActive: role.isActive
      })
      setSelectedPermissions(role.permissions?.map(p => p.id) || [])
    } else {
      setEditingRole(null)
      setFormData({
        name: '',
        description: '',
        isActive: true
      })
      setSelectedPermissions([])
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingRole(null)
    setFormData({
      name: '',
      description: '',
      isActive: true
    })
    setSelectedPermissions([])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isSuperuser) {
      alert('Only superusers can manage roles')
      return
    }

    if (editingRole) {
      await updateRole({
        variables: {
          id: editingRole.id,
          name: formData.name,
          description: formData.description,
          permissionIds: selectedPermissions,
          isActive: formData.isActive
        }
      })
    } else {
      await createRole({
        variables: {
          name: formData.name,
          description: formData.description,
          permissionIds: selectedPermissions
        }
      })
    }
  }

  const handleDelete = async (role) => {
    if (!isSuperuser) {
      alert('Only superusers can delete roles')
      return
    }

    // Check if role has users
    if (window.confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      await deleteRole({ variables: { id: role.id } })
    }
  }

  const togglePermission = (permissionId) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  const groupPermissionsByCategory = (permissions) => {
    const grouped = {}
    permissions?.forEach(perm => {
      const category = perm.category || 'other'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(perm)
    })
    return grouped
  }

  if (rolesLoading) {
    return <div className="text-center mt-5"><div className="spinner-border" role="status"></div></div>
  }

  const roles = rolesData?.allCustomRoles || []
  const permissions = permissionsData?.allPermissions || []
  const groupedPermissions = groupPermissionsByCategory(permissions)

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Role Management</h2>
          <p className="text-muted mb-0">Create and manage custom roles with permissions</p>
        </div>
        {isSuperuser && (
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <i className="fas fa-plus me-2"></i>Add Role
          </button>
        )}
        {!isSuperuser && (
          <div className="alert alert-warning mb-0 py-2 px-3">
            <i className="fas fa-lock me-2"></i>
            Only superusers can manage roles
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="info-box bg-info">
            <span className="info-box-icon"><i className="fas fa-user-tag"></i></span>
            <div className="info-box-content">
              <span className="info-box-text">Total Roles</span>
              <span className="info-box-number">{roles.length}</span>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="info-box bg-success">
            <span className="info-box-icon"><i className="fas fa-check-circle"></i></span>
            <div className="info-box-content">
              <span className="info-box-text">Active Roles</span>
              <span className="info-box-number">{roles.filter(r => r.isActive).length}</span>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="info-box bg-primary">
            <span className="info-box-icon"><i className="fas fa-key"></i></span>
            <div className="info-box-content">
              <span className="info-box-text">Total Permissions</span>
              <span className="info-box-number">{permissions.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Roles Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title mb-0">All Custom Roles</h3>
        </div>
        <div className="card-body">
          {roles.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Role Name</th>
                    <th>Description</th>
                    <th>Permissions</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th>Created At</th>
                    {isSuperuser && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.id}>
                      <td>
                        <strong>{role.name}</strong>
                      </td>
                      <td>{role.description || '-'}</td>
                      <td>
                        <span className="badge bg-info">{role.permissionCount} permissions</span>
                      </td>
                      <td>
                        <span className={`badge ${role.isActive ? 'bg-success' : 'bg-danger'}`}>
                          {role.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{role.createdBy?.username || 'System'}</td>
                      <td>{new Date(role.createdAt).toLocaleDateString()}</td>
                      {isSuperuser && (
                        <td>
                          <button
                            className="btn btn-sm btn-info me-1"
                            onClick={() => handleOpenModal(role)}
                            title="Edit"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(role)}
                            title="Delete"
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
              <i className="fas fa-user-tag fa-3x mb-3"></i>
              <p>No roles found. {isSuperuser ? 'Create your first role to get started.' : 'Ask a superuser to create roles.'}</p>
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
                  {editingRole ? 'Edit Role' : 'Add New Role'}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Role Name <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., Driving School Admin, Account Manager"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the purpose of this role..."
                    ></textarea>
                  </div>

                  {editingRole && (
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
                          Active Role
                        </label>
                      </div>
                    </div>
                  )}

                  <hr />
                  <h6 className="mb-3">Permissions</h6>
                  <div className="mb-3">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary mb-2"
                      onClick={() => setSelectedPermissions(permissions.map(p => p.id))}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary mb-2 ms-2"
                      onClick={() => setSelectedPermissions([])}
                    >
                      Clear All
                    </button>
                    <span className="ms-3 text-muted">
                      {selectedPermissions.length} of {permissions.length} selected
                    </span>
                  </div>

                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                      <div key={category} className="mb-3">
                        <h6 className="text-primary text-uppercase" style={{ fontSize: '0.85rem' }}>
                          {category}
                        </h6>
                        <div className="row">
                          {categoryPermissions.map((permission) => (
                            <div key={permission.id} className="col-md-6 mb-2">
                              <div className="form-check">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  id={`perm-${permission.id}`}
                                  checked={selectedPermissions.includes(permission.id)}
                                  onChange={() => togglePermission(permission.id)}
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor={`perm-${permission.id}`}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <div>{permission.display_name}</div>
                                  {permission.description && (
                                    <small className="text-muted">{permission.description}</small>
                                  )}
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editingRole ? 'Update Role' : 'Create Role'}
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

export default Roles
