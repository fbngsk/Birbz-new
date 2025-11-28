import React, { useState, useEffect } from 'react';
import { X, Search, Mic, BookOpen, Loader2 } from 'lucide-react';
import { Bird } from '../types';
import { BIRDS_DB } from '../constants';
import { identifyBirdFromDescription } from '../services/geminiService';

interface ScannerModalProps {
    onClose: () => void;
    onFound: (bird: Bird) => void;
    nearbyBirds: Bird[];
}

// NOTE: This component might be deprecated in favor of IdentificationModal, 
// but keeping it updated just in case of legacy usage or fallback.
export const ScannerModal: React.FC<ScannerModalProps> = ({ onClose, onFound, nearbyBirds }) => {
    const [scanning, setScanning] = useState(false);
    const [manualInput, setManualInput] = useState("");
    const [aiResponse, setAiResponse] = useState<string | null>(null);

    // Block body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const handleScan = () => {
        setScanning(true);
        // Simulate scan duration
        setTimeout(() => {
            setScanning(false);
            // Find a bird from nearby list or DB
            const target = nearbyBirds.length > 0 ? nearbyBirds[0] : BIRDS_DB[Math.floor(Math.random() * BIRDS_DB.length)];
            onFound(target);
        }, 2000);
    };

    const handleManualIdentify = async () => {
        if (!manualInput.trim()) return;
        setScanning(true);
        const result = await identifyBirdFromDescription(manualInput);
        setScanning(false);
        setAiResponse(result);
    };

    return (
        <div 
            className="fixed inset-0 bg-cream z-[100] flex items-center justify-center p-6 animate-fade-in"
            style={{ width: '100vw', height: '100vh' }}
        >
            <div className="w-full max-w-sm space-y-4 relative">
                <button onClick={onClose} className="absolute -top-12 right-0 p-2 bg-white rounded-full shadow-sm text-teal hover:bg-gray-100 transition-colors">
                    <X size={24} />
                </button>
                
                <h2 className="text-center text-3xl font-bold text-teal mb-8">Scanner</h2>
                
                {/* Primary Scan Button */}
                <button 
                    onClick={handleScan}
                    disabled={scanning}
                    className="w-full bg-teal text-white p-6 rounded-2xl shadow-lg shadow-teal/20 flex items-center justify-between hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-80"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-full">
                            {scanning ? <Loader2 className="animate-spin" size={24}/> : <Search size={24}/>}
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-lg">{scanning ? 'Analysiere...' : 'Vogel scannen'}</h3>
                            <p className="text-teal-100 text-sm">Kamera / Audio Analyse</p>
                        </div>
                    </div>
                    <div className="bg-orange text-white text-xs font-bold px-2 py-1 rounded">+XP</div>
                </button>

                {/* Manual AI Identification Input */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mt-4">
                     <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">KI Bestimmung</h4>
                     <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={manualInput}
                            onChange={(e) => setManualInput(e.target.value)}
                            placeholder="Beschreibe den Vogel..." 
                            className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal/20"
                        />
                        <button onClick={handleManualIdentify} disabled={scanning || !manualInput} className="bg-gray-200 p-2 rounded-lg text-teal disabled:opacity-50">
                            <Search size={18} />
                        </button>
                     </div>
                     {aiResponse && (
                         <div className="mt-2 p-2 bg-teal/10 rounded-lg text-sm text-teal">
                             <span className="font-bold">Ergebnis:</span> {aiResponse}
                         </div>
                     )}
                </div>
            </div>
        </div>
    );
};
