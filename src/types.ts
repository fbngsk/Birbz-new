export type TabType = 'home' | 'dex' | 'tips' | 'quiz';
export type LocationType = 'local' | 'vacation';

export interface UserProfile {
    id?: string; // Added ID for friend linking
    name: string;
    avatarSeed: string;
    homeRegion: string;
    badges: string[]; // List of Badge IDs
    friends: string[]; // List of User IDs (The Circle)
    currentStreak: number;
    longestStreak: number;
    lastLogDate: string; // ISO Date string (YYYY-MM-DD)
    totalDistance?: number; // in meters
    dailyDistance?: number; // in meters
}

export interface Badge {
    id: string;
    title: string;
    description: string;
    icon: string;
    condition: 'count' | 'specific' | 'rarity' | 'location' | 'family_count' | 'rarity_count' | 'time' | 'level' | 'location_count' | 'repeat_count';
    threshold?: number; // For count, family_count, rarity_count, level, location_count, repeat_count
    targetValue?: string; // For specific id, rarity string, location type, or family key
    targetValues?: string[]; // For lists
    startHour?: number; // For time condition (0-23)
    endHour?: number;   // For time condition (0-23)
    xpReward: number;
    category?: 'milestone' | 'streak' | 'family' | 'special'; // UI Grouping
}

export interface Bird {
    id: string;
    name: string;
    sciName: string;
    rarity: string;
    points: number;
    locationType?: LocationType;
    img?: string; // Placeholder or internal
    realImg?: string; // From Wikipedia
    realDesc?: string; // From Wikipedia
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
    images?: string[]; // New: Array of additional images
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
