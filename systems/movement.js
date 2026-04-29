// systems/movement.js
import { GameState } from '../state.js';
import { CONFIG } from '../config.js';

/**
 * 物理運算與移動系統 (Movement System)
 */

let lastMoveTime = 0;

/**
 * [模式 B] 連續滑行移動 (Continuous Movement) - 預設啟用
 */
export function updateContinuousMovement(timestamp) {
  // 【修復 3】加入狀態防護：只有 PLAYING 狀態才能移動
  if (!GameState.system.isRunning || GameState.system.status !== 'PLAYING') return;

  const { velocity, position, moveSpeedMs } = GameState.player;
  if (velocity.dx === 0 && velocity.dy === 0) return;

  // 時間節流閥
  if (timestamp - lastMoveTime < moveSpeedMs) return;
  lastMoveTime = timestamp;

  const width = CONFIG.mapWidth;
  const height = CONFIG.mapHeight;
  const { mapData, doors } = GameState.world; // 確保提取 doors

  // 空間拓撲穿越運算
  const nextX = (position.x + velocity.dx + width) % width;
  const nextY = (position.y + velocity.dy + height) % height;

  // 剛體碰撞偵測
  if (mapData[nextY][nextX] === 1) {
    GameState.player.velocity = { dx: 0, dy: 0 };
    return;
  }

  // 狀態覆寫：落實移動
  GameState.player.position = { x: nextX, y: nextY };

  // 【修復 1】補上門的碰撞判定！
  _checkDoorCollision(GameState.player.position, doors);
}

/**
 * [模式 A] 單步觸發移動 (Step Movement)
 */
export function updateStepMovement(timestamp) { // 【修復 2】補上 timestamp 參數
  if (!GameState.system.isRunning || GameState.system.status !== 'PLAYING') return;

  const { velocity, position, moveSpeedMs } = GameState.player;
  if (velocity.dx === 0 && velocity.dy === 0) return;

  if (timestamp - lastMoveTime < moveSpeedMs) return;
  lastMoveTime = timestamp;

  const width = CONFIG.mapWidth;
  const height = CONFIG.mapHeight;
  const { mapData, doors } = GameState.world;

  const nextX = (position.x + velocity.dx + width) % width;
  const nextY = (position.y + velocity.dy + height) % height;

  if (mapData[nextY][nextX] === 1) {
    GameState.player.velocity = { dx: 0, dy: 0 };
    return;
  }

  GameState.player.position = { x: nextX, y: nextY };

  // 門碰撞判定
  _checkDoorCollision(GameState.player.position, doors);
  
  // 動力絕對消耗
  GameState.player.velocity = { dx: 0, dy: 0 };
}

/**
 * 內部私有判定：檢查門的交互
 */
function _checkDoorCollision(currentPos, doors) {
  // A. 真門判定 (勝利條件)
  if (currentPos.x === doors.real.x && currentPos.y === doors.real.y) {
    GameState.system.status = 'WIN';
    GameState.system.isRunning = false; // 勝利後凍結邏輯幀
    return;
  }

  // B. 假門判定 (空間跳躍)
  const decoyIndex = doors.decoys.findIndex(
    d => d.x === currentPos.x && d.y === currentPos.y
  );

  if (decoyIndex !== -1) {
    // 排除當前踩到的這扇門，從剩下的假門中挑選
    const otherDecoys = doors.decoys.filter((_, index) => index !== decoyIndex);
    
    if (otherDecoys.length > 0) {
      const targetDoor = otherDecoys[Math.floor(Math.random() * otherDecoys.length)];
      
      // 執行瞬間跳躍
      GameState.player.position = { x: targetDoor.x, y: targetDoor.y };
      
      // 【關鍵約束】跳躍後動能歸零，防止慣性撞牆
      GameState.player.velocity = { dx: 0, dy: 0 };
    }
  }
}