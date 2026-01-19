import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ShieldCheck } from 'lucide-react';
import backgroundImage from '../assets/img.jpg';

const AdminLogin: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        // Trim whitespace from input
        const trimmedUsername = username.trim();
        const trimmedPassword = password.trim();

        // Fetch credentials from .env via Vite's import.meta.env
        // IMPORTANT: Vite requires VITE_ prefix and server restart after .env changes
        const envUser = import.meta.env.VITE_ADMIN_USER;
        const envPass = import.meta.env.VITE_ADMIN_PASS;
        
        const validUser = envUser ? envUser.trim() : 'admin';
        const validPass = envPass ? envPass.trim() : 'lexconnect2025';

        // Debug logging - check browser console
        console.log('=== Admin Login Debug ===');
        console.log('Entered Username:', trimmedUsername);
        console.log('Entered Password Length:', trimmedPassword.length);
        console.log('Expected Username:', validUser);
        console.log('Expected Password Length:', validPass.length);
        console.log('Env Variable Loaded (VITE_ADMIN_USER):', !!envUser);
        console.log('Env Variable Loaded (VITE_ADMIN_PASS):', !!envPass);
        console.log('Username Match:', trimmedUsername === validUser);
        console.log('Password Match:', trimmedPassword === validPass);
        
        if (!envUser || !envPass) {
            console.warn('⚠️ WARNING: Using default credentials!');
            console.warn('Please create a .env file in the project root with:');
            console.warn('VITE_ADMIN_USER=your_username');
            console.warn('VITE_ADMIN_PASS=your_password');
            console.warn('Then restart the dev server (npm run dev)');
        }

        // Compare credentials (case-sensitive)
        if (trimmedUsername === validUser && trimmedPassword === validPass) {
            localStorage.setItem('admin_token', 'lexconnect_session_active');
            navigate('/admin');
        } else {
            setError(`Invalid username or password. ${!envUser || !envPass ? 'Using default credentials. Check console for details.' : ''}`);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src={backgroundImage}
                    alt="Legal Justice Background"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-900/60"></div>
            </div>

            {/* Centered Login Box */}
            <div className="relative z-10 mx-auto" style={{ width: '360px', maxWidth: '390px' }}>
                <div className="bg-white rounded-xl shadow-xl border border-slate-200/50 overflow-hidden backdrop-blur-sm">
                    {/* Header */}
                    <div className="bg-gradient-to-br from-red-600 via-rose-600 to-pink-600 p-3.5 sm:p-4 text-center">
                        <div className="flex justify-center mb-2">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-white/30">
                                <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                            </div>
                        </div>
                        <h2 className="text-lg sm:text-xl font-black text-white mb-0.5">Admin Login</h2>
                        <p className="text-red-100 text-[10px] sm:text-xs font-semibold">Secure access to LexConnect</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="p-3.5 sm:p-4 space-y-3 sm:space-y-3.5">
                        {error && (
                            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-2.5 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                                    <Lock className="h-3.5 w-3.5 text-red-600" />
                                </div>
                                <p className="text-red-600 font-bold text-[10px] sm:text-xs flex-1">{error}</p>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-[10px] sm:text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-slate-500" />
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter username"
                                className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-50 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all font-medium text-slate-900 text-xs sm:text-sm"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] sm:text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <Lock className="h-3.5 w-3.5 text-slate-500" />
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-50 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all font-medium text-slate-900 text-xs sm:text-sm"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 text-white rounded-lg font-black text-xs sm:text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 uppercase tracking-wider"
                        >
                            Sign In
                        </button>
                    </form>
                </div>

                <p className="text-center mt-6 text-white/80 text-xs font-semibold">
                    Secure terminal for authorized administrators only
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;
