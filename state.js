/**
 * 遊戲全域狀態樹 (Single Source of Truth)
 * * 設計原則：
 * - 保持為純粹的資料結構 (Plain Old JavaScript Object)，確保狀態可完全序列化。
 * - 隔離邏輯層與資料層，使外部 Controller 能夠以決定論 (Deterministic) 方式更新狀態。
 */
import { CONFIG } from './config.js';

export const GameState = {
  // 系統生命週期層：提供主迴圈與子系統運作的基礎開關
  system: {
    isRunning: true,
    status: 'PLAYING' // 可選值：'PLAYING', 'WIN', 'LOSE'
  },

  // 物理與環境層：管理空間網格以及所有與地圖綁定的動態/靜態實體
  world: {
    mapData: [],
    vfx: [],
    hazards: [],
    doors: {
      decoys: [],
      real: { x: 0, y: 0 }
    }
  },

  // 玩家代理層：追蹤唯一可控實體的空間狀態與裝備記憶
  player: {
    id: "player_1",
    position: { x: 1, y: 1 },
    velocity: { dx: 0, dy: 0 },
    moveSpeedMs: CONFIG.playerMoveSpeedMs,
    skills: {
      currentEquipped: 'laser',
      idleStartTime: 0
    }
  },

  // 敵對代理層：集中管理所有驅動 AI 行為的實體資料池
  enemies: []
};

console.log("2. 主角靈魂 (state.js) 載入成功！");