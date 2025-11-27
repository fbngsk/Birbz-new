import React, { useState } from 'react';
import { X, Award, Trophy, Calendar, LogOut, ArrowRight, Lock, Star, Activity, Users, Clock, MapPin, Sparkles } from 'lucide-react';
import { UserProfile, Badge, Bird } from '../types';
import { BADGES_DB, LEVEL_THRESHOLDS, BIRDS_DB } from '../constants';
import { getAvatarUrl } from '../services/birdService';
import { BirdStats } from './BirdStats';
import { getLegendaryArtwork } from '../legendaryArtworks';

interface ProfileModalProps {
    user: UserProfile;
    xp: number;
    collectedCount: number;
    collectedIds: string[];
    onClose: () => void;
    onLogout: () => void;
    onShowLegendaryCard?: (bird: Bird) => void;
}

type ProfileTab = 'badges' | 'stats' | 'cards';

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, xp, collectedCount, collectedIds, onClose, onLogout, onShowLegendaryCard }) => {
    const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
    const [activeTab, setActiveTab] = useState<ProfileTab>('badges');
    
    const getLevelInfo = (currentXp: number) => {
        return LEVEL_THRESHOLDS.find(l => currentXp < l.max) || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    };
    const levelInfo = getLevelInfo(xp);
    const userBadges = user.badges || [];
    
    // Get collected legendary birds
    const legendaryBirds = BIRDS_DB.filter(b => b.tier === 'legendary');
    const collectedLegendary = legendaryBirds.filter(b => collectedIds.includes(b.id));

    // Categorize Badges
    const categories = {
        milestone: { label: 'Meilensteine', icon: <Star size={16}/>, badges: BADGES_DB.filter(b => b.category === 'milestone') },
        streak: { label: 'Zeit & Streaks', icon: <Clock size={16}/>, badges: BADGES_DB.filter(b => b.category === 'streak') },
        family: { label: 'Familien & Arten', icon: <Users size={16}/>, badges: BADGES_DB.filter(b => b.category === 'family') },
        special: { label: 'Spezial', icon: <Award size={16}/>, badges: BADGES_DB.filter(b => b.category === 'special' || !b.category) }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh]">
                
                {/* Header */}
                <div className="bg-teal p-6 pb-12 relative text-center">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-white/10 rounded-full">
                        <X size={20}/>
                    </button>
                    
                    <div className="w-24 h-24 mx-auto bg-white rounded-full border-4 border-orange p-1 shadow-lg mb-3 relative">
                        <img src={getAvatarUrl(user.avatarSeed)} alt="Avatar" className="rounded-full w-full h-full object-cover"/>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange text-white font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm text-sm">
                            {levelInfo.level}
                        </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                    <p className="text-teal-100 text-sm">{user.homeRegion}</p>
                </div>

                {/* Stats */}
                <div className="px-6 -mt-8 relative z-10">
                    <div className="bg-white rounded-2xl shadow-lg p-4 flex justify-between text-center border border-gray-100">
                        <div className="flex-1">
                            <div className="text-gray-400 text-[10px] uppercase font-bold">Gesamt XP</div>
                            <div className="text-xl font-bold text-teal">{xp}</div>
                        </div>
                        <div className="w-px bg-gray-100 mx-2"></div>
                        <div className="flex-1">
                            <div className="text-gray-400 text-[10px] uppercase font-bold">Vögel</div>
                            <div className="text-xl font-bold text-teal">{collectedCount}</div>
                        </div>
                        <div className="w-px bg-gray-100 mx-2"></div>
                        <div className="flex-1">
                            <div className="text-gray-400 text-[10px] uppercase font-bold">Badges</div>
                            <div className="text-xl font-bold text-orange">{userBadges.length}/{BADGES_DB.length}</div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="px-6 py-2 flex gap-2 border-b border-gray-100">
                    <button 
                        onClick={() => setActiveTab('badges')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'badges' ? 'bg-teal/10 text-teal' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Award size={14} className="inline mr-1" /> Badges
                    </button>
                    <button 
                        onClick={() => setActiveTab('cards')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'cards' ? 'bg-yellow-500/10 text-yellow-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Sparkles size={14} className="inline mr-1" /> Trophäen
                    </button>
                    <button 
                        onClick={() => setActiveTab('stats')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'stats' ? 'bg-teal/10 text-teal' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <MapPin size={14} className="inline mr-1" /> Stats
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                    {activeTab === 'stats' && user.id ? (
                        <BirdStats userId={user.id} />
                    ) : activeTab === 'cards' ? (
                        <div className="space-y-4">
                            <div className="text-center mb-6">
                                <h3 className="font-bold text-yellow-600 text-lg">Trophäen</h3>
                                <p className="text-gray-400 text-sm">{collectedLegendary.length} / {legendaryBirds.length} gesammelt</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                {legendaryBirds.map(bird => {
                                    const isCollected = collectedIds.includes(bird.id);
                                    const artwork = getLegendaryArtwork(bird.id);
                                    
                                    return (
                                        <button
                                            key={bird.id}
                                            onClick={() => isCollected && onShowLegendaryCard?.(bird)}
                                            disabled={!isCollected}
                                            className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${
                                                isCollected 
                                                    ? 'border-yellow-400 shadow-lg shadow-yellow-500/20 hover:scale-105 cursor-pointer' 
                                                    : 'border-gray-200 opacity-50 cursor-not-allowed grayscale'
                                            }`}
                                        >
                                            {artwork ? (
                                                <img 
                                                    src={artwork} 
                                                    alt={bird.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex flex-col items-center justify-center">
                                                    <span className="text-4xl mb-2">🦅</span>
                                                    <span className="text-white text-xs font-bold">{bird.name}</span>
                                                </div>
                                            )}
                                            
                                            {!isCollected && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                    <Lock size={32} className="text-white/50" />
                                                </div>
                                            )}
                                            
                                            {isCollected && (
                                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                                    <span className="text-white text-xs font-bold">{bird.name}</span>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            
                            {collectedLegendary.length === 0 && (
                                <div className="text-center py-8 text-gray-400">
                                    <Sparkles size={48} className="mx-auto mb-4 opacity-30" />
                                    <p>Noch keine legendären Karten.</p>
                                    <p className="text-sm">Finde legendäre Vögel um Karten zu sammeln!</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Badges List */}
                            {Object.entries(categories).map(([key, cat]) => (
                                <div key={key} className="animate-slide-up">
                                    <h3 className="font-bold text-teal mb-3 flex items-center gap-2 text-sm uppercase tracking-wider opacity-80 bg-teal/5 p-2 rounded-lg">
                                        {cat.icon} {cat.label}
                                    </h3>
                                    <div className="grid grid-cols-4 gap-3">
                                        {cat.badges.map(badge => {
                                            const isUnlocked = userBadges.includes(badge.id);
                                            return (
                                                <button 
                                                    key={badge.id} 
                                                    onClick={() => setSelectedBadge(badge)}
                                                    className={`aspect-square rounded-2xl p-1 flex flex-col items-center justify-center text-center border transition-all active:scale-95 relative ${isUnlocked ? 'bg-orange/5 border-orange shadow-sm' : 'bg-gray-50 border-gray-100 opacity-40'}`}
                                                >
                                                    <div className="text-2xl mb-1">{badge.icon}</div>
                                                    {!isUnlocked && <Lock size={10} className="absolute top-1 right-1 text-gray-400" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="border-t border-gray-100 pt-6 mt-6">
                        <button 
                            onClick={onLogout}
                            className="w-full flex items-center justify-center gap-2 text-red-500 font-bold text-sm p-3 hover:bg-red-50 rounded-xl transition-colors"
                        >
                            <LogOut size={16} />
                            Profil löschen / Neu starten
                        </button>
                    </div>
                </div>

                {/* Badge Details Overlay */}
                {selectedBadge && (
                    <div className="absolute inset-0 z-20 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in p-4">
                        <div className="bg-white w-full rounded-3xl p-6 shadow-xl animate-slide-up relative">
                            <button onClick={() => setSelectedBadge(null)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                                <X size={16} />
                            </button>

                            <div className="text-center">
                                <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-5xl mb-4 ${userBadges.includes(selectedBadge.id) ? 'bg-orange/10 text-orange' : 'bg-gray-100 grayscale opacity-50'}`}>
                                    {selectedBadge.icon}
                                </div>
                                <h3 className="text-xl font-bold text-teal mb-1">{selectedBadge.title}</h3>
                                <p className="text-sm text-gray-500 mb-6 px-4">{selectedBadge.description}</p>
                                
                                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                                    <div className="text-xs font-bold text-gray-400 uppercase mb-2">Anforderung</div>
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <ArrowRight size={14} className="text-teal" />
                                        {selectedBadge.condition === 'count' && `Sammle ${selectedBadge.threshold} Vögel` + (selectedBadge.category === 'streak' ? ' in Folge' : '')}
                                        {selectedBadge.condition === 'family_count' && `Sammle ${selectedBadge.threshold} Arten dieser Familie`}
                                        {selectedBadge.condition === 'time' && `Logge einen Vogel zwischen ${selectedBadge.startHour}:00 und ${selectedBadge.endHour}:00 Uhr`}
                                        {selectedBadge.condition === 'level' && `Erreiche Level ${selectedBadge.threshold}`}
                                        {selectedBadge.condition === 'rarity' && `Finde einen Vogel der Kategorie '${selectedBadge.targetValue}'`}
                                        {selectedBadge.condition === 'specific' && 'Finde diesen speziellen Vogel'}
                                        {selectedBadge.condition === 'location' && 'Nutze den Urlaubsmodus'}
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-400">BELOHNUNG</span>
                                        <span className="text-orange font-bold">+{selectedBadge.xpReward} XP</span>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => setSelectedBadge(null)}
                                    className="w-full py-3 bg-teal text-white rounded-xl font-bold"
                                >
                                    {userBadges.includes(selectedBadge.id) ? 'Super!' : 'Noch gesperrt'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
