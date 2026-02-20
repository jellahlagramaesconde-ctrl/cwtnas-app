
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Info, Truck, Leaf, Recycle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CollectionSchedule, Alert } from '../types';
import { firestore } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

const ResidentSchedule: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [scheduleData, setScheduleData] = useState<CollectionSchedule[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  const userZone = currentUser?.zone || 'Zone 1A';
  
  // FIXED: Logic to handle cases where zones might be "Zone 1A, Zone 1B" in one string
  // instead of separate items in the array.
  const userCollectionDays = scheduleData
    .filter(s => s.zones.some(z => z.includes(userZone)))
    .map(s => s.day);

  useEffect(() => {
    const fetchData = async () => {
        try {
            // Fetch Schedules
            const schedSnapshot = await firestore.collection('schedules').get();
            const schedules = schedSnapshot.docs.map(doc => doc.data() as CollectionSchedule);
            setScheduleData(schedules);

            // Fetch Alerts
            const alertsQuery = firestore.collection('alerts').orderBy('timestamp', 'desc');
            const alertSnapshot = await alertsQuery.get();
            const alertsList = alertSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Alert[];
            setAlerts(alertsList);

        } catch (error) {
            console.error("Error fetching schedule data:", error);
        }
    };
    fetchData();
  }, []);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const changeMonth = (increment: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + increment, 1));
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  const renderCalendar = () => {
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50/50 border border-gray-100/50"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      const dayName = date.toLocaleString('default', { weekday: 'long' });
      const isCollectionDay = userCollectionDays.includes(dayName);
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <div 
          key={i} 
          onClick={() => setSelectedDate(date)}
          className={`h-24 border border-gray-100 p-2 relative transition-all cursor-pointer hover:shadow-md 
          ${isToday ? 'bg-emerald-50/30' : 'bg-white hover:bg-gray-50'}`}
        >
          <span className={`text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full
            ${isToday ? 'bg-emerald-600 text-white' : 'text-gray-700'}`}>
            {i}
          </span>
          
          {isCollectionDay && (
            <div className="mt-2 text-xs bg-emerald-100 text-emerald-700 p-1.5 rounded border border-emerald-200 flex items-center gap-1">
              <Clock size={10} />
              <span className="font-semibold truncate">Collection</span>
            </div>
          )}
        </div>
      );
    }
    return days;
  };

  const renderModalContent = () => {
    if (!selectedDate) return null;

    const dayName = selectedDate.toLocaleString('default', { weekday: 'long' });
    const formattedDate = selectedDate.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });
    const isCollectionDay = userCollectionDays.includes(dayName);
    
    // FIXED: Looser matching logic for modal content as well
    const scheduleDetails = scheduleData.find(s => s.zones.some(z => z.includes(userZone)) && s.day === dayName);

    const isRecyclable = selectedDate.getDate() % 2 === 0; 
    const wasteType = isRecyclable ? "Recyclables & Non-Biodegradable" : "Biodegradable & Food Waste";
    const WasteIcon = isRecyclable ? Recycle : Leaf;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
          
          <div className={`p-6 text-white flex items-center justify-between gap-3 flex-shrink-0 ${isCollectionDay ? 'bg-emerald-600' : 'bg-gray-500'}`}>
            <div className="flex-1">
              <h2 className="text-2xl font-bold leading-tight">{dayName}</h2>
              <p className="opacity-90 text-sm">{formattedDate}</p>
            </div>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto">
            {isCollectionDay && scheduleDetails ? (
              <>
                <div className="flex items-center gap-4 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <Truck size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Collection Scheduled</h3>
                    <p className="text-sm text-emerald-700">Truck authorized for {userZone}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Clock className="text-gray-400 mt-1" size={18} />
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">Estimated Time</p>
                      <p className="font-medium text-gray-800">{scheduleDetails.time}</p>
                      <p className="text-xs text-gray-400">Please be ready 30 mins before</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="text-gray-400 mt-1" size={18} />
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">Pickup Location</p>
                      <p className="font-medium text-gray-800">Curbside / Designated Point</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <WasteIcon className="text-emerald-500 mt-1" size={18} />
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">Waste Type Focus</p>
                      <p className="font-medium text-gray-800">{wasteType}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-xs text-amber-800 flex gap-2">
                   <Info size={16} className="flex-shrink-0" />
                   <p>Ensure bags are sealed properly. Segregation is strictly enforced.</p>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                  <CalendarIcon size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">No Collection Scheduled</h3>
                <p className="text-gray-500 mt-2">There are no waste collection activities scheduled for your zone on this day.</p>
              </div>
            )}
            
            {alerts.length > 0 && (
               <div className="border-t pt-4 mt-2">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">Community Notices</p>
                  {alerts.map(alert => (
                    <div key={alert.id} className="text-sm text-gray-600 bg-gray-50 p-2 rounded mb-1">
                      <span className="font-bold text-gray-800">{alert.title}:</span> {alert.message}
                    </div>
                  ))}
               </div>
            )}

            <button 
              onClick={() => setSelectedDate(null)}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors"
            >
              Back to Calendar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative">
      {renderModalContent()}
      
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate('/resident/dashboard')} className="p-2 hover:bg-gray-100 rounded-full transition-colors group">
            <ArrowLeft size={24} className="text-gray-600 group-hover:text-gray-800" />
        </button>
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Collection Schedule</h1>
            <p className="text-gray-500 text-sm">View pickup dates and community alerts for {userZone}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        <div className="p-6 flex flex-col sm:flex-row items-center justify-between border-b border-gray-100 gap-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarIcon className="text-emerald-600" />
            {monthName} {year}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 border border-gray-200">
              <ChevronLeft size={24} />
            </button>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 border border-gray-200">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 bg-white">
          {renderCalendar()}
        </div>
      </div>

      <div className="flex flex-wrap gap-6 text-sm text-gray-600 justify-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
           <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
           <span>Collection Day</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-200"></div>
           <span>Today</span>
        </div>
         <div className="flex items-center gap-2">
           <div className="w-3 h-3 rounded-full bg-white border border-gray-300"></div>
           <span>No Service</span>
        </div>
      </div>

    </div>
  );
};

export default ResidentSchedule;
