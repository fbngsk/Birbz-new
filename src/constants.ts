import { Bird, LeaderboardEntry, LeaderboardScope, Badge, LevelInfo } from './types';

// --- KONFIGURATION ---
export const EBIRD_API_KEY = ''; 
export const SUPABASE_URL = 'https://ggziiqdulbirzipyysjn.supabase.co'; 
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnemlpcWR1bGJpcnppcHl5c2puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2ODA4NDcsImV4cCI6MjA3OTI1Njg0N30.3CANZ3lMPEy3eie0olICeXLnF83LpFV-c8RXyet68iM';

// Helper to map scientific names or IDs to Families
export const BIRD_FAMILIES: Record<string, string[]> = {
    'raptors': ['Accipiter', 'Buteo', 'Aquila', 'Haliaeetus', 'Circus', 'Milvus', 'Falco', 'Pandion', 'Pernis', 'Clanga', 'Gyps', 'Gypaetus', 'Hieraaetus', 'Circaetus'],
    'water': ['Anas', 'Aythya', 'Cygnus', 'Podiceps', 'Ardea', 'Larus', 'Sterna', 'Phalacrocorax', 'Tadorna', 'Spatula', 'Mareca', 'Netta', 'Gavia', 'Tachybaptus', 'Mergus', 'Somateria', 'Melanitta', 'Bucephala', 'Clangula', 'Fulmarus', 'Morus', 'Stercorarius', 'Rissa', 'Hydrocoloeus', 'Ichthyaetus', 'Chroicocephalus', 'Hydroprogne', 'Gelochelidon', 'Thalasseus', 'Sternula', 'Chlidonias'],
    'tits': ['Parus', 'Cyanistes', 'Lophophanes', 'Periparus', 'Poecile', 'Aegithalos', 'Remiz', 'Panurus'],
    'ducks': ['Anas', 'Aythya', 'Tadorna', 'Spatula', 'Mareca', 'Netta', 'Bucephala', 'Mergus', 'Somateria', 'Melanitta', 'Clangula', 'Oxyura', 'Melanitta'],
    'owls': ['Strix', 'Tyto', 'Bubo', 'Athene', 'Asio', 'Glaucidium', 'Aegolius', 'Otus'],
    'finches': ['Fringilla', 'Carduelis', 'Chloris', 'Spinus', 'Linaria', 'Pyrrhula', 'Coccothraustes', 'Loxia', 'Serinus', 'Carpodacus', 'Pinicola'],
    'thrushes': ['Turdus', 'Luscinia', 'Erithacus', 'Phoenicurus', 'Saxicola', 'Oenanthe', 'Monticola'],
    'corvids': ['Corvus', 'Pica', 'Garrulus', 'Coloeus', 'Nucifraga', 'Pyrrhocorax'],
    'woodpeckers': ['Picus', 'Dryocopus', 'Dendrocopos', 'Dendrocoptes', 'Dryobates', 'Jynx'],
    'waders': ['Calidris', 'Tringa', 'Numenius', 'Limosa', 'Gallinago', 'Scolopax', 'Charadrius', 'Vanellus', 'Haematopus', 'Recurvirostra', 'Actitis', 'Himantopus', 'Burhinus', 'Pluvialis', 'Arenaria', 'Phalaropus', 'Lymnocryptes'],
    'warblers': ['Sylvia', 'Phylloscopus', 'Acrocephalus', 'Locustella', 'Hippolais', 'Cettia', 'Cisticola'],
    'pigeons': ['Columba', 'Streptopelia'],
    'buntings': ['Emberiza', 'Calcarius', 'Plectrophenax']
};

// --- BADGES DATABASE ---
const MILESTONE_BADGES: Badge[] = [
    { id: 'first_step', title: 'Erster Schritt', description: 'Sammle deinen ersten Vogel.', icon: '🥚', condition: 'count', threshold: 1, xpReward: 50, category: 'milestone' },
    { id: 'collector_5', title: 'Beobachter', description: 'Sammle 5 verschiedene Vogelarten.', icon: '🔭', condition: 'count', threshold: 5, xpReward: 100, category: 'milestone' },
    { id: 'collector_10', title: 'Sammler', description: 'Sammle 10 verschiedene Vogelarten.', icon: '📚', condition: 'count', threshold: 10, xpReward: 200, category: 'milestone' },
    { id: 'collector_25', title: 'Ornithologe', description: 'Sammle 25 verschiedene Vogelarten.', icon: '🎓', condition: 'count', threshold: 25, xpReward: 500, category: 'milestone' },
    { id: 'collector_50', title: 'Experte', description: 'Sammle 50 verschiedene Vogelarten.', icon: '🏅', condition: 'count', threshold: 50, xpReward: 1000, category: 'milestone' },
    { id: 'collector_100', title: 'Meister', description: 'Sammle 100 verschiedene Vogelarten.', icon: '🏆', condition: 'count', threshold: 100, xpReward: 2000, category: 'milestone' },
    { id: 'collector_200', title: 'Legende', description: 'Sammle 200 verschiedene Vogelarten.', icon: '⚜️', condition: 'count', threshold: 200, xpReward: 5000, category: 'milestone' },
    { id: 'collector_300', title: 'Vogel-Gott', description: 'Sammle 300 verschiedene Vogelarten.', icon: '🌟', condition: 'count', threshold: 300, xpReward: 10000, category: 'milestone' },
];

const STREAK_BADGES: Badge[] = [
    { id: 'streak_3', title: 'Feuer und Flamme', description: 'Halte einen Streak von 3 Tagen.', icon: '🔥', condition: 'count', threshold: 3, xpReward: 100, category: 'streak' },
    { id: 'streak_7', title: 'Woche voll', description: 'Logge 7 Tage in Folge einen Vogel.', icon: '📅', condition: 'count', threshold: 7, xpReward: 300, category: 'streak' },
    { id: 'streak_14', title: 'Doppel-Woche', description: '14 Tage Streak.', icon: '🚀', condition: 'count', threshold: 14, xpReward: 500, category: 'streak' },
    { id: 'streak_30', title: 'Monats-Monarch', description: '30 Tage in Folge aktiv.', icon: '🗓️', condition: 'count', threshold: 30, xpReward: 1000, category: 'streak' },
    { id: 'streak_100', title: 'Hundert Tage', description: '100 Tage in Folge aktiv.', icon: '💯', condition: 'count', threshold: 100, xpReward: 5000, category: 'streak' },
    { id: 'streak_365', title: 'Ein Jahr Birbz', description: '365 Tage Streak.', icon: '👑', condition: 'count', threshold: 365, xpReward: 20000, category: 'streak' },
];

const TIME_BADGES: Badge[] = [
    { id: 'early_bird', title: 'Frühaufsteher', description: 'Logge einen Vogel zwischen 5:00 und 8:00 Uhr.', icon: '🌅', condition: 'time', startHour: 5, endHour: 8, xpReward: 150, category: 'streak' },
    { id: 'lunch_break', title: 'Mittagspause', description: 'Logge einen Vogel zwischen 12:00 und 13:00 Uhr.', icon: '🥪', condition: 'time', startHour: 12, endHour: 13, xpReward: 100, category: 'streak' },
    { id: 'night_owl_time', title: 'Nachtschicht', description: 'Logge einen Vogel nach 22:00 Uhr.', icon: '🌙', condition: 'time', startHour: 22, endHour: 4, xpReward: 200, category: 'streak' },
];

const FAMILY_BADGES: Badge[] = [
    { id: 'raptor_1', title: 'Adlerauge I', description: 'Sammle 1 Greifvogel.', icon: '🦅', condition: 'family_count', targetValue: 'raptors', threshold: 1, xpReward: 100, category: 'family' },
    { id: 'raptor_5', title: 'Adlerauge II', description: 'Sammle 5 Greifvögel.', icon: '🦅', condition: 'family_count', targetValue: 'raptors', threshold: 5, xpReward: 500, category: 'family' },
    { id: 'raptor_10', title: 'Adlerauge III', description: 'Sammle 10 Greifvögel.', icon: '🦅', condition: 'family_count', targetValue: 'raptors', threshold: 10, xpReward: 1000, category: 'family' },
    { id: 'water_5', title: 'Küstenwache I', description: 'Sammle 5 Wasservögel.', icon: '🌊', condition: 'family_count', targetValue: 'water', threshold: 5, xpReward: 250, category: 'family' },
    { id: 'water_20', title: 'Küstenwache II', description: 'Sammle 20 Wasservögel.', icon: '🌊', condition: 'family_count', targetValue: 'water', threshold: 20, xpReward: 1000, category: 'family' },
    { id: 'tit_3', title: 'Meisen-Freund', description: 'Sammle 3 Meisenarten.', icon: '🐦', condition: 'family_count', targetValue: 'tits', threshold: 3, xpReward: 150, category: 'family' },
    { id: 'owl_1', title: 'Eulen-Späher', description: 'Entdecke 1 Eule.', icon: '🦉', condition: 'family_count', targetValue: 'owls', threshold: 1, xpReward: 200, category: 'family' },
    { id: 'owl_3', title: 'Eulen-Flüsterer', description: 'Entdecke 3 Eulenarten.', icon: '🦉', condition: 'family_count', targetValue: 'owls', threshold: 3, xpReward: 600, category: 'family' },
    { id: 'finch_3', title: 'Finken-Fan', description: 'Sammle 3 Finkenarten.', icon: '🌿', condition: 'family_count', targetValue: 'finches', threshold: 3, xpReward: 150, category: 'family' },
    { id: 'woodpecker_3', title: 'Zimmermann', description: 'Sammle 3 Spechte.', icon: '🔨', condition: 'family_count', targetValue: 'woodpeckers', threshold: 3, xpReward: 300, category: 'family' },
    { id: 'corvid_3', title: 'Raben-Vater', description: 'Sammle 3 Rabenvögel.', icon: '🏴', condition: 'family_count', targetValue: 'corvids', threshold: 3, xpReward: 200, category: 'family' },
    { id: 'wader_5', title: 'Wattwanderer', description: 'Sammle 5 Watvögel.', icon: '🏖️', condition: 'family_count', targetValue: 'waders', threshold: 5, xpReward: 300, category: 'family' },
    { id: 'warbler_5', title: 'Sänger', description: 'Sammle 5 Grasmücken/Sänger.', icon: '🎶', condition: 'family_count', targetValue: 'warblers', threshold: 5, xpReward: 250, category: 'family' },
    { id: 'bunting_3', title: 'Ammern-Sammler', description: 'Sammle 3 Ammern.', icon: '🌾', condition: 'family_count', targetValue: 'buntings', threshold: 3, xpReward: 300, category: 'family' },
    { id: 'duck_5', title: 'Enten-Trainer', description: 'Sammle 5 Entenarten.', icon: '🦆', condition: 'family_count', targetValue: 'ducks', threshold: 5, xpReward: 200, category: 'family' },
];

