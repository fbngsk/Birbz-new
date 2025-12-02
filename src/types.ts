export type TabType = 'home' | 'dex' | 'radar' | 'tips' | 'quiz';
export type LocationType = 'local' | 'vacation';
export type LocationSharePreference = 'always' | 'never' | 'ask';

export interface UserProfile {
    id?: string;
    name: string;
    avatarSeed: string;
    homeRegion: string;
    badges: string[];
    friends: string[];
    currentStreak: number;
    longestStreak: number;
    lastLogDate: string;
    totalDistance?: number;
    dailyDistance?: number;
    shareLocation?: LocationSharePreference;
    hasRadarPro?: boolean;
}

export interface Badge {
    id: string;
    title: string;
    description: string;
    icon: string;
    condition: 'count' | 'specific' | 'rarity' | 'location' | 'family_count' | 'rarity_count' | 'time' | 'level' | 'location_count' | 'repeat_count' | 'country_count';
    threshold?: number;
    targetValue?: string;
    targetValues?: string[];
    startHour?: number;
    endHour?: number;
    xpReward: number;
    category?: 'milestone' | 'streak' | 'family' | 'special';
}

export type BirdTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Bird {
    id: string;
    name: string;
    sciName: string;
    rarity: string;
    points: number;
    tier?: BirdTier;
    locationType?: LocationType;
    country?: string;
    img?: string;
    realImg?: string;
    realDesc?: string;
    distance?: string | number;
    seenAt?: string;
}

export interface BirdSpecies {
    speciesCode: string;
    comName: string;
    sciName: string;
    obsDt: string;
}

export interface LevelInfo {
    level: number;
    title: string;
    next: number;
    max: number;
}

export interface WikiResult {
    img: string | null;
    desc: string;
    images?: string[];
}

export interface LeaderboardEntry {
    id?: string;
    rank: number;
    name: string;
    xp: number;
    avatarSeed: string;
    isUser?: boolean;
}

export interface IdentificationResult {
    name: string;
    confidence: 'hoch' | 'mittel' | 'niedrig';
}

export interface VacationBirdResult {
    name: string;
    sciName: string;
}

export type LeaderboardScope = 'circle' | 'global';
export type WizardStep = 'location' | 'size' | 'color' | 'activity' | 'result';

// ============================================
// RADAR FEATURE TYPES
// ============================================

export interface BirdSighting {
    id: string;
    user_id: string;
    bird_id: string;
    bird_name: string;
    bird_sci_name?: string;
    bird_rarity?: string;
    lat: number;
    lng: number;
    sighted_at: string;
    created_at: string;
    flagged: boolean;
    flag_reason?: string;
}

export interface SightingCluster {
    id: string;
    lat: number;
    lng: number;
    bird_id: string;
    bird_name: string;
    bird_rarity: string;
    sighting_count: number;
    sighted_at: string;
}

export interface SightingValidation {
    valid: boolean;
    shouldFlag: boolean;
    reason?: string;
}
