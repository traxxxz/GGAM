import React, { useState, useCallback } from 'react';
import { generateSpeedChallengeCategory } from '../services/geminiService';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { CountdownTimer } from './CountdownTimer';

type GameState = 'idle' | 'loading' | 'playing' | 'finished';

export const SpeedChallengeGame: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>('idle');
    const [category, setCategory] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
    const [timerDuration, setTimerDuration] = useState<number>(30);
    const [timerKey, setTimerKey] = useState<number>(0);

    const handleGetCategory = useCallback(async () => {
        setGameState('loading');
        setError(null);
        setCategory(null);
        try {
            const newCategory = await generateSpeedChallengeCategory();
            setCategory(newCategory);
            setTimerKey(prev => prev + 1);
            setGameState('playing');
        } catch (err) {
            setError('فشل في جلب الفئة. حاول مرة أخرى.');
            setGameState('idle');
        }
    }, []);

    const handleTimeUp = () => {
        setGameState('finished');
    };
    
    const handlePlayAgain = () => {
        setGameState('idle');
        setCategory(null);
        setError(null);
    }

    const renderSettingsModal = () => (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-20 animate-fade-in p-4">
            <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-sm border border-slate-700 shadow-2xl shadow-slate-950/50">
                <h3 className="text-xl font-bold mb-6 text-center text-primary-400">إعدادات تحدي السرعة</h3>
                <div className="space-y-6">
                    <div>
                        <label htmlFor="challenge-timer" className="flex justify-between items-center mb-2 text-slate-300">
                            <span>مدة التحدي</span>
                            <span className="font-mono text-lg text-primary-400">{timerDuration} ثانية</span>
                        </label>
                        <input
                            id="challenge-timer"
                            type="range"
                            min="10"
                            max="60"
                            step="5"
                            value={timerDuration}
                            onChange={(e) => setTimerDuration(Number(e.target.value))}
                            className="w-full custom-range"
                        />
                    </div>
                </div>
                <Button onClick={() => setIsSettingsOpen(false)} className="mt-8">
                    حفظ وإغلاق
                </Button>
            </div>
        </div>
    );
    
    const renderContent = () => {
        switch (gameState) {
            case 'loading':
                return (
                    <div className="flex flex-col items-center justify-center h-64">
                        <LoadingSpinner />
                        <p className="mt-4 text-slate-300">...جاري تحضير تحدي جديد</p>
                    </div>
                );
            case 'playing':
                return (
                    <div className="flex flex-col items-center gap-6 text-center animate-fade-in">
                        <CountdownTimer duration={timerDuration} onComplete={handleTimeUp} key={timerKey} />
                        <p className="text-lg text-slate-400">الفئة هي</p>
                        <p className="text-2xl md:text-3xl font-bold leading-relaxed text-primary-300 bg-slate-900/70 p-6 rounded-lg border border-slate-700">
                            {category}
                        </p>
                        <p className="text-slate-400">!اذكر أكبر عدد ممكن من الأشياء قبل انتهاء الوقت</p>
                    </div>
                );
            case 'finished':
                return (
                     <div className="text-center h-64 flex flex-col items-center justify-center animate-fade-in">
                        <p className="text-3xl font-bold text-primary-400 mb-4">!انتهى الوقت</p>
                        <Button onClick={handlePlayAgain} variant="primary">
                            العب مرة أخرى
                        </Button>
                    </div>
                );
            case 'idle':
            default:
                return (
                    <div className="text-center h-64 flex flex-col items-center justify-center">
                        {error && <p className="text-red-400 mb-4">{error}</p>}
                        <h2 className="text-2xl text-slate-300 mb-2 font-bold">تحدي السرعة</h2>
                        <p className="text-slate-400 mb-6 max-w-md">سيتم إعطاؤك فئة، وعليك ذكر أكبر عدد من الأشياء التي تنتمي إليها خلال فترة زمنية محددة. هل أنت مستعد؟</p>
                        <Button onClick={handleGetCategory} variant="primary">
                           ابدأ التحدي
                        </Button>
                    </div>
                );
        }
    }

    return (
        <main className="relative bg-slate-800/50 rounded-2xl shadow-2xl shadow-slate-950/50 p-6 md:p-8 backdrop-blur-sm border border-slate-700 min-h-[400px]">
            {isSettingsOpen && renderSettingsModal()}
            <div className="absolute top-4 right-4 flex items-center gap-4 z-10">
                {gameState !== 'idle' && (
                    <button
                        onClick={handlePlayAgain}
                        className="text-slate-400 hover:text-primary-400 transition-colors"
                        aria-label="Reset Game"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.18-3.185m-3.181 9.348a8.25 8.25 0 00-11.664 0l-3.18 3.185m3.181-9.348L2.985 19.644" />
                        </svg>
                    </button>
                )}
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="text-slate-400 hover:text-primary-400 transition-colors"
                    aria-label="Settings"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            </div>
            {renderContent()}
        </main>
    )
};