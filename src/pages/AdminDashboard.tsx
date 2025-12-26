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
    Zap,
    IndianRupee,
    UserCheck,
    Star,
    Award
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
    const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
    const [lawyers, setLawyers] = useState<Lawyer[]>([]);
    const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
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

    const filteredData = appointments.filter(app =>
        filter === 'All' ? true : app.status === filter
    );

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
                    filteredData.map((request) => (
                        <div key={request.id} className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-md transition-all">
                            <div className="p-8">
                                <div className="flex flex-col space-y-8">
                                    <div className="flex flex-col xl:flex-row justify-between gap-8">
                                        {/* Client Info */}
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

                                        {/* Payment Section */}
                                        <div className="flex-1 max-w-sm bg-blue-50/30 rounded-3xl p-6 border border-blue-100/50">
                                            <div className="flex items-center gap-2 mb-4 text-blue-700">
                                                <Zap className="h-5 w-5 fill-blue-700" />
                                                <h4 className="font-bold uppercase tracking-wider text-xs">Fee Structuring</h4>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Consultation Fee</label>
                                                    <div className="relative">
                                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                                        <input
                                                            type="number"
                                                            value={editingFees[request.id]?.consultation || 0}
                                                            onChange={(e) => handleFeeChange(request.id, 'consultation', e.target.value)}
                                                            className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Legal Case Fee</label>
                                                    <div className="relative">
                                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                                        <input
                                                            type="number"
                                                            value={editingFees[request.id]?.case || 0}
                                                            onChange={(e) => handleFeeChange(request.id, 'case', e.target.value)}
                                                            className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleProcessPayment(request.id)}
                                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 group"
                                                >
                                                    <CreditCard className="h-4 w-4 group-hover:animate-bounce" />
                                                    Bill & Payment Page
                                                </button>
                                            </div>
                                        </div>

                                        {/* Approve/Reject Actions */}
                                        <div className="w-full xl:w-48 flex xl:flex-col gap-3 justify-center">
                                            {request.status === 'Pending' ? (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusUpdate(request.id, 'Approved')}
                                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(request.id, 'Rejected')}
                                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                        Reject
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-slate-400 font-bold text-sm italic">
                                                    Action complete
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Lawyer Selection Section for Approved Requests */}
                                    {request.status === 'Approved' && (
                                        <div className="pt-6 border-t border-slate-100">
                                            <div className="flex items-center gap-2 mb-6">
                                                <Award className="h-5 w-5 text-amber-500" />
                                                <h4 className="text-lg font-bold text-slate-900">Assign Legal Counsel</h4>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                {lawyers.map((lawyer) => {
                                                    const isAssigned = request.lawyerId === lawyer.id;
                                                    return (
                                                        <div
                                                            key={lawyer.id}
                                                            className={`relative p-4 rounded-3xl border transition-all ${isAssigned
                                                                    ? 'border-blue-500 bg-blue-50/30 ring-1 ring-blue-500'
                                                                    : 'border-slate-100 hover:border-slate-200 bg-white shadow-sm'
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
                                                                    className="w-12 h-12 rounded-2xl object-cover shadow-sm"
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
                                                                className={`w-full py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isAssigned
                                                                        ? 'bg-blue-200 text-blue-700 cursor-default'
                                                                        : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95'
                                                                    }`}
                                                            >
                                                                {isAssigned ? 'Assigned' : 'Assign Contact'}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
