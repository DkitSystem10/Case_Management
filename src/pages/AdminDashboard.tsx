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
    getClientAppointments,
    updateClientAppointmentStatus,
    type AppointmentRecord,
    type Lawyer,
    type PaymentRecord,
    type ClientAppointmentRecord
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
    Save,
    Building2,
    Flag,
    Video,
    Gavel,
    UserCircle,
    Camera
} from 'lucide-react';
import LegalLogo from '../components/LegalLogo';

const AdminDashboard: React.FC = () => {
    const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
    const [clientAppointments, setClientAppointments] = useState<ClientAppointmentRecord[]>([]);
    const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedCase, setSelectedCase] = useState<AppointmentRecord | null>(null);
    const [selectedClientAppointment, setSelectedClientAppointment] = useState<ClientAppointmentRecord | null>(null);
    const [lawyers, setLawyers] = useState<Lawyer[]>([]);
    const [selectedLawyerId, setSelectedLawyerId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [appliedDate] = useState('');
    const [activeStage, setActiveStage] = useState<'Inquiry' | 'Verified' | 'Payment' | 'Litigation' | 'History' | 'Disposed' | 'Directory' | 'Districts' | 'Settings' | 'HearingDates' | 'ClientAppointments' | 'Profile'>('Inquiry');
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
    
    // Admin Profile State
    const [adminProfile, setAdminProfile] = useState<{
        name: string;
        email: string;
        profileImage: string;
    }>(() => {
        const saved = localStorage.getItem('admin_profile');
        return saved ? JSON.parse(saved) : {
            name: 'Admin',
            email: import.meta.env.VITE_ADMIN_USER || 'admin',
            profileImage: ''
        };
    });
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
    
    // Calculate Notifications
    const notifications = React.useMemo(() => {
        const notifs: Array<{
            id: string;
            type: 'lawyer_update' | 'hearing_tomorrow' | 'client_appointment';
            title: string;
            message: string;
            date: string;
            appointmentId?: string;
            lawyerName?: string;
            clientAppointmentId?: string;
        }> = [];

        // Client Appointment Requests - Pending approvals
        clientAppointments
            .filter(app => app.status === 'Pending')
            .sort((a, b) => {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return dateB - dateA;
            })
            .slice(0, 10) // Latest 10 requests
            .forEach(app => {
                const createdDate = new Date(app.createdAt);
                
                notifs.push({
                    id: `client-appt-${app.id}-${app.createdAt}`,
                    type: 'client_appointment',
                    title: 'New Appointment Request',
                    message: `${app.fullName} - ${app.caseCategory} - Wait for approval`,
                    date: createdDate.toISOString(),
                    clientAppointmentId: app.id
                });
            });

        // Lawyer Updates - Recent hearing updates from lawyers
        appointments
            .filter(app => app.hearingUpdatedBy && app.hearingUpdatedAt)
            .sort((a, b) => {
                const dateA = new Date(a.hearingUpdatedAt || '').getTime();
                const dateB = new Date(b.hearingUpdatedAt || '').getTime();
                return dateB - dateA;
            })
            .slice(0, 10) // Latest 10 updates
            .forEach(app => {
                const lawyer = lawyers.find(l => l.id === app.hearingUpdatedBy);
                const lawyerName = lawyer?.name || 'Lawyer';
                const updateDate = app.hearingUpdatedAt ? new Date(app.hearingUpdatedAt) : new Date();
                if (!app.hearingUpdatedAt) return; // Skip if no update date
                
                notifs.push({
                    id: `update-${app.id}-${app.hearingUpdatedAt}`,
                    type: 'lawyer_update',
                    title: `${lawyerName} updated hearing`,
                    message: `Case: ${app.caseId || app.fullName} - ${app.currentHearingReport || 'Hearing details updated'}`,
                    date: updateDate.toISOString(),
                    appointmentId: app.id,
                    lawyerName: lawyerName
                });
            });

        // Tomorrow's Hearings
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const tomorrowEnd = new Date(tomorrow);
        tomorrowEnd.setHours(23, 59, 59, 999);

        appointments
            .filter(app => {
                const hearingDate = app.nextHearingDate || app.courtHearingDate;
                if (!hearingDate) return false;
                const date = new Date(hearingDate);
                return date >= tomorrow && date <= tomorrowEnd;
            })
            .forEach(app => {
                const hearingDate = app.nextHearingDate || app.courtHearingDate;
                if (!hearingDate) return; // Skip if no hearing date
                const date = new Date(hearingDate);
                
                notifs.push({
                    id: `hearing-${app.id}-${hearingDate}`,
                    type: 'hearing_tomorrow',
                    title: 'Hearing Tomorrow',
                    message: `Case: ${app.caseId || app.fullName} - ${date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}`,
                    date: date.toISOString(),
                    appointmentId: app.id
                });
            });

        // Sort by date (newest first)
        return notifs.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA;
        });
    }, [appointments, lawyers, clientAppointments]);
    
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
            const [appData, clientAppData, lawyerData, payData] = await Promise.all([
                getAppointments(),
                getClientAppointments(),
                getLawyers(),
                getPaymentHistory()
            ]);
            setAppointments(appData);
            setClientAppointments(clientAppData);
            setLawyers(lawyerData);
            setPaymentHistory(payData);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClientAppointmentStatusUpdate = async (id: string, status: 'Approved' | 'Rejected', reason?: string) => {
        if (!selectedClientAppointment) return;

        if (status === 'Approved' && !selectedLawyerId) {
            alert('Please select a lawyer before approving.');
            return;
        }

        setIsProcessing(true);
        try {
            if (status === 'Approved') {
                const lawyer = lawyers.find(l => l.id === selectedLawyerId);
                
                // Generate case ID
                const category = selectedClientAppointment.caseCategory;
                const prefixMap: Record<string, string> = {
                    'Civil': 'CIV',
                    'Criminal': 'CRI',
                    'Family': 'FAM',
                    'Property': 'PRO',
                    'Corporate': 'COR',
                    'Labour': 'LAB',
                    'Tax': 'TAX'
                };
                const prefix = prefixMap[category] || 'OTH';

                const allAppointments = [...appointments, ...clientAppointments];
                const existingCategoryIds = allAppointments
                    .filter(a => a.caseId && a.caseId.startsWith(prefix))
                    .map(a => {
                        const parts = a.caseId!.split('-');
                        return parts.length > 1 ? parseInt(parts[1]) : 0;
                    });

                const nextNum = existingCategoryIds.length > 0 ? Math.max(...existingCategoryIds) + 1 : 1;
                const uniqueCaseId = `${prefix}-${String(nextNum).padStart(3, '0')}`;

                // Update client appointment with status, lawyer, and case ID
                await updateClientAppointmentStatus(id, status);
                
                // If needed, you can also update lawyer_id and case_id here
                // For now, we'll just update the status
                // You may need to add a function to update lawyer_id and case_id in client_appointments table

                await sendApprovalEmail({
                    toEmail: selectedClientAppointment.emailId,
                    fullName: selectedClientAppointment.fullName,
                    appointmentDate: selectedClientAppointment.appointmentDate,
                    timeSlot: selectedClientAppointment.timeSlot,
                    consultationType: selectedClientAppointment.consultationType === 'Online (Video)' ? 'Online' : selectedClientAppointment.consultationType,
                    lawyerName: lawyer?.name,
                    caseId: uniqueCaseId
                });
            } else {
                await updateClientAppointmentStatus(id, status, reason);
            }

            await loadData();
            setSelectedClientAppointment(null);
            setSelectedLawyerId('');
            setLocalRejectionReason('');
            setShowRejectionForm(false);
        } catch (error) {
            console.error('Failed to update client appointment status:', error);
            alert('Operation failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleStatusUpdate = async (id: string, status: 'Approved' | 'Rejected', reason?: string) => {
        if (!selectedCase) return;

        if (status === 'Approved' && !selectedLawyerId && !selectedCase.assignedAdvocate) {
            alert('Please select a lawyer or ensure an advocate is assigned before approving.');
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
                <>
                    <div
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                    {/* Mobile Sidebar Panel */}
                    <aside className={`fixed md:hidden top-0 left-0 h-screen z-[70] transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-[80px] bg-[#222834] flex flex-col items-center py-3`}>
                        <div className="mb-4">
                            <div className="bg-blue-600/10 p-1 rounded-md">
                                <LegalLogo className="h-3.5 w-3.5 text-blue-500" />
                            </div>
                        </div>

                        <nav className="flex-1 w-full space-y-2">
                            {[
                                { id: 'Inquiry', label: 'Dashboard', icon: LayoutDashboard, color: 'bg-blue-500' },
                                { id: 'ClientAppointments', label: 'Client Requests', icon: UserPlus, color: 'bg-indigo-500' },
                                { id: 'Verified', label: 'Appointments', icon: ListTodo, color: 'bg-purple-500' },
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
                                    className={`w-full flex flex-col items-center py-1.5 relative transition-all group ${activeStage === item.id ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
                                >
                                    {activeStage === item.id && (
                                        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-blue-500 shadow-[2px_0_8px_rgba(59,130,246,0.5)]" />
                                    )}

                                    <div className={`w-7 h-7 ${item.color} rounded-lg flex items-center justify-center mb-0.5 shadow-md group-active:scale-95 transition-transform`}>
                                        <item.icon className="h-3 w-3 text-white" />
                                    </div>

                                    <span className="text-[8px] font-bold text-white/90 tracking-tight leading-none text-center px-0.5">{item.label}</span>
                                </button>
                            ))}
                        </nav>
                    </aside>
                </>
            )}

            {/* Left Sidebar - Hidden on Mobile */}
            <aside className={`hidden md:flex fixed md:sticky top-0 h-screen z-[70] transition-all duration-300 w-[100px] bg-[#222834] flex-col items-center py-5`}>
                <div className="mb-6">
                    <div className="bg-blue-600/10 p-1.5 rounded-lg">
                        <LegalLogo className="h-5 w-5 text-blue-500" />
                    </div>
                </div>

                <nav className="flex-1 w-full space-y-3">
                    {[
                        { id: 'Inquiry', label: 'Dashboard', icon: LayoutDashboard, color: 'bg-blue-500' },
                        { id: 'ClientAppointments', label: 'Client Requests', icon: UserPlus, color: 'bg-indigo-500' },
                        { id: 'Verified', label: 'Appointments', icon: ListTodo, color: 'bg-purple-500' },
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

                            <span className="text-[11px] font-bold text-white/90 tracking-tight leading-none text-center px-0.5">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="min-h-[70px] sm:h-[70px] bg-white/50 backdrop-blur-sm border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 px-3 sm:px-4 md:px-6 py-2 sm:py-0 sticky top-0 z-40">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-0.5 -ml-0.5 text-slate-400 hover:text-slate-600 md:hidden flex-shrink-0"
                        >
                            <Menu className="h-3.5 w-3.5" />
                        </button>

                        {activeStage !== 'Inquiry' && (
                            <button
                                onClick={() => setActiveStage('Inquiry')}
                                className="flex items-center gap-1 px-2 py-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all group flex-shrink-0"
                            >
                                <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest hidden xs:inline">Back</span>
                            </button>
                        )}

                        <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-black text-slate-900 tracking-tight truncate min-w-0">
                            {activeStage === 'History' ? 'Payment' :
                                activeStage === 'Inquiry' ? 'Dashboard' :
                                    activeStage === 'ClientAppointments' ? (
                                        <>
                                            <span className="hidden sm:inline">Client Appointment Requests</span>
                                            <span className="sm:hidden">Client Requests</span>
                                        </>
                                    ) :
                                        activeStage === 'Verified' ? (
                                            <>
                                                <span className="hidden sm:inline">Approved Appointments</span>
                                                <span className="sm:hidden">Appointments</span>
                                            </>
                                        ) :
                                            activeStage === 'Districts' ? 'Lawyer Updates' :
                                                activeStage === 'Directory' ? (
                                                    <>
                                                        <span className="hidden sm:inline">Lawyers Details</span>
                                                        <span className="sm:hidden">Lawyers</span>
                                                    </>
                                                ) :
                                                    activeStage === 'Disposed' ? 'Rejected Cases' :
                                                        activeStage === 'Litigation' ? 'Ongoing Cases' :
                                                            activeStage === 'Settings' ? (
                                                                <>
                                                                    <span className="hidden sm:inline">Settings & User Management</span>
                                                                    <span className="sm:hidden">Settings</span>
                                                                </>
                                                            ) :
                                                                activeStage === 'Profile' ? (
                                                                    <>
                                                                    <span className="hidden sm:inline">User Settings</span>
                                                                    <span className="sm:hidden">Settings</span>
                                                                    </>
                                                                ) :
                                                                    activeStage}
                        </h1>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
                        {/* Search Bar - Always Visible */}
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className="w-[140px] sm:w-[180px] md:w-[240px] pl-9 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-full text-[10px] sm:text-xs font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                            />
                        </div>

                        {/* Schedule Appointment Button - Always Visible */}
                        <button
                            onClick={() => navigate('/appointment')}
                            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 lg:px-5 py-1.5 sm:py-2 md:py-2.5 bg-blue-600 text-white rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] md:text-xs font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 whitespace-nowrap"
                        >
                            <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                            <span className="hidden lg:inline">Schedule Appointment</span>
                            <span className="hidden sm:inline lg:hidden">Schedule</span>
                            <span className="sm:hidden">Appt</span>
                        </button>

                        <div className="flex items-center gap-1 sm:gap-2 border-l border-slate-200 pl-2 sm:pl-4">
                            <div className="relative">
                                <button 
                                    onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                                    className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all relative"
                                >
                                    <Bell className="h-4 w-4" />
                                    {notifications.length > 0 && (
                                        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-1.5 h-1.5 bg-red-500 border-2 border-white rounded-full" />
                                    )}
                                    {notifications.length > 0 && (
                                        <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white">
                                            {notifications.length > 9 ? '9+' : notifications.length}
                                        </div>
                                    )}
                                </button>

                                {/* Notification Dropdown */}
                                {showNotificationDropdown && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-50" 
                                            onClick={() => setShowNotificationDropdown(false)}
                                        />
                                        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-[60] max-h-[500px] flex flex-col">
                                            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-sm font-black text-slate-900">Notifications</h3>
                                                    {notifications.length > 0 && (
                                                        <span className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded-full">
                                                            {notifications.length} new
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="overflow-y-auto flex-1">
                                                {notifications.length === 0 ? (
                                                    <div className="p-8 text-center">
                                                        <Bell className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                                        <p className="text-sm font-bold text-slate-500">No notifications</p>
                                                        <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
                                                    </div>
                                                ) : (
                                                    <div className="divide-y divide-slate-100">
                                                        {notifications.map((notif) => (
                                                            <div
                                                                key={notif.id}
                                                                className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                                                                onClick={() => {
                                                                    if (notif.appointmentId) {
                                                                        const app = appointments.find(a => a.id === notif.appointmentId);
                                                                        if (app) {
                                                                            setSelectedCase(app);
                                                                            setActiveStage('Litigation');
                                                                        }
                                                                    } else if (notif.clientAppointmentId) {
                                                                        const clientApp = clientAppointments.find(a => a.id === notif.clientAppointmentId);
                                                                        if (clientApp) {
                                                                            setSelectedClientAppointment(clientApp);
                                                                            setActiveStage('ClientAppointments');
                                                                        }
                                                                    }
                                                                    setShowNotificationDropdown(false);
                                                                }}
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                                        notif.type === 'lawyer_update' 
                                                                            ? 'bg-blue-100' 
                                                                            : notif.type === 'hearing_tomorrow'
                                                                            ? 'bg-amber-100'
                                                                            : 'bg-indigo-100'
                                                                    }`}>
                                                                        {notif.type === 'lawyer_update' ? (
                                                                            <FileText className="h-5 w-5 text-blue-600" />
                                                                        ) : notif.type === 'hearing_tomorrow' ? (
                                                                            <Calendar className="h-5 w-5 text-amber-600" />
                                                                        ) : (
                                                                            <UserPlus className="h-5 w-5 text-indigo-600" />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-black text-slate-900 mb-1">
                                                                            {notif.title}
                                                                        </p>
                                                                        <p className="text-xs font-medium text-slate-600 line-clamp-2 mb-2">
                                                                            {notif.message}
                                                                        </p>
                                                                        <div className="flex items-center gap-2">
                                                                            <Clock className="h-3 w-3 text-slate-400" />
                                                                            <span className="text-[10px] font-bold text-slate-400">
                                                                                {new Date(notif.date).toLocaleString('en-IN', {
                                                                                    day: 'numeric',
                                                                                    month: 'short',
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit'
                                                                                })}
                                                                            </span>
                                                                            {notif.lawyerName && (
                                                                                <>
                                                                                    <span className="text-[10px] text-slate-300">•</span>
                                                                                    <span className="text-[10px] font-bold text-blue-600">
                                                                                        {notif.lawyerName}
                                                                                    </span>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="relative flex items-center gap-1.5 sm:gap-2.5 ml-0 sm:ml-1">
                                <div className="hidden lg:block text-right">
                                    <p className="text-xs font-black text-slate-900 leading-none">{adminProfile.name || 'Admin User'}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Super Admin</p>
                                </div>
                                <button
                                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer"
                                >
                                    {adminProfile.profileImage ? (
                                        <img 
                                            src={adminProfile.profileImage} 
                                            alt="Profile" 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <UserCircle className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                                    )}
                                </button>

                                {/* Profile Dropdown Menu */}
                                {showProfileDropdown && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-50" 
                                            onClick={() => setShowProfileDropdown(false)}
                                        />
                                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-[60]">
                                            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                                                        {adminProfile.profileImage ? (
                                                            <img 
                                                                src={adminProfile.profileImage} 
                                                                alt="Profile" 
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <UserCircle className="h-6 w-6 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-black text-slate-900 truncate">{adminProfile.name || 'Admin User'}</p>
                                                        <p className="text-xs font-bold text-slate-500 truncate">{adminProfile.email || 'admin@example.com'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="py-2">
                                                <button
                                                    onClick={() => {
                                                        setActiveStage('Profile');
                                                        setShowProfileDropdown(false);
                                                    }}
                                                    className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors text-sm font-bold text-slate-700"
                                                >
                                                    <UserCircle className="h-4 w-4 text-slate-500" />
                                                    <span>View Profile</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setActiveStage('Settings');
                                                        setShowProfileDropdown(false);
                                                    }}
                                                    className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors text-sm font-bold text-slate-700"
                                                >
                                                    <Settings className="h-4 w-4 text-slate-500" />
                                                    <span>Settings</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowProfileDropdown(false);
                                                        handleLogout();
                                                    }}
                                                    className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-red-50 transition-colors text-sm font-bold text-red-600"
                                                >
                                                    <LogOut className="h-4 w-4" />
                                                    <span>Logout</span>
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="p-3 sm:p-4 md:p-6 overflow-x-hidden">
                    {activeStage === 'Inquiry' && (
                        <>
                            {/* Top Cards Row */}
                            <div className="overflow-x-auto -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 mb-6 sm:mb-8">
                                <div className="grid grid-cols-5 min-w-[900px] sm:min-w-0 gap-3 sm:gap-4">
                                    {[
                                        { 
                                            id: 'ClientAppointments', 
                                            label: 'Client Requests', 
                                            value: clientAppointments.filter(a => a.status === 'Pending').length, 
                                            icon: UserPlus, 
                                            color: 'text-indigo-600', 
                                            bg: 'bg-indigo-50',
                                            description: 'Pending appointment requests from clients'
                                        },
                                        { 
                                            id: 'Verified', 
                                            label: 'Appointments', 
                                            value: appointments.length, 
                                            icon: ListTodo, 
                                            color: 'text-blue-600', 
                                            bg: 'bg-blue-50',
                                            description: 'All approved appointment bookings'
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
                                            className="bg-white p-2.5 sm:p-5 md:p-6 rounded-lg sm:rounded-xl md:rounded-2xl border-2 border-slate-100 shadow-sm hover:border-blue-300 hover:shadow-lg transition-all active:scale-95 group/stat text-left"
                                        >
                                            <div className="flex items-start justify-between mb-2 sm:mb-3 md:mb-4">
                                                <div className={`w-7 h-7 sm:w-10 md:w-12 sm:h-10 md:h-12 ${stat.bg} ${stat.color} rounded-md sm:rounded-lg md:rounded-xl flex items-center justify-center group-hover/stat:scale-110 transition-transform flex-shrink-0`}>
                                                    <stat.icon className="h-3.5 w-3.5 sm:h-5 md:h-6 sm:w-5 md:w-6" />
                                                </div>
                                            </div>
                                            <p className="text-[7px] sm:text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 sm:mb-1.5 md:mb-2 leading-tight">{stat.label}</p>
                                            <p className="text-base sm:text-2xl md:text-3xl font-black text-slate-900 mb-1 sm:mb-1.5 md:mb-2 leading-tight">{stat.value}</p>
                                            <p className="text-[6px] sm:text-[9px] md:text-[10px] text-slate-500 font-medium leading-tight line-clamp-2">{stat.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dashboard Content Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
                                {/* Summary Section */}
                                <div className="lg:col-span-1 bg-gradient-to-br from-white to-slate-50 rounded-2xl sm:rounded-3xl border-2 border-slate-200 shadow-lg p-5 sm:p-6">
                                    <div className="flex items-center justify-between mb-5 sm:mb-6">
                                        <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">Summary</h3>
                                        <button className="text-slate-400 hover:text-slate-600">
                                            <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Total Revenue', value: `₹${(appointments.reduce((sum, a) => sum + (a.totalFee || a.consultationFee || 0) + (a.caseFee || 0), 0) + paymentHistory.reduce((sum, p) => sum + p.amount, 0)).toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-emerald-600' },
                                            { label: 'Lawyers', value: lawyers.length.toString(), icon: User, color: 'text-blue-600' },
                                            { label: 'Transactions', value: paymentHistory.length.toString(), icon: CreditCard, color: 'text-purple-600' },
                                            { label: 'Average Fee', value: `₹${appointments.length > 0 ? Math.round((appointments.reduce((sum, a) => sum + (a.totalFee || a.consultationFee || 0) + (a.caseFee || 0), 0)) / appointments.length).toLocaleString('en-IN') : 0}`, icon: IndianRupee, color: 'text-amber-600' },
                                            { label: 'Appointments', value: (appointments.length + clientAppointments.filter(a => a.status === 'Approved').length).toString(), icon: Calendar, color: 'text-indigo-600' },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg ${item.color.replace('text-', 'bg-').replace('-600', '-100')} ${item.color} flex items-center justify-center`}>
                                                        <item.icon className="h-4 w-4" />
                                                    </div>
                                                    <span className="text-xs sm:text-sm font-bold text-slate-600">{item.label}</span>
                                                </div>
                                                <span className="text-sm sm:text-base font-black text-slate-900">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Chart Section - Lawyers, Clients & Districts */}
                                <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
                                    {/* Professional Header */}
                                    <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 px-6 py-5 border-b border-slate-200">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                                <Building2 className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">Overview Chart</h3>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Key Metrics Visualization</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-6 sm:p-8">
                                        {/* Pie Chart Visualization */}
                                        {(() => {
                                            // Calculate metrics
                                            const totalLawyers = lawyers.length;
                                            const totalClients = appointments.length + clientAppointments.filter(a => a.status === 'Approved').length;
                                            
                                            // Count unique districts
                                            const districtSet = new Set<string>();
                                            appointments.forEach(app => {
                                                const district = app.city || 'Unknown';
                                                if (district !== 'Unknown') districtSet.add(district);
                                            });
                                            clientAppointments.filter(a => a.status === 'Approved').forEach(app => {
                                                const district = app.district || 'Unknown';
                                                if (district !== 'Unknown') districtSet.add(district);
                                            });
                                            const totalDistricts = districtSet.size;
                                            
                                            // Data for pie chart (3 segments)
                                            const chartData = [
                                                { label: 'Lawyers', value: totalLawyers, color: '#3B82F6' },
                                                { label: 'Clients', value: totalClients, color: '#10B981' },
                                                { label: 'Districts', value: totalDistricts, color: '#F59E0B' },
                                            ];
                                            
                                            const total = totalLawyers + totalClients + totalDistricts;
                                            
                                            return (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                                                    {/* Left Side - Chart + Stats */}
                                                    <div>
                                                        {/* Doughnut Chart */}
                                                        <div className="flex items-center justify-center py-4 mb-6">
                                                            {total === 0 ? (
                                                                <div className="w-56 h-56 rounded-full border-8 border-slate-200 flex items-center justify-center bg-slate-50">
                                                                    <div className="text-center">
                                                                        <FileText className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                                                                        <p className="text-sm font-bold text-slate-400">No Data Available</p>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="relative w-56 h-56 sm:w-64 sm:h-64">
                                                                    <svg viewBox="0 0 200 200" className="transform -rotate-90 w-full h-full">
                                                                        {chartData.reduce((acc, item) => {
                                                                            const startAngle = acc.currentAngle;
                                                                            const percentage = (item.value / total) * 100;
                                                                            const angle = (percentage / 100) * 360;
                                                                            const largeArcFlag = angle > 180 ? 1 : 0;
                                                                            
                                                                            // Outer circle (full radius)
                                                                            const outerRadius = 90;
                                                                            // Inner circle (doughnut hole)
                                                                            const innerRadius = 50;
                                                                            
                                                                            // Outer arc points
                                                                            const outerX1 = 100 + outerRadius * Math.cos((startAngle * Math.PI) / 180);
                                                                            const outerY1 = 100 + outerRadius * Math.sin((startAngle * Math.PI) / 180);
                                                                            const outerX2 = 100 + outerRadius * Math.cos(((startAngle + angle) * Math.PI) / 180);
                                                                            const outerY2 = 100 + outerRadius * Math.sin(((startAngle + angle) * Math.PI) / 180);
                                                                            
                                                                            // Inner arc points
                                                                            const innerX1 = 100 + innerRadius * Math.cos(((startAngle + angle) * Math.PI) / 180);
                                                                            const innerY1 = 100 + innerRadius * Math.sin(((startAngle + angle) * Math.PI) / 180);
                                                                            const innerX2 = 100 + innerRadius * Math.cos((startAngle * Math.PI) / 180);
                                                                            const innerY2 = 100 + innerRadius * Math.sin((startAngle * Math.PI) / 180);
                                                                            
                                                                            // Doughnut path (creates a ring segment)
                                                                            const pathData = `
                                                                                M ${outerX1} ${outerY1}
                                                                                A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerX2} ${outerY2}
                                                                                L ${innerX1} ${innerY1}
                                                                                A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerX2} ${innerY2}
                                                                                Z
                                                                            `;
                                                                            
                                                                            acc.segments.push(
                                                                                <g key={item.label} className="group cursor-pointer">
                                                                                    <path
                                                                                        d={pathData}
                                                                                        fill={item.color}
                                                                                        stroke="white"
                                                                                        strokeWidth="4"
                                                                                        className="transition-all hover:opacity-80"
                                                                                    />
                                                                                </g>
                                                                            );
                                                                            
                                                                            acc.currentAngle += angle;
                                                                            return acc;
                                                                        }, { currentAngle: -90, segments: [] as React.ReactElement[] }).segments}
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Stats Below Chart - Horizontal Layout */}
                                                        <div className="grid grid-cols-3 gap-4">
                                                            {chartData.map((item) => {
                                                                let iconComponent, labelColor, valueColor, labelText;
                                                                
                                                                if (item.label === 'Lawyers') {
                                                                    iconComponent = <User className="h-5 w-5 text-white" />;
                                                                    labelColor = 'text-blue-700';
                                                                    valueColor = 'text-blue-900';
                                                                    labelText = 'Lawyers';
                                                                } else if (item.label === 'Clients') {
                                                                    iconComponent = <UserPlus className="h-5 w-5 text-white" />;
                                                                    labelColor = 'text-emerald-700';
                                                                    valueColor = 'text-emerald-900';
                                                                    labelText = 'Clients';
                                                                } else {
                                                                    iconComponent = <MapPin className="h-5 w-5 text-white" />;
                                                                    labelColor = 'text-amber-700';
                                                                    valueColor = 'text-amber-900';
                                                                    labelText = 'Districts';
                                                                }
                                                                
                                                                return (
                                                                    <div key={item.label} className="flex flex-col items-center text-center p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-all">
                                                                        <div 
                                                                            className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm mb-3"
                                                                            style={{ backgroundColor: item.color }}
                                                                        >
                                                                            {iconComponent}
                                                                        </div>
                                                                        <p className={`text-sm font-black ${labelColor} mb-1`}>{labelText}</p>
                                                                        <p className={`text-2xl font-black ${valueColor}`}>{item.value}</p>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Right Side - Percentage Table */}
                                                    <div className="flex items-center justify-center">
                                                        <div className="w-full max-w-md">
                                                            <div className="bg-white rounded-xl border-2 border-slate-200 shadow-lg overflow-hidden">
                                                                <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b border-slate-200">
                                                                    <h4 className="text-lg font-black text-slate-900">Percentage Distribution</h4>
                                                                </div>
                                                                <table className="w-full">
                                                                    <thead className="bg-slate-50">
                                                                        <tr>
                                                                            <th className="px-6 py-3 text-left text-xs font-black text-slate-700 uppercase tracking-wider">Category</th>
                                                                            <th className="px-6 py-3 text-right text-xs font-black text-slate-700 uppercase tracking-wider">Percentage</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-200">
                                                                        {chartData.map((item) => {
                                                                            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
                                                                            const labelText = item.label === 'Lawyers' ? 'Lawyers' : 
                                                                                             item.label === 'Clients' ? 'Clients' : 
                                                                                             'Districts';
                                                                            
                                                                            return (
                                                                                <tr key={item.label} className="hover:bg-slate-50 transition-colors">
                                                                                    <td className="px-6 py-4">
                                                                                        <div className="flex items-center gap-3">
                                                                                            <div 
                                                                                                className="w-4 h-4 rounded"
                                                                                                style={{ backgroundColor: item.color }}
                                                                                            ></div>
                                                                                            <span className="text-sm font-bold text-slate-900">{labelText}</span>
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="px-6 py-4 text-right">
                                                                                        <span className="text-base font-black text-slate-900">{percentage}%</span>
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {/* Lawyer List and Districts Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                                {/* Lawyer List Section */}
                                <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl sm:rounded-3xl border-2 border-purple-200 shadow-lg p-5 sm:p-6">
                                    <div className="flex items-center justify-between mb-5 sm:mb-6">
                                        <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">Lawyer List</h3>
                                        <button className="text-slate-400 hover:text-slate-600">
                                            <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                                        </button>
                                    </div>
                                    <div className="space-y-3 sm:space-y-4 max-h-[400px] overflow-y-auto scrollbar-hide">
                                        {lawyers.slice(0, 10).map((lawyer) => {
                                            const lawyerCases = appointments.filter(a => a.lawyerId === lawyer.id || a.assignedAdvocate === lawyer.name).length;
                                            const lawyerRevenue = appointments
                                                .filter(a => a.lawyerId === lawyer.id || a.assignedAdvocate === lawyer.name)
                                                .reduce((sum, a) => sum + (a.totalFee || a.consultationFee || 0) + (a.caseFee || 0), 0);
                                            return (
                                                <div key={lawyer.id} className="flex items-center justify-between p-3 sm:p-4 bg-white rounded-xl border border-slate-100 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer" onClick={() => setActiveStage('Directory')}>
                                                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-black text-sm sm:text-base flex-shrink-0">
                                                            {lawyer.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm sm:text-base font-black text-slate-900 truncate">{lawyer.name}</p>
                                                            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase truncate">{lawyer.specialization || 'General Practice'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right ml-2">
                                                        <p className="text-sm sm:text-base font-black text-slate-900">{lawyerCases}</p>
                                                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">Cases</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {lawyers.length === 0 && (
                                            <div className="text-center py-8">
                                                <User className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                                                <p className="text-sm font-bold text-slate-400">No lawyers found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Districts/Division Section */}
                                <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl sm:rounded-3xl border-2 border-emerald-200 shadow-lg p-5 sm:p-6">
                                    <div className="flex items-center justify-between mb-5 sm:mb-6">
                                        <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">Division</h3>
                                        <button className="text-slate-400 hover:text-slate-600">
                                            <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                                        </button>
                                    </div>
                                    <div className="space-y-3 sm:space-y-4 max-h-[400px] overflow-y-auto scrollbar-hide">
                                        {(() => {
                                            const districtCounts: Record<string, number> = {};
                                            
                                            // Count appointments by city (which is district)
                                            appointments.forEach(app => {
                                                const district = app.city || 'Unknown';
                                                districtCounts[district] = (districtCounts[district] || 0) + 1;
                                            });
                                            
                                            // Count client appointments by district
                                            clientAppointments.filter(a => a.status === 'Approved').forEach(app => {
                                                const district = app.district || 'Unknown';
                                                districtCounts[district] = (districtCounts[district] || 0) + 1;
                                            });
                                            
                                            const sortedDistricts = Object.entries(districtCounts)
                                                .sort(([, a], [, b]) => b - a)
                                                .slice(0, 10);
                                            
                                            const totalCases = appointments.length + clientAppointments.filter(a => a.status === 'Approved').length;
                                            const districtIcons = ['🏛️', '⚖️', '📋', '📝', '🏢', '🏛️', '⚖️', '📋', '📝', '🏢'];
                                            
                                            if (sortedDistricts.length === 0) {
                                                return (
                                                    <div className="text-center py-8">
                                                        <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                                                        <p className="text-sm font-bold text-slate-400">No district data available</p>
                                                    </div>
                                                );
                                            }
                                            
                                            return sortedDistricts.map(([district, count], index) => {
                                                const percentage = totalCases > 0 ? Math.round((count / totalCases) * 100) : 0;
                                                return (
                                                    <div key={district} className="flex items-center justify-between p-3 sm:p-4 bg-white rounded-xl border border-slate-100 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer" onClick={() => setActiveStage('Districts')}>
                                                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                                            <div className="text-2xl sm:text-3xl flex-shrink-0">{districtIcons[index % districtIcons.length]}</div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm sm:text-base font-black text-slate-900 truncate">{district}</p>
                                                                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">{percentage}% of total cases</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right ml-2">
                                                            <p className="text-sm sm:text-base font-black text-slate-900">{count}</p>
                                                            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">Cases</p>
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {/* Reports Section */}
                            <div className="bg-gradient-to-br from-white to-amber-50 rounded-2xl sm:rounded-3xl border-2 border-amber-200 shadow-lg p-5 sm:p-6">
                                <div className="flex items-center justify-between mb-5 sm:mb-6">
                                    <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">Reports & Analytics</h3>
                                    <button className="text-xs sm:text-sm font-bold text-blue-600 uppercase hover:underline">View All</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                                    <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase">Case Categories</span>
                                            <FileText className="h-5 w-5 text-blue-500" />
                                        </div>
                                        <div className="space-y-2">
                                            {['Civil', 'Criminal', 'Family', 'Property'].map(cat => {
                                                const count = appointments.filter(a => a.caseCategory === cat).length;
                                                const total = appointments.length || 1;
                                                const percentage = Math.round((count / total) * 100);
                                                return (
                                                    <div key={cat} className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-slate-600">{cat}</span>
                                                        <span className="text-xs font-black text-slate-900">{percentage}%</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase">Payment Status</span>
                                            <CreditCard className="h-5 w-5 text-green-500" />
                                        </div>
                                        <div className="space-y-2">
                                            {[
                                                { label: 'Paid', count: appointments.filter(a => (a.paidAmount || 0) >= (a.totalFee || a.consultationFee || 0)).length },
                                                { label: 'Pending', count: appointments.filter(a => (a.paidAmount || 0) < (a.totalFee || a.consultationFee || 0) && a.status === 'Approved').length },
                                                { label: 'Overdue', count: appointments.filter(a => a.paymentStatus && a.paymentStatus.toLowerCase().includes('overdue')).length }
                                            ].map(({ label, count }) => (
                                                <div key={label} className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-600">{label}</span>
                                                    <span className="text-xs font-black text-slate-900">{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase">Case Status</span>
                                            <Briefcase className="h-5 w-5 text-purple-500" />
                                        </div>
                                        <div className="space-y-2">
                                            {[
                                                { label: 'Open', count: appointments.filter(a => a.caseStatus === 'Open' || a.status === 'Approved').length },
                                                { label: 'Pending', count: appointments.filter(a => a.status === 'Pending').length },
                                                { label: 'Closed', count: appointments.filter(a => a.caseStatus === 'Closed').length }
                                            ].map(({ label, count }) => (
                                                <div key={label} className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-600">{label}</span>
                                                    <span className="text-xs font-black text-slate-900">{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Action Bar - Only show when not in Inquiry stage and not in ClientAppointments */}
                    {activeStage !== 'Inquiry' && activeStage !== 'ClientAppointments' && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Filter by</span>
                            <div className="relative flex-1 sm:flex-none">
                                <select
                                    className="w-full sm:w-auto bg-white border border-slate-200 rounded-lg px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none pr-8 sm:pr-10"
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
                                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                    )}

                    {/* Filter Bar for ClientAppointments - Only filter, no Schedule button */}
                    {activeStage === 'ClientAppointments' && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Filter by</span>
                            <div className="relative flex-1 sm:flex-none">
                                <select
                                    className="w-full sm:w-auto bg-white border border-slate-200 rounded-lg px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none pr-8 sm:pr-10"
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
                                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                    )}

                    {activeStage === 'ClientAppointments' ? (
                        <div className="space-y-4 sm:space-y-6">
                            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto -mx-3 sm:mx-0">
                                    <div className="inline-block min-w-full align-middle px-3 sm:px-0">
                                        <table className="min-w-full text-left divide-y divide-slate-200">
                                            <thead className="bg-slate-50/50">
                                                <tr>
                                                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">#</th>
                                                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest min-w-[120px]">Client</th>
                                                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest hidden sm:table-cell min-w-[100px]">Contact</th>
                                                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest hidden md:table-cell min-w-[100px]">Category</th>
                                                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest hidden lg:table-cell min-w-[100px]">Date</th>
                                                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest hidden xl:table-cell min-w-[100px]">Time</th>
                                                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest text-right min-w-[100px]">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-slate-50">
                                                {clientAppointments
                                                    .filter(app => activeCategory === 'All' ? true : (activeCategory === 'Others' ? !['Civil', 'Criminal', 'Family', 'Property'].includes(app.caseCategory) : app.caseCategory === activeCategory))
                                                    .map((app, idx) => (
                                                        <tr
                                                            key={app.id}
                                                            onClick={() => setSelectedClientAppointment(app)}
                                                            className="group hover:bg-slate-50 transition-colors cursor-pointer"
                                                        >
                                                            <td className="py-3 sm:py-4 px-3 sm:px-4 md:px-6 text-xs sm:text-sm font-medium text-slate-400 whitespace-nowrap">{idx + 1}</td>
                                                            <td className="py-3 sm:py-4 px-3 sm:px-4 md:px-6">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                                                                        {app.fullName.charAt(0)}
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-tight truncate">
                                                                            {app.fullName}
                                                                        </div>
                                                                        <div className="text-[10px] sm:text-xs text-slate-500 sm:hidden">{app.phoneNumber}</div>
                                                                        <div className="text-[10px] sm:text-xs text-slate-500 sm:hidden">{app.caseCategory}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-3 sm:py-4 px-3 sm:px-4 md:px-6 text-xs sm:text-sm text-slate-500 font-medium hidden sm:table-cell whitespace-nowrap">{app.phoneNumber}</td>
                                                            <td className="py-3 sm:py-4 px-3 sm:px-4 md:px-6 text-xs sm:text-sm text-slate-500 font-medium hidden md:table-cell whitespace-nowrap">{app.caseCategory}</td>
                                                            <td className="py-3 sm:py-4 px-3 sm:px-4 md:px-6 text-xs sm:text-sm text-slate-500 font-medium hidden lg:table-cell whitespace-nowrap">
                                                                {new Date(app.appointmentDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                            </td>
                                                            <td className="py-3 sm:py-4 px-3 sm:px-4 md:px-6 text-xs sm:text-sm text-slate-500 font-medium uppercase hidden xl:table-cell whitespace-nowrap">{app.timeSlot}</td>
                                                            <td className="py-3 sm:py-4 px-3 sm:px-4 md:px-6 text-right">
                                                                <span className={`inline-block text-[9px] sm:text-xs font-black px-2 sm:px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap ${
                                                                    app.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                                                                    app.status === 'Pending' ? 'bg-amber-100 text-amber-600' :
                                                                    'bg-red-100 text-red-600'
                                                                }`}>
                                                                    {app.status === 'Approved' ? 'Confirmed' : app.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                        {clientAppointments.length === 0 && (
                                            <div className="py-12 sm:py-20 text-center">
                                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-slate-300" />
                                                </div>
                                                <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">No client appointments</h3>
                                                <p className="text-slate-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest mt-1 italic">No appointment requests found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : activeStage === 'History' ? (
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
                    ) : activeStage === 'Profile' ? (
                        <div className="space-y-6">
                            {/* Profile Header */}
                            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-8 rounded-3xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-300">
                                        <UserCircle className="h-7 w-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 mb-1">User Settings</h3>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                            Manage your profile information and settings
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Profile Card */}
                            <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-lg overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-slate-200">
                                    <h4 className="text-xl font-black text-slate-900">Profile Information</h4>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                                        Update your profile picture and details
                                    </p>
                                </div>

                                <div className="p-8 space-y-6">
                                    {/* Profile Image Upload */}
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="relative">
                                            {adminProfile.profileImage ? (
                                                <img 
                                                    src={adminProfile.profileImage} 
                                                    alt="Profile" 
                                                    className="w-32 h-32 rounded-full object-cover border-4 border-blue-200 shadow-lg"
                                                />
                                            ) : (
                                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-4 border-blue-200 shadow-lg">
                                                    <UserCircle className="h-16 w-16 text-white" />
                                                </div>
                                            )}
                                            <label 
                                                htmlFor="profile-image-upload"
                                                className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-all shadow-lg hover:scale-110"
                                            >
                                                <Camera className="h-5 w-5 text-white" />
                                                <input
                                                    id="profile-image-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;

                                                        // Validate file size (max 5MB)
                                                        if (file.size > 5 * 1024 * 1024) {
                                                            alert('Image size should be less than 5MB');
                                                            return;
                                                        }

                                                        // Validate file type
                                                        if (!file.type.startsWith('image/')) {
                                                            alert('Please select a valid image file');
                                                            return;
                                                        }

                                                        setIsUploadingImage(true);
                                                        try {
                                                            const { supabase } = await import('../utils/supabase');
                                                            const fileExt = file.name.split('.').pop();
                                                            const fileName = `admin-profile-${Math.random()}-${Math.floor(Date.now() / 1000)}.${fileExt}`;
                                                            const filePath = `admin-profiles/${fileName}`;

                                                            const { error: uploadError } = await supabase.storage
                                                                .from('documents')
                                                                .upload(filePath, file);

                                                            if (uploadError) throw uploadError;

                                                            const { data: { publicUrl } } = supabase.storage
                                                                .from('documents')
                                                                .getPublicUrl(filePath);

                                                            const updatedProfile = {
                                                                ...adminProfile,
                                                                profileImage: publicUrl
                                                            };
                                                            setAdminProfile(updatedProfile);
                                                            localStorage.setItem('admin_profile', JSON.stringify(updatedProfile));
                                                        } catch (error: any) {
                                                            console.error('Error uploading image:', error);
                                                            alert('Failed to upload image: ' + (error.message || 'Unknown error'));
                                                        } finally {
                                                            setIsUploadingImage(false);
                                                        }
                                                    }}
                                                    disabled={isUploadingImage}
                                                />
                                            </label>
                                            {isUploadingImage && (
                                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs font-bold text-slate-500 text-center">
                                            Click the camera icon to upload a new profile picture
                                        </p>
                                    </div>

                                    {/* Profile Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t-2 border-slate-100">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                <User className="h-4 w-4 text-slate-500" />
                                                Name
                                            </label>
                                            <input
                                                type="text"
                                                value={adminProfile.name}
                                                onChange={(e) => {
                                                    const updated = { ...adminProfile, name: e.target.value };
                                                    setAdminProfile(updated);
                                                    localStorage.setItem('admin_profile', JSON.stringify(updated));
                                                }}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
                                                placeholder="Enter your name"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-slate-500" />
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={adminProfile.email}
                                                onChange={(e) => {
                                                    const updated = { ...adminProfile, email: e.target.value };
                                                    setAdminProfile(updated);
                                                    localStorage.setItem('admin_profile', JSON.stringify(updated));
                                                }}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
                                                placeholder="Enter your email"
                                            />
                                        </div>
                                    </div>

                                    {/* Logout Button */}
                                    <div className="pt-6 border-t-2 border-slate-100">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-red-200/50 hover:shadow-xl hover:shadow-red-300/50 transition-all duration-300 flex items-center justify-center gap-3"
                                        >
                                            <LogOut className="h-5 w-5" />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl sm:rounded-[2rem] border border-slate-100 shadow-sm shadow-slate-200/50 overflow-hidden">
                            <div className="overflow-x-auto min-h-[400px] -mx-3 sm:mx-0">
                                <div className="inline-block min-w-full align-middle px-3 sm:px-0">
                                    <table className="min-w-full text-left divide-y divide-slate-200">
                                        <thead className="bg-slate-50/70">
                                            <tr>
                                                <th className="py-3 sm:py-4 px-3 sm:px-4 text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest w-12 whitespace-nowrap">#</th>
                                                <th className="py-3 sm:py-4 px-3 sm:px-4 text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest min-w-[120px]">Client</th>
                                                <th className="py-3 sm:py-4 px-3 sm:px-4 text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest hidden sm:table-cell min-w-[100px]">Category</th>
                                                <th className="py-3 sm:py-4 px-3 sm:px-4 text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest hidden md:table-cell min-w-[100px]">Date</th>
                                                <th className="py-3 sm:py-4 px-3 sm:px-4 text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest hidden lg:table-cell min-w-[100px]">Time</th>
                                                <th className="py-3 sm:py-4 px-3 sm:px-4 text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest text-right min-w-[100px]">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-50">
                                            {(activeStage === 'Inquiry' ? columns.pending :
                                                activeStage === 'Verified' ? columns.verified :
                                                    activeStage === 'Litigation' ? columns.litigation :
                                                        columns.rejected)
                                                .filter(a => activeCategory === 'All' ? true : (activeCategory === 'Others' ? !['Civil', 'Criminal', 'Family', 'Property'].includes(a.caseCategory) : a.caseCategory === activeCategory))
                                                .map((app, idx) => (
                                                    <tr
                                                        key={app.id}
                                                        onClick={() => setSelectedCase(app)}
                                                        className="group hover:bg-slate-50 transition-colors cursor-pointer"
                                                    >
                                                        <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-medium text-slate-400 whitespace-nowrap">{idx + 1}</td>
                                                        <td className="py-3 sm:py-4 px-3 sm:px-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                                                                    {app.fullName.charAt(0)}
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-tight truncate">
                                                                        {app.fullName}
                                                                    </div>
                                                                    <div className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5 truncate sm:hidden">{app.caseCategory}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-slate-500 font-medium hidden sm:table-cell whitespace-nowrap">{app.caseCategory}</td>
                                                        <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-slate-500 font-medium hidden md:table-cell whitespace-nowrap">
                                                            {new Date(app.appointmentDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                        </td>
                                                        <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-slate-500 font-medium uppercase hidden lg:table-cell whitespace-nowrap">{app.timeSlot}</td>
                                                        <td className="py-3 sm:py-4 px-3 sm:px-4 text-right">
                                                            <span className={`inline-block text-[9px] sm:text-[10px] font-black px-2 sm:px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap ${
                                                                app.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                                                                app.status === 'Pending' ? 'bg-amber-100 text-amber-600' :
                                                                'bg-red-100 text-red-600'
                                                            }`}>
                                                                {app.status === 'Approved' ? 'Confirmed' : app.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                    {((activeStage === 'Inquiry' && columns.pending.length === 0) ||
                                        (activeStage === 'Verified' && columns.verified.length === 0) ||
                                        (activeStage === 'Litigation' && columns.litigation.length === 0) ||
                                        (activeStage === 'Disposed' && columns.rejected.length === 0)) && (
                                            <div className="py-12 sm:py-20 text-center">
                                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-500">
                                                    <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-slate-300" />
                                                </div>
                                                <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">No records found</h3>
                                                <p className="text-slate-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest mt-1 italic">Try adjusting your filters or status</p>
                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>
                    )}


                    {activeStage === 'Inquiry' && (
                        <div className="bg-white rounded-xl sm:rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6 sm:mb-8">
                            <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 border-b border-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0">
                                <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-widest">Recent Activity</h3>
                                <button onClick={() => setActiveStage('Verified')} className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase hover:underline text-left sm:text-right">View All Appointments</button>
                            </div>
                            <div className="overflow-x-auto -mx-3 sm:mx-0">
                                <div className="inline-block min-w-full align-middle px-3 sm:px-0">
                                    <table className="min-w-full text-left">
                                        <tbody className="divide-y divide-slate-50">
                                            {appointments.slice(0, 5).map((app, i) => (
                                                <tr key={i} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedCase(app)}>
                                                    <td className="px-3 sm:px-4 md:px-8 py-3 sm:py-4">
                                                        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                                                            <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs sm:text-xs md:text-sm font-bold shrink-0">
                                                                {app.fullName.charAt(0)}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs sm:text-sm md:text-base font-bold text-slate-800 uppercase tracking-tight leading-none truncate">{app.fullName}</p>
                                                                <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 sm:mt-1.5 truncate">{app.caseCategory}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 sm:px-4 md:px-8 py-3 sm:py-4 text-center sm:text-right">
                                                        <span className={`inline-block text-[9px] sm:text-[10px] md:text-xs font-black px-2 sm:px-2.5 py-1 rounded-full uppercase whitespace-nowrap ${
                                                            app.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                                                            app.status === 'Rejected' ? 'bg-red-100 text-red-600' :
                                                            'bg-amber-100 text-amber-600'
                                                        }`}>
                                                            {app.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 sm:px-4 md:px-8 py-3 sm:py-4 text-right whitespace-nowrap hidden sm:table-cell">
                                                        <p className="text-[10px] sm:text-xs md:text-sm font-bold text-slate-500">{new Date(app.appointmentDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {selectedCase && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedCase(null)} />
                    <div className="relative w-full sm:max-w-xl md:max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
                        <div className="p-3 sm:p-4 md:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 gap-2 sm:gap-3">
                            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-slate-900 text-white rounded-lg sm:rounded-xl flex items-center justify-center text-xs sm:text-sm md:text-lg font-black shadow-lg shadow-slate-900/20 flex-shrink-0">
                                    {selectedCase.fullName.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-xs sm:text-base md:text-xl font-black text-slate-900 leading-tight truncate">{selectedCase.fullName}</h3>
                                    <p className="text-[8px] sm:text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                                        {selectedCase.caseId ? `ID: ${selectedCase.caseId}` : `Booking: #${selectedCase.id.slice(-6).toUpperCase()}`}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedCase(null)} className="p-2 sm:p-2.5 bg-white border border-slate-200 rounded-lg sm:rounded-xl text-slate-400 hover:text-slate-900 transition-colors shadow-sm flex-shrink-0">
                                <XCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-8 space-y-6 sm:space-y-8 md:space-y-10 scrollbar-hide">
                            {(activeStage === 'Verified' || activeStage === 'Payment') ? (
                                <div className="space-y-4 sm:space-y-6">
                                    <div className="bg-slate-50/50 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl md:rounded-[2.5rem] border-2 border-slate-100 space-y-6 sm:space-y-8 md:space-y-10">
                                        <div className="space-y-4 sm:space-y-6 md:space-y-8">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                                                </div>
                                                <h4 className="text-[10px] sm:text-xs font-black text-slate-800 uppercase tracking-[0.2em]">1. Fee Allocation</h4>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                <div className="p-4 sm:p-5 bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm text-xs sm:text-sm">
                                                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Consultation Fee</p>
                                                    <div className="relative mt-2">
                                                        <IndianRupee className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                                                        <input
                                                            type="number"
                                                            value={consultationFee}
                                                            onChange={(e) => setConsultationFee(e.target.value)}
                                                            className="w-full pl-6 sm:pl-7 bg-transparent border-none text-xl sm:text-2xl font-black text-slate-900 outline-none p-0 placeholder:text-slate-300 pointer-events-auto"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="p-4 sm:p-5 bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm text-xs sm:text-sm">
                                                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Due Fee</p>
                                                    <div className="relative mt-2">
                                                        <IndianRupee className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                                                        <input
                                                            type="number"
                                                            value={caseFee}
                                                            onChange={(e) => setCaseFee(e.target.value)}
                                                            className="w-full pl-6 sm:pl-7 bg-transparent border-none text-xl sm:text-2xl font-black text-slate-900 outline-none p-0 placeholder:text-slate-300 pointer-events-auto"
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
                                <div className="space-y-4 sm:space-y-6 md:space-y-8">
                                    {/* Client Details Section */}
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl md:rounded-3xl border-2 border-blue-100 p-4 sm:p-5 md:p-6 lg:p-8">
                                        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
                                            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                                                <User className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 text-white" />
                                            </div>
                                            <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-widest">Client Details</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                                            <div className="space-y-1 sm:space-y-1.5">
                                                <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Client Name</p>
                                                <p className="font-bold text-slate-800 text-sm sm:text-base break-words">{selectedCase.fullName}</p>
                                            </div>
                                            {selectedCase.clientId && (
                                                <div className="space-y-1 sm:space-y-1.5">
                                                    <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Client ID</p>
                                                    <p className="font-bold text-slate-800 text-sm sm:text-base break-words">{selectedCase.clientId}</p>
                                                </div>
                                            )}
                                            <div className="space-y-1 sm:space-y-1.5">
                                                <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Contact Number</p>
                                                <p className="font-bold text-slate-800 text-sm sm:text-base tracking-wide break-words">{selectedCase.phoneNumber}</p>
                                            </div>
                                            {selectedCase.clientType && (
                                                <div className="space-y-1 sm:space-y-1.5">
                                                    <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Client Type</p>
                                                    <p className="font-bold text-slate-800 text-sm sm:text-base break-words">{selectedCase.clientType}</p>
                                                </div>
                                            )}
                                            <div className="space-y-1 sm:space-y-1.5">
                                                <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                                                <p className="font-bold text-slate-800 text-xs sm:text-sm break-all">{selectedCase.emailId || 'N/A'}</p>
                                            </div>
                                            <div className="space-y-1 sm:space-y-1.5">
                                                <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Location</p>
                                                <p className="font-bold text-slate-800 text-sm sm:text-base italic break-words">{selectedCase.city || 'N/A'}, {selectedCase.state || 'N/A'}</p>
                                            </div>
                                            <div className="col-span-1 md:col-span-2 space-y-1 sm:space-y-1.5">
                                                <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Client Address</p>
                                                <p className="font-bold text-slate-800 text-sm sm:text-base italic leading-relaxed break-words">{selectedCase.address || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Case Information Section */}
                                    {(selectedCase.caseId || selectedCase.caseTitle || selectedCase.caseType || selectedCase.courtName || selectedCase.caseStatus) && (
                                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl sm:rounded-2xl md:rounded-3xl border-2 border-purple-100 p-4 sm:p-5 md:p-6 lg:p-8">
                                            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
                                                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <Briefcase className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 text-white" />
                                                </div>
                                                <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-widest">Case Information</h4>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                                                {selectedCase.caseId && (
                                                    <div className="space-y-1 sm:space-y-1.5">
                                                        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Case ID / Case No</p>
                                                        <p className="font-bold text-slate-800 text-sm sm:text-base break-words">{selectedCase.caseId}</p>
                                                    </div>
                                                )}
                                                {selectedCase.caseTitle && (
                                                    <div className="space-y-1 sm:space-y-1.5">
                                                        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Case Title / Party Name</p>
                                                        <p className="font-bold text-slate-800 text-sm sm:text-base break-words">{selectedCase.caseTitle}</p>
                                                    </div>
                                                )}
                                                {(selectedCase.caseType || selectedCase.caseCategory) && (
                                                    <div className="space-y-1 sm:space-y-1.5">
                                                        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Case Type</p>
                                                        <p className="font-bold text-slate-800 text-sm sm:text-base break-words">{selectedCase.caseType || selectedCase.caseCategory || 'N/A'}</p>
                                                    </div>
                                                )}
                                                {selectedCase.courtName && (
                                                    <div className="space-y-1 sm:space-y-1.5">
                                                        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Court Name</p>
                                                        <p className="font-bold text-slate-800 text-sm sm:text-base break-words">{selectedCase.courtName}</p>
                                                    </div>
                                                )}
                                                {selectedCase.caseStatus && (
                                                    <div className="space-y-1 sm:space-y-1.5">
                                                        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Case Status</p>
                                                        <span className={`inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider whitespace-nowrap ${
                                                            selectedCase.caseStatus === 'Open' ? 'bg-blue-100 text-blue-600' :
                                                            selectedCase.caseStatus === 'Pending' ? 'bg-amber-100 text-amber-600' :
                                                            selectedCase.caseStatus === 'Closed' ? 'bg-slate-100 text-slate-600' :
                                                            'bg-purple-100 text-purple-600'
                                                        }`}>
                                                            {selectedCase.caseStatus}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Branch & Control Information Section */}
                                    {(selectedCase.branchName || selectedCase.branchLocation || selectedCase.assignedAdvocate) && (
                                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl sm:rounded-2xl md:rounded-3xl border-2 border-emerald-100 p-4 sm:p-5 md:p-6 lg:p-8">
                                            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
                                                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <Building2 className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 text-white" />
                                                </div>
                                                <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-widest">Branch & Control Information</h4>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                                                {selectedCase.branchName && (
                                                    <div className="space-y-1 sm:space-y-1.5">
                                                        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Branch Name</p>
                                                        <p className="font-bold text-slate-800 text-sm sm:text-base break-words">{selectedCase.branchName}</p>
                                                    </div>
                                                )}
                                                {selectedCase.branchLocation && (
                                                    <div className="space-y-1 sm:space-y-1.5">
                                                        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Branch Location</p>
                                                        <p className="font-bold text-slate-800 text-sm sm:text-base break-words">{selectedCase.branchLocation}</p>
                                                    </div>
                                                )}
                                                {selectedCase.assignedAdvocate && (
                                                    <div className="space-y-1 sm:space-y-1.5 md:col-span-2">
                                                        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Assigned Advocate</p>
                                                        <p className="font-bold text-slate-800 text-sm sm:text-base break-words">{selectedCase.assignedAdvocate}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Case Progress & Dates Section */}
                                    {(selectedCase.filingDate || selectedCase.lastHearingDate || selectedCase.nextHearingDate || selectedCase.stageOfCase) && (
                                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl sm:rounded-2xl md:rounded-3xl border-2 border-amber-100 p-4 sm:p-5 md:p-6 lg:p-8">
                                            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
                                                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-amber-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <Calendar className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 text-white" />
                                                </div>
                                                <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-widest">Case Progress & Dates</h4>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                                                {selectedCase.filingDate && (
                                                    <div className="space-y-1 sm:space-y-1.5">
                                                        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Filing Date</p>
                                                        <p className="font-bold text-slate-800 text-sm sm:text-base break-words">
                                                            {new Date(selectedCase.filingDate).toLocaleDateString('en-IN', { 
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                )}
                                                {selectedCase.lastHearingDate && (
                                                    <div className="space-y-1 sm:space-y-1.5">
                                                        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Last Hearing Date</p>
                                                        <p className="font-bold text-slate-800 text-sm sm:text-base break-words">
                                                            {new Date(selectedCase.lastHearingDate).toLocaleDateString('en-IN', { 
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                )}
                                                {selectedCase.nextHearingDate && (
                                                    <div className="space-y-1 sm:space-y-1.5">
                                                        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Next Hearing Date</p>
                                                        <p className="font-bold text-slate-800 text-sm sm:text-base break-words">
                                                            {new Date(selectedCase.nextHearingDate).toLocaleDateString('en-IN', { 
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                )}
                                                {selectedCase.stageOfCase && (
                                                    <div className="space-y-1 sm:space-y-1.5">
                                                        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Stage of Case</p>
                                                        <span className={`inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider whitespace-nowrap ${
                                                            selectedCase.stageOfCase === 'Evidence' ? 'bg-blue-100 text-blue-600' :
                                                            selectedCase.stageOfCase === 'Argument' ? 'bg-purple-100 text-purple-600' :
                                                            'bg-green-100 text-green-600'
                                                        }`}>
                                                            {selectedCase.stageOfCase}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Financial Section */}
                                    {(selectedCase.feeType || selectedCase.totalFee || selectedCase.paidAmount || selectedCase.balanceAmount || selectedCase.paymentStatus) && (
                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl md:rounded-3xl border-2 border-green-100 p-4 sm:p-5 md:p-6 lg:p-8">
                                            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
                                                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-green-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <IndianRupee className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 text-white" />
                                                </div>
                                                <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-widest">Financial Details</h4>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                                                {selectedCase.feeType && (
                                                    <div className="space-y-1 sm:space-y-1.5">
                                                        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Fee Type</p>
                                                        <span className={`inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider whitespace-nowrap ${
                                                            selectedCase.feeType === 'Fixed' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                                                        }`}>
                                                            {selectedCase.feeType}
                                                        </span>
                                                    </div>
                                                )}
                                                {selectedCase.totalFee !== undefined && (
                                                    <div className="space-y-1 sm:space-y-1.5">
                                                        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Total Fee</p>
                                                        <p className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-1">
                                                            <IndianRupee className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                            {selectedCase.totalFee.toLocaleString('en-IN')}
                                                        </p>
                                                    </div>
                                                )}
                                                {selectedCase.paidAmount !== undefined && (
                                                    <div className="space-y-1 sm:space-y-1.5">
                                                        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Paid Amount</p>
                                                        <p className="font-bold text-emerald-600 text-sm sm:text-base flex items-center gap-1">
                                                            <IndianRupee className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                            {selectedCase.paidAmount.toLocaleString('en-IN')}
                                                        </p>
                                                    </div>
                                                )}
                                                {selectedCase.balanceAmount !== undefined && (
                                                    <div className="space-y-1 sm:space-y-1.5">
                                                        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Balance Amount</p>
                                                        <p className={`font-bold text-sm sm:text-base flex items-center gap-1 ${
                                                            selectedCase.balanceAmount > 0 ? 'text-red-600' : 'text-green-600'
                                                        }`}>
                                                            <IndianRupee className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                            {selectedCase.balanceAmount.toLocaleString('en-IN')}
                                                        </p>
                                                    </div>
                                                )}
                                                {selectedCase.paymentStatus && (
                                                    <div className="space-y-1 sm:space-y-1.5 md:col-span-2">
                                                        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Payment Status</p>
                                                        <span className={`inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider whitespace-nowrap ${
                                                            selectedCase.paymentStatus.toLowerCase().includes('paid') || selectedCase.paymentStatus.toLowerCase().includes('complete') ? 'bg-green-100 text-green-600' :
                                                            selectedCase.paymentStatus.toLowerCase().includes('pending') ? 'bg-amber-100 text-amber-600' :
                                                            'bg-red-100 text-red-600'
                                                        }`}>
                                                            {selectedCase.paymentStatus}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Documents & Notes Section */}
                                    {(selectedCase.documentsStatus || selectedCase.importantNotes || selectedCase.casePriority || selectedCase.documentUrl) && (
                                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl sm:rounded-2xl md:rounded-3xl border-2 border-indigo-100 p-4 sm:p-5 md:p-6 lg:p-8">
                                            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
                                                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <FileText className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 text-white" />
                                                </div>
                                                <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-widest">Documents & Notes</h4>
                                            </div>
                                            <div className="space-y-4 sm:space-y-5 md:space-y-6">
                                                {selectedCase.documentsStatus && (
                                                    <div className="space-y-1 sm:space-y-1.5">
                                                        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Documents Status</p>
                                                        <span className={`inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider whitespace-nowrap ${
                                                            selectedCase.documentsStatus === 'Uploaded' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                                                        }`}>
                                                            {selectedCase.documentsStatus}
                                                        </span>
                                                    </div>
                                                )}
                                                {selectedCase.documentUrl && (
                                                    <div className="space-y-1 sm:space-y-1.5">
                                                        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Uploaded Document</p>
                                                        <a
                                                            href={selectedCase.documentUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 text-blue-600 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100"
                                                        >
                                                            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                            View Document
                                                        </a>
                                                    </div>
                                                )}
                                                {selectedCase.importantNotes && (
                                                    <div className="space-y-1 sm:space-y-1.5">
                                                        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Important Notes / Remarks</p>
                                                        <div className="p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl border border-slate-200">
                                                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic break-words">{selectedCase.importantNotes}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {selectedCase.casePriority && (
                                                    <div className="space-y-1 sm:space-y-1.5">
                                                        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Case Priority</p>
                                                        <span className={`inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-2 w-fit whitespace-nowrap ${
                                                            selectedCase.casePriority === 'High' ? 'bg-red-100 text-red-600' :
                                                            selectedCase.casePriority === 'Medium' ? 'bg-amber-100 text-amber-600' :
                                                            'bg-green-100 text-green-600'
                                                        }`}>
                                                            <Flag className="h-3 w-3" />
                                                            {selectedCase.casePriority}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 p-4 sm:p-5 md:p-6 bg-slate-900 rounded-xl sm:rounded-2xl md:rounded-3xl text-white shadow-xl shadow-slate-200/50">
                                        <div className="space-y-1 sm:space-y-1.5">
                                            <div className="flex items-center gap-1.5 sm:gap-2 text-blue-400">
                                                <Calendar className="h-3 w-3 flex-shrink-0" />
                                                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em]">Appt Date</p>
                                            </div>
                                            <p className="text-[10px] sm:text-xs font-black break-words">{new Date(selectedCase.appointmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                        <div className="space-y-1 sm:space-y-1.5">
                                            <div className="flex items-center gap-1.5 sm:gap-2 text-indigo-400">
                                                <Clock className="h-3 w-3 flex-shrink-0" />
                                                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em]">Time Slot</p>
                                            </div>
                                            <p className="text-[10px] sm:text-xs font-black uppercase break-words">{selectedCase.timeSlot}</p>
                                        </div>
                                        <div className="space-y-1 sm:space-y-1.5">
                                            <div className="flex items-center gap-1.5 sm:gap-2 text-purple-400">
                                                <Smartphone className="h-3 w-3 flex-shrink-0" />
                                                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em]">Visit Type</p>
                                            </div>
                                            <p className="text-[10px] sm:text-xs font-black uppercase break-words">{selectedCase.consultationType || 'Not Specified'}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div className="p-4 sm:p-5 bg-blue-50/50 rounded-xl sm:rounded-2xl border border-blue-100/50">
                                            <p className="text-[9px] sm:text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Returning Client?</p>
                                            <p className="text-xs sm:text-sm font-black text-blue-900 break-words">{selectedCase.alreadyCome === 'Yes' ? 'YES (VISITED BEFORE)' : 'NO (FIRST TIME)'}</p>
                                        </div>
                                        <div className="p-4 sm:p-5 bg-purple-50/50 rounded-xl sm:rounded-2xl border border-purple-100/50">
                                            <p className="text-[9px] sm:text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Registration Date</p>
                                            <p className="text-xs sm:text-sm font-black text-purple-900 break-words">{new Date(selectedCase.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                    </div>

                                    {/* Legacy Case Information (for old appointments without comprehensive fields) */}
                                    {(!selectedCase.caseTitle && !selectedCase.caseType && selectedCase.caseCategory) && (
                                        <div className="bg-slate-50 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl md:rounded-3xl border border-slate-100 space-y-4 sm:space-y-5 md:space-y-6">
                                            <div className="flex flex-wrap gap-2 sm:gap-2.5">
                                                <span className="px-3 sm:px-4 py-1 sm:py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] sm:text-[10px] font-black text-slate-600 uppercase tracking-wider">{selectedCase.caseCategory}</span>
                                                {selectedCase.otherCategory && (
                                                    <span className="px-3 sm:px-4 py-1 sm:py-1.5 bg-slate-900 text-white rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider">Sub: {selectedCase.otherCategory}</span>
                                                )}
                                            </div>
                                            {selectedCase.description && (
                                                <div className="space-y-1.5 sm:space-y-2">
                                                    <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Case Description</p>
                                                    <p className="text-xs sm:text-sm md:text-base text-slate-600 italic leading-relaxed break-words">"{selectedCase.description}"</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {selectedCase.rejectionReason && (
                                        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-red-50 rounded-xl sm:rounded-2xl border border-red-100">
                                            <p className="text-[9px] sm:text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Rejection Reason</p>
                                            <p className="text-xs sm:text-sm text-red-700 font-medium italic break-words">"{selectedCase.rejectionReason}"</p>
                                        </div>
                                    )}

                                    {/* Court Hearing Details Section */}
                                    {(selectedCase.courtHearingDate || selectedCase.currentHearingReport || selectedCase.nextHearingDate) && (
                                        <div className="mt-4 sm:mt-5 md:mt-6 p-4 sm:p-5 md:p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl sm:rounded-2xl border-2 border-indigo-200 shadow-lg">
                                            <div className="flex items-center gap-2 sm:gap-2 mb-3 sm:mb-4">
                                                <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 flex-shrink-0" />
                                                <h4 className="text-xs sm:text-sm font-black text-indigo-900 uppercase tracking-widest">Court Hearing Details</h4>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                                                {selectedCase.courtHearingDate && (
                                                    <div className="p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl border border-indigo-100">
                                                        <div className="flex items-center gap-1.5 sm:gap-2 text-indigo-600 mb-1">
                                                            <Calendar className="h-3 w-3 flex-shrink-0" />
                                                            <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em]">Court Hearing Date</p>
                                                        </div>
                                                        <p className="text-xs sm:text-sm font-black text-slate-800 break-words">
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
                                                    <div className="p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl border border-indigo-100">
                                                        <div className="flex items-center gap-1.5 sm:gap-2 text-indigo-600 mb-1">
                                                            <Calendar className="h-3 w-3 flex-shrink-0" />
                                                            <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em]">Next Hearing Date</p>
                                                        </div>
                                                        <p className="text-xs sm:text-sm font-black text-slate-800 break-words">
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
                                                <div className="p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl border border-indigo-100">
                                                    <div className="flex items-center gap-1.5 sm:gap-2 text-indigo-600 mb-1.5 sm:mb-2">
                                                        <FileText className="h-3 w-3 flex-shrink-0" />
                                                        <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em]">Current Hearing Report</p>
                                                    </div>
                                                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic break-words">
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

                                    {showRejectionForm && (
                                        <div className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="space-y-1 sm:space-y-1.5 text-left">
                                                <label className="text-[9px] sm:text-[10px] font-black text-red-600 uppercase tracking-widest ml-1">Reason for Rejection</label>
                                                <textarea
                                                    value={localRejectionReason}
                                                    onChange={(e) => setLocalRejectionReason(e.target.value)}
                                                    placeholder="Please explain why you are rejecting this appointment..."
                                                    className="w-full px-3 sm:px-4 md:px-5 py-3 sm:py-4 bg-white border-2 border-red-100 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 min-h-[100px] sm:min-h-[120px] transition-all resize-none"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {selectedCase.status === 'Pending' && !showRejectionForm && (
                                        <div className="space-y-3 sm:space-y-4">
                                            <p className="text-[9px] sm:text-[10px] font-black text-slate-800 uppercase tracking-widest">Available Lawyers</p>
                                            <div className="grid grid-cols-1 gap-2 sm:gap-2">
                                                {lawyers.map(l => (
                                                    <button
                                                        key={l.id}
                                                        onClick={() => setSelectedLawyerId(l.id)}
                                                        className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 text-left transition-all ${selectedLawyerId === l.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100'}`}
                                                    >
                                                        <p className="text-xs sm:text-sm font-black text-slate-900 break-words">{l.name}</p>
                                                        <p className="text-[8px] sm:text-[9px] font-bold text-blue-600 uppercase break-words">{l.specialization}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeStage === 'Litigation' && (
                                        <div className="space-y-4 sm:space-y-5 md:space-y-6">
                                            <p className="text-[10px] sm:text-[11px] font-black text-blue-600 uppercase tracking-widest">Track Case Progress</p>
                                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                                {['Stage 1', 'Stage 2', 'Stage 3', 'Final Verdict'].map(stg => (
                                                    <button
                                                        key={stg}
                                                        onClick={() => handleUpdateStage(stg)}
                                                        className={`py-3 sm:py-4 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase transition-all shadow-sm ${selectedCase.caseStage === stg ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
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

                        <div className="p-3 sm:p-4 md:p-6 lg:p-8 border-t border-slate-100 bg-white flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
                            {selectedCase.status === 'Pending' ? (
                                showRejectionForm ? (
                                    <>
                                        <button
                                            onClick={() => { setShowRejectionForm(false); setLocalRejectionReason(''); }}
                                            className="flex-1 py-3 sm:py-4 bg-slate-100 text-slate-600 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest border border-slate-200 transition-all active:scale-95"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(selectedCase.id, 'Rejected', localRejectionReason)}
                                            disabled={isProcessing || !localRejectionReason.trim()}
                                            className="flex-[2] py-3 sm:py-4 bg-red-600 text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setShowRejectionForm(true)}
                                            className="flex-1 py-3 sm:py-4 bg-slate-100 text-slate-600 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest border border-slate-200 transition-all active:scale-95"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(selectedCase.id, 'Approved')}
                                            disabled={isProcessing}
                                            className="flex-[2] py-3 sm:py-4 bg-blue-600 text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {isProcessing ? 'Approving...' : 'Approve Request'}
                                        </button>
                                    </>
                                )
                            ) : (
                                <button onClick={() => { setSelectedCase(null); setShowRejectionForm(false); }} className="w-full py-3 sm:py-4 md:py-5 bg-slate-900 text-white rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all">Close Viewer</button>
                            )}
                        </div>
                    </div>
                </div>
            )
            }

            {/* Client Appointment Details Modal */}
            {selectedClientAppointment && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedClientAppointment(null)} />
                    <div className="relative w-full sm:max-w-xl md:max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
                        <div className="p-3 sm:p-4 md:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 gap-2 sm:gap-3">
                            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-indigo-600 text-white rounded-lg sm:rounded-xl flex items-center justify-center text-xs sm:text-sm md:text-lg font-black shadow-lg flex-shrink-0">
                                    {selectedClientAppointment.fullName.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-xs sm:text-base md:text-xl font-black text-slate-900 leading-tight truncate">{selectedClientAppointment.fullName}</h3>
                                    <p className="text-[8px] sm:text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                                        Request ID: #{selectedClientAppointment.id.slice(-6).toUpperCase()}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedClientAppointment(null)} className="p-2 sm:p-2.5 bg-white border border-slate-200 rounded-lg sm:rounded-xl text-slate-400 hover:text-slate-900 transition-colors shadow-sm flex-shrink-0">
                                <XCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-8 space-y-4 sm:space-y-6 md:space-y-8 lg:space-y-10 scrollbar-hide">
                            <div className="space-y-4 sm:space-y-6 md:space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                                    <div className="space-y-1 sm:space-y-1.5">
                                        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Full Name</p>
                                        <p className="font-bold text-slate-800 text-sm sm:text-base break-words">{selectedClientAppointment.fullName}</p>
                                    </div>
                                    <div className="space-y-1 sm:space-y-1.5 md:text-right">
                                        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Contact</p>
                                        <p className="font-bold text-slate-800 text-sm sm:text-base tracking-wide break-words">{selectedClientAppointment.phoneNumber}</p>
                                    </div>
                                    <div className="space-y-1 sm:space-y-1.5">
                                        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                                        <p className="font-bold text-slate-800 text-xs sm:text-sm md:text-base break-all">{selectedClientAppointment.emailId}</p>
                                    </div>
                                    <div className="space-y-1 sm:space-y-1.5 md:text-right">
                                        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Location</p>
                                        <p className="font-bold text-slate-800 text-sm sm:text-base italic break-words">{selectedClientAppointment.district}, {selectedClientAppointment.state}</p>
                                    </div>
                                    <div className="col-span-1 md:col-span-2 space-y-1 sm:space-y-1.5">
                                        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Full Address</p>
                                        <p className="font-bold text-slate-800 text-sm sm:text-base italic leading-relaxed break-words">{selectedClientAppointment.address}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 p-4 sm:p-5 md:p-6 bg-slate-900 rounded-xl sm:rounded-2xl md:rounded-3xl text-white shadow-xl">
                                    <div className="space-y-1 sm:space-y-1.5">
                                        <div className="flex items-center gap-1.5 sm:gap-2 text-blue-400">
                                            <Calendar className="h-3 w-3 flex-shrink-0" />
                                            <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em]">Appt Date</p>
                                        </div>
                                        <p className="text-[10px] sm:text-xs font-black break-words">{new Date(selectedClientAppointment.appointmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                    </div>
                                    <div className="space-y-1 sm:space-y-1.5">
                                        <div className="flex items-center gap-1.5 sm:gap-2 text-indigo-400">
                                            <Clock className="h-3 w-3 flex-shrink-0" />
                                            <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em]">Time Slot</p>
                                        </div>
                                        <p className="text-[10px] sm:text-xs font-black uppercase break-words">{selectedClientAppointment.timeSlot}</p>
                                    </div>
                                    <div className="space-y-1 sm:space-y-1.5">
                                        <div className="flex items-center gap-1.5 sm:gap-2 text-purple-400">
                                            <Video className="h-3 w-3 flex-shrink-0" />
                                            <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em]">Visit Type</p>
                                        </div>
                                        <p className="text-[10px] sm:text-xs font-black uppercase break-words">{selectedClientAppointment.consultationType}</p>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl md:rounded-3xl border border-slate-100 space-y-4 sm:space-y-5 md:space-y-6">
                                    <div className="flex flex-wrap gap-2 sm:gap-2.5">
                                        <span className="px-3 sm:px-4 py-1 sm:py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] sm:text-[10px] font-black text-slate-600 uppercase tracking-wider">{selectedClientAppointment.caseCategory}</span>
                                        <span className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${
                                            selectedClientAppointment.alreadyCome === 'Yes' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                                        }`}>
                                            {selectedClientAppointment.alreadyCome === 'Yes' ? 'Returning Client' : 'New Client'}
                                        </span>
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Case Description</p>
                                        <p className="text-xs sm:text-sm md:text-base text-slate-600 italic leading-relaxed break-words">"{selectedClientAppointment.description}"</p>
                                    </div>
                                    {selectedClientAppointment.documentUrl && (
                                        <div className="pt-1 sm:pt-2">
                                            <a
                                                href={selectedClientAppointment.documentUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 text-blue-600 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100"
                                            >
                                                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                View Uploaded Document
                                            </a>
                                        </div>
                                    )}
                                    {selectedClientAppointment.rejectionReason && (
                                        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-red-50 rounded-xl sm:rounded-2xl border border-red-100">
                                            <p className="text-[9px] sm:text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Rejection Reason</p>
                                            <p className="text-xs sm:text-sm text-red-700 font-medium italic break-words">"{selectedClientAppointment.rejectionReason}"</p>
                                        </div>
                                    )}
                                </div>

                                {showRejectionForm && (
                                    <div className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="space-y-1 sm:space-y-1.5 text-left">
                                            <label className="text-[9px] sm:text-[10px] font-black text-red-600 uppercase tracking-widest ml-1">Reason for Rejection</label>
                                            <textarea
                                                value={localRejectionReason}
                                                onChange={(e) => setLocalRejectionReason(e.target.value)}
                                                placeholder="Please explain why you are rejecting this appointment request..."
                                                className="w-full px-3 sm:px-4 md:px-5 py-3 sm:py-4 bg-white border-2 border-red-100 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 min-h-[100px] sm:min-h-[120px] transition-all resize-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                {selectedClientAppointment.status === 'Pending' && !showRejectionForm && (
                                    <div className="space-y-3 sm:space-y-4">
                                        <p className="text-[9px] sm:text-[10px] font-black text-slate-800 uppercase tracking-widest">Available Lawyers</p>
                                        <div className="grid grid-cols-1 gap-2 sm:gap-2">
                                            {lawyers.map(l => (
                                                <button
                                                    key={l.id}
                                                    onClick={() => setSelectedLawyerId(l.id)}
                                                    className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 text-left transition-all ${selectedLawyerId === l.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100'}`}
                                                >
                                                    <p className="text-xs sm:text-sm font-black text-slate-900 break-words">{l.name}</p>
                                                    <p className="text-[8px] sm:text-[9px] font-bold text-blue-600 uppercase break-words">{l.specialization}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-3 sm:p-4 md:p-6 lg:p-8 border-t border-slate-100 bg-white flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
                            {selectedClientAppointment.status === 'Pending' ? (
                                showRejectionForm ? (
                                    <>
                                        <button
                                            onClick={() => { setShowRejectionForm(false); setLocalRejectionReason(''); }}
                                            className="flex-1 py-3 sm:py-4 bg-slate-100 text-slate-600 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest border border-slate-200 transition-all active:scale-95"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={() => handleClientAppointmentStatusUpdate(selectedClientAppointment.id, 'Rejected', localRejectionReason)}
                                            disabled={isProcessing || !localRejectionReason.trim()}
                                            className="flex-[2] py-3 sm:py-4 bg-red-600 text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setShowRejectionForm(true)}
                                            className="flex-1 py-3 sm:py-4 bg-slate-100 text-slate-600 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest border border-slate-200 transition-all active:scale-95"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleClientAppointmentStatusUpdate(selectedClientAppointment.id, 'Approved')}
                                            disabled={isProcessing || !selectedLawyerId}
                                            className="flex-[2] py-3 sm:py-4 bg-blue-600 text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {isProcessing ? 'Approving...' : 'Approve Request'}
                                        </button>
                                    </>
                                )
                            ) : (
                                <button onClick={() => { setSelectedClientAppointment(null); setShowRejectionForm(false); }} className="w-full py-3 sm:py-4 md:py-5 bg-slate-900 text-white rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all">Close Viewer</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
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
