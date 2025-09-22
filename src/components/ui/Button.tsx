import React from "react";

type Variant = "primary" | "secondary" | "destructive";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: React.ComponentType<{ className?: string }>;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  icon: Icon,
  className = "",
  children,
  ...rest
}) => {
  const base = "inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<Variant, string> = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    destructive: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {Icon ? <Icon className="w-4 h-4 mr-2" /> : null}
      {children}
    </button>
  );
};

export default Button;


