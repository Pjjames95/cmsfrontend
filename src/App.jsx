import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { SanitizationProvider } from './context/SanitizationContext'

// Admin Auth Provider
import { AdminAuthProvider } from './hooks/useAdminAuth'
import { useAdminAuth } from './hooks/useAdminAuth'

//managing
import RolesManager from './components/admin/tables/RolesManager'
import MinistriesManager from './components/admin/tables/MinistriesManager'
import NewsManager from './components/admin/tables/NewsManager'
import SermonsManager from './components/admin/tables/SermonsManager'
import HymnBooksManager from './components/admin/tables/HymnBooksManager'
import FinancialsManager from './components/admin/tables/FinancialsManager'
import ServiceProgramManager from './components/admin/tables/ServiceProgramManager'
import ProjectsManager from './components/admin/tables/ProjectsManager'
import ChoirHistoryManager from './components/admin/tables/ChoirHistoryManager'
import MinistryRegistrationsManager from './components/admin/tables/MinistryRegistrationsManager'

// Layout
import PublicLayout from './components/public/layout/PublicLayout'

// Public Pages
import HomePage from './pages/public/HomePage'
import AboutPage from './pages/public/AboutPage'
import MinistriesPage from './pages/public/MinistriesPage'
import ServiceProgramPage from './pages/public/ServiceProgramPage'
import SermonsPage from './pages/public/SermonsPage'
import NewsPage from './pages/public/NewsPage'
import HymnsPage from './pages/public/HymnsPage'
import ProjectsPage from './pages/public/ProjectsPage'
import ContactPage from './pages/public/ContactPage'
import ChoirHistoryPage from './pages/public/ChoirHistoryPage'
import MinistryRegistrationPage from './pages/public/MinistryRegistrationPage'


// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import Unauthorized from './pages/admin/Unauthorized'
import ProtectedAdminRoute from './components/admin/auth/ProtectedAdminRoute'
import AdminLayout from './components/admin/layout/AdminLayout'


const RolesPage = () => <RolesManager />
const MinistriesManagerPage = () => <div>Ministries Management (Coming Soon)</div>
const NewsManagerPage = () => <div>News Management (Coming Soon)</div>
const SermonsManagerPage = () => <div>Sermons Management (Coming Soon)</div>
const HymnBooksManagerPage = () => <div>Hymn Books Management (Coming Soon)</div>
const FinancialsManagerPage = () => <div>Financials Management (Coming Soon)</div>
const ServiceProgramManagerPage = () => <div>Service Program Management (Coming Soon)</div>
const ProjectsManagerPage = () => <div>Projects Management (Coming Soon)</div>
const ChoirHistoryManagerPage = () => <div>Choir History Management (Coming Soon)</div>
const MinistryRegistrationsManagerPage = () => <div>Ministry Registrations (Coming Soon)</div>

function App() {
  return (
    <SanitizationProvider>
    <Router>
      <AdminAuthProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        
        <Routes>
          {/* Public Routes with Layout */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/ministries" element={<MinistriesPage />} />
            <Route path="/ministries/register/:ministryId" element={<MinistryRegistrationPage />} />
            <Route path="/sermons" element={<SermonsPage />} />
            <Route path="/services" element={<ServiceProgramPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/hymns" element={<HymnsPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/choir" element={<ChoirHistoryPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/unauthorized" element={<Unauthorized />} />
          
          {/* Protected Admin Routes */}
          <Route path="/admin" element={
            <ProtectedAdminRoute>
              <AdminLayout />
            </ProtectedAdminRoute>
          }>
            <Route path="dashboard" element={<AdminDashboard />} />
            
            {/* Super Admin only routes */}
            <Route path="roles" element={
              <ProtectedAdminRoute requiredRole="dean">
                <RolesPage />
              </ProtectedAdminRoute>
            } />
            
            <Route path="ministries" element={
                <ProtectedAdminRoute requiredRole="ministries_admin">
                  <MinistriesManager />
                </ProtectedAdminRoute>
              } />
            
            <Route path="news" element={
                <ProtectedAdminRoute requiredRole="media_admin">
                  <NewsManager />
                </ProtectedAdminRoute>
              } />
            
            <Route path="sermons" element={
                <ProtectedAdminRoute requiredRole="media_admin">
                  <SermonsManager />
                </ProtectedAdminRoute>
              } />
            
            <Route path="hymn-books" element={
                <ProtectedAdminRoute requiredRole="secretary_admin">
                  <HymnBooksManager />
                </ProtectedAdminRoute>
              } />
            
            <Route path="financials" element={
                <ProtectedAdminRoute requiredRole="financials_admin">
                  <FinancialsManager />
                </ProtectedAdminRoute>
              } />
            
            <Route path="service-program" element={
                <ProtectedAdminRoute requiredRole="secretary_admin">
                  <ServiceProgramManager />
                </ProtectedAdminRoute>
              } />
            
            <Route path="projects" element={
                <ProtectedAdminRoute requiredRole="projects_admin">
                  <ProjectsManager />
                </ProtectedAdminRoute>
              } />
            
            <Route path="choir-history" element={
                <ProtectedAdminRoute requiredRole="choir_admin">
                  <ChoirHistoryManager />
                </ProtectedAdminRoute>
              } />
            
            <Route path="registrations" element={
                <ProtectedAdminRoute requiredRole="ministries_admin">
                  <MinistryRegistrationsManager />
                </ProtectedAdminRoute>
              } />
          </Route>
        </Routes>
      </AdminAuthProvider>
    </Router>
    </SanitizationProvider>
  )
}

export default App