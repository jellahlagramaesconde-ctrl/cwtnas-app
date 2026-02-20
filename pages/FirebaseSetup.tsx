import React, { useState } from 'react';
import { Save, Trash2, ArrowLeft, CheckCircle, XCircle, Database, AlertTriangle, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saveFirebaseConfig, resetFirebaseConfig, auth } from '../services/firebase';

const FirebaseSetup: React.FC = () => {
  const navigate = useNavigate();
  const [configJson, setConfigJson] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    try {
      let jsonString = configJson.trim();
      if (!jsonString) {
        setError("Please paste the configuration JSON.");
        return;
      }
      if (jsonString.includes('=')) {
        jsonString = jsonString.substring(jsonString.indexOf('=') + 1);
      }
      if (jsonString.trim().endsWith(';')) {
        jsonString = jsonString.trim().slice(0, -1);
      }
      jsonString = jsonString.replace(/,\s*}/g, '}');
      jsonString = jsonString.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": '); 
      jsonString = jsonString.replace(/'/g, '"');

      const config = JSON.parse(jsonString);
      
      if (!config.apiKey || !config.projectId) {
          throw new Error("JSON is missing required fields (apiKey or projectId)");
      }

      saveFirebaseConfig(config);
    } catch (err: any) {
      console.error(err);
      setError(`Invalid JSON format: ${err.message}. Please ensure you copy the configuration object correctly.`);
    }
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset the local configuration?")) {
      resetFirebaseConfig();
    }
  };

  const isConnected = !!auth;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-100">
        
        <div className="p-6 bg-gradient-to-r from-stone-800 to-stone-900 text-white flex items-center justify-between">
           <div className="flex items-center gap-3">
              <button onClick={() => navigate('/login')} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
                <ArrowLeft size={20} />
              </button>
              <h1 className="font-bold text-lg">System Configuration</h1>
           </div>
           <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${!isConnected ? 'bg-amber-500/20 border-amber-500/50 text-amber-200' : 'bg-green-500/20 border-green-500/50 text-green-200'}`}>
              {!isConnected ? <AlertTriangle size={14} /> : <Database size={14} />}
              {!isConnected ? 'SETUP REQUIRED' : 'CONNECTED'}
           </div>
        </div>

        <div className="p-8 space-y-6">
          
          <div>
            <h2 className="text-xl font-bold text-stone-800 mb-2">Connect to Firebase</h2>
            <p className="text-stone-500 text-sm leading-relaxed">
              To use this application, you must connect it to a Firebase project.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-800">
             <strong>Instructions:</strong>
             <ul className="list-disc ml-5 mt-1 space-y-1 text-blue-700">
                <li>Go to <a href="https://console.firebase.google.com" target="_blank" className="underline font-bold" rel="noreferrer">Firebase Console</a>.</li>
                <li>Create a project or select existing one.</li>
                <li>Go to Project Settings (Gear Icon) &gt; General.</li>
                <li>Scroll to "Your apps", select Web (<code>&lt;/&gt;</code>), and copy the <code>const firebaseConfig</code> object.</li>
             </ul>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3 text-red-700 animate-fade-in">
               <XCircle className="shrink-0 mt-0.5" size={18} />
               <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <div>
             <label className="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide">Configuration JSON</label>
             <textarea 
               rows={10}
               className="w-full bg-stone-900 text-green-400 font-mono text-xs p-4 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
               placeholder={`{
  "apiKey": "AIzaSy...",
  "authDomain": "...",
  "projectId": "...",
  "storageBucket": "...",
  "messagingSenderId": "...",
  "appId": "..."
}`}
               value={configJson}
               onChange={(e) => setConfigJson(e.target.value)}
             />
          </div>

          <div className="flex gap-4 pt-4 border-t border-stone-100">
             <button 
               onClick={handleSave}
               className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all"
             >
               <Save size={18} /> Save & Connect
             </button>
             
             <button 
                 onClick={handleReset}
                 className="px-6 bg-stone-100 hover:bg-stone-200 text-stone-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors border border-stone-200"
                 title="Clear configuration"
               >
                 <Trash2 size={18} /> Reset
               </button>
          </div>
          
          <div className="text-center">
               <button onClick={() => window.location.reload()} className="text-xs text-stone-400 hover:text-stone-600 flex items-center justify-center gap-1 mx-auto">
                  <RefreshCcw size={10} /> Force Reload
               </button>
          </div>

          {localStorage.getItem('cwtnas_firebase_config') && (
             <div className="flex items-center justify-center gap-2 text-green-600 font-bold text-sm bg-green-50 p-3 rounded-lg border border-green-100">
                <CheckCircle size={16} />
                <span>Configuration Loaded from Local Storage</span>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default FirebaseSetup;