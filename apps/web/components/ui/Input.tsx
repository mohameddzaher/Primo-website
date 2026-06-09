'use client';

import { forwardRef, InputHTMLAttributes, ReactNode, useState, useId } from 'react';
import { cn } from '@/lib/utils';
import { HiEye, HiEyeOff } from 'react-icons/hi';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      fullWidth = true,
      type = 'text',
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const generatedId = useId();
    const inputId = id || `input-${generatedId}`;
    const isPassword = type === 'password';

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-dark-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={isPassword && showPassword ? 'text' : type}
            className={cn(
              'w-full rounded-lg border bg-white px-4 py-2.5 text-dark-900',
              'placeholder:text-dark-400 transition-all duration-200',
              'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none',
              'disabled:bg-beige-100 disabled:cursor-not-allowed',
              error
                ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20'
                : 'border-beige-300',
              leftIcon && 'pl-10',
              (rightIcon || isPassword) && 'pr-10',
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600 transition-colors"
            >
              {showPassword ? <HiEyeOff size={18} /> : <HiEye size={18} />}
            </button>
          )}
          {!isPassword && rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-sm text-error-500">{error}</p>}
        {hint && !error && <p className="text-sm text-dark-500">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea component
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, fullWidth = true, id, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || `textarea-${generatedId}`;

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-dark-700"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full rounded-lg border bg-white px-4 py-2.5 text-dark-900',
            'placeholder:text-dark-400 transition-all duration-200 resize-none',
            'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none',
            'disabled:bg-beige-100 disabled:cursor-not-allowed',
            error
              ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20'
              : 'border-beige-300',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-error-500">{error}</p>}
        {hint && !error && <p className="text-sm text-dark-500">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// Select component
export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      hint,
      fullWidth = true,
      options,
      placeholder,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || `select-${generatedId}`;

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-dark-700"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full rounded-lg border bg-white px-4 py-2.5 text-dark-900',
            'transition-all duration-200 appearance-none cursor-pointer',
            'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none',
            'disabled:bg-beige-100 disabled:cursor-not-allowed',
            error
              ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20'
              : 'border-beige-300',
            className
          )}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236d6d6d' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right 0.75rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1.25rem 1.25rem',
          }}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {(options || []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-error-500">{error}</p>}
        {hint && !error && <p className="text-sm text-dark-500">{hint}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

// Checkbox component
export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const generatedId = useId();
    const checkboxId = id || `checkbox-${generatedId}`;

    return (
      <div className="flex items-start gap-3">
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className={cn(
            'w-4.5 h-4.5 mt-0.5 rounded border-2 border-beige-400 bg-white',
            'checked:bg-primary-600 checked:border-primary-600',
            'focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-0',
            'transition-all duration-200 cursor-pointer',
            className
          )}
          {...props}
        />
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={checkboxId}
                className="text-sm font-medium text-dark-900 cursor-pointer"
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-sm text-dark-500">{description}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

// Radio component
export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const generatedId = useId();
    const radioId = id || `radio-${generatedId}`;

    return (
      <div className="flex items-start gap-3">
        <input
          ref={ref}
          id={radioId}
          type="radio"
          className={cn(
            'w-4.5 h-4.5 mt-0.5 rounded-full border-2 border-beige-400 bg-white',
            'checked:border-primary-600 checked:border-[5px]',
            'focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-0',
            'transition-all duration-200 cursor-pointer',
            className
          )}
          {...props}
        />
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={radioId}
                className="text-sm font-medium text-dark-900 cursor-pointer"
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-sm text-dark-500">{description}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

export default Input;
