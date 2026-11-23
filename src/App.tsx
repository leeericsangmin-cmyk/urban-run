import { useState, useCallback, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import {
  GameState,
  District,
  DifficultyLevel,
  StickmanPlayer,
  GameStats,
  Direction,
} from './types/game';
import { GameCanvas } from './components/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { TitleMenu } from './components/TitleMenu';
import { GameOverModal } from './components/GameOverModal';
import { LegendModal } from './components/LegendModal';
import { PrivacyModal } from './components/PrivacyModal';
import { LearnToRunGuide, GuideStep } from './components/LearnToRunGuide';
import { ControlsOverlay } from './components/ControlsOverlay';
import { OfflineIndicator } from './components/OfflineIndicator';
import { sounds } from './utils/audio';
import {
  getHighScore,
  getSavedDifficulty,
  saveDifficulty,
} from './utils/storage';
import {
  evaluateKillSwitch,
  isKillSwitchLocked,
  isOfflinePassValid,
  triggerKillSwitchAndWipe,
} from './services/killSwitchService';
import { DiscontinuedScreen } from './components/DiscontinuedScreen';

export default function App() {
  const [appStatus, setAppStatus] = useState<'verifying' | 'active' | 'discontinued'>(() => {
    const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (!online) {
      if (isKillSwitchLocked() || !isOfflinePassValid()) {
        return 'discontinued';
      }
      return 'active';
    }
    return 'verifying';
  });

  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [district, setDistrict] = useState<District>('midtown');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(() => getSavedDifficulty());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);
  const [queuedDirection, setQueuedDirection] = useState<Direction>('NONE');
  const [gameSessionId, setGameSessionId] = useState<number>(0);

  // Learn to Run Step-by-Step Guide State
  const [isGuideMode, setIsGuideMode] = useState<boolean>(false);
  const [guideStep, setGuideStep] = useState<GuideStep>(1);
  const [isGuidePaused, setIsGuidePaused] = useState<boolean>(false);

  // Player & Stats state (reflected to HUD)
  const [playerState, setPlayerState] = useState<StickmanPlayer>({
    x: 0,
    y: 0,
    radius: 9,
    direction: 'UP',
    nextDirection: 'UP',
    speed: 5.2,
    baseSpeed: 5.2,
    walkCycle: 0,
    hp: 100,
    maxHp: 100,
    invincibleTimer: 0,
    eraserModeTimer: 0,
    speedBoostTimer: 0,
    scoreMultiplierTimer: 0,
    slowTimer: 0,
    footsteps: [],
  });

  const [statsState, setStatsState] = useState<GameStats>({
    score: 0,
    distanceFeet: 0,
    blocksTraversed: 0,
    obstaclesDodged: 0,
    highScore: 0,
    difficulty: 'normal',
  });

  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

  // Sync high score from zero-PII local storage for selected difficulty
  const syncHighScore = useCallback((diff: DifficultyLevel) => {
    const score = getHighScore(diff);
    setStatsState((prev) => ({ ...prev, highScore: score, difficulty: diff }));
  }, []);

  useEffect(() => {
    syncHighScore(difficulty);
  }, [difficulty, syncHighScore]);

  // Handle difficulty switch with zero-PII persistence
  const handleChangeDifficulty = useCallback((newDiff: DifficultyLevel) => {
    setDifficulty(newDiff);
    saveDifficulty(newDiff);
  }, []);

  // Handle Audio mute toggle
  const handleToggleSound = useCallback(() => {
    sounds.enabled = !sounds.enabled;
    setSoundEnabled(sounds.enabled);
  }, []);

  // Handle Pause toggle
  const handleTogglePause = useCallback(() => {
    setGameState((current) => {
      if (current === 'PLAYING') return 'PAUSED';
      if (current === 'PAUSED') return 'PLAYING';
      return current;
    });
  }, []);

  // Start standard game handler
  const handleStartGame = (selectedDist: District, selectedDiff?: DifficultyLevel) => {
    setDistrict(selectedDist);
    if (selectedDiff) {
      handleChangeDifficulty(selectedDiff);
    }
    setIsGuideMode(false);
    setIsGuidePaused(false);
    setIsNewRecord(false);
    setQueuedDirection('NONE');
    setGameSessionId((s) => s + 1);
    setGameState('PLAYING');
  };

  // Start "Learn to Run" step-by-step interactive guide mode
  const handleStartLearnToRun = (selectedDist: District = 'midtown') => {
    setDistrict(selectedDist);
    setIsGuideMode(true);
    setGuideStep(1);
    setIsGuidePaused(true); // Step 1 pauses game momentarily
    setIsNewRecord(false);
    setQueuedDirection('NONE');
    setGameSessionId((s) => s + 1);
    setGameState('PLAYING');
  };

  // Step 1: Resumes running and enters 10-second navigation interval to explore the map
  const handleStep1Resume = useCallback((dir?: Direction) => {
    if (dir && dir !== 'NONE') {
      setQueuedDirection(dir);
      sounds.playTurn();
    }
    // Enter 10-second free navigation interval so player explores surroundings
    setGuideStep('navigating_1');
    setIsGuidePaused(false);
  }, []);

  // Move from navigating_1 to Step 2 (called after 10s of free navigation or on skip)
  const handleSkipToStep2 = useCallback(() => {
    if (isGuideMode && guideStep === 'navigating_1') {
      setGuideStep(2);
      setIsGuidePaused(true); // Step 2 pauses to explain obstacles
    }
  }, [isGuideMode, guideStep]);

  // Step 2: Resumes running and enters 10-second navigation interval with active traffic
  const handleStep2Resume = useCallback(() => {
    // Enter 10-second navigation interval so player tests dodging traffic
    setGuideStep('navigating_2');
    setIsGuidePaused(false);
  }, []);

  // Move from navigating_2 to Step 3 (called after 10s of navigation or on skip)
  const handleSkipToStep3 = useCallback(() => {
    if (isGuideMode && guideStep === 'navigating_2') {
      setGuideStep(3);
      setIsGuidePaused(true); // Step 3 pauses to explain Patience & Game Over
    }
  }, [isGuideMode, guideStep]);

  // Step 3 Actions:
  // 1. Lead directly to actual game
  const handleStartActualRun = useCallback(() => {
    setIsGuideMode(false);
    setIsGuidePaused(false);
    handleStartGame(district, difficulty);
  }, [district, difficulty]);

  // 2. Lead back to starting page
  const handleBackToStart = useCallback(() => {
    setIsGuideMode(false);
    setIsGuidePaused(false);
    setGameState('TITLE_MENU');
  }, []);

  // Exit guide at anytime
  const handleExitGuide = useCallback(() => {
    setIsGuideMode(false);
    setIsGuidePaused(false);
    setGameState('TITLE_MENU');
  }, []);

  // Handle D-pad input during Step 1 vs normal gameplay
  const handleDirectionInput = (dir: Direction) => {
    if (isGuideMode && guideStep === 1 && isGuidePaused) {
      handleStep1Resume(dir);
    } else {
      setQueuedDirection(dir);
    }
  };

  // Game over handler
  const handleGameOver = useCallback((finalStats: GameStats) => {
    setStatsState(finalStats);
    // If in guide mode and player hasn't seen Step 3, show Step 3 to explain why it ended!
    if (isGuideMode && guideStep !== 3) {
      setGuideStep(3);
      setIsGuidePaused(true);
      return;
    }

    if (!isGuideMode && finalStats.score > finalStats.highScore) {
      setIsNewRecord(true);
    }
    setGameState('GAME_OVER');
  }, [isGuideMode, guideStep]);

  // Restart handler
  const handleRestart = () => {
    setIsNewRecord(false);
    setQueuedDirection('NONE');
    setGameSessionId((s) => s + 1);
    setGameState('PLAYING');
  };

  // Back to home title menu
  const handleGoHome = () => {
    setIsGuideMode(false);
    setIsGuidePaused(false);
    setGameState('TITLE_MENU');
  };

  // Top-level "Instant Check When Online + 1-Day Short Offline Pass" Kill Switch Hook
  useEffect(() => {
    let isMounted = true;

    const runKillSwitchVerification = () => {
      void evaluateKillSwitch().then((result) => {
        if (!isMounted) return;
        if (result.discontinued || !result.allowed) {
          setAppStatus('discontinued');
        } else {
          setAppStatus('active');
        }
      });
    };

    // 1. Verify immediately on launch
    runKillSwitchVerification();

    // 2. Re-verify immediately when resuming from background or regaining internet
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runKillSwitchVerification();
      }
    };
    const handleOnline = () => {
      runKillSwitchVerification();
    };
    const handleOffline = () => {
      if (!isOfflinePassValid()) {
        void triggerKillSwitchAndWipe().then(() => {
          if (isMounted) setAppStatus('discontinued');
        });
      }
    };

    // 3. Periodically check 1-day offline pass expiration while app remains open offline
    const offlineCheckInterval = window.setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        if (!isOfflinePassValid()) {
          void triggerKillSwitchAndWipe().then(() => {
            if (isMounted) setAppStatus('discontinued');
          });
        }
      }
    }, 30_000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      isMounted = false;
      window.clearInterval(offlineCheckInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Global spacebar to pause or start (disabled unless active)
  useEffect(() => {
    if (appStatus !== 'active') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (gameState === 'PLAYING') {
          // In guide mode step 1, 2, or 3, let the guide handle the pause
          if (isGuideMode && isGuidePaused) return;
          e.preventDefault();
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          e.preventDefault();
          setGameState('PLAYING');
        } else if (gameState === 'TITLE_MENU') {
          e.preventDefault();
          handleStartGame(district, difficulty);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appStatus, gameState, district, difficulty, isGuideMode, isGuidePaused]);

  // Permanent lockout screen when kill switch triggers
  if (appStatus === 'discontinued') {
    return <DiscontinuedScreen />;
  }

  // Gate rendering briefly while online startup verification completes
  if (appStatus === 'verifying') {
    return (
      <main
        className="w-screen h-screen bg-[#f8f6f0] select-none"
        aria-busy="true"
      />
    );
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#f8f6f0] select-none">
      {/* 1. Title Menu Screen */}
      {gameState === 'TITLE_MENU' && (
        <TitleMenu
          onStartGame={handleStartGame}
          onStartLearnToRun={handleStartLearnToRun}
          selectedDistrict={district}
          onChangeDistrict={setDistrict}
          selectedDifficulty={difficulty}
          onChangeDifficulty={handleChangeDifficulty}
          highScore={statsState.highScore}
          onDataReset={() => syncHighScore(difficulty)}
        />
      )}

      {/* 2. Active Game Screen or Paused */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'GAME_OVER') && (
        <>
          <GameHUD
            player={playerState}
            stats={statsState}
            difficulty={isGuideMode ? 'easy' : difficulty}
            isPaused={gameState === 'PAUSED'}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            onTogglePause={handleTogglePause}
            onOpenLegend={() => setIsLegendOpen(true)}
            onOpenPrivacy={() => setIsPrivacyOpen(true)}
            isGuideMode={isGuideMode}
            onExitGuide={handleExitGuide}
          />

          <GameCanvas
            key={`${district}-${isGuideMode ? 'easy' : difficulty}-${gameSessionId}`}
            district={district}
            difficulty={isGuideMode ? 'easy' : difficulty}
            isPaused={gameState === 'PAUSED' || gameState === 'GAME_OVER' || (isGuideMode && isGuidePaused)}
            onUpdatePlayer={setPlayerState}
            onUpdateStats={setStatsState}
            onGameOver={handleGameOver}
            queuedDirection={queuedDirection}
            setQueuedDirection={setQueuedDirection}
            onDirectionInput={handleDirectionInput}
            isGuideMode={isGuideMode}
          />

          <ControlsOverlay
            onDirectionInput={handleDirectionInput}
            activeDirection={playerState.direction}
          />

          {/* Interactive Step-by-Step Learn to Run Guide */}
          {isGuideMode && gameState === 'PLAYING' && (
            <LearnToRunGuide
              step={guideStep}
              onStep1Resume={handleStep1Resume}
              onStep2Resume={handleStep2Resume}
              onSkipToStep2={handleSkipToStep2}
              onSkipToStep3={handleSkipToStep3}
              onStartActualRun={handleStartActualRun}
              onBackToStart={handleBackToStart}
              onExitGuide={handleExitGuide}
            />
          )}
        </>
      )}

      {/* 3. Pause Overlay (only when user manually pauses outside of guide-controlled pauses) */}
      {gameState === 'PAUSED' && !isGuidePaused && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#2b2b2e]/40 backdrop-blur-xs select-none">
          <div className="bg-[#ffffff] border-4 border-[#2b2b2e] p-6 rounded-lg shadow-2xl text-center max-w-sm w-full">
            <h2 className="font-sketch text-3xl font-bold text-[#1e1e20] mb-4">
              {isGuideMode ? 'GUIDE PAUSED' : 'GAME PAUSED'}
            </h2>
            {isGuideMode && (
              <p className="text-xs text-[#525258] mb-4">
                Reviewing the city layout. Unpause to continue learning mechanics and obstacles.
              </p>
            )}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleTogglePause}
                className="w-full py-2.5 bg-[#2b2b2e] hover:bg-[#1a1a1c] text-white font-sketch text-lg font-bold rounded-lg border-2 border-[#2b2b2e] transition-colors cursor-pointer"
              >
                RESUME RUN
              </button>
              <button
                type="button"
                onClick={handleToggleSound}
                className="w-full py-2 bg-[#faf8f3] hover:bg-[#ede9df] text-[#2b2b2e] font-sketch text-sm font-bold rounded-lg border-2 border-[#2b2b2e] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span>{soundEnabled ? 'SOUND: ON' : 'SOUND: MUTED'}</span>
              </button>
              <button
                type="button"
                onClick={handleGoHome}
                className="w-full py-2 bg-[#faf8f3] hover:bg-[#ede9df] text-[#2b2b2e] font-sketch text-sm font-bold rounded-lg border-2 border-[#2b2b2e] transition-colors cursor-pointer"
              >
                QUIT TO MENU
              </button>
            </div>

            {/* Quick Controls Reminder in Pause Menu */}
            <div className="mt-3 pt-2.5 border-t border-[#2b2b2e]/20 text-[11px] text-[#55555c] leading-tight">
              <span className="font-sketch font-bold text-[#1e1e20]">CONTROLS:</span>{' '}
              <span>Arrow Keys or WASD on PC · Swipe Up, Down, Left, Right on mobile</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Game Over Modal */}
      {gameState === 'GAME_OVER' && (
        <GameOverModal
          stats={statsState}
          isNewHighScore={isNewRecord}
          onRestart={handleRestart}
          onHome={handleGoHome}
          onDataReset={() => syncHighScore(difficulty)}
        />
      )}

      {/* 5. Guide / Legend Modal */}
      <LegendModal
        isOpen={isLegendOpen}
        onClose={() => setIsLegendOpen(false)}
      />

      {/* 6. Privacy & Storage Modal */}
      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        onDataReset={() => syncHighScore(difficulty)}
      />

      {/* 7. Offline Connectivity Banner */}
      <OfflineIndicator />
    </main>
  );
}
