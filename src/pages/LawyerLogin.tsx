import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Scale, RefreshCw, Briefcase, FileText, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
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
    const [showAddCredentialModal, setShowAddCredentialModal] = useState(false);
    const [newCredential, setNewCredential] = useState({ username: '', password: '', district: '', name: '' });
    const [addingCredential, setAddingCredential] = useState(false);
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

    const handleAddCredential = async () => {
        if (!newCredential.username || !newCredential.password || !newCredential.district || !newCredential.name) {
            setError('Please fill all fields');
            return;
        }

        setAddingCredential(true);
        try {
            const { supabase } = await import('../utils/supabase');
            const { error } = await supabase
                .from('lawyers')
                .insert({
                    username: newCredential.username.toUpperCase(),
                    password: newCredential.password,
                    district: newCredential.district,
                    name: newCredential.name,
                    status: 'Active',
                    specialization: 'General',
                    experience: '0 Years'
                });

            if (error) throw error;

            // Reset form and reload credentials
            setNewCredential({ username: '', password: '', district: '', name: '' });
            setShowAddCredentialModal(false);
            await loadCredentials();
        } catch (error: any) {
            console.error('Error adding credential:', error);
            setError(error.message || 'Failed to add credential');
        } finally {
            setAddingCredential(false);
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
        <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 lg:p-6 relative overflow-hidden">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src={backgroundImage}
                    alt="Legal Justice Background"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-900/60"></div>
            </div>

            {/* Login Container with Credentials */}
            <div className="relative z-10 w-full max-w-6xl mx-auto px-1 sm:px-2">
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 items-center justify-center">
                    {/* Left Side - Login Form */}
                    <div className="w-full max-w-full sm:max-w-md lg:w-auto lg:max-w-none" style={{ maxWidth: '100%' }}>
                        <div className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden backdrop-blur-sm w-full">
                        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-3 sm:p-3.5 lg:p-4 text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-full -mr-8 -mt-4 sm:-mr-10 sm:-mt-6"></div>
                            <div className="absolute bottom-0 left-0 w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-full -ml-6 -mb-6 sm:-ml-8 sm:-mb-8"></div>
                            <div className="relative z-10">
                                <div className="flex justify-center mb-1.5 sm:mb-2">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center shadow-lg border border-white/30">
                                        <div className="relative">
                                            <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
                                            <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-3.5 lg:w-3.5 text-white absolute -top-0.5 -right-0.5" />
                                        </div>
                                    </div>
                                </div>
                                <h2 className="text-base sm:text-lg lg:text-xl font-black text-white mb-0.5">Lawyer Login</h2>
                                <p className="text-blue-100 text-[9px] sm:text-[10px] lg:text-xs font-semibold">Access your district cases securely</p>
                            </div>
                        </div>

                        <form onSubmit={handleLogin} className="p-3 sm:p-3.5 lg:p-4 space-y-2.5 sm:space-y-3 lg:space-y-3.5">
                            {error && (
                                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-2 sm:p-2.5 lg:p-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                                        <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600" />
                                    </div>
                                    <p className="text-red-600 font-bold text-[10px] sm:text-xs flex-1 break-words">{error}</p>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-[10px] sm:text-xs lg:text-sm font-bold text-slate-700 flex items-center gap-1">
                                    <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-500 shrink-0" />
                                    <span className="break-words">Username (District Code)</span>
                                </label>
                                <div className="relative">
                                    <User className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={username}
                                        readOnly
                                        className="w-full pl-9 sm:pl-10 pr-2.5 sm:pr-3 py-2 sm:py-2.5 lg:py-3 bg-slate-100 border-2 border-slate-300 rounded-lg font-bold text-[11px] sm:text-xs lg:text-sm text-slate-700 outline-none transition-all uppercase placeholder:text-slate-400 cursor-not-allowed"
                                        placeholder="Select from credentials"
                                        required
                                    />
                                </div>
                                <p className="text-[9px] sm:text-[10px] lg:text-xs text-slate-500 font-medium ml-0.5 sm:ml-1">Click credentials below to auto-fill</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] sm:text-xs lg:text-sm font-bold text-slate-700 flex items-center gap-1">
                                    <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-500 shrink-0" />
                                    <span>Password</span>
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                                    <input
                                        type="password"
                                        value={password}
                                        readOnly
                                        className="w-full pl-9 sm:pl-10 pr-2.5 sm:pr-3 py-2 sm:py-2.5 lg:py-3 bg-slate-100 border-2 border-slate-300 rounded-lg font-bold text-[11px] sm:text-xs lg:text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 cursor-not-allowed"
                                        placeholder="Select from credentials"
                                        required
                                    />
                                </div>
                                <p className="text-[9px] sm:text-[10px] lg:text-xs text-slate-500 font-medium ml-0.5 sm:ml-1">Click credentials below to auto-fill</p>
                            </div>

                            {/* Credentials Toggle Button - Mobile Only */}
                            <div className="lg:hidden">
                                <button
                                    type="button"
                                    onClick={() => setShowCredentials(!showCredentials)}
                                    className="w-full py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] sm:text-xs lg:text-sm transition-all flex items-center justify-center gap-2 border-2 border-slate-200 hover:border-slate-300"
                                >
                                    <span>{showCredentials ? 'Hide' : 'Show'} Credentials</span>
                                    {showCredentials ? (
                                        <ChevronUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                    ) : (
                                        <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                    )}
                                </button>
                            </div>

                            {/* Credentials List - Mobile Toggle */}
                            {showCredentials && (
                                <div className="lg:hidden bg-slate-50 rounded-lg border-2 border-slate-200 p-2 sm:p-2.5 lg:p-3 max-h-56 sm:max-h-64 overflow-y-auto">
                                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                                        <p className="text-[9px] sm:text-[10px] lg:text-xs font-black text-slate-700 uppercase tracking-widest">Credentials</p>
                                        <button
                                            onClick={loadCredentials}
                                            disabled={loadingCreds}
                                            className="p-0.5 sm:p-1 hover:bg-white rounded transition-all disabled:opacity-50"
                                            title="Refresh"
                                        >
                                            <RefreshCw className={`h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-500 ${loadingCreds ? 'animate-spin' : ''}`} />
                                        </button>
                                    </div>
                                    
                                    {loadingCreds ? (
                                        <div className="text-center py-3 sm:py-4">
                                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-1.5 sm:mb-2"></div>
                                            <p className="text-[9px] sm:text-[10px] lg:text-xs text-slate-400">Loading...</p>
                                        </div>
                                    ) : credentials.length === 0 ? (
                                        <div className="text-center py-3 sm:py-4">
                                            <p className="text-[9px] sm:text-[10px] lg:text-xs text-slate-400 font-medium">No users added yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1 sm:space-y-1.5">
                                            {credentials.map((cred, idx) => (
                                                <div 
                                                    key={idx}
                                                    className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-white rounded-lg border-2 border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer active:scale-95"
                                                    onClick={() => {
                                                        setUsername(cred.username);
                                                        setPassword(cred.password);
                                                        setShowCredentials(false);
                                                    }}
                                                >
                                                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-black text-[9px] sm:text-[10px] shrink-0 shadow-sm">
                                                        {cred.username.substring(0, 3)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5">
                                                            <span className="font-black text-slate-700 text-[9px] sm:text-[10px] lg:text-xs truncate">{cred.username}</span>
                                                            <span className="text-slate-300 text-[9px] sm:text-[10px] shrink-0">|</span>
                                                            <span className="font-bold text-indigo-600 text-[9px] sm:text-[10px] lg:text-xs truncate">{cred.password}</span>
                                                        </div>
                                                        <p className="text-[9px] sm:text-[10px] text-slate-500 truncate">{cred.district}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading || !username || !password}
                                className="w-full py-2.5 sm:py-3 lg:py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-lg sm:rounded-xl font-black text-[11px] sm:text-xs lg:text-sm hover:shadow-lg transition-all shadow-md shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2 active:scale-95"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Signing in...</span>
                                    </>
                                ) : !username || !password ? (
                                    <>
                                        <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                                        <span className="text-[10px] sm:text-[11px] lg:text-xs">Select Credentials</span>
                                    </>
                                ) : (
                                    <>
                                        <Scale className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                                        <span>Sign In to Case Finder</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="px-3 sm:px-4 lg:px-5 pb-3 sm:pb-4 lg:pb-5">
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg p-2 sm:p-2.5 lg:p-2.5">
                                <p className="text-[9px] sm:text-[10px] lg:text-xs text-amber-700 font-semibold text-center leading-relaxed">
                                    <strong className="font-black">⚠️ Important:</strong> Select credentials below to auto-fill. Direct typing disabled.
                                </p>
                            </div>
                        </div>
                    </div>
                    </div>

                    {/* Right Side - Active User Credentials - Desktop Only */}
                    <div className="hidden lg:block w-64">
                        <div className="bg-white rounded-xl shadow-xl border border-slate-200/50 overflow-hidden backdrop-blur-sm">
                            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-3 text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8"></div>
                                <div className="relative z-10">
                                    <h3 className="text-base font-black text-white mb-0.5">Active Users</h3>
                                    <p className="text-indigo-100 text-xs font-semibold">Click to auto-fill</p>
                                </div>
                            </div>

                            <div className="p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Credentials</p>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setShowAddCredentialModal(true)}
                                            className="p-1 hover:bg-indigo-100 rounded transition-all text-indigo-600"
                                            title="Add credential"
                                        >
                                            <Plus className="h-3 w-3" />
                                        </button>
                                        <button
                                            onClick={loadCredentials}
                                            disabled={loadingCreds}
                                            className="p-1 hover:bg-slate-100 rounded transition-all disabled:opacity-50"
                                            title="Refresh credentials"
                                        >
                                            <RefreshCw className={`h-3 w-3 text-slate-500 ${loadingCreds ? 'animate-spin' : ''}`} />
                                        </button>
                                    </div>
                                </div>
                                
                                {loadingCreds ? (
                                    <div className="text-center py-6">
                                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                        <p className="text-xs text-slate-400">Loading...</p>
                                    </div>
                                ) : credentials.length === 0 ? (
                                    <div className="text-center py-6">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <User className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <p className="text-xs text-slate-400 font-medium">No users added yet</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">Add users in Admin Settings</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                                        {credentials.map((cred, idx) => (
                                            <div 
                                                key={idx}
                                                className="flex items-center gap-2 p-2 bg-gradient-to-br from-slate-50 to-white rounded-lg border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
                                                onClick={() => {
                                                    setUsername(cred.username);
                                                    setPassword(cred.password);
                                                }}
                                            >
                                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-black text-[10px] shrink-0 shadow-sm">
                                                    {cred.username.substring(0, 3)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1 mb-0.5">
                                                        <span className="font-black text-slate-700 text-xs">{cred.username}</span>
                                                        <span className="text-slate-300 text-xs">|</span>
                                                        <span className="font-bold text-indigo-600 text-xs">{cred.password}</span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 truncate">{cred.district}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Credential Modal */}
            {showAddCredentialModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl w-full max-w-md border border-slate-200 max-h-[90vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-3 sm:p-4 flex items-center justify-between sticky top-0 z-10">
                            <h3 className="text-base sm:text-lg font-black text-white">Add New Credential</h3>
                            <button
                                onClick={() => {
                                    setShowAddCredentialModal(false);
                                    setNewCredential({ username: '', password: '', district: '', name: '' });
                                }}
                                className="p-1 hover:bg-white/20 rounded transition-all"
                            >
                                <X className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                            </button>
                        </div>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleAddCredential();
                            }}
                            className="p-3 sm:p-4 space-y-2.5 sm:space-y-3"
                        >
                            <div className="space-y-1">
                                <label className="text-[10px] sm:text-xs font-bold text-slate-700">Name</label>
                                <input
                                    type="text"
                                    value={newCredential.name}
                                    onChange={(e) => setNewCredential({ ...newCredential, name: e.target.value })}
                                    placeholder="Enter lawyer name"
                                    className="w-full px-2.5 sm:px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900 text-[11px] sm:text-sm"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] sm:text-xs font-bold text-slate-700">Username (District Code)</label>
                                <input
                                    type="text"
                                    value={newCredential.username}
                                    onChange={(e) => setNewCredential({ ...newCredential, username: e.target.value.toUpperCase() })}
                                    placeholder="e.g., CHN001"
                                    className="w-full px-2.5 sm:px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900 text-[11px] sm:text-sm uppercase"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] sm:text-xs font-bold text-slate-700">Password</label>
                                <input
                                    type="text"
                                    value={newCredential.password}
                                    onChange={(e) => setNewCredential({ ...newCredential, password: e.target.value })}
                                    placeholder="Enter password"
                                    className="w-full px-2.5 sm:px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900 text-[11px] sm:text-sm"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] sm:text-xs font-bold text-slate-700">District</label>
                                <input
                                    type="text"
                                    value={newCredential.district}
                                    onChange={(e) => setNewCredential({ ...newCredential, district: e.target.value })}
                                    placeholder="Enter district"
                                    className="w-full px-2.5 sm:px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900 text-[11px] sm:text-sm"
                                    required
                                />
                            </div>

                            <div className="flex gap-2 pt-1.5 sm:pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddCredentialModal(false);
                                        setNewCredential({ username: '', password: '', district: '', name: '' });
                                    }}
                                    className="flex-1 py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] sm:text-sm transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addingCredential}
                                    className="flex-1 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-lg font-bold text-[11px] sm:text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                                >
                                    {addingCredential ? 'Adding...' : 'Add Credential'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LawyerLogin;

