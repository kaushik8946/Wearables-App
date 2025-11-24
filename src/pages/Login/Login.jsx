import { useState } from 'react';
import { getStorageItem, setStorageItem } from '../../service';
import { useNavigate } from 'react-router-dom';
import OtpInput from '../../common/OtpInput/OtpInput';
import './Login.css';

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

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (mobileNumber.length !== 10) {
      setErrors({ ...errors, mobile: 'Enter valid 10 digit mobile number' });
      return;
    }

    try {
      // Check if this phone is already registered — if yes show OTP screen,
      // otherwise persist phone and redirect to signup.
      const registeredUserRaw = await getStorageItem('registeredUser');
      const registeredUser = registeredUserRaw ? JSON.parse(registeredUserRaw) : null;

      if (registeredUser && String(registeredUser.mobile) === String(mobileNumber)) {
        // Registered — show OTP flow so user can verify and sign in
        setShowOtpScreen(true);
        setOtp(['1','2','3','4','5','6']);
        return;
      }

      // Unknown number — save and redirect to signup to complete profile
      await setStorageItem('userPhone', mobileNumber);
      navigate('/signup');
    } catch (err) {
      console.error('Error while checking registration or redirecting to signup', err);
      // Fallback: still save phone and redirect
      try { await setStorageItem('userPhone', mobileNumber); } catch (e) {}
      navigate('/signup');
    }
  };

  const handleOtpChange = (updatedOtp) => {
    setOtp(updatedOtp);
    setErrors((prev) => ({ ...prev, otp: '' }));
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue !== '123456') {
      setErrors({ ...errors, otp: 'Please enter correct OTP (123456)' });
      return;
    }
    let registeredUser = await getStorageItem('registeredUser');
    const parsedUser = registeredUser ? JSON.parse(registeredUser) : null;
    const user = parsedUser || {
      name: 'User',
      lastName: '',
      age: null,
      gender: '',
      email: '',
      mobile: mobileNumber,
      id: `user_${Date.now()}`,
    };
    await setStorageItem('currentUser', JSON.stringify(user));
    await setStorageItem('isAuthenticated', 'true');
    await setStorageItem('userPhone', mobileNumber);
    await setStorageItem('defaultUserId', user.id);
    await setStorageItem('defaultUser', JSON.stringify(user));
    navigate('/dashboard');
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
              <h2 className="form-title">Welcome Back!</h2>
              <div className="input-group">
                <label htmlFor="mobile">Mobile Number <span style={{color:'#ff4757'}}>*</span></label>
                <div className="mobile-input-wrapper">
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
              <button type="submit" className="btn-primary">Request OTP</button>
            </form>
          ) : (
            <form className="login-form" onSubmit={handleVerifyOtp}>
              <h2 className="form-title">Enter OTP</h2>
              <p className="subtitle">For demo purposes, your OTP is <strong>123456</strong>.</p>
              <OtpInput otp={otp} onChange={handleOtpChange} error={errors.otp} />
              <button type="submit" className="btn-primary">Verify & Login</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
