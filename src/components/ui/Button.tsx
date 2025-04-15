import { FC, ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Button component with support for different sizes, variants, and loading states.
 * @param variant - Visual style variant ('primary' | 'secondary')
 * @param size - Button size ('sm' | 'md' | 'lg')
 * @param fullWidth - Whether the button should take full width
 * @param loading - Shows loading spinner and disables the button
 * @param loadingText - Text to show while loading
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  loadingText?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  loadingText,
  type = 'button',
  className = '',
  disabled,
  ...props
}, ref) => {
  const baseStyles = "inline-flex justify-center items-center border rounded-md shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed";
  
  const sizes = {
    sm: "text-xs py-1.5 px-3 gap-1.5",
    md: "text-sm py-2 px-4 gap-2",
    lg: "text-base py-2.5 px-5 gap-2.5"
  };

  const variants = {
    primary: "border-transparent text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 disabled:hover:bg-indigo-600",
    secondary: "border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-indigo-500 disabled:hover:bg-white"
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className={`animate-spin ${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'}`} />
          <span>{loadingText || 'Chargement...'}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
});

Button.displayName = 'Button';