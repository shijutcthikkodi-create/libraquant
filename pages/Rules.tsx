import React from 'react';
import { AlertTriangle, CheckCircle, Shield } from 'lucide-react';

const Rules: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <Shield size={48} className="mx-auto text-blue-500 mb-4" />
        <h2 className="text-3xl font-bold text-white">Compliance & Rules</h2>
        <p className="text-slate-400 mt-2">Strict adherence to risk management is mandatory.</p>
      </div>

      <div className="bg-rose-900/10 border border-rose-500/20 rounded-xl p-6">
        <div className="flex items-start space-x-4">
            <AlertTriangle className="text-rose-500 shrink-0 mt-1" />
            <div>
                <h3 className="text-lg font-bold text-rose-400 mb-2">Important Risk Disclaimer</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                    Trading in Options involves high risk. You may lose your entire capital. 
                    The signals provided here are based on technical analysis and do not guarantee profits.
                    Past performance is not indicative of future results. We are not responsible for any financial losses.
                </p>
            </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
        <h3 className="text-xl font-bold text-white mb-6">Group Rules</h3>
        <ul className="space-y-4">
            {[
                "Strict Stop Loss MUST be maintained for every trade.",
                "Do not over-leverage. Use max 2% risk per trade.",
                "Sharing screenshots outside the app is prohibited (Watermarked).",
                "Admin decisions on trade status (Active/Exit) are final.",
                "Abusive language towards staff results in immediate ban without refund."
            ].map((rule, idx) => (
                <li key={idx} className="flex items-center text-slate-300">
                    <CheckCircle size={16} className="text-emerald-500 mr-3 shrink-0" />
                    {rule}
                </li>
            ))}
        </ul>
      </div>

      <div className="text-center text-xs text-slate-600 font-mono">
        AlphaQuant Options Services • SEBI Reg: INA0000XXXXX
      </div>
    </div>
  );
};

export default Rules;
