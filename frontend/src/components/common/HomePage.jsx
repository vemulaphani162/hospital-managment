import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';

const HomePage = () => {
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyData, setEmergencyData] = useState({
    phone: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      const parsedUser = JSON.parse(user);
      const rolePath = {
        admin: '/admin',
        doctor: '/doctor',
        patient: '/patient',
        lab: '/lab',
        pharmacy: '/pharmacy'
      }[parsedUser.role];

      if (rolePath) window.location.href = rolePath;
    }
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setEmergencyData(prev => ({
        ...prev,
        location: 'Geolocation not supported'
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const locationUrl = `https://www.google.com/maps?q=${lat},${lng}`;

        setEmergencyData(prev => ({
          ...prev,
          location: `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)} | ${locationUrl}`
        }));
      },
      () => {
        setEmergencyData(prev => ({
          ...prev,
          location: 'Location access denied'
        }));
      }
    );
  };

  const handleEmergencySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('emergency_requests')
        .insert({
          phone: emergencyData.phone || 'Not provided',
          location: emergencyData.location || 'No GPS data'
        });

      if (error) throw error;

      alert('Emergency request submitted successfully');

      setShowEmergencyModal(false);
      setEmergencyData({ phone: '', location: '' });
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-50 font-sans">
        
        {/* Subtle Medical Grid Background - Light */}
        <div className="fixed inset-0 pointer-events-none opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(37, 99, 235, 0.1) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Floating Medical Icons - Light Theme */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 opacity-5 animate-float-slow">
            <svg className="w-32 h-32 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          </div>
          <div className="absolute bottom-20 right-10 opacity-5 animate-float-slower">
            <svg className="w-40 h-40 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4-3h2v13h-2z"/>
            </svg>
          </div>
        </div>

        {/* Emergency Button - Bottom Right - Light Theme */}
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => {
              setShowEmergencyModal(true);
              getCurrentLocation();
            }}
            className="group relative bg-gradient-to-r from-red-500 to-rose-500 text-white px-5 py-3 rounded-full font-semibold shadow-lg hover:shadow-red-500/30 transition-all duration-300 flex items-center gap-2"
          >
            {/* Subtle Ripple */}
            <span className="absolute inset-0 rounded-full bg-white/20 animate-ripple-subtle"></span>
            
            {/* Heart Icon */}
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            
            <span className="text-sm">Emergency</span>
            
            {/* Ambulance Icon */}
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 8h-2V6h-2v2h-2v2h2v2h2v-2h2v6H4v-6h2v2h2v-2h2V8h2V6h-2V4h-2v2H8v2h2v2H8v2H6v-2H4v2H2v6h20v-6h-2v-2z"/>
            </svg>
          </button>
        </div>

        {/* Hero Section - Light Theme */}
        <div className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          {/* Status Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-white/90 border border-amber-200 rounded-full px-3 py-1.5 shadow-md backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
             
            </div>
          </div>

          {/* Headline */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                SMART HOSPITAL MANAGEMENT
              </span>
              <br />
              <span className="text-amber-900"></span>
            </h1>
            
            

            {/* CTA Buttons - Light Theme */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
              <Link
                to="/register"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium shadow-lg hover:brightness-110 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span>Patient Registration</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
              
              <Link
                to="/login"
                className="px-6 py-3 bg-white text-amber-800 border border-amber-200 rounded-lg font-medium shadow-md hover:bg-amber-50 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Staff Login</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Cards Section - Light Theme */}
        <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-amber-900 mb-2">
              Comprehensive Solutions
            </h2>
            <p className="text-base text-amber-600">
              Everything you need in one platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Patient Portal Card - Light */}
            <Link to="/register" className="group">
              <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg shadow-amber-200/50 border border-amber-100 hover:border-amber-200 transition-all duration-300 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-white">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    <span className="bg-emerald-100 text-emerald-600 text-xs px-2 py-1 rounded-full border border-emerald-200">
                      New Patient?
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-amber-900 mb-2">Patient Portal</h3>
                  <p className="text-sm text-amber-600 mb-4">
                    Access health records, appointments, and more.
                  </p>
                  
                  <div className="flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700">
                    <span>Get Started</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            {/* Staff Portal Card - Light */}
            <Link to="/login" className="group">
              <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg shadow-amber-200/50 border border-amber-100 hover:border-amber-200 transition-all duration-300 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-xs font-medium border border-blue-200">
                      A
                    </div>
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 text-xs font-medium border border-emerald-200">
                      D
                    </div>
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 text-xs font-medium border border-purple-200">
                      L
                    </div>
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 text-xs font-medium border border-amber-200">
                      P
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-amber-900 mb-2">Staff Portal</h3>
                  <p className="text-sm text-amber-600 mb-4">
                    Secure access for all hospital staff.
                  </p>
                  
                  <div className="flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700">
                    <span>Access Dashboard</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

      </div>

      {/* Emergency Modal - Light Theme */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl shadow-amber-200/50 border border-amber-100">
            <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white px-5 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold">Emergency Response</h3>
                    <p className="text-xs text-red-100">Immediate assistance</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowEmergencyModal(false)}
                  className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-all"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleEmergencySubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-amber-700 mb-1 block">
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  placeholder="Enter your number"
                  value={emergencyData.phone}
                  onChange={e => setEmergencyData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900 placeholder-amber-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-amber-700 mb-1 block">
                  Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={emergencyData.location}
                    readOnly
                    placeholder="Click detect location"
                    className="w-full px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900 placeholder-amber-400 pr-20"
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded text-xs font-medium hover:brightness-110 transition-all"
                  >
                    Detect
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white font-medium rounded-lg text-sm hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" />
                    </svg>
                    <span>Request Assistance</span>
                  </>
                )}
              </button>

              <p className="text-xs text-amber-500 text-center">
                By submitting, you share your location with emergency services
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes float-slower {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(20px); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        
        .animate-float-slower {
          animation: float-slower 12s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-ripple-subtle {
          animation: ripple-subtle 2s linear infinite;
        }
        
        @keyframes ripple-subtle {
          0% { transform: scale(1); opacity: 0.3; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </>
  );
};

export default HomePage;
