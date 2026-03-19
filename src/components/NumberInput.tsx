import { useState, useCallback } from 'react';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  allowDecimal?: boolean;
}

/**
 * NumberInput - A reusable number input component that properly handles empty values
 * and allows users to delete the "0" value.
 */
export function NumberInput({
  value,
  onChange,
  placeholder = '0',
  className = '',
  id,
  name,
  disabled = false,
  min = 0,
  max,
  step = 1,
  prefix,
  suffix,
  allowDecimal = false,
}: NumberInputProps) {
  // Use internal state to track the input value as string for better UX
  const [inputValue, setInputValue] = useState<string>(value === 0 ? '' : value.toString());
  const [isFocused, setIsFocused] = useState(false);

  // Update internal value when prop changes (but not while focused)
  if (!isFocused && value.toString() !== inputValue && !(value === 0 && inputValue === '')) {
    setInputValue(value === 0 ? '' : value.toString());
  }

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Allow empty string
    if (newValue === '') {
      setInputValue('');
      onChange(0);
      return;
    }
    
    // Parse the value
    const parsedValue = allowDecimal ? parseFloat(newValue) : parseInt(newValue, 10);
    
    // Only update if valid number
    if (!isNaN(parsedValue)) {
      setInputValue(newValue);
      onChange(parsedValue);
    }
  }, [onChange, allowDecimal]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    
    // Ensure value is within bounds on blur
    let finalValue = inputValue === '' ? 0 : (allowDecimal ? parseFloat(inputValue) : parseInt(inputValue, 10));
    
    if (isNaN(finalValue)) {
      finalValue = 0;
    }
    
    // Apply min/max constraints
    if (min !== undefined && finalValue < min) {
      finalValue = min;
    }
    if (max !== undefined && finalValue > max) {
      finalValue = max;
    }
    
    setInputValue(finalValue === 0 ? '' : finalValue.toString());
    onChange(finalValue);
  }, [inputValue, min, max, onChange, allowDecimal]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {prefix}
        </span>
      )}
      <input
        type="number"
        id={id}
        name={name}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={`
          w-full px-3 py-2 
          bg-slate-50 dark:bg-slate-700 
          border border-slate-300 dark:border-slate-600 
          rounded-lg text-slate-800 dark:text-slate-100 
          placeholder-slate-400
          focus:outline-none focus:ring-2 focus:ring-amber-500/50 
          disabled:opacity-50 disabled:cursor-not-allowed
          ${prefix ? 'pl-8' : ''}
          ${suffix ? 'pr-8' : ''}
          ${className}
        `}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          {suffix}
        </span>
      )}
    </div>
  );
}

export default NumberInput;
