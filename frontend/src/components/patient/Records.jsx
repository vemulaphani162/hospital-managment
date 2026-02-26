import { Link } from 'react-router-dom';

const PatientRecords = () => {
  const records = [
    { type: 'Prescription', date: 'Dec 15, 2025', doctor: 'Dr. John Smith', status: 'Active', details: 'Amlodipine 5mg daily' },
    { type: 'Lab Report', date: 'Dec 14, 2025', doctor: 'Lab Team', status: 'Completed', details: 'Blood Test - Normal' },
    { type: 'Prescription', date: 'Dec 10, 2025', doctor: 'Dr. Sarah', status: 'Expired', details: 'Paracetamol 500mg' },
    { type: 'X-Ray Report', date: 'Dec 8, 2025', doctor: 'Radiology', status: 'Completed', details: 'Chest X-Ray - Clear' }
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Medical Records</h1>
          <p className="text-xl text-gray-600">View prescriptions, lab results & history</p>
        </div>
        <Link to="/patient" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Prescriptions */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
            <span className="w-10 h-10 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-2xl flex items-center justify-center mr-4 text-xl">💊</span>
            Prescriptions
          </h2>
          <div className="space-y-4">
            {records.filter(r => r.type === 'Prescription').map((record, index) => (
              <div key={index} className={`p-6 rounded-2xl border transition-all hover:shadow-lg cursor-pointer ${
                record.status === 'Active' ? 'border-purple-200 hover:border-purple-300 hover:bg-purple-50' :
                'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-xl text-gray-900">{record.details}</h3>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                    record.status === 'Active' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {record.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{record.doctor}</span>
                  <span>{record.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lab Results */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
            <span className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl flex items-center justify-center mr-4 text-xl">🧪</span>
            Lab Results
          </h2>
          <div className="space-y-4">
            {records.filter(r => r.type.includes('Report')).map((record, index) => (
              <div key={index} className="p-6 rounded-2xl bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 hover:shadow-lg transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-xl text-gray-900">{record.details}</h3>
                  <span className="px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-bold">
                    View Report
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-700">
                  <span>{record.doctor}</span>
                  <span>{record.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full Medical History */}
      <div className="mt-12 bg-gradient-to-r from-slate-50 to-emerald-50 p-8 rounded-3xl shadow-xl border border-emerald-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Complete Medical History</h2>
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-2xl shadow-lg">
            <thead className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
              <tr>
                <th className="px-8 py-6 text-left font-bold rounded-tl-2xl">Date</th>
                <th className="px-8 py-6 text-left font-bold">Doctor</th>
                <th className="px-8 py-6 text-left font-bold">Service</th>
                <th className="px-8 py-6 text-left font-bold">Status</th>
                <th className="px-8 py-6 text-left font-bold rounded-tr-2xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((record, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-all">
                  <td className="px-8 py-6 font-semibold text-gray-900">{record.date}</td>
                  <td className="px-8 py-6 text-gray-700">{record.doctor}</td>
                  <td className="px-8 py-6 font-medium text-gray-900">{record.type}</td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                      record.status === 'Active' || record.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <button className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all">
                      View Details
                    </button>
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

export default PatientRecords;
