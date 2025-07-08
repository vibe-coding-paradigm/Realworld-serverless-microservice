import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ErrorMessage } from '@/components/ui/error';

const RegisterPage: React.FC = () => {
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.username) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await register(formData);
      navigate('/');
    } catch {
      // Error is handled by AuthContext
    }
  };

  return (
    <div className="auth-page">
      <div className="realworld-container" style={{ padding: '2rem 15px' }}>
        <div className="flex justify-center">
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-medium mb-2">Sign up</h1>
              <Link to="/login" className="text-green-500 hover:underline">
                Have an account?
              </Link>
            </div>

            {error && (
              <ul className="error-messages mb-4" style={{ 
                backgroundColor: '#f2dede',
                border: '1px solid #ebccd1',
                color: '#a94442',
                padding: '1rem',
                borderRadius: '0.25rem',
                listStyle: 'none',
                margin: '0'
              }}>
                <li><ErrorMessage message={error} /></li>
              </ul>
            )}

            <form onSubmit={handleSubmit}>
              <fieldset style={{ border: 'none', padding: '0', margin: '0' }}>
                <fieldset className="form-group mb-4">
                  <input
                    name="username"
                    type="text"
                    placeholder="Your Name"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="form-control"
                    disabled={loading}
                    style={{
                      fontSize: '1.25rem',
                      padding: '0.75rem',
                      border: formErrors.username ? '1px solid #d9534f' : '1px solid #ccc'
                    }}
                  />
                  {formErrors.username && (
                    <div style={{ color: '#d9534f', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                      <ErrorMessage message={formErrors.username} />
                    </div>
                  )}
                </fieldset>

                <fieldset className="form-group mb-4">
                  <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-control"
                    disabled={loading}
                    style={{
                      fontSize: '1.25rem',
                      padding: '0.75rem',
                      border: formErrors.email ? '1px solid #d9534f' : '1px solid #ccc'
                    }}
                  />
                  {formErrors.email && (
                    <div style={{ color: '#d9534f', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                      <ErrorMessage message={formErrors.email} />
                    </div>
                  )}
                </fieldset>

                <fieldset className="form-group mb-4">
                  <input
                    name="password"
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="form-control"
                    disabled={loading}
                    style={{
                      fontSize: '1.25rem',
                      padding: '0.75rem',
                      border: formErrors.password ? '1px solid #d9534f' : '1px solid #ccc'
                    }}
                  />
                  {formErrors.password && (
                    <div style={{ color: '#d9534f', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                      <ErrorMessage message={formErrors.password} />
                    </div>
                  )}
                </fieldset>

                <button 
                  type="submit" 
                  className="btn-realworld btn-primary w-full"
                  disabled={loading}
                  style={{
                    width: '100%',
                    fontSize: '1.25rem',
                    padding: '0.75rem'
                  }}
                >
                  {loading ? 'Creating account...' : 'Sign up'}
                </button>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;