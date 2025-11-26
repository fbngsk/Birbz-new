import React, { useState, useEffect } from 'react';
import { X, Loader2, Award, Bird, Trophy, Flame } from 'lucide-react';
import { Bird as BirdType, Badge } from '../types';
import { getAvatarUrl } from '../services/birdService';
import { supabase } from '../lib/supabaseClient';
import { BADGES_DB, BIRDS_DB, LEVEL_THRESHOLDS } from '../constants';

interface UserProfileModalProps {
    userId: string;
    userName: string;
    avatarSeed: string;
    userXp: number;
    onClose: () => void;
}

// Get level info from XP
const getLevelInfo = (xp: number) => {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (xp >= LEVEL_THRESHOLDS[i].max) {
            const nextLevel = LEVEL_THRESHOLDS[i + 1] || LEVEL_THRESHOLDS[i];
            return {
                level: nextLevel.level,
                title: nextLevel.title,
                current: xp - LEVEL_THRESHOLDS[i].max,
                max: nextLevel.next - LEVEL_THRESHOLDS[i].max
            };
        }
    }
    // First level
    return { 
        level: LEVEL_THRESHOLDS[0].level, 
        title: LEVEL_THRESHOLDS[0].title, 
        current: xp, 
        max: LEVEL_THRESHOLDS[0].max 
    };
};

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ 
    userId, 
    userName, 
    avatarSeed, 
    userXp,
    onClose 
}) => {
    const [loading, setLoading] = useState(true);
    const [collectedBirds, setCollectedBirds] = useState<BirdType[]>([]);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [streak, setStreak] = useState(0);

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            try {
                // Fetch user's full profile
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('collected_ids, badges, current_streak')
                    .eq('id', userId)
                    .single();

                if (error) throw error;

                if (profile) {
                    // Map collected_ids to bird objects
                    const collectedIds: string[] = profile.collected_ids || [];
                    const birds = collectedIds
                        .map(id => BIRDS_DB.find(b => b.id === id))
                        .filter(Boolean) as BirdType[];
                    setCollectedBirds(birds);

                    // Map badge IDs to badge objects
                    const badgeIds: string[] = profile.badges || [];
                    const userBadges = badgeIds
                        .map(id => BADGES_DB.find(b => b.id === id))
                        .filter(Boolean) as Badge[];
                    setBadges(userBadges);

                    setStreak(profile.current_streak || 0);
                }

                // Also fetch vacation birds
                const { data: vacationData } = await supabase
                    .from('vacation_birds')
                    .select('*')
                    .eq('user_id', userId);

                if (vacationData && vacationData.length > 0) {
                    const vacationBirds: BirdType[] = vacationData.map(vb => ({
                        id: vb.id,
                        name: vb.name,
                        sciName: vb.sci_name,
                        rarity: vb.rarity || 'Urlaubsfund',
                        points: vb.points || 25,
                        locationType: 'vacation' as const,
                        realImg: vb.real_img,
                        realDesc: vb.real_desc
                    }));
                    setCollectedBirds(prev => [...prev, ...vacationBirds]);
                }

            } catch (err) {
                console.error('Error fetching user profile:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [userId]);

    const levelInfo = getLevelInfo(userXp);
    const localBirds = collectedBirds.filter(b => b.locationType !== 'vacation');
    const vacationBirds = collectedBirds.filter(b => b.locationType === 'vacation');

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center animate-fade-in" onClick={onClose}>
            <div 
                className="bg-cream w-full max-w-lg rounded-t-3xl max-h-[85vh] overflow-hidden animate-slide-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-teal p-6 text-white relative">
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full border-4 border-white/30 overflow-hidden shadow-lg">
                            <img src={getAvatarUrl(avatarSeed)} className="w-full h-full object-cover" alt={userName} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{userName}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                                    Lvl {levelInfo.level}
                                </span>
                                <span className="text-white/80 text-sm">{levelInfo.title}</span>
                            </div>
                            <div className="text-white/60 text-sm mt-1">{userXp} XP</div>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex gap-4 mt-4 pt-4 border-t border-white/20">
                        <div className="flex items-center gap-2">
                            <Bird size={16} className="text-white/60" />
                            <span className="font-bold">{collectedBirds.length}</span>
                            <span className="text-white/60 text-sm">Vögel</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Award size={16} className="text-white/60" />
                            <span className="font-bold">{badges.length}</span>
                            <span className="text-white/60 text-sm">Badges</span>
                        </div>
                        {streak > 0 && (
                            <div className="flex items-center gap-2">
                                <Flame size={16} className="text-orange" />
                                <span className="font-bold">{streak}</span>
                                <span className="text-white/60 text-sm">Streak</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[50vh] p-4">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="animate-spin text-teal" size={32} />
                        </div>
                    ) : (
                        <>
                            {/* Badges Section */}
                            {badges.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                                        <Trophy size={14} /> Badges ({badges.length})
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {badges.slice(0, 12).map(badge => (
                                            <div 
                                                key={badge.id}
                                                className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2"
                                                title={badge.description}
                                            >
                                                <span className="text-xl">{badge.icon}</span>
                                                <span className="text-xs font-bold text-teal">{badge.title}</span>
                                            </div>
                                        ))}
                                        {badges.length > 12 && (
                                            <div className="bg-gray-100 px-3 py-2 rounded-xl text-xs text-gray-500 font-bold">
                                                +{badges.length - 12} mehr
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Heimat Birds */}
                            {localBirds.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                                        🌲 Heimat-Vögel ({localBirds.length})
                                    </h3>
                                    <div className="grid grid-cols-4 gap-2">
                                        {localBirds.slice(0, 16).map(bird => (
                                            <div 
                                                key={bird.id}
                                                className="aspect-square bg-white rounded-xl p-2 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center"
                                                title={bird.name}
                                            >
                                                <div className="text-lg mb-1">🐦</div>
                                                <div className="text-[9px] font-bold text-teal truncate w-full">{bird.name}</div>
                                            </div>
                                        ))}
                                        {localBirds.length > 16 && (
                                            <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-xs text-gray-500 font-bold">
                                                +{localBirds.length - 16}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Vacation Birds */}
                            {vacationBirds.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                                        🌴 Urlaubs-Vögel ({vacationBirds.length})
                                    </h3>
                                    <div className="grid grid-cols-4 gap-2">
                                        {vacationBirds.slice(0, 8).map(bird => (
                                            <div 
                                                key={bird.id}
                                                className="aspect-square bg-orange/10 rounded-xl p-2 shadow-sm border border-orange/20 flex flex-col items-center justify-center text-center"
                                                title={bird.name}
                                            >
                                                <div className="text-lg mb-1">🦜</div>
                                                <div className="text-[9px] font-bold text-orange truncate w-full">{bird.name}</div>
                                            </div>
                                        ))}
                                        {vacationBirds.length > 8 && (
                                            <div className="aspect-square bg-orange/10 rounded-xl flex items-center justify-center text-xs text-orange font-bold">
                                                +{vacationBirds.length - 8}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Empty State */}
                            {collectedBirds.length === 0 && badges.length === 0 && (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-3">🥚</div>
                                    <p className="text-gray-400 text-sm">
                                        {userName} hat noch keine Vögel gesammelt.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
