'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Store, ArrowRight, ArrowLeft, User, X, MapPin, ChefHat, Package,
  Edit3, Check, AlertCircle, Loader2
} from 'lucide-react';

const SellerDashboardContent = () => {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const [profileComplete, setProfileComplete] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [dashboardStats, setDashboardStats] = useState([
    { title: "Available Materials", value: "0", icon: <Package className="w-6 h-6" />, color: "from-orange-500 to-red-600" },
    { title: "Location", value: "Not set", icon: <Store className="w-6 h-6" />, color: "from-blue-500 to-purple-600" }
  ]);
  const [sellerInfo, setSellerInfo] = useState(null);
  
  const [formData, setFormData] = useState({
    location: {
      latitude: '',
      longitude: '',
      address: ''
    },
    availableMaterials: []
  });

  const commonMaterials = [
    { id: '65f8d3a1c1b8a6d3a4f8b9a1', name: "Flour" },
    { id: '65f8d3a1c1b8a6d3a4f8b9a2', name: "Rice" },
    { id: '65f8d3a1c1b8a6d3a4f8b9a3', name: "Vegetables" },
    { id: '65f8d3a1c1b8a6d3a4f8b9a4', name: "Fruits" },
    { id: '65f8d3a1c1b8a6d3a4f8b9a5', name: "Spices" },
    { id: '65f8d3a1c1b8a6d3a4f8b9a6', name: "Oil" },
    { id: '65f8d3a1c1b8a6d3a4f8b9a7', name: "Dairy" },
    { id: '65f8d3a1c1b8a6d3a4f8b9a8', name: "Meat" },
    { id: '65f8d3a1c1b8a6d3a4f8b9a9', name: "Poultry" },
    { id: '65f8d3a1c1b8a6d3a4f8b9b0', name: "Seafood" }
  ];

  useEffect(() => {
    console.log('UserId from URL:', userId);
    if (userId) {
      fetchSellerData(userId);
    } else {
      console.error('No userId found in URL parameters');
      setShowProfileForm(true);
    }
  }, [userId]);

  const fetchSellerData = async (sellerId) => {
    try {
      const response = await fetch(`/api/raw-sellers/update/${sellerId}`);
      const data = await response.json();
      
      if (data.success && data.seller) {
        setSellerInfo(data.seller);
        setFormData({
          location: data.seller.location || {
            latitude: '',
            longitude: '',
            address: ''
          },
          availableMaterials: data.seller.availableMaterials || []
        });
        
        const isComplete = data.seller.location && 
                          data.seller.location.address && 
                          data.seller.availableMaterials && 
                          data.seller.availableMaterials.length > 0;
        
        setProfileComplete(isComplete);
        setShowProfileForm(!isComplete);
        updateDashboardStats(data.seller);
      }
    } catch (error) {
      console.error('Error fetching seller data:', error);
      setShowProfileForm(true);
    }
  };

  const updateDashboardStats = (sellerData) => {
    setDashboardStats([
      { 
        title: "Available Materials", 
        value: sellerData.availableMaterials?.length?.toString() || "0", 
        icon: <Package className="w-6 h-6" />, 
        color: "from-orange-500 to-red-600" 
      },
      { 
        title: "Location", 
        value: sellerData.location?.address ? "Set" : "Not set", 
        icon: <Store className="w-6 h-6" />, 
        color: "from-blue-500 to-purple-600" 
      }
    ]);
  };

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            latitude: latitude,
            longitude: longitude
          }
        }));

        try {
          const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.results && data.results.length > 0) {
              const address = data.results[0].formatted;
              setFormData(prev => ({
                ...prev,
                location: {
                  ...prev.location,
                  address: address
                }
              }));
            }
          }
        } catch (error) {
          console.log('Could not fetch address from coordinates:', error);
        }

        setIsGettingLocation(false);
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location access denied by user.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
            break;
        }
        alert(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const validateStep = (step) => {
    const errors = {};
    
    if (step === 1) {
      if (!formData.location.address.trim()) errors.address = 'Address is required';
      if (!formData.location.latitude || isNaN(formData.location.latitude)) {
        errors.latitude = 'Valid latitude is required';
      }
      if (!formData.location.longitude || isNaN(formData.location.longitude)) {
        errors.longitude = 'Valid longitude is required';
      }
    }
    
    if (step === 2) {
      if (formData.availableMaterials.length === 0) {
        errors.availableMaterials = 'Select at least one material';
      }
      
      formData.availableMaterials.forEach((material, index) => {
        if (!material.price || material.price <= 0) {
          errors[`price_${index}`] = 'Price must be greater than 0';
        }
        if (!material.quantityAvailable || material.quantityAvailable <= 0) {
          errors[`quantity_${index}`] = 'Quantity must be greater than 0';
        }
      });
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('location.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({ 
        ...prev, 
        location: { 
          ...prev.location, 
          [field]: field === 'latitude' || field === 'longitude' ? parseFloat(value) || '' : value 
        } 
      }));
      
      if (formErrors[field]) {
        setFormErrors(prev => ({ ...prev, [field]: undefined }));
      }
    }
  };

  const handleMaterialChange = (materialId, field, value) => {
    setFormData(prev => ({
      ...prev,
      availableMaterials: prev.availableMaterials.map(material =>
        material.materialId === materialId
          ? { ...material, [field]: field === 'price' || field === 'quantityAvailable' ? parseFloat(value) || 0 : value }
          : material
      )
    }));
  };

  const handleMultiSelect = (e, material) => {
    const { checked } = e.target;
    setFormData(prev => ({
      ...prev,
      availableMaterials: checked 
        ? [...prev.availableMaterials, { 
            materialId: material.id, 
            price: 0, 
            quantityAvailable: 0 
          }]
        : prev.availableMaterials.filter(item => item.materialId !== material.id)
    }));
    
    if (formErrors.availableMaterials) {
      setFormErrors(prev => ({ ...prev, availableMaterials: undefined }));
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/raw-sellers/update/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: formData.location,
          availableMaterials: formData.availableMaterials
        }),
      });

      if (!response.ok) throw new Error('Failed to update seller details');

      const result = await response.json();
      if (result.success) {
        setShowProfileForm(false);
        await fetchSellerData(userId);
      }
    } catch (error) {
      console.error('Error updating seller details:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeForm = () => {
    if (profileComplete) {
      setShowProfileForm(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 relative overflow-hidden">
      {/* Background Design Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-orange-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-red-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-yellow-200/15 rounded-full blur-2xl"></div>
        
        <div className="absolute inset-0 opacity-3">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.01) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.01) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
      </div>

      <div className={`relative z-10 p-6 transition-all duration-300 ${showProfileForm ? 'blur-sm pointer-events-none' : ''}`}>
        {profileComplete ? (
          <>
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg mr-4">
                  <ChefHat className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
                  <p className="text-gray-600">Manage your raw materials inventory and location</p>
                </div>
              </div>

              {/* Welcome Card */}
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-100 to-red-100 rounded-full transform translate-x-16 -translate-y-16"></div>
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to your dashboard!</h2>
                  <p className="text-gray-600">Track your materials, manage your location, and grow your business.</p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {dashboardStats.map((stat, index) => (
                <div key={index} className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                      <div className="text-white">{stat.icon}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Location Information */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 mb-8">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-orange-500" />
                  Your Location
                </h2>
                <button 
                  onClick={() => {
                    setShowProfileForm(true);
                    setCurrentStep(1);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Update
                </button>
              </div>
              
              {sellerInfo?.location ? (
                <div className="space-y-3">
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-sm font-medium text-gray-500 mb-1">Address</p>
                    <p className="text-gray-900">{sellerInfo.location.address}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-2xl">
                      <p className="text-sm font-medium text-gray-500 mb-1">Latitude</p>
                      <p className="text-gray-900">{sellerInfo.location.latitude}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl">
                      <p className="text-sm font-medium text-gray-500 mb-1">Longitude</p>
                      <p className="text-gray-900">{sellerInfo.location.longitude}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No location information available</p>
                </div>
              )}
            </div>

            {/* Available Materials */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Package className="w-5 h-5 mr-2 text-orange-500" />
                  Available Materials
                </h2>
                <button 
                  onClick={() => {
                    setShowProfileForm(true);
                    setCurrentStep(2);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Update
                </button>
              </div>
              
              {sellerInfo?.availableMaterials?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sellerInfo.availableMaterials.map((material, index) => {
                    const materialInfo = commonMaterials.find(m => m.id === material.materialId);
                    return (
                      <div key={index} className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border border-orange-100">
                        <h3 className="font-bold text-gray-900 mb-3">
                          {materialInfo?.name || `Material ${material.materialId}`}
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Price per kg:</span>
                            <span className="font-semibold text-gray-900">₹{material.price}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Available:</span>
                            <span className="font-semibold text-gray-900">{material.quantityAvailable} kg</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No materials added yet</p>
                  <button 
                    onClick={() => {
                      setShowProfileForm(true);
                      setCurrentStep(2);
                    }}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                  >
                    Add Materials
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center bg-white rounded-3xl shadow-xl border border-gray-100 p-12 max-w-md mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg mb-6">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Complete Your Profile</h2>
              <p className="text-gray-600 mb-8">Please set up your location and materials to access the dashboard</p>
              <button
                onClick={() => setShowProfileForm(true)}
                className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile Setup Modal */}
      {showProfileForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
            <div className="p-8">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg mr-4">
                    <ChefHat className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {currentStep === 1 ? 'Set Your Location' : 'Select Available Materials'}
                    </h2>
                    <p className="text-gray-600">
                      {currentStep === 1 ? 'Help customers find you' : 'What do you have available?'}
                    </p>
                  </div>
                </div>
                {profileComplete && (
                  <button
                    onClick={closeForm}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                )}
              </div>

              {/* Progress Indicator */}
              <div className="flex items-center mb-8">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= 1 ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep >= 1 ? <Check className="w-5 h-5" /> : '1'}
                </div>
                <div className={`flex-1 h-2 mx-4 rounded-full ${currentStep >= 2 ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'bg-gray-200'}`}></div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= 2 ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  2
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {currentStep === 1 && (
                  <div className="space-y-6">
                    {/* Get Current Location Button */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        disabled={isGettingLocation}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-blue-600 hover:to-purple-700 flex items-center justify-center disabled:opacity-50 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        {isGettingLocation ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Getting Location...
                          </>
                        ) : (
                          <>
                            <MapPin className="w-5 h-5 mr-2" />
                            Use Current Location
                          </>
                        )}
                      </button>
                      <p className="text-sm text-gray-600 mt-3 text-center">
                        Click to automatically fill coordinates using your current location
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Address *
                      </label>
                      <textarea
                        name="location.address"
                        value={formData.location.address}
                        onChange={handleInputChange}
                        placeholder="Enter your complete address"
                        className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200"
                        rows="3"
                        required
                      />
                      {formErrors.address && (
                        <p className="text-red-500 text-sm mt-2 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {formErrors.address}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Latitude *
                        </label>
                        <input
                          type="number"
                          step="any"
                          name="location.latitude"
                          value={formData.location.latitude}
                          onChange={handleInputChange}
                          placeholder="e.g., 18.5204"
                          className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200"
                          required
                        />
                        {formErrors.latitude && (
                          <p className="text-red-500 text-sm mt-2 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {formErrors.latitude}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Longitude *
                        </label>
                        <input
                          type="number"
                          step="any"
                          name="location.longitude"
                          value={formData.location.longitude}
                          onChange={handleInputChange}
                          placeholder="e.g., 73.8567"
                          className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200"
                          required
                        />
                        {formErrors.longitude && (
                          <p className="text-red-500 text-sm mt-2 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {formErrors.longitude}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={nextStep}
                        className="bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-8 rounded-xl hover:from-orange-600 hover:to-red-700 flex items-center font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                      >
                        Next
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </button>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-4">
                        Select Available Materials *
                      </label>
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        {commonMaterials.map((material) => (
                          <label key={material.id} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-orange-200 transition-all duration-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.availableMaterials.some(item => item.materialId === material.id)}
                              onChange={(e) => handleMultiSelect(e, material)}
                              className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                            />
                            <span className="text-sm font-medium text-gray-900">{material.name}</span>
                          </label>
                        ))}
                      </div>
                      {formErrors.availableMaterials && (
                        <p className="text-red-500 text-sm flex items-center mb-4">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {formErrors.availableMaterials}
                        </p>
                      )}
                    </div>

                    {/* Price and Quantity inputs for selected materials */}
                    {formData.availableMaterials.length > 0 && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-bold text-gray-900">Set Price and Quantity:</h3>
                        {formData.availableMaterials.map((material, index) => {
                          const materialInfo = commonMaterials.find(m => m.id === material.materialId);
                          return (
                            <div key={material.materialId} className="p-6 border border-gray-200 rounded-2xl bg-gradient-to-br from-gray-50 to-white">
                              <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                                <Package className="w-5 h-5 mr-2 text-orange-500" />
                                {materialInfo?.name}
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-semibold text-gray-900 mb-2">Price per kg (₹)</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={material.price}
                                    onChange={(e) => handleMaterialChange(material.materialId, 'price', e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200"
                                    placeholder="0.00"
                                  />
                                  {formErrors[`price_${index}`] && (
                                    <p className="text-red-500 text-xs mt-1 flex items-center">
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      {formErrors[`price_${index}`]}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-gray-900 mb-2">Available Quantity (kg)</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={material.quantityAvailable}
                                    onChange={(e) => handleMaterialChange(material.materialId, 'quantityAvailable', e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200"
                                    placeholder="0.00"
                                  />
                                  {formErrors[`quantity_${index}`] && (
                                    <p className="text-red-500 text-xs mt-1 flex items-center">
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      {formErrors[`quantity_${index}`]}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="bg-gray-100 text-gray-700 py-3 px-8 rounded-xl hover:bg-gray-200 flex items-center font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-8 rounded-xl hover:from-orange-600 hover:to-red-700 flex items-center font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 transition-all duration-200 transform hover:-translate-y-0.5"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="w-5 h-5 mr-2" />
                            Save Profile
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SellerDashboard = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg mb-4">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    }>
      <SellerDashboardContent />
    </Suspense>
  );
};

export default SellerDashboard;