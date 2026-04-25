import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Ruler, Clock, ChevronRight } from 'lucide-react';

interface RouteOption {
  id: string;
  type: 'Safest' | 'Fastest' | 'Shortest';
  score: number;
  duration: string;
  distance: string;
  active: boolean;
  icon: React.ReactNode;
  path: [number, number][];
}

export default function NavigationPanel({ destination, metrics, theme, onStart, onCancel, onSelectRoute, selectedRouteId }: any) {
  const routes: RouteOption[] = [
    { 
      id: '1', 
      type: 'Safest', 
      score: 98, 
      duration: '12m', 
      distance: '3.2km', 
      active: selectedRouteId === '1', 
      icon: <Shield className="text-green-500" />,
      path: [] // Calculated in MapScreen
    },
    { 
      id: '2', 
      type: 'Fastest', 
      score: 72, 
      duration: '8m', 
      distance: '2.8km', 
      active: selectedRouteId === '2', 
      icon: <Zap className="text-amber-500" />,
      path: []
    },
    { 
      id: '3', 
      type: 'Shortest', 
      score: 65, 
      duration: '10m', 
      distance: '2.5km', 
      active: selectedRouteId === '3', 
      icon: <Ruler className="text-blue-500" />,
      path: []
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className={`relative z-[50] ${theme === 'dark' ? 'glass-dark text-white border-white/10' : 'bg-white text-slate-900 border-slate-200'} border rounded-[32px] p-6 shadow-2xl`}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1 mr-4">
          <h2 className="text-xl font-bold truncate">{destination.name}</h2>
          <p className={`${theme === 'dark' ? 'text-white/50' : 'text-slate-500'} text-sm`}>Suggested Routes • Real-time Traffic</p>
        </div>
        <button onClick={onCancel} className={`${theme === 'dark' ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-slate-600'} shrink-0 transition-colors`}>Cancel</button>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        {routes.map((route) => (
          <motion.div
            key={route.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectRoute(route.id)}
            className={`p-4 rounded-2xl flex items-center justify-between border transition-all cursor-pointer ${
              route.active 
                ? (theme === 'dark' ? 'bg-white/20 border-neon-accent ring-1 ring-neon-accent' : 'bg-slate-50 border-neon-accent ring-1 ring-neon-accent shadow-sm') 
                : (theme === 'dark' ? 'bg-transparent border-white/5 opacity-60' : 'bg-white border-slate-100 opacity-60 hover:opacity-100')
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'} rounded-xl`}>
                {route.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{route.type}</span>
                  {route.type === 'Safest' && <span className="bg-green-500/20 text-green-500 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">Recommended</span>}
                </div>
                <div className={`flex gap-3 text-xs ${theme === 'dark' ? 'text-white/50' : 'text-slate-500'} mt-1`}>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {route.duration}</span>
                  <span className="flex items-center gap-1"><Ruler className="w-3 h-3" /> {route.distance}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{route.score}%</div>
              <div className={`text-[10px] uppercase font-bold ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'} tracking-widest`}>Safety</div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onStart}
        className="w-full bg-neon-purple text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-2xl"
      >
        Start Navigating
        <ChevronRight className="w-6 h-6" />
      </motion.button>
    </motion.div>
  );
}
