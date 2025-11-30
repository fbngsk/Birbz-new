import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DailyHoroscope } from './components/DailyHoroscope';
import { Leaderboard } from './components/Leaderboard';
import { DexView } from './components/DexView';
import { HomeView } from './components/HomeView';
import { TipsView } from './components/TipsView';
import { QuizView } from './components/QuizView';
import { IdentificationModal } from './components/IdentificationModal';
import { BirdModal } from './components/BirdModal';
import { CelebrationOverlay } from './components/CelebrationOverlay';
import { BadgeOverlay } from './components/BadgeOverlay';
import { StreakOverlay } from './components/StreakOverlay';
import { ProfileModal } from './components/ProfileModal';
import { Onboarding } from './components/Onboarding';
import { LegendaryCard } from './components/LegendaryCard';
import { Bird, TabType, UserProfile, Badge } from './types';
import { BADGES_DB, BIRDS_DB, BIRD_FAMILIES, LEVEL_THRESHOLDS, XP_CONFIG, calculateSightingXP } from './constants';
import { getLegendaryArtwork } from './legendaryArtworks';
import { supabase } from './lib/supabaseClient';

// ========================================
// FEATURE FLAG: Legendary Cards
// ========================================
const ENABLE_LEGENDARY_CARDS = true;

// ========================================
// OFFLINE CACHE HELPERS
// ========================================
const CACHE_VERSION = 2; // Increment when cache structure changes
const CACHE_KEYS = {
    VERSION: 'birbz_cacheVersion',
    USER_PROFILE: 'birbz_userProfile',
    COLLECTED_IDS: 'birbz_collectedIds',
    XP: 'birbz_xp',
    VACATION_BIRDS: 'birbz_vacationBirds',
    KNOWN_LOCATIONS: 'birbz_knownLocations',
    PENDING_SYNC: 'birbz_pendingSync'
};

interface PendingSyncItem {
    type: 'bird_collected' | 'vacation_bird' | 'bird_log';
    data: any;
    timestamp: number;
}

// Check cache version and clear if outdated
const validateCacheVersion = () => {
    try {
        const storedVersion = localStorage.getItem(CACHE_KEYS.VERSION);
        if (storedVersion !== String(CACHE_VERSION)) {
            console.log('[Birbz] Cache version mismatch, clearing old cache');
            Object.values(CACHE_KEYS).forEach(key => {
                if (key !== CACHE_KEYS.VERSION) {
                    localStorage.removeItem(key);
                }
            });
            localStorage.setItem(CACHE_KEYS.VERSION, String(CACHE_VERSION));
        }
    } catch (e) {
        console.warn('[Birbz] Cache version check failed:', e);
    }
};

// Run on module load
validateCacheVersion();

const saveToCache = (key: string, data: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.warn('[Birbz] Cache save failed:', e);
    }
};

const loadFromCache = <T,>(key: string, fallback: T): T => {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return fallback;
        
        const parsed = JSON.parse(cached);
        
        // Basic type validation
        if (parsed === null || parsed === undefined) {
            return fallback;
        }
        
        return parsed;
    } catch (e) {
        // Corrupted data - remove it
        console.warn('[Birbz] Corrupted cache detected, removing:', key);
        try {
            localStorage.removeItem(key);
        } catch {}
        return fallback;
    }
};

