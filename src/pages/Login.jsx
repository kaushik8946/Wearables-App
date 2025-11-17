import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/Login.css';

const Login = () => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otp, setOtp] = useState(['1', '2', '3', '4', '5', '6']);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
    setMobileNumber(value);
    setErrors((prev) => ({ ...prev, mobile: '' }));
  };

  const handleRequestOtp = (e) => {
    e.preventDefault();
    if (mobileNumber.length !== 10) {
      setErrors({ ...errors, mobile: 'Enter valid 10 digit mobile number' });
      return;
    }
    setShowOtpScreen(true);
    setOtp(['1','2','3','4','5','6']);
  };

  const handleOtpInput = (e, idx) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 1);
    const updatedOtp = otp.map((v, i) => (i === idx ? value : v));
    setOtp(updatedOtp);
    setErrors((prev) => ({ ...prev, otp: '' }));
    if (value && idx < 5) {
      document.getElementById(`otp-${idx + 1}`).focus();
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue !== '123456') {
      setErrors({ ...errors, otp: 'Please enter correct OTP (123456)' });
      return;
    }
    const registeredUser = localStorage.getItem('registeredUser');
    const parsedUser = registeredUser ? JSON.parse(registeredUser) : null;
    const user = parsedUser || {
      name: 'User',
      lastName: '',
      age: null,
      gender: '',
      email: '',
      mobile: mobileNumber,
    };
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userPhone', mobileNumber);
    if (mobileNumber.endsWith('123')) {
      navigate('/signup');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="login-theme-bg">
      <div className="login-container">
        
        <div className="login-card">
          <div className="logo-section">
            <h1>Wearables</h1>
            <p className="tagline">Track your health in one place.</p>
          </div>
          {!showOtpScreen ? (
            <form className="login-form" onSubmit={handleRequestOtp}>
                 <h2 className="form-title" style={{textAlign: 'center', marginBottom: 18}}>Welcome Back!</h2>
              <div className="input-group">
                <label htmlFor="mobile">Mobile Number <span style={{color:'red'}}>*</span></label>
                <div className="mobile-input-wrapper">
                  <span className="country-code">+91</span>
                  <input
                    type="tel"
                    id="mobile"
                    name="mobile"
                    value={mobileNumber}
                    onChange={handleMobileChange}
                    placeholder="Enter 10 digit mobile"
                    className={errors.mobile ? 'input-error' : ''}
                    autoFocus
                    maxLength={10}
                  />
                </div>
                {errors.mobile && <span className="error-text">{errors.mobile}</span>}
              </div>
              <button type="submit" className="btn-primary" style={{marginTop: 10, fontSize: 17}}>Request OTP</button>
            </form>
          ) : (
            <form className="login-form" onSubmit={handleVerifyOtp}>
              <h2 className="form-title">Enter OTP</h2>
              <p className="subtitle">For demo purposes, your OTP is <strong>123456</strong>.</p>
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
                      onChange={(e) => handleOtpInput(e, idx)}
                    />
                  ))}
                </div>
                {errors.otp && <span className="error-text">{errors.otp}</span>}
              </div>
              <button type="submit" className="btn-primary">Verify & Login</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
