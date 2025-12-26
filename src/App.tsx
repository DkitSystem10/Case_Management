import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Appointment from './pages/Appointment';
import CaseCounselling from './pages/CaseCounselling';
import CaseFinder from './pages/CaseFinder';
import Reports from './pages/Reports';
import Placeholder from './pages/Placeholder';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import PaymentPage from './pages/PaymentPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto py-6 px-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/appointment" element={<Appointment />} />
            <Route path="/case-counselling" element={<CaseCounselling />} />
            <Route path="/case-finder" element={<CaseFinder />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/payment/:appointmentId" element={<PaymentPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
