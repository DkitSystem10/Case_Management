import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Scale, FileText, ArrowRight, Database, AlertTriangle, BookOpen, X, Gavel, Calendar, LogOut, User, Edit, Save } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { getAppointments, updateHearingDetails, type AppointmentRecord } from '../utils/storage';

const CaseFinder: React.FC = () => {
    const navigate = useNavigate();
    const [isLawyer, setIsLawyer] = useState(false);
    const [lawyerData, setLawyerData] = useState<any>(null);
    const [districtCases, setDistrictCases] = useState<AppointmentRecord[]>([]);
    const [filteredCases, setFilteredCases] = useState<AppointmentRecord[]>([]);
    const [caseIdSearch, setCaseIdSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isEditingHearing, setIsEditingHearing] = useState(false);
    const [hearingForm, setHearingForm] = useState({
        courtHearingDate: '',
        currentHearingReport: '',
        nextHearingDate: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    
    useEffect(() => {
        const lawyerToken = localStorage.getItem('lawyer_token');
        const lawyerDataStr = localStorage.getItem('lawyer_data');
        
        if (lawyerToken && lawyerDataStr) {
            const data = JSON.parse(lawyerDataStr);
            setIsLawyer(true);
            setLawyerData(data);
            loadDistrictCases(data.district);
        } else {
            // Redirect to login if not logged in
            navigate('/lawyer/login');
        }
    }, [navigate]);

    const loadDistrictCases = async (district: string) => {
        setIsLoading(true);
        try {
            const allAppointments = await getAppointments();
            // Filter approved appointments from the lawyer's district
            const filtered = allAppointments.filter(app => 
                app.status === 'Approved' && 
                app.city === district
            );
            setDistrictCases(filtered);
            setFilteredCases(filtered);
        } catch (error) {
            console.error('Error loading cases:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('lawyer_token');
        localStorage.removeItem('lawyer_data');
        navigate('/lawyer/login');
    };

    // Mock public-safe data with summary
    const publicCases = [
        {
            id: 'SC-2024-001',
            title: 'Constitutional Rights Interpretation',
            category: 'Constitutional',
            year: '2024',
            status: 'Judgment Reserved',
            court: 'Supreme Court',
            summary: 'The Supreme Court bench has reserved its judgment on the interpretation of Article 21 regarding digital privacy rights in the context of new state surveillance regulations. The core issue involves balancing national security with individual privacy under the constitutional framework.',
            nextHearing: 'Not Scheduled'
        },
        {
            id: 'HC-MAD-2023-892',
            title: 'Urban Planning Dispute Reference',
            category: 'Civil',
            year: '2023',
            status: 'Hearing Scheduled',
            court: 'Madras High Court',
            summary: 'A public interest case concerning the re-zoning of wetland areas in metropolitan Chennai. The High Court has requested a status report from the Environmental Department regarding compliance with 2018 zoning laws.',
            nextHearing: '24th April 2025'
        },
        {
            id: 'D-CHE-2024-112',
            title: 'Corporate Insolvency Notice',
            category: 'Corporate',
            year: '2024',
            status: 'Stay Granted',
            court: 'District Court, Chennai',
            summary: 'Proceedings initiated by financial creditors against a local manufacturing unit have been temporarily stayed by the District Court pending the review of a debt restructuring proposal submitted by the corporate debtor.',
            nextHearing: '15th May 2024'
        },
        {
            id: 'HC-MUM-2023-445',
            title: 'Consumer Protection Appeal',
            category: 'Consumer',
            year: '2023',
            status: 'Disposed',
            court: 'Bombay High Court',
            summary: 'The appeal filed by the service provider against the District Forum order has been dismissed. The court upheld the compensation awarded to the consumer for deficiency of service in the insurance claim process.',
            nextHearing: 'Case Closed'
        }
    ];

    const [selectedCase, setSelectedCase] = useState<typeof publicCases[0] | null>(null);
    const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRecord | null>(null);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Cases...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-full overflow-x-hidden space-y-6 sm:space-y-8 md:space-y-12 pb-12 sm:pb-16 md:pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700 relative" style={{ maxWidth: '100vw', overflowX: 'hidden', width: '100%' }}>
            {/* Lawyer Dashboard Header - Only Username and District */}
            {isLawyer && lawyerData && (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sm:p-6 shadow-xl w-full overflow-x-hidden">
                    <div className="max-w-7xl mx-auto w-full">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-6 w-full">
                            <div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0 w-full">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg border border-white/30 flex-shrink-0">
                                    <User className="h-6 w-6 sm:h-8 sm:w-8" />
                                </div>
                                <div className="space-y-1 flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] sm:text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">Username</p>
                                            <p className="text-lg sm:text-xl md:text-2xl font-black truncate">{lawyerData.username}</p>
                                        </div>
                                        <div className="hidden sm:block w-px h-8 md:h-12 bg-white/30"></div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] sm:text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">District</p>
                                            <p className="text-lg sm:text-xl md:text-2xl font-black truncate">{lawyerData.district}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-4 sm:px-6 py-2 sm:py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 border border-white/30 shadow-lg w-full sm:w-auto"
                            >
                                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header / Hero Section */}
            <div className={`relative bg-slate-900 rounded-2xl sm:rounded-[2rem] md:rounded-[3rem] p-3 sm:p-6 md:p-8 lg:p-12 overflow-hidden shadow-2xl mx-1 sm:mx-2 md:mx-4 max-w-full ${isLawyer ? 'mt-4 sm:mt-6' : 'mt-4'} text-center`} style={{ maxWidth: 'calc(100vw - 0.5rem)', width: 'calc(100% - 0.5rem)' }}>
                <div className="absolute top-0 right-0 w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] md:w-[500px] md:h-[500px] bg-blue-500/10 rounded-full blur-3xl sm:-mr-20 md:-mr-40 -mt-10 sm:-mt-20 md:-mt-40 pointer-events-none" style={{ right: 0, maxWidth: '100%' }}></div>
                <div className="absolute bottom-0 left-0 w-[150px] h-[150px] sm:w-[250px] sm:h-[250px] md:w-[400px] md:h-[400px] bg-emerald-500/5 rounded-full blur-3xl sm:-ml-10 md:-ml-20 -mb-5 sm:-mb-10 md:-mb-20 pointer-events-none" style={{ left: 0, maxWidth: '100%' }}></div>

                <div className="relative z-10 max-w-4xl mx-auto space-y-4 sm:space-y-6">
                    {!isLawyer && (
                        <>
                            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 border border-white/10 rounded-full text-blue-200 font-bold text-[10px] sm:text-xs uppercase tracking-wider">
                                <Database className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>Public Archives Information</span>
                            </div>
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg sm:rounded-xl p-3 sm:p-4 inline-flex items-start gap-2 sm:gap-3 text-left max-w-2xl mx-auto">
                                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-amber-200/90 text-xs sm:text-sm font-medium leading-relaxed">
                                    <strong>Disclaimer:</strong> This tool is for informational purposes only and does not constitute legal advice.
                                    Data shown is based on publicly available references and does not contain confidential personal details.
                                </p>
                            </div>
                        </>
                    )}

                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-tight px-2">
                        {isLawyer ? `${lawyerData?.district} District Cases` : 'Case Finder'}
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-slate-300 font-medium px-2">
                        {isLawyer 
                            ? `View and manage approved cases from ${lawyerData?.district} district`
                            : 'Access your district cases'
                        }
                    </p>
                </div>
            </div>

            {/* Search & Filter Interface - Only for non-lawyers */}
            {!isLawyer && (
                <div className="max-w-6xl mx-auto px-1 sm:px-2 md:px-4 -mt-6 sm:-mt-10 relative z-20 w-full overflow-x-hidden" style={{ maxWidth: 'calc(100vw - 0.5rem)', width: 'calc(100% - 0.5rem)' }}>
                    <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-[2.5rem] p-3 sm:p-4 md:p-6 lg:p-8 shadow-xl border border-slate-100 w-full max-w-full overflow-hidden">
                        <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2">
                            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                            <span>Search Public Records</span>
                        </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 w-full">
                        <div className="space-y-2">
                            <label className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 ml-1">Case Category</label>
                            <select className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer">
                                <option value="">Select Category</option>
                                {['Civil', 'Criminal', 'Family', 'Corporate', 'Property', 'Labour', 'Consumer', 'Others'].map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 ml-1">Court Level</label>
                            <select className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer">
                                <option value="">Select Court</option>
                                {['Supreme Court', 'High Court', 'District Court'].map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 ml-1">Year</label>
                            <select className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer">
                                <option value="">Select Year</option>
                                {['2024', '2023', '2022', '2021', 'Older'].map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 ml-1">Keywords</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Topic or Reference..."
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400/70"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 sm:mt-8 flex justify-end">
                        <button className="flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-600/25 active:scale-95 w-full sm:w-auto justify-center">
                            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span>Find References</span>
                        </button>
                    </div>
                </div>
            </div>
            )}

            {/* District Cases Section (for Lawyers) */}
            {isLawyer ? (
                <div className="max-w-7xl mx-auto px-1 sm:px-2 md:px-4 w-full overflow-x-hidden" style={{ maxWidth: 'calc(100vw - 0.5rem)', width: 'calc(100% - 0.5rem)' }}>
                    {/* Top Left - Case ID Search */}
                    <div className="mb-4 sm:mb-6 w-full">
                        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm border border-slate-200 w-full max-w-full overflow-x-hidden">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 md:gap-4 w-full">
                                <div className="flex-1 min-w-0">
                                    <label className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 mb-2 block">Search by Case ID</label>
                                    <div className="relative w-full max-w-full">
                                        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                                        <input
                                            type="text"
                                            value={caseIdSearch}
                                            onChange={(e) => {
                                                const searchValue = e.target.value.toUpperCase();
                                                setCaseIdSearch(searchValue);
                                                if (searchValue.trim() === '') {
                                                    setFilteredCases(districtCases);
                                                } else {
                                                    const filtered = districtCases.filter(caseItem => 
                                                        caseItem.caseId?.toUpperCase().includes(searchValue)
                                                    );
                                                    setFilteredCases(filtered);
                                                }
                                            }}
                                            placeholder="Enter Case ID"
                                            className="w-full max-w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all uppercase"
                                            style={{ maxWidth: '100%' }}
                                        />
                                    </div>
                                </div>
                                {caseIdSearch && (
                                    <button
                                        onClick={() => {
                                            setCaseIdSearch('');
                                            setFilteredCases(districtCases);
                                        }}
                                        className="px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto"
                                    >
                                        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        <span>Clear</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Cases List */}
                    <div className="mb-6 sm:mb-8">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900">District Cases</h2>
                        <p className="text-xs sm:text-sm text-slate-500 font-bold mt-1">
                            {filteredCases.length} Approved {filteredCases.length === 1 ? 'Case' : 'Cases'} from {lawyerData?.district}
                        </p>
                    </div>

                    {filteredCases.length === 0 ? (
                        <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-dashed border-slate-200 shadow-sm p-8 sm:p-12 md:p-20 text-center">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-inner">
                                <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-2 sm:mb-3">
                                {caseIdSearch ? 'No Cases Found' : 'No Cases Found'}
                            </h3>
                            <p className="text-slate-500 font-semibold text-xs sm:text-sm max-w-md mx-auto leading-relaxed px-2">
                                {caseIdSearch 
                                    ? `No cases found matching Case ID: ${caseIdSearch}. Try a different Case ID.`
                                    : `There are no approved cases in ${lawyerData?.district} district yet. Approved appointments will appear here.`
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 w-full">
                            {filteredCases.map((appointment) => (
                                <div 
                                    key={appointment.id} 
                                    onClick={() => setSelectedAppointment(appointment)}
                                    className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border-2 border-slate-100 hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer group w-full max-w-full overflow-hidden"
                                >
                                    <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2 min-w-0 w-full">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-black text-base sm:text-lg shadow-lg flex-shrink-0">
                                            {appointment.fullName.charAt(0)}
                                        </div>
                                        {appointment.caseId && (
                                            <span className="text-[10px] sm:text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md truncate max-w-[calc(100%-3rem)] sm:max-w-none flex-shrink min-w-0">
                                                {appointment.caseId}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-base sm:text-lg font-black text-slate-900 mb-2 sm:mb-3 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[3rem] break-words overflow-hidden">
                                        {appointment.fullName}
                                    </h3>
                                    <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4 w-full">
                                        <div className="flex items-center justify-between text-xs sm:text-sm gap-2 min-w-0 w-full">
                                            <span className="text-slate-400 font-medium flex-shrink-0">Category</span>
                                            <span className="font-bold text-slate-700 truncate ml-2 min-w-0">{appointment.caseCategory}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs sm:text-sm gap-2 min-w-0 w-full">
                                            <span className="text-slate-400 font-medium flex-shrink-0">Date</span>
                                            <span className="font-bold text-slate-700 truncate min-w-0">
                                                {new Date(appointment.appointmentDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs sm:text-sm gap-2 min-w-0 w-full">
                                            <span className="text-slate-400 font-medium flex-shrink-0">Time</span>
                                            <span className="font-bold text-slate-700 uppercase text-[10px] sm:text-xs truncate min-w-0">{appointment.timeSlot}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs sm:text-sm gap-2 min-w-0 w-full">
                                            <span className="text-slate-400 font-medium flex-shrink-0">Type</span>
                                            <span className="font-bold text-slate-700 text-[10px] sm:text-xs truncate min-w-0">{appointment.consultationType}</span>
                                        </div>
                                    </div>
                                    <div className="pt-3 sm:pt-4 border-t border-slate-100">
                                        <button className="w-full py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all">
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* Public Results Section */
                <div className="max-w-6xl mx-auto px-2 sm:px-4 w-full overflow-x-hidden" style={{ maxWidth: 'calc(100vw - 1rem)' }}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-6 sm:mb-8">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900">Public Case References</h2>
                        <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Showing Public Data Only</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6 w-full">
                        {publicCases.map((item) => (
                        <div key={item.id} className="bg-white rounded-xl sm:rounded-2xl md:rounded-[2rem] p-4 sm:p-6 md:p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:border-blue-100 transition-all group w-full max-w-full overflow-hidden">
                            <div className="flex justify-between items-start mb-4 sm:mb-6 gap-3 min-w-0 w-full">
                                <div className="space-y-1 flex-1 min-w-0 overflow-hidden">
                                    <span className="inline-block px-2 sm:px-3 py-1 bg-slate-100 text-slate-600 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-2 truncate max-w-full">
                                        {item.id}
                                    </span>
                                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2 break-words overflow-hidden">
                                        {item.title}
                                    </h3>
                                </div>
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                    <Scale className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                            </div>

                            <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 w-full">
                                <div className="flex items-center justify-between text-xs sm:text-sm gap-2 min-w-0 w-full">
                                    <span className="text-slate-400 font-medium flex-shrink-0">Category</span>
                                    <span className="font-bold text-slate-700 truncate ml-2 min-w-0">{item.category}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs sm:text-sm gap-2 min-w-0 w-full">
                                    <span className="text-slate-400 font-medium flex-shrink-0">Court</span>
                                    <span className="font-bold text-slate-700 truncate ml-2 text-[10px] sm:text-xs min-w-0">{item.court}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs sm:text-sm gap-2 min-w-0 w-full">
                                    <span className="text-slate-400 font-medium flex-shrink-0">Status</span>
                                    <span className={`font-bold text-[10px] sm:text-xs truncate min-w-0 ${item.status.includes('Reserved') ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {item.status}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <button
                                    onClick={() => setSelectedCase(item)}
                                    className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-slate-200 font-bold text-xs sm:text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">View Summary</span>
                                    <span className="sm:hidden">Summary</span>
                                </button>
                                <NavLink to="/appointment" className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-slate-900 font-bold text-xs sm:text-sm text-white hover:bg-slate-800 transition-colors shadow-lg">
                                    <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">Consult Lawyer</span>
                                    <span className="sm:hidden">Consult</span>
                                </NavLink>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            )}

            {/* Appointment Details Modal (for Lawyers) */}
            {selectedAppointment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4 sm:mb-6 gap-3">
                            <div className="flex-1 min-w-0">
                                {selectedAppointment.caseId && (
                                    <span className="inline-block px-2 sm:px-3 py-1 bg-blue-100 text-blue-600 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2 sm:mb-3">
                                        {selectedAppointment.caseId}
                                    </span>
                                )}
                                <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 leading-tight truncate">
                                    {selectedAppointment.fullName}
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-500 mt-1 truncate">{selectedAppointment.emailId}</p>
                            </div>
                            <button
                                onClick={() => setSelectedAppointment(null)}
                                className="p-1.5 sm:p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                            >
                                <X className="h-5 w-5 sm:h-6 sm:w-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                            <div className="p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                                <p className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 mb-1">Category</p>
                                <p className="font-bold text-xs sm:text-sm text-slate-700 truncate">{selectedAppointment.caseCategory}</p>
                            </div>
                            <div className="p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                                <p className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 mb-1">Appointment Date</p>
                                <p className="font-bold text-xs sm:text-sm text-slate-700">
                                    {new Date(selectedAppointment.appointmentDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                                <p className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 mb-1">Time Slot</p>
                                <p className="font-bold text-xs sm:text-sm text-slate-700 uppercase">{selectedAppointment.timeSlot}</p>
                            </div>
                            <div className="p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                                <p className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 mb-1">Consultation Type</p>
                                <p className="font-bold text-xs sm:text-sm text-slate-700">{selectedAppointment.consultationType}</p>
                            </div>
                        </div>

                        <div className="mb-4 sm:mb-6">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-widest mb-2 sm:mb-3">Case Description</h4>
                            <p className="text-slate-600 leading-relaxed text-xs sm:text-sm bg-blue-50/50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-blue-50 max-h-32 sm:max-h-none overflow-y-auto">
                                {selectedAppointment.description}
                            </p>
                        </div>

                        {/* Hearing Details Section */}
                        <div className="mb-4 sm:mb-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                                <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-widest">Court Hearing Details</h4>
                                {!isEditingHearing ? (
                                    <button
                                        onClick={() => {
                                            setIsEditingHearing(true);
                                            setHearingForm({
                                                courtHearingDate: selectedAppointment.courtHearingDate || '',
                                                currentHearingReport: selectedAppointment.currentHearingReport || '',
                                                nextHearingDate: selectedAppointment.nextHearingDate || ''
                                            });
                                        }}
                                        className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
                                    >
                                        <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        <span>Update Details</span>
                                    </button>
                                ) : (
                                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={async () => {
                                                setIsSaving(true);
                                                try {
                                                    await updateHearingDetails(
                                                        selectedAppointment.id,
                                                        hearingForm.courtHearingDate,
                                                        hearingForm.currentHearingReport,
                                                        hearingForm.nextHearingDate,
                                                        lawyerData.id
                                                    );
                                                    // Reload cases to get updated data
                                                    await loadDistrictCases(lawyerData.district);
                                                    // Update the selected appointment with new data
                                                    const updated = districtCases.find(c => c.id === selectedAppointment.id);
                                                    if (updated) {
                                                        setSelectedAppointment({
                                                            ...updated,
                                                            courtHearingDate: hearingForm.courtHearingDate,
                                                            currentHearingReport: hearingForm.currentHearingReport,
                                                            nextHearingDate: hearingForm.nextHearingDate
                                                        });
                                                    }
                                                    setIsEditingHearing(false);
                                                    alert('Hearing details updated successfully!');
                                                } catch (error: any) {
                                                    console.error('Error updating hearing details:', error);
                                                    const errorMessage = error?.message || 'Failed to update hearing details. Please try again.';
                                                    alert(errorMessage);
                                                } finally {
                                                    setIsSaving(false);
                                                }
                                            }}
                                            disabled={isSaving}
                                            className="px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
                                        >
                                            <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            <span>{isSaving ? 'Saving...' : 'Save'}</span>
                                        </button>
                                        <button
                                            onClick={() => setIsEditingHearing(false)}
                                            className="px-3 sm:px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all w-full sm:w-auto"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>

                            {isEditingHearing ? (
                                <div className="space-y-3 sm:space-y-4 bg-slate-50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200">
                                    <div>
                                        <label className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 mb-2 block">Court Hearing Date</label>
                                        <input
                                            type="date"
                                            value={hearingForm.courtHearingDate}
                                            onChange={(e) => setHearingForm({ ...hearingForm, courtHearingDate: e.target.value })}
                                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 mb-2 block">Current Hearing Report</label>
                                        <textarea
                                            value={hearingForm.currentHearingReport}
                                            onChange={(e) => setHearingForm({ ...hearingForm, currentHearingReport: e.target.value })}
                                            rows={4}
                                            placeholder="Enter hearing report details..."
                                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 mb-2 block">Next Hearing Date</label>
                                        <input
                                            type="date"
                                            value={hearingForm.nextHearingDate}
                                            onChange={(e) => setHearingForm({ ...hearingForm, nextHearingDate: e.target.value })}
                                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3 sm:space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div className="p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                                            <p className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 mb-1">Court Hearing Date</p>
                                            <p className="font-bold text-xs sm:text-sm text-slate-700">
                                                {selectedAppointment.courtHearingDate 
                                                    ? new Date(selectedAppointment.courtHearingDate).toLocaleDateString()
                                                    : 'Not set'
                                                }
                                            </p>
                                        </div>
                                        <div className="p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                                            <p className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 mb-1">Next Hearing Date</p>
                                            <p className="font-bold text-xs sm:text-sm text-slate-700">
                                                {selectedAppointment.nextHearingDate 
                                                    ? new Date(selectedAppointment.nextHearingDate).toLocaleDateString()
                                                    : 'Not set'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    {selectedAppointment.currentHearingReport && (
                                        <div className="p-3 sm:p-4 bg-blue-50/50 rounded-xl sm:rounded-2xl border border-blue-100">
                                            <p className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 mb-2">Current Hearing Report</p>
                                            <p className="text-slate-700 leading-relaxed text-xs sm:text-sm max-h-32 sm:max-h-none overflow-y-auto">
                                                {selectedAppointment.currentHearingReport}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-slate-100">
                            <button
                                onClick={() => {
                                    setSelectedAppointment(null);
                                    setIsEditingHearing(false);
                                }}
                                className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-slate-500 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors w-full sm:w-auto"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Summary Modal */}
            {selectedCase && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-[2.5rem] p-4 sm:p-6 md:p-8 lg:p-10 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-blue-500/10 rounded-full blur-2xl -mr-6 sm:-mr-10 -mt-6 sm:-mt-10"></div>

                        <div className="flex justify-between items-start mb-4 sm:mb-6 gap-3">
                            <div className="flex-1 min-w-0">
                                <span className="inline-block px-2 sm:px-3 py-1 bg-slate-100 text-slate-600 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-2 sm:mb-3">
                                    {selectedCase.id}
                                </span>
                                <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 leading-tight max-w-md">
                                    {selectedCase.title}
                                </h3>
                            </div>
                            <button
                                onClick={() => setSelectedCase(null)}
                                className="p-1.5 sm:p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                            >
                                <X className="h-5 w-5 sm:h-6 sm:w-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                            <div className="p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                                <p className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 mb-1">Court</p>
                                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-700">
                                    <Gavel className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                                    <span className="truncate">{selectedCase.court}</span>
                                </div>
                            </div>
                            <div className="p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                                <p className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 mb-1">Procedural Status</p>
                                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-700">
                                    <span className={`w-2 h-2 rounded-full ${selectedCase.status.includes('Reserved') ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                    <span className="truncate">{selectedCase.status}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6 sm:mb-8">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-widest mb-2 sm:mb-3">Public Summary</h4>
                            <p className="text-slate-600 leading-relaxed text-xs sm:text-sm bg-blue-50/50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-blue-50 max-h-40 sm:max-h-none overflow-y-auto">
                                {selectedCase.summary}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-6 pt-4 sm:pt-6 border-t border-slate-100">
                            <div className="flex items-center gap-2 text-slate-500 text-[10px] sm:text-xs font-bold">
                                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span>Next Hearing: {selectedCase.nextHearing}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                                <button
                                    onClick={() => setSelectedCase(null)}
                                    className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-slate-500 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors w-full sm:w-auto"
                                >
                                    Close
                                </button>
                                <NavLink
                                    to="/appointment"
                                    className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 text-center"
                                >
                                    Consult on this Case
                                </NavLink>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CaseFinder;
