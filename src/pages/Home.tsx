import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle, Scale, Shield, Users, Globe, BookOpen } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const Home: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <div className="space-y-16 pb-12">
            {/* Hero Section */}
            <section className="relative h-[600px] -mt-8 flex items-center overflow-hidden rounded-b-[4rem] shadow-2xl">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=2000"
                        alt="Legal Justice"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent"></div>
                </div>

                <div className={`relative max-w-7xl mx-auto px-4 w-full transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 font-semibold mb-6 backdrop-blur-sm">
                            <Scale className="h-4 w-4" />
                            <span>Premier Legal Management System</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                            Justice <span className="text-blue-500">Redefined.</span><br />
                            Cases <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Simplified.</span>
                        </h1>
                        <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                            Streamline your legal practice with intelligent case tracking, client management, and automated reporting.
                            Designed for modern law firms demanding excellence.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <NavLink to="/appointment" className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-600/25 flex items-center justify-center gap-2">
                                Book Consultation
                                <ArrowRight className="h-5 w-5" />
                            </NavLink>
                            <button className="px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-xl font-bold text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                                <Globe className="h-5 w-5" />
                                Explore Services
                            </button>
                        </div>
                    </div>
                </div>

                {/* Floating Stats Card */}
                <div className={`hidden lg:block absolute right-20 bottom-20 bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl transition-all duration-1000 delay-500 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'}`}>
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <p className="text-4xl font-bold text-white mb-1">98%</p>
                            <p className="text-slate-300 text-sm">Case Success Rate</p>
                        </div>
                        <div>
                            <p className="text-4xl font-bold text-emerald-400 mb-1">24/7</p>
                            <p className="text-slate-300 text-sm">Client Support</p>
                        </div>
                        <div className="col-span-2 pt-4 border-t border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-slate-800"></div>
                                    ))}
                                </div>
                                <p className="text-slate-300 text-sm">Trusted by 500+ clients</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { icon: Shield, title: "Secure Case Data", desc: "Bank-grade encryption for all your sensitive legal documents and client information." },
                        { icon: Users, title: "Client Portal", desc: "Seamless communication channel for real-time updates and document sharing." },
                        { icon: BookOpen, title: "Legal Research", desc: "Integrated access to vast libraries of case law and precedents." }
                    ].map((feature, i) => (
                        <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 group">
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
                                <feature.icon className="h-7 w-7 text-blue-600 group-hover:text-white transition-colors duration-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                            <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Pillars */}
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full font-bold text-sm">
                        <CheckCircle className="h-4 w-4" />
                        Why Choose Us
                    </div>
                    <h2 className="text-4xl font-bold text-slate-900 leading-tight">Expertise across <br />every legal domain.</h2>
                    <p className="text-slate-500 text-lg leading-relaxed">
                        LEX CONNECT provides comprehensive legal solutions tailored to your unique needs. Our team of specialized attorneys brings decades of experience to ensure the best possible outcome for your case.
                    </p>
                    <ul className="space-y-4">
                        {['Criminal Defense & Litigation', 'Corporate & Business Law', 'Family & Estate Planning', 'Intellectual Property Rights'].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="relative">
                    <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600 to-emerald-400 rounded-[2.5rem] opacity-20 blur-2xl"></div>
                    <img
                        src="https://images.unsplash.com/photo-1589216532372-1c2a367900d9?auto=format&fit=crop&q=80&w=1600"
                        alt="Lady Justice Statue"
                        className="relative rounded-[2rem] shadow-[0_30px_60px_-10px_rgba(0,0,0,0.6)] w-full object-cover h-[500px] border-4 border-white"
                    />
                </div>
            </div>

            {/* CTA Section */}
            <div className="max-w-7xl mx-auto px-4">
                <div className="bg-slate-900 rounded-[3rem] p-12 md:p-12 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl -ml-32 -mb-32"></div>

                    <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                        <h2 className="text-4xl md:text-5xl font-bold text-white">Ready to secure your legal future?</h2>
                        <p className="text-slate-400 text-xl">Join thousands of satisfied clients who trust LexConnect for their legal management needs.</p>
                        <button className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-colors shadow-xl">
                            Get Started Now
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(40px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 1s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default Home;
