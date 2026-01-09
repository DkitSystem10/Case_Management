import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User,
    Phone,
    Mail,
    MapPin,
    Calendar,
    Clock,
    Video,
    Users,
    Briefcase,
    ChevronRight,
    ChevronLeft,
    ClipboardList,
    Gavel,
    AlertCircle,
    CheckCircle2,
    Upload,
    FileText,
    Building2,
    Scale,
    DollarSign,
    FileCheck,
    Flag
} from 'lucide-react';

import { saveAppointment, uploadDocument } from '../utils/storage';

interface AppointmentFormData {
    // Client Details
    fullName: string;
    clientId: string;
    phoneNumber: string;
    address: string;
    clientType: 'Individual' | 'Company';
    
    // Case Information
    caseId: string;
    caseTitle: string;
    caseType: string;
    courtName: string;
    caseStatus: 'Open' | 'Pending' | 'Closed' | 'Appeal';
    
    // Branch & Control Information
    branchName: string;
    branchLocation: string;
    assignedAdvocate: string;
    
    // Case Progress & Dates
    filingDate: string;
    lastHearingDate: string;
    nextHearingDate: string;
    stageOfCase: 'Evidence' | 'Argument' | 'Judgment';
    
    // Financial
    feeType: 'Fixed' | 'Stage-wise';
    totalFee: string;
    paidAmount: string;
    balanceAmount: string;
    paymentStatus: string;
    
    // Documents & Notes
    documentsStatus: 'Uploaded' | 'Pending';
    importantNotes: string;
    casePriority: 'High' | 'Medium' | 'Low';
    
    // Legacy fields (for compatibility)
    emailId: string;
    city: string;
    cityName?: string;
    state: string;
    appointmentDate: string;
    timeSlot: string;
    consultationType: 'In-Person' | 'Online' | 'Phone';
    caseCategory: string;
    description: string;
    documentUrl?: string;
}

