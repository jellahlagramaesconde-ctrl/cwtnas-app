import React, { useState, useEffect, useRef } from 'react';
import { Filter, Search, MapPin, Calendar, User, ChevronRight, Save, X, Edit2, AlertTriangle, RefreshCcw, Send, MessageCircle } from 'lucide-react';
import { Report, ReportStatus, ReportMessage } from '../types';
import { firestore } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import firebase from 'firebase/compat/app';

const InfrastructureReports: React.FC = () => {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [newStatus, setNewStatus] = useState<ReportStatus | null>(null);

  // Chat State
  const [messages, setMessages] = useState<ReportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time updates from Firestore
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = firestore.collection('reports').onSnapshot((snapshot) => {
        const reportsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Report[];
        setReports(reportsData);
        setIsLoading(false);
        setError(null);
    }, (err) => {
        console.error("Firestore connection error:", err);
        setError("Unable to connect to the database. The system might be unavailable or you are offline.");
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to messages when a report is selected
  useEffect(() => {
      if (!selectedReport) return;
      
      const unsubscribe = firestore.collection('reports').doc(selectedReport.id).collection('messages')
        .orderBy('timestamp', 'asc')
        .onSnapshot(snapshot => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ReportMessage[];
            setMessages(msgs);
            // Scroll to bottom
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        });
        
      return () => unsubscribe();
  }, [selectedReport]);

  const handleSelectReport = (report: Report) => {
    setSelectedReport(report);
    setIsEditing(false); // Reset edit mode when switching reports
    setNewStatus(null);
  };

  const handleSaveStatus = async () => {
    if (!selectedReport || !newStatus) return;

    try {
        const reportRef = firestore.collection('reports').doc(selectedReport.id);
        await reportRef.update({
            status: newStatus
        });
        
        // Optimistic update for UI (though onSnapshot will handle it eventually)
        const updatedReport = { ...selectedReport, status: newStatus };
        setSelectedReport(updatedReport);
        setIsEditing(false);
    } catch (error) {
        console.error("Error updating status:", error);
        alert("Failed to update status");
    }
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !selectedReport || !currentUser) return;
      
      try {
          await firestore.collection('reports').doc(selectedReport.id).collection('messages').add({
              text: newMessage,
              senderName: currentUser.name,
              senderRole: currentUser.role,
              timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
          setNewMessage('');
      } catch (e) {
          console.error("Failed to send message", e);
      }
  };

  // Filter Logic for Search
  const filteredReports = reports.filter(report => {
    const term = searchTerm.toLowerCase();
    const idMatch = report.id.toLowerCase().includes(term);
    const titleMatch = report.title.toLowerCase().includes(term);
    // reporterName contains the full name, so searching "Juan" or "Cruz" both work
    const nameMatch = report.reporterName?.toLowerCase().includes(term) || false;

    return idMatch || titleMatch || nameMatch;
  });

  // Helper to count stats based on current state
  const total = reports.length;
  const pending = reports.filter(r => r.status === ReportStatus.PENDING).length;
  const inProgress = reports.filter(r => r.status === ReportStatus.IN_PROGRESS).length;
  const resolved = reports.filter(r => r.status === ReportStatus.RESOLVED).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Infrastructure Reports</h1>
        <p className="text-gray-500">Monitor and manage streetlight and infrastructure issues</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700 animate-fade-in">
           <AlertTriangle size={20} />
           <span className="font-medium flex-1">{error}</span>
           <button onClick={() => window.location.reload()} className="p-2 hover:bg-red-100 rounded-lg">
             <RefreshCcw size={16} />
           </button>
        </div>
      )}

      {/* Status Summary */}
      <div className="grid grid-cols-4 gap-4">
         <div className="bg-white p-4 rounded-xl border-l-4 border-gray-800 shadow-sm">
            <span className="text-2xl font-bold block">{total}</span>
            <span className="text-xs text-gray-500">Total Reports</span>
         </div>
         <div className="bg-white p-4 rounded-xl border-l-4 border-amber-500 shadow-sm">
            <span className="text-2xl font-bold block text-amber-600">{pending}</span>
            <span className="text-xs text-gray-500">Pending</span>
         </div>
         <div className="bg-white p-4 rounded-xl border-l-4 border-blue-500 shadow-sm">
            <span className="text-2xl font-bold block text-blue-600">{inProgress}</span>
            <span className="text-xs text-gray-500">In Progress</span>
         </div>
         <div className="bg-white p-4 rounded-xl border-l-4 border-emerald-500 shadow-sm">
            <span className="text-2xl font-bold block text-emerald-600">{resolved}</span>
            <span className="text-xs text-gray-500">Resolved</span>
         </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        
        {/* Reports List */}
        <div className="lg:col-span-3 space-y-4">
           
           {/* Filters */}
           <div className="flex gap-4 mb-4">
              <div className="relative flex-1">
                 <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"/>
                 <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by ID, First/Last Name, or Title..." 
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                 />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                 <Filter size={14} /> Filter
              </button>
           </div>

           <div className="space-y-3">
             {isLoading ? (
               <div className="text-center py-8 text-gray-400">Loading reports...</div>
             ) : filteredReports.length === 0 ? (
               <div className="text-center py-12 bg-white rounded-xl border border-dashed">
                  <p className="text-gray-500">No reports found matching "{searchTerm}".</p>
               </div>
             ) : (
               filteredReports.map(report => (
                 <div 
                    key={report.id} 
                    onClick={() => handleSelectReport(report)}
                    className={`bg-white p-5 rounded-xl border shadow-sm cursor-pointer transition-all
                      ${selectedReport?.id === report.id ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-gray-100 hover:border-emerald-200'}`}
                 >
                    <div className="flex justify-between items-start mb-2">
                       <div>
                          <h3 className="font-bold text-gray-800">{report.title}</h3>
                          <p className="text-xs text-gray-500 flex items-center mt-1">
                             <MapPin size={12} className="mr-1"/> {report.location}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">Reported by: <span className="font-medium text-gray-600">{report.reporterName}</span></p>
                       </div>
                       <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider
                          ${report.priority === 'HIGH' ? 'bg-red-50 text-red-600' : 
                            report.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                          {report.priority}
                       </span>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                       <span className={`flex items-center text-xs font-medium px-2 py-0.5 rounded-full capitalize
                          ${report.status === ReportStatus.RESOLVED ? 'bg-green-100 text-green-700' :
                            report.status === ReportStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'}`}>
                          {report.status.replace('_', ' ').toLowerCase()}
                       </span>
                       <span className="text-xs text-gray-400">{report.dateReported}</span>
                    </div>
                 </div>
               ))
             )}
           </div>
        </div>

        {/* Report Details & Edit Panel */}
        <div className="lg:col-span-2">
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-[calc(100vh-100px)] p-0 sticky top-24 flex flex-col overflow-hidden">
              {selectedReport ? (
                <>
                   <div className="p-6 border-b border-gray-100 overflow-y-auto" style={{maxHeight: '50%'}}>
                       <div className="flex justify-between items-start mb-6">
                          <h2 className="text-xl font-bold text-gray-800">{selectedReport.title}</h2>
                          <span className="text-xs text-gray-400">ID: {selectedReport.id.substring(0, 8)}...</span>
                       </div>
                       
                       <div className="space-y-6">
                          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 overflow-hidden relative group">
                             {selectedReport.imageUrl ? (
                                 <img src={selectedReport.imageUrl} alt="Issue" className="w-full h-full object-cover"/>
                             ) : (
                                 <div className="flex flex-col items-center">
                                     <AlertTriangle size={32} className="mb-2 opacity-50"/>
                                     <span className="text-xs font-medium">No Image Uploaded</span>
                                 </div>
                             )}
                          </div>

                          <div>
                             <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Description</label>
                             <p className="text-sm text-gray-700 mt-1">{selectedReport.description}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                   <Calendar size={12}/> Reported Date
                                </label>
                                <p className="text-sm text-gray-800 mt-1">{selectedReport.dateReported}</p>
                             </div>
                             <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                   <User size={12}/> Reported By
                                </label>
                                <p className="text-sm text-gray-800 mt-1">{selectedReport.reporterName}</p>
                             </div>
                          </div>

                          <div className="border-t border-gray-100 pt-6 mt-4">
                             <div className="flex justify-between items-center mb-3">
                                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Current Status</label>
                                 {!isEditing && (
                                     <button 
                                        onClick={() => {
                                            setNewStatus(selectedReport.status);
                                            setIsEditing(true);
                                        }}
                                        className="text-emerald-600 hover:text-emerald-700 text-xs font-bold flex items-center gap-1"
                                     >
                                        <Edit2 size={12} /> Edit
                                     </button>
                                 )}
                             </div>

                             {isEditing ? (
                                 <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                     <select 
                                        className="w-full p-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                        value={newStatus || selectedReport.status}
                                        onChange={(e) => setNewStatus(e.target.value as ReportStatus)}
                                     >
                                         <option value={ReportStatus.PENDING}>Pending</option>
                                         <option value={ReportStatus.IN_PROGRESS}>In Progress</option>
                                         <option value={ReportStatus.RESOLVED}>Resolved</option>
                                     </select>
                                     
                                     <div className="flex gap-2">
                                         <button 
                                            onClick={handleSaveStatus}
                                            className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 flex items-center justify-center gap-2"
                                         >
                                             <Save size={14} /> Save
                                         </button>
                                         <button 
                                            onClick={() => setIsEditing(false)}
                                            className="flex-1 bg-white border border-gray-300 text-gray-600 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 flex items-center justify-center gap-2"
                                         >
                                             <X size={14} /> Cancel
                                         </button>
                                     </div>
                                 </div>
                             ) : (
                                 <div className={`p-3 rounded-lg flex items-center gap-2 font-medium text-sm
                                    ${selectedReport.status === ReportStatus.RESOLVED ? 'bg-green-100 text-green-800' :
                                      selectedReport.status === ReportStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
                                      'bg-amber-100 text-amber-800'}`}>
                                    <div className={`w-2.5 h-2.5 rounded-full 
                                        ${selectedReport.status === ReportStatus.RESOLVED ? 'bg-green-500' :
                                          selectedReport.status === ReportStatus.IN_PROGRESS ? 'bg-blue-500' :
                                          'bg-amber-500'}`}></div>
                                    {selectedReport.status.replace('_', ' ')}
                                 </div>
                             )}
                          </div>
                       </div>
                   </div>
                   
                   {/* CHAT SECTION */}
                   <div className="flex-1 bg-slate-50 flex flex-col min-h-0 border-t border-gray-200">
                       <div className="p-3 border-b border-gray-200 bg-white flex items-center gap-2">
                           <MessageCircle size={16} className="text-gray-400"/>
                           <span className="text-xs font-bold uppercase text-gray-600">Report Chat</span>
                       </div>
                       
                       <div className="flex-1 overflow-y-auto p-4 space-y-3">
                           {messages.length === 0 && (
                               <p className="text-center text-xs text-gray-400 italic mt-4">No messages yet. Start conversation with resident.</p>
                           )}
                           {messages.map(msg => {
                               const isMe = msg.senderRole === currentUser?.role; 
                               return (
                                   <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                       <div className={`max-w-[85%] rounded-lg p-2 text-sm ${isMe ? 'bg-emerald-100 text-emerald-900 rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'}`}>
                                           {msg.text}
                                       </div>
                                       <span className="text-[10px] text-gray-400 mt-1 px-1">
                                           {msg.senderName} • {msg.senderRole}
                                       </span>
                                   </div>
                               )
                           })}
                           <div ref={chatEndRef} />
                       </div>
                       
                       <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200 flex gap-2">
                           <input 
                               type="text" 
                               className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                               placeholder="Type a message..."
                               value={newMessage}
                               onChange={(e) => setNewMessage(e.target.value)}
                           />
                           <button type="submit" className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700">
                               <Send size={16} />
                           </button>
                       </form>
                   </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                   <ChevronRight size={48} className="mb-2 opacity-20"/>
                   <p>Select a report to view details</p>
                </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
};

export default InfrastructureReports;