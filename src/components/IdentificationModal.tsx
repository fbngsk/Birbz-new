import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Mic, Camera, ArrowRight, Check, Puzzle, HelpCircle, ChevronLeft, Loader2, AlertTriangle, Upload, ExternalLink, Globe, Activity } from 'lucide-react';
import { Bird, WikiResult, LocationType, IdentificationResult, VacationBirdResult } from '../types';
import { BIRDS_DB, WIZARD_SIZES, WIZARD_COLORS } from '../constants';
import { fetchWikiData } from '../services/birdService';
import { identifyBirdFromImage, identifyBirdGlobal, lookupBirdByName } from '../services/geminiService';

interface IdentificationModalProps {
    onClose: () => void;
    onFound: (bird: Bird) => void;
    modeType: LocationType; // 'local' or 'vacation'
    onToggleMode?: () => void;
}

type Mode = 'menu' | 'manual' | 'wizard' | 'sound' | 'photo' | 'results';

export const IdentificationModal: React.FC<IdentificationModalProps> = ({ onClose, onFound, modeType, onToggleMode }) => {
    const [mode, setMode] = useState<Mode>('menu');
    
    // Manual Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Bird[]>([]);
    const [previewBird, setPreviewBird] = useState<Bird | null>(null);
    const [previewData, setPreviewData] = useState<WikiResult | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    
    // Vacation Search State
    const [searchingVacation, setSearchingVacation] = useState(false);
    const [vacationSearchResult, setVacationSearchResult] = useState<VacationBirdResult | null>(null);

    // Photo ID State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [photoError, setPhotoError] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    
    // Vacation Bird State (for birds not in local DB)
    const [detectedVacationBird, setDetectedVacationBird] = useState<VacationBirdResult | null>(null);
    const [vacationCountry, setVacationCountry] = useState('');

    // Wizard State
    const [wizardStep, setWizardStep] = useState(0);
    
    // --- MANUAL SEARCH LOGIC ---
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setSearchResults([]);
            setVacationSearchResult(null);
        } else {
            const filtered = BIRDS_DB.filter(b => {
                const bType = b.locationType || 'local';
                if (bType !== modeType) return false;

                return b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       b.sciName.toLowerCase().includes(searchTerm.toLowerCase());
            });
            setSearchResults(filtered);
        }
    }, [searchTerm, modeType]);
    
    // Vacation mode: search for exotic birds via AI
    const handleVacationSearch = async () => {
        if (!searchTerm.trim() || modeType !== 'vacation') return;
        
        setSearchingVacation(true);
        setVacationSearchResult(null);
        
        const result = await lookupBirdByName(searchTerm);
        
        if (result) {
            setVacationSearchResult(result);
        }
        
        setSearchingVacation(false);
    };

    // Load Wiki Data when previewing a bird
    useEffect(() => {
        if (previewBird) {
            setLoadingPreview(true);
            setPreviewData(null);
            fetchWikiData(previewBird.name, previewBird.sciName).then(data => {
                setPreviewData(data);
                setLoadingPreview(false);
            });
        }
    }, [previewBird]);

    const handleConfirmBird = () => {
        if (previewBird) {
            const finalBird: Bird = {
                ...previewBird,
                realImg: previewData?.img || undefined,
                realDesc: previewData?.desc || undefined,
                seenAt: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            };
            onFound(finalBird);
        }
    };

    // --- PHOTO ID LOGIC ---
    const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setPhotoError(null);
        setAnalyzing(true);
        setDetectedVacationBird(null);

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            setSelectedImage(base64String);
            
            // Call Gemini Vision
            const identifiedName = await identifyBirdFromImage(base64String);
            setAnalyzing(false);

            if (identifiedName) {
                // Fuzzy match logic against local DB
                const foundBird = BIRDS_DB.find(b => 
                    b.name.toLowerCase() === identifiedName.toLowerCase() ||
                    b.name.toLowerCase().includes(identifiedName.toLowerCase()) ||
                    identifiedName.toLowerCase().includes(b.name.toLowerCase())
                );

                if (foundBird) {
                    setPreviewBird(foundBird);
                } else {
                    // Bird not in local DB - get full info for vacation mode
                    setAnalyzing(true);
                    const globalResult = await identifyBirdGlobal(base64String);
                    setAnalyzing(false);
                    
                    if (globalResult) {
                        setDetectedVacationBird(globalResult);
                    } else {
                        setPhotoError(`Die KI hat einen "${identifiedName}" erkannt, konnte aber keine weiteren Infos finden.`);
                    }
                }
            } else {
                setPhotoError("Konnte den Vogel auf dem Bild nicht erkennen. Versuche eine nähere Aufnahme.");
            }
        };
        reader.readAsDataURL(file);
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    // Handle adding a vacation bird (not in local DB)
    const handleAddVacationBird = async () => {
        if (!detectedVacationBird || !vacationCountry.trim()) return;
        
        setLoadingPreview(true);
        // Pass scientific name as second argument for better Wikipedia disambiguation
        const wikiData = await fetchWikiData(detectedVacationBird.name, detectedVacationBird.sciName);
        setLoadingPreview(false);
        
        const vacationBird: Bird = {
            id: `vacation_${Date.now()}`,
            name: detectedVacationBird.name,
            sciName: detectedVacationBird.sciName,
            rarity: 'Urlaubsfund',
            points: 25, // Base XP for vacation birds
            locationType: 'vacation',
            country: vacationCountry.trim(),
            realImg: wikiData?.img || selectedImage || undefined,
            realDesc: wikiData?.desc || `${detectedVacationBird.name} - im Urlaub entdeckt.`,
            seenAt: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        
        onFound(vacationBird);
    };

    // --- RENDERERS ---

    const renderMenu = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-teal">Vogel bestimmen</h2>
                <button 
                    onClick={onToggleMode}
                    className="text-gray-400 text-sm hover:text-teal transition-colors"
                >
                    Modus: <span className={`font-bold capitalize ${modeType === 'vacation' ? 'text-orange' : 'text-teal'}`}>
                        {modeType === 'vacation' ? 'Urlaub 🌴' : 'Heimat 🌲'}
                    </span>
                    <span className="ml-1 text-xs">(wechseln)</span>
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setMode('manual')} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-teal hover:shadow-md transition-all text-left group">
                    <div className="bg-teal/10 w-10 h-10 rounded-full flex items-center justify-center text-teal mb-3 group-hover:scale-110 transition-transform">
                        <Search size={20}/>
                    </div>
                    <div className="font-bold text-teal">Direkt-Eingabe</div>
                    <div className="text-[10px] text-gray-400">Suche in der {modeType === 'vacation' ? 'Urlaubs' : 'lokalen'} Datenbank.</div>
                </button>

                <button onClick={() => setMode('wizard')} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-teal hover:shadow-md transition-all text-left group">
                    <div className="bg-orange/10 w-10 h-10 rounded-full flex items-center justify-center text-orange mb-3 group-hover:scale-110 transition-transform">
                        <Puzzle size={20}/>
                    </div>
                    <div className="font-bold text-teal">Assistent</div>
                    <div className="text-[10px] text-gray-400">Schritt-für-Schritt Bestimmungshilfe.</div>
                </button>

                <button onClick={() => setMode('sound')} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-teal hover:shadow-md transition-all text-left group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-50"></div>
                    <div className="relative z-10">
                        <div className="bg-green-100 w-10 h-10 rounded-full flex items-center justify-center text-green-600 mb-3 group-hover:scale-110 transition-transform">
                            <Mic size={20}/>
                        </div>
                        <div className="font-bold text-teal">Sound ID</div>
                        <div className="text-[10px] text-gray-400">Powered by Merlin.</div>
                    </div>
                </button>

                <button onClick={() => setMode('photo')} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-teal hover:shadow-md transition-all text-left group">
                    <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center text-purple-600 mb-3 group-hover:scale-110 transition-transform">
                        <Camera size={20}/>
                    </div>
                    <div className="font-bold text-teal">Foto ID</div>
                    <div className="text-[10px] text-gray-400">Kamera & Bildanalyse (KI).</div>
                </button>
            </div>
        </div>
    );

    const renderPreview = () => {
        if (!previewBird) return null;

        return (
            <div className="animate-fade-in h-full flex flex-col">
                <div className="flex items-center mb-4">
                    <button onClick={() => {
                        setPreviewBird(null); 
                        if(mode==='photo') setMode('menu');
                        setSelectedImage(null);
                    }} className="text-gray-400 hover:text-teal flex items-center gap-1">
                        <ChevronLeft size={18} /> Zurück
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 mb-4">
                        <div className="h-56 bg-gray-100 relative flex items-center justify-center overflow-hidden">
                            {/* Prioritize Uploaded Image for Preview if exists */}
                            {selectedImage ? (
                                <>
                                    <div className="absolute inset-0 bg-cover bg-center blur-xl opacity-50 scale-110" style={{ backgroundImage: `url(${selectedImage})` }}></div>
                                    <img src={selectedImage} className="relative z-10 max-w-full max-h-full object-contain" alt="Uploaded" />
                                </>
                            ) : loadingPreview ? (
                                <div className="flex flex-col items-center gap-2 text-gray-400">
                                    <Loader2 className="animate-spin" size={24} />
                                    <span className="text-xs">Lade Bild...</span>
                                </div>
                            ) : previewData?.img ? (
                                <>
                                    <div className="absolute inset-0 bg-cover bg-center blur-xl opacity-50 scale-110" style={{ backgroundImage: `url(${previewData.img})` }}></div>
                                    <img src={previewData.img} className="relative z-10 max-w-full max-h-full object-contain" alt={previewBird.name} />
                                </>
                            ) : (
                                <div className="text-6xl">🐦</div>
                            )}
                        </div>
                        <div className="p-5 text-center">
                            <h3 className="text-2xl font-bold text-teal">{previewBird.name}</h3>
                            <p className="text-gray-400 italic font-serif">{previewBird.sciName}</p>
                            
                            <div className="mt-4 flex gap-2 justify-center text-xs">
                                <span className="px-2 py-1 bg-orange/10 text-orange rounded font-bold">+{previewBird.points} XP</span>
                                <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded">{previewBird.rarity}</span>
                            </div>

                            <div className="mt-4 text-sm text-gray-500 line-clamp-3 text-left">
                                {loadingPreview ? 'Lade Beschreibung...' : previewData?.desc}
                            </div>
                        </div>
                    </div>

                    {/* Verification / External Resources Section */}
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                            <HelpCircle size={14} /> Nicht sicher? Zweite Meinung:
                        </h4>
                        <div className="space-y-2">
                            <a 
                                href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(previewBird.name + ' Vogel')}`}
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 hover:border-teal text-sm text-gray-600 hover:text-teal transition-colors"
                            >
                                <span className="flex items-center gap-2"><Camera size={14}/> Google Bilder Vergleich</span>
                                <ExternalLink size={14} className="text-gray-300" />
                            </a>
                            <a 
                                href={`https://www.google.com/search?q=NABU+${encodeURIComponent(previewBird.name)}`}
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 hover:border-teal text-sm text-gray-600 hover:text-teal transition-colors"
                            >
                                <span className="flex items-center gap-2"><Globe size={14}/> NABU Porträt</span>
                                <ExternalLink size={14} className="text-gray-300" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-4 space-y-3">
                    <button 
                        onClick={handleConfirmBird}
                        className="w-full py-4 bg-teal text-white rounded-2xl font-bold shadow-lg shadow-teal/20 flex items-center justify-center gap-2 hover:bg-teal-800 transition-colors active:scale-95"
                    >
                        <Check size={20} /> Das ist mein Vogel
                    </button>
                </div>
            </div>
        );
    };

    const renderManual = () => {
        if (previewBird) return renderPreview();
        
        // Show vacation bird confirmation if detected
        if (detectedVacationBird) {
            return (
                <div className="animate-fade-in h-full flex flex-col items-center justify-center text-center relative">
                    <button onClick={() => { setMode('menu'); setDetectedVacationBird(null); setVacationSearchResult(null); setVacationCountry(''); }} className="absolute top-0 left-0 text-gray-400 text-sm hover:text-teal">Zurück</button>
                    
                    <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200 max-w-xs">
                        <Globe className="mx-auto text-orange-500 mb-3" size={40} />
                        <h3 className="text-orange-800 font-bold text-lg mb-1">{detectedVacationBird.name}</h3>
                        <p className="text-xs text-orange-600 italic mb-3">{detectedVacationBird.sciName}</p>
                        
                        {/* Country Input */}
                        <div className="mb-4">
                            <label className="block text-xs text-orange-700 font-medium mb-1 text-left">
                                Wo hast du diesen Vogel entdeckt?
                            </label>
                            <input
                                type="text"
                                value={vacationCountry}
                                onChange={(e) => setVacationCountry(e.target.value)}
                                placeholder="z.B. Botswana, Thailand, Spanien..."
                                className="w-full px-3 py-2 rounded-lg border border-orange-200 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <button 
                                onClick={handleAddVacationBird}
                                disabled={loadingPreview || !vacationCountry.trim()}
                                className="w-full px-4 py-3 bg-orange text-white font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loadingPreview ? <Loader2 className="animate-spin" size={18} /> : <Globe size={18} />}
                                Zur Sammlung hinzufügen
                            </button>
                            <button 
                                onClick={() => { setDetectedVacationBird(null); setVacationSearchResult(null); setVacationCountry(''); }} 
                                className="w-full px-4 py-2 bg-orange-100 text-orange-700 font-bold rounded-lg hover:bg-orange-200 text-sm"
                            >
                                Abbrechen
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="animate-fade-in h-full flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setMode('menu')} className="text-gray-400 text-sm hover:text-teal">Zurück</button>
                    <h3 className="font-bold text-teal flex-1 text-center">Suche ({modeType === 'vacation' ? 'Urlaub' : 'Lokal'})</h3>
                    <div className="w-8"></div>
                </div>
                
                <div className="relative mb-2">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                        type="text"
                        autoFocus
                        placeholder={modeType === 'vacation' ? "z.B. Flamingo, Tukan..." : "z.B. Amsel..."}
                        className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-teal focus:ring-2 focus:ring-teal/10"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setVacationSearchResult(null);
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && modeType === 'vacation' && handleVacationSearch()}
                    />
                </div>
                {modeType === 'vacation' && (
                    <p className="text-xs text-gray-400 mb-4 text-center">
                        💡 Tipp: Wissenschaftliche Namen (z.B. <span className="italic">Pycnonotus</span>) liefern genauere Ergebnisse
                    </p>
                )}

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
                    {searchResults.map(bird => (
                        <button 
                            key={bird.id}
                            onClick={() => setPreviewBird(bird)}
                            className="w-full p-3 bg-white rounded-xl border border-gray-100 flex items-center justify-between hover:border-teal hover:bg-teal/5 transition-all"
                        >
                            <span className="font-bold text-teal">{bird.name}</span>
                            <span className="text-xs text-gray-400 italic">{bird.sciName}</span>
                        </button>
                    ))}
                    
                    {/* Vacation Mode: AI Search Button */}
                    {modeType === 'vacation' && searchTerm && searchResults.length === 0 && !vacationSearchResult && (
                        <div className="text-center py-6">
                            <p className="text-gray-400 text-sm mb-4">Nicht in der Datenbank gefunden.</p>
                            <button
                                onClick={handleVacationSearch}
                                disabled={searchingVacation}
                                className="px-6 py-3 bg-orange text-white rounded-xl font-bold flex items-center gap-2 mx-auto hover:bg-orange-600 transition-colors disabled:opacity-50"
                            >
                                {searchingVacation ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Suche...
                                    </>
                                ) : (
                                    <>
                                        <Globe size={18} />
                                        Weltweit suchen
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                    
                    {/* Vacation Search Result */}
                    {vacationSearchResult && (
                        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200 animate-fade-in">
                            <div className="flex items-center gap-3 mb-3">
                                <Globe className="text-orange" size={24} />
                                <div>
                                    <h4 className="font-bold text-orange">{vacationSearchResult.name}</h4>
                                    <p className="text-xs text-orange-600 italic">{vacationSearchResult.sciName}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setDetectedVacationBird(vacationSearchResult)}
                                className="w-full py-3 bg-orange text-white rounded-xl font-bold hover:bg-orange-600 transition-colors"
                            >
                                Diesen Vogel hinzufügen
                            </button>
                        </div>
                    )}
                    
                    {searchTerm && searchResults.length === 0 && modeType !== 'vacation' && (
                        <div className="text-center text-gray-400 mt-10">Keine Vögel gefunden.</div>
                    )}
                </div>
            </div>
        );
    };

    const renderSound = () => {
        return (
            <div className="animate-fade-in h-full flex flex-col items-center justify-center text-center p-6 relative">
                <button onClick={() => setMode('menu')} className="absolute top-0 left-0 text-gray-400 text-sm hover:text-teal">Zurück</button>
                
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Activity size={48} className="text-green-600" />
                </div>
                
                <h3 className="text-2xl font-bold text-teal mb-2">Sound ID</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                    Für die zuverlässigste Gesangserkennung empfehlen wir die kostenlose <strong>Merlin Bird ID</strong> App.
                </p>

                <div className="w-full space-y-3">
                    <a 
                        href="https://apps.apple.com/app/merlin-bird-id-by-cornell-lab/id773457673"
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
                    >
                        <ExternalLink size={20}/>
                        Merlin App öffnen
                    </a>

                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-cream px-2 text-gray-400">Danach</span>
                        </div>
                    </div>

                    <button 
                        onClick={() => setMode('manual')}
                        className="w-full py-4 bg-white border-2 border-teal text-teal rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-teal/5 transition-colors"
                    >
                        <Check size={20}/>
                        Vogel manuell loggen
                    </button>
                </div>

                <p className="mt-6 text-[10px] text-gray-400">
                    Wenn du den Vogel in Merlin erkannt hast, kehre hierher zurück, um ihn zu deiner Sammlung hinzuzufügen und Punkte zu sammeln!
                </p>
            </div>
        );
    };

    const renderPhoto = () => {
        if (previewBird) return renderPreview();

        return (
            <div className="animate-fade-in h-full flex flex-col items-center justify-center text-center relative">
                 <button onClick={() => { setMode('menu'); setPhotoError(null); }} className="absolute top-0 left-0 text-gray-400 text-sm hover:text-teal">Zurück</button>
                 
                 {/* Hidden File Input for Camera */}
                 <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="camera-input"
                 />
                 
                 {/* Hidden File Input for Gallery (no capture attribute) */}
                 <input 
                    type="file" 
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="gallery-input"
                 />

                 {!analyzing && !photoError && (
                     <>
                        <div className="w-32 h-32 bg-purple-50 rounded-full flex items-center justify-center mb-8">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-300 hover:scale-105 transition-transform"
                            >
                                <Camera size={40} />
                            </button>
                        </div>
                        <h3 className="text-xl font-bold text-teal mb-2">Foto aufnehmen</h3>
                        <p className="text-gray-400 text-sm max-w-[200px]">
                            Mache ein Foto oder wähle eines aus der Galerie.
                        </p>
                        <button 
                            onClick={() => document.getElementById('gallery-input')?.click()} 
                            className="mt-6 flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-200"
                        >
                            <Upload size={14} /> Aus Galerie
                        </button>
                     </>
                 )}

                 {analyzing && (
                    <div className="space-y-4">
                        <div className="relative w-32 h-48 mx-auto rounded-xl overflow-hidden border-4 border-white shadow-lg">
                             {selectedImage && <img src={selectedImage} className="w-full h-full object-cover opacity-50" alt="Analysing" />}
                             <div className="absolute inset-0 flex items-center justify-center">
                                 <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                             </div>
                        </div>
                        <div className="text-purple-600 font-bold">KI analysiert Bild...</div>
                        <p className="text-xs text-gray-400">Ich schaue mir Schnabel und Gefieder an.</p>
                    </div>
                )}

                {/* Vacation Bird Detected - Not in local DB */}
                {detectedVacationBird && !photoError && (
                    <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200 max-w-xs animate-fade-in">
                        <Globe className="mx-auto text-orange-500 mb-3" size={40} />
                        <h3 className="text-orange-800 font-bold text-lg mb-1">{detectedVacationBird.name}</h3>
                        <p className="text-xs text-orange-600 italic mb-3">{detectedVacationBird.sciName}</p>
                        
                        {/* Country Input */}
                        <div className="mb-4">
                            <label className="block text-xs text-orange-700 font-medium mb-1 text-left">
                                Wo hast du diesen Vogel entdeckt?
                            </label>
                            <input
                                type="text"
                                value={vacationCountry}
                                onChange={(e) => setVacationCountry(e.target.value)}
                                placeholder="z.B. Botswana, Thailand, Spanien..."
                                className="w-full px-3 py-2 rounded-lg border border-orange-200 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <button 
                                onClick={handleAddVacationBird}
                                disabled={loadingPreview || !vacationCountry.trim()}
                                className="w-full px-4 py-3 bg-orange text-white font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loadingPreview ? <Loader2 className="animate-spin" size={18} /> : <Globe size={18} />}
                                Zur Sammlung hinzufügen
                            </button>
                            <button 
                                onClick={() => { setDetectedVacationBird(null); setSelectedImage(null); setVacationCountry(''); }} 
                                className="w-full px-4 py-2 bg-orange-100 text-orange-700 font-bold rounded-lg hover:bg-orange-200 text-sm"
                            >
                                Neues Foto
                            </button>
                        </div>
                    </div>
                )}

                {photoError && !detectedVacationBird && (
                     <div className="bg-red-50 p-6 rounded-2xl border border-red-100 max-w-xs">
                        <AlertTriangle className="mx-auto text-red-500 mb-2" size={32} />
                        <h3 className="text-red-800 font-bold mb-2">Nicht erkannt</h3>
                        <p className="text-sm text-red-700 mb-4">{photoError}</p>
                        <button onClick={() => { setPhotoError(null); setSelectedImage(null); }} className="px-4 py-2 bg-red-100 text-red-700 font-bold rounded-lg hover:bg-red-200">
                            Neues Foto
                        </button>
                     </div>
                )}
            </div>
        );
    };

    const renderWizard = () => {
        const steps = [
            // Step 0: Size
            <div key="size" className="space-y-4 animate-fade-in">
                <h3 className="text-xl font-bold text-teal text-center mb-6">Wie groß war er?</h3>
                <div className="grid grid-cols-2 gap-4">
                    {WIZARD_SIZES.map(size => (
                        <button key={size.id} onClick={() => setWizardStep(1)} className="bg-white p-4 rounded-xl border border-gray-200 hover:border-teal hover:bg-teal/5 transition-all">
                            <div className="text-3xl mb-2">{size.icon}</div>
                            <div className="font-bold text-gray-700 text-sm">{size.label}</div>
                        </button>
                    ))}
                </div>
            </div>,
            // Step 1: Color
            <div key="color" className="space-y-4 animate-fade-in">
                 <h3 className="text-xl font-bold text-teal text-center mb-6">Hauptfarben?</h3>
                 <div className="flex flex-wrap gap-4 justify-center">
                    {WIZARD_COLORS.map(col => (
                        <button key={col.id} onClick={() => setWizardStep(2)} className={`w-16 h-16 rounded-full shadow-sm transform hover:scale-110 transition-all ${col.color}`}></button>
                    ))}
                 </div>
            </div>,
            // Step 2: Activity
            <div key="act" className="space-y-4 animate-fade-in">
                <h3 className="text-xl font-bold text-teal text-center mb-6">Was hat er gemacht?</h3>
                {['Am Boden', 'An einem Baum', 'Am Futterhaus', 'Im Flug', 'Schwimmend'].map((act, i) => (
                     <button key={i} onClick={() => {
                         // Finish Wizard -> Random result matching mode (Simulation for Wizard)
                         const possibleBirds = BIRDS_DB.filter(b => (b.locationType || 'local') === modeType);
                         const randomBird = possibleBirds.length > 0 ? possibleBirds[Math.floor(Math.random() * possibleBirds.length)] : BIRDS_DB[0];
                         setPreviewBird(randomBird); // Show preview first
                     }} className="w-full p-4 bg-white rounded-xl border border-gray-200 hover:border-teal font-bold text-gray-700 text-left">
                         {act}
                     </button>
                ))}
            </div>
        ];

        // If wizard finished and selected a bird (simulated), show preview
        if (previewBird) return renderPreview();

        return (
            <div className="h-full flex flex-col">
                <div className="flex items-center mb-6">
                    <button onClick={() => wizardStep === 0 ? setMode('menu') : setWizardStep(s => s - 1)} className="text-gray-400 hover:text-teal">Zurück</button>
                    <div className="flex-1 flex justify-center gap-2">
                        {[0, 1, 2].map(i => (
                            <div key={i} className={`w-2 h-2 rounded-full ${i === wizardStep ? 'bg-teal' : 'bg-gray-200'}`}></div>
                        ))}
                    </div>
                    <div className="w-8"></div>
                </div>
                {steps[wizardStep]}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-cream/95 backdrop-blur-md z-40 flex items-center justify-center p-6 animate-fade-in">
            <div className="w-full max-w-sm h-[600px] relative flex flex-col">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm text-teal hover:bg-gray-100 transition-colors z-50">
                    <X size={24} />
                </button>
                
                <div className="flex-1 overflow-y-auto no-scrollbar pt-2">
                    {mode === 'menu' && renderMenu()}
                    {mode === 'manual' && renderManual()}
                    {mode === 'sound' && renderSound()}
                    {mode === 'wizard' && renderWizard()}
                    {mode === 'photo' && renderPhoto()}
                </div>
            </div>
        </div>
    );
};
