
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  size?: 'default' | 'lg' | 'xl';
}

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, children, size = 'default' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    default: 'sm:max-w-lg',
    lg: 'sm:max-w-3xl',
    xl: 'sm:max-w-5xl',
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className={`relative w-full bg-card shadow-xl animate-slide-up-and-fade sm:animate-in sm:fade-in-0 sm:zoom-in-95 rounded-t-2xl sm:rounded-2xl ${sizeClasses[size]}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-4 sm:p-6">
          <div className="flex-1 min-w-0 pr-4">
            {typeof title === 'string' ? <h2 className="text-xl sm:text-2xl font-bold">{title}</h2> : title}
          </div>
          <button
            onClick={onClose}
            className="p-1 -mr-2 -mt-2 sm:mr-0 sm:mt-0 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6 pt-0">
          {children}
        </div>
      </div>
    </div>
  );
};