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
    if (phone.length < 10) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
    }
    if (!password) {
        setError('Password is required.');
        return;
    }

    setLoading(true);
    setError('');

    setTimeout(() => {
        // SECURITY LOGIC: Admin check via password suffix
        const isAdmin = password.toLowerCase().endsWith('admin');
        
        // Account Device Lock Check
        const accountBoundDeviceKey = `libra_bound_device_${phone}`;
        const registeredDeviceId = localStorage.getItem(accountBoundDeviceKey);

        if (registeredDeviceId && registeredDeviceId !== deviceId) {
            setError('Security Alert: This account is locked to another device.');
            setLoading(false);
            return;
        }

        // Device User Lock (Anti-Sharing)
        const deviceOwnerKey = 'libra_device_owner_phone';
        const deviceOwnerPhone = localStorage.getItem(deviceOwnerKey);

        if (deviceOwnerPhone && deviceOwnerPhone !== phone) {
             setError(`Device Locked: Registered to user ${deviceOwnerPhone}.`);
             setLoading(false);
             return;
        }

        // Subscription Engine
        const expiryKey = `libra_user_expiry_${phone}`;
        let storedExpiry = localStorage.getItem(expiryKey);
        if (!storedExpiry) {
            const future = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000));
            storedExpiry = future.toISOString().split('T')[0];
            localStorage.setItem(expiryKey, storedExpiry);
        }
        
        if (new Date(storedExpiry) < new Date() && !isAdmin) {
            setError('Subscription Expired. Contact Admin.');
            setLoading(false);
            return;
        }

        // Binding
        if (!registeredDeviceId) localStorage.setItem(accountBoundDeviceKey, deviceId);
        if (!deviceOwnerPhone) localStorage.setItem(deviceOwnerKey, phone);

        onLogin({
            id: `USR-${phone.slice(-4)}`,
            phoneNumber: phone,
            name: isAdmin ? 'System Administrator' : 'Premium Client',
            expiryDate: storedExpiry,
            isAdmin: isAdmin
        });
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
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
                            type="tel" 
                            maxLength={10}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                            placeholder="9876543210"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-600"
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
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-600"
                        />
                    </div>
                </div>

                {error && (
                    <div className="bg-red-900/20 border border-red-500/20 rounded p-3 flex items-start space-x-2">
                        <ShieldBan size={16} className="text-red-400 mt-0.5 shrink-0" />
                        <span className="text-red-400 text-xs font-medium">{error}</span>
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition-all shadow-lg shadow-blue-900/30 disabled:opacity-50"
                >
                    {loading ? 'Authenticating...' : 'Secure Login'}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-[10px] text-slate-500 font-mono">
                    <span className="text-slate-400">Admin Tip:</span> Password must end with <span className="text-blue-400">"admin"</span> for terminal access.
                </p>
            </div>
        </div>
        <div className="bg-slate-950 p-4 text-center border-t border-slate-800">
            <div className="flex items-center justify-center text-[10px] text-slate-600 font-mono">
                <Smartphone size={10} className="mr-1" />
                <span>Device ID: {deviceId.slice(0, 12)}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;