import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

const Login = () => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [errors, setErrors] = useState({ mobile: '', otp: '' });
  const inputs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (showOtpInput) {
      const prefilledOtp = ['1', '2', '3', '4', '5', '6'];
      setOtp(prefilledOtp);
    }
  }, [showOtpInput]);

  const handleMobileNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setMobileNumber(value);
      if (value.length === 10) {
        setErrors({ ...errors, mobile: '' });
      } else {
        setErrors({ ...errors, mobile: 'Enter a valid mobile number' });
      }
    }
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (mobileNumber.length !== 10) {
      setErrors({ ...errors, mobile: 'Enter a valid mobile number' });
      return;
    }
    setShowOtpInput(true);
    setErrors({ mobile: '', otp: '' });
  };

  const handleOtpChange = (e, index) => {
    const { value } = e.target;

    if (value.match(/^\d$/)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (index < 5) {
        inputs.current[index + 1].focus();
      }
    }

    if (value === '') {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && otp[index] === '') {
      if (index > 0) {
        inputs.current[index - 1].focus();
      }
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setErrors({ ...errors, otp: 'Please enter complete 6-digit OTP' });
      return;
    }

    console.log('Verifying OTP:', otpValue);
    
    if (mobileNumber.endsWith('123')) {
      navigate('/signup');
    } else {
      navigate('/home');
    }
  };

  const handleResendOtp = () => {
    setOtp(['1', '2', '3', '4', '5', '6']);
    console.log('Resending OTP to:', mobileNumber);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-section">
          <h1>Wearables App</h1>
          <p className="tagline">Monitor Your Health</p>
        </div>

        {!showOtpInput ? (
          <form onSubmit={handleSendOtp} className="login-form">
            <h2>Login/Sign Up</h2>
            <p className="subtitle">Enter your mobile number to continue</p>

            <div className="input-group">
              <label htmlFor="mobile">Mobile Number</label>
              <div className="mobile-input-wrapper">
                <span className="country-code">+91</span>
                <input
                  id="mobile"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  value={mobileNumber}
                  onChange={handleMobileNumberChange}
                  placeholder="10-digit number"
                  className={errors.mobile ? 'input-error' : ''}
                  autoFocus
                />
              </div>
              {errors.mobile && <span className="error-text">{errors.mobile}</span>}
            </div>

            <button type="submit" className="btn-primary" disabled={mobileNumber.length !== 10}>
              Generate OTP
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="login-form">
            <h2>Verify OTP</h2>
            <p className="subtitle">
              Code sent to <strong>+91 {mobileNumber}</strong>
            </p>

            <div className="input-group">
              <label>Enter OTP</label>
              <div className="otp-input-wrapper">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{1}"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    ref={(el) => (inputs.current[index] = el)}
                    className={`otp-box ${errors.otp ? 'input-error' : ''}`}
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              {errors.otp && <span className="error-text">{errors.otp}</span>}
            </div>

            <button type="submit" className="btn-primary">
              Verify & Continue
            </button>

            <div className="resend-section">
              <p>Didn't receive the code?</p>
              <button type="button" onClick={handleResendOtp} className="btn-link">
                Resend OTP
              </button>
            </div>

            <button 
              type="button" 
              onClick={() => {
                setShowOtpInput(false);
                setOtp(Array(6).fill(''));
                setErrors({ mobile: '', otp: '' });
              }} 
              className="btn-secondary"
            >
              Change Number
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
