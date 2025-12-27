import React from 'react';

const LegalLogo: React.FC<{ className?: string }> = ({ className = "h-8 w-8" }) => {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Outer Circle Background */}
            <circle cx="50" cy="50" r="48" fill="url(#gradient1)" />

            {/* Scales of Justice */}
            <g transform="translate(50, 30)">
                {/* Center Pole */}
                <rect x="-2" y="0" width="4" height="45" fill="#ffffff" rx="2" />

                {/* Top Circle */}
                <circle cx="0" cy="-5" r="6" fill="#fbbf24" />

                {/* Horizontal Bar */}
                <rect x="-25" y="10" width="50" height="3" fill="#ffffff" rx="1.5" />

                {/* Left Scale Pan */}
                <g transform="translate(-20, 15)">
                    <line x1="-8" y1="0" x2="-8" y2="8" stroke="#fbbf24" strokeWidth="1.5" />
                    <line x1="8" y1="0" x2="8" y2="8" stroke="#fbbf24" strokeWidth="1.5" />
                    <path d="M -10 8 L -10 12 L 10 12 L 10 8 Z" fill="#fbbf24" />
                    <ellipse cx="0" cy="12" rx="10" ry="2" fill="#fbbf24" opacity="0.6" />
                </g>

                {/* Right Scale Pan */}
                <g transform="translate(20, 15)">
                    <line x1="-8" y1="0" x2="-8" y2="8" stroke="#fbbf24" strokeWidth="1.5" />
                    <line x1="8" y1="0" x2="8" y2="8" stroke="#fbbf24" strokeWidth="1.5" />
                    <path d="M -10 8 L -10 12 L 10 12 L 10 8 Z" fill="#fbbf24" />
                    <ellipse cx="0" cy="12" rx="10" ry="2" fill="#fbbf24" opacity="0.6" />
                </g>

                {/* Base */}
                <rect x="-15" y="45" width="30" height="4" fill="#ffffff" rx="2" />
                <rect x="-12" y="49" width="24" height="3" fill="#fbbf24" rx="1.5" />
            </g>

            {/* Gradient Definitions */}
            <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e40af" />
                    <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
            </defs>
        </svg>
    );
};

export default LegalLogo;
