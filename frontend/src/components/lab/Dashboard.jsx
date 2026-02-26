import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Link } from 'react-router-dom';

const LabDashboard = () => {
  const [labRequests, setLabRequests] = useState([]);
  const [labInfo, setLabInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, completed: 0 });
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    initLabUser();
    
    const channel = supabase.channel('lab_requests');
    channel
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'lab_requests' },
        (payload) => {
          console.log('New lab request:', payload);
          if (labInfo?.name) {
            fetchLabRequests(labInfo.name);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [labInfo?.name]);

  const initLabUser = async () => {
    try {
      console.log('User from localStorage:', user);
      
      if (!user.name) {
        alert('No lab session found. Please login again.');
        setLoading(false);
        return;
      }

      const { data: lab, error: labError } = await supabase
        .from('labs')
        .select('id, name, available_tests')
        .eq('name', user.name)
        .single();
      
      if (labError || !lab) {
        console.error('Lab not found:', labError);
        alert(`Lab "${user.name}" not found. Please check your credentials.`);
        setLoading(false);
        return;
      }

      console.log('Lab found:', lab.id, lab.name);
      
      setLabInfo({
        id: lab.id,
        name: lab.name,
        labs: lab,
        lab_id: lab.id
      });
      
      fetchLabRequests(lab.name);
      setLoading(false);
      
    } catch (error) {
      console.error('Lab init error:', error);
      alert('Failed to initialize lab session. Please try again.');
      setLoading(false);
    }
  };

  const fetchLabRequests = async (labName) => {
    try {
      console.log('Fetching lab requests for:', labName);
      
      const { data: requests, error: reqError } = await supabase
        .from('lab_requests')
        .select(`
          id, patient_queue_id, patient_id, doctor_id, lab_name, 
          tests_ordered, status, created_at, completed_at
        `)
        .eq('lab_name', labName)
        .in('status', ['pending', 'in_progress', 'completed'])
        .order('created_at', { ascending: false });
      
      if (reqError) {
        console.error('Requests error:', reqError);
        return;
      }

      const patientIds = requests?.map(r => r.patient_id).filter(Boolean) || [];
      const { data: patients } = await supabase
        .from('patients')
        .select('id, name, phone, age')
        .in('id', patientIds);

      const doctorIds = requests?.map(r => r.doctor_id).filter(Boolean) || [];
      const { data: doctors } = await supabase
        .from('doctors')
        .select('id, name')
        .in('id', doctorIds);

      const queueIds = requests?.map(r => r.patient_queue_id).filter(Boolean) || [];
      const { data: queues } = await supabase
        .from('patient_queue')
        .select('id, position, status, slot_type')
        .in('id', queueIds);

      const enrichedRequests = requests?.map(request => ({
        ...request,
        patients: patients?.find(p => p.id === request.patient_id),
        doctors: doctors?.find(d => d.id === request.doctor_id),
        patient_queue: queues?.find(q => q.id === request.patient_queue_id)
      })) || [];

      console.log('Enriched requests:', enrichedRequests.length);
      
      setLabRequests(enrichedRequests);
      setStats({
        pending: enrichedRequests.filter(r => r.status === 'pending').length,
        completed: enrichedRequests.filter(r => r.status === 'completed').length
      });
      
    } catch (error) {
      console.error('Fetch requests error:', error);
    }
  };

  const updateLabStatus = async (requestId, newStatus) => {
    try {
      const { error } = await supabase
        .from('lab_requests')
        .update({ 
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', requestId);
      
      if (!error) {
        if (newStatus === 'completed') {
          const request = labRequests.find(r => r.id === requestId);
          if (request?.patient_queue_id) {
            await supabase
              .from('patient_queue')
              .update({ status: 'waiting' })
              .eq('id', request.patient_queue_id);
          }
        }
        
        fetchLabRequests(labInfo.name);
        alert(`Status updated to ${newStatus.toUpperCase()}`);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200',
          dot: 'bg-amber-500'
        };
      case 'in_progress':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          dot: 'bg-blue-500'
        };
      case 'completed':
        return {
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          dot: 'bg-emerald-500'
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          border: 'border-gray-200',
          dot: 'bg-gray-500'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-indigo-600 rounded-full opacity-20 animate-pulse"></div>
            </div>
          </div>
          <p className="text-lg font-medium text-gray-700">Loading dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  if (!labInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Session Expired</h1>
            <p className="text-gray-600 mb-8">Please log in again to continue with your work.</p>
            <Link 
              to="/" 
              className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-8">
              <Link 
                to="/" 
                className="inline-flex items-center text-sm text-gray-600 hover:text-indigo-600 transition-colors group"
              >
                <svg className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </Link>
              <div className="h-8 w-px bg-gray-200"></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Lab Dashboard</h1>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                  <p className="text-sm text-gray-600">{labInfo.name}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm hover:shadow"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-light text-gray-900">{stats.pending}</p>
                <p className="text-sm text-gray-600 mt-1">Pending tests</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-light text-gray-900">{stats.completed}</p>
                <p className="text-sm text-gray-600 mt-1">Completed tests</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-light text-gray-900">{labInfo.labs?.available_tests?.length || 0}</p>
                <p className="text-sm text-gray-600 mt-1">Available tests</p>
              </div>
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Lab Requests Grid */}
        {labRequests.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Current Lab Requests</h2>
              <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                {labRequests.length} total
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {labRequests.map((request) => {
                const statusColors = getStatusColor(request.status);
                return (
                  <div
                    key={request.id}
                    className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Card Header */}
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl flex items-center justify-center">
                              <span className="text-indigo-700 font-medium text-sm">
                                #{request.patient_queue?.position || '••'}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {request.patients?.name || 'Unknown Patient'}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Dr. {request.doctors?.name || 'Unknown'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusColors.dot} mr-1.5`}></span>
                          {request.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-xs text-gray-400">
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Ordered: {formatDate(request.created_at)}
                      </div>
                    </div>

                    {/* Tests List */}
                    <div className="p-6 bg-gray-50/50">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Ordered Tests ({request.tests_ordered?.length || 0})
                      </p>
                      <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                        {request.tests_ordered && request.tests_ordered.length > 0 ? (
                          request.tests_ordered.map((test, index) => (
                            <div key={index} className="flex items-center justify-between py-1.5 px-3 bg-white rounded-lg border border-gray-100">
                              <span className="text-sm text-gray-900">{test}</span>
                              {labInfo.labs?.available_tests?.includes(test) && (
                                <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                                  Available
                                </span>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-400 italic text-center py-4">No tests specified</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-6 bg-white border-t border-gray-100">
                      {request.status === 'pending' && (
                        <button
                          onClick={() => updateLabStatus(request.id, 'in_progress')}
                          className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-medium rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-sm hover:shadow-md mb-3"
                        >
                          Start Processing
                        </button>
                      )}
                      {(request.status === 'pending' || request.status === 'in_progress') && (
                        <button
                          onClick={() => updateLabStatus(request.id, 'completed')}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                        >
                          Mark as Completed
                        </button>
                      )}
                      {request.status === 'completed' && (
                        <div className="text-center py-2">
                          <div className="inline-flex items-center px-4 py-2 bg-emerald-50 rounded-xl">
                            <svg className="w-4 h-4 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <p className="text-sm text-emerald-700">
                              Completed {request.completed_at && formatDate(request.completed_at)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // Empty State
          <div className="text-center py-24">
            <div className="relative">
              <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-3xl flex items-center justify-center">
                <svg className="w-16 h-16 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-400 rounded-full flex items-center justify-center text-white text-sm font-bold animate-pulse">
                ✓
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">No pending tests at the moment. New lab requests will appear here automatically.</p>
            <button 
              onClick={() => fetchLabRequests(labInfo.name)}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        )}
      </main>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
      `}</style>
    </div>
  );
};

export default LabDashboard;