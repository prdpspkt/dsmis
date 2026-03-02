'use client'

import { useQuery } from '@apollo/client'
import { GET_DASHBOARD_STATS, GET_DAILY_INCOME_SUMMARY, GET_INSTRUCTOR_PERFORMANCE, GET_VEHICLE_UTILIZATION } from '../graphql/reportQueries'
import styles from './Dashboard.module.css'

function Dashboard() {
  const { data: statsData } = useQuery(GET_DASHBOARD_STATS)
  const { data: incomeData } = useQuery(GET_DAILY_INCOME_SUMMARY, {
    variables: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  })
  const { data: instructorData } = useQuery(GET_INSTRUCTOR_PERFORMANCE)
  const { data: vehicleData } = useQuery(GET_VEHICLE_UTILIZATION)

  const stats = statsData?.dashboardStats
  const incomeSummary = incomeData?.dailyIncomeSummary || []
  const instructors = instructorData?.instructorPerformance || []
  const vehicles = vehicleData?.vehicleUtilization || []

  // Calculate totals
  const totalAdmission = incomeSummary.reduce((sum, d) => sum + parseFloat(d.admissionIncome || 0), 0)
  const totalSession = incomeSummary.reduce((sum, d) => sum + parseFloat(d.sessionIncome || 0), 0)
  const totalIncome = totalAdmission + totalSession

  return (
    <div>
      {/* Statistics Cards Row 1 - Info Box Style (AdminLTE) */}
      <section className="mb-4">
        <div className="row">
          <div className="col-lg-3 col-6">
            <div className="info-box">
              <span className="info-box-icon bg-info elevation-1">
                <i className="fas fa-user-graduate"></i>
              </span>
              <div className="info-box-content">
                <span className="info-box-text">Total Students</span>
                <span className="info-box-number">
                  {stats?.totalStudents || 0}
                </span>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-6">
            <div className="info-box">
              <span className="info-box-icon bg-success elevation-1">
                <i className="fas fa-rupee-sign"></i>
              </span>
              <div className="info-box-content">
                <span className="info-box-text">Today's Collection</span>
                <span className="info-box-number">
                  ₹{stats?.todayIncome ? (stats?.todayIncome).toLocaleString() : '0'}
                </span>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-6">
            <div className="info-box">
              <span className="info-box-icon bg-warning elevation-1">
                <i className="fas fa-calendar-check"></i>
              </span>
              <div className="info-box-content">
                <span className="info-box-text">Tokens Today</span>
                <span className="info-box-number">
                  {stats?.totalTokensToday || 0}
                </span>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-6">
            <div className="info-box">
              <span className="info-box-icon bg-danger elevation-1">
                <i className="fas fa-exclamation-circle"></i>
              </span>
              <div className="info-box-content">
                <span className="info-box-text">Pending Dues</span>
                <span className="info-box-number">
                  ₹{stats?.pendingDues ? (stats?.pendingDues).toLocaleString() : '0'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Revenue Chart Section */}
      <section className="mb-4">
        <div className="card">
          <div className="card-header py-3 bg-white">
            <h5 className="mb-0">
              <i className="fas fa-chart-line text-primary me-2"></i>
              <strong>Revenue Overview (Last 30 Days)</strong>
            </h5>
          </div>
          <div className="card-body">
            {incomeSummary.length > 0 ? (
              <canvas id="revenueChart" className={styles.revenueChart}></canvas>
            ) : (
              <p className="text-muted text-center py-5">No revenue data available</p>
            )}
          </div>
        </div>
      </section>

      {/* Two Column Layout */}
      <section className="mb-4">
        <div className="row">
          {/* Instructor Performance */}
          <div className="col-xl-6 col-md-12 mb-4">
            <div className="card">
              <div className="card-header py-3 bg-white">
                <h5 className="mb-0">
                  <i className="fas fa-trophy text-warning me-2"></i>
                  <strong>Top Instructors</strong>
                </h5>
              </div>
              <div className="card-body">
                {instructors.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover text-nowrap align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Instructor</th>
                          <th className="text-end">Completed</th>
                          <th className="text-end">Hours</th>
                          <th className="text-end">This Month</th>
                        </tr>
                      </thead>
                      <tbody>
                        {instructors.slice(0, 5).map((inst, index) => (
                          <tr key={index}>
                            <td>
                              <strong>{inst.instructorName}</strong>
                            </td>
                            <td className="text-end">
                              <span className="badge bg-primary rounded-pill">{inst.completedTokens}</span>
                            </td>
                            <td className="text-end">{inst.totalHours}h</td>
                            <td className="text-end">
                              <span className="badge bg-success rounded-pill">{inst.thisMonthTokens}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted text-center py-4">No instructor data available</p>
                )}
              </div>
            </div>
          </div>

          {/* Vehicle Utilization */}
          <div className="col-xl-6 col-md-12 mb-4">
            <div className="card">
              <div className="card-header py-3 bg-white">
                <h5 className="mb-0">
                  <i className="fas fa-cogs text-info me-2"></i>
                  <strong>Vehicle Utilization</strong>
                </h5>
              </div>
              <div className="card-body">
                {vehicles.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover text-nowrap align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Vehicle</th>
                          <th>License</th>
                          <th className="text-center">Tokens</th>
                          <th className="text-center">Hours</th>
                          <th className="text-center">Utilization</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vehicles.map((v, index) => (
                          <tr key={index}>
                            <td>
                              <strong>{v.modelName}</strong>
                            </td>
                            <td>
                              <code>{v.licensePlate}</code>
                            </td>
                            <td className="text-center">{v.totalTokens}</td>
                            <td className="text-center">{v.totalHours}h</td>
                            <td className="text-center">
                              <div className={styles.utilizationContainer}>
                                <div className={`progress ${styles.progressThin}`}>
                                  <div
                                    className={`progress-bar ${
                                      v.utilizationRate > 70 ? 'bg-success' :
                                      v.utilizationRate > 40 ? 'bg-warning' : 'bg-danger'
                                    }`}
                                    role="progressbar"
                                    style={{ width: `${v.utilizationRate}%` }}
                                    aria-valuenow={v.utilizationRate}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                  ></div>
                                </div>
                                <small className="text-muted">{v.utilizationRate}%</small>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted text-center py-4">No vehicle data available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section>
        <div className="card">
          <div className="card-header py-3 bg-white">
            <h5 className="mb-0">
              <i className="fas fa-bolt text-warning me-2"></i>
              <strong>Quick Actions</strong>
            </h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3 col-sm-6">
                <a href="/students/new" className="btn btn-primary btn-lg w-100">
                  <i className="fas fa-user-plus me-2"></i>
                  New Admission
                </a>
              </div>
              <div className="col-md-3 col-sm-6">
                <a href="/tokens" className="btn btn-success btn-lg w-100">
                  <i className="fas fa-calendar-plus me-2"></i>
                  Book Token
                </a>
              </div>
              <div className="col-md-3 col-sm-6">
                <a href="/invoices" className="btn btn-info btn-lg w-100">
                  <i className="fas fa-file-invoice me-2"></i>
                  Create Invoice
                </a>
              </div>
              <div className="col-md-3 col-sm-6">
                <a href="/reports" className="btn btn-secondary btn-lg w-100">
                  <i className="fas fa-chart-bar me-2"></i>
                  View Reports
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chart.js Initialization Script */}
      <script dangerouslySetInnerHTML={{
        __html: `
          if (typeof window !== 'undefined' && window.Chart) {
            const ctx = document.getElementById('revenueChart');
            if (ctx && window.revenueData) {
              new Chart(ctx, {
                type: 'line',
                data: window.revenueData,
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return '₹' + value.toLocaleString();
                        }
                      }
                    }
                  }
                }
              });
            }
          }
        `
      }} />
    </div>
  )
}

export default Dashboard
