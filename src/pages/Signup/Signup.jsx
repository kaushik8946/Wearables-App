import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStorageItem, setStorageItem, getStorageJSON, setStorageJSON } from '../../service';
import FormInput from '../../common/FormInput/FormInput';
import FormSelect from '../../common/FormSelect/FormSelect';
import './Signup.css';

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
        const userPhone = await getStorageItem('userPhone');
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

    // Build full name - randomly pick one word from the full name
    let fullName = form.firstName + " " + form.lastName;
    const words = fullName.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length > 1) {
      const randomIndex = Math.floor(Math.random() * words.length);
      fullName = words[randomIndex];
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
    await setStorageItem('registeredUser', JSON.stringify(userToSave));
    await setStorageItem('defaultUser', JSON.stringify(userToSave));
    await setStorageItem('isAuthenticated', 'true');
    await setStorageItem('userPhone', form.mobileNumber);
    // Make this newly created user the default user so dashboard loads as expected
    await setStorageItem('defaultUserId', userToSave.id);
    await setStorageItem('defaultUser', JSON.stringify(userToSave));

    // Also add to medPlusUsers (as a MedPlus patient)
    const existingMedPlusUsers = await getStorageJSON('medPlusUsers', []);
    const newMedPlusUser = {
      patientId: `MP${Date.now().toString().slice(-6)}`,
      patientName: fullName,
      age: form.age,
      gender: form.gender,
      email: form.email,
      mobile: form.mobileNumber,
    };
    const updatedMedPlusUsers = [...existingMedPlusUsers, newMedPlusUser];
    await setStorageJSON('medPlusUsers', updatedMedPlusUsers);

    navigate('/dashboard');
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h1>User Registration</h1>
        <p className="signup-subtitle">Complete your profile</p>
        <form className="signup-form" onSubmit={handleSubmit}>
          <FormInput
            label="First Name"
            id="firstName"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            error={errors.firstName}
            required
            maxLength={100}
            autoFocus
          />
          <FormInput
            label="Last Name"
            id="lastName"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            error={errors.lastName}
            required
            maxLength={100}
          />
          <FormInput
            label="Mobile Number"
            id="mobileNumber"
            name="mobileNumber"
            type="tel"
            value={form.mobileNumber}
            onChange={handleChange}
            error={errors.mobileNumber}
            required
            maxLength={10}
          />
          <FormInput
            label="Age"
            id="age"
            name="age"
            type="number"
            value={form.age}
            onInput={e => {
              let v = e.target.value.replace(/[^0-9]/g, '').slice(0, 3);
              if (v && (+v < 1 || +v > 120)) v = v.slice(0, 2);
              setForm(prev => ({ ...prev, age: v }));
            }}
            onChange={handleChange}
            error={errors.age}
            required
            min={1}
            max={120}
            maxLength={3}
          />
          <FormSelect
            label="Gender"
            id="gender"
            name="gender"
            value={form.gender}
            onChange={handleChange}
            options={['Male', 'Female', 'Others']}
            error={errors.gender}
            required
            placeholder="Select Gender"
          />
          <FormInput
            label="Email Id (optional)"
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
          />
          <button type="submit" className="btn-primary">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
