import React from 'react';

interface ConfigurationContainerProps {
  title: string;
  children: React.ReactNode;
  isLast?: boolean;
}

export const ConfigurationContainer: React.FC<ConfigurationContainerProps> = ({
  title,
  children,
  isLast = false
}) => {
  return (
    <div className={`bg-white shadow-lg rounded-lg p-8 ${!isLast ? 'mb-8' : ''} transition-all duration-200 hover:shadow-xl`}>
      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
        <span className="w-1.5 h-6 bg-indigo-600 rounded-full mr-3" />
        {title}
      </h2>
      {children}
    </div>
  );
};