const Appointment: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<AppointmentFormData>({
        fullName: '',
        clientId: '',
        phoneNumber: '',
        address: '',
        clientType: 'Individual',
        caseId: '',
        caseTitle: '',
        caseType: '',
        courtName: '',
        caseStatus: 'Open',
        branchName: '',
        branchLocation: '',
        assignedAdvocate: '',
        filingDate: '',
        lastHearingDate: '',
        nextHearingDate: '',
        stageOfCase: 'Evidence',
        feeType: 'Fixed',
        totalFee: '',
        paidAmount: '',
        balanceAmount: '',
        paymentStatus: '',
        documentsStatus: 'Pending',
        importantNotes: '',
        casePriority: 'Medium',
        emailId: '',
        city: '',
        cityName: '',
        state: 'Tamil Nadu',
        appointmentDate: '',
        timeSlot: '',
        consultationType: 'In-Person',
        caseCategory: '',
        description: '',
    });

    const [uploading, setUploading] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof AppointmentFormData, string>>>({});
    const [modal, setModal] = useState<{ show: boolean, title: string, message: string | string[], isError: boolean }>({
        show: false,
        title: '',
        message: '',
        isError: false
    });

    // Auto-calculate balance amount when totalFee or paidAmount changes
    useEffect(() => {
        if (formData.totalFee || formData.paidAmount) {
            const totalFeeNum = parseFloat(formData.totalFee) || 0;
            const paidAmountNum = parseFloat(formData.paidAmount) || 0;
            const balanceAmountNum = totalFeeNum - paidAmountNum;
            
            setFormData(prev => ({
                ...prev,
                balanceAmount: balanceAmountNum >= 0 ? balanceAmountNum.toString() : '0'
            }));
        }
    }, [formData.totalFee, formData.paidAmount]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        let { name, value } = e.target;

        if (name === 'phoneNumber') {
            value = value.replace(/\D/g, '').slice(0, 10);
        }

        if (name === 'fullName') {
            value = value.replace(/[^a-zA-Z\s]/g, '');
        }

        if (name === 'totalFee' || name === 'paidAmount') {
            value = value.replace(/\D/g, '');
        }

        // Prevent editing balanceAmount directly
        if (name === 'balanceAmount') {
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));

        if (errors[name as keyof AppointmentFormData]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setModal({
                show: true,
                title: 'File Too Large',
                message: 'Maximum file size permitted is 5MB.',
                isError: true
            });
            return;
        }

        setUploading(true);
        try {
            const url = await uploadDocument(file);
            setFormData(prev => ({ ...prev, documentUrl: url, documentsStatus: 'Uploaded' }));
        } catch (error) {
            console.error('Upload Error:', error);
            setModal({
                show: true,
                title: 'Upload Failed',
                message: 'Could not upload the document. Please try again.',
                isError: true
            });
        } finally {
            setUploading(false);
        }
    };

    const validateForm = () => {
        const newErrors: Partial<Record<keyof AppointmentFormData, string>> = {};
        
        if (!formData.fullName) newErrors.fullName = 'Client Name is required';
        if (!formData.clientId) newErrors.clientId = 'Client ID is required';
        if (!formData.phoneNumber) {
            newErrors.phoneNumber = 'Contact Number is required';
        } else if (formData.phoneNumber.length !== 10) {
            newErrors.phoneNumber = 'Contact Number must be exactly 10 digits';
        }
        if (!formData.address) newErrors.address = 'Client Address is required';
        if (!formData.caseId) newErrors.caseId = 'Case ID / Case No is required';
        if (!formData.caseTitle) newErrors.caseTitle = 'Case Title / Party Name is required';
        if (!formData.caseType) newErrors.caseType = 'Case Type is required';
        if (!formData.courtName) newErrors.courtName = 'Court Name is required';
        if (!formData.branchName) newErrors.branchName = 'Branch Name is required';
        if (!formData.branchLocation) newErrors.branchLocation = 'Branch Location is required';
        if (!formData.assignedAdvocate) newErrors.assignedAdvocate = 'Assigned Advocate is required';
        if (!formData.filingDate) newErrors.filingDate = 'Filing Date is required';
        if (!formData.totalFee) newErrors.totalFee = 'Total Fee is required';
        if (!formData.paidAmount) newErrors.paidAmount = 'Paid Amount is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            setIsSubmitting(true);
            try {
                // Calculate balance amount
                const totalFeeNum = parseFloat(formData.totalFee) || 0;
                const paidAmountNum = parseFloat(formData.paidAmount) || 0;
                const balanceAmountNum = totalFeeNum - paidAmountNum;

                await saveAppointment({
                    ...formData,
                    balanceAmount: balanceAmountNum.toString(),
                    consultationFee: 0,
                    caseFee: 0,
                    caseCategory: formData.caseType || 'Others',
                    description: formData.importantNotes || '',
                    appointmentDate: formData.filingDate || new Date().toISOString().split('T')[0],
                    timeSlot: 'Morning',
                    city: formData.branchLocation || '',
                });

                setModal({
                    show: true,
                    title: 'Registration Successful!',
                    message: 'Your appointment has been submitted successfully. Please wait for the approved message through your mail. Our legal team will review it and notify you shortly.',
                    isError: false
                });

                // Reset form
                setFormData({
                    fullName: '',
                    clientId: '',
                    phoneNumber: '',
                    address: '',
                    clientType: 'Individual',
                    caseId: '',
                    caseTitle: '',
                    caseType: '',
                    courtName: '',
                    caseStatus: 'Open',
                    branchName: '',
                    branchLocation: '',
                    assignedAdvocate: '',
                    filingDate: '',
                    lastHearingDate: '',
                    nextHearingDate: '',
                    stageOfCase: 'Evidence',
                    feeType: 'Fixed',
                    totalFee: '',
                    paidAmount: '',
                    balanceAmount: '',
                    paymentStatus: '',
                    documentsStatus: 'Pending',
                    importantNotes: '',
                    casePriority: 'Medium',
                    emailId: '',
                    city: '',
                    cityName: '',
                    state: 'Tamil Nadu',
                    appointmentDate: '',
                    timeSlot: '',
                    consultationType: 'In-Person',
                    caseCategory: '',
                    description: '',
                });
            } catch (error: any) {
                setModal({
                    show: true,
                    title: 'Submission Failed',
                    message: error.message || 'Something went wrong. Please check your connection and try again.',
                    isError: true
                });
                console.error('Submission Error:', error);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const caseTypes = ["Civil", "Criminal", "Corporate", "Family", "Property", "Tax", "Labour", "Others"];
    const tamilNaduDistricts = [
        "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode",
        "Kallakurichi", "Kancheepuram", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam",
        "Namakal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga",
        "Tenkasi", "Thanjavur", "Theni", "Thiruvallur", "Thiruvarur", "Thoothukudi", "Tiruchirappalli",
        "Tirunelveli", "Tirupattur", "Tiruppur", "Tiruvannamalai", "Vellore", "Viluppuram", "Virudhunagar"
    ];

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
                <div className="relative z-10">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/admin')}
                        className="flex items-center gap-2 mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all group text-sm font-bold uppercase tracking-widest backdrop-blur-sm border border-white/20"
                    >
                        <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Back to Dashboard
                    </button>
                    <h1 className="text-4xl font-black tracking-tight mb-3">Schedule Appointment</h1>
                    <p className="text-slate-300 text-lg max-w-2xl leading-relaxed">
                        Complete case registration form with comprehensive client and case details
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 pb-20">
                {/* Client Details Section */}
                <section className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-200 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Client Details</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Client Name <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    placeholder="Enter client name"
                                    className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.fullName ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                                />
                            </div>
                            {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Client ID <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    name="clientId"
                                    value={formData.clientId}
                                    onChange={handleInputChange}
                                    placeholder="Enter client ID"
                                    className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.clientId ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                                />
                            </div>
                            {errors.clientId && <p className="text-xs text-red-500">{errors.clientId}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Contact Number <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    placeholder="Enter contact number"
                                    className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.phoneNumber ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                                />
                            </div>
                            {errors.phoneNumber && <p className="text-xs text-red-500">{errors.phoneNumber}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Client Type <span className="text-red-500">*</span></label>
                            <div className="flex gap-3">
                                {(['Individual', 'Company'] as const).map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, clientType: type }))}
                                        className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                                            formData.clientType === type
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                                : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-bold text-slate-700">Client Address <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <textarea
                                    name="address"
                                    rows={3}
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    placeholder="Enter complete address"
                                    className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.address ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                                />
                            </div>
                            {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
                        </div>
                    </div>
                </section>

                {/* Case Information Section */}
                <section className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-slate-200 flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                            <Gavel className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Case Information</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Case ID / Case No <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    name="caseId"
                                    value={formData.caseId}
                                    onChange={handleInputChange}
                                    placeholder="Enter case ID"
                                    className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.caseId ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                                />
                            </div>
                            {errors.caseId && <p className="text-xs text-red-500">{errors.caseId}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Case Title / Party Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="caseTitle"
                                value={formData.caseTitle}
                                onChange={handleInputChange}
                                placeholder="Enter case title"
                                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.caseTitle ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                            />
                            {errors.caseTitle && <p className="text-xs text-red-500">{errors.caseTitle}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Case Type <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Scale className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <select
                                    name="caseType"
                                    value={formData.caseType}
                                    onChange={handleInputChange}
                                    className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none bg-white ${errors.caseType ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                                >
                                    <option value="">Select case type</option>
                                    {caseTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            {errors.caseType && <p className="text-xs text-red-500">{errors.caseType}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Court Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="courtName"
                                value={formData.courtName}
                                onChange={handleInputChange}
                                placeholder="Enter court name"
                                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.courtName ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                            />
                            {errors.courtName && <p className="text-xs text-red-500">{errors.courtName}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Case Status <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Flag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <select
                                    name="caseStatus"
                                    value={formData.caseStatus}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none bg-white"
                                >
                                    <option value="Open">Open</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Closed">Closed</option>
                                    <option value="Appeal">Appeal</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Branch & Control Information Section */}
                <section className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-slate-200 flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Branch & Control Information</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Branch Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="branchName"
                                value={formData.branchName}
                                onChange={handleInputChange}
                                placeholder="Enter branch name"
                                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.branchName ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                            />
                            {errors.branchName && <p className="text-xs text-red-500">{errors.branchName}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Branch Location <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <select
                                    name="branchLocation"
                                    value={formData.branchLocation}
                                    onChange={handleInputChange}
                                    className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none bg-white ${errors.branchLocation ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                                >
                                    <option value="">Select branch location</option>
                                    {tamilNaduDistricts.map(district => (
                                        <option key={district} value={district}>{district}</option>
                                    ))}
                                </select>
                            </div>
                            {errors.branchLocation && <p className="text-xs text-red-500">{errors.branchLocation}</p>}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-bold text-slate-700">Assigned Advocate <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="assignedAdvocate"
                                value={formData.assignedAdvocate}
                                onChange={handleInputChange}
                                placeholder="Enter assigned advocate name"
                                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.assignedAdvocate ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                            />
                            {errors.assignedAdvocate && <p className="text-xs text-red-500">{errors.assignedAdvocate}</p>}
                        </div>
                    </div>
                </section>

                {/* Case Progress & Dates Section */}
                <section className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-slate-200 flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Case Progress & Dates</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Filing Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                name="filingDate"
                                value={formData.filingDate}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.filingDate ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                            />
                            {errors.filingDate && <p className="text-xs text-red-500">{errors.filingDate}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Last Hearing Date</label>
                            <input
                                type="date"
                                name="lastHearingDate"
                                value={formData.lastHearingDate}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Next Hearing Date</label>
                            <input
                                type="date"
                                name="nextHearingDate"
                                value={formData.nextHearingDate}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Stage of Case</label>
                            <div className="relative">
                                <ClipboardList className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <select
                                    name="stageOfCase"
                                    value={formData.stageOfCase}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none bg-white"
                                >
                                    <option value="Evidence">Evidence</option>
                                    <option value="Argument">Argument</option>
                                    <option value="Judgment">Judgment</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Financial Section */}
                <section className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-200 flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Financial</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Fee Type</label>
                            <div className="flex gap-3">
                                {(['Fixed', 'Stage-wise'] as const).map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, feeType: type }))}
                                        className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                                            formData.feeType === type
                                                ? 'bg-green-600 text-white border-green-600 shadow-md'
                                                : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Total Fee <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    name="totalFee"
                                    value={formData.totalFee}
                                    onChange={handleInputChange}
                                    placeholder="Enter total fee"
                                    className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.totalFee ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                                />
                            </div>
                            {errors.totalFee && <p className="text-xs text-red-500">{errors.totalFee}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Paid Amount <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    name="paidAmount"
                                    value={formData.paidAmount}
                                    onChange={handleInputChange}
                                    placeholder="Enter paid amount"
                                    className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.paidAmount ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                                />
                            </div>
                            {errors.paidAmount && <p className="text-xs text-red-500">{errors.paidAmount}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Balance Amount</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    name="balanceAmount"
                                    value={formData.balanceAmount || '0'}
                                    readOnly
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-100 text-slate-600 cursor-not-allowed font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Payment Status</label>
                            <input
                                type="text"
                                name="paymentStatus"
                                value={formData.paymentStatus}
                                onChange={handleInputChange}
                                placeholder="Enter payment status"
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                </section>

                {/* Documents & Notes Section */}
                <section className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-slate-200 flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                            <FileCheck className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Documents & Notes</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Documents Status</label>
                            <div className="flex gap-3">
                                {(['Uploaded', 'Pending'] as const).map((status) => (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, documentsStatus: status }))}
                                        className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                                            formData.documentsStatus === status
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                                : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                                        }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Upload Documents</label>
                            <div className="relative">
                                <div className={`flex items-center justify-between p-4 rounded-xl border-2 border-dashed transition-all ${uploading ? 'bg-slate-50 border-blue-300' : formData.documentUrl ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${formData.documentUrl ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                            {uploading ? (
                                                <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            ) : formData.documentUrl ? (
                                                <FileText className="h-5 w-5" />
                                            ) : (
                                                <Upload className="h-5 w-5" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700">
                                                {uploading ? 'Uploading document...' : formData.documentUrl ? 'Document Uploaded' : 'Upload Case Documents'}
                                            </p>
                                            <p className="text-xs text-slate-400">PDF, JPG, PNG (Max 5MB)</p>
                                        </div>
                                    </div>
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        disabled={uploading}
                                        accept=".pdf,.jpg,.jpeg,.png"
                                    />
                                    {formData.documentUrl && !uploading && (
                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded">READY</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Important Notes / Remarks</label>
                            <textarea
                                name="importantNotes"
                                rows={4}
                                value={formData.importantNotes}
                                onChange={handleInputChange}
                                placeholder="Enter important notes or remarks"
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Case Priority</label>
                            <div className="flex gap-3">
                                {(['High', 'Medium', 'Low'] as const).map((priority) => (
                                    <button
                                        key={priority}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, casePriority: priority }))}
                                        className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                                            formData.casePriority === priority
                                                ? priority === 'High' ? 'bg-red-600 text-white border-red-600 shadow-md' :
                                                  priority === 'Medium' ? 'bg-amber-600 text-white border-amber-600 shadow-md' :
                                                  'bg-green-600 text-white border-green-600 shadow-md'
                                                : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                                        }`}
                                    >
                                        {priority}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-6">
                    <button
                        type="button"
                        className="w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-4 rounded-xl text-base font-black text-white shadow-xl transition-all hover:-translate-y-0.5 ${
                            isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                        }`}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Appointment'}
                        {!isSubmitting && <ChevronRight className="h-5 w-5" />}
                    </button>
                </div>
            </form>

            {/* Modal */}
            {modal.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className={`p-10 text-center ${modal.isError ? 'bg-red-50/50' : 'bg-emerald-50/50'}`}>
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${modal.isError ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                {modal.isError ? <AlertCircle className="h-10 w-10" /> : <CheckCircle2 className="h-10 w-10" />}
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-4 leading-tight">{modal.title}</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">{modal.message}</p>
                            <button
                                onClick={() => {
                                    setModal(prev => ({ ...prev, show: false }));
                                    if (!modal.isError) {
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }
                                }}
                                className={`w-full mt-8 py-4 rounded-xl font-bold text-white transition-all active:scale-95 shadow-lg ${modal.isError ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'}`}
                            >
                                {modal.isError ? 'Try Again' : 'OK'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Appointment;
