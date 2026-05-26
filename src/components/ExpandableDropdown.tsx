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
    <div className={`w-full ${className}`}>
      {/* Dropdown Content */}
      <div
        className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="mt-3 bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
          <div className="flex items-start justify-between mb-3">
            <h4 className="text-lg font-semibold text-white">{title}</h4>
            {showCloseButton && (
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="text-gray-300">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpandableDropdown;
