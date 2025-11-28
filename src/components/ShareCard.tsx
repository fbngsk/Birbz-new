import React, { useRef, useEffect } from 'react';
import { X, Share2, Download } from 'lucide-react';
import { Bird } from '../types';
import html2canvas from 'html2canvas';

interface ShareCardProps {
    bird: Bird;
    userName: string;
    onClose: () => void;
}

export const ShareCard: React.FC<ShareCardProps> = ({ bird, userName, onClose }) => {
    const cardRef = useRef<HTMLDivElement>(null);

    // Block body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const handleShare = async () => {
        if (!cardRef.current) return;

        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 2,
                backgroundColor: null,
                useCORS: true
            });
            
            const blob = await new Promise<Blob>((resolve) => {
                canvas.toBlob((b) => resolve(b!), 'image/png');
            });

            if (navigator.share && navigator.canShare({ files: [new File([blob], 'birbz.png', { type: 'image/png' })] })) {
                await navigator.share({
                    files: [new File([blob], `birbz-${bird.name}.png`, { type: 'image/png' })],
                    title: `${bird.name} entdeckt!`,
                    text: `Ich habe einen ${bird.name} mit Birbz entdeckt! 🐦`
                });
            } else {
                // Fallback: Download image
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `birbz-${bird.name}.png`;
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error('Share failed:', err);
        }
    };

    const rarityColors: Record<string, string> = {
        'Häufig': 'from-green-400 to-emerald-500',
        'Mittel': 'from-blue-400 to-cyan-500',
        'Selten': 'from-purple-400 to-pink-500',
        'Sehr Selten': 'from-orange-400 to-red-500',
        'Urlaubsfund': 'from-orange-400 to-yellow-500'
    };

    const getGradient = () => {
        for (const [key, value] of Object.entries(rarityColors)) {
            if (bird.rarity?.includes(key)) return value;
        }
        return 'from-teal-400 to-cyan-500';
    };

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
            style={{ width: '100vw', height: '100vh' }}
        >
            <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="font-bold text-teal">Teilen</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                {/* Shareable Card */}
                <div className="p-4">
                    <div 
                        ref={cardRef}
                        className={`bg-gradient-to-br ${getGradient()} p-6 rounded-2xl text-white relative overflow-hidden`}
                    >
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-4 right-4 text-8xl">🐦</div>
                            <div className="absolute bottom-4 left-4 text-6xl">🌿</div>
                        </div>

                        {/* Content */}
                        <div className="relative z-10">
                            {/* Bird Image */}
                            {bird.realImg && (
                                <div className="w-32 h-32 mx-auto rounded-2xl overflow-hidden border-4 border-white/30 shadow-lg mb-4">
                                    <img 
                                        src={bird.realImg} 
                                        alt={bird.name} 
                                        className="w-full h-full object-cover"
                                        crossOrigin="anonymous"
                                    />
                                </div>
                            )}

                            {/* Bird Info */}
                            <div className="text-center">
                                <h2 className="text-2xl font-bold mb-1">{bird.name}</h2>
                                <p className="text-white/80 italic text-sm mb-3">{bird.sciName}</p>
                                
                                <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                                    <span className="text-sm font-bold">+{bird.points} XP</span>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-6 pt-4 border-t border-white/20 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-white/60">Entdeckt von</p>
                                    <p className="font-bold">{userName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-white/60">{new Date().toLocaleDateString('de-DE')}</p>
                                    <p className="font-bold text-sm">🐦 Birbz</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Share Buttons */}
                <div className="p-4 border-t border-gray-100 space-y-3">
                    <button 
                        onClick={handleShare}
                        className="w-full py-3 bg-teal text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-teal-700 transition-colors"
                    >
                        <Share2 size={18} />
                        Teilen
                    </button>
                    
                    <button 
                        onClick={handleShare}
                        className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                    >
                        <Download size={18} />
                        Als Bild speichern
                    </button>
                </div>
            </div>
        </div>
    );
};
