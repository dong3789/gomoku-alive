import { StoneColor } from '../types';

interface GameResultProps {
  winner: StoneColor;
  winnerName: string;
  onRestart: () => void;
  onExit: () => void;
}

function GameResult({ winner, winnerName, onRestart, onExit }: GameResultProps) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>게임 종료!</h2>
        <p>
          <span className={`stone-indicator ${winner}`} style={{ display: 'inline-block', marginRight: '10px' }} />
          {winnerName} 승리!
        </p>
        <div className="modal-buttons">
          <button className="btn btn-primary" onClick={onRestart}>
            다시 하기
          </button>
          <button className="btn btn-secondary" onClick={onExit}>
            나가기
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameResult;
