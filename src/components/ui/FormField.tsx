import { FC, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

type CommonProps = {
  label: string;
  error?: string;
  textarea?: boolean;
  className?: string;
};

type InputProps = InputHTMLAttributes<HTMLInputElement> & { textarea?: false };
type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { textarea: true };

export type FormFieldProps = CommonProps & (InputProps | TextareaProps);

/**
 * FormField component that supports both input and textarea elements.
 * Inherits all HTML attributes from the respective element type.
 * 
 * @example
 * <FormField
 *   label="Username"
 *   id="username"
 *   required
 *   autoFocus
 *   error="This field is required"
 * />
 */

export const FormField: FC<FormFieldProps> = ({
  label,
  id,
  error,
  textarea,
  className = '',
  ...props
}) => {
  const fieldId = id ?? `formfield-${label.replace(/\s+/g, '-').toLowerCase()}`;
  const errorId = error ? `${fieldId}-error` : undefined;
  
  const baseClassName = `
    mt-1 block w-full rounded-md shadow-sm sm:text-sm transition-colors duration-200
    ${error 
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50/50' 
      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
    }
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
          rows={4}
          aria-invalid={!!error}
          aria-describedby={errorId}
          {...props}
        />
      ) : (
        <input
          type={props.type || 'text'}
          id={fieldId}
          className={`${baseClassName} ${className}`}
          aria-invalid={!!error}
          aria-describedby={errorId}
          {...props}
        />
      )}
      {error && (
        <p 
          id={errorId} 
          className="mt-1 text-sm text-red-600 flex items-center"
        >
          <svg 
            className="h-4 w-4 mr-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
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