import React, { useEffect, useState } from 'react';
import { Trash2, Lightbulb, CheckCircle, AlertTriangle, RefreshCcw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { firestore } from '../services/firebase';
import { Report, WasteRoute } from '../types';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    activeRoutes: 0,
    activeReports: 0,
    resolvedWeek: 0,
    urgentIssues: 0
  });
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        if (!firestore) return;

        // 1. Fetch Routes Stats
        const routesSnap = await firestore.collection('waste_routes').get();
        const routes = routesSnap.docs.map(doc => doc.data() as WasteRoute);
        const activeTrucks = routes.filter(r => r.status === 'In Progress').length;

        // 2. Fetch Reports Stats
        const reportsSnap = await firestore.collection('reports').get();
        const reports = reportsSnap.docs.map(doc => doc.data() as Report);

        const activeReportsCount = reports.filter(r => r.status !== 'RESOLVED').length;
        const urgentCount = reports.filter(r => r.priority === 'HIGH' || r.priority === 'URGENT').length;
        const resolvedCount = reports.filter(r => r.status === 'RESOLVED').length;

        // 3. Aggregate Chart Data (Real Data)
        // Initialize days (Mon-Sun order for business view)
        const daysMap = [
          { name: 'Mon', dayIdx: 1, reported: 0, resolved: 0 },
          { name: 'Tue', dayIdx: 2, reported: 0, resolved: 0 },
          { name: 'Wed', dayIdx: 3, reported: 0, resolved: 0 },
          { name: 'Thu', dayIdx: 4, reported: 0, resolved: 0 },
          { name: 'Fri', dayIdx: 5, reported: 0, resolved: 0 },
          { name: 'Sat', dayIdx: 6, reported: 0, resolved: 0 },
          { name: 'Sun', dayIdx: 0, reported: 0, resolved: 0 },
        ];

        reports.forEach(report => {
          // Attempt to parse date. Assuming dateReported is "MM/DD/YYYY" or ISO string
          const d = new Date(report.dateReported);
          if (!isNaN(d.getTime())) {
             const day = d.getDay(); // 0 = Sun, 1 = Mon...
             const dayData = daysMap.find(item => item.dayIdx === day);
             if (dayData) {
                dayData.reported++;
                if (report.status === 'RESOLVED') {
                   dayData.resolved++;
                }
             }
          }
        });

        setStats({
          activeRoutes: activeTrucks,
          activeReports: activeReportsCount,
          resolvedWeek: resolvedCount,
          urgentIssues: urgentCount
        });
        setWeeklyData(daysMap);

      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ icon: Icon, title, value, subtext, colorClass, iconBg }: any) => (
    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-white/50 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
         <div>
            <p className="text-sm font-bold text-stone-500 uppercase tracking-wide">{title}</p>
            <h3 className="text-3xl font-extrabold text-stone-800 mt-1">
                {loading ? "..." : value}
            </h3>
         </div>
         <div className={`p-3 rounded-lg ${iconBg}`}>
            <Icon className={`h-6 w-6 ${colorClass}`} />
         </div>
      </div>
      <p className={`text-xs font-bold ${title === 'Urgent Issues' ? 'text-red-500' : 'text-emerald-600'} flex items-center gap-1`}>
        {subtext}
      </p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div className="flex justify-between items-end">
         <div>
            <h1 className="text-3xl font-extrabold text-stone-800">Barangay Official Dashboard</h1>
            <p className="text-stone-500 mt-1">Real-time monitoring from Firestore Database</p>
         </div>
         <button onClick={() => window.location.reload()} className="p-2 bg-white rounded-full shadow-sm text-stone-500 hover:text-emerald-600">
            <RefreshCcw size={20} />
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Trash2} 
          title="Active Trucks" 
          value={stats.activeRoutes} 
          subtext="Currently on route"
          colorClass="text-emerald-600"
          iconBg="bg-emerald-100"
        />
        <StatCard 
          icon={Lightbulb} 
          title="Active Reports" 
          value={stats.activeReports} 
          subtext="Pending / In Progress"
          colorClass="text-amber-600"
          iconBg="bg-amber-100"
        />
        <StatCard 
          icon={CheckCircle} 
          title="Total Resolved" 
          value={stats.resolvedWeek} 
          subtext="Issues Fixed"
          colorClass="text-blue-600"
          iconBg="bg-blue-100"
        />
        <StatCard 
          icon={AlertTriangle} 
          title="Urgent Issues" 
          value={stats.urgentIssues} 
          subtext="High Priority"
          colorClass="text-red-600"
          iconBg="bg-red-100"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-sm border border-white/50">
           <h3 className="text-lg font-bold text-stone-800 mb-6">Weekly Issues Overview</h3>
           <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={weeklyData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#78716c', fontSize: 12}} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#78716c', fontSize: 12}} />
                 <Tooltip cursor={{fill: '#f0fdf4'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                 <Legend />
                 <Bar dataKey="reported" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="New Reports" />
                 <Bar dataKey="resolved" fill="#10b981" radius={[4, 4, 0, 0]} name="Resolved" />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-sm border border-white/50 flex flex-col">
            <h3 className="text-lg font-bold text-stone-800 mb-6">Resolution Efficiency</h3>
            <div className="flex-1 flex flex-col justify-center items-center gap-4">
                <div className="w-full bg-stone-100 rounded-full h-4 overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${(stats.activeReports + stats.resolvedWeek) > 0 ? (stats.resolvedWeek / (stats.resolvedWeek + stats.activeReports) * 100) : 0}%` }}></div>
                </div>
                <div className="flex items-center gap-2">
                    <h2 className="text-5xl font-extrabold text-emerald-600">
                        {(stats.activeReports + stats.resolvedWeek) > 0 ? Math.round(stats.resolvedWeek / (stats.resolvedWeek + stats.activeReports) * 100) : 0}%
                    </h2>
                </div>
                <p className="text-stone-500 text-sm">
                    {stats.resolvedWeek} Resolved vs {stats.activeReports} Pending
                </p>
                {stats.activeReports === 0 && stats.resolvedWeek === 0 && (
                    <p className="text-xs text-stone-400 italic">No reports found in database yet.</p>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;