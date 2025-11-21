const FormInput = ({ 
  label, 
  id, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  error, 
  required = false,
  placeholder,
  autoFocus = false,
  maxLength,
  min,
  max,
  className = '',
  ...rest 
}) => {
  return (
    <div className="input-group">
      <label htmlFor={id}>
        {label}
        {required && <span style={{color:'#ff4757'}}>*</span>}
      </label>
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${className} ${error ? 'input-error' : ''}`}
        autoFocus={autoFocus}
        maxLength={maxLength}
        min={min}
        max={max}
        {...rest}
      />
      {error && <span className="error-text">{error}</span>}
    </div>
  );
};

export default FormInput;
