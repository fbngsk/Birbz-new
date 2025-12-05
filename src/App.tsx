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
import { RadarMap } from './components/RadarMap';
import { LocationShareModal, UnusualSightingModal } from './components/LocationShareModal';
import { SwarmView } from './components/SwarmView';
import { Bird, TabType, UserProfile, Badge, Swarm } from './types';
import { BADGES_DB, BIRDS_DB, BIRD_FAMILIES, LEVEL_THRESHOLDS, XP_CONFIG, calculateSightingXP } from './constants';
import { getLegendaryArtwork } from './legendaryArtworks';
import { supabase } from './lib/supabaseClient';
import { validateBirdLocation } from './services/birdRanges';
import { getUserSwarm, joinSwarm, updateSwarmStreak, checkSwarmBadges, distributeSwarmBonus } from './services/swarmService';

// ========================================
// FEATURE FLAG: Legendary Cards
// ========================================
const ENABLE_LEGENDARY_CARDS = true;

// ========================================
// OFFLINE CACHE HELPERS
// ========================================
const CACHE_VERSION = 2;
const CACHE_KEYS = {
    VERSION: 'birdnerd_cacheVersion',
    USER_PROFILE: 'birdnerd_userProfile',
    COLLECTED_IDS: 'birdnerd_collectedIds',
    XP: 'birdnerd_xp',
    VACATION_BIRDS: 'birdnerd_vacationBirds',
    KNOWN_LOCATIONS: 'birdnerd_knownLocations',
    PENDING_SYNC: 'birdnerd_pendingSync'
};

interface PendingSyncItem {
    type: 'bird_collected' | 'vacation_bird' | 'bird_log' | 'bird_sighting';
    data: any;
    timestamp: number;
}

const validateCacheVersion = () => {
    try {
        const storedVersion = localStorage.getItem(CACHE_KEYS.VERSION);
        if (storedVersion !== String(CACHE_VERSION)) {
            console.log('[BirdNerd] Cache version mismatch, clearing old cache');
            Object.values(CACHE_KEYS).forEach(key => {
                if (key !== CACHE_KEYS.VERSION) {
                    localStorage.removeItem(key);
                }
            });
            localStorage.setItem(CACHE_KEYS.VERSION, String(CACHE_VERSION));
        }
    } catch (e) {
        console.warn('[BirdNerd] Cache version check failed:', e);
    }
};

validateCacheVersion();

const saveToCache = (key: string, data: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.warn('[BirdNerd] Cache save failed:', e);
    }
};

