import React, { useState, useEffect } from 'react';
import { AlertCircle, MapPin, Clock, CheckCircle, ChevronRight, X, FileText, CheckCircle2, Circle, Plus, Leaf, Recycle, Map, Truck, BarChart3 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Report, ReportStatus, Alert, WasteRoute } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { firestore } from '../services/firebase';
import WasteMap from '../components/WasteMap';

// Default Center (Manila)
const DEFAULT_CENTER: [number, number] = [14.5995, 120.9842];

const SkeletonLoader = () => (
  <div className="space-y-3">
    {[1, 2].map((i) => (
      <div key={i} className="bg-white/60 border border-white rounded-2xl p-4 shadow-soft animate-pulse">
        <div className="flex justify-between items-start mb-2">
           <div className="h-4 w-1/3 bg-slate-200 rounded"></div>
           <div className="h-5 w-16 bg-slate-200 rounded"></div>
        </div>
        <div className="h-3 w-1/2 bg-slate-200 rounded"></div>
      </div>
    ))}
  </div>
);

const EmptyState = () => (
  <div className="text-center py-10 px-6 bg-[#F9FCFA] rounded-2xl border border-dashed border-[#77DD77] flex flex-col items-center">
    <div className="h-12 w-12 bg-[#F1F8E8] rounded-full flex items-center justify-center mb-3 text-[#77DD77]">
       <FileText size={20} />
    </div>
    <h3 className="text-sm font-bold text-[#4F7942]">No Reports Yet</h3>
    <p className="text-slate-400 text-xs mt-1">Reports you submit will appear here.</p>
  </div>
);

const ResidentDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Map Data
  const [activeRoutes, setActiveRoutes] = useState<WasteRoute[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);

  // Fetch Reports
  useEffect(() => {
    const fetchReports = async () => {
      if (!currentUser) return;
      setLoading(true);
      setError(null);
      
      try {
        if (!firestore) throw new Error("Database not connected");
        
        const querySnapshot = await firestore.collection('reports')
          .where('reporterId', '==', currentUser.id)
          .get();
        
        const reportsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Report[];

        // Sort by date manually if needed, or rely on Firestore index
        reportsData.sort((a, b) => new Date(b.dateReported).getTime() - new Date(a.dateReported).getTime());

        setMyReports(reportsData);
      } catch (err: any) {
        console.error("Error fetching reports:", err);
        setError("Unable to retrieve reports.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [currentUser]);

  // Fetch Live Routes for Map
  useEffect(() => {
    if (!firestore) return;
    
    const unsubscribe = firestore.collection('waste_routes').onSnapshot((snapshot) => {
        const routes = snapshot.docs.map(doc => {
            const data = doc.data();
            let loc = data.currentLocation;
            // Handle Firestore format
            if (loc && typeof loc.latitude === 'number') {
                loc = { lat: loc.latitude, lng: loc.longitude };
            }
            return {
                id: doc.id,
                ...data,
                currentLocation: loc
            };
        }) as WasteRoute[];
        
        setActiveRoutes(routes);

        // Auto-center on first active truck if available
        const activeTruck = routes.find(r => r.status === 'In Progress' && r.currentLocation);
        if (activeTruck && activeTruck.currentLocation) {
            setMapCenter([activeTruck.currentLocation.lat, activeTruck.currentLocation.lng]);
        }
    });

    return () => unsubscribe();
  }, []);

  const getTimelineStatus = (status: ReportStatus, step: number) => {
    const statusMap: Record<string, number> = {
      [ReportStatus.PENDING]: 1,
      [ReportStatus.IN_PROGRESS]: 2,
      [ReportStatus.RESOLVED]: 3,
      [ReportStatus.DELAYED]: 2, 
    };
    const currentStep = statusMap[status] || 1;
    return step <= currentStep;
  };

  const ReportDetailModal = () => {
    if (!selectedReport) return null;

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-[#F1F8E8]">
            <div>
              <h2 className="text-lg font-bold text-[#4F7942] line-clamp-1">
                {selectedReport.title}
              </h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mt-1 inline-block
                  ${selectedReport.status === 'RESOLVED' ? 'bg-[#77DD77]/20 text-[#4F7942]' : 'bg-blue-100 text-blue-800'}`}>
                  {selectedReport.status.replace('_', ' ')}
              </span>
            </div>
            <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-500">
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto p-6 space-y-6">
            {/* Timeline */}
            <div className="relative pl-2">
               <div className="absolute left-[15px] top-2 bottom-4 w-0.5 bg-slate-100"></div>
               <div className="space-y-6">
                 {[
                   { step: 1, label: 'Submitted', desc: `${selectedReport.dateReported}` },
                   { step: 2, label: 'Processing', desc: 'Team assigned' },
                   { step: 3, label: 'Resolved', desc: 'Issue fixed' }
                 ].map((item) => (
                   <div key={item.step} className="relative pl-10">
                      <div className={`absolute left-0 top-0 w-8 h-8 rounded-full border-2 z-10 flex items-center justify-center bg-white
                        ${getTimelineStatus(selectedReport.status, item.step) ? 'border-[#77DD77] text-[#77DD77]' : 'border-slate-200 text-slate-300'}`}>
                         {getTimelineStatus(selectedReport.status, item.step) ? <CheckCircle2 size={14} fill="currentColor" className="text-white" /> : <Circle size={10} />}
                      </div>
                      <h4 className={`font-bold text-sm ${getTimelineStatus(selectedReport.status, item.step) ? 'text-[#4F7942]' : 'text-slate-400'}`}>{item.label}</h4>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                   </div>
                 ))}
               </div>
            </div>

            <div className="bg-[#F9FCFA] p-4 rounded-xl border border-slate-100">
               <h4 className="text-xs font-bold text-[#77DD77] uppercase mb-2 tracking-wider">Description</h4>
               <p className="text-[#4F7942] text-sm leading-relaxed mb-3">{selectedReport.description}</p>
               <div className="flex gap-4 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1"><MapPin size={12}/> {selectedReport.location}</span>
                  <span className="flex items-center gap-1"><FileText size={12}/> {selectedReport.category}</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10 pb-24">
      
      <ReportDetailModal />

      {/* KPI Quick-Stats: 3 Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel bg-white rounded-2xl p-6 shadow-soft flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300 border border-transparent hover:border-[#F1F8E8]">
              <div className="w-12 h-12 bg-[#F1F8E8] rounded-full flex items-center justify-center text-[#77DD77]">
                 <Truck size={24} />
              </div>
              <div>
                 <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">Trucks Active</p>
                 <p className="text-2xl font-extrabold text-[#4F7942]">{activeRoutes.filter(r => r.status === 'In Progress').length} / {activeRoutes.length}</p>
              </div>
          </div>
          <div className="glass-panel bg-white rounded-2xl p-6 shadow-soft flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300 border border-transparent hover:border-[#F1F8E8]">
              <div className="w-12 h-12 bg-[#F1F8E8] rounded-full flex items-center justify-center text-[#77DD77]">
                 <Recycle size={24} />
              </div>
              <div>
                 <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">Bins Full</p>
                 <p className="text-2xl font-extrabold text-[#4F7942]">4 Bins</p>
              </div>
          </div>
          <div className="glass-panel bg-white rounded-2xl p-6 shadow-soft flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300 border border-transparent hover:border-[#F1F8E8]">
              <div className="w-12 h-12 bg-[#F1F8E8] rounded-full flex items-center justify-center text-[#77DD77]">
                 <BarChart3 size={24} />
              </div>
              <div>
                 <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">Efficiency</p>
                 <p className="text-2xl font-extrabold text-[#4F7942]">94%</p>
              </div>
          </div>
      </div>

      {/* Header Section */}
      <div className="flex justify-between items-end pb-2">
         <div>
            <h1 className="text-4xl font-extrabold text-[#4F7942]">The Hub</h1>
            <p className="text-slate-500 text-sm font-medium mt-1 ml-1">Overview for {currentUser.zone || 'Unassigned Zone'}</p>
         </div>
      </div>

      {/* Main Grid Layout (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Map Card (Central Focus) */}
        <div className="md:col-span-8 glass-panel bg-white rounded-3xl shadow-soft border border-white overflow-hidden flex flex-col min-h-[450px] relative group transition-all hover:shadow-card">
           {/* RELOCATED BADGE: Moved to top-left area to avoid overlap with Layer Control at top-right */}
           <div className="absolute top-4 left-12 z-[400] bg-white/95 backdrop-blur px-4 py-2 rounded-full text-xs font-bold text-[#4F7942] shadow-sm flex items-center gap-2 border border-[#F1F8E8]">
              <span className="w-2 h-2 rounded-full bg-[#77DD77] animate-pulse"></span> Live Monitoring
              {activeRoutes.filter(r => r.status === 'In Progress').length > 0 && (
                  <span className="ml-1 text-[#77DD77]">({activeRoutes.filter(r => r.status === 'In Progress').length} Active)</span>
              )}
           </div>
           
           <div className="flex-1 relative z-0">
               <WasteMap 
                  center={mapCenter} 
                  activeRoutes={activeRoutes} 
                  height="100%"
               />
               
               {/* Full Screen Link Overlay */}
               <Link to="/resident/tracking" className="absolute bottom-4 right-4 z-[400] bg-white text-[#4F7942] p-3 rounded-xl shadow-md border border-slate-100 hover:bg-[#F1F8E8] font-bold text-xs flex items-center gap-2 transition-colors">
                  <Map size={16} /> Expand Map
               </Link>
           </div>
        </div>

        {/* Right Side Stats - Spans 4 columns */}
        <div className="md:col-span-4 flex flex-col gap-8">
           
           {/* Next Collection Card - Using Soft Mint Background */}
           <Link to="/resident/schedule" className="block group">
             <div className="bg-[#F1F8E8] p-8 rounded-3xl shadow-soft border border-[#E2F2D5] flex flex-col justify-center relative overflow-hidden transition-all hover:shadow-card hover:scale-[1.02] cursor-pointer h-full">
                {/* Decorative blob */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#77DD77]/10 rounded-full -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-500"></div>
                
                <h3 className="text-[#4F7942]/60 text-xs font-bold uppercase tracking-wider mb-2">Next Collection</h3>
                <div className="flex items-baseline gap-2 mb-2">
                   <span className="text-4xl font-extrabold text-[#4F7942]">Tomorrow</span>
                </div>
                <div className="flex items-center gap-2 text-[#4F7942] text-sm font-semibold bg-white/60 w-fit px-3 py-1.5 rounded-lg border border-white/50">
                   <Clock size={16} className="text-[#77DD77]" /> <span>8:00 AM - 10:00 AM</span>
                </div>
                <div className="mt-4 text-xs font-bold text-[#77DD77] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-6 right-6">
                    View Calendar <ChevronRight size={12} />
                </div>
             </div>
           </Link>

           {/* Community Alert Feed (Mini) */}
           <div className="glass-panel bg-white p-6 rounded-3xl shadow-soft border border-transparent flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Trucks</h3>
                 <span className="w-2 h-2 rounded-full bg-[#77DD77] animate-pulse"></span>
              </div>
              
              <div className="space-y-3 overflow-y-auto max-h-[220px] pr-1 custom-scrollbar">
                 {activeRoutes.length === 0 ? (
                    <div className="text-center py-8">
                        <Truck className="mx-auto text-slate-200 mb-2" size={32} />
                        <p className="text-xs text-slate-400 italic">No active trucks nearby.</p>
                    </div>
                 ) : (
                    activeRoutes.filter(r => r.status === 'In Progress').map(route => (
                        <div key={route.id} className="flex gap-4 items-center p-3 rounded-2xl hover:bg-[#F1F8E8] transition-colors group">
                            <div className="bg-[#F1F8E8] group-hover:bg-white p-2 rounded-xl text-[#77DD77] shrink-0 transition-colors">
                                <Truck size={18} strokeWidth={2} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[#4F7942]">{route.name}</p>
                                <p className="text-[10px] text-slate-500 font-medium">{route.zone} • {route.status}</p>
                            </div>
                        </div>
                    ))
                 )}
              </div>
           </div>
        </div>

        {/* Bottom Section: Recent Reports & Stats */}
        <div className="md:col-span-8 glass-panel bg-white rounded-3xl shadow-soft border border-transparent p-8">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-[#4F7942] text-lg">Your Recent Reports</h3>
              <Link to="/resident/history" className="text-xs font-bold text-[#77DD77] hover:text-[#4F7942] flex items-center gap-1 transition-colors bg-[#F1F8E8] px-3 py-1.5 rounded-full">
                 View History <ChevronRight size={14} />
              </Link>
           </div>
           
           <div className="grid sm:grid-cols-2 gap-6">
              {loading ? <SkeletonLoader /> : 
               error ? <div className="text-red-500 text-xs bg-red-50 p-4 rounded-2xl border border-red-100">{error}</div> :
               myReports.length === 0 ? <EmptyState /> :
               myReports.slice(0, 2).map(report => (
                 <div key={report.id} onClick={() => setSelectedReport(report)} className="border border-[#F1F8E8] rounded-2xl p-5 hover:border-[#77DD77] hover:shadow-card transition-all cursor-pointer bg-[#F9FCFA] group">
                    <div className="flex justify-between items-start mb-3">
                       <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${report.status === 'RESOLVED' ? 'bg-[#F1F8E8] text-[#4F7942]' : 'bg-blue-50 text-blue-700'}`}>
                          {report.status}
                       </span>
                       <span className="text-[10px] text-slate-400 font-medium">{report.dateReported}</span>
                    </div>
                    <h4 className="font-bold text-[#4F7942] text-base line-clamp-1 group-hover:text-[#77DD77] transition-colors">{report.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{report.location}</p>
                 </div>
               ))
              }
           </div>
        </div>

        {/* Recycling Goal (Gamification) */}
        <div className="md:col-span-4 bg-[#4F7942] rounded-3xl shadow-card p-8 text-white relative overflow-hidden flex flex-col justify-between">
           <div className="absolute top-0 right-0 w-40 h-40 bg-[#77DD77] rounded-full -mr-12 -mt-12 opacity-20 blur-2xl"></div>
           <div>
              <div className="flex items-center gap-2 mb-4 text-[#77DD77]">
                 <Recycle size={20} />
                 <span className="text-xs font-bold uppercase tracking-wider">Community Goal</span>
              </div>
              <h3 className="text-4xl font-extrabold mb-1">850 kg</h3>
              <p className="text-[#E2F2D5] text-xs font-medium">Recycled this month in {currentUser.zone || 'your zone'}</p>
           </div>
           
           <div className="mt-8">
              <div className="flex justify-between text-xs font-bold mb-3 text-[#E2F2D5]">
                 <span>Progress</span>
                 <span>85%</span>
              </div>
              <div className="w-full bg-black/20 rounded-full h-3 backdrop-blur-sm">
                 <div className="bg-[#77DD77] h-3 rounded-full shadow-[0_0_15px_rgba(119,221,119,0.5)]" style={{ width: '85%' }}></div>
              </div>
           </div>
        </div>

      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col items-end gap-4 z-50">
          {/* Report Issue FAB - Action Green */}
          <button 
            onClick={() => navigate('/resident/report')}
            className="bg-[#77DD77] hover:bg-[#5FB35F] text-white p-5 rounded-full shadow-glow transition-all hover:scale-110 active:scale-95 flex items-center justify-center group relative border-4 border-white"
          >
             <Plus size={32} strokeWidth={3} />
             <span className="absolute right-full mr-4 bg-[#4F7942] text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-sm">
                Report Issue
             </span>
          </button>
      </div>

    </div>
  );
};

export default ResidentDashboard;