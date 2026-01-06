import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getAppointments,
    updateAppointmentStatus,
    getLawyers,
    assignLawyer,
    updateCaseId,
    updateAppointmentPayment,
    updateCaseStage,
    getPaymentHistory,
    type AppointmentRecord,
    type Lawyer,
    type PaymentRecord
} from '../utils/storage';
import { sendApprovalEmail } from '../utils/emailService';
import {
    LogOut,
    Calendar,
    Clock,
    Search,
    ArrowRight,
    XCircle,
    ListTodo,
    Bell,
    UserCheck,
    IndianRupee,
    Download,
    BarChart3,
    Banknote,
    Smartphone,
    Wallet,
    Menu,
    ChevronRight,
    LayoutDashboard,
    CheckCircle2
} from 'lucide-react';
import LegalLogo from '../components/LegalLogo';

const AdminDashboard: React.FC = () => {
    const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
    const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedCase, setSelectedCase] = useState<AppointmentRecord | null>(null);
    const [lawyers, setLawyers] = useState<Lawyer[]>([]);
    const [selectedLawyerId, setSelectedLawyerId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [appliedDate] = useState('');
    const [activeStage, setActiveStage] = useState<'Inquiry' | 'Verified' | 'Payment' | 'Litigation' | 'History' | 'Disposed'>('Inquiry');
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [consultationFee, setConsultationFee] = useState<string>('');
    const [caseFee, setCaseFee] = useState<string>('');
    const [paymentMode, setPaymentMode] = useState<string>('Cash');
    const [transactionId, setTransactionId] = useState('');
    const [chequeNumber, setChequeNumber] = useState('');
    const [bankName, setBankName] = useState('');
    const [incomeDate, setIncomeDate] = useState('');
    const [incomeFilterMode, setIncomeFilterMode] = useState<'All' | 'Today' | 'Weekly' | 'Monthly' | 'Custom'>('All');

    useEffect(() => {
        if (selectedCase) {
            // If fee is 0, set to empty string so placeholder '0' shows
            const cFee = selectedCase.consultationFee || 0;
            const csFee = selectedCase.caseFee || 0;
            setConsultationFee(cFee === 0 ? '' : cFee.toString());
            setCaseFee(csFee === 0 ? '' : csFee.toString());
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
            const [appData, lawyerData, payData] = await Promise.all([
                getAppointments(),
                getLawyers(),
                getPaymentHistory()
            ]);
            setAppointments(appData);
            setLawyers(lawyerData);
            setPaymentHistory(payData);
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

    const handlePaymentUpdate = async () => {
        if (!selectedCase) return;

        setIsProcessing(true);
        try {
            const cFee = parseFloat(consultationFee) || 0;
            const csFee = parseFloat(caseFee) || 0;

            const txnInfo = paymentMode === 'Online' ? transactionId :
                paymentMode === 'Cheque' ? `${bankName} - ${chequeNumber}` : '';

            await updateAppointmentPayment(
                selectedCase.id,
                cFee,
                csFee,
                paymentMode,
                txnInfo,
                selectedCase.fullName,
                selectedCase.caseId || `BK-${selectedCase.id.slice(-6).toUpperCase()}`
            );
            await loadData();

            setSelectedCase(prev => prev ? {
                ...prev,
                consultationFee: cFee,
                caseFee: csFee
            } : null);

            setShowSuccessModal(true);
        } catch (error: any) {
            console.error('Full Payment Error:', error);
            const errorMsg = error.message || error.details || 'Unknown Error';
            alert(`Database Error: ${errorMsg}\n\nPlease ensure you have run the latest SQL in Supabase.`);
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadCSV = (type: 'Today' | 'Weekly' | 'Monthly' | 'Custom') => {
        const now = new Date();
        let filtered = [...paymentHistory];

        if (type === 'Today') {
            const todayStr = now.toISOString().split('T')[0];
            filtered = filtered.filter(p => p.paymentDate?.startsWith(todayStr));
        } else if (type === 'Weekly') {
            const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(p => new Date(p.paymentDate) >= lastWeek);
        } else if (type === 'Monthly') {
            const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(p => new Date(p.paymentDate) >= lastMonth);
        } else if (type === 'Custom' && incomeDate) {
            filtered = filtered.filter(p => p.paymentDate?.startsWith(incomeDate));
        }

        if (filtered.length === 0) {
            alert(`No payment records found for ${type}`);
            return;
        }

        const headers = ['Case ID', 'Client Name', 'Consultation Fee', 'Due Fee', 'Total Amount', 'Payment Mode', 'Payment Date', 'Transaction Details'];
        const rows = filtered.map(p => [
            p.caseId,
            p.clientName,
            p.consultationFee,
            p.dueFee,
            p.amount,
            p.paymentMode,
            new Date(p.paymentDate).toLocaleDateString(),
            p.transactionId || 'N/A'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        const fileName = type === 'Custom' ? `Payment_Report_${incomeDate}.csv` : `Payment_Report_${type}_${now.toISOString().split('T')[0]}.csv`;
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

    const columns = {
        pending: filteredData.filter(a => a.status === 'Pending'),
        verified: filteredData.filter(a => a.status === 'Approved' && (!a.consultationFee || a.consultationFee === 0)),
        litigation: filteredData.filter(a => a.status === 'Approved' && a.consultationFee > 0),
        history: filteredData.filter(a => a.paymentDate),
        rejected: filteredData.filter(a => a.status === 'Rejected')
    };

    const renderCard = (request: AppointmentRecord) => (
        <div
            key={request.id}
            onClick={() => setSelectedCase(request)}
            className="group bg-white p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 hover:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 cursor-pointer relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-500" />

            <div className="flex items-start justify-between mb-4 relative z-10">
                <span className={`text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${request.caseId
                    ? 'bg-blue-100 text-blue-600'
                    : (request.status === 'Pending' ? 'bg-amber-100 text-amber-600' :
                        request.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                            'bg-red-100 text-red-600')
                    }`}>
                    {request.caseId ? `ID: ${request.caseId}` : `NEW #${request.id.slice(-6).toUpperCase()}`}
                </span>
                <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 border border-white flex items-center justify-center text-[10px] text-slate-500 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                        {request.fullName.charAt(0)}
                    </div>
                </div>
            </div>

            <div className="relative z-10">
                <h4 className="font-black text-slate-800 text-sm sm:text-base mb-1 line-clamp-1 truncate uppercase tracking-tight">{request.fullName}</h4>
                <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    <span className="truncate">{request.caseCategory}</span>
                </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-50 relative z-10">
                <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold tracking-tight">{request.appointmentDate}</span>
                </div>
                <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-600 transition-all group-hover:translate-x-0.5" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-x-hidden">
            <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 sm:hidden hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <Menu className="h-6 w-6 text-slate-600" />
                        </button>
                        <div className="bg-slate-900 p-2 sm:p-2.5 rounded-xl shadow-lg shadow-slate-900/20">
                            <LegalLogo className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tighter">Admin Dashboard</h1>
                            <p className="hidden xs:block text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 sm:mt-1">Law Firm Management</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <button className="hidden sm:flex p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 transition-all relative">
                            <Bell className="h-4.5 w-4.5" />
                            <div className="absolute top-2.5 right-2.5 w-1 h-1 bg-red-500 rounded-full" />
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 bg-red-50 text-red-600 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100"
                        >
                            <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Sign Out</span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-[60] sm:hidden">
                    <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] animate-in fade-in duration-300" onClick={() => setIsSidebarOpen(false)} />
                    <div className="absolute top-[66px] left-[14px] w-64 bg-white shadow-2xl flex flex-col animate-in zoom-in-95 slide-in-from-top-1 duration-300 border border-slate-200 rounded-[1.5rem] overflow-hidden origin-top-left">
                        <div className="p-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-slate-900 p-2 rounded-xl shadow-lg">
                                    <LegalLogo className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <span className="block font-black text-slate-900 text-[10px] uppercase tracking-[0.2em] leading-none">Navigation</span>
                                    <span className="block font-bold text-slate-400 text-[8px] uppercase tracking-widest mt-1">Admin Menu</span>
                                </div>
                            </div>
                            <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400">
                                <XCircle className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-2.5 space-y-1.5 scrollbar-hide max-h-[60vh]">
                            {[
                                { id: 'Inquiry', label: 'Inquiry', icon: ListTodo, color: 'text-slate-600', activeBg: 'bg-slate-900', shadow: 'shadow-slate-900/20', count: columns.pending.length },
                                { id: 'Verified', label: 'Approved', icon: UserCheck, color: 'text-emerald-600', activeBg: 'bg-emerald-600', shadow: 'shadow-emerald-600/20', count: columns.verified.length },
                                { id: 'History', label: 'Payment Details', icon: BarChart3, color: 'text-indigo-600', activeBg: 'bg-indigo-600', shadow: 'shadow-indigo-600/20', count: paymentHistory.length },
                                { id: 'Litigation', label: 'Ongoing Cases', icon: ArrowRight, color: 'text-blue-600', activeBg: 'bg-blue-600', shadow: 'shadow-blue-600/20', count: columns.litigation.length },
                                { id: 'Disposed', label: 'Closed/Disposed', icon: XCircle, color: 'text-red-600', activeBg: 'bg-red-600', shadow: 'shadow-red-600/20', count: columns.rejected.length }
                            ].map((stage) => (
                                <button
                                    key={stage.id}
                                    onClick={() => {
                                        setActiveStage(stage.id as any);
                                        setIsSidebarOpen(false);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className={`w-full flex items-center justify-between p-3 rounded-[1.25rem] transition-all duration-300 ${activeStage === stage.id
                                        ? `${stage.activeBg} text-white shadow-lg ${stage.shadow}`
                                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${activeStage === stage.id ? 'bg-white/20' : 'bg-slate-100'}`}>
                                            <stage.icon className={`h-4 w-4 ${activeStage === stage.id ? 'text-white' : stage.color}`} />
                                        </div>
                                        <span className="font-bold text-[11px] uppercase tracking-wider">{stage.label}</span>
                                    </div>
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${activeStage === stage.id ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                                        {stage.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            >
                                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                                    <LogOut className="h-4 w-4" />
                                </div>
                                <span className="font-bold text-[11px] uppercase tracking-wider">Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-10">
                    <div className="space-y-1">
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">Appointments</h2>
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
                            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                                <XCircle className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                </div>

                <div className="hidden sm:flex items-center gap-3 p-2 bg-slate-200/50 rounded-3xl w-fit mb-10 overflow-x-auto hide-scrollbar">
                    {[
                        { id: 'Inquiry', label: 'Inquiry', icon: ListTodo, bg: 'bg-slate-800' },
                        { id: 'Verified', label: 'Approved', icon: UserCheck, bg: 'bg-emerald-500' },
                        { id: 'History', label: 'Payment Details', icon: BarChart3, bg: 'bg-indigo-600' },
                        { id: 'Litigation', label: 'Ongoing', icon: ArrowRight, bg: 'bg-blue-500' },
                        { id: 'Disposed', label: 'Closed', icon: XCircle, bg: 'bg-red-500' }
                    ].map((stage) => (
                        <button
                            key={stage.id}
                            onClick={() => {
                                setActiveStage(stage.id as any);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl transition-all duration-300 ${activeStage === stage.id
                                ? `${stage.bg} text-white shadow-lg`
                                : 'bg-white/50 text-slate-500 hover:bg-white'
                                }`}
                        >
                            <stage.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider whitespace-nowrap">{stage.label}</span>
                            <span className={`text-[8px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-lg ${activeStage === stage.id ? 'bg-white/20' : 'bg-slate-100'}`}>
                                {stage.id === 'Inquiry' ? columns.pending.length :
                                    stage.id === 'Verified' ? columns.verified.length :
                                        stage.id === 'History' ? paymentHistory.length :
                                            stage.id === 'Litigation' ? columns.litigation.length :
                                                columns.rejected.length}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="sm:hidden mb-10">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="w-full bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm border border-slate-200 group active:scale-[0.98] transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/10">
                                <LayoutDashboard className="h-6 w-6 text-white" />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-0.5">Active View</p>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{activeStage === 'History' ? 'Payment Details' : activeStage} Mode</h3>
                            </div>
                        </div>
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-slate-100 transition-colors">
                            <ChevronRight className="h-5 w-5" />
                        </div>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeStage === 'Inquiry' && columns.pending.map(renderCard)}
                    {activeStage === 'Verified' && columns.verified.map(renderCard)}
                    {activeStage === 'History' && (
                        <div className="col-span-full space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm gap-6">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">Payment Details Overview</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Detailed history of all manual payments received</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => { setIncomeFilterMode('Today'); setIncomeDate(''); }}
                                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${incomeFilterMode === 'Today' ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'}`}
                                    >
                                        Today
                                    </button>
                                    <button
                                        onClick={() => { setIncomeFilterMode('Weekly'); setIncomeDate(''); }}
                                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${incomeFilterMode === 'Weekly' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100'}`}
                                    >
                                        Weekly
                                    </button>
                                    <button
                                        onClick={() => { setIncomeFilterMode('Monthly'); setIncomeDate(''); }}
                                        className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${incomeFilterMode === 'Monthly' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'}`}
                                    >
                                        Full Report
                                    </button>
                                    {incomeFilterMode !== 'All' && (
                                        <button
                                            onClick={() => { setIncomeFilterMode('All'); setIncomeDate(''); }}
                                            className="w-full sm:w-auto px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100"
                                        >
                                            Reset
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-blue-600" />
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Search by Date:</span>
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="date"
                                            value={incomeDate}
                                            onChange={(e) => { setIncomeDate(e.target.value); setIncomeFilterMode('Custom'); }}
                                            className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                </div>

                                {incomeFilterMode !== 'All' && (
                                    <div className="flex items-center justify-between sm:justify-end gap-3 animate-in fade-in slide-in-from-right-2 duration-300 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
                                        <div className="text-left sm:text-right mr-2">
                                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Viewing Preview</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Review before download</p>
                                        </div>
                                        <button
                                            onClick={() => downloadCSV(incomeFilterMode)}
                                            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                                        >
                                            <Download className="h-4 w-4" />
                                            Download
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-3 sm:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Case ID</th>
                                                <th className="px-3 sm:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Client</th>
                                                <th className="hidden sm:table-cell px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Consultation</th>
                                                <th className="hidden sm:table-cell px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Due Fee</th>
                                                <th className="px-3 sm:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 font-bold">Total</th>
                                                <th className="px-3 sm:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Mode</th>
                                                <th className="px-3 sm:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Date</th>
                                                <th className="hidden md:table-cell px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Details</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {paymentHistory
                                                .filter(pay => {
                                                    const now = new Date();
                                                    if (incomeFilterMode === 'Today') {
                                                        const todayStr = now.toISOString().split('T')[0];
                                                        return pay.paymentDate?.startsWith(todayStr);
                                                    }
                                                    if (incomeFilterMode === 'Weekly') {
                                                        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                                                        return new Date(pay.paymentDate) >= lastWeek;
                                                    }
                                                    if (incomeFilterMode === 'Monthly') {
                                                        const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                                                        return new Date(pay.paymentDate) >= lastMonth;
                                                    }
                                                    if (incomeFilterMode === 'Custom' && incomeDate) {
                                                        return pay.paymentDate?.startsWith(incomeDate);
                                                    }
                                                    return true; // All mode
                                                })
                                                .map((pay) => (
                                                    <tr key={pay.id} className="hover:bg-blue-50/30 transition-colors group">
                                                        <td className="px-3 sm:px-6 py-4">
                                                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{pay.caseId}</span>
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-4">
                                                            <p className="text-[11px] sm:text-xs font-bold text-slate-800 line-clamp-1 truncate max-w-[80px] sm:max-w-none">{pay.clientName}</p>
                                                        </td>
                                                        <td className="hidden sm:table-cell px-6 py-4">
                                                            <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                                                                <IndianRupee className="h-3 w-3 text-blue-500" />
                                                                {pay.consultationFee}
                                                            </span>
                                                        </td>
                                                        <td className="hidden sm:table-cell px-6 py-4">
                                                            <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                                                                <IndianRupee className="h-3 w-3 text-blue-500" />
                                                                {pay.dueFee}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-4">
                                                            <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                                                                <IndianRupee className="h-3 w-3" />
                                                                {pay.amount}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-4">
                                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${pay.paymentMode === 'Cash' ? 'bg-emerald-100 text-emerald-600' :
                                                                pay.paymentMode === 'Online' ? 'bg-blue-100 text-blue-600' :
                                                                    'bg-amber-100 text-amber-600'
                                                                }`}>
                                                                {pay.paymentMode}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-4">
                                                            <span className="text-[10px] sm:text-xs font-bold text-slate-600">
                                                                {new Date(pay.paymentDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                                                            </span>
                                                        </td>
                                                        <td className="hidden md:table-cell px-6 py-4">
                                                            <p className="text-[10px] text-slate-500 font-medium line-clamp-1 truncate w-32">{pay.transactionId || 'No extra info'}</p>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                                {paymentHistory.length === 0 && (
                                    <div className="py-20 text-center border-t border-slate-50 bg-slate-50/30">
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No transaction history found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
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
                        (activeStage === 'History' && paymentHistory.length === 0) ||
                        (activeStage === 'Disposed' && columns.rejected.length === 0)) && (
                            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center">No records found</p>
                            </div>
                        )}
                </div>
            </main>

            {
                selectedCase && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedCase(null)} />
                        <div className="relative w-full sm:max-w-xl md:max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
                            <div className="p-4 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center text-sm sm:text-lg font-black shadow-lg shadow-slate-900/20">
                                        {selectedCase.fullName.charAt(0)}
                                    </div>
                                    <div className="max-w-[180px] xs:max-w-[250px] sm:max-w-md">
                                        <h3 className="text-sm sm:text-xl font-black text-slate-900 leading-tight truncate">{selectedCase.fullName}</h3>
                                        <p className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                                            {selectedCase.caseId ? `ID: ${selectedCase.caseId}` : `Booking: #${selectedCase.id.slice(-6).toUpperCase()}`}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedCase(null)} className="p-2 sm:p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-colors shadow-sm">
                                    <XCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 sm:space-y-10 scrollbar-hide">
                                {(activeStage === 'Verified' || activeStage === 'Payment') ? (
                                    <div className="space-y-6">
                                        <div className="bg-slate-50/50 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 border-slate-100 space-y-8 sm:space-y-10">
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                                                        <Clock className="h-4 w-4 text-amber-600" />
                                                    </div>
                                                    <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">1. Fee Allocation</h4>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                                    <div className="p-4 sm:p-5 bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Consultation Fee</p>
                                                        <div className="relative mt-1">
                                                            <IndianRupee className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                                                            <input
                                                                type="number"
                                                                value={consultationFee}
                                                                onChange={(e) => setConsultationFee(e.target.value)}
                                                                className="w-full pl-6 bg-transparent border-none text-xl font-black text-slate-900 outline-none p-0 placeholder:text-slate-300 pointer-events-auto"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="p-4 sm:p-5 bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Due Fee</p>
                                                        <div className="relative mt-1">
                                                            <IndianRupee className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                                                            <input
                                                                type="number"
                                                                value={caseFee}
                                                                onChange={(e) => setCaseFee(e.target.value)}
                                                                className="w-full pl-6 bg-transparent border-none text-xl font-black text-slate-900 outline-none p-0 placeholder:text-slate-300 pointer-events-auto"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                                                        <IndianRupee className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">2. Transaction Information</h4>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between px-1">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Mode</p>
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wide transition-all ${paymentMode === 'Cash' ? 'bg-emerald-100 text-emerald-600' :
                                                            paymentMode === 'Online' ? 'bg-blue-100 text-blue-600' :
                                                                'bg-amber-100 text-amber-600'
                                                            }`}>
                                                            {paymentMode} Selected
                                                        </span>
                                                    </div>

                                                    <div className="bg-white p-1.5 rounded-[2rem] border-2 border-slate-100 flex gap-1 shadow-inner relative overflow-hidden">
                                                        {[
                                                            { id: 'Cash', icon: Banknote, activeClass: 'bg-emerald-600 text-white shadow-emerald-200' },
                                                            { id: 'Online', icon: Smartphone, activeClass: 'bg-blue-600 text-white shadow-blue-200' },
                                                            { id: 'Cheque', icon: Wallet, activeClass: 'bg-amber-600 text-white shadow-amber-200' }
                                                        ].map((mode) => (
                                                            <button
                                                                key={mode.id}
                                                                onClick={() => setPaymentMode(mode.id)}
                                                                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.5rem] transition-all duration-500 relative z-10 ${paymentMode === mode.id
                                                                    ? `${mode.activeClass} shadow-lg scale-[1.02]`
                                                                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                                                    }`}
                                                            >
                                                                <mode.icon className={`h-4 w-4 transition-transform duration-500 ${paymentMode === mode.id ? 'scale-110' : ''}`} />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">{mode.id}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="bg-white p-6 rounded-2xl border border-blue-100 space-y-5">
                                                    {paymentMode === 'Cash' && (
                                                        <div className="space-y-1.5">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Receipt Number (Optional)</label>
                                                            <input type="text" placeholder="e.g. REC-12345" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" />
                                                        </div>
                                                    )}
                                                    {paymentMode === 'Online' && (
                                                        <div className="space-y-4">
                                                            <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex flex-col items-center gap-4 relative overflow-hidden group">
                                                                <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                <div className="w-44 h-44 bg-white p-3 rounded-2xl border-2 border-slate-100 shadow-xl flex items-center justify-center relative overlow-hidden">
                                                                    <img src="/qr-code.png" alt="Payment QR" className="w-full h-full object-contain" />
                                                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_10px_#3b82f6] animate-[scan_2s_infinite_linear]" />
                                                                </div>
                                                                <div className="text-center relative z-10">
                                                                    <p className="text-[12px] font-black text-slate-800 uppercase tracking-[0.2em] mb-1">Scan QR to Pay</p>
                                                                    <p className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 inline-block">UPI: legal.office@paytm</p>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Transaction ID</label>
                                                                <input
                                                                    type="text"
                                                                    value={transactionId}
                                                                    onChange={(e) => setTransactionId(e.target.value)}
                                                                    placeholder="Enter Reference Number"
                                                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                    {paymentMode === 'Cheque' && (
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-1.5">
                                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cheque No</label>
                                                                <input type="text" value={chequeNumber} onChange={(e) => setChequeNumber(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Bank Name</label>
                                                                <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handlePaymentUpdate}
                                            disabled={isProcessing}
                                            className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl disabled:opacity-50"
                                        >
                                            {isProcessing ? 'Processing...' : `Confirm Transaction (${paymentMode})`}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</p>
                                                <p className="font-bold text-slate-800 text-sm">{selectedCase.fullName}</p>
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</p>
                                                <p className="font-bold text-slate-800 text-sm">{selectedCase.phoneNumber}</p>
                                            </div>
                                            <div className="col-span-2 space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                                                <p className="font-bold text-slate-800 text-sm">{selectedCase.emailId}</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                                            <div className="flex gap-2">
                                                <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-600 uppercase tracking-wider">{selectedCase.caseCategory}</span>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</p>
                                                <p className="text-slate-600 text-sm italic">"{selectedCase.description}"</p>
                                            </div>
                                        </div>

                                        {selectedCase.status === 'Pending' && (
                                            <div className="space-y-4">
                                                <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Assign Lawyer</p>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {lawyers.map(l => (
                                                        <button
                                                            key={l.id}
                                                            onClick={() => setSelectedLawyerId(l.id)}
                                                            className={`p-4 rounded-2xl border-2 text-left transition-all ${selectedLawyerId === l.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100'}`}
                                                        >
                                                            <p className="text-sm font-black text-slate-900">{l.name}</p>
                                                            <p className="text-[9px] font-bold text-blue-600 uppercase">{l.specialization}</p>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {activeStage === 'Litigation' && (
                                            <div className="space-y-6">
                                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Track Litigation</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {['Stage 1', 'Stage 2', 'Stage 3', 'Final Verdict'].map(stg => (
                                                        <button
                                                            key={stg}
                                                            onClick={() => handleUpdateStage(stg)}
                                                            className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all ${selectedCase.caseStage === stg ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                                                        >
                                                            {stg}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="p-4 sm:p-8 border-t border-slate-100 bg-white flex gap-3 sm:gap-4">
                                {selectedCase.status === 'Pending' ? (
                                    <>
                                        <button onClick={() => handleStatusUpdate(selectedCase.id, 'Rejected')} className="flex-1 py-3 sm:py-4 bg-slate-100 text-slate-600 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest border border-slate-200">Reject</button>
                                        <button onClick={() => handleStatusUpdate(selectedCase.id, 'Approved')} className="flex-[2] py-3 sm:py-4 bg-blue-600 text-white rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Approve Request</button>
                                    </>
                                ) : (
                                    <button onClick={() => setSelectedCase(null)} className="w-full py-3 sm:py-4 bg-slate-900 text-white rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest active:scale-95 transition-all">Close Viewer</button>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Success Modal */}
            {
                showSuccessModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
                            <div className="p-10 text-center bg-emerald-50/50">
                                <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="h-10 w-10" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-4 leading-tight">Payment Successful!</h3>
                                <p className="text-slate-500 font-medium leading-relaxed">
                                    The payment record has been successfully updated and saved to the database.
                                </p>
                                <button
                                    onClick={() => {
                                        setShowSuccessModal(false);
                                        setSelectedCase(null);
                                    }}
                                    className="w-full mt-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-slate-200"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default AdminDashboard;
