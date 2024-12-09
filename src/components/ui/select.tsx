// src/components/ui/select.tsx

import { useState, useEffect, useRef, ReactNode, FC } from 'react';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: (props: {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    handleSelect: (value: string) => void;
    value: string;
  }) => ReactNode;
}

export const Select: FC<SelectProps> = ({ value, onValueChange, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onValueChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={ref} className="relative inline-block text-left">
      {children({ isOpen, setIsOpen, handleSelect, value })}
    </div>
  );
};

interface SelectTriggerProps {
  children: ReactNode;
  toggleOpen: () => void;
}

export const SelectTrigger: FC<SelectTriggerProps> = ({ children, toggleOpen }) => {
  return (
    <button
      type="button"
      className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
      onClick={toggleOpen}
    >
      {children}
    </button>
  );
};

interface SelectContentProps {
  children: ReactNode;
}

export const SelectContent: FC<SelectContentProps> = ({ children }) => {
  return (
    <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
      <div className="py-1">{children}</div>
    </div>
  );
};

interface SelectItemProps {
  value: string;
  children: ReactNode;
  onSelect: () => void;
}

export const SelectItem: FC<SelectItemProps> = ({ value, children, onSelect }) => {
  return (
    <div
      className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100"
      onClick={onSelect}
    >
      {children}
    </div>
  );
};

export const SelectValue: FC<{ children: ReactNode }> = ({ children }) => {
  return <span>{children}</span>;
};
