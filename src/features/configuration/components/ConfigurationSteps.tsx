import React from 'react';
import { Check } from 'lucide-react';

type StepStatus = 'complete' | 'current' | 'upcoming';

interface Step {
  name: string;
  description: string;
  status: StepStatus;
}

interface ConfigurationStepsProps {
  steps: Step[];
  onStepClick?: (index: number) => void;
}

function getButtonClasses(status: StepStatus, isClickable: boolean): string {
  return [
    'w-full group relative flex flex-col py-1.5 px-3 text-left transition-colors duration-150',
    isClickable ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed opacity-60',
    status === 'current' ? 'bg-indigo-50' : '',
    status === 'complete' ? 'bg-green-50/50' : '',
  ].join(' ');
}

export const ConfigurationSteps: React.FC<ConfigurationStepsProps> = ({
  steps,
  onStepClick,
}) => {
  const canNavigateToStep = (status: StepStatus): boolean => status === 'complete' || status === 'current';

  if (!steps || steps.length === 0) {
    return (
      <nav aria-label="Progress" className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4 p-2 text-center text-gray-400">
        Aucune étape à afficher.
      </nav>
    );
  }

  return (
    <nav aria-label="Progression des étapes du configurateur" className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4">
      <ol className="flex divide-x divide-gray-200">
        {steps.map((step, index) => {
          const isClickable = canNavigateToStep(step.status);
          const ariaLabel = step.status === 'current'
            ? `Étape courante : ${step.name}. ${step.description}`
            : (step.status === 'complete' ? `Étape terminée : ${step.name}` : `Étape à venir : ${step.name}`);

          return (
            <li key={step.name + index} className="flex-1 relative">
              <button
                type="button"
                onClick={() => isClickable && onStepClick?.(index)}
                disabled={!isClickable}
                aria-disabled={!isClickable}
                aria-current={step.status === 'current' ? 'step' : undefined}
                aria-label={ariaLabel}
                tabIndex={isClickable ? 0 : -1}
                className={getButtonClasses(step.status, isClickable)}
              >
                <div className="flex items-center space-x-1.5">
                  {step.status === 'complete' ? (
                    <Check className="h-3.5 w-3.5 text-green-500" aria-label="Terminée" />
                  ) : (
                    <span className={`text-xs font-semibold ${step.status === 'current' ? 'text-indigo-600' : 'text-gray-400'}`}>{index + 1}</span>
                  )}
                  <span className={`text-xs font-medium ${
                    step.status === 'complete' ? 'text-green-700'
                    : step.status === 'current' ? 'text-indigo-700'
                    : 'text-gray-500'}`}>{step.name}</span>
                </div>
                <span className={`text-[11px] ${step.status === 'current' ? 'text-gray-700' : 'text-gray-400'}`}>{step.description}</span>
                {(step.status === 'current' || step.status === 'complete') && (
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                    step.status === 'current' ? 'bg-indigo-600' : step.status === 'complete' ? 'bg-green-500' : ''}`}/>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};