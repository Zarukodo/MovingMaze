// systems/doors.js
import { GameState } from '../state.js';
import { CONFIG } from '../config.js';

/**
 * 傳送門系統 (Door/Portal System)
 * * 設計原則：
 * - 空間驗證：生成位置必須為空地且遠離玩家。
 * - 時間解耦：利用主迴圈傳入的 timestamp 進行假門輪替排程。
 */

let lastDoorRotationTime = 0;

/**
 * 創世初始化：生成 1 扇真門與初始假門
 */
export function initDoors() {
  const { mapData } = GameState.world;
  const { player } = GameState;

  // 1. 生成唯一的真門 (Real Door)
  const realPos = _findEmptySpot(mapData, player.position, []);
  GameState.world.doors.real = { x: realPos.x, y: realPos.y };

  // 2. 生成初始假門
  _regenerateDecoys();
}

/**
 * 每幀更新：檢查時間戳是否達到輪替週期
 * @param {number} timestamp - 來自 requestAnimationFrame
 */
export function updateDoors(timestamp) {
  if (!GameState.system.isRunning) return;

  // 檢查是否達到輪替門檻
  if (timestamp - lastDoorRotationTime > CONFIG.doorRotationIntervalMs) {
    _regenerateDecoys();
    lastDoorRotationTime = timestamp;
  }
}

/**
 * 內部邏輯：重新生成所有假門位置
 */
function _regenerateDecoys() {
  // 【修復關鍵】：doors 是屬於 world 層級的屬性
  const { mapData, doors } = GameState.world; 
  const { player } = GameState;
  const newDecoys = [];

  for (let i = 0; i < CONFIG.decoyDoorCount; i++) {
    // 傳入目前已有的門座標(包含真門與已生成的假門)，避免重疊
    const existingDoors = [doors.real, ...newDecoys];
    const pos = _findEmptySpot(mapData, player.position, existingDoors);
    newDecoys.push({ x: pos.x, y: pos.y });
  }

  // 寫入大腦
  GameState.world.doors.decoys = newDecoys;
}

/**
 * 輔助函式：尋找合法的空地 (避開牆壁、玩家與其他門)
 */
function _findEmptySpot(map, playerPos, occupiedCoords) {
  const height = map.length;
  const width = map[0].length;
  let attempts = 0;

  while (attempts < 500) {
    const rx = Math.floor(Math.random() * width);
    const ry = Math.floor(Math.random() * height);

    // 檢查 1：不能是牆壁 (map[ry][rx] === 1)
    if (map[ry][rx] === 1) { attempts++; continue; }

    // 檢查 2：不能在玩家腳下
    if (rx === playerPos.x && ry === playerPos.y) { attempts++; continue; }

    // 檢查 3：不能與已有的門重疊
    const isOverlapping = occupiedCoords.some(d => d && d.x === rx && d.y === ry);
    if (isOverlapping) { attempts++; continue; }

    return { x: rx, y: ry };
  }
  
  // 兜底：若找太久找不到，隨機回傳一處
  return { x: 0, y: 0 };
}