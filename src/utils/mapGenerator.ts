import {
  CityBlock,
  Street,
  Intersection,
  Crosswalk,
  CityMap,
  Obstacle,
  District,
  CrowdPerson,
  DifficultyLevel,
  DIFFICULTY_CONFIGS,
} from '../types/game';

interface DistrictConfig {
  avenueNames: string[];
  streetNames: string[];
  taxiDensity: number;
}

const DISTRICT_CONFIGS: Record<District, DistrictConfig> = {
  midtown: {
    avenueNames: ['8th Ave', '7th Ave', 'Broadway', '6th Ave', '5th Ave', 'Madison Ave', 'Park Ave'],
    streetNames: [
      'W 14th St', 'W 23rd St', 'W 34th St', 'W 42nd St', 'W 48th St',
      'W 50th St', 'W 54th St', 'W 57th St', 'W 66th St', 'W 72nd St',
      'W 79th St', 'W 86th St', 'W 96th St', 'W 104th St', 'W 110th St',
      'W 116th St', 'W 125th St', 'W 135th St', 'W 145th St', 'W 155th St',
      'W 168th St', 'W 175th St', 'W 181st St', 'W 190th St', 'Dyckman St',
      'W 207th St', 'W 215th St', 'Broadway Bridge', 'Marble Hill Way', 'Inwood Ridge'
    ],
    taxiDensity: 1.8,
  },
};

let lastSpawnAvenueIndex = -1;

export function getNextSpawnAvenueIndex(totalAvenues: number = 7): number {
  const availableIndices: number[] = [];
  for (let i = 0; i < totalAvenues; i++) {
    if (i !== lastSpawnAvenueIndex) {
      availableIndices.push(i);
    }
  }

  const chosen = availableIndices[Math.floor(Math.random() * availableIndices.length)];
  lastSpawnAvenueIndex = chosen;
  return chosen;
}

/**
 * Pre-builds a massive NYC continuous grid map surrounded by rivers on right, left, and bottom end borders.
 * The blocks are clean, minimalist pencil squares with zero internal text/details.
 * Heavy taxi cab density across avenues and cross-streets.
 */
// Generates authentic Manhattan street names from 1st St up to 220th St with famous landmarks
export function getManhattanStreetName(streetNumber: number): string {
  const landmarkMap: Record<number, string> = {
    1: 'W 1st St (Houston)',
    4: 'W 4th St (Village)',
    8: 'W 8th St (Astor)',
    14: 'W 14th St (Union Sq)',
    23: 'W 23rd St (Flatiron)',
    34: 'W 34th St (Herald Sq)',
    42: 'W 42nd St (Times Sq)',
    50: 'W 50th St (Radio City)',
    57: 'W 57th St (Billionaires Row)',
    59: 'W 59th St (Central Park S)',
    66: 'W 66th St (Lincoln Center)',
    72: 'W 72nd St (Dakota)',
    79: 'W 79th St (Museum Mile)',
    86: 'W 86th St',
    96: 'W 96th St',
    104: 'W 104th St',
    110: 'W 110th St (Cathedral Pkwy)',
    116: 'W 116th St (Columbia)',
    125: 'W 125th St (Martin Luther King Jr Blvd)',
    135: 'W 135th St (Schomburg)',
    145: 'W 145th St',
    155: 'W 155th St (Polo Grounds)',
    168: 'W 168th St (Medical Center)',
    175: 'W 175th St',
    181: 'W 181st St (GW Bridge)',
    190: 'W 190th St (Fort Tryon)',
    204: 'Dyckman St',
    207: 'W 207th St (Inwood)',
    215: 'W 215th St',
    220: 'Broadway Bridge',
  };
  if (landmarkMap[streetNumber]) return landmarkMap[streetNumber];
  const s = streetNumber % 10;
  const k = streetNumber % 100;
  const suffix = k >= 11 && k <= 13 ? 'th' : s === 1 ? 'st' : s === 2 ? 'nd' : s === 3 ? 'rd' : 'th';
  return `W ${streetNumber}${suffix} St`;
}