const loadFromCache = <T,>(key: string, fallback: T): T => {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return fallback;
        const parsed = JSON.parse(cached);
        if (parsed === null || parsed === undefined) {
            return fallback;
        }
        return parsed;
    } catch (e) {
        console.warn('[BirdNerd] Corrupted cache detected, removing:', key);
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
// MAIN APP COMPONENT
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
    const [showQuiz, setShowQuiz] = useState(false);
    
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
    
    // Radar Feature State
    const [showLocationShareModal, setShowLocationShareModal] = useState(false);
    const [showUnusualSightingModal, setShowUnusualSightingModal] = useState(false);
    const [pendingBirdForSighting, setPendingBirdForSighting] = useState<Bird | null>(null);
    const [pendingCustomLocation, setPendingCustomLocation] = useState<{lat: number, lng: number} | null>(null);
    const [unusualSightingReason, setUnusualSightingReason] = useState<string>('');
    
    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
    const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
    const [knownLocations, setKnownLocations] = useState<Set<string>>(new Set());

    // Schwarm Feature State
    const [userSwarm, setUserSwarm] = useState<Swarm | null>(null);
    const [showSwarmView, setShowSwarmView] = useState(false);
    const [pendingSwarmCode, setPendingSwarmCode] = useState<string | null>(null);

    // Schwarm Overlays
    const [swarmStreakBonus, setSwarmStreakBonus] = useState<{ streak: number; xp: number } | null>(null);
    const [swarmBadgeEarned, setSwarmBadgeEarned] = useState<{ name: string; emoji: string; xp: number } | null>(null);

    // Process sync queue when coming back online
    const processSyncQueue = async () => {
        if (!navigator.onLine) return;
        if (isGuestRef.current) return;
        
        const queue = getSyncQueue();
        if (queue.length === 0) return;
        
        console.log('[BirdNerd] Processing sync queue:', queue.length, 'items');
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
                    case 'bird_sighting':
                        await supabase.from('bird_sightings').insert(item.data);
                        break;
                }
            } catch (error) {
                console.error('[BirdNerd] Sync error:', error);
                hasErrors = true;
            }
        }
        
        const elapsed = Date.now() - startTime;
        const minDisplayTime = 2000;
        if (elapsed < minDisplayTime) {
            await new Promise(resolve => setTimeout(resolve, minDisplayTime - elapsed));
        }
        
        if (!hasErrors) {
            clearSyncQueue();
            setHasPendingSync(false);
            setSyncSuccess(true);
            console.log('[BirdNerd] Sync complete');
            setTimeout(() => setSyncSuccess(false), 2000);
        }
    };
    
    // Track online/offline status
    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            processSyncQueue();
        };
        const handleOffline = () => setIsOffline(true);
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
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

    // Handle invite links (BirdNerd.de/s/CODE)
    useEffect(() => {
        const checkInviteLink = () => {
            const path = window.location.pathname;
            const match = path.match(/^\/s\/([A-Z0-9]{6})$/i);
            if (match) {
                const code = match[1].toUpperCase();
                // Im localStorage speichern, damit es Onboarding überlebt
                localStorage.setItem('pendingSwarmCode', code);
                setPendingSwarmCode(code);
                window.history.replaceState({}, '', '/');
            } else {
                // Check ob noch ein Code im localStorage liegt
                const savedCode = localStorage.getItem('pendingSwarmCode');
                if (savedCode) {
                    setPendingSwarmCode(savedCode);
                }
            }
        };
        checkInviteLink();
    }, []);

    // Process pending invite after login
    useEffect(() => {
        const processPendingInvite = async () => {
            if (pendingSwarmCode && userProfile?.id && !userSwarm) {
                const result = await joinSwarm(userProfile.id, pendingSwarmCode);
                if (result.success && result.swarm) {
                    setUserSwarm(result.swarm);
                    setShowSwarmView(true);
                }
                // Code aus localStorage entfernen nach Verarbeitung
                localStorage.removeItem('pendingSwarmCode');
                setPendingSwarmCode(null);
            }
        };
        processPendingInvite();
    }, [pendingSwarmCode, userProfile?.id, userSwarm]);

    // Load Session & Profile on Start (with offline fallback)
    useEffect(() => {
        const loadSession = async () => {
            setAppLoading(true);
            
            if (!navigator.onLine) {
                console.log('[BirdNerd] Offline - loading from cache');
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
                            lastLogDate: profile.last_log_date || '',
                            shareLocation: profile.share_location || 'ask',
                            hasRadarPro: profile.has_radar_pro || false,
                            swarmId: profile.swarm_id || undefined
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

                         // Load user's swarm
                         const swarm = await getUserSwarm(session.user.id);
                         setUserSwarm(swarm);
                    }
                } else {
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
                console.error('[BirdNerd] Session load error, trying cache:', error);
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

        let isInitialLoad = true;
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('[BirdNerd] Auth state change:', event, 'initial:', isInitialLoad);
            
            if (event === 'SIGNED_IN' && session?.user && !isInitialLoad) {
                console.log('[BirdNerd] User signed in, skipping reload');
            } else if (event === 'SIGNED_OUT' && !isGuestRef.current) {
                setUserProfile(null);
                setCollectedIds([]);
                setXp(0);
                setUserSwarm(null);
                clearCache();
            }
            
            isInitialLoad = false;
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
            setUserSwarm(null);
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
                await supabase.from('bird_sightings').delete().eq('user_id', userProfile.id);
                await supabase.from('profiles').delete().eq('id', userProfile.id);
                await supabase.auth.signOut();
            }
            
            setUserProfile(null);
            setCollectedIds([]);
            setVacationBirds([]);
            setXp(0);
            setUserSwarm(null);
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

    const handleSwarmChange = (swarm: Swarm | null) => {
        setUserSwarm(swarm);
        if (userProfile) {
            setUserProfile({
                ...userProfile,
                swarmId: swarm?.id
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

    // ========================================
    // RADAR FEATURE - LOCATION SHARING HANDLERS
    // ========================================
    
    const saveBirdSightingWithLocation = async (bird: Bird, lat: number, lng: number, forceFlag: boolean = false) => {
        if (!userProfile || isGuestRef.current) return;
        
        const roundedLat = Math.round(lat * 500) / 500;
        const roundedLng = Math.round(lng * 500) / 500;
        
        const validation = validateBirdLocation(bird.id, lat, lng);
        const shouldFlag = forceFlag || validation.shouldFlag;
        
        const sightingData = {
            user_id: userProfile.id,
            bird_id: bird.id,
            bird_name: bird.name,
            bird_sci_name: bird.sciName,
            bird_rarity: bird.rarity,
            lat: roundedLat,
            lng: roundedLng,
            sighted_at: new Date().toISOString().split('T')[0],
            flagged: shouldFlag,
            flag_reason: shouldFlag ? (validation.reason || 'User confirmed unusual sighting') : null
        };
        
        if (navigator.onLine) {
            const { error } = await supabase.from('bird_sightings').insert(sightingData);
            if (error) {
                console.error('[BirdNerd] Failed to save sighting:', error);
            } else {
                console.log('[BirdNerd] Sighting saved:', bird.name, shouldFlag ? '(flagged)' : '');
            }
        } else {
            addToSyncQueue({
                type: 'bird_sighting',
                data: sightingData,
                timestamp: Date.now()
            });
            setHasPendingSync(true);
        }
    };
    
    const handleShareCurrentLocation = async () => {
        setShowLocationShareModal(false);
        
        if (pendingBirdForSighting && userLocation) {
            const validation = validateBirdLocation(pendingBirdForSighting.id, userLocation.lat, userLocation.lng);
            
            if (!validation.valid) {
                setPendingCustomLocation(userLocation);
                setUnusualSightingReason(validation.reason || 'Ungewöhnlicher Standort für diese Art.');
                setShowUnusualSightingModal(true);
                return;
            }
            
            await saveBirdSightingWithLocation(pendingBirdForSighting, userLocation.lat, userLocation.lng, validation.shouldFlag);
        }
        
        setPendingBirdForSighting(null);
    };
    
    const handleShareCustomLocation = async (lat: number, lng: number) => {
        setShowLocationShareModal(false);
        
        if (pendingBirdForSighting) {
            const validation = validateBirdLocation(pendingBirdForSighting.id, lat, lng);
            
            if (!validation.valid) {
                setPendingCustomLocation({ lat, lng });
                setUnusualSightingReason(validation.reason || 'Ungewöhnlicher Standort für diese Art.');
                setShowUnusualSightingModal(true);
                return;
            }
            
            await saveBirdSightingWithLocation(pendingBirdForSighting, lat, lng, validation.shouldFlag);
        }
        
        setPendingBirdForSighting(null);
    };
    
    const handleSkipLocationShare = () => {
        setShowLocationShareModal(false);
        setPendingBirdForSighting(null);
        console.log('[BirdNerd] User skipped location sharing');
    };
    
    const handleUnusualSightingConfirm = async () => {
        setShowUnusualSightingModal(false);
        
        if (pendingBirdForSighting && pendingCustomLocation) {
            await saveBirdSightingWithLocation(pendingBirdForSighting, pendingCustomLocation.lat, pendingCustomLocation.lng, true);
        }
        
        setPendingBirdForSighting(null);
        setPendingCustomLocation(null);
        setUnusualSightingReason('');
    };
    
    const handleUnusualSightingCancel = () => {
        setShowUnusualSightingModal(false);
        setPendingBirdForSighting(null);
        setPendingCustomLocation(null);
        setUnusualSightingReason('');
    };

    const handleCollect = async (bird: Bird) => {
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
            
            if (!isGuestRef.current && userProfile?.id && !bird.id.startsWith('vacation_')) {
                setPendingBirdForSighting(bird);
            }
        } else {
            if (!isGuestRef.current && userProfile?.id && !bird.id.startsWith('vacation_')) {
                setPendingBirdForSighting(bird);
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

        // ========================================
        // SCHWARM-STREAK & BADGES CHECKEN
        // ========================================
        if (userSwarm?.id && !isGuestRef.current) {
            // Streak updaten
            const streakResult = await updateSwarmStreak(userSwarm.id);
            
            if (streakResult.isNewStreakMilestone && streakResult.streakBonus > 0) {
                // Bonus an alle verteilen
                await distributeSwarmBonus(userSwarm.id, streakResult.streakBonus);
                
                // Lokalen XP-State auch updaten
                setXp(prev => prev + streakResult.streakBonus);
                
                // Overlay zeigen (nach anderen Overlays)
                setTimeout(() => {
                    setSwarmStreakBonus({ 
                        streak: streakResult.newStreak, 
                        xp: streakResult.streakBonus 
                    });
                }, 3500);
            }

            // Badges checken
            const badgeResult = await checkSwarmBadges(userSwarm.id);
            
            if (badgeResult.newBadges.length > 0) {
                // Bonus an alle verteilen
                await distributeSwarmBonus(userSwarm.id, badgeResult.totalBonusXp);
                
                // Lokalen XP-State auch updaten
                setXp(prev => prev + badgeResult.totalBonusXp);
                
                // Bestes Badge zeigen
                const bestBadge = badgeResult.newBadges.sort((a, b) => b.xpReward - a.xpReward)[0];
                setTimeout(() => {
                    setSwarmBadgeEarned({
                        name: bestBadge.name,
                        emoji: bestBadge.emoji,
                        xp: bestBadge.xpReward
                    });
                }, streakResult.isNewStreakMilestone ? 6000 : 3500);
            }
        }
    };

    const handleRemove = async (bird: Bird) => {
        const newIds = collectedIds.filter(id => id !== bird.id);
        
        let newVacationBirds = vacationBirds;
        if (bird.id.startsWith('vacation_')) {
            newVacationBirds = vacationBirds.filter(vb => vb.id !== bird.id);
            setVacationBirds(newVacationBirds);
            
            if (!isGuestRef.current && userProfile?.id && navigator.onLine) {
                await supabase.from('vacation_birds').delete().eq('id', bird.id);
            }
        }
        
        if (!isGuestRef.current && userProfile?.id && navigator.onLine) {
            const today = new Date().toISOString().split('T')[0];
            await supabase
                .from('bird_sightings')
                .delete()
                .eq('user_id', userProfile.id)
                .eq('bird_id', bird.id)
                .eq('sighted_at', today);
            
            console.log('[BirdNerd] Removed bird sighting from radar:', bird.name);
        }
        
        let recalculatedXp = 0;
        const recalculatedBadges: string[] = [];
        
        const remainingLocalBirds = BIRDS_DB.filter(b => newIds.includes(b.id));
        const remainingVacationBirds = newVacationBirds;
        
        remainingLocalBirds.forEach(b => {
            recalculatedXp += b.points || 10;
        });
        remainingVacationBirds.forEach(b => {
            recalculatedXp += b.points || 25;
        });
        
        const collectedBirds = remainingLocalBirds;
        const uniqueCountries = new Set(
            remainingVacationBirds
                .filter(b => b.country)
                .map(b => b.country!.toLowerCase().trim())
        );
        
        BADGES_DB.forEach(badge => {
            let stillEarned = false;
            const count = newIds.length;
            
            switch (badge.condition) {
                case 'count':
                    if (badge.category === 'streak') {
                        if (userProfile?.badges?.includes(badge.id)) {
                            stillEarned = true;
                        }
                    } else if (badge.threshold && count >= badge.threshold) {
                        stillEarned = true;
                    }
                    break;
                case 'specific':
                    if (badge.targetValue && newIds.includes(badge.targetValue)) {
                        stillEarned = true;
                    }
                    break;
                case 'rarity':
                    if (badge.targetValue) {
                        const hasRarity = [...remainingLocalBirds, ...remainingVacationBirds]
                            .some(b => b.rarity.includes(badge.targetValue!));
                        stillEarned = hasRarity;
                    }
                    break;
                case 'location':
                    if (badge.targetValue === 'vacation') {
                        stillEarned = remainingVacationBirds.length > 0;
                    }
                    break;
                case 'time':
                    if (userProfile?.badges?.includes(badge.id)) {
                        stillEarned = true;
                    }
                    break;
                case 'level':
                    break;
                case 'family_count':
                    if (badge.targetValue && badge.threshold) {
                        const familyPrefixes = BIRD_FAMILIES[badge.targetValue] || [];
                        const familyCount = collectedBirds.filter(b => 
                            familyPrefixes.some(prefix => b.sciName.includes(prefix))
                        ).length;
                        stillEarned = familyCount >= badge.threshold;
                    }
                    break;
                case 'country_count':
                    if (badge.threshold) {
                        stillEarned = uniqueCountries.size >= badge.threshold;
                    }
                    break;
            }
            
            if (stillEarned) {
                recalculatedBadges.push(badge.id);
                recalculatedXp += badge.xpReward;
            }
        });
        
        BADGES_DB.forEach(badge => {
            if (badge.condition === 'level' && badge.threshold) {
                const levelInfo = LEVEL_THRESHOLDS.find(l => recalculatedXp < l.max) || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
                if (levelInfo.level >= badge.threshold && !recalculatedBadges.includes(badge.id)) {
                    recalculatedBadges.push(badge.id);
                    recalculatedXp += badge.xpReward;
                }
            }
        });
        
        setCollectedIds(newIds);
        setXp(recalculatedXp);
        
        if (userProfile) {
            const updatedProfile = {
                ...userProfile,
                badges: recalculatedBadges
            };
            setUserProfile(updatedProfile);
            syncWithSupabase(updatedProfile, recalculatedXp, newIds);
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
        return <div className="h-screen flex items-center justify-center bg-cream text-teal font-bold">Lade BirdNerd...</div>;
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
    onShowLeaderboard={() => setActiveTab('circles')}
    onNavigateToDex={() => setActiveTab('dex')}
    onBirdClick={handleBirdClick}
    onStartQuiz={() => setShowQuiz(true)}
    onNavigateToSwarm={() => setShowSwarmView(true)}
    locationPermission={locationPermission}
/>
            );
        }
        if (activeTab === 'dex') {
            return (
                <DexView 
                    collectedIds={collectedIds} 
                    vacationBirds={vacationBirds}
                    swarm={userSwarm}
                    onBirdClick={setModalBird} 
                />
            );
        }
        if (activeTab === 'radar') {
            return (
                <RadarMap 
                    userLocation={userLocation}
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
                onClose={() => {
                    setCelebration({ active: false, xp: 0 });
                    if (pendingBirdForSighting) {
                        setShowLocationShareModal(true);
                    }
                }} 
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

            {/* Schwarm Streak Overlay */}
            {swarmStreakBonus && (
                <div 
                    className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fade-in"
                    onClick={() => setSwarmStreakBonus(null)}
                >
                    <div className="bg-white rounded-3xl p-8 mx-4 text-center animate-scale-up max-w-sm">
                        <div className="text-6xl mb-4">🪺🔥</div>
                        <h2 className="text-2xl font-bold text-teal mb-2">
                            Schwarm-Streak!
                        </h2>
                        <p className="text-4xl font-bold text-orange mb-2">
                            {swarmStreakBonus.streak} Tage
                        </p>
                        <p className="text-gray-500 mb-4">
                            Euer Schwarm loggt jeden Tag!
                        </p>
                        <div className="inline-block bg-green-100 text-green-600 font-bold px-4 py-2 rounded-full">
                            +{swarmStreakBonus.xp} XP für alle!
                        </div>
                    </div>
                </div>
            )}

            {/* Schwarm Badge Overlay */}
            {swarmBadgeEarned && (
                <div 
                    className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fade-in"
                    onClick={() => setSwarmBadgeEarned(null)}
                >
                    <div className="bg-white rounded-3xl p-8 mx-4 text-center animate-scale-up max-w-sm">
                        <div className="text-6xl mb-4">{swarmBadgeEarned.emoji}</div>
                        <h2 className="text-2xl font-bold text-teal mb-2">
                            Schwarm-Badge!
                        </h2>
                        <p className="text-xl font-bold text-gray-800 mb-2">
                            {swarmBadgeEarned.name}
                        </p>
                        <p className="text-gray-500 mb-4">
                            Euer Schwarm hat ein neues Badge freigeschaltet!
                        </p>
                        <div className="inline-block bg-green-100 text-green-600 font-bold px-4 py-2 rounded-full">
                            +{swarmBadgeEarned.xp} XP für alle!
                        </div>
                    </div>
                </div>
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
                    discoveredBy={userProfile?.name || 'BirdNerd User'}
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
                    userName={userProfile?.name || 'BirdNerd User'}
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

            {showQuiz && (
                <QuizView 
                    onClose={() => setShowQuiz(false)} 
                    onQuizComplete={(score, total) => {
                        if (userProfile) {
                            const { profile: updatedProfile, justIncreased } = updateStreak(userProfile);
                            setUserProfile(updatedProfile);
                            syncWithSupabase(updatedProfile, xp, collectedIds);
                            
                            if (justIncreased && updatedProfile.currentStreak > 1) {
                                setTimeout(() => setNewStreak(updatedProfile.currentStreak), 500);
                            }
                        }
                    }}
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
                                swarm={userSwarm}
                                onUpdateFriends={handleUpdateFriends}
                                onOpenSwarmView={() => {
                                    setShowLeaderboard(false);
                                    setShowSwarmView(true);
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Swarm View Modal */}
            {showSwarmView && userProfile && (
                <SwarmView
                    currentUser={userProfile}
                    swarm={userSwarm}
                    onSwarmChange={handleSwarmChange}
                    onClose={() => setShowSwarmView(false)}
                />
            )}
            
            {/* Location Share Modal */}
            {showLocationShareModal && pendingBirdForSighting && (
                <LocationShareModal
                    birdName={pendingBirdForSighting.name}
                    hasGPS={!!userLocation && locationPermission === 'granted'}
                    onShareCurrentLocation={handleShareCurrentLocation}
                    onShareCustomLocation={handleShareCustomLocation}
                    onSkip={handleSkipLocationShare}
                    onClose={() => {
                        setShowLocationShareModal(false);
                        setPendingBirdForSighting(null);
                    }}
                />
            )}
            
            {/* Unusual Sighting Warning Modal */}
            {showUnusualSightingModal && pendingBirdForSighting && (
                <UnusualSightingModal
                    birdName={pendingBirdForSighting.name}
                    reason={unusualSightingReason}
                    onConfirm={handleUnusualSightingConfirm}
                    onCancel={handleUnusualSightingCancel}
                />
            )}

            {activeTab !== 'radar' && (
                <Header 
                    xp={xp} 
                    locationStatus={isVacationMode ? 'Reisemodus' : 'Bereit'} 
                    isLoading={false}
                    userProfile={userProfile}
                    isVacationMode={isVacationMode}
                    onToggleMode={() => setIsVacationMode(!isVacationMode)}
                    onAvatarClick={() => setShowProfile(true)}
                />
            )}

            <main className={`${activeTab === 'radar' ? '' : 'pb-32'} overflow-y-auto ${isOffline || hasPendingSync || syncSuccess ? 'pt-8' : ''}`}>
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
