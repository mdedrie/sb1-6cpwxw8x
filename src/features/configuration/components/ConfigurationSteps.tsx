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

export const ConfigurationSteps: React.FC<ConfigurationStepsProps> = ({
  steps,
  onStepClick,
}) => {
  function canNavigateToStep(status: StepStatus): boolean {
    return status === 'complete' || status === 'current';
  }

  if (!steps || steps.length === 0) {
    return (
      <nav aria-label="Progress" className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4 p-2 text-center text-gray-400">
        Aucune étape à afficher.
      </nav>
    );
  }

  return (
    <nav aria-label="Progression des étapes du configurateur" className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4">
      <ol role="list" className="flex divide-x divide-gray-200">
        {steps.map((step, index) => {
          const { status, name, description } = step;
          const isComplete = status === 'complete';
          const isCurrent = status === 'current';
          const isClickable = canNavigateToStep(status);

          return (
            <li key={name + index} role="step" className="flex-1 relative">
              <button
                type="button"
                onClick={() => isClickable && onStepClick?.(index)}
                disabled={!isClickable}
                aria-disabled={!isClickable}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={
                  isCurrent
                    ? `Étape courante : ${name}. ${description}`
                    : (isComplete ? `Étape terminée : ${name}` : `Étape à venir : ${name}`)
                }
                tabIndex={isClickable ? 0 : -1}
                className={[
                  "w-full group relative flex flex-col py-1.5 px-3 text-left transition-colors duration-150",
                  isClickable ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed opacity-60',
                  isCurrent ? 'bg-indigo-50' : '',
                  isComplete ? 'bg-green-50/50' : '',
                ].join(' ')}
              >
                <div className="flex items-center space-x-1.5">
                  {isComplete ? (
                    <Check className="h-3.5 w-3.5 text-green-500" aria-label="Terminée" />
                  ) : (
                    <span className={`text-xs font-semibold ${isCurrent ? 'text-indigo-600' : 'text-gray-400'}`}>
                      {index + 1}
                    </span>
                  )}
                  <span className={`text-xs font-medium ${
                    isComplete ? 'text-green-700' :
                    isCurrent ? 'text-indigo-700' :
                    'text-gray-500'
                  }`}>
                    {name}
                  </span>
                </div>
                <span className={`text-[11px] ${
                  isCurrent ? 'text-gray-700' : 'text-gray-400'
                }`}>
                  {description}
                </span>
                {(isCurrent || isComplete) && (
                  <div
                    className={[
                      "absolute bottom-0 left-0 right-0 h-0.5",
                      isCurrent ? "bg-indigo-600" : "",
                      isComplete ? "bg-green-500" : ""
                    ].join(' ')}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};