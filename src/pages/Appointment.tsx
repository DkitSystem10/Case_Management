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
    ClipboardList,
    Gavel,
    AlertCircle,
    CheckCircle2,
    X
} from 'lucide-react';

import { saveAppointment } from '../utils/storage';

interface AppointmentFormData {
    fullName: string;
    phoneNumber: string;
    emailId: string;
    address: string;
    city: string;
    state: string;
    alreadyCome: 'Yes' | 'No';
    appointmentDate: string;
    timeSlot: string;
    consultationType: 'In-Person' | 'Online' | 'Phone';
    caseCategory: string;
    otherCategory?: string;
    description: string;
}

const Appointment: React.FC = () => {
    const [formData, setFormData] = useState<AppointmentFormData>({
        fullName: '',
        phoneNumber: '',
        emailId: '',
        address: '',
        city: '',
        state: '',
        alreadyCome: 'No',
        appointmentDate: '',
        timeSlot: '',
        consultationType: 'In-Person',
        caseCategory: '',
        description: '',
    });

    const [errors, setErrors] = useState<Partial<Record<keyof AppointmentFormData, string>>>({});
    const [modal, setModal] = useState<{ show: boolean, title: string, message: string | string[], isError: boolean }>({
        show: false,
        title: '',
        message: '',
        isError: false
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        let { name, value } = e.target;

        // Restriction for Phone Number: only digits and max 10 characters
        if (name === 'phoneNumber') {
            value = value.replace(/\D/g, '').slice(0, 10);
        }

        // Restriction for Full Name: only letters and spaces
        if (name === 'fullName') {
            value = value.replace(/[^a-zA-Z\s]/g, '');
        }

        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name as keyof AppointmentFormData]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const validateForm = () => {
        const newErrors: Partial<Record<keyof AppointmentFormData, string>> = {};
        if (!formData.fullName) newErrors.fullName = 'Full Name is required';
        if (!formData.phoneNumber) {
            newErrors.phoneNumber = 'Phone Number is required';
        } else if (formData.phoneNumber.length !== 10) {
            newErrors.phoneNumber = 'Phone Number must be exactly 10 digits';
        }
        if (!formData.emailId) newErrors.emailId = 'Email ID is required';
        if (!formData.appointmentDate) newErrors.appointmentDate = 'Appointment Date is required';
        if (!formData.timeSlot) newErrors.timeSlot = 'Time Slot is required';
        if (!formData.caseCategory) newErrors.caseCategory = 'Case Category is required';
        if (formData.caseCategory === 'Others' && !formData.otherCategory) {
            newErrors.otherCategory = 'Please specify the category';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (validateForm()) {
            setIsSubmitting(true);
            try {
                // Fix: Added consultationFee and caseFee to satisfy AppointmentRecord interface
                await saveAppointment({
                    ...formData,
                    consultationFee: 0,
                    caseFee: 0
                });

                setModal({
                    show: true,
                    title: 'Registration Successful!',
                    message: 'Your appointment has been submitted successfully. Our legal team will review it and notify you via email shortly.',
                    isError: false
                });

                setFormData({
                    fullName: '',
                    phoneNumber: '',
                    emailId: '',
                    address: '',
                    city: '',
                    state: '',
                    alreadyCome: 'No',
                    appointmentDate: '',
                    timeSlot: '',
                    consultationType: 'In-Person',
                    caseCategory: '',
                    description: '',
                });
            } catch (error: any) {
                // Show specific error (like duplicate email) in a pop-up
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
        } else {
            // No modal here, errors are shown below each field via the 'errors' state
            // Scroll to top or first error could be helpful, but for now we just let the UI show errors
        }
    };

    const timeSlots = [
        "09:00 AM - 10:00 AM",
        "10:00 AM - 11:00 AM",
        "11:00 AM - 12:00 PM",
        "02:00 PM - 03:00 PM",
        "03:00 PM - 04:00 PM",
        "04:00 PM - 05:00 PM",
    ];

    const caseCategories = ["Civil", "Criminal", "Family", "Corporate", "Property", "Others"];

    const indianStates = [
        "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
        "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
        "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
        "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
        "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
        "Uttar Pradesh", "Uttarakhand", "West Bengal",
        "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
        "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
    ];

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-10 bg-slate-900 rounded-2xl p-8 md:p-12 text-white relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-extrabold tracking-tight">Appointment</h1>
                    <p className="text-slate-400 mt-3 text-lg max-w-2xl leading-relaxed">
                        Schedule and manage client consultations with our professional management system.
                        Please fill in the details below to secure your slot.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 pb-20">
                {/* Client Details Section */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                        <User className="h-5 w-5 text-slate-600" />
                        <h2 className="text-lg font-semibold text-slate-800">Client Details</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    placeholder="Enter full name"
                                    className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.fullName ? 'border-red-500 bg-red-50' : 'border-slate-300'
                                        }`}
                                />
                            </div>
                            {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    placeholder="Enter phone number"
                                    className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.phoneNumber ? 'border-red-500 bg-red-50' : 'border-slate-300'
                                        }`}
                                />
                            </div>
                            {errors.phoneNumber && <p className="text-xs text-red-500">{errors.phoneNumber}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Email ID</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="email"
                                    name="emailId"
                                    value={formData.emailId}
                                    onChange={handleInputChange}
                                    placeholder="Enter email address"
                                    className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.emailId ? 'border-red-500 bg-red-50' : 'border-slate-300'
                                        }`}
                                />
                            </div>
                            {errors.emailId && <p className="text-xs text-red-500">{errors.emailId}</p>}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-slate-700">Address</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <textarea
                                    name="address"
                                    rows={3}
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    placeholder="Enter complete address"
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[80px]"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">City</label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                placeholder="City"
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">State</label>
                            <input
                                type="text"
                                name="state"
                                list="states-datalist"
                                value={formData.state}
                                onChange={handleInputChange}
                                placeholder="State"
                                autoComplete="off"
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                            <datalist id="states-datalist">
                                {indianStates.map(state => (
                                    <option key={state} value={state} />
                                ))}
                            </datalist>
                        </div>
                    </div>
                </section>

                {/* Appointment Details Section */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-slate-600" />
                        <h2 className="text-lg font-semibold text-slate-800">Appointment Details</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-slate-700 block">Already Come?</label>
                            <div className="flex gap-4">
                                {['Yes', 'No'].map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, alreadyCome: option as 'Yes' | 'No' }))}
                                        className={`px-6 py-2 rounded-full text-sm font-medium border transition-all ${formData.alreadyCome === option
                                            ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                                            : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                                            }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Preferred Appointment Date</label>
                            <input
                                type="date"
                                name="appointmentDate"
                                value={formData.appointmentDate}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.appointmentDate ? 'border-red-500 bg-red-50' : 'border-slate-300'
                                    }`}
                            />
                            {errors.appointmentDate && <p className="text-xs text-red-500">{errors.appointmentDate}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Preferred Time Slot</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                <select
                                    name="timeSlot"
                                    value={formData.timeSlot}
                                    onChange={handleInputChange}
                                    className={`w-full pl-10 pr-4 py-2 rounded-lg border appearance-none focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white ${errors.timeSlot ? 'border-red-500 bg-red-50' : 'border-slate-300'
                                        }`}
                                >
                                    <option value="">Select a time slot</option>
                                    {timeSlots.map(slot => (
                                        <option key={slot} value={slot}>{slot}</option>
                                    ))}
                                </select>
                            </div>
                            {errors.timeSlot && <p className="text-xs text-red-500">{errors.timeSlot}</p>}
                        </div>

                        <div className="space-y-3 md:col-span-2">
                            <label className="text-sm font-medium text-slate-700 block">Type of Consultation</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                    { label: 'In-Person', icon: Users },
                                    { label: 'Online (Video)', icon: Video },
                                    { label: 'Phone', icon: Phone },
                                ].map((type) => (
                                    <button
                                        key={type.label}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, consultationType: type.label.split(' ')[0] as any }))}
                                        className={`flex items-center justify-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${formData.consultationType === type.label.split(' ')[0]
                                            ? 'bg-blue-50 border-blue-600 text-blue-700 ring-1 ring-blue-600 shadow-sm'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        <type.icon className={`h-5 w-5 ${formData.consultationType === type.label.split(' ')[0] ? 'text-blue-600' : 'text-slate-400'}`} />
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Case Details Section */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-slate-600" />
                        <h2 className="text-lg font-semibold text-slate-800">Case Details</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 block">Case Category</label>
                            <div className="relative">
                                <Gavel className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                <select
                                    name="caseCategory"
                                    value={formData.caseCategory}
                                    onChange={handleInputChange}
                                    className={`w-full pl-10 pr-10 py-2.5 rounded-lg border appearance-none focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white font-medium ${errors.caseCategory ? 'border-red-500 bg-red-50' : 'border-slate-300'
                                        }`}
                                >
                                    <option value="">Select a case category</option>
                                    {caseCategories.map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <ChevronRight className="h-4 w-4 rotate-90" />
                                </div>
                            </div>
                            {errors.caseCategory && <p className="text-xs text-red-500">{errors.caseCategory}</p>}
                        </div>

                        {formData.caseCategory === 'Others' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                <label className="text-sm font-medium text-slate-700">Please Specify Category</label>
                                <input
                                    type="text"
                                    name="otherCategory"
                                    value={formData.otherCategory || ''}
                                    onChange={handleInputChange}
                                    placeholder="Specify case category"
                                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.otherCategory ? 'border-red-500 bg-red-50' : 'border-slate-300'
                                        }`}
                                />
                                {errors.otherCategory && <p className="text-xs text-red-500">{errors.otherCategory}</p>}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Brief Description</label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <textarea
                                    name="description"
                                    rows={4}
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Provide a brief overview of the case"
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[100px]"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <div className="flex items-center justify-end gap-4 pt-4">
                    <button
                        type="button"
                        className="px-6 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`flex items-center gap-2 px-8 py-2.5 rounded-lg text-sm font-bold text-white shadow-lg shadow-slate-200 transition-all hover:-translate-y-0.5 ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800'
                            }`}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Appointment'}
                        {!isSubmitting && <ChevronRight className="h-4 w-4" />}
                    </button>
                </div>
            </form>

            {/* Premium Status Modal */}
            {modal.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className={`p-10 text-center ${modal.isError ? 'bg-red-50/50' : 'bg-emerald-50/50'}`}>
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${modal.isError ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                {modal.isError ? <AlertCircle className="h-10 w-10" /> : <CheckCircle2 className="h-10 w-10" />}
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-4 leading-tight">{modal.title}</h3>

                            {Array.isArray(modal.message) ? (
                                <ul className="text-slate-500 font-medium text-sm space-y-2 text-left bg-white/50 p-6 rounded-2xl border border-dashed border-slate-200">
                                    {modal.message.map((msg, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                                            {msg}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-slate-500 font-medium leading-relaxed">{modal.message}</p>
                            )}

                            <button
                                onClick={() => setModal(prev => ({ ...prev, show: false }))}
                                className={`w-full mt-8 py-4 rounded-2xl font-bold text-white transition-all active:scale-95 shadow-lg ${modal.isError ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'}`}
                            >
                                {modal.isError ? 'Try Again' : 'Close Notification'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Appointment;
