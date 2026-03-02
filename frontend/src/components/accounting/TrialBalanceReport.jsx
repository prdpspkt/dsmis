'use client'

import { useState } from 'react'
import { Table, Form, Button, Badge, Card, Row, Col } from 'react-bootstrap'
import { useQuery } from '@apollo/client'
import { GET_TRIAL_BALANCE } from '../../graphql/accountingQueries'
import { formatCurrency, formatDate } from '../../utils/format'

function TrialBalanceReport() {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0])

  const { data, loading, refetch } = useQuery(GET_TRIAL_BALANCE, {
    variables: { asOfDate },
    skip: !asOfDate
  })

  const trialBalance = data?.trialBalance

  const handleRefresh = () => {
    if (asOfDate) {
      refetch()
    }
  }

  if (loading) {
    return <div className="text-center py-5">Loading trial balance...</div>
  }

  if (!trialBalance) {
    return (
      <div className="text-center py-5">
        <p>Select a date to generate trial balance</p>
      </div>
    )
  }

  const accounts = trialBalance.accounts || []

  return (
    <div>
      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-end">
            <Col md={4}>
              <Form.Group>
                <Form.Label>As Of Date</Form.Label>
                <Form.Control
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Button variant="primary" onClick={handleRefresh}>
                <i className="bi bi-arrow-clockwise me-2"></i>
                Refresh
              </Button>
            </Col>
            <Col md={6} className="text-end">
              <h5 className="mb-0">
                <Badge bg={trialBalance.isBalanced ? 'success' : 'danger'}>
                  {trialBalance.isBalanced ? 'Balanced' : 'Not Balanced'}
                </Badge>
              </h5>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>
          <h6 className="mb-0">Trial Balance - {formatDate(trialBalance.asOfDate)}</h6>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Account Code</th>
                <th>Account Name</th>
                <th>Account Type</th>
                <th className="text-end">Debit</th>
                <th className="text-end">Credit</th>
                <th className="text-end">Balance</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(account => (
                <tr key={account.accountCode}>
                  <td>{account.accountCode}</td>
                  <td>{account.accountName}</td>
                  <td>
                    <Badge bg="secondary">{account.accountType}</Badge>
                  </td>
                  <td className="text-end">
                    {account.debit > 0 ? formatCurrency(account.debit) : '-'}
                  </td>
                  <td className="text-end">
                    {account.credit > 0 ? formatCurrency(account.credit) : '-'}
                  </td>
                  <td className="text-end">
                    <strong>{formatCurrency(account.balance)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="table-secondary">
                <th colSpan={3}>Total</th>
                <th className="text-end">{formatCurrency(trialBalance.totalDebit)}</th>
                <th className="text-end">{formatCurrency(trialBalance.totalCredit)}</th>
                <th></th>
              </tr>
            </tfoot>
          </Table>
        </Card.Body>
      </Card>

      <Row>
        <Col md={6}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Total Debits</Card.Title>
              <h3 className="text-primary">{formatCurrency(trialBalance.totalDebit)}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Total Credits</Card.Title>
              <h3 className="text-success">{formatCurrency(trialBalance.totalCredit)}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default TrialBalanceReport
