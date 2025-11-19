import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { idbGet, idbSet } from '../data/db';
import '../styles/pages/Signup.css';

const Signup = () => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    email: '',
    mobileNumber: '',
  });
  
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const userPhone = await idbGet('userPhone');
        if (userPhone && isMounted) {
          setForm((prev) => ({ ...prev, mobileNumber: userPhone }));
        }
      } catch (err) {
        console.error('Failed to fetch stored phone', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!form.mobileNumber.trim() || form.mobileNumber.length !== 10) newErrors.mobileNumber = 'Valid mobile number is required';
    if (!form.age || isNaN(form.age) || form.age < 1 || form.age > 120) newErrors.age = 'Enter valid age (1-120)';
    if (!form.gender) newErrors.gender = 'Select gender';
    if (form.firstName.length > 100) newErrors.firstName = 'Max 100 characters';
    if (form.lastName.length > 100) newErrors.lastName = 'Max 100 characters';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Enter valid email';
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length) {
      setErrors(validation);
      return;
    }
    const userToSave = {
      name: form.firstName + " " + form.lastName,
      lastName: form.lastName,
      age: form.age,
      gender: form.gender,
      email: form.email,
      mobile: form.mobileNumber,
      id: `user_self_${Date.now()}`,
    };
    await idbSet('registeredUser', JSON.stringify(userToSave));
    await idbSet('currentUser', JSON.stringify(userToSave));
    await idbSet('isAuthenticated', 'true');
    await idbSet('userPhone', form.mobileNumber);
    navigate('/dashboard');
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h1>User Registration</h1>
        <p className="signup-subtitle">Complete your profile</p>
        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="firstName">First Name<span style={{color:'red'}}>*</span></label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              maxLength={100}
              value={form.firstName}
              onChange={handleChange}
              className={errors.firstName ? 'input-error' : ''}
              autoFocus
            />
            {errors.firstName && <span className="error-text">{errors.firstName}</span>}
          </div>
          <div className="input-group">
            <label htmlFor="lastName">Last Name<span style={{color:'red'}}>*</span></label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              maxLength={100}
              value={form.lastName}
              onChange={handleChange}
              className={errors.lastName ? 'input-error' : ''}
            />
            {errors.lastName && <span className="error-text">{errors.lastName}</span>}
          </div>
          <div className="input-group">
            <label htmlFor="mobileNumber">Mobile Number<span style={{color:'red'}}>*</span></label>
            <input
              type="tel"
              id="mobileNumber"
              name="mobileNumber"
              maxLength={10}
              value={form.mobileNumber}
              onChange={handleChange}
              className={errors.mobileNumber ? 'input-error' : ''}
            />
            {errors.mobileNumber && <span className="error-text">{errors.mobileNumber}</span>}
          </div>
          <div className="input-group">
            <label htmlFor="age">Age<span style={{color:'red'}}>*</span></label>
            <input
              type="number"
              id="age"
              name="age"
              min={1}
              max={120}
              maxLength={3}
              value={form.age}
              onInput={e => {
                let v = e.target.value.replace(/[^0-9]/g, '').slice(0, 3);
                if (v && (+v < 1 || +v > 120)) v = v.slice(0, 2);
                setForm(prev => ({ ...prev, age: v }));
              }}
              onChange={handleChange}
              className={errors.age ? 'input-error' : ''}
            />
            {errors.age && <span className="error-text">{errors.age}</span>}
          </div>
          <div className="input-group">
            <label htmlFor="gender">Gender<span style={{color:'red'}}>*</span></label>
            <select
              id="gender"
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className={errors.gender ? 'input-error' : ''}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Others">Others</option>
            </select>
            {errors.gender && <span className="error-text">{errors.gender}</span>}
          </div>
          <div className="input-group">
            <label htmlFor="email">Email Id (optional)</label>
            <input
              type="email"
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>
          <button type="submit" className="btn-primary">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
