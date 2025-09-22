"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, Package, TrendingDown, Loader2, AlertCircle, CheckCircle, ShoppingCart } from "lucide-react";

const WastePrediction = () => {
  const [parsedData, setParsedData] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Token not found. Please log in.");
          setLoading(false);
          return;
        }

        const response = await fetch("/api/waste-predict", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Error: ${text}`);
        }

        const rawText = await response.text();

        const blocks = rawText
          .trim()
          .split(/\n\s*\n/) // Split by blank lines
          .map((block) => {
            const nameMatch = block.match(/Raw Material:\s*(.+)/);
            const quantityMatch = block.match(/Quantity to Order:\s*(.+)/);
            const reasonMatch = block.match(/Reason:\s*(.+)/);

            return {
              name: nameMatch?.[1] || "N/A",
              quantity: quantityMatch?.[1] || "N/A",
              reason: reasonMatch?.[1] || "N/A",
            };
          });

        setParsedData(blocks);
        setLoading(false);
      } catch (err) {
        setError(err.message || "Failed to fetch data.");
        setLoading(false);
      }
    };

    fetchPrediction();
  }, []);

  const getTotalItems = () => parsedData.length;
  
  const getQuantitySum = () => {
    return parsedData.reduce((sum, item) => {
      const num = parseFloat(item.quantity) || 0;
      return sum + num;
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 p-4 relative overflow-hidden">
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

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg mb-4">
            <TrendingDown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Waste Prediction Report
          </h1>
          <p className="text-gray-600 text-lg">AI-powered insights to minimize food waste</p>
        </div>

        {/* Loading State */}
        {loading && !error && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 max-w-md w-full">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Analyzing Data
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Hang tight! This may take a minute...
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-orange-500 to-red-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Something went wrong
                  </h3>
                  <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success State with Data */}
        {!error && !loading && parsedData.length > 0 && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Items</p>
                    <p className="text-2xl font-bold text-gray-900">{getTotalItems()}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Quantity</p>
                    <p className="text-2xl font-bold text-gray-900">{getQuantitySum().toFixed(1)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <p className="text-lg font-bold text-green-600">Generated</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {parsedData.map((item, index) => (
                <div
                  key={index}
                  className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-full"></div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors duration-200">
                          {item.name}
                        </h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Quantity:</span>
                          <span className="font-semibold text-gray-900">{item.quantity}</span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-3">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      <span className="font-medium text-gray-700">Reason: </span>
                      {item.reason}
                    </p>
                  </div>
                  
                  {/* Progress indicator */}
                  <div className="mt-4 flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                      <div className="bg-gradient-to-r from-orange-500 to-red-600 h-1.5 rounded-full transition-all duration-500" 
                           style={{ width: `${Math.min((parseFloat(item.quantity) || 0) * 10, 100)}%` }}>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-500">
                      {item.quantity !== 'N/A' ? 'Priority' : 'Review'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Footer */}
            <div className="mt-8 text-center">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-center space-x-2 text-gray-600 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium">Report Generated Successfully</span>
                </div>
                <p className="text-sm text-gray-500">
                  Use these insights to optimize your inventory and reduce waste
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!error && !loading && parsedData.length === 0 && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-gray-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Predictions Available
                  </h3>
                  <p className="text-gray-600 text-sm">
                    No waste prediction data found. Try again later or check your sales data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WastePrediction;