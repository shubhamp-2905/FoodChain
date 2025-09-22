import React, { useState, useEffect } from 'react';
import { ChefHat, Utensils, Coffee, Pizza, Apple, Cookie, Soup, IceCream, Star, Zap, Shield, Clock, Users, Heart, Truck, Award, Package, Store, Handshake } from 'lucide-react';

const SupplyChainLanding = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const foodIcons = [
    { Icon: Pizza, delay: '0s', color: 'text-orange-500' },
    { Icon: Coffee, delay: '0.2s', color: 'text-amber-600' },
    { Icon: Apple, delay: '0.4s', color: 'text-red-500' },
    { Icon: Cookie, delay: '0.6s', color: 'text-yellow-500' },
    { Icon: Soup, delay: '0.8s', color: 'text-green-500' },
    { Icon: IceCream, delay: '1s', color: 'text-pink-500' },
  ];

  const features = [
    {
      icon: Package,
      title: "Smart Distance Matching",
      description: "Our ML model connects you with the nearest suppliers, reducing delivery time and costs while ensuring fresh ingredients.",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Truck,
      title: "Intelligent Order Prediction",
      description: "AI-powered wastage estimation and order prediction helps you optimize inventory and reduce food waste significantly.",
      color: "from-green-500 to-green-600"
    },
    {
      icon: Handshake,
      title: "Price Comparison Platform",
      description: "Compare prices across multiple verified suppliers to get the best deals and maximize your profit margins.",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Store,
      title: "Community Support",
      description: "Join a thriving community of street food vendors with dedicated support to help grow your business.",
      color: "from-orange-500 to-orange-600"
    }
  ];

  // Calculate transform values for zoom effect
  const getTransformStyle = () => {
    const scale = Math.max(0.95, 1 - scrollY * 0.0002);
    const translateY = scrollY * 0.05;
    return {
      transform: `scale(${scale}) translateY(${translateY}px)`,
      transformOrigin: 'center center'
    };
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Clean Background Design */}
      <div className="absolute inset-0">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/80 via-white to-green-50/80"></div>
        
        {/* Geometric patterns - more subtle */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-32 h-32 bg-orange-200 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-40 h-40 bg-green-200 rounded-full blur-3xl"></div>
          <div className="absolute bottom-40 left-1/4 w-36 h-36 bg-yellow-200 rounded-full blur-3xl"></div>
        </div>

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
      </div>

      {/* Hero Section with Clean Design */}
      <section className="relative min-h-screen flex items-center justify-center px-4" style={getTransformStyle()}>
        <div className="text-center z-10 max-w-5xl mx-auto">
          {/* Subtle Floating Food Icons */}
          <div className="absolute inset-0 pointer-events-none">
            {foodIcons.map(({ Icon, delay, color }, index) => (
              <div
                key={index}
                className={`absolute ${color} opacity-40`}
                style={{
                  left: `${10 + (index * 13)}%`,
                  top: `${15 + Math.sin(index) * 25}%`,
                  animation: `gentle-float 4s ease-in-out infinite ${delay}`
                }}
              >
                <Icon size={32} />
              </div>
            ))}
          </div>

          {/* Clean Logo Design */}
          <div className="mb-12 relative">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg mb-8">
              <ChefHat className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Professional Title */}
          <div className="relative mb-8">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-4 tracking-tight">
              Food<span className="text-orange-600">Chain</span>
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-red-500 mx-auto rounded-full"></div>
          </div>

          {/* Clean Subtitle */}
          <div className="mb-16">
            <p className="text-xl md:text-2xl text-gray-700 mb-4 font-light">
              Connecting Suppliers with Street Food Vendors
            </p>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Streamline your supply chain, reduce costs, and grow your street food business with our intelligent platform
            </p>
          </div>

          {/* Professional CTA Button */}
          <div className="relative">
            <button
              onClick={() => window.location.href = '/login'}
              className="group relative px-12 py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 rounded-xl text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center space-x-3">
                <Store className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                <span>Get Started Today</span>
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full group-hover:scale-150 transition-transform duration-300"></div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Features Section with Professional Design */}
      <section className="py-24 px-4 relative bg-gray-50">
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium mb-6">
              <Award className="w-4 h-4 mr-2" />
              Why Choose Our Platform
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Built for Street Food Success
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Our platform combines cutting-edge technology with deep understanding of street food business needs
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl border border-gray-100 hover:border-orange-200 transition-all duration-500 hover:-translate-y-2"
              >
                {/* Icon with Clean Background */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-orange-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Image and Info Section */}
      <section className="py-24 px-4 relative bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left side - Professional Image */}
            <div className="relative order-2 lg:order-1">
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 shadow-sm">
                <div className="aspect-square bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl overflow-hidden relative">
                  <img 
                    src="/stall.png" 
                    alt="Street Food Vendor" 
                    className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-2xl"></div>
                </div>

                {/* Clean decorative elements */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-orange-500 rounded-lg rotate-45 opacity-80"></div>
                <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-red-500 rounded-full opacity-60"></div>
              </div>
            </div>

            {/* Right side - Professional Information */}
            <div className="space-y-8 order-1 lg:order-2">
              <div>
                <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-6">
                  <Handshake className="w-4 h-4 mr-2" />
                  Our Mission
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  Bridging the Gap Between 
                  <span className="block text-orange-600 mt-2">Suppliers & Vendors</span>
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  We connect raw material suppliers directly with street food vendors, eliminating middlemen and ensuring fair prices for quality ingredients. Join thousands of vendors already growing their business with us.
                </p>
              </div>

              <div className="grid gap-6">
                <div className="flex items-start space-x-4 group">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Handshake className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      Direct Partnerships
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Connect directly with verified suppliers and build lasting business relationships that benefit both parties.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 group">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                      Quality Assured
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      All suppliers are thoroughly verified and materials undergo strict quality checks before delivery.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 group">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                      Smart Technology
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Leverage AI-powered logistics and inventory management for the most efficient operations possible.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="relative bg-gray-900 py-16 overflow-hidden">
        {/* Subtle Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"></div>
        </div>

        {/* Main Footer Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
          {/* Team Section */}
          <div className="mb-12">
            <p className="text-gray-400 text-lg mb-4">Proudly developed by</p>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent mb-6">
              Team Zenith
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-orange-400 to-red-400 mx-auto rounded-full"></div>
          </div>

          {/* Icons */}
          <div className="flex justify-center space-x-6 mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300">
              <Zap className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Footer Message */}
          <p className="text-gray-400 text-lg mb-6">
            Empowering the future of street food supply chains across India
          </p>
          
          {/* Year */}
          <div className="text-gray-500 text-sm border-t border-gray-800 pt-8">
            © 2025 Food Chain Platform. All rights reserved.
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes gentle-float {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg); 
            opacity: 0.4;
          }
          50% { 
            transform: translateY(-10px) rotate(2deg); 
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
};

export default SupplyChainLanding;