const clearCache = () => {
    Object.values(CACHE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
};

const addToSyncQueue = (item: PendingSyncItem) => {
    const queue = loadFromCache<PendingSyncItem[]>(CACHE_KEYS.PENDING_SYNC, []);
    queue.push(item);
    saveToCache(CACHE_KEYS.PENDING_SYNC, queue);
};

const getSyncQueue = (): PendingSyncItem[] => {
    return loadFromCache<PendingSyncItem[]>(CACHE_KEYS.PENDING_SYNC, []);
};

const clearSyncQueue = () => {
    localStorage.removeItem(CACHE_KEYS.PENDING_SYNC);
};
// ========================================

export default function App() {
    const [activeTab, setActiveTab] = useState<TabType>('home');
    const [collectedIds, setCollectedIds] = useState<string[]>([]);
    const [vacationBirds, setVacationBirds] = useState<Bird[]>([]);
    const [xp, setXp] = useState<number>(0);
    const [modalBird, setModalBird] = useState<Bird | null>(null);
    const [showIdentification, setShowIdentification] = useState(false);
    const [celebration, setCelebration] = useState<{ active: boolean; xp: number; bonus?: number }>({ active: false, xp: 0 });
    
    const [newBadge, setNewBadge] = useState<Badge | null>(null);
    const [newStreak, setNewStreak] = useState<number | null>(null);
    const [showProfile, setShowProfile] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    
    const [legendaryCardBird, setLegendaryCardBird] = useState<Bird | null>(null);
    
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isVacationMode, setIsVacationMode] = useState(false);
    const [appLoading, setAppLoading] = useState(true);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const isGuestRef = useRef(false);
    
    const [dailySightings, setDailySightings] = useState<Record<string, number>>({});
    const [lastSightingDate, setLastSightingDate] = useState<string>('');
    const [hasPendingSync, setHasPendingSync] = useState(false);
    const [syncSuccess, setSyncSuccess] = useState(false);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    
    // Process sync queue when coming back online
    const processSyncQueue = async () => {
        if (!navigator.onLine) return;
        if (isGuestRef.current) return;
        
        const queue = getSyncQueue();
        if (queue.length === 0) return;
        
        console.log('[Birbz] Processing sync queue:', queue.length, 'items');
        setHasPendingSync(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        let hasErrors = false;
        const startTime = Date.now();
        
        for (const item of queue) {
            try {
                switch (item.type) {
                    case 'bird_collected':
                        await supabase.from('profiles').update({
                            xp: item.data.xp,
                            collected_ids: item.data.collected_ids,
                            badges: item.data.badges,
                            current_streak: item.data.current_streak,
                            longest_streak: item.data.longest_streak,
                            last_log_date: item.data.last_log_date
                        }).eq('id', user.id);
                        break;
                        
                    case 'vacation_bird':
                        await supabase.from('vacation_birds').upsert(item.data);
                        break;
                        
                    case 'bird_log':
                        await supabase.from('bird_logs').insert(item.data);
                        break;
                }
            } catch (error) {
                console.error('[Birbz] Sync error:', error);
                hasErrors = true;
            }
        }
        
        // Show banner for at least 2 seconds
        const elapsed = Date.now() - startTime;
        const minDisplayTime = 2000;
        if (elapsed < minDisplayTime) {
            await new Promise(resolve => setTimeout(resolve, minDisplayTime - elapsed));
        }
        
        if (!hasErrors) {
            clearSyncQueue();
            setHasPendingSync(false);
            setSyncSuccess(true);
            console.log('[Birbz] Sync complete');
            
            // Hide success banner after 2 seconds
            setTimeout(() => setSyncSuccess(false), 2000);
        }
    };
    
    // Track online/offline status
    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            // Process pending sync when back online
            processSyncQueue();
        };
        const handleOffline = () => setIsOffline(true);
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        // Check for pending items on mount
        const queue = getSyncQueue();
        if (queue.length > 0) {
            setHasPendingSync(true);
            if (navigator.onLine) {
                processSyncQueue();
            }
        }
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);
    
    // Save to cache whenever data changes
    useEffect(() => {
        if (userProfile) {
            saveToCache(CACHE_KEYS.USER_PROFILE, userProfile);
        }
    }, [userProfile]);
    
    useEffect(() => {
        if (collectedIds.length > 0) {
            saveToCache(CACHE_KEYS.COLLECTED_IDS, collectedIds);
        }
    }, [collectedIds]);
    
    useEffect(() => {
        if (xp > 0) {
            saveToCache(CACHE_KEYS.XP, xp);
        }
    }, [xp]);
    
    useEffect(() => {
        if (vacationBirds.length > 0) {
            saveToCache(CACHE_KEYS.VACATION_BIRDS, vacationBirds);
        }
    }, [vacationBirds]);
    
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [activeTab]);
    
    const playPling = () => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = audioContextRef.current;
            
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.frequency.setValueAtTime(880, ctx.currentTime);
            oscillator.frequency.setValueAtTime(1320, ctx.currentTime + 0.05);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.3);
        } catch (e) {
        }
    };
    
    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
    const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
    const [knownLocations, setKnownLocations] = useState<Set<string>>(new Set());

    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = Math.round(position.coords.latitude * 100) / 100;
                    const lng = Math.round(position.coords.longitude * 100) / 100;
                    setUserLocation({ lat, lng });
                    setLocationPermission('granted');
                },
                () => {
                    setLocationPermission('denied');
                },
                { enableHighAccuracy: false, timeout: 10000 }
            );
        }
    }, []);

    const getLocationKey = (lat: number, lng: number) => `${lat.toFixed(2)},${lng.toFixed(2)}`;

    // Load Session & Profile on Start (with offline fallback)
    useEffect(() => {
        const loadSession = async () => {
            setAppLoading(true);
            
            // If offline, load from cache immediately
            if (!navigator.onLine) {
                console.log('[Birbz] Offline - loading from cache');
                const cachedProfile = loadFromCache<UserProfile | null>(CACHE_KEYS.USER_PROFILE, null);
                const cachedIds = loadFromCache<string[]>(CACHE_KEYS.COLLECTED_IDS, []);
                const cachedXp = loadFromCache<number>(CACHE_KEYS.XP, 0);
                const cachedVacationBirds = loadFromCache<Bird[]>(CACHE_KEYS.VACATION_BIRDS, []);
                const cachedLocations = loadFromCache<string[]>(CACHE_KEYS.KNOWN_LOCATIONS, []);
                
                if (cachedProfile) {
                    setUserProfile(cachedProfile);
                    setCollectedIds(cachedIds);
                    setXp(cachedXp);
                    setVacationBirds(cachedVacationBirds);
                    setKnownLocations(new Set(cachedLocations));
                }
                setAppLoading(false);
                return;
            }
            
            // Online - try to load from Supabase
            try {
                const { data: { session } } = await supabase.auth.getSession();
                
                if (session?.user) {
                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (profile && !error) {
                         setUserProfile({
                            id: session.user.id,
                            name: profile.name,
                            avatarSeed: profile.avatar_seed,
                            homeRegion: profile.home_region,
                            badges: profile.badges || [],
                            friends: profile.friends || [],
                            currentStreak: profile.current_streak || 0,
                            longestStreak: profile.longest_streak || 0,
                            lastLogDate: profile.last_log_date || ''
                         });
                         
                         setCollectedIds(profile.collected_ids || []);
                         setXp(profile.xp || 0);
                         
                         const { data: vacationData } = await supabase
                             .from('vacation_birds')
                             .select('*')
                             .eq('user_id', session.user.id);
                         
                         if (vacationData && vacationData.length > 0) {
                             const loadedVacationBirds: Bird[] = vacationData.map(vb => ({
                                 id: vb.id,
                                 name: vb.name,
                                 sciName: vb.sci_name,
                                 rarity: vb.rarity || 'Urlaubsfund',
                                 points: vb.points || 25,
                                 locationType: 'vacation' as const,
                                 country: vb.country,
                                 realImg: vb.real_img,
                                 realDesc: vb.real_desc,
                                 seenAt: vb.seen_at
                             }));
                             setVacationBirds(loadedVacationBirds);
                         }
                         
                         const { data: logsData } = await supabase
                             .from('bird_logs')
                             .select('lat, lng')
                             .eq('user_id', session.user.id);
                         
                         if (logsData && logsData.length > 0) {
                             const locations = new Set<string>();
                             logsData.forEach(log => {
                                 if (log.lat && log.lng) {
                                     locations.add(`${log.lat},${log.lng}`);
                                 }
                             });
                             setKnownLocations(locations);
                             saveToCache(CACHE_KEYS.KNOWN_LOCATIONS, Array.from(locations));
                         }
                    }
                } else {
                    // No session - check cache for guest mode or previous session
                    const cachedProfile = loadFromCache<UserProfile | null>(CACHE_KEYS.USER_PROFILE, null);
                    if (cachedProfile && cachedProfile.name === 'Gast') {
                        isGuestRef.current = true;
                        setUserProfile(cachedProfile);
                        setCollectedIds(loadFromCache(CACHE_KEYS.COLLECTED_IDS, []));
                        setXp(loadFromCache(CACHE_KEYS.XP, 0));
                        setVacationBirds(loadFromCache(CACHE_KEYS.VACATION_BIRDS, []));
                    }
                }
            } catch (error) {
                console.error('[Birbz] Session load error, trying cache:', error);
                // Network error - try cache
                const cachedProfile = loadFromCache<UserProfile | null>(CACHE_KEYS.USER_PROFILE, null);
                if (cachedProfile) {
                    setUserProfile(cachedProfile);
                    setCollectedIds(loadFromCache(CACHE_KEYS.COLLECTED_IDS, []));
                    setXp(loadFromCache(CACHE_KEYS.XP, 0));
                    setVacationBirds(loadFromCache(CACHE_KEYS.VACATION_BIRDS, []));
                }
            }
            
            setAppLoading(false);
        };

        loadSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                window.location.reload();
            } else if (!session && !isGuestRef.current) {
                setUserProfile(null);
                setCollectedIds([]);
                setXp(0);
                clearCache();
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleOnboardingComplete = (profile: UserProfile) => {
        if (profile.name === 'Gast') {
            isGuestRef.current = true;
        }
        setUserProfile(profile);
    };

    const handleLogout = async () => {
        if (confirm("Möchtest du dich abmelden?")) {
            if (!isGuestRef.current) {
                await supabase.auth.signOut();
            }
            setUserProfile(null);
            setCollectedIds([]);
            setXp(0);
            setShowProfile(false);
            setActiveTab('home');
            isGuestRef.current = false;
            clearCache();
        }
    };

    const handleDeleteAccount = async () => {
        if (!userProfile) return;
        
        try {
            if (!isGuestRef.current) {
                await supabase.from('vacation_birds').delete().eq('user_id', userProfile.id);
                await supabase.from('bird_logs').delete().eq('user_id', userProfile.id);
                await supabase.from('profiles').delete().eq('id', userProfile.id);
                await supabase.auth.signOut();
            }
            
            setUserProfile(null);
            setCollectedIds([]);
            setVacationBirds([]);
            setXp(0);
            setShowProfile(false);
            setActiveTab('home');
            isGuestRef.current = false;
            clearCache();
            
            alert('Dein Konto wurde gelöscht.');
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('Fehler beim Löschen des Kontos. Bitte versuche es erneut.');
        }
    };

    const handleUpdateFriends = (newFriends: string[]) => {
        if (userProfile) {
            setUserProfile({
                ...userProfile,
                friends: newFriends
            });
        }
    };

    const updateStreak = (profile: UserProfile): { profile: UserProfile, justIncreased: boolean } => {
        const today = new Date().toISOString().split('T')[0];
        const lastLog = profile.lastLogDate;
        
        let currentStreak = profile.currentStreak;
        let longestStreak = profile.longestStreak;
        let justIncreased = false;

        if (lastLog === today) {
        } else {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (lastLog === yesterdayStr) {
                currentStreak += 1;
                justIncreased = true;
            } else {
                currentStreak = 1;
                justIncreased = currentStreak > 0;
            }
        }

        if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
        }

        return {
            profile: {
                ...profile,
                currentStreak,
                longestStreak,
                lastLogDate: today
            },
            justIncreased
        };
    };

    const checkBadges = (currentIds: string[], newBird: Bird, currentXp: number, profile: UserProfile, allVacationBirds: Bird[] = []) => {
        const earnedBadges: Badge[] = [];
        const updatedBadges = [...(profile.badges || [])];
        let extraXp = 0;

        const collectedBirds = BIRDS_DB.filter(b => currentIds.includes(b.id));
        
        const currentLevelInfo = LEVEL_THRESHOLDS.find(l => currentXp < l.max) || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
        const currentLevel = currentLevelInfo.level;
        
        const uniqueCountries = new Set(
            allVacationBirds
                .filter(b => b.country)
                .map(b => b.country!.toLowerCase().trim())
        );

        BADGES_DB.forEach(badge => {
            if (updatedBadges.includes(badge.id)) return;

            let earned = false;
            const count = currentIds.length;
            const nowHour = new Date().getHours();

            switch (badge.condition) {
                case 'count':
                    if (badge.category === 'streak') {
                         if (profile.currentStreak >= (badge.threshold || 1)) earned = true;
                    } else if (badge.threshold && count >= badge.threshold) {
                        earned = true;
                    }
                    break;
                case 'specific':
                    if (badge.targetValue && newBird.id === badge.targetValue) earned = true;
                    break;
                case 'rarity':
                    if (badge.targetValue && newBird.rarity.includes(badge.targetValue)) earned = true;
                    break;
                case 'location':
                    if (badge.targetValue && newBird.locationType === badge.targetValue) earned = true;
                    break;
                case 'time':
                    if (badge.startHour !== undefined && badge.endHour !== undefined) {
                        if (badge.startHour > badge.endHour) {
                            if (nowHour >= badge.startHour || nowHour < badge.endHour) earned = true;
                        } else {
                            if (nowHour >= badge.startHour && nowHour < badge.endHour) earned = true;
                        }
                    }
                    break;
                case 'level':
                    if (badge.threshold && currentLevel >= badge.threshold) earned = true;
                    break;
                case 'family_count':
                    if (badge.targetValue && badge.threshold) {
                        const familyKey = badge.targetValue;
                        const familyPrefixes = BIRD_FAMILIES[familyKey] || [];
                        
                        const familyCount = collectedBirds.filter(b => 
                            familyPrefixes.some(prefix => b.sciName.includes(prefix))
                        ).length;
                        
                        if (familyCount >= badge.threshold) earned = true;
                    }
                    break;
                case 'country_count':
                    if (badge.threshold && uniqueCountries.size >= badge.threshold) {
                        earned = true;
                    }
                    break;
            }

            if (earned) {
                earnedBadges.push(badge);
                updatedBadges.push(badge.id);
                extraXp += badge.xpReward;
            }
        });

        return { earnedBadges, updatedBadges, extraXp };
    };

    const syncWithSupabase = async (profile: UserProfile, xp: number, ids: string[]) => {
        if (isGuestRef.current) return; 
        
        const syncData = {
            xp: xp,
            collected_ids: ids,
            badges: profile.badges,
            current_streak: profile.currentStreak,
            longest_streak: profile.longestStreak,
            last_log_date: profile.lastLogDate
        };
        
        // If offline, add to queue
        if (!navigator.onLine) {
            addToSyncQueue({
                type: 'bird_collected',
                data: syncData,
                timestamp: Date.now()
            });
            setHasPendingSync(true);
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('profiles').update(syncData).eq('id', user.id);
        }
    };

    const handleCollect = (bird: Bird) => {
        const today = new Date().toISOString().split('T')[0];
        const isNewSpecies = !collectedIds.includes(bird.id);
        
        let currentDailySightings = dailySightings;
        if (lastSightingDate !== today) {
            currentDailySightings = {};
            setLastSightingDate(today);
        }
        
        const dailyCountForBird = currentDailySightings[bird.id] || 0;
        
        const currentStreak = userProfile?.currentStreak || 0;
        const { totalXP: sightingXP, breakdown } = calculateSightingXP(
            bird, 
            isNewSpecies, 
            currentStreak,
            dailyCountForBird
        );
        
        const newDailySightings = {
            ...currentDailySightings,
            [bird.id]: dailyCountForBird + 1
        };
        setDailySightings(newDailySightings);
        
        let newXp = xp + sightingXP;
        let explorerBonus = 0;
        let dailyBonus = 0;
        
        const isFirstBirdToday = userProfile?.lastLogDate !== today;
        if (isFirstBirdToday) {
            dailyBonus = XP_CONFIG.DAILY_LOGIN_BONUS;
            newXp += dailyBonus;
        }
        
        const newIds = isNewSpecies ? [...collectedIds, bird.id] : collectedIds;
        
        if (userLocation && locationPermission === 'granted') {
            const locationKey = getLocationKey(userLocation.lat, userLocation.lng);
            if (!knownLocations.has(locationKey)) {
                explorerBonus = 10;
                newXp += explorerBonus;
                setKnownLocations(prev => new Set([...prev, locationKey]));
            }
            
            if (!isGuestRef.current && userProfile?.id) {
                const logData = {
                    user_id: userProfile.id,
                    bird_id: bird.id,
                    bird_name: bird.name,
                    lat: userLocation.lat,
                    lng: userLocation.lng
                };
                
                if (navigator.onLine) {
                    supabase.from('bird_logs').insert(logData).then(({ error }) => {
                        if (error) console.error('Error saving bird log:', error);
                    });
                } else {
                    addToSyncQueue({
                        type: 'bird_log',
                        data: logData,
                        timestamp: Date.now()
                    });
                    setHasPendingSync(true);
                }
            }
        }
        
        if (bird.id.startsWith('vacation_') && isNewSpecies) {
            setVacationBirds(prev => [...prev, bird]);
            
            if (!isGuestRef.current && userProfile?.id) {
                const vacationData = {
                    id: bird.id,
                    user_id: userProfile.id,
                    name: bird.name,
                    sci_name: bird.sciName,
                    rarity: bird.rarity,
                    points: bird.points,
                    real_img: bird.realImg,
                    real_desc: bird.realDesc,
                    seen_at: bird.seenAt,
                    country: bird.country
                };
                
                if (navigator.onLine) {
                    supabase.from('vacation_birds').insert(vacationData).then(({ error }) => {
                        if (error) console.error('Error saving vacation bird:', error);
                    });
                } else {
                    addToSyncQueue({
                        type: 'vacation_bird',
                        data: vacationData,
                        timestamp: Date.now()
                    });
                    setHasPendingSync(true);
                }
            }
        }

        let updatedProfile = userProfile!;
        let streakIncreased = false;
        let streakBonusXP = 0;
        
        if (updatedProfile) {
            const streakResult = updateStreak(updatedProfile);
            updatedProfile = streakResult.profile;
            streakIncreased = streakResult.justIncreased;
            
            if (streakIncreased) {
                if (updatedProfile.currentStreak === 7) {
                    streakBonusXP = XP_CONFIG.STREAK_BONUS_7_DAYS;
                } else if (updatedProfile.currentStreak === 30) {
                    streakBonusXP = XP_CONFIG.STREAK_BONUS_30_DAYS;
                }
                newXp += streakBonusXP;
            }
        }

        const allVacationBirds = bird.id.startsWith('vacation_') && isNewSpecies
            ? [...vacationBirds, bird] 
            : vacationBirds;
        const { earnedBadges, updatedBadges, extraXp } = checkBadges(newIds, bird, newXp, updatedProfile, allVacationBirds);
        updatedProfile.badges = updatedBadges;
        newXp += extraXp;

        if (isNewSpecies) {
            setCollectedIds(newIds);
        }
        setXp(newXp);
        setUserProfile(updatedProfile);
        
        syncWithSupabase(updatedProfile, newXp, newIds);

        const totalBonus = explorerBonus + dailyBonus + streakBonusXP;
        playPling();
        setCelebration({ 
            active: true, 
            xp: sightingXP, 
            bonus: totalBonus > 0 ? totalBonus : undefined 
        });
        setShowIdentification(false);
        setModalBird(null);
        
        if (streakIncreased && updatedProfile.currentStreak > 1) {
            setTimeout(() => setNewStreak(updatedProfile.currentStreak), 500);
        }

        if (earnedBadges.length > 0) {
            const bestBadge = earnedBadges.sort((a,b) => b.xpReward - a.xpReward)[0];
            setTimeout(() => setNewBadge(bestBadge), streakIncreased && updatedProfile.currentStreak > 1 ? 3500 : 2000); 
        }
        
        if (ENABLE_LEGENDARY_CARDS && bird.tier === 'legendary' && isNewSpecies) {
            setTimeout(() => {
                setLegendaryCardBird(bird);
            }, 2500);
        }
    };

    const handleRemove = async (bird: Bird) => {
        const newIds = collectedIds.filter(id => id !== bird.id);
        const newXp = Math.max(0, xp - (bird.points || 10));
        
        if (bird.id.startsWith('vacation_')) {
            setVacationBirds(prev => prev.filter(vb => vb.id !== bird.id));
            
            if (!isGuestRef.current && userProfile?.id && navigator.onLine) {
                await supabase.from('vacation_birds').delete().eq('id', bird.id);
            }
        }
        
        setCollectedIds(newIds);
        setXp(newXp);
        
        if (userProfile) {
            syncWithSupabase(userProfile, newXp, newIds);
        }
        
        setModalBird(null);
    };

    const handleUpdateCountry = async (bird: Bird, country: string) => {
        setVacationBirds(prev => prev.map(vb => 
            vb.id === bird.id ? { ...vb, country } : vb
        ));
        
        if (modalBird?.id === bird.id) {
            setModalBird({ ...modalBird, country });
        }
        
        if (!isGuestRef.current && userProfile?.id && navigator.onLine) {
            await supabase
                .from('vacation_birds')
                .update({ country })
                .eq('id', bird.id);
        }
    };

    const handleUpdateImage = async (bird: Bird, imageUrl: string) => {
        setVacationBirds(prev => prev.map(vb => 
            vb.id === bird.id ? { ...vb, realImg: imageUrl } : vb
        ));
        
        if (modalBird?.id === bird.id) {
            setModalBird({ ...modalBird, realImg: imageUrl });
        }
        
        if (!isGuestRef.current && userProfile?.id && navigator.onLine) {
            await supabase
                .from('vacation_birds')
                .update({ real_img: imageUrl })
                .eq('id', bird.id);
        }
    };

    if (appLoading) {
        return <div className="h-screen flex items-center justify-center bg-cream text-teal font-bold">Lade Birbz...</div>;
    }

    if (!userProfile) {
        return <Onboarding onComplete={handleOnboardingComplete} />;
    }

    const renderContent = () => {
        if (activeTab === 'home') {
            return (
                <HomeView 
                    userProfile={userProfile}
                    xp={xp}
                    collectedIds={collectedIds}
                    isVacationMode={isVacationMode}
                    onShowLeaderboard={() => setShowLeaderboard(true)}
                    onNavigateToDex={() => setActiveTab('dex')}
                    onBirdClick={setModalBird}
                />
            );
        }
        if (activeTab === 'dex') {
            return (
                <DexView 
                    collectedIds={collectedIds} 
                    vacationBirds={vacationBirds}
                    onBirdClick={setModalBird} 
                />
            );
        }
        if (activeTab === 'tips') {
            return <TipsView />;
        }
        if (activeTab === 'quiz') {
            return <QuizView />;
        }
        return null;
    };

    return (
        <div className={`min-h-screen min-h-[-webkit-fill-available] font-sans pb-safe relative transition-colors duration-500 ${isVacationMode ? 'bg-orange-50' : 'bg-cream'}`}>
            {/* Offline / Sync Indicator */}
            {isOffline && (
                <div className="fixed top-0 left-0 right-0 bg-orange-500 text-white text-center py-2 text-sm z-50 font-medium">
                    📡 Offline – Änderungen werden später synchronisiert
                </div>
            )}
            {!isOffline && hasPendingSync && (
                <div className="fixed top-0 left-0 right-0 bg-teal text-white text-center py-2 text-sm z-50 font-medium">
                    🔄 Synchronisiere...
                </div>
            )}
            {!isOffline && !hasPendingSync && syncSuccess && (
                <div className="fixed top-0 left-0 right-0 bg-green-500 text-white text-center py-2 text-sm z-50 font-medium">
                    ✓ Synchronisiert!
                </div>
            )}
            
            <CelebrationOverlay 
                show={celebration.active} 
                xp={celebration.xp}
                bonus={celebration.bonus}
                onClose={() => setCelebration({ active: false, xp: 0 })} 
            />

            <BadgeOverlay 
                badge={newBadge}
                onClose={() => setNewBadge(null)}
            />

            {newStreak && (
                <StreakOverlay 
                    streak={newStreak} 
                    onClose={() => setNewStreak(null)} 
                />
            )}
            
            {ENABLE_LEGENDARY_CARDS && legendaryCardBird && (
                <LegendaryCard
                    bird={{
                        name: legendaryCardBird.name,
                        sciName: legendaryCardBird.sciName,
                        image: (() => {
                            const artwork = getLegendaryArtwork(legendaryCardBird.id);
                            console.log('Legendary card debug:', {
                                birdId: legendaryCardBird.id,
                                artwork,
                                realImg: legendaryCardBird.realImg
                            });
                            return artwork || legendaryCardBird.realImg || '';
                        })()
                    }}
                    discoveredAt={new Date().toLocaleDateString('de-DE')}
                    discoveredBy={userProfile?.name || 'Birbz User'}
                    location={userLocation ? 'Deutschland' : undefined}
                    onClose={() => setLegendaryCardBird(null)}
                />
            )}
            
            {modalBird && (
                <BirdModal 
                    bird={modalBird.id.startsWith('vacation_') 
                        ? (vacationBirds.find(vb => vb.id === modalBird.id) || modalBird)
                        : modalBird
                    } 
                    onClose={() => setModalBird(null)} 
                    onFound={handleCollect}
                    onRemove={handleRemove}
                    onUpdateCountry={handleUpdateCountry}
                    onUpdateImage={handleUpdateImage}
                    isCollected={collectedIds.includes(modalBird.id)}
                    userName={userProfile?.name || 'Birbz User'}
                />
            )}

            {showProfile && userProfile && (
                <ProfileModal 
                    user={userProfile}
                    xp={xp}
                    collectedCount={collectedIds.length}
                    collectedIds={collectedIds}
                    onClose={() => setShowProfile(false)}
                    onLogout={handleLogout}
                    onDeleteAccount={handleDeleteAccount}
                    onShowLegendaryCard={(bird) => {
                        setShowProfile(false);
                        setLegendaryCardBird(bird);
                    }}
                />
            )}

            {showIdentification && (
                <IdentificationModal 
                    onClose={() => setShowIdentification(false)}
                    onFound={handleCollect}
                    modeType={isVacationMode ? 'vacation' : 'local'}
                    onToggleMode={() => setIsVacationMode(!isVacationMode)}
                />
            )}

            {showLeaderboard && userProfile && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in">
                    <div className="bg-white w-full max-w-md max-h-[80vh] rounded-t-3xl sm:rounded-3xl overflow-hidden animate-slide-up">
                        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
                            <h2 className="font-bold text-lg text-teal">Bestenliste</h2>
                            <button 
                                onClick={() => setShowLeaderboard(false)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="overflow-y-auto">
                            <Leaderboard 
                                currentUser={userProfile} 
                                currentXp={xp}
                                onUpdateFriends={handleUpdateFriends}
                            />
                        </div>
                    </div>
                </div>
            )}

            <Header 
                xp={xp} 
                locationStatus={isVacationMode ? 'Reisemodus' : 'Bereit'} 
                isLoading={false}
                userProfile={userProfile}
                isVacationMode={isVacationMode}
                onToggleMode={() => setIsVacationMode(!isVacationMode)}
                onAvatarClick={() => setShowProfile(true)}
            />

            <main className={`pb-32 overflow-y-auto ${isOffline || hasPendingSync || syncSuccess ? 'pt-8' : ''}`}>
                {renderContent()}
            </main>

            <BottomNav 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                onScanClick={() => setShowIdentification(true)} 
            />
        </div>
    );
}
