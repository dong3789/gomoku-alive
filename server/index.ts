import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
  Room,
  Player,
  CellState,
  StoneColor,
  ServerToClientEvents,
  ClientToServerEvents,
} from '../shared/types';
import { createEmptyBoard, checkWinner, isValidMove } from './gameLogic';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// 게임 방 저장소
const rooms: Map<string, Room> = new Map();

// 플레이어-방 매핑
const playerRooms: Map<string, string> = new Map();

// 방 목록 가져오기 (대기 중인 방만)
function getAvailableRooms(): Room[] {
  return Array.from(rooms.values()).filter(
    (room) => room.status === 'waiting' && room.players.length < 2
  );
}

// 방 정보 브로드캐스트
function broadcastRoomList() {
  io.emit('roomList', getAvailableRooms());
}

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // 방 목록 요청
  socket.on('getRooms', () => {
    socket.emit('roomList', getAvailableRooms());
  });

  // 방 생성
  socket.on('createRoom', (playerName: string, roomName: string) => {
    const roomId = uuidv4().slice(0, 8);
    const player: Player = {
      id: socket.id,
      name: playerName,
      color: 'black', // 방장은 흑돌
    };

    const room: Room = {
      id: roomId,
      name: roomName,
      players: [player],
      board: createEmptyBoard(),
      currentTurn: 'black',
      status: 'waiting',
      winner: null,
      moves: [],
      createdAt: Date.now(),
    };

    rooms.set(roomId, room);
    playerRooms.set(socket.id, roomId);
    socket.join(roomId);

    socket.emit('roomCreated', room);
    broadcastRoomList();
    console.log(`Room created: ${roomName} (${roomId}) by ${playerName}`);
  });

  // 방 참가
  socket.on('joinRoom', (roomId: string, playerName: string) => {
    const room = rooms.get(roomId);

    if (!room) {
      socket.emit('error', '방을 찾을 수 없습니다.');
      return;
    }

    if (room.players.length >= 2) {
      socket.emit('error', '방이 가득 찼습니다.');
      return;
    }

    if (room.status !== 'waiting') {
      socket.emit('error', '게임이 이미 시작되었습니다.');
      return;
    }

    const player: Player = {
      id: socket.id,
      name: playerName,
      color: 'white', // 참가자는 백돌
    };

    room.players.push(player);
    room.status = 'playing';
    playerRooms.set(socket.id, roomId);
    socket.join(roomId);

    socket.emit('roomJoined', room);
    io.to(roomId).emit('gameStarted', room);
    broadcastRoomList();
    console.log(`${playerName} joined room: ${room.name}`);
  });

  // 착수
  socket.on('makeMove', (roomId: string, row: number, col: number) => {
    const room = rooms.get(roomId);

    if (!room) {
      socket.emit('error', '방을 찾을 수 없습니다.');
      return;
    }

    if (room.status !== 'playing') {
      socket.emit('error', '게임이 진행 중이 아닙니다.');
      return;
    }

    const player = room.players.find((p) => p.id === socket.id);
    if (!player) {
      socket.emit('error', '플레이어를 찾을 수 없습니다.');
      return;
    }

    if (player.color !== room.currentTurn) {
      socket.emit('error', '상대방의 차례입니다.');
      return;
    }

    if (!isValidMove(room.board, row, col)) {
      socket.emit('error', '유효하지 않은 위치입니다.');
      return;
    }

    // 착수
    room.board[row][col] = player.color;
    room.moves.push({ row, col, color: player.color! });

    // 승리 체크
    if (checkWinner(room.board, row, col, player.color!)) {
      room.status = 'finished';
      room.winner = player.color;
      io.to(roomId).emit('gameOver', room, player.color!);
      console.log(`Game over in room ${room.name}: ${player.name} wins!`);
    } else {
      // 턴 변경
      room.currentTurn = room.currentTurn === 'black' ? 'white' : 'black';
      io.to(roomId).emit('moveMade', room);
    }
  });

  // 방 나가기
  socket.on('leaveRoom', (roomId: string) => {
    handleLeaveRoom(socket.id, roomId);
  });

  // 연결 해제
  socket.on('disconnect', () => {
    const roomId = playerRooms.get(socket.id);
    if (roomId) {
      handleLeaveRoom(socket.id, roomId);
    }
    console.log(`Player disconnected: ${socket.id}`);
  });
});

function handleLeaveRoom(playerId: string, roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.players = room.players.filter((p) => p.id !== playerId);
  playerRooms.delete(playerId);

  if (room.players.length === 0) {
    rooms.delete(roomId);
    console.log(`Room deleted: ${room.name}`);
  } else {
    // 상대가 나가면 게임 종료
    if (room.status === 'playing') {
      room.status = 'finished';
      room.winner = room.players[0].color;
      io.to(roomId).emit('playerLeft', room);
    }
  }

  broadcastRoomList();
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🎮 Gomoku server running on port ${PORT}`);
});
