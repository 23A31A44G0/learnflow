import React from 'react';

interface TextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
}

const Textarea: React.FC<TextareaProps> = ({
  value,
  onChange,
  placeholder = "Paste your lecture notes, textbook content, or any study material here...",
  rows = 6,
  disabled = false,
  className = ""
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="w-full">
      <textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={`
          w-full p-4 border rounded-lg resize-none
          focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
          ${className}
        `}
      />
      <div className="mt-2 flex justify-between items-center text-sm text-gray-500">
        <span>{value.length} characters</span>
        <span className={value.length >= 50 ? 'text-green-600' : 'text-orange-500'}>
          {value.length >= 50 ? '✓ Ready for analysis' : 'Minimum 50 characters needed'}
        </span>
      </div>
    </div>
  );
};

export default Textarea;