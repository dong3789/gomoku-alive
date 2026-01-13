// 돌의 색상
export type StoneColor = 'black' | 'white';

// 보드 셀 상태
export type CellState = StoneColor | null;

// 보드 크기 (15x15)
export const BOARD_SIZE = 15;

// 게임 상태
export type GameStatus = 'waiting' | 'playing' | 'finished';

// AI 난이도
export type Difficulty = 'easy' | 'medium' | 'hard';

// 게임 모드
export type GameMode = 'online' | 'ai' | 'local';

// 플레이어 정보
export interface Player {
  id: string;
  name: string;
  color: StoneColor | null;
}

// 착수 정보
export interface Move {
  row: number;
  col: number;
  color: StoneColor;
}

// 게임 방 정보
export interface Room {
  id: string;
  name: string;
  players: Player[];
  board: CellState[][];
  currentTurn: StoneColor;
  status: GameStatus;
  winner: StoneColor | null;
  moves: Move[];
  createdAt: number;
}
