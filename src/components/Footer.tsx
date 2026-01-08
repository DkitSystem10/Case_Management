import React from 'react';
import { NavLink } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';
import LegalLogo from './LegalLogo';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-slate-900 text-gray-300 mt-auto">
            {/* Main Footer Content */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <LegalLogo className="h-10 w-10" />
                            <span className="text-xl font-bold text-white">
                                CASE <span className="text-blue-400">MANAGEMENT</span>
                            </span>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Streamlining legal practice with intelligent case tracking, client management, and automated reporting for modern law firms.
                        </p>
                        {/* Social Media Links */}
                        <div className="flex gap-3 pt-2">
                            <a href="#" className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                                <Facebook className="h-4 w-4" />
                            </a>
                            <a href="#" className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                                <Twitter className="h-4 w-4" />
                            </a>
                            <a href="#" className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                                <Linkedin className="h-4 w-4" />
                            </a>
                            <a href="#" className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                                <Instagram className="h-4 w-4" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li>
                                <NavLink to="/" className="text-sm hover:text-blue-400 transition-colors flex items-center gap-2">
                                    <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                                    Home
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/appointment" className="text-sm hover:text-blue-400 transition-colors flex items-center gap-2">
                                    <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                                    Book Appointment
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/case-counselling" className="text-sm hover:text-blue-400 transition-colors flex items-center gap-2">
                                    <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                                    Case Counselling
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/case-finder" className="text-sm hover:text-blue-400 transition-colors flex items-center gap-2">
                                    <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                                    Case Finder
                                </NavLink>
                            </li>
                            <li>
                                <NavLink to="/reports" className="text-sm hover:text-blue-400 transition-colors flex items-center gap-2">
                                    <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                                    Reports
                                </NavLink>
                            </li>
                        </ul>
                    </div>

                    {/* Legal Services */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Our Services</h3>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                                Criminal Defense & Court Cases
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                                Corporate & Business Law
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                                Family & Estate Planning
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                                Intellectual Property Rights
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                                Legal Consultation
                            </li>
                        </ul>
                    </div>

                    {/* Contact Information */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Contact Us</h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                <span>123 Legal Street, Law District, Chennai, Tamil Nadu 600001</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-blue-400 flex-shrink-0" />
                                <a href="tel:+919876543210" className="hover:text-blue-400 transition-colors">
                                    +91 98765 43210
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-blue-400 flex-shrink-0" />
                                <a href="mailto:info@casemanagement.com" className="hover:text-blue-400 transition-colors">
                                    info@casemanagement.com
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar with Copyright */}
            <div className="border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-gray-400 text-center md:text-left">
                            © {currentYear} <span className="text-white font-semibold">Case Management System</span>. All rights reserved.
                        </p>
                        <div className="flex gap-6 text-sm">
                            <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                                Privacy Policy
                            </a>
                            <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                                Terms of Service
                            </a>
                            <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                                Cookie Policy
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
