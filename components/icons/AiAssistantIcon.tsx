
import React from 'react';

type AiAssistantStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'processing' | 'error';

interface AiAssistantIconProps extends React.SVGProps<SVGSVGElement> {
  status: AiAssistantStatus;
}

export const AiAssistantIcon: React.FC<AiAssistantIconProps> = ({ status, className, ...props }) => {
    return (
        <svg viewBox="0 0 100 100" className={`transition-transform duration-300 ${className}`} {...props}>
            <defs>
                <radialGradient id="ai-icon-gradient" cx="0.5" cy="0.4" r="0.6">
                    <stop offset="0%" stopColor="hsl(var(--primary) / 0.8)" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" />
                </radialGradient>
            </defs>

            {/* Main face circle */}
            <circle cx="50" cy="50" r="45" fill="url(#ai-icon-gradient)" stroke="hsl(var(--primary) / 0.5)" strokeWidth="2" />
            
            {/* Inner shadow/highlight */}
            <circle cx="50" cy="50" r="45" fill="transparent" stroke="white" strokeWidth="2" strokeOpacity="0.1" />

            {/* Eyes */}
            <g className={status === 'processing' ? 'animate-look-around' : ''}>
                <ellipse cx="35" cy="48" rx="7" ry="9" fill="white" />
                <ellipse cx="65" cy="48" rx="7" ry="9" fill="white" />
                <circle cx="35" cy="48" r="3" fill="#222" className="transition-transform duration-200" style={{ transform: status === 'listening' ? 'translateY(-2px)' : '' }} />
                <circle cx="65" cy="48" r="3" fill="#222" className="transition-transform duration-200" style={{ transform: status === 'listening' ? 'translateY(-2px)' : '' }} />
            </g>

            {/* Eyelids for blinking in idle state */}
            {status === 'idle' && (
                <>
                    <path d="M 28 48 A 7 9 0 0 1 42 48" fill="url(#ai-icon-gradient)" className="animate-blink" style={{ transformOrigin: '35px 48px' }} />
                    <path d="M 58 48 A 7 9 0 0 1 72 48" fill="url(#ai-icon-gradient)" className="animate-blink" style={{ animationDelay: '0.1s', transformOrigin: '65px 48px' }} />
                </>
            )}

            {/* Mouth */}
            <g>
                {/* Speaking mouth */}
                <ellipse cx="50" cy="72" rx="12" ry="7" fill="white" className={`origin-center transition-all duration-200 ${status === 'speaking' ? 'animate-talk' : 'scale-y-0 opacity-0'}`} />
                
                {/* Smile/Neutral mouth (visible when not speaking or in error) */}
                <path d="M 40 70 Q 50 78 60 70" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" className={`transition-all duration-200 ${status === 'speaking' || status === 'error' ? 'opacity-0' : 'opacity-100'}`} />
                 
                 {/* Error mouth */}
                <path d="M 40 75 Q 50 65 60 75" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" className={`transition-all duration-200 ${status === 'error' ? 'opacity-100' : 'opacity-0'}`} />
            </g>

            {/* Connecting Spinner */}
            {status === 'connecting' && (
                <circle cx="50" cy="50" r="48" fill="none" stroke="white" strokeWidth="3" strokeDasharray="50 150" strokeLinecap="round" className="animate-spin" />
            )}
        </svg>
    );
};
