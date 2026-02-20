import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mail, Lock, ArrowLeft, Truck, Home, User, Loader2, AlertCircle, Send, Settings, Leaf, RefreshCcw } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../services/firebase';
import { UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import firebase from 'firebase/compat/app';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { authError } = useAuth();
  
  const [selectedVisualRole, setSelectedVisualRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [unverifiedUser, setUnverifiedUser] = useState<firebase.User | null>(null);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  useEffect(() => {
    if (authError) setLocalError(authError);
  }, [authError]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setIsSubmitting(true);

    if (!email.trim()) {
      setLocalError("Please enter your email address.");
      setIsSubmitting(false);
      return;
    }
    if (!password) {
      setLocalError("Please enter your password.");
      setIsSubmitting(false);
      return;
    }

    if (selectedVisualRole) localStorage.setItem('temp_login_role', selectedVisualRole);
    if (!auth) {
        setLocalError("Unable to connect to service. Please try again later.");
        setIsSubmitting(false);
        return;
    }

    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      if (user) {
          await user.reload();
          if (!user.emailVerified) {
            setUnverifiedUser(user);
            setIsSubmitting(false);
            return;
          }
      }
    } catch (err: any) {
      console.error("Login Error Details:", err);
      
      if (err.code === 'auth/missing-password') {
        setLocalError("Please enter your password.");
      } else if (['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password', 'auth/invalid-email'].includes(err.code)) {
        setLocalError("Invalid email or password. Please try again.");
      } else if (err.code === 'auth/network-request-failed') {
        setLocalError("Check your internet connection and try again.");
      } else if (err.code === 'auth/too-many-requests') {
        setLocalError("Too many attempts. Please wait a few minutes before trying again.");
      } else {
        setLocalError("Something went wrong. Please check your credentials.");
      }
      setIsSubmitting(false); 
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedUser) return;
    setResendStatus('sending');
    try {
      await unverifiedUser.sendEmailVerification();
      setResendStatus('sent');
    } catch (error) {
      setResendStatus('error');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    try {
      await auth.sendPasswordResetEmail(resetEmail);
      alert("Password reset link sent to your email.");
      setShowForgotModal(false);
    } catch (e) {
      alert("Failed to send reset email. Please check the address.");
    }
  };

  const getRoleTitle = (role: UserRole) => {
    switch (role) {
      case UserRole.RESIDENT: return "Resident Portal";
      case UserRole.DRIVER: return "Driver Access";
      case UserRole.ADMIN: return "Admin Console";
      default: return "Login";
    }
  };

  if (unverifiedUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#F9FCFA]">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#F1F8E8] rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="glass-panel bg-white/80 rounded-[2.5rem] shadow-soft p-10 max-w-md w-full text-center border border-white/50 relative">
           <div className="w-20 h-20 bg-[#F1F8E8] rounded-full flex items-center justify-center mx-auto mb-6 text-[#77DD77] shadow-inner">
              <Send size={36} />
           </div>
           <h2 className="text-3xl font-bold text-[#4F7942] mb-4">Verify Your Email</h2>
           <p className="text-stone-600 mb-8 leading-relaxed">We've sent a verification link to <span className="font-bold text-[#4F7942]">{unverifiedUser.email}</span>.<br/>Please check your inbox.</p>
           
           <button onClick={handleResendVerification} disabled={resendStatus === 'sending'} className="w-full py-4 border-2 border-[#F1F8E8] text-[#4F7942] font-bold rounded-2xl hover:bg-[#F1F8E8] mb-3 transition-colors">
              {resendStatus === 'sending' ? 'Sending...' : 'Resend Email'}
           </button>
           <button onClick={() => { setUnverifiedUser(null); auth.signOut(); }} className="w-full py-4 bg-[#4F7942] text-white font-bold rounded-2xl hover:bg-[#3D5E34] transition-colors shadow-lg">
              Back to Login
           </button>
        </div>
      </div>
    );
  }

  if (!selectedVisualRole) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#F9FCFA]">
         <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-stone-500 hover:text-[#4F7942] font-bold text-sm transition-colors z-20 bg-white/60 px-4 py-2 rounded-full backdrop-blur-sm border border-white shadow-sm">
            <ArrowLeft size={18} /> Back to Home
         </Link>

         <div className="absolute top-[-20%] right-[-10%] w-[700px] h-[700px] bg-[#F1F8E8] rounded-full blur-[100px] pointer-events-none animate-float"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#E2F2D5] rounded-full blur-[100px] pointer-events-none"></div>

         <div className="relative z-10 w-full max-w-5xl">
            <div className="text-center mb-12">
               <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur px-5 py-2 rounded-full border border-[#F1F8E8] shadow-sm mb-6">
                  <div className={`w-2 h-2 rounded-full ${auth ? 'bg-[#77DD77]' : 'bg-red-400'} animate-pulse`}></div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#4F7942]">{auth ? 'System Online' : 'Service Connection Alert'}</span>
               </div>
               
               <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="bg-[#F1F8E8] p-3 rounded-2xl text-[#77DD77]">
                    <Leaf size={32} />
                  </div>
                  <h1 className="text-5xl md:text-7xl font-extrabold text-[#4F7942] tracking-tight drop-shadow-sm">CWTNAS</h1>
               </div>
               <p className="text-xl text-stone-500 max-w-2xl mx-auto font-medium">Community Waste Tracking & Neighboring Alert System</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 px-4">
               {[
                 { role: UserRole.RESIDENT, label: 'Resident', icon: Home, desc: 'Report issues & view schedule', color: 'text-[#77DD77]', bg: 'hover:border-[#77DD77]/30 hover:shadow-glow' },
                 { role: UserRole.DRIVER, label: 'Driver', icon: Truck, desc: 'Manage routes & updates', color: 'text-blue-500', bg: 'hover:border-blue-200 hover:shadow-blue-100' },
                 { role: UserRole.ADMIN, label: 'Official', icon: ShieldCheck, desc: 'Admin dashboard access', color: 'text-amber-500', bg: 'hover:border-amber-200 hover:shadow-amber-100' }
               ].map((item) => (
                 <button 
                   key={item.role}
                   onClick={() => setSelectedVisualRole(item.role)}
                   className={`glass-panel bg-white/80 rounded-[2rem] p-8 text-left transition-all duration-300 hover:-translate-y-2 group border border-transparent ${item.bg}`}
                 >
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-soft group-hover:scale-110 transition-transform">
                       <item.icon size={32} className={`transition-colors ${item.color}`} />
                    </div>
                    <h3 className="text-2xl font-bold text-stone-800 mb-2">{item.label}</h3>
                    <p className="text-stone-500 text-sm font-medium">{item.desc}</p>
                 </button>
               ))}
            </div>

            <div className="text-center mt-12">
               <p className="text-stone-400 text-sm font-medium">Don't have an account yet?</p>
               <Link to="/register" className="inline-block mt-2 font-bold text-[#77DD77] hover:text-[#5FB35F] hover:underline">Register Now</Link>
            </div>
         </div>
         
         <div className="absolute bottom-4 right-4 z-20">
             <Link to="/setup" className="flex items-center gap-2 text-xs font-bold text-stone-300 hover:text-stone-500 bg-white/50 px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors">
               <Settings size={12} />
               <span>Settings</span>
             </Link>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#F9FCFA]">
      
      <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-[#F1F8E8]/50 to-transparent pointer-events-none"></div>
      <div className="absolute -left-20 top-20 w-96 h-96 bg-[#E2F2D5] rounded-full blur-[80px] opacity-60"></div>

      <div className="glass-panel w-full max-w-md bg-white/90 rounded-[2.5rem] shadow-soft overflow-hidden relative z-10 border border-white">
         
         <div className="p-8 pb-6">
            <button 
              onClick={() => { setSelectedVisualRole(null); setLocalError(''); }}
              className="flex items-center gap-2 text-stone-400 hover:text-stone-600 text-sm font-bold mb-6 transition-colors group"
            >
               <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back
            </button>
            
            <h2 className="text-3xl font-extrabold text-[#4F7942]">{getRoleTitle(selectedVisualRole)}</h2>
            <p className="text-stone-500 mt-2 font-medium">Sign in to continue</p>
         </div>

         <div className="p-8 pt-0">
            {localError && (
               <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium mb-6 flex flex-col items-start gap-2 border border-red-100 animate-fade-in shadow-sm">
                  <div className="flex items-center gap-3">
                    <AlertCircle size={20} className="shrink-0 text-red-500" />
                    <span>{localError}</span>
                  </div>
               </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
               <div>
                  <label className="block text-xs font-bold text-stone-400 mb-1.5 ml-1 uppercase tracking-wider">Email Address</label>
                  <div className="relative group">
                     <Mail className="absolute left-4 top-3.5 text-stone-400 group-focus-within:text-[#77DD77] transition-colors" size={20} />
                     <input 
                        type="email" 
                        required={!auth}
                        disabled={!auth}
                        className="w-full bg-[#F9FCFA] border border-stone-200 text-stone-800 text-sm rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#77DD77] focus:bg-white transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                     />
                  </div>
               </div>

               <div>
                  <div className="flex justify-between items-center mb-1.5 ml-1">
                     <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider">Password</label>
                     <button type="button" disabled={!auth} onClick={() => setShowForgotModal(true)} className="text-xs font-bold text-[#77DD77] hover:text-[#5FB35F] disabled:opacity-50">Forgot?</button>
                  </div>
                  <div className="relative group">
                     <Lock className="absolute left-4 top-3.5 text-stone-400 group-focus-within:text-[#77DD77] transition-colors" size={20} />
                     <input 
                        type="password" 
                        required={!auth}
                        disabled={!auth}
                        className="w-full bg-[#F9FCFA] border border-stone-200 text-stone-800 text-sm rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#77DD77] focus:bg-white transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                     />
                  </div>
               </div>

               <button 
                  type="submit" 
                  disabled={isSubmitting || !auth}
                  className="w-full bg-[#77DD77] hover:bg-[#5FB35F] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#77DD77]/30 transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
               >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Sign In"}
               </button>
            </form>

            <div className="mt-8 pt-6 border-t border-stone-100 text-center">
               <p className="text-stone-400 text-sm font-medium">Don't have an account?</p>
               <Link to="/register" className="inline-block mt-2 font-bold text-[#77DD77] hover:text-[#5FB35F] hover:underline">Create Account</Link>
            </div>
         </div>
      </div>
      
      {showForgotModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <h3 className="font-bold text-lg mb-2 text-[#4F7942]">Reset Password</h3>
              <p className="text-sm text-gray-500 mb-4">Enter your email to receive a reset link.</p>
              <form onSubmit={handleForgotPassword}>
                 <input 
                   type="email" 
                   required
                   className="w-full border border-slate-200 p-3 rounded-xl mb-4 text-sm focus:ring-2 focus:ring-[#77DD77] outline-none"
                   placeholder="Enter your email"
                   value={resetEmail}
                   onChange={e => setResetEmail(e.target.value)}
                 />
                 <div className="flex gap-2">
                    <button type="button" onClick={() => setShowForgotModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl text-sm font-bold text-gray-600">Cancel</button>
                    <button type="submit" className="flex-1 py-3 bg-[#77DD77] text-white rounded-xl text-sm font-bold">Send Link</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Login;