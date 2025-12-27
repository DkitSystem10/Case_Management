import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getAppointments,
    updateAppointmentStatus,
    getLawyers,
    assignLawyer,
    type AppointmentRecord,
    type Lawyer
} from '../utils/storage';
import {
    CheckCircle,
    XCircle,
    LogOut,
    Mail,
    Phone,
    Calendar,
    Clock,
    Filter,
    CreditCard,
    IndianRupee,
    UserCheck,
    Star,
    ArrowRight,
    Lock,
    Check,
    Search,
    X
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
    const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
    const [lawyers, setLawyers] = useState<Lawyer[]>([]);
    const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [editingFees, setEditingFees] = useState<Record<string, { consultation: number, case: number }>>({});

    useEffect(() => {
        // Auth check
        const token = localStorage.getItem('admin_token');
        if (!token) {
            navigate('/admin/login');
            return;
        }
        loadData();
    }, [navigate]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [appData, lawyerData] = await Promise.all([
                getAppointments(),
                getLawyers()
            ]);

            setAppointments(appData);
            setLawyers(lawyerData);

            // Initialize local fee state
            const initialFees: Record<string, { consultation: number, case: number }> = {};
            appData.forEach(app => {
                initialFees[app.id] = { consultation: app.consultationFee, case: app.caseFee };
            });
            setEditingFees(initialFees);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, status: 'Approved' | 'Rejected') => {
        try {
            await updateAppointmentStatus(id, status);
            await loadData();
        } catch (error) {
            alert('Failed to update status.');
        }
    };

    const handleAssignLawyer = async (appId: string, lawyerId: string) => {
        try {
            await assignLawyer(appId, lawyerId);
            await loadData();
        } catch (error) {
            alert('Failed to assign lawyer.');
        }
    };

    const handleFeeChange = (id: string, type: 'consultation' | 'case', value: string) => {
        const numValue = parseFloat(value) || 0;
        setEditingFees(prev => ({
            ...prev,
            [id]: { ...prev[id], [type]: numValue }
        }));
    };

    const handleProcessPayment = (id: string) => {
        const fees = editingFees[id];
        navigate(`/admin/payment/${id}`, { state: { fees } });
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
    };

    const filteredData = appointments
        .filter(app => filter === 'All' ? true : app.status === filter)
        .filter(app => {
            if (!searchQuery.trim()) return true;
            const query = searchQuery.toLowerCase();
            return (
                app.fullName.toLowerCase().includes(query) ||
                app.phoneNumber.toLowerCase().includes(query) ||
                app.emailId.toLowerCase().includes(query)
            );
        });

    // Helper function to determine workflow step
    const getWorkflowStep = (request: AppointmentRecord): number => {
        if (request.status === 'Pending') return 1;
        if (request.status === 'Rejected') return 0;
        if (request.status === 'Approved' && !request.lawyerId) return 2;
        if (request.status === 'Approved' && request.lawyerId) return 3;
        return 0;
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Admin Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Case Intake Dashboard</h1>
                    <p className="text-slate-500 mt-1">Manage and respond to client appointment requests</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-all text-sm"
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Requests', count: appointments.length, color: 'text-slate-600', bg: 'bg-slate-50' },
                    { label: 'Pending', count: appointments.filter(a => a.status === 'Pending').length, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Approved', count: appointments.filter(a => a.status === 'Approved').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Rejected', count: appointments.filter(a => a.status === 'Rejected').length, color: 'text-red-600', bg: 'bg-red-50' },
                ].map((stat) => (
                    <div key={stat.label} className={`${stat.bg} p-6 rounded-[2rem] border border-transparent hover:border-slate-200 transition-all`}>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                        <p className={`text-3xl font-black ${stat.color} mt-2`}>{stat.count}</p>
                    </div>
                ))}
            </div>

            {/* Search Bar */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="flex-1 w-full md:max-w-xl">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, phone number, or email..."
                                className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500 font-medium">Showing</span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg font-bold">
                            {filteredData.length}
                        </span>
                        <span className="text-slate-500 font-medium">of</span>
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg font-bold">
                            {appointments.length}
                        </span>
                        <span className="text-slate-500 font-medium">requests</span>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                {['All', 'Pending', 'Approved', 'Rejected'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Requests List */}
            <div className="grid gap-8">
                {isLoading ? (
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100">
                        <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-slate-500 font-medium tracking-wide">Synchronizing with legal database...</p>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-300">
                        <Filter className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium text-lg">No {filter !== 'All' ? filter.toLowerCase() : ''} requests found.</p>
                    </div>
                ) : (
                    filteredData.map((request) => {
                        const currentStep = getWorkflowStep(request);
                        const isApproved = request.status === 'Approved';
                        const hasLawyer = !!request.lawyerId;

                        return (
                            <div key={request.id} className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-md transition-all">
                                <div className="p-8">
                                    {/* Client Info Header */}
                                    <div className="flex flex-col lg:flex-row justify-between gap-6 mb-8">
                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-2xl font-bold text-slate-900">{request.fullName}</h3>
                                                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${request.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                                    request.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {request.status}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-blue-500" /> {request.phoneNumber}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-blue-500" /> {request.emailId}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-blue-500" /> {request.appointmentDate}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-blue-500" /> {request.timeSlot}
                                                </div>
                                            </div>

                                            <div className="p-4 bg-slate-50 rounded-2xl">
                                                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Case Context</p>
                                                <div className="flex gap-2 mb-3">
                                                    <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
                                                        {request.caseCategory}
                                                    </span>
                                                    <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold">
                                                        {request.consultationType}
                                                    </span>
                                                </div>
                                                <p className="text-slate-700 text-sm leading-relaxed italic">
                                                    "{request.description}"
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Workflow Steps */}
                                    <div className="mb-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Processing Workflow</h4>
                                        </div>

                                        {/* Step Indicators */}
                                        <div className="flex items-center gap-2 mb-8">
                                            {/* Step 1: Approval */}
                                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${currentStep >= 1 && request.status !== 'Rejected' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isApproved ? 'bg-emerald-600' : currentStep === 1 ? 'bg-amber-500' : 'bg-slate-300'}`}>
                                                    {isApproved ? <Check className="h-4 w-4 text-white" /> : <span className="text-white text-xs font-bold">1</span>}
                                                </div>
                                                <span className="text-xs font-bold">Approval</span>
                                            </div>

                                            <ArrowRight className="h-4 w-4 text-slate-300" />

                                            {/* Step 2: Lawyer */}
                                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${currentStep >= 2 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${hasLawyer ? 'bg-blue-600' : currentStep === 2 ? 'bg-amber-500' : 'bg-slate-300'}`}>
                                                    {hasLawyer ? <Check className="h-4 w-4 text-white" /> : currentStep < 2 ? <Lock className="h-3 w-3 text-white" /> : <span className="text-white text-xs font-bold">2</span>}
                                                </div>
                                                <span className="text-xs font-bold">Assign Lawyer</span>
                                            </div>

                                            <ArrowRight className="h-4 w-4 text-slate-300" />

                                            {/* Step 3: Payment */}
                                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${currentStep >= 3 ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-400'}`}>
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep === 3 ? 'bg-purple-600' : 'bg-slate-300'}`}>
                                                    {currentStep < 3 ? <Lock className="h-3 w-3 text-white" /> : <span className="text-white text-xs font-bold">3</span>}
                                                </div>
                                                <span className="text-xs font-bold">Payment</span>
                                            </div>
                                        </div>

                                        {/* Step 1: Approval Section */}
                                        {currentStep === 1 && (
                                            <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-6">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                                                        <span className="text-white text-sm font-bold">1</span>
                                                    </div>
                                                    <h5 className="font-bold text-slate-900">Review & Approve Request</h5>
                                                </div>
                                                <p className="text-sm text-slate-600 mb-4">Review the client's request and decide whether to approve or reject.</p>
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => handleStatusUpdate(request.id, 'Approved')}
                                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                                                    >
                                                        <CheckCircle className="h-5 w-5" />
                                                        Approve Request
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(request.id, 'Rejected')}
                                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all"
                                                    >
                                                        <XCircle className="h-5 w-5" />
                                                        Reject Request
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Step 2: Lawyer Assignment Section */}
                                        {currentStep === 2 && (
                                            <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-6">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                                        <span className="text-white text-sm font-bold">2</span>
                                                    </div>
                                                    <h5 className="font-bold text-slate-900">Assign Legal Counsel</h5>
                                                </div>
                                                <p className="text-sm text-slate-600 mb-6">Select an appropriate lawyer based on the case category and requirements.</p>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    {lawyers.map((lawyer) => {
                                                        const isAssigned = request.lawyerId === lawyer.id;
                                                        return (
                                                            <div
                                                                key={lawyer.id}
                                                                className={`relative p-4 rounded-2xl border transition-all ${isAssigned
                                                                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                                                                    : 'border-slate-200 hover:border-blue-300 bg-white shadow-sm'
                                                                    }`}
                                                            >
                                                                {isAssigned && (
                                                                    <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 shadow-lg">
                                                                        <UserCheck className="h-4 w-4" />
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-3 mb-3">
                                                                    <img
                                                                        src={lawyer.imageUrl}
                                                                        alt={lawyer.name}
                                                                        className="w-12 h-12 rounded-xl object-cover shadow-sm"
                                                                    />
                                                                    <div>
                                                                        <h5 className="font-bold text-slate-900 text-sm leading-tight">{lawyer.name}</h5>
                                                                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{lawyer.specialization}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-between items-center text-xs text-slate-500 mb-4">
                                                                    <span className="font-medium">{lawyer.experience} Exp</span>
                                                                    <div className="flex items-center gap-1 font-bold text-amber-500">
                                                                        <Star className="h-3 w-3 fill-amber-500" />
                                                                        {lawyer.rating}
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleAssignLawyer(request.id, lawyer.id)}
                                                                    disabled={isAssigned}
                                                                    className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isAssigned
                                                                        ? 'bg-blue-200 text-blue-700 cursor-default'
                                                                        : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95'
                                                                        }`}
                                                                >
                                                                    {isAssigned ? '✓ Assigned' : 'Assign'}
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Step 3: Payment Section */}
                                        {currentStep === 3 && (
                                            <div className="bg-purple-50/50 border border-purple-200 rounded-2xl p-6">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                                                        <span className="text-white text-sm font-bold">3</span>
                                                    </div>
                                                    <h5 className="font-bold text-slate-900">Fee Structure & Payment</h5>
                                                </div>
                                                <p className="text-sm text-slate-600 mb-6">Set the consultation and case fees, then proceed to payment processing.</p>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-4">
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-black uppercase text-slate-500 ml-1">Consultation Fee</label>
                                                            <div className="relative">
                                                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                                                <input
                                                                    type="number"
                                                                    value={editingFees[request.id]?.consultation || 0}
                                                                    onChange={(e) => handleFeeChange(request.id, 'consultation', e.target.value)}
                                                                    className="w-full pl-9 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                                                                    placeholder="0.00"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-black uppercase text-slate-500 ml-1">Legal Case Fee</label>
                                                            <div className="relative">
                                                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                                                <input
                                                                    type="number"
                                                                    value={editingFees[request.id]?.case || 0}
                                                                    onChange={(e) => handleFeeChange(request.id, 'case', e.target.value)}
                                                                    className="w-full pl-9 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                                                                    placeholder="0.00"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-center">
                                                        <button
                                                            onClick={() => handleProcessPayment(request.id)}
                                                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:from-purple-700 hover:to-blue-700 transition-all shadow-xl shadow-purple-600/20 group"
                                                        >
                                                            <CreditCard className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                                            Proceed to Payment
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Rejected State */}
                                        {request.status === 'Rejected' && (
                                            <div className="bg-red-50/50 border border-red-200 rounded-2xl p-6 text-center">
                                                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                                                <h5 className="font-bold text-slate-900 mb-2">Request Rejected</h5>
                                                <p className="text-sm text-slate-600">This appointment request has been rejected and no further action is required.</p>
                                            </div>
                                        )}

                                        {/* Completed State */}
                                        {isApproved && hasLawyer && currentStep === 3 && (
                                            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                                <div className="flex items-center gap-2 text-emerald-700">
                                                    <CheckCircle className="h-5 w-5" />
                                                    <p className="text-sm font-bold">Ready for payment processing</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;

