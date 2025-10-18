import React, { useState, useEffect, useCallback } from 'react';
import { generateRiddle } from './services/geminiService';
import type { Riddle, Difficulty, Theme, FontSize } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';
import { RiddleDisplay } from './components/RiddleDisplay';
import { Button } from './components/Button';
import { TruthOrDareGame } from './components/TruthOrDareGame';
import { SpeedChallengeGame } from './components/SpeedChallengeGame';


type GameMode = 'riddle' | 'group' | 'speedChallenge';

const App: React.FC = () => {
  const [currentRiddle, setCurrentRiddle] = useState<Riddle | null>(null);
  const [userGuess, setUserGuess] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [shareText, setShareText] = useState<string>('شارك اللغز');
  const [gameMode, setGameMode] = useState<GameMode>('riddle');
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  
  // New state for customization
  const [theme, setTheme] = useState<Theme>('cyan');
  const [fontSize, setFontSize] = useState<FontSize>('font-size-md');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load settings from localStorage on initial render
  useEffect(() => {
    const savedTheme = localStorage.getItem('appTheme') as Theme | null;
    const savedFontSize = localStorage.getItem('appFontSize') as FontSize | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    if (savedFontSize) {
      setFontSize(savedFontSize);
    } else {
        document.body.classList.add('font-size-md');
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('appTheme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('appFontSize', fontSize);
    document.body.classList.remove('font-size-sm', 'font-size-md', 'font-size-lg');
    document.body.classList.add(fontSize);
  }, [fontSize]);


  const fetchNewRiddle = useCallback(async (level: Difficulty) => {
    setIsLoading(true);
    setFeedback('');
    setUserGuess('');
    setShowAnswer(false);
    setError(null);
    setCurrentRiddle(null);

    try {
      const newRiddle = await generateRiddle(level);
      setCurrentRiddle(newRiddle);
    } catch (err) {
      console.error("Failed to generate riddle:", err);
      setError('عذرًا، حدث خطأ أثناء جلب اللغز. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (gameMode === 'riddle') {
        fetchNewRiddle('medium');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameMode]);

  const handleSwitchMode = (mode: GameMode) => {
    setGameMode(mode);
  }

  const handleCheckAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userGuess.trim() || !currentRiddle) return;

    const isCorrect = userGuess.trim().toLowerCase() === currentRiddle.answer.trim().toLowerCase();
    
    if (isCorrect) {
      setFeedback('🎉 إجابة صحيحة! أحسنت!');
    } else {
      setFeedback('🤔 حاول مرة أخرى، إجابتك غير صحيحة.');
    }
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
    setFeedback(`الإجابة الصحيحة هي: ${currentRiddle?.answer}`);
  };
  
  const handleShare = useCallback(async () => {
    if (!currentRiddle) return;

    const riddleTextToShare = `🤔 هل يمكنك حل هذا اللغز؟\n\n"${currentRiddle.riddle}"`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'لعبة الألغاز',
          text: riddleTextToShare,
        });
      } catch (err) {
        console.error('Share action was cancelled or failed', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(riddleTextToShare);
        setShareText('✅ تم النسخ!');
        setTimeout(() => setShareText('شارك اللغز'), 2000);
      } catch (err) {
        console.error('Failed to copy riddle to clipboard', err);
        setShareText('فشل النسخ');
        setTimeout(() => setShareText('شارك اللغز'), 2000);
      }
    }
  }, [currentRiddle]);


  const getGameTitle = () => {
    switch(gameMode) {
      case 'riddle': return 'لعبة الألغاز';
      case 'group': return 'لعب جماعي';
      case 'speedChallenge': return 'تحدي السرعة';
      default: return 'لعبة الألغاز';
    }
  }
  
  const getGameDescription = () => {
      switch(gameMode) {
        case 'riddle': return 'اختر مستوى الصعوبة واختبر ذكاءك';
        case 'group': return 'لعبة اعترافات وعقوبات لشخصين أو أكثر';
        case 'speedChallenge': return 'اذكر أكبر عدد من الأشياء في الفئة المحددة';
        default: return '';
      }
  }

  const renderHowToPlayContent = () => {
    switch (gameMode) {
      case 'riddle':
        return (
          <ul className="space-y-3 list-disc pr-5 text-slate-300">
            <li>اختر مستوى الصعوبة (سهل، متوسط، صعب).</li>
            <li>اقرأ اللغز الذي يظهر على الشاشة.</li>
            <li>اكتب إجابتك في الصندوق واضغط على "تحقق من الإجابة".</li>
            <li>إذا واجهت صعوبة، يمكنك إظهار الإجابة أو طلب لغز جديد.</li>
          </ul>
        );
      case 'group':
        return (
          <ul className="space-y-3 list-disc pr-5 text-slate-300">
            <li>اختر عدد اللاعبين؛ سيتم تقسيمكم إلى فريقين.</li>
            <li>أدخلوا أسماء اللاعبين.</li>
            <li>في كل دور، لاعب من فريق سيطرح سؤال صراحة على لاعب عشوائي من الفريق المنافس.</li>
            <li>إذا أجاب اللاعب المستهدف، يكسب فريقه نقطة. إذا رفض، سيحصل على عقاب.</li>
            <li>يمكنك تعديل مدة المؤقت من أيقونة الإعدادات.</li>
          </ul>
        );
      case 'speedChallenge':
        return (
          <ul className="space-y-3 list-disc pr-5 text-slate-300">
            <li>اضغط على "ابدأ التحدي" للحصول على فئة عشوائية.</li>
            <li>بعد ظهور الفئة، سيبدأ مؤقت العد التنازلي.</li>
            <li>اذكر أكبر عدد ممكن من الأشياء التي تنتمي لهذه الفئة بصوت عالٍ.</li>
            <li>عندما ينتهي الوقت، قارنوا إجاباتكم لمعرفة الفائز.</li>
          </ul>
        );
      default:
        return null;
    }
  }
  
  const renderHowToPlayModal = () => (
    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-30 animate-fade-in p-4">
      <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl shadow-slate-950/50">
        <h3 className="text-xl font-bold mb-4 text-center text-primary-400">طريقة اللعب: {getGameTitle()}</h3>
        <div className="text-right leading-relaxed">
          {renderHowToPlayContent()}
        </div>
        <Button onClick={() => setIsHowToPlayOpen(false)} className="mt-6">
          فهمت
        </Button>
      </div>
    </div>
  );

  const renderSettingsModal = () => (
    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-30 animate-fade-in p-4">
      <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl shadow-slate-950/50">
        <h3 className="text-xl font-bold mb-6 text-center text-primary-400">الإعدادات</h3>
        
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-3 text-slate-300 text-right">اللون الأساسي</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['cyan', 'emerald', 'rose', 'violet'] as Theme[]).map((themeName) => (
              <button
                key={themeName}
                onClick={() => setTheme(themeName)}
                className={`p-3 rounded-lg flex items-center justify-center gap-2 transition-all ${theme === themeName ? 'ring-2 ring-primary-400' : 'ring-1 ring-slate-600 hover:ring-slate-500'}`}
              >
                <span className={`w-5 h-5 rounded-full bg-${themeName}-500`}></span>
                <span className="capitalize">{
                    {cyan: 'سماوي', emerald: 'زمردي', rose: 'وردي', violet: 'بنفسجي'}[themeName]
                }</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-3 text-slate-300 text-right">حجم الخط</h4>
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant={fontSize === 'font-size-sm' ? 'primary' : 'secondary'}
              onClick={() => setFontSize('font-size-sm')}
            >
              صغير
            </Button>
            <Button
              variant={fontSize === 'font-size-md' ? 'primary' : 'secondary'}
              onClick={() => setFontSize('font-size-md')}
            >
              متوسط
            </Button>
            <Button
              variant={fontSize === 'font-size-lg' ? 'primary' : 'secondary'}
              onClick={() => setFontSize('font-size-lg')}
            >
              كبير
            </Button>
          </div>
        </div>

        <Button onClick={() => setIsSettingsOpen(false)} className="mt-6">
          إغلاق
        </Button>
      </div>
    </div>
  );


  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
       {isHowToPlayOpen && renderHowToPlayModal()}
       {isSettingsOpen && renderSettingsModal()}
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-400 mb-2">
            {getGameTitle()}
          </h1>
          <p className="text-lg text-slate-400">
            {getGameDescription()}
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={() => setIsHowToPlayOpen(true)}
              className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors"
              aria-label="How to play"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>طريقة اللعب</span>
            </button>
             <button
                onClick={() => setIsSettingsOpen(true)}
                className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors"
                aria-label="App Settings"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>الإعدادات</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-2 mb-6 border border-slate-700 bg-slate-800/50 rounded-lg p-2">
            <Button
                variant={gameMode === 'riddle' ? 'primary' : 'secondary'}
                onClick={() => handleSwitchMode('riddle')}
                className="flex-1"
            >
                لعبة الألغاز
            </Button>
            <Button
                variant={gameMode === 'group' ? 'primary' : 'secondary'}
                onClick={() => handleSwitchMode('group')}
                className="flex-1"
            >
                لعب جماعي
            </Button>
            <Button
                variant={gameMode === 'speedChallenge' ? 'primary' : 'secondary'}
                onClick={() => handleSwitchMode('speedChallenge')}
                className="flex-1"
            >
                تحدي السرعة
            </Button>
        </div>
        
        {gameMode === 'riddle' ? (
          <main className="bg-slate-800/50 rounded-2xl shadow-2xl shadow-slate-950/50 p-6 md:p-8 backdrop-blur-sm border border-slate-700">
            <div className="flex justify-center gap-3 mb-6">
                <Button
                    variant={difficulty === 'easy' ? 'primary' : 'secondary'}
                    onClick={() => setDifficulty('easy')}
                >
                    سهل
                </Button>
                <Button
                    variant={difficulty === 'medium' ? 'primary' : 'secondary'}
                    onClick={() => setDifficulty('medium')}
                >
                    متوسط
                </Button>
                <Button
                    variant={difficulty === 'hard' ? 'primary' : 'secondary'}
                    onClick={() => setDifficulty('hard')}
                >
                    صعب
                </Button>
            </div>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <LoadingSpinner />
                <p className="mt-4 text-slate-300">جاري تحضير لغز جديد...</p>
              </div>
            ) : error ? (
              <div className="text-center text-red-400 h-64 flex flex-col items-center justify-center">
                  <p>{error}</p>
                  <Button onClick={() => fetchNewRiddle(difficulty)} className="mt-4">
                      حاول مرة أخرى
                  </Button>
              </div>
            ) : currentRiddle ? (
              <div className="flex flex-col gap-6">
                <RiddleDisplay riddleText={currentRiddle.riddle} />

                <form onSubmit={handleCheckAnswer} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={userGuess}
                    onChange={(e) => setUserGuess(e.target.value)}
                    placeholder="اكتب إجابتك هنا..."
                    className="flex-grow bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-300"
                    disabled={showAnswer}
                  />
                  <Button type="submit" disabled={!userGuess.trim() || showAnswer}>
                    تحقق من الإجابة
                  </Button>
                </form>
                
                {feedback && (
                  <p className={`text-center p-3 rounded-lg ${feedback.includes('صحيحة') ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                    {feedback}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-700">
                  <Button onClick={() => fetchNewRiddle(difficulty)} variant="primary">
                    لغز جديد
                  </Button>
                  <Button onClick={handleShowAnswer} variant="secondary" disabled={showAnswer}>
                    أظهر الإجابة
                  </Button>
                   <Button onClick={handleShare} variant="secondary">
                    {shareText}
                  </Button>
                </div>
              </div>
            ) : null}
          </main>
        ) : gameMode === 'group' ? (
            <TruthOrDareGame />
        ) : (
            <SpeedChallengeGame />
        )}

        <footer className="text-center text-slate-500 text-sm py-4 mt-8">
            تم تطوير هذه اللعبه بواسطة (MOHAMMED)
        </footer>
      </div>
    </div>
  );
};

export default App;