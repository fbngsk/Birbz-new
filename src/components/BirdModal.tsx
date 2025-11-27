import React, { useState, useEffect } from 'react';
import { X, CheckCircle, HelpCircle, Plus, Loader2, ChevronRight, ChevronLeft, ImageIcon, Search, Volume2, Share2 } from 'lucide-react';
import { Bird, WikiResult } from '../types';
import { fetchWikiData } from '../services/birdService';
import { ShareCard } from './ShareCard';

interface BirdModalProps {
    bird: Bird;
    onClose: () => void;
    onFound: (bird: Bird) => void;
    isCollected: boolean;
    userName?: string;
}

export const BirdModal: React.FC<BirdModalProps> = ({ bird, onClose, onFound, isCollected, userName = 'Birbz User' }) => {
    const [wikiData, setWikiData] = useState<WikiResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [currentImgIndex, setCurrentImgIndex] = useState(0);
    const [showShare, setShowShare] = useState(false);

    useEffect(() => {
        let isMounted = true;
        
        const loadData = async () => {
             // Always try to fetch wiki data to get the gallery images, 
             // even if we have a single realImg already
             setLoading(true);
             const data = await fetchWikiData(bird.name);
             if (isMounted) {
                 setWikiData(data);
                 setLoading(false);
             }
        };

        loadData();

        return () => { isMounted = false; };
    }, [bird]);

    // Determine gallery images
    // If wikiData has images, use them. Otherwise fallback to bird.realImg or bird.img
    const galleryImages = wikiData?.images && wikiData.images.length > 0 
        ? wikiData.images 
        : (bird.realImg ? [bird.realImg] : (bird.img ? [bird.img] : []));

    const currentImage = galleryImages[currentImgIndex];
    const displayDesc = bird.realDesc || wikiData?.desc;

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (galleryImages.length > 0) {
            setCurrentImgIndex((prev) => (prev + 1) % galleryImages.length);
        }
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (galleryImages.length > 0) {
            setCurrentImgIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-cream w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative animate-slide-up max-h-[90vh] overflow-y-auto no-scrollbar flex flex-col">
                
                {/* Header Image Gallery Area */}
                <div className="h-80 relative shrink-0 bg-gray-900 group overflow-hidden">
                    {currentImage ? (
                        <>
                             {/* Blurry Background for Fill */}
                             <div 
                                className="absolute inset-0 bg-cover bg-center opacity-50 blur-xl scale-110 transition-all duration-700"
                                style={{ backgroundImage: `url(${currentImage})` }}
                             ></div>

                             {/* Main Image */}
                             <img 
                                src={currentImage} 
                                alt={bird.name}
                                className={`relative z-10 w-full h-full object-contain transition-opacity duration-500 ${loading && !wikiData ? 'opacity-0' : 'opacity-100'} ${!isCollected ? 'grayscale-[50%]' : ''}`} 
                            />
                        </>
                    ) : (
                         <div className="w-full h-full flex flex-col items-center justify-center text-white/20 bg-teal">
                             <span className="text-6xl font-bold">?</span>
                         </div>
                    )}

                    {/* Navigation Arrows */}
                    {galleryImages.length > 1 && (
                        <>
                            <button 
                                onClick={prevImage}
                                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-sm transition-all active:scale-90"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button 
                                onClick={nextImage}
                                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-sm transition-all active:scale-90"
                            >
                                <ChevronRight size={24} />
                            </button>
                            
                            {/* Dots Indicator */}
                            <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-1.5">
                                {galleryImages.map((_, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`w-1.5 h-1.5 rounded-full transition-all shadow-sm ${idx === currentImgIndex ? 'bg-white w-3' : 'bg-white/40'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Image Loading Indicator */}
                    {loading && !wikiData && (
                        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                            <Loader2 className="animate-spin text-white" size={40} />
                        </div>
                    )}
                    
                    {/* Gradients for Text Readability */}
                    <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/60 to-transparent z-10 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none"></div>
                    
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 bg-black/30 text-white p-2 rounded-full backdrop-blur-md hover:bg-black/50 transition-colors z-40"
                    >
                        <X size={20}/>
                    </button>
                    
                    <div className="absolute bottom-6 left-6 right-6 z-20">
                        <h2 className="text-3xl font-bold text-white shadow-black drop-shadow-md leading-none mb-1">{bird.name}</h2>
                        <p className="text-teal-100 italic text-sm font-serif shadow-black drop-shadow-sm">{bird.sciName}</p>
                    </div>
                </div>
                
                <div className="p-6 space-y-6 flex-1 bg-cream relative z-10 -mt-4 rounded-t-3xl">
                    {/* Center 'Handle' visual */}
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-2"></div>

                    {/* Status Banner */}
                    <div className={`flex items-center gap-3 p-4 rounded-2xl border shadow-sm ${isCollected ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className={`p-2 rounded-full ${isCollected ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                            {isCollected ? <CheckCircle size={20} /> : <HelpCircle size={20} />}
                        </div>
                        <div>
                            <div className={`text-xs font-bold uppercase tracking-wide ${isCollected ? 'text-green-700' : 'text-gray-500'}`}>
                                {isCollected ? 'In deiner Sammlung' : 'Noch nicht entdeckt'}
                            </div>
                            <div className="text-xs text-gray-500">
                                {isCollected ? 'Du hast diesen Vogel bereits gefunden.' : 'Halte Ausschau nach dieser Art!'}
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <div className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                            bird.rarity === 'Häufig' ? 'bg-green-100 text-green-600' : 
                            bird.rarity === 'Selten' ? 'bg-purple-100 text-purple-600' : 
                            bird.rarity?.includes('Gefährdet') ? 'bg-red-100 text-red-600' :
                            'bg-blue-100 text-blue-600'
                        }`}>
                            {bird.rarity}
                        </div>
                        <div className="text-xs text-gray-400 border-l pl-3 border-gray-200">
                            {bird.points} XP Belohnung
                        </div>
                        {galleryImages.length > 1 && (
                             <div className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                                 <ImageIcon size={12} /> {galleryImages.length} Bilder
                             </div>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <h4 className="font-bold text-teal text-sm uppercase mb-2 tracking-wide flex items-center gap-2">
                            Beschreibung
                            {loading && <Loader2 size={14} className="animate-spin text-teal"/>}
                        </h4>
                        <div className={`text-gray-600 leading-relaxed text-sm text-justify transition-opacity duration-300 min-h-[80px] ${loading && !displayDesc ? 'opacity-50' : 'opacity-100'}`}>
                            {loading && !displayDesc ? (
                                <div className="space-y-2 animate-pulse">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                                </div>
                            ) : (
                                displayDesc || "Keine detaillierte Beschreibung verfügbar."
                            )}
                        </div>
                        {displayDesc && <p className="text-[10px] text-gray-400 mt-2 text-right">Quelle: Wikipedia</p>}
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 pt-2">
                        {/* External Resources - Google & Merlin */}
                        {!isCollected && (
                            <div className="grid grid-cols-2 gap-2">
                                <a 
                                    href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(bird.name + ' Vogel')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="py-3 bg-white border border-gray-200 text-gray-500 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:border-teal hover:text-teal transition-colors"
                                >
                                    <Search size={14} />
                                    Bilder Vergleich
                                </a>
                                <a 
                                    href="https://apps.apple.com/app/merlin-bird-id-by-cornell-lab/id773457673"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="py-3 bg-white border border-gray-200 text-gray-500 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:border-green-500 hover:text-green-600 transition-colors"
                                >
                                    <Volume2 size={14} />
                                    Gesang (Merlin)
                                </a>
                            </div>
                        )}

                        {/* Share Button for Collected Birds */}
                        {isCollected && (
                            <button 
                                onClick={() => setShowShare(true)}
                                className="w-full py-3 bg-gradient-to-r from-teal to-cyan-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-95"
                            >
                                <Share2 size={18} />
                                Fund teilen
                            </button>
                        )}

                        {/* Action Button for Uncollected Birds */}
                        {!isCollected ? (
                            <button 
                                onClick={() => onFound(bird)}
                                className="w-full py-4 bg-teal text-white rounded-2xl font-bold shadow-lg shadow-teal/20 flex items-center justify-center gap-2 hover:bg-teal-800 transition-colors active:scale-95"
                            >
                                <Plus size={20} />
                                Vogel gefunden!
                            </button>
                        ) : (
                            <div className="text-center text-xs text-gray-400 pt-2">
                                Gefunden am: {bird.seenAt || 'Unbekanntes Datum'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Share Card Modal */}
            {showShare && (
                <ShareCard 
                    bird={{...bird, realImg: currentImage || bird.realImg}}
                    userName={userName}
                    onClose={() => setShowShare(false)}
                />
            )}
        </div>
    );
};
