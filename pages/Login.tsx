import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { MOCK_USER } from '../constants';
import { Lock, Phone, Scale, Smartphone, ShieldBan } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deviceId, setDeviceId] = useState('');

  // Generate or retrieve a unique device ID for this browser
  useEffect(() => {
    let storedId = localStorage.getItem('libra_client_device_id');
    if (!storedId) {
        storedId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('libra_client_device_id', storedId);
    }
    setDeviceId(storedId);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate Server Latency
    setTimeout(() => {
        // 1. Validate Credentials
        if (phone === '9876543210' && password === 'admin') {
            
            // --- SECURITY LAYER 1: Account Device Lock ---
            // Check if this Mobile Number is already bound to a DIFFERENT Device ID
            const accountBoundDeviceKey = `libra_bound_device_${phone}`;
            const registeredDeviceId = localStorage.getItem(accountBoundDeviceKey);

            if (registeredDeviceId && registeredDeviceId !== deviceId) {
                setError('Security Alert: This account is locked to another device. You cannot log in from here.');
                setLoading(false);
                return;
            }

            // --- SECURITY LAYER 2: Device User Lock ---
            // Check if this Device is already bound to a DIFFERENT Mobile Number
            // This prevents using one device for multiple accounts (Account Sharing prevention)
            const deviceOwnerKey = 'libra_device_owner_phone';
            const deviceOwnerPhone = localStorage.getItem(deviceOwnerKey);

            if (deviceOwnerPhone && deviceOwnerPhone !== phone) {
                 setError(`Device Locked: This device is registered to user ${deviceOwnerPhone}. Cannot switch accounts.`);
                 setLoading(false);
                 return;
            }

            // --- BINDING (First time setup) ---
            if (!registeredDeviceId) {
                localStorage.setItem(accountBoundDeviceKey, deviceId);
            }
            if (!deviceOwnerPhone) {
                localStorage.setItem(deviceOwnerKey, phone);
            }

            // --- SUBSCRIPTION & EXPIRY ENGINE ---
            // Ensure the 30-day count is persistent and doesn't reset on re-login
            const expiryKey = `libra_user_expiry_${phone}`;
            let storedExpiry = localStorage.getItem(expiryKey);

            if (!storedExpiry) {
                // Initialize 30-day trial for new user
                const now = new Date();
                const future = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 Days
                storedExpiry = future.toISOString().split('T')[0];
                localStorage.setItem(expiryKey, storedExpiry);
            }
            
            // Validate Expiry
            if (new Date(storedExpiry) < new Date()) {
                setError('Subscription Expired. Please contact admin to renew access.');
                setLoading(false);
                return;
            }

            // 3. Set User Session
            onLogin({
                ...MOCK_USER,
                phoneNumber: phone,
                expiryDate: storedExpiry // Use the persistent expiry date
            });
        } else {
            setError('Invalid credentials. Contact Admin for access.');
            setLoading(false);
        }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
                    <Scale size={32} strokeWidth={2} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">LibraQuant</h1>
                <p className="text-slate-400 text-sm mt-1">Institutional Signal Terminal</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Mobile Number</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-3 text-slate-500" size={18} />
                        <input 
                            type="text" 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="9876543210"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-600"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-600"
                        />
                    </div>
                </div>

                {error && (
                    <div className="bg-red-900/20 border border-red-500/20 rounded p-3 flex items-start space-x-2">
                        <ShieldBan size={16} className="text-red-400 mt-0.5 shrink-0" />
                        <span className="text-red-400 text-xs text-left leading-tight font-medium">{error}</span>
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition-all shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Verifying Device...' : 'Secure Login'}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-xs text-slate-500">
                    Use <span className="text-slate-300">9876543210</span> / <span className="text-slate-300">admin</span> for demo.
                </p>
                <div className="mt-2 flex items-center justify-center text-[10px] text-slate-600 font-mono">
                    <Lock size={10} className="mr-1" />
                    <span>Device ID: {deviceId.slice(0, 8)}...</span>
                </div>
            </div>
        </div>
        <div className="bg-slate-950 p-4 text-center border-t border-slate-800">
            <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                <span className="text-emerald-500 font-bold">● Secure Boot:</span> Account is permanently bound to this device ID upon first login to prevent unauthorized sharing.
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;