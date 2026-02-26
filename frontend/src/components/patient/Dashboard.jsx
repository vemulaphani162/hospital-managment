import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import jsPDF from 'jspdf';

const PatientDashboard = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorSlots, setDoctorSlots] = useState([]);
  const [patientQueue, setPatientQueue] = useState([]);
  const [myPosition, setMyPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSlots, setShowSlots] = useState(false);
  const [emergencyLevel, setEmergencyLevel] = useState('low');
  const [isNewPatient, setIsNewPatient] = useState(true);
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  // PRESCRIPTION STATES
  const [showPrescriptions, setShowPrescriptions] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescriptionMeds, setSelectedPrescriptionMeds] = useState(null);
  // LAB REPORT STATES
  const [showLabReports, setShowLabReports] = useState(false);
  const [labReports, setLabReports] = useState([]);
  // ANIMATION STATES
  const [hoveredDoctor, setHoveredDoctor] = useState(null);
  const [glowPosition, setGlowPosition] = useState({ x: 0, y: 0 });
  const [mouseMoved, setMouseMoved] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const patientId = user.id;

  useEffect(() => {
    fetchAllDoctors();
    const interval = setInterval(fetchMyQueue, 10000);
    return () => clearInterval(interval);
  }, []);

  // Mouse move effect for subtle background animation
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouseMoved(true);
      setGlowPosition({
        x: e.clientX / window.innerWidth * 100,
        y: e.clientY / window.innerHeight * 100
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // FETCH LAB REPORTS
  const fetchLabReports = async () => {
    const { data } = await supabase
      .from('lab_requests')
      .select('*, doctors(name)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    setLabReports(data || []);
    setShowLabReports(true);
  };

  // FETCH PRESCRIPTIONS
  const fetchPrescriptions = async () => {
    const { data } = await supabase
      .from('pharmacy_requests')
      .select('*, doctors(name)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    setPrescriptions(data || []);
    setShowPrescriptions(true);
  };

  // VIEW MEDICINE DETAILS
  const viewMedicines = async (request) => {
    if (request.medicine_ids && request.medicine_ids.length > 0) {
      const { data } = await supabase.from('medicines').select('*').in('id', request.medicine_ids);
      setSelectedPrescriptionMeds(data || []);
    } else {
      alert('Detailed info not available for this prescription (Legacy record).');
    }
  };

  const fetchAllDoctors = async () => {
    const { data } = await supabase.from('doctors').select('*').order('name');
    setDoctors(data || []);
    setLoading(false);
  };

  const selectDoctor = async (doctor) => {
    setSelectedDoctor(doctor);
    setDoctorSlots([]);
    setShowSlots(true);
    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
      .from('doctor_schedules')
      .select('*')
      .eq('doctor_id', doctor.id)
      .eq('date', today)
      .eq('is_available', true);

    setDoctorSlots(data || []);
  };

  const handleImageUpload = async () => {
    if (!prescriptionFile) return null;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', prescriptionFile);
    formData.append('upload_preset', 'hospital_preset');
    formData.append('folder', 'prescriptions');

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dhc3fnbl2/image/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      setUploading(false);
      if (data.secure_url) {
        return data.secure_url;
      } else {
        console.error('Cloudinary error:', data.error?.message || data);
        alert(`Cloudinary Error: ${data.error?.message}\n\nCheck your Cloudinary settings.`);
        return null;
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
      setUploading(false);
      return null;
    }
  };

  const bookAppointment = async (slot) => {
    try {
      if (uploading) {
        alert('Please wait for the upload to complete.');
        return;
      }

      const { data: existing } = await supabase
        .from('patient_queue')
        .select('*')
        .eq('patient_id', patientId)
        .in('status', ['waiting', 'lab_pending', 'completed_15min'])
        .maybeSingle();

      if (existing) {
        alert('You are already in a queue for a doctor!');
        return;
      }

      let prescriptionUrl = null;
      if (!isNewPatient && prescriptionFile) {
        prescriptionUrl = await handleImageUpload();
        if (!prescriptionUrl) {
          return;
        }
      }

      const { data: currentQueue } = await supabase
        .from('patient_queue')
        .select('*')
        .eq('doctor_id', selectedDoctor.id)
        .in('status', ['waiting', 'lab_pending', 'completed_15min']);

      const position = (currentQueue?.length || 0) + 1;
      const waitMinutes = (position - 1) * 15;
      const appointmentTime = new Date(Date.now() + waitMinutes * 60000);

      const { error } = await supabase
        .from('patient_queue')
        .insert([
          {
            patient_id: patientId,
            doctor_id: selectedDoctor.id,
            slot_type: slot.slot_type,
            status: 'waiting',
            position: position,
            appointment_time: appointmentTime.toISOString(),
            emergency_level: emergencyLevel,
            is_new_patient: isNewPatient,
            prescription_image_url: prescriptionUrl,
          },
        ]);

      if (error) {
        alert('Booking failed: ' + error.message);
        return;
      }

      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-3 rounded-lg shadow-2xl z-50 animate-slide-in border border-gray-700';
      notification.textContent = `✓ Appointment booked! Position #${position}`;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 4000);

      setEmergencyLevel('low');
      setIsNewPatient(true);
      setPrescriptionFile(null);

      fetchMyQueue();
      setDoctorSlots([]);
      setShowSlots(false);
    } catch (err) {
      console.error('Booking error:', err);
      alert('Booking failed: ' + err.message);
    }
  };

  const fetchMyQueue = async () => {
    if (!patientId) return;

    const { data: myQueue } = await supabase
      .from('patient_queue')
      .select(`
        *,
        doctors(name, specialty),
        patients(name)
      `)
      .eq('patient_id', patientId)
      .in('status', ['waiting', 'lab_pending', 'completed_15min'])
      .maybeSingle();

    if (myQueue) {
      const { doctor_id } = myQueue;

      const { data: allQueue } = await supabase
        .from('patient_queue')
        .select(`
          *,
          patients(name),
          doctors(name, specialty)
        `)
        .eq('doctor_id', doctor_id)
        .in('status', ['waiting', 'lab_pending', 'completed_15min'])
        .order('created_at');

      const top10Queue = (allQueue || []).slice(0, 10);
      const myPositionIndex = top10Queue.findIndex(
        (q) => q.patient_id === patientId
      );

      setPatientQueue(top10Queue);
      setMyPosition(myPositionIndex !== -1 ? myPositionIndex + 1 : null);
      setSelectedDoctor(myQueue.doctors);
    } else {
      setPatientQueue([]);
      setMyPosition(null);
    }
  };

  const leaveQueue = async () => {
    if (!confirm('Are you sure you want to leave the queue?')) return;
    
    const myQueueItem = patientQueue.find((q) => q.patient_id === patientId);
    if (myQueueItem) {
      await supabase.from('patient_queue').delete().eq('id', myQueueItem.id);
      setPatientQueue([]);
      setMyPosition(null);
      
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-3 rounded-lg shadow-2xl z-50 animate-slide-in border border-red-400';
      notification.textContent = '✓ Left queue successfully';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    }
  };

  const downloadPDF = (type, data) => {
    const doc = new jsPDF();
    
    // Header - Smart Hospital
    doc.setFontSize(22);
    doc.setTextColor(33, 150, 243); // Blue color
    doc.text("Smart Hospital", 105, 20, { align: "center" });
    
    // Subheader
    doc.setFontSize(16);
    doc.setTextColor(100);
    doc.text(type === 'lab' ? "Lab Report" : "Prescription", 105, 30, { align: "center" });
    
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);
    
    // Patient & Doctor Details
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Patient Name: ${user.name}`, 20, 50);
    doc.text(`Doctor Name: Dr. ${data.doctors?.name || 'Unknown'}`, 20, 60);
    doc.text(`Date: ${new Date(data.created_at).toLocaleDateString()}`, 140, 50);
    
    // Content
    doc.setFontSize(14);
    doc.text("Details:", 20, 80);
    doc.setFontSize(12);
    
    if (type === 'lab') {
      doc.text(`Lab Name: ${data.lab_name}`, 20, 90);
      doc.text(`Tests: ${data.tests_ordered.join(', ')}`, 20, 100);
    } else {
      const splitText = doc.splitTextToSize(`Medicine: ${data.medicine}`, 170);
      doc.text(splitText, 20, 90);
    }
    
    doc.save(`${type}_${data.id}.pdf`);
  };

  const getStatusColor = (status, isMe, index) => {
    if (isMe) return 'bg-gradient-to-r from-amber-50 to-white border-amber-200';
    if (status === 'lab_pending') return 'bg-gradient-to-r from-purple-50 to-white border-purple-200';
    if (status === 'completed_15min') return 'bg-gradient-to-r from-orange-50 to-white border-orange-200';
    if (index === 0) return 'bg-gradient-to-r from-emerald-50 to-white border-emerald-200';
    return 'bg-white border-gray-100';
  };

  if (loading && !doctors.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-gray-50 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-gray-100 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-gray-50 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-xl text-gray-600 font-light">Loading Patient Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-8 font-sans relative overflow-hidden">
      
      {/* Animated background elements */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: mouseMoved 
            ? `radial-gradient(circle at ${glowPosition.x}% ${glowPosition.y}%, rgba(0,0,0,0.02) 0%, transparent 50%)`
            : 'none'
        }}
      >
        <div className="absolute top-20 left-10 w-64 h-64 bg-gray-50 rounded-full mix-blend-multiply filter blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gray-50 rounded-full mix-blend-multiply filter blur-3xl animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gray-50 rounded-full mix-blend-multiply filter blur-3xl animate-pulse-slow"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header Section - Enhanced */}
        <div className="mb-8 animate-fade-in">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-gray-100 p-8 shadow-2xl shadow-gray-200/50 hover:shadow-3xl transition-all duration-500">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6 group">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Patient Dashboard
                  </h1>
                  <p className="text-gray-500 mt-2 text-lg flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                    Welcome back, {user.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={fetchLabReports}
                  className="group relative px-6 py-3 bg-white text-gray-700 rounded-xl font-semibold shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 overflow-hidden"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-gray-50 to-white transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                  <span className="relative flex items-center gap-2">
                    <span className="text-xl group-hover:rotate-12 transition-transform duration-300"></span>
                    My Lab Reports
                  </span>
                </button>
                <button
                  onClick={fetchPrescriptions}
                  className="group relative px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                  <span className="relative flex items-center gap-2">
                    <span className="text-xl group-hover:rotate-12 transition-transform duration-300"></span>
                    My Prescriptions
                  </span>
                </button>
              </div>  
              
              {myPosition && (
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl px-6 py-3 border border-gray-200 shadow-lg animate-scale-in">
                    <span className="text-gray-500 text-sm">Your Position</span>
                    <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      #{myPosition}
                    </p>
                  </div>
                  <button
                    onClick={leaveQueue}
                    className="group relative px-4 py-3 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-all duration-300 overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-red-50 to-red-100 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                    <span className="relative flex items-center gap-2">
                      <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Leave Queue
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Doctors Grid - Enhanced */}
        <div className="mb-8 animate-fade-in-up">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="w-1 h-8 bg-gray-900 rounded-full"></span>
            Our Specialists
            <span className="text-sm font-normal text-gray-400 ml-2">({doctors.length} available)</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor, index) => (
              <div
                key={doctor.id}
                onClick={() => selectDoctor(doctor)}
                onMouseEnter={() => setHoveredDoctor(doctor.id)}
                onMouseLeave={() => setHoveredDoctor(null)}
                className="group relative bg-white rounded-2xl border border-gray-100 hover:border-gray-300 hover:shadow-3xl transition-all duration-500 cursor-pointer overflow-hidden animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Hover effect overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${hoveredDoctor === doctor.id ? 'scale-105' : ''}`}></div>
                
                {/* Shine effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100">
                  <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 group-hover:animate-shine"></div>
                </div>
                
                <div className="relative p-6">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center text-gray-700 text-xl font-bold border border-gray-200 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      {doctor.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg group-hover:text-gray-900 transition-colors">{doctor.name}</h3>
                      <p className="text-sm text-gray-400 mt-1 group-hover:text-gray-500 transition-colors">{doctor.specialty}</p>
                    </div>
                    <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                      <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor Slots Modal - Enhanced */}
        {showSlots && selectedDoctor && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-100 max-w-4xl w-full max-h-[90vh] overflow-hidden animate-scale-in">
              
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center text-white text-lg font-bold">
                      {selectedDoctor.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Dr. {selectedDoctor.name}</h2>
                      <p className="text-sm text-gray-500 mt-1">{selectedDoctor.specialty}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowSlots(false)}
                    className="w-10 h-10 bg-white hover:bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all border border-gray-200 hover:rotate-90 duration-300"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-100 mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-gray-900 rounded-full"></span>
                    Booking Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Emergency Level</label>
                      <select
                        value={emergencyLevel}
                        onChange={(e) => setEmergencyLevel(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 text-sm focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 transition-all outline-none"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Patient Type</label>
                      <div className="flex gap-6 items-center h-12">
                        <label className="flex items-center gap-3 text-sm cursor-pointer group">
                          <input 
                            type="radio" 
                            name="patient-type" 
                            checked={isNewPatient} 
                            onChange={() => setIsNewPatient(true)} 
                            className="text-gray-900 focus:ring-gray-900/30"
                          />
                          <span className="group-hover:text-gray-900 transition-colors">New Patient</span>
                        </label>
                        <label className="flex items-center gap-3 text-sm cursor-pointer group">
                          <input 
                            type="radio" 
                            name="patient-type" 
                            checked={!isNewPatient} 
                            onChange={() => setIsNewPatient(false)} 
                            className="text-gray-900 focus:ring-gray-900/30"
                          />
                          <span className="group-hover:text-gray-900 transition-colors">Returning</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {!isNewPatient && (
                    <div className="mt-4 animate-slide-down">
                      <label className="block text-xs text-gray-500 mb-2">Upload Previous Prescription (Optional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPrescriptionFile(e.target.files[0])}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 border border-gray-200 rounded-xl p-1 transition-all"
                      />
                    </div>
                  )}
                </div>

                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-gray-900 rounded-full"></span>
                  Available Slots Today
                </h3>

                {doctorSlots.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {doctorSlots.map((slot, index) => (
                      <div
                        key={index}
                        className="group bg-white rounded-2xl border border-gray-100 hover:border-gray-300 hover:shadow-2xl transition-all duration-500 animate-scale-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="p-6">
                          <div className="text-center mb-4">
                            <span className="text-4xl mb-3 block group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
                              {slot.slot_type === 'morning' ? '' : slot.slot_type === 'afternoon' ? '' : ''}
                            </span>
                            <h4 className="font-semibold text-gray-900 capitalize group-hover:text-gray-900 transition-colors">{slot.slot_type}</h4>
                          </div>
                          
                          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 text-center mb-4 border border-gray-100">
                            <p className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                              {slot.start_time} - {slot.end_time}
                            </p>
                          </div>

                          <button
                            onClick={() => bookAppointment(slot)}
                            disabled={uploading}
                            className="relative w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
                          >
                            <span className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                            <span className="relative">
                              {uploading ? (
                                <span className="flex items-center justify-center gap-2">
                                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Uploading...
                                </span>
                              ) : 'Book Appointment'}
                            </span>
                          </button>
                          
                          <p className="text-xs text-gray-400 text-center mt-3">
                            ~15 min per patient
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 animate-fade-in">
                    <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-lg">No slots available today</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* My Queue Section - Enhanced */}
        {patientQueue.length > 0 && myPosition && (
          <div className="mt-8 animate-fade-in-up">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-2xl overflow-hidden">
              
              {/* Queue Header */}
              <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <span className="w-1 h-6 bg-gray-900 rounded-full"></span>
                    Current Queue - Dr. {selectedDoctor?.name}
                  </h2>
                  <span className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    Live
                  </span>
                </div>
              </div>

              {/* Queue Stats */}
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 animate-scale-in">
                    <p className="text-xs text-gray-400 mb-1">Your Position</p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">#{myPosition}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 animate-scale-in animation-delay-100">
                    <p className="text-xs text-gray-400 mb-1">Wait Time</p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">{(myPosition - 1) * 15}min</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 animate-scale-in animation-delay-200">
                    <p className="text-xs text-gray-400 mb-1">Total in Queue</p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">{patientQueue.length}</p>
                  </div>
                </div>

                {/* Queue List */}
                <div className="space-y-3">
                  {patientQueue.map((queueItem, index) => {
                    const isMe = queueItem.patient_id === patientId;
                    
                    return (
                      <div
                        key={queueItem.id}
                        className={`rounded-xl border transition-all duration-300 hover:shadow-xl animate-slide-in-left ${getStatusColor(queueItem.status, isMe, index)}`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold transition-transform group-hover:scale-110 ${
                                isMe ? 'bg-gradient-to-br from-amber-100 to-amber-50' :
                                queueItem.status === 'lab_pending' ? 'bg-gradient-to-br from-purple-100 to-purple-50' :
                                queueItem.status === 'completed_15min' ? 'bg-gradient-to-br from-orange-100 to-orange-50' :
                                index === 0 ? 'bg-gradient-to-br from-emerald-100 to-emerald-50' : 'bg-gradient-to-br from-gray-100 to-gray-50'
                              }`}>
                                {isMe ? '' : 
                                 queueItem.status === 'lab_pending' ? '' :
                                 queueItem.status === 'completed_15min' ? '' :
                                 index === 0 ? '▶️' : '⏱️'}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {queueItem.patients?.name}
                                  {isMe && <span className="ml-2 text-amber-600 text-sm bg-amber-50 px-2 py-0.5 rounded-full">(You)</span>}
                                </h4>
                                <p className="text-xs text-gray-400 mt-1">
                                  {isMe ? 'Current Patient' :
                                   queueItem.status === 'lab_pending' ? 'Lab Pending' :
                                   queueItem.status === 'completed_15min' ? 'Completing' :
                                   index === 0 ? 'Now Serving' : 'In Queue'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                                isMe ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                queueItem.status === 'lab_pending' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                queueItem.status === 'completed_15min' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                index === 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                'bg-gray-50 text-gray-600 border-gray-200'
                              }`}>
                                #{index + 1}
                              </span>
                              {index === 0 && !isMe && queueItem.status === 'waiting' && (
                                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200 animate-pulse">
                                  NEXT
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State - Enhanced */}
        {!patientQueue.length && !loading && !showSlots && (
          <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-3xl border border-gray-100 p-16 text-center shadow-2xl animate-fade-in">
            <div className="flex flex-col items-center justify-center">
              <div className="w-24 h-24 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 animate-float">
                <svg className="w-12 h-12 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Appointments</h3>
              <p className="text-gray-500 mb-8 text-lg">
                Select a doctor above to book your first appointment
              </p>
            </div>
          </div>
        )}

        {/* LAB REPORTS MODAL - Enhanced */}
        {showLabReports && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-100 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
              <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">My Lab Reports</h2>
                <button onClick={() => setShowLabReports(false)} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-700 border border-gray-200 hover:rotate-90 transition-all duration-300">✕</button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-4">
                  {labReports.length > 0 ? labReports.map((report, index) => (
                    <div key={report.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-gray-300 hover:shadow-xl transition-all duration-300 animate-slide-in-left" style={{ animationDelay: `${index * 50}ms` }}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900 text-lg">Dr. {report.doctors?.name}</p>
                          <p className="text-sm text-gray-400">{new Date(report.created_at).toLocaleDateString()} at {new Date(report.created_at).toLocaleTimeString()}</p>
                          <p className="text-sm text-gray-600 mt-3">Lab: <span className="font-medium text-gray-900">{report.lab_name}</span></p>
                          <div className="mt-4">
                            <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Tests Ordered</p>
                            <div className="flex flex-wrap gap-2">
                              {report.tests_ordered.map((test, i) => (
                                <span key={i} className="px-3 py-1.5 bg-gray-50 text-gray-700 text-xs rounded-full font-medium border border-gray-200 hover:bg-gray-100 transition-colors">{test}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${
                            report.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
                            report.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-gray-50 text-gray-700 border border-gray-200'
                          }`}>
                            {report.status}
                          </span>
                          <button 
                            onClick={() => downloadPDF('lab', report)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs rounded-lg font-medium border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1"
                          >
                            Download PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  )) : <p className="text-center text-gray-400 py-12 text-lg">No lab reports found.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRESCRIPTIONS MODAL - Enhanced */}
        {showPrescriptions && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-100 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
              <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">My Prescriptions</h2>
                <button onClick={() => { setShowPrescriptions(false); setSelectedPrescriptionMeds(null); }} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-700 border border-gray-200 hover:rotate-90 transition-all duration-300">✕</button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                {selectedPrescriptionMeds ? (
                  <div className="animate-fade-in">
                    <button onClick={() => setSelectedPrescriptionMeds(null)} className="mb-6 text-sm text-gray-600 hover:text-gray-900 hover:underline flex items-center gap-2 group">
                      <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to list
                    </button>
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <span className="w-1 h-5 bg-gray-900 rounded-full"></span>
                      Medicine Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedPrescriptionMeds.map((med, index) => (
                        <div key={med.id} className="bg-white border border-gray-100 rounded-2xl p-5 flex gap-5 hover:border-gray-300 hover:shadow-xl transition-all duration-300 animate-scale-in" style={{ animationDelay: `${index * 100}ms` }}>
                          {med.image_url ? (
                            <img src={med.image_url} alt={med.name} className="w-24 h-24 object-cover rounded-xl bg-gray-50" />
                          ) : (
                            <div className="w-24 h-24 bg-gray-50 rounded-xl flex items-center justify-center text-4xl">💊</div>
                          )}
                          <div>
                            <h4 className="font-bold text-gray-900 text-lg">{med.name}</h4>
                            <p className="text-sm text-gray-400">{med.company}</p>
                            <div className="flex flex-wrap gap-2 mt-3">
                              <span className="px-3 py-1.5 bg-gray-50 text-gray-700 text-xs rounded-full font-medium border border-gray-200">{med.type}</span>
                              {med.strength && <span className="px-3 py-1.5 bg-gray-50 text-gray-700 text-xs rounded-full font-medium border border-gray-200">{med.strength}{med.unit}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {prescriptions.length > 0 ? prescriptions.map((prescription, index) => (
                      <div key={prescription.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-gray-300 hover:shadow-xl transition-all duration-300 animate-slide-in-left" style={{ animationDelay: `${index * 50}ms` }}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-900 text-lg">Dr. {prescription.doctors?.name}</p>
                            <p className="text-sm text-gray-400">{new Date(prescription.created_at).toLocaleDateString()} at {new Date(prescription.created_at).toLocaleTimeString()}</p>
                            <p className="text-sm text-gray-600 mt-3 line-clamp-1">{prescription.medicine}</p>
                          </div>
                          <div className="flex flex-col items-end gap-3">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize border ${
                              prescription.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {prescription.status}
                            </span>
                            {prescription.medicine_ids && prescription.medicine_ids.length > 0 && (
                              <button 
                                onClick={() => viewMedicines(prescription)}
                                className="px-4 py-2 bg-gray-50 text-gray-700 text-sm rounded-xl font-medium hover:bg-gray-100 hover:text-gray-900 transition-all border border-gray-200"
                              >
                                View Medicines
                              </button>
                            )}
                            <button 
                              onClick={() => downloadPDF('prescription', prescription)}
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs rounded-lg font-medium border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1"
                            >
                              Download PDF
                            </button>
                          </div>
                        </div>
                      </div>
                    )) : <p className="text-center text-gray-400 py-12 text-lg">No prescriptions found.</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.7;
          }
        }
        
        @keyframes shine {
          to {
            left: 200%;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
        
        .animate-slide-in-left {
          animation: slide-in-left 0.5s ease-out;
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.4s ease-out;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        
        .animate-shine {
          animation: shine 1.5s ease-out;
        }
        
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .hover\:shadow-3xl:hover {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
        }
        
        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>
    </div>
  );
};

export default PatientDashboard;