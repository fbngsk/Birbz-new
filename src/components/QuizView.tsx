import React, { useState } from 'react';
import { Image, CheckCircle, XCircle, HelpCircle, GraduationCap } from 'lucide-react';
import { BIRDS_DB, BIRD_FAMILIES } from '../constants';
import { fetchWikiData } from '../services/birdService';
import { Bird } from '../types';

interface QuizViewProps {
    // No XP props needed
}

type QuizState = 'start' | 'playing' | 'result';

export const QuizView: React.FC<QuizViewProps> = () => {
    const [gameState, setGameState] = useState<QuizState>('start');
    const [currentRound, setCurrentRound] = useState(0);
    const [score, setScore] = useState(0);
    const [questions, setQuestions] = useState<{ target: Bird, options: Bird[], image?: string }[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [loading, setLoading] = useState(false);

    const TOTAL_ROUNDS = 20;

    const startQuiz = async () => {
        setLoading(true);
        
        // Generate Questions
        const newQuestions = [];
        const availableBirds = [...BIRDS_DB].filter(b => (b.locationType || 'local') === 'local');

        for (let i = 0; i < TOTAL_ROUNDS; i++) {
            const targetIndex = Math.floor(Math.random() * availableBirds.length);
            const target = availableBirds[targetIndex];
            
            // --- HARD MODE LOGIC ---
            // Find options that look similar (Same Family)
            let familyKey = 'other';
            for (const [key, prefixes] of Object.entries(BIRD_FAMILIES)) {
                if (prefixes.some(prefix => target.sciName.includes(prefix))) {
                    familyKey = key;
                    break;
                }
            }

            // Filter birds belonging to same family
            const sameFamilyBirds = availableBirds.filter(b => {
                if (b.id === target.id) return false; // Exclude target
                
                // Check if this bird belongs to the target's family
                const familyPrefixes = BIRD_FAMILIES[familyKey];
                if (!familyPrefixes) return false;
                
                return familyPrefixes.some(prefix => b.sciName.includes(prefix));
            });

            // Shuffle family members
            sameFamilyBirds.sort(() => 0.5 - Math.random());

            // Start with target
            const options = [target];

            // Fill with family members (Hard Mode)
            // We take up to 3 family members
            const hardDistractors = sameFamilyBirds.slice(0, 3);
            options.push(...hardDistractors);

            // If we still don't have 4 options (family too small), fill with randoms
            while (options.length < 4) {
                const randomBird = availableBirds[Math.floor(Math.random() * availableBirds.length)];
                if (!options.find(o => o.id === randomBird.id)) {
                    options.push(randomBird);
                }
            }
            
            // Shuffle options finally so target isn't always first
            options.sort(() => 0.5 - Math.random());
            // -----------------------

            // Fetch real image
            let image = undefined;
            const wiki = await fetchWikiData(target.name);
            image = wiki.img || undefined;

            newQuestions.push({ target, options, image });
        }

        setQuestions(newQuestions);
        setCurrentRound(0);
        setScore(0);
        setGameState('playing');
        setLoading(false);
    };

    const handleAnswer = (birdId: string) => {
        if (selectedAnswer) return; // Block double clicks
        
        setSelectedAnswer(birdId);
        setShowFeedback(true);

        const isCorrect = birdId === questions[currentRound].target.id;
        if (isCorrect) {
            setScore(s => s + 1);
        }

        setTimeout(() => {
            if (currentRound < TOTAL_ROUNDS - 1) {
                setCurrentRound(r => r + 1);
                setSelectedAnswer(null);
                setShowFeedback(false);
            } else {
                setGameState('result');
            }
        }, 1500);
    };

    const renderStartScreen = () => (
        <div className="p-6 flex flex-col items-center justify-start h-full space-y-4 animate-fade-in pt-4">
            <div className="bg-teal/10 p-6 rounded-full mb-2">
                <GraduationCap size={48} className="text-teal" />
            </div>
            <h2 className="text-2xl font-bold text-teal text-center">Vogel-Training (Profi)</h2>
            <p className="text-gray-500 text-center max-w-xs text-sm">
                Jetzt wird's knifflig! Unterscheide ähnliche Arten aus derselben Familie.
            </p>

            <div className="grid grid-cols-1 w-full gap-3 mt-2">
                <button 
                    onClick={() => startQuiz()} 
                    disabled={loading}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:border-teal transition-all"
                >
                    <div className="bg-orange/10 p-3 rounded-xl text-orange">
                        <Image size={24} />
                    </div>
                    <div className="text-left">
                        <div className="font-bold text-teal">Bild-Quiz starten</div>
                        <div className="text-xs text-gray-400">20 Fragen - Erkennst du den Unterschied?</div>
                    </div>
                </button>
            </div>
            {loading && <div className="text-teal text-sm font-bold animate-pulse">Lade Quiz-Daten...</div>}
        </div>
    );

    const renderGame = () => {
        const question = questions[currentRound];
        if (!question) return null;

        return (
            <div className="p-6 h-full flex flex-col animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-gray-400 text-sm">Frage {currentRound + 1}/{TOTAL_ROUNDS}</span>
                    <span className="font-bold text-teal text-sm bg-teal/10 px-3 py-1 rounded-full">Richtig: {score}</span>
                </div>

                {/* Question Area - Removed flex-1 to prevent spacing out */}
                <div className="w-full flex flex-col items-center justify-center mb-4">
                        <div className="w-64 h-64 bg-gray-200 rounded-3xl overflow-hidden shadow-lg border-4 border-white relative">
                            {question.image ? (
                                <img src={question.image} className="w-full h-full object-cover" alt="???" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                                    <HelpCircle size={48} />
                                </div>
                            )}
                            {showFeedback && (
                                <div className={`absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-black/20 animate-fade-in`}>
                                    {selectedAnswer === question.target.id ? (
                                        <CheckCircle size={64} className="text-green-400 drop-shadow-lg" />
                                    ) : (
                                        <XCircle size={64} className="text-red-400 drop-shadow-lg" />
                                    )}
                                </div>
                            )}
                        </div>
                </div>

                {/* Options */}
                <div className="grid grid-cols-2 gap-3">
                    {question.options.map(option => {
                        let btnClass = "bg-white border-gray-200 hover:border-gray-300";
                        if (showFeedback) {
                            if (option.id === question.target.id) btnClass = "bg-green-100 border-green-500 text-green-800";
                            else if (option.id === selectedAnswer) btnClass = "bg-red-100 border-red-500 text-red-800";
                            else btnClass = "bg-gray-50 border-gray-100 text-gray-400 opacity-50";
                        }

                        return (
                            <button 
                                key={option.id}
                                onClick={() => handleAnswer(option.id)}
                                disabled={showFeedback}
                                className={`p-4 rounded-xl border-2 font-bold text-sm transition-all ${btnClass} ${!showFeedback && 'hover:scale-[1.02] active:scale-95'}`}
                            >
                                {option.name}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderResult = () => (
        <div className="p-6 h-full flex flex-col items-center justify-center animate-fade-in text-center">
            <div className="mb-6">
                {score >= TOTAL_ROUNDS * 0.7 ? (
                    <div className="text-6xl animate-bounce">🎓</div>
                ) : (
                    <div className="text-6xl">📖</div>
                )}
            </div>
            
            <h2 className="text-3xl font-bold text-teal mb-2">Training Beendet!</h2>
            <p className="text-gray-500 mb-8">Du hast {score} von {TOTAL_ROUNDS} Fragen richtig beantwortet.</p>
            
            <div className="bg-gray-100 text-gray-500 font-bold px-6 py-3 rounded-2xl mb-8 text-sm">
                Je öfter du übst, desto leichter fällt die Bestimmung in der Natur.
            </div>

            <button 
                onClick={() => setGameState('start')}
                className="w-full py-4 bg-teal text-white rounded-2xl font-bold shadow-lg shadow-teal/20 hover:bg-teal-800 transition-colors"
            >
                Zurück zum Menü
            </button>
        </div>
    );

    return (
        <div className="h-full pb-20">
            {gameState === 'start' && renderStartScreen()}
            {gameState === 'playing' && renderGame()}
            {gameState === 'result' && renderResult()}
        </div>
    );
};
