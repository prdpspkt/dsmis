'use client'

import { useState } from 'react'
import { Modal, Form, Button, Row, Col, Alert, Card } from 'react-bootstrap'
import { useMutation } from '@apollo/client'
import { CREATE_JOURNAL_ENTRY } from '../../graphql/accountingQueries'
import { formatCurrency } from '../../utils/format'

function CreateJournalEntryModal({ show, onHide, accounts = [] }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    debitEntries: [{ accountCode: '', amount: '', narration: '' }],
    creditEntries: [{ accountCode: '', amount: '', narration: '' }],
    referenceType: '',
    referenceId: ''
  })

  const [error, setError] = useState('')

  const [createJournalEntry, { loading }] = useMutation(CREATE_JOURNAL_ENTRY, {
    onCompleted: (data) => {
      onHide()
      resetForm()
      setError('')
    },
    onError: (err) => {
      setError(err.message || 'Failed to create journal entry')
    }
  })

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      debitEntries: [{ accountCode: '', amount: '', narration: '' }],
      creditEntries: [{ accountCode: '', amount: '', narration: '' }],
      referenceType: '',
      referenceId: ''
    })
  }

  const handleAddLine = (type) => {
    const entries = type === 'debit' ? formData.debitEntries : formData.creditEntries
    entries.push({ accountCode: '', amount: '', narration: '' })
    setFormData({
      ...formData,
      [`${type}Entries`]: entries
    })
  }

  const handleRemoveLine = (type, index) => {
    const entries = type === 'debit' ? formData.debitEntries : formData.creditEntries
    if (entries.length > 1) {
      entries.splice(index, 1)
      setFormData({
        ...formData,
        [`${type}Entries`]: entries
      })
    }
  }

  const handleLineChange = (type, index, field, value) => {
    const entries = type === 'debit' ? formData.debitEntries : formData.creditEntries
    entries[index][field] = value
    setFormData({
      ...formData,
      [`${type}Entries`]: entries
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    const totalDebit = formData.debitEntries.reduce(
      (sum, entry) => sum + parseFloat(entry.amount || 0), 0
    )
    const totalCredit = formData.creditEntries.reduce(
      (sum, entry) => sum + parseFloat(entry.amount || 0), 0
    )

    if (totalDebit !== totalCredit) {
      setError(`Debits (${formatCurrency(totalDebit)}) must equal credits (${formatCurrency(totalCredit)})`)
      return
    }

    if (totalDebit === 0) {
      setError('Transaction amount cannot be zero')
      return
    }

    const debitEntriesJson = formData.debitEntries.map(e => {
      const entry = {
        account_code: e.accountCode,
        amount: parseFloat(e.amount),
        narration: e.narration || ''
      }
      return JSON.stringify(entry)
    })

    const creditEntriesJson = formData.creditEntries.map(e => {
      const entry = {
        account_code: e.accountCode,
        amount: parseFloat(e.amount),
        narration: e.narration || ''
      }
      return JSON.stringify(entry)
    })

    createJournalEntry({
      variables: {
        date: formData.date,
        description: formData.description,
        debitEntries: debitEntriesJson,
        creditEntries: creditEntriesJson,
        referenceType: formData.referenceType || null,
        referenceId: formData.referenceId || null,
        autoPost: true
      }
    })
  }

  const totalDebit = formData.debitEntries.reduce(
    (sum, entry) => sum + parseFloat(entry.amount || 0), 0
  )
  const totalCredit = formData.creditEntries.reduce(
    (sum, entry) => sum + parseFloat(entry.amount || 0), 0
  )

  return (
    <Modal show={show} onHide={onHide} size="xl" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Create Journal Entry</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Reference Type (Optional)</Form.Label>
                <Form.Select
                  value={formData.referenceType}
                  onChange={(e) => setFormData({ ...formData, referenceType: e.target.value })}
                >
                  <option value="">None</option>
                  <option value="INVOICE">Invoice</option>
                  <option value="PAYMENT">Payment</option>
                  <option value="EXPENSE">Expense</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Transaction description"
              required
            />
          </Form.Group>

          <Row>
            <Col md={6}>
              <h6 className="mb-3">Debit Entries</h6>
              {formData.debitEntries.map((entry, index) => (
                <div key={index} className="mb-3 p-3 border rounded bg-light">
                  <Form.Group className="mb-2">
                    <Form.Label>Account</Form.Label>
                    <Form.Select
                      value={entry.accountCode}
                      onChange={(e) => handleLineChange('debit', index, 'accountCode', e.target.value)}
                      required
                    >
                      <option value="">Select Account</option>
                      {accounts.map(account => (
                        <option key={account.code} value={account.code}>
                          {account.code} - {account.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Amount</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={entry.amount}
                      onChange={(e) => handleLineChange('debit', index, 'amount', e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Narration</Form.Label>
                    <Form.Control
                      type="text"
                      value={entry.narration}
                      onChange={(e) => handleLineChange('debit', index, 'narration', e.target.value)}
                      placeholder="Description (optional)"
                    />
                  </Form.Group>
                  {formData.debitEntries.length > 1 && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleRemoveLine('debit', index)}
                    >
                      <i className="bi bi-trash me-1"></i>
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => handleAddLine('debit')}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Add Debit Line
              </Button>
            </Col>

            <Col md={6}>
              <h6 className="mb-3">Credit Entries</h6>
              {formData.creditEntries.map((entry, index) => (
                <div key={index} className="mb-3 p-3 border rounded bg-light">
                  <Form.Group className="mb-2">
                    <Form.Label>Account</Form.Label>
                    <Form.Select
                      value={entry.accountCode}
                      onChange={(e) => handleLineChange('credit', index, 'accountCode', e.target.value)}
                      required
                    >
                      <option value="">Select Account</option>
                      {accounts.map(account => (
                        <option key={account.code} value={account.code}>
                          {account.code} - {account.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Amount</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={entry.amount}
                      onChange={(e) => handleLineChange('credit', index, 'amount', e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Narration</Form.Label>
                    <Form.Control
                      type="text"
                      value={entry.narration}
                      onChange={(e) => handleLineChange('credit', index, 'narration', e.target.value)}
                      placeholder="Description (optional)"
                    />
                  </Form.Group>
                  {formData.creditEntries.length > 1 && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleRemoveLine('credit', index)}
                    >
                      <i className="bi bi-trash me-1"></i>
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => handleAddLine('credit')}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Add Credit Line
              </Button>
            </Col>
          </Row>

          <hr className="my-4" />

          <Row className="mb-3">
            <Col md={6}>
              <Card bg="light">
                <Card.Body>
                  <h6 className="mb-0">Total Debit: <strong>{formatCurrency(totalDebit)}</strong></h6>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card bg="light">
                <Card.Body>
                  <h6 className="mb-0">Total Credit: <strong>{formatCurrency(totalCredit)}</strong></h6>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {totalDebit !== totalCredit && (
            <Alert variant="warning">
              <i className="bi bi-exclamation-triangle me-2"></i>
              Debits and credits must be equal. Difference: {formatCurrency(Math.abs(totalDebit - totalCredit))}
            </Alert>
          )}

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button variant="secondary" onClick={onHide} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loading || totalDebit !== totalCredit || totalDebit === 0}
            >
              {loading ? 'Creating...' : 'Create Entry'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  )
}

export default CreateJournalEntryModal
