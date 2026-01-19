import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Scale, RefreshCw, Briefcase, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import backgroundImage from '../assets/img.jpg';

interface LawyerCredential {
    username: string;
    password: string;
    district: string;
    name: string;
}

const LawyerLogin: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [credentials, setCredentials] = useState<LawyerCredential[]>([]);
    const [loadingCreds, setLoadingCreds] = useState(true);
    const [showCredentials, setShowCredentials] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadCredentials();
    }, []);

    const loadCredentials = async () => {
        setLoadingCreds(true);
        try {
            const { supabase } = await import('../utils/supabase');
            const { data, error } = await supabase
                .from('lawyers')
                .select('username, password, district, name, status')
                .eq('status', 'Active')
                .not('username', 'is', null)
                .not('password', 'is', null)
                .order('username', { ascending: true });

            if (error) throw error;

            if (data) {
                setCredentials(data.map(l => ({
                    username: l.username || '',
                    password: l.password || '',
                    district: l.district || '',
                    name: l.name || ''
                })));
            }
        } catch (error) {
            console.error('Error loading credentials:', error);
        } finally {
            setLoadingCreds(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const { supabase } = await import('../utils/supabase');
            
            // Find lawyer by username
            const { data: lawyers, error: fetchError } = await supabase
                .from('lawyers')
                .select('*')
                .eq('username', username.toUpperCase())
                .eq('status', 'Active')
                .single();

            if (fetchError || !lawyers) {
                setError('Invalid username or password');
                setIsLoading(false);
                return;
            }

            // Check password
            if (lawyers.password !== password) {
                setError('Invalid username or password');
                setIsLoading(false);
                return;
            }

            // Store lawyer session
            localStorage.setItem('lawyer_token', lawyers.id);
            localStorage.setItem('lawyer_data', JSON.stringify({
                id: lawyers.id,
                name: lawyers.name,
                district: lawyers.district,
                username: lawyers.username
            }));

            navigate('/lawyer/case-finder');
        } catch (error: any) {
            console.error('Login error:', error);
            setError('Login failed. Please try again.');
        } finally {
            setIsLoading(false);
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

            {/* Centered Login Container */}
            <div className="relative z-10 mx-auto" style={{ width: '360px', maxWidth: '390px' }}>
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden backdrop-blur-sm">
                        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-3.5 sm:p-4 text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-6"></div>
                            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-8 -mb-8"></div>
                            <div className="relative z-10">
                                <div className="flex justify-center mb-2">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center shadow-lg border border-white/30">
                                        <div className="relative">
                                            <Briefcase className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                                            <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white absolute -top-0.5 -right-0.5" />
                                        </div>
                                    </div>
                                </div>
                                <h2 className="text-lg sm:text-xl font-black text-white mb-0.5">Lawyer Login</h2>
                                <p className="text-blue-100 text-[10px] sm:text-xs font-semibold">Access your district cases securely</p>
                            </div>
                        </div>

                        <form onSubmit={handleLogin} className="p-3.5 sm:p-4 space-y-3 sm:space-y-3.5">
                            {error && (
                                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                                        <Lock className="h-4 w-4 text-red-600" />
                                    </div>
                                    <p className="text-red-600 font-bold text-xs flex-1">{error}</p>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5 text-slate-500" />
                                    <span>Username (District Code)</span>
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value.toUpperCase())}
                                        className="w-full pl-10 pr-3 py-2.5 sm:py-3 bg-slate-50 border-2 border-slate-200 rounded-lg font-bold text-xs sm:text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all uppercase placeholder:text-slate-400"
                                        placeholder="e.g., CHN001, CBE001"
                                        required
                                    />
                                </div>
                                <p className="text-[10px] sm:text-xs text-slate-500 font-medium ml-1">Enter your district code username</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
                                    <Lock className="h-3.5 w-3.5 text-slate-500" />
                                    <span>Password</span>
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2.5 sm:py-3 bg-slate-50 border-2 border-slate-200 rounded-lg font-bold text-xs sm:text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
                                        placeholder="Enter your password"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Credentials Toggle Button - Mobile Only */}
                            <div className="lg:hidden">
                                <button
                                    type="button"
                                    onClick={() => setShowCredentials(!showCredentials)}
                                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 border-2 border-slate-200 hover:border-slate-300"
                                >
                                    <span>Show Credentials</span>
                                    {showCredentials ? (
                                        <ChevronUp className="h-3.5 w-3.5" />
                                    ) : (
                                        <ChevronDown className="h-3.5 w-3.5" />
                                    )}
                                </button>
                            </div>

                            {/* Credentials List - Mobile Toggle */}
                            {showCredentials && (
                                <div className="lg:hidden bg-slate-50 rounded-lg border-2 border-slate-200 p-3 max-h-64 overflow-y-auto">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[10px] sm:text-xs font-black text-slate-700 uppercase tracking-widest">Credentials</p>
                                        <button
                                            onClick={loadCredentials}
                                            disabled={loadingCreds}
                                            className="p-1 hover:bg-white rounded transition-all disabled:opacity-50"
                                            title="Refresh"
                                        >
                                            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${loadingCreds ? 'animate-spin' : ''}`} />
                                        </button>
                                    </div>
                                    
                                    {loadingCreds ? (
                                        <div className="text-center py-4">
                                            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                            <p className="text-[10px] sm:text-xs text-slate-400">Loading...</p>
                                        </div>
                                    ) : credentials.length === 0 ? (
                                        <div className="text-center py-4">
                                            <p className="text-[10px] sm:text-xs text-slate-400 font-medium">No users added yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {credentials.map((cred, idx) => (
                                                <div 
                                                    key={idx}
                                                    className="flex items-center gap-2 p-2 bg-white rounded-lg border-2 border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer"
                                                    onClick={() => {
                                                        setUsername(cred.username);
                                                        setPassword(cred.password);
                                                        setShowCredentials(false);
                                                    }}
                                                >
                                                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-black text-[10px] shrink-0 shadow-sm">
                                                        {cred.username.substring(0, 3)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 mb-0.5">
                                                            <span className="font-black text-slate-700 text-[10px] sm:text-xs">{cred.username}</span>
                                                            <span className="text-slate-300 text-[10px]">|</span>
                                                            <span className="font-bold text-indigo-600 text-[10px] sm:text-xs">{cred.password}</span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 truncate">{cred.district}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-lg sm:rounded-xl font-black text-xs sm:text-sm hover:shadow-lg transition-all shadow-md shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    <>
                                        <Scale className="h-4 w-4 sm:h-5 sm:w-5" />
                                        <span>Sign In to Case Finder</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-100 rounded-lg p-2.5">
                                <p className="text-[10px] sm:text-xs text-blue-700 font-semibold text-center leading-relaxed">
                                    <strong className="font-black">Note:</strong> Username format is District Code + Number (e.g., CHN001 for Chennai, CBE001 for Coimbatore)
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    );
};

export default LawyerLogin;

