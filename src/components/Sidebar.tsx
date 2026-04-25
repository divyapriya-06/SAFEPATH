import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Bookmark, 
  Settings, 
  PhoneCall, 
  Moon, 
  LogOut,
  X,
  Shield,
  Bell,
  Heart,
  CloudRain
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onItemClick: (label: string) => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
}

export default function Sidebar({ isOpen, onClose, onItemClick, onLogout, theme }: SidebarProps) {
  const menuItems = [
    { icon: <User />, label: 'Profile' },
    { icon: <Bookmark />, label: 'Saved Places' },
    { icon: <Shield />, label: 'Safety Settings' },
    { icon: <CloudRain />, label: 'Environmental Safety' },
    { icon: <PhoneCall />, label: 'Emergency Contacts' },
    { icon: <Bell />, label: 'Notifications' },
    { icon: <Heart />, label: 'Premium (SafePath+)' },
  ];

  const bgColor = theme === 'dark' ? 'glass-dark text-white' : 'bg-white border-slate-200 text-slate-900';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed top-0 left-0 bottom-0 w-80 ${bgColor} border-r z-[101] flex flex-col p-6`}
            style={{ paddingTop: 'max(2rem, calc(env(safe-area-inset-top) + 1.5rem))', paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 1.5rem))' }}
          >
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-neon-purple rounded-2xl flex items-center justify-center shadow-lg">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h2 className={`text-xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>SafePath AI</h2>
              </div>
              <button onClick={onClose} className={`p-2 ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-100'} rounded-xl transition-colors`}>
                <X className={`w-6 h-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="space-y-2">
                {menuItems.map((item) => (
                  <motion.button
                    key={item.label}
                    whileHover={{ x: 10, backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                    onClick={() => {
                      onItemClick(item.label);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-colors ${theme === 'dark' ? 'text-white/80 hover:text-white' : 'text-slate-600 hover:text-slate-900'} text-left`}
                  >
                    <span className="opacity-60">{item.icon}</span>
                    <span className="font-bold">{item.label}</span>
                  </motion.button>
                ))}
              </div>

              <div className={`mt-10 p-6 rounded-3xl ${theme === 'dark' ? 'bg-gradient-to-br from-neon-purple/20 to-neon-blue/20 border-white/10' : 'bg-slate-50 border-slate-100'} border`}>
                <h4 className={`font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>SafeMode Active</h4>
                <p className={`text-xs ${theme === 'dark' ? 'text-white/50' : 'text-slate-500'} leading-relaxed mb-4`}>You are currently monitoring your safety levels in real-time.</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-green-500">Secured</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 mt-auto">
              <button 
                onClick={onLogout}
                className="w-full flex items-center gap-4 p-4 rounded-2xl text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-6 h-6" />
                <span className="font-bold">Log Out</span>
              </button>
              <p className="text-center text-[10px] text-white/20 mt-4 font-bold tracking-widest uppercase mb-4">v1.2.0-stable</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
