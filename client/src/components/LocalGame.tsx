import { useState, useCallback } from 'react';
import { CellState, StoneColor, Move } from '../types';
import { createEmptyBoard, checkWinner, isValidMove } from '../utils/gameLogic';
import Board from './Board';
import GameResult from './GameResult';

interface LocalGameProps {
  onBack: () => void;
}

function LocalGame({ onBack }: LocalGameProps) {
  const [board, setBoard] = useState<CellState[][]>(createEmptyBoard());
  const [currentTurn, setCurrentTurn] = useState<StoneColor>('black');
  const [winner, setWinner] = useState<StoneColor | null>(null);
  const [lastMove, setLastMove] = useState<Move | null>(null);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (winner) return;
    if (!isValidMove(board, row, col)) return;

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = currentTurn;
    setBoard(newBoard);
    setLastMove({ row, col, color: currentTurn });

    if (checkWinner(newBoard, row, col, currentTurn)) {
      setWinner(currentTurn);
    } else {
      setCurrentTurn(currentTurn === 'black' ? 'white' : 'black');
    }
  }, [board, currentTurn, winner]);

  const handleRestart = () => {
    setBoard(createEmptyBoard());
    setCurrentTurn('black');
    setWinner(null);
    setLastMove(null);
  };

  return (
    <div className="game-container">
      <div className="game-info">
        <div className="player-info">
          <div className="stone-indicator black" />
          <span>흑돌 (Player 1)</span>
        </div>
        <div className={`turn-indicator`}>
          {currentTurn === 'black' ? '흑돌' : '백돌'} 차례
        </div>
        <div className="player-info">
          <span>백돌 (Player 2)</span>
          <div className="stone-indicator white" />
        </div>
      </div>

      <Board
        board={board}
        onCellClick={handleCellClick}
        currentTurn={currentTurn}
        disabled={!!winner}
        lastMove={lastMove}
      />

      <button className="btn btn-secondary back-button" onClick={onBack}>
        메인 메뉴로
      </button>

      {winner && (
        <GameResult
          winner={winner}
          winnerName={winner === 'black' ? 'Player 1 (흑돌)' : 'Player 2 (백돌)'}
          onRestart={handleRestart}
          onExit={onBack}
        />
      )}
    </div>
  );
}

export default LocalGame;
