import React from 'react';
import { Home, BookOpen, Lightbulb, Plus, MapPin, HelpCircle } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
    onScanClick: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, onScanClick }) => {
    const tabs: { id: TabType; icon: React.ReactNode; label: string }[] = [
        { id: 'home', icon: <Home size={22} />, label: 'Home' },
        { id: 'dex', icon: <BookOpen size={22} />, label: 'Sammlung' },
        { id: 'radar', icon: <MapPin size={22} />, label: 'Radar' },
        { id: 'tips', icon: <Lightbulb size={22} />, label: 'Tipps' },
        { id: 'quiz', icon: <HelpCircle size={22} />, label: 'Quiz' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 z-30">
            <div 
                className="flex items-center justify-around relative"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
                {tabs.map((tab, index) => {
                    // Insert the scan button after 'dex' (index 1)
                    if (index === 2) {
                        return (
                            <React.Fragment key="scan-button-fragment">
                                {/* Scan Button (Center) */}
                                <button
                                    onClick={onScanClick}
                                    className="relative -mt-6 group"
                                    aria-label="Vogel scannen"
                                >
                                    <div className="absolute inset-0 bg-orange rounded-full blur-lg opacity-40 group-hover:opacity-60 transition-opacity scale-90"></div>
                                    <div className="relative w-16 h-16 bg-gradient-to-br from-orange to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-orange/30 group-hover:scale-105 group-active:scale-95 transition-transform">
                                        <Plus size={32} className="text-white" strokeWidth={2.5} />
                                    </div>
                                </button>
                                
                                {/* Radar Tab */}
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex flex-col items-center py-3 px-4 transition-all duration-200 ${
                                        activeTab === tab.id 
                                            ? 'text-teal scale-105' 
                                            : 'text-gray-400 hover:text-gray-600'
                                    }`}
                                >
                                    <div className={`transition-transform ${activeTab === tab.id ? 'scale-110' : ''}`}>
                                        {tab.icon}
                                    </div>
                                    <span className={`text-[10px] mt-1 font-medium ${activeTab === tab.id ? 'text-teal' : ''}`}>
                                        {tab.label}
                                    </span>
                                    {activeTab === tab.id && (
                                        <div className="absolute bottom-0 w-1 h-1 bg-teal rounded-full"></div>
                                    )}
                                </button>
                            </React.Fragment>
                        );
                    }
                    
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-col items-center py-3 px-4 transition-all duration-200 ${
                                activeTab === tab.id 
                                    ? 'text-teal scale-105' 
                                    : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            <div className={`transition-transform ${activeTab === tab.id ? 'scale-110' : ''}`}>
                                {tab.icon}
                            </div>
                            <span className={`text-[10px] mt-1 font-medium ${activeTab === tab.id ? 'text-teal' : ''}`}>
                                {tab.label}
                            </span>
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 w-1 h-1 bg-teal rounded-full"></div>
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};
