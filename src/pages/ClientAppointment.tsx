import React, { useState } from 'react';
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
    Upload,
    FileText,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { saveClientAppointment, uploadDocument } from '../utils/storage';

interface ClientAppointmentFormData {
    fullName: string;
    phoneNumber: string;
    emailId: string;
    address: string;
    state: string;
    district: string;
    alreadyCome: 'Yes' | 'No';
    appointmentDate: string;
    timeSlot: string;
    consultationType: 'In-Person' | 'Online (Video)' | 'Phone';
    caseCategory: string;
    description: string;
    documentUrl?: string;
}

const ClientAppointment: React.FC = () => {
    const [formData, setFormData] = useState<ClientAppointmentFormData>({
        fullName: '',
        phoneNumber: '',
        emailId: '',
        address: '',
        state: '',
        district: '',
        alreadyCome: 'No',
        appointmentDate: '',
        timeSlot: '',
        consultationType: 'In-Person',
        caseCategory: '',
        description: '',
        documentUrl: undefined
    });

    const [errors, setErrors] = useState<Partial<Record<keyof ClientAppointmentFormData, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [modal, setModal] = useState({
        show: false,
        title: '',
        message: '',
        isError: false
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        let { name, value } = e.target;

        if (name === 'phoneNumber') {
            value = value.replace(/\D/g, '').slice(0, 10);
        }

        if (name === 'fullName') {
            value = value.replace(/[^a-zA-Z\s]/g, '');
        }

        setFormData(prev => ({ ...prev, [name]: value }));

        if (errors[name as keyof ClientAppointmentFormData]) {
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
            setFormData(prev => ({ ...prev, documentUrl: url }));
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
        const newErrors: Partial<Record<keyof ClientAppointmentFormData, string>> = {};

        if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
        if (!formData.phoneNumber) {
            newErrors.phoneNumber = 'Phone Number is required';
        } else if (formData.phoneNumber.length !== 10) {
            newErrors.phoneNumber = 'Phone Number must be exactly 10 digits';
        }
        if (!formData.emailId) {
            newErrors.emailId = 'Email ID is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailId)) {
            newErrors.emailId = 'Please enter a valid email address';
        }
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.state) newErrors.state = 'State is required';
        if (!formData.district) newErrors.district = 'District is required';
        if (!formData.appointmentDate) newErrors.appointmentDate = 'Appointment Date is required';
        if (!formData.timeSlot) newErrors.timeSlot = 'Time Slot is required';
        if (!formData.caseCategory) newErrors.caseCategory = 'Case Category is required';
        if (!formData.description.trim()) newErrors.description = 'Brief Description is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            setIsSubmitting(true);
            try {
                await saveClientAppointment(formData);

                setModal({
                    show: true,
                    title: 'Appointment Request Submitted!',
                    message: 'Your appointment request has been submitted successfully. Our team will review it and contact you shortly via email or phone.',
                    isError: false
                });

                // Reset form
                setFormData({
                    fullName: '',
                    phoneNumber: '',
                    emailId: '',
                    address: '',
                    state: '',
                    district: '',
                    alreadyCome: 'No',
                    appointmentDate: '',
                    timeSlot: '',
                    consultationType: 'In-Person',
                    caseCategory: '',
                    description: '',
                    documentUrl: undefined
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

    const tamilNaduDistricts = [
        "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode",
        "Kallakurichi", "Kancheepuram", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam",
        "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga",
        "Tenkasi", "Thanjavur", "Theni", "Thiruvallur", "Thiruvarur", "Thoothukudi", "Tiruchirappalli",
        "Tirunelveli", "Tirupattur", "Tiruppur", "Tiruvannamalai", "Vellore", "Viluppuram", "Virudhunagar"
    ];

    const timeSlots = [
        'Morning',
        'Afternoon'
    ];

    const caseCategories = [
        'Civil',
        'Criminal',
        'Family',
        'Property',
        'Corporate',
        'Labour',
        'Tax',
        'Others'
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-4 sm:py-8 md:py-12 px-3 sm:px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-8 md:mb-10">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 mb-2 sm:mb-3 md:mb-4 tracking-tight px-2">
                        Schedule Appointment
                    </h1>
                    <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed px-2">
                        Schedule and manage client consultations with our professional management system. 
                        Please fill in the details below to secure your slot.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                    {/* Client Details Section */}
                    <div className="p-4 sm:p-6 md:p-8 border-b border-slate-200">
                        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                                <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                            </div>
                            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900">Client Details</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                            <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5 sm:gap-2">
                                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    placeholder="Enter full name"
                                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                                        errors.fullName ? 'border-red-500 bg-red-50' : 'border-slate-300 focus:border-blue-500'
                                    }`}
                                />
                                {errors.fullName && <p className="text-xs text-red-500 font-semibold">{errors.fullName}</p>}
                            </div>

                            <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5 sm:gap-2">
                                    <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    placeholder="Enter phone number"
                                    maxLength={10}
                                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                                        errors.phoneNumber ? 'border-red-500 bg-red-50' : 'border-slate-300 focus:border-blue-500'
                                    }`}
                                />
                                {errors.phoneNumber && <p className="text-xs text-red-500 font-semibold">{errors.phoneNumber}</p>}
                            </div>

                            <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5 sm:gap-2">
                                    <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                    Email ID <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="emailId"
                                    value={formData.emailId}
                                    onChange={handleInputChange}
                                    placeholder="Enter email address"
                                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                                        errors.emailId ? 'border-red-500 bg-red-50' : 'border-slate-300 focus:border-blue-500'
                                    }`}
                                />
                                {errors.emailId && <p className="text-xs text-red-500 font-semibold">{errors.emailId}</p>}
                            </div>

                            <div className="space-y-1.5 sm:space-y-2 md:col-span-2">
                                <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5 sm:gap-2">
                                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                    Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    placeholder="Enter complete address"
                                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                                        errors.address ? 'border-red-500 bg-red-50' : 'border-slate-300 focus:border-blue-500'
                                    }`}
                                />
                                {errors.address && <p className="text-xs text-red-500 font-semibold">{errors.address}</p>}
                            </div>

                            <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5 sm:gap-2">
                                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                    State <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="state"
                                    value={formData.state}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                                        errors.state ? 'border-red-500 bg-red-50' : 'border-slate-300 focus:border-blue-500'
                                    }`}
                                >
                                    <option value="">Select State</option>
                                    <option value="Tamil Nadu">Tamil Nadu</option>
                                    <option value="Kerala">Kerala</option>
                                    <option value="Karnataka">Karnataka</option>
                                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                                    <option value="Telangana">Telangana</option>
                                    <option value="Other">Other</option>
                                </select>
                                {errors.state && <p className="text-xs text-red-500 font-semibold">{errors.state}</p>}
                            </div>

                            <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5 sm:gap-2">
                                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                    District <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="district"
                                    value={formData.district}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                                        errors.district ? 'border-red-500 bg-red-50' : 'border-slate-300 focus:border-blue-500'
                                    }`}
                                >
                                    <option value="">Select District</option>
                                    {tamilNaduDistricts.map(district => (
                                        <option key={district} value={district}>{district}</option>
                                    ))}
                                </select>
                                {errors.district && <p className="text-xs text-red-500 font-semibold">{errors.district}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Appointment Details Section */}
                    <div className="p-4 sm:p-6 md:p-8 border-b border-slate-200">
                        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                            </div>
                            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900">Appointment Details</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                            <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-bold text-slate-700">Already Come? <span className="text-red-500">*</span></label>
                                <div className="flex gap-2 sm:gap-3 md:gap-4">
                                    {(['Yes', 'No'] as const).map(option => (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, alreadyCome: option }))}
                                            className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold border-2 transition-all ${
                                                formData.alreadyCome === option
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                                            }`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5 sm:gap-2">
                                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                    Preferred Appointment Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="appointmentDate"
                                    value={formData.appointmentDate}
                                    onChange={handleInputChange}
                                    min={new Date().toISOString().split('T')[0]}
                                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                                        errors.appointmentDate ? 'border-red-500 bg-red-50' : 'border-slate-300 focus:border-blue-500'
                                    }`}
                                />
                                {errors.appointmentDate && <p className="text-xs text-red-500 font-semibold">{errors.appointmentDate}</p>}
                            </div>

                            <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5 sm:gap-2">
                                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                    Preferred Time Slot <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="timeSlot"
                                    value={formData.timeSlot}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                                        errors.timeSlot ? 'border-red-500 bg-red-50' : 'border-slate-300 focus:border-blue-500'
                                    }`}
                                >
                                    <option value="">Select a time slot</option>
                                    {timeSlots.map(slot => (
                                        <option key={slot} value={slot}>{slot}</option>
                                    ))}
                                </select>
                                {errors.timeSlot && <p className="text-xs text-red-500 font-semibold">{errors.timeSlot}</p>}
                            </div>

                            <div className="space-y-1.5 sm:space-y-2 md:col-span-2">
                                <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5 sm:gap-2">
                                    <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                    Type of Consultation <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                    {(['In-Person', 'Online (Video)', 'Phone'] as const).map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, consultationType: type }))}
                                            className={`px-2 sm:px-3 md:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold border-2 transition-all ${
                                                formData.consultationType === type
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                                            }`}
                                        >
                                            {type === 'Online (Video)' ? 'Online' : type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Case Details Section */}
                    <div className="p-4 sm:p-6 md:p-8">
                        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                                <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                            </div>
                            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900">Case Details</h2>
                        </div>
                        <div className="space-y-4 sm:space-y-5 md:space-y-6">
                            <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5 sm:gap-2">
                                    <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                    Case Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="caseCategory"
                                    value={formData.caseCategory}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                                        errors.caseCategory ? 'border-red-500 bg-red-50' : 'border-slate-300 focus:border-blue-500'
                                    }`}
                                >
                                    <option value="">Select a case category</option>
                                    {caseCategories.map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                                {errors.caseCategory && <p className="text-xs text-red-500 font-semibold">{errors.caseCategory}</p>}
                            </div>

                            <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5 sm:gap-2">
                                    <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                    Supporting Documents
                                </label>
                                <div className="border-2 border-dashed border-slate-300 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 text-center hover:border-blue-400 transition-colors">
                                    <input
                                        type="file"
                                        id="documentUpload"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        disabled={uploading}
                                    />
                                    <label
                                        htmlFor="documentUpload"
                                        className="cursor-pointer flex flex-col items-center gap-2"
                                    >
                                        <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400" />
                                        <span className="text-xs sm:text-sm font-semibold text-slate-600">
                                            {uploading ? 'Uploading...' : 'Upload Case Documents'}
                                        </span>
                                        <span className="text-[10px] sm:text-xs text-slate-400">PDF, JPG, PNG (Max 5MB)</span>
                                        {formData.documentUrl && (
                                            <span className="text-[10px] sm:text-xs text-green-600 font-semibold flex items-center gap-1">
                                                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                Document uploaded successfully
                                            </span>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5 sm:gap-2">
                                    <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                    Brief Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Provide a brief overview of the case"
                                    rows={5}
                                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none ${
                                        errors.description ? 'border-red-500 bg-red-50' : 'border-slate-300 focus:border-blue-500'
                                    }`}
                                />
                                {errors.description && <p className="text-xs text-red-500 font-semibold">{errors.description}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="p-4 sm:p-6 md:p-8 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4">
                        <button
                            type="button"
                            className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 sm:px-8 md:px-10 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-black text-white shadow-xl transition-all hover:-translate-y-0.5 active:scale-95 ${
                                isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                            }`}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Appointment'}
                            {!isSubmitting && <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />}
                        </button>
                    </div>
                </form>
            </div>

            {/* Modal */}
            {modal.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className={`p-6 sm:p-8 md:p-10 text-center ${modal.isError ? 'bg-red-50/50' : 'bg-emerald-50/50'}`}>
                            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 ${
                                modal.isError ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                                {modal.isError ? <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10" /> : <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10" />}
                            </div>
                            <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 mb-3 sm:mb-4 leading-tight px-2">{modal.title}</h3>
                            <p className="text-sm sm:text-base text-slate-500 font-medium leading-relaxed px-2">{modal.message}</p>
                            <button
                                onClick={() => {
                                    setModal(prev => ({ ...prev, show: false }));
                                    if (!modal.isError) {
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }
                                }}
                                className={`w-full mt-6 sm:mt-8 py-3 sm:py-4 rounded-lg sm:rounded-xl text-sm sm:text-base font-bold text-white transition-all active:scale-95 shadow-lg ${
                                    modal.isError ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'
                                }`}
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

export default ClientAppointment;

