import React, { useState, useEffect } from 'react';
import { Target, Trophy, Clock, ChevronRight, Camera, GraduationCap } from 'lucide-react';
import { UserProfile, Bird } from '../types';
import { BIRDS_DB } from '../constants';
import { supabase } from '../lib/supabaseClient';
import { DailyHoroscope } from './DailyHoroscope';

interface HomeViewProps {
    userProfile: UserProfile;
    xp: number;
    collectedIds: string[];
    isVacationMode: boolean;
    onShowLeaderboard: () => void;
    onNavigateToDex: () => void;
    onBirdClick?: (bird: Bird) => void;
    onStartQuiz?: () => void;
    locationPermission?: 'granted' | 'denied' | 'pending';
}

interface RankInfo {
    rank: number;
    totalUsers: number;
}

export const HomeView: React.FC<HomeViewProps> = ({ 
    userProfile, 
    xp, 
    collectedIds,
    isVacationMode,
    onShowLeaderboard,
    onNavigateToDex,
    onBirdClick,
    onStartQuiz,
    locationPermission
}) => {
    const [rankInfo, setRankInfo] = useState<RankInfo | null>(null);
    const [lastBird, setLastBird] = useState<Bird | null>(null);
    
    // Get last collected bird
    useEffect(() => {
        if (collectedIds.length > 0) {
            const lastId = collectedIds[collectedIds.length - 1];
            const bird = BIRDS_DB.find(b => b.id === lastId);
            if (bird) setLastBird(bird);
        }
    }, [collectedIds]);
    
    // Fetch user rank
    useEffect(() => {
        const fetchRank = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, xp')
                    .order('xp', { ascending: false });
                
                if (data && !error) {
                    const userIndex = data.findIndex(u => u.id === userProfile.id);
                    if (userIndex !== -1) {
                        setRankInfo({
                            rank: userIndex + 1,
                            totalUsers: data.length
                        });
                    }
                }
            } catch (err) {
                console.error('Error fetching rank:', err);
            }
        };
        
        if (userProfile.id) {
            fetchRank();
        }
    }, [userProfile.id, xp]);

    // Collection stats
    const totalBirds = BIRDS_DB.filter(b => b.locationType !== 'vacation').length;
    const collectedLocalCount = collectedIds.filter(id => !id.startsWith('vacation_')).length;
    const collectedVacationCount = collectedIds.filter(id => id.startsWith('vacation_')).length;
    const collectionPercent = Math.round((collectedLocalCount / totalBirds) * 100);

    return (
        <div className="animate-fade-in pb-6">
            {/* Vacation Mode Banner */}
            {isVacationMode && (
                <div className="px-6 pt-4 pb-2">
                    <div className="bg-orange-100 border border-orange-200 rounded-2xl p-4 text-center shadow-sm">
                        <h3 className="font-bold text-orange-600 text-lg">Urlaubs-Modus Aktiv 🌴</h3>
                        <p className="text-xs text-orange-800 mt-1">Du sammelst jetzt exotische Arten.</p>
                    </div>
                </div>
            )}

            {/* Collection Progress Card */}
            <div className="px-6 pt-4">
                {isVacationMode ? (
                    <button 
                        onClick={onNavigateToDex}
                        className="w-full bg-white rounded-2xl p-4 shadow-sm border border-orange-100 hover:border-orange-300 transition-colors text-left"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-orange/10 flex items-center justify-center">
                                    <Target size={16} className="text-orange" />
                                </div>
                                <span className="font-bold text-gray-700">Urlaubsfunde</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-orange">{collectedVacationCount}</span>
                                <ChevronRight size={20} className="text-gray-300" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Exotische Arten aus aller Welt</p>
                    </button>
                ) : (
                    <button 
                        onClick={onNavigateToDex}
                        className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-teal/30 transition-colors text-left"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center">
                                    <Target size={16} className="text-teal" />
                                </div>
                                <span className="font-bold text-gray-700">Deine Sammlung</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-teal">{collectedLocalCount}/{totalBirds}</span>
                                <ChevronRight size={20} className="text-gray-300" />
                            </div>
                        </div>
                        
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                            <div 
                                className="h-full bg-gradient-to-r from-teal to-emerald-400 rounded-full transition-all duration-500"
                                style={{ width: `${collectionPercent}%` }}
                            />
                        </div>
                        
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>{collectedLocalCount} Arten entdeckt</span>
                            <span>{totalBirds - collectedLocalCount} noch zu finden</span>
                        </div>
                    </button>
                )}
            </div>

            {/* Daily Quiz Card */}
            {onStartQuiz && (
                <div className="px-6 pt-4">
                    <button 
                        onClick={onStartQuiz}
                        className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-4 shadow-lg shadow-purple-500/20 text-left hover:shadow-purple-500/30 transition-all active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                                <GraduationCap size={28} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-white text-lg">Tägliches Quiz</h3>
                                    <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">
                                        🔥 Streak
                                    </span>
                                </div>
                                <p className="text-white/80 text-sm mt-0.5">
                                    20 Fragen – Spiel mit und sicher dir deinen Streak!
                                </p>
                            </div>
                            <ChevronRight size={24} className="text-white/60 shrink-0" />
                        </div>
                    </button>
                </div>
            )}

            {/* Horoscope */}
            <DailyHoroscope onBirdClick={onBirdClick} />

            {/* GPS Permission Hint */}
            {locationPermission === 'denied' && (
                <div className="px-6 mt-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                            <span className="text-lg">📍</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-orange-800">
                                Standort nicht aktiviert
                            </p>
                            <p className="text-xs text-orange-600 mt-1">
                                Aktiviere GPS in deinen Einstellungen, um Sichtungen auf der Community-Karte zu teilen.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
