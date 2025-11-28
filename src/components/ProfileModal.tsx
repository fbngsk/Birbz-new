import React, { useState, useEffect } from 'react';
import { X, Award, Trophy, Calendar, LogOut, ArrowRight, Lock, Star, Activity, Users, Clock, MapPin, Sparkles, Share2, Trash2, ExternalLink } from 'lucide-react';
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
    onDeleteAccount?: () => void;
    onShowLegendaryCard?: (bird: Bird) => void;
}

type ProfileTab = 'badges' | 'stats' | 'cards';

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, xp, collectedCount, collectedIds, onClose, onLogout, onDeleteAccount, onShowLegendaryCard }) => {
    const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
    const [activeTab, setActiveTab] = useState<ProfileTab>('badges');
    const [shareSuccess, setShareSuccess] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showLegal, setShowLegal] = useState(false);
    
    // Block body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);
    
    const getLevelInfo = (currentXp: number) => {
        return LEVEL_THRESHOLDS.find(l => currentXp < l.max) || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    };
    const levelInfo = getLevelInfo(xp);
    const userBadges = user.badges || [];
    
    // Challenge share messages
    const challengeMessages = [
        `🐦 ${user.name} fordert dich zum Vogelduell! Mit ${collectedCount} Arten und ${xp} XP – schaffst du mehr?`,
        `🔥 ${user.name} hat ${collectedCount} Vogelarten entdeckt! Traust du dich zum Duell?`,
        `👀 ${user.name} ist Level ${levelInfo.level} bei Birbz! Kannst du das toppen?`,
        `🏆 ${collectedCount} Vögel, ${xp} XP – ${user.name} wartet auf Herausforderer!`,
        `🦅 ${user.name} ruft zum großen Vogelduell! Wer entdeckt mehr Arten?`,
    ];
    
    const handleShareChallenge = async () => {
        const message = challengeMessages[Math.floor(Math.random() * challengeMessages.length)];
        const url = 'https://birbz-new.vercel.app';
        const fullText = `${message}\n\n${url}`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Birbz Challenge',
                    text: message,
                    url: url,
                });
            } catch (err) {
                // User cancelled or error - fallback to clipboard
                if ((err as Error).name !== 'AbortError') {
                    await navigator.clipboard.writeText(fullText);
                    setShareSuccess(true);
                    setTimeout(() => setShareSuccess(false), 2000);
                }
            }
        } else {
            // Fallback: copy to clipboard
            await navigator.clipboard.writeText(fullText);
            setShareSuccess(true);
            setTimeout(() => setShareSuccess(false), 2000);
        }
    };
    
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
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-hidden"
            onTouchMove={(e) => e.stopPropagation()}
        >
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh]">
                
                {/* Compact Header */}
                <div className="bg-teal p-4 relative">
                    <button onClick={onClose} className="absolute top-3 right-3 p-2 text-white/80 hover:text-white bg-white/10 rounded-full">
                        <X size={20}/>
                    </button>
                    
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-full border-3 border-orange p-0.5 shadow-lg relative flex-shrink-0">
                            <img src={getAvatarUrl(user.avatarSeed)} alt="Avatar" className="rounded-full w-full h-full object-cover"/>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange text-white font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm text-xs">
                                {levelInfo.level}
                            </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-bold text-white truncate">{user.name}</h2>
                            <p className="text-teal-100 text-sm">{user.homeRegion}</p>
                            <div className="flex gap-3 mt-1 text-white/90 text-xs">
                                <span><strong>{xp}</strong> XP</span>
                                <span><strong>{collectedCount}</strong> Vögel</span>
                                <span><strong>{userBadges.length}</strong>/{BADGES_DB.length} Badges</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Challenge Share Button */}
                <div className="px-4 py-3 border-b border-gray-100">
                    <button 
                        onClick={handleShareChallenge}
                        className="w-full py-2.5 bg-gradient-to-r from-orange to-orange-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm text-sm"
                    >
                        <Share2 size={16} />
                        {shareSuccess ? 'Link kopiert! 🎉' : 'Freunde herausfordern'}
                    </button>
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
                
                {/* Delete Account Confirmation */}
                {showDeleteConfirm && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
                            <h3 className="text-lg font-bold text-red-600 mb-2">Konto löschen?</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Alle deine Daten werden unwiderruflich gelöscht: Profil, gesammelte Vögel, XP, Badges und Statistiken.
                            </p>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold"
                                >
                                    Abbrechen
                                </button>
                                <button 
                                    onClick={() => {
                                        onDeleteAccount?.();
                                        setShowDeleteConfirm(false);
                                    }}
                                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold"
                                >
                                    Endgültig löschen
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Legal Info Modal */}
                {showLegal && (
                    <div className="absolute inset-0 bg-white z-50 overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-teal">Rechtliches</h3>
                                <button onClick={() => setShowLegal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="space-y-6 text-sm text-gray-600">
                                <section>
                                    <h4 className="font-bold text-teal mb-2">Impressum</h4>
                                    <p>Schønlein Media GmbH</p>
                                    <p>Tempelhofer Ufer 36</p>
                                    <p>10963 Berlin</p>
                                </section>
                                
                                <section>
                                    <h4 className="font-bold text-teal mb-2">Datenschutz</h4>
                                    <p className="mb-2"><strong>Welche Daten speichern wir?</strong></p>
                                    <ul className="list-disc list-inside space-y-1 mb-3">
                                        <li>E-Mail-Adresse und Passwort (verschlüsselt)</li>
                                        <li>Benutzername und Heimatregion</li>
                                        <li>Gesammelte Vögel, XP, Badges, Streaks</li>
                                        <li>GPS-Standort (gerundet auf 1km, nur wenn erlaubt)</li>
                                    </ul>
                                    
                                    <p className="mb-2"><strong>Warum?</strong></p>
                                    <p className="mb-3">Zur Bereitstellung der App-Funktionen: Sammlung, Statistiken, Bestenliste.</p>
                                    
                                    <p className="mb-2"><strong>Wie lange?</strong></p>
                                    <p className="mb-3">Bis du dein Konto löschst. Dann werden alle Daten unwiderruflich entfernt.</p>
                                    
                                    <p className="mb-2"><strong>Hosting</strong></p>
                                    <p className="mb-3">Daten werden bei Supabase (EU) und Vercel gespeichert.</p>
                                    
                                    <p className="mb-2"><strong>Deine Rechte</strong></p>
                                    <p>Du kannst jederzeit dein Konto löschen (im Profil). Bei Fragen: datenschutz@schonlein.media</p>
                                </section>
                                
                                <section>
                                    <h4 className="font-bold text-teal mb-2">Bildquellen</h4>
                                    <p>Vogelbilder und Beschreibungen stammen von Wikipedia (CC-Lizenz).</p>
                                </section>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-gray-100 space-y-2">
                    <button 
                        onClick={() => setShowLegal(true)}
                        className="w-full py-2 text-gray-400 text-xs hover:text-gray-600 flex items-center justify-center gap-1"
                    >
                        Impressum & Datenschutz <ExternalLink size={12} />
                    </button>
                    
                    <div className="flex gap-2">
                        <button 
                            onClick={onLogout}
                            className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200"
                        >
                            <LogOut size={16} /> Abmelden
                        </button>
                        <button 
                            onClick={() => setShowDeleteConfirm(true)}
                            className="py-3 px-4 bg-red-50 text-red-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-100"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
