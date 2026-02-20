import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Search, Filter, MapPin, FileText, CheckCircle2, Circle, X, ChevronDown, Send, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Report, ReportStatus, ReportMessage } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { firestore } from '../services/firebase';
import firebase from 'firebase/compat/app';

const ResidentHistory: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  
  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    const fetchReports = async () => {
      if (!currentUser) return;
      setLoading(true);
      
      try {
        if (!firestore) throw new Error("Database not connected");
        
        const querySnapshot = await firestore.collection('reports')
          .where('reporterId', '==', currentUser.id)
          .get();
        
        const reportsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Report[];

        // Sort: Latest first
        reportsData.sort((a, b) => new Date(b.dateReported).getTime() - new Date(a.dateReported).getTime());

        setReports(reportsData);
      } catch (err) {
        console.error("Error fetching reports:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [currentUser]);

  const filteredReports = reports.filter(r => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        (r.title || '').toLowerCase().includes(term) ||
        (r.id || '').toLowerCase().includes(term) ||
        (r.category || '').toLowerCase().includes(term);

      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;

      return matchesSearch && matchesStatus;
  });

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
    const [messages, setMessages] = useState<ReportMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Fetch messages for selected report
    useEffect(() => {
        if (!selectedReport) return;
        const unsubscribe = firestore.collection('reports').doc(selectedReport.id).collection('messages')
            .orderBy('timestamp', 'asc')
            .onSnapshot(snapshot => {
                const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ReportMessage[];
                setMessages(msgs);
                setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            });
        return () => unsubscribe();
    }, [selectedReport]);

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
        } catch (e) { console.error(e); }
    };

    if (!selectedReport) return null;

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col h-[85vh]">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
            <div>
              <h2 className="text-lg font-bold text-slate-800 line-clamp-1">
                {selectedReport.title}
              </h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mt-1 inline-block
                  ${selectedReport.status === 'RESOLVED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                  {selectedReport.status.replace('_', ' ')}
              </span>
            </div>
            <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                        ${getTimelineStatus(selectedReport.status, item.step) ? 'border-emerald-500 text-emerald-500' : 'border-slate-200 text-slate-300'}`}>
                         {getTimelineStatus(selectedReport.status, item.step) ? <CheckCircle2 size={14} fill="currentColor" className="text-white" /> : <Circle size={10} />}
                      </div>
                      <h4 className={`font-bold text-sm ${getTimelineStatus(selectedReport.status, item.step) ? 'text-slate-800' : 'text-slate-400'}`}>{item.label}</h4>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                   </div>
                 ))}
               </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
               <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Description</h4>
               <p className="text-slate-700 text-sm leading-relaxed mb-3">{selectedReport.description}</p>
               <div className="flex gap-4 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1"><MapPin size={12}/> {selectedReport.location}</span>
                  <span className="flex items-center gap-1"><FileText size={12}/> {selectedReport.category}</span>
               </div>
            </div>
            
            {/* Real Image Rendering */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Photo Proof</h4>
              {selectedReport.imageUrl ? (
                  <img src={selectedReport.imageUrl} alt="Proof" className="w-full rounded-lg border border-slate-200" />
              ) : (
                  <div className="bg-slate-100 border border-slate-200 rounded-lg p-6 text-center text-slate-400 text-sm">
                      No Image Uploaded
                  </div>
              )}
            </div>

             {/* CHAT SECTION IN RESIDENT VIEW */}
             <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden mt-4">
                 <div className="p-3 border-b border-gray-200 bg-white flex items-center gap-2">
                      <MessageCircle size={16} className="text-gray-400"/>
                      <span className="text-xs font-bold uppercase text-gray-600">Conversation with Official</span>
                  </div>
                  <div className="h-40 overflow-y-auto p-3 space-y-2 bg-slate-50/50">
                      {messages.length === 0 && <p className="text-xs text-slate-400 italic text-center">No messages yet.</p>}
                      {messages.map(msg => {
                          const isMe = msg.senderRole === currentUser?.role; 
                          return (
                              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                  <div className={`max-w-[85%] rounded-lg p-2 text-xs ${isMe ? 'bg-emerald-100 text-emerald-900' : 'bg-white border border-gray-200'}`}>
                                      {msg.text}
                                  </div>
                                  <span className="text-[10px] text-gray-400 px-1">{msg.senderName} ({msg.senderRole})</span>
                              </div>
                          )
                      })}
                      <div ref={chatEndRef} />
                  </div>
                  <form onSubmit={handleSendMessage} className="p-2 bg-white border-t border-gray-200 flex gap-2">
                       <input type="text" className="flex-1 text-xs border rounded px-2 py-1" placeholder="Ask question..." value={newMessage} onChange={e => setNewMessage(e.target.value)}/>
                       <button type="submit" className="bg-emerald-500 text-white p-1.5 rounded"><Send size={14}/></button>
                  </form>
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
      <ReportDetailModal />
      
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/resident/dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
            <h1 className="text-2xl font-bold text-slate-800">My Reports History</h1>
            <p className="text-slate-500 text-sm">Track the status of all your submitted issues</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible relative z-10">
         {/* Filters */}
         <div className="p-4 border-b border-slate-100 bg-slate-50 flex gap-3 z-20 relative rounded-t-xl">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/>
                <input 
                   type="text" 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   placeholder="Search reports..." 
                   className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
            </div>
            
            <div className="relative">
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm transition-colors ${statusFilter !== 'ALL' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                    <Filter size={14} /> 
                    {statusFilter === 'ALL' ? 'Filter' : statusFilter.replace('_', ' ')}
                    <ChevronDown size={14} className={`transition-transform ${isFilterOpen ? 'rotate-180' : ''}`}/>
                </button>
                
                {isFilterOpen && (
                   <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                       {['ALL', 'PENDING', 'IN_PROGRESS', 'RESOLVED'].map(status => (
                           <button 
                             key={status}
                             onClick={() => { setStatusFilter(status); setIsFilterOpen(false); }}
                             className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${statusFilter === status ? 'text-emerald-600 font-bold bg-emerald-50' : 'text-slate-600'}`}
                           >
                              {status === 'ALL' ? 'All Reports' : status.replace('_', ' ')}
                           </button>
                       ))}
                   </div>
                )}
            </div>
         </div>

         {/* List */}
         <div className="divide-y divide-slate-100">
             {loading ? (
                <div className="p-8 text-center text-slate-400">Loading your history...</div>
             ) : filteredReports.length === 0 ? (
                <div className="p-12 text-center">
                    <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                        <FileText className="text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-medium">No reports found.</p>
                </div>
             ) : (
                filteredReports.map(report => (
                    <div 
                      key={report.id} 
                      onClick={() => setSelectedReport(report)}
                      className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                        <div className="flex justify-between items-start mb-1">
                            <h3 className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{report.title}</h3>
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider
                                ${report.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 
                                  report.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 
                                  'bg-amber-100 text-amber-700'}`}>
                                {report.status.replace('_', ' ')}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1 mb-2">{report.description}</p>
                        <div className="flex gap-4 text-xs text-slate-400">
                            <span className="flex items-center gap-1"><MapPin size={12}/> {report.location}</span>
                            <span>{report.dateReported}</span>
                        </div>
                    </div>
                ))
             )}
         </div>
      </div>
    </div>
  );
};

export default ResidentHistory;
