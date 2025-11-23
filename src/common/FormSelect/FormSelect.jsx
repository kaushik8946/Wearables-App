const FormSelect = ({ 
  label, 
  id, 
  name, 
  value, 
  onChange, 
  options = [], 
  error, 
  required = false,
  placeholder = 'Select an option',
  className = ''
}) => {
  return (
    <div className="input-group">
      <label htmlFor={id}>
        {label}
        {required && <span style={{color:'#ff4757'}}>*</span>}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={`${className} ${error ? 'input-error' : ''}`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value || option} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
      </select>
      {error && <span className="error-text">{error}</span>}
    </div>
  );
};

export default FormSelect;
