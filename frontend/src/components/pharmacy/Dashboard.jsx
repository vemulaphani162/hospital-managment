import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

const PharmacyDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [showRequests, setShowRequests] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [inventory, setInventory] = useState({
    name: '',
    type: 'Tablets',
    unit: 'mg',
    company: '',
    stock: '',
    strength: '', // 🆕 Strength of the medicine
  });
  const [imageFile, setImageFile] = useState(null); // 🆕 For image file
  const [uploading, setUploading] = useState(false); // 🆕 For upload state

  const medicineTypes = {
    "Tablets": ["mg"],
    "Capsules": ["mg"],
    "Syrups": ["mL"],
    "Suspensions": ["mL"],
    "Injections": ["mL", "mg"],
    "Drops": ["drops", "mL"],
    "Ointments": ["g"],
    "Creams": ["g"],
    "Gels": ["g"],
    "Lotions": ["mL"],
    "Inhalers": ["mcg"],
    "Powders": ["g", "mg"],
    "Sprays": ["mL", "sprays"],
    "Suppositories": ["mg", "g"],
    "Vaccines": ["mL"]
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('pharmacy_requests')
      .select('*, patients(name)') // ✅ Fetch patient name
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    setRequests(data || []);
    setLoading(false);
  };

  // 🆕 UPLOAD IMAGE TO CLOUDINARY
  const handleImageUpload = async () => {
    if (!imageFile) return null;

    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('upload_preset', 'hospital_preset'); // ⚠️ Make sure this Unsigned Preset exists in Cloudinary
    formData.append('folder', 'medicines');

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dhc3fnbl2/image/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (data.secure_url) {
        return data.secure_url;
      } else {
        console.error('Cloudinary error:', data.error?.message || data);
        alert(`Cloudinary Error: ${data.error?.message}`);
        return null;
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
      return null;
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    setUploading(true);

    let imageUrl = null;
    if (imageFile) {
      imageUrl = await handleImageUpload();
      if (!imageUrl) {
        setUploading(false);
        return; // Stop if upload fails
      }
    }

    const { error } = await supabase.from('medicines').insert([{ ...inventory, image_url: imageUrl }]);
    setUploading(false);

    if (error) {
      alert('Error adding medicine: ' + error.message);
    } else {
      alert('Medicine added to inventory!');
      setInventory({ name: '', type: 'Tablets', unit: 'mg', company: '', stock: '', strength: '' });
      setImageFile(null);
      if (document.getElementById('medicine-image-input')) {
        document.getElementById('medicine-image-input').value = '';
      }
    }
  };

  const completePrescription = async (id) => {
    if (confirm('Issue medicine?')) {
      await supabase.from('pharmacy_requests').update({ status: 'completed' }).eq('id', id);
      fetchRequests();
      alert('Medicine issued!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-xl text-gray-700 font-medium">Loading Pharmacy Dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8 font-sans">
      
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="max-w-7xl mx-auto relative">
        
        {/* Header Section with Gradient */}
        <div className="mb-8 transform hover:scale-[1.02] transition-transform duration-300">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-500/20 border border-blue-100 p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 14H4V6h16v12zM9 8h2v2H9V8zm4 0h2v2h-2V8zm-4 4h2v2H9v-2zm4 0h2v2h-2v-2z"/>
                    </svg>
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Pharmacy Dashboard
                  </h1>
                  <p className="text-gray-600 mt-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Welcome back, <span className="font-semibold text-blue-600">{user.name}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl px-6 py-4 shadow-xl">
                  <span className="text-white/80 text-sm">Pending Requests</span>
                  <p className="text-3xl font-bold text-white">{requests.length}</p>
                </div>
                
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons with Icons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => {
              setShowInventoryForm(!showInventoryForm);
              setShowRequests(false);
            }}
            className={`group relative px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 overflow-hidden ${
              showInventoryForm 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl scale-105' 
                : 'bg-white text-gray-700 hover:text-blue-600 border-2 border-blue-100 hover:border-blue-300 shadow-lg hover:shadow-xl'
            }`}
          >
            <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
            <svg className={`w-5 h-5 ${showInventoryForm ? 'text-white' : 'text-blue-500'}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 3a1 1 0 011-1h6a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V3z" />
              <path d="M3 8a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" />
              <path d="M3 13a1 1 0 011-1h6a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" />
            </svg>
            Add to Inventory
            {!showInventoryForm && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
            )}
          </button>
          
          <button
            onClick={() => {
              setShowRequests(!showRequests);
              setShowInventoryForm(false);
            }}
            className={`group relative px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 overflow-hidden ${
              showRequests 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl scale-105' 
                : 'bg-white text-gray-700 hover:text-blue-600 border-2 border-blue-100 hover:border-blue-300 shadow-lg hover:shadow-xl'
            }`}
          >
            <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
            <svg className={`w-5 h-5 ${showRequests ? 'text-white' : 'text-blue-500'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
            </svg>
            Doctor Requests
            {requests.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold animate-bounce">
                {requests.length}
              </span>
            )}
          </button>
        </div>

        {/* Inventory Form with Enhanced Design */}
        {showInventoryForm && (
          <div className="mb-8 transform transition-all duration-500 animate-slideDown">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-purple-500/20 border border-purple-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-5">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 3a1 1 0 011-1h6a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V3z" />
                    <path d="M3 8a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" />
                    <path d="M3 13a1 1 0 011-1h6a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" />
                  </svg>
                  Add Medicine to Inventory
                </h2>
                <p className="text-blue-100 text-sm mt-1">Fill in the details below to add a new medicine</p>
              </div>
              
              <div className="p-8">
                <form onSubmit={handleAddMedicine} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Medicine Name</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Enter medicine name"
                          value={inventory.name}
                          onChange={(e) => setInventory({ ...inventory, name: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all group-hover:border-blue-200"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 3a1 1 0 011-1h6a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V3z" />
                            <path d="M3 8a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Enter company name"
                          value={inventory.company}
                          onChange={(e) => setInventory({ ...inventory, company: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all group-hover:border-blue-200"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Medicine Type</label>
                      <select
                        value={inventory.type}
                        onChange={(e) => setInventory({ ...inventory, type: e.target.value, unit: medicineTypes[e.target.value][0] })}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all group-hover:border-blue-200"
                      >
                        {Object.keys(medicineTypes).map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Unit</label>
                      <select
                        value={inventory.unit}
                        onChange={(e) => setInventory({ ...inventory, unit: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all group-hover:border-blue-200"
                      >
                        {medicineTypes[inventory.type].map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Strength</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="e.g., 500"
                          value={inventory.strength}
                          onChange={(e) => setInventory({ ...inventory, strength: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all group-hover:border-blue-200"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Quantity</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                            <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <input
                          type="number"
                          placeholder="Enter quantity"
                          value={inventory.stock}
                          onChange={(e) => setInventory({ ...inventory, stock: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all group-hover:border-blue-200"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Medicine Image (Optional)</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <input
                          id="medicine-image-input"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setImageFile(e.target.files[0])}
                          className="w-full pl-10 pr-4 py-2 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-500 file:to-purple-600 file:text-white hover:file:from-blue-600 hover:file:to-purple-700 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6">
                    <button
                      type="submit"
                      disabled={uploading}
                      className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/30 disabled:opacity-50 flex items-center gap-3 overflow-hidden"
                    >
                      <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
                      {uploading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                          <span>Add to Inventory</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Doctor Requests with Enhanced Cards */}
        {showRequests && (
          <div className="transform transition-all duration-500 animate-slideUp">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-500/20 border border-blue-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                      </svg>
                      Pending Prescriptions
                    </h2>
                    <p className="text-blue-100 text-sm mt-1">Review and process doctor requests</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                    <span className="text-white font-bold text-xl">{requests.length}</span>
                    <span className="text-white/80 text-sm ml-1">total</span>
                  </div>
                </div>
              </div>

              <div className="p-8">
                {requests.length > 0 ? (
                  <div className="space-y-4">
                    {requests.map((request, index) => (
                      <div
                        key={request.id}
                        className="group bg-white rounded-2xl border-2 border-gray-100 hover:border-blue-300 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 transform hover:-translate-y-1"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                              <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur-md opacity-0 group-hover:opacity-50 transition-opacity"></div>
                                <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
                                  💊
                                </div>
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-800 text-xl group-hover:text-blue-600 transition-colors">
                                  {request.medicine}
                                </h3>
                                <div className="flex items-center gap-4 mt-2">
                                  <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-sm text-gray-600">
                                      <span className="font-medium">{request.patients?.name || 'Unknown'}</span>
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-xs text-gray-500">
                                      {new Date(request.created_at).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => completePrescription(request.id)}
                              className="group/btn relative px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/30 flex items-center justify-center gap-2 overflow-hidden"
                            >
                              <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></span>
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              ISSUE MEDICINE
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <div className="relative w-32 h-32 mx-auto mb-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
                      <div className="relative w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center">
                        <svg className="w-16 h-16 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">No Pending Prescriptions</h3>
                    <p className="text-gray-500">All prescriptions have been processed successfully</p>
                    <div className="mt-6 inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-600">System is up to date</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.5s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PharmacyDashboard;