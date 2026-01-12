import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getAppointments, type AppointmentRecord } from '../utils/storage';
import {
    ChevronLeft,
    CreditCard,
    Smartphone,
    Globe,
    Banknote,
    ShieldCheck,
    CheckCircle2,
    IndianRupee,
    ArrowRight
} from 'lucide-react';

const PaymentPage: React.FC = () => {
    const { appointmentId } = useParams<{ appointmentId: string }>();
    const location = useLocation();
    const [appointment, setAppointment] = useState<AppointmentRecord | null>(null);
    const [selectedMethod, setSelectedMethod] = useState<string>('card');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const navigate = useNavigate();

    // Get fees from navigation state if available, otherwise fallback to DB (UI/UX Demo focus)
    const stateFees = location.state?.fees;
    const consultationFee = stateFees?.consultation || appointment?.consultationFee || 0;
    const caseFee = stateFees?.case || appointment?.caseFee || 0;

    useEffect(() => {
        const fetchApp = async () => {
            const all = await getAppointments();
            const found = all.find(a => a.id === appointmentId);
            if (found) setAppointment(found);
        };
        fetchApp();
    }, [appointmentId]);

    const totalAmount = consultationFee + caseFee;

    const handlePayment = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setIsSuccess(true);
        }, 2000);
    };

    if (!appointment) return <div className="p-20 text-center">Loading Invoice...</div>;

    if (isSuccess) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl text-center border border-slate-100">
                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                        <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-4">Payment Successful!</h2>
                    <p className="text-slate-500 mb-8 font-medium">Your legal fees for {appointment.fullName} have been settled successfully. Transaction ID: #TXN-{Math.floor(Math.random() * 1000000)}</p>
                    <button
                        onClick={() => navigate('/admin')}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:scale-105 transition-transform"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-8 w-full overflow-x-hidden" style={{ maxWidth: '100vw' }}>
            <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 mb-4 sm:mb-8 transition-colors text-sm sm:text-base"
            >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs sm:text-base">Return to Dashboard</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-12 w-full">
                {/* Left: Summary & Details */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8 w-full">
                    <div className="bg-white rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-8 lg:p-10 border border-slate-100 shadow-sm relative overflow-hidden w-full">
                        <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-blue-50/50 rounded-full -mr-10 sm:-mr-16 md:-mr-20 -mt-10 sm:-mt-16 md:-mt-20"></div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mb-2">Checkout</h1>
                        <p className="text-xs sm:text-sm md:text-base text-slate-500 font-medium">Invoice for professional legal services provided to {appointment.fullName}</p>

                        <div className="mt-6 sm:mt-8 md:mt-12 space-y-4 sm:space-y-6">
                            <div className="flex justify-between items-center py-3 sm:py-4 border-b border-slate-50 gap-2">
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-sm sm:text-base font-bold text-slate-800">Initial Consultation</h4>
                                    <p className="text-xs sm:text-sm text-slate-400">Fixed rate advisory session</p>
                                </div>
                                <span className="text-lg sm:text-xl font-black text-slate-900 flex-shrink-0">₹{consultationFee.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 sm:py-4 border-b border-slate-50 gap-2">
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-sm sm:text-base font-bold text-slate-800">Legal Case Retainer</h4>
                                    <p className="text-xs sm:text-sm text-slate-400">Documentation and representation fee</p>
                                </div>
                                <span className="text-lg sm:text-xl font-black text-slate-900 flex-shrink-0">₹{caseFee.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center pt-4 sm:pt-6 md:pt-8 gap-2">
                                <span className="text-lg sm:text-xl md:text-2xl font-black text-slate-900">Total Payable</span>
                                <div className="text-right flex-shrink-0">
                                    <span className="text-2xl sm:text-3xl md:text-4xl font-black text-blue-600 flex items-center gap-1 group">
                                        <IndianRupee className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                                        {totalAmount.toLocaleString()}
                                    </span>
                                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 mt-1">Inclusive of all legal taxes</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-4 sm:space-y-6">
                        <h3 className="text-lg sm:text-xl font-black text-slate-900 ml-2">Choose Payment Method</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
                            {[
                                { id: 'card', name: 'Credit / Debit Card', icon: CreditCard, desc: 'Visa, Mastercard, Amex' },
                                { id: 'upi', name: 'UPI Gateway', icon: Smartphone, desc: 'Google Pay, PhonePe, BHIM' },
                                { id: 'net', name: 'Net Banking', icon: Globe, desc: 'All major Indian banks' },
                                { id: 'cash', name: 'Cash / Manual Pay', icon: Banknote, desc: 'Record physical payment' },
                            ].map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => setSelectedMethod(method.id)}
                                    className={`flex items-start gap-3 sm:gap-4 p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border-2 transition-all text-left w-full ${selectedMethod === method.id
                                        ? 'border-blue-600 bg-blue-50/30'
                                        : 'border-slate-100 bg-white hover:border-slate-200'
                                        }`}
                                >
                                    <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl flex-shrink-0 ${selectedMethod === method.id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                        <method.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h5 className="text-sm sm:text-base font-bold text-slate-800">{method.name}</h5>
                                        <p className="text-[10px] sm:text-xs text-slate-400 mt-1 font-medium">{method.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Payment Form */}
                <div className="space-y-4 sm:space-y-6 w-full">
                    <div className="bg-slate-900 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-8 text-white shadow-2xl sticky top-4 sm:top-24 w-full">
                        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 md:mb-8">
                            <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400 flex-shrink-0" />
                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400">Secure 256-bit Endpoint</span>
                        </div>

                        {selectedMethod === 'card' && (
                            <div className="space-y-4 sm:space-y-5 w-full">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-500">Card Number</label>
                                    <input className="w-full max-w-full bg-slate-800 border border-slate-700/50 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 font-medium focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="xxxx xxxx xxxx xxxx" />
                                </div>
                                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-500">Expiry</label>
                                        <input className="w-full max-w-full bg-slate-800 border border-slate-700/50 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 font-medium focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="MM/YY" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-500">CVV</label>
                                        <input className="w-full max-w-full bg-slate-800 border border-slate-700/50 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 font-medium focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="***" type="password" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedMethod === 'upi' && (
                            <div className="space-y-3 sm:space-y-4 w-full">
                                <div className="bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center border border-white/10 w-full">
                                    <p className="text-xs sm:text-sm text-slate-400 mb-3 sm:mb-4">Scan QR code with any UPI App</p>
                                    <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-white rounded-lg sm:rounded-xl mx-auto mb-3 sm:mb-4 flex items-center justify-center p-2">
                                        {/* Mock QR */}
                                        <div className="grid grid-cols-4 gap-1 w-full h-full opacity-20">
                                            {[...Array(16)].map((_, i) => <div key={i} className="bg-black"></div>)}
                                        </div>
                                    </div>
                                    <p className="text-[10px] sm:text-xs font-bold text-slate-500">VPA: lexconnect.pay@bank</p>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handlePayment}
                            disabled={isProcessing}
                            className="w-full max-w-full mt-6 sm:mt-8 md:mt-10 py-3 sm:py-4 md:py-5 bg-blue-600 text-white rounded-xl sm:rounded-2xl font-black text-sm sm:text-base md:text-lg flex items-center justify-center gap-2 sm:gap-3 hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:bg-slate-700 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? (
                                <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    Authorize Payment
                                    <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>

                        <div className="mt-8 text-center">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Payments powered by LexSecure Gateway</p>
                            <div className="flex justify-center gap-3 mt-4 opacity-30 grayscale">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-3" alt="Visa" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-4" alt="Mastercard" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
