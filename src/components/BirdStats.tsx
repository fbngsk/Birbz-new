import React, { useState, useEffect } from 'react';
import { Bird, Loader2, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface BirdLog {
    bird_id: string;
    bird_name: string;
    lat: number;
    lng: number;
    logged_at: string;
}

interface BirdStatsProps {
    userId: string;
}

export const BirdStats: React.FC<BirdStatsProps> = ({ userId }) => {
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<BirdLog[]>([]);
    const [birdStats, setBirdStats] = useState<{name: string, count: number, lastSeen: string}[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            
            const { data, error } = await supabase
                .from('bird_logs')
                .select('*')
                .eq('user_id', userId)
                .order('logged_at', { ascending: false });

            if (data && !error) {
                setLogs(data);
                
                // Calculate bird stats with last seen date
                const birdData: Record<string, {count: number, lastSeen: string}> = {};
                
                data.forEach(log => {
                    if (!birdData[log.bird_name]) {
                        birdData[log.bird_name] = { count: 0, lastSeen: log.logged_at };
                    }
                    birdData[log.bird_name].count++;
                    // Keep most recent date
                    if (log.logged_at > birdData[log.bird_name].lastSeen) {
                        birdData[log.bird_name].lastSeen = log.logged_at;
                    }
                });
                
                // Sort by count descending
                const sorted = Object.entries(birdData)
                    .sort((a, b) => b[1].count - a[1].count)
                    .map(([name, data]) => ({ name, ...data }));
                
                setBirdStats(sorted);
            }
            
            setLoading(false);
        };

        if (userId) {
            fetchStats();
        }
    }, [userId]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
    };

    if (loading) {
        return (
            <div className="flex justify-center py-6">
                <Loader2 className="animate-spin text-teal" size={24} />
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="text-center py-6 text-gray-400 text-sm">
                <Bird className="mx-auto mb-2 opacity-50" size={24} />
                <p>Noch keine Sichtungen geloggt.</p>
                <p className="text-xs mt-1">Finde deinen ersten Vogel!</p>
            </div>
        );
    }

    // Get top bird (loyal companion)
    const topBird = birdStats[0];

    return (
        <div className="space-y-3">
            {/* Summary */}
            <div className="flex gap-2 text-center">
                <div className="flex-1 bg-teal/5 rounded-xl p-3">
                    <div className="text-xl font-bold text-teal">{logs.length}</div>
                    <div className="text-[10px] text-gray-400 uppercase">Sichtungen</div>
                </div>
                <div className="flex-1 bg-orange/5 rounded-xl p-3">
                    <div className="text-xl font-bold text-orange">{birdStats.length}</div>
                    <div className="text-[10px] text-gray-400 uppercase">Arten</div>
                </div>
            </div>
            
            {/* Loyal Companion */}
            {topBird && topBird.count >= 3 && (
                <div className="bg-gradient-to-r from-orange/10 to-yellow-100 p-3 rounded-xl flex items-center gap-3">
                    <div className="text-2xl">🤝</div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs text-orange font-bold uppercase">Treuer Begleiter</div>
                        <div className="font-bold text-gray-800 truncate">{topBird.name}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-lg font-bold text-orange">{topBird.count}x</div>
                    </div>
                </div>
            )}

            {/* Bird List */}
            <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={14} className="text-teal" />
                    <span className="font-bold text-teal text-xs uppercase">Alle Sichtungen</span>
                    <span className="text-[10px] text-gray-400 ml-auto">{birdStats.length} Arten</span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {birdStats.map((bird, idx) => (
                        <div 
                            key={bird.name}
                            className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 text-sm"
                        >
                            <span className="text-gray-300 text-xs w-5">{idx + 1}.</span>
                            <span className="flex-1 font-medium text-gray-700 truncate">{bird.name}</span>
                            <span className="text-[10px] text-gray-400">{formatDate(bird.lastSeen)}</span>
                            <span className="text-xs bg-teal/10 text-teal px-2 py-0.5 rounded-full font-bold min-w-[32px] text-center">
                                {bird.count}x
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
