// systems/mutation.js
import { GameState } from '../state.js';
import { CONFIG } from '../config.js';

/**
 * 終極動態變異系統 (Path-Preserving Mutation System)
 * * 設計原則：
 * - 沙盒演練：所有變異先在記憶體快照中執行。
 * - 絕對連通性：透過 BFS 尋路演算法，保證玩家、敵人、出口之間永遠存在至少一條活路。
 */
export function updateMutation() {
  if (!GameState.system.isRunning) return;

  const { mapData, doors } = GameState.world;
  const { player, enemies } = GameState;
  
  const height = mapData.length;
  if (height === 0) return;
  const width = mapData[0].length;

  // 1. 建立平行宇宙：深拷貝當前地圖，所有的實驗都在這裡進行
  const clonedMap = mapData.map(row => [...row]);

  // 2. 決定這次要異變多少個區塊
  const blockCount = _getRandomInt(CONFIG.mutationBlockCount[0], CONFIG.mutationBlockCount[1]);

  for (let i = 0; i < blockCount; i++) {
    const blockW = _getRandomInt(CONFIG.mutationBlockSize[0], Math.min(CONFIG.mutationBlockSize[1], width));
    const blockH = _getRandomInt(CONFIG.mutationBlockSize[0], Math.min(CONFIG.mutationBlockSize[1], height));
    
    const startX = Math.floor(Math.random() * (width - blockW + 1));
    const startY = Math.floor(Math.random() * (height - blockH + 1));

    const totalCellsInBlock = blockW * blockH;
    const intensity = _getRandomFloat(CONFIG.mutationIntensity[0], CONFIG.mutationIntensity[1]);
    const mutateCount = Math.max(1, Math.floor(totalCellsInBlock * intensity));

    // 注意：這裡傳入的是 clonedMap，不會動到真實畫面
    _mutateRegion(startX, startY, blockW, blockH, mutateCount, clonedMap, doors, player, enemies);
  }

  // 3. 上帝視角審查：驗證這個變異後的世界是否合法 (是否留有活路)
  const isWorldValid = _checkPathsExist(clonedMap, width, height, player, enemies, doors);

  // 4. 決議：只有在保證連通的情況下，才將變異結果覆寫回真實世界
  if (isWorldValid) {
    GameState.world.mapData = clonedMap;
  } else {
    // 若路徑被封死，則捨棄這次變異。
    // 在遊戲體驗上，玩家會覺得「這一秒迷宮沒有變動」，這是非常自然且安全的設計。
    // console.log("變異引發死胡同，已觸發防護機制並捨棄該次變異。");
  }
}

/**
 * 廣度優先搜尋 (BFS) 尋路演算法
 * 確保玩家可以到達「每一個敵人」以及「真正的逃生門」
 */
