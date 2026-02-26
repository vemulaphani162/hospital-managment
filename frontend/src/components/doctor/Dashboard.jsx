import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

const DoctorDashboard = () => {
  const [patientQueue, setPatientQueue] = useState([]);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [doctorId, setDoctorId] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 🆕 LAB MODAL STATES - ADDED LAB SELECTION
  const [labs, setLabs] = useState([]);
  const [showLabModal, setShowLabModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedTests, setSelectedTests] = useState({});
  const [selectedLabName, setSelectedLabName] = useState(''); // ✅ NEW: Selected lab name

  // 🆕 PHARMACY MODAL STATE
  const [medicines, setMedicines] = useState([]);
  const [showPharmacyModal, setShowPharmacyModal] = useState(false);
  const [selectedMedicineIds, setSelectedMedicineIds] = useState([]);
  
  // 🆕 PROFILE IMAGE STATE
  const [profileImage, setProfileImage] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 🆕 ASSISTANT ASSIGNMENTS
  const [assistantAssignments, setAssistantAssignments] = useState([]);
  
  // 🆕 PRESCRIPTION MODAL STATE
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  
  const [morning, setMorning] = useState({ start: '09:00', end: '11:59' });
  const [afternoon, setAfternoon] = useState({ start: '12:00', end: '18:00' });
  const [night, setNight] = useState({ start: '18:00', end: '22:00' });
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    initDoctor();
    const interval = setInterval(() => {
      if (doctorId) {
        fetchPatientQueue(doctorId);
        fetchAssistantAssignments(doctorId);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [doctorId]);

  // 🆕 FETCH ASSISTANT ASSIGNMENTS
  const fetchAssistantAssignments = async (docId) => {
    try {
      const { data, error } = await supabase
        .from('doctors_assignments')
        .select('*')
        .eq('doctor_id', docId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAssistantAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assistant assignments:', error);
    }
  };

  // 🆕 EMERGENCY BUTTON - DELAY FIRST WAITING PATIENT BY 30 MINS
  const handleEmergency = async (assignmentId) => {
    if (confirm('EMERGENCY! Delay first waiting patient by 30 minutes?')) {
      try {
        // Find first waiting patient
        const waitingPatient = patientQueue.find(q => q.status === 'waiting');
        
        if (waitingPatient) {
         // Add 30 minutes to created_at
         const currentTime = new Date(waitingPatient.created_at);
         const delayedTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
         
         await supabase
           .from('patient_queue')
           .update({ 
             created_at: delayedTime.toISOString(),
             status: 'delayed_emergency' // Mark as delayed for emergency
           })
           .eq('id', waitingPatient.id);
         
         // Mark assignment as handled
         await supabase
           .from('doctors_assignments')
           .update({ handled: true })
           .eq('id', assignmentId);
         
         alert('Emergency patient prioritized! First waiting patient delayed 30 mins');
         fetchPatientQueue(doctorId);
         fetchAssistantAssignments(doctorId);
       } else {
         alert('No waiting patients to delay');
       }
      } catch (error) {
        console.error('Emergency error:', error);
        alert('Emergency action failed');
      }
    }
  };

  // 🆕 FETCH LABS
  const fetchLabs = async () => {
    const { data } = await supabase.from('labs').select('*');
    setLabs(data || []);
  };

  // 🆕 FETCH MEDICINES
  const fetchMedicines = async () => {
    const { data } = await supabase.from('medicines').select('*').order('name');
    setMedicines(data || []);
  };

  const initDoctor = async () => {
    let docId = user.id;
    // Always fetch doctor details to get latest image
    if (user.email) {
      const { data } = await supabase
        .from('doctors')
        .select('id, image') // ✅ Fetch image
        .eq('email', user.email)
        .single();
      
      if (data?.id) docId = data.id;
      if (data?.image) setProfileImage(data.image);
    }
    
    if (docId) {
      setDoctorId(docId);
      await Promise.all([
        fetchTodaySchedules(docId),
        fetchPatientQueue(docId),
        fetchAssistantAssignments(docId),
        fetchLabs(),
        fetchMedicines()
      ]);
    }
    setLoading(false);
  };

  // ✅ FIXED: Show waiting + lab_pending + completed_15min
  const fetchPatientQueue = async (docId) => {
    const { data } = await supabase
      .from('patient_queue')
      .select(`
        *, 
        patients (
          id, name, email, phone, age
        )
      `)
      .eq('doctor_id', docId)
      .in('status', ['waiting', 'lab_pending', 'completed_15min', 'delayed_emergency'])
      .order('created_at', { ascending: false });
    
    setPatientQueue(data || []);
  };

  const fetchTodaySchedules = async (docId) => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('doctor_schedules')
      .select('*')
      .eq('doctor_id', docId)
      .eq('date', today)
      .order('slot_type');
    
    setTodaySchedules(data || []);
    
    data?.forEach(schedule => {
      if (schedule.slot_type === 'morning') setMorning({ start: schedule.start_time, end: schedule.end_time });
      if (schedule.slot_type === 'afternoon') setAfternoon({ start: schedule.start_time, end: schedule.end_time });
      if (schedule.slot_type === 'night') setNight({ start: schedule.start_time, end: schedule.end_time });
    });
  };

  const saveSlot = async (slotType, startTime, endTime) => {
    try {
      if (!doctorId) return;
      const today = new Date().toISOString().split('T')[0];
      
      // Check if slot exists first to avoid upsert 400 error if constraint is missing
      const { data: existingSlot } = await supabase
        .from('doctor_schedules')
        .select('id')
        .eq('doctor_id', doctorId)
        .eq('date', today)
        .eq('slot_type', slotType)
        .maybeSingle();

      let result;
      const slotData = {
        start_time: startTime,
        end_time: endTime,
        is_available: true
      };

      if (existingSlot) {
        result = await supabase.from('doctor_schedules').update(slotData).eq('id', existingSlot.id);
      } else {
        result = await supabase.from('doctor_schedules').insert([{ ...slotData, doctor_id: doctorId, slot_type: slotType, date: today }]);
      }
      
      if (!result.error) {
        alert(`✅ ${slotType.toUpperCase()} slot saved!`);
        fetchTodaySchedules(doctorId);
      } else {
        console.error('Save error:', result.error);
        alert('❌ Save failed');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('❌ Save failed');
    }
  };

  const completePatient = async (queueId) => {
    if (confirm('Mark patient as completed?')) {
      await supabase.from('patient_queue').update({ 
        status: 'completed' 
      }).eq('id', queueId);
      
      alert('Patient completed and removed from queue.');
      fetchPatientQueue(doctorId);
    }
  };

  // 🆕 OPEN LAB MODAL
  const openLabModal = (patient) => {
    setSelectedPatient(patient);
    setSelectedTests({});
    setSelectedLabName(''); // ✅ Reset lab selection
    setShowLabModal(true);
  };

  // 🆕 OPEN PHARMACY MODAL
  const openPharmacyModal = (patient) => {
    setSelectedPatient(patient);
    setSelectedMedicineIds([]);
    setShowPharmacyModal(true);
  };

  // 🆕 SUBMIT PRESCRIPTION
  const submitPrescription = async () => {
    if (selectedMedicineIds.length === 0) {
      alert('Select at least one medicine');
      return;
    }
    
    const selectedMeds = medicines.filter(m => selectedMedicineIds.includes(m.id));
    const medString = selectedMeds.map(m => `${m.name} (${m.type}) - ${m.company}`).join(', ');

    await supabase.from('pharmacy_requests').insert([{
        patient_id: selectedPatient.patients.id,
        doctor_id: doctorId,
        medicine: medString,
        medicine_ids: selectedMedicineIds, // ✅ Save IDs to fetch details later
        status: 'pending'
    }]);

    alert('Prescription sent to Pharmacy!');
    setShowPharmacyModal(false);
    setSelectedMedicineIds([]);
  };

  // ✅ NEW: SELECT LAB NAME CHECKBOX
  const selectLab = (labName) => {
    setSelectedLabName(labName === selectedLabName ? '' : labName);
  };

  // 🆕 TOGGLE TEST
  const toggleTest = (labId, test) => {
    setSelectedTests(prev => {
      const labTests = prev[labId] || [];
      const newLabTests = labTests.includes(test)
        ? labTests.filter(t => t !== test)
        : [...labTests, test];
      return { ...prev, [labId]: newLabTests };
    });
  };

  // 🆕 SUBMIT LAB REQUEST - ✅ NOW WITH SELECTED LAB NAME
  const submitLabRequest = async () => {
    const allSelectedTests = Object.values(selectedTests).flat();
    
    if (!selectedLabName) {
      alert('Please select a lab first!');
      return;
    }
    
    if (allSelectedTests.length === 0) {
      alert('Select at least 1 test!');
      return;
    }

    try {
      console.log('Submitting lab request:', {
        patientQueueId: selectedPatient.id,
        patientId: selectedPatient.patients?.id,
        doctorId,
        labName: selectedLabName,      // ✅ Selected lab
        tests: allSelectedTests
      });

      // ✅ Step 1: Update patient queue status to lab_pending
      const { error: queueError } = await supabase
        .from('patient_queue')
        .update({ status: 'lab_pending' })
        .eq('id', selectedPatient.id);

      if (queueError) {
        console.error('Queue update error:', queueError);
        throw new Error('Failed to update patient status');
      }

      // ✅ Step 2: Insert lab request WITH SELECTED LAB NAME
      const labRequestData = {
        patient_queue_id: selectedPatient.id,
        patient_id: selectedPatient.patients.id,
        doctor_id: doctorId,
        lab_name: selectedLabName,     // ✅ STORED IN DATABASE
        tests_ordered: allSelectedTests,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      console.log('Inserting lab request:', labRequestData);

      const { error: insertError, data: insertedData } = await supabase
        .from('lab_requests')
        .insert([labRequestData])
        .select()
        .single();

      if (insertError) {
        console.error('Lab insert error:', insertError);
        throw new Error(`Failed to create lab request: ${insertError.message}`);
      }

      console.log('Lab request SUCCESS:', insertedData);
      alert(`${allSelectedTests.length} tests sent to ${selectedLabName}!`);
      
      setShowLabModal(false);
      setSelectedTests({});
      setSelectedLabName('');
      fetchPatientQueue(doctorId);
      
    } catch (error) {
      console.error('Lab request FAILED:', error);
      alert(`Failed to send tests: ${error.message}`);
    }
  };

  // 🆕 HANDLE IMAGE UPLOAD TO CLOUDINARY
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'hospital_preset'); // ⚠️ Make sure this Unsigned Preset exists in Cloudinary
    formData.append('folder', 'public'); // ✅ Store in 'public' folder

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dhc3fnbl2/image/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (data.secure_url) {
        await updateProfilePicture(data.secure_url);
      } else {
        console.error('Cloudinary error:', data.error?.message || data);
        alert(`Cloudinary Error: ${data.error?.message}\n\n1. Go to Cloudinary Settings > Upload\n2. Add 'Upload Preset'\n3. Name: hospital_preset\n4. Mode: Unsigned`);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  // 🆕 UPDATE PROFILE IN SUPABASE
  const updateProfilePicture = async (url) => {
    try {
      const { error } = await supabase
        .from('doctors')
        .update({ image: url })
        .eq('id', doctorId);

      if (error) throw error;
      setProfileImage(url);
      alert('Profile picture updated!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile in database');
    }
  };

  const handleSeenAssignment = async (assignmentId) => {
    // Mark assignment as handled
    await supabase
      .from('doctors_assignments')
      .update({ handled: true })
      .eq('id', assignmentId);

    // Find any delayed patient and revert their status to 'waiting'
    const { data: delayedPatient } = await supabase
      .from('patient_queue')
      .select('id')
      .eq('doctor_id', doctorId)
      .eq('status', 'delayed_emergency')
      .limit(1)
      .single();

    if (delayedPatient) {
      await supabase
        .from('patient_queue')
        .update({ status: 'waiting' })
        .eq('id', delayedPatient.id);
    }

    // Refresh both lists
    fetchAssistantAssignments(doctorId);
    fetchPatientQueue(doctorId);
  };

  // 🆕 OPEN PRESCRIPTION MODAL
  const openPrescriptionModal = (url) => {
    setSelectedPrescription(url);
    setShowPrescriptionModal(true);
  };

  const slots = [
    { type: 'morning',  title: 'Morning', state: morning, setState: setMorning, save: () => saveSlot('morning', morning.start, morning.end) },
    { type: 'afternoon',  title: 'Afternoon', state: afternoon, setState: setAfternoon, save: () => saveSlot('afternoon', afternoon.start, afternoon.end) },
    { type: 'night', title: 'Night', state: night, setState: setNight, save: () => saveSlot('night', night.start, night.end) }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 via-white to-amber-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-emerald-300 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-xl text-amber-600">Loading Doctor Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-50 p-4 md:p-8 font-sans">
      
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(16, 185, 129, 0.1) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="max-w-7xl mx-auto relative">
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-amber-200/50 border border-amber-100 p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* ✅ CLICKABLE PROFILE PICTURE */}
                <div className="relative cursor-pointer group" onClick={() => setShowProfileModal(true)}>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-xl blur-lg opacity-30 animate-pulse group-hover:opacity-50 transition-opacity"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-white/40 transition-all">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center border border-amber-200 shadow-sm">
                    <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-amber-900">Doctor Dashboard</h1>
                  <p className="text-emerald-600 mt-1">Dr. {user.name}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <div className="bg-white rounded-xl px-4 py-2 border border-amber-200 shadow-sm">
                  <span className="text-amber-500 text-sm">Waiting</span>
                  <p className="text-2xl font-bold text-amber-900">{patientQueue.filter(q => q.status === 'waiting').length}</p>
                </div>
                <div className="bg-white rounded-xl px-4 py-2 border border-amber-200 shadow-sm">
                  <span className="text-purple-500 text-sm">Lab Pending</span>
                  <p className="text-2xl font-bold text-purple-600">{patientQueue.filter(q => q.status === 'lab_pending').length}</p>
                </div>
                <div className="bg-white rounded-xl px-4 py-2 border border-amber-200 shadow-sm">
                  <span className="text-amber-500 text-sm">15min Timer</span>
                  <p className="text-2xl font-bold text-amber-600">{patientQueue.filter(q => q.status === 'completed_15min').length}</p>
                </div>
                <div className="bg-white rounded-xl px-4 py-2 border border-amber-200 shadow-sm">
                  <span className="text-indigo-500 text-sm">Assistant</span>
                  <p className="text-2xl font-bold text-indigo-600">{assistantAssignments.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assistant Assignments Section - Light Theme */}
        {assistantAssignments.length > 0 && (
          <div className="mb-8">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-amber-200/50 border border-amber-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-amber-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    Assistant Assignments ({assistantAssignments.length})
                  </h2>
                  <button 
                    onClick={() => fetchAssistantAssignments(doctorId)}
                    className="px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-600 rounded-lg text-sm font-medium transition-all border border-amber-200"
                  >
                    Refresh
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assistantAssignments.slice(0, 6).map((assignment) => (
                    <div key={assignment.id} className="bg-white rounded-xl border border-amber-200 hover:border-indigo-300 transition-all duration-300 group shadow-sm hover:shadow-md">
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-semibold text-amber-900 group-hover:text-indigo-600 transition-colors">
                                {assignment.patient_name}
                              </h3>
                              <p className="text-xs text-amber-500">
                                {new Date(assignment.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-600 text-xs rounded-full border border-indigo-200">
                            Room {assignment.room_no}
                          </span>
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleEmergency(assignment.id)}
                            className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-all border border-red-200 flex items-center justify-center gap-1"
                          >
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            Emergency
                          </button>
                          <button
                            onClick={() => handleSeenAssignment(assignment.id)}
                            className="px-3 py-2 bg-white hover:bg-amber-50 text-amber-600 rounded-lg text-sm font-medium transition-all border border-amber-200"
                          >
                            ✓ Seen
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {assistantAssignments.length > 6 && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-amber-500">
                      +{assistantAssignments.length - 6} more assignments
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Schedule Slots - Light Theme */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            Today's Schedule
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {slots.map((slot, index) => {
              const isActive = todaySchedules.find(s => s.slot_type === slot.type);
              return (
                <div key={index} className={`bg-white/90 backdrop-blur-xl rounded-xl border transition-all duration-300 shadow-sm ${
                  isActive ? 'border-emerald-300 bg-emerald-50/50' : 'border-amber-200 hover:border-blue-300'
                }`}>
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-500'
                      }`}>
                        {slot.type === 'morning' && (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                          </svg>
                        )}
                        {slot.type === 'afternoon' && (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        )}
                        {slot.type === 'night' && (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-amber-900 capitalize">{slot.title}</h3>
                        <p className="text-xs text-amber-500">
                          {isActive ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div>
                        <label className="block text-xs text-amber-500 mb-1">Start Time</label>
                        <input
                          type="time"
                          value={slot.state.start}
                          onChange={(e) => slot.setState({ ...slot.state, start: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-amber-900 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-amber-500 mb-1">End Time</label>
                        <input
                          type="time"
                          value={slot.state.end}
                          onChange={(e) => slot.setState({ ...slot.state, end: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-amber-900 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all outline-none"
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={slot.save}
                      className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200 border border-emerald-200'
                          : 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-600 hover:from-blue-200 hover:to-indigo-200 border border-blue-200'
                      }`}
                    >
                      {isActive ? '✓ Active' : 'Save Slot'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Patient Queue - Light Theme */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-amber-200/50 border border-amber-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-amber-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" />
                </svg>
                Patient Queue
              </h2>
              <span className="flex items-center gap-1 text-sm text-emerald-600">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Live
              </span>
            </div>
          </div>

          <div className="p-6">
            {/* Queue Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-white rounded-lg p-3 border border-amber-200 shadow-sm">
                <p className="text-xs text-amber-500">Waiting</p>
                <p className="text-2xl font-bold text-emerald-600">{patientQueue.filter(q => q.status === 'waiting').length}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-amber-200 shadow-sm">
                <p className="text-xs text-purple-500">Lab Pending</p>
                <p className="text-2xl font-bold text-purple-600">{patientQueue.filter(q => q.status === 'lab_pending').length}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-amber-200 shadow-sm">
                <p className="text-xs text-amber-500">15min Timer</p>
                <p className="text-2xl font-bold text-amber-600">{patientQueue.filter(q => q.status === 'completed_15min').length}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-amber-200 shadow-sm">
                <p className="text-xs text-red-500">Delayed</p>
                <p className="text-2xl font-bold text-red-600">{patientQueue.filter(q => q.status === 'delayed_emergency').length}</p>
              </div>
            </div>

            {/* Queue List */}
            <div className="space-y-3">
              {patientQueue.slice(0, 10).map((item, index) => {
                const patient = item.patients;
                const isNext = index === 0 && item.status === 'waiting';
                const is15min = item.status === 'completed_15min';
                const isDelayed = item.status === 'delayed_emergency';
                const isLabPending = item.status === 'lab_pending';
                
                return (
                  <div key={item.id} className={`rounded-lg border transition-all duration-300 ${
                    isLabPending ? 'bg-purple-50 border-purple-200' :
                    is15min ? 'bg-amber-50 border-amber-200' :
                    isDelayed ? 'bg-red-50 border-red-200' :
                    isNext ? 'bg-emerald-50 border-emerald-200 scale-[1.02] shadow-md shadow-emerald-200/50' :
                    'bg-white border-amber-200 hover:border-blue-300'
                  }`}>
                    <div className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold ${
                            isLabPending ? 'bg-purple-100 text-purple-600' :
                            is15min ? 'bg-amber-100 text-amber-600' :
                            isDelayed ? 'bg-red-100 text-red-600' :
                            isNext ? 'bg-emerald-100 text-emerald-600' :
                            'bg-amber-100 text-amber-600'
                          }`}>
                            {isLabPending ? '🧪' : is15min ? '⏳' : isDelayed ? '⚠️' : isNext ? 'NEXT' : index + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-amber-900 flex items-center gap-2">
                              {patient?.name}
                              {item.is_new_patient && <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full border border-blue-200">New Patient</span>}
                            </h4>
                            <p className="text-sm text-amber-500">{patient?.email}</p>
                            <div className="text-xs text-amber-400 mt-1 flex items-center gap-2 flex-wrap">
                              <span>
                                {isDelayed ? 'Emergency Delay (30min)' :
                                 is15min ? 'Completing in 15min' :
                                 isLabPending ? 'Lab tests pending' :
                                 `Est: ${index * 15}min`}
                              </span>
                              {item.emergency_level && (
                                <span className={`font-bold capitalize px-1.5 py-0.5 rounded-full text-white text-xs ${
                                  item.emergency_level === 'high' ? 'bg-red-500' :
                                  item.emergency_level === 'medium' ? 'bg-orange-500' :
                                  'bg-green-500'
                                }`}>
                                  {item.emergency_level}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            isLabPending ? 'bg-purple-100 text-purple-600 border border-purple-200' :
                            is15min ? 'bg-amber-100 text-amber-600 border border-amber-200' :
                            isDelayed ? 'bg-red-100 text-red-600 border border-red-200' :
                            'bg-amber-100 text-amber-600 border border-amber-200'
                          }`}>
                            {item.status.replace('_', ' ').toUpperCase()}
                          </span>
                          
                          {item.prescription_image_url && (
                            <button
                              onClick={() => openPrescriptionModal(item.prescription_image_url)}
                              className="px-3 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-600 rounded-lg text-sm font-medium transition-all border border-sky-200"
                            >
                              Prescription
                            </button>
                          )}
                          
                          {item.status === 'waiting' && !isDelayed && (
                            <>
                              <button
                                onClick={() => openLabModal(item)}
                                className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-lg text-sm font-medium transition-all border border-purple-200"
                              >
                                Lab
                              </button>
                              <button
                                onClick={() => openPharmacyModal(item)}
                                className="px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg text-sm font-medium transition-all border border-orange-200"
                              >
                                Prescribe
                              </button>
                              <button
                                onClick={() => completePatient(item.id)}
                                className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-600 rounded-lg text-sm font-medium transition-all border border-emerald-200"
                              >
                                Complete
                              </button>
                            </>
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

      {/* Lab Modal - Light Theme */}
      {showLabModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl shadow-amber-200/50 border border-amber-100 max-w-4xl w-full max-h-[90vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-amber-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4-3h2v13h-2z"/>
                    </svg>
                    Lab Tests: {selectedPatient.patients?.name}
                  </h2>
                  <p className="text-sm text-amber-600 mt-1">Select lab and tests to send</p>
                </div>
                <button 
                  onClick={() => setShowLabModal(false)}
                  className="w-8 h-8 bg-white hover:bg-amber-50 rounded-lg flex items-center justify-center text-amber-400 hover:text-amber-600 transition-all border border-amber-200"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              
              {/* Lab Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                  Select Laboratory
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {labs.map((lab) => (
                    <button
                      key={lab.id}
                      onClick={() => selectLab(lab.name)}
                      className={`p-3 rounded-lg border transition-all text-left ${
                        selectedLabName === lab.name
                          ? 'bg-purple-100 border-purple-300 text-purple-700'
                          : 'bg-white border-amber-200 text-amber-600 hover:border-purple-300 hover:bg-purple-50'
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
                  <h3 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                    Select Tests
                  </h3>
                  <div className="space-y-4">
                    {labs.filter(lab => lab.name === selectedLabName).map((lab) => (
                      <div key={lab.id} className="bg-white rounded-xl border border-amber-200 p-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {lab.available_tests.map((test, index) => (
                            <label
                              key={index}
                              className={`flex items-center p-2 rounded-lg cursor-pointer transition-all ${
                                selectedTests[lab.id]?.includes(test)
                                  ? 'bg-emerald-100 border border-emerald-200'
                                  : 'bg-white hover:bg-amber-50 border border-amber-200'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedTests[lab.id]?.includes(test) || false}
                                onChange={() => toggleTest(lab.id, test)}
                                className="w-4 h-4 text-emerald-600 rounded border-amber-300 bg-white focus:ring-emerald-500/30 focus:ring-offset-0"
                              />
                              <span className="ml-2 text-sm text-amber-700">{test}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Count */}
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-amber-200">
                <span className="text-sm text-amber-600">
                  {Object.values(selectedTests).flat().length} tests selected
                </span>
                <button
                  onClick={submitLabRequest}
                  disabled={!selectedLabName || Object.values(selectedTests).flat().length === 0}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
                >
                  Send to {selectedLabName || 'Lab'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 Pharmacy Modal */}
      {showPharmacyModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-100 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-amber-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-amber-900">Prescribe Medicine</h2>
                <p className="text-sm text-amber-600">Patient: {selectedPatient.patients?.name}</p>
              </div>
              <button onClick={() => setShowPharmacyModal(false)} className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-amber-400 hover:text-amber-600 border border-amber-200">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {medicines.map((med) => (
                  <label key={med.id} className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedMedicineIds.includes(med.id) ? 'bg-orange-50 border-orange-300 ring-1 ring-orange-300' : 'bg-white border-gray-200 hover:border-orange-200'
                  }`}>
                    {med.image_url && (
                      <img src={med.image_url} alt={med.name} className="w-12 h-12 rounded-lg object-cover mr-3" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{med.name}</p>
                      <p className="text-xs text-gray-500">{med.company}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">{med.type}</span>
                        {med.strength && (
                          <span className="text-xs px-2 py-0.5 bg-blue-50 rounded-full text-blue-600 font-medium">{med.strength}{med.unit}</span>
                        )}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedMedicineIds.includes(med.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedMedicineIds([...selectedMedicineIds, med.id]);
                        else setSelectedMedicineIds(selectedMedicineIds.filter(id => id !== med.id));
                      }}
                      className="ml-3 w-5 h-5 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
              <span className="text-sm text-gray-600">{selectedMedicineIds.length} medicines selected</span>
              <button
                onClick={submitPrescription}
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-orange-500/30 transition-all"
              >
                Submit Prescription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 Prescription Modal */}
      {showPrescriptionModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl shadow-amber-200/50 border border-amber-100 max-w-4xl w-full max-h-[90vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-amber-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-sky-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 14H4V6h16v12zM7 10h2v7H7zm4-3h2v10h-2zm4-3h2v13h-2z"/>
                    </svg>
                    Prescription
                  </h2>
                </div>
                <button 
                  onClick={() => setShowPrescriptionModal(false)}
                  className="w-8 h-8 bg-white hover:bg-amber-50 rounded-lg flex items-center justify-center text-amber-400 hover:text-amber-600 transition-all border border-amber-200"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body - Prescription Image */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] flex items-center justify-center">
              <img 
                src={selectedPrescription} 
                alt="Prescription" 
                className="max-w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* 🆕 Profile Settings Modal - Light Theme */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-100 max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-amber-900">Profile Settings</h2>
              <button onClick={() => setShowProfileModal(false)} className="w-8 h-8 bg-white hover:bg-amber-50 rounded-lg flex items-center justify-center text-amber-400 hover:text-amber-600 transition-all border border-amber-200">
                ✕
              </button>
            </div>
            
            <div className="flex flex-col items-center gap-6">
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-200 shadow-xl shadow-emerald-200/30">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-amber-100 flex items-center justify-center text-4xl">
                    <svg className="w-16 h-16 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm">
                    <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              
              <label className={`cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {uploading ? 'Uploading...' : 'Change Picture'}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
              
              <p className="text-xs text-amber-500">Supported formats: JPG, PNG, WEBP</p>
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

export default DoctorDashboard;