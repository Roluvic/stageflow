

import React, { useState, useRef, useEffect } from 'react';

interface PopoverProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  trigger: React.ReactElement;
  content: React.ReactElement;
}

export const Popover: React.FC<PopoverProps> = ({ isOpen, setIsOpen, trigger, content }) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleTriggerClick = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setIsOpen]);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {React.cloneElement(trigger as React.ReactElement<any>, { onClick: handleTriggerClick, 'aria-haspopup': 'true', 'aria-expanded': isOpen })}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-auto origin-top-left rounded-md bg-popover shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {content}
        </div>
      )}
    </div>
  );
};