function _checkPathsExist(map, width, height, player, enemies, doors) {
  // A. 收集所有必須抵達的目標點
  const targets = [];
  
  // 目標 1：所有存活的幽靈
  enemies.forEach(enemy => {
    targets.push({ x: enemy.position.x, y: enemy.position.y });
  });
  
  // 目標 2：真正的逃生門 (如果有生成的話)
  if (doors.real && (doors.real.x !== 0 || doors.real.y !== 0)) {
    targets.push({ x: doors.real.x, y: doors.real.y });
  }

  if (targets.length === 0) return true; // 沒有目標需要驗證，直接放行

  // B. 初始化 BFS 結構
  const queue = [{ x: player.position.x, y: player.position.y }];
  const visited = new Set();
  visited.add(`${player.position.y},${player.position.x}`);

  let targetsReached = 0;
  // 支援四個方向的移動
  const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];

  // C. 開始擴展尋路
  while (queue.length > 0) {
    const curr = queue.shift();

    // 檢查目前踩到的格子是不是目標之一
    for (let i = 0; i < targets.length; i++) {
      if (targets[i] && targets[i].x === curr.x && targets[i].y === curr.y) {
        targetsReached++;
        targets[i] = null; // 標記為已找到
      }
    }

    // 如果所有目標都找到了，提早結束並回傳成功！
    if (targetsReached === targets.length) return true;

    // 往四周探索
    for (const [dx, dy] of directions) {
      // 【關鍵細節】必須考慮遊戲特有的「邊界穿越 (Screen Wrap)」物理法則
      const nx = (curr.x + dx + width) % width;
      const ny = (curr.y + dy + height) % height;

      // 如果是空地 (0)，且還沒走過
      if (map[ny][nx] === 0) {
        const key = `${ny},${nx}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({ x: nx, y: ny });
        }
      }
    }
  }

  // 找遍了所有連通的通道，仍有目標無法抵達，代表路被死死封住了
  return false;
}

// ==========================================
// 內部核心重組演算法 (直接運算，不涉及真實 DOM)
// ==========================================
function _mutateRegion(startX, startY, blockW, blockH, mutateCount, mapData, doors, player, enemies) {
  let currentWalls = 0;
  for (let y = startY; y < startY + blockH; y++) {
    for (let x = startX; x < startX + blockW; x++) {
      if (mapData[y][x] === 1) currentWalls++;
    }
  }

  const targetWalls = Math.floor(blockW * blockH * CONFIG.wallDensity);
  const diff = targetWalls - currentWalls;

  let buildCount = 0;
  let destroyCount = 0;
  let availableActions = mutateCount;

  if (diff > 0) {
    buildCount = Math.min(diff, availableActions);
    availableActions -= buildCount;
  } else if (diff < 0) {
    destroyCount = Math.min(Math.abs(diff), availableActions);
    availableActions -= destroyCount;
  }

  const swapPairs = Math.floor(availableActions / 2);
  buildCount += swapPairs;
  destroyCount += swapPairs;

  _executeDestroys(startX, startY, blockW, blockH, destroyCount, mapData, doors);
  _executeBuilds(startX, startY, blockW, blockH, buildCount, mapData, doors, player, enemies);
}

function _executeBuilds(startX, startY, blockW, blockH, count, mapData, doors, player, enemies) {
  for (let i = 0; i < count; i++) {
    let built = false;
    let attempts = 0;
    while (!built && attempts < CONFIG.maxMutationAttempts) {
      const rx = startX + Math.floor(Math.random() * blockW);
      const ry = startY + Math.floor(Math.random() * blockH);

      if (mapData[ry][rx] === 0 && !_isDoor(rx, ry, doors)) {
        if (_isSafeToBuild(rx, ry, player, enemies)) {
          mapData[ry][rx] = 1;
          built = true;
        }
      }
      attempts++;
    }
  }
}

function _executeDestroys(startX, startY, blockW, blockH, count, mapData, doors) {
  for (let i = 0; i < count; i++) {
    let destroyed = false;
    let attempts = 0;
    while (!destroyed && attempts < CONFIG.maxMutationAttempts) {
      const rx = startX + Math.floor(Math.random() * blockW);
      const ry = startY + Math.floor(Math.random() * blockH);

      if (mapData[ry][rx] === 1 && !_isDoor(rx, ry, doors)) {
        mapData[ry][rx] = 0;
        destroyed = true;
      }
      attempts++;
    }
  }
}

// ==========================================
// 輔助工具函式
// ==========================================
function _getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function _getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function _isSafeToBuild(rx, ry, player, enemies) {
  const distToPlayer = Math.abs(rx - player.position.x) + Math.abs(ry - player.position.y);
  if (distToPlayer <= CONFIG.mutationSafeRadius) return false;

  for (let j = 0; j < enemies.length; j++) {
    const distToEnemy = Math.abs(rx - enemies[j].position.x) + Math.abs(ry - enemies[j].position.y);
    if (distToEnemy <= CONFIG.mutationSafeRadius) return false;
  }
  return true;
}

function _isDoor(x, y, doors) {
  if (doors.real && doors.real.x === x && doors.real.y === y) return true;
  if (doors.decoys) {
    for (let i = 0; i < doors.decoys.length; i++) {
      if (doors.decoys[i].x === x && doors.decoys[i].y === y) return true;
    }
  }
  return false;
}