const SPECIAL_BADGES: Badge[] = [
    { id: 'vacationer', title: 'Weltenbummler', description: 'Entdecke einen Vogel im Urlaubsmodus.', icon: '🌴', condition: 'location', targetValue: 'vacation', xpReward: 150, category: 'special' },
    { id: 'rare_find', title: 'Glücksgriff', description: 'Entdecke einen seltenen Vogel.', icon: '💎', condition: 'rarity', targetValue: 'Selten', xpReward: 300, category: 'special' },
    { id: 'danger_find', title: 'Rote Liste', description: 'Entdecke eine gefährdete Art.', icon: '🚨', condition: 'rarity', targetValue: 'Gefährdet', xpReward: 400, category: 'special' },
    { id: 'eisvogel_fan', title: 'Königsfischer', description: 'Entdecke einen Eisvogel.', icon: '👑', condition: 'specific', targetValue: 'eisvogel', xpReward: 500, category: 'special' },
    { id: 'city_bird', title: 'Stadtkind', description: 'Entdecke eine Stadttaube oder Spatz.', icon: '🏙️', condition: 'specific', targetValue: 'haussperling', xpReward: 50, category: 'special' },
    { id: 'walker', title: 'Wanderer', description: 'Laufe insgesamt 10km auf Vogelsuche.', icon: '🥾', condition: 'count', threshold: 10, xpReward: 200, category: 'special' },
    { id: 'level_2', title: 'Level Up: Ornithologe', description: 'Erreiche Level 2.', icon: '⬆️', condition: 'level', threshold: 2, xpReward: 200, category: 'special' },
    { id: 'level_5', title: 'Level Up: Legende', description: 'Erreiche Level 5.', icon: '🏆', condition: 'level', threshold: 5, xpReward: 1000, category: 'special' },
    // Location-based badges
    { id: 'urban_birder', title: 'Urbaner Ornithologe', description: 'Sammle 20 verschiedene Arten in der Stadt.', icon: '🏙️', condition: 'count', threshold: 20, xpReward: 500, category: 'special' },
    { id: 'explorer_5', title: 'Entdecker I', description: 'Logge Vögel an 5 verschiedenen Orten.', icon: '🗺️', condition: 'location_count', threshold: 5, xpReward: 200, category: 'special' },
    { id: 'explorer_15', title: 'Entdecker II', description: 'Logge Vögel an 15 verschiedenen Orten.', icon: '🗺️', condition: 'location_count', threshold: 15, xpReward: 500, category: 'special' },
    { id: 'explorer_50', title: 'Entdecker III', description: 'Logge Vögel an 50 verschiedenen Orten.', icon: '🧭', condition: 'location_count', threshold: 50, xpReward: 1500, category: 'special' },
    { id: 'loyal_10', title: 'Treuer Begleiter', description: 'Logge dieselbe Art 10 mal.', icon: '🤝', condition: 'repeat_count', threshold: 10, xpReward: 300, category: 'special' },
    // Country/Travel badges
    { id: 'globetrotter_5', title: 'Globetrotter', description: 'Entdecke Vögel in 5 verschiedenen Ländern.', icon: '🌍', condition: 'country_count', threshold: 5, xpReward: 500, category: 'special' },
    { id: 'globetrotter_10', title: 'Weltreisender', description: 'Entdecke Vögel in 10 verschiedenen Ländern.', icon: '🗺️', condition: 'country_count', threshold: 10, xpReward: 1000, category: 'special' },
    { id: 'globetrotter_20', title: 'Ornithologe ohne Grenzen', description: 'Entdecke Vögel in 20 verschiedenen Ländern.', icon: '✈️', condition: 'country_count', threshold: 20, xpReward: 2500, category: 'special' },
    { id: 'globetrotter_30', title: 'Vogelflüsterer der Welt', description: 'Entdecke Vögel in 30 verschiedenen Ländern.', icon: '🌏', condition: 'country_count', threshold: 30, xpReward: 5000, category: 'special' },
];

export const BADGES_DB: Badge[] = [
    ...MILESTONE_BADGES,
    ...STREAK_BADGES,
    ...TIME_BADGES,
    ...FAMILY_BADGES,
    ...SPECIAL_BADGES
];

