import { supabase } from '../lib/supabaseClient';
import { Swarm, SwarmMember, SwarmBadge } from '../types';
import { SWARM_BADGES, SWARM_STREAK_BONUSES } from '../constants';

const MAX_SWARM_MEMBERS = 10;

/**
 * Schwarm erstellen
 */
export const createSwarm = async (
    userId: string,
    name: string
): Promise<{ success: boolean; swarm?: Swarm; error?: string }> => {
    try {
        // Check if user already in a swarm
        const { data: profile } = await supabase
            .from('profiles')
            .select('swarm_id')
            .eq('id', userId)
            .single();

        if (profile?.swarm_id) {
            return { success: false, error: 'Du bist bereits in einem Schwarm.' };
        }

        // Generate unique invite code
        let inviteCode = '';
        let attempts = 0;
        while (attempts < 10) {
            const { data } = await supabase.rpc('generate_invite_code');
            inviteCode = data;
            
            // Check if code exists
            const { data: existing } = await supabase
                .from('swarms')
                .select('id')
                .eq('invite_code', inviteCode)
                .single();
            
            if (!existing) break;
            attempts++;
        }

        if (!inviteCode) {
            return { success: false, error: 'Konnte keinen Einladungscode generieren.' };
        }

        // Create swarm
        const { data: swarm, error } = await supabase
            .from('swarms')
            .insert({
                name: name.trim(),
                invite_code: inviteCode,
                founder_id: userId,
                current_streak: 0,
                longest_streak: 0,
                badges: []
            })
            .select()
            .single();

        if (error) throw error;

        // Add founder to swarm
        await supabase
            .from('profiles')
            .update({ swarm_id: swarm.id })
            .eq('id', userId);

        return {
            success: true,
            swarm: {
                id: swarm.id,
                name: swarm.name,
                inviteCode: swarm.invite_code,
                founderId: swarm.founder_id,
                createdAt: swarm.created_at,
                memberCount: 1,
                currentStreak: 0,
                longestStreak: 0,
                badges: []
            }
        };
    } catch (err: any) {
        console.error('Create swarm error:', err);
        return { success: false, error: err.message || 'Fehler beim Erstellen.' };
    }
};

/**
 * Schwarm beitreten via Einladungscode
 */
export const joinSwarm = async (
    userId: string,
    inviteCode: string
): Promise<{ success: boolean; swarm?: Swarm; error?: string }> => {
    try {
        // Check if user already in a swarm
        const { data: profile } = await supabase
            .from('profiles')
            .select('swarm_id')
            .eq('id', userId)
            .single();

        if (profile?.swarm_id) {
            return { success: false, error: 'Du bist bereits in einem Schwarm. Verlasse erst deinen aktuellen Schwarm.' };
        }

        // Find swarm by code
        const { data: swarm, error: swarmError } = await supabase
            .from('swarms')
            .select('*')
            .eq('invite_code', inviteCode.toUpperCase().trim())
            .single();

        if (swarmError || !swarm) {
            return { success: false, error: 'Ungültiger Einladungscode.' };
        }

        // Check member count
        const { count } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('swarm_id', swarm.id);

        if ((count || 0) >= MAX_SWARM_MEMBERS) {
            return { success: false, error: `Dieser Schwarm ist voll (max. ${MAX_SWARM_MEMBERS} Mitglieder).` };
        }

        // Join swarm
        const { error: joinError } = await supabase
            .from('profiles')
            .update({ swarm_id: swarm.id })
            .eq('id', userId);

        if (joinError) throw joinError;

        return {
            success: true,
            swarm: {
                id: swarm.id,
                name: swarm.name,
                inviteCode: swarm.invite_code,
                founderId: swarm.founder_id,
                createdAt: swarm.created_at,
                currentStreak: swarm.current_streak || 0,
                longestStreak: swarm.longest_streak || 0,
                lastLogDate: swarm.last_log_date,
                badges: swarm.badges || []
            }
        };
    } catch (err: any) {
        console.error('Join swarm error:', err);
        return { success: false, error: err.message || 'Fehler beim Beitreten.' };
    }
};

/**
 * Schwarm verlassen
 */
export const leaveSwarm = async (
    userId: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        // Get user's current swarm
        const { data: profile } = await supabase
            .from('profiles')
            .select('swarm_id')
            .eq('id', userId)
            .single();

        if (!profile?.swarm_id) {
            return { success: false, error: 'Du bist in keinem Schwarm.' };
        }

        const swarmId = profile.swarm_id;

        // Get swarm info
        const { data: swarm } = await supabase
            .from('swarms')
            .select('founder_id')
            .eq('id', swarmId)
            .single();

        // Remove user from swarm
        await supabase
            .from('profiles')
            .update({ swarm_id: null })
            .eq('id', userId);

        // If user was founder, transfer or delete swarm
        if (swarm?.founder_id === userId) {
            // Find next oldest member
            const { data: nextMember } = await supabase
                .from('profiles')
                .select('id')
                .eq('swarm_id', swarmId)
                .order('id', { ascending: true })
                .limit(1)
                .single();

            if (nextMember) {
                // Transfer ownership
                await supabase
                    .from('swarms')
                    .update({ founder_id: nextMember.id })
                    .eq('id', swarmId);
            } else {
                // No members left, delete swarm
                await supabase
                    .from('swarms')
                    .delete()
                    .eq('id', swarmId);
            }
        }

        return { success: true };
    } catch (err: any) {
        console.error('Leave swarm error:', err);
        return { success: false, error: err.message || 'Fehler beim Verlassen.' };
    }
};

