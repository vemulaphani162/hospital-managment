import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate 
} from 'react-router-dom';
import Navbar from './components/common/Navbar';
import HomePage from './components/common/HomePage';
import Login from './components/common/Login';
import Register from './components/common/Register';
import AdminDashboard from './components/admin/Dashboard';
import DoctorDashboard from './components/doctor/Dashboard';
import LabDashboard from './components/lab/Dashboard';
import PatientDashboard from './components/patient/Dashboard';
import PharmacyDashboard from './components/pharmacy/Dashboard';
import AddDoctor from './components/admin/AddDoctor';
import AmbulanceDashboard from './components/ambulance/Dashboard';
import AssistantDoctorDashboard from './components/assistant_doctor/Dashboard';

function App() {
  // Get user from localStorage
  const getUserRole = () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user)?.role : null;
    } catch {
      return null;
    }
  };

  const ProtectedRoute = ({ children, allowedRoles }) => {
    const userRole = getUserRole();
    
    console.log('ProtectedRoute:', { userRole, allowedRoles });
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      console.log('Access denied, redirecting to login');
      return <Navigate to="/login" replace />;
    }
    
    return children;
  };

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/doctor" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorDashboard />
            </ProtectedRoute>
          } />

          {/* 🆕 ASSISTANT DOCTOR DASHBOARD - PERFECTLY MATCHES LOGIN */}
          <Route path="/assistant-dashboard" element={
            <ProtectedRoute allowedRoles={['assistant']}>
              <AssistantDoctorDashboard />
            </ProtectedRoute>
          } />

          <Route path="/ambulance" element={
            <ProtectedRoute allowedRoles={['ambulance']}>
              <AmbulanceDashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin/add-doctor" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AddDoctor />
            </ProtectedRoute>
          } />
                  
          <Route path="/lab" element={
            <ProtectedRoute allowedRoles={['lab']}>
              <LabDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/patient" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/pharmacy" element={
            <ProtectedRoute allowedRoles={['pharmacy']}>
              <PharmacyDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
