import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const patientId = user.id;

  useEffect(() => {
    fetchDoctors();
    fetchMyAppointments();

    const interval = setInterval(() => {
      setNow(Date.now());
      fetchMyAppointments();
    }, 1000);

    return () => clearInterval(interval);
  }, [patientId]);

  const fetchDoctors = async () => {
    const { data, error } = await supabase
      .from('doctors')
      .select('id, name, specialty');

    if (error) {
      console.error('fetchDoctors error', error);
    }

    setDoctors(data || []);
    setLoading(false);
  };

  const fetchMyAppointments = async () => {
    if (!patientId) return;

    const { data, error } = await supabase
      .from('patient_queue')
      .select(`
        *,
        doctors(name, specialty),
        patients(name)
      `)
      .eq('patient_id', patientId)
      .in('status', ['waiting', 'lab_pending', 'completed_15min', 'called', 'emergency'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('fetchMyAppointments error', error);
      return;
    }

    const apptData = (data || []).map((item) => ({
      id: `#Q${String(item.id).slice(-6).toUpperCase()}`,
      doctor: item.doctors?.name || 'Dr. Unknown',
      specialty: item.doctors?.specialty || 'General',
      date: new Date(item.created_at).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      time: new Date(item.appointment_time || item.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: item.status.replace('_', ' ').toUpperCase(),
      queueId: item.id,
      position: item.position,
      status_raw: item.status,
      updated_at: item.updated_at,
    }));

    setAppointments(apptData);
  };

  const getTimeLeft = (appt) => {
    if (appt.status_raw !== 'completed_15min') return null;

    const completedTime = new Date(appt.updated_at || appt.date).getTime();
    const elapsed = now - completedTime;
    const timeLeftMs = 15 * 60 * 1000 - elapsed;

    if (timeLeftMs <= 0) return '00:00';

    const minutes = Math.floor(timeLeftMs / 60000);
    const seconds = Math.floor((timeLeftMs % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  const cancelAppointment = async (queueId) => {
    if (!window.confirm('Cancel this appointment?')) return;

    const { error } = await supabase
      .from('patient_queue')
      .delete()
      .eq('id', queueId);

    if (error) {
      console.error('cancelAppointment error', error);
      alert('Failed to cancel.');
      return;
    }

    alert('Appointment cancelled.');
    fetchMyAppointments();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading appointments...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold">My Appointments</h1>
          <p>{appointments.length} active</p>
        </div>
        <Link to="/patient" className="px-4 py-2 bg-emerald-600 text-white rounded">
          Back to Patient Dashboard
        </Link>
      </div>

      <div>
        {appointments.map((appt) => {
          const timeLeft = getTimeLeft(appt);
          const is15min = appt.status_raw === 'completed_15min';

          return (
            <div key={appt.id} className="border p-4 mb-3 rounded">
              <div className="flex justify-between">
                <div>
                  <div>{appt.doctor}</div>
                  <div>{appt.specialty}</div>
                  <div>
                    {appt.date} • {appt.time}
                  </div>
                  {appt.position && <div>Position: #{appt.position}</div>}
                  {is15min && timeLeft && <div>Time remaining: {timeLeft}</div>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span>{appt.status}</span>
                  {appt.status_raw !== 'completed_15min' && (
                    <button
                      onClick={() => cancelAppointment(appt.queueId)}
                      className="px-3 py-1 bg-red-500 text-white rounded"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {appointments.length === 0 && (
          <div className="text-center py-12">
            <p>No appointments yet.</p>
            <Link
              to="/patient"
              className="mt-4 inline-block px-4 py-2 bg-emerald-600 text-white rounded"
            >
              Book Appointment
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientAppointments;
