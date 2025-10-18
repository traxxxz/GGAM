import React, { useState, useCallback, useMemo } from 'react';
import { generateTruthQuestion, generateDare } from '../services/geminiService';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { CountdownTimer } from './CountdownTimer';

type GameState = 'selectingPlayers' | 'namingPlayers' | 'idle' | 'loading' | 'question' | 'dare';
type Player = { name: string; team: 'A' | 'B' };

export const TruthOrDareGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('selectingPlayers');
  const [numberOfPlayers, setNumberOfPlayers] = useState<number>(0);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [targetPlayerIndex, setTargetPlayerIndex] = useState<number | null>(null);

  const [content, setContent] = useState<string | string[] | null>(null);
  const [selectedDareIndex, setSelectedDareIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timerKey, setTimerKey] = useState<number>(0);
  const [timerDuration, setTimerDuration] = useState<number>(0);
  const [scores, setScores] = useState({ A: 0, B: 0 });

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [truthDuration, setTruthDuration] = useState<number>(30);
  const [dareDuration, setDareDuration] = useState<number>(60);
  const [isDareTimerRunning, setIsDareTimerRunning] = useState(false);

  const askingPlayer = useMemo(() => players[turnIndex % players.length], [players, turnIndex]);
  const targetPlayer = useMemo(() => (targetPlayerIndex !== null ? players[targetPlayerIndex] : null), [players, targetPlayerIndex]);

  const handleSelectNumberOfPlayers = (num: number) => {
    setNumberOfPlayers(num);
    setPlayerNames(Array(num).fill(''));
    setGameState('namingPlayers');
  };

  const handleNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const handleStartGame = () => {
    const newPlayers: Player[] = playerNames.map((name, index) => ({
      name,
      team: index % 2 === 0 ? 'A' : 'B',
    }));
    setPlayers(newPlayers);
    setGameState('idle');
  };
    
  const handleResetGame = () => {
    setGameState('selectingPlayers');
    setNumberOfPlayers(0);
    setPlayerNames([]);
    setPlayers([]);
    setTurnIndex(0);
    setTargetPlayerIndex(null);
    setContent(null);
    setSelectedDareIndex(null);
    setError(null);
    setTimerKey(0);
    setScores({ A: 0, B: 0 });
    setIsDareTimerRunning(false);
  };

  const chooseRandomTarget = useCallback(() => {
    if (!askingPlayer) return;
    const opponentTeam = askingPlayer.team === 'A' ? 'B' : 'A';
    const opponents = players
      .map((p, i) => ({ ...p, originalIndex: i }))
      .filter(p => p.team === opponentTeam);
    
    if (opponents.length > 0) {
      const randomOpponent = opponents[Math.floor(Math.random() * opponents.length)];
      setTargetPlayerIndex(randomOpponent.originalIndex);
    } else {
      setTargetPlayerIndex(null); // Should not happen in a valid game
    }
  }, [askingPlayer, players]);

  const handleAskQuestion = useCallback(async () => {
    chooseRandomTarget();
    setGameState('loading');
    setError(null);
    setContent(null);
    try {
      const question = await generateTruthQuestion();
      setContent(question);
      setTimerDuration(truthDuration);
      setTimerKey(prev => prev + 1);
      setGameState('question');
    } catch (err) {
      setError('فشل في جلب السؤال. حاول مرة أخرى.');
      setGameState('idle');
    }
  }, [chooseRandomTarget, truthDuration]);

  const handleGetDare = useCallback(async () => {
    setGameState('loading');
    setError(null);
    setContent(null);
    setIsDareTimerRunning(false);
    setSelectedDareIndex(null);
    try {
      const dares = await generateDare();
      setContent(dares);
      setTimerDuration(dareDuration);
      setTimerKey(prev => prev + 1);
      setGameState('dare');
    } catch (err) {
      setError('فشل في جلب العقاب. حاول مرة أخرى.');
      setGameState('idle');
    }
  }, [dareDuration]);

  const handleSelectDare = (index: number) => {
    setSelectedDareIndex(index);
  };
  
  const handleNextTurn = useCallback((answeredQuestion: boolean = false) => {
    if (answeredQuestion && targetPlayer) {
        setScores(prev => ({...prev, [targetPlayer.team]: prev[targetPlayer.team] + 1}))
    }
    setTurnIndex(prev => prev + 1);
    setGameState('idle');
    setContent(null);
    setError(null);
    setTargetPlayerIndex(null);
    setIsDareTimerRunning(false);
    setSelectedDareIndex(null);
  }, [targetPlayer]);


  const handleTimeUp = useCallback(() => {
    if (gameState === 'question') {
      handleGetDare();
    } else if (gameState === 'dare') {
      handleNextTurn(false);
    }
  }, [gameState, handleGetDare, handleNextTurn]);

  const renderPlayerSelection = () => (
    <div className="flex flex-col items-center gap-4 text-center animate-fade-in">
        <h2 className="text-2xl font-bold text-primary-400">اختر عدد اللاعبين</h2>
        <p className="text-slate-400">سيتم تقسيم اللاعبين إلى فريقين متساويين.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-md">
            {[2, 4, 6, 8, 10].map(num => (
                <Button key={num} onClick={() => handleSelectNumberOfPlayers(num)} variant="secondary">
                    {num} لاعبين
                </Button>
            ))}
        </div>
    </div>
  );

  const renderNameRegistration = () => (
     <div className="flex flex-col items-center gap-4 text-center animate-fade-in w-full">
        <h2 className="text-2xl font-bold text-primary-400">تسجيل أسماء اللاعبين</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {playerNames.map((_, index) => (
                <div key={index}>
                    <label htmlFor={`player${index}`} className="block text-right mb-1 text-sm text-slate-300">
                        {`اللاعب ${index + 1}`} ({index % 2 === 0 ? 'الفريق أ' : 'الفريق ب'})
                    </label>
                    <input
                        id={`player${index}`}
                        type="text"
                        value={playerNames[index]}
                        onChange={(e) => handleNameChange(index, e.target.value)}
                        placeholder={`اسم اللاعب ${index + 1}`}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
            ))}
        </div>
        <Button
            onClick={handleStartGame}
            disabled={playerNames.some(name => !name.trim())}
            className="mt-4"
        >
            بدء اللعب
        </Button>
    </div>
  );

  const renderScoreboard = () => (
    <div className="grid grid-cols-2 gap-4 mb-6 text-center">
        <div className="bg-slate-900/50 p-4 rounded-lg border border-primary-500/50">
            <h3 className="text-lg font-bold text-primary-400">الفريق أ</h3>
            <p className="text-3xl font-mono">{scores.A}</p>
            <div className="text-xs text-slate-400 mt-2">
                {players.filter(p => p.team === 'A').map(p => p.name).join(', ')}
            </div>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-lg border-slate-600">
            <h3 className="text-lg font-bold text-slate-300">الفريق ب</h3>
            <p className="text-3xl font-mono">{scores.B}</p>
             <div className="text-xs text-slate-400 mt-2">
                {players.filter(p => p.team === 'B').map(p => p.name).join(', ')}
            </div>
        </div>
    </div>
  );

  const renderGameContent = () => {
    if (!askingPlayer) return null; // Should not happen when game has started

    switch (gameState) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center h-64">
            <LoadingSpinner />
            <p className="mt-4 text-slate-300">جاري التحضير...</p>
          </div>
        );
      case 'question':
        return (
          <div className="flex flex-col items-center gap-6 text-center">
             <CountdownTimer duration={timerDuration} onComplete={handleTimeUp} key={timerKey} />
              <p className="text-lg text-slate-400">يا {targetPlayer?.name}، هذا لك:</p>
             <p className="text-xl md:text-2xl leading-relaxed text-slate-200 bg-slate-900/70 p-6 rounded-lg border border-slate-700">
                {content}
             </p>
          </div>
        );
      case 'dare':
        if (!Array.isArray(content)) return null;

        if (selectedDareIndex === null) {
            return (
                <div className="flex flex-col items-center gap-4 text-center">
                    <p className="text-lg text-slate-400">يا {targetPlayer?.name}، اختر عقابًا واحدًا:</p>
                    <div className="w-full space-y-3">
                        {content.map((dare, index) => (
                            <button
                                key={index}
                                onClick={() => handleSelectDare(index)}
                                className="w-full text-right bg-slate-900/70 p-4 rounded-lg border border-slate-700 hover:bg-slate-700 hover:border-primary-500 transition-all duration-200"
                            >
                                <p className="text-lg text-slate-200">{dare}</p>
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        return (
          <div className="flex flex-col items-center gap-6 text-center">
            {isDareTimerRunning && <CountdownTimer duration={timerDuration} onComplete={handleTimeUp} key={timerKey} />}
            <p className="text-lg text-slate-400">يا {targetPlayer?.name}، هذا هو عقابك:</p>
            <p className="text-xl md:text-2xl leading-relaxed text-slate-200 bg-slate-900/70 p-6 rounded-lg border border-slate-700">
              {content[selectedDareIndex]}
            </p>
            {!isDareTimerRunning && (
              <Button onClick={() => setIsDareTimerRunning(true)} variant="secondary">
                بدء مؤقت العقاب
              </Button>
            )}
          </div>
        );
      case 'idle':
      default:
        return (
            <div className="text-center h-64 flex flex-col items-center justify-center">
                {error && <p className="text-red-400 mb-4">{error}</p>}
                <p className="text-xl text-slate-300 mb-2">الدور على <span className="font-bold text-primary-400">{askingPlayer.name}</span> (الفريق {askingPlayer.team})</p>
                <p className="text-slate-400 mb-6">سيتم طرح سؤال على لاعب عشوائي من الفريق المنافس.</p>
                <Button onClick={handleAskQuestion}>
                   اطرح سؤالاً
                </Button>
            </div>
        );
    }
  };
  
  const renderGameActions = () => {
    if (gameState === 'question') {
        return (
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-700">
                <Button onClick={() => handleNextTurn(true)} variant="primary">
                    أجاب (نقطة لفريقه)
                </Button>
                <Button onClick={handleGetDare} variant="secondary">
                    رفض الإجابة (الحصول على عقاب)
                </Button>
            </div>
        )
    }
    if (gameState === 'dare' && selectedDareIndex !== null) {
        return (
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-700">
                <Button onClick={() => handleNextTurn(false)} variant="primary">
                    نفذ العقاب (اللاعب التالي)
                </Button>
            </div>
        )
    }
    return null;
  }

  const renderGame = () => (
    <>
      <div className="absolute top-4 right-4 flex items-center gap-4 z-10">
        {(gameState !== 'selectingPlayers' && gameState !== 'namingPlayers') && (
            <button
                onClick={handleResetGame}
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
      {renderScoreboard()}
      {renderGameContent()}
      {renderGameActions()}
    </>
  )

  const renderSettingsModal = () => (
    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-20 animate-fade-in p-4">
      <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-sm border border-slate-700 shadow-2xl shadow-slate-950/50">
        <h3 className="text-xl font-bold mb-6 text-center text-primary-400">إعدادات المؤقت</h3>
        <div className="space-y-6">
          <div>
            <label htmlFor="truth-timer" className="flex justify-between items-center mb-2 text-slate-300">
              <span>مدة سؤال الصراحة</span>
              <span className="font-mono text-lg text-primary-400">{truthDuration} ثانية</span>
            </label>
            <input
              id="truth-timer"
              type="range"
              min="10"
              max="120"
              step="5"
              value={truthDuration}
              onChange={(e) => setTruthDuration(Number(e.target.value))}
              className="w-full custom-range"
            />
          </div>
          <div>
            <label htmlFor="dare-timer" className="flex justify-between items-center mb-2 text-slate-300">
              <span>مدة العقاب</span>
              <span className="font-mono text-lg text-primary-400">{dareDuration} ثانية</span>
            </label>
            <input
              id="dare-timer"
              type="range"
              min="15"
              max="180"
              step="5"
              value={dareDuration}
              onChange={(e) => setDareDuration(Number(e.target.value))}
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

  return (
    <main className="relative bg-slate-800/50 rounded-2xl shadow-2xl shadow-slate-950/50 p-6 md:p-8 backdrop-blur-sm border border-slate-700 min-h-[400px] overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(var(--color-primary-500-rgb), 0.1) 1px, transparent 1px), linear-gradient(to right, rgba(var(--color-primary-500-rgb), 0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            animation: 'moveGrid 20s linear infinite',
          }}
        ></div>
        <div className="relative z-10">
            {isSettingsOpen && renderSettingsModal()}
            {gameState === 'selectingPlayers' && renderPlayerSelection()}
            {gameState === 'namingPlayers' && renderNameRegistration()}
            {(gameState === 'idle' || gameState === 'loading' || gameState === 'question' || gameState === 'dare') && renderGame()}
        </div>
    </main>
  );
};