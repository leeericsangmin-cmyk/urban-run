import {
  StickmanPlayer,
  CityBlock,
  Street,
  Crosswalk,
  Obstacle,
  Particle,
  FloatingText,
} from '../types/game';

/**
 * 100% Procedural Canvas Rendering Engine for Urban Run.
 * Zero external raster images, sprite sheets, or hotlinked clip art.
 * Every character, obstacle, road, river, and hazard is drawn directly via HTML5 Canvas 2D methods.
 */

// Hand-drawn sketch line helper with subtle pencil wobble and overshooting corners
export function drawSketchLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string = '#242426',
  width: number = 1.5,
  overshoot: number = 0
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len === 0) return;

  const ux = dx / len;
  const uy = dy / len;

  const startX = x1 - ux * overshoot;
  const startY = y1 - uy * overshoot;
  const endX = x2 + ux * overshoot;
  const endY = y2 + uy * overshoot;

  const midX = (startX + endX) / 2 + Math.sin((x1 + y1) * 0.05) * 1.2;
  const midY = (startY + endY) / 2 + Math.cos((x2 + y2) * 0.05) * 1.2;

  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.quadraticCurveTo(midX, midY, endX, endY);
  ctx.stroke();
}

// Architectural hand-drawn rectangle with overshooting corners
export function drawSketchRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fillColor?: string,
  strokeColor: string = '#28282b',
  strokeWidth: number = 1.5,
  overshoot: number = 2
) {
  if (fillColor && fillColor !== 'transparent') {
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, w, h);
  }

  drawSketchLine(ctx, x, y, x + w, y, strokeColor, strokeWidth, overshoot);
  drawSketchLine(ctx, x + w, y, x + w, y + h, strokeColor, strokeWidth, overshoot);
  drawSketchLine(ctx, x + w, y + h, x, y + h, strokeColor, strokeWidth, overshoot);
  drawSketchLine(ctx, x, y + h, x, y, strokeColor, strokeWidth, overshoot);
}

// Hand-drawn sketch rounded rectangle
export function drawSketchRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  fillColor?: string,
  strokeColor: string = '#242426',
  strokeWidth: number = 1.5
) {
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, radius);
  } else {
    // Fallback for older browsers
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  }

  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}

// Hand-drawn sketch circle
export function drawSketchCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  fillColor?: string,
  strokeColor: string = '#242426',
  strokeWidth: number = 1.5
) {
  ctx.save();
  if (fillColor && fillColor !== 'transparent') {
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 1.6);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.98, Math.PI * 0.9, Math.PI * 2.3);
  ctx.stroke();

  ctx.restore();
}

// Render background drafting paper & isometric/cartographic grid
export function renderPaperBackground(
  ctx: CanvasRenderingContext2D,
  camX: number,
  camY: number,
  viewportW: number,
  viewportH: number
) {
  ctx.fillStyle = '#f8f6f0';
  ctx.fillRect(camX - viewportW / 2, camY - viewportH / 2, viewportW, viewportH);

  const gridSize = 40;
  const startX = Math.floor((camX - viewportW / 2) / gridSize) * gridSize;
  const endX = camX + viewportW / 2 + gridSize;
  const startY = Math.floor((camY - viewportH / 2) / gridSize) * gridSize;
  const endY = camY + viewportH / 2 + gridSize;

  ctx.save();
  ctx.strokeStyle = 'rgba(70, 90, 120, 0.04)';
  ctx.lineWidth = 0.8;

  ctx.beginPath();
  for (let x = startX; x <= endX; x += gridSize) {
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
  }
  for (let y = startY; y <= endY; y += gridSize) {
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
  }
  ctx.stroke();
  ctx.restore();
}

