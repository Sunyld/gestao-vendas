import React from "react";

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}

export const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center space-x-4">
      <div className="p-2 bg-blue-50 rounded-lg">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-xl font-semibold text-gray-900">{value}</div>
      </div>
    </div>
  );
};

export default StatCard;


