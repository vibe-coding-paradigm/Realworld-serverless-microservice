import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/routes';
import { ErrorMessage } from '@/components/ui/error';

const LoginPage: React.FC = () => {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
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

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
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
      await login(formData);
      navigate('/');
    } catch (error) {
      console.error('🔴 [DEBUG] Login failed:', error);
      // Error is handled by AuthContext
    }
  };

  return (
    <div className="auth-page">
      <div className="realworld-container" style={{ padding: '2rem 15px' }}>
        <div className="flex justify-center">
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-medium mb-2">Sign in</h1>
              <Link to={ROUTES.REGISTER} className="text-green-500 hover:underline">
                Need an account?
              </Link>
            </div>

            {error && (
              <ul className="error-messages mb-4">
                <li><ErrorMessage message={error} /></li>
              </ul>
            )}

            <form onSubmit={handleSubmit}>
              <fieldset style={{ border: 'none', padding: '0', margin: '0' }}>
                <div className="mb-4">
                  <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`form-control ${formErrors.email ? 'border-red-500' : ''}`}
                    disabled={loading}
                  />
                  {formErrors.email && (
                    <div className="text-red-500 text-sm mt-2">
                      <ErrorMessage message={formErrors.email} />
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <input
                    name="password"
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`form-control ${formErrors.password ? 'border-red-500' : ''}`}
                    disabled={loading}
                  />
                  {formErrors.password && (
                    <div className="text-red-500 text-sm mt-2">
                      <ErrorMessage message={formErrors.password} />
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="btn-realworld btn-primary w-full text-xl py-3"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;