/**
 * Schwarm umbenennen (nur Gründer)
 */
export const renameSwarm = async (
    userId: string,
    swarmId: string,
    newName: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const { data: swarm } = await supabase
            .from('swarms')
            .select('founder_id')
            .eq('id', swarmId)
            .single();

        if (swarm?.founder_id !== userId) {
            return { success: false, error: 'Nur der Gründer kann den Schwarm umbenennen.' };
        }

        const { error } = await supabase
            .from('swarms')
            .update({ name: newName.trim() })
            .eq('id', swarmId);

        if (error) throw error;

        return { success: true };
    } catch (err: any) {
        console.error('Rename swarm error:', err);
        return { success: false, error: err.message || 'Fehler beim Umbenennen.' };
    }
};

/**
 * Schwarm-Details laden
 */
export const getSwarmDetails = async (
    swarmId: string
): Promise<{ swarm: Swarm | null; members: SwarmMember[] }> => {
    try {
        // Get swarm
        const { data: swarm } = await supabase
            .from('swarms')
            .select('*')
            .eq('id', swarmId)
            .single();

        if (!swarm) return { swarm: null, members: [] };

        // Get members
        const { data: members } = await supabase
            .from('profiles')
            .select('id, name, avatar_seed, xp, collected_ids')
            .eq('swarm_id', swarmId)
            .order('xp', { ascending: false });

        const mappedMembers: SwarmMember[] = (members || []).map(m => ({
            id: m.id,
            name: m.name,
            avatarSeed: m.avatar_seed,
            xp: m.xp || 0,
            collectedCount: (m.collected_ids || []).filter((id: string) => !id.startsWith('vacation_')).length,
            isFounder: m.id === swarm.founder_id
        }));

        return {
            swarm: {
                id: swarm.id,
                name: swarm.name,
                inviteCode: swarm.invite_code,
                founderId: swarm.founder_id,
                createdAt: swarm.created_at,
                memberCount: mappedMembers.length,
                currentStreak: swarm.current_streak || 0,
                longestStreak: swarm.longest_streak || 0,
                lastLogDate: swarm.last_log_date,
                badges: swarm.badges || []
            },
            members: mappedMembers
        };
    } catch (err) {
        console.error('Get swarm details error:', err);
        return { swarm: null, members: [] };
    }
};

/**
 * Schwarm-Sammlung laden (alle unique Vögel, nur lokale - keine Urlaubsvögel)
 */
export const getSwarmCollection = async (
    swarmId: string
): Promise<string[]> => {
    try {
        const { data: members } = await supabase
            .from('profiles')
            .select('collected_ids')
            .eq('swarm_id', swarmId);

        if (!members) return [];

        const allBirdIds = new Set<string>();
        members.forEach(m => {
            (m.collected_ids || []).forEach((id: string) => {
                // Urlaubsvögel ausfiltern - nur lokale Vögel zählen für Schwarm
                if (!id.startsWith('vacation_')) {
                    allBirdIds.add(id);
                }
            });
        });

        return Array.from(allBirdIds);
    } catch (err) {
        console.error('Get swarm collection error:', err);
        return [];
    }
};

/**
 * User's Schwarm laden
 */
export const getUserSwarm = async (
    userId: string
): Promise<Swarm | null> => {
    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('swarm_id')
            .eq('id', userId)
            .single();

        if (!profile?.swarm_id) return null;

        const { data: swarm } = await supabase
            .from('swarms')
            .select('*')
            .eq('id', profile.swarm_id)
            .single();

        if (!swarm) return null;

        // Get member count
        const { count } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('swarm_id', swarm.id);

        return {
            id: swarm.id,
            name: swarm.name,
            inviteCode: swarm.invite_code,
            founderId: swarm.founder_id,
            createdAt: swarm.created_at,
            memberCount: count || 1,
            currentStreak: swarm.current_streak || 0,
            longestStreak: swarm.longest_streak || 0,
            lastLogDate: swarm.last_log_date,
            badges: swarm.badges || []
        };
    } catch (err) {
        console.error('Get user swarm error:', err);
        return null;
    }
};

/**
 * Schwarm via Code finden (für Einladungslinks)
 */
