// 돌의 색상
export type StoneColor = 'black' | 'white';

// 보드 셀 상태
export type CellState = StoneColor | null;

// 보드 크기 (15x15)
export const BOARD_SIZE = 15;

// 게임 상태
export type GameStatus = 'waiting' | 'playing' | 'finished';

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

// 소켓 이벤트 타입
export interface ServerToClientEvents {
  roomList: (rooms: Room[]) => void;
  roomCreated: (room: Room) => void;
  roomJoined: (room: Room) => void;
  roomUpdated: (room: Room) => void;
  gameStarted: (room: Room) => void;
  moveMade: (room: Room) => void;
  gameOver: (room: Room, winner: StoneColor) => void;
  playerLeft: (room: Room) => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  getRooms: () => void;
  createRoom: (playerName: string, roomName: string) => void;
  joinRoom: (roomId: string, playerName: string) => void;
  makeMove: (roomId: string, row: number, col: number) => void;
  leaveRoom: (roomId: string) => void;
}
