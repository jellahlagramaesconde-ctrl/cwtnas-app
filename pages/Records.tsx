import React, { useState, useEffect } from 'react';
import { Download, Search, FileText, RefreshCw, Filter, Truck, AlertTriangle } from 'lucide-react';
import { firestore } from '../services/firebase';
import { WasteRoute, Report } from '../types';

interface ServiceRecord {
  id: string;
  date: string;
  rawDate: number; // for sorting
  type: string;
  category: 'Waste' | 'Infrastructure';
  location: string;
  status: string;
  details: string;
}

const Records: React.FC = () => {
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All Records');

  // Analytics State
  const [stats, setStats] = useState({
    totalCollections: 0,
    reportsFiled: 0,
    resolvedCount: 0,
    resolutionRate: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (!firestore) return;

        // 1. Fetch Completed Waste Routes
        const routesSnap = await firestore.collection('waste_routes')
          .where('status', '==', 'Completed')
          .limit(50)
          .get();
        
        const routeRecords: ServiceRecord[] = routesSnap.docs.map(doc => {
          const data = doc.data() as WasteRoute & { createdAt?: any };
          const dateObj = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
          return {
            id: doc.id,
            date: dateObj.toLocaleDateString(),
            rawDate: dateObj.getTime(),
            type: 'Waste Collection',
            category: 'Waste',
            location: data.zone,
            status: 'Completed',
            details: `${data.name} (Driver: ${data.driver})`
          };
        });

        // 2. Fetch All Reports (Infrastructure & Issues)
        const reportsSnap = await firestore.collection('reports')
          .limit(50)
          .get();

        const reportRecords: ServiceRecord[] = reportsSnap.docs.map(doc => {
          const data = doc.data() as Report & { createdAt?: any };
          // Handle various date formats (string or timestamp)
          let dateObj = new Date();
          if (data.createdAt?.toDate) {
             dateObj = data.createdAt.toDate();
          } else if (data.dateReported) {
             dateObj = new Date(data.dateReported);
          }

          return {
            id: doc.id,
            date: dateObj.toLocaleDateString(),
            rawDate: dateObj.getTime(),
            type: `${data.category} Report`,
            category: 'Infrastructure',
            location: data.location,
            status: data.status,
            details: data.title
          };
        });

        // 3. Combine & Sort
        const combined = [...routeRecords, ...reportRecords].sort((a, b) => b.rawDate - a.rawDate);
        setRecords(combined);

        // 4. Calculate Analytics
        const totalReports = reportRecords.length;
        const resolved = reportRecords.filter(r => r.status === 'RESOLVED').length;
        
        setStats({
          totalCollections: routeRecords.length,
          reportsFiled: totalReports,
          resolvedCount: resolved,
          resolutionRate: totalReports > 0 ? Math.round((resolved / totalReports) * 100) : 0
        });

      } catch (err) {
        console.error("Error fetching records:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleExport = () => {
    // Simple CSV Export Logic
    const headers = ["Date", "Type", "Location", "Status", "Details"];
    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + records.map(r => `${r.date},${r.type},"${r.location}",${r.status},"${r.details}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "service_records.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Logic
  const filteredRecords = records.filter(record => {
     const matchesSearch = 
        record.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.type.toLowerCase().includes(searchTerm.toLowerCase());
     
     const matchesType = 
        filterType === 'All Records' ? true :
        filterType === 'Waste Collection' ? record.category === 'Waste' :
        filterType === 'Infrastructure' ? record.category === 'Infrastructure' : true;

     return matchesSearch && matchesType;
  });

  const Metric = ({ label, value, sub, color, icon: Icon }: any) => (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
       <div className={`absolute top-0 right-0 p-3 opacity-10 ${color} group-hover:scale-110 transition-transform`}>
          <Icon size={40} />
       </div>
       <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</p>
       <h3 className="text-3xl font-extrabold text-gray-800 mt-2">{value}</h3>
       <p className={`text-xs mt-1 font-medium ${color.replace('bg-', 'text-').replace('100', '600')}`}>{sub}</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
       
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
         <div>
            <h1 className="text-2xl font-bold text-gray-800">Service Records & Analytics</h1>
            <p className="text-gray-500">Historical data verification for waste collection and repairs</p>
         </div>
         <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
         >
            <Download size={16} /> Export CSV
         </button>
       </div>

       {/* Analytics Cards */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Metric 
            label="Total Collections" 
            value={stats.totalCollections} 
            sub="Completed Routes" 
            color="bg-emerald-100 text-emerald-600"
            icon={Truck}
          />
          <Metric 
            label="Reports Filed" 
            value={stats.reportsFiled} 
            sub="Issues Reported" 
            color="bg-amber-100 text-amber-600"
            icon={FileText}
          />
          <Metric 
            label="Resolved Issues" 
            value={stats.resolvedCount} 
            sub="Fixed/Closed" 
            color="bg-blue-100 text-blue-600"
            icon={Filter}
          />
          <Metric 
            label="Resolution Rate" 
            value={`${stats.resolutionRate}%`} 
            sub="Efficiency Score" 
            color="bg-purple-100 text-purple-600"
            icon={RefreshCw}
          />
       </div>

       {/* Data Table */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center bg-gray-50/50 gap-4">
             <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <FileText size={18} className="text-emerald-600"/> Master Record List
             </h3>
             <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative">
                   <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"/>
                   <input 
                     type="text" 
                     placeholder="Search records..." 
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-64"
                   />
                </div>
                <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="border border-gray-200 rounded-lg text-sm px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                   <option>All Records</option>
                   <option>Waste Collection</option>
                   <option>Infrastructure</option>
                </select>
             </div>
          </div>

          <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-4 font-bold tracking-wider">Date</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Service Type</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Location / Zone</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Details</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {loading ? (
                        <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Loading records from database...</td></tr>
                    ) : filteredRecords.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center">
                                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                    <Search className="text-gray-400" size={20}/>
                                </div>
                                <p className="text-gray-500 font-medium">No records found.</p>
                                <p className="text-gray-400 text-xs">Try adjusting your filters.</p>
                            </td>
                        </tr>
                    ) : (
                        filteredRecords.map((row) => (
                            <tr key={row.id} className="hover:bg-gray-50/80 transition-colors">
                                <td className="px-6 py-4 text-gray-900 font-medium whitespace-nowrap">{row.date}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${row.category === 'Waste' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                                        <span className={`text-xs font-bold uppercase ${row.category === 'Waste' ? 'text-emerald-700' : 'text-blue-700'}`}>
                                            {row.type}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600">{row.location}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide
                                        ${row.status === 'Completed' || row.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 
                                          row.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {row.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500 max-w-xs truncate" title={row.details}>{row.details}</td>
                            </tr>
                        ))
                    )}
                </tbody>
              </table>
          </div>

          <div className="p-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500 bg-gray-50/30">
             <span>Showing {filteredRecords.length} of {records.length} records</span>
             <span>Sorted by Date (Newest First)</span>
          </div>
       </div>

    </div>
  );
};

export default Records;