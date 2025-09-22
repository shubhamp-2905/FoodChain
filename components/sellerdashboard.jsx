'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FaChartLine, 
  FaStore, 
  FaCertificate, 
  FaClipboardCheck, 
  FaUser, 
  FaCog, 
  FaBoxOpen, 
  FaCommentAlt, 
  FaUtensils, 
  FaBars, 
  FaChevronRight,
  FaTimes 
} from 'react-icons/fa';

const SellerDashboardLayout = ({ children }) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      href: '/seller-dashboard',
      icon: FaChartLine,
      label: 'Dashboard',
      description: 'Overview & Analytics'
    },
    {
      href: '/seller-dashboard/products',
      icon: FaBoxOpen,
      label: 'My Products',
      description: 'Manage your inventory'
    },
    {
      href: '/seller-dashboard/certificates',
      icon: FaCertificate,
      label: 'Hygiene Certificates',
      description: 'Quality compliance'
    },
    {
      href: '/seller-dashboard/reviews',
      icon: FaCommentAlt,
      label: 'Customer Reviews',
      description: 'Feedback & ratings'
    },
    {
      href: '/sellerdashboard/quality-checks',
      icon: FaClipboardCheck,
      label: 'Quality Checks',
      description: 'Safety inspections'
    }
  ];

  const accountItems = [
    {
      href: '/seller-dashboard/profile',
      icon: FaUser,
      label: 'Profile',
      description: 'Account settings'
    },
    {
      href: '/seller-dashboard/settings',
      icon: FaCog,
      label: 'Settings',
      description: 'Preferences'
    }
  ];

  const NavItem = ({ item, onClick, isMobile = false }) => {
    const isActive = pathname === item.href;
    return (
      <Link href={item.href} passHref>
        <div 
          className={`group relative flex items-center p-3 rounded-xl cursor-pointer transition-all duration-300 ${
            isActive 
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg' 
              : 'hover:bg-gray-50 hover:shadow-sm text-gray-700 hover:text-gray-900'
          } ${isMobile ? 'mb-2' : 'mb-1'}`}
          onClick={onClick}
        >
          <div className={`flex items-center justify-center w-9 h-9 rounded-lg mr-3 transition-all duration-300 ${
            isActive 
              ? 'bg-white/20' 
              : 'bg-gradient-to-br from-orange-100 to-red-100 group-hover:from-orange-200 group-hover:to-red-200'
          }`}>
            <item.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-orange-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-gray-900'}`}>
              {item.label}
            </div>
            <div className={`text-xs mt-0.5 ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
              {item.description}
            </div>
          </div>
          {isActive && !isMobile && (
            <FaChevronRight className="w-3 h-3 text-white ml-2" />
          )}
        </div>
      </Link>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 relative">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-orange-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-red-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-yellow-200/10 rounded-full blur-2xl"></div>
        
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

      {/* Mobile Header */}
      <div className="lg:hidden bg-white/95 backdrop-blur-md border-b border-gray-200 text-gray-900 p-4 flex items-center justify-between relative z-20 shadow-sm">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-3 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 hover:from-orange-200 hover:to-red-200 transition-all duration-300 shadow-md"
        >
          {mobileMenuOpen ? (
            <FaTimes size={20} className="text-orange-600" />
          ) : (
            <FaBars size={20} className="text-orange-600" />
          )}
        </button>
        <div className="flex items-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg mr-3">
            <FaUtensils className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">FoodChain</h1>
        </div>
        <div className="w-12"></div> {/* Spacer for balance */}
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="absolute top-0 left-0 w-80 h-full bg-white shadow-2xl overflow-y-auto">
            <div className="p-6">
              {/* Mobile Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg mr-3">
                    <FaUtensils className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">FoodChain</h2>
                    <p className="text-sm text-orange-600">Seller Dashboard</p>
                  </div>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <FaTimes size={20} className="text-gray-500" />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="space-y-2 mb-6">
                {navigationItems.map((item) => (
                  <NavItem 
                    key={item.href} 
                    item={item} 
                    onClick={() => setMobileMenuOpen(false)}
                    isMobile={true}
                  />
                ))}
              </div>

              {/* Account Section */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 mb-4 px-4">ACCOUNT</h3>
                <div className="space-y-2">
                  {accountItems.map((item) => (
                    <NavItem 
                      key={item.href} 
                      item={item} 
                      onClick={() => setMobileMenuOpen(false)}
                      isMobile={true}
                    />
                  ))}
                </div>
              </div>

              {/* Note */}
              <div className="mt-8 p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border border-orange-100">
                <p className="text-xs text-gray-600 leading-relaxed">
                  <span className="font-semibold text-orange-800">Note:</span> The data used for the project is fetched through registration and dummy data along with registered ones are used for model training.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-72 h-screen bg-white/95 backdrop-blur-md border-r border-gray-200 flex-col relative z-10 shadow-sm overflow-hidden">
        {/* Logo Section */}
        <div className="p-6 pb-4 border-b border-gray-100">
          <div className="flex items-center mb-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg mr-3">
              <FaUtensils className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">FoodChain</h1>
              <p className="text-orange-600 text-xs font-medium">Seller Dashboard</p>
            </div>
          </div>
          <p className="text-gray-600 text-xs bg-gradient-to-r from-orange-50 to-red-50 p-2.5 rounded-lg border border-orange-100">
            Your professional food business hub
          </p>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 mb-3 px-3">MAIN MENU</h3>
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
            </div>
          </div>

          {/* Account Section */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 mb-3 px-3">ACCOUNT</h3>
            <div className="space-y-1">
              {accountItems.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="p-6 pt-4 border-t border-gray-100">
          <div className="p-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-100">
            <div className="flex items-start">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
              <p className="text-xs text-gray-600 leading-relaxed">
                <span className="font-semibold text-orange-800">Note:</span> Data is fetched through registration and dummy data for model training.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto relative z-10">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-gray-100 min-h-full p-6 lg:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboardLayout;