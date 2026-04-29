// config.js
export const CONFIG = {
  tileSize: 32,// 每格像素大小
  mapWidth: 30,
  mapHeight: 30,
  wallDensity: 0.3,// 牆壁密度 (0.0 ~ 1.0)
  enemyCount: 2,
  minEnemyDistance: 8,

  // --- 影響遊戲體驗的平衡參數 (Difficulty & Feel) ---
  playerMoveSpeedMs: 200,      
  mutationFrequencyMs: 2000,   
  
  // 【全新】區域變異引擎參數 (Regional Mutation)
  mutationBlockCount: [5, 13],       // 每次變異觸發的區塊數量範圍 [最小, 最大]
  mutationBlockSize: [4, 8],        // 區塊的大小範圍 (寬高格數) [最小, 最大]
  mutationIntensity: [0.1, 0.4],    // 單一區塊內的變化劇烈度 (改變該區塊內n%的格子)
  mutationSafeRadius: 4,            // 安全半徑

  // 門系統平衡參數
  decoyDoorCount: 4,               // 假門數量
  doorRotationIntervalMs: 6000,    // 假門重新生成的週期 (毫秒)

  // --- 系統內部用途 ---
  maxMutationAttempts: 50,
};