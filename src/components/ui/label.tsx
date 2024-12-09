// src/components/ui/label.tsx
import React from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  htmlFor?: string;
}

export const Label: React.FC<LabelProps> = ({ children, htmlFor, ...props }) => {
  return (
    <label htmlFor={htmlFor} {...props} className="label">
      {children}
    </label>
  );
};
