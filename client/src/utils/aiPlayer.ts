import { CellState, StoneColor, BOARD_SIZE, Difficulty } from '../types';

interface Position {
  row: number;
  col: number;
  score: number;
}

// 방향 배열
const DIRECTIONS = [
  [0, 1],   // 가로
  [1, 0],   // 세로
  [1, 1],   // 대각선 ↘
  [1, -1],  // 대각선 ↙
];

// 패턴 점수 (더 정교하게)
const SCORES = {
  FIVE: 10000000,        // 5연속 (승리)
  OPEN_FOUR: 500000,     // 열린 4 (막을 수 없음)
  FOUR: 100000,          // 막힌 4
  OPEN_THREE: 50000,     // 열린 3 (위험)
  THREE: 10000,          // 막힌 3
  OPEN_TWO: 5000,        // 열린 2
  TWO: 1000,             // 막힌 2
  ONE: 100,              // 1개
};

// 라인 분석 결과
interface LineAnalysis {
  count: number;      // 연속된 돌 수
  openEnds: number;   // 열린 끝 수 (0, 1, 2)
  gaps: number;       // 빈칸 수 (띈 연결)
}

// 한 방향으로 라인 분석
function analyzeLine(
  board: CellState[][],
  row: number,
  col: number,
  dr: number,
  dc: number,
  color: StoneColor
): LineAnalysis {
  let count = 1;
  let openEnds = 0;
  let gaps = 0;

  // 정방향 탐색
  let r = row + dr;
  let c = col + dc;
  let gapFound = false;

  while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
    if (board[r][c] === color) {
      count++;
    } else if (board[r][c] === null && !gapFound) {
      // 한 칸 빈칸 허용 (띈 연결)
      const nextR = r + dr;
      const nextC = c + dc;
      if (nextR >= 0 && nextR < BOARD_SIZE && nextC >= 0 && nextC < BOARD_SIZE &&
          board[nextR][nextC] === color) {
        gapFound = true;
        gaps++;
        r = nextR;
        c = nextC;
        count++;
        continue;
      } else {
        openEnds++;
        break;
      }
    } else {
      if (board[r][c] === null) openEnds++;
      break;
    }
    r += dr;
    c += dc;
  }

  // 역방향 탐색
  r = row - dr;
  c = col - dc;
  gapFound = false;

  while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
    if (board[r][c] === color) {
      count++;
    } else if (board[r][c] === null && !gapFound) {
      const nextR = r - dr;
      const nextC = c - dc;
      if (nextR >= 0 && nextR < BOARD_SIZE && nextC >= 0 && nextC < BOARD_SIZE &&
          board[nextR][nextC] === color) {
        gapFound = true;
        gaps++;
        r = nextR;
        c = nextC;
        count++;
        continue;
      } else {
        openEnds++;
        break;
      }
    } else {
      if (board[r][c] === null) openEnds++;
      break;
    }
    r -= dr;
    c -= dc;
  }

  return { count, openEnds, gaps };
}

// 위치에 대한 점수 계산
function evaluatePosition(
  board: CellState[][],
  row: number,
  col: number,
  color: StoneColor
): number {
  let score = 0;

  // 임시로 돌을 놓고 평가
  board[row][col] = color;

  for (const [dr, dc] of DIRECTIONS) {
    const { count, openEnds } = analyzeLine(board, row, col, dr, dc, color);

    if (count >= 5) {
      score += SCORES.FIVE;
    } else if (count === 4) {
      if (openEnds === 2) score += SCORES.OPEN_FOUR;
      else if (openEnds === 1) score += SCORES.FOUR;
    } else if (count === 3) {
      if (openEnds === 2) score += SCORES.OPEN_THREE;
      else if (openEnds === 1) score += SCORES.THREE;
    } else if (count === 2) {
      if (openEnds === 2) score += SCORES.OPEN_TWO;
      else if (openEnds === 1) score += SCORES.TWO;
    } else if (count === 1 && openEnds === 2) {
      score += SCORES.ONE;
    }
  }

  board[row][col] = null;
  return score;
}

// 쌍삼, 쌍사 체크 (복합 위협)
function countThreats(
  board: CellState[][],
  row: number,
  col: number,
  color: StoneColor
): { threes: number; fours: number } {
  let threes = 0;
  let fours = 0;

  board[row][col] = color;

  for (const [dr, dc] of DIRECTIONS) {
    const { count, openEnds } = analyzeLine(board, row, col, dr, dc, color);

    if (count === 4 && openEnds >= 1) fours++;
    if (count === 3 && openEnds === 2) threes++;
  }

  board[row][col] = null;
  return { threes, fours };
}

// 전체 보드 평가 (Minimax용)
function evaluateBoard(board: CellState[][], aiColor: StoneColor): number {
  const playerColor: StoneColor = aiColor === 'black' ? 'white' : 'black';
  let score = 0;

  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] === aiColor) {
        score += evaluatePosition(board, i, j, aiColor) * 0.1;
      } else if (board[i][j] === playerColor) {
        score -= evaluatePosition(board, i, j, playerColor) * 0.1;
      }
    }
  }

  return score;
}

// 유효한 수 목록 (돌 주변만, 점수순 정렬)
function getValidMoves(
  board: CellState[][],
  aiColor: StoneColor,
  playerColor: StoneColor,
  limit: number = 15
): Position[] {
  const moves: Position[] = [];
  const checked = new Set<string>();

  // 돌이 없으면 중앙
  let hasStone = false;
  for (let i = 0; i < BOARD_SIZE && !hasStone; i++) {
    for (let j = 0; j < BOARD_SIZE && !hasStone; j++) {
      if (board[i][j] !== null) hasStone = true;
    }
  }
  if (!hasStone) {
    return [{ row: 7, col: 7, score: 0 }];
  }

  // 돌 주변 2칸 탐색
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] !== null) {
        for (let di = -2; di <= 2; di++) {
          for (let dj = -2; dj <= 2; dj++) {
            const ni = i + di;
            const nj = j + dj;
            const key = `${ni},${nj}`;

            if (
              ni >= 0 && ni < BOARD_SIZE &&
              nj >= 0 && nj < BOARD_SIZE &&
              board[ni][nj] === null &&
              !checked.has(key)
            ) {
              checked.add(key);

              // 공격 + 방어 점수
              const attackScore = evaluatePosition(board, ni, nj, aiColor);
              const defenseScore = evaluatePosition(board, ni, nj, playerColor);

              // 복합 위협 체크
              const aiThreats = countThreats(board, ni, nj, aiColor);
              const playerThreats = countThreats(board, ni, nj, playerColor);

              let score = attackScore + defenseScore * 0.9;

              // 쌍삼, 쌍사 보너스
              if (aiThreats.fours >= 2) score += SCORES.FIVE; // 쌍사 = 승리
              if (aiThreats.threes >= 2) score += SCORES.OPEN_FOUR; // 쌍삼 = 매우 강력
              if (aiThreats.fours >= 1 && aiThreats.threes >= 1) score += SCORES.OPEN_FOUR;

              // 상대 위협 차단
              if (playerThreats.fours >= 2) score += SCORES.FIVE * 0.95;
              if (playerThreats.threes >= 2) score += SCORES.OPEN_FOUR * 0.95;

              // 중앙 보너스
              const centerDist = Math.abs(ni - 7) + Math.abs(nj - 7);
              score += (14 - centerDist) * 10;

              moves.push({ row: ni, col: nj, score });
            }
          }
        }
      }
    }
  }

  // 점수순 정렬 후 상위만 반환
  moves.sort((a, b) => b.score - a.score);
  return moves.slice(0, limit);
}

