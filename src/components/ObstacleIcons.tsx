import React from 'react';

/**
 * 100% Procedural & Self-Contained Vector Icons for Game Obstacles:
 * Clean inline SVGs free from proprietary raster images or unlicensed assets.
 * Zero trademarks, agency logos, or proprietary markings.
 */

export const TaxiIcon: React.FC<{ className?: string }> = ({ className = 'w-9 h-5' }) => (
  <svg
    viewBox="0 0 46 26"
    className={`inline-block shrink-0 ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Yellow Taxi"
    role="img"
  >
    {/* Soft ground shadow */}
    <rect x="2" y="3" width="42" height="22" rx="4" fill="rgba(40, 40, 45, 0.16)" />
    {/* High-contrast yellow body with black pencil outline */}
    <rect x="0" y="1" width="42" height="22" rx="4" fill="#ffd700" stroke="#242426" strokeWidth="2" />
    {/* Front & Rear Windshields */}
    <rect x="5.5" y="4" width="7" height="16" rx="1.5" fill="#e0f2fe" stroke="#242426" strokeWidth="1.2" />
    <rect x="29.5" y="4" width="6.5" height="16" rx="1.5" fill="#e0f2fe" stroke="#242426" strokeWidth="1.2" />
    {/* Small generic roof sign */}
    <rect x="16" y="8" width="12" height="8" rx="1.5" fill="#ffffff" stroke="#242426" strokeWidth="1.2" />
    <text
      x="22"
      y="14"
      fontSize="5.5"
      fontWeight="700"
      fontFamily="'Inter', sans-serif"
      fill="#ea580c"
      textAnchor="middle"
      dominantBaseline="middle"
    >
      TAXI
    </text>
  </svg>
);

export const EBikeIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-5' }) => (
  <svg
    viewBox="0 0 38 24"
    className={`inline-block shrink-0 ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Bicycle"
    role="img"
  >
    {/* Soft ground shadow */}
    <ellipse cx="19" cy="14" rx="15" ry="5.5" fill="rgba(40, 40, 45, 0.14)" />
    {/* Minimalist two circular wheels with line outlines */}
    <circle cx="6" cy="12" r="4.2" stroke="#0f172a" strokeWidth="1.6" />
    <circle cx="30" cy="12" r="4.2" stroke="#0f172a" strokeWidth="1.6" />
    {/* Bicycle frame line */}
    <line x1="6" y1="12" x2="30" y2="12" stroke="#0284c7" strokeWidth="2.2" />
    {/* Minimalist handlebars line */}
    <line x1="27" y1="5" x2="27" y2="19" stroke="#1e293b" strokeWidth="2.0" strokeLinecap="round" />
    {/* Line arms reaching to handlebars */}
    <line x1="16" y1="8" x2="27" y2="6" stroke="#1e293b" strokeWidth="1.5" />
    <line x1="16" y1="16" x2="27" y2="18" stroke="#1e293b" strokeWidth="1.5" />
    {/* Rider torso and circle head */}
    <line x1="15" y1="8" x2="15" y2="16" stroke="#1e293b" strokeWidth="2.2" />
    <circle cx="17" cy="12" r="4" fill="#facc15" stroke="#242426" strokeWidth="1.3" />
  </svg>
);

export const CrowdIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 30 30"
    className={`inline-block shrink-0 ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Pedestrian Crowd"
    role="img"
  >
    {/* Ground commotion ring */}
    <circle cx="15" cy="15" r="13.5" fill="rgba(240, 238, 230, 0.9)" stroke="#64748b" strokeWidth="1.2" strokeDasharray="3 3" />
    {/* Cluster of small circular sketch heads with simple shoulder outlines */}
    {/* Person 1 */}
    <ellipse cx="10" cy="10" rx="4.5" ry="2.8" fill="#334155" stroke="#242426" strokeWidth="1" />
    <circle cx="10" cy="10" r="3" fill="#ffffff" stroke="#242426" strokeWidth="1.2" />
    {/* Person 2 */}
    <ellipse cx="20" cy="11" rx="4.5" ry="2.8" fill="#b45309" stroke="#242426" strokeWidth="1" />
    <circle cx="20" cy="11" r="3" fill="#ffffff" stroke="#242426" strokeWidth="1.2" />
    {/* Person 3 */}
    <ellipse cx="11" cy="20" rx="4.5" ry="2.8" fill="#0369a1" stroke="#242426" strokeWidth="1" />
    <circle cx="11" cy="20" r="3" fill="#ffffff" stroke="#242426" strokeWidth="1.2" />
    {/* Person 4 */}
    <ellipse cx="19" cy="19" rx="4.5" ry="2.8" fill="#15803d" stroke="#242426" strokeWidth="1" />
    <circle cx="19" cy="19" r="3" fill="#ffffff" stroke="#242426" strokeWidth="1.2" />
  </svg>
);

export const ObstacleIconsGroup: React.FC = () => (
  <div className="inline-flex items-center gap-1.5 p-1 bg-[#ffffff] border border-[#2b2b2e]/30 rounded shadow-2xs">
    <TaxiIcon />
    <EBikeIcon />
    <CrowdIcon />
  </div>
);
