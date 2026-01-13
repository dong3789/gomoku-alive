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

// 특정 위치에서 특정 방향으로 연속된 돌 수 계산
function countConsecutive(
  board: CellState[][],
  row: number,
  col: number,
  dr: number,
  dc: number,
  color: StoneColor
): { count: number; openEnds: number } {
  let count = 0;
  let openEnds = 0;

  // 정방향
  let r = row + dr;
  let c = col + dc;
  while (
    r >= 0 && r < BOARD_SIZE &&
    c >= 0 && c < BOARD_SIZE &&
    board[r][c] === color
  ) {
    count++;
    r += dr;
    c += dc;
  }
  if (
    r >= 0 && r < BOARD_SIZE &&
    c >= 0 && c < BOARD_SIZE &&
    board[r][c] === null
  ) {
    openEnds++;
  }

  // 역방향
  r = row - dr;
  c = col - dc;
  while (
    r >= 0 && r < BOARD_SIZE &&
    c >= 0 && c < BOARD_SIZE &&
    board[r][c] === color
  ) {
    count++;
    r -= dr;
    c -= dc;
  }
  if (
    r >= 0 && r < BOARD_SIZE &&
    c >= 0 && c < BOARD_SIZE &&
    board[r][c] === null
  ) {
    openEnds++;
  }

  return { count, openEnds };
}

// 위치 점수 계산
function evaluatePosition(
  board: CellState[][],
  row: number,
  col: number,
  aiColor: StoneColor,
  playerColor: StoneColor
): number {
  let score = 0;

  // 중앙에 가까울수록 약간의 보너스
  const centerDistance = Math.abs(row - 7) + Math.abs(col - 7);
  score += (14 - centerDistance) * 2;

  // 임시로 돌을 놓고 평가
  const testBoard = board.map(row => [...row]);

  // AI 공격 점수
  testBoard[row][col] = aiColor;
  for (const [dr, dc] of DIRECTIONS) {
    const { count, openEnds } = countConsecutive(testBoard, row, col, dr, dc, aiColor);

    if (count >= 4) score += 100000; // 5연속 가능
    else if (count === 3 && openEnds === 2) score += 10000; // 열린 4
    else if (count === 3 && openEnds === 1) score += 1000; // 막힌 4
    else if (count === 2 && openEnds === 2) score += 500; // 열린 3
    else if (count === 2 && openEnds === 1) score += 100; // 막힌 3
    else if (count === 1 && openEnds === 2) score += 50; // 열린 2
  }

  // 상대방 방어 점수
  testBoard[row][col] = playerColor;
  for (const [dr, dc] of DIRECTIONS) {
    const { count, openEnds } = countConsecutive(testBoard, row, col, dr, dc, playerColor);

    if (count >= 4) score += 90000; // 상대 5연속 차단
    else if (count === 3 && openEnds === 2) score += 9000; // 상대 열린 4 차단
    else if (count === 3 && openEnds === 1) score += 900; // 상대 막힌 4 차단
    else if (count === 2 && openEnds === 2) score += 400; // 상대 열린 3 차단
  }

  return score;
}

// 유효한 수 목록 가져오기 (돌 주변만)
function getValidMoves(board: CellState[][]): Position[] {
  const moves: Position[] = [];
  const checked = new Set<string>();

  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (board[i][j] !== null) {
        // 이미 놓인 돌 주변 2칸 확인
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
              moves.push({ row: ni, col: nj, score: 0 });
            }
          }
        }
      }
    }
  }

  // 보드가 비어있으면 중앙 반환
  if (moves.length === 0) {
    return [{ row: 7, col: 7, score: 0 }];
  }

  return moves;
}

// AI 착수 계산
export function getAIMove(
  board: CellState[][],
  aiColor: StoneColor,
  difficulty: Difficulty
): { row: number; col: number } {
  const playerColor: StoneColor = aiColor === 'black' ? 'white' : 'black';
  const moves = getValidMoves(board);

  // 점수 계산
  for (const move of moves) {
    move.score = evaluatePosition(board, move.row, move.col, aiColor, playerColor);
  }

  // 점수 순으로 정렬
  moves.sort((a, b) => b.score - a.score);

  // 난이도에 따라 선택
  let selectedMove: Position;

  switch (difficulty) {
    case 'easy':
      // 쉬움: 상위 50% 중에서 랜덤 선택 (실수 가능)
      const easyPool = moves.slice(0, Math.max(1, Math.floor(moves.length * 0.5)));
      selectedMove = easyPool[Math.floor(Math.random() * easyPool.length)];
      break;

    case 'medium':
      // 보통: 상위 20% 중에서 랜덤 선택
      const mediumPool = moves.slice(0, Math.max(1, Math.floor(moves.length * 0.2)));
      selectedMove = mediumPool[Math.floor(Math.random() * mediumPool.length)];
      break;

    case 'hard':
      // 어려움: 최고 점수 선택 (가끔 약간의 랜덤)
      if (Math.random() < 0.9) {
        selectedMove = moves[0];
      } else {
        const hardPool = moves.slice(0, Math.max(1, Math.min(3, moves.length)));
        selectedMove = hardPool[Math.floor(Math.random() * hardPool.length)];
      }
      break;

    default:
      selectedMove = moves[0];
  }

  return { row: selectedMove.row, col: selectedMove.col };
}
