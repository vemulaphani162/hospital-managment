import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';

const Register = () => {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    phone: '',
    age: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('patients')
        .insert([{
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          phone: formData.phone.trim() || null,
          age: parseInt(formData.age) || null,
          password: formData.password
        }])
        .select();

      if (error) throw error;

      localStorage.setItem('token', 'patient-token');
      localStorage.setItem(
        'user',
        JSON.stringify({ role: 'patient', ...data[0] })
      );
      
      // Success notification - Light theme
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-lg shadow-xl z-50 animate-slide-in border border-emerald-200';
      successMessage.innerHTML = `
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <span>Welcome, ${formData.name}! Your account has been created.</span>
        </div>
      `;
      document.body.appendChild(successMessage);
      setTimeout(() => successMessage.remove(), 4000);
      
      navigate('/patient');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator - Light theme
  const getPasswordStrength = () => {
    if (!formData.password) return null;
    const strength = {
      score: 0,
      text: '',
      color: ''
    };
    
    if (formData.password.length >= 8) strength.score++;
    if (/[A-Z]/.test(formData.password)) strength.score++;
    if (/[0-9]/.test(formData.password)) strength.score++;
    if (/[^A-Za-z0-9]/.test(formData.password)) strength.score++;
    
    switch(strength.score) {
      case 0:
      case 1:
        strength.text = 'Weak';
        strength.color = 'bg-red-500';
        break;
      case 2:
        strength.text = 'Fair';
        strength.color = 'bg-yellow-500';
        break;
      case 3:
        strength.text = 'Good';
        strength.color = 'bg-blue-500';
        break;
      case 4:
        strength.text = 'Strong';
        strength.color = 'bg-green-500';
        break;
    }
    
    return strength;
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-amber-50 via-white to-amber-50 font-sans">
      
      {/* Light Theme Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slower"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(16, 185, 129, 0.05) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="max-w-md w-full relative">
        {/* Logo/Brand Section - Light Theme */}
        <div className="text-center mb-6">
          <div className="relative inline-flex">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
            <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-xl mb-4 border border-white">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            {/* Vibrant Plus Symbol */}
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg border border-amber-200">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-amber-900 mb-1">Patient Registration</h1>
          <p className="text-amber-600">Create your account to access healthcare services</p>
        </div>

        {/* Main Card - Light Theme */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-amber-200/50 border border-amber-100 overflow-hidden">
          
          {/* Header - Light Theme */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
            <div className="flex items-center justify-between relative">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" />
                  </svg>
                  New Patient
                </h2>
                <p className="text-white/80 text-sm mt-1">Fill in your details to register</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-medium border border-white/30">
                Step 1 of 1
              </div>
            </div>
          </div>

          {error && (
            <div className="mx-6 mt-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="p-6 space-y-5">
            {/* Full Name - Light Theme */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-amber-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 group-focus-within:text-emerald-500 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-amber-50/50 border border-amber-200 rounded-lg focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all outline-none text-amber-900 placeholder-amber-400"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email - Light Theme */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-amber-700">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 group-focus-within:text-emerald-500 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-amber-50/50 border border-amber-200 rounded-lg focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all outline-none text-amber-900 placeholder-amber-400"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Phone and Age - Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Phone - Light Theme */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-amber-700">
                  Phone
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 group-focus-within:text-emerald-500 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-amber-50/50 border border-amber-200 rounded-lg focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all outline-none text-amber-900 placeholder-amber-400"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Age - Light Theme */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-amber-700">
                  Age
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 group-focus-within:text-emerald-500 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="number"
                    placeholder="25"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-amber-50/50 border border-amber-200 rounded-lg focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all outline-none text-amber-900 placeholder-amber-400"
                    min="1"
                    max="120"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Password - Light Theme */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-amber-700">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 group-focus-within:text-emerald-500 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 bg-amber-50/50 border border-amber-200 rounded-lg focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all outline-none text-amber-900 placeholder-amber-400"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 hover:text-emerald-500 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3c-1.478 0-2.87.367-4.106 1.012L3.707 2.293zM10 5.5a4.5 4.5 0 014.472 5.025l-6.597-6.597A4.5 4.5 0 0110 5.5zm6.5 4.5c0 1.132-.282 2.2-.78 3.14l-1.618-1.618A2.5 2.5 0 0014.5 10a2.5 2.5 0 00-.398-1.36l1.618-1.618A6.5 6.5 0 0116.5 10zm-10.5 0a2.5 2.5 0 01.398-1.36L4.68 7.022A6.5 6.5 0 003.5 10a6.5 6.5 0 001.18 2.978l1.618-1.618A2.5 2.5 0 016 10z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password Strength Indicator - Light Theme */}
              {formData.password && passwordStrength && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-1 flex-1">
                      <div className={`h-1 flex-1 rounded-full ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-amber-200'}`}></div>
                      <div className={`h-1 flex-1 rounded-full ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-amber-200'}`}></div>
                      <div className={`h-1 flex-1 rounded-full ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-amber-200'}`}></div>
                      <div className={`h-1 flex-1 rounded-full ${passwordStrength.score >= 4 ? passwordStrength.color : 'bg-amber-200'}`}></div>
                    </div>
                    <span className={`text-xs font-medium ml-2 ${
                      passwordStrength.score <= 1 ? 'text-red-500' :
                      passwordStrength.score === 2 ? 'text-yellow-600' :
                      passwordStrength.score === 3 ? 'text-blue-600' :
                      'text-green-600'
                    }`}>
                      {passwordStrength.text}
                    </span>
                  </div>
                  <p className="text-xs text-amber-500">
                    Use at least 8 characters with uppercase, numbers & symbols
                  </p>
                </div>
              )}
            </div>

            {/* Terms and Conditions - Light Theme */}
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="terms"
                className="mt-1 rounded bg-amber-50 border-amber-300 text-emerald-600 focus:ring-emerald-500/30 focus:ring-offset-0"
                required
              />
              <label htmlFor="terms" className="text-xs text-amber-600">
                I agree to the{' '}
                <a href="#" className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Submit Button - Light Theme Vibrant */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-300 flex items-center justify-center space-x-2 relative overflow-hidden group ${
                loading
                  ? 'bg-amber-300 cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg hover:shadow-emerald-500/20 transform hover:-translate-y-0.5'
              }`}
            >
              {/* Shine effect */}
              <span className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
              
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Patient Account</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Footer Links - Light Theme */}
          <div className="px-6 pb-6">
            <div className="text-center space-y-3">
              <p className="text-sm text-amber-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline transition-colors"
                >
                  Sign in here
                </Link>
              </p>
              <Link
                to="/"
                className="inline-flex items-center text-sm text-amber-500 hover:text-emerald-600 transition-colors group"
              >
                <svg className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Home
              </Link>
            </div>
          </div>
        </div>

        {/* Footer - Light Theme */}
        <div className="text-center mt-6">
          <p className="text-xs text-amber-400">
            © 2024 MediCare Plus. All rights reserved.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        
        @keyframes pulse-slower {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.2); }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }
        
        .animate-pulse-slower {
          animation: pulse-slower 8s ease-in-out infinite;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </div>
  );
};

export default Register;