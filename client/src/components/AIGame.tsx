import { useState, useCallback, useEffect } from 'react';
import { CellState, StoneColor, Move, Difficulty } from '../types';
import { createEmptyBoard, checkWinner, isValidMove } from '../utils/gameLogic';
import { getAIMove } from '../utils/aiPlayer';
import Board from './Board';
import GameResult from './GameResult';

interface AIGameProps {
  difficulty: Difficulty;
  onChangeDifficulty: (difficulty: Difficulty) => void;
  onBack: () => void;
}

function AIGame({ difficulty, onChangeDifficulty, onBack }: AIGameProps) {
  const [board, setBoard] = useState<CellState[][]>(createEmptyBoard());
  const [currentTurn, setCurrentTurn] = useState<StoneColor>('black');
  const [winner, setWinner] = useState<StoneColor | null>(null);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const playerColor: StoneColor = 'black';
  const aiColor: StoneColor = 'white';

  // AI 턴 처리
  useEffect(() => {
    if (!gameStarted || winner || currentTurn !== aiColor) return;

    setIsAIThinking(true);

    // AI 사고 시간 시뮬레이션
    const thinkingTime = difficulty === 'easy' ? 500 : difficulty === 'medium' ? 800 : 1200;

    const timeout = setTimeout(() => {
      const aiMove = getAIMove(board, aiColor, difficulty);

      const newBoard = board.map(r => [...r]);
      newBoard[aiMove.row][aiMove.col] = aiColor;
      setBoard(newBoard);
      setLastMove({ row: aiMove.row, col: aiMove.col, color: aiColor });

      if (checkWinner(newBoard, aiMove.row, aiMove.col, aiColor)) {
        setWinner(aiColor);
      } else {
        setCurrentTurn(playerColor);
      }

      setIsAIThinking(false);
    }, thinkingTime);

    return () => clearTimeout(timeout);
  }, [currentTurn, board, winner, gameStarted, difficulty]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (!gameStarted || winner || isAIThinking) return;
    if (currentTurn !== playerColor) return;
    if (!isValidMove(board, row, col)) return;

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = playerColor;
    setBoard(newBoard);
    setLastMove({ row, col, color: playerColor });

    if (checkWinner(newBoard, row, col, playerColor)) {
      setWinner(playerColor);
    } else {
      setCurrentTurn(aiColor);
    }
  }, [board, currentTurn, winner, isAIThinking, gameStarted]);

  const handleRestart = () => {
    setBoard(createEmptyBoard());
    setCurrentTurn('black');
    setWinner(null);
    setLastMove(null);
    setIsAIThinking(false);
    setGameStarted(true);
  };

  const handleStartGame = (selectedDifficulty: Difficulty) => {
    onChangeDifficulty(selectedDifficulty);
    setGameStarted(true);
  };

  const getDifficultyName = (diff: Difficulty) => {
    switch (diff) {
      case 'easy': return '쉬움';
      case 'medium': return '보통';
      case 'hard': return '어려움';
    }
  };

  if (!gameStarted) {
    return (
      <div className="difficulty-select">
        <h2>난이도를 선택하세요</h2>
        <div className="difficulty-buttons">
          <button
            className="difficulty-btn easy"
            onClick={() => handleStartGame('easy')}
          >
            쉬움
          </button>
          <button
            className="difficulty-btn medium"
            onClick={() => handleStartGame('medium')}
          >
            보통
          </button>
          <button
            className="difficulty-btn hard"
            onClick={() => handleStartGame('hard')}
          >
            어려움
          </button>
        </div>
        <button className="btn btn-secondary back-button" onClick={onBack}>
          메인 메뉴로
        </button>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-info">
        <div className="player-info">
          <div className="stone-indicator black" />
          <span>나 (흑돌)</span>
        </div>
        <div className={`turn-indicator ${isAIThinking ? 'waiting' : ''}`}>
          {isAIThinking
            ? 'AI 생각 중...'
            : currentTurn === playerColor
              ? '내 차례'
              : 'AI 차례'}
        </div>
        <div className="player-info">
          <span>AI ({getDifficultyName(difficulty)})</span>
          <div className="stone-indicator white" />
        </div>
      </div>

      <Board
        board={board}
        onCellClick={handleCellClick}
        currentTurn={currentTurn}
        disabled={!!winner || isAIThinking || currentTurn !== playerColor}
        lastMove={lastMove}
      />

      <button className="btn btn-secondary back-button" onClick={onBack}>
        메인 메뉴로
      </button>

      {winner && (
        <GameResult
          winner={winner}
          winnerName={winner === playerColor ? '당신' : 'AI'}
          onRestart={handleRestart}
          onExit={onBack}
        />
      )}
    </div>
  );
}

export default AIGame;
