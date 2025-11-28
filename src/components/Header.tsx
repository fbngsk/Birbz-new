import React from 'react';
import { MapPin, Loader2, Plane, Home as HomeIcon, Flame } from 'lucide-react';
import { LEVEL_THRESHOLDS } from '../constants';
import { UserProfile } from '../types';
import { getAvatarUrl } from '../services/birdService';

interface HeaderProps {
    xp: number;
    locationStatus: string;
    isLoading: boolean;
    userProfile: UserProfile | null;
    isVacationMode: boolean;
    onToggleMode: () => void;
    onAvatarClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ xp, locationStatus, isLoading, userProfile, isVacationMode, onToggleMode, onAvatarClick }) => {
    const getLevelInfo = (currentXp: number) => {
        return LEVEL_THRESHOLDS.find(l => currentXp < l.max) || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    };

    const levelInfo = getLevelInfo(xp);
    const progressPercent = Math.min(100, (xp / levelInfo.max) * 100);
    
    const barColor = isVacationMode ? 'bg-gradient-to-r from-orange-400 to-pink-500' : 'bg-teal';

    const streak = userProfile?.currentStreak || 0;
    const today = new Date().toISOString().split('T')[0];
    const isStreakActive = userProfile?.lastLogDate === today;

    return (
        <header 
            className={`pb-4 px-6 sticky top-0 z-20 shadow-sm border-b transition-colors duration-500 ${isVacationMode ? 'bg-orange-50 border-gray-200/50' : 'bg-cream border-gray-200/50'}`}
            style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        >
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                    <div className="relative cursor-pointer active:scale-95 transition-transform" onClick={onAvatarClick}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border-2 shadow-md ${isVacationMode ? 'border-orange-300' : 'border-white bg-teal'}`}>
                            {userProfile ? (
                                <img src={getAvatarUrl(userProfile.avatarSeed)} alt="Avatar" className="w-full h-full object-cover"/>
                            ) : (
                                <span className="text-white font-bold">B</span>
                            )}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 text-white ${isVacationMode ? 'border-white bg-pink-500' : 'border-white bg-teal'}`}>
                           {levelInfo.level}
                        </div>
                    </div>
                    
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                             <h1 onClick={onAvatarClick} className={`font-bold text-lg leading-none transition-colors cursor-pointer ${isVacationMode ? 'text-orange-600' : 'text-teal'}`}>
                                {userProfile?.name || 'Gast'}
                            </h1>
                            
                            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${isStreakActive ? 'bg-orange-100 border-orange-200 text-orange-600' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                                <Flame size={12} fill={isStreakActive ? "currentColor" : "none"} />
                                <span className="text-[10px] font-bold">{streak}</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">{xp} XP • {levelInfo.title}</p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={onToggleMode}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm text-xs font-bold transition-all ${isVacationMode ? 'bg-orange-500 text-white shadow-orange-200' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                        >
                            {isVacationMode ? <Plane size={14} /> : <HomeIcon size={14} />}
                            {isVacationMode ? 'Urlaub' : 'Heimat'}
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-100/50 px-2 py-0.5 rounded-full">
                        {isLoading ? <Loader2 size={10} className="animate-spin" /> : <MapPin size={10}/>}
                        <span>{locationStatus}</span>
                    </div>
                </div>
            </div>

            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner relative">
                <div 
                    className={`h-full ${barColor} rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${progressPercent}%` }}
                />
            </div>
        </header>
    );
};
