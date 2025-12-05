import React, { useState, useEffect } from 'react';
import { X, Users, Copy, Check, Share2, Crown, LogOut, Edit3, UserPlus, Loader2, Flame, Award } from 'lucide-react';
import { UserProfile, Swarm, SwarmMember } from '../types';
import { SWARM_BADGES } from '../constants';
import { 
    createSwarm, 
    joinSwarm, 
    leaveSwarm, 
    renameSwarm, 
    getSwarmDetails, 
    getSwarmCollection,
    MAX_MEMBERS 
} from '../services/swarmService';

interface SwarmViewProps {
    currentUser: UserProfile;
    swarm: Swarm | null;
    onSwarmChange: (swarm: Swarm | null) => void;
    onClose: () => void;
}

export const SwarmView: React.FC<SwarmViewProps> = ({ 
    currentUser, 
    swarm, 
    onSwarmChange, 
    onClose 
}) => {
    const [activeTab, setActiveTab] = useState<'info' | 'badges'>('info');
    const [members, setMembers] = useState<SwarmMember[]>([]);
    const [swarmBirdIds, setSwarmBirdIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    
    const [showCreate, setShowCreate] = useState(false);
    const [showJoin, setShowJoin] = useState(false);
    const [newSwarmName, setNewSwarmName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    
    const [copied, setCopied] = useState(false);

    // Load swarm details
    useEffect(() => {
        const loadData = async () => {
            if (!swarm?.id) return;
            
            setLoading(true);
            
            const [detailsResult, collectionResult] = await Promise.all([
                getSwarmDetails(swarm.id),
                getSwarmCollection(swarm.id)
            ]);
            
            if (detailsResult.swarm) {
                onSwarmChange(detailsResult.swarm);
            }
            setMembers(detailsResult.members);
            setSwarmBirdIds(collectionResult);
            
            setLoading(false);
        };
        
        loadData();
    }, [swarm?.id]);

    const handleCreate = async () => {
        if (!newSwarmName.trim() || newSwarmName.length < 3) {
            setError('Name muss mindestens 3 Zeichen haben.');
            return;
        }
        
        setLoading(true);
        setError(null);
        
        const result = await createSwarm(currentUser.id, newSwarmName);
        
        if (result.success && result.swarm) {
            onSwarmChange(result.swarm);
            setSuccess('Schwarm erstellt!');
            setShowCreate(false);
            setNewSwarmName('');
        } else {
            setError(result.error || 'Fehler beim Erstellen.');
        }
        
        setLoading(false);
    };

    const handleJoin = async () => {
        if (joinCode.length !== 6) {
            setError('Code muss 6 Zeichen haben.');
            return;
        }
        
        setLoading(true);
        setError(null);
        
        const result = await joinSwarm(currentUser.id, joinCode);
        
        if (result.success && result.swarm) {
            onSwarmChange(result.swarm);
            setSuccess('Schwarm beigetreten!');
            setShowJoin(false);
            setJoinCode('');
        } else {
            setError(result.error || 'Fehler beim Beitreten.');
        }
        
        setLoading(false);
    };

    const handleLeave = async () => {
        if (!swarm) return;
        
        const isFounderUser = swarm.founderId === currentUser.id;
        const message = isFounderUser && members.length > 1
            ? 'Du bist der Gründer. Wenn du gehst, wird ein anderes Mitglied zum Gründer. Wirklich verlassen?'
            : isFounderUser && members.length === 1
                ? 'Du bist das letzte Mitglied. Der Schwarm wird gelöscht. Wirklich verlassen?'
                : 'Möchtest du den Schwarm wirklich verlassen?';
        
        if (!confirm(message)) return;
        
        setLoading(true);
        const result = await leaveSwarm(currentUser.id);
        
        if (result.success) {
            onSwarmChange(null);
            setSuccess('Schwarm verlassen.');
        } else {
            setError(result.error || 'Fehler beim Verlassen.');
        }
        
        setLoading(false);
    };

    const handleRename = async () => {
        if (!swarm?.id || !editName.trim() || editName.length < 3) {
            setError('Name muss mindestens 3 Zeichen haben.');
            return;
        }
        
        setLoading(true);
        const result = await renameSwarm(currentUser.id, swarm.id, editName);
        
        if (result.success) {
            onSwarmChange({ ...swarm, name: editName.trim() });
            setIsEditing(false);
            setSuccess('Name geändert!');
        } else {
            setError(result.error || 'Fehler beim Umbenennen.');
        }
        
        setLoading(false);
    };

    const copyInviteCode = () => {
        if (!swarm) return;
        navigator.clipboard.writeText(swarm.inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareInvite = async () => {
        if (!swarm) return;
        const url = `https://birdnerd.app/s/${swarm.inviteCode}`;
        const text = `Komm in meinen Schwarm "${swarm.name}" auf BirdNerd! 🐦`;
        
        if (navigator.share) {
            try {
                await navigator.share({ title: 'BirdNerd Schwarm', text, url });
            } catch (e) {
                // User cancelled
            }
        } else {
            navigator.clipboard.writeText(`${text}\n${url}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    useEffect(() => {
        if (error) {
            const t = setTimeout(() => setError(null), 4000);
            return () => clearTimeout(t);
        }
    }, [error]);

    useEffect(() => {
        if (success) {
            const t = setTimeout(() => setSuccess(null), 3000);
            return () => clearTimeout(t);
        }
    }, [success]);

    const isFounder = swarm?.founderId === currentUser.id;
    const collectionCount = swarmBirdIds.length;
    const currentStreak = swarm?.currentStreak || 0;
    const longestStreak = swarm?.longestStreak || 0;
    const swarmBadges = swarm?.badges || [];

    const getNextBadge = () => {
        for (const badge of SWARM_BADGES) {
            if (!swarmBadges.includes(badge.id)) {
                return badge;
            }
        }
        return null;
    };

    const nextBadge = getNextBadge();

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in">
            <div className="bg-white w-full max-w-md max-h-[85vh] rounded-t-3xl sm:rounded-3xl overflow-hidden animate-slide-up flex flex-col">
                <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🪺</span>
                        <h2 className="font-bold text-lg text-teal">
                            {swarm ? swarm.name : 'Schwarm'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mx-4 mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
                        {success}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-4">
                    {!swarm && !showCreate && !showJoin && (
                        <div className="space-y-4">
                            <div className="text-center py-8">
                                <div className="text-6xl mb-4">🐦‍⬛</div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Noch kein Schwarm</h3>
                                <p className="text-gray-500 text-sm">
                                    Gründe einen Schwarm oder tritt einem bei, um gemeinsam alle 322 Vogelarten Deutschlands zu sammeln!
                                </p>
                            </div>

                            <button
                                onClick={() => setShowCreate(true)}
                                className="w-full py-4 bg-teal text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-teal/90 transition-all"
                            >
                                <Users size={20} />
                                Schwarm gründen
                            </button>

                            <button
                                onClick={() => setShowJoin(true)}
                                className="w-full py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
                            >
                                <UserPlus size={20} />
                                Mit Code beitreten
                            </button>
                        </div>
                    )}

                    {showCreate && (
                        <div className="space-y-4">
                            <button onClick={() => setShowCreate(false)} className="text-sm text-gray-500 hover:text-gray-700">
                                ← Zurück
                            </button>
                            <h3 className="text-lg font-bold text-gray-800">Schwarm gründen</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">Schwarm-Name</label>
                                <input
                                    type="text"
                                    value={newSwarmName}
                                    onChange={(e) => setNewSwarmName(e.target.value)}
                                    placeholder="z.B. Vogelfreunde Berlin"
                                    maxLength={50}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none"
                                />
                                <p className="text-xs text-gray-400 mt-1">{newSwarmName.length}/50 Zeichen</p>
                            </div>
                            <button
                                onClick={handleCreate}
                                disabled={loading || newSwarmName.length < 3}
                                className="w-full py-4 bg-teal text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-teal/90 transition-all disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Users size={20} />}
                                Schwarm erstellen
                            </button>
                        </div>
                    )}

                    {showJoin && (
                        <div className="space-y-4">
                            <button onClick={() => setShowJoin(false)} className="text-sm text-gray-500 hover:text-gray-700">
                                ← Zurück
                            </button>
                            <h3 className="text-lg font-bold text-gray-800">Schwarm beitreten</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">Einladungscode</label>
                                <input
                                    type="text"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                    placeholder="ABC123"
                                    maxLength={6}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none text-center text-2xl tracking-widest font-mono"
                                />
                            </div>
                            <button
                                onClick={handleJoin}
                                disabled={loading || joinCode.length !== 6}
                                className="w-full py-4 bg-teal text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-teal/90 transition-all disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
                                Beitreten
                            </button>
                        </div>
                    )}

                    {swarm && (
                        <div className="space-y-4">
                            <div className="flex p-1 bg-gray-100 rounded-xl">
                                <button
                                    onClick={() => setActiveTab('info')}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${activeTab === 'info' ? 'bg-white text-teal shadow-sm' : 'text-gray-400'}`}
                                >
                                    <Users size={14} /> Info
                                </button>
                                <button
                                    onClick={() => setActiveTab('badges')}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${activeTab === 'badges' ? 'bg-white text-teal shadow-sm' : 'text-gray-400'}`}
                                >
                                    <Award size={14} /> Badges
                                </button>
                            </div>

                            {activeTab === 'info' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="bg-teal/10 rounded-xl p-3 text-center">
                                            <div className="text-2xl font-bold text-teal">{collectionCount}</div>
                                            <div className="text-[10px] text-gray-500">Arten</div>
                                        </div>
                                        <div className="bg-orange/10 rounded-xl p-3 text-center">
                                            <div className="text-2xl font-bold text-orange flex items-center justify-center gap-1">
                                                {currentStreak}
                                                <Flame size={18} className="text-orange" />
                                            </div>
                                            <div className="text-[10px] text-gray-500">Streak</div>
                                        </div>
                                        <div className="bg-purple-100 rounded-xl p-3 text-center">
                                            <div className="text-2xl font-bold text-purple-600">{swarmBadges.length}</div>
                                            <div className="text-[10px] text-gray-500">Badges</div>
                                        </div>
                                    </div>

                                    {currentStreak > 0 && (
                                        <div className="bg-gradient-to-r from-orange/10 to-red-100 rounded-xl p-3 flex items-center gap-3">
                                            <div className="text-3xl">🔥</div>
                                            <div className="flex-1">
                                                <div className="font-bold text-gray-800">{currentStreak} Tage Schwarm-Streak!</div>
                                                <div className="text-xs text-gray-500">Längster Streak: {longestStreak} Tage</div>
                                            </div>
                                        </div>
                                    )}

                                    {nextBadge && (
                                        <div className="bg-gray-50 rounded-xl p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs text-gray-500 font-medium">Nächstes Badge</span>
                                                <span className="text-xs font-bold text-teal">{collectionCount}/{nextBadge.threshold}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{nextBadge.emoji}</span>
                                                <div className="flex-1">
                                                    <div className="font-bold text-sm text-gray-800">{nextBadge.name}</div>
                                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                                                        <div 
                                                            className="h-full bg-gradient-to-r from-teal to-orange rounded-full transition-all duration-500"
                                                            style={{ width: `${Math.min((collectionCount / nextBadge.threshold) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-gray-400 mt-2 text-center">
                                                Noch {nextBadge.threshold - collectionCount} Arten bis +{nextBadge.xpReward} XP für alle!
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-gray-50 rounded-2xl p-4">
                                        <div className="flex items-center justify-between">
                                            {isEditing ? (
                                                <div className="flex-1 flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        maxLength={50}
                                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                        autoFocus
                                                    />
                                                    <button onClick={handleRename} disabled={loading} className="px-3 py-2 bg-teal text-white rounded-lg text-sm">
                                                        {loading ? '...' : '✓'}
                                                    </button>
                                                    <button onClick={() => setIsEditing(false)} className="px-3 py-2 bg-gray-200 rounded-lg text-sm">✕</button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div>
                                                        <div className="text-xs text-gray-400 uppercase tracking-wide">Schwarm</div>
                                                        <div className="font-bold text-gray-800">{swarm.name}</div>
                                                    </div>
                                                    {isFounder && (
                                                        <button
                                                            onClick={() => { setEditName(swarm.name); setIsEditing(true); }}
                                                            className="p-2 hover:bg-gray-200 rounded-lg"
                                                        >
                                                            <Edit3 size={16} className="text-gray-400" />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-teal/5 border border-teal/20 rounded-2xl p-4 space-y-3">
                                        <div className="text-xs text-teal uppercase tracking-wide font-bold">Einladung</div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-white rounded-xl px-4 py-3 text-center">
                                                <span className="text-2xl font-mono font-bold tracking-widest text-teal">{swarm.inviteCode}</span>
                                            </div>
                                            <button onClick={copyInviteCode} className="p-3 bg-white rounded-xl hover:bg-gray-50 transition-all">
                                                {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} className="text-gray-400" />}
                                            </button>
                                        </div>
                                        <button
                                            onClick={shareInvite}
                                            className="w-full py-3 bg-teal text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-teal/90 transition-all"
                                        >
                                            <Share2 size={18} />
                                            Link teilen
                                        </button>
                                        <p className="text-xs text-center text-gray-400">birdnerd.app/s/{swarm.inviteCode}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs text-gray-400 uppercase tracking-wide font-bold">Mitglieder</div>
                                            <div className="text-xs text-gray-400">{members.length}/{MAX_MEMBERS}</div>
                                        </div>
                                        {loading && members.length === 0 ? (
                                            <div className="flex justify-center py-4">
                                                <Loader2 className="animate-spin text-gray-400" size={24} />
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {members.map((member) => (
                                                    <div
                                                        key={member.id}
                                                        className={`flex items-center gap-3 p-3 rounded-xl ${member.id === currentUser.id ? 'bg-teal/5 border border-teal/20' : 'bg-gray-50'}`}
                                                    >
                                                        <img
                                                            src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${member.avatarSeed}`}
                                                            alt={member.name}
                                                            className="w-10 h-10 rounded-full bg-white"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-bold text-sm text-gray-800 truncate">{member.name}</span>
                                                                {member.isFounder && <Crown size={14} className="text-orange-500 shrink-0" />}
                                                            </div>
                                                            <div className="text-xs text-gray-400">{member.xp.toLocaleString()} XP · {member.collectedCount} Vögel</div>
                                                        </div>
                                                        {member.id === currentUser.id && <span className="text-xs text-teal font-medium">Du</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleLeave}
                                        disabled={loading}
                                        className="w-full py-3 text-red-500 font-medium rounded-xl border border-red-200 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <LogOut size={18} />
                                        Schwarm verlassen
                                    </button>
                                </div>
                            )}

                            {activeTab === 'badges' && (
                                <div className="space-y-4">
                                    <div className="bg-gradient-to-r from-teal/10 to-orange/10 rounded-2xl p-4 text-center">
                                        <div className="text-4xl font-bold text-teal mb-1">{collectionCount}/322</div>
                                        <div className="text-sm text-gray-500">Arten gesammelt</div>
                                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden mt-3">
                                            <div 
                                                className="h-full bg-gradient-to-r from-teal to-orange rounded-full transition-all duration-500"
                                                style={{ width: `${(collectionCount / 322) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-xs text-gray-400 uppercase tracking-wide font-bold">Streak-Belohnungen</div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { days: 7, xp: 50, emoji: '🔥' },
                                                { days: 30, xp: 200, emoji: '💪' },
                                                { days: 100, xp: 500, emoji: '🏆' }
                                            ].map((milestone) => {
                                                const achieved = currentStreak >= milestone.days;
                                                return (
                                                    <div key={milestone.days} className={`p-3 rounded-xl text-center ${achieved ? 'bg-orange/10 border border-orange/30' : 'bg-gray-50'}`}>
                                                        <div className={`text-2xl ${achieved ? '' : 'grayscale opacity-40'}`}>{milestone.emoji}</div>
                                                        <div className={`text-xs font-bold ${achieved ? 'text-orange' : 'text-gray-400'}`}>{milestone.days} Tage</div>
                                                        <div className={`text-[10px] ${achieved ? 'text-orange/70' : 'text-gray-300'}`}>+{milestone.xp} XP</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-xs text-gray-400 uppercase tracking-wide font-bold">Sammlungs-Badges</div>
                                        <div className="space-y-2">
                                            {SWARM_BADGES.map((badge) => {
                                                const earned = swarmBadges.includes(badge.id);
                                                const progress = Math.min(collectionCount / badge.threshold, 1);
                                                return (
                                                    <div key={badge.id} className={`p-3 rounded-xl flex items-center gap-3 ${earned ? 'bg-teal/10 border border-teal/30' : 'bg-gray-50'}`}>
                                                        <div className={`text-3xl ${earned ? '' : 'grayscale opacity-40'}`}>{badge.emoji}</div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className={`font-bold text-sm ${earned ? 'text-teal' : 'text-gray-400'}`}>{badge.name}</div>
                                                            <div className="text-xs text-gray-400 truncate">{badge.description}</div>
                                                            {!earned && (
                                                                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                                                                    <div className="h-full bg-teal/50 rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className={`text-right ${earned ? 'text-teal' : 'text-gray-300'}`}>
                                                            {earned ? <Check size={20} /> : <span className="text-xs font-bold">{collectionCount}/{badge.threshold}</span>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-500">
                                        <p>Wenn euer Schwarm ein Badge freischaltet, erhalten <span className="font-bold text-teal">alle Mitglieder</span> den XP-Bonus!</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
