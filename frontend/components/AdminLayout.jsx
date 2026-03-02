'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../src/contexts/AuthContext'
import Sidebar from './Sidebar'
import styles from './AdminLayout.module.css'

function AdminLayout({ children }) {
  const { user, logout, loading, isAuthenticated } = useAuth()
  const router = useRouter()

  // Initialize sidebarCollapsed from sessionStorage
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('sidebarCollapsed')
      return saved ? JSON.parse(saved) : false
    }
    return false
  })

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [loading, isAuthenticated, router])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return null
  }

  // Save to sessionStorage whenever sidebarCollapsed changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed))
      // Add/remove class on body for main content padding
      if (sidebarCollapsed) {
        document.body.classList.add('sidebar-collapsed')
      } else {
        document.body.classList.remove('sidebar-collapsed')
      }
    }
  }, [sidebarCollapsed])

  // Cleanup body class on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        document.body.classList.remove('sidebar-collapsed')
      }
    }
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const toggleSidebar = () => {
    if (window.innerWidth >= 992) {
      setSidebarCollapsed(!sidebarCollapsed)
    } else {
      setSidebarOpen(!sidebarOpen)
    }
  }

  return (
    <div className={styles.adminWrapper}>
      {/* Sidebar Component */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
      />

      {/* Navbar */}
      <nav
        id="main-navbar"
        className={`navbar navbar-expand-lg navbar-light bg-white fixed-top ${styles.navbar} ${sidebarCollapsed ? styles.navbarCollapsed : styles.navbarExpanded}`}
      >
        <div className="container-fluid">
          {/* Toggle button - visible on all screens */}
          <button
            className={`btn btn-link text-primary p-0 me-3 ${styles.toggleButton}`}
            type="button"
            onClick={toggleSidebar}
            aria-label="Toggle navigation"
          >
            <i className="fas fa-bars"></i>
          </button>

          {/* Brand - hidden on large screens since sidebar has it */}
          <span className="navbar-brand d-none d-lg-block fw-bold text-primary ms-0">
            DMIS
          </span>

          {/* Search form */}
          <form className="d-none d-md-flex input-group w-auto my-auto">
            <input
              autoComplete="off"
              type="search"
              className={`form-control rounded ${styles.searchInput}`}
              placeholder="Search..."
            />
            <span className="input-group-text border-0">
              <i className="fas fa-search"></i>
            </span>
          </form>

          {/* Right links */}
          <ul className="navbar-nav ms-auto d-flex flex-row">
            <li className="nav-item me-3">
              <a className="nav-link" href="#">
                <i className="fas fa-bell"></i>
              </a>
            </li>
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle hidden-arrow d-flex align-items-center"
                href="#"
                id="navbarDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="fas fa-user-circle fa-2x text-secondary"></i>
              </a>
              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                <li>
                  <span className="dropdown-item-text text-muted">
                    <small className="fw-bold">{user?.username}</small>
                  </span>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <a className="dropdown-item" href="#" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt me-2"></i>Logout
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </nav>

      {/* Main content */}
      <main className={styles.mainContent}>
        <div className="container-fluid p-4">
          {children}
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
