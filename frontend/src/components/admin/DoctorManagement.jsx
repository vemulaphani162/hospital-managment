import { useState } from 'react';

const DoctorManagement = () => {
  const [doctors, setDoctors] = useState([
    { id: 'DOC001', name: 'Dr. John Smith', specialty: 'Cardiology', email: 'john@hospital.com', status: 'Active' },
    { id: 'DOC002', name: 'Dr. Sarah Johnson', specialty: 'Neurology', email: 'sarah@hospital.com', status: 'Active' },
    { id: 'DOC003', name: 'Dr. Mike Brown', specialty: 'Orthopedics', email: 'mike@hospital.com', status: 'Inactive' }
  ]);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    specialty: '',
    email: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newDoctor = { ...formData, status: 'Active' };
    setDoctors([newDoctor, ...doctors]);
    setFormData({ id: '', name: '', specialty: '', email: '' });
  };

  const toggleStatus = (id) => {
    setDoctors(doctors.map(doc =>
      doc.id === id
        ? { ...doc, status: doc.status === 'Active' ? 'Inactive' : 'Active' }
        : doc
    ));
  };

  const deleteDoctor = (id) => {
    setDoctors(doctors.filter(doc => doc.id !== id));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900">Doctor Management</h1>
        <span className="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold rounded-xl">
          ADMIN
        </span>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-xl mb-8 border border-gray-100">
        <h2 className="text-2xl font-bold mb-6">Add New Doctor</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input
            type="text"
            placeholder="Doctor ID (DOC001)"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            className="p-4 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-200"
            required
          />
          <input
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="p-4 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-200"
            required
          />
          <input
            type="text"
            placeholder="Specialty"
            value={formData.specialty}
            onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
            className="p-4 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-200 md:col-span-2"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="p-4 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-200 md:col-span-2"
            required
          />
          <button
            type="submit"
            className="md:col-span-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white py-4 px-8 rounded-2xl font-bold text-lg hover:from-emerald-600 hover:to-green-700 shadow-xl hover:shadow-2xl transition-all"
          >
            Add Doctor
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">
            All Doctors ({doctors.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">ID</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Name</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Specialty</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Email</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doctor) => (
                <tr key={doctor.id} className="border-t hover:bg-gray-50 transition-all">
                  <td className="px-6 py-4 font-mono font-bold text-blue-600">{doctor.id}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{doctor.name}</td>
                  <td className="px-6 py-4 text-gray-700">{doctor.specialty}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{doctor.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      doctor.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {doctor.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleStatus(doctor.id)}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-sm rounded-xl transition-all"
                      >
                        {doctor.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => deleteDoctor(doctor.id)}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-xl transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DoctorManagement;
