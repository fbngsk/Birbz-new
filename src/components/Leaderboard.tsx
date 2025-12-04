import React, { useState, useEffect } from 'react';
import { Trophy, Users, Globe, Search, UserPlus, Check, Loader2, X, Share2, Bird } from 'lucide-react';
import { LeaderboardScope, UserProfile, LeaderboardEntry, Swarm } from '../types';
import { getAvatarUrl } from '../services/birdService';
import { supabase } from '../lib/supabaseClient';
import { UserProfileModal } from './UserProfileModal';

interface LeaderboardProps {
    currentUser: UserProfile;
    currentXp: number;
    swarm: Swarm | null;
    onUpdateFriends: (newFriends: string[]) => void;
    onOpenSwarmView: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ 
    currentUser, 
    currentXp, 
    swarm,
    onUpdateFriends,
    onOpenSwarmView
}) => {
    const [scope, setScope] = useState<LeaderboardScope>(swarm ? 'swarm' : 'friends');
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Friend Search State
    const [showSearch, setShowSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [copied, setCopied] = useState(false);
    const [guestMessage, setGuestMessage] = useState(false);
    
    // User Profile Modal State
    const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null);

    // Fetch Leaderboard Data
    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            try {
                // GUEST MODE
                if (!currentUser.id) {
                    const guestEntry: LeaderboardEntry = {
                        id: 'guest',
                        rank: 1,
                        name: currentUser.name,
                        xp: currentXp,
                        avatarSeed: currentUser.avatarSeed,
                        isUser: true
                    };
                    setLeaderboardData([guestEntry]);
                    setLoading(false);
                    return;
                }

                let query = supabase
                    .from('profiles')
                    .select('id, name, xp, avatar_seed, swarm_id')
                    .order('xp', { ascending: false })
                    .limit(50);

                if (scope === 'friends') {
                    const circleIds = [currentUser.id, ...(currentUser.friends || [])];
                    const safeIds = circleIds.filter(id => id);
                    if (safeIds.length > 0) {
                        query = query.in('id', safeIds);
                    } else {
                        query = query.eq('id', currentUser.id);
                    }
                } else if (scope === 'swarm') {
                    if (swarm?.id) {
                        query = query.eq('swarm_id', swarm.id);
                    } else {
                        // Kein Schwarm - leere Liste
                        setLeaderboardData([]);
                        setLoading(false);
                        return;
                    }
                }
                // scope === 'global' -> keine Filter

                const { data, error } = await query;
                if (error) throw error;

                if (data) {
                    const mapped: LeaderboardEntry[] = data.map((p: any) => ({
                        id: p.id,
                        rank: 0,
                        name: p.name,
                        xp: p.id === currentUser.id ? Math.max(p.xp, currentXp) : p.xp,
                        avatarSeed: p.avatar_seed,
                        isUser: p.id === currentUser.id,
                        isFounder: scope === 'swarm' && swarm?.founderId === p.id
                    }));
                    
                    const ranked = mapped.sort((a, b) => b.xp - a.xp).map((entry, idx) => ({
                        ...entry,
                        rank: idx + 1
                    }));

                    setLeaderboardData(ranked);
                }
            } catch (err: any) {
                console.error("Error fetching leaderboard:", err.message || err);
                setLeaderboardData([{
                    rank: 1,
                    name: currentUser.name,
                    xp: currentXp,
                    avatarSeed: currentUser.avatarSeed,
                    isUser: true
                }]);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [scope, currentUser.friends, currentUser.id, currentXp, swarm]);

    // Search Users
    const handleSearch = async () => {
        if (!searchTerm.trim()) return;
        setSearching(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, avatar_seed')
                .ilike('name', `%${searchTerm}%`)
                .limit(10);
            
            if (data) {
                setSearchResults(data.filter((u: any) => u.id !== currentUser.id));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSearching(false);
        }
    };

    // Add Friend
    const addFriend = async (friendId: string) => {
        if (!currentUser.id) {
            setGuestMessage(true);
            setTimeout(() => setGuestMessage(false), 3000);
            return;
        }

        const currentFriends = currentUser.friends || [];
        if (currentFriends.includes(friendId)) return;

        const newFriends = [...currentFriends, friendId];
        onUpdateFriends(newFriends);

        await supabase
            .from('profiles')
            .update({ friends: newFriends })
            .eq('id', currentUser.id);
    };

    const copyMyName = () => {
        navigator.clipboard.writeText(currentUser.name);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="px-6 pt-2">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative">
                
                {/* Header & Tabs */}
                <div className="bg-teal/5 p-4 border-b border-teal/10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-teal flex items-center gap-2">
                            <Trophy size={18} className="text-orange" />
                            Bestenliste
                        </h3>
                        <button 
                            onClick={() => setShowSearch(true)}
                            className="text-xs bg-teal text-white px-3 py-1.5 rounded-full font-bold flex items-center gap-1 hover:bg-teal-800 active:scale-95 transition-all shadow-sm shadow-teal/20"
                        >
                            <UserPlus size={12} />
                            Freunde finden
                        </button>
                    </div>
                    
                    {/* 3 Tabs */}
                    <div className="flex p-1 bg-gray-100 rounded-xl">
                        <button 
                            onClick={() => setScope('friends')} 
                            className={`flex-1 py-2 px-1 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${scope === 'friends' ? 'bg-white text-teal shadow-sm' : 'text-gray-400'}`}
                        >
                            <Users size={12}/> Freunde
                        </button>
                        <button 
                            onClick={() => setScope('swarm')} 
                            className={`flex-1 py-2 px-1 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${scope === 'swarm' ? 'bg-white text-teal shadow-sm' : 'text-gray-400'}`}
                        >
                            <Bird size={12}/> Schwarm
                        </button>
                        <button 
                            onClick={() => setScope('global')} 
                            className={`flex-1 py-2 px-1 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${scope === 'global' ? 'bg-white text-teal shadow-sm' : 'text-gray-400'}`}
                        >
                            <Globe size={12}/> Global
                        </button>
                    </div>
                </div>

                {/* Guest Message Banner */}
                {guestMessage && (
                    <div className="mx-4 mt-2 p-3 bg-orange-100 border border-orange-200 rounded-xl text-center animate-fade-in">
                        <p className="text-sm text-orange-800 font-medium">
                            Erstelle ein Konto, um Freunde hinzuzufügen!
                        </p>
                    </div>
                )}

                {/* Schwarm Info Banner */}
                {scope === 'swarm' && swarm && (
                    <div className="mx-4 mt-3 p-3 bg-orange/10 border border-orange/20 rounded-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-bold text-teal text-sm">{swarm.name}</div>
                                <div className="text-xs text-gray-500">{swarm.memberCount}/10 Mitglieder</div>
                            </div>
                            <button 
                                onClick={onOpenSwarmView}
                                className="text-xs bg-orange text-white px-3 py-1.5 rounded-full font-bold hover:bg-orange-600 transition-all"
                            >
                                Verwalten
                            </button>
                        </div>
                    </div>
                )}

                {/* List Content */}
                <div className="divide-y divide-gray-50 min-h-[250px]">
                    {loading ? (
                        <div className="flex justify-center items-center h-40 text-teal">
                            <Loader2 className="animate-spin" />
                        </div>
                    ) : leaderboardData.length === 0 ? (
                        <div className="text-center p-8 flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-2xl">
                                {scope === 'swarm' ? '🪺' : '🦗'}
                            </div>
                            {scope === 'swarm' && !swarm ? (
                                <>
                                    <p className="text-gray-400 text-sm mb-4 font-medium">Du bist noch in keinem Schwarm.</p>
                                    <button 
                                        onClick={onOpenSwarmView}
                                        className="bg-orange text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg shadow-orange/20 hover:bg-orange-600 transition-all"
                                    >
                                        Schwarm erstellen oder beitreten
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p className="text-gray-400 text-sm mb-4 font-medium">Noch ist es hier still.</p>
                                    <button 
                                        onClick={() => setShowSearch(true)} 
                                        className="bg-orange text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg shadow-orange/20 hover:bg-orange-600 transition-all"
                                    >
                                        Jetzt Freunde einladen!
                                    </button>
                                </>
                            )}
                        </div>
                    ) : (
                        leaderboardData.map((entry) => (
                            <div 
                                key={entry.id || entry.rank} 
                                className={`flex items-center gap-3 p-3 transition-colors cursor-pointer ${entry.isUser ? 'bg-orange/5' : 'hover:bg-gray-50 active:bg-gray-100'}`}
                                onClick={() => !entry.isUser && entry.id && setSelectedUser(entry)}
                            >
                                <div className={`w-6 text-center font-bold text-sm ${entry.rank <= 3 ? 'text-orange' : 'text-gray-400'}`}>
                                    {entry.rank}.
                                </div>
                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-100 shrink-0 relative">
                                    <img src={getAvatarUrl(entry.avatarSeed)} alt="Avatar" className="w-full h-full object-cover"/>
                                    {entry.rank === 1 && <div className="absolute -top-1 -right-1 bg-yellow-400 text-[8px] w-4 h-4 flex items-center justify-center rounded-full border border-white">👑</div>}
                                    {entry.isFounder && entry.rank !== 1 && <div className="absolute -top-1 -right-1 bg-teal text-[8px] w-4 h-4 flex items-center justify-center rounded-full border border-white text-white">★</div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`font-bold text-sm truncate ${entry.isUser ? 'text-teal' : 'text-gray-700'}`}>
                                        {entry.name} {entry.isUser && '(Du)'}
                                    </div>
                                    {entry.isFounder && (
                                        <div className="text-[10px] text-teal font-bold">
                                            Schwarm-Gründer
                                        </div>
                                    )}
                                </div>
                                <div className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 min-w-[60px] text-center">
                                    {entry.xp} XP
                                </div>
                            </div>
                        ))
                    )}
                    
                    {/* Empty state for friends */}
                    {scope === 'friends' && leaderboardData.length === 1 && leaderboardData[0].isUser && (
                         <div className="p-4 text-center border-t border-gray-50">
                             <p className="text-xs text-gray-400 mb-2">Du bist allein in deiner Freundesliste.</p>
                             <button onClick={() => setShowSearch(true)} className="text-teal font-bold text-xs hover:underline">
                                 + Freunde hinzufügen
                             </button>
                         </div>
                    )}
                </div>

                {/* Search / Add Friend Overlay */}
                {showSearch && (
                    <div className="absolute inset-0 bg-white z-20 animate-fade-in flex flex-col">
                        <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-teal/5">
                            <Search size={18} className="text-teal" />
                            <input 
                                type="text"
                                autoFocus
                                placeholder="Nutzername suchen..."
                                className="flex-1 outline-none text-sm font-bold text-teal bg-transparent placeholder:text-teal/40 placeholder:font-normal"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <button 
                                onClick={() => { setShowSearch(false); setSearchTerm(''); setSearchResults([]); }} 
                                className="p-2 bg-white rounded-full hover:bg-gray-100 text-gray-400 shadow-sm"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* My Profile Card (For Sharing) */}
                        {!searchTerm && (
                            <div className="p-6 border-b border-gray-100 bg-orange/5">
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="w-16 h-16 rounded-full border-2 border-white shadow-md overflow-hidden">
                                        <img src={getAvatarUrl(currentUser.avatarSeed)} className="w-full h-full object-cover"/>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-orange uppercase">Dein Name</div>
                                        <div className="text-2xl font-bold text-teal">{currentUser.name}</div>
                                    </div>
                                </div>
                                <button 
                                    onClick={copyMyName}
                                    className="w-full py-3 bg-white border border-orange/20 text-orange rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-orange/10 transition-colors active:scale-95"
                                >
                                    {copied ? <Check size={16} /> : <Share2 size={16} />}
                                    {copied ? 'Kopiert!' : 'Namen kopieren & teilen'}
                                </button>
                            </div>
                        )}
                        
                        <div className="flex-1 overflow-y-auto p-2 bg-gray-50/50">
                            {searching && <div className="text-center p-8 text-gray-400"><Loader2 className="animate-spin mx-auto mb-2"/> Suche läuft...</div>}
                            
                            {searchResults.length > 0 && <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase">Ergebnisse</div>}

                            <div className="space-y-2">
                                {searchResults.map(user => {
                                    const isFriend = (currentUser.friends || []).includes(user.id);
                                    return (
                                        <div key={user.id} className="flex items-center justify-between p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-100">
                                                    <img src={getAvatarUrl(user.avatar_seed)} className="w-full h-full object-cover"/>
                                                </div>
                                                <span className="font-bold text-teal text-sm">{user.name}</span>
                                            </div>
                                            <button 
                                                onClick={() => addFriend(user.id)}
                                                disabled={isFriend}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${isFriend ? 'bg-green-100 text-green-600' : 'bg-teal text-white hover:bg-teal-800 active:scale-95 shadow-sm shadow-teal/20'}`}
                                            >
                                                {isFriend ? <Check size={12}/> : <UserPlus size={12}/>}
                                                {isFriend ? 'Freund' : 'Adden'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {!searching && searchTerm && searchResults.length === 0 && (
                                <div className="text-center text-gray-400 mt-8 text-sm">
                                    Keinen Nutzer mit diesem Namen gefunden.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {/* User Profile Modal */}
            {selectedUser && selectedUser.id && (
                <UserProfileModal
                    userId={selectedUser.id}
                    userName={selectedUser.name}
                    avatarSeed={selectedUser.avatarSeed}
                    userXp={selectedUser.xp}
                    onClose={() => setSelectedUser(null)}
                />
            )}
        </div>
    );
};
