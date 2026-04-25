import React from 'react';
import { motion } from 'framer-motion';
import { Shield, MapPin, ChevronRight } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  key?: string; // Add optional key for Framer Motion
}

export default function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="gradient-3d min-h-screen w-full flex flex-col items-center justify-center text-white p-6 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 flex flex-col items-center text-center max-w-md"
      >
        <div className="relative mb-8">
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-xl border border-white/30 shadow-2xl"
          >
            <Shield className="w-16 h-16 text-neon-accent" />
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="absolute -bottom-2 -right-2 bg-neon-accent p-3 rounded-2xl shadow-lg"
          >
            <MapPin className="w-6 h-6 text-neon-purple" />
          </motion.div>
        </div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-5xl font-bold mb-4 tracking-tight"
        >
          SafePath AI
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-lg text-white/80 mb-12 font-medium leading-relaxed"
        >
          Premium navigation that prioritizes your safety using real-time AI risk analysis.
        </motion.p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStart}
          className="group bg-white text-neon-purple px-8 py-4 rounded-2xl font-bold text-xl flex items-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.5)]"
        >
          Start Safe Navigation
          <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </motion.button>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6 w-full max-w-sm"
        >
          <div className="flex flex-col">
            <span className="text-xl font-black text-neon-accent">50k+</span>
            <span className="text-[9px] uppercase tracking-widest opacity-50 whitespace-nowrap">Active Users</span>
          </div>
          <div className="flex flex-col border-x border-white/10">
            <span className="text-xl font-black text-neon-accent">1.2M</span>
            <span className="text-[9px] uppercase tracking-widest opacity-50 whitespace-nowrap">Safe KM</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black text-neon-accent">99%</span>
            <span className="text-[9px] uppercase tracking-widest opacity-50 whitespace-nowrap">Shield Rating</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Decorative Orbs */}
      <motion.div
        animate={{ 
          x: [0, 100, 0],
          y: [0, -100, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute top-20 left-10 w-64 h-64 bg-neon-purple/30 rounded-full blur-[80px]"
      />
      <motion.div
        animate={{ 
          x: [0, -50, 0],
          y: [0, 150, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-20 right-10 w-96 h-96 bg-neon-blue/20 rounded-full blur-[100px]"
      />
    </div>
  );
}
