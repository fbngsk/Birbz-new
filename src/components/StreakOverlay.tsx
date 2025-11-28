import React, { useEffect } from 'react';
import { Flame } from 'lucide-react';

interface StreakOverlayProps {
    streak: number;
    onClose: () => void;
}

export const StreakOverlay: React.FC<StreakOverlayProps> = ({ streak, onClose }) => {
    // Block body scroll when overlay is shown
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in cursor-pointer" 
            onClick={onClose}
            style={{ width: '100vw', height: '100vh' }}
        >
            <div className="text-center text-white p-8 relative max-w-xs w-full">
                
                {/* Background Rays */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <div className="w-[500px] h-[500px] bg-gradient-to-r from-transparent via-orange/10 to-transparent animate-[spin_10s_linear_infinite]"></div>
                </div>

                <div className="relative z-10">
                    <div className="text-2xl font-bold text-orange-400 uppercase mb-2 animate-slide-up">Streak verlängert!</div>
                    
                    <div className="w-40 h-40 mx-auto mb-6 flex items-center justify-center relative">
                         <div className="absolute inset-0 bg-orange/40 blur-2xl rounded-full animate-pulse"></div>
                         <Flame size={100} className="text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.8)] animate-bounce-slow" fill="currentColor"/>
                         <div className="absolute bottom-4 font-black text-white text-4xl shadow-black drop-shadow-md">
                             {streak}
                         </div>
                    </div>
                    
                    <h2 className="text-4xl font-bold mb-4 text-white animate-slide-up delay-100">{streak} Tage</h2>
                    <p className="text-gray-200 mb-8 text-sm animate-slide-up delay-200">Du bist "on fire"! Komm morgen wieder, um deinen Streak zu behalten.</p>
                    
                    <button className="px-8 py-3 bg-orange text-white font-bold rounded-xl shadow-lg shadow-orange/30 hover:bg-orange-600 transition-all active:scale-95">
                        Weiter so!
                    </button>
                </div>
            </div>
        </div>
    );
};