// Render streets and avenues (roadways & crosswalks) with viewport culling
export function renderStreets(
  ctx: CanvasRenderingContext2D,
  streets: Street[],
  crosswalks: Crosswalk[],
  camX?: number,
  camY?: number,
  viewW?: number,
  viewH?: number
) {
  const hasViewport = camX !== undefined && camY !== undefined && viewW !== undefined && viewH !== undefined;
  const margin = 140;
  const vLeft = hasViewport ? camX! - viewW! / 2 - margin : -Infinity;
  const vRight = hasViewport ? camX! + viewW! / 2 + margin : Infinity;
  const vTop = hasViewport ? camY! - viewH! / 2 - margin : -Infinity;
  const vBottom = hasViewport ? camY! + viewH! / 2 + margin : Infinity;

  streets.forEach((st) => {
    if (st.isAvenue) {
      if (st.x1 + st.width / 2 < vLeft || st.x1 - st.width / 2 > vRight) return;
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.fillRect(st.x1 - st.width / 2, st.y1, st.width, st.y2 - st.y1);
      drawSketchLine(ctx, st.x1 - st.width / 2, st.y1, st.x1 - st.width / 2, st.y2, '#38383c', 1.5);
      drawSketchLine(ctx, st.x1 + st.width / 2, st.y1, st.x1 + st.width / 2, st.y2, '#38383c', 1.5);

      ctx.strokeStyle = 'rgba(60, 60, 65, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([8, 12]);
      ctx.beginPath();
      ctx.moveTo(st.x1, st.y1);
      ctx.lineTo(st.x1, st.y2);
      ctx.stroke();
      ctx.restore();
    } else {
      if (st.y1 + st.width / 2 < vTop || st.y1 - st.width / 2 > vBottom) return;
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.fillRect(st.x1, st.y1 - st.width / 2, st.x2 - st.x1, st.width);
      drawSketchLine(ctx, st.x1, st.y1 - st.width / 2, st.x2, st.y1 - st.width / 2, '#38383c', 1.5);
      drawSketchLine(ctx, st.x1, st.y1 + st.width / 2, st.x2, st.y1 + st.width / 2, '#38383c', 1.5);

      ctx.strokeStyle = 'rgba(60, 60, 65, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([8, 12]);
      ctx.beginPath();
      ctx.moveTo(st.x1, st.y1);
      ctx.lineTo(st.x2, st.y1);
      ctx.stroke();
      ctx.restore();
    }
  });

  crosswalks.forEach((cw) => {
    if (cw.x + cw.width < vLeft || cw.x > vRight || cw.y + cw.height < vTop || cw.y > vBottom) {
      return;
    }
    ctx.save();
    ctx.strokeStyle = 'rgba(40, 40, 45, 0.35)';
    ctx.lineWidth = 2;
    if (cw.horizontal) {
      const stripes = 6;
      const step = cw.width / stripes;
      for (let i = 0; i <= stripes; i++) {
        const sx = cw.x + i * step;
        ctx.beginPath();
        ctx.moveTo(sx, cw.y);
        ctx.lineTo(sx, cw.y + cw.height);
        ctx.stroke();
      }
    } else {
      const stripes = 6;
      const step = cw.height / stripes;
      for (let i = 0; i <= stripes; i++) {
        const sy = cw.y + i * step;
        ctx.beginPath();
        ctx.moveTo(cw.x, sy);
        ctx.lineTo(cw.x + cw.width, sy);
        ctx.stroke();
      }
    }
    ctx.restore();
  });
}

