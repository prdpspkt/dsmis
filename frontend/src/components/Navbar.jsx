'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'

function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const isActive = (path) => pathname === path

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <Link className="navbar-brand" href="/">
          Driving School
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
                href="/"
              >
                Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link ${isActive('/students') ? 'active' : ''}`}
                href="/students"
              >
                Students
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link ${isActive('/tokens') ? 'active' : ''}`}
                href="/tokens"
              >
                Tokens
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link ${isActive('/invoices') ? 'active' : ''}`}
                href="/invoices"
              >
                Invoices
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link ${isActive('/accounting') ? 'active' : ''}`}
                href="/accounting"
              >
                Accounting
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link ${isActive('/fiscal-years') ? 'active' : ''}`}
                href="/fiscal-years"
              >
                Fiscal Years
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link ${isActive('/packages') ? 'active' : ''}`}
                href="/packages"
              >
                Packages
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link ${isActive('/reports') ? 'active' : ''}`}
                href="/reports"
              >
                Reports
              </Link>
            </li>
          </ul>
          <ul className="navbar-nav">
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle d-flex align-items-center"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <div className="profile-image me-2">
                  {user?.username ? (
                    <div
                      className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white"
                      style={{
                        width: '36px',
                        height: '36px',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    <div
                      className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white"
                      style={{
                        width: '36px',
                        height: '36px',
                        fontSize: '14px'
                      }}
                    >
                      <i className="fas fa-user"></i>
                    </div>
                  )}
                </div>
                <span className="d-none d-md-inline">{user?.username}</span>
              </a>
              <ul className="dropdown-menu dropdown-menu-end shadow">
                <li>
                  <div className="dropdown-header d-flex flex-column py-2">
                    <span className="fw-bold">{user?.username}</span>
                    <small className="text-muted">{user?.email || user?.role || 'User'}</small>
                  </div>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <Link className="dropdown-item" href="/profile">
                    <i className="fas fa-user me-2"></i>Profile
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" href="/settings">
                    <i className="fas fa-cog me-2"></i>Settings
                  </Link>
                </li>
                <li>
                  <button className="dropdown-item" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt me-2"></i>Logout
                  </button>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
