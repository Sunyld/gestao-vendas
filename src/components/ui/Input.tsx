import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ComponentType<{ className?: string }>;
}

export const Input: React.FC<InputProps> = ({ icon: Icon, className = "", ...rest }) => {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
      <input
        className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${Icon ? 'pl-9' : ''} ${className}`}
        {...rest}
      />
    </div>
  );
};

export default Input;


