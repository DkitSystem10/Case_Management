import React, { useState } from 'react';
import { Phone, X } from 'lucide-react';

const CallButton: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <>
            {/* Floating Call Button */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
                {/* Expanded Contact Info */}
                <div
                    className={`transition-all duration-300 transform ${isExpanded
                        ? 'opacity-100 translate-y-0 scale-100'
                        : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
                        }`}
                >
                    <div className="bg-white rounded-2xl shadow-2xl p-4 border border-gray-100 min-w-[250px]">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-slate-900 text-sm">Contact Us</h3>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            <a
                                href="tel:+919876543210"
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 transition-colors group"
                            >
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                    <Phone className="h-5 w-5 text-blue-600 group-hover:text-white transition-colors" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Call Now</p>
                                    <p className="text-sm font-semibold text-slate-900">+91 98765 43210</p>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Main Call Button */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="group relative"
                    aria-label="Call us"
                >
                    {/* Animated Ripple Effect */}
                    <div className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-75"></div>
                    <div className="absolute inset-0 rounded-full bg-blue-600 animate-pulse opacity-50"></div>

                    {/* Main Button */}
                    <div className="relative w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full shadow-2xl flex items-center justify-center transform transition-all duration-300 hover:scale-110 hover:shadow-blue-600/50 active:scale-95">
                        <Phone className="h-7 w-7 text-white animate-bounce-slow" />
                    </div>

                    {/* Tooltip */}
                    <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg">
                            Call Us Now
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                        </div>
                    </div>
                </button>
            </div>

            {/* Custom Animations */}
            <style>{`
                @keyframes bounce-slow {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-8px);
                    }
                }
                
                .animate-bounce-slow {
                    animation: bounce-slow 2s ease-in-out infinite;
                }

                @keyframes ping {
                    75%, 100% {
                        transform: scale(1.5);
                        opacity: 0;
                    }
                }

                .animate-ping {
                    animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
                }

                @keyframes pulse {
                    0%, 100% {
                        opacity: 0.5;
                    }
                    50% {
                        opacity: 0.3;
                    }
                }

                .animate-pulse {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </>
    );
};

export default CallButton;
