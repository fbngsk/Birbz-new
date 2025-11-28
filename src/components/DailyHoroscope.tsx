import React, { useState, useEffect } from 'react';
import { Sparkles, Star, Quote, Loader2 } from 'lucide-react';
import { BIRDS_DB } from '../constants';
import { fetchWikiData, getAvatarUrl } from '../services/birdService';
import { Bird } from '../types';

const FUNNY_QUOTES = [
    "Heute pickst du dir nur die besten Rosinen raus. Gönn dir!",
    "Dein Gefieder glänzt heute besonders. Zeig dich der Welt!",
    "Pass auf, wem du heute auf den Kopf kackst. Karma sieht alles.",
    "Du fühlst dich heute wie ein Adler, aber benimm dich nicht wie ein Geier.",
    "Ein perfekter Tag, um früh aufzustehen und den Wurm zu fangen.",
    "Heute lieber im Nest bleiben? Nein, breite deine Flügel aus!",
    "Du bist heute lautstark und präsent. Nicht jeder mag das.",
    "Deine Balzrufe kommen heute besonders gut an. Zwinker, zwinker.",
    "Hör auf, anderen das Futter zu klauen. Sei sozial!",
    "Balance ist wichtig. Steh heute mal nur auf einem Bein.",
    "Du bist ein bunter Vogel. Lass dich nicht in einen grauen Käfig stecken.",
    "Kopf hoch, Brust raus! Heute bist du der Boss im Garten.",
    "Deine Nestbau-Skills sind heute Top. Zeit für Renovierung?",
    "Nicht jeder Ast trägt dein Gewicht. Teste vorher.",
    "Du fliegst heute gegen den Wind. Macht dich stark, aber anstrengend.",
    "Heute bist du die Krähe, die glitzernde Dinge klaut. Ethisch fragwürdig, aber effektiv.",
    "Dein Gesang klingt heute eher wie Gekrächze. Vielleicht weniger Kaffee?",
    "Du könntest heute einen Artgenossen abwerben. Tinder für Vögel?",
    "Zu viel Geflatter, zu wenig Richtung. Fokus!",
    "Deine Federn sind zerzaust. Selbstpflege, aber dalli!",
    "Heute bist du der Specht: nervig, aber produktiv.",
    "Bleib am Boden. Im wörtlichen Sinn. Deine Flugroute ist Chaos.",
    "Du hast heute das Territorial-Gen aktiviert. Chill mal.",
    "Ein guter Tag, um Vorräte zu hamstern. Winter kommt immer.",
    "Du singst für taube Ohren. Spar dir die Energie.",
    "Heute pickst du nach allem, was glänzt. Aber ist es essbar?",
    "Deine Zugvogel-Vibes sind stark. Aber wohin eigentlich?",
];

export const DailyHoroscope: React.FC<{ onBirdClick?: (bird: Bird) => void }> = ({ onBirdClick }) => {
    const [bird, setBird] = useState<Bird | null>(null);
    const [image, setImage] = useState<string | null>(null);
    const [quote, setQuote] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Deterministic Random based on Date
        const today = new Date();
        const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
        
        // Simple string hash function
        let hash = 0;
        for (let i = 0; i < dateString.length; i++) {
            hash = ((hash << 5) - hash) + dateString.charCodeAt(i);
            hash |= 0;
        }
        const positiveHash = Math.abs(hash);

        // Select Bird
        const birdIndex = positiveHash % BIRDS_DB.length;
        const selectedBird = BIRDS_DB[birdIndex];

        // Select Quote
        const quoteIndex = positiveHash % FUNNY_QUOTES.length;
        
        setBird(selectedBird);
        setQuote(FUNNY_QUOTES[quoteIndex]);

        // Fetch Image - use scientific name for better Wikipedia results
        fetchWikiData(selectedBird.name, selectedBird.sciName).then(data => {
            // Use wiki image or fallback to avatar
            setImage(data.img || getAvatarUrl(selectedBird.id));
            setLoading(false);
        });

    }, []);

    if (loading || !bird) {
        return (
            <div className="px-6 mt-6">
                 <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center h-48">
                    <Loader2 className="animate-spin text-teal" />
                 </div>
            </div>
        );
    }

    return (
        <div className="px-6 mt-6 animate-slide-up">
            <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-purple-500" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500">Dein Birbz Horoskop</h3>
            </div>

            <div className="bg-white rounded-3xl shadow-lg shadow-purple-500/5 border border-purple-100 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Star size={100} className="text-purple-500 rotate-12" />
                </div>

                <div 
                    className={`p-6 flex gap-5 items-start relative z-10 ${onBirdClick ? 'cursor-pointer active:opacity-80' : ''}`}
                    onClick={() => bird && onBirdClick?.(bird)}
                >
                    <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden border-4 border-purple-50 shadow-md">
                        <img src={image || ''} alt={bird.name} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-purple-400 uppercase mb-1">Vogel des Tages</div>
                        <h2 className="text-xl font-bold text-teal leading-tight mb-1 break-words">{bird.name}</h2>
                        <p className="text-xs text-gray-400 italic font-serif">{bird.sciName}</p>
                    </div>
                </div>

                <div className="bg-purple-50 p-5 border-t border-purple-100">
                    <div className="flex gap-3">
                        <Quote size={20} className="text-purple-300 shrink-0" />
                        <p className="text-sm text-purple-900 font-medium italic leading-relaxed">
                            "{quote}"
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
