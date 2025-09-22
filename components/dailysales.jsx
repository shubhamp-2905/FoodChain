"use client";
import React, { useState, useEffect } from "react";
import { Plus, ShoppingCart, Package, TrendingUp, AlertCircle, CheckCircle, Minus } from "lucide-react";

const SalesForm = () => {
  const [token, setToken] = useState("");
  const [foodItems, setFoodItems] = useState([
    { itemName: "", quantityPrepared: "", quantitySold: "" },
  ]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    } else {
      setMessage("Token not found in localStorage");
    }
  }, []);

  const handleChange = (index, field, value) => {
    const updatedItems = [...foodItems];
    updatedItems[index][field] = field.includes("quantity")
      ? Number(value)
      : value;
    setFoodItems(updatedItems);
  };

  const addItem = () => {
    setFoodItems([
      ...foodItems,
      { itemName: "", quantityPrepared: "", quantitySold: "" },
    ]);
  };

  const removeItem = (index) => {
    if (foodItems.length > 1) {
      const updatedItems = foodItems.filter((_, i) => i !== index);
      setFoodItems(updatedItems);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ foodItems }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit");
      }

      setMessage("Sales data submitted successfully!");
      setFoodItems([{ itemName: "", quantityPrepared: "", quantitySold: "" }]);
    } catch (error) {
      console.error("Fetch error:", error);
      setMessage("Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getTotalPrepared = () => {
    return foodItems.reduce((sum, item) => sum + (Number(item.quantityPrepared) || 0), 0);
  };

  const getTotalSold = () => {
    return foodItems.reduce((sum, item) => sum + (Number(item.quantitySold) || 0), 0);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50 p-4 relative overflow-hidden">
      {/* Background Design */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-orange-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-red-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-yellow-200/20 rounded-full blur-2xl"></div>
        
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
      </div>

      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-gray-100 p-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg mb-4">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Daily Sales Report
          </h2>
          <p className="text-gray-600">Track your daily food sales and inventory</p>
        </div>

        {/* Summary Cards */}
        {foodItems.some(item => item.quantityPrepared || item.quantitySold) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-gradient-to-r from-orange-100 to-orange-50 p-4 rounded-xl border border-orange-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-orange-800">Total Prepared</p>
                  <p className="text-2xl font-bold text-orange-900">{getTotalPrepared()}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-red-100 to-red-50 p-4 rounded-xl border border-red-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">Total Sold</p>
                  <p className="text-2xl font-bold text-red-900">{getTotalSold()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error/Success Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl text-sm flex items-start ${
            message.includes('successfully') 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 ${
              message.includes('successfully') ? 'bg-green-200' : 'bg-red-200'
            }`}>
              {message.includes('successfully') ? (
                <CheckCircle className="w-3 h-3 text-green-600" />
              ) : (
                <AlertCircle className="w-3 h-3 text-red-600" />
              )}
            </div>
            <div>{message}</div>
          </div>
        )}

        <div className="space-y-6">
          {/* Food Items */}
          <div className="space-y-4">
            {foodItems.map((item, index) => (
              <div key={index} className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl border border-gray-200 relative">
                {foodItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="absolute top-3 right-3 w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center transition-colors duration-200"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Item Name */}
                  <div className="lg:col-span-1">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Item Name
                    </label>
                    <input
                      type="text"
                      value={item.itemName}
                      onChange={(e) => handleChange(index, "itemName", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200"
                      placeholder="Enter food item name"
                      required
                      disabled={loading}
                    />
                  </div>

                  {/* Quantity Prepared */}
                  <div className="lg:col-span-1">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Quantity Prepared
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Package className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        value={item.quantityPrepared}
                        onChange={(e) => handleChange(index, "quantityPrepared", e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200"
                        placeholder="0"
                        min="0"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Quantity Sold */}
                  <div className="lg:col-span-1">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Quantity Sold
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <ShoppingCart className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        value={item.quantitySold}
                        onChange={(e) => handleChange(index, "quantitySold", e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200"
                        placeholder="0"
                        min="0"
                        max={item.quantityPrepared || undefined}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                {/* Progress Bar for Sales */}
                {item.quantityPrepared && item.quantitySold && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Sales Progress</span>
                      <span>{Math.round((item.quantitySold / item.quantityPrepared) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-red-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((item.quantitySold / item.quantityPrepared) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add Item Button */}
          <button
            type="button"
            onClick={addItem}
            className="w-full py-3 px-4 border-2 border-dashed border-orange-300 text-orange-600 hover:border-orange-400 hover:bg-orange-50 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 group"
            disabled={loading}
          >
            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            <span>Add Another Item</span>
          </button>

          {/* Submit Button */}
          <button
            type="submit"
            onClick={handleSubmit}
            className="group w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5"
            disabled={loading}
          >
            <div className="flex items-center justify-center space-x-2">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Submitting Sales...</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  <span>Submit Sales Report</span>
                </>
              )}
            </div>
          </button>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Make sure all quantities are accurate before submitting your daily sales report
          </p>
        </div>
      </div>
    </div>
  );
};

export default SalesForm;