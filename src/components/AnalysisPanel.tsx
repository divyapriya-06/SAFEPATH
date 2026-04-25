import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  TrafficCone, 
  CloudRain, 
  Moon, 
  Users, 
  X,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { SafetyMetrics } from '../types';

interface AnalysisPanelProps {
  metrics: SafetyMetrics;
  theme: 'light' | 'dark';
  onClose: () => void;
  onStart: () => void;
}

export default function AnalysisPanel({ metrics, theme, onClose, onStart }: AnalysisPanelProps) {
  const getSafetyLevel = (score: number) => {
    if (score > 80) return { label: 'Extremely Safe', color: 'text-green-400', bg: 'bg-green-500/20' };
    if (score > 60) return { label: 'Generally Safe', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    return { label: 'Caution Required', color: 'text-amber-400', bg: 'bg-amber-500/20' };
  };

  const level = getSafetyLevel(metrics.overallScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.95 }}
      className={`${theme === 'dark' ? 'glass-dark text-white border-white/10' : 'bg-white text-slate-900 border-slate-200'} border rounded-[32px] p-6 shadow-2xl overflow-hidden relative`}
    >
      <div className="absolute top-0 right-0 p-4">
        <button onClick={onClose} className={`p-2 ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-100'} rounded-full transition-colors`}>
          <X className={`w-5 h-5 ${theme === 'dark' ? 'opacity-50' : 'text-slate-400'}`} />
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className={`p-4 rounded-3xl ${level.bg}`}>
          <ShieldCheck className={`w-10 h-10 ${level.color}`} />
        </div>
        <div>
          <h2 className="text-3xl font-bold">{metrics.overallScore}</h2>
          <p className={`font-semibold ${level.color}`}>{level.label}</p>
        </div>
        <div className="ml-auto bg-neon-accent/10 px-3 py-1 rounded-full text-xs font-bold text-neon-accent flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          +2% Stability
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <MetricCard icon={<AlertTriangle className="text-red-400" />} label="Crime Risk" value={100 - metrics.crimeScore} type="inverse" theme={theme} />
        <MetricCard icon={<TrafficCone className="text-amber-400" />} label="Traffic" value={metrics.trafficScore} theme={theme} />
        <MetricCard icon={<CloudRain className="text-blue-400" />} label="Weather" value={metrics.weatherScore} theme={theme} />
        <MetricCard icon={<Moon className="text-purple-400" />} label="Lighting" value={metrics.lightingScore} theme={theme} />
      </div>

      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStart}
          className={`flex-1 ${theme === 'dark' ? 'bg-white text-neon-purple' : 'bg-neon-purple text-white shadow-neon-purple/20'} py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg`}
        >
          Check Safe Routes
        </motion.button>
      </div>
    </motion.div>
  );
}

function MetricCard({ icon, label, value, type = 'normal', theme }: any) {
  const getProgressColor = (val: number) => {
    if (type === 'inverse') {
       return val > 70 ? 'bg-red-500' : val > 40 ? 'bg-amber-500' : 'bg-green-500';
    }
    return val > 70 ? 'bg-green-500' : val > 40 ? 'bg-amber-500' : 'bg-red-500';
  };

  return (
    <div className={`${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'} rounded-2xl p-4 border`}>
      <div className={`flex items-center gap-2 mb-2 ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-lg font-bold">{value}</span>
        <span className={`text-xs ${theme === 'dark' ? 'opacity-40' : 'text-slate-400'}`}>/ 100</span>
      </div>
      <div className={`h-1.5 w-full ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'} rounded-full overflow-hidden`}>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full ${getProgressColor(value)}`}
        />
      </div>
    </div>
  );
}