export const getSwarmByCode = async (
    code: string
): Promise<Swarm | null> => {
    try {
        const { data: swarm } = await supabase
            .from('swarms')
            .select('*')
            .eq('invite_code', code.toUpperCase().trim())
            .single();

        if (!swarm) return null;

        const { count } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('swarm_id', swarm.id);

        return {
            id: swarm.id,
            name: swarm.name,
            inviteCode: swarm.invite_code,
            founderId: swarm.founder_id,
            createdAt: swarm.created_at,
            memberCount: count || 0,
            currentStreak: swarm.current_streak || 0,
            longestStreak: swarm.longest_streak || 0,
            lastLogDate: swarm.last_log_date,
            badges: swarm.badges || []
        };
    } catch (err) {
        console.error('Get swarm by code error:', err);
        return null;
    }
};

/**
 * Schwarm-Streak updaten (wird aufgerufen wenn ein Mitglied loggt)
 */
export const updateSwarmStreak = async (
    swarmId: string
): Promise<{ 
    newStreak: number; 
    streakBonus: number; 
    isNewStreakMilestone: boolean;
}> => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Get current swarm data
        const { data: swarm } = await supabase
            .from('swarms')
            .select('current_streak, longest_streak, last_log_date')
            .eq('id', swarmId)
            .single();

        if (!swarm) return { newStreak: 0, streakBonus: 0, isNewStreakMilestone: false };

        const lastLog = swarm.last_log_date;
        let currentStreak = swarm.current_streak || 0;
        let longestStreak = swarm.longest_streak || 0;
        let streakBonus = 0;
        let isNewStreakMilestone = false;

        // Already logged today
        if (lastLog === today) {
            return { newStreak: currentStreak, streakBonus: 0, isNewStreakMilestone: false };
        }

        // Check if yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastLog === yesterdayStr) {
            currentStreak += 1;
        } else {
            // Streak broken, start fresh
            currentStreak = 1;
        }

        // Update longest streak
        if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
        }

        // Check for streak milestones
        if (SWARM_STREAK_BONUSES[currentStreak]) {
            streakBonus = SWARM_STREAK_BONUSES[currentStreak];
            isNewStreakMilestone = true;
        }

        // Save to database
        await supabase
            .from('swarms')
            .update({
                current_streak: currentStreak,
                longest_streak: longestStreak,
                last_log_date: today
            })
            .eq('id', swarmId);

        return { newStreak: currentStreak, streakBonus, isNewStreakMilestone };
    } catch (err) {
        console.error('Update swarm streak error:', err);
        return { newStreak: 0, streakBonus: 0, isNewStreakMilestone: false };
    }
};

/**
 * Schwarm-Badges prüfen und vergeben
 */
export const checkSwarmBadges = async (
    swarmId: string
): Promise<{ 
    newBadges: SwarmBadge[]; 
    totalBonusXp: number;
}> => {
    try {
        // Get current swarm badges
        const { data: swarm } = await supabase
            .from('swarms')
            .select('badges')
            .eq('id', swarmId)
            .single();

        if (!swarm) return { newBadges: [], totalBonusXp: 0 };

        const currentBadges = swarm.badges || [];
        
        // Get swarm collection count
        const collectionIds = await getSwarmCollection(swarmId);
        const collectionCount = collectionIds.length;

        const newBadges: SwarmBadge[] = [];
        let totalBonusXp = 0;

        // Check each badge
        for (const badge of SWARM_BADGES) {
            if (currentBadges.includes(badge.id)) continue;
            
            if (collectionCount >= badge.threshold) {
                newBadges.push(badge);
                totalBonusXp += badge.xpReward;
            }
        }

        // Save new badges
        if (newBadges.length > 0) {
            const updatedBadges = [...currentBadges, ...newBadges.map(b => b.id)];
            await supabase
                .from('swarms')
                .update({ badges: updatedBadges })
                .eq('id', swarmId);
        }

        return { newBadges, totalBonusXp };
    } catch (err) {
        console.error('Check swarm badges error:', err);
        return { newBadges: [], totalBonusXp: 0 };
    }
};

/**
 * Bonus-XP an alle Schwarm-Mitglieder verteilen
 */
export const distributeSwarmBonus = async (
    swarmId: string,
    bonusXp: number
): Promise<void> => {
    try {
        if (bonusXp <= 0) return;

        // Get all members
        const { data: members } = await supabase
            .from('profiles')
            .select('id, xp')
            .eq('swarm_id', swarmId);

        if (!members) return;

        // Update each member's XP
        for (const member of members) {
            await supabase
                .from('profiles')
                .update({ xp: (member.xp || 0) + bonusXp })
                .eq('id', member.id);
        }

        console.log(`[Birbz] Distributed ${bonusXp} XP to ${members.length} swarm members`);
    } catch (err) {
        console.error('Distribute swarm bonus error:', err);
    }
};

export const MAX_MEMBERS = MAX_SWARM_MEMBERS;
