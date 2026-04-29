import { GameState } from './state.js';
import { CONFIG } from './config.js';

/**
 * 視圖渲染層 (Advanced Visual Mapper)
 * * 設計原則：
 * - 絕對唯讀：僅依賴 GameState 進行映射，嚴禁修改狀態。
 * - 動態驅動：利用 Date.now() 產生與 FPS 無關的流暢動畫。
 */
export function renderGame(ctx) {
  const size = CONFIG.tileSize;
  const now = Date.now();

  // 1. 清空畫布 (使用深邃的背景色)
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // 2. 渲染世界地圖 (牆壁與網格)
  _renderWorld(ctx, size);

  // 3. 渲染傳送門 (真門與假門)
  _renderPortals(ctx, size, now);

  // 4. 渲染活動實體 (幽靈與玩家)
  _renderEntities(ctx, size, now);

  // 5. 渲染視覺特效 (VFX)
  _renderVFX(ctx);
}

/**
 * 渲染地圖結構：增加網格感與牆壁質感
 */
function _renderWorld(ctx, size) {
  const { mapData } = GameState.world;

  for (let y = 0; y < mapData.length; y++) {
    const row = mapData[y];
    for (let x = 0; x < row.length; x++) {
      const px = x * size;
      const py = y * size;

      if (row[x] === 1) {
        // 牆壁：深色填充 + 內部框線增加立體感
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(px, py, size, size);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 2, py + 2, size - 4, size - 4);
      } else {
        // 通道：極淡的裝飾線
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, size, size);
      }
    }
  }
}

/**
 * 渲染傳送門：加入發光光暈與脈衝動畫
 */
function _renderPortals(ctx, size, now) {
  const { doors } = GameState.world;
  const halfSize = size / 2;
  // 產生 0.8 ~ 1.1 之間的收縮脈衝
  const pulse = Math.sin(now / 200) * 0.15 + 0.95;

  // 繪製假門 (科技藍)
  if (doors.decoys) {
    doors.decoys.forEach(door => {
      _drawPortal(ctx, 
        door.x * size + halfSize, 
        door.y * size + halfSize, 
        size * 0.35 * pulse, 
        'rgba(100, 200, 255, 0.9)', 
        'rgba(0, 50, 255, 0.2)'
      );
    });
  }

  // 繪製真門 (翡翠綠)
  if (doors.real && (doors.real.x !== 0 || doors.real.y !== 0)) {
    _drawPortal(ctx, 
      doors.real.x * size + halfSize, 
      doors.real.y * size + halfSize, 
      size * 0.35 * pulse, 
      'rgba(50, 255, 100, 0.9)', 
      'rgba(0, 150, 50, 0.2)'
    );
  }
}

/**
 * 渲染活動實體：升級幽靈造型與小精靈動畫
 */
function _renderEntities(ctx, size, now) {
  const halfSize = size / 2;

  // 1. 繪製幽靈 (Enemies)
  GameState.enemies.forEach(enemy => {
    _drawGhost(ctx, 
      enemy.position.x * size + halfSize, 
      enemy.position.y * size + halfSize, 
      size * 0.4, 
      now
    );
  });

  // 2. 繪製玩家 (Player)
  const { position } = GameState.player;
  _drawPlayer(ctx, 
    position.x * size + halfSize, 
    position.y * size + halfSize, 
    size * 0.38, 
    now
  );
}

/**
 * 內部工具：繪製發光傳送門
 */
function _drawPortal(ctx, cx, cy, radius, coreColor, glowColor) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  
  // 徑向漸層營造核心發光感
  const grad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
  grad.addColorStop(0, coreColor);
  grad.addColorStop(1, glowColor);
  
  ctx.fillStyle = grad;
  ctx.shadowColor = coreColor;
  ctx.shadowBlur = 15;
  ctx.fill();
  ctx.restore();
}

/**
 * 內部工具：繪製小精靈 (咬合動畫)
 */
function _drawPlayer(ctx, cx, cy, radius, now) {
  ctx.save();
  // 嘴巴開合角度動畫 (0 ~ 0.25 PI)
  const mouthOpen = (Math.sin(now / 120) * 0.12 + 0.12) * Math.PI;

  ctx.beginPath();
  ctx.arc(cx, cy, radius, mouthOpen, 2 * Math.PI - mouthOpen);
  ctx.lineTo(cx, cy);
  ctx.closePath();

  ctx.fillStyle = '#FFD700'; // 經典金黃
  ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.restore();
}

/**
 * 內部工具：繪製幽靈 (漂浮與裙擺動畫)
 */
function _drawGhost(ctx, cx, cy, radius, now) {
  ctx.save();
  // 幽靈上下漂浮位移
  const floatY = cy + Math.sin(now / 200) * 3;

  ctx.fillStyle = '#FF4500'; // 橘紅
  ctx.shadowColor = 'rgba(255, 69, 0, 0.6)';
  ctx.shadowBlur = 12;

  ctx.beginPath();
  // 圓頂
  ctx.arc(cx, floatY - radius * 0.1, radius, Math.PI, 0);
  // 身體與波浪裙擺
  ctx.lineTo(cx + radius, floatY + radius);
  ctx.lineTo(cx + radius * 0.4, floatY + radius * 0.7);
  ctx.lineTo(cx, floatY + radius);
  ctx.lineTo(cx - radius * 0.4, floatY + radius * 0.7);
  ctx.lineTo(cx - radius, floatY + radius);
  ctx.closePath();
  ctx.fill();

  // 繪製眼睛
  ctx.fillStyle = 'white';
  ctx.beginPath(); ctx.arc(cx - radius * 0.4, floatY - radius * 0.2, radius * 0.25, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + radius * 0.4, floatY - radius * 0.2, radius * 0.25, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'blue';
  ctx.beginPath(); ctx.arc(cx - radius * 0.4, floatY - radius * 0.2, radius * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + radius * 0.4, floatY - radius * 0.2, radius * 0.1, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

function _renderVFX(ctx) {
  // 預留給粒子系統使用
}