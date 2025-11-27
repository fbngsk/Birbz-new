import React, { useState, useEffect } from 'react';
import { BIRDS_DB, BIRD_FAMILIES } from '../constants';
import { Bird, LocationType } from '../types';
import { Home, Plane, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

// Simple cache to avoid re-fetching Wikipedia thumbnails constantly
const THUMBNAIL_CACHE: Record<string, string> = {};

// Mapping for nice Display Names
const FAMILY_LABELS: Record<string, string> = {
    raptors: 'Greifvögel & Falken',
    water: 'Wasser- & Meeresvögel',
    ducks: 'Enten, Gänse & Schwäne',
    owls: 'Eulen',
    waders: 'Watvögel (Limikolen)',
    corvids: 'Rabenvögel',
    tits: 'Meisen',
    finches: 'Finken',
    woodpeckers: 'Spechte',
    thrushes: 'Drosseln & Schmätzer',
    warblers: 'Grasmücken & Sänger',
    pigeons: 'Tauben',
    buntings: 'Ammern',
    other: 'Andere Arten'
};

// Sort order for families
const FAMILY_ORDER = [
    'raptors', 'owls', 'ducks', 'water', 'waders', 
    'woodpeckers', 'corvids', 'tits', 'finches', 'thrushes', 'warblers', 'pigeons', 'buntings', 'other'
];

interface DexViewProps {
    collectedIds: string[];
    vacationBirds?: Bird[]; // Dynamically collected vacation birds
    onBirdClick: (bird: Bird) => void;
}

// Individual Card Component
const DexBirdCard = ({ bird, isCollected, onClick }: { bird: Bird, isCollected: boolean, onClick: () => void }) => {
    // For vacation birds, use the stored realImg directly
    const initialImage = bird.realImg || THUMBNAIL_CACHE[bird.name] || null;
    const [imageUrl, setImageUrl] = useState<string | null>(initialImage);
    const [loading, setLoading] = useState(!initialImage);

    useEffect(() => {
        // Skip fetching if we already have an image (either from realImg or cache)
        if (imageUrl) return; 
        
        // Skip fetching for vacation birds - they should already have realImg
        if (bird.id.startsWith('vacation_')) {
            setLoading(false);
            return;
        }

        let isMounted = true;
        const fetchImage = async () => {
            try {
                // Use scientific name for better accuracy
                const searchName = bird.sciName || bird.name;
                const res = await fetch(`https://de.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchName)}`);
                if (res.ok) {
                    const data = await res.json();
                    const url = data.thumbnail?.source;
                    if (isMounted && url) {
                        THUMBNAIL_CACHE[bird.name] = url;
                        setImageUrl(url);
                    }
                }
            } catch (error) {
                // silent fail
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        // Stagger requests slightly
        const timer = setTimeout(fetchImage, Math.random() * 1000);
        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [bird.id, bird.name, bird.sciName, imageUrl]);

    return (
        <div 
            onClick={onClick} 
            className={`aspect-square rounded-3xl p-3 flex flex-col justify-between relative overflow-hidden transition-all cursor-pointer active:scale-95 ${isCollected ? 'bg-white shadow-sm border border-orange' : 'bg-gray-100 border border-transparent opacity-80'}`}
        >
            {isCollected && (
                <div className="absolute top-2 right-2 text-[10px] font-bold text-teal bg-white/60 px-1.5 py-0.5 rounded-full shadow-sm backdrop-blur-sm">
                    ✓
                </div>
            )}
            
            <div className="flex-1 flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                    <img 
                        src={imageUrl} 
                        alt={bird.name}
                        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shadow-sm transition-all ${isCollected ? '' : 'grayscale opacity-60'}`} 
                        loading="lazy"
                    />
                ) : (
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center ${isCollected ? 'bg-gray-100' : 'bg-gray-200'}`}>
                        {loading ? (
                            <Loader2 size={20} className="animate-spin text-gray-400" />
                        ) : (
                            <span className="text-2xl opacity-20 grayscale">🐦</span>
                        )}
                    </div>
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className={`font-bold text-xs sm:text-sm truncate ${isCollected ? 'text-teal' : 'text-gray-500'}`}>
                    {bird.name}
                </div>
                <div className="text-[10px] text-gray-400 truncate italic font-serif">
                    {bird.sciName}
                </div>
                {bird.country && isCollected && (
                    <div className="text-[10px] text-orange-500 truncate flex items-center gap-1 mt-0.5">
                        <span>📍</span> {bird.country}
                    </div>
                )}
            </div>
        </div>
    );
};

export const DexView: React.FC<DexViewProps> = ({ collectedIds, vacationBirds = [], onBirdClick }) => {
    const [filter, setFilter] = useState<LocationType>('local');
    
    // 1. Filter Birds by Location Mode
    // For vacation mode, combine BIRDS_DB vacation birds with dynamically collected ones
    const filteredBirds = filter === 'vacation' 
        ? [...BIRDS_DB.filter(b => b.locationType === 'vacation'), ...vacationBirds]
        : BIRDS_DB.filter(b => {
            const type = b.locationType || 'local';
            return type === filter;
        });

    const collectedCount = filteredBirds.filter(b => collectedIds.includes(b.id)).length;
    const totalCount = filteredBirds.length;

    // 2. Group Birds by Family
    const groupedBirds = filteredBirds.reduce((acc, bird) => {
        let familyKey = 'other';
        
        // Try to find matching family
        for (const [key, prefixes] of Object.entries(BIRD_FAMILIES)) {
            // Check if scientific name contains any of the genus prefixes
            if (prefixes.some(prefix => bird.sciName.includes(prefix))) {
                familyKey = key;
                break;
            }
        }
        
        if (!acc[familyKey]) acc[familyKey] = [];
        acc[familyKey].push(bird);
        return acc;
    }, {} as Record<string, Bird[]>);

    return (
         <div className="p-6 pb-32 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-teal">Sammlung</h2>
                <div className="text-xs font-bold px-3 py-1 bg-gray-100 rounded-full text-gray-500">
                    {filter === 'vacation' 
                        ? `${collectedCount} entdeckt`
                        : `${collectedCount} / ${totalCount}`
                    }
                </div>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
                <button 
                    onClick={() => setFilter('local')} 
                    className={`flex-1 py-2 px-4 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${filter === 'local' ? 'bg-white text-teal shadow-sm' : 'text-gray-400'}`}
                >
                    <Home size={14}/> Heimat
                </button>
                <button 
                    onClick={() => setFilter('vacation')} 
                    className={`flex-1 py-2 px-4 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${filter === 'vacation' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400'}`}
                >
                    <Plane size={14}/> Urlaub
                </button>
            </div>

            <div className="space-y-8">
                {FAMILY_ORDER.map(familyKey => {
                    const birds = groupedBirds[familyKey];
                    if (!birds || birds.length === 0) return null;

                    const familyCollected = birds.filter(b => collectedIds.includes(b.id)).length;

                    return (
                        <div key={familyKey} className="animate-slide-up">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h3 className="text-sm font-bold text-teal uppercase tracking-wider opacity-80">
                                    {FAMILY_LABELS[familyKey] || 'Sonstige'}
                                </h3>
                                <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                                    {familyCollected}/{birds.length}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {birds.map((bird) => (
                                    <DexBirdCard 
                                        key={bird.id}
                                        bird={bird}
                                        isCollected={collectedIds.includes(bird.id)}
                                        onClick={() => onBirdClick(bird)}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}

                {filteredBirds.length === 0 && (
                    <div className="text-center py-10 text-gray-400">
                        <p>Keine Vögel in dieser Kategorie gefunden.</p>
                    </div>
                )}
            </div>
            
            <div className="mt-12 text-center text-gray-400 text-xs">
                {filter === 'local' ? (
                    <p>Tippe auf einen Vogel, um Details zu sehen.</p>
                ) : (
                    <p>Entdecke exotische Arten auf deinen Reisen.</p>
                )}
            </div>
         </div>
    );
};
