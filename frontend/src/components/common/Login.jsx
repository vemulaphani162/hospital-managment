import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '', role: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [labNames, setLabNames] = useState([]); 
  const [fetchingLabs, setFetchingLabs] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLabNames = async () => {
      try {
        const { data, error } = await supabase
          .from('labs')
          .select('name')
          .order('name', { ascending: true });
        
        if (error) throw error;
        setLabNames(data || []);
      } catch (error) {
        console.error('Error fetching labs:', error);
        setLabNames([]); 
      } finally {
        setFetchingLabs(false);
      }
    };

    fetchLabNames();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let userData = null;

      if (formData.role === 'admin' && formData.username === 'admin@hospital.com' && formData.password === 'admin123') {
        userData = { role: 'admin', name: 'Hospital Admin', email: 'admin@hospital.com', id: 'admin-001' };
      } else if (formData.role === 'doctor') {
        const { data } = await supabase
          .from('doctors')
          .select('*')
          .eq('email', formData.username.toLowerCase().trim())
          .eq('password', formData.password)
          .single();
        if (data) userData = { role: 'doctor', ...data };
      } else if (formData.role === 'assistant') {
        const { data } = await supabase
          .from('assistant_doctor')
          .select('*')
          .eq('email', formData.username.toLowerCase().trim())
          .eq('password', formData.password)
          .single();
        if (data) userData = { role: 'assistant', ...data, full_name: data.full_name || data.name };
      } 
      // ✅ FIXED: Lab login - STATIC PASSWORD "lab123" ONLY
      else if (formData.role === 'lab') {
        // Check if lab name exists in database
        const { data: labData, error: labError } = await supabase
          .from('labs')
          .select('*')
          .eq('name', formData.username.trim())
          .single();
        
        // ✅ lab123 password ONLY - No database password check
        if (labData && !labError && formData.password === 'lab123') {
          userData = { 
            role: 'lab', 
            name: labData.name,
            username: labData.name,
            email: `${labData.name.toLowerCase().replace(/\s+/g, '')}@lab.com`,
            id: labData.id,
            lab_id: labData.id
          };
        } else if (formData.password !== 'lab123') {
          throw new Error('❌ Lab password must be "lab123" only!');
        } else {
          throw new Error(`❌ Lab "${formData.username}" not found!`);
        }
      } 
      else if (formData.role === 'pharmacy' && formData.username === 'pharmacy@hospital.com' && formData.password === 'pharma123') {
        userData = { role: 'pharmacy', name: 'Pharmacy Tech', email: 'pharmacy@hospital.com', id: 'pharma-001' };
      } else if (formData.role === 'patient') {
        const { data } = await supabase
          .from('patients')
          .select('*')
          .eq('email', formData.username.toLowerCase().trim())
          .eq('password', formData.password)
          .single();
        if (data) userData = { role: 'patient', ...data };
      } else if (formData.role === 'ambulance') {
        const demoDrivers = [
          { username: 'driver1@hospital.com', password: 'driver123', name: 'Ravi Kumar', vehicle: 'Ambulance A1', id: 'driver-001' },
          { username: 'driver2@hospital.com', password: 'driver123', name: 'Priya Sharma', vehicle: 'Ambulance A2', id: 'driver-002' },
          { username: 'driver3@hospital.com', password: 'driver123', name: 'Amit Patel', vehicle: 'Ambulance A3', id: 'driver-003' }
        ];
        const validDriver = demoDrivers.find(
          driver => driver.username === formData.username && driver.password === formData.password
        );
        if (validDriver) userData = { role: 'ambulance', ...validDriver };
      }

      if (!userData) throw new Error('Invalid credentials for selected role');

      localStorage.setItem('token', `${formData.role}-token-${Date.now()}`);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Success notification
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg shadow-2xl z-50 animate-slide-in border border-green-400/30';
      successMessage.textContent = `✅ Welcome, ${userData.name}!`;
      document.body.appendChild(successMessage);
      setTimeout(() => successMessage.remove(), 3000);
      
      const routes = {
        admin: '/admin',
        doctor: '/doctor',
        assistant: '/assistant-dashboard',
        lab: '/lab',
        pharmacy: '/pharmacy',
        patient: '/patient',
        ambulance: '/ambulance'
      };
      navigate(routes[userData.role], { replace: true });

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Role-based styling - Light theme soft pastel colors
  const getRoleColor = (role) => {
    const colors = {
      admin: 'from-blue-400 to-blue-500',
      doctor: 'from-green-400 to-green-500',
      assistant: 'from-teal-400 to-teal-500',
      lab: 'from-purple-400 to-purple-500',
      pharmacy: 'from-orange-400 to-orange-500',
      patient: 'from-indigo-400 to-indigo-500',
      ambulance: 'from-red-400 to-red-500'
    };
    return colors[role] || 'from-gray-400 to-gray-500';
  };

  // Role text labels (no emojis)
  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Admin',
      doctor: 'Doctor',
      assistant: 'Asst.',
      lab: 'Lab',
      pharmacy: 'Pharma',
      patient: 'Patient',
      ambulance: 'EMS'
    };
    return labels[role] || role;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-50 via-white to-gray-50 font-sans">
      
      {/* Light Theme Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/40 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/40 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slower"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.08) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="max-w-md w-full relative">
        {/* Logo/Brand Section - Light Theme */}
        <div className="text-center mb-8">
          <div className="relative inline-flex">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
            <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl shadow-xl mb-4 border border-white/50">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
            </div>
            {/* Clean Plus Symbol */}
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30 border border-amber-300/50">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">SMART APPOINTMENT MANAGMENT</h1>
          <p className="text-gray-500">Secure Hospital Management System</p>
        </div>

        {/* Main Card - Light Theme */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-gray-300/50 border border-white/80 overflow-hidden">
          {/* Header with Role Indicator - Light */}
          <div className={`bg-gradient-to-r ${formData.role ? getRoleColor(formData.role) : 'from-gray-200 to-gray-300'} px-6 py-4 transition-all duration-300 relative overflow-hidden`}>
            {/* Animated background effect */}
            <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
            
            <div className="flex items-center justify-between relative">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Secure Login
                </h2>
                <p className="text-white/80 text-sm mt-1">
                  {formData.role ? `${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} Access` : 'Select your role to continue'}
                </p>
              </div>
              {formData.role && (
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-medium border border-white/30">
                  {formData.role}
                </div>
              )}
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

          <form onSubmit={handleLogin} className="p-6 space-y-6">
            {/* Role Selection - Light Theme */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Select Role <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['admin', 'doctor', 'assistant', 'lab', 'pharmacy', 'patient', 'ambulance'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setFormData({ ...formData, role, username: '', password: '' })}
                    className={`relative px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-300 overflow-hidden group ${
                      formData.role === role
                        ? `bg-gradient-to-r ${getRoleColor(role)} text-white shadow-lg shadow-${role}-400/30 border border-white/50`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Hover effect */}
                    <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                    <span className="relative">
                      {getRoleLabel(role)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* LAB SECTION - Light Theme */}
            {formData.role === 'lab' && (
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-200 animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4-3h2v13h-2z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-700">Laboratory Access</h3>
                    <p className="text-xs text-purple-600/80">Use exact lab name from list</p>
                  </div>
                </div>
                
                {fetchingLabs ? (
                  <div className="flex items-center justify-center py-4 bg-white rounded-lg border border-purple-200">
                    <div className="w-5 h-5 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin mr-2"></div>
                    <span className="text-sm text-purple-600">Loading labs...</span>
                  </div>
                ) : labNames.length === 0 ? (
                  <div className="text-center py-4 bg-white rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-600">No labs found in database</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-white rounded-lg p-3 mb-3 border border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-purple-700">Default Password:</span>
                        <code className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-sm font-mono border border-purple-300">
                          lab123
                        </code>
                      </div>
                      <div className="max-h-32 overflow-y-auto custom-scrollbar-light">
                        {labNames.map((lab, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setFormData({ ...formData, username: lab.name })}
                            className={`w-full text-left px-3 py-2 rounded-lg mb-1 text-sm transition-all duration-300 ${
                              formData.username === lab.name
                                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md'
                                : 'hover:bg-purple-50 text-gray-700 hover:text-purple-700'
                            }`}
                          >
                            <span className="font-medium">{lab.name}</span>
                            {formData.username === lab.name && (
                              <span className="float-right text-white/90">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-purple-600/80 text-center">
                      {labNames.length} lab{labNames.length !== 1 ? 's' : ''} available
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Admin Quick Credentials - Light Theme */}
            {formData.role === 'admin' && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 animate-fade-in">
                
              </div>
            )}

            {/* Username/Email Field - Light Theme */}
            {formData.role && formData.role !== 'lab' && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  {formData.role === 'ambulance' ? 'Driver Email' : 
                   formData.role === 'doctor' ? 'Doctor Email' :
                   formData.role === 'assistant' ? 'Assistant Email' :
                   formData.role === 'patient' ? 'Patient Email' :
                   formData.role === 'pharmacy' ? 'Pharmacy Email' :
                   'Username / Email'}
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder={
                      formData.role === 'ambulance' ? 'driver1@hospital.com' :
                      formData.role === 'assistant' ? 'assistant@hospital.com' :
                      formData.role === 'doctor' ? 'doctor@hospital.com' :
                      formData.role === 'patient' ? 'patient@email.com' :
                      formData.role === 'pharmacy' ? 'pharmacy@hospital.com' :
                      'Enter your username'
                    }
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all outline-none text-gray-700 placeholder-gray-400"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Password Field - Light Theme */}
            {formData.role && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Password</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={
                      formData.role === 'lab' ? 'lab123' :
                      formData.role === 'ambulance' ? 'driver123' :
                      formData.role === 'admin' ? 'admin123' :
                      formData.role === 'pharmacy' ? 'pharma123' :
                      'Enter password'
                    }
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all outline-none text-gray-700 placeholder-gray-400"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
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
                {formData.role === 'lab' && (
                  <p className="text-xs text-purple-600 mt-1">
                    <span className="font-medium">Note:</span> Password is always "lab123"
                  </p>
                )}
              </div>
            )}

            {/* Submit Button - Light Theme */}
            {formData.role && (
              <button
                type="submit"
                disabled={loading || !formData.username || !formData.password}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-300 flex items-center justify-center space-x-2 relative overflow-hidden group ${
                  loading || !formData.username || !formData.password
                    ? 'bg-gray-300 cursor-not-allowed opacity-50 text-gray-600'
                    : `bg-gradient-to-r ${getRoleColor(formData.role)} hover:shadow-lg hover:shadow-${formData.role}-400/30 transform hover:-translate-y-0.5`
                }`}
              >
                {/* Shine effect */}
                <span className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
                
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </>
                )}
              </button>
            )}

            {/* Additional Info */}
            {!formData.role && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">Select a role above to continue</p>
              </div>
            )}
          </form>
        </div>

        {/* Footer Links - Light */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            © 2024 MediCare Plus. All rights reserved.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
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
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        
        @keyframes pulse-slower {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
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
        
        .custom-scrollbar-light::-webkit-scrollbar {
          width: 4px;
        }
        
        .custom-scrollbar-light::-webkit-scrollbar-track {
          background: rgba(243, 244, 246, 0.8);
          border-radius: 4px;
        }
        
        .custom-scrollbar-light::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.4);
          border-radius: 4px;
        }
        
        .custom-scrollbar-light::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.6);
        }
      `}</style>
    </div>
  );
};

export default Login;