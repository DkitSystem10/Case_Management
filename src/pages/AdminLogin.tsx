import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ShieldCheck } from 'lucide-react';

const AdminLogin: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        // Fetch credentials from .env via Vite's import.meta.env
        const validUser = import.meta.env.VITE_ADMIN_USER || 'admin';
        const validPass = import.meta.env.VITE_ADMIN_PASS || 'lexconnect2025';

        console.log('Login attempt with env check:', {
            envLoadedUser: !!import.meta.env.VITE_ADMIN_USER,
            envLoadedPass: !!import.meta.env.VITE_ADMIN_PASS
        });

        if (username === validUser && password === validPass) {
            localStorage.setItem('admin_token', 'lexconnect_session_active');
            navigate('/admin');
        } else {
            setError('Invalid username or password');
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center -mt-10">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
                    <div className="bg-slate-900 p-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/10 rounded-2xl mb-4 border border-blue-500/20">
                            <ShieldCheck className="h-8 w-8 text-blue-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Admin Access</h1>
                        <p className="text-slate-400 mt-2">Enter credentials to manage LexConnect</p>
                    </div>

                    <form onSubmit={handleLogin} className="p-8 space-y-6">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Username</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                    placeholder="admin"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:-translate-y-1"
                        >
                            Sign In to Dashboard
                        </button>
                    </form>
                </div>

                <p className="text-center mt-8 text-slate-500 text-sm">
                    Secure terminal for authorized legal administrators only.
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;
