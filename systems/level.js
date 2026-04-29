import { GameState } from '../state.js';
import { CONFIG } from '../config.js';

/**
 * 關卡與環境生命週期管理系統 (Level System)
 */
export function initLevel() {
  GameState.world.vfx = [];
  GameState.world.hazards = [];
  GameState.enemies = [];

  const width = CONFIG.mapWidth || 30;
  const height = CONFIG.mapHeight || 30;
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);

  const mapData = [];
  for (let y = 0; y < height; y++) {
    const row = new Array(width).fill(0);
    mapData.push(row);
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const isCenterSafeZone = Math.abs(x - centerX) <= 1 && Math.abs(y - centerY) <= 1;
      if (isCenterSafeZone) continue;

      if (Math.random() <= CONFIG.wallDensity) {
        mapData[y][x] = 1;
      }
    }
  }

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (mapData[y][x] === 0) {
        const isSurrounded = 
          mapData[y - 1][x] === 1 && 
          mapData[y + 1][x] === 1 && 
          mapData[y][x - 1] === 1 && 
          mapData[y][x + 1] === 1;   

        if (isSurrounded) {
          mapData[y][x] = 1;
        }
      }
    }
  }
  
  GameState.world.mapData = mapData;
  resetPlayer();

  let ghostsSpawned = 0;
  const maxAttempts = 1000; 
  let attempts = 0;

  while (ghostsSpawned < CONFIG.enemyCount && attempts < maxAttempts) {
    const rx = Math.floor(Math.random() * width);
    const ry = Math.floor(Math.random() * height);
    
    const manhattanDist = Math.abs(rx - centerX) + Math.abs(ry - centerY);

    // [新增防護]：確保該座標目前沒有其他幽靈佔用 (防重疊生成)
    const isOccupied = GameState.enemies.some(
      enemy => enemy.position.x === rx && enemy.position.y === ry
    );

    if (manhattanDist > CONFIG.minEnemyDistance && mapData[ry][rx] === 0 && !isOccupied) {
      GameState.enemies.push({
        id: `ghost_${ghostsSpawned}`,
        position: { x: rx, y: ry },
        velocity: { dx: 0, dy: 0 },
        type: 'ghost' 
      });
      ghostsSpawned++;
    }
    attempts++;
  }
}

export function resetPlayer() {
  const width = CONFIG.mapWidth || 30;
  const height = CONFIG.mapHeight || 30;
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);

  GameState.player.position = { x: centerX, y: centerY };
  GameState.player.velocity = { dx: 0, dy: 0 };
}