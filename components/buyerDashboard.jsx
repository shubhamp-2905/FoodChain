
'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { FaWhatsapp, FaShoppingBasket, FaHome, FaUtensils, FaUser, FaCog, FaStore, FaBars, FaChevronRight, FaCashRegister } from 'react-icons/fa';

// Component that uses searchParams (must be client-side)
function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const createHref = (path) => `${path}${userId ? `?userId=${userId}` : ''}`;

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-gradient-to-r from-orange-600 to-red-700 text-white p-4 flex items-center justify-between shadow-lg">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
        >
          <FaBars size={20} />
        </button>
        <h1 className="text-xl font-bold flex items-center">
          <FaUtensils className="mr-2 text-orange-200" /> 
          <span>Food<span className="text-orange-200">Chain</span></span>
        </h1>
        <div className="w-8"></div> {/* Spacer for balance */}
      </div>

      {/* Mobile Breadcrumb Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white shadow-xl rounded-b-2xl mx-4 mb-4 border border-gray-100 absolute z-20 w-[calc(100%-2rem)]">
          <div className="p-4 space-y-2">
            <Link href={createHref("/buyerdashboard")} passHref>
              <div 
                className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  pathname === '/buyerdashboard' 
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md' 
                    : 'hover:bg-orange-50 text-gray-700'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <FaHome className="mr-3" /> Dashboard
                {pathname === '/buyerdashboard' && <FaChevronRight className="ml-auto" />}
              </div>
            </Link>
            <Link href={createHref("/buyerdashboard/buyitems")} passHref>
              <div 
                className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  pathname === '/buyerdashboard/buyitems' 
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md' 
                    : 'hover:bg-orange-50 text-gray-700'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <FaShoppingBasket className="mr-3" /> Buy Items
                {pathname === '/buyerdashboard/buyitems' && <FaChevronRight className="ml-auto" />}
              </div>
            </Link>
            <Link href={createHref("/buyerdashboard/sellers")} passHref>
              <div 
                className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  pathname === '/buyerdashboard/sellers' 
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md' 
                    : 'hover:bg-orange-50 text-gray-700'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <FaStore className="mr-3" /> Suggestions
                {pathname === '/buyerdashboard/sellers' && <FaChevronRight className="ml-auto" />}
              </div>
            </Link>
            <Link href={createHref("/buyerdashboard/setsales")} passHref>
              <div 
                className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  pathname === '/buyerdashboard/setsales' 
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md' 
                    : 'hover:bg-orange-50 text-gray-700'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <FaCashRegister className="mr-3" /> Enter Sales
                {pathname === '/buyerdashboard/setsales' && <FaChevronRight className="ml-auto" />}
              </div>
            </Link>
            <a 
              href="https://chat.whatsapp.com/CgQOF3pSRttKlZwXlytKSh" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center p-3 rounded-xl cursor-pointer hover:bg-green-50 text-gray-700 transition-all duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <FaWhatsapp className="mr-3 text-green-500" /> Join Community
            </a>
          </div>
        </div>
      )}

      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:flex flex-col w-72 bg-white shadow-xl border-r border-gray-100">
        {/* Sidebar Header */}
        <div className="p-6 bg-gradient-to-r from-orange-500 to-red-600">
          <h1 className="text-2xl font-bold text-white flex items-center mb-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
              <FaUtensils className="text-white" />
            </div>
            Food<span className="text-orange-100">Chain</span>
          </h1>
          <p className="text-orange-100 text-sm font-medium">Your food marketplace</p>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <Link href={createHref("/buyerdashboard")} passHref>
              <div className={`flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200 group ${
                pathname === '/buyerdashboard' 
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg' 
                  : 'hover:bg-orange-50 text-gray-700 hover:shadow-md'
              }`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${
                  pathname === '/buyerdashboard' 
                    ? 'bg-white/20' 
                    : 'bg-orange-100 group-hover:bg-orange-200'
                }`}>
                  <FaHome className={`${pathname === '/buyerdashboard' ? 'text-white' : 'text-orange-600'}`} />
                </div>
                <span className="font-medium">Dashboard</span>
              </div>
            </Link>

            <Link href={createHref("/buyerdashboard/buyitems")} passHref>
              <div className={`flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200 group ${
                pathname === '/buyerdashboard/buyitems' 
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg' 
                  : 'hover:bg-orange-50 text-gray-700 hover:shadow-md'
              }`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${
                  pathname === '/buyerdashboard/buyitems' 
                    ? 'bg-white/20' 
                    : 'bg-orange-100 group-hover:bg-orange-200'
                }`}>
                  <FaShoppingBasket className={`${pathname === '/buyerdashboard/buyitems' ? 'text-white' : 'text-orange-600'}`} />
                </div>
                <span className="font-medium">Buy Items</span>
              </div>
            </Link>

            <Link href="/buyerdashboard/suggestions" passHref>
              <div className={`flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200 group ${
                pathname === '/buyerdashboard/suggestions' 
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg' 
                  : 'hover:bg-orange-50 text-gray-700 hover:shadow-md'
              }`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${
                  pathname === '/buyerdashboard/suggestions' 
                    ? 'bg-white/20' 
                    : 'bg-orange-100 group-hover:bg-orange-200'
                }`}>
                  <FaStore className={`${pathname === '/buyerdashboard/suggestions' ? 'text-white' : 'text-orange-600'}`} />
                </div>
                <span className="font-medium">Suggestions</span>
              </div>
            </Link>

            <Link href="/buyerdashboard/setsales" passHref>
              <div className={`flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200 group ${
                pathname === '/buyerdashboard/setsales' 
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg' 
                  : 'hover:bg-orange-50 text-gray-700 hover:shadow-md'
              }`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${
                  pathname === '/buyerdashboard/setsales' 
                    ? 'bg-white/20' 
                    : 'bg-orange-100 group-hover:bg-orange-200'
                }`}>
                  <FaCashRegister className={`${pathname === '/buyerdashboard/setsales' ? 'text-white' : 'text-orange-600'}`} />
                </div>
                <span className="font-medium">Enter Sales</span>
              </div>
            </Link>

            {/* Divider */}
            <div className="my-4">
              <div className="h-px bg-gray-200"></div>
            </div>

            {/* WhatsApp Community Link */}
            <a 
              href="https://chat.whatsapp.com/CgQOF3pSRttKlZwXlytKSh" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center p-4 rounded-xl cursor-pointer hover:bg-green-50 text-gray-700 hover:shadow-md transition-all duration-200 group"
            >
              <div className="w-10 h-10 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center mr-4">
                <FaWhatsapp className="text-green-600" />
              </div>
              <span className="font-medium">Join Community</span>
            </a>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <div className="text-xs text-gray-500 text-center">
            <p>© 2025 FoodChain Platform</p>
            <p className="mt-1">Built by Team Zenith</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
      <Suspense fallback={
        <div className="w-72 bg-white shadow-xl border-r border-gray-100">
          <div className="p-6 bg-gradient-to-r from-orange-500 to-red-600">
            <div className="animate-pulse space-y-3">
              <div className="h-8 bg-orange-400/30 rounded"></div>
              <div className="h-4 bg-orange-400/20 rounded"></div>
            </div>
          </div>
          <div className="p-4 animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      }>
        <SidebarContent />
      </Suspense>

      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

// // export default DashboardLayout;
// 'use client';
// import { Suspense } from 'react';
// import Link from 'next/link';
// import { usePathname, useSearchParams } from 'next/navigation';
// import { FaWhatsapp, FaShoppingBasket, FaHome, FaUtensils, FaUser, FaCog, FaStore } from 'react-icons/fa';

// // Component that uses searchParams (must be client-side)
// function SidebarContent() {
//   const pathname = usePathname();
//   const searchParams = useSearchParams();
//   const userId = searchParams.get('userId');

//   const createHref = (path) => `${path}${userId ? `?userId=${userId}` : ''}`;

//   return (
//     <div className="w-64 bg-[#213A57] text-white p-4 flex flex-col">
//       <div className="mb-8">
//         <h1 className="text-2xl font-bold flex items-center cinzel-bold">
//           <FaUtensils className="mr-2" /> Food Chain
//         </h1>
//         <p className="text-[#0AD1C8] text-sm lobster-two-bold-italic">Your food marketplace</p>
//       </div>

//       <nav className="flex-1">
//         <ul className="space-y-2">
//           <li>
//             <Link href={createHref("/buyerdashboard")} passHref>
//               <div className={`flex items-center p-3 rounded-lg cursor-pointer ${pathname === '/buyerdashboard' ? 'bg-[#086477]' : 'hover:bg-[#14919B]'}`}>
//                 <FaHome className="mr-3" /> Dashboard
//               </div>
//             </Link>
//           </li>
//           <li>
//             <Link href={createHref("/buyerdashboard/buyitems")} passHref>
//               <div className={`flex items-center p-3 rounded-lg cursor-pointer ${pathname === '/buyerdashboard/buyitems' ? 'bg-[#086477]' : 'hover:bg-[#14919B]'}`}>
//                 <FaShoppingBasket className="mr-3" /> Buy Items
//               </div>
//             </Link>
//           </li>
//           <li>
//             <Link href={createHref("/buyerdashboard/sellers")} passHref>
//               <div className={`flex items-center p-3 rounded-lg cursor-pointer ${pathname === '/buyerdashboard/sellers' ? 'bg-[#086477]' : 'hover:bg-[#14919B]'}`}>
//                 <FaStore className="mr-3" /> Suggestions
//               </div>
//             </Link>
//           </li>
//           <li>
//             <a 
//               href="https://chat.whatsapp.com/CgQOF3pSRttKlZwXlytKSh" 
//               target="_blank" 
//               rel="noopener noreferrer"
//               className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-[#14919B]"
//             >
//               <FaWhatsapp className="mr-3" /> Join Community
//             </a>
//           </li>
//         </ul>
//       </nav>

    
//     </div>
//   );
// }

// export default function DashboardLayout({ children }) {
//   return (
//     <div className="flex h-screen bg-[#f5f5f5]">
//       <Suspense fallback={
//         <div className="w-64 bg-[#213A57] p-4">
//           <div className="animate-pulse space-y-4">
//             <div className="h-8 bg-gray-700 rounded"></div>
//             <div className="h-4 bg-gray-700 rounded"></div>
//             {[...Array(6)].map((_, i) => (
//               <div key={i} className="h-10 bg-gray-700 rounded"></div>
//             ))}
//           </div>
//         </div>
//       }>
//         <SidebarContent />
//       </Suspense>

//       <div className="flex-1 overflow-auto p-8">
//         {children}
//       </div>
//     </div>
//   );
// }