// Render surrounding perimeter water hazards (Left, Right, and Bottom borders)
export function renderSurroundingRivers(
  ctx: CanvasRenderingContext2D,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  now: number,
  camX?: number,
  camY?: number,
  viewW?: number,
  viewH?: number
) {
  const hasViewport = camX !== undefined && camY !== undefined && viewW !== undefined && viewH !== undefined;
  const margin = 200;
  const vLeft = hasViewport ? camX! - viewW! / 2 - margin : -Infinity;
  const vRight = hasViewport ? camX! + viewW! / 2 + margin : Infinity;
  const vTop = hasViewport ? camY! - viewH! / 2 - margin : -Infinity;
  const vBottom = hasViewport ? camY! + viewH! / 2 + margin : Infinity;

  const showLeft = minX >= vLeft - 450 && minX <= vRight + 50;
  const showRight = maxX >= vLeft - 50 && maxX <= vRight + 450;
  const showBottom = maxY >= vTop - 50 && maxY <= vBottom + 450;

  if (!showLeft && !showRight && !showBottom) return;

  ctx.save();

  const riverColor = 'rgba(215, 232, 245, 0.75)';
  const deepRiverColor = 'rgba(180, 210, 230, 0.88)';
  const shorelineColor = '#242428';
  const extend = 420;

  // 1. LEFT WATERWAY (Hudson River)
  if (showLeft) {
    ctx.fillStyle = riverColor;
    ctx.fillRect(minX - extend, minY - extend, extend, maxY - minY + extend * 2);

    const leftGrad = ctx.createLinearGradient(minX, 0, minX - 120, 0);
    leftGrad.addColorStop(0, 'rgba(190, 220, 235, 0.3)');
    leftGrad.addColorStop(1, deepRiverColor);
    ctx.fillStyle = leftGrad;
    ctx.fillRect(minX - extend, minY - extend, extend, maxY - minY + extend * 2);

    drawSketchLine(ctx, minX, minY - extend, minX, maxY, shorelineColor, 3.5, 4);
    drawSketchLine(ctx, minX - 3, minY - extend, minX - 3, maxY, '#4a4a50', 1.5, 2);

    ctx.save();
    ctx.fillStyle = 'rgba(70, 100, 140, 0.65)';
    ctx.font = 'bold 13px "Patrick Hand", cursive, sans-serif';
    ctx.textAlign = 'center';
    ctx.translate(minX - 45, (minY + maxY) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('~ ~ HUDSON RIVER (DANGER) ~ ~', 0, 0);
    ctx.restore();
  }

  // 2. RIGHT WATERWAY (East River)
  if (showRight) {
    ctx.fillStyle = riverColor;
    ctx.fillRect(maxX, minY - extend, extend, maxY - minY + extend * 2);

    const rightGrad = ctx.createLinearGradient(maxX, 0, maxX + 120, 0);
    rightGrad.addColorStop(0, 'rgba(190, 220, 235, 0.3)');
    rightGrad.addColorStop(1, deepRiverColor);
    ctx.fillStyle = rightGrad;
    ctx.fillRect(maxX, minY - extend, extend, maxY - minY + extend * 2);

    drawSketchLine(ctx, maxX, minY - extend, maxX, maxY, shorelineColor, 3.5, 4);
    drawSketchLine(ctx, maxX + 3, minY - extend, maxX + 3, maxY, '#4a4a50', 1.5, 2);

    ctx.save();
    ctx.fillStyle = 'rgba(70, 100, 140, 0.65)';
    ctx.font = 'bold 13px "Patrick Hand", cursive, sans-serif';
    ctx.textAlign = 'center';
    ctx.translate(maxX + 45, (minY + maxY) / 2);
    ctx.rotate(Math.PI / 2);
    ctx.fillText('~ ~ EAST RIVER (DANGER) ~ ~', 0, 0);
    ctx.restore();
  }

  // 3. BOTTOM WATERWAY (Harbor Bay)
  if (showBottom) {
    ctx.fillStyle = riverColor;
    ctx.fillRect(minX - extend, maxY, maxX - minX + extend * 2, extend);

    const bottomGrad = ctx.createLinearGradient(0, maxY, 0, maxY + 140);
    bottomGrad.addColorStop(0, 'rgba(190, 220, 235, 0.3)');
    bottomGrad.addColorStop(1, deepRiverColor);
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(minX - extend, maxY, maxX - minX + extend * 2, extend);

    drawSketchLine(ctx, minX - 3, maxY, maxX + 3, maxY, shorelineColor, 3.5, 4);
    drawSketchLine(ctx, minX - 3, maxY + 3, maxX + 3, maxY + 3, '#4a4a50', 1.5, 2);
  }

  ctx.restore();
}

// Render City Blocks: Minimalist square architectural drafting blocks with no proprietary textures
export function renderCityBlocks(
  ctx: CanvasRenderingContext2D,
  blocks: CityBlock[],
  camX?: number,
  camY?: number,
  viewW?: number,
  viewH?: number
) {
  const hasViewport = camX !== undefined && camY !== undefined && viewW !== undefined && viewH !== undefined;
  const margin = 100;
  const vLeft = hasViewport ? camX! - viewW! / 2 - margin : -Infinity;
  const vRight = hasViewport ? camX! + viewW! / 2 + margin : Infinity;
  const vTop = hasViewport ? camY! - viewH! / 2 - margin : -Infinity;
  const vBottom = hasViewport ? camY! + viewH! / 2 + margin : Infinity;

  blocks.forEach((block) => {
    if (block.x + block.width < vLeft || block.x > vRight || block.y + block.height < vTop || block.y > vBottom) {
      return;
    }
    // Subtle architectural drop shadow
    ctx.fillStyle = 'rgba(45, 45, 48, 0.08)';
    ctx.fillRect(block.x + 3, block.y + 3, block.width, block.height);

    // Hand-drawn white card block
    drawSketchRect(
      ctx,
      block.x,
      block.y,
      block.width,
      block.height,
      '#ffffff',
      '#28282b',
      1.8,
      2
    );
  });
}

/**
 * 100% Procedural Urban Obstacle Renderer:
 * - Taxis: Simple rounded rectangles with high-contrast yellow fill, black pencil outline, and small generic roof sign.
 * - Bicycles/Scooters: Minimalist two-wheel line sketches with handlebars.
 * - Crowds: Clusters of small circular sketch heads with simple shoulder outlines.
 * Zero external images, zero trademarked logos or municipal emblems.
 */
export function renderObstacles(
  ctx: CanvasRenderingContext2D,
  obstacles: Obstacle[],
  isEraserMode: boolean,
  now: number,
  camX?: number,
  camY?: number,
  viewW?: number,
  viewH?: number
) {
  const hasViewport = camX !== undefined && camY !== undefined && viewW !== undefined && viewH !== undefined;
  const margin = 140;
  const vLeft = hasViewport ? camX! - viewW! / 2 - margin : -Infinity;
  const vRight = hasViewport ? camX! + viewW! / 2 + margin : Infinity;
  const vTop = hasViewport ? camY! - viewH! / 2 - margin : -Infinity;
  const vBottom = hasViewport ? camY! + viewH! / 2 + margin : Infinity;

  obstacles.forEach((obs) => {
    if (obs.x + 80 < vLeft || obs.x - 80 > vRight || obs.y + 80 < vTop || obs.y - 80 > vBottom) {
      return;
    }

    if (obs.type === 'taxi') {
      ctx.save();
      ctx.translate(obs.x, obs.y);

      let angle = 0;
      if (obs.direction === 'DOWN') angle = Math.PI / 2;
      if (obs.direction === 'LEFT') angle = Math.PI;
      if (obs.direction === 'UP') angle = -Math.PI / 2;
      ctx.rotate(angle);

      const vehicleType = obs.vehicleType || 'taxi';
      const hw = obs.length / 2;
      const hh = obs.width / 2;

      if (vehicleType === 'ebike' || vehicleType === 'cyclist') {
        // --- 1. BICYCLES / SCOOTERS: Minimalist two-wheel line sketches with handlebars ---
        // Soft ground shadow
        ctx.fillStyle = 'rgba(40, 40, 45, 0.12)';
        ctx.beginPath();
        ctx.ellipse(0, 2, hw + 1, hh - 1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Front and rear circular wheels (pure line sketch)
        const frontWheelX = hw * 0.6;
        const rearWheelX = -hw * 0.7;
        const wheelRadius = 4.2;

        // Front wheel
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(frontWheelX, 0, wheelRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Rear wheel
        ctx.beginPath();
        ctx.arc(rearWheelX, 0, wheelRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Minimalist bicycle frame lines
        const frameColor = vehicleType === 'ebike' ? '#0284c7' : '#16a34a';
        drawSketchLine(ctx, rearWheelX, 0, 0, 0, frameColor, 2.2);
        drawSketchLine(ctx, 0, 0, frontWheelX, 0, frameColor, 2.2);

        // Minimalist handlebars line sketch
        const handleX = frontWheelX - 3;
        drawSketchLine(ctx, handleX, -7, handleX, 7, '#1e293b', 2.0);

        // Rider (seen from aerial view: minimalist stickman torso, circle head, line arms)
        // Line arms reaching to handlebars
        drawSketchLine(ctx, -2, -4, handleX, -6, '#1e293b', 1.6);
        drawSketchLine(ctx, -2, 4, handleX, 6, '#1e293b', 1.6);

        // Torso / shoulder line
        drawSketchLine(ctx, -3, -4, -3, 4, '#1e293b', 2.2);

        // Circular sketch head
        drawSketchCircle(ctx, -1, 0, 4.2, '#facc15', '#242426', 1.4);

        // Bell sound waves if alerting
        if (obs.honking) {
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 1.4;
          for (let w = 1; w <= 3; w++) {
            ctx.beginPath();
            ctx.arc(frontWheelX + w * 5, 0, w * 4.5, -Math.PI / 3, Math.PI / 3);
            ctx.stroke();
          }
        }
      } else {
        // --- 2. TAXIS: Simple rounded rectangles with high-contrast yellow fill, black pencil outline, and small generic roof sign ---
        const yellowFill = '#ffd700'; // High-contrast yellow fill
        const pencilOutline = '#242426'; // Black pencil outline

        // Soft ground shadow
        ctx.fillStyle = 'rgba(40, 40, 45, 0.15)';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(-hw + 2, -hh + 3, obs.length, obs.width, 4);
        } else {
          ctx.rect(-hw + 2, -hh + 3, obs.length, obs.width);
        }
        ctx.fill();

        // High-contrast yellow rounded rectangle with black pencil outline
        drawSketchRoundRect(ctx, -hw, -hh, obs.length, obs.width, 4, yellowFill, pencilOutline, 1.8);

        // Windshields (front and rear)
        drawSketchRoundRect(ctx, hw * 0.15, -hh + 3.5, hw * 0.35, obs.width - 7, 2, '#e0f2fe', pencilOutline, 1.2);
        drawSketchRoundRect(ctx, -hw * 0.65, -hh + 3.5, hw * 0.3, obs.width - 7, 2, '#e0f2fe', pencilOutline, 1.2);

        // Small generic roof sign (clean geometric box with subtle generic label, zero trademarks)
        const signW = 12;
        const signH = 7;
        drawSketchRoundRect(ctx, -signW / 2, -signH / 2, signW, signH, 1.5, '#ffffff', pencilOutline, 1.2);

        ctx.fillStyle = '#ea580c';
        ctx.font = 'bold 5px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TAXI', 0, 0.5);

        // Horn sound waves if honking
        if (obs.honking) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.5;
          for (let w = 1; w <= 3; w++) {
            ctx.beginPath();
            ctx.arc(hw + w * 6, 0, w * 5, -Math.PI / 3, Math.PI / 3);
            ctx.stroke();
          }
        }
      }

      ctx.restore();
    } else if (obs.type === 'crowd') {
      // --- 3. CROWDS: Clusters of small circular sketch heads with simple shoulder outlines ---
      ctx.save();
      ctx.translate(obs.x, obs.y);

      const r = obs.radius || 26;

      // Soft circular ground commotion / footprint hatch lines
      ctx.fillStyle = 'rgba(40, 40, 45, 0.06)';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Dashed sketch boundary for the slow zone
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Clusters of small circular sketch heads with simple shoulder outlines
      obs.people.forEach((person, idx) => {
        const px = person.offsetX;
        const py = person.offsetY;
        const hr = person.headRadius || 3.5;

        // Ground shadow under individual
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.beginPath();
        ctx.ellipse(px + 1, py + 1.5, hr + 2, hr + 1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Simple shoulder outline (procedural bezier or ellipse shoulder line)
        ctx.strokeStyle = '#242426';
        ctx.fillStyle = person.color || '#334155';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        // Shoulder arc / ellipse
        ctx.ellipse(px, py, hr * 1.5, hr * 0.9, idx * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Circular sketch head with black pencil outline
        drawSketchCircle(ctx, px, py, hr, '#ffffff', '#242426', 1.4);

        // Simple sketch hair flick or eye dots
        const flickAngle = idx * 1.1;
        drawSketchLine(
          ctx,
          px + Math.cos(flickAngle) * (hr * 0.6),
          py + Math.sin(flickAngle) * (hr * 0.6),
          px + Math.cos(flickAngle) * (hr + 2.5),
          py + Math.sin(flickAngle) * (hr + 2.5),
          '#242426',
          1.1
        );
      });

      // Sketched warning label
      drawSketchRect(ctx, -22, r - 5, 44, 13, '#ffffff', '#242426', 1.2, 1);
      ctx.fillStyle = '#ea580c';
      ctx.font = 'bold 7.5px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CROWD · SLOW', 0, r + 1.5);

      ctx.restore();
    }
  });
}

/**
 * Procedural Stickman Player (Aerial View):
 * Rendered strictly with a circle head and line limbs via HTML5 Canvas 2D methods.
 */
export function renderAerialStickman(
  ctx: CanvasRenderingContext2D,
  player: StickmanPlayer,
  now: number
) {
  ctx.save();
  ctx.translate(player.x, player.y);

  let targetAngle = -Math.PI / 2;
  switch (player.direction) {
    case 'UP':
      targetAngle = -Math.PI / 2;
      break;
    case 'DOWN':
      targetAngle = Math.PI / 2;
      break;
    case 'LEFT':
      targetAngle = Math.PI;
      break;
    case 'RIGHT':
      targetAngle = 0;
      break;
  }
  ctx.rotate(targetAngle);

  // Invincibility flashing
  if (player.invincibleTimer > 0 && Math.floor(now / 70) % 2 === 0) {
    ctx.restore();
    return;
  }

  const walkPhase = player.walkCycle;
  const legSwing = Math.sin(walkPhase) * 11;
  const armSwing = -Math.sin(walkPhase) * 9;

  // 1. Soft procedural shadow under player
  ctx.save();
  ctx.fillStyle = 'rgba(40, 40, 45, 0.15)';
  ctx.beginPath();
  ctx.ellipse(2, 3, 10, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 1B. Subtle hand-drawn graphite speed streaks while holding/sliding to boost
  if (player.speedBoostTimer > 0 && player.slowTimer <= 0) {
    const streakPulse = (now * 0.03) % 4;
    drawSketchLine(ctx, -11 - streakPulse, -7, -20 - streakPulse, -7, 'rgba(43, 43, 46, 0.45)', 1.4);
    drawSketchLine(ctx, -13 - streakPulse, 0, -24 - streakPulse, 0, 'rgba(43, 43, 46, 0.55)', 1.6);
    drawSketchLine(ctx, -11 - streakPulse, 7, -20 - streakPulse, 7, 'rgba(43, 43, 46, 0.45)', 1.4);
  }

  // 2. Line limbs: Legs (swinging line limbs extending to circular feet)
  // Left leg
  drawSketchLine(ctx, -2, -5, -2 + legSwing, -10, '#242426', 2.0);
  ctx.fillStyle = '#242426';
  ctx.beginPath();
  ctx.arc(-2 + legSwing + 2, -10, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Right leg
  drawSketchLine(ctx, -2, 5, -2 - legSwing, 10, '#242426', 2.0);
  ctx.beginPath();
  ctx.arc(-2 - legSwing + 2, 10, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // 3. Line limbs: Arms (swinging line limbs extending to circular hands)
  // Left arm
  drawSketchLine(ctx, 3, -6, 3 + armSwing, -11, '#242426', 2.0);
  ctx.beginPath();
  ctx.arc(3 + armSwing + 1, -11, 2, 0, Math.PI * 2);
  ctx.fill();

  // Right arm
  drawSketchLine(ctx, 3, 6, 3 - armSwing, 11, '#242426', 2.0);
  ctx.beginPath();
  ctx.arc(3 - armSwing + 1, 11, 2, 0, Math.PI * 2);
  ctx.fill();

  // 4. Torso and shoulder lines
  drawSketchLine(ctx, 3, -6, 3, 6, '#242426', 2.5); // Shoulders
  drawSketchLine(ctx, 3, 0, -3, 0, '#242426', 2.5); // Spine/torso

  // 5. Circle head (drawn procedurally)
  drawSketchCircle(ctx, 2, 0, 7.5, '#ffffff', '#242426', 2.2);

  // Hair lines (spiky pencil tufts on back of head)
  drawSketchLine(ctx, -3, -4, -6, -6, '#242426', 1.2);
  drawSketchLine(ctx, -4, 0, -7, 0, '#242426', 1.2);
  drawSketchLine(ctx, -3, 4, -6, 6, '#242426', 1.2);

  // Face nose / sight dot indicating direction of sight
  ctx.fillStyle = '#242426';
  ctx.beginPath();
  ctx.arc(9.5, 0, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Sweat drop if patience is low (< 30)
  if (player.hp < 30) {
    ctx.save();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.2;
    const drop = (now * 0.01) % 6;
    ctx.beginPath();
    ctx.arc(0, -12 - drop, 1.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Visual slow-down resistance indicator when pushing through crowds
  if (player.slowTimer > 0) {
    ctx.save();
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 1.2;
    const offset = Math.sin(now * 0.02) * 2;
    ctx.beginPath();
    ctx.moveTo(-14, -6 + offset);
    ctx.lineTo(-19, -4 + offset);
    ctx.moveTo(-14, 6 - offset);
    ctx.lineTo(-19, 4 - offset);
    ctx.stroke();

    ctx.fillStyle = '#ea580c';
    ctx.font = 'bold 7px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('SLOWED', 0, -13);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Bottom Pursuit Hazard (Rainstorm / Ink Wave):
 * Rendered purely through mathematical sinusoidal or bezier curves with an ink-wash/pencil-hatch gradient fill.
 */
export function renderCreepingBottomFog(
  ctx: CanvasRenderingContext2D,
  camX: number,
  camY: number,
  viewportW: number,
  viewportH: number,
  fogY: number,
  playerY: number,
  now: number
) {
  const left = camX - viewportW / 2;
  const right = camX + viewportW / 2;
  const bottom = camY + viewportH / 2;
  const top = camY - viewportH / 2;

  // Only render if hazard is near or inside the current viewport
  if (fogY > bottom + 200) return;

  const fogRenderTop = Math.max(top - 50, fogY - 45);
  const fogRenderBottom = Math.max(bottom + 100, fogY + 120);

  ctx.save();

  // 1. Ink-wash gradient fill: from translucent atmospheric wash to dense graphite/charcoal
  const grad = ctx.createLinearGradient(0, fogY - 35, 0, fogY + 110);
  grad.addColorStop(0, 'rgba(248, 246, 240, 0)');
  grad.addColorStop(0.2, 'rgba(160, 160, 170, 0.22)');
  grad.addColorStop(0.45, 'rgba(100, 100, 112, 0.65)');
  grad.addColorStop(0.75, 'rgba(50, 50, 58, 0.92)');
  grad.addColorStop(1, 'rgba(30, 30, 36, 0.98)');

  ctx.fillStyle = grad;
  ctx.fillRect(left, fogRenderTop, viewportW, fogRenderBottom - fogRenderTop);

  // 2. Diagonal pencil-hatch shading inside the body of the wave
  const hatchSpacing = 28;
  const hatchStartY = Math.max(top, fogY);
  const hatchEndY = fogRenderBottom;
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  for (let y = hatchStartY; y <= hatchEndY; y += hatchSpacing) {
    ctx.moveTo(left, y);
    ctx.lineTo(right, y + 40);
  }
  ctx.stroke();
  ctx.restore();

  // 3. Mathematical sinusoidal & bezier curve storm wave front:
  // Using pure mathematical bezier curves and sine calculations along the front (fogY)
  const waveSegmentWidth = 48;
  const startX = Math.floor(left / waveSegmentWidth) * waveSegmentWidth - waveSegmentWidth;
  const endX = right + waveSegmentWidth * 2;

  // Secondary ink contour curve
  ctx.save();
  ctx.strokeStyle = 'rgba(75, 85, 99, 0.45)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let x = startX; x <= endX; x += waveSegmentWidth) {
    // Pure mathematical sinusoidal displacement
    const sineBump = Math.sin(x * 0.015) * 5 + Math.cos(x * 0.038) * 4;
    const cy = fogY + 6 + sineBump;
    ctx.moveTo(x - waveSegmentWidth * 0.5, cy + 4);
    ctx.bezierCurveTo(
      x - waveSegmentWidth * 0.2,
      cy - 12,
      x + waveSegmentWidth * 0.2,
      cy - 12,
      x + waveSegmentWidth * 0.5,
      cy + 4
    );
  }
  ctx.stroke();
  ctx.restore();

  // Primary charcoal storm wave bezier curve
  ctx.save();
  ctx.strokeStyle = '#2b2b2e';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let x = startX; x <= endX; x += waveSegmentWidth) {
    const sineBump = Math.sin(x * 0.02) * 6 + Math.cos(x * 0.045) * 3;
    const cy = fogY + sineBump;
    ctx.moveTo(x - waveSegmentWidth * 0.5, cy + 5);
    ctx.bezierCurveTo(
      x - waveSegmentWidth * 0.2,
      cy - 14,
      x + waveSegmentWidth * 0.2,
      cy - 14,
      x + waveSegmentWidth * 0.5,
      cy + 5
    );
  }
  ctx.stroke();
  ctx.restore();

  // 4. If within danger distance (180 px), render mathematical warning ripple line
  const distanceToPlayer = fogY - playerY;
  if (distanceToPlayer < 180) {
    ctx.save();
    const alertPulse = Math.sin(now * 0.012) * 0.5 + 0.5;
    ctx.strokeStyle = `rgba(220, 38, 38, ${0.25 + alertPulse * 0.45})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(left, fogY - 12);
    ctx.lineTo(right, fogY - 12);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

// Render dynamic procedural particles
export function renderParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  particles.forEach((p) => {
    const alpha = 1 - p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);

    if (p.type === 'bubble') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1.4;
      ctx.fillStyle = 'rgba(224, 242, 254, 0.4)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  });
}

// Render floating popup texts
export function renderFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[]) {
  texts.forEach((ft) => {
    const alpha = 1 - ft.life / ft.maxLife;
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.font = 'bold 16px "Patrick Hand", cursive, sans-serif';
    ctx.fillStyle = ft.color;
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  });
}
