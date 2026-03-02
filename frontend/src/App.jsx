import { Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@apollo/client'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import StudentForm from './pages/StudentForm'
import Tokens from './pages/Tokens'
import Invoices from './pages/Invoices'
import Reports from './pages/Reports'
import Accounting from './pages/Accounting'
import FiscalYears from './pages/FiscalYears'
import Navbar from './components/Navbar'
import { useAuth } from './contexts/AuthContext'

const queryClient = new QueryClient()

function App() {
  const { isAuthenticated } = useAuth()

  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        {isAuthenticated && <Navbar />}
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
          <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/students" element={isAuthenticated ? <Students /> : <Navigate to="/login" />} />
          <Route path="/students/new" element={isAuthenticated ? <StudentForm /> : <Navigate to="/login" />} />
          <Route path="/students/:id" element={isAuthenticated ? <StudentForm /> : <Navigate to="/login" />} />
          <Route path="/tokens" element={isAuthenticated ? <Tokens /> : <Navigate to="/login" />} />
          <Route path="/invoices" element={isAuthenticated ? <Invoices /> : <Navigate to="/login" />} />
          <Route path="/reports" element={isAuthenticated ? <Reports /> : <Navigate to="/login" />} />
          <Route path="/accounting" element={isAuthenticated ? <Accounting /> : <Navigate to="/login" />} />
          <Route path="/fiscal-years" element={isAuthenticated ? <FiscalYears /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </QueryClientProvider>
  )
}

export default App
