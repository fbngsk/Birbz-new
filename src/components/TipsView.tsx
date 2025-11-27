import React from 'react';
import { Heart, Eye, TreePine, Bird, Calendar, Award, Shield, AlertTriangle } from 'lucide-react';

// Migration data for German birds
const MIGRATION_ALERTS = [
    {
        month: 2, // February
        birds: ['Star', 'Singdrossel', 'Feldlerche', 'Kiebitz'],
        message: 'Die ersten Zugvögel kehren zurück! Halte Ausschau nach Staren, Singdrosseln und Feldlerchen.',
        icon: '🌱'
    },
    {
        month: 3, // March
        birds: ['Zilpzalp', 'Hausrotschwanz', 'Gartenrotschwanz', 'Bachstelze', 'Mönchsgrasmücke'],
        message: 'Der Frühling ist da! Zilpzalp, Rotschwänze und Grasmücken sind unterwegs.',
        icon: '🌸'
    },
    {
        month: 4, // April
        birds: ['Mauersegler', 'Nachtigall', 'Kuckuck', 'Rauchschwalbe', 'Mehlschwalbe'],
        message: 'Langstreckenzieher treffen ein! Mauersegler, Nachtigall und Kuckuck sind zurück.',
        icon: '☀️'
    },
    {
        month: 5, // May
        birds: ['Pirol', 'Neuntöter', 'Grauschnäpper', 'Wendehals'],
        message: 'Die letzten Sommergäste sind da! Pirol und Neuntöter vervollständigen die Brutvogelgemeinschaft.',
        icon: '🌻'
    }
];

export const TipsView: React.FC = () => {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const currentAlert = MIGRATION_ALERTS.find(a => a.month === currentMonth);

    return (
        <div className="p-6 pb-32 animate-fade-in space-y-6">
            <h2 className="text-3xl font-bold text-teal">Tipps & Infos</h2>

            {/* Migration Alert */}
            {currentAlert && (
                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-5 rounded-2xl border border-orange-200 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="text-3xl">{currentAlert.icon}</div>
                        <div>
                            <h3 className="font-bold text-orange flex items-center gap-2">
                                <Bird size={18} /> Zugvogel-Alert!
                            </h3>
                            <p className="text-sm text-gray-700 mt-1">{currentAlert.message}</p>
                            <div className="flex flex-wrap gap-1 mt-3">
                                {currentAlert.birds.map(bird => (
                                    <span key={bird} className="text-xs bg-white px-2 py-1 rounded-full text-orange font-medium border border-orange-200">
                                        {bird}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Honor Code */}
            <div className="bg-teal/5 p-5 rounded-2xl border border-teal/20">
                <div className="flex items-start gap-3">
                    <div className="bg-teal/10 p-2 rounded-xl">
                        <Shield size={24} className="text-teal" />
                    </div>
                    <div>
                        <h3 className="font-bold text-teal">Ehrenkodex</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Birbz funktioniert auf Ehrenbasis. Logge nur Vögel, die du wirklich selbst identifiziert hast!
                        </p>
                        <div className="mt-3 space-y-2 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <span className="text-red-400">✗</span>
                                <span>Zoos, Tierparks und Zoohandlungen zählen nicht</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-red-400">✗</span>
                                <span>Keine Vögel loggen, die andere für dich identifiziert haben</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-green-500">✓</span>
                                <span>Wildlebende Vögel in natürlicher Umgebung</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ethics Section */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-green-100 p-2 rounded-xl">
                        <Heart size={24} className="text-green-600" />
                    </div>
                    <h3 className="font-bold text-teal text-lg">Respektvolle Vogelbeobachtung</h3>
                </div>

                <div className="space-y-4">
                    <div className="flex gap-3">
                        <div className="bg-teal/10 p-2 rounded-lg h-fit">
                            <Eye size={18} className="text-teal" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-700 text-sm">Abstand halten</h4>
                            <p className="text-xs text-gray-500">
                                Beobachte aus der Distanz mit einem Fernglas. Nähere dich nicht zu weit an.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="bg-orange/10 p-2 rounded-lg h-fit">
                            <AlertTriangle size={18} className="text-orange" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-700 text-sm">Nistende Vögel nicht stören</h4>
                            <p className="text-xs text-gray-500">
                                Halte dich von Nestern fern, besonders während der Brutzeit (März–Juli).
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="bg-yellow-100 p-2 rounded-lg h-fit">
                            <TreePine size={18} className="text-yellow-700" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-700 text-sm">Bodenbrüter beachten</h4>
                            <p className="text-xs text-gray-500">
                                Bleibe auf Wegen. Feldlerchen, Kiebitze und andere brüten am Boden.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="bg-green-100 p-2 rounded-lg h-fit">
                            <TreePine size={18} className="text-green-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-700 text-sm">Naturschutzgebiete respektieren</h4>
                            <p className="text-xs text-gray-500">
                                Beachte Betretungsverbote und halte dich an ausgewiesene Wege.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="bg-purple-100 p-2 rounded-lg h-fit">
                            <Bird size={18} className="text-purple-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-700 text-sm">Natürliches Verhalten nicht stören</h4>
                            <p className="text-xs text-gray-500">
                                Vermeide Lärm, hektische Bewegungen und das Abspielen von Vogelrufen.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Migration Calendar */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-100 p-2 rounded-xl">
                        <Calendar size={24} className="text-blue-600" />
                    </div>
                    <h3 className="font-bold text-teal text-lg">Zugvogel-Kalender</h3>
                </div>

                <div className="space-y-3">
                    {MIGRATION_ALERTS.map(alert => (
                        <div 
                            key={alert.month} 
                            className={`p-3 rounded-xl border ${currentMonth === alert.month ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-100'}`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">{alert.icon}</span>
                                <span className={`font-bold text-sm ${currentMonth === alert.month ? 'text-orange' : 'text-gray-600'}`}>
                                    {['', 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'][alert.month]}
                                </span>
                                {currentMonth === alert.month && (
                                    <span className="text-[10px] bg-orange text-white px-2 py-0.5 rounded-full font-bold">JETZT</span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {alert.birds.slice(0, 4).map(bird => (
                                    <span key={bird} className="text-[10px] bg-white px-2 py-0.5 rounded-full text-gray-600 border border-gray-200">
                                        {bird}
                                    </span>
                                ))}
                                {alert.birds.length > 4 && (
                                    <span className="text-[10px] text-gray-400">+{alert.birds.length - 4} mehr</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Badge Hint */}
            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 flex items-center gap-3">
                <Award className="text-purple-500" size={28} />
                <div>
                    <h4 className="font-bold text-purple-700 text-sm">Zugvogel-Badges</h4>
                    <p className="text-xs text-purple-600">
                        Sammle die ersten zurückkehrenden Zugvögel und verdiene besondere Abzeichen!
                    </p>
                </div>
            </div>
        </div>
    );
};
