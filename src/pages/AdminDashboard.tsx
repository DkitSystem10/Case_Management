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
    saveAppointment,
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
    IndianRupee,
    Banknote,
    Smartphone,
    ChevronRight,
    LayoutDashboard,
    CheckCircle2,
    FileText,
    Settings,
    CreditCard,
    User,
    Menu,
    ChevronLeft,
    MapPin,
    UserPlus,
    Mail,
    Lock,
    Phone,
    Briefcase,
    Award,
    Save
} from 'lucide-react';
import LegalLogo from '../components/LegalLogo';

const AdminDashboard: React.FC = () => {
    const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
    const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedCase, setSelectedCase] = useState<AppointmentRecord | null>(null);
    const [lawyers, setLawyers] = useState<Lawyer[]>([]);
    const [selectedLawyerId, setSelectedLawyerId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [appliedDate] = useState('');
    const [activeStage, setActiveStage] = useState<'Inquiry' | 'Verified' | 'Payment' | 'Litigation' | 'History' | 'Disposed' | 'Directory' | 'Districts' | 'Settings' | 'HearingDates'>('Inquiry');
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [consultationFee, setConsultationFee] = useState<string>('');
    const [caseFee, setCaseFee] = useState<string>('');
    const [paymentMode, setPaymentMode] = useState<string>('Cash');
    const [transactionId, setTransactionId] = useState('');
    const [localRejectionReason, setLocalRejectionReason] = useState('');
    const [showRejectionForm, setShowRejectionForm] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [incomeDate, setIncomeDate] = useState('');
    const [incomeFilterMode, setIncomeFilterMode] = useState<'All' | 'Today' | 'Weekly' | 'Monthly' | 'Custom'>('All');
    const [selectedDistrict, setSelectedDistrict] = useState<{ district: string; state: string; appointments: AppointmentRecord[] } | null>(null);
    
    // Add User Form State
    const [userForm, setUserForm] = useState({
        lawyerName: '',
        dateOfBirth: '',
        aadharNumber: '',
        panNumber: '',
        address: '',
        city: '',
        state: 'Tamil Nadu',
        mobileNumber: '',
        emailId: '',
        responsibleBranchCity: '',
        responsibleBranchState: 'Tamil Nadu',
        status: 'Active',
        specialization: '',
        experience: ''
    });
    const [userFormErrors, setUserFormErrors] = useState<Record<string, string>>({});
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [showUserSuccess, setShowUserSuccess] = useState(false);
    const [generatedCredentials, setGeneratedCredentials] = useState({ username: '', password: '' });
    
    // Appointment Form State
    const [showAppointmentForm, setShowAppointmentForm] = useState(false);
    const [appointmentForm, setAppointmentForm] = useState({
        // Client Details
        clientName: '',
        clientId: '',
        contactNumber: '',
        clientAddress: '',
        clientType: 'Individual' as 'Individual' | 'Company',
        emailId: '',
        // Case Information
        caseId: '',
        caseTitle: '',
        caseType: 'Civil',
        courtName: '',
        caseStatus: 'Open' as 'Open' | 'Pending' | 'Closed' | 'Appeal',
        // Branch & Control
        branchName: '',
        branchLocation: '',
        assignedAdvocate: '',
        // Case Progress & Dates
        filingDate: '',
        lastHearingDate: '',
        nextHearingDate: '',
        stageOfCase: 'Evidence' as 'Evidence' | 'Argument' | 'Judgment',
        // Financial
        feeType: 'Fixed' as 'Fixed' | 'Stage-wise',
        totalFee: '',
        paidAmount: '',
        balanceAmount: '',
        paymentStatus: '',
        // Documents & Notes
        documentsStatus: 'Pending' as 'Uploaded' | 'Pending',
        importantNotes: '',
        casePriority: 'Medium' as 'High' | 'Medium' | 'Low',
        // Additional required fields
        city: '',
        state: 'Tamil Nadu',
        caseCategory: 'Civil'
    });
    const [appointmentFormErrors, setAppointmentFormErrors] = useState<Record<string, string>>({});
    const [isSavingAppointment, setIsSavingAppointment] = useState(false);
    
    // Tamil Nadu Districts
    const tamilNaduDistricts = [
        "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", 
        "Dindigul", "Erode", "Kallakurichi", "Kancheepuram", "Karur", "Krishnagiri", 
        "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakal", "Nilgiris", "Perambalur", 
        "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", 
        "Thanjavur", "Theni", "Thiruvallur", "Thiruvarur", "Thoothukudi", "Tiruchirappalli", 
        "Tirunelveli", "Tirupattur", "Tiruppur", "Tiruvannamalai", "Vellore", "Viluppuram", "Virudhunagar"
    ];
    
    // District Short Form Mapping
    const getDistrictShortForm = (district: string): string => {
        const shortForms: Record<string, string> = {
            "Ariyalur": "ARY",
            "Chengalpattu": "CGP",
            "Chennai": "CHN",
            "Coimbatore": "CBE",
            "Cuddalore": "CUD",
            "Dharmapuri": "DHP",
            "Dindigul": "DGL",
            "Erode": "ERD",
            "Kallakurichi": "KLK",
            "Kancheepuram": "KCP",
            "Karur": "KRR",
            "Krishnagiri": "KRG",
            "Madurai": "MDU",
            "Mayiladuthurai": "MYL",
            "Nagapattinam": "NGP",
            "Namakal": "NMK",
            "Nilgiris": "NLG",
            "Perambalur": "PBL",
            "Pudukkottai": "PDK",
            "Ramanathapuram": "RMP",
            "Ranipet": "RNP",
            "Salem": "SLM",
            "Sivaganga": "SVG",
            "Tenkasi": "TNK",
            "Thanjavur": "TNJ",
            "Theni": "THN",
            "Thiruvallur": "TVL",
            "Thiruvarur": "TVR",
            "Thoothukudi": "TTK",
            "Tiruchirappalli": "TPJ",
            "Tirunelveli": "TNL",
            "Tirupattur": "TPT",
            "Tiruppur": "TPR",
            "Tiruvannamalai": "TVM",
            "Vellore": "VLR",
            "Viluppuram": "VLP",
            "Virudhunagar": "VRG"
        };
        return shortForms[district] || district.substring(0, 3).toUpperCase();
    };
    
    const caseCategories = ["Civil", "Criminal", "Family", "Corporate", "Property", "Others"];

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

    const handleStatusUpdate = async (id: string, status: 'Approved' | 'Rejected', reason?: string) => {
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
                await updateAppointmentStatus(id, status, reason);
            }

            await loadData();
            setSelectedCase(null);
            setSelectedLawyerId('');
            setLocalRejectionReason('');
            setShowRejectionForm(false);
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

            const txnInfo = paymentMode === 'Online' ? transactionId : '';

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

    // Group approved appointments by district
    const districtGroups = filteredData
        .filter(a => a.status === 'Approved' && a.city)
        .reduce((acc, app) => {
            const district = app.city;
            const state = app.state;
            const key = `${district}, ${state}`;
            if (!acc[key]) {
                acc[key] = {
                    district,
                    state,
                    appointments: []
                };
            }
            acc[key].appointments.push(app);
            return acc;
        }, {} as Record<string, { district: string; state: string; appointments: AppointmentRecord[] }>);

    const sortedDistricts = Object.values(districtGroups).sort((a, b) => {
        if (a.state !== b.state) {
            return a.state.localeCompare(b.state);
        }
        return a.district.localeCompare(b.district);
    });

    const renderTableRow = (request: AppointmentRecord, index: number) => (
        <tr
            key={request.id}
            onClick={() => setSelectedCase(request)}
            className="group hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100 last:border-0"
        >
            <td className="py-3 px-4 text-sm font-medium text-slate-400">
                {index + 1}
            </td>
            <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                        {request.fullName.charAt(0)}
                    </div>
                    <span className="text-sm font-bold text-slate-700 uppercase tracking-tight truncate max-w-[150px]">
                        {request.fullName}
                    </span>
                </div>
            </td>
            <td className="py-3 px-4">
                <span className="text-sm text-slate-500 font-medium">
                    {request.caseCategory}
                </span>
            </td>
            <td className="py-3 px-4">
                <span className="text-sm text-slate-500 font-medium">
                    {new Date(request.appointmentDate).toLocaleDateString()}
                </span>
            </td>
            <td className="py-3 px-4">
                <span className="text-sm text-slate-500 font-medium uppercase">
                    {request.timeSlot}
                </span>
            </td>
            <td className="py-3 px-4 text-right">
                <span className={`text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${request.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                    request.status === 'Pending' ? 'bg-amber-100 text-amber-600' :
                        'bg-red-100 text-red-600'
                    }`}>
                    {request.status === 'Approved' ? 'Confirmed' : request.status}
                </span>
            </td>
        </tr>
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Synchronizing Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FD] flex flex-col md:flex-row">
            {/* Mobile Menu Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Left Sidebar */}
            <aside className={`fixed md:sticky top-0 h-screen z-[70] transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} w-[100px] bg-[#222834] flex flex-col items-center py-5`}>
                <div className="mb-6">
                    <div className="bg-blue-600/10 p-1.5 rounded-lg">
                        <LegalLogo className="h-5 w-5 text-blue-500" />
                    </div>
                </div>

                <nav className="flex-1 w-full space-y-3">
                    {[
                        { id: 'Inquiry', label: 'Dashboard', icon: LayoutDashboard, color: 'bg-blue-500' },
                        { id: 'Verified', label: 'Client Appointments', icon: ListTodo, color: 'bg-purple-500' },
                        { id: 'Litigation', label: 'Ongoing Cases', icon: ArrowRight, color: 'bg-emerald-600' },
                        { id: 'History', label: 'Payment', icon: CreditCard, color: 'bg-amber-600' },
                        { id: 'Disposed', label: 'Rejected', icon: XCircle, color: 'bg-rose-600' }
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveStage(item.id as any);
                                setIsSidebarOpen(false);
                            }}
                            className={`w-full flex flex-col items-center py-2 relative transition-all group ${activeStage === item.id ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
                        >
                            {activeStage === item.id && (
                                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500 shadow-[2px_0_10px_rgba(59,130,246,0.5)]" />
                            )}

                            <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center mb-1 shadow-md group-active:scale-95 transition-transform`}>
                                <item.icon className="h-4 w-4 text-white" />
                            </div>

                            <span className="text-[11px] font-bold text-white/90 tracking-tight leading-none">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="w-full space-y-4 pt-4 mt-auto">
                    <button 
                        onClick={() => {
                            setActiveStage('Settings');
                            setIsSidebarOpen(false);
                        }}
                        className={`w-full flex flex-col items-center py-2 transition-all ${activeStage === 'Settings' ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
                    >
                        {activeStage === 'Settings' && (
                            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500 shadow-[2px_0_10px_rgba(59,130,246,0.5)]" />
                        )}
                        <div className={`w-10 h-10 ${activeStage === 'Settings' ? 'bg-slate-600' : 'bg-slate-700/50'} rounded-lg flex items-center justify-center mb-1 focus:ring-2 focus:ring-slate-400`}>
                            <Settings className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">Settings</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex flex-col items-center py-2 opacity-50 hover:opacity-100 transition-all"
                    >
                        <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center mb-1 focus:ring-2 focus:ring-red-400">
                            <LogOut className="h-4 w-4 text-red-500" />
                        </div>
                        <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-[70px] bg-white/50 backdrop-blur-sm border-b border-slate-100 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 text-slate-400 hover:text-slate-600 md:hidden"
                        >
                            <Menu className="h-5 w-5" />
                        </button>

                        {activeStage !== 'Inquiry' && (
                            <button
                                onClick={() => setActiveStage('Inquiry')}
                                className="flex items-center gap-1 px-2 py-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all group"
                            >
                                <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
                            </button>
                        )}

                        <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight whitespace-nowrap">
                            {activeStage === 'History' ? 'Payment' :
                                activeStage === 'Inquiry' ? 'Dashboard' :
                                    activeStage === 'Verified' ? 'Client Appointments' :
                                        activeStage === 'Districts' ? 'Lawyer Updates' :
                                            activeStage === 'Directory' ? 'Lawyers Details' :
                                    activeStage === 'Disposed' ? 'Rejected Cases' :
                                            activeStage === 'Litigation' ? 'Ongoing Cases' :
                                                        activeStage === 'Settings' ? 'Settings & User Management' :
                                                activeStage}
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group hidden md:block">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className="w-[240px] pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                            />
                        </div>

                        <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all relative">
                                <Settings className="h-4 w-4" />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all relative">
                                <Bell className="h-4 w-4" />
                                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 border-2 border-white rounded-full" />
                            </button>
                            <div className="flex items-center gap-2.5 ml-1">
                                <div className="hidden sm:block text-right">
                                    <p className="text-xs font-black text-slate-900 leading-none">Admin User</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Super Admin</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                                    <User className="h-5 w-5 text-slate-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="p-4 md:p-6">
                    {activeStage === 'Inquiry' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {[
                                { 
                                    id: 'Verified', 
                                    label: 'Client Appointments', 
                                    value: appointments.length, 
                                    icon: ListTodo, 
                                    color: 'text-blue-600', 
                                    bg: 'bg-blue-50',
                                    description: 'All client appointment bookings'
                                },
                                { 
                                    id: 'HearingDates', 
                                    label: 'Hearing Dates', 
                                    value: appointments.filter(a => a.status === 'Approved' && (a.courtHearingDate || a.nextHearingDate)).length, 
                                    icon: Calendar, 
                                    color: 'text-purple-600', 
                                    bg: 'bg-purple-50',
                                    description: 'Current & Next hearing dates with client details'
                                },
                                { 
                                    id: 'Districts', 
                                    label: 'Lawyer Updates', 
                                    value: appointments.filter(a => a.hearingUpdatedBy).length, 
                                    icon: FileText, 
                                    color: 'text-indigo-600', 
                                    bg: 'bg-indigo-50',
                                    description: 'Hearing details updated by lawyers'
                                },
                                { 
                                    id: 'Directory', 
                                    label: 'Lawyers Details', 
                                    value: lawyers.length, 
                                    icon: User, 
                                    color: 'text-blue-600', 
                                    bg: 'bg-blue-50',
                                    description: 'Which lawyer handles which district cases'
                                },
                            ].map((stat, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveStage(stat.id as any)}
                                    className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm hover:border-blue-300 hover:shadow-lg transition-all active:scale-95 group/stat text-left"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center group-hover/stat:scale-110 transition-transform`}>
                                            <stat.icon className="h-6 w-6" />
                                        </div>
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                                    <p className="text-3xl font-black text-slate-900 mb-2">{stat.value}</p>
                                    <p className="text-[10px] text-slate-500 font-medium leading-tight">{stat.description}</p>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Filter by</span>
                            <div className="relative">
                                <select
                                    className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none pr-10"
                                    value={activeCategory}
                                    onChange={(e) => setActiveCategory(e.target.value)}
                                >
                                    <option value="All">All Categories</option>
                                    <option value="Civil">Civil</option>
                                    <option value="Criminal">Criminal</option>
                                    <option value="Family">Family</option>
                                    <option value="Property">Property</option>
                                    <option value="Others">Others</option>
                                </select>
                                <ChevronRight className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" />
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/appointment')}
                            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-xs font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                        >
                            Schedule Appointment
                        </button>
                    </div>

                    {activeStage === 'History' ? (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-6">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">Payment Overview</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Financial summary and transaction logs</p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <button
                                        onClick={() => { setIncomeFilterMode('Today'); setIncomeDate(''); }}
                                        className={`px-5 py-2.5 rounded-lg font-black uppercase tracking-widest transition-all border ${incomeFilterMode === 'Today' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                                    >
                                        Today
                                    </button>
                                    <button
                                        onClick={() => { setIncomeFilterMode('Weekly'); setIncomeDate(''); }}
                                        className={`px-5 py-2.5 rounded-lg font-black uppercase tracking-widest transition-all border ${incomeFilterMode === 'Weekly' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                                    >
                                        Weekly
                                    </button>
                                    <button
                                        onClick={() => { setIncomeFilterMode('Monthly'); setIncomeDate(''); }}
                                        className={`px-5 py-2.5 rounded-lg font-black uppercase tracking-widest transition-all border ${incomeFilterMode === 'Monthly' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                                    >
                                        Full Report
                                    </button>
                                    <button
                                        onClick={() => downloadCSV(incomeFilterMode === 'All' ? 'Monthly' : incomeFilterMode as any)}
                                        className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center gap-2"
                                    >
                                        <FileText className="h-4 w-4" />
                                        Export CSV
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Case ID</th>
                                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Mode</th>
                                                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 text-sm">
                                            {paymentHistory
                                                .filter(pay => {
                                                    const now = new Date();
                                                    if (incomeFilterMode === 'Today') return pay.paymentDate?.startsWith(now.toISOString().split('T')[0]);
                                                    if (incomeFilterMode === 'Weekly') {
                                                        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                                                        return new Date(pay.paymentDate) >= lastWeek;
                                                    }
                                                    if (incomeFilterMode === 'Monthly') {
                                                        const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                                                        return new Date(pay.paymentDate) >= lastMonth;
                                                    }
                                                    return true;
                                                })
                                                .map((pay) => (
                                                    <tr key={pay.id} className="hover:bg-blue-50/30 transition-colors group">
                                                        <td className="px-4 py-2.5">
                                                            <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">{pay.caseId}</span>
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            <p className="text-[11px] font-bold text-slate-700">{pay.clientName}</p>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right">
                                                            <span className="text-[10px] font-black text-emerald-600 flex items-center justify-end gap-1">
                                                                <IndianRupee className="h-2.5 w-2.5" />
                                                                {pay.amount}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-center">
                                                            <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${pay.paymentMode === 'Cash' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                                                {pay.paymentMode}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right">
                                                            <span className="text-[10px] font-bold text-slate-500">
                                                                {new Date(pay.paymentDate).toLocaleDateString()}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : activeStage === 'Verified' ? (
                        <div className="space-y-6">
                            {/* Hearing Dates Section */}
                            <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 p-8 rounded-3xl border border-purple-100/50 shadow-sm">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
                                        <Calendar className="h-7 w-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 mb-1">Upcoming Hearing Dates</h3>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                            Current and Next Hearing Dates with Client Details
                                        </p>
                                    </div>
                                </div>

                                {/* Get all cases with hearing dates */}
                                {(() => {
                                    const hearingCases = appointments.filter(app => 
                                        app.status === 'Approved' && 
                                        (app.courtHearingDate || app.nextHearingDate)
                                    ).sort((a, b) => {
                                        const dateA = a.nextHearingDate || a.courtHearingDate || '';
                                        const dateB = b.nextHearingDate || b.courtHearingDate || '';
                                        return dateA.localeCompare(dateB);
                                    });

                                    if (hearingCases.length === 0) {
                                        return (
                                            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-20 text-center">
                                                <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                                <p className="text-slate-500 font-bold">No upcoming hearings scheduled</p>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {hearingCases.map((app) => (
                                                <div 
                                                    key={app.id}
                                                    onClick={() => setSelectedCase(app)}
                                                    className="bg-white rounded-2xl p-6 border-2 border-slate-100 hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer"
                                                >
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg">
                                                                {app.fullName.charAt(0)}
                                    </div>
                                    <div>
                                                                <h4 className="font-black text-slate-900 text-base">{app.fullName}</h4>
                                                                <p className="text-xs text-slate-500 font-medium">{app.caseCategory}</p>
                                    </div>
                                </div>
                                                        {app.caseId && (
                                                            <span className="text-xs font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-md">
                                                                {app.caseId}
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="space-y-3">
                                                        {app.courtHearingDate && (
                                                            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                                                                <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">Court Hearing Date</p>
                                                                <p className="text-sm font-bold text-slate-800">
                                                                    {new Date(app.courtHearingDate).toLocaleDateString('en-IN', {
                                                                        weekday: 'short',
                                                                        year: 'numeric',
                                                                        month: 'short',
                                                                        day: 'numeric'
                                                                    })}
                                                                </p>
                                                            </div>
                                                        )}
                                                        {app.nextHearingDate && (
                                                            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Next Hearing Date</p>
                                                                <p className="text-sm font-bold text-slate-800">
                                                                    {new Date(app.nextHearingDate).toLocaleDateString('en-IN', {
                                                                        weekday: 'short',
                                                                        year: 'numeric',
                                                                        month: 'short',
                                                                        day: 'numeric'
                                                                    })}
                                                                </p>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                                                            <span className="font-medium">{app.city}, {app.state}</span>
                                                            <span className="font-bold">{app.phoneNumber}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    ) : activeStage === 'Directory' ? (
                        <div className="space-y-6">
                            {/* Lawyers Details Section */}
                            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-8 rounded-3xl border border-blue-100/50 shadow-sm">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                                        <User className="h-7 w-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 mb-1">Lawyers Details</h3>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                            Which Lawyer Handles Which District Cases
                                        </p>
                                    </div>
                                </div>

                                {lawyers.length === 0 ? (
                                    <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-20 text-center">
                                        <User className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                        <p className="text-slate-500 font-bold">No lawyers added yet</p>
                            </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {lawyers.map((lawyer) => {
                                            const lawyerCases = appointments.filter(app => 
                                                app.status === 'Approved' && 
                                                app.city === lawyer.district
                                            );
                                            
                                            return (
                                                <div 
                                                    key={lawyer.id}
                                                    className="bg-white rounded-2xl p-6 border-2 border-slate-100 hover:border-blue-300 hover:shadow-lg transition-all"
                                                >
                                                    <div className="flex items-start justify-between mb-4">
                                                            <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg">
                                                                {lawyer.name.charAt(0)}
                                                                </div>
                                                            <div>
                                                                <h4 className="font-black text-slate-900 text-base">{lawyer.name}</h4>
                                                                <p className="text-xs text-slate-500 font-medium">{lawyer.specialization}</p>
                                                                </div>
                                                            </div>
                                                        {lawyer.username && (
                                                            <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                                                {lawyer.username}
                                                            </span>
                                                        )}
                                                            </div>
                                                    
                                                    <div className="space-y-3">
                                                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                                                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">District</p>
                                                            <p className="text-sm font-bold text-slate-800">{lawyer.district || 'Not Assigned'}</p>
                                                        </div>
                                                        <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Total Cases</p>
                                                            <p className="text-2xl font-black text-indigo-600">{lawyerCases.length}</p>
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                                                            <span className="font-medium">{lawyer.experience}</span>
                                                            <span className="font-bold">⭐ {lawyer.rating}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : activeStage === 'Districts' ? (
                        <div className="space-y-6">
                            {/* Header Section */}
                            <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-8 rounded-3xl border border-indigo-100/50 shadow-sm">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                                            <MapPin className="h-7 w-7 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 mb-1">District Overview</h3>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                Approved appointments organized by district
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="px-6 py-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-indigo-200/50 shadow-sm">
                                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Total Districts</p>
                                            <p className="text-3xl font-black text-indigo-600">{sortedDistricts.length}</p>
                                        </div>
                                        <div className="px-6 py-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-200/50 shadow-sm">
                                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Total Cases</p>
                                            <p className="text-3xl font-black text-purple-600">
                                                {sortedDistricts.reduce((sum, d) => sum + d.appointments.length, 0)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {sortedDistricts.length === 0 ? (
                                <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-sm p-20 text-center">
                                    <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                        <MapPin className="h-10 w-10 text-slate-400" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 mb-3">
                                        No Districts Found
                                    </h3>
                                    <p className="text-slate-500 font-semibold text-sm max-w-md mx-auto">
                                        Approve appointments to see them organized by district. Once approved, they will appear here grouped by their district location.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {sortedDistricts
                                        .filter(group => {
                                            if (activeCategory === 'All') return true;
                                            return group.appointments.some(a => 
                                                activeCategory === 'Others' 
                                                    ? !['Civil', 'Criminal', 'Family', 'Property'].includes(a.caseCategory)
                                                    : a.caseCategory === activeCategory
                                            );
                                        })
                                        .map((group) => (
                                            <div
                                                key={`${group.district}-${group.state}`}
                                                onClick={() => setSelectedDistrict(group)}
                                                className="bg-white rounded-3xl border-2 border-slate-100 shadow-md hover:shadow-2xl hover:border-indigo-400 hover:-translate-y-1 transition-all duration-300 cursor-pointer group overflow-hidden relative"
                                            >
                                                {/* Gradient Header */}
                                                <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-7 relative overflow-hidden">
                                                    {/* Decorative Elements */}
                                                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl"></div>
                                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 blur-xl"></div>
                                                    <div className="absolute top-4 right-4 w-2 h-2 bg-white/30 rounded-full"></div>
                                                    <div className="absolute bottom-6 right-8 w-1.5 h-1.5 bg-white/20 rounded-full"></div>
                                                    
                                                    <div className="relative z-10">
                                                        <div className="flex items-start justify-between mb-5">
                                                            <div className="w-14 h-14 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-xl border border-white/30 group-hover:scale-110 transition-transform duration-300">
                                                                <MapPin className="h-7 w-7 text-white" />
                                                            </div>
                                                            <div className="px-4 py-2 bg-white/25 backdrop-blur-lg rounded-xl border border-white/40 shadow-lg">
                                                                <p className="text-xs font-black text-white uppercase tracking-wider">
                                                                    {group.appointments.length} {group.appointments.length === 1 ? 'Case' : 'Cases'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <h4 className="text-2xl font-black text-white mb-2 leading-tight group-hover:translate-x-1 transition-transform duration-300">
                                                            {group.district}
                                                        </h4>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 bg-white/60 rounded-full"></div>
                                                            <p className="text-sm font-bold text-white/90 italic">
                                                                {group.state}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Content Section */}
                                                <div className="p-6">
                                                    {/* Stats Row */}
                                                    <div className="grid grid-cols-2 gap-4 mb-5">
                                                        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Total Cases</p>
                                                            <p className="text-2xl font-black text-indigo-600">{group.appointments.length}</p>
                                                        </div>
                                                        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                                                            <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-2">Categories</p>
                                                            <p className="text-2xl font-black text-purple-600">
                                                                {Array.from(new Set(group.appointments.map(a => a.caseCategory))).length}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Categories Tags */}
                                                    <div className="mb-5">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Case Categories</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {Array.from(new Set(group.appointments.map(a => a.caseCategory))).slice(0, 4).map(cat => {
                                                                const colors: Record<string, string> = {
                                                                    'Civil': 'bg-blue-100 text-blue-700 border-blue-200',
                                                                    'Criminal': 'bg-red-100 text-red-700 border-red-200',
                                                                    'Family': 'bg-pink-100 text-pink-700 border-pink-200',
                                                                    'Property': 'bg-emerald-100 text-emerald-700 border-emerald-200',
                                                                    'Corporate': 'bg-amber-100 text-amber-700 border-amber-200',
                                                                };
                                                                const colorClass = colors[cat] || 'bg-slate-100 text-slate-700 border-slate-200';
                                                                return (
                                                                    <span 
                                                                        key={cat} 
                                                                        className={`text-[10px] font-black px-3 py-1.5 rounded-lg border ${colorClass} uppercase tracking-wide`}
                                                                    >
                                                                        {cat}
                                                            </span>
                                                                );
                                                            })}
                                                            {Array.from(new Set(group.appointments.map(a => a.caseCategory))).length > 4 && (
                                                                <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                                                    +{Array.from(new Set(group.appointments.map(a => a.caseCategory))).length - 4}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Action Button */}
                                                    <div className="pt-5 border-t-2 border-slate-100">
                                                        <button className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-lg shadow-indigo-200/50 group-hover:shadow-xl group-hover:shadow-indigo-300/50 group-hover:scale-[1.02] flex items-center justify-center gap-2">
                                                            <span>View All Details</span>
                                                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Hover Effect Overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-300 pointer-events-none rounded-3xl"></div>
                                            </div>
                                        ))}
                                </div>
                            )}
                            </div>
                    ) : activeStage === 'Settings' ? (
                        <div className="space-y-6">
                            {/* Settings Header */}
                            <div className="bg-gradient-to-r from-slate-50 via-slate-50 to-slate-100 p-8 rounded-3xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-slate-600 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-300">
                                        <Settings className="h-7 w-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 mb-1">User Management</h3>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                            Add and manage lawyer users for district-based case handling
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Add User Form */}
                            <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                                            <UserPlus className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-slate-900">Sub User (Branch) Profile Details</h4>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                                                Create a new lawyer account with complete profile information
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <form 
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        // Validation
                                        const errors: Record<string, string> = {};
                                        if (!userForm.lawyerName.trim()) errors.lawyerName = 'Lawyer Name is required';
                                        if (!userForm.dateOfBirth) errors.dateOfBirth = 'Date of Birth is required';
                                        if (!userForm.aadharNumber.trim()) errors.aadharNumber = 'Aadhar Number is required';
                                        else if (userForm.aadharNumber.replace(/\D/g, '').length !== 12) errors.aadharNumber = 'Aadhar must be 12 digits';
                                        if (!userForm.panNumber.trim()) errors.panNumber = 'PAN Number is required';
                                        if (!userForm.address.trim()) errors.address = 'Address is required';
                                        if (!userForm.city.trim()) errors.city = 'City is required';
                                        if (!userForm.mobileNumber.trim()) errors.mobileNumber = 'Mobile Number is required';
                                        else if (userForm.mobileNumber.replace(/\D/g, '').length !== 10) errors.mobileNumber = 'Mobile must be 10 digits';
                                        if (!userForm.emailId.trim()) errors.emailId = 'Email ID is required';
                                        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.emailId)) errors.emailId = 'Invalid email format';
                                        if (!userForm.responsibleBranchCity) errors.responsibleBranchCity = 'Responsible Branch City is required';
                                        if (!userForm.specialization.trim()) errors.specialization = 'Specialization is required';
                                        if (!userForm.experience.trim()) errors.experience = 'Experience is required';

                                        setUserFormErrors(errors);
                                        if (Object.keys(errors).length > 0) return;

                                        setIsAddingUser(true);
                                        try {
                                            // Generate username based on district short form + sequential number
                                            const { supabase } = await import('../utils/supabase');
                                            
                                            const districtShortForm = getDistrictShortForm(userForm.responsibleBranchCity);
                                            
                                            // Get all existing lawyers from the same district to determine next number
                                            const { data: existingLawyers } = await supabase
                                                .from('lawyers')
                                                .select('username, district')
                                                .eq('district', userForm.responsibleBranchCity)
                                                .like('username', `${districtShortForm}%`)
                                                .order('username', { ascending: false })
                                                .limit(1);

                                            let nextNumber = 1;
                                            if (existingLawyers && existingLawyers.length > 0 && existingLawyers[0].username) {
                                                // Extract number from username (e.g., CHN001 -> 1)
                                                const lastUsername = existingLawyers[0].username;
                                                const match = lastUsername.match(/\d+$/);
                                                if (match) {
                                                    nextNumber = parseInt(match[0]) + 1;
                                                }
                                            }
                                            
                                            const nextUsername = `${districtShortForm}${String(nextNumber).padStart(3, '0')}`;

                                            // Generate memorable password (Lawyer name initials + birth year last 2 digits + district code)
                                            const generateMemorablePassword = () => {
                                                const nameParts = userForm.lawyerName.trim().split(' ');
                                                const initials = nameParts.map(part => part.charAt(0).toUpperCase()).join('').slice(0, 2);
                                                const birthYear = userForm.dateOfBirth ? userForm.dateOfBirth.split('-')[0].slice(-2) : '00';
                                                const districtCode = districtShortForm.slice(0, 2).toLowerCase();
                                                return `${initials}${birthYear}${districtCode}`;
                                            };
                                            const generatedPassword = generateMemorablePassword();

                                            // Add user to database
                                            const { data, error } = await supabase
                                                .from('lawyers')
                                                .insert([{
                                                    name: userForm.lawyerName,
                                                    email: userForm.emailId.toLowerCase(),
                                                    password: generatedPassword,
                                                    phone_number: userForm.mobileNumber,
                                                    district: userForm.responsibleBranchCity,
                                                    specialization: userForm.specialization,
                                                    experience: userForm.experience,
                                                    rating: 5.0,
                                                    username: nextUsername,
                                                    date_of_birth: userForm.dateOfBirth,
                                                    aadhar_number: userForm.aadharNumber.replace(/\D/g, ''),
                                                    pan_number: userForm.panNumber.toUpperCase(),
                                                    address: userForm.address,
                                                    city: userForm.city,
                                                    state: userForm.state,
                                                    responsible_branch_state: userForm.responsibleBranchState,
                                                    status: userForm.status
                                                }])
                                                .select();

                                            if (error) throw error;

                                            setGeneratedCredentials({ username: nextUsername, password: generatedPassword });
                                            setShowUserSuccess(true);
                                            setUserForm({
                                                lawyerName: '',
                                                dateOfBirth: '',
                                                aadharNumber: '',
                                                panNumber: '',
                                                address: '',
                                                city: '',
                                                state: 'Tamil Nadu',
                                                mobileNumber: '',
                                                emailId: '',
                                                responsibleBranchCity: '',
                                                responsibleBranchState: 'Tamil Nadu',
                                                status: 'Active',
                                                specialization: '',
                                                experience: ''
                                            });
                                            setUserFormErrors({});
                                            await loadData();
                                        } catch (error: any) {
                                            console.error('Error adding user:', error);
                                            alert('Failed to add user: ' + (error.message || 'Unknown error'));
                                        } finally {
                                            setIsAddingUser(false);
                                        }
                                    }}
                                    className="p-8 space-y-6"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Lawyer Name */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                <User className="h-4 w-4 text-slate-500" />
                                                Lawyer Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={userForm.lawyerName}
                                                onChange={(e) => setUserForm(prev => ({ ...prev, lawyerName: e.target.value }))}
                                                placeholder="Enter lawyer full name"
                                                className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50 focus:bg-white ${userFormErrors.lawyerName ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                            />
                                            {userFormErrors.lawyerName && <p className="text-xs text-red-500 font-bold">{userFormErrors.lawyerName}</p>}
                                        </div>

                                        {/* Date of Birth */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-slate-500" />
                                                Date of Birth <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={userForm.dateOfBirth}
                                                onChange={(e) => setUserForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                                max={new Date().toISOString().split('T')[0]}
                                                className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50 focus:bg-white ${userFormErrors.dateOfBirth ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                            />
                                            {userFormErrors.dateOfBirth && <p className="text-xs text-red-500 font-bold">{userFormErrors.dateOfBirth}</p>}
                                        </div>

                                        {/* Aadhar Number */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-slate-500" />
                                                Aadhar Number <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={userForm.aadharNumber}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                                                    setUserForm(prev => ({ ...prev, aadharNumber: value }));
                                                }}
                                                placeholder="12 digit Aadhar number"
                                                className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50 focus:bg-white ${userFormErrors.aadharNumber ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                            />
                                            {userFormErrors.aadharNumber && <p className="text-xs text-red-500 font-bold">{userFormErrors.aadharNumber}</p>}
                                        </div>

                                        {/* PAN Number */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-slate-500" />
                                                PAN Number <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={userForm.panNumber}
                                                onChange={(e) => {
                                                    const value = e.target.value.toUpperCase();
                                                    setUserForm(prev => ({ ...prev, panNumber: value }));
                                                }}
                                                placeholder="Enter PAN Number"
                                                className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50 focus:bg-white uppercase ${userFormErrors.panNumber ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                            />
                                            {userFormErrors.panNumber && <p className="text-xs text-red-500 font-bold">{userFormErrors.panNumber}</p>}
                                        </div>

                                        {/* Address */}
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-slate-500" />
                                                Address <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                value={userForm.address}
                                                onChange={(e) => setUserForm(prev => ({ ...prev, address: e.target.value }))}
                                                placeholder="Enter complete address"
                                                rows={3}
                                                className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50 focus:bg-white resize-none ${userFormErrors.address ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                            />
                                            {userFormErrors.address && <p className="text-xs text-red-500 font-bold">{userFormErrors.address}</p>}
                                        </div>

                                        {/* City */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-slate-500" />
                                                City <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={userForm.city}
                                                onChange={(e) => setUserForm(prev => ({ ...prev, city: e.target.value }))}
                                                placeholder="Enter city name"
                                                className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50 focus:bg-white ${userFormErrors.city ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                            />
                                            {userFormErrors.city && <p className="text-xs text-red-500 font-bold">{userFormErrors.city}</p>}
                                        </div>

                                        {/* State */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-slate-500" />
                                                State <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={userForm.state}
                                                disabled
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-100 text-slate-600 cursor-not-allowed opacity-70"
                                            />
                                        </div>

                                        {/* Mobile Number */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-slate-500" />
                                                Mobile Number <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                value={userForm.mobileNumber}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                    setUserForm(prev => ({ ...prev, mobileNumber: value }));
                                                }}
                                                placeholder="10 digit mobile number"
                                                className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50 focus:bg-white ${userFormErrors.mobileNumber ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                            />
                                            {userFormErrors.mobileNumber && <p className="text-xs text-red-500 font-bold">{userFormErrors.mobileNumber}</p>}
                                        </div>

                                        {/* Email ID */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-slate-500" />
                                                Email ID <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                value={userForm.emailId}
                                                onChange={(e) => setUserForm(prev => ({ ...prev, emailId: e.target.value }))}
                                                placeholder="lawyer@example.com"
                                                className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50 focus:bg-white ${userFormErrors.emailId ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                            />
                                            {userFormErrors.emailId && <p className="text-xs text-red-500 font-bold">{userFormErrors.emailId}</p>}
                                        </div>

                                        {/* Responsible Branch City */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-slate-500" />
                                                Responsible Branch City <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={userForm.responsibleBranchCity}
                                                onChange={(e) => setUserForm(prev => ({ ...prev, responsibleBranchCity: e.target.value }))}
                                                className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none bg-slate-50 focus:bg-white ${userFormErrors.responsibleBranchCity ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                            >
                                                <option value="">Select District</option>
                                                {tamilNaduDistricts.map(district => (
                                                    <option key={district} value={district}>{district}</option>
                                                ))}
                                            </select>
                                            {userFormErrors.responsibleBranchCity && <p className="text-xs text-red-500 font-bold">{userFormErrors.responsibleBranchCity}</p>}
                                            <p className="text-xs text-slate-400 italic">This lawyer will handle cases only from this district</p>
                                        </div>

                                        {/* Responsible Branch State */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-slate-500" />
                                                Responsible Branch State <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={userForm.responsibleBranchState}
                                                disabled
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-100 text-slate-600 cursor-not-allowed opacity-70"
                                            />
                                        </div>

                                        {/* Status */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-slate-500" />
                                                Status <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={userForm.status}
                                                onChange={(e) => setUserForm(prev => ({ ...prev, status: e.target.value }))}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none bg-slate-50 focus:bg-white"
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                        </div>

                                        {/* Specialization */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                <Briefcase className="h-4 w-4 text-slate-500" />
                                                Specialization <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={userForm.specialization}
                                                onChange={(e) => setUserForm(prev => ({ ...prev, specialization: e.target.value }))}
                                                className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none bg-slate-50 focus:bg-white ${userFormErrors.specialization ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                            >
                                                <option value="">Select Specialization</option>
                                                {caseCategories.map(cat => (
                                                    <option key={cat} value={cat}>{cat} Law</option>
                                                ))}
                                                <option value="General">General Practice</option>
                                            </select>
                                            {userFormErrors.specialization && <p className="text-xs text-red-500 font-bold">{userFormErrors.specialization}</p>}
                                        </div>

                                        {/* Experience */}
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                <Award className="h-4 w-4 text-slate-500" />
                                                Experience <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={userForm.experience}
                                                onChange={(e) => setUserForm(prev => ({ ...prev, experience: e.target.value }))}
                                                placeholder="e.g., 5 Years, 10 Years, etc."
                                                className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50 focus:bg-white ${userFormErrors.experience ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                            />
                                            {userFormErrors.experience && <p className="text-xs text-red-500 font-bold">{userFormErrors.experience}</p>}
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="pt-4 border-t-2 border-slate-100">
                                        <button
                                            type="submit"
                                            disabled={isAddingUser}
                                            className={`w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-300/50 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {isAddingUser ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    <span>Adding User...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-5 w-5" />
                                                    <span>Add User</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Existing Users List */}
                            <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-6 border-b border-slate-200">
                                    <h4 className="text-xl font-black text-slate-900">Existing Users</h4>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                                        All registered lawyer users
                                    </p>
                                </div>
                                <div className="p-6">
                                    {lawyers.length === 0 ? (
                                        <div className="text-center py-12">
                                            <User className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                            <p className="text-slate-500 font-bold">No users added yet</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {lawyers.map(lawyer => (
                                                <div key={lawyer.id} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border-2 border-slate-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all group">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg group-hover:scale-110 transition-transform">
                                                            {lawyer.name.charAt(0)}
                                                        </div>
                                                        <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">Active</span>
                                                    </div>
                                                    <h5 className="text-base font-black text-slate-900 mb-2">{lawyer.name}</h5>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <Briefcase className="h-3.5 w-3.5 text-blue-500" />
                                                            <p className="text-xs font-bold text-blue-600">{lawyer.specialization}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Award className="h-3.5 w-3.5 text-amber-500" />
                                                            <p className="text-xs text-slate-600 font-medium">{lawyer.experience}</p>
                                                        </div>
                                                        {lawyer.district && (
                                                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200">
                                                                <MapPin className="h-3.5 w-3.5 text-purple-500" />
                                                                <p className="text-xs font-bold text-purple-600">{lawyer.district}</p>
                                                            </div>
                                                        )}
                                                        {lawyer.email && (
                                                            <div className="flex items-center gap-2">
                                                                <Mail className="h-3.5 w-3.5 text-slate-400" />
                                                                <p className="text-xs text-slate-500 truncate">{lawyer.email}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm shadow-slate-200/50 overflow-hidden">
                            <div className="overflow-x-auto min-h-[400px]">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/70 border-b border-slate-100">
                                            <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest w-12">#</th>
                                            <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Client Name</th>
                                            <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Category</th>
                                            <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                                            <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Time</th>
                                            <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {(activeStage === 'Inquiry' ? columns.pending :
                                            activeStage === 'Verified' ? columns.verified :
                                                activeStage === 'Litigation' ? columns.litigation :
                                                    columns.rejected)
                                            .filter(a => activeCategory === 'All' ? true : (activeCategory === 'Others' ? !['Civil', 'Criminal', 'Family', 'Property'].includes(a.caseCategory) : a.caseCategory === activeCategory))
                                            .map((app, idx) => renderTableRow(app, idx))}
                                    </tbody>
                                </table>
                                {((activeStage === 'Inquiry' && columns.pending.length === 0) ||
                                    (activeStage === 'Verified' && columns.verified.length === 0) ||
                                    (activeStage === 'Litigation' && columns.litigation.length === 0) ||
                                    (activeStage === 'Disposed' && columns.rejected.length === 0)) && (
                                        <div className="py-20 text-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-500">
                                                <Calendar className="h-8 w-8 text-slate-300" />
                                            </div>
                                            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">No records found</h3>
                                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1 italic">Try adjusting your filters or status</p>
                                        </div>
                                    )}
                            </div>
                        </div>
                    )}


                    {activeStage === 'Inquiry' && (
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-8">
                            <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
                                <h3 className="text-base font-black text-slate-900 uppercase tracking-widest">Recent Activity</h3>
                                <button onClick={() => setActiveStage('Verified')} className="text-xs font-bold text-blue-600 uppercase hover:underline">View All Appointments</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <tbody className="divide-y divide-slate-50">
                                        {appointments.slice(0, 5).map((app, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedCase(app)}>
                                                <td className="px-4 md:px-8 py-4">
                                                    <div className="flex items-center gap-3 md:gap-4">
                                                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs md:text-sm font-bold shrink-0">
                                                            {app.fullName.charAt(0)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm md:text-base font-bold text-slate-800 uppercase tracking-tight leading-none truncate max-w-[100px] sx:max-w-[150px] md:max-w-none">{app.fullName}</p>
                                                            <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest mt-1.5 truncate">{app.caseCategory}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 md:px-8 py-4 text-center">
                                                    <span className={`text-[10px] md:text-xs font-black px-2.5 py-1 rounded-full uppercase ${app.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                                                        app.status === 'Rejected' ? 'bg-red-100 text-red-600' :
                                                            'bg-amber-100 text-amber-600'
                                                        }`}>
                                                        {app.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 md:px-8 py-4 text-right whitespace-nowrap">
                                                    <p className="text-xs md:text-sm font-bold text-slate-500">{new Date(app.appointmentDate).toLocaleDateString()}</p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </main>
            </div>
            {selectedCase && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedCase(null)} />
                    <div className="relative w-full sm:max-w-xl md:max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
                        <div className="p-4 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center text-sm sm:text-lg font-black shadow-lg shadow-slate-900/20">
                                    {selectedCase.fullName.charAt(0)}
                                </div>
                                <div className="max-w-[140px] sx:max-w-[200px] sm:max-w-md">
                                    <h3 className="text-xs sm:text-xl font-black text-slate-900 leading-tight truncate">{selectedCase.fullName}</h3>
                                    <p className="text-[8px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">
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
                                    <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border-2 border-slate-100 space-y-10">
                                        <div className="space-y-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                                    <Clock className="h-5 w-5 text-amber-600" />
                                                </div>
                                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">1. Fee Allocation</h4>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm text-sm">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Consultation Fee</p>
                                                    <div className="relative mt-2">
                                                        <IndianRupee className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                                                        <input
                                                            type="number"
                                                            value={consultationFee}
                                                            onChange={(e) => setConsultationFee(e.target.value)}
                                                            className="w-full pl-7 bg-transparent border-none text-2xl font-black text-slate-900 outline-none p-0 placeholder:text-slate-300 pointer-events-auto"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm text-sm">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Due Fee</p>
                                                    <div className="relative mt-2">
                                                        <IndianRupee className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                                                        <input
                                                            type="number"
                                                            value={caseFee}
                                                            onChange={(e) => setCaseFee(e.target.value)}
                                                            className="w-full pl-7 bg-transparent border-none text-2xl font-black text-slate-900 outline-none p-0 placeholder:text-slate-300 pointer-events-auto"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                                    <IndianRupee className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">2. Transaction Details</h4>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between px-1">
                                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Payment Mode</p>
                                                    <span className={`text-[11px] font-black px-3 py-1 rounded-md uppercase tracking-wide transition-all ${paymentMode === 'Cash' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                                        {paymentMode} Selected
                                                    </span>
                                                </div>

                                                <div className="bg-white p-2 rounded-[2.5rem] border-2 border-slate-100 flex gap-2 shadow-inner relative overflow-hidden">
                                                    {[
                                                        { id: 'Cash', icon: Banknote, activeClass: 'bg-emerald-600 text-white shadow-emerald-200' },
                                                        { id: 'Online', icon: Smartphone, activeClass: 'bg-blue-600 text-white shadow-blue-200' }
                                                    ].map((mode) => (
                                                        <button
                                                            key={mode.id}
                                                            onClick={() => setPaymentMode(mode.id)}
                                                            className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[2rem] transition-all duration-500 relative z-10 ${paymentMode === mode.id
                                                                ? `${mode.activeClass} shadow-lg scale-[1.02]`
                                                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                                                }`}
                                                        >
                                                            <mode.icon className={`h-5 w-5 transition-transform duration-500 ${paymentMode === mode.id ? 'scale-110' : ''}`} />
                                                            <span className="text-xs font-black uppercase tracking-widest">{mode.id}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="bg-white p-8 rounded-3xl border border-blue-100 space-y-6">
                                                {paymentMode === 'Cash' && (
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Receipt Number (Optional)</label>
                                                        <input type="text" placeholder="e.g. REC-12345" className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none" />
                                                    </div>
                                                )}
                                                {paymentMode === 'Online' && (
                                                    <div className="space-y-6">
                                                        <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100 flex flex-col items-center gap-6 relative overflow-hidden group">
                                                            <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            <div className="w-48 h-48 bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-xl flex items-center justify-center relative overlow-hidden">
                                                                <img src="/qr-code.png" alt="Payment QR" className="w-full h-full object-contain" />
                                                                <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-500 shadow-[0_0_15px_#3b82f6] animate-[scan_2s_infinite_linear]" />
                                                            </div>
                                                            <div className="text-center relative z-10">
                                                                <p className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] mb-2">Scan QR to Pay</p>
                                                                <p className="text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full border border-blue-100 inline-block">UPI: legal.office@paytm</p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Transaction ID</label>
                                                            <input
                                                                type="text"
                                                                value={transactionId}
                                                                onChange={(e) => setTransactionId(e.target.value)}
                                                                placeholder="Enter Reference Number"
                                                                className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handlePaymentUpdate}
                                        disabled={isProcessing}
                                        className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl disabled:opacity-50"
                                    >
                                        {isProcessing ? 'Processing...' : `Confirm Transaction (${paymentMode})`}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                        <div className="space-y-1.5">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Full Name</p>
                                            <p className="font-bold text-slate-800 text-base">{selectedCase.fullName}</p>
                                        </div>
                                        <div className="space-y-1.5 md:text-right">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Contact</p>
                                            <p className="font-bold text-slate-800 text-base tracking-wide">{selectedCase.phoneNumber}</p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                                            <p className="font-bold text-slate-800 text-base break-all">{selectedCase.emailId}</p>
                                        </div>
                                        <div className="space-y-1.5 md:text-right">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Location</p>
                                            <p className="font-bold text-slate-800 text-base italic">{selectedCase.city}, {selectedCase.state}</p>
                                        </div>
                                        <div className="col-span-1 md:col-span-2 space-y-1.5">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Full Address</p>
                                            <p className="font-bold text-slate-800 text-base italic leading-relaxed">{selectedCase.address}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-900 rounded-3xl text-white shadow-xl shadow-slate-200/50">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-blue-400">
                                                <Calendar className="h-3 w-3" />
                                                <p className="text-[9px] font-black uppercase tracking-[0.15em]">Appt Date</p>
                                            </div>
                                            <p className="text-xs font-black">{new Date(selectedCase.appointmentDate).toDateString()}</p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-indigo-400">
                                                <Clock className="h-3 w-3" />
                                                <p className="text-[9px] font-black uppercase tracking-[0.15em]">Time Slot</p>
                                            </div>
                                            <p className="text-xs font-black uppercase">{selectedCase.timeSlot}</p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-purple-400">
                                                <Smartphone className="h-3 w-3" />
                                                <p className="text-[9px] font-black uppercase tracking-[0.15em]">Visit Type</p>
                                            </div>
                                            <p className="text-xs font-black uppercase">{selectedCase.consultationType || 'Not Specified'}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Returning Client?</p>
                                            <p className="text-sm font-black text-blue-900">{selectedCase.alreadyCome === 'Yes' ? 'YES (VISITED BEFORE)' : 'NO (FIRST TIME)'}</p>
                                        </div>
                                        <div className="p-5 bg-purple-50/50 rounded-2xl border border-purple-100/50">
                                            <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Registration Date</p>
                                            <p className="text-sm font-black text-purple-900">{new Date(selectedCase.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-6">
                                        <div className="flex flex-wrap gap-2.5">
                                            <span className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-wider">{selectedCase.caseCategory}</span>
                                            {selectedCase.otherCategory && (
                                                <span className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-wider">Sub: {selectedCase.otherCategory}</span>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Case Description</p>
                                            <p className="text-slate-600 text-base italic leading-relaxed">"{selectedCase.description}"</p>
                                        </div>
                                        {selectedCase.documentUrl && (
                                            <div className="pt-2">
                                                <a
                                                    href={selectedCase.documentUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100"
                                                >
                                                    <FileText className="h-4 w-4" />
                                                    View Case Document
                                                </a>
                                            </div>
                                        )}

                                        {selectedCase.rejectionReason && (
                                            <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100">
                                                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Rejection Reason</p>
                                                <p className="text-sm text-red-700 font-medium italic">"{selectedCase.rejectionReason}"</p>
                                            </div>
                                        )}

                                        {/* Court Hearing Details Section */}
                                        {(selectedCase.courtHearingDate || selectedCase.currentHearingReport || selectedCase.nextHearingDate) && (
                                            <div className="mt-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200 shadow-lg">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <Briefcase className="h-5 w-5 text-indigo-600" />
                                                    <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest">Court Hearing Details</h4>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                    {selectedCase.courtHearingDate && (
                                                        <div className="p-4 bg-white rounded-xl border border-indigo-100">
                                                            <div className="flex items-center gap-2 text-indigo-600 mb-1">
                                                                <Calendar className="h-3 w-3" />
                                                                <p className="text-[9px] font-black uppercase tracking-[0.15em]">Court Hearing Date</p>
                                                            </div>
                                                            <p className="text-sm font-black text-slate-800">
                                                                {new Date(selectedCase.courtHearingDate).toLocaleDateString('en-IN', { 
                                                                    weekday: 'short', 
                                                                    year: 'numeric', 
                                                                    month: 'short', 
                                                                    day: 'numeric' 
                                                                })}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {selectedCase.nextHearingDate && (
                                                        <div className="p-4 bg-white rounded-xl border border-indigo-100">
                                                            <div className="flex items-center gap-2 text-indigo-600 mb-1">
                                                                <Calendar className="h-3 w-3" />
                                                                <p className="text-[9px] font-black uppercase tracking-[0.15em]">Next Hearing Date</p>
                                                            </div>
                                                            <p className="text-sm font-black text-slate-800">
                                                                {new Date(selectedCase.nextHearingDate).toLocaleDateString('en-IN', { 
                                                                    weekday: 'short', 
                                                                    year: 'numeric', 
                                                                    month: 'short', 
                                                                    day: 'numeric' 
                                                                })}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                {selectedCase.currentHearingReport && (
                                                    <div className="p-4 bg-white rounded-xl border border-indigo-100">
                                                        <div className="flex items-center gap-2 text-indigo-600 mb-2">
                                                            <FileText className="h-3 w-3" />
                                                            <p className="text-[9px] font-black uppercase tracking-[0.15em]">Current Hearing Report</p>
                                                        </div>
                                                        <p className="text-sm text-slate-700 leading-relaxed italic">
                                                            "{selectedCase.currentHearingReport}"
                                                        </p>
                                                    </div>
                                                )}
                                                
                                                {/* Update Information */}
                                                {selectedCase.hearingUpdatedBy && (
                                                    <div className="mt-4 p-4 bg-indigo-100/50 rounded-xl border border-indigo-200">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="text-[9px] font-black text-indigo-700 uppercase tracking-[0.15em] mb-1">Updated By</p>
                                                                <p className="text-sm font-bold text-indigo-900">
                                                                    {(() => {
                                                                        const updatingLawyer = lawyers.find(l => l.id === selectedCase.hearingUpdatedBy);
                                                                        return updatingLawyer ? updatingLawyer.name : 'Lawyer';
                                                                    })()}
                                                                </p>
                                                                <p className="text-xs text-indigo-600 mt-1">
                                                                    District: {selectedCase.city}
                                                                </p>
                                                            </div>
                                                            {selectedCase.hearingUpdatedAt && (
                                                                <div className="text-right">
                                                                    <p className="text-[9px] font-black text-indigo-700 uppercase tracking-[0.15em] mb-1">Updated On</p>
                                                                    <p className="text-xs font-bold text-indigo-900">
                                                                        {new Date(selectedCase.hearingUpdatedAt).toLocaleDateString('en-IN', {
                                                                            day: 'numeric',
                                                                            month: 'short',
                                                                            year: 'numeric'
                                                                        })}
                                                                    </p>
                                                                    <p className="text-[10px] text-indigo-600 mt-0.5">
                                                                        {new Date(selectedCase.hearingUpdatedAt).toLocaleTimeString('en-IN', {
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        })}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {showRejectionForm && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="space-y-1.5 text-left">
                                                <label className="text-[10px] font-black text-red-600 uppercase tracking-widest ml-1">Reason for Rejection</label>
                                                <textarea
                                                    value={localRejectionReason}
                                                    onChange={(e) => setLocalRejectionReason(e.target.value)}
                                                    placeholder="Please explain why you are rejecting this appointment..."
                                                    className="w-full px-5 py-4 bg-white border-2 border-red-100 rounded-2xl text-sm font-medium outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 min-h-[120px] transition-all"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {selectedCase.status === 'Pending' && !showRejectionForm && (
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Available Lawyers</p>
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
                                            <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest">Track Case Progress</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                {['Stage 1', 'Stage 2', 'Stage 3', 'Final Verdict'].map(stg => (
                                                    <button
                                                        key={stg}
                                                        onClick={() => handleUpdateStage(stg)}
                                                        className={`py-4 rounded-xl text-xs font-black uppercase transition-all shadow-sm ${selectedCase.caseStage === stg ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
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

                        <div className="p-6 sm:p-8 border-t border-slate-100 bg-white flex gap-3 sm:gap-4">
                            {selectedCase.status === 'Pending' ? (
                                showRejectionForm ? (
                                    <>
                                        <button
                                            onClick={() => { setShowRejectionForm(false); setLocalRejectionReason(''); }}
                                            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[11px] uppercase tracking-widest border border-slate-200"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(selectedCase.id, 'Rejected', localRejectionReason)}
                                            disabled={isProcessing || !localRejectionReason.trim()}
                                            className="flex-[2] py-4 bg-red-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setShowRejectionForm(true)}
                                            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[11px] uppercase tracking-widest border border-slate-200"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(selectedCase.id, 'Approved')}
                                            disabled={isProcessing}
                                            className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                                        >
                                            {isProcessing ? 'Approving...' : 'Approve Request'}
                                        </button>
                                    </>
                                )
                            ) : (
                                <button onClick={() => { setSelectedCase(null); setShowRejectionForm(false); }} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all">Close Viewer</button>
                            )}
                        </div>
                    </div>
                </div>
            )
            }
            
            {/* District Details Modal */}
            {selectedDistrict && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedDistrict(null)} />
                    <div className="relative w-full sm:max-w-4xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
                        {/* Header */}
                        <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-600">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg">
                                    <MapPin className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white leading-tight">
                                        {selectedDistrict.district}
                                    </h3>
                                    <p className="text-sm font-bold text-white/80 italic">
                                        {selectedDistrict.state}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedDistrict(null)} 
                                className="p-2.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-white hover:bg-white/30 transition-colors shadow-sm"
                            >
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 scrollbar-hide">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Total Appointments</p>
                                    <p className="text-3xl font-black text-indigo-600">{selectedDistrict.appointments.length}</p>
                                </div>
                                <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100">
                                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">Case Categories</p>
                                    <p className="text-3xl font-black text-purple-600">
                                        {Array.from(new Set(selectedDistrict.appointments.map(a => a.caseCategory))).length}
                                    </p>
                                </div>
                                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Assigned Cases</p>
                                    <p className="text-3xl font-black text-emerald-600">
                                        {selectedDistrict.appointments.filter(a => a.caseId).length}
                                    </p>
                                </div>
                            </div>

                            {/* Appointment Details Section */}
                            <div className="bg-white rounded-2xl border-2 border-slate-100 shadow-sm overflow-hidden">
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                            <Calendar className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Appointment Details</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                All scheduled appointments in this district
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                                <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-12">#</th>
                                                <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Name</th>
                                                <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                                                <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                                                <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                                <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {selectedDistrict.appointments.map((app, idx) => (
                                                <tr
                                                    key={app.id}
                                                    onClick={() => {
                                                        setSelectedCase(app);
                                                        setSelectedDistrict(null);
                                                    }}
                                                    className="group hover:bg-blue-50/50 transition-colors cursor-pointer"
                                                >
                                                    <td className="py-4 px-6 text-sm font-medium text-slate-400">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600">
                                                                {app.fullName.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-700 uppercase tracking-tight">
                                                                    {app.fullName}
                                                                </p>
                                                                <p className="text-[9px] text-slate-400 font-bold">
                                                                    {app.emailId}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <p className="text-sm font-bold text-slate-600">{app.phoneNumber}</p>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-700">
                                                                {new Date(app.appointmentDate).toLocaleDateString()}
                                                            </span>
                                                            <span className="text-xs text-slate-500 font-medium uppercase">
                                                                {app.timeSlot}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wider">
                                                            {app.consultationType}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <span className="text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider bg-emerald-100 text-emerald-600">
                                                            {app.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Case Details Section */}
                            <div className="bg-white rounded-2xl border-2 border-slate-100 shadow-sm overflow-hidden">
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                            <FileText className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Case Details</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                All case information for appointments in this district
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    {selectedDistrict.appointments.map((app, idx) => (
                                        <div
                                            key={app.id}
                                            onClick={() => {
                                                setSelectedCase(app);
                                                setSelectedDistrict(null);
                                            }}
                                            className="bg-slate-50 rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-600">
                                                        {app.fullName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                                            {app.fullName}
                                                        </p>
                                                        <p className="text-xs text-slate-500 font-bold">
                                                            {app.phoneNumber}
                                                        </p>
                                                    </div>
                                                </div>
                                                {app.caseId && (
                                                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md">
                                                        {app.caseId}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Case Category</p>
                                                    <span className="text-sm font-bold text-slate-700 bg-white px-3 py-1 rounded-md border border-slate-200 inline-block">
                                                        {app.caseCategory}
                                                    </span>
                                                    {app.otherCategory && (
                                                        <span className="text-xs font-bold text-slate-600 ml-2 italic">
                                                            ({app.otherCategory})
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fees</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-slate-600">
                                                            Consult: ₹{app.consultationFee || 0}
                                                        </span>
                                                        <span className="text-xs font-bold text-slate-600">
                                                            Case: ₹{app.caseFee || 0}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Case Description</p>
                                                <p className="text-sm text-slate-600 italic leading-relaxed line-clamp-2">
                                                    {app.description}
                                                </p>
                                            </div>
                                            {app.documentUrl && (
                                                <div className="mt-3 pt-3 border-t border-slate-200">
                                                    <a
                                                        href={app.documentUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center gap-2 text-xs font-black text-blue-600 hover:text-blue-700"
                                                    >
                                                        <FileText className="h-4 w-4" />
                                                        View Document
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-white">
                            <button
                                onClick={() => setSelectedDistrict(null)}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all shadow-lg"
                            >
                                Close District View
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Add User Success Modal */}
            {showUserSuccess && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className="p-10 text-center bg-gradient-to-br from-emerald-50 to-blue-50">
                            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
                                <CheckCircle2 className="h-10 w-10" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight">Your account has been created successfully.</h3>
                            
                            <div className="mt-8 bg-white rounded-2xl border-2 border-slate-200 p-6 space-y-4 shadow-inner">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Username:</span>
                                    <span className="text-xl font-black text-blue-600 font-mono">{generatedCredentials.username}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Password:</span>
                                    <span className="text-xl font-black text-emerald-600 font-mono">{generatedCredentials.password}</span>
                                </div>
                            </div>

                            <p className="text-xs text-slate-500 font-medium mt-6 italic">
                                Please save these credentials. The lawyer can now login using these details.
                            </p>
                            
                            <button
                                onClick={() => {
                                    setShowUserSuccess(false);
                                    setGeneratedCredentials({ username: '', password: '' });
                                }}
                                className="w-full mt-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-200"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
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
