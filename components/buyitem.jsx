'use client';
import React, { useState, useEffect } from 'react';
import { FaStar, FaShoppingCart, FaSearch, FaMapMarkerAlt, FaEnvelope, FaPhone, FaArrowLeft, FaUser, FaCheckCircle } from 'react-icons/fa';

// Seller Details Component
const SellerDetails = ({ seller, onBack }) => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with Back Button */}
      <div className="flex items-center mb-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200"
        >
          <FaArrowLeft /> Back to Sellers
        </button>
      </div>

      {/* Seller Profile Card */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                <FaUser className="text-3xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {seller.Name || `Seller ${seller.Seller_ID}`}
                </h1>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <FaStar className="text-yellow-300" />
                    <span className="text-lg font-medium">
                      {(seller.Rating || 0).toFixed(1)}/5.0
                    </span>
                  </div>
                  {seller.Verified && (
                    <div className="flex items-center gap-2 bg-green-500 px-3 py-1.5 rounded-full">
                      <FaCheckCircle className="text-sm" />
                      <span className="text-sm font-medium">Verified Seller</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90 mb-1">Seller ID</div>
              <div className="text-lg font-mono bg-white/20 px-3 py-1 rounded-lg">{seller.Seller_ID}</div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="p-8">
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Contact Information */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 pb-3 border-b-2 border-orange-200">
                Contact Information
              </h2>
              
              <div className="space-y-4">
                {seller.Email && (
                  <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <div className="bg-orange-500 p-3 rounded-xl text-white">
                      <FaEnvelope />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-600">Email Address</div>
                      <a 
                        href={`mailto:${seller.Email}`}
                        className="text-orange-600 font-medium hover:text-orange-700 hover:underline"
                      >
                        {seller.Email}
                      </a>
                    </div>
                  </div>
                )}

                {seller.Mobile && (
                  <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="bg-blue-500 p-3 rounded-xl text-white">
                      <FaPhone />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-600">Mobile Number</div>
                      <a 
                        href={`tel:${seller.Mobile}`}
                        className="text-blue-600 font-medium hover:text-blue-700 hover:underline"
                      >
                        {seller.Mobile}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="bg-green-500 p-3 rounded-xl text-white">
                    <FaMapMarkerAlt />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-600">Location</div>
                    <div className="text-green-700 font-medium">
                      {seller.Locality || "Location not specified"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Seller Statistics */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 pb-3 border-b-2 border-orange-200">
                Seller Details
              </h2>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 rounded-2xl text-white">
                  <div className="text-sm opacity-90 mb-2">Overall Rating</div>
                  <div className="text-3xl font-bold flex items-center gap-2 mb-2">
                    <FaStar className="text-yellow-300" />
                    {(seller.Rating || 0).toFixed(1)}
                  </div>
                  <div className="text-sm opacity-90">out of 5.0</div>
                </div>

                {seller.Price_per_kg !== undefined && (
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                    <div className="text-sm font-semibold text-gray-600 mb-2">Price per Kg</div>
                    <div className="text-3xl font-bold text-orange-600">
                      ₹{seller.Price_per_kg.toFixed(2)}
                    </div>
                  </div>
                )}

                {seller.Distance_km !== undefined && (
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                    <div className="text-sm font-semibold text-gray-600 mb-2">Distance from You</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {seller.Distance_km.toFixed(2)} km
                    </div>
                  </div>
                )}

                {seller.Score !== undefined && (
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                    <div className="text-sm font-semibold text-gray-600 mb-2">Seller Score</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {seller.Score.toFixed(3)}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Based on rating, distance, and price
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-10 pt-8 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {seller.Email && (
                <a 
                  href={`mailto:${seller.Email}`}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <FaEnvelope /> Send Email
                </a>
              )}
              {seller.Mobile && (
                <a 
                  href={`tel:${seller.Mobile}`}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <FaPhone /> Call Now
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BuyItems = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [availableProducts, setAvailableProducts] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);

  // Load initial data on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setInitialLoading(true);
        setError(null);
        
        // Load available products for suggestions
        try {
          const productsResponse = await fetch("https://clustering-model.onrender.com/api/get-products");
          if (productsResponse.ok) {
            const productsData = await productsResponse.json();
            console.log("Products response:", productsData);
            if (productsData.status === "success") {
              setAvailableProducts(productsData.products || []);
            }
          } else {
            console.warn("Failed to load products:", productsResponse.status);
          }
        } catch (err) {
          console.warn("Error loading products:", err);
        }

        // Load initial sellers
        try {
          const sellersResponse = await fetch("https://clustering-model.onrender.com/api/get-initial-sellers");
          console.log("Sellers response status:", sellersResponse.status);
          
          if (sellersResponse.ok) {
            const sellersData = await sellersResponse.json();
            console.log("Sellers data:", sellersData);
            
            if (sellersData.status === "success") {
              const sellersArray = sellersData.sellers || [];
              console.log("Setting sellers:", sellersArray);
              setSellers(sellersArray);
              
              if (sellersArray.length === 0) {
                setError("No sellers available in the database. Please add some sellers first.");
              }
            } else {
              setError(sellersData.message || "Failed to load sellers");
            }
          } else {
            const errorText = await sellersResponse.text();
            console.error("Sellers API error:", errorText);
            setError(`Failed to load sellers: ${sellersResponse.status}`);
          }
        } catch (err) {
          console.error("Error loading sellers:", err);
          setError(`Network error: ${err.message}`);
        }
        
      } catch (err) {
        console.error("Error loading initial data:", err);
        setError("Failed to load initial data. Please refresh the page.");
      } finally {
        setInitialLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchSellers();
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(value.length > 0);
    
    // Clear previous error when user starts typing
    if (error && value.trim()) {
      setError(null);
    }
  };

  const handleSuggestionClick = (product) => {
    setSearchQuery(product);
    setShowSuggestions(false);
  };

  const getFilteredSuggestions = () => {
    if (!searchQuery || !availableProducts.length) return [];
    
    return availableProducts
      .filter(product => 
        product.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 5);
  };

  const handleSearchSellers = () => {
    // Validate search input
    if (!searchQuery.trim()) {
      setError("Please enter a product name to search");
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        console.log("Using location:", lat, lon);

        const payload = {
          latitude: lat,
          longitude: lon,
          product: searchQuery.trim(),
        };

        try {
          const response = await fetch(
            "https://clustering-model.onrender.com/api/get-sellers",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            }
          );

          console.log("Search response status:", response.status);

          if (!response.ok) {
            const errorBody = await response.text();
            console.error("Backend error response:", response.status, errorBody);
            throw new Error(`Network response was not ok: ${response.status}`);
          }

          const data = await response.json();
          console.log("Search results:", data);

          if (data.status === "success") {
            setSellers(data.top_sellers || []);
            if (data.top_sellers.length === 0) {
              setError("No sellers found for the given product");
            }
          } else {
            setError(data.message || "Unknown error occurred");
          }
        } catch (err) {
          console.error("Fetch error:", err);
          setError(`Failed to fetch sellers: ${err.message}`);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setError("Location access denied or unavailable. Showing general results.");
        
        // Fallback: search without location
        searchWithoutLocation();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000
      }
    );
  };

  const searchWithoutLocation = async () => {
    try {
      const response = await fetch(
        "https://clustering-model.onrender.com/api/search-sellers",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ product: searchQuery.trim() }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Fallback search results:", data);
        if (data.status === "success") {
          setSellers(data.sellers || []);
        }
      }
    } catch (err) {
      console.error("Fallback search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetToInitialState = () => {
    setSearchQuery("");
    setHasSearched(false);
    setError(null);
    setInitialLoading(true);
    
    // Reload initial sellers
    fetch("https://clustering-model.onrender.com/api/get-initial-sellers")
      .then(response => response.json())
      .then(data => {
        if (data.status === "success") {
          setSellers(data.sellers || []);
        }
      })
      .catch(err => {
        console.error("Error reloading initial sellers:", err);
        setError("Failed to reload sellers");
      })
      .finally(() => {
        setInitialLoading(false);
      });
  };

  const handleViewDetails = (seller) => {
    setSelectedSeller(seller);
  };

  const handleBackToList = () => {
    setSelectedSeller(null);
  };

  if (initialLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 text-lg">Loading sellers...</p>
          </div>
        </div>
      </div>
    );
  }

  // If a seller is selected, show the details page
  if (selectedSeller) {
    return <SellerDetails seller={selectedSeller} onBack={handleBackToList} />;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-3 flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center mr-4">
            <FaShoppingCart className="text-white" />
          </div>
          Find Suppliers
        </h1>
        <p className="text-gray-600 text-lg">Search and connect with verified food suppliers in your area</p>
      </div>
      
      {/* Search Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
        <div className="mb-4">
          <label htmlFor="product-search" className="block text-lg font-semibold text-gray-900 mb-4">
            What are you looking for?
          </label>
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <input
                id="product-search"
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyPress={handleKeyPress}
                onFocus={() => setShowSuggestions(searchQuery.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="e.g., Potatoes, Tomatoes, Rice, Milk..."
                className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-lg"
              />
              
              {showSuggestions && getFilteredSuggestions().length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 border-t-0 rounded-b-xl max-h-48 overflow-y-auto z-50 shadow-lg">
                  {getFilteredSuggestions().map((product, index) => (
                    <div
                      key={index}
                      onClick={() => handleSuggestionClick(product)}
                      className="px-6 py-4 cursor-pointer hover:bg-orange-50 border-b border-gray-100 last:border-b-0 flex items-center text-gray-700 hover:text-orange-700"
                    >
                      <span className="text-orange-500 mr-3">🥬</span>
                      <span className="font-medium">{product}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <button 
              onClick={handleSearchSellers}
              disabled={loading || !searchQuery.trim()}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              <FaSearch />
              {loading ? "Searching..." : "Find Suppliers"}
            </button>
            
            {hasSearched && (
              <button 
                onClick={resetToInitialState}
                className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-200"
              >
                Show All
              </button>
            )}
          </div>
          
          <p className="text-gray-500 mt-4 flex items-center">
            <span className="mr-2">💡</span>
            {hasSearched ? 
              "Showing search results. Click 'Show All' to see all available suppliers." : 
              "Start typing to see product suggestions, or browse all available suppliers below."
            }
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-6 rounded-xl mb-8">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-red-400 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-sm font-bold">!</span>
            </div>
            <div>
              <strong className="font-semibold">Error:</strong> {error}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg">Searching for suppliers...</p>
        </div>
      )}

      {/* Results Header */}
      {!loading && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {hasSearched ? 
              `Search Results for "${searchQuery}" (${sellers.length} found)` : 
              `Available Suppliers (${sellers.length})`
            }
          </h2>
        </div>
      )}

      {/* Sellers Grid */}
      {!loading && sellers.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sellers.map((seller, index) => {
            // Add safe defaults for missing fields
            const safeRating = seller.Rating || 0;
            const safeName = seller.Name || `Seller ${seller.Seller_ID || index + 1}`;
            const safeLocation = seller.Locality || "Location not specified";
            const safePrice = seller.Price_per_kg || null;
            const safeDistance = seller.Distance_km || null;
            const safeScore = seller.Score || null;
            const isVerified = seller.Verified === true || seller.Verified === 1 || seller.Verified === "true";
            
            return (
              <div key={`seller-${seller.Seller_ID || index}`} className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-200">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 text-white">
                  <h3 className="text-xl font-bold truncate mb-3">
                    {safeName}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaStar className="text-yellow-300" />
                      <span className="font-semibold">{safeRating.toFixed(1)}/5.0</span>
                    </div>
                    {isVerified && (
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center text-gray-600">
                      <FaMapMarkerAlt className="mr-3 text-orange-500 flex-shrink-0" />
                      <span className="truncate font-medium">{safeLocation}</span>
                    </div>
                    
                    {safeDistance !== null && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Distance:</span>
                        <span className="text-gray-900 font-bold">{safeDistance.toFixed(2)} km</span>
                      </div>
                    )}
                    
                    {safePrice !== null && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Price:</span>
                        <span className="text-orange-600 font-bold text-lg">₹{safePrice.toFixed(2)}/kg</span>
                      </div>
                    )}
                    
                    {safeScore !== null && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Score:</span>
                        <span className="text-gray-900 font-bold">{safeScore.toFixed(3)}</span>
                      </div>
                    )}

                    {/* Show Seller ID for debugging */}
                    <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                      ID: {seller.Seller_ID || `temp-${index}`}
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <button 
                      onClick={() => handleViewDetails(seller)}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-3 px-4 rounded-xl transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No Results */}
      {!loading && sellers.length === 0 && !error && (
        <div className="text-center py-16">
          <div className="text-gray-300 text-8xl mb-6">🔍</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No suppliers found</h3>
          <p className="text-gray-600 text-lg max-w-md mx-auto">
            {hasSearched ? 
              "Try searching for a different product or check your spelling." : 
              "No suppliers are currently available. Please try again later."
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default BuyItems;