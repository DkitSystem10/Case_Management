import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CallButton from './components/CallButton';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Appointment from './pages/Appointment';
import ClientAppointment from './pages/ClientAppointment';
import CaseCounselling from './pages/CaseCounselling';
import CaseFinder from './pages/CaseFinder';
import Reports from './pages/Reports';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import PaymentPage from './pages/PaymentPage';
import LawyerLogin from './pages/LawyerLogin';

function AppContent() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const isLawyerPath = location.pathname.startsWith('/lawyer');
  const isAppointmentPath = location.pathname === '/appointment';
  const isClientAppointmentPath = location.pathname === '/client-appointment';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {!isAdminPath && !isLawyerPath && !isAppointmentPath && !isClientAppointmentPath && <Navbar />}
      <main className={`flex-grow ${!isAdminPath && !isLawyerPath && !isAppointmentPath && !isClientAppointmentPath ? 'container mx-auto py-6 px-4' : 'w-full'}`}>
        <Routes>
          <Route path="/lawyer/login" element={<LawyerLogin />} />
          <Route path="/lawyer/case-finder" element={<CaseFinder />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/payment/:appointmentId" element={<PaymentPage />} />
          <Route path="/appointment" element={<Appointment />} />
          <Route path="/client-appointment" element={<ClientAppointment />} />
          <Route path="/" element={<Navigate to="/client-appointment" replace />} />
          <Route path="*" element={<Navigate to="/client-appointment" replace />} />
        </Routes>
      </main>
      {!isAdminPath && !isLawyerPath && !isAppointmentPath && !isClientAppointmentPath && <Footer />}
      {!isAdminPath && !isLawyerPath && !isAppointmentPath && !isClientAppointmentPath && <CallButton />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AppContent />
    </Router>
  );
}

export default App;