export function generateCityMap(
  district: District = 'midtown',
  difficulty: DifficultyLevel = 'normal',
  isGuideMode: boolean = false
): CityMap {
  const cfg = DISTRICT_CONFIGS[district];
  const diff = DIFFICULTY_CONFIGS[difficulty] || DIFFICULTY_CONFIGS.normal;
  // In Learn to Run (guide mode), vehicles move extra slowly (0.35x) so learners have full control
  const speedMult = isGuideMode ? 0.35 : diff.vehicleSpeedMultiplier;
  const numAvenues = 7;
  const numStreetRows = 200; // Massively extended continuous cross-streets vertically (over 50,000px)

  // Grid dimensions
  const streetWidth = 72;
  const blockWidth = 230;
  const blockHeight = 175;
  const marginX = 140; // Room for East & Hudson Rivers on left & right
  const bottomMargin = 220; // Room for New York Harbor / river on bottom
  const topMargin = 250;

  const totalWidth = marginX * 2 + (numAvenues - 1) * (blockWidth + streetWidth) + streetWidth;
  const totalHeight = topMargin + bottomMargin + (numStreetRows - 1) * (blockHeight + streetWidth) + streetWidth;

  const avenuePositions: number[] = [];
  for (let i = 0; i < numAvenues; i++) {
    const x = marginX + i * (blockWidth + streetWidth) + streetWidth / 2;
    avenuePositions.push(x);
  }

  // Cross-street Y positions: Y=0 is TOP of map, totalHeight is BOTTOM of map.
  const streetPositions: number[] = [];
  for (let j = 0; j < numStreetRows; j++) {
    const y = topMargin + j * (blockHeight + streetWidth) + streetWidth / 2;
    streetPositions.push(y);
  }

  // Spawn at a different section of the bottom of the map each game
  const spawnAveIdx = getNextSpawnAvenueIndex(numAvenues);
  const bottomStreetIdx = numStreetRows - 1;
  const startX = avenuePositions[spawnAveIdx];
  const startY = streetPositions[bottomStreetIdx];
  const startSectionName = cfg.avenueNames[spawnAveIdx % cfg.avenueNames.length];

  // 1. Build City Blocks: Clean, minimalist pencil squares with NO names and NO details
  const blocks: CityBlock[] = [];
  for (let i = 0; i < numAvenues - 1; i++) {
    for (let j = 0; j < numStreetRows - 1; j++) {
      const bx = avenuePositions[i] + streetWidth / 2;
      const by = streetPositions[j] + streetWidth / 2;
      const bw = blockWidth;
      const bh = blockHeight;

      blocks.push({
        id: `block_${i}_${j}`,
        x: bx,
        y: by,
        width: bw,
        height: bh,
        name: '',
        category: 'commercial',
        waterTanks: [],
        roofDetails: {
          hatches: 0,
          hasHelipad: false,
          acUnits: [],
        },
      });
    }
  }

  // 2. Build Street Grid
  const streets: Street[] = [];

  // Avenues (vertical)
  avenuePositions.forEach((x, idx) => {
    const name = cfg.avenueNames[idx % cfg.avenueNames.length];
    streets.push({
      id: `ave_${idx}`,
      name,
      isAvenue: true,
      x1: x,
      y1: streetPositions[0] - streetWidth / 2,
      x2: x,
      y2: streetPositions[streetPositions.length - 1] + streetWidth / 2,
      width: streetWidth,
    });
  });

  // Cross-streets (horizontal)
  streetPositions.forEach((y, idx) => {
    const reverseIndex = streetPositions.length - 1 - idx;
    const streetNum = Math.min(220, Math.max(1, Math.round(reverseIndex * 1.1 + 1)));
    const name = getManhattanStreetName(streetNum);
    streets.push({
      id: `st_${idx}`,
      name,
      isAvenue: false,
      x1: avenuePositions[0] - streetWidth / 2,
      y1: y,
      x2: avenuePositions[avenuePositions.length - 1] + streetWidth / 2,
      y2: y,
      width: streetWidth,
    });
  });

  // 3. Intersections & Crosswalks
  const intersections: Intersection[] = [];
  const crosswalks: Crosswalk[] = [];

  avenuePositions.forEach((ax, aIdx) => {
    streetPositions.forEach((sy, sIdx) => {
      const reverseIndex = streetPositions.length - 1 - sIdx;
      const streetNum = Math.min(220, Math.max(1, Math.round(reverseIndex * 1.1 + 1)));
      intersections.push({
        x: ax,
        y: sy,
        radius: streetWidth / 2,
        avenueName: cfg.avenueNames[aIdx % cfg.avenueNames.length],
        streetName: getManhattanStreetName(streetNum),
      });

      crosswalks.push({
        x: ax - streetWidth / 2 + 6,
        y: sy - streetWidth / 2 - 14,
        width: streetWidth - 12,
        height: 12,
        horizontal: true,
      });
      crosswalks.push({
        x: ax - streetWidth / 2 + 6,
        y: sy + streetWidth / 2 + 2,
        width: streetWidth - 12,
        height: 12,
        horizontal: true,
      });
      crosswalks.push({
        x: ax - streetWidth / 2 - 14,
        y: sy - streetWidth / 2 + 6,
        width: 12,
        height: streetWidth - 12,
        horizontal: false,
      });
      crosswalks.push({
        x: ax + streetWidth / 2 + 2,
        y: sy - streetWidth / 2 + 6,
        width: 12,
        height: streetWidth - 12,
        horizontal: false,
      });
    });
  });

  // 4. Pre-built Obstacles: NYC Taxis, E-Bikes, and Cyclists
  const obstacles: Obstacle[] = [];
  let obsId = 0;

  // Vehicle specification helper: ~50% taxis, ~25% e-bikes, ~25% cyclists
  function getVehicleConfig(index: number): {
    vehicleType: 'taxi' | 'ebike' | 'cyclist';
    length: number;
    width: number;
    speedBonus: number;
  } {
    const mod = index % 4;
    if (mod === 1) {
      return { vehicleType: 'ebike', length: 36, width: 16, speedBonus: 0.3 };
    } else if (mod === 3) {
      return { vehicleType: 'cyclist', length: 32, width: 14, speedBonus: -0.2 };
    } else {
      return { vehicleType: 'taxi', length: 46, width: 24, speedBonus: 0 };
    }
  }

  // A. Avenue patrol vehicles: scaled by difficulty level
  for (let a = 0; a < avenuePositions.length; a++) {
    const ax = avenuePositions[a];
    const isStartAve = a === spawnAveIdx;
    const segments = Math.max(9, Math.floor(numStreetRows / 4));
    const segHeight = (streetPositions[streetPositions.length - 1] - streetPositions[0]) / segments;

    for (let s = 0; s < segments; s++) {
      const minY = streetPositions[0] + s * segHeight;
      const maxY = minY + segHeight;

      // Keep immediate spawn intersection and start avenue at bottom safe
      if (isStartAve && s >= segments - 2) {
        continue;
      }

      // In standard EASY mode (outside guide): only 1 vehicle every 3 segments
      if (!isGuideMode && difficulty === 'easy' && s % 3 !== 0) {
        continue;
      }

      // First vehicle in segment
      const goingDown = (a + s) % 2 === 0;
      const initialY1 = minY + (0.12 + ((a * 7 + s * 13) % 40) / 100) * (maxY - minY);
      const spec1 = getVehicleConfig(obsId);
      const baseAveSpeed = isGuideMode ? 1.4 : (difficulty === 'easy' ? 2.5 : difficulty === 'normal' ? 2.7 : 3.0);

      obstacles.push({
        id: `veh_ave_${obsId++}`,
        type: 'taxi',
        vehicleType: spec1.vehicleType,
        x: ax,
        y: initialY1,
        direction: goingDown ? 'DOWN' : 'UP',
        speed: (baseAveSpeed + ((a + s) % 3) * (isGuideMode ? 0.15 : 0.35) + spec1.speedBonus * (isGuideMode ? 0.2 : 1)) * speedMult,
        length: spec1.length,
        width: spec1.width,
        honking: false,
        honkCooldown: 0,
        minPos: minY,
        maxPos: maxY,
        avenueOrStreetName: cfg.avenueNames[a % cfg.avenueNames.length],
      });

      // Easy mode outside guide only needs 1 vehicle per active segment
      if (!isGuideMode && difficulty === 'easy') {
        continue;
      }

      // Normal mode: only spawn second vehicle on alternating segments (reduces obstacle density)
      if (!isGuideMode && difficulty === 'normal' && (a + s) % 2 === 1) {
        continue;
      }

      // Guide mode: spawn second vehicle on alternating segments so there are more obstacles to encounter!
      if (isGuideMode && (a + s) % 2 === 1) {
        continue;
      }

      // Second vehicle in segment (guide mode, normal, hard)
      const initialY2 = minY + (0.55 + ((a * 11 + s * 17) % 35) / 100) * (maxY - minY);
      const spec2 = getVehicleConfig(obsId);
      const baseSecSpeed = isGuideMode ? 1.3 : (difficulty === 'normal' ? 2.6 : 2.9);

      obstacles.push({
        id: `veh_ave_${obsId++}`,
        type: 'taxi',
        vehicleType: spec2.vehicleType,
        x: ax,
        y: initialY2,
        direction: goingDown ? 'DOWN' : 'UP',
        speed: (baseSecSpeed + ((a * 2 + s) % 3) * (isGuideMode ? 0.15 : 0.35) + spec2.speedBonus * (isGuideMode ? 0.2 : 1)) * speedMult,
        length: spec2.length,
        width: spec2.width,
        honking: false,
        honkCooldown: 0,
        minPos: minY,
        maxPos: maxY,
        avenueOrStreetName: cfg.avenueNames[a % cfg.avenueNames.length],
      });

      // Third vehicle on selected avenues for hard mode: only on every 4th segment
      if (!isGuideMode && difficulty === 'hard' && (a + s) % 4 === 0) {
        const initialY3 = minY + (0.8 + ((a * 5 + s * 9) % 15) / 100) * (maxY - minY);
        const spec3 = getVehicleConfig(obsId);

        obstacles.push({
          id: `veh_ave_${obsId++}`,
          type: 'taxi',
          vehicleType: spec3.vehicleType,
          x: ax,
          y: initialY3,
          direction: !goingDown ? 'DOWN' : 'UP',
          speed: (3.1 + (a % 3) * 0.3 + spec3.speedBonus) * speedMult,
          length: spec3.length,
          width: spec3.width,
          honking: false,
          honkCooldown: 0,
          minPos: minY,
          maxPos: maxY,
          avenueOrStreetName: cfg.avenueNames[a % cfg.avenueNames.length],
        });
      }
    }
  }

  // B. Cross-street patrol vehicles: scaled by difficulty
  for (let row = 0; row < streetPositions.length; row++) {
    // Avoid blocking the exact spawn intersection at bottom
    if (row === streetPositions.length - 1) continue;

    const sy = streetPositions[row];
    const goingRight = row % 2 === 0;
    const minX = avenuePositions[0];
    const maxX = avenuePositions[avenuePositions.length - 1];

    // In standard EASY mode (outside guide): only 1 out of 3 cross-streets has a vehicle
    if (!isGuideMode && difficulty === 'easy') {
      if (row % 3 !== 0) continue;
      const initialX1 = minX + (((row * 43) % 75) / 100) * (maxX - minX);
      const specS1 = getVehicleConfig(obsId);

      obstacles.push({
        id: `veh_st_${obsId++}`,
        type: 'taxi',
        vehicleType: specS1.vehicleType,
        x: initialX1,
        y: sy,
        direction: goingRight ? 'RIGHT' : 'LEFT',
        speed: (2.2 + (row % 3) * 0.3 + specS1.speedBonus) * speedMult,
        length: specS1.length,
        width: specS1.width,
        honking: false,
        honkCooldown: 0,
        minPos: minX,
        maxPos: maxX,
        avenueOrStreetName: getManhattanStreetName(Math.min(220, Math.max(1, Math.round((streetPositions.length - 1 - row) * 1.1 + 1)))),
      });
      continue;
    }

    // In NORMAL mode: leave every 4th cross-street empty for clear maneuverability
    if (!isGuideMode && difficulty === 'normal' && row % 4 === 0) {
      continue;
    }

    // Primary vehicle on this cross-street (guide mode, normal & hard)
    const initialX1 = minX + (((row * 43) % 75) / 100) * (maxX - minX);
    const specS1 = getVehicleConfig(obsId);
    const baseStSpeed = isGuideMode ? 1.3 : (difficulty === 'normal' ? 2.5 : 2.8);

    obstacles.push({
      id: `veh_st_${obsId++}`,
      type: 'taxi',
      vehicleType: specS1.vehicleType,
      x: initialX1,
      y: sy,
      direction: goingRight ? 'RIGHT' : 'LEFT',
      speed: (baseStSpeed + (row % 3) * (isGuideMode ? 0.15 : 0.3) + specS1.speedBonus * (isGuideMode ? 0.2 : 1)) * speedMult,
      length: specS1.length,
      width: specS1.width,
      honking: false,
      honkCooldown: 0,
      minPos: minX,
      maxPos: maxX,
      avenueOrStreetName: getManhattanStreetName(Math.min(220, Math.max(1, Math.round((streetPositions.length - 1 - row) * 1.1 + 1)))),
    });

    // Secondary vehicle on cross-street:
    // In Guide Mode: add secondary vehicle on alternating rows row % 2 === 0
    // In Normal: only on row % 3 === 0
    // In Hard: on row % 2 === 0
    const shouldSpawnSecondSt = isGuideMode
      ? row % 2 === 0
      : difficulty === 'normal'
      ? row % 3 === 0
      : row % 2 === 0;

    if (shouldSpawnSecondSt) {
      const initialX2 = minX + (((row * 89 + 50) % 80) / 100) * (maxX - minX);
      const specS2 = getVehicleConfig(obsId);
      const baseSecStSpeed = isGuideMode ? 1.25 : (difficulty === 'normal' ? 2.6 : 2.9);

      obstacles.push({
        id: `veh_st_${obsId++}`,
        type: 'taxi',
        vehicleType: specS2.vehicleType,
        x: initialX2,
        y: sy,
        direction: goingRight ? 'RIGHT' : 'LEFT',
        speed: (baseSecStSpeed + ((row + 1) % 3) * (isGuideMode ? 0.15 : 0.3) + specS2.speedBonus * (isGuideMode ? 0.2 : 1)) * speedMult,
        length: specS2.length,
        width: specS2.width,
        honking: false,
        honkCooldown: 0,
        minPos: minX,
        maxPos: maxX,
        avenueOrStreetName: getManhattanStreetName(Math.min(220, Math.max(1, Math.round((streetPositions.length - 1 - row) * 1.1 + 1)))),
      });
    }

    // Third vehicle for Hard cross-streets: only on row % 5 === 0
    if (!isGuideMode && difficulty === 'hard' && row % 5 === 0) {
      const initialX3 = minX + (((row * 17 + 25) % 65) / 100) * (maxX - minX);
      const specS3 = getVehicleConfig(obsId);

      obstacles.push({
        id: `veh_st_${obsId++}`,
        type: 'taxi',
        vehicleType: specS3.vehicleType,
        x: initialX3,
        y: sy,
        direction: !goingRight ? 'RIGHT' : 'LEFT',
        speed: (3.0 + ((row + 2) % 3) * 0.3 + specS3.speedBonus) * speedMult,
        length: specS3.length,
        width: specS3.width,
        honking: false,
        honkCooldown: 0,
        minPos: minX,
        maxPos: maxX,
        avenueOrStreetName: cfg.streetNames[row % cfg.streetNames.length],
      });
    }
  }

  // C. Crowd Clusters with prominent Crowd Icons (slows character down) - scaled by difficulty
  const palette = ['#334155', '#475569', '#1e293b', '#b45309', '#0369a1', '#15803d', '#3f3f46', '#7c2d12'];
  const hatPalette = ['#f59e0b', '#dc2626', '#3b82f6', '#10b981', '#f8fafc', '#18181b', '#d97706'];

  let crowdCount = 0;
  for (let row = 1; row < streetPositions.length - 2; row++) {
    for (let a = 0; a < avenuePositions.length; a++) {
      let isCrowdLoc = false;
      if (isGuideMode) {
        // More crowds in guide mode so players learn about crowd slow-down
        isCrowdLoc = (row * 7 + a * 13) % 11 === 0;
      } else if (difficulty === 'easy') {
        isCrowdLoc = (row * 7 + a * 13) % 29 === 0;
      } else if (difficulty === 'normal') {
        isCrowdLoc = (row * 7 + a * 13) % 24 === 0;
      } else {
        // hard
        isCrowdLoc = (row * 7 + a * 13) % 16 === 0;
      }

      // Keep starting intersection and immediate vicinity safe from crowds
      if (row >= streetPositions.length - 4 && Math.abs(a - spawnAveIdx) <= 1) {
        continue;
      }

      if (isCrowdLoc) {
        const ax = avenuePositions[a];
        const sy = streetPositions[row];

        // Offset slightly within intersection or near crosswalk corners
        const offsetMode = crowdCount % 4;
        let cx = ax;
        let cy = sy;
        if (offsetMode === 0) {
          cx = ax - 16;
          cy = sy - 10;
        } else if (offsetMode === 1) {
          cx = ax + 16;
          cy = sy + 10;
        } else if (offsetMode === 2) {
          cx = ax;
          cy = sy;
        } else {
          cx = ax + 14;
          cy = sy - 14;
        }

        let basePeople = 4;
        let crowdRadius = 26;
        if (difficulty === 'easy') {
          basePeople = 3;
          crowdRadius = 22;
        } else if (difficulty === 'hard') {
          basePeople = 5;
          crowdRadius = 28;
        }

        const numPeople = basePeople + (crowdCount % 2);
        const people: CrowdPerson[] = [];

        for (let p = 0; p < numPeople; p++) {
          const angle = (p / numPeople) * Math.PI * 2 + ((crowdCount * 17 + p) % 10) / 10;
          const dist = 5 + ((p * 13 + crowdCount) % 14);
          people.push({
            offsetX: Math.cos(angle) * dist,
            offsetY: Math.sin(angle) * dist,
            headRadius: 3.2 + (p % 3) * 0.4,
            color: palette[(crowdCount + p) % palette.length],
            hatColor: hatPalette[(crowdCount * 3 + p) % hatPalette.length],
            hasBackpack: (crowdCount + p) % 2 === 0,
          });
        }

        obstacles.push({
          id: `crowd_${crowdCount++}`,
          type: 'crowd',
          x: cx,
          y: cy,
          radius: crowdRadius,
          people,
          label: 'CROWD',
        });
      }
    }
  }

  const collectibles: CityMap['collectibles'] = [];

  return {
    width: totalWidth,
    height: totalHeight,
    blocks,
    streets,
    intersections,
    crosswalks,
    obstacles,
    collectibles,
    startPosition: {
      x: startX,
      y: startY,
    },
    startSectionName,
  };
}