export const BIRDS_DB: Bird[] = [
    // --- SEETAUCHER & LAPPENTAUCHER ---
    { id: 'sterntaucher', name: 'Sterntaucher', sciName: 'Gavia stellata', rarity: 'Wintergast (Selten)', points: 120, locationType: 'local' },
    { id: 'prachttaucher', name: 'Prachttaucher', sciName: 'Gavia arctica', rarity: 'Wintergast (Selten)', points: 130, locationType: 'local' },
    { id: 'eistaucher', name: 'Eistaucher', sciName: 'Gavia immer', rarity: 'Sehr Selten', points: 350, locationType: 'local' },
    { id: 'zwergtaucher', name: 'Zwergtaucher', sciName: 'Tachybaptus ruficollis', rarity: 'Mittel', points: 50, locationType: 'local' },
    { id: 'haubentaucher', name: 'Haubentaucher', sciName: 'Podiceps cristatus', rarity: 'Häufig', points: 20, locationType: 'local' },
    { id: 'rothalstaucher', name: 'Rothalstaucher', sciName: 'Podiceps grisegena', rarity: 'Selten', points: 100, locationType: 'local' },
    { id: 'schwarzhalstaucher', name: 'Schwarzhalstaucher', sciName: 'Podiceps nigricollis', rarity: 'Selten', points: 110, locationType: 'local' },
    { id: 'ohrentaucher', name: 'Ohrentaucher', sciName: 'Podiceps auritus', rarity: 'Sehr Selten', points: 250, locationType: 'local' },

    // --- STURMVÖGEL ---
    { id: 'eissturmvogel', name: 'Eissturmvogel', sciName: 'Fulmarus glacialis', rarity: 'Helgoland/Küste', points: 200, locationType: 'local' },
    { id: 'sturmschwalbe', name: 'Sturmschwalbe', sciName: 'Hydrobates pelagicus', rarity: 'Sehr Selten', points: 300, locationType: 'local' },

    // --- KORMORANE & TÖLPEL & REIHER ---
    { id: 'kormoran', name: 'Kormoran', sciName: 'Phalacrocorax carbo', rarity: 'Häufig', points: 25, locationType: 'local' },
    { id: 'kraehenscharbe', name: 'Krähenscharbe', sciName: 'Gulosus aristotelis', rarity: 'Sehr Selten', points: 300, locationType: 'local' },
    { id: 'basstoelpel', name: 'Basstölpel', sciName: 'Morus bassanus', rarity: 'Helgoland', points: 180, locationType: 'local' },
    { id: 'rohrdommel', name: 'Rohrdommel', sciName: 'Botaurus stellaris', rarity: 'Sehr Selten', points: 300, locationType: 'local' },
    { id: 'zwergdommel', name: 'Zwergdommel', sciName: 'Ixobrychus minutus', rarity: 'Sehr Selten', points: 280, locationType: 'local' },
    { id: 'nachtreiher', name: 'Nachtreiher', sciName: 'Nycticorax nycticorax', rarity: 'Selten', points: 200, locationType: 'local' },
    { id: 'rallenreiher', name: 'Rallenreiher', sciName: 'Ardeola ralloides', rarity: 'Sehr Selten', points: 400, locationType: 'local' },
    { id: 'kuhreiher', name: 'Kuhreiher', sciName: 'Bubulcus ibis', rarity: 'Selten', points: 250, locationType: 'local' },
    { id: 'silberreiher', name: 'Silberreiher', sciName: 'Ardea alba', rarity: 'Mittel', points: 60, locationType: 'local' },
    { id: 'graureiher', name: 'Graureiher', sciName: 'Ardea cinerea', rarity: 'Häufig', points: 20, locationType: 'local' },
    { id: 'purpurreiher', name: 'Purpurreiher', sciName: 'Ardea purpurea', rarity: 'Selten', points: 150, locationType: 'local' },
    
    // --- IBISSE & LÖFFLER ---
    { id: 'braunsichler', name: 'Braunsichler', sciName: 'Plegadis falcinellus', rarity: 'Sehr Selten', points: 450, locationType: 'local' },
    { id: 'löffler', name: 'Löffler', sciName: 'Platalea leucorodia', rarity: 'Mittel (Küste)', points: 180, locationType: 'local' },

    // --- STÖRCHE ---
    { id: 'weissstorch', name: 'Weißstorch', sciName: 'Ciconia ciconia', rarity: 'Mittel', points: 50, locationType: 'local' },
    { id: 'schwarzstorch', name: 'Schwarzstorch', sciName: 'Ciconia nigra', rarity: 'Legendär', points: 800, tier: 'legendary', locationType: 'local' },

    // --- ENTENVÖGEL ---
    { id: 'hoeckerschwan', name: 'Höckerschwan', sciName: 'Cygnus olor', rarity: 'Häufig', points: 15, locationType: 'local' },
    { id: 'singschwan', name: 'Singschwan', sciName: 'Cygnus cygnus', rarity: 'Wintergast', points: 80, locationType: 'local' },
    { id: 'zwergschwan', name: 'Zwergschwan', sciName: 'Cygnus columbianus', rarity: 'Wintergast', points: 100, locationType: 'local' },
    { id: 'saatgans', name: 'Saatgans', sciName: 'Anser fabalis', rarity: 'Wintergast', points: 60, locationType: 'local' },
    { id: 'kurzschnabelgans', name: 'Kurzschnabelgans', sciName: 'Anser brachyrhynchus', rarity: 'Wintergast', points: 120, locationType: 'local' },
    { id: 'blessgans', name: 'Blässgans', sciName: 'Anser albifrons', rarity: 'Wintergast', points: 50, locationType: 'local' },
    { id: 'zwerggans', name: 'Zwerggans', sciName: 'Anser erythropus', rarity: 'Sehr Selten', points: 400, locationType: 'local' },
    { id: 'graugans', name: 'Graugans', sciName: 'Anser anser', rarity: 'Häufig', points: 20, locationType: 'local' },
    { id: 'kanadagans', name: 'Kanadagans', sciName: 'Branta canadensis', rarity: 'Mittel', points: 30, locationType: 'local' },
    { id: 'nonnengans', name: 'Nonnengans', sciName: 'Branta leucopsis', rarity: 'Küste (Mittel)', points: 60, locationType: 'local' },
    { id: 'ringelgans', name: 'Ringelgans', sciName: 'Branta bernicla', rarity: 'Küste (Mittel)', points: 60, locationType: 'local' },
    { id: 'rothalsgans', name: 'Rothalsgans', sciName: 'Branta ruficollis', rarity: 'Sehr Selten', points: 500, locationType: 'local' },
    { id: 'nilgans', name: 'Nilgans', sciName: 'Alopochen aegyptiaca', rarity: 'Häufig (Invasiv)', points: 20, locationType: 'local' },
    { id: 'brandgans', name: 'Brandgans', sciName: 'Tadorna tadorna', rarity: 'Küste (Häufig)', points: 40, locationType: 'local' },
    { id: 'rostgans', name: 'Rostgans', sciName: 'Tadorna ferruginea', rarity: 'Selten (Invasiv)', points: 80, locationType: 'local' },
    { id: 'mandarinente', name: 'Mandarinente', sciName: 'Aix galericulata', rarity: 'Selten (Park)', points: 100, locationType: 'local' },
    { id: 'brautente', name: 'Brautente', sciName: 'Aix sponsa', rarity: 'Sehr Selten (Park)', points: 150, locationType: 'local' },
    { id: 'pfeifente', name: 'Pfeifente', sciName: 'Mareca penelope', rarity: 'Wintergast', points: 50, locationType: 'local' },
    { id: 'schnatterente', name: 'Schnatterente', sciName: 'Mareca strepera', rarity: 'Mittel', points: 60, locationType: 'local' },
    { id: 'krickente', name: 'Krickente', sciName: 'Anas crecca', rarity: 'Mittel', points: 50, locationType: 'local' },
    { id: 'stockente', name: 'Stockente', sciName: 'Anas platyrhynchos', rarity: 'Häufig', points: 10, locationType: 'local' },
    { id: 'spiessente', name: 'Spießente', sciName: 'Anas acuta', rarity: 'Selten', points: 80, locationType: 'local' },
    { id: 'loeffelente', name: 'Löffelente', sciName: 'Spatula clypeata', rarity: 'Mittel', points: 70, locationType: 'local' },
    { id: 'knaekente', name: 'Knäkente', sciName: 'Spatula querquedula', rarity: 'Selten', points: 90, locationType: 'local' },
    { id: 'kolbenente', name: 'Kolbenente', sciName: 'Netta rufina', rarity: 'Selten', points: 100, locationType: 'local' },
    { id: 'tafelente', name: 'Tafelente', sciName: 'Aythya ferina', rarity: 'Mittel', points: 50, locationType: 'local' },
    { id: 'moorente', name: 'Moorente', sciName: 'Aythya nyroca', rarity: 'Sehr Selten', points: 300, locationType: 'local' },
    { id: 'reiherente', name: 'Reiherente', sciName: 'Aythya fuligula', rarity: 'Häufig', points: 25, locationType: 'local' },
    { id: 'bergente', name: 'Bergente', sciName: 'Aythya marila', rarity: 'Wintergast', points: 80, locationType: 'local' },
    { id: 'eiderente', name: 'Eiderente', sciName: 'Somateria mollissima', rarity: 'Küste (Häufig)', points: 60, locationType: 'local' },
    { id: 'eisente', name: 'Eisente', sciName: 'Clangula hyemalis', rarity: 'Wintergast (Küste)', points: 120, locationType: 'local' },
    { id: 'trauerente', name: 'Trauerente', sciName: 'Melanitta nigra', rarity: 'Wintergast', points: 90, locationType: 'local' },
    { id: 'samtente', name: 'Samtente', sciName: 'Melanitta fusca', rarity: 'Wintergast', points: 100, locationType: 'local' },
    { id: 'schellente', name: 'Schellente', sciName: 'Bucephala clangula', rarity: 'Wintergast', points: 50, locationType: 'local' },
    { id: 'zwergsaeger', name: 'Zwergsäger', sciName: 'Mergellus albellus', rarity: 'Wintergast', points: 110, locationType: 'local' },
    { id: 'gaensesaeger', name: 'Gänsesäger', sciName: 'Mergus merganser', rarity: 'Mittel', points: 60, locationType: 'local' },
    { id: 'mittelsaeger', name: 'Mittelsäger', sciName: 'Mergus serrator', rarity: 'Küste (Mittel)', points: 80, locationType: 'local' },
    { id: 'schwarzkopf-ruderente', name: 'Schwarzkopf-Ruderente', sciName: 'Oxyura jamaicensis', rarity: 'Selten (Invasiv)', points: 150, locationType: 'local' },

    // --- GREIFVÖGEL ---
    { id: 'fischadler', name: 'Fischadler', sciName: 'Pandion haliaetus', rarity: 'Selten', points: 200, locationType: 'local' },
    { id: 'wespenbussard', name: 'Wespenbussard', sciName: 'Pernis apivorus', rarity: 'Selten', points: 150, locationType: 'local' },
    { id: 'gaensegeier', name: 'Gänsegeier', sciName: 'Gyps fulvus', rarity: 'Sehr Selten (Alpen)', points: 500, locationType: 'local' },
    { id: 'bartgeier', name: 'Bartgeier', sciName: 'Gypaetus barbatus', rarity: 'Sehr Selten (Alpen)', points: 600, locationType: 'local' },
    { id: 'schlangenadler', name: 'Schlangenadler', sciName: 'Circaetus gallicus', rarity: 'Extrem Selten', points: 800, locationType: 'local' },
    { id: 'zwergadler', name: 'Zwergadler', sciName: 'Hieraaetus pennatus', rarity: 'Extrem Selten', points: 800, locationType: 'local' },
    { id: 'steinadler', name: 'Steinadler', sciName: 'Aquila chrysaetos', rarity: 'Alpen (Sehr Selten)', points: 400, locationType: 'local' },
    { id: 'schreiadler', name: 'Schreiadler', sciName: 'Clanga pomarina', rarity: 'Legendär', points: 1000, tier: 'legendary', locationType: 'local' },
    { id: 'sperber', name: 'Sperber', sciName: 'Accipiter nisus', rarity: 'Mittel', points: 60, locationType: 'local' },
    { id: 'habicht', name: 'Habicht', sciName: 'Accipiter gentilis', rarity: 'Selten', points: 100, locationType: 'local' },
    { id: 'rohrweihe', name: 'Rohrweihe', sciName: 'Circus aeruginosus', rarity: 'Mittel', points: 80, locationType: 'local' },
    { id: 'kornweihe', name: 'Kornweihe', sciName: 'Circus cyaneus', rarity: 'Legendär', points: 900, tier: 'legendary', locationType: 'local' },
    { id: 'wiesenweihe', name: 'Wiesenweihe', sciName: 'Circus pygargus', rarity: 'Epic', points: 400, tier: 'epic', locationType: 'local' },
    { id: 'steppenweihe', name: 'Steppenweihe', sciName: 'Circus macrourus', rarity: 'Sehr Selten', points: 400, locationType: 'local' },
    { id: 'rotmilan', name: 'Rotmilan', sciName: 'Milvus milvus', rarity: 'Mittel (DE-Verantwortung)', points: 70, locationType: 'local' },
    { id: 'schwarzmilan', name: 'Schwarzmilan', sciName: 'Milvus migrans', rarity: 'Selten', points: 90, locationType: 'local' },
    { id: 'seeadler', name: 'Seeadler', sciName: 'Haliaeetus albicilla', rarity: 'Legendär', points: 1000, tier: 'legendary', locationType: 'local' },
    { id: 'maeusebussard', name: 'Mäusebussard', sciName: 'Buteo buteo', rarity: 'Häufig', points: 30, locationType: 'local' },
    { id: 'raufussbussard', name: 'Raufußbussard', sciName: 'Buteo lagopus', rarity: 'Wintergast', points: 110, locationType: 'local' },

    // --- FALKEN ---
    { id: 'turmfalke', name: 'Turmfalke', sciName: 'Falco tinnunculus', rarity: 'Häufig', points: 30, locationType: 'local' },
    { id: 'rotfussfalke', name: 'Rotfußfalke', sciName: 'Falco vespertinus', rarity: 'Sehr Selten', points: 350, locationType: 'local' },
    { id: 'baumfalke', name: 'Baumfalke', sciName: 'Falco subbuteo', rarity: 'Selten', points: 120, locationType: 'local' },
    { id: 'wanderfalke', name: 'Wanderfalke', sciName: 'Falco peregrinus', rarity: 'Epic', points: 400, tier: 'epic', locationType: 'local' },
    { id: 'merlin', name: 'Merlin', sciName: 'Falco columbarius', rarity: 'Wintergast (Selten)', points: 180, locationType: 'local' },

    // --- HÜHNERVÖGEL ---
    { id: 'haselhuhn', name: 'Haselhuhn', sciName: 'Tetrastes bonasia', rarity: 'Epic', points: 400, tier: 'epic', locationType: 'local' },
    { id: 'auerhuhn', name: 'Auerhuhn', sciName: 'Tetrao urogallus', rarity: 'Legendär', points: 1200, tier: 'legendary', locationType: 'local' },
    { id: 'birkhuhn', name: 'Birkhuhn', sciName: 'Lyrurus tetrix', rarity: 'Gefährdet', points: 400, locationType: 'local' },
    { id: 'alpenschneehuhn', name: 'Alpenschneehuhn', sciName: 'Lagopus muta', rarity: 'Alpen (Sehr Selten)', points: 500, locationType: 'local' },
    { id: 'rebhuhn', name: 'Rebhuhn', sciName: 'Perdix perdix', rarity: 'Epic', points: 350, tier: 'epic', locationType: 'local' },
    { id: 'wachtel', name: 'Wachtel', sciName: 'Coturnix coturnix', rarity: 'Selten', points: 120, locationType: 'local' },
    { id: 'fasan', name: 'Fasan', sciName: 'Phasianus colchicus', rarity: 'Mittel', points: 40, locationType: 'local' },

    // --- RALLEN & KRANICHE & TRAPPEN ---
    { id: 'wasserralle', name: 'Wasserralle', sciName: 'Rallus aquaticus', rarity: 'Selten', points: 110, locationType: 'local' },
    { id: 'tuepfelsumpfhuhn', name: 'Tüpfelsumpfhuhn', sciName: 'Porzana porzana', rarity: 'Sehr Selten', points: 300, locationType: 'local' },
    { id: 'kleines_sumpfhuhn', name: 'Kleines Sumpfhuhn', sciName: 'Zapornia parva', rarity: 'Sehr Selten', points: 350, locationType: 'local' },
    { id: 'teichhuhn', name: 'Teichhuhn', sciName: 'Gallinula chloropus', rarity: 'Mittel', points: 40, locationType: 'local' },
    { id: 'blaesshuhn', name: 'Blässhuhn', sciName: 'Fulica atra', rarity: 'Häufig', points: 20, locationType: 'local' },
    { id: 'wachtelkoenig', name: 'Wachtelkönig', sciName: 'Crex crex', rarity: 'Gefährdet', points: 300, locationType: 'local' },
    { id: 'kranich', name: 'Kranich', sciName: 'Grus grus', rarity: 'Mittel (Zug)', points: 80, locationType: 'local' },
    { id: 'grosstrappe', name: 'Großtrappe', sciName: 'Otis tarda', rarity: 'Legendär', points: 1500, tier: 'legendary', locationType: 'local' },
    { id: 'zwergtrappe', name: 'Zwergtrappe', sciName: 'Tetrax tetrax', rarity: 'Extrem Selten', points: 1000, locationType: 'local' },

    // --- WATVÖGEL (Limikolen) ---
    { id: 'austernfischer', name: 'Austernfischer', sciName: 'Haematopus ostralegus', rarity: 'Küste (Häufig)', points: 50, locationType: 'local' },
    { id: 'stelzenlaeufer', name: 'Stelzenläufer', sciName: 'Himantopus himantopus', rarity: 'Sehr Selten', points: 250, locationType: 'local' },
    { id: 'saebelschnaebler', name: 'Säbelschnäbler', sciName: 'Recurvirostra avosetta', rarity: 'Küste (Mittel)', points: 90, locationType: 'local' },
    { id: 'triel', name: 'Triel', sciName: 'Burhinus oedicnemus', rarity: 'Extrem Selten', points: 600, locationType: 'local' },
    { id: 'flussregenpfeifer', name: 'Flussregenpfeifer', sciName: 'Charadrius dubius', rarity: 'Selten', points: 120, locationType: 'local' },
    { id: 'sandregenpfeifer', name: 'Sandregenpfeifer', sciName: 'Charadrius hiaticula', rarity: 'Küste (Mittel)', points: 80, locationType: 'local' },
    { id: 'seeregenpfeifer', name: 'Seeregenpfeifer', sciName: 'Charadrius alexandrinus', rarity: 'Sehr Selten', points: 400, locationType: 'local' },
    { id: 'goldregenpfeifer', name: 'Goldregenpfeifer', sciName: 'Pluvialis apricaria', rarity: 'Legendär', points: 900, tier: 'legendary', locationType: 'local' },
    { id: 'kiebitzregenpfeifer', name: 'Kiebitzregenpfeifer', sciName: 'Pluvialis squatarola', rarity: 'Küste (Zug)', points: 120, locationType: 'local' },
    { id: 'mornellregenpfeifer', name: 'Mornellregenpfeifer', sciName: 'Charadrius morinellus', rarity: 'Sehr Selten (Zug)', points: 400, locationType: 'local' },
    { id: 'kiebitz', name: 'Kiebitz', sciName: 'Vanellus vanellus', rarity: 'Epic', points: 300, tier: 'epic', locationType: 'local' },
    { id: 'knutt', name: 'Knutt', sciName: 'Calidris canutus', rarity: 'Küste (Zug)', points: 100, locationType: 'local' },
    { id: 'sanderling', name: 'Sanderling', sciName: 'Calidris alba', rarity: 'Küste (Zug)', points: 90, locationType: 'local' },
    { id: 'zwergstrandlaeufer', name: 'Zwergstrandläufer', sciName: 'Calidris minuta', rarity: 'Zugvogel', points: 150, locationType: 'local' },
    { id: 'temminckstrandlaeufer', name: 'Temminckstrandläufer', sciName: 'Calidris temminckii', rarity: 'Zugvogel', points: 180, locationType: 'local' },
    { id: 'sichelstrandlaeufer', name: 'Sichelstrandläufer', sciName: 'Calidris ferruginea', rarity: 'Zugvogel', points: 160, locationType: 'local' },
    { id: 'meerstrandlaeufer', name: 'Meerstrandläufer', sciName: 'Calidris maritima', rarity: 'Küste (Winter)', points: 200, locationType: 'local' },
    { id: 'alpenstrandlaeufer', name: 'Alpenstrandläufer', sciName: 'Calidris alpina', rarity: 'Küste (Häufig)', points: 70, locationType: 'local' },
    { id: 'sumpflaeufer', name: 'Sumpfläufer', sciName: 'Calidris falcinellus', rarity: 'Sehr Selten', points: 350, locationType: 'local' },
    { id: 'kampflaeufer', name: 'Kampfläufer', sciName: 'Calidris pugnax', rarity: 'Selten', points: 200, locationType: 'local' },
    { id: 'waldschnepfe', name: 'Waldschnepfe', sciName: 'Scolopax rusticola', rarity: 'Selten', points: 150, locationType: 'local' },
    { id: 'zwergschnepfe', name: 'Zwergschnepfe', sciName: 'Lymnocryptes minimus', rarity: 'Sehr Selten', points: 250, locationType: 'local' },
    { id: 'bekassine', name: 'Bekassine', sciName: 'Gallinago gallinago', rarity: 'Selten', points: 130, locationType: 'local' },
    { id: 'uferschnepfe', name: 'Uferschnepfe', sciName: 'Limosa limosa', rarity: 'Gefährdet', points: 250, locationType: 'local' },
    { id: 'pfuhlschnepfe', name: 'Pfuhlschnepfe', sciName: 'Limosa lapponica', rarity: 'Küste (Zug)', points: 110, locationType: 'local' },
    { id: 'regenbrachvogel', name: 'Regenbrachvogel', sciName: 'Numenius phaeopus', rarity: 'Zugvogel', points: 140, locationType: 'local' },
    { id: 'grosserbrachvogel', name: 'Großer Brachvogel', sciName: 'Numenius arquata', rarity: 'Gefährdet', points: 180, locationType: 'local' },
    { id: 'dunklerwasserlaeufer', name: 'Dunkler Wasserläufer', sciName: 'Tringa erythropus', rarity: 'Zugvogel', points: 120, locationType: 'local' },
    { id: 'rotschenkel', name: 'Rotschenkel', sciName: 'Tringa totanus', rarity: 'Mittel', points: 80, locationType: 'local' },
    { id: 'gruenschenkel', name: 'Grünschenkel', sciName: 'Tringa nebularia', rarity: 'Zugvogel', points: 90, locationType: 'local' },
    { id: 'waldwasserlaeufer', name: 'Waldwasserläufer', sciName: 'Tringa ochropus', rarity: 'Selten', points: 110, locationType: 'local' },
    { id: 'bruchwasserlaeufer', name: 'Bruchwasserläufer', sciName: 'Tringa glareola', rarity: 'Zugvogel', points: 115, locationType: 'local' },
    { id: 'flussuferlaeufer', name: 'Flussuferläufer', sciName: 'Actitis hypoleucos', rarity: 'Mittel', points: 85, locationType: 'local' },
    { id: 'steinwaelzer', name: 'Steinwälzer', sciName: 'Arenaria interpres', rarity: 'Küste', points: 100, locationType: 'local' },
    { id: 'odinshuehnchen', name: 'Odinshühnchen', sciName: 'Phalaropus lobatus', rarity: 'Sehr Selten', points: 300, locationType: 'local' },

    // --- RAUBMÖWEN (Skuas) ---
    { id: 'spatelraubmoewe', name: 'Spatelraubmöwe', sciName: 'Stercorarius pomarinus', rarity: 'Küste (Selten)', points: 250, locationType: 'local' },
    { id: 'schmarotzerraubmoewe', name: 'Schmarotzerraubmöwe', sciName: 'Stercorarius parasiticus', rarity: 'Küste (Selten)', points: 250, locationType: 'local' },
    { id: 'grosseraubmoewe', name: 'Große Raubmöwe', sciName: 'Stercorarius skua', rarity: 'Küste (Selten)', points: 280, locationType: 'local' },

    // --- MÖWEN & SEESCHWALBEN ---
    { id: 'lachmoewe', name: 'Lachmöwe', sciName: 'Chroicocephalus ridibundus', rarity: 'Häufig', points: 20, locationType: 'local' },
    { id: 'schwarzkopfmoewe', name: 'Schwarzkopfmöwe', sciName: 'Ichthyaetus melanocephalus', rarity: 'Selten', points: 150, locationType: 'local' },
    { id: 'zwergmoewe', name: 'Zwergmöwe', sciName: 'Hydrocoloeus minutus', rarity: 'Selten', points: 140, locationType: 'local' },
    { id: 'sturmmoewe', name: 'Sturmmöwe', sciName: 'Larus canus', rarity: 'Mittel', points: 40, locationType: 'local' },
    { id: 'silbermoewe', name: 'Silbermöwe', sciName: 'Larus argentatus', rarity: 'Küste (Häufig)', points: 30, locationType: 'local' },
    { id: 'mittelmeermoewe', name: 'Mittelmeermöwe', sciName: 'Larus michahellis', rarity: 'Mittel', points: 60, locationType: 'local' },
    { id: 'steppenmoewe', name: 'Steppenmöwe', sciName: 'Larus cachinnans', rarity: 'Selten', points: 120, locationType: 'local' },
    { id: 'heringsmoewe', name: 'Heringsmöwe', sciName: 'Larus fuscus', rarity: 'Küste (Mittel)', points: 60, locationType: 'local' },
    { id: 'mantelmoewe', name: 'Mantelmöwe', sciName: 'Larus marinus', rarity: 'Küste (Selten)', points: 90, locationType: 'local' },
    { id: 'dreizehenmoewe', name: 'Dreizehenmöwe', sciName: 'Rissa tridactyla', rarity: 'Helgoland/Sturm', points: 150, locationType: 'local' },
    { id: 'lachseeschwalbe', name: 'Lachseeschwalbe', sciName: 'Gelochelidon nilotica', rarity: 'Sehr Selten', points: 350, locationType: 'local' },
    { id: 'raubseeschwalbe', name: 'Raubseeschwalbe', sciName: 'Hydroprogne caspia', rarity: 'Selten', points: 200, locationType: 'local' },
    { id: 'brandseeschwalbe', name: 'Brandseeschwalbe', sciName: 'Thalasseus sandvicensis', rarity: 'Küste', points: 100, locationType: 'local' },
    { id: 'flussseeschwalbe', name: 'Flussseeschwalbe', sciName: 'Sterna hirundo', rarity: 'Mittel', points: 80, locationType: 'local' },
    { id: 'kuestenseeschwalbe', name: 'Küstenseeschwalbe', sciName: 'Sterna paradisaea', rarity: 'Küste', points: 110, locationType: 'local' },
    { id: 'zwergseeschwalbe', name: 'Zwergseeschwalbe', sciName: 'Sternula albifrons', rarity: 'Sehr Selten', points: 250, locationType: 'local' },
    { id: 'weissbartseeschwalbe', name: 'Weißbart-Seeschwalbe', sciName: 'Chlidonias hybrida', rarity: 'Sehr Selten', points: 300, locationType: 'local' },
    { id: 'weissfluegelseeschwalbe', name: 'Weißflügel-Seeschwalbe', sciName: 'Chlidonias leucopterus', rarity: 'Sehr Selten', points: 300, locationType: 'local' },
    { id: 'trauerseeschwalbe', name: 'Trauerseeschwalbe', sciName: 'Chlidonias niger', rarity: 'Selten', points: 180, locationType: 'local' },

    // --- ALKEN (Helgoland/Küste) ---
    { id: 'trottellumme', name: 'Trottellumme', sciName: 'Uria aalge', rarity: 'Helgoland', points: 200, locationType: 'local' },
    { id: 'tordalk', name: 'Tordalk', sciName: 'Alca torda', rarity: 'Helgoland', points: 220, locationType: 'local' },
    { id: 'gryllteiste', name: 'Gryllteiste', sciName: 'Cepphus grylle', rarity: 'Sehr Selten', points: 400, locationType: 'local' },
    { id: 'papageitaucher', name: 'Papageitaucher', sciName: 'Fratercula arctica', rarity: 'Helgoland (Selten)', points: 450, locationType: 'local' },

    // --- TAUBEN ---
    { id: 'strassentaube', name: 'Straßentaube', sciName: 'Columba livia f. domestica', rarity: 'Häufig', points: 5, locationType: 'local' },
    { id: 'hohltaube', name: 'Hohltaube', sciName: 'Columba oenas', rarity: 'Mittel', points: 60, locationType: 'local' },
    { id: 'ringeltaube', name: 'Ringeltaube', sciName: 'Columba palumbus', rarity: 'Häufig', points: 10, locationType: 'local' },
    { id: 'tuerkentaube', name: 'Türkentaube', sciName: 'Streptopelia decaocto', rarity: 'Häufig', points: 20, locationType: 'local' },
    { id: 'turteltaube', name: 'Turteltaube', sciName: 'Streptopelia turtur', rarity: 'Epic', points: 350, tier: 'epic', locationType: 'local' },

    // --- KUCKUCK, SEGLER, NACHTSCHWALBEN ---
    { id: 'haeherkuckuck', name: 'Häherkuckuck', sciName: 'Clamator glandarius', rarity: 'Extrem Selten', points: 800, locationType: 'local' },
    { id: 'kuckuck', name: 'Kuckuck', sciName: 'Cuculus canorus', rarity: 'Mittel', points: 80, locationType: 'local' },
    { id: 'ziegenmelker', name: 'Ziegenmelker', sciName: 'Caprimulgus europaeus', rarity: 'Nachtaktiv (Selten)', points: 200, locationType: 'local' },
    { id: 'mauersegler', name: 'Mauersegler', sciName: 'Apus apus', rarity: 'Häufig', points: 20, locationType: 'local' },
    { id: 'alpensegler', name: 'Alpensegler', sciName: 'Tachymarptis melba', rarity: 'Sehr Selten (Süd)', points: 350, locationType: 'local' },

    // --- EULEN ---
    { id: 'schleiereule', name: 'Schleiereule', sciName: 'Tyto alba', rarity: 'Nachtaktiv (Selten)', points: 100, locationType: 'local' },
    { id: 'zwergohreule', name: 'Zwergohreule', sciName: 'Otus scops', rarity: 'Sehr Selten', points: 400, locationType: 'local' },
    { id: 'uhu', name: 'Uhu', sciName: 'Bubo bubo', rarity: 'Legendär', points: 800, tier: 'legendary', locationType: 'local' },
    { id: 'sperlingskauz', name: 'Sperlingskauz', sciName: 'Glaucidium passerinum', rarity: 'Sehr Selten', points: 250, locationType: 'local' },
    { id: 'steinkauz', name: 'Steinkauz', sciName: 'Athene noctua', rarity: 'Selten', points: 140, locationType: 'local' },
    { id: 'waldkauz', name: 'Waldkauz', sciName: 'Strix aluco', rarity: 'Nachtaktiv (Mittel)', points: 70, locationType: 'local' },
    { id: 'waldohreule', name: 'Waldohreule', sciName: 'Asio otus', rarity: 'Mittel', points: 80, locationType: 'local' },
    { id: 'sumpfohreule', name: 'Sumpfohreule', sciName: 'Asio flammeus', rarity: 'Legendär', points: 850, tier: 'legendary', locationType: 'local' },
    { id: 'raufusskauz', name: 'Raufußkauz', sciName: 'Aegolius funereus', rarity: 'Selten', points: 220, locationType: 'local' },

    // --- SPEZIALISTEN ---
    { id: 'eisvogel', name: 'Eisvogel', sciName: 'Alcedo atthis', rarity: 'Epic', points: 400, tier: 'epic', locationType: 'local' },
    { id: 'bienenfresser', name: 'Bienenfresser', sciName: 'Merops apiaster', rarity: 'Epic', points: 400, tier: 'epic', locationType: 'local' },
    { id: 'blauracke', name: 'Blauracke', sciName: 'Coracias garrulus', rarity: 'Extrem Selten', points: 1000, locationType: 'local' },
    { id: 'wiedehopf', name: 'Wiedehopf', sciName: 'Upupa epops', rarity: 'Epic', points: 450, tier: 'epic', locationType: 'local' },

    // --- SPECHTE ---
    { id: 'wendehals', name: 'Wendehals', sciName: 'Jynx torquilla', rarity: 'Epic', points: 300, tier: 'epic', locationType: 'local' },
    { id: 'grauspecht', name: 'Grauspecht', sciName: 'Picus canus', rarity: 'Selten', points: 140, locationType: 'local' },
    { id: 'gruenspecht', name: 'Grünspecht', sciName: 'Picus viridis', rarity: 'Mittel', points: 50, locationType: 'local' },
    { id: 'schwarzspecht', name: 'Schwarzspecht', sciName: 'Dryocopus martius', rarity: 'Mittel', points: 80, locationType: 'local' },
    { id: 'buntspecht', name: 'Buntspecht', sciName: 'Dendrocopos major', rarity: 'Häufig', points: 30, locationType: 'local' },
    { id: 'mittelspecht', name: 'Mittelspecht', sciName: 'Dendrocoptes medius', rarity: 'Mittel', points: 90, locationType: 'local' },
    { id: 'weissrueckenspecht', name: 'Weißrückenspecht', sciName: 'Dendrocopos leucotos', rarity: 'Alpen (Sehr Selten)', points: 500, locationType: 'local' },
    { id: 'kleinspecht', name: 'Kleinspecht', sciName: 'Dryobates minor', rarity: 'Selten', points: 110, locationType: 'local' },
    { id: 'dreizehenspecht', name: 'Dreizehenspecht', sciName: 'Picoides tridactylus', rarity: 'Alpen (Selten)', points: 400, locationType: 'local' },

    // --- LERCHEN & SCHWALBEN ---
    { id: 'kalanderlerche', name: 'Kalanderlerche', sciName: 'Melanocorypha calandra', rarity: 'Extrem Selten', points: 800, locationType: 'local' },
    { id: 'kurzzehenlerche', name: 'Kurzzehenlerche', sciName: 'Calandrella brachydactyla', rarity: 'Sehr Selten', points: 500, locationType: 'local' },
    { id: 'haubenlerche', name: 'Haubenlerche', sciName: 'Galerida cristata', rarity: 'Gefährdet', points: 250, locationType: 'local' },
    { id: 'heidelerche', name: 'Heidelerche', sciName: 'Lullula arborea', rarity: 'Mittel', points: 100, locationType: 'local' },
    { id: 'feldlerche', name: 'Feldlerche', sciName: 'Alauda arvensis', rarity: 'Mittel', points: 40, locationType: 'local' },
    { id: 'ohrenlerche', name: 'Ohrenlerche', sciName: 'Eremophila alpestris', rarity: 'Wintergast (Küste)', points: 200, locationType: 'local' },
    { id: 'uferschwalbe', name: 'Uferschwalbe', sciName: 'Riparia riparia', rarity: 'Mittel', points: 60, locationType: 'local' },
    { id: 'felsenschwalbe', name: 'Felsenschwalbe', sciName: 'Ptyonoprogne rupestris', rarity: 'Alpen (Selten)', points: 300, locationType: 'local' },
    { id: 'rauchschwalbe', name: 'Rauchschwalbe', sciName: 'Hirundo rustica', rarity: 'Häufig', points: 20, locationType: 'local' },
    { id: 'mehlschwalbe', name: 'Mehlschwalbe', sciName: 'Delichon urbicum', rarity: 'Häufig', points: 20, locationType: 'local' },

    // --- PIEPER & STELZEN ---
    { id: 'brachpieper', name: 'Brachpieper', sciName: 'Anthus campestris', rarity: 'Sehr Selten', points: 300, locationType: 'local' },
    { id: 'baumpieper', name: 'Baumpieper', sciName: 'Anthus trivialis', rarity: 'Mittel', points: 70, locationType: 'local' },
    { id: 'wiesenpieper', name: 'Wiesenpieper', sciName: 'Anthus pratensis', rarity: 'Mittel', points: 60, locationType: 'local' },
    { id: 'rotkehlpieper', name: 'Rotkehlpieper', sciName: 'Anthus cervinus', rarity: 'Sehr Selten', points: 350, locationType: 'local' },
    { id: 'bergpieper', name: 'Bergpieper', sciName: 'Anthus spinoletta', rarity: 'Alpen/Winter', points: 150, locationType: 'local' },
    { id: 'schafstelze', name: 'Schafstelze', sciName: 'Motacilla flava', rarity: 'Mittel', points: 50, locationType: 'local' },
    { id: 'zitronenstelze', name: 'Zitronenstelze', sciName: 'Motacilla citreola', rarity: 'Extrem Selten', points: 600, locationType: 'local' },
    { id: 'gebirgsstelze', name: 'Gebirgsstelze', sciName: 'Motacilla cinerea', rarity: 'Mittel', points: 80, locationType: 'local' },
    { id: 'bachstelze', name: 'Bachstelze', sciName: 'Motacilla alba', rarity: 'Häufig', points: 15, locationType: 'local' },

    // --- SEIDENSCHWANZ & WASSERAMSEL ---
    { id: 'seidenschwanz', name: 'Seidenschwanz', sciName: 'Bombycilla garrulus', rarity: 'Epic', points: 400, tier: 'epic', locationType: 'local' },
    { id: 'wasseramsel', name: 'Wasseramsel', sciName: 'Cinclus cinclus', rarity: 'Selten', points: 150, locationType: 'local' },

    // --- ZAUNKÖNIG & BRAUNELLE ---
    { id: 'zaunkoenig', name: 'Zaunkönig', sciName: 'Troglodytes troglodytes', rarity: 'Häufig', points: 25, locationType: 'local' },
    { id: 'heckenbraunelle', name: 'Heckenbraunelle', sciName: 'Prunella modularis', rarity: 'Häufig', points: 20, locationType: 'local' },
    { id: 'alpenbraunelle', name: 'Alpenbraunelle', sciName: 'Prunella collaris', rarity: 'Alpen (Selten)', points: 300, locationType: 'local' },

    // --- DROSSELN & SCHMÄTZER ---
    { id: 'rotkehlchen', name: 'Rotkehlchen', sciName: 'Erithacus rubecula', rarity: 'Häufig', points: 15, locationType: 'local' },
    { id: 'nachtigall', name: 'Nachtigall', sciName: 'Luscinia megarhynchos', rarity: 'Mittel', points: 70, locationType: 'local' },
    { id: 'blaukehlchen', name: 'Blaukehlchen', sciName: 'Luscinia svecica', rarity: 'Epic', points: 350, tier: 'epic', locationType: 'local' },
    { id: 'hausrotschwanz', name: 'Hausrotschwanz', sciName: 'Phoenicurus ochruros', rarity: 'Häufig', points: 20, locationType: 'local' },
    { id: 'gartenrotschwanz', name: 'Gartenrotschwanz', sciName: 'Phoenicurus phoenicurus', rarity: 'Mittel', points: 60, locationType: 'local' },
    { id: 'braunkehlchen', name: 'Braunkehlchen', sciName: 'Saxicola rubetra', rarity: 'Epic', points: 300, tier: 'epic', locationType: 'local' },
    { id: 'schwarzkehlchen', name: 'Schwarzkehlchen', sciName: 'Saxicola rubicola', rarity: 'Mittel', points: 90, locationType: 'local' },
    { id: 'steinschmaetzer', name: 'Steinschmätzer', sciName: 'Oenanthe oenanthe', rarity: 'Selten', points: 150, locationType: 'local' },
    { id: 'steinroetel', name: 'Steinrötel', sciName: 'Monticola saxatilis', rarity: 'Alpen (Extrem Selten)', points: 800, locationType: 'local' },
    { id: 'ringdrossel', name: 'Ringdrossel', sciName: 'Turdus torquatus', rarity: 'Zugvogel (Selten)', points: 200, locationType: 'local' },
    { id: 'amsel', name: 'Amsel', sciName: 'Turdus merula', rarity: 'Häufig', points: 10, locationType: 'local' },
    { id: 'wacholderdrossel', name: 'Wacholderdrossel', sciName: 'Turdus pilaris', rarity: 'Mittel', points: 40, locationType: 'local' },
    { id: 'singdrossel', name: 'Singdrossel', sciName: 'Turdus philomelos', rarity: 'Häufig', points: 25, locationType: 'local' },
    { id: 'rotdrossel', name: 'Rotdrossel', sciName: 'Turdus iliacus', rarity: 'Wintergast', points: 60, locationType: 'local' },
    { id: 'misteldrossel', name: 'Misteldrossel', sciName: 'Turdus viscivorus', rarity: 'Mittel', points: 50, locationType: 'local' },

    // --- GRASMÜCKENARTIGE (Sylviidae, etc.) ---
    { id: 'cistensaenger', name: 'Cistensänger', sciName: 'Cisticola juncidis', rarity: 'Sehr Selten', points: 500, locationType: 'local' },
    { id: 'seidensaenger', name: 'Seidensänger', sciName: 'Cettia cetti', rarity: 'Selten', points: 300, locationType: 'local' },
    { id: 'feldschwirl', name: 'Feldschwirl', sciName: 'Locustella naevia', rarity: 'Selten', points: 130, locationType: 'local' },
    { id: 'schlagschwirl', name: 'Schlagschwirl', sciName: 'Locustella fluviatilis', rarity: 'Selten', points: 160, locationType: 'local' },
    { id: 'rohrschwirl', name: 'Rohrschwirl', sciName: 'Locustella luscinioides', rarity: 'Selten', points: 150, locationType: 'local' },
    { id: 'schilfrohrsaenger', name: 'Schilfrohrsänger', sciName: 'Acrocephalus schoenobaenus', rarity: 'Mittel', points: 90, locationType: 'local' },
    { id: 'seggenrohrsaenger', name: 'Seggenrohrsänger', sciName: 'Acrocephalus paludicola', rarity: 'Vom Aussterben bedroht', points: 1000, locationType: 'local' },
    { id: 'sumpfrohrsaenger', name: 'Sumpfrohrsänger', sciName: 'Acrocephalus palustris', rarity: 'Mittel', points: 80, locationType: 'local' },
    { id: 'teichrohrsaenger', name: 'Teichrohrsänger', sciName: 'Acrocephalus scirpaceus', rarity: 'Mittel', points: 70, locationType: 'local' },
    { id: 'drosselrohrsaenger', name: 'Drosselrohrsänger', sciName: 'Acrocephalus arundinaceus', rarity: 'Selten', points: 140, locationType: 'local' },
    { id: 'gelbspoetter', name: 'Gelbspötter', sciName: 'Hippolais icterina', rarity: 'Mittel', points: 90, locationType: 'local' },
    { id: 'orpheusspoetter', name: 'Orpheusspötter', sciName: 'Hippolais polyglotta', rarity: 'Sehr Selten', points: 400, locationType: 'local' },
    { id: 'fitis', name: 'Fitis', sciName: 'Phylloscopus trochilus', rarity: 'Häufig', points: 30, locationType: 'local' },
    { id: 'zilpzalp', name: 'Zilpzalp', sciName: 'Phylloscopus collybita', rarity: 'Häufig', points: 25, locationType: 'local' },
    { id: 'berglaubsaenger', name: 'Berglaubsänger', sciName: 'Phylloscopus bonelli', rarity: 'Selten', points: 300, locationType: 'local' },
    { id: 'waldlaubsaenger', name: 'Waldlaubsänger', sciName: 'Phylloscopus sibilatrix', rarity: 'Mittel', points: 60, locationType: 'local' },
    { id: 'gelbbrauenlaubsaenger', name: 'Gelbbrauenlaubsänger', sciName: 'Phylloscopus inornatus', rarity: 'Selten (Zug)', points: 400, locationType: 'local' },
    { id: 'moenchsgrasmuecke', name: 'Mönchsgrasmücke', sciName: 'Sylvia atricapilla', rarity: 'Häufig', points: 25, locationType: 'local' },
    { id: 'gartengrasmuecke', name: 'Gartengrasmücke', sciName: 'Sylvia borin', rarity: 'Mittel', points: 50, locationType: 'local' },
    { id: 'sperbergrasmuecke', name: 'Sperbergrasmücke', sciName: 'Sylvia nisoria', rarity: 'Selten', points: 200, locationType: 'local' },
    { id: 'klappergrasmuecke', name: 'Klappergrasmücke', sciName: 'Sylvia curruca', rarity: 'Mittel', points: 60, locationType: 'local' },
    { id: 'orpheusgrasmuecke', name: 'Orpheusgrasmücke', sciName: 'Sylvia hortensis', rarity: 'Extrem Selten', points: 600, locationType: 'local' },
    { id: 'dorngrasmuecke', name: 'Dorngrasmücke', sciName: 'Sylvia communis', rarity: 'Mittel', points: 50, locationType: 'local' },
    { id: 'weissbartgrasmuecke', name: 'Weißbartgrasmücke', sciName: 'Sylvia cantillans', rarity: 'Extrem Selten', points: 700, locationType: 'local' },
    { id: 'wintergoldhaehnchen', name: 'Wintergoldhähnchen', sciName: 'Regulus regulus', rarity: 'Mittel', points: 45, locationType: 'local' },
    { id: 'sommergoldhaehnchen', name: 'Sommergoldhähnchen', sciName: 'Regulus ignicapilla', rarity: 'Mittel', points: 55, locationType: 'local' },

    // --- SCHNÄPPER ---
    { id: 'grauschnaepper', name: 'Grauschnäpper', sciName: 'Muscicapa striata', rarity: 'Mittel', points: 50, locationType: 'local' },
    { id: 'zwergschnaepper', name: 'Zwergschnäpper', sciName: 'Ficedula parva', rarity: 'Sehr Selten', points: 400, locationType: 'local' },
    { id: 'trauerschnaepper', name: 'Trauerschnäpper', sciName: 'Ficedula hypoleuca', rarity: 'Mittel', points: 60, locationType: 'local' },
    { id: 'halsbandschnaepper', name: 'Halsbandschnäpper', sciName: 'Ficedula albicollis', rarity: 'Sehr Selten', points: 400, locationType: 'local' },

    // --- MEISEN ---
    { id: 'schwanzmeise', name: 'Schwanzmeise', sciName: 'Aegithalos caudatus', rarity: 'Häufig', points: 30, locationType: 'local' },
    { id: 'sumpfmeise', name: 'Sumpfmeise', sciName: 'Poecile palustris', rarity: 'Mittel', points: 40, locationType: 'local' },
    { id: 'weidenmeise', name: 'Weidenmeise', sciName: 'Poecile montanus', rarity: 'Mittel', points: 50, locationType: 'local' },
    { id: 'alpenmeise', name: 'Alpenmeise', sciName: 'Poecile montanus', rarity: 'Alpen (Selten)', points: 300, locationType: 'local' },
    { id: 'haubenmeise', name: 'Haubenmeise', sciName: 'Lophophanes cristatus', rarity: 'Mittel', points: 60, locationType: 'local' },
    { id: 'tannenmeise', name: 'Tannenmeise', sciName: 'Periparus ater', rarity: 'Mittel', points: 40, locationType: 'local' },
    { id: 'blaumeise', name: 'Blaumeise', sciName: 'Cyanistes caeruleus', rarity: 'Häufig', points: 10, locationType: 'local' },
    { id: 'kohlmeise', name: 'Kohlmeise', sciName: 'Parus major', rarity: 'Häufig', points: 10, locationType: 'local' },
    { id: 'bartmeise', name: 'Bartmeise', sciName: 'Panurus biarmicus', rarity: 'Selten', points: 180, locationType: 'local' },
    { id: 'beutelmeise', name: 'Beutelmeise', sciName: 'Remiz pendulinus', rarity: 'Selten', points: 150, locationType: 'local' },

    // --- KLEIBER & BAUMLÄUFER ---
    { id: 'kleiber', name: 'Kleiber', sciName: 'Sitta europaea', rarity: 'Häufig', points: 25, locationType: 'local' },
    { id: 'mauerlaeufer', name: 'Mauerläufer', sciName: 'Tichodroma muraria', rarity: 'Alpen (Sehr Selten)', points: 500, locationType: 'local' },
    { id: 'waldbaumlaeufer', name: 'Waldbaumläufer', sciName: 'Certhia familiaris', rarity: 'Mittel', points: 40, locationType: 'local' },
    { id: 'gartenbaumlaeufer', name: 'Gartenbaumläufer', sciName: 'Certhia brachydactyla', rarity: 'Häufig', points: 30, locationType: 'local' },

    // --- WÜRGER & PIROLE ---
    { id: 'neuntoeter', name: 'Neuntöter', sciName: 'Lanius collurio', rarity: 'Gefährdet', points: 120, locationType: 'local' },
    { id: 'rotkopfwuerger', name: 'Rotkopfwürger', sciName: 'Lanius senator', rarity: 'Extrem Selten', points: 600, locationType: 'local' },
    { id: 'schwarzstirnwuerger', name: 'Schwarzstirnwürger', sciName: 'Lanius minor', rarity: 'Extrem Selten', points: 700, locationType: 'local' },
    { id: 'raubwuerger', name: 'Raubwürger', sciName: 'Lanius excubitor', rarity: 'Legendär', points: 750, tier: 'legendary', locationType: 'local' },
    { id: 'pirol', name: 'Pirol', sciName: 'Oriolus oriolus', rarity: 'Epic', points: 350, tier: 'epic', locationType: 'local' },

    // --- RABENVÖGEL ---
    { id: 'eichelhaeher', name: 'Eichelhäher', sciName: 'Garrulus glandarius', rarity: 'Häufig', points: 25, locationType: 'local' },
    { id: 'elster', name: 'Elster', sciName: 'Pica pica', rarity: 'Häufig', points: 15, locationType: 'local' },
    { id: 'tannenhaeher', name: 'Tannenhäher', sciName: 'Nucifraga caryocatactes', rarity: 'Gebirge/Selten', points: 150, locationType: 'local' },
    { id: 'alpenkraehe', name: 'Alpenkrähe', sciName: 'Pyrrhocorax pyrrhocorax', rarity: 'Alpen (Extrem Selten)', points: 800, locationType: 'local' },
    { id: 'alpendohle', name: 'Alpendohle', sciName: 'Pyrrhocorax graculus', rarity: 'Alpen (Mittel)', points: 200, locationType: 'local' },
    { id: 'dohle', name: 'Dohle', sciName: 'Coloeus monedula', rarity: 'Häufig', points: 25, locationType: 'local' },
    { id: 'saatkraehe', name: 'Saatkrähe', sciName: 'Corvus frugilegus', rarity: 'Koloniebrüter', points: 40, locationType: 'local' },
    { id: 'rabenkraehe', name: 'Rabenkrähe', sciName: 'Corvus corone', rarity: 'Häufig', points: 15, locationType: 'local' },
    { id: 'nebelkraehe', name: 'Nebelkrähe', sciName: 'Corvus cornix', rarity: 'Häufig (Ost)', points: 20, locationType: 'local' },
    { id: 'kolkrabe', name: 'Kolkrabe', sciName: 'Corvus corax', rarity: 'Mittel', points: 60, locationType: 'local' },

    // --- STARE & SPERLINGE ---
    { id: 'star', name: 'Star', sciName: 'Sturnus vulgaris', rarity: 'Häufig', points: 15, locationType: 'local' },
    { id: 'haussperling', name: 'Haussperling', sciName: 'Passer domesticus', rarity: 'Häufig', points: 10, locationType: 'local' },
    { id: 'feldsperling', name: 'Feldsperling', sciName: 'Passer montanus', rarity: 'Häufig', points: 15, locationType: 'local' },
    { id: 'steinsperling', name: 'Steinsperling', sciName: 'Petronia petronia', rarity: 'Extrem Selten', points: 600, locationType: 'local' },

    // --- FINKEN ---
    { id: 'buchfink', name: 'Buchfink', sciName: 'Fringilla coelebs', rarity: 'Häufig', points: 10, locationType: 'local' },
    { id: 'bergfink', name: 'Bergfink', sciName: 'Fringilla montifringilla', rarity: 'Wintergast', points: 40, locationType: 'local' },
    { id: 'kernbeisser', name: 'Kernbeißer', sciName: 'Coccothraustes coccothraustes', rarity: 'Mittel', points: 70, locationType: 'local' },
    { id: 'hakengimpel', name: 'Hakengimpel', sciName: 'Pinicola enucleator', rarity: 'Extrem Selten', points: 800, locationType: 'local' },
    { id: 'gimpel', name: 'Gimpel', sciName: 'Pyrrhula pyrrhula', rarity: 'Mittel', points: 35, locationType: 'local' },
    { id: 'karmingimpel', name: 'Karmingimpel', sciName: 'Carpodacus erythrinus', rarity: 'Selten', points: 250, locationType: 'local' },
    { id: 'girlitz', name: 'Girlitz', sciName: 'Serinus serinus', rarity: 'Mittel', points: 50, locationType: 'local' },
    { id: 'zitronengirlitz', name: 'Zitronengirlitz', sciName: 'Serinus citrinella', rarity: 'Alpen (Selten)', points: 350, locationType: 'local' },
    { id: 'gruenfink', name: 'Grünfink', sciName: 'Chloris chloris', rarity: 'Häufig', points: 15, locationType: 'local' },
    { id: 'stieglitz', name: 'Stieglitz', sciName: 'Carduelis carduelis', rarity: 'Häufig', points: 25, locationType: 'local' },
    { id: 'erlenzeisig', name: 'Erlenzeisig', sciName: 'Spinus spinus', rarity: 'Wintergast/Mittel', points: 45, locationType: 'local' },
    { id: 'bluthaenfling', name: 'Bluthänfling', sciName: 'Linaria cannabina', rarity: 'Mittel', points: 55, locationType: 'local' },
    { id: 'berghänfling', name: 'Berghänfling', sciName: 'Linaria flavirostris', rarity: 'Wintergast', points: 150, locationType: 'local' },
    { id: 'birkenzeisig', name: 'Birkenzeisig', sciName: 'Acanthis flammea', rarity: 'Wintergast', points: 80, locationType: 'local' },
    { id: 'fichtenkreuzschnabel', name: 'Fichtenkreuzschnabel', sciName: 'Loxia curvirostra', rarity: 'Mittel', points: 90, locationType: 'local' },

    // --- AMMERN ---
    { id: 'goldammer', name: 'Goldammer', sciName: 'Emberiza citrinella', rarity: 'Häufig', points: 30, locationType: 'local' },
    { id: 'zaunammer', name: 'Zaunammer', sciName: 'Emberiza cirlus', rarity: 'Selten (Süd)', points: 250, locationType: 'local' },
    { id: 'zippammer', name: 'Zippammer', sciName: 'Emberiza cia', rarity: 'Selten (Süd)', points: 250, locationType: 'local' },
    { id: 'ortolan', name: 'Ortolan', sciName: 'Emberiza hortulana', rarity: 'Sehr Selten', points: 300, locationType: 'local' },
    { id: 'zwergammer', name: 'Zwergammer', sciName: 'Emberiza pusilla', rarity: 'Sehr Selten', points: 400, locationType: 'local' },
    { id: 'rohrammer', name: 'Rohrammer', sciName: 'Emberiza schoeniclus', rarity: 'Mittel', points: 60, locationType: 'local' },
    { id: 'grauammer', name: 'Grauammer', sciName: 'Emberiza calandra', rarity: 'Selten', points: 120, locationType: 'local' },
    { id: 'schneeammer', name: 'Schneeammer', sciName: 'Plectrophenax nivalis', rarity: 'Wintergast (Küste)', points: 150, locationType: 'local' },
    { id: 'spornammer', name: 'Spornammer', sciName: 'Calcarius lapponicus', rarity: 'Wintergast (Küste)', points: 200, locationType: 'local' },

    // --- URLAUBSVÖGEL (Extra) ---
    { id: 'rosaflamingo', name: 'Rosaflamingo', sciName: 'Phoenicopterus roseus', rarity: 'Häufig (Urlaub)', points: 150, locationType: 'vacation' },
    { id: 'seidenreiher', name: 'Seidenreiher', sciName: 'Egretta garzetta', rarity: 'Häufig (Urlaub)', points: 120, locationType: 'vacation' }
];

