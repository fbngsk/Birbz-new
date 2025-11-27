import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DailyHoroscope } from './components/DailyHoroscope';
import { Leaderboard } from './components/Leaderboard';
import { DexView } from './components/DexView';
import { TipsView } from './components/TipsView';
import { QuizView } from './components/QuizView';
import { IdentificationModal } from './components/IdentificationModal';
import { BirdModal } from './components/BirdModal';
import { CelebrationOverlay } from './components/CelebrationOverlay';
import { BadgeOverlay } from './components/BadgeOverlay';
import { StreakOverlay } from './components/StreakOverlay';
import { ProfileModal } from './components/ProfileModal';
import { Onboarding } from './components/Onboarding';
import { Bird, TabType, UserProfile, Badge } from './types';
import { BADGES_DB, BIRDS_DB, BIRD_FAMILIES, LEVEL_THRESHOLDS } from './constants';
import { supabase } from './lib/supabaseClient';

export default function App() {
    const [activeTab, setActiveTab] = useState<TabType>('home');
    const [collectedIds, setCollectedIds] = useState<string[]>([]);
    const [vacationBirds, setVacationBirds] = useState<Bird[]>([]); // Store full bird objects for vacation finds
    const [xp, setXp] = useState<number>(0);
    const [modalBird, setModalBird] = useState<Bird | null>(null);
    const [showIdentification, setShowIdentification] = useState(false);
    const [celebration, setCelebration] = useState<{ active: boolean; xp: number; bonus?: number }>({ active: false, xp: 0 });
    
    // Badge, Streak & Profile State
    const [newBadge, setNewBadge] = useState<Badge | null>(null);
    const [newStreak, setNewStreak] = useState<number | null>(null);
    const [showProfile, setShowProfile] = useState(false);
    
    // User & Mode State
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isVacationMode, setIsVacationMode] = useState(false);
    const [appLoading, setAppLoading] = useState(true);
    const isGuestRef = useRef(false);
    
    // Location State
    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
    const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
    const [knownLocations, setKnownLocations] = useState<Set<string>>(new Set());

    // Request location permission on mount
    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // Round to 2 decimals (~1km precision) for privacy
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

    // Helper: Create location key for deduplication
    const getLocationKey = (lat: number, lng: number) => `${lat.toFixed(2)},${lng.toFixed(2)}`;

    // Load Session & Profile on Start
    useEffect(() => {
        const loadSession = async () => {
            setAppLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user) {
                // Fetch Profile from DB
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profile && !error) {
                     setUserProfile({
                        id: session.user.id, // Store the UUID
                        name: profile.name,
                        avatarSeed: profile.avatar_seed,
                        homeRegion: profile.home_region,
                        badges: profile.badges || [],
                        friends: profile.friends || [], // Load friends
                        currentStreak: profile.current_streak || 0,
                        longestStreak: profile.longest_streak || 0,
                        lastLogDate: profile.last_log_date || ''
                     });
                     
                     // Determine XP and IDs from DB data
                     setCollectedIds(profile.collected_ids || []);
                     setXp(profile.xp || 0);
                     
                     // Load vacation birds
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
                             realImg: vb.real_img,
                             realDesc: vb.real_desc,
                             seenAt: vb.seen_at
                         }));
                         setVacationBirds(loadedVacationBirds);
                     }
                     
                     // Load known locations for explorer bonus
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
                     }
                }
            }
            setAppLoading(false);
        };

        loadSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session && !isGuestRef.current) {
                setUserProfile(null);
                setCollectedIds([]);
                setXp(0);
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
            // Already logged today
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

    const checkBadges = (currentIds: string[], newBird: Bird, currentXp: number, profile: UserProfile) => {
        const earnedBadges: Badge[] = [];
        const updatedBadges = [...(profile.badges || [])];
        let extraXp = 0;

        // Helper: Get all collected bird objects
        const collectedBirds = BIRDS_DB.filter(b => currentIds.includes(b.id));
        
        // Determine current level
        const currentLevelInfo = LEVEL_THRESHOLDS.find(l => currentXp < l.max) || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
        const currentLevel = currentLevelInfo.level;

        BADGES_DB.forEach(badge => {
            if (updatedBadges.includes(badge.id)) return;

            let earned = false;
            const count = currentIds.length;
            const nowHour = new Date().getHours();

            switch (badge.condition) {
                case 'count':
                    if (badge.category === 'streak') {
                        // For streak badges, check streak value
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
                        // Handle ranges that cross midnight (e.g. 22 to 4)
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

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('profiles').update({
                xp: xp,
                collected_ids: ids,
                badges: profile.badges,
                current_streak: profile.currentStreak,
                longest_streak: profile.longestStreak,
                last_log_date: profile.lastLogDate,
                friends: profile.friends // Sync friends if updated
            }).eq('id', user.id);
        }
    };

    const handleCollect = (bird: Bird) => {
        if (collectedIds.includes(bird.id)) {
             setShowIdentification(false);
             if (!modalBird) setModalBird(bird);
            return; 
        }

        const newIds = [...collectedIds, bird.id];
        let newXp = xp + (bird.points || 10);
        let explorerBonus = 0;
        
        // Check for Explorer Bonus (new location)
        if (userLocation && locationPermission === 'granted') {
            const locationKey = getLocationKey(userLocation.lat, userLocation.lng);
            if (!knownLocations.has(locationKey)) {
                explorerBonus = 10;
                newXp += explorerBonus;
                setKnownLocations(prev => new Set([...prev, locationKey]));
            }
            
            // Save bird log with location (async)
            if (!isGuestRef.current && userProfile?.id) {
                supabase.from('bird_logs').insert({
                    user_id: userProfile.id,
                    bird_id: bird.id,
                    bird_name: bird.name,
                    lat: userLocation.lat,
                    lng: userLocation.lng
                }).then(({ error }) => {
                    if (error) console.error('Error saving bird log:', error);
                });
            }
        }
        
        // If it's a vacation bird (dynamically created), save the full object
        if (bird.id.startsWith('vacation_')) {
            setVacationBirds(prev => [...prev, bird]);
            
            // Save to Supabase (async, don't block UI)
            if (!isGuestRef.current && userProfile?.id) {
                supabase.from('vacation_birds').insert({
                    id: bird.id,
                    user_id: userProfile.id,
                    name: bird.name,
                    sci_name: bird.sciName,
                    rarity: bird.rarity,
                    points: bird.points,
                    real_img: bird.realImg,
                    real_desc: bird.realDesc,
                    seen_at: bird.seenAt
                }).then(({ error }) => {
                    if (error) console.error('Error saving vacation bird:', error);
                });
            }
        }

        // 1. Update Streak
        let updatedProfile = userProfile!;
        let streakIncreased = false;
        
        if (updatedProfile) {
            const streakResult = updateStreak(updatedProfile);
            updatedProfile = streakResult.profile;
            streakIncreased = streakResult.justIncreased;
        }

        // 2. Check Badges (Note: Pass updatedProfile which has new streak)
        const { earnedBadges, updatedBadges, extraXp } = checkBadges(newIds, bird, newXp, updatedProfile);
        updatedProfile.badges = updatedBadges;
        newXp += extraXp;

        // 3. Update Local State
        setCollectedIds(newIds);
        setXp(newXp);
        setUserProfile(updatedProfile);
        
        // 4. Sync to Cloud
        syncWithSupabase(updatedProfile, newXp, newIds);

        // 5. Trigger UI events (include explorer bonus if earned)
        setCelebration({ active: true, xp: bird.points || 10, bonus: explorerBonus > 0 ? explorerBonus : undefined });
        setShowIdentification(false);
        setModalBird(null);
        
        if (streakIncreased && updatedProfile.currentStreak > 1) {
            setTimeout(() => setNewStreak(updatedProfile.currentStreak), 500);
        }

        if (earnedBadges.length > 0) {
            const bestBadge = earnedBadges.sort((a,b) => b.xpReward - a.xpReward)[0];
            setTimeout(() => setNewBadge(bestBadge), streakIncreased && updatedProfile.currentStreak > 1 ? 3500 : 2000); 
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
                <div className="animate-fade-in pb-6">
                    {!isVacationMode && (
                        <Leaderboard 
                            currentUser={userProfile} 
                            currentXp={xp}
                            onUpdateFriends={handleUpdateFriends}
                        />
                    )}
                    
                    {isVacationMode && (
                         <div className="px-6 pt-4 pb-2">
                             <div className="bg-orange-100 border border-orange-200 rounded-2xl p-4 text-center shadow-sm">
                                 <h3 className="font-bold text-orange-600 text-lg">Urlaubs-Modus Aktiv 🌴</h3>
                                 <p className="text-xs text-orange-800 mt-1">Du sammelst jetzt exotische Arten. Diese zählen getrennt von deinem Heimat-Ranking.</p>
                             </div>
                         </div>
                    )}

                    <DailyHoroscope />
                    
                    <div className="px-6 mt-8">
                        <div className={`rounded-2xl p-4 border text-center ${isVacationMode ? 'bg-white border-orange-100' : 'bg-orange/10 border-orange/20'}`}>
                            <h4 className="font-bold text-orange-600 text-sm mb-1">Raus in die Natur!</h4>
                            <p className="text-xs text-gray-600">Geh nach draußen und nutze den Identifikations-Button, um neue Arten zu entdecken.</p>
                        </div>
                    </div>
                </div>
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
        <div className={`min-h-screen font-sans pb-safe relative transition-colors duration-500 ${isVacationMode ? 'bg-orange-50' : 'bg-cream'}`}>
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
            
            {modalBird && (
                <BirdModal 
                    bird={modalBird} 
                    onClose={() => setModalBird(null)} 
                    onFound={handleCollect}
                    isCollected={collectedIds.includes(modalBird.id)}
                />
            )}

            {showProfile && userProfile && (
                <ProfileModal 
                    user={userProfile}
                    xp={xp}
                    collectedCount={collectedIds.length}
                    onClose={() => setShowProfile(false)}
                    onLogout={handleLogout}
                />
            )}

            {showIdentification && (
                <IdentificationModal 
                    onClose={() => setShowIdentification(false)}
                    onFound={handleCollect}
                    modeType={isVacationMode ? 'vacation' : 'local'}
                />
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

            <main className="pb-32">
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
