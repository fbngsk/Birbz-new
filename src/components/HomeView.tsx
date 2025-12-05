import React, { useState, useEffect } from 'react';
import { Target, Trophy, Clock, ChevronRight, Camera, GraduationCap, Users, Flame } from 'lucide-react';
import { UserProfile, Bird, Swarm } from '../types';
import { BIRDS_DB } from '../constants';
import { supabase } from '../lib/supabaseClient';
import { DailyHoroscope } from './DailyHoroscope';
import { getUserSwarm, getSwarmCollection } from '../services/swarmService';

interface HomeViewProps {
    userProfile: UserProfile;
    xp: number;
    collectedIds: string[];
    isVacationMode: boolean;
    onShowLeaderboard: () => void;
    onNavigateToDex: () => void;
    onBirdClick?: (bird: Bird) => void;
    onStartQuiz?: () => void;
    onNavigateToSwarm?: () => void;
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
    onNavigateToSwarm,
    locationPermission
}) => {
    const [rankInfo, setRankInfo] = useState<RankInfo | null>(null);
    const [lastBird, setLastBird] = useState<Bird | null>(null);
    const [userSwarm, setUserSwarm] = useState<Swarm | null>(null);
    const [swarmSpeciesCount, setSwarmSpeciesCount] = useState(0);
    
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

    // Fetch user's swarm
    useEffect(() => {
        const fetchSwarm = async () => {
            if (!userProfile.id) return;
            
            try {
                const swarm = await getUserSwarm(userProfile.id);
                if (swarm) {
                    setUserSwarm(swarm);
                    // Schwarm-Sammlung laden
                    const collection = await getSwarmCollection(swarm.id);
                    setSwarmSpeciesCount(collection.length);
                }
            } catch (err) {
                console.error('Error fetching swarm:', err);
            }
        };
        
        fetchSwarm();
    }, [userProfile.id]);

    // Collection stats
    const totalBirds = BIRDS_DB.filter(b => b.locationType !== 'vacation').length;
    const collectedLocalCount = collectedIds.filter(id => !id.startsWith('vacation_')).length;
    const collectedVacationCount = collectedIds.filter(id => id.startsWith('vacation_')).length;
    const collectionPercent = Math.round((collectedLocalCount / totalBirds) * 100);

    // Swarm progress calculation
    const getNextMilestone = (species: number) => {
        const milestones = [50, 100, 150, 200, 250, 300, 322];
        return milestones.find(m => m > species) || 322;
    };

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

            {/* Schwarm Card */}
            <div className="px-6 pt-4">
                {userSwarm ? (
                    <button 
                        onClick={onNavigateToSwarm}
                        className="w-full bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-4 shadow-sm border border-teal/20 hover:border-teal/40 transition-all text-left"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">🪺</span>
                                <div>
                                    <span className="font-bold text-gray-800">{userSwarm.name}</span>
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Users size={12} />
                                        <span>{userSwarm.memberCount || 1}/10 Mitglieder</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {(userSwarm.currentStreak || 0) > 0 && (
                                    <div className="flex items-center gap-1 bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-sm font-bold">
                                        <Flame size={14} />
                                        {userSwarm.currentStreak}
                                    </div>
                                )}
                                <ChevronRight size={20} className="text-gray-300" />
                            </div>
                        </div>
                        
                        {/* Progress */}
                        <div className="mb-3">
                            <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-gray-600">Schwarm-Fortschritt</span>
                                <span className="font-bold text-teal">{swarmSpeciesCount}/{getNextMilestone(swarmSpeciesCount)}</span>
                            </div>
                            <div className="h-2.5 bg-white rounded-full overflow-hidden shadow-inner">
                                <div 
                                    className="h-full bg-gradient-to-r from-teal to-emerald-400 rounded-full transition-all duration-500"
                                    style={{ width: `${(swarmSpeciesCount / getNextMilestone(swarmSpeciesCount)) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Bottom row */}
                        <div className="flex items-center justify-between">
                            <div className="flex -space-x-2">
                                {[...Array(Math.min(4, userSwarm.memberCount || 1))].map((_, i) => (
                                    <div 
                                        key={i} 
                                        className="w-7 h-7 rounded-full border-2 border-white shadow-sm"
                                        style={{ 
                                            background: `linear-gradient(135deg, ${['#14b8a6', '#f97316', '#a855f7', '#ec4899'][i]} 0%, ${['#0d9488', '#ea580c', '#9333ea', '#db2777'][i]} 100%)` 
                                        }}
                                    />
                                ))}
                                {(userSwarm.memberCount || 1) > 4 && (
                                    <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                                        +{(userSwarm.memberCount || 1) - 4}
                                    </div>
                                )}
                            </div>
                            <span className="text-xs text-gray-500">
                                Nächstes Badge: {getNextMilestone(swarmSpeciesCount)} Arten
                            </span>
                        </div>
                    </button>
                ) : (
                    <button 
                        onClick={onNavigateToSwarm}
                        className="w-full bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-4 shadow-sm border border-dashed border-teal/30 hover:border-teal/50 transition-all text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-teal/10 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">🪺</span>
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-gray-800">Schwarm beitreten</div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Sammle mit Freunden alle 322 Arten!
                                </p>
                            </div>
                            <ChevronRight size={20} className="text-gray-300" />
                        </div>
                    </button>
                )}
            </div>

            {/* Stats Row */}
            <div className="px-6 pt-4 grid grid-cols-2 gap-3">
                {/* Rank Card */}
                <button 
                    onClick={onShowLeaderboard}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left hover:border-teal/30 transition-colors"
                >
                    <div className="flex items-center justify-between mb-2">
                        <Trophy size={18} className="text-orange" />
                        <ChevronRight size={16} className="text-gray-300" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                        #{rankInfo?.rank || '-'}
                    </div>
                    <div className="text-xs text-gray-400">
                        Globales Ranking
                    </div>
                </button>

                {/* Last Sighting Card */}
                <div 
                    className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 ${lastBird && onBirdClick ? 'cursor-pointer hover:border-purple-200 active:scale-[0.98] transition-all' : ''}`}
                    onClick={() => lastBird && onBirdClick?.(lastBird)}
                >
                    <div className="flex items-center justify-between mb-2">
                        <Clock size={18} className="text-purple-500" />
                        {lastBird && (
                            <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                Zuletzt
                            </span>
                        )}
                    </div>
                    {lastBird ? (
                        <>
                            <div className="text-sm font-bold text-gray-800 truncate">
                                {lastBird.name}
                            </div>
                            <div className="text-xs text-gray-400 truncate">
                                {lastBird.sciName}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="text-sm font-bold text-gray-400">
                                Noch keine
                            </div>
                            <div className="text-xs text-gray-400">
                                Sichtung
                            </div>
                        </>
                    )}
                </div>
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

            {/* Quick Action Hint */}
            <div className="px-6 mt-4">
                <div className="bg-gradient-to-r from-teal/5 to-emerald-500/5 rounded-2xl p-4 border border-teal/10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-teal flex items-center justify-center shrink-0">
                        <Camera size={24} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700">
                            Tippe auf den Button unten, um einen Vogel zu identifizieren!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
