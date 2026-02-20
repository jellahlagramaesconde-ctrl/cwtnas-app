import React, { useState } from 'react';
import { Trash2, Lightbulb, AlertTriangle, Droplets, HelpCircle, MapPin, Camera, Loader2, Send, CalendarX, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PriorityLevel, ReportStatus } from '../types';
import firebase from 'firebase/compat/app';
import { firestore, storage } from '../services/firebase';

const ReportIssue: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [category, setCategory] = useState<string>('Waste');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>(PriorityLevel.LOW);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSubmitting(true);
    setError('');
    setUploadProgress(0);

    try {
      let imageUrl = null;

      // 1. Upload Image if exists
      if (file && storage) {
         const filename = `${Date.now()}_${file.name}`;
         const storageRef = storage.ref().child(`reports/${currentUser.id}/${filename}`);
         
         // Upload task
         const uploadTask = storageRef.put(file);
         
         await new Promise<void>((resolve, reject) => {
             uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                },
                (error) => reject(error),
                () => resolve()
             );
         });

         imageUrl = await storageRef.getDownloadURL();
      }

      // 2. Prepare Data
      const reportData = {
        title,
        category,
        description,
        location,
        priority,
        status: ReportStatus.PENDING,
        dateReported: new Date().toLocaleDateString(), 
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        reporterId: currentUser.id,
        reporterName: currentUser.name,
        imageUrl: imageUrl // Now contains the actual Firebase Storage URL
      };

      // 3. Save to Firestore
      const docRef = await firestore.collection('reports').add(reportData);
      console.log("Report written with ID: ", docRef.id);
      
      alert('Report submitted successfully!');
      navigate('/resident/dashboard');

    } catch (err: any) {
      console.error("Error submitting report:", err);
      if (err.code === 'storage/unauthorized') {
          setError("Upload Failed: Permission denied. Check Firebase Storage Rules.");
      } else {
          setError(`Failed to submit report: ${err.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { id: 'Missed Collection', icon: CalendarX, label: 'Missed Pickup' },
    { id: 'Waste', icon: Trash2, label: 'Waste' },
    { id: 'Streetlight', icon: Lightbulb, label: 'Streetlight' },
    { id: 'Road', icon: AlertTriangle, label: 'Road' },
    { id: 'Drainage', icon: Droplets, label: 'Drainage' },
    { id: 'Other', icon: HelpCircle, label: 'Other' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-stone-800">Report an Issue</h1>
        <p className="text-stone-500 text-sm mt-1">Help improve our community by reporting issues like missed collections or broken streetlights</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl shadow-stone-200/50 p-6 md:p-8 space-y-8 border border-white/60">
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 flex items-center gap-2">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {/* Category Selection */}
        <div>
          <label className="block text-xs font-bold text-stone-500 mb-4 uppercase tracking-wider">Issue Category *</label>
          <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200
                  ${category === cat.id 
                    ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700 ring-2 ring-emerald-200 shadow-sm transform scale-105' 
                    : 'border-gray-100 hover:border-emerald-200 hover:bg-stone-50 text-stone-600'}`}
              >
                <cat.icon size={24} className="mb-2" />
                <span className="text-xs font-medium text-center leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Issue Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-stone-800 border-b border-stone-100 pb-2">Issue Details</h3>
          
          <div>
            <label className="block text-xs font-bold text-stone-500 mb-1 uppercase tracking-wider">Issue Title *</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border-gray-200 border p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-stone-50 focus:bg-white transition-all outline-none"
              placeholder="e.g. Garbage not collected today / Broken light at corner"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-500 mb-1 uppercase tracking-wider">Detailed Description *</label>
            <textarea 
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border-gray-200 border p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-stone-50 focus:bg-white transition-all outline-none resize-none"
              placeholder="Provide detailed information about the issue..."
            />
          </div>
        </div>

        {/* Location */}
        <div>
           <label className="block text-xs font-bold text-stone-500 mb-1 uppercase tracking-wider">Location *</label>
           <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <input 
                type="text" 
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-10 rounded-xl border-gray-200 border p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-stone-50 focus:bg-white transition-all outline-none"
                placeholder="Street address or landmark"
              />
           </div>
        </div>

        {/* Priority */}
        <div>
           <label className="block text-xs font-bold text-stone-500 mb-1 uppercase tracking-wider">Priority Level</label>
           <div className="relative">
             <select 
               value={priority}
               onChange={(e) => setPriority(e.target.value as PriorityLevel)}
               className="w-full rounded-xl border-gray-200 border p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-stone-50 focus:bg-white transition-all outline-none appearance-none"
             >
               <option value={PriorityLevel.LOW}>Low - Can wait for scheduled maintenance</option>
               <option value={PriorityLevel.MEDIUM}>Medium - Should be addressed soon</option>
               <option value={PriorityLevel.HIGH}>High - Requires immediate attention</option>
             </select>
             <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
               <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
             </div>
           </div>
        </div>

        {/* Photo Upload */}
        <div>
           <label className="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wider">Upload Photo (Optional)</label>
           
           {previewUrl ? (
             <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
               <img src={previewUrl} alt="Preview" className="w-full h-64 object-cover" />
               <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    type="button" 
                    onClick={removeFile}
                    className="bg-white text-red-500 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-red-50"
                  >
                    <X size={16} /> Remove Photo
                  </button>
               </div>
             </div>
           ) : (
             <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center bg-stone-50 hover:bg-stone-100 hover:border-emerald-400 transition-all cursor-pointer relative group">
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                   <Camera className="h-6 w-6 text-stone-400 group-hover:text-emerald-500" />
                </div>
                <p className="text-sm text-stone-500 font-medium">Click to upload photo</p>
                <p className="text-xs text-stone-400 mt-1">PNG, JPG up to 10MB</p>
             </div>
           )}
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:from-emerald-700 hover:to-teal-700 transition-all transform hover:-translate-y-1 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden"
          >
            {isSubmitting ? (
              <>
                 <Loader2 className="animate-spin" /> 
                 {uploadProgress > 0 && uploadProgress < 100 
                    ? `Uploading Image ${Math.round(uploadProgress)}%` 
                    : "Submitting..."}
              </>
            ) : (
              <><Send size={18} /> Submit Report</>
            )}
            
            {/* Progress Bar Background */}
            {isSubmitting && uploadProgress > 0 && (
               <div 
                 className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-300" 
                 style={{ width: `${uploadProgress}%` }}
               />
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default ReportIssue;