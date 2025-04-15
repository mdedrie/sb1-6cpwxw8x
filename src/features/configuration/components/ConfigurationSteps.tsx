import React from 'react';
import { Check } from 'lucide-react';

type StepStatus = 'complete' | 'current' | 'upcoming';

interface ConfigurationStepsProps {
  steps: {
    name: string;
    description: string;
    status: StepStatus;
  }[];
  onStepClick?: (index: number) => void;
}

export const ConfigurationSteps: React.FC<ConfigurationStepsProps> = ({ steps, onStepClick }) => {
  const canNavigateToStep = (status: StepStatus, index: number): boolean => {
    // On peut toujours naviguer vers une étape complétée
    if (status === 'complete') return true;
    
    // On peut naviguer vers l'étape courante
    if (status === 'current') return true;
    
    // On ne peut pas naviguer vers une étape à venir
    return false;
  };

  return (
    <nav aria-label="Progress" className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4">
      <ol role="list" className="flex divide-x divide-gray-200">
        {steps.map((step, index) => {
          const isComplete = step.status === 'complete';
          const isCurrent = step.status === 'current';
          const canNavigate = canNavigateToStep(step.status, index);

          return (
            <li key={step.name} className="flex-1 relative">
              <button
                onClick={() => canNavigate && onStepClick?.(index)}
                disabled={!canNavigate}
                className={`w-full group relative flex flex-col py-1.5 px-3 text-left
                ${canNavigate ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed opacity-60'}
                ${isCurrent ? 'bg-indigo-50' : ''}
                ${isComplete ? 'bg-green-50/50' : ''}
              `}
              >
                <div className="flex items-center space-x-1.5">
                  {isComplete ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <span className={`text-xs font-semibold ${
                      isCurrent ? 'text-indigo-600' : 'text-gray-400'
                    }`}>
                      {index + 1}
                    </span>
                  )}
                  <span className={`text-xs font-medium ${
                    isComplete ? 'text-green-700' :
                    isCurrent ? 'text-indigo-700' :
                    'text-gray-500'
                  }`}>
                    {step.name}
                  </span>
                </div>
                <span className={`text-[11px] ${
                  isCurrent ? 'text-gray-700' : 'text-gray-400'
                }`}>
                  {step.description}
                </span>
                {isCurrent && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                )}
                {isComplete && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};