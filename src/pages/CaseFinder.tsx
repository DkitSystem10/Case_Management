import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Scale, FileText, ArrowRight, Database, AlertTriangle, BookOpen, X, Gavel, Calendar, MapPin, LogOut, User, Edit, Save } from 'lucide-react';
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
        <div className="space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
            {/* Lawyer Dashboard Header - Only Username and District */}
            {isLawyer && lawyerData && (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 shadow-xl">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/30">
                                    <User className="h-8 w-8" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">Username</p>
                                            <p className="text-2xl font-black">{lawyerData.username}</p>
                                        </div>
                                        <div className="w-px h-12 bg-white/30"></div>
                                        <div>
                                            <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">District</p>
                                            <p className="text-2xl font-black">{lawyerData.district}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl font-bold text-sm transition-all flex items-center gap-2 border border-white/30 shadow-lg"
                            >
                                <LogOut className="h-5 w-5" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header / Hero Section */}
            <div className={`relative bg-slate-900 rounded-[3rem] p-12 overflow-hidden shadow-2xl mx-4 ${isLawyer ? 'mt-6' : 'mt-4'} text-center`}>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

                <div className="relative z-10 max-w-4xl mx-auto space-y-6">
                    {!isLawyer && (
                        <>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/10 rounded-full text-blue-200 font-bold text-xs uppercase tracking-wider">
                                <Database className="h-4 w-4" />
                                <span>Public Archives Information</span>
                            </div>
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 inline-flex items-start gap-3 text-left max-w-2xl mx-auto">
                                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-amber-200/90 text-sm font-medium">
                                    <strong>Disclaimer:</strong> This tool is for informational purposes only and does not constitute legal advice.
                                    Data shown is based on publicly available references and does not contain confidential personal details.
                                </p>
                            </div>
                        </>
                    )}

                    <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">
                        {isLawyer ? `${lawyerData?.district} District Cases` : 'Case Finder'}
                    </h1>
                    <p className="text-xl text-slate-300 font-medium">
                        {isLawyer 
                            ? `View and manage approved cases from ${lawyerData?.district} district`
                            : 'Access your district cases'
                        }
                    </p>
                </div>
            </div>

            {/* Search & Filter Interface - Only for non-lawyers */}
            {!isLawyer && (
                <div className="max-w-6xl mx-auto px-4 -mt-10 relative z-20">
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Search className="h-5 w-5 text-blue-600" />
                            Search Public Records
                        </h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-400 ml-1">Case Category</label>
                            <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer">
                                <option value="">Select Category</option>
                                {['Civil', 'Criminal', 'Family', 'Corporate', 'Property', 'Labour', 'Consumer', 'Others'].map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-400 ml-1">Court Level</label>
                            <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer">
                                <option value="">Select Court</option>
                                {['Supreme Court', 'High Court', 'District Court'].map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-400 ml-1">Year</label>
                            <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer">
                                <option value="">Select Year</option>
                                {['2024', '2023', '2022', '2021', 'Older'].map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-400 ml-1">Keywords</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Topic or Reference..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400/70"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-600/25 active:scale-95">
                            <ArrowRight className="h-4 w-4" />
                            Find References
                        </button>
                    </div>
                </div>
            </div>
            )}

            {/* District Cases Section (for Lawyers) */}
            {isLawyer ? (
                <div className="max-w-7xl mx-auto px-4">
                    {/* Top Left - Case ID Search */}
                    <div className="mb-6">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Search by Case ID</label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
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
                                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all uppercase"
                                        />
                                    </div>
                                </div>
                                {caseIdSearch && (
                                    <button
                                        onClick={() => {
                                            setCaseIdSearch('');
                                            setFilteredCases(districtCases);
                                        }}
                                        className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shrink-0"
                                    >
                                        <X className="h-4 w-4" />
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Cases List */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-black text-slate-900">District Cases</h2>
                        <p className="text-sm text-slate-500 font-bold mt-1">
                            {filteredCases.length} Approved {filteredCases.length === 1 ? 'Case' : 'Cases'} from {lawyerData?.district}
                        </p>
                    </div>

                    {filteredCases.length === 0 ? (
                        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-sm p-20 text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <FileText className="h-10 w-10 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-3">
                                {caseIdSearch ? 'No Cases Found' : 'No Cases Found'}
                            </h3>
                            <p className="text-slate-500 font-semibold text-sm max-w-md mx-auto">
                                {caseIdSearch 
                                    ? `No cases found matching Case ID: ${caseIdSearch}. Try a different Case ID.`
                                    : `There are no approved cases in ${lawyerData?.district} district yet. Approved appointments will appear here.`
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredCases.map((appointment) => (
                                <div 
                                    key={appointment.id} 
                                    onClick={() => setSelectedAppointment(appointment)}
                                    className="bg-white rounded-2xl p-6 shadow-sm border-2 border-slate-100 hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg">
                                            {appointment.fullName.charAt(0)}
                                        </div>
                                        {appointment.caseId && (
                                            <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                                {appointment.caseId}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                                        {appointment.fullName}
                                    </h3>
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-400 font-medium">Category</span>
                                            <span className="font-bold text-slate-700">{appointment.caseCategory}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-400 font-medium">Date</span>
                                            <span className="font-bold text-slate-700">
                                                {new Date(appointment.appointmentDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-400 font-medium">Time</span>
                                            <span className="font-bold text-slate-700 uppercase">{appointment.timeSlot}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-400 font-medium">Type</span>
                                            <span className="font-bold text-slate-700">{appointment.consultationType}</span>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-slate-100">
                                        <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all">
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
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-black text-slate-900">Public Case References</h2>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Showing Public Data Only</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {publicCases.map((item) => (
                        <div key={item.id} className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:border-blue-100 transition-all group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-1">
                                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-widest mb-2">
                                        {item.id}
                                    </span>
                                    <h3 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                                        {item.title}
                                    </h3>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                    <Scale className="h-5 w-5" />
                                </div>
                            </div>

                            <div className="space-y-3 mb-8">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400 font-medium">Category</span>
                                    <span className="font-bold text-slate-700">{item.category}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400 font-medium">Court</span>
                                    <span className="font-bold text-slate-700">{item.court}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400 font-medium">Status</span>
                                    <span className={`font-bold ${item.status.includes('Reserved') ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {item.status}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setSelectedCase(item)}
                                    className="flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    <BookOpen className="h-4 w-4" />
                                    View Summary
                                </button>
                                <NavLink to="/appointment" className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 font-bold text-sm text-white hover:bg-slate-800 transition-colors shadow-lg">
                                    <FileText className="h-4 w-4" />
                                    Consult Lawyer
                                </NavLink>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            )}

            {/* Appointment Details Modal (for Lawyers) */}
            {selectedAppointment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 md:p-10 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                {selectedAppointment.caseId && (
                                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-xs font-bold uppercase tracking-widest mb-3">
                                        {selectedAppointment.caseId}
                                    </span>
                                )}
                                <h3 className="text-2xl font-black text-slate-900 leading-tight">
                                    {selectedAppointment.fullName}
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">{selectedAppointment.emailId}</p>
                            </div>
                            <button
                                onClick={() => setSelectedAppointment(null)}
                                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-xs font-bold uppercase text-slate-400 mb-1">Category</p>
                                <p className="font-bold text-slate-700">{selectedAppointment.caseCategory}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-xs font-bold uppercase text-slate-400 mb-1">Appointment Date</p>
                                <p className="font-bold text-slate-700">
                                    {new Date(selectedAppointment.appointmentDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-xs font-bold uppercase text-slate-400 mb-1">Time Slot</p>
                                <p className="font-bold text-slate-700 uppercase">{selectedAppointment.timeSlot}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-xs font-bold uppercase text-slate-400 mb-1">Consultation Type</p>
                                <p className="font-bold text-slate-700">{selectedAppointment.consultationType}</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-3">Case Description</h4>
                            <p className="text-slate-600 leading-relaxed text-sm bg-blue-50/50 p-6 rounded-2xl border border-blue-50">
                                {selectedAppointment.description}
                            </p>
                        </div>

                        {/* Hearing Details Section */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Court Hearing Details</h4>
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
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2"
                                    >
                                        <Edit className="h-4 w-4" />
                                        Update Details
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
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
                                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <Save className="h-4 w-4" />
                                            {isSaving ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                            onClick={() => setIsEditingHearing(false)}
                                            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-sm transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>

                            {isEditingHearing ? (
                                <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Court Hearing Date</label>
                                        <input
                                            type="date"
                                            value={hearingForm.courtHearingDate}
                                            onChange={(e) => setHearingForm({ ...hearingForm, courtHearingDate: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Current Hearing Report</label>
                                        <textarea
                                            value={hearingForm.currentHearingReport}
                                            onChange={(e) => setHearingForm({ ...hearingForm, currentHearingReport: e.target.value })}
                                            rows={4}
                                            placeholder="Enter hearing report details..."
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Next Hearing Date</label>
                                        <input
                                            type="date"
                                            value={hearingForm.nextHearingDate}
                                            onChange={(e) => setHearingForm({ ...hearingForm, nextHearingDate: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <p className="text-xs font-bold uppercase text-slate-400 mb-1">Court Hearing Date</p>
                                            <p className="font-bold text-slate-700">
                                                {selectedAppointment.courtHearingDate 
                                                    ? new Date(selectedAppointment.courtHearingDate).toLocaleDateString()
                                                    : 'Not set'
                                                }
                                            </p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <p className="text-xs font-bold uppercase text-slate-400 mb-1">Next Hearing Date</p>
                                            <p className="font-bold text-slate-700">
                                                {selectedAppointment.nextHearingDate 
                                                    ? new Date(selectedAppointment.nextHearingDate).toLocaleDateString()
                                                    : 'Not set'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    {selectedAppointment.currentHearingReport && (
                                        <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                            <p className="text-xs font-bold uppercase text-slate-400 mb-2">Current Hearing Report</p>
                                            <p className="text-slate-700 leading-relaxed text-sm">
                                                {selectedAppointment.currentHearingReport}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                            <button
                                onClick={() => {
                                    setSelectedAppointment(null);
                                    setIsEditingHearing(false);
                                }}
                                className="px-6 py-3 rounded-xl text-slate-500 font-bold text-sm hover:bg-slate-50 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Summary Modal */}
            {selectedCase && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>

                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-widest mb-3">
                                    {selectedCase.id}
                                </span>
                                <h3 className="text-2xl font-black text-slate-900 leading-tight max-w-md">
                                    {selectedCase.title}
                                </h3>
                            </div>
                            <button
                                onClick={() => setSelectedCase(null)}
                                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-xs font-bold uppercase text-slate-400 mb-1">Court</p>
                                <div className="flex items-center gap-2 font-bold text-slate-700">
                                    <Gavel className="h-4 w-4 text-slate-400" />
                                    {selectedCase.court}
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-xs font-bold uppercase text-slate-400 mb-1">Procedural Status</p>
                                <div className="flex items-center gap-2 font-bold text-slate-700">
                                    <span className={`w-2 h-2 rounded-full ${selectedCase.status.includes('Reserved') ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                    {selectedCase.status}
                                </div>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-3">Public Summary</h4>
                            <p className="text-slate-600 leading-relaxed text-sm bg-blue-50/50 p-6 rounded-2xl border border-blue-50">
                                {selectedCase.summary}
                            </p>
                        </div>

                        <div className="flex items-center justify-between gap-6 pt-6 border-t border-slate-100">
                            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                                <Calendar className="h-4 w-4" />
                                Next Hearing: {selectedCase.nextHearing}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedCase(null)}
                                    className="px-6 py-3 rounded-xl text-slate-500 font-bold text-sm hover:bg-slate-50 transition-colors"
                                >
                                    Close
                                </button>
                                <NavLink
                                    to="/appointment"
                                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
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
