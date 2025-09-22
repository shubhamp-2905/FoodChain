// // Register.jsx
// import React from 'react';
// import Link from 'next/link';

// export default function Register() {
//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#213A57] via-[#0AD1C8] to-[#80ED99] p-4">
//       <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
//         <h2 className="text-2xl font-bold text-center text-[#213A57] mb-6">Register</h2>

//         <form className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-[#213A57]">Phone number</label>
//             <input
//               type="text"
//               className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#45DFB1] text-black"
//               placeholder="Choose a username"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-[black]">Email</label>
//             <input
//               type="email"
//               className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#45DFB1] text-black"
//               placeholder="Enter your email"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-[black]">Password</label>
//             <input
//               type="password"
//               className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#45DFB1] text-black"
//               placeholder="Create a password"
//             />
//           </div>

//           <button type="submit" className="w-full bg-[#45DFB1] text-white py-2 rounded-md hover:bg-[#0AD1C8] transition duration-300">
//             Create Account
//           </button>
//         </form>

//         <p className="mt-6 text-center text-sm text-gray-700">
//           Already have an account?{' '}
//           <Link href="/login">login Here</Link>
//         </p>
//       </div>
//     </div>
//   );
// }

"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChefHat, User, Mail, Phone, Lock, ArrowRight, UserPlus } from "lucide-react";

export default function Register() {
  const [role, setRole] = useState("buyer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Client-side validation
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const endpoint =
        role === "seller"
          ? "/api/raw-sellers/signup"
          : "/api/street-sellers/signup";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Check if token is received
      if (!data.token) {
        throw new Error("Authentication token not received from server");
      }

      // Store token
      localStorage.setItem("token", data.token);
      
      // Store user info if needed
      const userInfo = {
        id: role === "seller" ? data.sellerId : data.buyer.id,
        name: role === "seller" ? data.seller?.name : data.buyer.name,
        email: role === "seller" ? data.seller?.email : data.buyer.email,
        role: role
      };
      localStorage.setItem("userInfo", JSON.stringify(userInfo));

      // Redirect based on role with the user's ID
      const redirectPath =
        role === "seller"
          ? `/sellerdashboard?userId=${data.sellerId || data.seller?.id}`
          : `/buyerdashboard?userId=${data.buyer.id}`;

      router.push(redirectPath);
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || "An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50 p-4 relative overflow-hidden">
      {/* Background Design */}
      <div className="absolute inset-0">
        {/* Subtle background elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-orange-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-red-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-yellow-200/20 rounded-full blur-2xl"></div>
        <div className="absolute top-1/3 right-1/4 w-28 h-28 bg-orange-300/20 rounded-full blur-2xl"></div>
        
        {/* Subtle grid */}
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

      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-gray-100 p-8 relative z-10">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Join FoodChain
          </h2>
          <p className="text-gray-600">Create your account and start growing your business</p>
        </div>

        {/* Role Toggle with Professional Design */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setRole("buyer")}
              className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                role === "buyer"
                  ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <User className="w-4 h-4 mr-2" />
              Buyer
            </button>
            <button
              type="button"
              onClick={() => setRole("seller")}
              className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                role === "seller"
                  ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <ChefHat className="w-4 h-4 mr-2" />
              Seller
            </button>
          </div>
        </div>

        {/* Error Message with Better Design */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start">
            <div className="w-5 h-5 bg-red-200 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
              <div className="w-2 h-2 bg-red-600 rounded-full"></div>
            </div>
            <div>{error}</div>
          </div>
        )}

        {/* Registration Fields */}
        <div className="space-y-5">
          {/* Full Name Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Phone Number Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="tel"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200"
                placeholder="Create a password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength="6"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Professional Submit Button */}
          <button
            type="submit"
            onClick={handleSubmit}
            className="group w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-3.5 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5"
            disabled={loading}
          >
            <div className="flex items-center justify-center space-x-2">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Register as {role.charAt(0).toUpperCase() + role.slice(1)}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </>
              )}
            </div>
          </button>
        </div>

        {/* Login Link with Professional Design */}
        <div className="mt-8 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Already have an account?</span>
            </div>
          </div>
          <div className="mt-4">
            <Link 
              href="/login" 
              className="inline-flex items-center text-orange-600 hover:text-orange-700 font-semibold text-sm transition-colors duration-200 group"
            >
              Sign in to your account
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}