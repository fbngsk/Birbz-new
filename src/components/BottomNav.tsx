import React from 'react';
import { Home, BookOpen, Bird, Info, GraduationCap, MapPin } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
    onScanClick: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, onScanClick }) => {
    return (
        <nav className="fixed bottom-6 left-4 right-4 bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-gray-100 h-20 flex items-center justify-between px-4 z-30">
            <button 
                onClick={() => setActiveTab('home')} 
                className={`flex flex-col items-center justify-center w-10 h-10 rounded-2xl transition-all ${activeTab === 'home' ? 'text-teal scale-110' : 'text-gray-400 hover:text-teal/50'}`}
            >
                <Home size={22} strokeWidth={activeTab === 'home' ? 3 : 2} />
            </button>
            
            <button 
                onClick={() => setActiveTab('tips')} 
                className={`flex flex-col items-center justify-center w-10 h-10 rounded-2xl transition-all ${activeTab === 'tips' ? 'text-teal scale-110' : 'text-gray-400 hover:text-teal/50'}`}
            >
                <Info size={22} strokeWidth={activeTab === 'tips' ? 3 : 2} />
            </button>
            
            <div className="relative -top-6">
                <button 
                    onClick={onScanClick} 
                    className="w-16 h-16 bg-teal rounded-full shadow-lg shadow-teal/40 flex items-center justify-center text-white transform active:scale-95 transition-all border-4 border-cream hover:bg-teal-800"
                >
                    <Bird size={28} strokeWidth={2.5} />
                </button>
            </div>
            
            <button 
                onClick={() => setActiveTab('radar')} 
                className={`flex flex-col items-center justify-center w-10 h-10 rounded-2xl transition-all ${activeTab === 'radar' ? 'text-teal scale-110' : 'text-gray-400 hover:text-teal/50'}`}
            >
                <MapPin size={22} strokeWidth={activeTab === 'radar' ? 3 : 2} />
            </button>
            
            <button 
                onClick={() => setActiveTab('dex')} 
                className={`flex flex-col items-center justify-center w-10 h-10 rounded-2xl transition-all ${activeTab === 'dex' ? 'text-teal scale-110' : 'text-gray-400 hover:text-teal/50'}`}
            >
                <BookOpen size={22} strokeWidth={activeTab === 'dex' ? 3 : 2} />
            </button>
        </nav>
    );
};
