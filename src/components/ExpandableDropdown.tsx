import React, { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

interface ExpandableDropdownProps {
  title: string;
  children: React.ReactNode;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  className?: string;
  showCloseButton?: boolean;
}

const ExpandableDropdown: React.FC<ExpandableDropdownProps> = ({
  title,
  children,
  isOpen: controlledIsOpen,
  onToggle,
  className = '',
  showCloseButton = false,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  
  const handleToggle = () => {
    const newState = !isOpen;
    if (onToggle) {
      onToggle(newState);
    } else {
      setInternalIsOpen(newState);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggle) {
      onToggle(false);
    } else {
      setInternalIsOpen(false);
    }
  };

  return (
    <div className={`w-full ${className} bg-green-600 rounded-xl p-4 max-w-full mx-auto`} style={{ boxShadow: '0 0 15px 3px rgba(34,197,94,0.7)', position: 'relative', zIndex: 99999 }}>
  <div className="header cursor-pointer select-none" onClick={handleToggle}>
    <h4 className="text-white text-center text-lg font-semibold">{title}</h4>
    {showCloseButton && (
      <button
        onClick={handleClose}
        className="text-gray-400 hover:text-white transition-colors absolute top-4 right-4"
        aria-label="Close dropdown"
      >
        <X className="w-5 h-5" />
      </button>
    )}
  </div>
  <div
    className={`overflow-hidden transition-all duration-300 ease-in-out mt-4 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
    style={{ visibility: isOpen ? 'visible' : 'hidden' }}
  >
    <div className="bg-white/[0.05] border border-white/[0.1] rounded-xl p-4">
      <div className="text-gray-300">
        {children}
      </div>
    </div>
  </div>
</div>
  );
};

export default ExpandableDropdown;
