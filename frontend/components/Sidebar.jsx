'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../src/contexts/AuthContext'
import { canAccessPath, PERMISSION_MAP } from '../src/utils/permissions'

function Sidebar({ isOpen, onClose, isCollapsed }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [openMenus, setOpenMenus] = useState({})
  const [collapsedOpenMenu, setCollapsedOpenMenu] = useState(null)
  const popupRef = useRef(null)

  const isActive = (path) => pathname === path

  const toggleMenu = (key) => {
    setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleCollapsedMenu = (key, event) => {
    event.preventDefault()
    event.stopPropagation()
    setCollapsedOpenMenu(collapsedOpenMenu === key ? null : key)
  }

  // Check if user can access a path
  const canAccess = (path) => {
    if (!path) return true
    if (user?.isSuperuser) return true
    return canAccessPath(user, path)
  }

  // Filter menu items based on permissions
  const filterMenuItems = (items) => {
    return items
      .map(item => {
        // If it's a treeview, filter its children
        if (item.type === 'treeview' && item.items) {
          const filteredItems = item.items.filter(subItem =>
            canAccess(subItem.path)
          )
          // Only show the treeview if it has visible children
          return {
            ...item,
            items: filteredItems,
            visible: filteredItems.length > 0
          }
        }
        // For regular items, check if user can access
        if (item.path) {
          return {
            ...item,
            visible: canAccess(item.path)
          }
        }
        // Headers always visible
        return { ...item, visible: true }
      })
      .filter(item => item.visible !== false)
  }

  const menuItems = useMemo(() => filterMenuItems([
    {
      type: 'header',
      label: 'MAIN NAVIGATION'
    },
    {
      type: 'item',
      path: '/',
      icon: 'fa-tachometer-alt',
      label: 'Dashboard',
      badge: null
    },
    {
      type: 'header',
      label: 'MANAGEMENT'
    },
    {
      type: 'treeview',
      icon: 'fa-user-graduate',
      label: 'Student Management',
      key: 'students',
      active: false,
      items: [
        { path: '/students', icon: 'fa-users', label: 'All Students' },
        { path: '/students/new', icon: 'fa-user-plus', label: 'New Admission' },
      ]
    },
    {
      type: 'treeview',
      icon: 'fa-cogs',
      label: 'Operations',
      key: 'operations',
      active: false,
      items: [
        { path: '/tokens', icon: 'fa-calendar-check', label: 'Tokens' },
        { path: '/guest-billing', icon: 'fa-user-clock', label: 'Walk-in Guest' },
        { path: '/tmo-billing', icon: 'fa-file-invoice', label: 'TMO Trial' },
      ]
    },
    {
      type: 'treeview',
      icon: 'fa-file-invoice-dollar',
      label: 'Financial',
      key: 'financial',
      active: false,
      items: [
        { path: '/invoices', icon: 'fa-file-invoice-dollar', label: 'Invoices' },
        { path: '/accounting', icon: 'fa-calculator', label: 'Accounting' },
        { path: '/assets', icon: 'fa-boxes', label: 'Assets' },
        { path: '/accounting/shareholders', icon: 'fa-users', label: 'Shareholders' },
        { path: '/accounting/shareholders-equity', icon: 'fa-chart-pie', label: 'Shareholders Equity' },
      ]
    },
    {
      type: 'treeview',
      icon: 'fa-briefcase',
      label: 'Management',
      key: 'management',
      active: false,
      items: [
        { path: '/management/users', icon: 'fa-users', label: 'Users' },
        { path: '/management/roles', icon: 'fa-user-tag', label: 'Roles' },
        { path: '/accounting/fiscal-years', icon: 'fa-calendar-alt', label: 'Fiscal Years' },
        { path: '/packages', icon: 'fa-box', label: 'Packages' },
        { path: '/reports', icon: 'fa-chart-bar', label: 'Reports' },
      ]
    },
  ]), [user])

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setCollapsedOpenMenu(null)
      }
    }

    if (collapsedOpenMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [collapsedOpenMenu])

  const isTreeviewActive = (item) => {
    if (item.items) {
      return item.items.some(subItem => pathname === subItem.path)
    }
    return false
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="sidebar-overlay position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-lg-none sidebar-overlay-z-index"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={`main-sidebar sidebar-dark-primary elevation-4 ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}
      >
        {/* Brand Logo */}
        <div className="brand-link">
          <Link href="/" className="brand-link">
            <i className="fas fa-car-side brand-icon text-light"></i>
            {!isCollapsed && <span className="brand-text fw-bold">DMIS</span>}
          </Link>
        </div>

        {/* Sidebar Menu */}
        <div className="sidebar">
          <nav className="mt-2">
            <ul className="nav nav-pills nav-sidebar flex-column" role="menu">
              {menuItems.map((item, index) => {
                // Header
                if (item.type === 'header') {
                  return (
                    <li key={index} className="nav-header">
                      {item.label}
                    </li>
                  )
                }

                // Single Item
                if (item.type === 'item') {
                  return (
                    <li key={index} className="nav-item">
                      <Link
                        href={item.path}
                        className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                        onClick={onClose}
                        title={isCollapsed ? item.label : ''}
                      >
                        <i className={`nav-icon fas ${item.icon}`}></i>
                        {!isCollapsed && <span>{item.label}</span>}
                      </Link>
                    </li>
                  )
                }

                // Treeview Menu
                if (item.type === 'treeview') {
                  const isActiveTree = isTreeviewActive(item)
                  // Check if menu has been manually toggled or if a child is active
                  const manualToggle = openMenus[item.key] !== undefined ? openMenus[item.key] : isActiveTree
                  const isCollapsedPopupOpen = collapsedOpenMenu === item.key

                  return (
                    <li key={index} className={`nav-item has-treeview ${manualToggle ? 'menu-open' : ''}`}>
                      <a
                        href="#"
                        className={`nav-link ${isActiveTree ? 'active' : ''} ${isCollapsedPopupOpen ? 'popup-active' : ''}`}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (!isCollapsed) {
                            toggleMenu(item.key)
                          } else {
                            toggleCollapsedMenu(item.key, e)
                          }
                        }}
                        title={isCollapsed ? item.label : ''}
                      >
                        <i className={`nav-icon fas ${item.icon}`}></i>
                        {!isCollapsed && (
                          <span>
                            {item.label}
                            <i className={`fas fa-angle-left right ${manualToggle ? 'rotated' : ''}`}></i>
                          </span>
                        )}
                      </a>

                      {/* Inline submenu for expanded state */}
                      {!isCollapsed && (
                        <ul className={`nav nav-treeview ${manualToggle ? 'show' : ''}`}>
                          {item.items.map((subItem, subIndex) => (
                            <li key={subIndex} className="nav-item">
                              <Link
                                href={subItem.path}
                                className={`nav-link ${isActive(subItem.path) ? 'active' : ''}`}
                                onClick={() => {
                                  onClose()
                                  setCollapsedOpenMenu(null)
                                }}
                              >
                                <i className={`fas ${subItem.icon} nav-icon`}></i>
                                <span>{subItem.label}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Popup submenu for collapsed state */}
                      {isCollapsed && isCollapsedPopupOpen && (
                        <div ref={popupRef} className="collapsed-popup">
                          <div className="popup-header">
                            <span className="popup-title">{item.label}</span>
                          </div>
                          <ul className="popup-menu">
                            {item.items.map((subItem, subIndex) => (
                              <li key={subIndex}>
                                <Link
                                  href={subItem.path}
                                  className={`popup-menu-item ${isActive(subItem.path) ? 'active' : ''}`}
                                  onClick={() => {
                                    onClose()
                                    setCollapsedOpenMenu(null)
                                  }}
                                >
                                  <i className={`fas ${subItem.icon} popup-icon`}></i>
                                  <span>{subItem.label}</span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                  )
                }

                return null
              })}
            </ul>
          </nav>
        </div>
      </aside>

      <style jsx>{`
        /* Sidebar Container */
        .main-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: 240px;
          height: 100vh;
          z-index: 1038;
          background-color: #ffffff !important;
          transition: width 0.3s ease-in-out;
          box-shadow: 2px 0 8px rgba(0, 0, 0, 0.08);
          border-right: 1px solid #e9ecef;
        }

        /* Collapsed state */
        .main-sidebar.collapsed {
          width: 70px;
        }

        @media (min-width: 992px) {
          .main-sidebar {
            transform: translateX(0) !important;
          }
        }

        @media (max-width: 991px) {
          .main-sidebar {
            transform: translateX(-100%);
            width: 240px !important;
          }
          .main-sidebar.open {
            transform: translateX(0);
          }
        }

        /* Brand Link */
        .brand-link {
          display: flex;
          align-items: center;
          padding: 1rem 0.75rem;
          border-bottom: 1px solid #e9ecef;
          text-decoration: none;
          background-color: #0d6efd;
          justify-content: flex-start;
          transition: justify-content 0.3s ease-in-out;
        }

        .main-sidebar.collapsed .brand-link {
          justify-content: center;
          padding: 1rem 0.25rem;
        }

        .brand-link i,
        .brand-icon {
          font-size: 1.5rem;
          margin-right: 0.5rem;
          margin-left: 0.5rem;
          color: #ffffff;
        }

        .main-sidebar.collapsed .brand-link i,
        .main-sidebar.collapsed .brand-icon {
          margin-right: 0;
          margin-left: 0;
        }

        .brand-text {
          font-size: 1.25rem;
          font-weight: 600;
          color: #ffffff !important;
        }

        /* Sidebar Container */
        .sidebar {
          padding-top: 0;
          padding-left: 0.75rem;
          padding-right: 0.75rem;
          overflow-y: auto;
          height: calc(100vh - 65px);
          background-color: #ffffff;
          transition: padding 0.3s ease-in-out;
        }

        .main-sidebar.collapsed .sidebar {
          padding-left: 0;
          padding-right: 0;
        }

        /* Nav Pills */
        .nav-pills {
          padding: 0;
          transition: padding 0.3s ease-in-out;
        }

        .main-sidebar.collapsed .nav-pills {
          padding: 0.5rem 0;
        }

        /* Nav Header */
        .nav-header {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem 0.5rem;
          font-size: 0.7rem;
          font-weight: 700;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-top: 0.5rem;
          white-space: nowrap;
          overflow: hidden;
        }

        .main-sidebar.collapsed .nav-header {
          display: none;
        }

        /* Nav Item */
        .nav-item {
          margin-bottom: 0.25rem;
        }

        .main-sidebar.collapsed .nav-item {
          margin-bottom: 0;
          margin-right: 1rem;
        }

        /* Nav Link */
        .nav-link {
          display: flex;
          align-items: center;
          padding: 0.65rem 0.85rem;
          color: #495057;
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.2s ease-in-out;
          cursor: pointer;
          font-size: 0.9rem;
          justify-content: flex-start;
          white-space: nowrap;
        }

        .main-sidebar.collapsed .nav-link {
          justify-content: center;
          padding: 0.65rem 0;
          border-radius: 0 !important;
        }

        .nav-link:hover {
          color: #0d6efd;
          background-color: #f8f9fa;
        }

        .nav-link.active {
          color: #ffffff !important;
          background-color: #0d6efd !important;
          box-shadow: 0 4px 12px rgba(13, 110, 253, 0.35);
        }

        /* Nav Icon - Colors */
        .nav-link:not(.active) .nav-icon {
          color: #6c757d;
        }

        .nav-link:hover .nav-icon {
          color: #0d6efd;
        }

        .nav-link.active .nav-icon {
          color: #ffffff !important;
        }

        /* Nav Icon */
        .nav-icon {
          margin-right: 0.85rem;
          font-size: 1rem;
          width: 1.5rem;
          text-align: center;
          transition: color 0.2s ease;
        }

        .main-sidebar.collapsed .nav-icon {
          margin-right: 0;
        }

        /* Nav Link span tag */
        .nav-link > span {
          margin: 0;
          flex: 1;
          display: flex;
          align-items: center;
          font-weight: 500;
          font-size: 0.9rem;
        }

        .main-sidebar.collapsed .nav-link > span {
          display: none;
        }

        /* Right Icon (Chevron) */
        .right {
          margin-left: auto;
          transition: transform 0.3s ease-in-out;
          color: #adb5bd;
          font-size: 0.8rem;
          flex-shrink: 0;
        }

        .main-sidebar.collapsed .right {
          display: none !important;
        }

        .right.rotated {
          transform: rotate(-90deg);
        }

        /* Treeview Parent */
        .has-treeview > .nav-link {
          color: #343a40;
          font-weight: 600;
        }

        .has-treeview > .nav-link:hover {
          color: #0d6efd;
        }

        .has-treeview > .nav-link .right {
          color: #adb5bd;
        }

        .has-treeview > .nav-link:hover .right {
          color: #0d6efd;
        }

        .has-treeview > .nav-link > span {
          font-weight: 600;
        }

        /* Nav Treeview (Submenu) */
        .nav-treeview {
          display: none;
          padding-left: 0.5rem;
          list-style: none;
          margin: 0;
          background-color: #f8f9fa;
          border-radius: 8px;
          margin-top: 0.25rem;
          margin-bottom: 0.25rem;
        }

        .nav-treeview.show {
          display: block;
          animation: slideDown 0.3s ease-in-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Treeview Items */
        .nav-treeview .nav-link {
          padding: 0.5rem 0.85rem;
          font-size: 0.875rem;
          display: flex !important;
          align-items: center !important;
          color: #6c757d;
          border-radius: 6px;
          margin-bottom: 2px;
          width: 100%;
          overflow: hidden;
        }

        .nav-treeview .nav-link > span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .nav-treeview .nav-link:hover {
          color: #0d6efd;
          background-color: #e9ecef;
        }

        .nav-treeview .nav-link.active {
          background-color: #0d6efd !important;
          box-shadow: 0 2px 6px rgba(13, 110, 253, 0.25);
        }

        .nav-treeview .nav-icon {
          font-size: 0.75rem;
          width: 1.25rem;
          margin-right: 0.75rem;
          color: #adb5bd;
        }

        .nav-treeview .nav-link:hover .nav-icon {
          color: #0d6efd;
        }

        .nav-treeview .nav-link.active .nav-icon {
          color: #ffffff !important;
        }

        .nav-treeview .nav-link > span {
          margin: 0 !important;
          padding: 0 !important;
          display: inline !important;
          font-size: 0.875rem !important;
          font-weight: 400;
        }

        /* Menu Open State */
        .menu-open > .nav-treeview {
          display: block;
        }

        /* Sidebar Overlay for Mobile */
        .sidebar-overlay {
          display: none;
        }

        .sidebar-overlay-z-index {
          z-index: 1040;
        }

        @media (max-width: 991px) {
          .sidebar-overlay {
            display: block;
          }
        }

        /* Custom Scrollbar */
        .sidebar::-webkit-scrollbar {
          width: 5px;
        }

        .sidebar::-webkit-scrollbar-track {
          background: #f1f3f5;
        }

        .sidebar::-webkit-scrollbar-thumb {
          background: #dee2e6;
          border-radius: 3px;
        }

        .sidebar::-webkit-scrollbar-thumb:hover {
          background: #adb5bd;
        }

        /* Collapsed Popup Menu Styles */
        .nav-item {
          position: relative;
        }

        .collapsed-popup {
          position: fixed;
          left: 70px;
          min-width: 220px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          z-index: 1045;
          animation: fadeInPopup 0.2s ease-in-out;
          overflow: hidden;
          border: 1px solid #e9ecef;
        }

        @keyframes fadeInPopup {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .popup-header {
          padding: 0.75rem 1rem;
          background-color: #0d6efd;
          color: #ffffff;
          font-weight: 600;
          font-size: 0.875rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .popup-title {
          font-family: 'Roboto Condensed', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .popup-menu {
          list-style: none;
          margin: 0;
          padding: 0.5rem 0;
        }

        .popup-menu li {
          margin: 0;
        }

        .popup-menu-item {
          display: flex;
          align-items: center;
          padding: 0.65rem 1rem;
          color: #495057;
          text-decoration: none;
          transition: all 0.2s ease-in-out;
          font-size: 0.875rem;
          cursor: pointer;
        }

        .popup-menu-item:hover {
          background-color: #f8f9fa;
          color: #0d6efd;
        }

        .popup-menu-item.active {
          background-color: #0d6efd !important;
          color: #ffffff !important;
        }

        .popup-icon {
          font-size: 0.875rem;
          width: 1.25rem;
          text-align: center;
          margin-right: 0.75rem;
          color: #6c757d;
        }

        .popup-menu-item:hover .popup-icon {
          color: #0d6efd;
        }

        .popup-menu-item.active .popup-icon {
          color: #ffffff !important;
        }

        .popup-menu-item span {
          font-weight: 400;
        }

        /* Popup active state for nav link */
        .nav-link.popup-active {
          background-color: #e7f1ff !important;
          color: #0d6efd !important;
        }

        .nav-link.popup-active .nav-icon {
          color: #0d6efd !important;
        }
      `}</style>
    </>
  )
}

export default Sidebar
