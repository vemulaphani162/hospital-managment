import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabase';

const AdminDashboard = () => {
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🆕 DYNAMIC LAB FORM STATE
  const [labForm, setLabForm] = useState({ 
    name: '', 
    testFields: [{ id: Date.now(), name: '' }] 
  });

  // 🆕 ASSISTANT DOCTOR FORM STATE (specialty removed)
  const [assistantDoctorForm, setAssistantDoctorForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: ''
  });

  // ✅ FETCH ALL DATA
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Doctors
    const { data: doctorsData } = await supabase.from('doctors').select('*');
    setDoctors(doctorsData || []);
    
    // Patients  
    const { data: patientsData } = await supabase.from('patients').select('*');
    setPatients(patientsData || []);
    
    // 🆕 LABS
    const { data: labsData } = await supabase.from('labs').select('*');
    setLabs(labsData || []);
    
    setLoading(false);
  };

  // ✅ DELETE FUNCTIONS
  const deleteDoctor = async (id) => {
    if (confirm('Delete doctor?')) {
      await supabase.from('doctors').delete().eq('id', id);
      fetchData();
      alert(' Doctor deleted!');
    }
  };

  const deletePatient = async (id) => {
    if (confirm('Delete patient?')) {
      await supabase.from('patients').delete().eq('id', id);
      fetchData();
      alert(' Patient deleted!');
    }
  };

  const deleteLab = async (id) => {
    if (confirm('Delete lab?')) {
      await supabase.from('labs').delete().eq('id', id);
      fetchData();
      alert(' Lab deleted!');
    }
  };

  // 🆕 DYNAMIC LAB FUNCTIONS
  const addLabTestField = () => {
    setLabForm(prev => ({
      ...prev,
      testFields: [...prev.testFields, { id: Date.now(), name: '' }]
    }));
  };

  const removeLabTestField = (id) => {
    setLabForm(prev => ({
      ...prev,
      testFields: prev.testFields.filter(field => field.id !== id)
    }));
  };

  const updateLabTestField = (id, value) => {
    setLabForm(prev => ({
      ...prev,
      testFields: prev.testFields.map(field => 
        field.id === id ? { ...field, name: value } : field
      )
    }));
  };

  const addLab = async () => {
    if (!labForm.name.trim()) {
      alert('Enter lab name!');
      return;
    }
    
    const tests = labForm.testFields
      .filter(t => t.name.trim())
      .map(t => t.name.trim());
    
    if (tests.length === 0) {
      alert('Add at least 1 test!');
      return;
    }
    
    const { error } = await supabase
      .from('labs')
      .insert([{ 
        name: labForm.name.trim(), 
        available_tests: tests 
      }]);
    
    if (!error) {
      setLabForm({ name: '', testFields: [{ id: Date.now(), name: '' }] });
      fetchData();
      alert(` "${labForm.name}" added with ${tests.length} tests!`);
    } else {
      alert('Error: ' + error.message);
    }
  };

  // 🆕 ADD ASSISTANT DOCTOR FUNCTION (specialty removed, table: assistant_doctor)
  const addAssistantDoctor = async () => {
    const { full_name, phone, email, password } = assistantDoctorForm;
    
    if (!full_name || !email || !password) {
      alert('Please fill all required fields!');
      return;
    }

    try {
      const { error } = await supabase
        .from('assistant_doctor')  // ✅ Correct table name
        .insert([{
          full_name: full_name.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim() // Store password (use hashing in production)
        }]);

      if (!error) {
        // Reset form
        setAssistantDoctorForm({
          full_name: '',
          phone: '',
          email: '',
          password: ''
        });
        fetchData();
        alert(` "${full_name}" added as Assistant Doctor!`);
      } else {
        alert(' Error: ' + error.message);
      }
    } catch (error) {
      alert(' Failed to add doctor: ' + error.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-600">Loading dashboard...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
          <p className="text-xl text-gray-600 animate-pulse">
            {doctors.length} Doctors | {patients.length} Patients | {labs.length} Labs
          </p>
        </div>
        <span className="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold rounded-xl shadow-lg">ADMIN</span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl border border-gray-100 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Doctors</p>
              <p className="text-3xl font-bold text-gray-800">{doctors.length}</p>
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">Supabase</span>
            </div>
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-all text-white text-2xl">
              MD
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl border border-gray-100 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Patients</p>
              <p className="text-3xl font-bold text-gray-800">{patients.length}</p>
              <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full">Supabase</span>
            </div>
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white text-2xl">
              PT
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl border border-gray-100 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Labs</p>
              <p className="text-3xl font-bold text-gray-800">{labs.length}</p>
              <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-full">Supabase</span>
            </div>
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-all text-white text-2xl">
              LB
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Appointments</p>
              <p className="text-3xl font-bold text-gray-800">45</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-white text-2xl">
              AP
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        <Link to="/admin/add-doctor" className="group bg-gradient-to-r from-emerald-500 to-green-600 text-white p-8 rounded-3xl shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform text-2xl">+</div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Add Doctor</h3>
              <p className="opacity-90">Total: {doctors.length}</p>
            </div>
          </div>
        </Link>

        <Link to="/admin/patients" className="group bg-gradient-to-r from-purple-500 to-violet-600 text-white p-8 rounded-3xl shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform text-2xl">👥</div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Manage Patients</h3>
              <p className="opacity-90">Total: {patients.length}</p>
            </div>
          </div>
        </Link>

        <button onClick={() => document.getElementById('lab-section').scrollIntoView({behavior: 'smooth'})} 
                className="group bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-8 rounded-3xl shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform text-2xl">🔬</div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Manage Labs</h3>
              <p className="opacity-90">Total: {labs.length}</p>
            </div>
          </div>
        </button>
      </div>

      {/* 🆕 ASSISTANT DOCTOR FORM - SPECIALTY REMOVED */}
      <div id="assistant-doctor-section" className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-3xl shadow-lg mb-8 border border-blue-200">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Add Assistant Doctor
          </h2>
          <button onClick={fetchData} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all">
            Refresh
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg">
          {/* Full Name */}
          <div>
            <label className="block text-lg font-bold text-blue-800 mb-3">Full Name</label>
            <input
              type="text"
              placeholder="Dr. John Smith"
              value={assistantDoctorForm.full_name}
              onChange={(e) => setAssistantDoctorForm({ ...assistantDoctorForm, full_name: e.target.value })}
              className="w-full p-4 border border-gray-200 rounded-2xl text-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-lg font-bold text-blue-800 mb-3">Phone</label>
            <input
              type="tel"
              placeholder="9876543210"
              value={assistantDoctorForm.phone}
              onChange={(e) => setAssistantDoctorForm({ ...assistantDoctorForm, phone: e.target.value })}
              className="w-full p-4 border border-gray-200 rounded-2xl text-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
            />
          </div>

          {/* Email */}
          <div className="lg:col-span-2">
            <label className="block text-lg font-bold text-blue-800 mb-3">Email</label>
            <input
              type="email"
              placeholder="john.smith@hospital.com"
              value={assistantDoctorForm.email}
              onChange={(e) => setAssistantDoctorForm({ ...assistantDoctorForm, email: e.target.value })}
              className="w-full p-4 border border-gray-200 rounded-2xl text-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
            />
          </div>

          {/* Password */}
          <div className="lg:col-span-2">
            <label className="block text-lg font-bold text-blue-800 mb-3">Password</label>
            <input
              type="password"
              placeholder="Enter secure password"
              value={assistantDoctorForm.password}
              onChange={(e) => setAssistantDoctorForm({ ...assistantDoctorForm, password: e.target.value })}
              className="w-full p-4 border border-gray-200 rounded-2xl text-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
            />
          </div>

          {/* CREATE DOCTOR BUTTON */}
          <button
            onClick={addAssistantDoctor}
            disabled={!assistantDoctorForm.full_name || !assistantDoctorForm.email || !assistantDoctorForm.password}
            className="col-span-full lg:col-span-1 p-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xl rounded-3xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            Create Assistant Doctor
          </button>
        </div>
      </div>

      {/* 🆕 DYNAMIC LAB MANAGEMENT */}
      <div id="lab-section" className="bg-gradient-to-r from-purple-50 to-indigo-50 p-8 rounded-3xl shadow-lg mb-8 border border-purple-200">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Lab Management
          </h2>
          <button onClick={fetchData} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl transition-all">
            Refresh Labs
          </button>
        </div>

        {/* 🆕 DYNAMIC LAB FORM */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg mb-8">
          {/* LAB NAME */}
          <input
            type="text"
            placeholder="Lab Name (Internal Lab, SRL Diagnostics, Metropolis...)"
            value={labForm.name}
            onChange={(e) => setLabForm({ ...labForm, name: e.target.value })}
            className="p-4 border border-gray-200 rounded-2xl text-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-100 col-span-2 md:col-span-1 bg-white"
          />
          
          {/* DYNAMIC TEST FIELDS */}
          <div className="md:col-span-3">
            <label className="block text-lg font-bold text-purple-800 mb-4 flex items-center">
              Available Tests 
              <span className="ml-3 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold">
                {labForm.testFields.filter(t => t.name.trim()).length} tests
              </span>
            </label>
            
            <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
              {labForm.testFields.map((field) => (
                <div key={field.id} className="flex items-center gap-3 p-4 bg-purple-50 rounded-2xl border border-purple-100 hover:border-purple-300 group transition-all hover:shadow-sm">
                  <input
                    type="text"
                    placeholder={`Test ${labForm.testFields.indexOf(field) + 1} (CBC, Lipid Profile, Thyroid TSH, LFT, KFT...)`}
                    value={field.name}
                    onChange={(e) => updateLabTestField(field.id, e.target.value)}
                    className="flex-1 p-3 border border-gray-200 rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-100 text-lg bg-white"
                  />
                  {labForm.testFields.length > 1 && (
                    <button
                      onClick={() => removeLabTestField(field.id)}
                      className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold text-sm transition-all group-hover:scale-105 flex-shrink-0 shadow-md hover:shadow-lg"
                      title="Remove Test"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {/* ➕ ADD TEST BUTTON */}
            <button
              onClick={addLabTestField}
              className="w-full p-4 border-2 border-dashed border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-2xl transition-all hover:border-purple-400 flex items-center justify-center gap-2 hover:shadow-md text-lg mb-4"
            >
              + Add Another Test Field
            </button>
          </div>
          
          {/* CREATE LAB BUTTON */}
          <button
            onClick={addLab}
            disabled={!labForm.name.trim() || labForm.testFields.filter(t => t.name.trim()).length === 0}
            className="col-span-full lg:col-span-1 p-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all text-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Lab 
            <span className="block text-sm mt-1">
              ({labForm.testFields.filter(t => t.name.trim()).length} tests)
            </span>
          </button>
        </div>

        {/* LABS LIST */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {labs.map((lab) => (
            <div key={lab.id} className="group bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl border border-gray-200 hover:border-purple-300 transition-all overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  LB
                </div>
                <button
                  onClick={() => deleteLab(lab.id)}
                  className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all opacity-0 group-hover:opacity-100 group-hover:scale-105 shadow-md hover:shadow-lg"
                  title="Delete Lab"
                >
                  Delete
                </button>
              </div>
              <h3 className="font-bold text-xl text-gray-800 mb-3 truncate">{lab.name}</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {lab.available_tests.slice(0, 4).map((test) => (
                  <span key={test} className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium border border-purple-100">
                    {test}
                  </span>
                ))}
                {lab.available_tests.length > 4 && (
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                    +{lab.available_tests.length - 4} more
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {lab.available_tests.length} tests total
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Doctors List */}
      <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-200 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Doctors ({doctors.length})</h3>
          <button onClick={fetchData} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all">Refresh</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <div key={doctor.id} className="p-6 bg-gray-50 rounded-2xl hover:shadow-lg transition-all border border-gray-200 hover:border-blue-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                  DR
                </div>
                <button onClick={() => deleteDoctor(doctor.id)} className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-all group-hover:scale-105">
                  Delete
                </button>
              </div>
              <h4 className="font-bold text-xl text-gray-800 mb-2">{doctor.name}</h4>
              <p className="text-blue-600 font-semibold mb-2 px-3 py-1 bg-blue-50 rounded-full inline-block text-sm border border-blue-100">{doctor.specialty}</p>
              <p className="text-sm text-gray-600 mb-2 truncate">{doctor.email}</p>
              <p className="text-xs text-gray-500">{doctor.phone || 'No phone'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Patients List */}
      <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Patients ({patients.length})</h3>
          <button onClick={fetchData} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-all">Refresh</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.slice(0, 6).map((patient) => (
            <div key={patient.id} className="p-6 bg-gray-50 rounded-2xl hover:shadow-lg transition-all border border-gray-200 hover:border-emerald-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                  PT
                </div>
                <button onClick={() => deletePatient(patient.id)} className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-all group-hover:scale-105">
                  Delete
                </button>
              </div>
              <h4 className="font-bold text-xl text-gray-800 mb-2">{patient.name}</h4>
              <p className="text-sm text-gray-600 mb-2 truncate">{patient.email}</p>
              {patient.phone && <p className="text-xs text-gray-500 mb-1">{patient.phone}</p>}
              {patient.age && <p className="text-xs text-blue-600 font-medium">Age: {patient.age}</p>}
            </div>
          ))}
        </div>
        {patients.length > 6 && (
          <div className="text-center mt-8">
            <Link to="/admin/patients" className="text-blue-600 hover:text-blue-700 font-semibold underline">
              View All {patients.length} Patients →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;