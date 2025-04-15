import { FC, InputHTMLAttributes, TextareaHTMLAttributes, useId } from 'react';

type CommonProps = {
  label: string;
  error?: string;
  className?: string;
};

type InputFieldProps = {
  textarea?: false;
} & CommonProps & InputHTMLAttributes<HTMLInputElement>;

type TextareaFieldProps = {
  textarea: true;
  rows?: number;
} & CommonProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

export type FormFieldProps = InputFieldProps | TextareaFieldProps;

export const FormField: FC<FormFieldProps> = ({
  label,
  id,
  error,
  textarea = false,
  className = '',
  ...props
}) => {
  const autoId = useId();
  const fieldId = id ?? `formfield-${autoId}`;
  const errorId = error ? `${fieldId}-error` : undefined;

  const baseClassName = `
    mt-1 block w-full rounded-md shadow-sm sm:text-sm transition-colors duration-200
    ${error
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50/50'
      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'}
  `;

  return (
    <div className="mb-4">
      <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {props.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {textarea ? (
        <textarea
          id={fieldId}
          className={`${baseClassName} ${className}`}
          aria-invalid={!!error}
          aria-describedby={errorId}
          rows={(props as TextareaFieldProps).rows ?? 4}
          {...(props as TextareaFieldProps)}
        />
      ) : (
        <input
          id={fieldId}
          type={(props as InputFieldProps).type ?? 'text'}
          className={`${baseClassName} ${className}`}
          aria-invalid={!!error}
          aria-describedby={errorId}
          {...(props as InputFieldProps)}
        />
      )}

      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600 flex items-center">
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};
