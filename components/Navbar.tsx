import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, FileWarning, Truck, Database, User, Recycle, Map, Menu, X, Trash2, AlertTriangle, Calendar, ShieldCheck } from 'lucide-react';
import { UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  userRole: UserRole | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ userRole, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { deleteAccount } = useAuth();
  
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  if (!userRole || userRole === UserRole.GUEST) return null;

  const isActive = (path: string) => location.pathname === path;

  // Refined Pastel Green Strategy for Links
  // Inactive: Deep Sage (#4F7942)
  // Active: Action Green (#77DD77) background with White text
  const desktopLinkClass = (path: string) => `
    flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300
    ${isActive(path) 
      ? 'bg-[#77DD77] text-white shadow-lg shadow-[#77DD77]/30 transform -translate-y-0.5' 
      : 'text-[#4F7942] hover:bg-[#F1F8E8] hover:text-[#3D5E34] hover:shadow-sm'}
  `;

  const mobileLinkClass = (path: string) => `
    flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all
    ${isActive(path) 
      ? 'bg-[#F1F8E8] text-[#4F7942] border-l-4 border-[#77DD77]' 
      : 'text-[#4F7942] hover:bg-slate-50'}
  `;

  const getHomeLink = () => {
    switch(userRole) {
      case UserRole.ADMIN: return '/admin/dashboard';
      case UserRole.DRIVER: return '/driver/dashboard';
      case UserRole.RESIDENT: default: return '/resident';
    }
  };

  const getRoleLabel = () => {
    switch(userRole) {
      case UserRole.ADMIN: return 'Admin';
      case UserRole.DRIVER: return 'Driver';
      case UserRole.RESIDENT: default: return 'Resident';
    }
  };

  // Role Specific Styling
  const getRoleBadgeStyle = () => {
    switch(userRole) {
      case UserRole.ADMIN: 
        return { bg: 'bg-amber-400', text: 'text-amber-800', border: 'border-amber-100', hover: 'hover:bg-amber-50' };
      case UserRole.DRIVER: 
        return { bg: 'bg-blue-400', text: 'text-blue-800', border: 'border-blue-100', hover: 'hover:bg-blue-50' };
      case UserRole.RESIDENT: 
      default: 
        return { bg: 'bg-[#77DD77]', text: 'text-[#4F7942]', border: 'border-[#F1F8E8]', hover: 'hover:bg-[#F1F8E8]' };
    }
  };

  const roleStyle = getRoleBadgeStyle();

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    setShowSettingsModal(false);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
    setShowSettingsModal(false);
  };

  const confirmDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete account");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const renderNavLinks = (isMobile: boolean) => {
    const linkClass = isMobile ? mobileLinkClass : desktopLinkClass;
    
    return (
      <>
        {userRole === UserRole.RESIDENT && (
          <>
            <Link to="/resident/dashboard" className={linkClass('/resident/dashboard')}>
              <LayoutDashboard size={isMobile ? 20 : 18} /> <span className={!isMobile ? "hidden lg:inline" : ""}>Dashboard</span>
            </Link>
            <Link to="/resident/schedule" className={linkClass('/resident/schedule')}>
              <Calendar size={isMobile ? 20 : 18} /> <span className={!isMobile ? "hidden lg:inline" : ""}>Schedule</span>
            </Link>
            <Link to="/resident/tracking" className={linkClass('/resident/tracking')}>
              <Map size={isMobile ? 20 : 18} /> <span className={!isMobile ? "hidden lg:inline" : ""}>Live Map</span>
            </Link>
            <Link to="/resident/report" className={linkClass('/resident/report')}>
              <FileWarning size={isMobile ? 20 : 18} /> Report
            </Link>
            <Link to="/resident/bins" className={linkClass('/resident/bins')}>
              <Recycle size={isMobile ? 20 : 18} /> Bins
            </Link>
          </>
        )}

        {userRole === UserRole.DRIVER && (
          <Link to="/driver/dashboard" className={linkClass('/driver/dashboard')}>
            <Truck size={isMobile ? 20 : 18} /> My Routes
          </Link>
        )}

        {userRole === UserRole.ADMIN && (
          <>
            <Link to="/admin/dashboard" className={linkClass('/admin/dashboard')}>
              <LayoutDashboard size={isMobile ? 20 : 18} /> <span className={!isMobile ? "hidden lg:inline" : ""}>Dash</span>
            </Link>
            <Link to="/admin/waste" className={linkClass('/admin/waste')}>
              <Truck size={isMobile ? 20 : 18} /> <span className={!isMobile ? "hidden lg:inline" : ""}>Track</span>
            </Link>
            <Link to="/admin/infrastructure" className={linkClass('/admin/infrastructure')}>
              <FileWarning size={isMobile ? 20 : 18} /> Infra
            </Link>
            <Link to="/admin/bins" className={linkClass('/admin/bins')}>
              <Recycle size={isMobile ? 20 : 18} /> Bins
            </Link>
            <Link to="/admin/records" className={linkClass('/admin/records')}>
              <Database size={isMobile ? 20 : 18} /> Data
            </Link>
          </>
        )}
      </>
    );
  };

  return (
    <>
      {/* Top Navigation Bar - Floating & Rounded */}
      <div className="fixed top-6 left-6 right-6 z-50">
        <nav className="glass-panel max-w-7xl mx-auto px-6 h-20 flex items-center justify-between rounded-3xl shadow-soft">
            
            {/* Logo Section */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(getHomeLink())}>
               <div className="flex flex-col">
                  <span className="font-extrabold text-2xl leading-none text-[#4F7942] tracking-tight">CWTNAS</span>
                  <span className="text-[10px] font-bold text-[#77DD77] uppercase tracking-widest mt-1">Community Platform</span>
               </div>
            </div>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-2">
              {renderNavLinks(false)}
            </div>

            {/* User Profile & Mobile Menu Toggle */}
            <div className="flex items-center gap-3">
               
               <button 
                  onClick={() => setShowSettingsModal(true)}
                  className={`hidden md:flex items-center gap-2 px-4 py-2 bg-white ${roleStyle.hover} text-[#4F7942] rounded-full transition-all border ${roleStyle.border} shadow-sm`}
                >
                  <div className={`w-6 h-6 ${roleStyle.bg} rounded-full flex items-center justify-center text-white shadow-sm`}>
                     {userRole === UserRole.ADMIN ? <ShieldCheck size={14} /> : userRole === UserRole.DRIVER ? <Truck size={14}/> : <User size={14} />}
                  </div>
                  <span className={`text-xs font-bold ${roleStyle.text}`}>{getRoleLabel()}</span>
                </button>

              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`md:hidden p-3 text-[#4F7942] bg-[#F1F8E8] rounded-full hover:bg-[#77DD77] hover:text-white transition-colors`}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
        </nav>
      </div>

      {/* Spacer for fixed navbar */}
      <div className="h-32"></div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden bg-[#4F7942]/20 backdrop-blur-md">
           <div className="absolute top-28 left-6 right-6 bg-white rounded-3xl shadow-2xl p-6 flex flex-col animate-slide-up">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                 <h2 className="text-lg font-bold text-[#4F7942]">Menu</h2>
                 <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-[#F1F8E8] rounded-full text-[#4F7942]"><X size={20}/></button>
              </div>
              
              <div className="flex flex-col gap-2 flex-1 overflow-y-auto max-h-[60vh]">
                 {renderNavLinks(true)}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                 <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${roleStyle.bg} rounded-full flex items-center justify-center text-white`}>
                       <User size={20} />
                    </div>
                    <div>
                       <p className="font-bold text-[#4F7942]">My Account</p>
                       <p className={`text-xs ${roleStyle.text}`}>{getRoleLabel()}</p>
                    </div>
                 </div>
                 <button onClick={handleLogoutClick} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                    <LogOut size={18} /> Sign Out
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 animate-fade-in">
           <div className="glass-panel bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6 relative">
             <button onClick={() => setShowSettingsModal(false)} className="absolute top-4 right-4 p-2 bg-[#F1F8E8] hover:bg-slate-100 rounded-full text-[#4F7942] transition-colors"><X size={20} /></button>
             
             <div className="flex flex-col items-center mb-6 pt-2">
                <div className={`w-20 h-20 ${roleStyle.bg} rounded-full flex items-center justify-center text-white mb-4 shadow-xl`}>
                   {userRole === UserRole.ADMIN ? <ShieldCheck size={40} /> : userRole === UserRole.DRIVER ? <Truck size={40}/> : <User size={40} />}
                </div>
                <h3 className="font-bold text-xl text-[#4F7942]">{getRoleLabel()}</h3>
                <span className={`text-xs font-bold uppercase tracking-wide mt-1 bg-[#F1F8E8] px-3 py-1 rounded-full ${roleStyle.text}`}>Active Session</span>
             </div>

             <div className="space-y-3">
                <button 
                  onClick={handleLogoutClick}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-white border border-slate-100 hover:shadow-md rounded-2xl text-slate-700 font-bold transition-all"
                >
                  <span className="flex items-center gap-3"><LogOut size={20} className="text-slate-400"/> Sign Out</span>
                </button>
                
                <button 
                  onClick={handleDeleteClick}
                  className="w-full flex items-center justify-between p-4 bg-white border border-red-100 hover:bg-red-50 hover:border-red-200 rounded-2xl text-red-600 font-bold transition-all"
                >
                  <span className="flex items-center gap-3"><Trash2 size={20} className="opacity-50"/> Delete Account</span>
                </button>
             </div>
           </div>
        </div>
      )}

      {/* Logout Confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
              <h3 className="text-xl font-bold text-[#4F7942] mb-2">Confirm Logout</h3>
              <p className="text-slate-500 mb-8 text-sm leading-relaxed">Are you sure you want to end your session?</p>
              <div className="flex gap-4">
                <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button onClick={confirmLogout} className={`flex-1 py-3 font-bold text-white rounded-xl shadow-lg transition-colors ${roleStyle.bg}`}>Logout</button>
              </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-red-900/10 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-t-8 border-red-500">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                 <AlertTriangle size={32} />
              </div>
              <h3 className="text-2xl font-bold text-red-600 mb-2">Delete Account</h3>
              <p className="text-slate-600 text-sm mb-8 leading-relaxed">This action is <span className="font-bold">permanent</span> and cannot be undone. All your reports and data will be erased.</p>
              <div className="flex flex-col gap-3">
                <button onClick={confirmDeleteAccount} disabled={isDeleting} className="w-full py-4 font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-colors">{isDeleting ? 'Deleting...' : 'Yes, Delete Everything'}</button>
                <button onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting} className="w-full py-4 font-bold text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
              </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;