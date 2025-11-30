// ERSETZE den useEffect für "Load Session & Profile on Start" (ca. Zeile 105-175)
// mit diesem Code:

    // Load Session & Profile on Start
    useEffect(() => {
        const loadSession = async () => {
            setAppLoading(true);
            console.log('[Birbz] Loading session...');
            
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                
                console.log('[Birbz] Session result:', { 
                    hasSession: !!session, 
                    userId: session?.user?.id,
                    error: sessionError 
                });
                
                if (sessionError) {
                    console.error('[Birbz] Session error:', sessionError);
                    setAppLoading(false);
                    return;
                }
                
                if (session?.user) {
                    await loadUserProfile(session.user.id);
                } else {
                    console.log('[Birbz] No session found');
                }
            } catch (error) {
                console.error('[Birbz] Failed to load session:', error);
            }
            
            setAppLoading(false);
        };

        const loadUserProfile = async (userId: string) => {
            console.log('[Birbz] Loading profile for:', userId);
            
            try {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                console.log('[Birbz] Profile result:', { profile, error });

                if (error) {
                    console.error('[Birbz] Profile fetch error:', error);
                    return;
                }

                if (profile) {
                    console.log('[Birbz] Setting profile data:', {
                        name: profile.name,
                        xp: profile.xp,
                        collected: profile.collected_ids?.length || 0
                    });
                    
                    setUserProfile({
                        id: userId,
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
                    
                    // Load vacation birds
                    const { data: vacationData } = await supabase
                        .from('vacation_birds')
                        .select('*')
                        .eq('user_id', userId);
                    
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
                    
                    // Load known locations
                    const { data: logsData } = await supabase
                        .from('bird_logs')
                        .select('lat, lng')
                        .eq('user_id', userId);
                    
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
            } catch (error) {
                console.error('[Birbz] Error loading profile:', error);
            }
        };

        loadSession();

        // Listen for auth changes (wichtig für PWA!)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[Birbz] Auth state changed:', event, session?.user?.id);
            
            if (event === 'SIGNED_IN' && session?.user) {
                // User hat sich eingeloggt - Profil laden
                await loadUserProfile(session.user.id);
            } else if (event === 'SIGNED_OUT' && !isGuestRef.current) {
                setUserProfile(null);
                setCollectedIds([]);
                setXp(0);
            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                // Token wurde erneuert - sicherstellen dass Profil geladen ist
                if (!userProfile) {
                    await loadUserProfile(session.user.id);
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);
