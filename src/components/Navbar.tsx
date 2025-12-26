import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X, Gavel, Home, Calendar, Users, Search, BarChart2 } from 'lucide-react';

const Navbar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    const navItems = [
        { name: 'Home', path: '/', icon: Home },
        { name: 'Appointment', path: '/appointment', icon: Calendar },
        { name: 'Case Counselling', path: '/case-counselling', icon: Users },
        { name: 'Case Finder', path: '/case-finder', icon: Search },
        { name: 'Reports', path: '/reports', icon: BarChart2 },
    ];

    return (
        <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 flex items-center gap-2">
                            <Gavel className="h-8 w-8 text-blue-400" />
                            <span className="text-xl font-bold tracking-tight">
                                CASE <span className="text-blue-400">MANAGEMENT</span>
                            </span>
                        </div>
                        <div className="hidden md:ml-10 md:flex md:space-x-4">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.name}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${isActive
                                            ? 'bg-slate-800 text-blue-400'
                                            : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                                        }`
                                    }
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.name}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                    <div className="flex md:hidden items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div className={`md:hidden ${isOpen ? 'block' : 'hidden'} bg-slate-800 transition-all duration-300 ease-in-out`}>
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            onClick={() => setIsOpen(false)}
                            className={({ isActive }) =>
                                `block px-3 py-2 rounded-md text-base font-medium flex items-center gap-3 ${isActive
                                    ? 'bg-slate-900 text-blue-400'
                                    : 'text-gray-300 hover:bg-slate-900 hover:text-white'
                                }`
                            }
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </NavLink>
                    ))}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
