'use client'

import { useState } from 'react'
import { Tabs, Tab, Table, Button, Card, Row, Col } from 'react-bootstrap'
import { useQuery } from '@apollo/client'
import { GET_ALL_ACCOUNTS, GET_TRIAL_BALANCE, GET_BALANCE_SHEET } from '../graphql/accountingQueries'
import { formatCurrency, formatDate } from '../utils/format'
import ChartOfAccounts from '../components/accounting/ChartOfAccounts'
import JournalEntries from '../components/accounting/JournalEntries'
import TrialBalanceReport from '../components/accounting/TrialBalanceReport'
import BalanceSheetReport from '../components/accounting/BalanceSheetReport'
import AccountLedger from '../components/accounting/AccountLedger'

function Accounting() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedAccount, setSelectedAccount] = useState(null)

  // Fetch data for overview
  const { data: accountsData, loading: accountsLoading } = useQuery(GET_ALL_ACCOUNTS)
  const { data: trialBalanceData } = useQuery(GET_TRIAL_BALANCE, {
    variables: { asOfDate: new Date().toISOString().split('T')[0] }
  })
  const { data: balanceSheetData } = useQuery(GET_BALANCE_SHEET, {
    variables: { asOfDate: new Date().toISOString().split('T')[0] }
  })

  const accounts = accountsData?.allAccounts || []
  const trialBalance = trialBalanceData?.trialBalance
  const balanceSheet = balanceSheetData?.balanceSheet

  // Calculate summary statistics
  const totalAssets = balanceSheet?.assets?.total || 0
  const totalLiabilities = balanceSheet?.liabilities?.total || 0
  const totalEquity = balanceSheet?.equity?.total || 0
  const totalRevenue = trialBalance?.accounts
    ?.filter(a => a.accountType === 'REVENUE')
    ?.reduce((sum, a) => sum + (a.credit - a.debit), 0) || 0
  const totalExpenses = trialBalance?.accounts
    ?.filter(a => a.accountType === 'EXPENSE')
    ?.reduce((sum, a) => sum + (a.debit - a.credit), 0) || 0

  return (
    <div className="accounting-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Accounting</h2>
      </div>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
        <Tab eventKey="overview" title="Overview">
          <Row className="g-4 mb-4">
            <Col md={3}>
              <Card className="text-center">
              <Card.Body>
                <Card.Title>Assets</Card.Title>
                <h3 className="text-primary">{formatCurrency(totalAssets)}</h3>
              </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
              <Card.Body>
                <Card.Title>Liabilities</Card.Title>
                <h3 className="text-warning">{formatCurrency(totalLiabilities)}</h3>
              </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
              <Card.Body>
                <Card.Title>Equity</Card.Title>
                <h3 className="text-info">{formatCurrency(totalEquity)}</h3>
              </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
              <Card.Body>
                <Card.Title>Net Income</Card.Title>
                <h3 className={totalRevenue - totalExpenses >= 0 ? "text-success" : "text-danger"}>
                  {formatCurrency(totalRevenue - totalExpenses)}
                </h3>
              </Card.Body>
              </Card>
            </Col>
          </Row>

          <h5 className="mt-4">Account Types Summary</h5>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Account Type</th>
                <th>Total Count</th>
                <th>Total Balance</th>
              </tr>
            </thead>
            <tbody>
              {['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'].map(type => {
                const typeAccounts = accounts.filter(a => a.accountType === type)
                const total = typeAccounts.reduce((sum, a) => sum + a.currentBalance, 0)
                return (
                  <tr key={type}>
                    <td>{type.replace('_', ' ')}</td>
                    <td>{typeAccounts.length}</td>
                    <td>{formatCurrency(Math.abs(total))}</td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </Tab>

        <Tab eventKey="chart-of-accounts" title="Chart of Accounts">
          <ChartOfAccounts />
        </Tab>

        <Tab eventKey="journal-entries" title="Journal Entries">
          <JournalEntries onAccountClick={(account) => {
            setSelectedAccount(account)
            setActiveTab('ledger')
          }} />
        </Tab>

        <Tab eventKey="trial-balance" title="Trial Balance">
          <TrialBalanceReport />
        </Tab>

        <Tab eventKey="balance-sheet" title="Balance Sheet">
          <BalanceSheetReport />
        </Tab>

        <Tab eventKey="ledger" title="Ledger">
          <AccountLedger initialAccountCode={selectedAccount} />
        </Tab>
      </Tabs>
    </div>
  )
}

export default Accounting