export const LEVEL_THRESHOLDS: LevelInfo[] = [
    { max: 100, level: 1, title: 'Beobachter', next: 500 },
    { max: 500, level: 2, title: 'Ornithologe', next: 1200 },
    { max: 1200, level: 3, title: 'Experte', next: 3000 },
    { max: 3000, level: 4, title: 'Meister', next: 10000 },
    { max: 10000, level: 5, title: 'Legende', next: 99999 }
];

export const MOCK_LEADERBOARDS: Record<LeaderboardScope, LeaderboardEntry[]> = {
    circle: [
        { rank: 1, name: 'WanderFalke23', xp: 1250, avatarSeed: 'falke' },
        { rank: 2, name: 'Du (Ich)', xp: 0, avatarSeed: 'me', isUser: true }, 
        { rank: 3, name: 'NaturLover', xp: 890, avatarSeed: 'nature' },
    ],
    global: [
        { rank: 1, name: 'BirdGod_DE', xp: 15000, avatarSeed: 'god' },
        { rank: 2, name: 'Naturschutz', xp: 12400, avatarSeed: 'nbu' },
        { rank: 3, name: 'Orni_Berlin', xp: 5400, avatarSeed: 'orni' },
        { rank: 4, name: 'Waldmeister', xp: 4900, avatarSeed: 'wald' },
    ]
};

export const WIZARD_SIZES = [
    { id: 'spatz', label: 'Spatzengroß', icon: '🐦' },
    { id: 'amsel', label: 'Amselgroß', icon: '🦅' },
    { id: 'kraehe', label: 'Krähengroß', icon: '⬛' },
    { id: 'gans', label: 'Gänsegroß', icon: '🦢' },
];

export const WIZARD_COLORS = [
    { id: 'black', color: 'bg-gray-900' },
    { id: 'white', color: 'bg-white border border-gray-200' },
    { id: 'brown', color: 'bg-amber-800' },
    { id: 'red', color: 'bg-red-600' },
    { id: 'blue', color: 'bg-blue-600' },
    { id: 'yellow', color: 'bg-yellow-400' },
    { id: 'green', color: 'bg-green-600' },
];
