import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';

const AddDoctor = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const specialties = ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology', 'General Medicine'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('doctors')
        .insert([{
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          phone: formData.phone.trim() || null,
          specialty: formData.specialty,
          password: formData.password,
          status: 'Active'
        }])
        .select();

      if (error) throw error;

      // ✅ SHOW DOCTOR LOGIN CREDENTIALS
      const doctor = data[0];
      const credentials = `
🎉 DOCTOR ADDED SUCCESSFULLY!

📧 Email: ${doctor.email}
🔑 Password: ${doctor.password}
👨‍⚕️ Name: ${doctor.name}
🩺 Specialty: ${doctor.specialty}

💡 Doctor can now login at /login and access dashboard!
      `;
      
      alert(credentials);
      console.log('✅ Doctor added with credentials:', doctor);
      
      // Reset form
      setFormData({ name: '', email: '', phone: '', specialty: '', password: '' });
      navigate('/admin');
      
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-semibold mb-6"
          >
            <span>←</span><span>Back to Dashboard</span>
          </button>
          <div className="bg-white p-8 rounded-3xl shadow-2xl">
            <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <span className="text-3xl text-white">➕</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Add New Doctor</h1>
            <p className="text-xl text-gray-600">Save to Supabase + Get Login Credentials</p>
          </div>
        </div>

        <div className="bg-white p-10 rounded-3xl shadow-2xl border border-gray-100">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-2xl mb-8">
              ❌ {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Full Name *</label>
                <input
                  type="text"
                  placeholder="Dr. John Smith"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 text-lg transition-all disabled:bg-gray-100"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Specialty *</label>
                <select
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 text-lg disabled:bg-gray-100"
                  required
                  disabled={loading}
                >
                  <option value="">Select Specialty</option>
                  {specialties.map((spec) => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Login Email *</label>
                <input
                  type="email"
                  placeholder="john@hospital.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 text-lg transition-all disabled:bg-gray-100"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Phone</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 text-lg disabled:bg-gray-100"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Login Password *</label>
              <input
                type="password"
                placeholder="Secure password (share with doctor)"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 text-lg disabled:bg-gray-100"
                required
                disabled={loading}
              />
            </div>

            <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-3xl p-6">
              <h3 className="font-bold text-lg text-emerald-800 mb-3">📋 After Submit:</h3>
              <ul className="text-sm text-emerald-700 space-y-1">
                <li>✅ Doctor saved to Supabase</li>
                <li>✅ Login credentials shown in popup</li>
                <li>✅ Doctor can login: /login → Doctor Dashboard</li>
                <li>✅ Can set schedule + see patient queue</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-6 px-12 rounded-3xl font-bold text-xl shadow-2xl transition-all ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 hover:shadow-3xl hover:-translate-y-1'
              } text-white`}
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-3">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving Doctor + Generating Credentials...</span>
                </span>
              ) : (
                '🚀 Add Doctor & Get Login Credentials'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddDoctor;
