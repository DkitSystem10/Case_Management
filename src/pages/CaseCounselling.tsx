import React from 'react';
import { NavLink } from 'react-router-dom';
import { Heart, Home, ShieldAlert, Briefcase, Scale, Lock, ArrowRight } from 'lucide-react';

interface ServiceCardProps {
    title: string;
    description: string;
    details: string[];
    icon: React.ElementType;
    image: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ title, description, details, icon: Icon, image }) => {
    return (
        <div className="group h-[450px] w-full [perspective:1000px]">
            <div className="relative h-full w-full transition-all duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] shadow-xl rounded-3xl">

                {/* Front Face */}
                <div className="absolute inset-0 h-full w-full rounded-3xl overflow-hidden bg-white [backface-visibility:hidden] border border-slate-100">
                    <div className="h-1/2 overflow-hidden">
                        <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent h-1/2 top-1/2"></div>
                    </div>
                    <div className="p-8 relative">
                        <div className="absolute -top-10 right-8 w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 transition-transform group-hover:rotate-12">
                            <Icon className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-3">{title}</h3>
                        <p className="text-slate-500 leading-relaxed font-medium">
                            {description}
                        </p>
                        <div className="absolute bottom-8 left-8 text-blue-600 font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                            View Services <ArrowRight className="h-4 w-4" />
                        </div>
                    </div>
                </div>

                {/* Back Face */}
                <div className="absolute inset-0 h-full w-full rounded-3xl bg-slate-900 p-10 text-white [transform:rotateY(180deg)] [backface-visibility:hidden] flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <Icon className="h-8 w-8 text-blue-400" />
                            <h3 className="text-2xl font-bold">{title}</h3>
                        </div>
                        <p className="text-slate-300 mb-8 leading-relaxed">
                            {description} We specialize in:
                        </p>
                        <ul className="space-y-4 mb-8">
                            {details.map((item, index) => (
                                <li key={index} className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                    <span className="font-semibold text-slate-100">{item}</span>
                                </li>
                            ))}
                        </ul>
                        <NavLink
                            to="/appointment"
                            className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold text-center hover:bg-blue-50 transition-colors shadow-lg block"
                        >
                            Book Consultation
                        </NavLink>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CaseCounselling: React.FC = () => {
    const services = [
        {
            title: "Family Law & Disputes",
            description: "Sensitive legal guidance for family matters requiring care and precision.",
            details: ["Divorce & Separation", "Child Custody & Support", "Domestic Violence Protection"],
            icon: Heart,
            image: "https://images.unsplash.com/photo-1633613286991-611fe299c4be?auto=format&fit=crop&q=80&w=800"
        },
        {
            title: "Property & Real Estate",
            description: "Protecting your tangible assets and resolving land ownership conflicts.",
            details: ["Property Title Disputes", "Landlord-Tenant Issues", "Real Estate Registration"],
            icon: Home,
            image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800"
        },
        {
            title: "Criminal Defense",
            description: "Aggressive representation to protect your rights and freedom.",
            details: ["Bail Applications", "Criminal Litigation", "Defense Strategy Planning"],
            icon: ShieldAlert,
            image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800"
        },
        {
            title: "Corporate & Business",
            description: "Strategic legal solutions for businesses of all sizes and sectors.",
            details: ["Contract Drafting", "Startup Compliance", "Mergers & Acquisitions"],
            icon: Briefcase,
            image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800"
        },
        {
            title: "Civil Litigation",
            description: "Resolving non-criminal disputes with strong advocacy and negotiation.",
            details: ["Breach of Contract", "Debt Recovery Suits", "Damages & Compensation"],
            icon: Scale,
            image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=800"
        },
        {
            title: "Cyber Crime & Fraud",
            description: "Navigation through the complexities of digital law and assets.",
            details: ["Financial Fraud", "Data Theft Protection", "Online Harassment Cases"],
            icon: Lock,
            image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800"
        }
    ];

    return (
        <div className="space-y-16 pb-20 animate-in fade-in zoom-in duration-500">
            {/* Header Section */}
            <div className="text-center space-y-6 max-w-3xl mx-auto pt-10">
                <div className="inline-flex items-center gap-2 px-6 py-2 bg-blue-50 border border-blue-100 rounded-full text-blue-600 font-bold text-sm">
                    <Scale className="h-4 w-4" />
                    <span>Specialized Legal Guidance</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
                    Counselling for every<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">Complex Legal Need.</span>
                </h1>
                <p className="text-xl text-slate-500 leading-relaxed">
                    We understand that every case is unique. Explore our specialized counseling domains to find the right expert for your situation.
                </p>
            </div>

            {/* Services Grid with 3D Flip Cards */}
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {services.map((service, index) => (
                        <ServiceCard key={index} {...service} />
                    ))}
                </div>
            </div>

            {/* Additional Info Section */}
            <div className="bg-slate-900 text-white rounded-[3rem] p-12 mx-4 md:mx-auto max-w-7xl relative overflow-hidden">
                <div className="active:scale-[0.99] transition-transform">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                        <div className="space-y-4">
                            <h3 className="text-3xl font-bold">Unsure which category fits you?</h3>
                            <p className="text-slate-400 text-lg max-w-xl">
                                Our general consultation service is designed to help you navigate through the confusion. Book a general slot and we'll guide you.
                            </p>
                        </div>
                        <NavLink
                            to="/appointment"
                            className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-colors shadow-xl shrink-0"
                        >
                            Book General Advice
                        </NavLink>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
            </div>
        </div>
    );
};

export default CaseCounselling;
