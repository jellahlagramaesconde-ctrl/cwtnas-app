import React, { useState, useEffect } from 'react';
import { RefreshCcw, Leaf, Ban, Recycle, AlertTriangle, Wifi, Signal, WifiOff, Clock, Info, AlertOctagon, ShieldAlert, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SmartBin } from '../types';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

const SmartBinMonitor: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [bins, setBins] = useState<SmartBin[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to determine status based on fill level
  const getBinStatus = (level: number): 'Critical' | 'Full' | 'Normal' => {
    if (level > 90) return 'Critical';
    if (level > 75) return 'Full';
    return 'Normal';
  };

  // Helper to check duration limits
  const getDurationAlert = (bin: SmartBin): string | null => {
    // Limits in days
    const limits: Record<string, number> = {
      'Biodegradable': 2,
      'Non-Biodegradable': 3,
      'Recyclable': 14
    };

    const limit = limits[bin.type] || 7;
    
    if (bin.daysSinceEmptied > limit) {
      return `Overdue: Exceeds ${limit} day limit`;
    }
    return null;
  };

  // Connect to Firebase Realtime Database
  useEffect(() => {
    try {
      if (!db) {
         console.warn("Database not initialized");
         return;
      }
      
      setError(null);
      // The Arduino writes to "smartBins"
      const binsRef = db.ref('smartBins');
      
      const onValueChange = (snapshot: any) => {
        const data = snapshot.val();
        if (data) {
          setIsLive(true);
          const loadedBins: SmartBin[] = [];
          
          Object.keys(data).forEach(key => {
             const sensorData = data[key];
             if (sensorData) {
                 loadedBins.push({
                     id: key,
                     type: sensorData.type || 'Biodegradable',
                     location: sensorData.location || 'Main St. Collection Point',
                     fillLevel: typeof sensorData.fillLevel === 'number' ? sensorData.fillLevel : 0,
                     daysSinceEmptied: sensorData.daysSinceEmptied || 0,
                     lastUpdated: 'Live',
                     status: getBinStatus(typeof sensorData.fillLevel === 'number' ? sensorData.fillLevel : 0)
                 });
             }
          });
          setBins(loadedBins);
        } else {
            setBins([]);
        }
      };
      
      const onError = (err: any) => {
        console.error("Firebase Read Error:", err);
        setIsLive(false);
        if (err.message.includes('permission_denied')) {
            setError("Permission Denied: Update Realtime Database Rules.");
        } else {
            setError(`Connection Error: ${err.message}`);
        }
      };

      binsRef.on('value', onValueChange, onError);

      return () => {
        binsRef.off('value', onValueChange);
      };
    } catch (err) {
      console.error("Firebase Connection Error:", err);
    }
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 800);
  };

  const getBinColor = (type: string) => {
    switch (type) {
      case 'Biodegradable': return 'bg-gradient-to-br from-green-500 to-emerald-600';
      case 'Recyclable': return 'bg-gradient-to-br from-blue-500 to-indigo-600';
      case 'Non-Biodegradable': return 'bg-gradient-to-br from-gray-600 to-gray-800';
      default: return 'bg-gray-500';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Biodegradable': return <Leaf className="text-white" size={24} />;
      case 'Recyclable': return <Recycle className="text-white" size={24} />;
      case 'Non-Biodegradable': return <Ban className="text-white" size={24} />;
      default: return <Recycle className="text-white" size={24} />;
    }
  };

  const criticalFillBins = bins.filter(b => b.fillLevel > 85);
  const overdueBins = bins.filter(b => getDurationAlert(b) !== null);
  const totalAlerts = criticalFillBins.length + overdueBins.length;

  const binGuidelines = [
    {
      type: 'Biodegradable',
      duration: '2 Days',
      reason: 'Prevent odors, mold, and maggots.',
      color: 'text-green-600',
      bgColor: 'bg-green-50/50',
      borderColor: 'border-green-200',
      icon: Leaf
    },
    {
      type: 'Recyclable',
      duration: '14 Days',
      reason: 'Only if items are rinsed and dry.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50/50',
      borderColor: 'border-blue-200',
      icon: Recycle
    },
    {
      type: 'Non-Biodegradable',
      duration: '3 Days',
      reason: 'Hygiene and space management.',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50/50',
      borderColor: 'border-gray-200',
      icon: Ban
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24 md:pb-8">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                Smart Segregation Bins
                {isLive ? (
                   <span className="flex items-center gap-1 text-xs font-normal bg-green-100 text-green-700 px-2 py-1 rounded-full animate-pulse">
                      <Wifi size={12} /> Live Sensors
                   </span>
                ) : error ? (
                   <span className="flex items-center gap-1 text-xs font-normal bg-red-100 text-red-700 px-2 py-1 rounded-full">
                      <ShieldAlert size={12} /> Error
                   </span>
                ) : (
                   <span className="flex items-center gap-1 text-xs font-normal bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                      <WifiOff size={12} /> Waiting for Data
                   </span>
                )}
            </h1>
            <p className="text-gray-500 text-sm">Real-time monitoring of community waste levels</p>
        </div>
        
        <div className="flex gap-2">
            <button 
              onClick={handleRefresh}
              className="flex items-center gap-2 bg-white/50 backdrop-blur-sm border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm animate-fade-in flex items-center gap-3">
            <ShieldAlert className="text-red-600" />
            <div>
                <p className="font-bold text-red-800">Connection Error</p>
                <p className="text-red-600 text-sm">{error}</p>
            </div>
        </div>
      )}

      {totalAlerts > 0 && (
        <div className="bg-white/80 backdrop-blur-md border-l-4 border-red-500 rounded-r-lg shadow-lg overflow-hidden animate-fade-in border border-white/40">
          <div className="p-4 bg-red-50/50 border-b border-red-100 flex items-start gap-3">
             <AlertOctagon className="text-red-600 shrink-0 mt-0.5 animate-pulse" />
             <div>
               <h3 className="text-red-800 font-bold text-lg">System Alerts Active ({totalAlerts})</h3>
               <p className="text-red-700 text-sm">Attention needed at collection point: Main Barangay Hall</p>
             </div>
          </div>
          <div className="p-4 grid md:grid-cols-2 gap-4">
             {criticalFillBins.length > 0 && (
               <div className="flex items-center gap-2 text-red-700 text-sm font-medium">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                  {criticalFillBins.length} bin(s) at critical capacity (&gt;85%).
               </div>
             )}
             {overdueBins.length > 0 && (
               <div className="flex items-center gap-2 text-amber-700 text-sm font-medium">
                  <Clock size={14} className="animate-pulse" />
                  {overdueBins.length} bin(s) exceeded retention duration limit.
               </div>
             )}
          </div>
        </div>
      )}

      {bins.length === 0 ? (
          <div className="text-center py-20 bg-white/50 border border-dashed border-gray-300 rounded-2xl">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                  <WifiOff size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-700">No Bin Data Detected</h3>
              <p className="text-gray-500 mt-2">Connect your Arduino MKR 1000 to Firebase Realtime Database to see live data.</p>
          </div>
      ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {bins.map((bin) => {
              const durationAlert = getDurationAlert(bin);
              const isCritical = bin.fillLevel > 85;

              return (
                <div key={bin.id} className={`bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg overflow-hidden border flex flex-col transition-all duration-300 relative hover:-translate-y-1 hover:shadow-2xl
                  ${isCritical ? 'border-red-400 ring-4 ring-red-50 shadow-red-100 scale-[1.02]' : 
                    durationAlert ? 'border-amber-400 ring-4 ring-amber-50 shadow-amber-100' : 'border-white/50'}`}>
                  
                  <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 items-end">
                      {isCritical && (
                        <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md animate-pulse flex items-center gap-1 border border-red-400">
                          <AlertTriangle size={10} /> FULL
                        </span>
                      )}
                      {durationAlert && (
                        <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1 border border-amber-400">
                          <Clock size={10} /> OVERDUE
                        </span>
                      )}
                  </div>

                  <div className={`${getBinColor(bin.type)} p-6 flex items-center justify-between relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-white/10"></div>
                      <div className="flex items-center gap-3 relative z-10">
                          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm border border-white/20">
                              {getIcon(bin.type)}
                          </div>
                          <h3 className="text-white font-bold text-lg drop-shadow-md">{bin.type}</h3>
                      </div>
                      <div className="text-white/80 text-xs flex flex-col items-end pt-4 relative z-10">
                          <span className="flex items-center gap-1 font-mono bg-black/20 px-2 py-0.5 rounded-full"><Signal size={12}/> {bin.id}</span>
                      </div>
                  </div>

                  <div className="p-8 flex-1 flex flex-col items-center justify-center relative">
                      
                      <div className="relative w-32 h-48 bg-stone-100 rounded-b-xl border-x-4 border-b-4 border-stone-200 mb-6 overflow-hidden shadow-inner">
                          <div className="absolute right-0 top-1/4 w-2 h-0.5 bg-stone-300"></div>
                          <div className="absolute right-0 top-2/4 w-2 h-0.5 bg-stone-300"></div>
                          <div className="absolute right-0 top-3/4 w-2 h-0.5 bg-stone-300"></div>

                          <div 
                              className={`absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-in-out opacity-90
                              ${bin.fillLevel > 90 ? 'bg-gradient-to-t from-red-600 to-red-500' : bin.fillLevel > 75 ? 'bg-gradient-to-t from-amber-500 to-amber-400' : getBinColor(bin.type)}`}
                              style={{ height: `${bin.fillLevel}%` }}
                          >
                              <div className="absolute -top-4 left-0 w-[200%] h-4 bg-white/30 rounded-[100%] animate-wave"></div>
                          </div>
                      </div>

                      <div className="text-center">
                          <span className={`text-4xl font-extrabold ${bin.fillLevel > 90 ? 'text-red-600' : 'text-stone-800'}`}>
                              {Math.round(bin.fillLevel)}%
                          </span>
                          <span className="text-stone-400 text-sm font-medium block uppercase tracking-wider">Fill Level</span>
                      </div>

                      <div className="w-full mt-6 space-y-2">
                        {isCritical && (
                            <div className="flex items-center justify-center gap-2 bg-red-50 text-red-700 px-3 py-2 rounded-lg text-xs font-bold border border-red-100">
                                <AlertTriangle size={14} />
                                <span>BIN OVERFLOW RISK</span>
                            </div>
                        )}
                        {durationAlert && (
                            <div className="flex items-center justify-center gap-2 bg-amber-50 text-amber-700 px-3 py-2 rounded-lg text-xs font-bold border border-amber-100">
                                <Clock size={14} />
                                <span>COLLECTION OVERDUE ({bin.daysSinceEmptied} Days)</span>
                            </div>
                        )}
                      </div>
                  </div>

                  <div className="bg-stone-50/50 p-4 border-t border-stone-100 flex justify-between items-center text-xs backdrop-blur-sm">
                      <div className="text-stone-500 flex items-center gap-1">
                        <Calendar size={12} />
                        Sitting: <span className={`font-bold ${durationAlert ? 'text-amber-600' : 'text-stone-700'}`}>{bin.daysSinceEmptied} Days</span>
                      </div>
                      <div className="text-stone-400">
                        {bin.location}
                      </div>
                  </div>

                </div>
              );
            })}
          </div>
      )}
      
      <div className="bg-white/60 backdrop-blur-lg border border-white/60 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
           <Info className="text-emerald-600" />
           <h2 className="text-xl font-bold text-gray-800">Waste Retention Rules (Alert Triggers)</h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
           {binGuidelines.map((guide) => (
             <div key={guide.type} className={`${guide.bgColor} border ${guide.borderColor} rounded-xl p-5 flex flex-col`}>
                <div className="flex items-center gap-3 mb-3">
                   <div className={`p-2 bg-white rounded-lg shadow-sm ${guide.color}`}>
                      <guide.icon size={20} />
                   </div>
                   <h3 className={`font-bold ${guide.color}`}>{guide.type}</h3>
                </div>
                
                <div className="mt-auto space-y-3">
                   <div className="flex items-start gap-2">
                      <Clock size={16} className={`mt-0.5 ${guide.color} opacity-80`} />
                      <div>
                         <p className="text-xs font-bold uppercase text-gray-500">Max Duration</p>
                         <p className="font-bold text-gray-800">{guide.duration}</p>
                      </div>
                   </div>
                   
                   <div className="flex items-start gap-2">
                      <Info size={16} className={`mt-0.5 ${guide.color} opacity-80`} />
                      <div>
                         <p className="text-xs font-bold uppercase text-gray-500">Why?</p>
                         <p className="text-sm text-gray-700 leading-snug">{guide.reason}</p>
                      </div>
                   </div>
                </div>
             </div>
           ))}
        </div>
      </div>

    </div>
  );
};

export default SmartBinMonitor;