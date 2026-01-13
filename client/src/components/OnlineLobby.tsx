import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Room, StoneColor, Move } from '../types';
import Board from './Board';
import GameResult from './GameResult';

interface OnlineLobbyProps {
  onBack: () => void;
}

function OnlineLobby({ onBack }: OnlineLobbyProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // 소켓 연결
  useEffect(() => {
    const serverUrl = import.meta.env.PROD
      ? window.location.origin
      : 'http://localhost:3001';

    const newSocket = io(serverUrl);

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('getRooms');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('roomList', (roomList: Room[]) => {
      setRooms(roomList);
    });

    newSocket.on('roomCreated', (room: Room) => {
      setCurrentRoom(room);
    });

    newSocket.on('roomJoined', (room: Room) => {
      setCurrentRoom(room);
    });

    newSocket.on('gameStarted', (room: Room) => {
      setCurrentRoom(room);
    });

    newSocket.on('moveMade', (room: Room) => {
      setCurrentRoom(room);
    });

    newSocket.on('gameOver', (room: Room) => {
      setCurrentRoom(room);
    });

    newSocket.on('playerLeft', (room: Room) => {
      setCurrentRoom(room);
    });

    newSocket.on('roomUpdated', (room: Room) => {
      setCurrentRoom(room);
    });

    newSocket.on('error', (message: string) => {
      setError(message);
      setTimeout(() => setError(null), 3000);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const createRoom = () => {
    if (!playerName.trim() || !roomName.trim()) {
      setError('이름과 방 제목을 입력해주세요.');
      return;
    }
    socket?.emit('createRoom', playerName, roomName);
  };

  const joinRoom = (roomId: string) => {
    if (!playerName.trim()) {
      setError('이름을 먼저 입력해주세요.');
      return;
    }
    socket?.emit('joinRoom', roomId, playerName);
  };

  const makeMove = (row: number, col: number) => {
    if (!currentRoom) return;
    socket?.emit('makeMove', currentRoom.id, row, col);
  };

  const leaveRoom = () => {
    if (currentRoom) {
      socket?.emit('leaveRoom', currentRoom.id);
    }
    setCurrentRoom(null);
    socket?.emit('getRooms');
  };

  const getMyColor = (): StoneColor | null => {
    if (!currentRoom || !socket) return null;
    const player = currentRoom.players.find(p => p.id === socket.id);
    return player?.color || null;
  };

  const isMyTurn = (): boolean => {
    const myColor = getMyColor();
    return myColor === currentRoom?.currentTurn;
  };

  const getLastMove = (): Move | null => {
    if (!currentRoom || currentRoom.moves.length === 0) return null;
    return currentRoom.moves[currentRoom.moves.length - 1];
  };

  // 게임 화면
  if (currentRoom) {
    const myColor = getMyColor();
    const opponent = currentRoom.players.find(p => p.id !== socket?.id);

    return (
      <div className="game-container">
        <div className="game-info">
          <div className="player-info">
            <div className={`stone-indicator ${myColor || 'black'}`} />
            <span>나 ({myColor === 'black' ? '흑돌' : '백돌'})</span>
          </div>
          <div className={`turn-indicator ${currentRoom.status === 'waiting' ? 'waiting' : ''}`}>
            {currentRoom.status === 'waiting'
              ? '상대 대기 중...'
              : currentRoom.status === 'finished'
                ? '게임 종료'
                : isMyTurn()
                  ? '내 차례'
                  : '상대 차례'}
          </div>
          <div className="player-info">
            <span>{opponent?.name || '대기 중'}</span>
            <div className={`stone-indicator ${myColor === 'black' ? 'white' : 'black'}`} />
          </div>
        </div>

        <Board
          board={currentRoom.board}
          onCellClick={makeMove}
          currentTurn={currentRoom.currentTurn}
          disabled={
            currentRoom.status !== 'playing' ||
            !isMyTurn()
          }
          lastMove={getLastMove()}
        />

        <button className="btn btn-secondary back-button" onClick={leaveRoom}>
          방 나가기
        </button>

        {currentRoom.status === 'finished' && currentRoom.winner && (
          <GameResult
            winner={currentRoom.winner}
            winnerName={
              currentRoom.winner === myColor
                ? '당신'
                : opponent?.name || '상대방'
            }
            onRestart={leaveRoom}
            onExit={onBack}
          />
        )}
      </div>
    );
  }

  // 로비 화면
  return (
    <div className="lobby">
      {error && (
        <div style={{
          background: '#e94560',
          padding: '10px 20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '20px', color: isConnected ? '#4ade80' : '#f87171' }}>
        {isConnected ? '서버 연결됨' : '서버 연결 중...'}
      </div>

      <div className="room-section">
        <h3>내 정보</h3>
        <div className="name-input">
          <input
            type="text"
            placeholder="닉네임을 입력하세요"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={20}
          />
        </div>
      </div>

      <div className="room-section">
        <h3>방 만들기</h3>
        <div className="create-room">
          <input
            type="text"
            placeholder="방 제목"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            maxLength={30}
          />
          <button className="btn btn-primary" onClick={createRoom}>
            방 만들기
          </button>
        </div>
      </div>

      <div className="room-section">
        <h3>방 목록</h3>
        <div className="room-list">
          {rooms.length === 0 ? (
            <div className="no-rooms">
              <p>열린 방이 없습니다.</p>
              <p>새로운 방을 만들어보세요!</p>
            </div>
          ) : (
            rooms.map((room) => (
              <div key={room.id} className="room-item">
                <div className="room-info">
                  <span className="room-name">{room.name}</span>
                  <span className="room-players">
                    방장: {room.players[0]?.name} | {room.players.length}/2
                  </span>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => joinRoom(room.id)}
                >
                  참가
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <button className="btn btn-secondary back-button" onClick={onBack}>
        메인 메뉴로
      </button>
    </div>
  );
}

export default OnlineLobby;
