import type { ReactNode } from 'react';

interface ConfigurationContainerProps {
  title: string;
  children: ReactNode;
  isLast?: boolean;
}

export const ConfigurationContainer = ({
  title,
  children,
  isLast = false
}: ConfigurationContainerProps) => {
  return (
    <section
      className={`bg-white shadow-lg rounded-lg p-8 transition-all duration-200 hover:shadow-xl ${!isLast ? 'mb-8' : ''}`}
      aria-labelledby={`section-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <h2
        id={`section-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
        className="text-xl font-semibold text-gray-900 mb-6 flex items-center"
      >
        <span className="w-1.5 h-6 bg-indigo-600 rounded-full mr-3" />
        {title}
      </h2>
      {children}
    </section>
  );
};
