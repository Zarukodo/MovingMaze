// systems/input.js
import { GameState } from '../state.js';

/**
 * 輸入轉譯系統 (Input System)
 * * 設計原則：
 * - 意圖收集器：僅負責將硬體事件翻譯為系統可理解的「意圖 (Velocity)」，絕對不干涉實體位置的計算。
 * - 解耦物理層：透過單向資料寫入，讓實際的空間轉移交由 movement.js 統一裁決。
 */
export function initInput() {
  window.addEventListener('keydown', (event) => {
    // 系統若處於暫停或中斷狀態，拒絕一切操作意圖
    if (!GameState.system.isRunning) return;

    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        GameState.player.velocity = { dx: 0, dy: -1 };
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        GameState.player.velocity = { dx: 0, dy: 1 };
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        GameState.player.velocity = { dx: -1, dy: 0 };
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        GameState.player.velocity = { dx: 1, dy: 0 };
        break;
      default:
        // 非移動指令不予處理
        return;
    }
  });
}