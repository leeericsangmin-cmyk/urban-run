import React, { useEffect, useRef, useCallback } from 'react';
import {
  Direction,
  District,
  DifficultyLevel,
  DIFFICULTY_CONFIGS,
  GameStats,
  StickmanPlayer,
  CityMap,
  Particle,
  FloatingText,
} from '../types/game';
import { generateCityMap } from '../utils/mapGenerator';
import { sounds } from '../utils/audio';
import { getHighScore, saveHighScore } from '../utils/storage';
import { registerTeardownCallback } from '../services/killSwitchService';
import {
  renderPaperBackground,
  renderStreets,
  renderSurroundingRivers,
  renderCityBlocks,
  renderObstacles,
  renderAerialStickman,
  renderCreepingBottomFog,
  renderParticles,
  renderFloatingTexts,
} from '../utils/pencilRenderer';

interface GameCanvasProps {
  district: District;
  difficulty?: DifficultyLevel;
  isPaused: boolean;
  onUpdatePlayer: (player: StickmanPlayer) => void;
  onUpdateStats: (stats: GameStats) => void;
  onGameOver: (finalStats: GameStats) => void;
  queuedDirection: Direction;
  setQueuedDirection: (dir: Direction) => void;
  onDirectionInput?: (dir: Direction) => void;
  isGuideMode?: boolean;
  onFirstObstacleNear?: () => void;
}

// Measured, responsive running pace across all levels
const DEFAULT_SPEED = 4.55;
// Slight speed boost when holding a direction/control key (desktop) or sliding/holding in a direction (mobile)
const HOLD_BOOST_MULTIPLIER = 1.3;
const SWIPE_BOOST_DURATION = 0.65;

export const GameCanvas: React.FC<GameCanvasProps> = ({
  district,
  difficulty = 'normal',
  isPaused,
  onUpdatePlayer,
  onUpdateStats,
  onGameOver,
  queuedDirection,
  setQueuedDirection,
  onDirectionInput,
  isGuideMode = false,
  onFirstObstacleNear,
}) => {
  const effectiveDifficulty: DifficultyLevel = isGuideMode ? 'easy' : difficulty;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapRef = useRef<CityMap | null>(null);

  // Player state: stickman running continuously forward from bottom-center
  const playerRef = useRef<StickmanPlayer>({
    x: 0,
    y: 0,
    radius: 9,
    direction: 'UP',
    nextDirection: 'UP',
    speed: DEFAULT_SPEED,
    baseSpeed: DEFAULT_SPEED,
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

  const statsRef = useRef<GameStats>({
    score: 0,
    distanceFeet: 0,
    blocksTraversed: 0,
    obstaclesDodged: 0,
    highScore: 0,
  });

  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const cameraRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const heldDirectionsRef = useRef<Set<Direction>>(new Set());
  const isCtrlHeldRef = useRef<boolean>(false);
  const touchHeldDirectionRef = useRef<Direction>('NONE');
  const swipeBoostDirRef = useRef<Direction>('NONE');
  const swipeBoostTimerRef = useRef<number>(0);

  // Bottom pursuit hazard (creeping ink wave / storm)
  const fogYRef = useRef<number>(0);
  const fogGraceTimerRef = useRef<number>(1.5);
  const hasReportedFirstObstacleRef = useRef<boolean>(false);

  // Initialize or reset game map & player state
  useEffect(() => {
    hasReportedFirstObstacleRef.current = false;
    const map = generateCityMap(district, effectiveDifficulty, isGuideMode);
    mapRef.current = map;

    const parsedHighScore = getHighScore(effectiveDifficulty);

    const startX = map.startPosition.x;
    const startY = map.startPosition.y;

    playerRef.current = {
      x: startX,
      y: startY,
      radius: 9,
      direction: 'UP',
      nextDirection: 'UP',
      speed: DEFAULT_SPEED,
      baseSpeed: DEFAULT_SPEED,
      walkCycle: 0,
      hp: 100,
      maxHp: 100,
      invincibleTimer: 0,
      eraserModeTimer: 0,
      speedBoostTimer: 0,
      scoreMultiplierTimer: 0,
      slowTimer: 0,
      footsteps: [],
    };

    cameraRef.current = { x: startX, y: startY };

    // Hazard starts south of player starting street
    fogYRef.current = startY + (isGuideMode ? 360 : 160);
    fogGraceTimerRef.current = isGuideMode ? 6.0 : 1.4;

    statsRef.current = {
      score: 0,
      distanceFeet: 0,
      blocksTraversed: 0,
      obstaclesDodged: 0,
      highScore: parsedHighScore,
      fogDistanceFeet: 160,
      gameOverReason: undefined,
      currentSection: map.startSectionName,
      difficulty: effectiveDifficulty,
    };

    particlesRef.current = [];
    floatingTextsRef.current = [];
    heldDirectionsRef.current.clear();
    isCtrlHeldRef.current = false;
    touchHeldDirectionRef.current = 'NONE';
    swipeBoostDirRef.current = 'NONE';
    swipeBoostTimerRef.current = 0;
  }, [district, effectiveDifficulty, isGuideMode]);

  // Clear active hold/slide boost states whenever paused
  useEffect(() => {
    if (isPaused) {
      heldDirectionsRef.current.clear();
      isCtrlHeldRef.current = false;
      touchHeldDirectionRef.current = 'NONE';
      swipeBoostTimerRef.current = 0;
    }
  }, [isPaused]);

  // Handle external queued direction from touch D-pad
  useEffect(() => {
    if (queuedDirection !== 'NONE') {
      applyDirection(queuedDirection);
      setQueuedDirection('NONE');
    }
  }, [queuedDirection, setQueuedDirection]);

  // Turn logic with intersection avenue/street snapping
  const applyDirection = useCallback((newDir: Direction) => {
    if (newDir === 'NONE') return;
    const p = playerRef.current;

    const isOpposite =
      (p.direction === 'UP' && newDir === 'DOWN') ||
      (p.direction === 'DOWN' && newDir === 'UP') ||
      (p.direction === 'LEFT' && newDir === 'RIGHT') ||
      (p.direction === 'RIGHT' && newDir === 'LEFT');

    if (isOpposite) {
      p.direction = newDir;
      p.nextDirection = newDir;
      sounds.playTurn();
      return;
    }

    p.nextDirection = newDir;
  }, []);

  // Keyboard controls: Arrow keys and WASD (tap to steer, hold directional key or Ctrl to move slightly faster)
  useEffect(() => {
    const eventToDirection = (e: KeyboardEvent): Direction => {
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          return 'UP';
        case 'ArrowDown':
        case 'KeyS':
          return 'DOWN';
        case 'ArrowLeft':
        case 'KeyA':
          return 'LEFT';
        case 'ArrowRight':
        case 'KeyD':
          return 'RIGHT';
      }
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          return 'UP';
        case 'ArrowDown':
        case 's':
        case 'S':
          return 'DOWN';
        case 'ArrowLeft':
        case 'a':
        case 'A':
          return 'LEFT';
        case 'ArrowRight':
        case 'd':
        case 'D':
          return 'RIGHT';
        default:
          return 'NONE';
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.code === 'ControlLeft' || e.code === 'ControlRight') {
        isCtrlHeldRef.current = true;
      }
      const dir = eventToDirection(e);
      if (dir !== 'NONE') {
        e.preventDefault();
        heldDirectionsRef.current.add(dir);
        if (!e.repeat) {
          applyDirection(dir);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.code === 'ControlLeft' || e.code === 'ControlRight') {
        isCtrlHeldRef.current = false;
      }
      const dir = eventToDirection(e);
      if (dir !== 'NONE') {
        heldDirectionsRef.current.delete(dir);
      }
    };

    const handleBlur = () => {
      heldDirectionsRef.current.clear();
      isCtrlHeldRef.current = false;
      touchHeldDirectionRef.current = 'NONE';
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [applyDirection]);

  const handleSwipeTrigger = useCallback(
    (dir: Direction) => {
      if (dir === 'NONE') return;

      // Haptic confirmation on mobile devices
      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(10);
        }
      } catch {
        // Ignore haptics error
      }

      applyDirection(dir);
      if (onDirectionInput) {
        onDirectionInput(dir);
      }
    },
    [applyDirection, onDirectionInput]
  );

  // Mobile Touch Swipe navigation on canvas (slide up/down/left/right to steer & boost slightly faster)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.touches.length === 0) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const minDistance = 16;

    if (Math.abs(dx) >= minDistance || Math.abs(dy) >= minDistance) {
      const dir: Direction =
        Math.abs(dx) > Math.abs(dy)
          ? (dx > 0 ? 'RIGHT' : 'LEFT')
          : (dy > 0 ? 'DOWN' : 'UP');

      touchHeldDirectionRef.current = dir;
      swipeBoostDirRef.current = dir;
      swipeBoostTimerRef.current = SWIPE_BOOST_DURATION;
      handleSwipeTrigger(dir);

      // Re-center coordinates so player can chain turns smoothly in one continuous gesture
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current && e.changedTouches && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      // Quick flick detection if threshold wasn't met during move
      if (Math.abs(dx) >= 15 || Math.abs(dy) >= 15) {
        const dir: Direction =
          Math.abs(dx) > Math.abs(dy)
            ? (dx > 0 ? 'RIGHT' : 'LEFT')
            : (dy > 0 ? 'DOWN' : 'UP');
        swipeBoostDirRef.current = dir;
        swipeBoostTimerRef.current = SWIPE_BOOST_DURATION;
        handleSwipeTrigger(dir);
      }
    }
    touchHeldDirectionRef.current = 'NONE';
    touchStartRef.current = null;
  };

  const addFloatingText = (x: number, y: number, text: string, color: string = '#1e1e20') => {
    floatingTextsRef.current.push({
      id: Math.random().toString(),
      x,
      y,
      text,
      color,
      life: 0,
      maxLife: 45,
    });
  };

  const spawnParticles = (x: number, y: number, count: number, type: Particle['type'], color: string) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.4 + Math.random() * 3.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 28 + Math.floor(Math.random() * 18),
        size: 2 + Math.random() * 3,
        color,
        type,
      });
    }
  };

  // Pure vanilla JavaScript math: Lightweight AABB bounding box collision check
  const checkBlockCollision = (x: number, y: number, r: number, blocks: CityMap['blocks']): boolean => {
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (
        x + r > b.x &&
        x - r < b.x + b.width &&
        y + r > b.y &&
        y - r < b.y + b.height
      ) {
        return true;
      }
    }
    return false;
  };

  // Main 60fps Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      const frameScale = dt * 60;

      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(loop);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(loop);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      const p = playerRef.current;
      const map = mapRef.current;
      if (!map) {
        animId = requestAnimationFrame(loop);
        return;
      }
      const stats = statsRef.current;

      // River shoreline boundaries (left, right, bottom)
      const leftmostAvenue = map.streets.find((s) => s.isAvenue && s.id === 'ave_0');
      const totalAvenues = map.streets.filter((st) => st.isAvenue).length;
      const rightmostAvenue = map.streets.find(
        (s) => s.isAvenue && s.id === `ave_${totalAvenues - 1}`
      );
      const totalStreets = map.streets.filter((st) => !st.isAvenue).length;
      const bottommostStreet = map.streets.find(
        (s) => !s.isAvenue && s.id === `st_${totalStreets - 1}`
      );

      const leftRiverX = leftmostAvenue ? leftmostAvenue.x1 - leftmostAvenue.width / 2 : 54;
      const rightRiverX = rightmostAvenue ? rightmostAvenue.x1 + rightmostAvenue.width / 2 : map.width - 54;
      const bottomRiverY = bottommostStreet ? bottommostStreet.y1 + bottommostStreet.width / 2 : map.height - 120;
      const topBoundaryY = map.streets[0].y1 - 100;

      // UPDATE GAME STATE (Pure Math & Physics)
      if (!isPaused && p.hp > 0) {
        if (p.invincibleTimer > 0) p.invincibleTimer = Math.max(0, p.invincibleTimer - dt);
        if (swipeBoostTimerRef.current > 0) {
          swipeBoostTimerRef.current = Math.max(0, swipeBoostTimerRef.current - dt);
        }

        const isDesktopHolding =
          heldDirectionsRef.current.has(p.direction) || isCtrlHeldRef.current;
        const isMobileSliding =
          touchHeldDirectionRef.current === p.direction ||
          (swipeBoostTimerRef.current > 0 && swipeBoostDirRef.current === p.direction);
        const isSpeedBoosting = isDesktopHolding || isMobileSliding;
        const speedMultiplier = isSpeedBoosting ? HOLD_BOOST_MULTIPLIER : 1.0;
        p.speedBoostTimer = isSpeedBoosting ? 0.1 : 0;

        if (p.slowTimer > 0) {
          p.slowTimer = Math.max(0, p.slowTimer - dt);
          p.speed = p.baseSpeed * 0.45 * speedMultiplier; // Slow down significantly in/after crowd
        } else {
          p.speed = p.baseSpeed * speedMultiplier;
        }

        p.walkCycle += p.speed * 0.18 * frameScale;
        sounds.playFootstep();

        // Low-patience audio alert when patience drops to 25% or below
        if (p.hp <= 25) {
          sounds.playLowPatienceAlert();
        }

        // 1. Responsive Turning at Intersections
        if (p.nextDirection !== p.direction && p.nextDirection !== 'NONE') {
          let testVx = 0;
          let testVy = 0;
          if (p.nextDirection === 'UP') testVy = -p.speed * 4;
          if (p.nextDirection === 'DOWN') testVy = p.speed * 4;
          if (p.nextDirection === 'LEFT') testVx = -p.speed * 4;
          if (p.nextDirection === 'RIGHT') testVx = p.speed * 4;

          const canTurnDirectly = !checkBlockCollision(p.x + testVx, p.y + testVy, p.radius, map.blocks);

          if (canTurnDirectly) {
            if (p.nextDirection === 'UP' || p.nextDirection === 'DOWN') {
              const closestAve = map.streets.filter((s) => s.isAvenue).reduce((prev, curr) => {
                return Math.abs(curr.x1 - p.x) < Math.abs(prev.x1 - p.x) ? curr : prev;
              });
              if (Math.abs(closestAve.x1 - p.x) < 38) {
                p.x = closestAve.x1;
                p.direction = p.nextDirection;
                sounds.playTurn();
              }
            } else {
              const closestSt = map.streets.filter((s) => !s.isAvenue).reduce((prev, curr) => {
                return Math.abs(curr.y1 - p.y) < Math.abs(prev.y1 - p.y) ? curr : prev;
              });
              if (Math.abs(closestSt.y1 - p.y) < 38) {
                p.y = closestSt.y1;
                p.direction = p.nextDirection;
                sounds.playTurn();
              }
            }
          }
        }

        // 2. Continuous Rapid Movement Forward (frame-rate independent)
        const moveStep = p.speed * frameScale;
        let vx = 0;
        let vy = 0;
        if (p.direction === 'UP') vy = -moveStep;
        if (p.direction === 'DOWN') vy = moveStep;
        if (p.direction === 'LEFT') vx = -moveStep;
        if (p.direction === 'RIGHT') vx = moveStep;

        const nextX = p.x + vx;
        const nextY = p.y + vy;

        const willHitBlock = checkBlockCollision(nextX, nextY, p.radius, map.blocks);

        if (!willHitBlock) {
          p.x = nextX;
          p.y = nextY;
        } else {
          // Automatic glance / street slide when encountering perpendicular wall
          const tryUp = !checkBlockCollision(p.x, p.y - p.speed, p.radius, map.blocks);
          const tryDown = !checkBlockCollision(p.x, p.y + p.speed, p.radius, map.blocks);
          const tryLeft = !checkBlockCollision(p.x - p.speed, p.y, p.radius, map.blocks);
          const tryRight = !checkBlockCollision(p.x + p.speed, p.y, p.radius, map.blocks);

          if (p.direction === 'LEFT' || p.direction === 'RIGHT') {
            if (tryUp) p.direction = 'UP';
            else if (tryDown) p.direction = 'DOWN';
          } else {
            if (tryLeft && !tryRight) p.direction = 'LEFT';
            else if (tryRight && !tryLeft) p.direction = 'RIGHT';
            else if (tryLeft && tryRight) p.direction = Math.random() > 0.5 ? 'LEFT' : 'RIGHT';
          }
        }

        // 3. Perimeter River Danger Check (Left, Right, and Bottom borders)
        if (
          p.x - p.radius <= leftRiverX ||
          p.x + p.radius >= rightRiverX ||
          p.y + p.radius >= bottomRiverY
        ) {
          p.hp = 0;
          stats.gameOverReason = 'RIVER';
          sounds.playSplash();
          sounds.playHit();
          spawnParticles(p.x, p.y, 35, 'bubble', '#38bdf8');
          spawnParticles(p.x, p.y, 20, 'graphite_dust', '#1e293b');
          addFloatingText(p.x, p.y - 20, 'FELL IN RIVER! GAME OVER', '#0284c7');
        }

        // 3B. Bottom Pursuit Hazard (Creeping Storm / Wave)
        const diffConfig = DIFFICULTY_CONFIGS[effectiveDifficulty] || DIFFICULTY_CONFIGS.normal;
        if (fogGraceTimerRef.current > 0) {
          fogGraceTimerRef.current = Math.max(0, fogGraceTimerRef.current - dt);
        } else {
          // Extra slow creeping storm for Learn to Run (guide mode) so players learn stress-free
          const baseStormSpeed = isGuideMode ? 0.65 : diffConfig.rainstormBaseSpeed;
          const fogSpeed = isGuideMode
            ? 0.65
            : baseStormSpeed + Math.min(0.8, (stats.distanceFeet / 8000) * 0.55);
          fogYRef.current -= fogSpeed * (dt * 60);
        }

        // Proximity check to bottom hazard: trigger hazard sweep sound if within 140px
        const hazardDistance = fogYRef.current - (p.y + p.radius);
        if (hazardDistance > 0 && hazardDistance < 140) {
          sounds.playHazardSweep();
        }

        // Ambient rising graphite smoke particles along hazard front
        if (Math.random() < 0.28) {
          const fx = cameraRef.current.x + (Math.random() - 0.5) * width;
          particlesRef.current.push({
            x: fx,
            y: fogYRef.current + Math.random() * 15,
            vx: (Math.random() - 0.5) * 0.7,
            vy: -0.8 - Math.random() * 1.6,
            life: 0,
            maxLife: 32,
            size: 2 + Math.random() * 3,
            color: '#475569',
            type: 'smoke',
          });
        }

        // Once the pursuit hazard overtakes the character, game over!
        if (p.y + p.radius >= fogYRef.current) {
          p.hp = 0;
          stats.gameOverReason = 'RAINSTORM';
          sounds.playHit();
          sounds.playGameOver();
          spawnParticles(p.x, p.y, 45, 'graphite_dust', '#1e1e24');
          spawnParticles(p.x, p.y, 25, 'smoke', '#475569');
          addFloatingText(p.x, p.y - 20, 'OVERTAKEN BY STORM! GAME OVER', '#dc2626');
        }

        // Live distance in feet
        const fogDistPx = Math.max(0, fogYRef.current - (p.y + p.radius));
        stats.fogDistanceFeet = Math.round(fogDistPx);

        // 3C. Endless Map Extension: Seamlessly wrap coordinates so the player never runs into the end of the map
        const blockPitch = 247;
        const wrapBlocks = 120;
        const wrapShift = wrapBlocks * blockPitch;

        if (p.y < topBoundaryY + 250) {
          p.y += wrapShift;
          cameraRef.current.y += wrapShift;
          fogYRef.current += wrapShift;
          p.footsteps.forEach((f) => {
            f.y += wrapShift;
          });
          particlesRef.current.forEach((pt) => {
            pt.y += wrapShift;
          });
          floatingTextsRef.current.forEach((ft) => {
            ft.y += wrapShift;
          });
        }

        stats.distanceFeet += moveStep;
        stats.score += dt; // Score is survival duration in seconds
        stats.blocksTraversed = Math.floor(stats.distanceFeet / 250);

        // 4. Urban Obstacles: Native lightweight vanilla JS collision math
        map.obstacles.forEach((obs) => {
          if (obs.type === 'taxi') {
            const obsStep = obs.speed * frameScale;
            if (obs.direction === 'DOWN') {
              obs.y += obsStep;
              if (obs.y > obs.maxPos) obs.y = obs.minPos;
            } else if (obs.direction === 'UP') {
              obs.y -= obsStep;
              if (obs.y < obs.minPos) obs.y = obs.maxPos;
            } else if (obs.direction === 'RIGHT') {
              obs.x += obsStep;
              if (obs.x > obs.maxPos) obs.x = obs.minPos;
            } else if (obs.direction === 'LEFT') {
              obs.x -= obsStep;
              if (obs.x < obs.minPos) obs.x = obs.maxPos;
            }

            // Proximity alert (horns and bells)
            const distToPlayer = Math.hypot(p.x - obs.x, p.y - obs.y);

            // Guide mode: trigger Step 2 as soon as first obstacle pops up in view
            if (isGuideMode && !hasReportedFirstObstacleRef.current && distToPlayer < 240) {
              hasReportedFirstObstacleRef.current = true;
              onFirstObstacleNear?.();
            }

            if (distToPlayer < 95) {
              if (obs.honkCooldown <= 0) {
                obs.honking = true;
                obs.honkCooldown = 2.2;
                if (obs.vehicleType === 'ebike' || obs.vehicleType === 'cyclist') {
                  sounds.playBicycleBell();
                } else {
                  sounds.playHorn();
                }
              }
            }
            if (obs.honkCooldown > 0) {
              obs.honkCooldown -= dt;
              if (obs.honkCooldown < 1.6) obs.honking = false;
            }

            // Circular radius / bounding box collision check
            const collisionDist = p.radius + obs.width * 0.45;
            if (distToPlayer < collisionDist) {
              if (p.invincibleTimer <= 0) {
                // Standalone Patience Meter reduction logic (-35 patience on hit)
                p.hp = Math.max(0, p.hp - 35);
                p.invincibleTimer = 1.2;
                sounds.playHit();
                spawnParticles(p.x, p.y, 14, 'graphite_dust', '#2a2a2d');
                addFloatingText(p.x, p.y - 15, '-35 HP', '#dc2626');
                if (p.hp <= 0 && !stats.gameOverReason) {
                  stats.gameOverReason = 'TAXI';
                }
              }
            }
          } else if (obs.type === 'crowd') {
            // Crowd cluster collision & slow-down zone
            const distToPlayer = Math.hypot(p.x - obs.x, p.y - obs.y);
            const crowdRadius = obs.radius || 26;

            // Guide mode: trigger Step 2 as soon as crowd obstacle pops up in view
            if (isGuideMode && !hasReportedFirstObstacleRef.current && distToPlayer < crowdRadius + 180) {
              hasReportedFirstObstacleRef.current = true;
              onFirstObstacleNear?.();
            }

            if (distToPlayer < p.radius + crowdRadius) {
              p.slowTimer = 0.55; // Apply slow-down
              // Gradual light patience drain when pushing through crowd
              p.hp = Math.max(0, p.hp - dt * 2.5);
              sounds.playCrowdBustle();

              if (Math.random() < 0.2) {
                spawnParticles(p.x, p.y, 1, 'graphite_dust', '#64748b');
              }
            }
          }
        });

        // Game Over Trigger
        if (p.hp <= 0) {
          sounds.playGameOver();
          if (stats.score > stats.highScore) {
            stats.highScore = stats.score;
            saveHighScore(difficulty, stats.score);
          }
          stats.difficulty = difficulty;
          onGameOver({ ...stats });
        }

        const particleDrag = Math.pow(0.94, frameScale);
        particlesRef.current = particlesRef.current.filter((particle) => {
          particle.life += frameScale;
          particle.x += particle.vx * frameScale;
          particle.y += particle.vy * frameScale;
          particle.vx *= particleDrag;
          particle.vy *= particleDrag;
          return particle.life < particle.maxLife;
        });

        floatingTextsRef.current = floatingTextsRef.current.filter((ft) => {
          ft.life += frameScale;
          ft.y -= 0.7 * frameScale;
          return ft.life < ft.maxLife;
        });

        onUpdatePlayer({ ...p });
        onUpdateStats({ ...stats });
      }

      // Camera Following (frame-rate independent smoothing)
      const camLerp = 1 - Math.pow(1 - 0.16, frameScale);
      cameraRef.current.x += (p.x - cameraRef.current.x) * camLerp;
      cameraRef.current.y += (p.y - cameraRef.current.y) * camLerp;

      // Render Pass
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.translate(width / 2 - cameraRef.current.x, height / 2 - cameraRef.current.y);

      // Background paper & drafting grid
      renderPaperBackground(ctx, cameraRef.current.x, cameraRef.current.y, width, height);

      // Streets and crosswalks (with viewport culling)
      renderStreets(
        ctx,
        map.streets,
        map.crosswalks,
        cameraRef.current.x,
        cameraRef.current.y,
        width,
        height
      );

      // Perimeter surrounding rivers (with viewport culling)
      renderSurroundingRivers(
        ctx,
        leftRiverX,
        rightRiverX,
        map.streets[0].y1,
        bottomRiverY,
        currentTime,
        cameraRef.current.x,
        cameraRef.current.y,
        width,
        height
      );

      // Minimalist architectural city blocks (with viewport culling)
      renderCityBlocks(
        ctx,
        map.blocks,
        cameraRef.current.x,
        cameraRef.current.y,
        width,
        height
      );

      // Procedural urban obstacles (with viewport culling)
      renderObstacles(
        ctx,
        map.obstacles,
        false,
        currentTime,
        cameraRef.current.x,
        cameraRef.current.y,
        width,
        height
      );

      // Procedural stickman player (aerial view)
      renderAerialStickman(ctx, p, currentTime);

      // Bottom pursuit hazard (sinusoidal/bezier curves with ink-wash/pencil-hatch gradient)
      renderCreepingBottomFog(
        ctx,
        cameraRef.current.x,
        cameraRef.current.y,
        width,
        height,
        fogYRef.current,
        p.y,
        currentTime
      );

      // Particles & Floating texts
      renderParticles(ctx, particlesRef.current);
      renderFloatingTexts(ctx, floatingTextsRef.current);

      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    let cancelled = false;
    animId = requestAnimationFrame(loop);

    const stopLoop = () => {
      if (!cancelled) {
        cancelled = true;
        cancelAnimationFrame(animId);
      }
    };

    const unregisterTeardown = registerTeardownCallback(stopLoop);

    return () => {
      unregisterTeardown();
      stopLoop();
    };
  }, [district, isPaused, onGameOver, onUpdatePlayer, onUpdateStats, isGuideMode]);

  return (
    <div
      className="relative w-full h-full touch-none select-none overflow-hidden cursor-crosshair"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block touch-none"
      />
    </div>
  );
};
