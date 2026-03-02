'use client'

import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { GET_BALANCE_SHEET } from '../graphql/accountingQueries'

function ShareholdersEquity() {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0])

  const { data, loading, refetch } = useQuery(GET_BALANCE_SHEET, {
    variables: { asOfDate: asOfDate }
  })

  const handleDateChange = (e) => {
    setAsOfDate(e.target.value)
    refetch({ asOfDate: e.target.value })
  }

  if (loading) {
    return <div className="text-center mt-5"><div className="spinner-border" role="status"></div></div>
  }

  const equityItems = data?.balanceSheet?.equity?.items || []
  const totalEquity = data?.balanceSheet?.equity?.total || 0
  const totalAssets = data?.balanceSheet?.assets?.total || 0
  const totalLiabilities = data?.balanceSheet?.liabilities?.total || 0

  // Group equity items by category
  const shareCapital = equityItems.filter(item => item.account_code.startsWith('3') && item.account_name.toLowerCase().includes('share'))
  const retainedEarnings = equityItems.filter(item => item.account_code.startsWith('3') && item.account_name.toLowerCase().includes('retained'))
  const revaluationReserve = equityItems.filter(item => item.account_code.startsWith('3') && item.account_name.toLowerCase().includes('revaluation'))
  const otherEquity = equityItems.filter(item =>
    !item.account_name.toLowerCase().includes('share') &&
    !item.account_name.toLowerCase().includes('retained') &&
    !item.account_name.toLowerCase().includes('revaluation')
  )

  const calculateTotal = (items) => items.reduce((sum, item) => sum + item.balance, 0)

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Shareholders Equity</h2>
          <p className="text-muted mb-0">Track equity, retained earnings, and reserves</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div>
            <label className="form-label mb-1">As of Date:</label>
            <input
              type="date"
              className="form-control"
              value={asOfDate}
              onChange={handleDateChange}
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="info-box bg-info">
            <span className="info-box-icon"><i className="fas fa-chart-pie"></i></span>
            <div className="info-box-content">
              <span className="info-box-text">Total Equity</span>
              <span className="info-box-number">₹{totalEquity.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="info-box bg-success">
            <span className="info-box-icon"><i className="fas fa-money-bill-wave"></i></span>
            <div className="info-box-content">
              <span className="info-box-text">Share Capital</span>
              <span className="info-box-number">₹{calculateTotal(shareCapital).toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="info-box bg-warning">
            <span className="info-box-icon"><i className="fas fa-piggy-bank"></i></span>
            <div className="info-box-content">
              <span className="info-box-text">Retained Earnings</span>
              <span className="info-box-number">₹{calculateTotal(retainedEarnings).toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="info-box bg-primary">
            <span className="info-box-icon"><i className="fas fa-chart-line"></i></span>
            <div className="info-box-content">
              <span className="info-box-text">Revaluation Reserve</span>
              <span className="info-box-number">₹{calculateTotal(revaluationReserve).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Equation */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title mb-0">Accounting Equation</h3>
        </div>
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-4 text-center">
              <h5 className="text-primary">Assets</h5>
              <h3 className="text-primary">₹{totalAssets.toLocaleString()}</h3>
            </div>
            <div className="col-md-1 text-center">
              <h3>=</h3>
            </div>
            <div className="col-md-3 text-center">
              <h5 className="text-danger">Liabilities</h5>
              <h3 className="text-danger">₹{totalLiabilities.toLocaleString()}</h3>
            </div>
            <div className="col-md-1 text-center">
              <h3>+</h3>
            </div>
            <div className="col-md-3 text-center">
              <h5 className="text-success">Equity</h5>
              <h3 className="text-success">₹{totalEquity.toLocaleString()}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Equity Breakdown */}
      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title mb-0">Share Capital</h3>
            </div>
            <div className="card-body">
              {shareCapital.length > 0 ? (
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shareCapital.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{item.account_name}</strong>
                          <br />
                          <small className="text-muted">{item.account_code}</small>
                        </td>
                        <td className="text-right">
                          <strong>₹{item.balance.toLocaleString()}</strong>
                        </td>
                      </tr>
                    ))}
                    <tr className="table-primary">
                      <td><strong>Total Share Capital</strong></td>
                      <td className="text-right">
                        <strong>₹{calculateTotal(shareCapital).toLocaleString()}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <p className="text-muted text-center py-3">No share capital accounts found</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title mb-0">Retained Earnings</h3>
            </div>
            <div className="card-body">
              {retainedEarnings.length > 0 ? (
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {retainedEarnings.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{item.account_name}</strong>
                          <br />
                          <small className="text-muted">{item.account_code}</small>
                        </td>
                        <td className="text-right">
                          <strong>₹{item.balance.toLocaleString()}</strong>
                        </td>
                      </tr>
                    ))}
                    <tr className="table-warning">
                      <td><strong>Total Retained Earnings</strong></td>
                      <td className="text-right">
                        <strong>₹{calculateTotal(retainedEarnings).toLocaleString()}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <p className="text-muted text-center py-3">No retained earnings accounts found</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Revaluation Reserve & Other Equity */}
      <div className="row mt-3">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title mb-0">Revaluation Reserve</h3>
            </div>
            <div className="card-body">
              {revaluationReserve.length > 0 ? (
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revaluationReserve.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{item.account_name}</strong>
                          <br />
                          <small className="text-muted">{item.account_code}</small>
                        </td>
                        <td className="text-right">
                          <strong>₹{item.balance.toLocaleString()}</strong>
                        </td>
                      </tr>
                    ))}
                    <tr className="table-info">
                      <td><strong>Total Revaluation Reserve</strong></td>
                      <td className="text-right">
                        <strong>₹{calculateTotal(revaluationReserve).toLocaleString()}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <p className="text-muted text-center py-3">No revaluation reserve accounts found</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title mb-0">Other Equity</h3>
            </div>
            <div className="card-body">
              {otherEquity.length > 0 ? (
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {otherEquity.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{item.account_name}</strong>
                          <br />
                          <small className="text-muted">{item.account_code}</small>
                        </td>
                        <td className="text-right">
                          <strong>₹{item.balance.toLocaleString()}</strong>
                        </td>
                      </tr>
                    ))}
                    <tr className="table-secondary">
                      <td><strong>Total Other Equity</strong></td>
                      <td className="text-right">
                        <strong>₹{calculateTotal(otherEquity).toLocaleString()}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <p className="text-muted text-center py-3">No other equity accounts found</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Equity Summary */}
      <div className="card mt-3">
        <div className="card-header">
          <h3 className="card-title mb-0">Equity Summary</h3>
        </div>
        <div className="card-body">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Component</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Percentage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Share Capital</strong></td>
                <td className="text-right">₹{calculateTotal(shareCapital).toLocaleString()}</td>
                <td className="text-right">
                  {totalEquity > 0 ? ((calculateTotal(shareCapital) / totalEquity) * 100).toFixed(2) : 0}%
                </td>
              </tr>
              <tr>
                <td><strong>Retained Earnings</strong></td>
                <td className="text-right">₹{calculateTotal(retainedEarnings).toLocaleString()}</td>
                <td className="text-right">
                  {totalEquity > 0 ? ((calculateTotal(retainedEarnings) / totalEquity) * 100).toFixed(2) : 0}%
                </td>
              </tr>
              <tr>
                <td><strong>Revaluation Reserve</strong></td>
                <td className="text-right">₹{calculateTotal(revaluationReserve).toLocaleString()}</td>
                <td className="text-right">
                  {totalEquity > 0 ? ((calculateTotal(revaluationReserve) / totalEquity) * 100).toFixed(2) : 0}%
                </td>
              </tr>
              <tr>
                <td><strong>Other Equity</strong></td>
                <td className="text-right">₹{calculateTotal(otherEquity).toLocaleString()}</td>
                <td className="text-right">
                  {totalEquity > 0 ? ((calculateTotal(otherEquity) / totalEquity) * 100).toFixed(2) : 0}%
                </td>
              </tr>
              <tr className="table-success">
                <td><strong>Total Shareholders Equity</strong></td>
                <td className="text-right">
                  <strong>₹{totalEquity.toLocaleString()}</strong>
                </td>
                <td className="text-right">
                  <strong>100%</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="row mt-3">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title mb-0">Key Metrics</h3>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Debt to Equity Ratio:</strong></p>
                  {totalEquity > 0 ? (
                    <h4 className={totalLiabilities / totalEquity > 2 ? 'text-danger' : totalLiabilities / totalEquity > 1 ? 'text-warning' : 'text-success'}>
                      {(totalLiabilities / totalEquity).toFixed(2)}
                    </h4>
                  ) : (
                    <h4 className="text-muted">N/A</h4>
                  )}
                  <small className="text-muted">Lower is better</small>
                </div>
                <div className="col-md-6">
                  <p><strong>Equity Ratio:</strong></p>
                  {totalAssets > 0 ? (
                    <h4 className="text-primary">
                      {((totalEquity / totalAssets) * 100).toFixed(2)}%
                    </h4>
                  ) : (
                    <h4 className="text-muted">N/A</h4>
                  )}
                  <small className="text-muted">Higher is better</small>
                </div>
              </div>
              <hr />
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Return on Equity (ROE):</strong></p>
                  <h4 className="text-info">
                    <small className="text-muted">Net Income / Avg Equity</small>
                  </h4>
                  <small className="text-muted">Requires income statement data</small>
                </div>
                <div className="col-md-6">
                  <p><strong>Book Value per Share:</strong></p>
                  <h4 className="text-warning">
                    <small className="text-muted">Total Equity / Shares Outstanding</small>
                  </h4>
                  <small className="text-muted">Requires share count data</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title mb-0">Quick Info</h3>
            </div>
            <div className="card-body">
              <div className="alert alert-info mb-3">
                <strong>Shareholders Equity</strong> represents the residual interest in the assets of the company after deducting liabilities.
              </div>
              <div className="alert alert-warning mb-3">
                <strong>Retained Earnings</strong> are the cumulative net earnings or profits of a firm after accounting for dividends.
              </div>
              <div className="alert alert-success">
                <strong>Revaluation Reserve</strong> is an accounting entry created when an asset is revalued upward, representing unrealized gains.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ShareholdersEquity
