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
    Wallet
} from 'lucide-react';
import LegalLogo from '../components/LegalLogo';

const AdminDashboard: React.FC = () => {
    const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
    const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
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

            alert('Payment recorded successfully!');
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
        verified: filteredData.filter(a => a.status === 'Approved' && !a.lawyerId),
        payment: filteredData.filter(a => a.status === 'Approved' && a.lawyerId && a.consultationFee === 0 && a.caseFee === 0),
        litigation: filteredData.filter(a => a.status === 'Approved' && (a.consultationFee > 0 || a.caseFee > 0)),
        history: filteredData.filter(a => a.paymentDate),
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
            <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-900 p-2 rounded-xl shadow-lg shadow-slate-900/20">
                            <LegalLogo className="h-6 w-6 text-white" />
                        </div>
                        <div>
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
                            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
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
                        { id: 'History', label: 'Income', icon: BarChart3, bg: 'bg-indigo-600' },
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
                                            stage.id === 'History' ? paymentHistory.length :
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
                    {activeStage === 'History' && (
                        <div className="col-span-full space-y-6">
                            <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">Income Overview</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Detailed history of all manual payments received</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setIncomeFilterMode('Today'); setIncomeDate(''); }}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${incomeFilterMode === 'Today' ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'}`}
                                    >
                                        Today
                                    </button>
                                    <button
                                        onClick={() => { setIncomeFilterMode('Weekly'); setIncomeDate(''); }}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${incomeFilterMode === 'Weekly' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100'}`}
                                    >
                                        Weekly
                                    </button>
                                    <button
                                        onClick={() => { setIncomeFilterMode('Monthly'); setIncomeDate(''); }}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${incomeFilterMode === 'Monthly' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'}`}
                                    >
                                        Monthly Report
                                    </button>
                                    {incomeFilterMode !== 'All' && (
                                        <button
                                            onClick={() => { setIncomeFilterMode('All'); setIncomeDate(''); }}
                                            className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100"
                                        >
                                            Reset
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-blue-600" />
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Search by Date:</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={incomeDate}
                                            onChange={(e) => { setIncomeDate(e.target.value); setIncomeFilterMode('Custom'); }}
                                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                </div>

                                {incomeFilterMode !== 'All' && (
                                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2 duration-300">
                                        <div className="text-right mr-2">
                                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Viewing Preview</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Review the data below before download</p>
                                        </div>
                                        <button
                                            onClick={() => downloadCSV(incomeFilterMode)}
                                            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                                        >
                                            <Download className="h-4 w-4" />
                                            Download CSV
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Case ID</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Client Name</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Consultation</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Due Fee</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Total</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Mode</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Date</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Details</th>
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
                                                        <td className="px-6 py-4">
                                                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{pay.caseId}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-xs font-bold text-slate-800">{pay.clientName}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                                                                <IndianRupee className="h-3 w-3 text-blue-500" />
                                                                {pay.consultationFee}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                                                                <IndianRupee className="h-3 w-3 text-blue-500" />
                                                                {pay.dueFee}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                                                                <IndianRupee className="h-3 w-3" />
                                                                {pay.amount}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${pay.paymentMode === 'Cash' ? 'bg-emerald-100 text-emerald-600' :
                                                                pay.paymentMode === 'Online' ? 'bg-blue-100 text-blue-600' :
                                                                    'bg-amber-100 text-amber-600'
                                                                }`}>
                                                                {pay.paymentMode}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-xs font-bold text-slate-600">
                                                                {new Date(pay.paymentDate).toLocaleDateString()}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
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
                        (activeStage === 'Payment' && columns.payment.length === 0) ||
                        (activeStage === 'History' && paymentHistory.length === 0) ||
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
                                    <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border-2 border-slate-100 space-y-10">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                                                    <Clock className="h-4 w-4 text-amber-600" />
                                                </div>
                                                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">1. Fee Allocation</h4>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
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
                                                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
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

                        <div className="p-8 border-t border-slate-100 flex gap-4">
                            {selectedCase.status === 'Pending' ? (
                                <>
                                    <button onClick={() => handleStatusUpdate(selectedCase.id, 'Rejected')} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase">Reject</button>
                                    <button onClick={() => handleStatusUpdate(selectedCase.id, 'Approved')} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl">Approve</button>
                                </>
                            ) : (
                                <button onClick={() => setSelectedCase(null)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase">Close Viewer</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