// Minimax with Alpha-Beta Pruning
function minimax(
  board: CellState[][],
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiColor: StoneColor,
  playerColor: StoneColor
): number {
  if (depth === 0) {
    return evaluateBoard(board, aiColor);
  }

  const moves = getValidMoves(board, aiColor, playerColor, 10);

  if (moves.length === 0) {
    return evaluateBoard(board, aiColor);
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      board[move.row][move.col] = aiColor;

      // 즉시 승리 체크
      const aiScore = evaluatePosition(board, move.row, move.col, aiColor);
      if (aiScore >= SCORES.FIVE) {
        board[move.row][move.col] = null;
        return SCORES.FIVE * 10;
      }

      const evalScore = minimax(board, depth - 1, alpha, beta, false, aiColor, playerColor);
      board[move.row][move.col] = null;

      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      board[move.row][move.col] = playerColor;

      // 상대 승리 체크
      const playerScore = evaluatePosition(board, move.row, move.col, playerColor);
      if (playerScore >= SCORES.FIVE) {
        board[move.row][move.col] = null;
        return -SCORES.FIVE * 10;
      }

      const evalScore = minimax(board, depth - 1, alpha, beta, true, aiColor, playerColor);
      board[move.row][move.col] = null;

      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

// AI 착수 계산
export function getAIMove(
  board: CellState[][],
  aiColor: StoneColor,
  difficulty: Difficulty
): { row: number; col: number } {
  const playerColor: StoneColor = aiColor === 'black' ? 'white' : 'black';
  const boardCopy = board.map(row => [...row]);

  // 난이도별 설정
  const config = {
    easy: { depth: 0, randomness: 0.5, topN: 0.5 },
    medium: { depth: 1, randomness: 0.2, topN: 0.3 },
    hard: { depth: 3, randomness: 0, topN: 0.1 },
  };

  const { depth, randomness, topN } = config[difficulty];

  // 후보 수 계산
  const moves = getValidMoves(boardCopy, aiColor, playerColor, 20);

  if (moves.length === 0) {
    return { row: 7, col: 7 };
  }

  // 즉시 승리 수 체크
  for (const move of moves) {
    boardCopy[move.row][move.col] = aiColor;
    const score = evaluatePosition(boardCopy, move.row, move.col, aiColor);
    boardCopy[move.row][move.col] = null;

    if (score >= SCORES.FIVE) {
      return { row: move.row, col: move.col };
    }
  }

  // 상대 승리 차단
  for (const move of moves) {
    boardCopy[move.row][move.col] = playerColor;
    const score = evaluatePosition(boardCopy, move.row, move.col, playerColor);
    boardCopy[move.row][move.col] = null;

    if (score >= SCORES.FIVE) {
      return { row: move.row, col: move.col };
    }
  }

  // 어려움: Minimax 사용
  if (depth > 0) {
    let bestMove = moves[0];
    let bestScore = -Infinity;

    for (const move of moves.slice(0, 8)) { // 상위 8개만 깊이 탐색
      boardCopy[move.row][move.col] = aiColor;
      const score = minimax(boardCopy, depth, -Infinity, Infinity, false, aiColor, playerColor);
      boardCopy[move.row][move.col] = null;

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    // 랜덤성 추가 (어려움은 거의 없음)
    if (Math.random() < randomness) {
      const pool = moves.slice(0, Math.max(1, Math.floor(moves.length * topN)));
      return pool[Math.floor(Math.random() * pool.length)];
    }

    return { row: bestMove.row, col: bestMove.col };
  }

  // 쉬움/보통: 점수 기반 + 랜덤
  if (Math.random() < randomness) {
    const pool = moves.slice(0, Math.max(1, Math.floor(moves.length * topN)));
    const selected = pool[Math.floor(Math.random() * pool.length)];
    return { row: selected.row, col: selected.col };
  }

  return { row: moves[0].row, col: moves[0].col };
}
