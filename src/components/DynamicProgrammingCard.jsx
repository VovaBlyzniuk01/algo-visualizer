import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const DynamicProgrammingCard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate('/dp-workbench')}
      className="relative group flex flex-col rounded-3xl p-6 lg:p-8 cursor-pointer overflow-hidden transition-all duration-500 hover:-translate-y-2 w-full h-full font-sans"
    >
      <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-3xl z-0 transition-opacity duration-500" />

      <div
        className="absolute inset-0 z-0 transition-opacity duration-500 rounded-3xl opacity-0 group-hover:opacity-100"
        style={{
          boxShadow: 'inset 0 0 40px rgba(96, 165, 250, 0.05), 0 0 20px rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(96, 165, 250, 0.2)',
        }}
      />

      <div className="relative z-10 flex-1 flex flex-col">
        <div className="w-full mb-8 relative">
          <div className="flex flex-col gap-1.5 items-center justify-center h-32 w-full bg-purple-950/30 rounded-2xl shadow-[inset_0_0_20px_rgba(168,85,247,0.1)] border border-purple-500/20 p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-1.5">
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex gap-1.5 shrink-0">
                  {[0, 1, 2].map((col) => {
                    const delay = (row * 3 + col) * 0.18;
                    const isEmphasized = row === 2 && col >= 1;

                    return (
                      <motion.div
                        key={`${row}-${col}`}
                        animate={{
                          backgroundColor: isEmphasized
                            ? [
                                'rgba(88, 28, 135, 0.78)',
                                'rgba(216, 180, 254, 0.98)',
                                'rgba(124, 58, 237, 0.88)',
                              ]
                            : [
                                'rgba(59, 7, 100, 0.55)',
                                'rgba(168, 85, 247, 0.82)',
                                'rgba(76, 29, 149, 0.68)',
                              ],
                          borderColor: isEmphasized
                            ? ['rgba(216,180,254,0.45)', 'rgba(255,255,255,0.95)', 'rgba(216,180,254,0.62)']
                            : ['rgba(168,85,247,0.25)', 'rgba(216,180,254,0.75)', 'rgba(168,85,247,0.35)'],
                          boxShadow: isEmphasized
                            ? [
                                '0 0 0 rgba(216,180,254,0)',
                                '0 0 24px rgba(233,213,255,0.95)',
                                '0 0 10px rgba(192,132,252,0.35)',
                              ]
                            : [
                                '0 0 0 rgba(168,85,247,0)',
                                '0 0 14px rgba(192,132,252,0.7)',
                                '0 0 5px rgba(168,85,247,0.18)',
                              ],
                          opacity: isEmphasized ? [0.9, 1, 0.96] : [0.72, 1, 0.82],
                          scale: isEmphasized ? [1, 1.06, 1] : [1, 1.03, 1],
                        }}
                        transition={{
                          duration: 2.4,
                          repeat: Infinity,
                          delay,
                          ease: 'easeInOut',
                        }}
                        className="w-8 h-8 md:w-9 md:h-9 rounded border flex items-center justify-center font-mono"
                      >
                        <span
                          className={`text-[8px] md:text-[9px] tracking-tighter ${
                            isEmphasized ? 'text-purple-950/80' : 'text-purple-200/50'
                          }`}
                        >
                          [{row},{col}]
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-3 tracking-wide text-white">
          {t.dpTitle}
        </h2>

        <p className="text-blue-200/50 text-sm leading-relaxed flex-1 font-light">
          {t.dpDesc}
        </p>

        <div className="mt-8 uppercase text-xs font-bold tracking-widest flex items-center gap-2 transition-colors duration-500 text-blue-200/30 group-hover:text-blue-400">
          {t.accessModule}
          <div className="transition-transform duration-300 group-hover:translate-x-1">→</div>
        </div>
      </div>
    </div>
  );
};

export default DynamicProgrammingCard;
