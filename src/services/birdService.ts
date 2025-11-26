import { Bird, BirdSpecies, WikiResult, LocationType } from '../types';
import { BIRDS_DB, EBIRD_API_KEY } from '../constants';

// --- HELPER: Generate Bird Avatar URL ---
export const getAvatarUrl = (seed: string): string => {
    // Simple hash to convert string seed to a consistent number for the lock
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    // Use loremflickr with bird category and lock
    return `https://loremflickr.com/200/200/bird?lock=${Math.abs(hash)}`;
};

export const fetchWikiData = async (birdName: string, sciName?: string): Promise<WikiResult> => {
    // Try different search strategies for birds
    const searchNames = [
        birdName,
        `${birdName} (Vogel)`,      // German disambiguation for birds
        `${birdName} (Art)`,         // Species disambiguation
        sciName,                      // Scientific name as fallback
    ].filter(Boolean) as string[];

    for (const searchName of searchNames) {
        try {
            const encodedName = encodeURIComponent(searchName);
            
            // 1. Fetch Summary (Description & Main Thumbnail)
            const summaryUrl = `https://de.wikipedia.org/api/rest_v1/page/summary/${encodedName}`;
            const summaryRes = await fetch(summaryUrl);
            
            if (!summaryRes.ok) continue;
            
            const summaryJson = await summaryRes.json();
            
            // Check if this is actually about a bird (look for bird-related keywords in description)
            const desc = summaryJson.extract || '';
            const isBirdArticle = desc.toLowerCase().includes('vogel') || 
                                  desc.toLowerCase().includes('bird') ||
                                  desc.toLowerCase().includes('art ') ||
                                  desc.toLowerCase().includes('gattung') ||
                                  desc.toLowerCase().includes('familie') ||
                                  desc.toLowerCase().includes('ordnung') ||
                                  searchName.includes('(Vogel)') ||
                                  searchName.includes('(Art)') ||
                                  searchName === sciName;
            
            // If first attempt and doesn't look like a bird article, try next
            if (searchName === birdName && !isBirdArticle && searchNames.length > 1) {
                continue;
            }
            
            const mainImg = summaryJson.originalimage?.source || summaryJson.thumbnail?.source || null;

            // 2. Fetch Media List (For Gallery)
            let images: string[] = [];
            if (mainImg) images.push(mainImg);

            try {
                const mediaUrl = `https://de.wikipedia.org/api/rest_v1/page/media-list/${encodedName}`;
                const mediaRes = await fetch(mediaUrl);
                if (mediaRes.ok) {
                    const mediaJson = await mediaRes.json();
                    
                    // Helper to normalize URL for comparison
                    const normalize = (url: string | null) => {
                        if (!url) return '';
                        let u = url;
                        if (u.startsWith('//')) u = 'https:' + u;
                        return u;
                    };

                    const mainImgNormalized = normalize(mainImg);

                    // Filter for images (jpeg/png), ignore svgs/icons, limit to 5
                    const galleryImages = mediaJson.items
                        .filter((item: any) => item.type === 'image' && (item.title.endsWith('.jpg') || item.title.endsWith('.JPG') || item.title.endsWith('.png')))
                        .map((item: any) => {
                            // Prefer original src, fallback to srcset
                            return item.src || item.srcset?.[0]?.src;
                        })
                        .filter((src: string | undefined) => !!src)
                        .map((src: string) => normalize(src)) // Normalize all to https
                        .filter((src: string) => src !== mainImgNormalized) // Remove duplicate of main image
                        .filter((val: string, idx: number, self: string[]) => self.indexOf(val) === idx) // Dedupe list
                        .slice(0, 4); // Take up to 4 additional images
                    
                    images = [...images, ...galleryImages];
                }
            } catch (mediaErr) {
                console.warn("Could not fetch media list", mediaErr);
            }

            return {
                img: mainImg,
                desc: desc,
                images: images
            };
        } catch (e) {
            // Try next search name
            continue;
        }
    }
    
    // All attempts failed
    return { img: null, desc: "", images: [] };
};

const getSimulatedBirds = async (mode: LocationType): Promise<Bird[]> => {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 800));
    
    // Filter DB based on mode
    const potentialBirds = BIRDS_DB.filter(b => {
        const bType = b.locationType || 'local';
        return bType === mode;
    });

    const randomBirds = potentialBirds.sort(() => 0.5 - Math.random()).slice(0, mode === 'vacation' ? 2 : 4);
    
    const enriched = await Promise.all(randomBirds.map(async (bird) => {
        const wiki = await fetchWikiData(bird.name);
        return {
            ...bird,
            realImg: wiki.img || `https://loremflickr.com/200/200/bird?lock=${bird.id.length}`,
            realDesc: wiki.desc,
            distance: Math.floor(Math.random() * 500) + 10,
            seenAt: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
    }));
    return enriched;
};

export const fetchLocalBirds = async (lat: number, lng: number, mode: LocationType = 'local'): Promise<Bird[]> => {
    // If vacation mode, force simulation for now as eBird logic would need complex geo-filtering
    // Or if no API Key.
    if (!EBIRD_API_KEY || mode === 'vacation') {
        console.log(`Using Simulation for ${mode} mode`);
        return getSimulatedBirds(mode);
    }

    try {
        const res = await fetch(
            `https://api.ebird.org/v2/data/obs/geo/recent?lat=${lat}&lng=${lng}&fmt=json&locale=de&maxResults=10`, 
            { headers: { 'x-ebirdapitoken': EBIRD_API_KEY } }
        );
        
        if (!res.ok) throw new Error("eBird API failed");
        
        const data: BirdSpecies[] = await res.json();
        
        const enriched = await Promise.all(data.map(async (ebirdItem) => {
            // 1. Fetch Wiki Data
            const wiki = await fetchWikiData(ebirdItem.comName);
            
            // 2. Check Internal DB for points/rarity info based on scientific name
            const knownBird = BIRDS_DB.find(b => b.sciName === ebirdItem.sciName);
            
            const points = knownBird?.points || 20;
            const rarity = knownBird?.rarity || 'Beobachtung';

            return {
                id: ebirdItem.speciesCode,
                name: ebirdItem.comName,
                sciName: ebirdItem.sciName,
                realImg: wiki.img || undefined,
                realDesc: wiki.desc,
                points,
                rarity,
                locationType: 'local' as LocationType, // eBird results near home are local
                distance: '?', 
                seenAt: ebirdItem.obsDt
            };
        }));
        
        return enriched;
    } catch (e) {
        console.error(e);
        return getSimulatedBirds(mode); // Fallback to sim on error
    }
};
