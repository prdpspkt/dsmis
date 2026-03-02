'use client'

import { useState } from 'react'
import { Tabs, Tab, Table, Form, Button, Card, Row, Col, Badge, Alert } from 'react-bootstrap'
import { useQuery } from '@apollo/client'
import { GET_DAILY_INCOME_SUMMARY, GET_ALL_RECEIVABLES, GET_OVERDUE_RECEIVABLES, GET_AGING_REPORT } from '../graphql/reportQueries'
import { GET_TRIAL_BALANCE, GET_BALANCE_SHEET, GET_INCOME_STATEMENT } from '../graphql/accountingQueries'
import { formatCurrency, formatDate } from '../utils/format'

function Reports() {
  const [activeTab, setActiveTab] = useState('income')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [balanceSheetDate, setBalanceSheetDate] = useState(new Date().toISOString().split('T')[0])
  const [trialBalanceDate, setTrialBalanceDate] = useState(new Date().toISOString().split('T')[0])

  // Report Queries
  const { data: incomeData, refetch: refetchIncome } = useQuery(GET_DAILY_INCOME_SUMMARY, {
    variables: dateRange
  })
  const { data: receivablesData } = useQuery(GET_ALL_RECEIVABLES)
  const { data: overdueData } = useQuery(GET_OVERDUE_RECEIVABLES)
  const { data: agingData } = useQuery(GET_AGING_REPORT)

  // Accounting Queries
  const { data: trialBalanceData, refetch: refetchTrialBalance } = useQuery(GET_TRIAL_BALANCE, {
    variables: { asOfDate: trialBalanceDate },
    skip: !trialBalanceDate
  })
  const { data: balanceSheetData, refetch: refetchBalanceSheet } = useQuery(GET_BALANCE_SHEET, {
    variables: { asOfDate: balanceSheetDate },
    skip: !balanceSheetDate
  })
  const { data: incomeStatementData, refetch: refetchIncomeStatement } = useQuery(GET_INCOME_STATEMENT, {
    variables: dateRange,
    skip: !dateRange.startDate || !dateRange.endDate
  })

  // Income Report Calculations
  const totalIncome = incomeData?.dailyIncomeSummary?.reduce((sum, day) => sum + parseFloat(day.totalIncome), 0) || 0
  const admissionIncome = incomeData?.dailyIncomeSummary?.reduce((sum, day) => sum + parseFloat(day.admissionIncome), 0) || 0
  const sessionIncome = incomeData?.dailyIncomeSummary?.reduce((sum, day) => sum + parseFloat(day.sessionIncome), 0) || 0
  const otherIncome = incomeData?.dailyIncomeSummary?.reduce((sum, day) => sum + parseFloat(day.otherIncome), 0) || 0

  // Receivables Calculations
  const totalReceivables = receivablesData?.allReceivables?.reduce((sum, r) => sum + parseFloat(r.totalDue), 0) || 0
  const totalOverdue = overdueData?.overdueReceivables?.reduce((sum, r) => sum + parseFloat(r.totalDue), 0) || 0

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Reports & Analytics</h2>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
        {/* Income Reports Tab */}
        <Tab eventKey="income" title="Income Reports">
          <Card className="mb-4">
            <Card.Body>
              <Row className="align-items-end">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Start Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>End Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Button variant="primary" onClick={() => refetchIncome({ variables: dateRange })}>
                    Apply Filter
                  </Button>
                  <Button
                    variant="outline-secondary"
                    className="ms-2"
                    onClick={() => setDateRange({
                      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      endDate: new Date().toISOString().split('T')[0]
                    })}
                  >
                    Last 30 Days
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-white bg-success">
                <Card.Body>
                  <Card.Title>Total Income</Card.Title>
                  <h3>{formatCurrency(totalIncome)}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-white bg-primary">
                <Card.Body>
                  <Card.Title>Admission Income</Card.Title>
                  <h3>{formatCurrency(admissionIncome)}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-white bg-info">
                <Card.Body>
                  <Card.Title>Session Income</Card.Title>
                  <h3>{formatCurrency(sessionIncome)}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-white bg-secondary">
                <Card.Body>
                  <Card.Title>Other Income</Card.Title>
                  <h3>{formatCurrency(otherIncome)}</h3>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card>
            <Card.Header>
              <h5 className="mb-0">Daily Income Summary</h5>
            </Card.Header>
            <Card.Body>
              {incomeData?.dailyIncomeSummary?.length === 0 ? (
                <p className="text-muted text-center">No income records found for this period.</p>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Total Income</th>
                      <th>Admission</th>
                      <th>Session</th>
                      <th>Other</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomeData?.dailyIncomeSummary?.map((day, index) => (
                      <tr key={index}>
                        <td>{formatDate(day.date)}</td>
                        <td><strong>{formatCurrency(day.totalIncome)}</strong></td>
                        <td>{formatCurrency(day.admissionIncome)}</td>
                        <td>{formatCurrency(day.sessionIncome)}</td>
                        <td>{formatCurrency(day.otherIncome)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="table-dark">
                      <th>Total</th>
                      <th>{formatCurrency(totalIncome)}</th>
                      <th>{formatCurrency(admissionIncome)}</th>
                      <th>{formatCurrency(sessionIncome)}</th>
                      <th>{formatCurrency(otherIncome)}</th>
                    </tr>
                  </tfoot>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* Receivables Tab */}
        <Tab eventKey="receivables" title="Receivables">
          <Row className="mb-4">
            <Col md={6}>
              <Card className="text-white bg-warning">
                <Card.Body>
                  <Card.Title>Total Pending Dues</Card.Title>
                  <h3>{formatCurrency(totalReceivables)}</h3>
                  <p className="mb-0">{receivablesData?.allReceivables?.length || 0} students with pending dues</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="text-white bg-danger">
                <Card.Body>
                  <Card.Title>Total Overdue</Card.Title>
                  <h3>{formatCurrency(totalOverdue)}</h3>
                  <p className="mb-0">{overdueData?.overdueReceivables?.length || 0} students with overdue payments</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">All Pending Dues</h5>
            </Card.Header>
            <Card.Body>
              {receivablesData?.allReceivables?.length === 0 ? (
                <p className="text-muted text-center">No pending dues found!</p>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Name</th>
                      <th>Total Due</th>
                      <th>Pending Invoices</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receivablesData?.allReceivables?.map((r, index) => (
                      <tr key={index}>
                        <td><strong>{r.studentIdNumber}</strong></td>
                        <td>{r.studentName}</td>
                        <td className="text-danger"><strong>{formatCurrency(r.totalDue)}</strong></td>
                        <td>{r.invoicesCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>

          <Card className="bg-danger text-white">
            <Card.Header>
              <h5 className="mb-0">Overdue Payments</h5>
            </Card.Header>
            <Card.Body>
              {overdueData?.overdueReceivables?.length === 0 ? (
                <p className="text-muted text-center">No overdue payments!</p>
              ) : (
                <Table striped bordered hover responsive variant="dark">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Name</th>
                      <th>Total Due</th>
                      <th>Overdue Days</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdueData?.overdueReceivables?.map((r, index) => (
                      <tr key={index} className={r.overdueDays > 60 ? 'table-danger' : ''}>
                        <td><strong>{r.studentIdNumber}</strong></td>
                        <td>{r.studentName}</td>
                        <td><strong>{formatCurrency(r.totalDue)}</strong></td>
                        <td>
                          <Badge bg={r.overdueDays > 60 ? 'danger' : 'warning'}>
                            {r.overdueDays} days
                          </Badge>
                        </td>
                        <td>
                          <Button variant="light" size="sm">Send Reminder</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* Aging Report Tab */}
        <Tab eventKey="aging" title="Aging Report">
          <Alert variant="info">
            <h6>Aging Buckets</h6>
            <ul className="mb-0">
              <li><strong>0-30 days:</strong> Recent dues</li>
              <li><strong>31-60 days:</strong> Follow-up needed</li>
              <li><strong>61-90 days:</strong> Serious attention required</li>
              <li><strong>90+ days:</strong> Critical - Immediate action</li>
            </ul>
          </Alert>

          <Card>
            <Card.Header>
              <h5 className="mb-0">Aging Report</h5>
            </Card.Header>
            <Card.Body>
              {agingData?.agingReport?.length === 0 ? (
                <p className="text-muted text-center">No overdue payments found!</p>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Name</th>
                      <th>Total Due</th>
                      <th>Overdue Days</th>
                      <th>Aging Bucket</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agingData?.agingReport?.map((r, index) => {
                      let bucket = '0-30'
                      let bucketClass = 'success'
                      if (r.overdueDays > 30 && r.overdueDays <= 60) {
                        bucket = '31-60'
                        bucketClass = 'warning'
                      } else if (r.overdueDays > 60 && r.overdueDays <= 90) {
                        bucket = '61-90'
                        bucketClass = 'warning'
                      } else if (r.overdueDays > 90) {
                        bucket = '90+'
                        bucketClass = 'danger'
                      }

                      return (
                        <tr key={index}>
                          <td><strong>{r.studentIdNumber}</strong></td>
                          <td>{r.studentName}</td>
                          <td><strong>{formatCurrency(r.totalDue)}</strong></td>
                          <td>{r.overdueDays} days</td>
                          <td>
                            <Badge bg={bucketClass}>{bucket} days</Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* Balance Sheet Tab */}
        <Tab eventKey="balance-sheet" title="Balance Sheet">
          <Card className="mb-4">
            <Card.Body>
              <Row className="align-items-end">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>As Of Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={balanceSheetDate}
                      onChange={(e) => setBalanceSheetDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Button variant="primary" onClick={() => refetchBalanceSheet()}>
                    Refresh
                  </Button>
                </Col>
                <Col md={6} className="text-end">
                  {balanceSheetData?.balanceSheet && (
                    <Badge bg={balanceSheetData.balanceSheet.isBalanced ? 'success' : 'danger'} className="fs-6">
                      {balanceSheetData.balanceSheet.isBalanced ? 'Balanced' : 'Not Balanced'}
                    </Badge>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {balanceSheetData?.balanceSheet && (
            <>
              <h5 className="mb-3">Balance Sheet - {formatDate(balanceSheetData.balanceSheet.asOfDate)}</h5>
              <Row>
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
                          {balanceSheetData.balanceSheet.assets?.items.map(item => (
                            <tr key={item.accountCode}>
                              <td>{item.accountCode} - {item.accountName}</td>
                              <td className="text-end">{formatCurrency(item.balance)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="table-secondary">
                            <th>Total Assets</th>
                            <th className="text-end">{formatCurrency(balanceSheetData.balanceSheet.assets?.total || 0)}</th>
                          </tr>
                        </tfoot>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>

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
                          {balanceSheetData.balanceSheet.liabilities?.items.map(item => (
                            <tr key={item.accountCode}>
                              <td>{item.accountCode} - {item.accountName}</td>
                              <td className="text-end">{formatCurrency(item.balance)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="table-secondary">
                            <th>Total Liabilities</th>
                            <th className="text-end">{formatCurrency(balanceSheetData.balanceSheet.liabilities?.total || 0)}</th>
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
                          {balanceSheetData.balanceSheet.equity?.items.map(item => (
                            <tr key={item.accountCode}>
                              <td>{item.accountCode} - {item.accountName}</td>
                              <td className="text-end">{formatCurrency(item.balance)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="table-secondary">
                            <th>Total Equity</th>
                            <th className="text-end">{formatCurrency(balanceSheetData.balanceSheet.equity?.total || 0)}</th>
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
                              <strong>{formatCurrency(balanceSheetData.balanceSheet.totalLiabilitiesEquity || 0)}</strong>
                            </td>
                          </tr>
                          <tr>
                            <td><strong>Total Assets:</strong></td>
                            <td className="text-end">
                              <strong>{formatCurrency(balanceSheetData.balanceSheet.assets?.total || 0)}</strong>
                            </td>
                          </tr>
                          <tr className="table-secondary">
                            <td><strong>Difference:</strong></td>
                            <td className="text-end">
                              <strong>
                                {formatCurrency(
                                  (balanceSheetData.balanceSheet.assets?.total || 0) - (balanceSheetData.balanceSheet.totalLiabilitiesEquity || 0)
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
            </>
          )}
        </Tab>

        {/* Trial Balance Tab */}
        <Tab eventKey="trial-balance" title="Trial Balance">
          <Card className="mb-4">
            <Card.Body>
              <Row className="align-items-end">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>As Of Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={trialBalanceDate}
                      onChange={(e) => setTrialBalanceDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Button variant="primary" onClick={() => refetchTrialBalance()}>
                    Refresh
                  </Button>
                </Col>
                <Col md={6} className="text-end">
                  {trialBalanceData?.trialBalance && (
                    <Badge bg={trialBalanceData.trialBalance.isBalanced ? 'success' : 'danger'} className="fs-6">
                      {trialBalanceData.trialBalance.isBalanced ? 'Balanced' : 'Not Balanced'}
                    </Badge>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {trialBalanceData?.trialBalance && (
            <>
              <Card className="mb-4">
                <Card.Header>
                  <h6 className="mb-0">Trial Balance - {formatDate(trialBalanceData.trialBalance.asOfDate)}</h6>
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
                      {trialBalanceData.trialBalance.accounts.map(account => (
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
                        <th className="text-end">{formatCurrency(trialBalanceData.trialBalance.totalDebit)}</th>
                        <th className="text-end">{formatCurrency(trialBalanceData.trialBalance.totalCredit)}</th>
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
                      <h3 className="text-primary">{formatCurrency(trialBalanceData.trialBalance.totalDebit)}</h3>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="text-center">
                    <Card.Body>
                      <Card.Title>Total Credits</Card.Title>
                      <h3 className="text-success">{formatCurrency(trialBalanceData.trialBalance.totalCredit)}</h3>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </Tab>

        {/* Income Statement Tab */}
        <Tab eventKey="income-statement" title="Income Statement">
          <Card className="mb-4">
            <Card.Body>
              <Row className="align-items-end">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Start Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>End Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Button variant="primary" onClick={() => refetchIncomeStatement({ variables: dateRange })}>
                    Generate
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {incomeStatementData?.incomeStatement && (
            <>
              <h5 className="mb-3">
                Income Statement - {formatDate(incomeStatementData.incomeStatement.startDate)} to {formatDate(incomeStatementData.incomeStatement.endDate)}
              </h5>
              <Row>
                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Header className="bg-success text-white">
                      <h6 className="mb-0">Revenue</h6>
                    </Card.Header>
                    <Card.Body>
                      <Table size="sm" hover>
                        <thead>
                          <tr>
                            <th>Account</th>
                            <th className="text-end">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {incomeStatementData.incomeStatement.revenue?.items.map(item => (
                            <tr key={item.accountCode}>
                              <td>{item.accountCode} - {item.accountName}</td>
                              <td className="text-end">{formatCurrency(item.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="table-secondary">
                            <th>Total Revenue</th>
                            <th className="text-end">{formatCurrency(incomeStatementData.incomeStatement.revenue?.total || 0)}</th>
                          </tr>
                        </tfoot>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Header className="bg-danger text-white">
                      <h6 className="mb-0">Expenses</h6>
                    </Card.Header>
                    <Card.Body>
                      <Table size="sm" hover>
                        <thead>
                          <tr>
                            <th>Account</th>
                            <th className="text-end">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {incomeStatementData.incomeStatement.expenses?.items.map(item => (
                            <tr key={item.accountCode}>
                              <td>{item.accountCode} - {item.accountName}</td>
                              <td className="text-end">{formatCurrency(item.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="table-secondary">
                            <th>Total Expenses</th>
                            <th className="text-end">{formatCurrency(incomeStatementData.incomeStatement.expenses?.total || 0)}</th>
                          </tr>
                        </tfoot>
                      </Table>
                    </Card.Body>
                  </Card>

                  <Card className={incomeStatementData.incomeStatement.netIncome >= 0 ? 'border-success' : 'border-danger'}>
                    <Card.Header className={incomeStatementData.incomeStatement.netIncome >= 0 ? 'bg-success text-white' : 'bg-danger text-white'}>
                      <h6 className="mb-0">Net Income</h6>
                    </Card.Header>
                    <Card.Body className="text-center">
                      <h3 className={incomeStatementData.incomeStatement.netIncome >= 0 ? 'text-success' : 'text-danger'}>
                        {formatCurrency(incomeStatementData.incomeStatement.netIncome)}
                      </h3>
                      <p className="text-muted mb-0">
                        {incomeStatementData.incomeStatement.netIncome >= 0 ? 'Profit' : 'Loss'}
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </Tab>
      </Tabs>
    </div>
  )
}

export default Reports
