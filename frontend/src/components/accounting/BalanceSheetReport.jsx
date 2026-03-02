'use client'

import { useState } from 'react'
import { Table, Form, Button, Badge, Card, Row, Col } from 'react-bootstrap'
import { useQuery } from '@apollo/client'
import { GET_BALANCE_SHEET } from '../../graphql/accountingQueries'
import { formatCurrency, formatDate } from '../../utils/format'

function BalanceSheetReport() {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0])

  const { data, loading, refetch } = useQuery(GET_BALANCE_SHEET, {
    variables: { asOfDate },
    skip: !asOfDate
  })

  const balanceSheet = data?.balanceSheet

  const handleRefresh = () => {
    if (asOfDate) {
      refetch()
    }
  }

  if (loading) {
    return <div className="text-center py-5">Loading balance sheet...</div>
  }

  if (!balanceSheet) {
    return (
      <div className="text-center py-5">
        <p>Select a date to generate balance sheet</p>
      </div>
    )
  }

  const assets = balanceSheet.assets?.items || []
  const liabilities = balanceSheet.liabilities?.items || []
  const equity = balanceSheet.equity?.items || []

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
                <Badge bg={balanceSheet.isBalanced ? 'success' : 'danger'}>
                  {balanceSheet.isBalanced ? 'Balanced' : 'Not Balanced'}
                </Badge>
              </h5>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <h5 className="mb-3">Balance Sheet - {formatDate(balanceSheet.asOfDate)}</h5>

      <Row>
        {/* Assets */}
        <Col md={6}>
          <Card className="mb-3">
            <Card.Header className="bg-primary text-white">
              <h6 className="mb-0">Assets</h6>
            </Card.Header>
            <Card.Body>
              <Table size="sm" hover>
                <thead>
                  <tr>
                    <th>Account</th>
                    <th className="text-end">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map(item => (
                    <tr key={item.accountCode}>
                      <td>{item.accountCode} - {item.accountName}</td>
                      <td className="text-end">{formatCurrency(item.balance)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="table-secondary">
                    <th>Total Assets</th>
                    <th className="text-end">{formatCurrency(balanceSheet.assets?.total || 0)}</th>
                  </tr>
                </tfoot>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        {/* Liabilities & Equity */}
        <Col md={6}>
          <Card className="mb-3">
            <Card.Header className="bg-warning text-dark">
              <h6 className="mb-0">Liabilities</h6>
            </Card.Header>
            <Card.Body>
              <Table size="sm" hover>
                <thead>
                  <tr>
                    <th>Account</th>
                    <th className="text-end">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {liabilities.map(item => (
                    <tr key={item.accountCode}>
                      <td>{item.accountCode} - {item.accountName}</td>
                      <td className="text-end">{formatCurrency(item.balance)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="table-secondary">
                    <th>Total Liabilities</th>
                    <th className="text-end">{formatCurrency(balanceSheet.liabilities?.total || 0)}</th>
                  </tr>
                </tfoot>
              </Table>
            </Card.Body>
          </Card>

          <Card className="mb-3">
            <Card.Header className="bg-info text-white">
              <h6 className="mb-0">Equity</h6>
            </Card.Header>
            <Card.Body>
              <Table size="sm" hover>
                <thead>
                  <tr>
                    <th>Account</th>
                    <th className="text-end">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {equity.map(item => (
                    <tr key={item.accountCode}>
                      <td>{item.accountCode} - {item.accountName}</td>
                      <td className="text-end">{formatCurrency(item.balance)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="table-secondary">
                    <th>Total Equity</th>
                    <th className="text-end">{formatCurrency(balanceSheet.equity?.total || 0)}</th>
                  </tr>
                </tfoot>
              </Table>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header className="bg-success text-white">
              <h6 className="mb-0">Summary</h6>
            </Card.Header>
            <Card.Body>
              <Table size="sm">
                <tbody>
                  <tr>
                    <td><strong>Total Liabilities & Equity:</strong></td>
                    <td className="text-end">
                      <strong>{formatCurrency(balanceSheet.totalLiabilitiesEquity || 0)}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Total Assets:</strong></td>
                    <td className="text-end">
                      <strong>{formatCurrency(balanceSheet.assets?.total || 0)}</strong>
                    </td>
                  </tr>
                  <tr className="table-secondary">
                    <td><strong>Difference:</strong></td>
                    <td className="text-end">
                      <strong>
                        {formatCurrency(
                          (balanceSheet.assets?.total || 0) - (balanceSheet.totalLiabilitiesEquity || 0)
                        )}
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default BalanceSheetReport
