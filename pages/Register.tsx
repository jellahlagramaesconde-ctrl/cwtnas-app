import React, { useState } from 'react';
import { Mail, Lock, User, MapPin, ArrowLeft, Loader2, Truck, Home, ShieldCheck, Hash, AlertTriangle, Send, Settings, RefreshCcw } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import firebase from 'firebase/compat/app';
import { auth, firestore } from '../services/firebase';
import { UserRole } from '../types';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>(UserRole.RESIDENT);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [zone, setZone] = useState('');
  const [adminCode, setAdminCode] = useState(''); 
  const [vehicleType, setVehicleType] = useState('');
  const [plateNumber, setPlateNumber] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);

  const getTheme = () => {
    if (role === UserRole.ADMIN) {
        return {
            headerBg: 'bg-amber-400',
            iconColor: 'text-amber-700',
            button: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200',
            highlight: 'text-amber-600',
            ring: 'focus:ring-amber-400',
            subtle: 'bg-amber-50'
        };
    }
    if (role === UserRole.DRIVER) {
        return {
            headerBg: 'bg-blue-400',
            iconColor: 'text-blue-700',
            button: 'bg-blue-500 hover:bg-blue-600 shadow-blue-200',
            highlight: 'text-blue-600',
            ring: 'focus:ring-blue-400',
            subtle: 'bg-blue-50'
        };
    }
    return {
        headerBg: 'bg-[#77DD77]',
        iconColor: 'text-[#3D5E34]',
        button: 'bg-[#77DD77] hover:bg-[#5FB35F] shadow-[#77DD77]/30',
        highlight: 'text-[#77DD77]',
        ring: 'focus:ring-[#77DD77]',
        subtle: 'bg-[#F1F8E8]'
    };
  };

  const theme = getTheme();

  const getIcon = () => {
    if (role === UserRole.ADMIN) return <ShieldCheck size={24} className="text-white" />;
    if (role === UserRole.DRIVER) return <Truck size={24} className="text-white" />;
    return <User size={24} className="text-white" />;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (role === UserRole.ADMIN && adminCode !== 'admin123') {
      setError("Invalid Admin Secret Code. You are not authorized.");
      return;
    }

    if (role === UserRole.DRIVER) {
      if (!vehicleType.trim()) {
        setError("Vehicle Type is required for drivers.");
        return;
      }
      if (!plateNumber.trim()) {
        setError("Plate Number is required for drivers.");
        return;
      }
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
        if (!auth) throw new Error("Connection failed. Please try again later.");

        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        if (user) {
            await user.updateProfile({ displayName: name });

            await firestore.collection("users").doc(user.uid).set({
              uid: user.uid,
              name: name,
              email: email,
              role: role,
              zone: role === UserRole.RESIDENT ? zone : null,
              plateNumber: role === UserRole.DRIVER ? plateNumber : null,
              vehicleType: role === UserRole.DRIVER ? vehicleType : null,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            await user.sendEmailVerification();
            await auth.signOut();
            setIsVerificationSent(true);
        }
      
    } catch (err: any) {
      console.error("Registration Error:", err);
      if (err.code === 'auth/email-already-in-use') {
         setError('This email is already registered. Please try logging in.');
      } else if (err.code === 'auth/weak-password') {
         setError('Your password is too weak. Please use a stronger one.');
      } else {
          setError(`Registration failed. Please try again or check your details.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerificationSent) {
    return (
      <div className="min-h-screen bg-[#F9FCFA] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-[2rem] shadow-soft overflow-hidden p-8 text-center border border-white">
          <div className="w-16 h-16 bg-[#F1F8E8] rounded-full flex items-center justify-center mx-auto mb-6 text-[#77DD77]">
             <Send size={32} />
          </div>
          
          <h2 className="text-2xl font-bold text-[#4F7942] mb-4">
            Verify your email
          </h2>
          
          <div className="bg-[#F1F8E8] border border-[#E2F2D5] rounded-xl p-4 mb-6">
            <p className="text-[#4F7942] leading-relaxed text-sm">
              We have sent a verification email to <span className="font-bold">{email}</span>.
            </p>
            <p className="text-sm text-gray-500 mt-2 font-medium">
              Please check your inbox (and Spam folder), verify your account, and then log in.
            </p>
          </div>

          <Link 
            to="/login" 
            className="w-full block py-4 bg-[#77DD77] text-white font-bold rounded-xl hover:bg-[#5FB35F] transition-colors shadow-lg shadow-[#77DD77]/30"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FCFA] flex flex-col items-center justify-center p-4">
      <div className={`absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-3xl opacity-30 pointer-events-none ${theme.subtle}`}></div>

      <div className="w-full max-w-md bg-white/90 backdrop-blur rounded-[2.5rem] shadow-soft overflow-hidden my-8 relative z-10 border border-white">
        <div className={`${theme.headerBg} p-8 flex items-center justify-between transition-colors duration-500`}>
           <div className="flex items-center gap-3">
              <button onClick={() => navigate('/login')} className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-colors">
                <ArrowLeft size={20} />
              </button>
              <div className="font-extrabold text-lg tracking-wide text-white">CWTNAS</div>
           </div>
           <div className="bg-white/20 p-3 rounded-2xl shadow-inner">
             {getIcon()}
           </div>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#4F7942]">Create Account</h2>
              <p className="text-slate-400 text-sm mt-1 font-medium">
                  {role === UserRole.DRIVER ? 'Register as a Service Driver' : 
                   role === UserRole.ADMIN ? 'Register as an Official' : 
                   'Join the community as a Resident'}
              </p>
          </div>

          {error && (
            <div className={`p-4 rounded-2xl text-sm mb-6 text-center border flex flex-col items-center gap-2 bg-red-50 text-red-600 border-red-100 animate-fade-in shadow-sm`}>
              <div className="flex items-center gap-2 font-bold justify-center">
                 <AlertTriangle size={16} />
                 <span>Something went wrong</span>
              </div>
              <span className="block">{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 ml-1 uppercase tracking-wide">Account Type</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     {role === UserRole.ADMIN ? <ShieldCheck className="h-5 w-5 text-amber-400" /> :
                      role === UserRole.DRIVER ? <Truck className="h-5 w-5 text-blue-400" /> : 
                      <Home className="h-5 w-5 text-[#77DD77]" />}
                  </div>
                  <select
                    className={`block w-full pl-10 pr-3 py-3.5 border border-slate-200 rounded-xl focus:ring-2 ${theme.ring} focus:border-transparent transition-all bg-slate-50 focus:bg-white text-slate-600 appearance-none font-medium`}
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                  >
                    <option value={UserRole.RESIDENT}>Resident</option>
                    <option value={UserRole.DRIVER}>Driver</option>
                    <option value={UserRole.ADMIN}>Barangay Official (Admin)</option>
                  </select>
                </div>
              </div>

              {role === UserRole.ADMIN && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold text-slate-400 mb-2 ml-1 uppercase tracking-wide">Admin Code</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      className={`block w-full pl-10 pr-3 py-3.5 border border-slate-200 rounded-xl focus:ring-2 ${theme.ring} focus:border-transparent transition-all bg-slate-50 focus:bg-white font-medium`}
                      placeholder="Enter Admin Code"
                      value={adminCode}
                      onChange={(e) => setAdminCode(e.target.value)}
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 ml-1 uppercase tracking-wide">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    className={`block w-full pl-10 pr-3 py-3.5 border border-slate-200 rounded-xl focus:ring-2 ${theme.ring} focus:border-transparent transition-all bg-slate-50 focus:bg-white font-medium`}
                    placeholder="e.g. James R. Diaz"
                    value={name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setName(val.replace(/\b\w/g, char => char.toUpperCase()));
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 ml-1 uppercase tracking-wide">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    className={`block w-full pl-10 pr-3 py-3.5 border border-slate-200 rounded-xl focus:ring-2 ${theme.ring} focus:border-transparent transition-all bg-slate-50 focus:bg-white font-medium`}
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {role !== UserRole.ADMIN && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 ml-1 uppercase tracking-wide">
                    {role === UserRole.DRIVER ? 'Assigned Route/Zone' : 'Barangay Zone'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-slate-400" />
                    </div>
                    <select
                      required
                      className={`block w-full pl-10 pr-3 py-3.5 border border-slate-200 rounded-xl focus:ring-2 ${theme.ring} focus:border-transparent transition-all bg-slate-50 focus:bg-white text-slate-600 appearance-none font-medium`}
                      value={zone}
                      onChange={(e) => setZone(e.target.value)}
                    >
                      <option value="" disabled>Select Zone</option>
                      <option value="Zone 1A">Zone 1A</option>
                      <option value="Zone 1B">Zone 1B</option>
                      <option value="Zone 2A">Zone 2A</option>
                      <option value="Zone 2B">Zone 2B</option>
                      <option value="Zone 3">Zone 3</option>
                    </select>
                  </div>
                </div>
              )}

              {role === UserRole.DRIVER && (
                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 ml-1 uppercase tracking-wide">Vehicle Type</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Truck className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required
                        className={`block w-full pl-10 pr-2 py-3.5 border border-slate-200 rounded-xl focus:ring-2 ${theme.ring} focus:border-transparent transition-all bg-slate-50 focus:bg-white text-sm font-medium`}
                        placeholder="Garbage Truck"
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 ml-1 uppercase tracking-wide">Plate Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Hash className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required
                        className={`block w-full pl-10 pr-2 py-3.5 border border-slate-200 rounded-xl focus:ring-2 ${theme.ring} focus:border-transparent transition-all bg-slate-50 focus:bg-white text-sm font-medium`}
                        placeholder="ABC-1234"
                        value={plateNumber}
                        onChange={(e) => setPlateNumber(e.target.value)}
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 ml-1 uppercase tracking-wide">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    className={`block w-full pl-10 pr-3 py-3.5 border border-slate-200 rounded-xl focus:ring-2 ${theme.ring} focus:border-transparent transition-all bg-slate-50 focus:bg-white font-medium`}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 ml-1 uppercase tracking-wide">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    className={`block w-full pl-10 pr-3 py-3.5 border border-slate-200 rounded-xl focus:ring-2 ${theme.ring} focus:border-transparent transition-all bg-slate-50 focus:bg-white font-medium`}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none
                ${theme.button}`}
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Register Account"}
            </button>

            <div className="text-center mt-4 pt-4 border-t border-slate-100">
              <span className="text-sm text-slate-400 font-medium">Already have an account? </span>
              <Link to="/login" className={`text-sm font-bold hover:underline ${theme.highlight}`}>
                Log in
              </Link>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default Register;