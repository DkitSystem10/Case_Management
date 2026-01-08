import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CallButton from './components/CallButton';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Appointment from './pages/Appointment';
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {!isAdminPath && !isLawyerPath && !isAppointmentPath && <Navbar />}
      <main className={`flex-grow ${!isAdminPath && !isLawyerPath && !isAppointmentPath ? 'container mx-auto py-6 px-4' : 'w-full h-screen h-svh'}`}>
        <Routes>
          <Route path="/lawyer/login" element={<LawyerLogin />} />
          <Route path="/lawyer/case-finder" element={<CaseFinder />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/payment/:appointmentId" element={<PaymentPage />} />
          <Route path="/appointment" element={<Appointment />} />
          <Route path="/" element={<Navigate to="/lawyer/login" replace />} />
          <Route path="*" element={<Navigate to="/lawyer/login" replace />} />
        </Routes>
      </main>
      {!isAdminPath && !isLawyerPath && !isAppointmentPath && <Footer />}
      {!isAdminPath && !isLawyerPath && !isAppointmentPath && <CallButton />}
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
