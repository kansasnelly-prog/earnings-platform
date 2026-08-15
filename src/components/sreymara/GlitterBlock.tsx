import React from 'react';

interface GlitterBlockProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'crimson' | 'teal' | 'gold' | 'cyan';
  borderStyle?: 'single' | 'double' | 'corner-only';
  padding?: 'sm' | 'md' | 'lg';
}

const GlitterBlock: React.FC<GlitterBlockProps> = ({
  children,
  className = '',
  glowColor = 'crimson',
  borderStyle = 'single',
  padding = 'md',
}) => {
  const glowColors = {
    crimson: 'shadow-[0_0_12px_rgba(220,20,60,0.6)]',
    teal: 'shadow-[0_0_12px_rgba(0,128,128,0.6)]',
    gold: 'shadow-[0_0_12px_rgba(255,215,0,0.6)]',
    cyan: 'shadow-[0_0_12px_rgba(0,255,255,0.6)]',
  };

  const borderColors = {
    crimson: 'border-rose-500/60',
    teal: 'border-teal-500/60',
    gold: 'border-yellow-500/60',
    cyan: 'border-cyan-500/60',
  };

  const paddings = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      className={`
        relative bg-slate-900/80 backdrop-blur-xl
        ${borderColors[glowColor]}
        ${glowColors[glowColor]}
        ${paddings[padding]}
        border
        transition-all duration-500
        hover:shadow-[0_0_20px_rgba(220,20,60,0.8)]
        group
        ${className}
      `}
      style={{
        clipPath: borderStyle === 'corner-only' ? 'none' : 'none',
        borderWidth: borderStyle === 'double' ? '2px' : '1px',
      }}
    >
      {/* Top-left corner accent */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-rose-400/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      {/* Top-right corner accent */}
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-rose-400/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      {/* Bottom-left corner accent */}
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-rose-400/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      {/* Bottom-right corner accent */}
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-rose-400/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Animated shimmer overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 2s infinite',
        }}
      />
      
      {children}
    </div>
  );
};

export default GlitterBlock;
