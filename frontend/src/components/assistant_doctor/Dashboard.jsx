import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';

const AssistantDoctorDashboard = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const navigate = useNavigate();

  const assistant = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!assistant.role || assistant.role !== 'assistant') {
      alert('Access denied. Assistant Doctor login required.');
      navigate('/login', { replace: true });
      return;
    }
    
    fetchDoctors();
  }, [navigate]);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      alert('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorClick = (doctor) => {
    setSelectedDoctor(doctor);
    setShowAssignmentModal(true);
  };

  const handleAssignmentComplete = async () => {
    if (!patientName.trim() || !roomNo.trim()) {
      alert('Please enter patient name and room number');
      return;
    }

    try {
      const { error } = await supabase
        .from('doctors_assignments')
        .insert([{
          doctor_id: selectedDoctor.id,
          patient_name: patientName.trim(),
          room_no: roomNo.trim(),
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // Success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-lg shadow-xl z-50 animate-slide-in border border-emerald-200';
      notification.innerHTML = `
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <span>Patient assigned to Dr. ${selectedDoctor.name}</span>
        </div>
      `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 4000);
      
      setPatientName('');
      setRoomNo('');
      setShowAssignmentModal(false);
      setSelectedDoctor(null);
      fetchDoctors();
    } catch (error) {
      console.error('Assignment error:', error);
      alert('Failed to save assignment');
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 via-white to-amber-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-xl text-amber-600 mb-2">Loading Assistant Dashboard...</p>
          <p className="text-sm text-amber-400">{assistant.full_name || assistant.name || 'Assistant'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-50 p-4 md:p-8 font-sans">
      
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.1) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="max-w-7xl mx-auto relative">
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-amber-200/50 border border-amber-100 p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-xl blur-lg opacity-30 animate-pulse"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 14H4V6h16v12zM9 8h2v2H9V8zm4 0h2v2h-2V8zm-4 4h2v2H9v-2zm4 0h2v2h-2v-2z"/>
                    </svg>
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-amber-900">
                    {assistant.full_name || assistant.name || 'Assistant Doctor'}
                  </h1>
                  <p className="text-indigo-600 mt-1 flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
                    Assistant Doctor • {doctors.length} Doctors Available
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => navigate('/')}
                  className="px-6 py-3 bg-white hover:bg-amber-50 text-amber-700 rounded-xl font-medium transition-all border border-amber-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  Home
                </button>
                <button 
                  onClick={logout}
                  className="px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-medium transition-all border border-red-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Doctors Grid */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-amber-200/50 border border-amber-100 overflow-hidden">
          
          {/* Grid Header */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-amber-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356.257l-2.212 2.213a1 1 0 000 1.414l3 3a1 1 0 001.414 0l2.213-2.212c.074.074.162.135.257.356l2.131 5.644a1 1 0 001.84-.788l-3-7a.998.998 0 00-.356-.356L14.5 6.394a1 1 0 00-.788-1.58l-7-3z" />
                </svg>
                Available Doctors ({doctors.length})
              </h2>
              <button 
                onClick={fetchDoctors} 
                className="px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-600 rounded-lg text-sm font-medium transition-all border border-amber-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {/* Doctors List */}
          <div className="p-6">
            {doctors.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-amber-900 mb-2">No Doctors Available</h3>
                <p className="text-amber-500">Contact Admin to add doctors first</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {doctors.map((doctor) => (
                  <div 
                    key={doctor.id}
                    onClick={() => handleDoctorClick(doctor)}
                    className="group bg-white rounded-xl border border-amber-200 hover:border-indigo-300 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-xl blur-md opacity-0 group-hover:opacity-30 transition-opacity"></div>
                            <div className="relative w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-lg font-bold">
                              {doctor.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'DR'}
                            </div>
                          </div>
                          <div>
                            <h3 className="font-semibold text-amber-900 group-hover:text-indigo-600 transition-colors">
                              {doctor.name || 'Dr. Unknown'}
                            </h3>
                            <p className="text-xs text-amber-500 mt-1">{doctor.specialty || 'General'}</p>
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-600 text-xs rounded-full border border-emerald-200">
                          Available
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center gap-2 text-amber-600">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                          <span className="text-xs">{doctor.email}</span>
                        </div>
                        {doctor.phone && (
                          <div className="flex items-center gap-2 text-amber-600">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                            <span className="text-xs">{doctor.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-amber-200">
                        <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium text-indigo-600">Assign Patient</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Modal - Light Theme */}
      {showAssignmentModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl shadow-amber-200/50 border border-amber-100 max-w-md w-full">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-amber-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                    Assign Patient
                  </h3>
                  <p className="text-sm text-amber-600 mt-1">Dr. {selectedDoctor.name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowAssignmentModal(false);
                    setSelectedDoctor(null);
                    setPatientName('');
                    setRoomNo('');
                  }}
                  className="w-8 h-8 bg-white hover:bg-amber-50 rounded-lg flex items-center justify-center text-amber-400 hover:text-amber-600 transition-all border border-amber-200"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              
              {/* Patient Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-amber-700">
                  Patient Name
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 group-focus-within:text-indigo-500 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter patient name"
                    className="w-full pl-10 pr-4 py-3 bg-amber-50/50 border border-amber-200 rounded-lg text-amber-900 placeholder-amber-400 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Room Number */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-amber-700">
                  Room Number
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 group-focus-within:text-indigo-500 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 4H8.828a2 2 0 00-1.414.586L6.293 5.707A1 1 0 015.586 6H4zm6 3a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1H8a1 1 0 110-2h1V8a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={roomNo}
                    onChange={(e) => setRoomNo(e.target.value)}
                    placeholder="e.g., 301A"
                    className="w-full pl-10 pr-4 py-3 bg-amber-50/50 border border-amber-200 rounded-lg text-amber-900 placeholder-amber-400 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAssignmentComplete}
                  disabled={!patientName.trim() || !roomNo.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign Patient
                </button>
                <button
                  onClick={() => {
                    setShowAssignmentModal(false);
                    setSelectedDoctor(null);
                    setPatientName('');
                    setRoomNo('');
                  }}
                  className="px-6 py-3 bg-white hover:bg-amber-50 text-amber-600 rounded-lg font-medium transition-all border border-amber-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AssistantDoctorDashboard;