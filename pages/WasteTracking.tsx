
import React, { useState, useEffect, useRef } from 'react';
/* Added missing ArrowLeft import */
import { Truck, Navigation, Power, Satellite, Edit, X, MessageSquare, Reply, ShieldCheck, Plus, AlertCircle, MapPin, Send, MessageCircle, User, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { WasteRoute, RouteMessage, UserRole } from '../types';
import firebase from 'firebase/compat/app';
import { firestore } from '../services/firebase';
import WasteMap from '../components/WasteMap';

// Default Map Center (Manila)
const DEFAULT_CENTER: [number, number] = [14.5995, 120.9842];

const WasteTracking: React.FC = () => {
  const { currentUser, isDriver, isAdmin } = useAuth();
  
  // State for active routes fetched from Firestore
  const [activeRoutes, setActiveRoutes] = useState<WasteRoute[]>([]);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  
  // Driver specific state
  const [isTracking, setIsTracking] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<{lat: number, lng: number} | null>(null);
  
  // Refs for tracking logic
  const watchId = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0); // Throttle control

  // UI Modal States
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: 'In Progress', description: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', driver: '', truckId: '', zone: '' });
  
  // Chat / Messaging State
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatTargetId, setChatTargetId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<RouteMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Routes from Firestore Real-time
  useEffect(() => {
    if (!firestore) {
        setFirestoreError("Database connection failed.");
        return;
    }

    const unsubscribe = firestore.collection('waste_routes').onSnapshot((snapshot) => {
      const routesData = snapshot.docs.map(doc => {
        const data = doc.data();
        let loc = data.currentLocation;
        // Normalize location data
        if (loc && typeof loc.latitude === 'number') {
            loc = { lat: loc.latitude, lng: loc.longitude };
        } else if (!loc || typeof loc.lat !== 'number') {
            loc = null;
        }

        return { id: doc.id, ...data, currentLocation: loc };
      }) as WasteRoute[];
      
      setActiveRoutes(routesData);
      setFirestoreError(null);
    }, (error) => {
        console.error("Error fetching routes:", error);
        setFirestoreError("Permission denied or database error.");
    });

    return () => unsubscribe();
  }, []);

  // Identify the current driver's route
  const myRoute = activeRoutes.find(r => 
      r.driver?.toLowerCase().trim() === currentUser?.name?.toLowerCase().trim()
  );
  const myRouteId = myRoute?.id;

  // Real-time Chat Listener
  useEffect(() => {
    const targetId = isDriver ? myRouteId : chatTargetId;
    if (!targetId || !showChatModal) return;

    const unsubscribe = firestore.collection('waste_routes').doc(targetId).collection('messages')
        .orderBy('timestamp', 'asc')
        .onSnapshot(snapshot => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as RouteMessage[];
            setChatMessages(msgs);
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        });

    return () => unsubscribe();
  }, [showChatModal, chatTargetId, myRouteId, isDriver]);

  // --- 2. GPS Tracking Logic ---
  const stopTracking = () => {
    if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
    }
    setIsTracking(false);
    setDriverLocation(null);
    setGpsError(null);
  };

  const toggleTracking = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startRealGps();
    }
  };

  const startRealGps = () => {
      if (!navigator.geolocation) {
        setGpsError("Geolocation is not supported by your browser");
        return;
      }

      setIsTracking(true);
      setGpsError(null);

      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setDriverLocation({ lat, lng });
          setGpsError(null);
          updateDatabaseLocation(lat, lng);
        },
        (error) => {
          console.warn("GPS Error:", error);
          setGpsError(`Weak GPS Signal. Retrying...`);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
  };

  // --- 3. Database Writer ---
  const updateDatabaseLocation = async (lat: number, lng: number) => {
    const now = Date.now();
    // Throttle: Update DB max every 2 seconds
    if (myRouteId && (now - lastUpdateRef.current > 2000)) {
        lastUpdateRef.current = now;
        try {
            const routeRef = firestore.collection('waste_routes').doc(myRouteId);
            await routeRef.update({
                currentLocation: { lat, lng },
                status: 'In Progress',
                lastUpdateTimestamp: new Date().toISOString()
            });
        } catch (err) {
            console.error("DB Update Error:", err);
        }
    }
  };

  useEffect(() => {
    return () => stopTracking();
  }, []);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (myRouteId) {
        await firestore.collection('waste_routes').doc(myRouteId).update({
            status: statusForm.status,
            description: statusForm.description
        });
        setShowStatusModal(false);
    }
  };

  // Admin Create Route
  const handleCreateRoute = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          await firestore.collection('waste_routes').add({
              name: createForm.name,
              driver: createForm.driver,
              truckId: createForm.truckId,
              zone: createForm.zone,
              status: 'Pending',
              progress: 0,
              currentLocation: { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] }, // Default start
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          setShowCreateModal(false);
          setCreateForm({ name: '', driver: '', truckId: '', zone: '' });
      } catch (err) {
          alert("Failed to create route");
      }
  };
  
  // Chat Send Handler
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = isDriver ? myRouteId : chatTargetId;
    if (!targetId || !newMessageText.trim() || !currentUser) return;

    try {
        const routeRef = firestore.collection('waste_routes').doc(targetId);
        
        // Add to sub-collection for history
        await routeRef.collection('messages').add({
            text: newMessageText,
            senderName: currentUser.name,
            senderRole: currentUser.role,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Also update the "Latest Alert" field for the banner
        if (isAdmin) {
            await routeRef.update({
                adminMessage: newMessageText
            });
        }

        setNewMessageText('');
    } catch (err) {
        console.error("Chat Error:", err);
    }
  };
  
  // Driver Clear Alert Banner
  const handleClearAlert = async () => {
      if (myRouteId) {
           await firestore.collection('waste_routes').doc(myRouteId).update({
              adminMessage: firebase.firestore.FieldValue.delete()
          });
      }
  };

  // --- Chat Component ---
  const ChatInterface = () => {
    const targetRoute = activeRoutes.find(r => r.id === (isDriver ? myRouteId : chatTargetId));
    if (!targetRoute) return null;

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white rounded-3xl w-full max-w-lg h-[80vh] flex flex-col overflow-hidden shadow-2xl border border-white">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-[#F1F8E8] shrink-0">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#77DD77] shadow-sm">
                   {isDriver ? <ShieldCheck size={20}/> : <Truck size={20}/>}
                </div>
                <div>
                   <h3 className="font-bold text-[#4F7942]">{isDriver ? 'Barangay Official' : targetRoute.driver}</h3>
                   <p className="text-[10px] font-bold text-[#77DD77] uppercase tracking-widest uppercase">Chatting about {targetRoute.name}</p>
                </div>
             </div>
             <button onClick={() => setShowChatModal(false)} className="p-2 hover:bg-white rounded-full text-slate-400"><X size={20}/></button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
             {chatMessages.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50 space-y-2">
                    <MessageCircle size={48} />
                    <p className="text-sm font-medium italic">No messages yet. Send a greeting!</p>
                 </div>
             ) : (
                 chatMessages.map(msg => {
                    const isMe = msg.senderRole === currentUser?.role;
                    return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
                                ${isMe ? 'bg-[#77DD77] text-white rounded-tr-none' : 'bg-white border border-slate-100 text-[#4F7942] rounded-tl-none'}`}>
                                {msg.text}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 mt-1 px-1">{msg.senderName} • {msg.senderRole}</span>
                        </div>
                    );
                 })
             )}
             <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendChatMessage} className="p-4 bg-white border-t border-slate-100 flex gap-3 items-center">
             <input 
                type="text" 
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#77DD77] focus:bg-white transition-all"
             />
             <button type="submit" className="p-3 bg-[#77DD77] text-white rounded-xl shadow-lg hover:bg-[#5FB35F] transition-all active:scale-95 disabled:opacity-50" disabled={!newMessageText.trim()}>
                <Send size={20} />
             </button>
          </form>
        </div>
      </div>
    );
  };

  const RouteCard: React.FC<{ route: WasteRoute }> = ({ route }) => (
    <div className="bg-white p-5 rounded-2xl shadow-soft border border-gray-50 hover:shadow-md transition-all group">
       <div className="flex justify-between items-start mb-3">
         <div>
            <h3 className="font-bold text-[#4F7942] text-sm group-hover:text-[#77DD77] transition-colors">{route.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">{route.driver} • {route.truckId}</p>
         </div>
         <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${route.status === 'In Progress' ? 'bg-[#F1F8E8] text-[#77DD77]' : 'bg-gray-100 text-gray-400'}`}>
            {route.status}
         </span>
       </div>
       <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
           <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
               <span className={`w-2 h-2 rounded-full ${route.currentLocation ? 'bg-[#77DD77]' : 'bg-gray-300'}`}></span>
               {route.currentLocation ? 'ONLINE' : 'OFFLINE'}
           </div>
           {isAdmin && (
               <button 
                  onClick={() => { setChatTargetId(route.id); setShowChatModal(true); }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#F1F8E8] text-[#4F7942] rounded-lg hover:bg-[#E2F2D5] transition-colors text-xs font-bold"
               >
                   <MessageSquare size={14} /> Message Driver
               </button>
           )}
       </div>
    </div>
  );

  const mapCenter = driverLocation 
    ? [driverLocation.lat, driverLocation.lng] as [number, number]
    : activeRoutes.find(r => r.currentLocation && r.status === 'In Progress')?.currentLocation 
        ? [activeRoutes.find(r => r.currentLocation && r.status === 'In Progress')!.currentLocation!.lat, activeRoutes.find(r => r.currentLocation && r.status === 'In Progress')!.currentLocation!.lng] as [number, number]
        : DEFAULT_CENTER;

  // --- DRIVER VIEW ---
  if (isDriver) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
         {showChatModal && <ChatInterface />}
         
         <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-[#4F7942]">Driver Console</h1>
              <p className="text-slate-400 text-sm font-medium mt-1">Logged in as {currentUser?.name}</p>
            </div>
            <div className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 border shadow-sm transition-all ${isTracking ? 'bg-[#F1F8E8] text-[#77DD77] border-[#77DD77]/20' : 'bg-white text-slate-300 border-slate-100'}`}>
               <Satellite size={16} className={isTracking ? 'animate-pulse' : ''} />
               {isTracking ? 'TRANSMITTING LIVE' : 'GPS STANDBY'}
            </div>
         </div>
         
         {/* Admin Message Alert */}
         {myRoute?.adminMessage && (
             <div className="bg-[#4F7942] text-white p-6 rounded-3xl shadow-glow mb-8 flex justify-between items-center animate-slide-up relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-500"></div>
                 <div className="flex gap-4 items-center relative z-10">
                     <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"><MessageSquare size={24} /></div>
                     <div>
                         <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-1">Official Alert</p>
                         <p className="font-bold text-lg">{myRoute.adminMessage}</p>
                     </div>
                 </div>
                 <div className="flex items-center gap-2 relative z-10">
                    <button 
                        onClick={() => setShowChatModal(true)} 
                        className="bg-white text-[#4F7942] px-4 py-2 rounded-xl font-bold text-xs hover:bg-[#F1F8E8] transition-colors"
                    >
                        Reply
                    </button>
                    <button onClick={handleClearAlert} className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-colors"><X size={18}/></button>
                 </div>
             </div>
         )}

         {!myRoute && (
           <div className="bg-red-50 p-6 border-l-4 border-red-500 rounded-2xl shadow-sm mb-8 flex items-center gap-4">
              <div className="bg-red-100 p-2 rounded-full text-red-600"><AlertCircle size={24}/></div>
              <p className="text-red-800 text-sm font-bold">Unassigned Unit: No active route found for "{currentUser?.name}". Please contact Admin to start your schedule.</p>
           </div>
         )}

         {/* Start/Stop Button */}
         <div className="mb-8">
             <button
                onClick={toggleTracking}
                disabled={!myRoute}
                className={`w-full py-8 rounded-[2rem] font-black text-2xl shadow-xl flex items-center justify-center gap-4 text-white transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-30 disabled:transform-none disabled:grayscale
                  ${isTracking ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-[#77DD77] hover:bg-[#5FB35F] shadow-[#77DD77]/30'}`}
             >
                <Power size={32} />
                {isTracking ? 'END SHIFT' : 'BEGIN ROUTE'}
             </button>
             
             {isTracking && (
                 <p className="text-center text-[10px] text-[#77DD77] mt-3 font-bold tracking-widest animate-pulse">
                     LOCATION SHARING ACTIVE • RESIDENTS CAN SEE YOU ON MAP
                 </p>
             )}
         </div>

         {/* Grid Layout for Map & Controls */}
         <div className="grid md:grid-cols-12 gap-8">
             <div className="md:col-span-7 space-y-8">
                <div className="glass-panel bg-white p-2 rounded-[2.5rem] shadow-soft border border-white relative overflow-hidden h-[400px]">
                    <WasteMap 
                        center={mapCenter} 
                        activeRoutes={activeRoutes} 
                        myRouteId={myRouteId}
                        driverLocation={driverLocation}
                        height="100%" 
                    />
                </div>
             </div>

             <div className="md:col-span-5 flex flex-col gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-soft border border-gray-50 flex flex-col flex-1">
                   <h3 className="text-[#4F7942] text-xs font-bold uppercase tracking-widest mb-6">Tools & Communication</h3>
                   <div className="space-y-4">
                        {/* Fixed: changed variable name to setShowStatusModal */}
                        <button 
                            onClick={() => setShowStatusModal(true)}
                            disabled={!myRoute}
                            className="w-full bg-[#F1F8E8] p-5 rounded-2xl font-bold text-[#4F7942] flex items-center justify-between group hover:bg-[#77DD77] hover:text-white transition-all disabled:opacity-50"
                        >
                            <span className="flex items-center gap-3"><Edit size={20} /> Update Status</span>
                            <ArrowLeft className="rotate-180 group-hover:translate-x-1 transition-transform" size={18} />
                        </button>

                        <button 
                            onClick={() => setShowChatModal(true)}
                            disabled={!myRoute}
                            className="w-full bg-white border-2 border-[#F1F8E8] p-5 rounded-2xl font-bold text-[#4F7942] flex items-center justify-between group hover:border-[#77DD77] transition-all disabled:opacity-50"
                        >
                            <span className="flex items-center gap-3"><MessageCircle size={20} /> Chat with Admin</span>
                            <div className="bg-[#77DD77] w-2 h-2 rounded-full animate-pulse"></div>
                        </button>
                   </div>

                   <div className="mt-auto pt-8">
                       <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">My Current Zone</p>
                           <p className="text-lg font-extrabold text-[#4F7942]">{myRoute?.zone || 'Unassigned'}</p>
                           <p className="text-xs text-slate-500 font-medium mt-1">Truck ID: {myRoute?.truckId || '-'}</p>
                       </div>
                   </div>
                </div>
             </div>
         </div>

         {/* Status Modal */}
         {showStatusModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 border border-white">
                    <h3 className="text-2xl font-bold text-[#4F7942] mb-6">Current Progress</h3>
                    <form onSubmit={handleUpdateStatus} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Work Status</label>
                            <select 
                                value={statusForm.status}
                                onChange={(e) => setStatusForm({...statusForm, status: e.target.value})}
                                className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 font-bold text-[#4F7942] focus:outline-none focus:ring-2 focus:ring-[#77DD77] focus:bg-white transition-all appearance-none"
                            >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Delayed">Delayed</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Driver's Note</label>
                            <textarea 
                                rows={3}
                                placeholder="Any issues or updates?"
                                value={statusForm.description}
                                onChange={(e) => setStatusForm({...statusForm, description: e.target.value})}
                                className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#77DD77] focus:bg-white transition-all resize-none"
                            />
                        </div>

                        <div className="flex gap-4 pt-2">
                            <button type="button" onClick={() => setShowStatusModal(false)} className="flex-1 py-4 bg-slate-100 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors">Cancel</button>
                            <button type="submit" className="flex-1 py-4 bg-[#77DD77] text-white rounded-xl font-bold shadow-lg shadow-[#77DD77]/30 hover:bg-[#5FB35F] transition-all">Update</button>
                        </div>
                    </form>
                </div>
            </div>
         )}
      </div>
    );
  }

  // --- STANDARD / ADMIN VIEW ---
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10 relative pb-24">
      {showChatModal && <ChatInterface />}

      <div className="flex justify-between items-end pb-2">
        <div>
           <h1 className="text-4xl font-extrabold text-[#4F7942]">Waste Tracking</h1>
           <p className="text-slate-500 text-sm font-medium mt-1">Live monitoring of all active collection routes</p>
        </div>
        {isAdmin && (
            <button 
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-[#77DD77] text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-[#77DD77]/30 hover:bg-[#5FB35F] transition-all transform hover:-translate-y-1"
            >
                <Plus size={20} strokeWidth={3} /> Create Route
            </button>
        )}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 glass-panel bg-white p-2 rounded-[2.5rem] shadow-soft border border-white h-[550px]">
             <WasteMap center={mapCenter} activeRoutes={activeRoutes} height="100%" />
        </div>
        
        <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="flex justify-between items-center mb-1">
               <h2 className="font-extrabold text-[#4F7942] uppercase tracking-widest text-xs">Fleet Status</h2>
               <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#77DD77] animate-pulse"></span>
                  <span className="text-[10px] font-bold text-slate-400">LIVE SYNC</span>
               </div>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
                {activeRoutes.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <Truck className="mx-auto text-slate-200 mb-2" size={48} />
                        <p className="text-sm text-slate-400 italic font-medium">No routes managed yet.</p>
                    </div>
                ) : (
                    activeRoutes.map(route => <RouteCard key={route.id} route={route} />)
                )}
            </div>
        </div>
      </div>

      {/* Admin Create Modal */}
      {showCreateModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 border border-white">
                <h3 className="text-2xl font-bold text-[#4F7942] mb-6">New Service Route</h3>
                <form onSubmit={handleCreateRoute} className="space-y-5">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Route Alias</label>
                            <input type="text" placeholder="e.g. Morning Collection - Zone 1" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-[#77DD77] outline-none transition-all" required 
                                value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Driver Name (Must match account)</label>
                            <input type="text" placeholder="e.g. Juan De La Cruz" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-[#77DD77] outline-none transition-all" required
                                value={createForm.driver} onChange={e => setCreateForm({...createForm, driver: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Truck ID</label>
                                <input type="text" placeholder="T-102" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-[#77DD77] outline-none transition-all" required
                                    value={createForm.truckId} onChange={e => setCreateForm({...createForm, truckId: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Target Zone</label>
                                <input type="text" placeholder="Zone 1A" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-medium focus:ring-2 focus:ring-[#77DD77] outline-none transition-all" required
                                    value={createForm.zone} onChange={e => setCreateForm({...createForm, zone: e.target.value})} />
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-4 bg-slate-100 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors">Cancel</button>
                        <button type="submit" className="flex-1 py-4 bg-[#77DD77] text-white rounded-xl font-bold shadow-lg shadow-[#77DD77]/30 hover:bg-[#5FB35F] transition-all">Create Route</button>
                    </div>
                </form>
            </div>
          </div>
      )}
    </div>
  );
};

export default WasteTracking;
