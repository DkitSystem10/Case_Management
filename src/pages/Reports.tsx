import React from 'react';
import {
    BarChart3,
    TrendingUp,
    Users,
    FileText,
    Download,
    PieChart,
    ArrowUpRight,
    Calendar,
    Briefcase
} from 'lucide-react';

const Reports: React.FC = () => {
    // Mock Data for Visualization
    const caseStats = [
        { label: 'Total Active Cases', value: '142', growth: '+12%', icon: Briefcase, color: 'blue' },
        { label: 'Client Satisfaction', value: '4.8/5', growth: '+0.2', icon: Users, color: 'emerald' },
        { label: 'Monthly Revenue', value: '₹8.5L', growth: '+18%', icon: TrendingUp, color: 'amber' },
        { label: 'Pending Hearings', value: '28', growth: '-5%', icon: Calendar, color: 'red' },
    ];

    const categoryDistribution = [
        { label: 'Criminal Defense', percentage: 35, color: 'bg-blue-500' },
        { label: 'Civil Litigation', percentage: 25, color: 'bg-emerald-500' },
        { label: 'Family Law', percentage: 20, color: 'bg-amber-500' },
        { label: 'Corporate', percentage: 15, color: 'bg-purple-500' },
        { label: 'Others', percentage: 5, color: 'bg-slate-400' },
    ];

    const recentReports = [
        { title: 'Monthly Case Efficiency Report', date: 'Oct 2024', size: '2.4 MB', type: 'PDF' },
        { title: 'Q3 Financial Revenue Analysis', date: 'Sep 2024', size: '1.8 MB', type: 'XLSX' },
        { title: 'Client Demographics Survey', date: 'Aug 2024', size: '4.2 MB', type: 'PDF' },
        { title: 'Annual Litigation Summary', date: '2023-24', size: '8.5 MB', type: 'PDF' },
    ];

    return (
        <div className="space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl mx-4 mt-4">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/10 rounded-full text-blue-200 font-bold text-xs uppercase tracking-wider mb-4">
                            <BarChart3 className="h-4 w-4" />
                            <span>Legal Analytics Dashboard</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4">Performance Insights</h1>
                        <p className="text-slate-400 text-lg max-w-2xl">
                            Comprehensive data visualization for firm performance, case tracking, and financial growth.
                        </p>
                    </div>
                    <button className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-blue-900/40">
                        <Download className="h-5 w-5" />
                        Export All Data
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 space-y-12">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {caseStats.map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                                <span className={`flex items-center gap-1 text-xs font-bold ${stat.growth.startsWith('+') ? 'text-emerald-600' : 'text-red-500'} bg-slate-50 px-2 py-1 rounded-lg`}>
                                    {stat.growth}
                                    <ArrowUpRight className={`h-3 w-3 ${stat.growth.startsWith('-') && 'rotate-90 text-red-500'}`} />
                                </span>
                            </div>
                            <h3 className="text-4xl font-black text-slate-900 mb-1">{stat.value}</h3>
                            <p className="text-slate-500 font-medium text-sm">{stat.label}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Visual Chart Simulation */}
                    <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-xl">
                                    <PieChart className="h-6 w-6 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">Case Distribution</h3>
                            </div>
                            <select className="bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-600 px-4 py-2 outline-none cursor-pointer">
                                <option>This Month</option>
                                <option>Last Quarter</option>
                                <option>Year to Date</option>
                            </select>
                        </div>

                        <div className="space-y-6">
                            {categoryDistribution.map((item, index) => (
                                <div key={index} className="space-y-2">
                                    <div className="flex justify-between text-sm font-bold">
                                        <span className="text-slate-700">{item.label}</span>
                                        <span className="text-slate-900">{item.percentage}%</span>
                                    </div>
                                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out`}
                                            style={{ width: `${item.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Downloadable Reports */}
                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-white rounded-xl shadow-sm">
                                <FileText className="h-6 w-6 text-slate-700" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Archive & Downloads</h3>
                        </div>

                        <div className="space-y-4">
                            {recentReports.map((report, i) => (
                                <div key={i} className="bg-white p-4 rounded-2xl flex items-center justify-between hover:scale-[1.02] transition-transform cursor-pointer shadow-sm border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center font-bold text-[10px]">
                                            {report.type}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{report.title}</h4>
                                            <p className="text-xs text-slate-400 font-medium">{report.date} • {report.size}</p>
                                        </div>
                                    </div>
                                    <button className="text-slate-300 hover:text-blue-600 transition-colors">
                                        <Download className="h-5 w-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-6 py-3 border-2 border-dashed border-slate-300 text-slate-500 rounded-xl font-bold text-sm hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                            View Full Archive
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
