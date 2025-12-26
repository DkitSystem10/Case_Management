import React from 'react';

interface PlaceholderProps {
    title: string;
    description?: string;
    imageUrl?: string;
}

const PagePlaceholder: React.FC<PlaceholderProps> = ({ title, description, imageUrl }) => {
    // Default images for different modules if not provided
    const images: Record<string, string> = {
        'Case Counselling': 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=1200',
        'Case Finder': 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=1200',
        'Reports': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200',
    };

    const currentImage = imageUrl || images[title] || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=1200';

    return (
        <div className="max-w-6xl mx-auto py-8">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
                <div className="relative h-[300px] md:h-[400px]">
                    <img
                        src={currentImage}
                        alt={title}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-8 md:p-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{title}</h1>
                        <p className="text-slate-200 text-lg md:text-xl max-w-2xl">
                            {description || `Our ${title} module is being optimized with advanced legal intelligence features.`}
                        </p>
                    </div>
                </div>

                <div className="p-8 md:p-12 text-center space-y-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-2xl text-blue-600 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Module Under Development</h2>
                    <p className="text-slate-500 max-w-xl mx-auto leading-relaxed">
                        We are working hard to integrate real-time case databases and automated reporting tools into this module.
                        Stay tuned for a more powerful legal experience.
                    </p>
                    <div className="pt-6">
                        <button className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:-translate-y-1">
                            Notify Me When Ready
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PagePlaceholder;
