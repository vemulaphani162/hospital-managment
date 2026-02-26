import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabase';

const PatientQueue = () => {
  const [queue, setQueue] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState(null);
  const [now, setNow] = useState(Date.now());
  
  // LAB MODAL STATES
  const [showLabModal, setShowLabModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedTests, setSelectedTests] = useState({});
  const [selectedLabName, setSelectedLabName] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // INIT DOCTOR + FETCH LABS
  useEffect(() => {
    const initDoctor = async () => {
      const { data: doctor } = await supabase
        .from('doctors')
        .select('id')
        .eq('email', user.email)
        .single();
      setDoctorId(doctor?.id);
      setLoading(false);
    };
    initDoctor();
    fetchLabs();
  }, []);

  // FETCH ALL LABS
  const fetchLabs = async () => {
    const { data } = await supabase.from('labs').select('*');
    setLabs(data || []);
  };

  // LIVE QUEUE
  const fetchQueue = async () => {
    if (!doctorId) return;
    const { data } = await supabase
      .from('patient_queue')
      .select('*, patients(name, email, phone)')
      .eq('doctor_id', doctorId)
      .in('status', [
        'waiting',
        'called',
        'emergency',
        'lab_pending',
        'completed_15min',
        'delayed_emergency'
      ])
      .order('position');
    setQueue(data || []);
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(() => {
      setNow(Date.now());
      fetchQueue();
    }, 1000);
    return () => clearInterval(interval);
  }, [doctorId, now]);

  // OPEN LAB MODAL
  const openLabModal = (patient) => {
    setSelectedPatient(patient);
    setSelectedTests({});
    setSelectedLabName('');
    setShowLabModal(true);
  };

  // SELECT LAB
  const selectLab = (labName) => {
    setSelectedLabName(labName === selectedLabName ? '' : labName);
  };

  // LAB REQUEST
  const submitLabRequest = async () => {
    const allSelectedTests = [];

    Object.keys(selectedTests).forEach(labId => {
      selectedTests[labId]?.forEach(test => allSelectedTests.push(test));
    });

    if (!selectedLabName) {
      alert('⚠️ Please select a lab first');
      return;
    }

    if (allSelectedTests.length === 0) {
      alert('⚠️ Select at least one test');
      return;
    }

    await supabase
      .from('patient_queue')
      .update({ status: 'lab_pending' })
      .eq('id', selectedPatient.id);

    await supabase.from('lab_requests').insert([{
      patient_queue_id: selectedPatient.id,
      patient_id: selectedPatient.patient_id,
      doctor_id: doctorId,
      lab_name: selectedLabName,
      tests_ordered: allSelectedTests,
      status: 'pending'
    }]);

    alert(`✅ ${allSelectedTests.length} tests sent to ${selectedLabName}`);
    setShowLabModal(false);
    fetchQueue();
  };

  // TOGGLE TEST
  const toggleTest = (labId, test) => {
    setSelectedTests(prev => {
      const labTests = prev[labId] || [];
      const newLabTests = labTests.includes(test)
        ? labTests.filter(t => t !== test)
        : [...labTests, test];
      
      return { ...prev, [labId]: newLabTests };
    });
  };

  // COMPLETE PATIENT
  const completePatient = async (queueId) => {
    if (confirm('Mark patient as completed?')) {
      await supabase.from('patient_queue').update({ 
        status: 'completed' 
      }).eq('id', queueId);
      fetchQueue();
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      waiting: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      called: 'bg-green-500/20 text-green-400 border-green-500/30',
      emergency: 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse',
      lab_pending: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      completed_15min: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      delayed_emergency: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    };
    return colors[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-xl text-slate-400">Loading Patient Queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8 font-sans">
      
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(139, 92, 246, 0.3) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="max-w-7xl mx-auto relative">
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/50 border border-slate-800 p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl blur-lg opacity-50 animate-pulse"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white">Patient Queue</h1>
                  <p className="text-purple-400 mt-1 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                    Live • {labs.length} labs available
                  </p>
                </div>
              </div>
              
              <Link
                to="/doctor"
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all border border-slate-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Queue Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/70 backdrop-blur-xl rounded-xl border border-slate-800 p-4">
            <p className="text-sm text-slate-500 mb-1">Total in Queue</p>
            <p className="text-3xl font-bold text-white">{queue.length}</p>
          </div>
          <div className="bg-slate-900/70 backdrop-blur-xl rounded-xl border border-slate-800 p-4">
            <p className="text-sm text-slate-500 mb-1">Waiting</p>
            <p className="text-3xl font-bold text-blue-400">{queue.filter(q => q.status === 'waiting').length}</p>
          </div>
          <div className="bg-slate-900/70 backdrop-blur-xl rounded-xl border border-slate-800 p-4">
            <p className="text-sm text-slate-500 mb-1">Lab Pending</p>
            <p className="text-3xl font-bold text-purple-400">{queue.filter(q => q.status === 'lab_pending').length}</p>
          </div>
          <div className="bg-slate-900/70 backdrop-blur-xl rounded-xl border border-slate-800 p-4">
            <p className="text-sm text-slate-500 mb-1">Emergency</p>
            <p className="text-3xl font-bold text-red-400">{queue.filter(q => q.status === 'emergency').length}</p>
          </div>
        </div>

        {/* Queue Table */}
        <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/50 border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-b border-slate-800">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">#</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">Patient</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">Position</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {queue.map((patient, index) => (
                  <tr 
                    key={patient.id} 
                    className="hover:bg-slate-800/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                          {patient.patients?.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">ID: {patient.patient_id?.slice(0, 8)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm text-slate-400">{patient.patients?.email}</p>
                        <p className="text-xs text-slate-500">{patient.patients?.phone || 'No phone'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(patient.status)}`}>
                        {patient.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-800 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full"
                            style={{ width: `${((patient.position || index + 1) / queue.length) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-slate-500">#{patient.position || index + 1}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openLabModal(patient)}
                          disabled={patient.status === 'lab_pending' || patient.status === 'completed'}
                          className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500 text-purple-300 hover:text-white rounded-lg text-sm font-medium transition-all border border-purple-500/30 hover:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-purple-500/20 disabled:hover:text-purple-300"
                        >
                          Lab
                        </button>
                        <button
                          onClick={() => completePatient(patient.id)}
                          disabled={patient.status === 'completed' || patient.status === 'lab_pending'}
                          className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white rounded-lg text-sm font-medium transition-all border border-emerald-500/30 hover:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-500/20 disabled:hover:text-emerald-300"
                        >
                          Complete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {queue.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-16 h-16 text-slate-700 mb-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                        <p className="text-xl text-slate-500 mb-2">Queue is empty</p>
                        <p className="text-sm text-slate-600">No patients currently in queue</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Lab Selection Modal - Dark Theme */}
      {showLabModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl shadow-black/50 border border-slate-800 max-w-4xl w-full max-h-[90vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 px-6 py-4 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4-3h2v13h-2z"/>
                    </svg>
                    Lab Tests: {selectedPatient.patients?.name}
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Queue #{selectedPatient.position || 1} • Select lab and tests
                  </p>
                </div>
                <button 
                  onClick={() => setShowLabModal(false)}
                  className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all"
                >
                  ✕
                </button>
              </div>
              
              {/* Selected Count & Submit */}
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">Selected:</span>
                  <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm font-medium border border-purple-500/30">
                    {Object.values(selectedTests).flat().length} tests
                  </span>
                  {selectedLabName && (
                    <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-sm font-medium border border-emerald-500/30">
                      📍 {selectedLabName}
                    </span>
                  )}
                </div>
                <button
                  onClick={submitLabRequest}
                  disabled={!selectedLabName || Object.values(selectedTests).flat().length === 0}
                  className="ml-auto px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
                >
                  Send to Lab
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
              
              {/* Lab Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-purple-400 rounded-full"></span>
                  Select Laboratory
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {labs.map((lab) => (
                    <button
                      key={lab.id}
                      onClick={() => selectLab(lab.name)}
                      className={`p-3 rounded-lg border transition-all text-left ${
                        selectedLabName === lab.name
                          ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                          : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-purple-500/30 hover:text-slate-300'
                      }`}
                    >
                      <div className="font-medium text-sm">{lab.name}</div>
                      <div className="text-xs opacity-60 mt-1">{lab.available_tests.length} tests</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tests Selection */}
              {selectedLabName && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-emerald-400 rounded-full"></span>
                    Select Tests
                  </h3>
                  <div className="space-y-4">
                    {labs.filter(lab => lab.name === selectedLabName).map((lab) => (
                      <div key={lab.id} className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {lab.available_tests.map((test, index) => (
                            <label
                              key={index}
                              className={`flex items-center p-2 rounded-lg cursor-pointer transition-all ${
                                selectedTests[lab.id]?.includes(test)
                                  ? 'bg-emerald-500/20 border border-emerald-500/30'
                                  : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedTests[lab.id]?.includes(test) || false}
                                onChange={() => toggleTest(lab.id, test)}
                                className="w-4 h-4 text-emerald-500 rounded border-slate-600 bg-slate-700 focus:ring-emerald-500/30 focus:ring-offset-0"
                              />
                              <span className="ml-2 text-sm text-slate-300">{test}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Lab Selected Message */}
              {!selectedLabName && (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-slate-700 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                  <p className="text-slate-400">Please select a lab to view available tests</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default PatientQueue;