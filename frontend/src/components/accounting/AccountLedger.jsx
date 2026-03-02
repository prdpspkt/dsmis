'use client'

import { useState } from 'react'
import { Table, Form, Button, Card, Row, Col, Badge } from 'react-bootstrap'
import { useQuery } from '@apollo/client'
import { GET_ALL_ACCOUNTS, GET_ACCOUNT_LEDGER } from '../../graphql/accountingQueries'
import { formatCurrency, formatDate } from '../../utils/format'

function AccountLedger({ initialAccountCode = '' }) {
  const [accountCode, setAccountCode] = useState(initialAccountCode || '')
  const [asOfDate, setAsOfDate] = useState('')

  const { data: accountsData } = useQuery(GET_ALL_ACCOUNTS)
  const { data: ledgerData, loading, refetch } = useQuery(GET_ACCOUNT_LEDGER, {
    variables: { accountCode, asOfDate },
    skip: !accountCode
  })

  const accounts = accountsData?.allAccounts || []
  const ledger = ledgerData?.accountLedger

  const handleSearch = () => {
    if (accountCode) {
      refetch()
    }
  }

  const handleReset = () => {
    setAccountCode('')
    setAsOfDate('')
  }

  return (
    <div>
      <Card className="mb-4">
        <Card.Body>
          <Form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
            <Row className="align-items-end">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Account</Form.Label>
                  <Form.Select
                    value={accountCode}
                    onChange={(e) => setAccountCode(e.target.value)}
                  >
                    <option value="">Select Account</option>
                    {accounts.map(account => (
                      <option key={account.code} value={account.code}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>As Of Date (Optional)</Form.Label>
                  <Form.Control
                    type="date"
                    value={asOfDate}
                    onChange={(e) => setAsOfDate(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Button variant="primary" type="submit" className="me-2">
                  <i className="bi bi-search me-2"></i>
                  View
                </Button>
                <Button variant="outline-secondary" onClick={handleReset}>
                  Reset
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {ledger && (
        <>
          <Card className="mb-3">
            <Card.Header>
              <h6 className="mb-0">
                Ledger: {ledger.accountCode} - {ledger.accountName}
                <Badge bg="secondary" className="ms-2">{ledger.accountType}</Badge>
              </h6>
            </Card.Header>
            <Card.Body>
              <h5 className="text-end">
                Current Balance: {formatCurrency(ledger.currentBalance)}
              </h5>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              {loading ? (
                <div className="text-center py-5">Loading ledger...</div>
              ) : ledger.entries && ledger.entries.length > 0 ? (
                <Table striped bordered hover responsive size="sm">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Particular</th>
                      <th>Voucher Type</th>
                      <th>Voucher No.</th>
                      <th className="text-end">Debit</th>
                      <th className="text-end">Credit</th>
                      <th className="text-end">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.entries.map((entry, index) => (
                      <tr key={index}>
                        <td>{formatDate(entry.date)}</td>
                        <td>{entry.particular}</td>
                        <td>
                          <Badge bg="info">{entry.voucherType}</Badge>
                        </td>
                        <td>{entry.voucherNumber}</td>
                        <td className="text-end">
                          {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                        </td>
                        <td className="text-end">
                          {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                        </td>
                        <td className="text-end">
                          <strong>{formatCurrency(entry.balance)}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-inbox display-4"></i>
                  <p className="mt-3">No ledger entries found for this account</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </>
      )}

      {!ledger && accountCode && (
        <Card>
          <Card.Body className="text-center py-5 text-muted">
            <i className="bi bi-search display-4"></i>
            <p className="mt-3">Click "View" to load ledger for selected account</p>
          </Card.Body>
        </Card>
      )}

      {!ledger && !accountCode && (
        <Card>
          <Card.Body className="text-center py-5 text-muted">
            <i className="bi bi-book display-4"></i>
            <p className="mt-3">Select an account to view its ledger</p>
          </Card.Body>
        </Card>
      )}
    </div>
  )
}

export default AccountLedger
