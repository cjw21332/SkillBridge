import React from "react";

interface SkillBridgeLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

export const SkillBridgeLogo: React.FC<SkillBridgeLogoProps> = ({
  size = "md",
  showText = false,
  className = "",
}) => {
  const sizeMap = {
    sm: { box: "w-7 h-7", icon: 28 },
    md: { box: "w-10 h-10", icon: 40 },
    lg: { box: "w-14 h-14", icon: 56 },
    xl: { box: "w-20 h-20", icon: 80 },
  };

  const { box } = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Logo Mark */}
      <div className={`relative ${box} rounded-2xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 p-1.5 border border-white/10`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          <defs>
            {/* Primary Skill Arc Gradient (Blue to Cyan) */}
            <linearGradient id="sbBlueGrad" x1="6" y1="38" x2="28" y2="12" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#3D5AFE" />
              <stop offset="100%" stopColor="#60A5FA" />
            </linearGradient>

            {/* Accent Skill Arc Gradient (Orange to Amber) */}
            <linearGradient id="sbOrangeGrad" x1="42" y1="38" x2="20" y2="12" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF6B35" />
              <stop offset="100%" stopColor="#FBBF24" />
            </linearGradient>

            {/* Bridge Deck Gradient */}
            <linearGradient id="sbDeckGrad" x1="6" y1="29" x2="42" y2="29" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#FBBF24" stopOpacity="0.9" />
            </linearGradient>

            {/* Glowing Keystone Glow */}
            <radialGradient id="sbCenterGlow" cx="24" cy="14" r="6" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#3D5AFE" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Left Arch Pillar (Learner Side) */}
          <path
            d="M 9 37 C 9 24, 17 14, 24 14"
            stroke="url(#sbBlueGrad)"
            strokeWidth="4.5"
            strokeLinecap="round"
          />

          {/* Right Arch Pillar (Teacher Side) */}
          <path
            d="M 39 37 C 39 24, 31 14, 24 14"
            stroke="url(#sbOrangeGrad)"
            strokeWidth="4.5"
            strokeLinecap="round"
          />

          {/* Bridge Suspension Deck (Connecting Span) */}
          <path
            d="M 7 30 Q 24 23 41 30"
            stroke="url(#sbDeckGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Bridge Cable Ties / Exchange Lines */}
          <line x1="16" y1="21" x2="16" y2="28" stroke="#60A5FA" strokeWidth="1.5" strokeOpacity="0.7" strokeLinecap="round" />
          <line x1="32" y1="21" x2="32" y2="28" stroke="#FBBF24" strokeWidth="1.5" strokeOpacity="0.7" strokeLinecap="round" />

          {/* Golden Center Node (Knowledge Transfer Spark) */}
          <circle cx="24" cy="14" r="3" fill="#FFFFFF" />
          <circle cx="24" cy="14" r="1.5" fill="#3D5AFE" />

          {/* Left Peer Node */}
          <circle cx="9" cy="37" r="2.5" fill="#3D5AFE" stroke="#FFFFFF" strokeWidth="1" />

          {/* Right Peer Node */}
          <circle cx="39" cy="37" r="2.5" fill="#FF6B35" stroke="#FFFFFF" strokeWidth="1" />
        </svg>
      </div>

      {/* Wordmark (Optional) */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center text-xl font-bold font-heading tracking-tight leading-none">
            <span className="text-[var(--color-text-primary)]">Skill</span>
            <span className="bg-gradient-to-r from-[var(--color-primary)] to-indigo-600 bg-clip-text text-transparent">Bridge</span>
          </div>
          <span className="text-[10px] text-[var(--color-text-secondary)] font-semibold tracking-wider uppercase mt-0.5">
            Teach One, Learn One
          </span>
        </div>
      )}
    </div>
  );
};
