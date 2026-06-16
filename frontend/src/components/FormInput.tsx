import React from "react";

interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  hint?: string;
  options?: { value: string; label: string }[];
  rows?: number;
}

const FormInput: React.FC<FormInputProps> = ({
  label, name, type = "text", value, onChange,
  placeholder, required, disabled, error, hint, options, rows,
}) => {
  const base =
    "w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 " +
    (error ? "border-red-400 bg-red-50" : "border-gray-300") +
    (disabled ? " bg-gray-100 cursor-not-allowed" : "");

  return (
    <div className="flex flex-col gap-1 mb-4">
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {type === "select" && options ? (
        <select id={name} name={name} value={value} onChange={onChange}
          disabled={disabled} required={required} className={base}>
          <option value="">-- Select --</option>
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea id={name} name={name} value={value} onChange={onChange}
          placeholder={placeholder} disabled={disabled} required={required}
          rows={rows || 3} className={base} />
      ) : (
        <input id={name} name={name} type={type} value={value} onChange={onChange}
          placeholder={placeholder} disabled={disabled} required={required}
          className={base} />
      )}

      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default FormInput;
