// main.js (完整更新版)
import { GameState } from './state.js';
import { CONFIG } from './config.js';
import { initLevel } from './systems/level.js';
import { updateMutation } from './systems/mutation.js';
import { initInput } from './systems/input.js';
import { updateContinuousMovement } from './systems/movement.js';
import { initDoors, updateDoors } from './systems/doors.js';
import { renderGame } from './renderer.js';

function bootstrap() {
  const canvas = document.getElementById('gameCanvas') || document.getElementById('blastCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = CONFIG.mapWidth * CONFIG.tileSize;
  canvas.height = CONFIG.mapHeight * CONFIG.tileSize;

  // 初始化遊戲
  initLevel();
  initDoors();
  initInput();

  GameState.system.isRunning = false;
  
  _initUI(); // 這裡會處理所有的按鈕綁定

  setInterval(() => {
    updateMutation();
  }, CONFIG.mutationFrequencyMs);

  _startGameLoop(ctx);
  console.log("🚀 宇宙中樞啟動完成！");
}

function _startGameLoop(ctx) {
  function tick(timestamp) {
    // 只有在 PLAYING 狀態下才執行移動與門的邏輯
    if (GameState.system.isRunning && GameState.system.status === 'PLAYING') {
      updateContinuousMovement(timestamp);
      updateDoors(timestamp);
    }

    // 狀態監控：如果勝負已分，顯示結算畫面
    if (GameState.system.status !== 'PLAYING') {
      _showEndScreen();
    }

    renderGame(ctx);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/**
 * 系統重置中心 (Reset Logic)
 */
function resetGame() {
  // 1. 重設大腦狀態
  GameState.system.status = 'PLAYING';
  GameState.system.isRunning = true;

  // 2. 重新初始化物理世界 (地圖、玩家位置、幽靈)
  initLevel();
  
  // 3. 重新初始化傳送門
  initDoors();

  // 4. 隱藏結算畫面
  const endScreen = document.getElementById('end-screen');
  if (endScreen) endScreen.classList.remove('visible');

  // 5. 同步更新側邊選單按鈕的狀態
  const toggleBtn = document.getElementById('toggle-game-btn');
  if (toggleBtn) {
    toggleBtn.innerText = '⏸ 暫停遊戲';
    toggleBtn.classList.add('paused');
  }
  
  console.log("🔄 遊戲已重新開始，迷宮已重組。");
}

/**
 * UI 事件綁定中心
 */
function _initUI() {
  // A. 遊戲開始/暫停按鈕
  const toggleBtn = document.getElementById('toggle-game-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
      GameState.system.isRunning = !GameState.system.isRunning;
      this.innerText = GameState.system.isRunning ? '⏸ 暫停遊戲' : '▶ 開始遊戲';
      if (GameState.system.isRunning) this.classList.add('paused');
      else this.classList.remove('paused');
      this.blur();
    });
  }

  // B. 重新開始按鈕 (核心修復點)
  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      resetGame();
      restartBtn.blur();
    });
  }
}

/**
 * 顯示結算畫面
 */
function _showEndScreen() {
  const screen = document.getElementById('end-screen');
  const title = document.getElementById('end-title');
  const msg = document.getElementById('end-msg');

  if (screen && !screen.classList.contains('visible')) {
    if (GameState.system.status === 'WIN') {
      title.innerText = '逃出生天！';
      title.style.color = '#32ff64';
      msg.innerText = '你成功找到了真正的傳送門！';
    } else if (GameState.system.status === 'LOSE') {
      title.innerText = '遊戲結束';
      title.style.color = '#ff3250';
      msg.innerText = '你成為了迷宮中的亡魂...';
    }
    screen.classList.add('visible');
  }
}

bootstrap();