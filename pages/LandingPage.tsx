import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, AlertTriangle, Users, Shield, Trash2, Lightbulb, Bell, ArrowRight } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-emerald-800 via-teal-700 to-emerald-600 overflow-hidden">
        <div className="absolute inset-0">
          <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
             <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
          </svg>
          <img 
            src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
            className="w-full h-full object-cover opacity-10 mix-blend-overlay" 
            alt="Community"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-40">
          <div className="max-w-6xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-8 leading-tight drop-shadow-md uppercase">
              Community Waste Track And<br className="hidden lg:block"/> Neighboring Alert System
            </h1>
            <p className="text-xl md:text-2xl text-emerald-50 mb-10 max-w-2xl leading-relaxed opacity-90 font-light">
              The CWTNAS platform integrates real-time waste tracking with instant infrastructure reporting to create a cohesive, responsive community system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => navigate('/login')}
                  className="bg-gradient-to-r from-orange-400 to-orange-500 text-white px-8 py-5 rounded-xl font-bold text-xl shadow-xl shadow-orange-900/20 hover:shadow-orange-900/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  Access Resident Portal <ArrowRight size={24} />
                </button>
                <button 
                   onClick={() => navigate('/login')} // Redirect to login for officials too in this demo
                   className="bg-white/10 backdrop-blur-md border border-white/30 text-white px-8 py-5 rounded-xl font-bold text-xl hover:bg-white/20 transition-all"
                >
                   Official Login
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights Section (Glass Cards) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 -mt-20 mb-12">
        <div className="grid md:grid-cols-3 gap-6">
           
           {/* Card 1 */}
           <div className="bg-white/90 backdrop-blur-xl p-8 rounded-2xl shadow-xl shadow-stone-200/50 flex flex-col items-center text-center transition-all hover:-translate-y-2 border border-white/50">
              <div className="h-16 w-16 bg-gradient-to-br from-green-100 to-emerald-50 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 shadow-inner">
                 <Trash2 size={32} />
              </div>
              <h3 className="text-2xl font-bold text-stone-800 mb-3">Live Waste Tracking</h3>
              <p className="text-stone-500 text-base leading-relaxed px-2">
                 Real-time monitoring of waste collection trucks so you never miss a pickup again.
              </p>
           </div>
           
           {/* Card 2 */}
           <div className="bg-white/90 backdrop-blur-xl p-8 rounded-2xl shadow-xl shadow-stone-200/50 flex flex-col items-center text-center transition-all hover:-translate-y-2 border border-white/50">
              <div className="h-16 w-16 bg-gradient-to-br from-amber-100 to-orange-50 rounded-2xl flex items-center justify-center mb-6 text-amber-500 shadow-inner">
                 <Lightbulb size={32} />
              </div>
              <h3 className="text-2xl font-bold text-stone-800 mb-3">Quick Reporting</h3>
              <p className="text-stone-500 text-base leading-relaxed px-2">
                 Instantly report broken streetlights, potholes, and drainage issues with photos.
              </p>
           </div>

           {/* Card 3 */}
           <div className="bg-white/90 backdrop-blur-xl p-8 rounded-2xl shadow-xl shadow-stone-200/50 flex flex-col items-center text-center transition-all hover:-translate-y-2 border border-white/50">
              <div className="h-16 w-16 bg-gradient-to-br from-blue-100 to-indigo-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 shadow-inner">
                 <Bell size={32} />
              </div>
              <h3 className="text-2xl font-bold text-stone-800 mb-3">Community Alerts</h3>
              <p className="text-stone-500 text-base leading-relaxed px-2">
                 Get automated notifications about schedule changes and community announcements.
              </p>
           </div>

        </div>
      </div>

      {/* Objectives Section */}
      <div className="py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-16">
             <span className="text-emerald-600 font-bold tracking-wider uppercase text-sm">About The Project</span>
             <h2 className="text-4xl lg:text-5xl font-extrabold text-stone-800 mt-2 mb-8">Project Objectives</h2>
             
             <div className="max-w-4xl mx-auto text-stone-600 space-y-6 text-lg leading-relaxed bg-white/50 p-6 rounded-3xl border border-stone-100">
                <p className="font-bold text-emerald-800 text-xl">
                    The general objective of this project is to develop a digital barangay management system that improves waste collection 
                    and streetlight maintenance through real-time reporting, tracking, and coordination.
                </p>
             </div>
           </div>

           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all border border-stone-100 group">
                 <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <AlertTriangle />
                 </div>
                 <h3 className="font-bold text-xl mb-3 text-stone-800">Identify Challenges</h3>
                 <p className="text-stone-500 text-sm">To identify key challenges in barangay waste management and streetlight maintenance.</p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all border border-stone-100 group">
                 <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Truck />
                 </div>
                 <h3 className="font-bold text-xl mb-3 text-stone-800">Data-Driven System</h3>
                 <p className="text-stone-500 text-sm">To develop a digital, data-driven system for tracking waste collection and infrastructure reports.</p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all border border-stone-100 group">
                 <div className="h-12 w-12 bg-purple-50 rounded-xl flex items-center justify-center mb-6 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <Users />
                 </div>
                 <h3 className="font-bold text-xl mb-3 text-stone-800">Improve Coordination</h3>
                 <p className="text-stone-500 text-sm">To improve coordination and communication between residents, waste collectors, and barangay officials.</p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all border border-stone-100 group">
                 <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center mb-6 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <Shield />
                 </div>
                 <h3 className="font-bold text-xl mb-3 text-stone-800">Enhance Safety</h3>
                 <p className="text-stone-500 text-sm">To enhance public safety by enabling fast reporting and monitoring of streetlight or any infrastructure issues.</p>
              </div>
           </div>
        </div>
      </div>

      {/* CTA */}
      <div className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600"></div>
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px'}}></div>
        
        <div className="relative max-w-4xl mx-auto px-4 text-center text-white">
           <h2 className="text-4xl lg:text-5xl font-extrabold mb-6">Ready to Get Started?</h2>
           <p className="text-emerald-100 mb-10 text-xl max-w-2xl mx-auto">Join the digital transformation of our barangay. Sign up today to start tracking and reporting.</p>
           <button 
             onClick={() => navigate('/login')}
             className="bg-white text-emerald-700 px-10 py-5 rounded-xl font-bold text-xl shadow-2xl hover:bg-stone-50 transition-colors transform hover:scale-105 duration-200"
           >
             Create Free Account
           </button>
        </div>
      </div>

      {/* Footer / Copyright */}
      <footer className="bg-stone-50 py-8 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-stone-400 text-sm font-medium">
            &copy; 2024-2025 CWTNAS - Community Waste Tracking and Neighboring Alert System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;