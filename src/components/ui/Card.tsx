import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card: React.FC<CardProps> = ({ className = "", children, ...rest }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`} {...rest}>
      {children}
    </div>
  );
};

export default Card;


