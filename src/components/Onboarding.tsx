import React, { useState, useEffect } from 'react';
import { Bird, User, Mail, Lock, Loader2, Ghost, Sparkles, Clock } from 'lucide-react';
import { UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';
import { getAvatarUrl } from '../services/birdService';

interface OnboardingProps {
    onComplete: (profile: UserProfile) => void;
}

type ViewMode = 'waitlist' | 'login' | 'register' | 'reset-password';

const AVATAR_SEEDS = ['Falke', 'Adler', 'Spatz', 'Meise', 'Eule', 'Rabe', 'Specht', 'Ente', 'Schwan', 'Reiher'];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const [mode, setMode] = useState<ViewMode>('waitlist');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [inviteToken, setInviteToken] = useState<string | null>(null);

    // Form Data
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [region, setRegion] = useState('');
    const [selectedSeed, setSelectedSeed] = useState(AVATAR_SEEDS[0]);

    // Check for invite token in URL on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('invite');
        if (token) {
            setInviteToken(token);
            setMode('register');
            // Clean URL without reload
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const resetState = () => {
        setError(null);
        setSuccessMessage(null);
    };

    // ==================== WAITLIST ====================
    const handleWaitlistSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: insertError } = await supabase
                .from('waitlist')
                .insert([{ email: email.toLowerCase().trim() }]);

            if (insertError) {
                if (insertError.code === '23505') {
                    // Duplicate email
                    setSuccessMessage('Diese E-Mail ist bereits auf der Warteliste! Wir melden uns bald.');
                } else {
                    throw insertError;
                }
            } else {
                setSuccessMessage('Du bist auf der Liste! Wir schicken dir eine Einladung, sobald ein Platz frei wird.');
            }
            setEmail('');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Ein Fehler ist aufgetreten.');
        } finally {
            setLoading(false);
        }
    };

    // ==================== LOGIN ====================
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Login fehlgeschlagen");

            // Fetch Profile and check beta access
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authData.user.id)
                .single();

            if (profileError) throw profileError;

            // Check if user has beta access
            if (!profileData.is_beta_approved) {
                await supabase.auth.signOut();
                setError('Dein Konto ist noch nicht für die Beta freigeschaltet. Wir melden uns bei dir!');
                return;
            }

            onComplete({
                id: authData.user.id,
                name: profileData.name,
                avatarSeed: profileData.avatar_seed,
                homeRegion: profileData.home_region,
                badges: profileData.badges || [],
                friends: profileData.friends || [],
                currentStreak: profileData.current_streak || 0,
                longestStreak: profileData.longest_streak || 0,
                lastLogDate: profileData.last_log_date || ''
            });

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Ein Fehler ist aufgetreten.");
        } finally {
            setLoading(false);
        }
    };

    // ==================== REGISTER (with invite token) ====================
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Verify invite token
            const { data: invite, error: inviteError } = await supabase
                .from('waitlist')
                .select('*')
                .eq('invite_token', inviteToken)
                .eq('is_approved', true)
                .single();

            if (inviteError || !invite) {
                setError('Ungültiger oder abgelaufener Einladungslink.');
                setLoading(false);
                return;
            }

            // 2. Sign Up
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Registrierung fehlgeschlagen");

            // 3. Create Profile with beta access
            const newProfile = {
                id: authData.user.id,
                email: email,
                name: name,
                avatar_seed: selectedSeed,
                home_region: region || 'Deutschland',
                xp: 0,
                collected_ids: [],
                badges: [],
                current_streak: 0,
                longest_streak: 0,
                last_log_date: '',
                is_beta_approved: true  // Auto-approve since they have valid token
            };

            const { error: dbError } = await supabase
                .from('profiles')
                .insert([newProfile]);

            if (dbError) throw dbError;

            // 4. Mark invite as used (optional: update waitlist entry)
            await supabase
                .from('waitlist')
                .update({ used_at: new Date().toISOString() })
                .eq('invite_token', inviteToken);

            onComplete({
                id: authData.user.id,
                name: newProfile.name,
                avatarSeed: newProfile.avatar_seed,
                homeRegion: newProfile.home_region,
                badges: [],
                friends: [],
                currentStreak: 0,
                longestStreak: 0,
                lastLogDate: ''
            });

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Ein Fehler ist aufgetreten.");
        } finally {
            setLoading(false);
        }
    };

    // ==================== PASSWORD RESET ====================
    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            setSuccessMessage('Falls ein Konto mit dieser E-Mail existiert, erhältst du einen Link zum Zurücksetzen.');
        } catch (err: any) {
            setError(err.message || 'Ein Fehler ist aufgetreten.');
        } finally {
            setLoading(false);
        }
    };

    // ==================== GUEST LOGIN ====================
    const handleGuestLogin = () => {
        onComplete({
            name: 'Gast',
            avatarSeed: 'Spatz',
            homeRegion: 'Demo-Modus',
            badges: [],
            friends: [],
            currentStreak: 0,
            longestStreak: 0,
            lastLogDate: ''
        });
    };

    // ==================== RENDER ====================
    return (
        <div className="fixed inset-0 bg-cream z-50 flex flex-col items-center justify-center p-6 animate-fade-in overflow-y-auto">
            <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center my-auto">
                
                {/* Logo */}
                <div className="w-20 h-20 bg-teal rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-lg">
                    <Bird size={40} />
                </div>

                {/* ==================== WAITLIST VIEW ==================== */}
                {mode === 'waitlist' && (
                    <>
                        <div className="inline-flex items-center gap-2 bg-orange/10 text-orange px-3 py-1 rounded-full text-xs font-bold mb-4">
                            <Sparkles size={14} />
                            Closed Beta
                        </div>
                        
                        <h2 className="text-2xl font-bold text-teal mb-2">BirdNerd</h2>
                        <p className="text-gray-500 mb-6 text-sm">
                            Sammle alle 322 deutschen Vogelarten. Wir sind aktuell in der geschlossenen Beta – trag dich ein und wir melden uns!
                        </p>

                        {error && (
                            <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm mb-4 border border-red-100">
                                {error}
                            </div>
                        )}
                        
                       {successMessage ? (
    <div className="bg-green-50 text-green-600 p-4 rounded-xl text-sm mb-6 border border-green-100">
        <Clock size={24} className="mx-auto mb-2 text-green-500" />
        {successMessage}
        <p className="text-gray-500 text-xs mt-3">
            💡 Check auch deinen Spam-Ordner!
        </p>
    </div>
) : (
                            <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input 
                                        type="email" 
                                        required
                                        placeholder="Deine E-Mail Adresse"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-teal focus:ring-2 focus:ring-teal/10"
                                    />
                                </div>
                                
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full py-4 bg-teal text-white rounded-2xl font-bold shadow-lg shadow-teal/20 flex items-center justify-center gap-2 hover:bg-teal-800 transition-colors disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : 'Auf die Warteliste'}
                                </button>
                            </form>
                        )}

                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <p className="text-gray-400 text-sm mb-3">Bereits einen Zugang?</p>
                            <button 
                                onClick={() => { setMode('login'); resetState(); }}
                                className="text-teal font-bold hover:underline"
                            >
                                Hier anmelden
                            </button>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <button 
                                onClick={handleGuestLogin}
                                className="w-full py-3 bg-gray-100 text-gray-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                            >
                                <Ghost size={16} />
                                Gastzugang (Demo)
                            </button>
                        </div>
                    </>
                )}

                {/* ==================== LOGIN VIEW ==================== */}
                {mode === 'login' && (
                    <>
                        <h2 className="text-2xl font-bold text-teal mb-2">Willkommen zurück!</h2>
                        <p className="text-gray-500 mb-6 text-sm">Melde dich an, um deine Sammlung zu laden.</p>

                        {error && (
                            <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm mb-4 border border-red-100">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    type="email" 
                                    required
                                    placeholder="E-Mail Adresse"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-teal focus:ring-2 focus:ring-teal/10"
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    type="password" 
                                    required
                                    placeholder="Passwort"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-teal focus:ring-2 focus:ring-teal/10"
                                />
                            </div>
                            
                            <button 
                                type="button"
                                onClick={() => { setMode('reset-password'); resetState(); }}
                                className="text-sm text-gray-400 hover:text-teal text-right w-full -mt-2"
                            >
                                Passwort vergessen?
                            </button>

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full py-4 bg-teal text-white rounded-2xl font-bold shadow-lg shadow-teal/20 flex items-center justify-center gap-2 hover:bg-teal-800 transition-colors disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : 'Anmelden'}
                            </button>
                        </form>

                        <div className="mt-6 text-sm text-gray-500">
                            <button 
                                onClick={() => { setMode('waitlist'); resetState(); }}
                                className="text-teal font-bold hover:underline"
                            >
                                ← Zurück zur Warteliste
                            </button>
                        </div>
                    </>
                )}

                {/* ==================== REGISTER VIEW (with invite) ==================== */}
                {mode === 'register' && (
                    <>
                        <div className="inline-flex items-center gap-2 bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-bold mb-4">
                            <Sparkles size={14} />
                            Du bist eingeladen!
                        </div>
                        
                        <h2 className="text-2xl font-bold text-teal mb-2">Konto erstellen</h2>
                        <p className="text-gray-500 mb-6 text-sm">Erstelle dein Konto und leg los mit dem Sammeln.</p>

                        {error && (
                            <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm mb-4 border border-red-100">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleRegister} className="space-y-4">
                            {/* Avatar Selection */}
                            <div className="flex overflow-x-auto gap-3 pb-2 px-1 no-scrollbar justify-center">
                                {AVATAR_SEEDS.map(seed => (
                                    <button
                                        key={seed}
                                        type="button"
                                        onClick={() => setSelectedSeed(seed)}
                                        className={`w-12 h-12 rounded-full flex-shrink-0 overflow-hidden border-2 transition-all ${selectedSeed === seed ? 'border-teal scale-110' : 'border-transparent opacity-50'}`}
                                    >
                                        <img src={getAvatarUrl(seed)} alt={seed} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>

                            <div className="relative">
                                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    type="text" 
                                    required
                                    placeholder="Benutzername"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-teal focus:ring-2 focus:ring-teal/10"
                                />
                            </div>

                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    type="email" 
                                    required
                                    placeholder="E-Mail Adresse"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-teal focus:ring-2 focus:ring-teal/10"
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    type="password" 
                                    required
                                    minLength={6}
                                    placeholder="Passwort (min. 6 Zeichen)"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-teal focus:ring-2 focus:ring-teal/10"
                                />
                            </div>

                            <input 
                                type="text" 
                                placeholder="Region (z.B. Berlin)"
                                value={region}
                                onChange={e => setRegion(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 outline-none focus:border-teal focus:ring-2 focus:ring-teal/10 text-center"
                            />

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full py-4 bg-teal text-white rounded-2xl font-bold shadow-lg shadow-teal/20 flex items-center justify-center gap-2 hover:bg-teal-800 transition-colors disabled:opacity-50 mt-4"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : 'Konto erstellen'}
                            </button>
                        </form>

                        <div className="mt-6 text-sm text-gray-500">
                            Bereits registriert?{' '}
                            <button 
                                onClick={() => { setMode('login'); resetState(); }}
                                className="font-bold text-teal hover:underline"
                            >
                                Hier anmelden
                            </button>
                        </div>
                    </>
                )}

                {/* ==================== PASSWORD RESET VIEW ==================== */}
                {mode === 'reset-password' && (
                    <>
                        <h2 className="text-2xl font-bold text-teal mb-2">Passwort zurücksetzen</h2>
                        <p className="text-gray-500 mb-6 text-sm">
                            Gib deine E-Mail-Adresse ein und wir senden dir einen Link.
                        </p>

                        {error && (
                            <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm mb-4 border border-red-100">
                                {error}
                            </div>
                        )}
                        
                        {successMessage && (
                            <div className="bg-green-50 text-green-600 p-3 rounded-xl text-sm mb-4 border border-green-100">
                                {successMessage}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    type="email" 
                                    required
                                    placeholder="E-Mail Adresse"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-teal focus:ring-2 focus:ring-teal/10"
                                />
                            </div>
                            
                            <button 
                                onClick={handlePasswordReset}
                                disabled={loading || !email}
                                className="w-full py-4 bg-teal text-white rounded-2xl font-bold shadow-lg shadow-teal/20 flex items-center justify-center gap-2 hover:bg-teal-800 transition-colors disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : 'Link senden'}
                            </button>
                            
                            <button 
                                type="button"
                                onClick={() => { setMode('login'); resetState(); }}
                                className="text-sm text-gray-500 hover:text-teal mt-2"
                            >
                                ← Zurück zum Login
                            </button>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
};
