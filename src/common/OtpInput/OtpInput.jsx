const OtpInput = ({ otp = [], onChange, error }) => {
  const handleInput = (e, idx) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 1);
    const updatedOtp = otp.map((v, i) => (i === idx ? value : v));
    onChange(updatedOtp);
    
    if (value && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus();
    }
  };

  return (
    <div className="input-group">
      <div className="otp-input-wrapper">
        {otp.map((value, idx) => (
          <input
            key={idx}
            id={`otp-${idx}`}
            className="otp-box"
            type="text"
            maxLength={1}
            value={value}
            onChange={(e) => handleInput(e, idx)}
          />
        ))}
      </div>
      {error && <span className="error-text">{error}</span>}
    </div>
  );
};

export default OtpInput;
