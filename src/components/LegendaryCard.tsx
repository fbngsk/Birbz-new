import React, { useState, useRef, useEffect } from 'react';
import { X, Share2, Download, Sparkles } from 'lucide-react';
import html2canvas from 'html2canvas';

interface LegendaryCardProps {
    bird: {
        name: string;
        sciName: string;
        image: string; // URL to the card artwork
    };
    cardNumber?: number;
    totalFound?: number;
    discoveredAt?: string;
    discoveredBy?: string;
    location?: string;
    onClose?: () => void;
}

export const LegendaryCard: React.FC<LegendaryCardProps> = ({
    bird,
    cardNumber,
    totalFound,
    discoveredAt,
    discoveredBy,
    location,
    onClose
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [sharing, setSharing] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [isFlipped, setIsFlipped] = useState(false);
    const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });
    const [isInteracting, setIsInteracting] = useState(false);

    // Generate card image for sharing/saving
    const generateCardImage = async (): Promise<Blob | null> => {
        if (!cardRef.current) return null;
        
        // Reset rotation for clean screenshot
        const originalTransform = cardRef.current.style.transform;
        cardRef.current.style.transform = 'rotateX(0deg) rotateY(0deg)';
        
        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
            });
            
            return new Promise((resolve) => {
                canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
            });
        } finally {
            cardRef.current.style.transform = originalTransform;
        }
    };

    // Share function
    const handleShare = async () => {
        setSharing(true);
        try {
            const blob = await generateCardImage();
            if (!blob) throw new Error('Could not generate image');
            
            const file = new File([blob], `birbz-${bird.name.toLowerCase()}.png`, { type: 'image/png' });
            
            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `Birbz: ${bird.name}`,
                    text: `Ich habe den legendären ${bird.name} gefunden! 🦅✨ #Birbz`,
                    files: [file]
                });
            } else {
                // Fallback: download
                await handleSave();
            }
        } catch (err) {
            console.error('Share failed:', err);
        }
        setSharing(false);
    };

    // Save function
    const handleSave = async () => {
        setSharing(true);
        try {
            const blob = await generateCardImage();
            if (!blob) throw new Error('Could not generate image');
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `birbz-${bird.name.toLowerCase()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Save failed:', err);
        }
        setSharing(false);
    };

    // Handle mouse/touch movement for 3D effect
    const handleMove = (clientX: number, clientY: number) => {
        if (!cardRef.current) return;
        
        const rect = cardRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Calculate rotation (max 15 degrees)
        const rotateY = ((clientX - centerX) / (rect.width / 2)) * 15;
        const rotateX = -((clientY - centerY) / (rect.height / 2)) * 15;
        
        // Calculate glare position (0-100%)
        const glareX = ((clientX - rect.left) / rect.width) * 100;
        const glareY = ((clientY - rect.top) / rect.height) * 100;
        
        setRotation({ x: rotateX, y: rotateY });
        setGlarePosition({ x: glareX, y: glareY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length > 0) {
            handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }
    };

    const handleInteractionStart = () => {
        setIsInteracting(true);
    };

    const handleInteractionEnd = () => {
        setIsInteracting(false);
        // Smooth return to center
        setRotation({ x: 0, y: 0 });
        setGlarePosition({ x: 50, y: 50 });
    };

    // Auto-animate on mount
    useEffect(() => {
        let frame = 0;
        const animate = () => {
            if (!isInteracting) {
                frame += 0.02;
                const x = Math.sin(frame) * 3;
                const y = Math.cos(frame * 0.7) * 3;
                setRotation({ x, y });
                setGlarePosition({ x: 50 + Math.sin(frame) * 20, y: 50 + Math.cos(frame) * 20 });
            }
            requestAnimationFrame(animate);
        };
        const animationId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationId);
    }, [isInteracting]);

    // Block body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in"
            style={{ width: '100vw', height: '100vh' }}
        >
            {/* Close button */}
            {onClose && (
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
                >
                    <X size={24} />
                </button>
            )}

            <div className="flex flex-col items-center gap-6">
                {/* Card Container */}
                <div 
                    className="relative perspective-1000"
                    style={{ perspective: '1000px' }}
                >
                    <div
                        ref={cardRef}
                        className={`relative w-[300px] h-[420px] cursor-pointer transition-transform duration-200 ${isInteracting ? '' : 'duration-1000'}`}
                        style={{
                            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                            transformStyle: 'preserve-3d'
                        }}
                        onMouseMove={handleMouseMove}
                        onMouseEnter={handleInteractionStart}
                        onMouseLeave={handleInteractionEnd}
                        onTouchMove={handleTouchMove}
                        onTouchStart={handleInteractionStart}
                        onTouchEnd={handleInteractionEnd}
                        onClick={() => setIsFlipped(!isFlipped)}
                    >
                        {/* Card Front */}
                        <div 
                            className={`absolute inset-0 rounded-2xl overflow-hidden shadow-2xl transition-opacity duration-300 ${isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                            style={{ backfaceVisibility: 'hidden' }}
                        >
                            {/* Card Image or Fallback */}
                            {bird.image && !imageError ? (
                                <>
                                    <img 
                                        src={bird.image} 
                                        alt={bird.name}
                                        className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                                        onLoad={() => setImageLoaded(true)}
                                        onError={() => setImageError(true)}
                                        crossOrigin="anonymous"
                                    />
                                    {!imageLoaded && (
                                        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 flex flex-col items-center justify-center">
                                            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                                            <span className="text-white/60 text-sm">Lade Karte...</span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 flex flex-col items-center justify-center">
                                    <span className="text-8xl mb-4">🦅</span>
                                    <span className="text-2xl font-bold text-white">{bird.name}</span>
                                    <span className="text-yellow-400 italic text-sm">{bird.sciName}</span>
                                </div>
                            )}
                            
                            {/* Holographic Overlay */}
                            <div 
                                className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-70"
                                style={{
                                    background: `
                                        radial-gradient(
                                            circle at ${glarePosition.x}% ${glarePosition.y}%,
                                            rgba(255, 255, 255, 0.8) 0%,
                                            rgba(255, 215, 0, 0.4) 20%,
                                            rgba(255, 100, 255, 0.3) 40%,
                                            rgba(100, 200, 255, 0.3) 60%,
                                            transparent 80%
                                        )
                                    `
                                }}
                            />
                            
                            {/* Rainbow shimmer effect */}
                            <div 
                                className="absolute inset-0 pointer-events-none opacity-30"
                                style={{
                                    background: `
                                        linear-gradient(
                                            ${45 + rotation.y * 2}deg,
                                            transparent 0%,
                                            rgba(255, 0, 0, 0.5) 10%,
                                            rgba(255, 154, 0, 0.5) 20%,
                                            rgba(208, 222, 33, 0.5) 30%,
                                            rgba(79, 220, 74, 0.5) 40%,
                                            rgba(63, 218, 216, 0.5) 50%,
                                            rgba(47, 201, 226, 0.5) 60%,
                                            rgba(28, 127, 238, 0.5) 70%,
                                            rgba(95, 21, 242, 0.5) 80%,
                                            rgba(186, 12, 248, 0.5) 90%,
                                            transparent 100%
                                        )
                                    `,
                                    mixBlendMode: 'color-dodge'
                                }}
                            />

                            {/* Sparkle particles */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                {[...Array(20)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                                        style={{
                                            left: `${Math.random() * 100}%`,
                                            top: `${Math.random() * 100}%`,
                                            animationDelay: `${Math.random() * 2}s`,
                                            animationDuration: `${1 + Math.random() * 2}s`,
                                            opacity: 0.6 + Math.random() * 0.4
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Card Back */}
                        <div 
                            className={`absolute inset-0 rounded-2xl overflow-hidden shadow-2xl transition-opacity duration-300 ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                            style={{ 
                                backfaceVisibility: 'hidden',
                                transform: 'rotateY(180deg)'
                            }}
                        >
                            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex flex-col">
                                {/* Header */}
                                <div className="text-center mb-6">
                                    <div className="inline-block px-4 py-1 bg-yellow-500/20 rounded-full mb-3">
                                        <span className="text-yellow-400 text-xs font-bold tracking-widest">LEGENDÄR</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-1">{bird.name}</h2>
                                    <p className="text-yellow-400/80 italic text-sm">{bird.sciName}</p>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent mb-6" />

                                {/* Stats */}
                                <div className="space-y-4 flex-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 text-sm">Karten-Nr.</span>
                                        <span className="text-yellow-400 font-mono font-bold">#{String(cardNumber).padStart(5, '0')}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 text-sm">Weltweit gefunden</span>
                                        <span className="text-white font-bold">{totalFound}×</span>
                                    </div>
                                    {discoveredBy && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400 text-sm">Entdecker</span>
                                            <span className="text-white font-bold">{discoveredBy}</span>
                                        </div>
                                    )}
                                    {discoveredAt && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400 text-sm">Entdeckt am</span>
                                            <span className="text-white">{discoveredAt}</span>
                                        </div>
                                    )}
                                    {location && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400 text-sm">Ort</span>
                                            <span className="text-white text-right max-w-[150px] truncate">{location}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent my-4" />

                                {/* Footer */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">🐦</span>
                                        <span className="text-white font-bold">Birbz</span>
                                    </div>
                                    <div className="text-slate-500 text-xs">
                                        Limitierte Edition
                                    </div>
                                </div>
                            </div>

                            {/* Holographic overlay for back too */}
                            <div 
                                className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-30"
                                style={{
                                    background: `
                                        radial-gradient(
                                            circle at ${glarePosition.x}% ${glarePosition.y}%,
                                            rgba(255, 215, 0, 0.6) 0%,
                                            transparent 50%
                                        )
                                    `
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <button 
                        onClick={handleShare}
                        disabled={sharing}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-xl font-bold shadow-lg shadow-yellow-500/30 hover:scale-105 transition-transform disabled:opacity-50"
                    >
                        <Share2 size={18} className={sharing ? 'animate-pulse' : ''} />
                        {sharing ? 'Lädt...' : 'Teilen'}
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={sharing}
                        className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-colors disabled:opacity-50"
                    >
                        <Download size={18} />
                        Speichern
                    </button>
                </div>

                {/* Hint */}
                <p className="text-white/40 text-sm">
                    Bewege die Karte für den Holografik-Effekt ✨
                </p>
            </div>
        </div>
    );
};

// Demo/Preview component
export const LegendaryCardDemo: React.FC = () => {
    const [showCard, setShowCard] = useState(false);

    return (
        <>
            <button 
                onClick={() => setShowCard(true)}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-bold"
            >
                Uhu Karte anzeigen
            </button>

            {showCard && (
                <LegendaryCard
                    bird={{
                        name: "Uhu",
                        sciName: "Bubo bubo",
                        image: "/legendary-cards/uhu.jpeg"
                    }}
                    discoveredAt="27. November 2025"
                    discoveredBy="Fabian"
                    location="Brandenburg, Deutschland"
                    onClose={() => setShowCard(false)}
                />
            )}
        </>
    );
};
