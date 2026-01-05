import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getAppointments,
    updateAppointmentStatus,
    getLawyers,
    assignLawyer,
    updateCaseId,
    updateAppointmentFees,
    updateCaseStage,
    type AppointmentRecord,
    type Lawyer
} from '../utils/storage';
import { sendApprovalEmail } from '../utils/emailService';
import {
    LogOut,
    Mail,
    Phone,
    Calendar,
    Clock,
    Search,
    ArrowRight,
    XCircle,
    ListTodo,
    Bell,
    UserCheck,
    IndianRupee
} from 'lucide-react';
import LegalLogo from '../components/LegalLogo';

const AdminDashboard: React.FC = () => {
    const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedCase, setSelectedCase] = useState<AppointmentRecord | null>(null);
    const [lawyers, setLawyers] = useState<Lawyer[]>([]);
    const [selectedLawyerId, setSelectedLawyerId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchDate, setSearchDate] = useState('');
    const [appliedDate, setAppliedDate] = useState('');
    const [activeStage, setActiveStage] = useState<'Inquiry' | 'Verified' | 'Payment' | 'Litigation' | 'Disposed'>('Inquiry');
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [consultationFee, setConsultationFee] = useState<string>('');
    const [caseFee, setCaseFee] = useState<string>('');
    const [paymentMode, setPaymentMode] = useState<string>('Cash');

    useEffect(() => {
        if (selectedCase) {
            setConsultationFee(selectedCase.consultationFee?.toString() || '');
            setCaseFee(selectedCase.caseFee?.toString() || '');
        } else {
            setConsultationFee('');
            setCaseFee('');
        }
    }, [selectedCase]);

    useEffect(() => {
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
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, status: 'Approved' | 'Rejected') => {
        if (!selectedCase) return;

        if (status === 'Approved' && !selectedLawyerId) {
            alert('Please select a lawyer before approving.');
            return;
        }

        setIsProcessing(true);
        try {
            if (status === 'Approved') {
                const lawyer = lawyers.find(l => l.id === selectedLawyerId);

                // Department-based Sequential Case ID Generation
                const category = selectedCase.caseCategory;
                const prefixMap: Record<string, string> = {
                    'Civil': 'CIV',
                    'Criminal': 'CRI',
                    'Family': 'FAM',
                    'Property': 'PRO'
                };
                const prefix = prefixMap[category] || 'OTH';

                const existingCategoryIds = appointments
                    .filter(a => a.caseId && a.caseId.startsWith(prefix))
                    .map(a => {
                        const parts = a.caseId!.split('-');
                        return parts.length > 1 ? parseInt(parts[1]) : 0;
                    });

                const nextNum = existingCategoryIds.length > 0 ? Math.max(...existingCategoryIds) + 1 : 1;
                const uniqueCaseId = `${prefix}-${String(nextNum).padStart(3, '0')}`;

                await assignLawyer(id, selectedLawyerId);
                await updateCaseId(id, uniqueCaseId);
                await updateAppointmentStatus(id, status);

                await sendApprovalEmail({
                    toEmail: selectedCase.emailId,
                    fullName: selectedCase.fullName,
                    appointmentDate: selectedCase.appointmentDate,
                    timeSlot: selectedCase.timeSlot,
                    consultationType: selectedCase.consultationType,
                    lawyerName: lawyer?.name,
                    caseId: uniqueCaseId
                });
            } else {
                await updateAppointmentStatus(id, status);
            }

            await loadData();
            setSelectedCase(null);
            setSelectedLawyerId('');
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Operation failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdateFees = async () => {
        if (!selectedCase) return;

        setIsProcessing(true);
        try {
            const cFee = parseFloat(consultationFee) || 0;
            const csFee = parseFloat(caseFee) || 0;

            await updateAppointmentFees(selectedCase.id, cFee, csFee);
            await loadData();

            setSelectedCase(prev => prev ? { ...prev, consultationFee: cFee, caseFee: csFee } : null);
            alert('Fees updated successfully!');
        } catch (error) {
            console.error('Failed to update fees:', error);
            alert('Operation failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdateStage = async (newStage: string) => {
        if (!selectedCase) return;
        setIsProcessing(true);
        try {
            await updateCaseStage(selectedCase.id, newStage);
            await loadData();
            setSelectedCase(prev => prev ? { ...prev, caseStage: newStage } : null);
        } catch (error) {
            console.error('Failed to update stage:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
    };

    const filteredData = appointments.filter(app => {
        const matchesSearch =
            app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (app.caseId && app.caseId.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesDate = appliedDate ? app.appointmentDate === appliedDate : true;
        return matchesSearch && matchesDate;
    });

    const handleSearchReset = () => setSearchQuery('');
    const handleDateReset = () => {
        setSearchDate('');
        setAppliedDate('');
    };

    const columns = {
        pending: filteredData.filter(a => a.status === 'Pending'),
        verified: filteredData.filter(a => a.status === 'Approved'),
        payment: filteredData.filter(a => a.status === 'Approved' && a.consultationFee === 0 && a.caseFee === 0),
        litigation: filteredData.filter(a => a.status === 'Approved' && (a.consultationFee > 0 || a.caseFee > 0)),
        rejected: filteredData.filter(a => a.status === 'Rejected')
    };

    const renderCard = (request: AppointmentRecord) => (
        <div
            key={request.id}
            onClick={() => setSelectedCase(request)}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
        >
            <div className="flex justify-between items-start mb-3">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${request.caseId
                    ? 'bg-blue-100 text-blue-600'
                    : (request.status === 'Pending' ? 'bg-amber-100 text-amber-600' :
                        request.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                            'bg-red-100 text-red-600')
                    }`}>
                    {request.caseId ? `ID: ${request.caseId}` : `ID #${request.id.slice(-6).toUpperCase()}`}
                </span>
                <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-white font-bold ring-2 ring-white">
                        {request.fullName.charAt(0)}
                    </div>
                </div>
            </div>
            <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-1 truncate">{request.fullName}</h4>
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                <span className="truncate">{request.caseCategory}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="h-3 w-3" />
                    <span className="text-[10px] font-medium">{request.appointmentDate}</span>
                </div>
                <ArrowRight className="h-3 w-3 text-slate-300 group-hover:text-blue-500 transition-colors" />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-x-hidden">
            {/* Top Navigation */}
            <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-900 p-2 rounded-xl shadow-lg shadow-slate-900/20">
                            <LegalLogo className="h-6 w-6 text-white" />
                        </div>
                        <div className="">
                            <h1 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Admin Dashboard</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage Appointments</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 transition-all relative">
                            <Bell className="h-4.5 w-4.5" />
                            <div className="absolute top-2.5 right-2.5 w-1 h-1 bg-red-500 rounded-full" />
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div className="space-y-1">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Appointments</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Managing {appointments.length} records</p>
                    </div>

                    <div className="relative group w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search name or ID..."
                            className="w-full pl-11 pr-11 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                        />
                        {searchQuery && (
                            <button onClick={handleSearchReset} className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                                <XCircle className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 p-2 bg-slate-200/50 rounded-3xl w-full sm:w-fit mb-10 overflow-x-auto hide-scrollbar">
                    {[
                        { id: 'Inquiry', label: 'Inquiry', icon: ListTodo, bg: 'bg-slate-800' },
                        { id: 'Verified', label: 'Approved', icon: UserCheck, bg: 'bg-emerald-500' },
                        { id: 'Payment', label: 'Payment', icon: IndianRupee, bg: 'bg-amber-500' },
                        { id: 'Litigation', label: 'Ongoing', icon: ArrowRight, bg: 'bg-blue-500' },
                        { id: 'Disposed', label: 'Closed', icon: XCircle, bg: 'bg-red-500' }
                    ].map((stage) => (
                        <button
                            key={stage.id}
                            onClick={() => setActiveStage(stage.id as any)}
                            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl transition-all duration-300 ${activeStage === stage.id
                                ? `${stage.bg} text-white shadow-lg`
                                : 'bg-white/50 text-slate-500 hover:bg-white'
                                }`}
                        >
                            <stage.icon className="h-4 w-4" />
                            <span className="text-xs font-black uppercase tracking-wider whitespace-nowrap">{stage.label}</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${activeStage === stage.id ? 'bg-white/20' : 'bg-slate-100'}`}>
                                {stage.id === 'Inquiry' ? columns.pending.length :
                                    stage.id === 'Verified' ? columns.verified.length :
                                        stage.id === 'Payment' ? columns.payment.length :
                                            stage.id === 'Litigation' ? columns.litigation.length :
                                                columns.rejected.length}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeStage === 'Inquiry' && columns.pending.map(renderCard)}
                    {activeStage === 'Verified' && columns.verified.map(renderCard)}
                    {activeStage === 'Payment' && columns.payment.map(renderCard)}
                    {activeStage === 'Litigation' && (
                        <div className="col-span-full space-y-6">
                            <div className="flex items-center gap-2 overflow-x-auto pb-4 hide-scrollbar">
                                {['All', 'Civil', 'Criminal', 'Family', 'Property', 'Others'].map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeCategory === cat
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                            : 'bg-white text-slate-500 border border-slate-200 hover:border-blue-200'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {columns.litigation.filter(a => activeCategory === 'All' ? true : (activeCategory === 'Others' ? !['Civil', 'Criminal', 'Family', 'Property'].includes(a.caseCategory) : a.caseCategory === activeCategory)).map(renderCard)}
                                {columns.litigation.filter(a => activeCategory === 'All' ? true : (activeCategory === 'Others' ? !['Civil', 'Criminal', 'Family', 'Property'].includes(a.caseCategory) : a.caseCategory === activeCategory)).length === 0 && (
                                    <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center">No {activeCategory} cases found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {activeStage === 'Disposed' && columns.rejected.map(renderCard)}

                    {((activeStage === 'Inquiry' && columns.pending.length === 0) ||
                        (activeStage === 'Verified' && columns.verified.length === 0) ||
                        (activeStage === 'Payment' && columns.payment.length === 0) ||
                        (activeStage === 'Disposed' && columns.rejected.length === 0)) && (
                            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center">No records found</p>
                            </div>
                        )}
                </div>
            </main>

            {selectedCase && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedCase(null)} />
                    <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center text-lg font-black">
                                    {selectedCase.fullName.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 leading-tight">{selectedCase.fullName}</h3>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                        {selectedCase.caseId ? `Case ID: ${selectedCase.caseId}` : `Booking ID: #${selectedCase.id.slice(-8).toUpperCase()}`}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedCase(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <XCircle className="h-6 w-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-10">
                            {activeStage === 'Payment' ? (
                                <div className="space-y-6">
                                    <div className="bg-blue-50/50 p-8 rounded-[2rem] border-2 border-blue-50/50 space-y-8">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-5 bg-white rounded-2xl border border-blue-100 shadow-sm">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Consultation</p>
                                                <div className="relative mt-1">
                                                    <IndianRupee className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                                                    <input
                                                        type="number"
                                                        value={consultationFee}
                                                        onChange={(e) => setConsultationFee(e.target.value)}
                                                        className="w-full pl-6 bg-transparent border-none text-xl font-black text-slate-900 outline-none p-0"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>
                                            <div className="p-5 bg-white rounded-2xl border border-blue-100 shadow-sm">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Due Fee</p>
                                                <div className="relative mt-1">
                                                    <IndianRupee className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                                                    <input
                                                        type="number"
                                                        value={caseFee}
                                                        onChange={(e) => setCaseFee(e.target.value)}
                                                        className="w-full pl-6 bg-transparent border-none text-xl font-black text-slate-900 outline-none p-0"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Payment Mode</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {['Cash', 'Online', 'Cheque'].map((mode) => (
                                                    <button
                                                        key={mode}
                                                        onClick={() => setPaymentMode(mode)}
                                                        className={`py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentMode === mode ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white text-slate-500 border border-slate-100'}`}
                                                    >
                                                        {mode}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleUpdateFees}
                                            disabled={isProcessing}
                                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl disabled:opacity-50"
                                        >
                                            {isProcessing ? 'Processing...' : `Mark as Paid (${paymentMode})`}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</p>
                                            <p className="font-bold text-slate-800 text-sm flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-blue-500" /> {selectedCase.phoneNumber}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                                            <p className="font-bold text-slate-800 text-sm flex items-center gap-2 truncate"><Mail className="h-3.5 w-3.5 text-blue-500" /> {selectedCase.emailId}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</p>
                                            <p className="font-bold text-slate-800 text-sm flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-blue-500" /> {selectedCase.appointmentDate}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</p>
                                            <p className="font-bold text-slate-800 text-sm flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-blue-500" /> {selectedCase.timeSlot}</p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                                        <div className="flex gap-2">
                                            <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-600 uppercase tracking-wider">{selectedCase.caseCategory}</span>
                                            <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[9px] font-black uppercase tracking-wider">{selectedCase.consultationType}</span>
                                        </div>
                                        <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap italic">"{selectedCase.description}"</p>
                                    </div>

                                    {selectedCase.status === 'Pending' && (
                                        <div className="space-y-6">
                                            <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest text-center border-b border-slate-100 pb-4">Assign Professional</p>
                                            <div className="grid grid-cols-1 gap-3">
                                                {lawyers.map((lawyer) => (
                                                    <button
                                                        key={lawyer.id}
                                                        onClick={() => setSelectedLawyerId(lawyer.id)}
                                                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${selectedLawyerId === lawyer.id ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 hover:bg-slate-50'}`}
                                                    >
                                                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200"><img src={lawyer.imageUrl} className="w-full h-full object-cover" /></div>
                                                        <div className="flex-1">
                                                            <h5 className="text-sm font-black text-slate-900 truncate">{lawyer.name}</h5>
                                                            <p className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">{lawyer.specialization}</p>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedLawyerId === lawyer.id ? 'border-blue-600 bg-blue-600' : 'border-slate-200'}`}>
                                                            {selectedLawyerId === lawyer.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {selectedCase.status === 'Approved' && activeStage !== 'Litigation' && (
                                        <div className="space-y-6">
                                            <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest text-center border-b border-slate-100 pb-4">Financial Setup</p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Consultation</label>
                                                    <div className="relative">
                                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                                        <input type="number" value={consultationFee} onChange={(e) => setConsultationFee(e.target.value)} placeholder="0" className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/10" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Case Fee</label>
                                                    <div className="relative">
                                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                                        <input type="number" value={caseFee} onChange={(e) => setCaseFee(e.target.value)} placeholder="0" className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/10" />
                                                    </div>
                                                </div>
                                            </div>
                                            <button onClick={handleUpdateFees} disabled={isProcessing} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-slate-900/10 disabled:opacity-50">
                                                Update Financials
                                            </button>
                                        </div>
                                    )}

                                    {activeStage === 'Litigation' && (
                                        <div className="space-y-8">
                                            <div className="flex items-center gap-3">
                                                <div className="h-px bg-blue-100 flex-1" />
                                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest text-center">Litigation Tracking</span>
                                                <div className="h-px bg-blue-100 flex-1" />
                                            </div>

                                            <div className="bg-slate-900 rounded-[2rem] p-8 text-white space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Progress</p>
                                                        <h4 className="text-2xl font-black text-blue-400">{selectedCase.caseStage || 'Stage 1'}</h4>
                                                    </div>
                                                    <div className="bg-blue-500/20 p-3 rounded-2xl">
                                                        <ArrowRight className="h-6 w-6 text-blue-400" />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    {['Stage 1', 'Stage 2', 'Stage 3', 'Final Verdict'].map((stg) => (
                                                        <button
                                                            key={stg}
                                                            onClick={() => handleUpdateStage(stg)}
                                                            className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${selectedCase.caseStage === stg
                                                                    ? 'bg-blue-600 border-none'
                                                                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                                                }`}
                                                        >
                                                            {stg}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Summary</p>
                                                    <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">Verified Paid</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-white p-4 rounded-2xl border border-blue-50">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Consultation</p>
                                                        <div className="flex items-center gap-2 text-lg font-black text-slate-900">
                                                            <IndianRupee className="h-3.5 w-3.5 text-blue-500" />
                                                            {selectedCase.consultationFee}
                                                        </div>
                                                    </div>
                                                    <div className="bg-white p-4 rounded-2xl border border-blue-50">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Litigation Fee</p>
                                                        <div className="flex items-center gap-2 text-lg font-black text-slate-900">
                                                            <IndianRupee className="h-3.5 w-3.5 text-blue-500" />
                                                            {selectedCase.caseFee}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="p-8 border-t border-slate-100">
                            {selectedCase.status === 'Pending' ? (
                                <div className="flex gap-4">
                                    <button onClick={() => handleStatusUpdate(selectedCase.id, 'Rejected')} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all">Reject</button>
                                    <button onClick={() => handleStatusUpdate(selectedCase.id, 'Approved')} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all">Approve Case</button>
                                </div>
                            ) : (
                                <button onClick={() => setSelectedCase(null)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Close Viewer</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
