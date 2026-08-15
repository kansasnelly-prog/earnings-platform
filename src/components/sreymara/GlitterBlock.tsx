import React from 'react';

interface GlitterBlockProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'crimson' | 'teal' | 'gold' | 'cyan';
  padding?: 'sm' | 'md' | 'lg';
  shimmer?: boolean;
}

const GlitterBlock: React.FC<GlitterBlockProps> = ({
  children,
  className = '',
  glowColor = 'crimson',
  padding = 'md',
  shimmer = true,
}) => {
  const base = 'sreymara-block relative overflow-hidden';
  const colorVariant = `sreymara-block-${glowColor}`;
  const glow = 'sreymara-glow-border';

  const paddings = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  };

  return (
    <div className={`${base} ${colorVariant} ${glow} ${paddings[padding]} ${className}`}>
      {shimmer && (
        <div
          className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-500"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.04) 50%, transparent 60%)',
            backgroundSize: '200% 100%',
            animation: 'luxury-border-sweep 4s linear infinite',
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default GlitterBlock;
