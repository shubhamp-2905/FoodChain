'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaUtensils, FaChartLine, FaMapMarkerAlt, FaHistory, FaEdit, FaPlus, FaTimes, FaLocationArrow } from 'react-icons/fa';

export default function BuyerDashboard() {
  const [sellerData, setSellerData] = useState(null);
  const [formData, setFormData] = useState({
    location: {
      latitude: 0,
      longitude: 0,
      address: ''
    },
    foodItems: [''],
    dailyInput: {
      totalPrepared: 0,
      totalSold: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  useEffect(() => {
    if (userId) {
      fetchSellerData();
    }
  }, [userId]);

  const fetchSellerData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/street-sellers/update/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const data = await response.json();
      if (data.success) {
        setSellerData(data.seller);
        setFormData({
          location: {
            latitude: data.seller.location?.latitude || 0,
            longitude: data.seller.location?.longitude || 0,
            address: data.seller.location?.address || ''
          },
          foodItems: data.seller.foodItems?.length > 0 ? data.seller.foodItems : [''],
          dailyInput: {
            totalPrepared: data.seller.dailyInput?.totalPrepared || 0,
            totalSold: data.seller.dailyInput?.totalSold || 0
          }
        });
      }
    } catch (error) {
      console.error('Error fetching seller data:', error);
    } finally {
      setLoading(false);
    }
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
        
        // Update form data with coordinates
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            latitude: latitude,
            longitude: longitude
          }
        }));

        // Try to get address from coordinates using reverse geocoding (OpenStreetMap Nominatim - Free)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=en`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.display_name) {
              setFormData(prev => ({
                ...prev,
                location: {
                  ...prev.location,
                  address: data.display_name
                }
              }));
            }
          }
        } catch (error) {
          console.log('Could not fetch address from coordinates:', error);
          // User can still enter address manually
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name.includes('.')) {
        const keys = name.split('.');
        let updatedData = { ...prev };
        let current = updatedData;
        
        for (let i = 0; i < keys.length - 1; i++) {
          current[keys[i]] = { ...current[keys[i]] };
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        
        return updatedData;
      }
      return { ...prev, [name]: value };
    });
  };

  const handleFoodItemChange = (index, value) => {
    const newFoodItems = [...formData.foodItems];
    newFoodItems[index] = value;
    setFormData(prev => ({ ...prev, foodItems: newFoodItems }));
  };

  const addFoodItem = () => {
    setFormData(prev => ({ ...prev, foodItems: [...prev.foodItems, ''] }));
  };

  const removeFoodItem = (index) => {
    const newFoodItems = formData.foodItems.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, foodItems: newFoodItems }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const updateData = {
        location: {
          latitude: Number(formData.location.latitude),
          longitude: Number(formData.location.longitude),
          address: formData.location.address
        },
        foodItems: formData.foodItems.filter(item => item.trim() !== ''),
        dailyInput: {
          totalPrepared: Number(formData.dailyInput.totalPrepared),
          totalSold: Number(formData.dailyInput.totalSold),
          date: new Date()
        }
      };

      const response = await fetch(`/api/street-sellers/update/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update seller data');
      }

      if (data.success) {
        setSellerData(data.seller);
        setEditing(false);
        alert('Details saved successfully!');
      }
    } catch (error) {
      console.error('Error updating seller data:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-gray-700 text-xl font-medium">Loading your dashboard...</div>
      </div>
    </div>
  );

  const showForm = editing || !sellerData?.location?.address;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {showForm ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-4">
              <FaUtensils className="text-white text-lg" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Setup</h2>
            <p className="text-gray-600">Complete your business profile to get started</p>
          </div>
          
          <div className="space-y-8">
            {/* Location Section */}
            <div>
              <label className="block font-semibold text-gray-900 mb-4 flex items-center">
                <FaMapMarkerAlt className="mr-3 text-orange-500" /> Business Location
              </label>
              
              {/* Get Current Location Button */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl flex items-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  <FaLocationArrow className="mr-2" />
                  {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Click to automatically fill coordinates using your current location
                </p>
              </div>

              <input
                type="text"
                name="location.address"
                value={formData.location.address}
                onChange={handleInputChange}
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="Enter your business address"
                required
              />
              <div className="grid grid-cols-2 gap-4 mt-4">
                <input
                  type="number"
                  name="location.latitude"
                  value={formData.location.latitude}
                  onChange={handleInputChange}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="Latitude"
                  step="any"
                />
                <input
                  type="number"
                  name="location.longitude"
                  value={formData.location.longitude}
                  onChange={handleInputChange}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="Longitude"
                  step="any"
                />
              </div>
            </div>

            {/* Food Items Section */}
            <div>
              <label className="block font-semibold text-gray-900 mb-4">Food Items</label>
              {formData.foodItems.map((item, index) => (
                <div key={index} className="flex items-center mb-3">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleFoodItemChange(index, e.target.value)}
                    className="flex-1 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
                    placeholder="Enter food item name"
                    required
                  />
                  {formData.foodItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFoodItem(index)}
                      className="ml-3 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addFoodItem}
                className="mt-3 px-4 py-2 bg-orange-100 text-orange-700 rounded-xl flex items-center font-medium hover:bg-orange-200 transition-all duration-200"
              >
                <FaPlus className="mr-2" /> Add another food item
              </button>
            </div>

            {/* Daily Input Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-semibold text-gray-900 mb-2">Total Prepared Today</label>
                <input
                  type="number"
                  name="dailyInput.totalPrepared"
                  value={formData.dailyInput.totalPrepared}
                  onChange={handleInputChange}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900"
                  min="0"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-900 mb-2">Total Sold Today</label>
                <input
                  type="number"
                  name="dailyInput.totalSold"
                  value={formData.dailyInput.totalSold}
                  onChange={handleInputChange}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {sellerData?.location?.address && (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                onClick={handleSubmit}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving Details...' : 'Save Business Details'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {sellerData.name}!</h1>
              <p className="text-gray-600">Here's your business overview for today</p>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="mt-4 sm:mt-0 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl font-semibold flex items-center transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <FaEdit className="mr-2" /> Edit Details
            </button>
          </div>

          {/* Stats Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <FaUtensils className="text-orange-600 text-lg" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">Food Items</h3>
                  <p className="text-sm text-gray-500">Menu variety</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{sellerData.foodItems?.length || 0}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FaChartLine className="text-blue-600 text-lg" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">Prepared Today</h3>
                  <p className="text-sm text-gray-500">Dishes made</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{sellerData.dailyInput?.totalPrepared || 0}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <FaChartLine className="text-green-600 text-lg" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">Sold Today</h3>
                  <p className="text-sm text-gray-500">Orders completed</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{sellerData.dailyInput?.totalSold || 0}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <FaHistory className="text-purple-600 text-lg" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">Last Updated</h3>
                  <p className="text-sm text-gray-500">Recent activity</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {sellerData.dailyInput?.date ? 
                  new Date(sellerData.dailyInput.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 
                  'Today'
                }
              </p>
            </div>
          </div>

          {/* Detailed Information Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Location and Food Items */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <FaMapMarkerAlt className="mr-3 text-orange-500" /> Business Location
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Address</p>
                    <p className="text-gray-900">{sellerData.location.address}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Latitude</p>
                      <p className="text-gray-900 font-mono text-sm">{sellerData.location.latitude}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Longitude</p>
                      <p className="text-gray-900 font-mono text-sm">{sellerData.location.longitude}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <FaUtensils className="mr-3 text-orange-500" /> Menu Items
                </h2>
                <div className="space-y-2">
                  {sellerData.foodItems?.length > 0 ? (
                    sellerData.foodItems.map((item, index) => (
                      <div key={index} className="flex items-center p-3 bg-gray-50 rounded-xl">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                        <span className="text-gray-900 font-medium">{item}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No food items added yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact and Account Information */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Full Name</p>
                    <p className="text-gray-900">{sellerData.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Email Address</p>
                    <p className="text-gray-900">{sellerData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Phone Number</p>
                    <p className="text-gray-900">{sellerData.phone}</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <FaHistory className="mr-3 text-orange-500" /> Account Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Buyer ID</p>
                    <p className="font-mono text-sm text-gray-900 bg-gray-50 p-2 rounded-lg">{sellerData.buyerId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Member Since</p>
                    <p className="text-gray-900">
                      {new Date(sellerData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Account Status</p>
                    <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 'use client';
// import { useState, useEffect } from 'react';
// import { useSearchParams } from 'next/navigation';
// import { FaUtensils, FaChartLine, FaMapMarkerAlt, FaHistory, FaEdit, FaPlus, FaTimes } from 'react-icons/fa';

// export default function BuyerDashboard() {
//   const [sellerData, setSellerData] = useState(null);
//   const [formData, setFormData] = useState({
//     location: {
//       latitude: 0,
//       longitude: 0,
//       address: ''
//     },
//     foodItems: [''],
//     dailyInput: {
//       totalPrepared: 0,
//       totalSold: 0
//     }
//   });
//   const [loading, setLoading] = useState(true);
//   const [editing, setEditing] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const searchParams = useSearchParams();
//   const userId = searchParams.get('userId');

//   useEffect(() => {
//     if (userId) {
//       fetchSellerData();
//     }
//   }, [userId]);

//   const fetchSellerData = async () => {
//     try {
//       setLoading(true);
//       const response = await fetch(`/api/street-sellers/update/${userId}`);
//       if (!response.ok) throw new Error('Failed to fetch data');
      
//       const data = await response.json();
//       if (data.success) {
//         setSellerData(data.seller);
//         setFormData({
//           location: {
//             latitude: data.seller.location?.latitude || 0,
//             longitude: data.seller.location?.longitude || 0,
//             address: data.seller.location?.address || ''
//           },
//           foodItems: data.seller.foodItems?.length > 0 ? data.seller.foodItems : [''],
//           dailyInput: {
//             totalPrepared: data.seller.dailyInput?.totalPrepared || 0,
//             totalSold: data.seller.dailyInput?.totalSold || 0
//           }
//         });
//       }
//     } catch (error) {
//       console.error('Error fetching seller data:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => {
//       if (name.includes('.')) {
//         const keys = name.split('.');
//         let updatedData = { ...prev };
//         let current = updatedData;
        
//         for (let i = 0; i < keys.length - 1; i++) {
//           current[keys[i]] = { ...current[keys[i]] };
//           current = current[keys[i]];
//         }
//         current[keys[keys.length - 1]] = value;
        
//         return updatedData;
//       }
//       return { ...prev, [name]: value };
//     });
//   };

//   const handleFoodItemChange = (index, value) => {
//     const newFoodItems = [...formData.foodItems];
//     newFoodItems[index] = value;
//     setFormData(prev => ({ ...prev, foodItems: newFoodItems }));
//   };

//   const addFoodItem = () => {
//     setFormData(prev => ({ ...prev, foodItems: [...prev.foodItems, ''] }));
//   };

//   const removeFoodItem = (index) => {
//     const newFoodItems = formData.foodItems.filter((_, i) => i !== index);
//     setFormData(prev => ({ ...prev, foodItems: newFoodItems }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     try {
//       const updateData = {
//         location: {
//           latitude: Number(formData.location.latitude),
//           longitude: Number(formData.location.longitude),
//           address: formData.location.address
//         },
//         foodItems: formData.foodItems.filter(item => item.trim() !== ''),
//         dailyInput: {
//           totalPrepared: Number(formData.dailyInput.totalPrepared),
//           totalSold: Number(formData.dailyInput.totalSold),
//           date: new Date()
//         }
//       };

//       const response = await fetch(`/api/street-sellers/update/${userId}`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(updateData)
//       });

//       const data = await response.json();
//       if (!response.ok) {
//         throw new Error(data.error || 'Failed to update seller data');
//       }

//       if (data.success) {
//         setSellerData(data.seller);
//         setEditing(false);
//         alert('Details saved successfully!');
//       }
//     } catch (error) {
//       console.error('Error updating seller data:', error);
//       alert(`Error: ${error.message}`);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (loading) return (
//     <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#213A57' }}>
//       <div className="text-white text-2xl">Loading...</div>
//     </div>
//   );

//   const showForm = editing || !sellerData?.location?.address;

//   return (
//     <div className="min-h-screen p-6" style={{ backgroundColor: '#f8fafc' }}>
//       {showForm ? (
//         <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto" style={{ borderTop: '4px solid #0DD1C8' }}>
//           <h2 className="text-2xl font-bold mb-6 flex items-center" style={{ color: '#213A57' }}>
//             <FaUtensils className="mr-2" style={{ color: '#0DD1C8' }} /> Business Details
//           </h2>
          
//           <form onSubmit={handleSubmit} className="space-y-6">
//             <div>
//               <label className="block font-medium mb-2 flex items-center" style={{ color: '#213A57' }}>
//                 <FaMapMarkerAlt className="mr-2" style={{ color: '#0DD1C8' }} /> Business Location
//               </label>
//               <input
//                 type="text"
//                 name="location.address"
//                 value={formData.location.address}
//                 onChange={handleInputChange}
//                 className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-#0DD1C8 focus:border-#0DD1C8 outline-none transition"
//                 placeholder="Street address"
//                 required
//                 style={{ borderColor: '#54DEB4' }}
//               />
//               <div className="grid grid-cols-2 gap-4 mt-3">
//                 <input
//                   type="number"
//                   name="location.latitude"
//                   value={formData.location.latitude}
//                   onChange={handleInputChange}
//                   className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-#0DD1C8 focus:border-#0DD1C8 outline-none transition"
//                   placeholder="Latitude"
//                   step="any"
//                   style={{ borderColor: '#54DEB4' }}
//                 />
//                 <input
//                   type="number"
//                   name="location.longitude"
//                   value={formData.location.longitude}
//                   onChange={handleInputChange}
//                   className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-#0DD1C8 focus:border-#0DD1C8 outline-none transition"
//                   placeholder="Longitude"
//                   step="any"
//                   style={{ borderColor: '#54DEB4' }}
//                 />
//               </div>
//             </div>

//             <div>
//               <label className="block font-medium mb-2" style={{ color: '#213A57' }}>Food Items</label>
//               {formData.foodItems.map((item, index) => (
//                 <div key={index} className="flex items-center mb-2">
//                   <input
//                     type="text"
//                     value={item}
//                     onChange={(e) => handleFoodItemChange(index, e.target.value)}
//                     className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-#0DD1C8 focus:border-#0DD1C8 outline-none transition"
//                     placeholder="Food item name"
//                     required
//                     style={{ borderColor: '#54DEB4' }}
//                   />
//                   {formData.foodItems.length > 1 && (
//                     <button
//                       type="button"
//                       onClick={() => removeFoodItem(index)}
//                       className="ml-2 p-2 rounded-full hover:bg-gray-100 transition"
//                       style={{ color: '#213A57' }}
//                     >
//                       <FaTimes />
//                     </button>
//                   )}
//                 </div>
//               ))}
//               <button
//                 type="button"
//                 onClick={addFoodItem}
//                 className="mt-2 px-3 py-1 text-sm rounded-lg flex items-center transition"
//                 style={{ backgroundColor: '#54DEB4', color: '#213A57' }}
//               >
//                 <FaPlus className="mr-1" /> Add another food item
//               </button>
//             </div>

//             <div className="grid grid-cols-2 gap-6">
//               <div>
//                 <label className="block font-medium mb-2" style={{ color: '#213A57' }}>Total Prepared Today</label>
//                 <input
//                   type="number"
//                   name="dailyInput.totalPrepared"
//                   value={formData.dailyInput.totalPrepared}
//                   onChange={handleInputChange}
//                   className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-#0DD1C8 focus:border-#0DD1C8 outline-none transition"
//                   min="0"
//                   style={{ borderColor: '#54DEB4' }}
//                 />
//               </div>
//               <div>
//                 <label className="block font-medium mb-2" style={{ color: '#213A57' }}>Total Sold Today</label>
//                 <input
//                   type="number"
//                   name="dailyInput.totalSold"
//                   value={formData.dailyInput.totalSold}
//                   onChange={handleInputChange}
//                   className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-#0DD1C8 focus:border-#0DD1C8 outline-none transition"
//                   min="0"
//                   style={{ borderColor: '#54DEB4' }}
//                 />
//               </div>
//             </div>

//             <div className="flex justify-end space-x-4 pt-4">
//               {sellerData?.location?.address && (
//                 <button
//                   type="button"
//                   onClick={() => setEditing(false)}
//                   className="px-6 py-2 border rounded-lg font-medium transition"
//                   disabled={isSubmitting}
//                   style={{ borderColor: '#213A57', color: '#213A57' }}
//                 >
//                   Cancel
//                 </button>
//               )}
//               <button
//                 type="submit"
//                 className="px-6 py-2 rounded-lg font-medium text-white transition hover:shadow-lg disabled:opacity-50"
//                 disabled={isSubmitting}
//                 style={{ backgroundColor: '#0DD1C8' }}
//               >
//                 {isSubmitting ? 'Saving...' : 'Save Details'}
//               </button>
//             </div>
//           </form>
//         </div>
//       ) : (
//         <div className="max-w-6xl mx-auto">
//           <div className="flex justify-between items-center mb-8">
//             <h1 className="text-3xl font-bold" style={{ color: '#213A57' }}>{sellerData.name}'s Dashboard</h1>
//             <button
//               onClick={() => setEditing(true)}
//               className="px-5 py-2 rounded-lg font-medium flex items-center transition hover:shadow-lg"
//               style={{ backgroundColor: '#0DD1C8', color: 'white' }}
//             >
//               <FaEdit className="mr-2" /> Edit Details
//             </button>
//           </div>

//           {/* Stats Overview Cards */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//             <div className="bg-white rounded-xl shadow-md p-6 transition hover:shadow-lg" style={{ borderTop: '4px solid #0DD1C8' }}>
//               <div className="flex items-center mb-4">
//                 <div className="p-3 rounded-full mr-3" style={{ backgroundColor: '#E8F9F8' }}>
//                   <FaUtensils style={{ color: '#0DD1C8' }} />
//                 </div>
//                 <h3 className="font-semibold" style={{ color: '#213A57' }}>Food Items</h3>
//               </div>
//               <p className="text-2xl font-bold mb-2" style={{ color: '#213A57' }}>{sellerData.foodItems?.length || 0}</p>
//               <p className="text-sm" style={{ color: '#54DEB4' }}>Registered dishes</p>
//             </div>

//             <div className="bg-white rounded-xl shadow-md p-6 transition hover:shadow-lg" style={{ borderTop: '4px solid #54DEB4' }}>
//               <div className="flex items-center mb-4">
//                 <div className="p-3 rounded-full mr-3" style={{ backgroundColor: '#E8F9F8' }}>
//                   <FaChartLine style={{ color: '#54DEB4' }} />
//                 </div>
//                 <h3 className="font-semibold" style={{ color: '#213A57' }}>Prepared Today</h3>
//               </div>
//               <p className="text-2xl font-bold mb-2" style={{ color: '#213A57' }}>
//                 {sellerData.dailyInput?.totalPrepared || 0}
//               </p>
//               <p className="text-sm" style={{ color: '#54DEB4' }}>Dishes made</p>
//             </div>

//             <div className="bg-white rounded-xl shadow-md p-6 transition hover:shadow-lg" style={{ borderTop: '4px solid #0DD1C8' }}>
//               <div className="flex items-center mb-4">
//                 <div className="p-3 rounded-full mr-3" style={{ backgroundColor: '#E8F9F8' }}>
//                   <FaChartLine style={{ color: '#0DD1C8' }} />
//                 </div>
//                 <h3 className="font-semibold" style={{ color: '#213A57' }}>Sold Today</h3>
//               </div>
//               <p className="text-2xl font-bold mb-2" style={{ color: '#213A57' }}>
//                 {sellerData.dailyInput?.totalSold || 0}
//               </p>
//               <p className="text-sm" style={{ color: '#54DEB4' }}>Dishes served</p>
//             </div>

//             <div className="bg-white rounded-xl shadow-md p-6 transition hover:shadow-lg" style={{ borderTop: '4px solid #54DEB4' }}>
//               <div className="flex items-center mb-4">
//                 <div className="p-3 rounded-full mr-3" style={{ backgroundColor: '#E8F9F8' }}>
//                   <FaHistory style={{ color: '#54DEB4' }} />
//                 </div>
//                 <h3 className="font-semibold" style={{ color: '#213A57' }}>Last Updated</h3>
//               </div>
//               <p className="text-2xl font-bold mb-2" style={{ color: '#213A57' }}>
//                 {sellerData.dailyInput?.date ? new Date(sellerData.dailyInput.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
//               </p>
//               <p className="text-sm" style={{ color: '#54DEB4' }}>Recent activity</p>
//             </div>
//           </div>

//           {/* Detailed Information Sections */}
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
//             {/* Location and Food Items */}
//             <div className="bg-white rounded-xl shadow-md overflow-hidden">
//               <div className="p-6" style={{ borderBottom: '1px solid #f1f5f9' }}>
//                 <h2 className="text-xl font-semibold mb-4 flex items-center" style={{ color: '#213A57' }}>
//                   <FaMapMarkerAlt className="mr-2" style={{ color: '#0DD1C8' }} /> Location Details
//                 </h2>
//                 <div className="space-y-3">
//                   <div>
//                     <p className="text-sm font-medium" style={{ color: '#54DEB4' }}>Address</p>
//                     <p className="text-black">{sellerData.location.address}</p>
//                   </div>
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <p className="text-sm font-medium" style={{ color: '#54DEB4' }}>Latitude</p>
//                       <p className="text-black">{sellerData.location.latitude}</p>
//                     </div>
//                     <div>
//                       <p className="text-sm font-medium" style={{ color: '#54DEB4' }}>Longitude</p>
//                       <p className="text-black">{sellerData.location.longitude}</p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//               <div className="p-6">
//                 <h2 className="text-xl font-semibold mb-4 flex items-center" style={{ color: '#213A57' }}>
//                   <FaUtensils className="mr-2" style={{ color: '#0DD1C8' }} /> Food Items
//                 </h2>
//                 <div className="space-y-2">
//                   {sellerData.foodItems?.length > 0 ? (
//                     sellerData.foodItems.map((item, index) => (
//                       <div key={index} className="flex items-center py-2 px-3 rounded-lg" style={{ backgroundColor: '#f8fafc' }}>
//                         <span className="flex-1" style={{ color: '#213A57' }}>{item}</span>
//                       </div>
//                     ))
//                   ) : (
//                     <p className="text-gray-500">No food items added</p>
//                   )}
//                 </div>
//               </div>
//             </div>

//             {/* Contact and Account Information */}
//             <div className="bg-white rounded-xl shadow-md overflow-hidden">
//               <div className="p-6" style={{ borderBottom: '1px solid #f1f5f9' }}>
//                 <h2 className="text-xl font-semibold mb-4" style={{ color: '#213A57' }}>Contact Information</h2>
//                 <div className="space-y-4">
//                   <div>
//                     <p className="text-sm font-medium" style={{ color: '#54DEB4' }}>Full Name</p>
//                     <p className="text-black">{sellerData.name}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm font-medium" style={{ color: '#54DEB4' }}>Email Address</p>
//                     <p className="text-black">{sellerData.email}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm font-medium" style={{ color: '#54DEB4' }}>Phone Number</p>
//                     <p className="text-black">{sellerData.phone}</p>
//                   </div>
//                 </div>
//               </div>
//               <div className="p-6">
//                 <h2 className="text-xl font-semibold mb-4 flex items-center" style={{ color: '#213A57' }}>
//                   <FaHistory className="mr-2" style={{ color: '#0DD1C8' }} /> Account Information
//                 </h2>
//                 <div className="space-y-4">
//                   <div>
//                     <p className="text-sm font-medium" style={{ color: '#54DEB4' }}>Buyer ID</p>
//                     <p className="font-mono text-sm text-black">{sellerData.buyerId}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm font-medium" style={{ color: '#54DEB4' }}>Member Since</p>
//                     <p className="text-black">
//                       {new Date(sellerData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-sm font-medium" style={{ color: '#54DEB4' }}>Account Status</p>
//                     <span className="inline-block px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: '#E8F9F8', color: '#0DD1C8' }}>
//                       Active
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }










