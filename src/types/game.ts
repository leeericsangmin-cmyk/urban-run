export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'NONE';

export type ControlCorner = 'bottom-left' | 'bottom-right';

export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type District = 'midtown';

export type DifficultyLevel = 'easy' | 'normal' | 'hard';

export interface DifficultyConfig {
  id: DifficultyLevel;
  label: string;
  sublabel: string;
  tagline: string;
  description: string;
  vehicleMultiplier: number;
  crowdMultiplier: number;
  vehicleSpeedMultiplier: number;
  rainstormBaseSpeed: number;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    id: 'easy',
    label: 'Easy',
    sublabel: 'Sunday Morning',
    tagline: 'Light traffic & fewer obstacles',
    description: 'Reduced yellow cabs, cyclists, and sparse pedestrian crowds with an active chasing storm.',
    vehicleMultiplier: 0.5,
    crowdMultiplier: 0.35,
    vehicleSpeedMultiplier: 0.85,
    rainstormBaseSpeed: 2.35,
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-600',
    badgeText: 'text-emerald-700',
  },
  normal: {
    id: 'normal',
    label: 'Normal',
    sublabel: 'Midtown Commute',
    tagline: 'Moderate NYC traffic & steady crowds',
    description: 'Balanced fleet of taxis, e-bikes, and cyclists with measured speed and manageable traffic.',
    vehicleMultiplier: 0.75,
    crowdMultiplier: 0.7,
    vehicleSpeedMultiplier: 0.82,
    rainstormBaseSpeed: 3.05,
    badgeBg: 'bg-blue-50',
    badgeBorder: 'border-blue-600',
    badgeText: 'text-blue-700',
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    sublabel: 'Rush Hour',
    tagline: 'Active fleets & brisk obstacles',
    description: 'Brisk city traffic and couriers with challenging density and a fast-moving ink storm.',
    vehicleMultiplier: 1.05,
    crowdMultiplier: 1.05,
    vehicleSpeedMultiplier: 0.92,
    rainstormBaseSpeed: 3.55,
    badgeBg: 'bg-amber-50',
    badgeBorder: 'border-amber-600',
    badgeText: 'text-amber-700',
  },
};

export interface Position {
  x: number;
  y: number;
}

export interface CityBlock {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  category: 'skyscraper' | 'brownstone' | 'park' | 'commercial' | 'landmark';
  waterTanks: Position[];
  roofDetails: {
    hatches: number;
    hasHelipad?: boolean;
    acUnits: Position[];
  };
}

export interface Street {
  id: string;
  name: string;
  isAvenue: boolean; // vertical
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
}

export interface Crosswalk {
  x: number;
  y: number;
  width: number;
  height: number;
  horizontal: boolean;
}

export interface Intersection {
  x: number;
  y: number;
  radius: number;
  avenueName: string;
  streetName: string;
}

export interface StickmanPlayer {
  x: number;
  y: number;
  radius: number;
  direction: Direction;
  nextDirection: Direction;
  speed: number;
  baseSpeed: number;
  walkCycle: number;
  hp: number;
  maxHp: number;
  invincibleTimer: number; // in seconds
  eraserModeTimer: number; // kept for compatibility if needed
  speedBoostTimer: number;
  scoreMultiplierTimer: number;
  slowTimer: number; // slow down duration timer when in/exiting crowd
  footsteps: { x: number; y: number; angle: number; alpha: number }[];
}

export type ObstacleType = 'taxi' | 'steam_vent' | 'barricade' | 'pigeon_flock' | 'crowd';

export interface BaseObstacle {
  id: string;
  x: number;
  y: number;
  type: ObstacleType;
}

export interface TaxiObstacle extends BaseObstacle {
  type: 'taxi';
  vehicleType?: 'taxi' | 'ebike' | 'cyclist';
  direction: Direction;
  speed: number;
  length: number;
  width: number;
  honking: boolean;
  honkCooldown: number;
  minPos: number;
  maxPos: number;
  avenueOrStreetName: string;
}

export interface SteamVentObstacle extends BaseObstacle {
  type: 'steam_vent';
  radius: number;
  cycleTime: number; // internal timer 0..4s
  state: 'dormant' | 'warning' | 'steaming';
  steamParticles: { x: number; y: number; vx: number; vy: number; radius: number; life: number; maxLife: number }[];
}

export interface BarricadeObstacle extends BaseObstacle {
  type: 'barricade';
  width: number;
  height: number;
  angle: number;
}

export interface PigeonObstacle extends BaseObstacle {
  type: 'pigeon_flock';
  pigeons: { x: number; y: number; vx: number; vy: number; scattered: boolean }[];
}

export interface CrowdPerson {
  offsetX: number;
  offsetY: number;
  headRadius: number;
  color: string;
  hatColor?: string;
  hasBackpack?: boolean;
}

export interface CrowdObstacle extends BaseObstacle {
  type: 'crowd';
  radius: number;
  people: CrowdPerson[];
  label?: string;
}

export type Obstacle = TaxiObstacle | SteamVentObstacle | BarricadeObstacle | PigeonObstacle | CrowdObstacle;

// Item pickups removed per requirement (all items except obstacles removed)
export type CollectibleType = never;

export interface Collectible {
  id: string;
  x: number;
  y: number;
  type: string;
  collected: boolean;
  pulseOffset: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'pencil_shaving' | 'graphite_dust' | 'heart' | 'star' | 'smoke' | 'bubble';
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface CityMap {
  width: number;
  height: number;
  blocks: CityBlock[];
  streets: Street[];
  intersections: Intersection[];
  crosswalks: Crosswalk[];
  obstacles: Obstacle[];
  collectibles: Collectible[];
  startPosition: Position;
  startSectionName?: string;
}

export interface GameStats {
  score: number;
  distanceFeet: number;
  blocksTraversed: number;
  obstaclesDodged: number;
  highScore: number;
  fogDistanceFeet?: number;
  rainstormDistanceFeet?: number;
  gameOverReason?: 'RAINSTORM' | 'FOG' | 'RIVER' | 'TAXI' | 'UNKNOWN';
  currentSection?: string;
  difficulty?: DifficultyLevel;
}
