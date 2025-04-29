import type { ReactNode } from 'react';

interface ConfigurationContainerProps {
  title: string;
  children: ReactNode;
  isLast?: boolean;
  /** Optionnel : classes CSS additionnelles */
  className?: string;
  /** Optionnel : action ou info à droite du titre */
  headerAddon?: ReactNode;
}

/**
 * Utilitaire pour produire un slug a11y sûr à partir du titre
 */
const toSlug = (str: string): string =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

export const ConfigurationContainer = ({
  title,
  children,
  isLast = false,
  className = '',
  headerAddon,
}: ConfigurationContainerProps) => {
  const sectionId = `section-title-${toSlug(title || 'untitled')}`;

  return (
    <section
      role="region"
      className={`bg-white shadow-lg rounded-lg p-4 sm:p-8 transition-all duration-200 hover:shadow-xl w-full ${!isLast ? 'mb-8' : ''} ${className}`}
      aria-labelledby={sectionId}
      tabIndex={-1}
      data-testid="configuration-container"
    >
      <div className="flex items-center justify-between mb-6">
        <h2
          id={sectionId}
          className="text-xl font-semibold text-gray-900 flex items-center"
        >
          <span className="w-1.5 h-6 bg-indigo-600 rounded-full mr-3" aria-hidden="true" />
          {title}
        </h2>
        {headerAddon && (
          <div className="ml-3 flex-shrink-0">{headerAddon}</div>
        )}
      </div>
      <div className="w-full">{children}</div>
    </section>
  );
};