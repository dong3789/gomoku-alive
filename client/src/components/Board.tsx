import { CellState, StoneColor, Move } from '../types';

interface BoardProps {
  board: CellState[][];
  onCellClick: (row: number, col: number) => void;
  currentTurn: StoneColor;
  disabled?: boolean;
  lastMove?: Move | null;
}

function Board({ board, onCellClick, currentTurn, disabled = false, lastMove }: BoardProps) {
  return (
    <div className="board-wrapper">
      <div className="board">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isLastMove = lastMove?.row === rowIndex && lastMove?.col === colIndex;

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="cell"
                onClick={() => !disabled && !cell && onCellClick(rowIndex, colIndex)}
              >
                {cell ? (
                  <div className={`stone ${cell} ${isLastMove ? 'last-move' : ''}`} />
                ) : (
                  !disabled && (
                    <div className={`stone ${currentTurn} hover-stone`} />
                  )
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Board;
