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

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 bg-black rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header with animated gradient */}
        <div className="relative mb-16">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-black rounded-[3rem] transform -skew-y-1"></div>
          <div className="relative bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-10 border border-gray-200/50">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="animate-fade-in-left">
                <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-4 tracking-tight">
                  Admin
                  <span className="bg-gradient-to-r from-gray-900 to-black bg-clip-text text-transparent ml-3">
                    Dashboard
                  </span>
                </h1>
                <div className="flex items-center space-x-4 text-gray-600">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-lg font-medium">Live</span>
                  </div>
                  <p className="text-xl font-semibold">
                    <span className="text-black">{doctors.length}</span> Doctors 
                    <span className="mx-2">•</span>
                    <span className="text-black">{patients.length}</span> Patients 
                    <span className="mx-2">•</span>
                    <span className="text-black">{labs.length}</span> Labs
                  </p>
                </div>
              </div>
              <div className="relative group animate-fade-in-right">
                <div className="absolute inset-0 bg-black rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <span className="relative px-8 py-4 bg-black text-white font-black text-xl rounded-2xl inline-block transform hover:scale-105 transition-all duration-300 shadow-xl">
                  ADMIN
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards with animations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {[
            { label: 'Doctors', count: doctors.length, icon: 'MD', delay: '0s' },
            { label: 'Patients', count: patients.length, icon: 'PT', delay: '0.1s' },
            { label: 'Labs', count: labs.length, icon: 'LB', delay: '0.2s' },
            { label: 'Appointments', count: '45', icon: 'AP', delay: '0.3s' }
          ].map((stat, index) => (
            <div
              key={index}
              className="group relative animate-fade-in-up"
              style={{ animationDelay: stat.delay }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 rounded-3xl transform group-hover:scale-105 transition-transform duration-300 opacity-0 group-hover:opacity-100 blur-xl"></div>
              <div className="relative bg-white rounded-3xl shadow-xl p-8 border border-gray-100 hover:border-gray-300 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1 tracking-wider uppercase">
                      {stat.label}
                    </p>
                    <p className="text-4xl font-black text-gray-900 mb-2">{stat.count}</p>
                    <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                      Supabase
                    </span>
                  </div>
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-900 to-black rounded-2xl flex items-center justify-center text-white text-2xl font-bold transform group-hover:rotate-12 transition-all duration-300 shadow-lg">
                    {stat.icon}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions with animations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <Link
            to="/admin/add-doctor"
            className="group relative animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black rounded-3xl transform group-hover:scale-105 transition-transform duration-300 blur-xl opacity-0 group-hover:opacity-30"></div>
            <div className="relative bg-gradient-to-r from-gray-900 to-black text-white p-8 rounded-3xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-300">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-all duration-300 text-3xl font-bold backdrop-blur-sm border border-white/20">
                  +
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Add Doctor</h3>
                  <p className="text-white/70 text-lg">Total: {doctors.length}</p>
                </div>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/patients"
            className="group relative animate-fade-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-900 rounded-3xl transform group-hover:scale-105 transition-transform duration-300 blur-xl opacity-0 group-hover:opacity-30"></div>
            <div className="relative bg-gradient-to-r from-gray-800 to-gray-900 text-white p-8 rounded-3xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-300">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-all duration-300 text-3xl backdrop-blur-sm border border-white/20">
                  👥
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Manage Patients</h3>
                  <p className="text-white/70 text-lg">Total: {patients.length}</p>
                </div>
              </div>
            </div>
          </Link>

          <button
            onClick={() => document.getElementById('lab-section').scrollIntoView({ behavior: 'smooth' })}
            className="group relative animate-fade-in-up"
            style={{ animationDelay: '0.3s' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black rounded-3xl transform group-hover:scale-105 transition-transform duration-300 blur-xl opacity-0 group-hover:opacity-30"></div>
            <div className="relative bg-gradient-to-r from-gray-900 to-black text-white p-8 rounded-3xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-300">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-all duration-300 text-3xl backdrop-blur-sm border border-white/20">
                  🔬
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Manage Labs</h3>
                  <p className="text-white/70 text-lg">Total: {labs.length}</p>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Assistant Doctor Form */}
        <div
          id="assistant-doctor-section"
          className="relative mb-16 animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 rounded-[3rem] transform rotate-1"></div>
          <div className="relative bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-10 border border-gray-200/50">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">
                Add Assistant
                <span className="block text-2xl font-medium text-gray-600 mt-2">Doctor</span>
              </h2>
              <button
                onClick={fetchData}
                className="group px-8 py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </span>
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  placeholder="Dr. John Smith"
                  value={assistantDoctorForm.full_name}
                  onChange={(e) => setAssistantDoctorForm({ ...assistantDoctorForm, full_name: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all duration-300 placeholder-gray-400"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider">Phone</label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={assistantDoctorForm.phone}
                  onChange={(e) => setAssistantDoctorForm({ ...assistantDoctorForm, phone: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all duration-300 placeholder-gray-400"
                />
              </div>

              {/* Email */}
              <div className="lg:col-span-2 space-y-2">
                <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  placeholder="john.smith@hospital.com"
                  value={assistantDoctorForm.email}
                  onChange={(e) => setAssistantDoctorForm({ ...assistantDoctorForm, email: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all duration-300 placeholder-gray-400"
                />
              </div>

              {/* Password */}
              <div className="lg:col-span-2 space-y-2">
                <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  placeholder="Enter secure password"
                  value={assistantDoctorForm.password}
                  onChange={(e) => setAssistantDoctorForm({ ...assistantDoctorForm, password: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all duration-300 placeholder-gray-400"
                />
              </div>

              {/* CREATE DOCTOR BUTTON */}
              <button
                onClick={addAssistantDoctor}
                disabled={!assistantDoctorForm.full_name || !assistantDoctorForm.email || !assistantDoctorForm.password}
                className="col-span-full lg:col-span-1 p-6 bg-gray-900 hover:bg-black text-white font-black text-xl rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
              >
                <span>Create Assistant Doctor</span>
                <span className="text-2xl">→</span>
              </button>
            </div>
          </div>
        </div>

        {/* Lab Management */}
        <div
          id="lab-section"
          className="relative mb-16 animate-fade-in-up"
          style={{ animationDelay: '0.3s' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 rounded-[3rem] transform -rotate-1"></div>
          <div className="relative bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-10 border border-gray-200/50">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">
                Lab
                <span className="block text-2xl font-medium text-gray-600 mt-2">Management</span>
              </h2>
              <button
                onClick={fetchData}
                className="group px-8 py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh Labs</span>
                </span>
              </button>
            </div>

            {/* Lab Form */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 p-8 bg-gray-50 rounded-3xl shadow-inner mb-8">
              {/* LAB NAME */}
              <div className="col-span-2 md:col-span-1 space-y-2">
                <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider">Lab Name</label>
                <input
                  type="text"
                  placeholder="Internal Lab, SRL Diagnostics..."
                  value={labForm.name}
                  onChange={(e) => setLabForm({ ...labForm, name: e.target.value })}
                  className="w-full p-4 bg-white border border-gray-200 rounded-2xl text-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all duration-300"
                />
              </div>
              
              {/* DYNAMIC TEST FIELDS */}
              <div className="md:col-span-3">
                <label className="flex items-center justify-between text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                  <span>Available Tests</span>
                  <span className="bg-gray-200 text-gray-800 px-4 py-2 rounded-full text-sm font-bold">
                    {labForm.testFields.filter(t => t.name.trim()).length} tests
                  </span>
                </label>
                
                <div className="space-y-3 mb-4 max-h-96 overflow-y-auto pr-2">
                  {labForm.testFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-200 hover:border-gray-400 group transition-all duration-300 shadow-sm hover:shadow">
                      <input
                        type="text"
                        placeholder={`Test ${index + 1} (CBC, Lipid Profile...)`}
                        value={field.name}
                        onChange={(e) => updateLabTestField(field.id, e.target.value)}
                        className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-gray-400 focus:ring-2 focus:ring-gray-200 text-lg transition-all duration-300"
                      />
                      {labForm.testFields.length > 1 && (
                        <button
                          onClick={() => removeLabTestField(field.id)}
                          className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                          title="Remove Test"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* ADD TEST BUTTON */}
                <button
                  onClick={addLabTestField}
                  className="w-full p-4 border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-2xl transition-all duration-300 hover:border-gray-400 flex items-center justify-center gap-2 hover:shadow-md text-lg mb-4 group"
                >
                  <span className="text-2xl group-hover:rotate-90 transition-transform duration-300">+</span>
                  Add Another Test Field
                </button>
              </div>
              
              {/* CREATE LAB BUTTON */}
              <button
                onClick={addLab}
                disabled={!labForm.name.trim() || labForm.testFields.filter(t => t.name.trim()).length === 0}
                className="col-span-full lg:col-span-1 p-6 bg-gray-900 hover:bg-black text-white font-black text-xl rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Create Lab
                <span className="block text-sm mt-2 font-normal text-gray-300">
                  ({labForm.testFields.filter(t => t.name.trim()).length} tests)
                </span>
              </button>
            </div>

            {/* LABS LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {labs.map((lab, index) => (
                <div
                  key={lab.id}
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl border border-gray-200 hover:border-gray-400 transition-all duration-300 overflow-hidden animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-gray-900 to-black rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        LB
                      </div>
                      <button
                        onClick={() => deleteLab(lab.id)}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100 transform group-hover:scale-105 shadow-md hover:shadow-lg"
                        title="Delete Lab"
                      >
                        Delete
                      </button>
                    </div>
                    <h3 className="font-black text-xl text-gray-900 mb-3 truncate">{lab.name}</h3>
                    <div className="flex flex-wrap gap-2 mb-4 min-h-[60px]">
                      {lab.available_tests.slice(0, 4).map((test) => (
                        <span key={test} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200 hover:bg-gray-200 transition-colors duration-200">
                          {test}
                        </span>
                      ))}
                      {lab.available_tests.length > 4 && (
                        <span className="bg-gray-200 text-gray-600 px-3 py-1.5 rounded-full text-xs font-medium">
                          +{lab.available_tests.length - 4}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-medium">
                      {lab.available_tests.length} tests total
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Doctors List */}
        <div className="relative mb-16 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-gray-200">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-black text-gray-900">
                Doctors
                <span className="ml-3 text-lg font-medium text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
                  {doctors.length}
                </span>
              </h3>
              <button onClick={fetchData} className="px-6 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                Refresh
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doctor, index) => (
                <div
                  key={doctor.id}
                  className="group bg-gray-50 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-gray-400 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-gray-900 to-black rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      DR
                    </div>
                    <button onClick={() => deleteDoctor(doctor.id)} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100 transform group-hover:scale-105 shadow-md hover:shadow-lg">
                      Delete
                    </button>
                  </div>
                  <h4 className="font-black text-xl text-gray-900 mb-2">{doctor.name}</h4>
                  <span className="inline-block bg-gray-200 text-gray-800 px-4 py-1.5 rounded-full text-sm font-semibold mb-3 border border-gray-300">
                    {doctor.specialty}
                  </span>
                  <p className="text-sm text-gray-600 mb-2 truncate">{doctor.email}</p>
                  <p className="text-xs text-gray-500 font-medium">{doctor.phone || 'No phone'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Patients List */}
        <div className="relative animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-gray-200">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-black text-gray-900">
                Patients
                <span className="ml-3 text-lg font-medium text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
                  {patients.length}
                </span>
              </h3>
              <button onClick={fetchData} className="px-6 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                Refresh
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {patients.slice(0, 6).map((patient, index) => (
                <div
                  key={patient.id}
                  className="group bg-gray-50 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-gray-400 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      PT
                    </div>
                    <button onClick={() => deletePatient(patient.id)} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100 transform group-hover:scale-105 shadow-md hover:shadow-lg">
                      Delete
                    </button>
                  </div>
                  <h4 className="font-black text-xl text-gray-900 mb-2">{patient.name}</h4>
                  <p className="text-sm text-gray-600 mb-2 truncate">{patient.email}</p>
                  {patient.phone && <p className="text-xs text-gray-500 mb-1 font-medium">{patient.phone}</p>}
                  {patient.age && <p className="text-xs text-gray-700 font-semibold">Age: {patient.age}</p>}
                </div>
              ))}
            </div>
            {patients.length > 6 && (
              <div className="text-center mt-10">
                <Link to="/admin/patients" className="inline-flex items-center space-x-2 text-gray-900 hover:text-black font-bold text-lg group">
                  <span>View All {patients.length} Patients</span>
                  <span className="text-2xl group-hover:translate-x-2 transition-transform duration-300">→</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Animation Keyframes */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .animate-fade-in-left {
          animation: fadeInLeft 0.6s ease-out forwards;
        }

        .animate-fade-in-right {
          animation: fadeInRight 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;