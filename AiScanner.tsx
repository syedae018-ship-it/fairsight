import React from 'react';
import { motion } from 'framer-motion';

/**
 * AiScanner
 * 
 * A minimal, premium animation that feels like an AI system initializing and scanning data.
 * Built with TailwindCSS and Framer Motion.
 */
const AiScanner = () => {
  return (
    <div className="relative flex items-center justify-center min-h-[380px]">
      {/* Step 1: Entry animation for the main container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative flex items-center justify-center w-80 h-80 rounded-full border border-white/5"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03), transparent 70%)',
          boxShadow: '0 0 40px rgba(255,255,255,0.03), inset 0 0 40px rgba(255,255,255,0.02)'
        }}
      >
        {/* Step 3: Breathing Glow Pulse */}
        <motion.div
          animate={{
            boxShadow: [
              '0 0 20px rgba(255,255,255,0.02), inset 0 0 20px rgba(255,255,255,0.02)',
              '0 0 40px rgba(255,255,255,0.08), inset 0 0 40px rgba(255,255,255,0.04)',
              '0 0 20px rgba(255,255,255,0.02), inset 0 0 20px rgba(255,255,255,0.02)'
            ]
          }}
          transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
          className="absolute inset-0 rounded-full"
        />

        {/* Step 2: Ripple Waves */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`ripple-${i}`}
            initial={{ opacity: 0.4, scale: 1 }}
            animate={{ opacity: 0, scale: 1.4 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
              delay: i * 1 // Staggered delays: 0s, 1s, 2s
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full border border-white/10"
          />
        ))}

        {/* Inner Core Background */}
        <div className="relative z-10 flex items-center justify-center w-[120px] h-[120px] rounded-full border border-white/10 bg-white/[0.03] shadow-[0_0_20px_rgba(255,255,255,0.05)]">
          {/* Step 4: Inner Icon Entry */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="rgba(255,255,255,0.8)" 
              strokeWidth="1.5"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default AiScanner;
