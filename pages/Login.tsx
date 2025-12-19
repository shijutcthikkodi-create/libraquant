
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Lock, Phone, Scale, Smartphone, ShieldBan, Loader2 } from 'lucide-react';
import { fetchSheetData } from '../services/googleSheetsService';

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
        storedId = Math.random().toString(36).substring(2, 15);
        localStorage.setItem('libra_client_device_id', storedId);
    }
    setDeviceId(storedId);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
        setError('Enter a valid 10-digit number.');
        return;
    }
    if (!password) {
        setError('Password is required.');
        return;
    }

    setLoading(true);
    setError('');

    try {
        // Fetch latest user list from Google Sheet for validation
        const data = await fetchSheetData();
        const users = data?.users || [];
        
        // Check for Admin (Password ends with 'admin')
        const isAdmin = password.toLowerCase().endsWith('admin');
        
        // Find user in sheet
        const sheetUser = users.find((u: any) => String(u.phoneNumber) === phone);

        if (!sheetUser && !isAdmin) {
            setError('Access Denied. Contact Admin for activation.');
            setLoading(false);
            return;
        }

        // Simple validation: Password matches phone in sheet (or admin override)
        if (!isAdmin && sheetUser && password !== String(sheetUser.password)) {
            setError('Invalid credentials.');
            setLoading(false);
            return;
        }

        // Anti-Sharing Device Lock
        const accountBoundDeviceKey = `libra_bound_device_${phone}`;
        const registeredDeviceId = localStorage.getItem(accountBoundDeviceKey);
        if (registeredDeviceId && registeredDeviceId !== deviceId && !isAdmin) {
            setError('Account locked to another device.');
            setLoading(false);
            return;
        }
        if (!registeredDeviceId) localStorage.setItem(accountBoundDeviceKey, deviceId);

        onLogin({
            id: sheetUser?.id || `ADM-${phone.slice(-4)}`,
            phoneNumber: phone,
            name: isAdmin ? 'Administrator' : (sheetUser?.name || 'Premium Client'),
            expiryDate: sheetUser?.expiryDate || '2025-12-31',
            isAdmin: isAdmin
        });
    } catch (err) {
        setError('Server busy. Try again later.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                    <Scale size={32} strokeWidth={2} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">LibraQuant</h1>
                <p className="text-slate-400 text-sm mt-1">Institutional Signal Terminal</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-widest">Mobile Number</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-3 text-slate-500" size={18} />
                        <input 
                            type="tel" 
                            maxLength={10}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                            placeholder="9876543210"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-widest">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                        />
                    </div>
                </div>

                {error && (
                    <div className="bg-red-900/20 border border-red-500/20 rounded p-3 flex items-start space-x-2 animate-in fade-in zoom-in-95">
                        <ShieldBan size={16} className="text-red-400 mt-0.5 shrink-0" />
                        <span className="text-red-400 text-xs font-medium">{error}</span>
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-blue-900/40 disabled:opacity-50 flex items-center justify-center"
                >
                    {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                    {loading ? 'Verifying...' : 'Access Terminal'}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-[10px] text-slate-500 font-mono">
                    Session valid for 6.5 hours. Multi-device access prohibited.
                </p>
            </div>
        </div>
        <div className="bg-slate-950 p-4 text-center border-t border-slate-800">
            <div className="flex items-center justify-center text-[10px] text-slate-600 font-mono">
                <Smartphone size={10} className="mr-1" />
                <span>UID: {deviceId}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
