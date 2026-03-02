'use client'

import { useState } from 'react'
import { Table, Button, Modal, Form, Badge } from 'react-bootstrap'
import { useQuery, useMutation } from '@apollo/client'
import { GET_ALL_ACCOUNTS, CREATE_ACCOUNT, UPDATE_ACCOUNT } from '../../graphql/accountingQueries'
import { formatCurrency } from '../../utils/format'
import styles from './ChartOfAccounts.module.css'

function ChartOfAccounts() {
  const [showModal, setShowModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    accountType: 'ASSET',
    parentAccountId: '',
    description: '',
    openingBalance: 0
  })

  const { data, loading, refetch } = useQuery(GET_ALL_ACCOUNTS)
  const [createAccount] = useMutation(CREATE_ACCOUNT, { onCompleted: refetch })
  const [updateAccount] = useMutation(UPDATE_ACCOUNT, { onCompleted: refetch })

  const accounts = data?.allAccounts || []

  const accountTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']
  const typeColors = {
    ASSET: 'primary',
    LIABILITY: 'warning',
    EQUITY: 'info',
    REVENUE: 'success',
    EXPENSE: 'danger'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingAccount) {
        await updateAccount({
          variables: {
            id: editingAccount.id,
            name: formData.name,
            description: formData.description,
            isActive: true
          }
        })
      } else {
        await createAccount({
          variables: {
            code: formData.code,
            name: formData.name,
            accountType: formData.accountType,
            parentAccountId: formData.parentAccountId || null,
            description: formData.description,
            openingBalance: parseFloat(formData.openingBalance) || 0
          }
        })
      }
      handleClose()
    } catch (error) {
      console.error('Error saving account:', error)
      alert('Error saving account: ' + error.message)
    }
  }

  const handleEdit = (account) => {
    setEditingAccount(account)
    setFormData({
      code: account.code,
      name: account.name,
      accountType: account.accountType,
      parentAccountId: account.parentAccountId || '',
      description: account.description || '',
      openingBalance: account.openingBalance
    })
    setShowModal(true)
  }

  const handleClose = () => {
    setShowModal(false)
    setEditingAccount(null)
    setFormData({
      code: '',
      name: '',
      accountType: 'ASSET',
      parentAccountId: '',
      description: '',
      openingBalance: 0
    })
  }

  // Group accounts by type
  const groupedAccounts = accountTypes.reduce((acc, type) => {
    acc[type] = accounts.filter(a => a.accountType === type)
    return acc
  }, {})

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Chart of Accounts</h5>
        <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-circle me-2"></i>
          Add Account
        </Button>
      </div>

      {accountTypes.map(type => (
        <div key={type} className="mb-4">
          <h6 className="mb-2">
            <Badge bg={typeColors[type]}>{type.replace('_', ' ')}</Badge>
          </h6>
          <Table size="sm" striped bordered hover>
            <thead>
              <tr>
                <th className={styles.codeColumn}>Code</th>
                <th>Name</th>
                <th className={styles.balanceColumn}>Balance</th>
                <th className={styles.actionsColumn}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {groupedAccounts[type]?.map(account => (
                <tr key={account.id}>
                  <td>{account.code}</td>
                  <td>{account.name}</td>
                  <td>{formatCurrency(account.currentBalance)}</td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => handleEdit(account)}
                    >
                      <i className="bi bi-pencil"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ))}

      {/* Add/Edit Account Modal */}
      <Modal show={showModal} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingAccount ? 'Edit Account' : 'Add New Account'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Account Code</Form.Label>
              <Form.Control
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., 1000"
                disabled={editingAccount}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Account Name</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Cash"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Account Type</Form.Label>
              <Form.Select
                value={formData.accountType}
                onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                disabled={editingAccount}
                required
              >
                {accountTypes.map(type => (
                  <option key={type} value={type}>{type.replace('_', ' ')}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Opening Balance</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                value={formData.openingBalance}
                onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })}
                disabled={editingAccount}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Account description (optional)"
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={handleClose}>Cancel</Button>
              <Button variant="primary" type="submit">
                {editingAccount ? 'Update' : 'Create'} Account
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default ChartOfAccounts
