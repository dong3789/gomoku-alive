import { GameMode } from '../types';

interface MainMenuProps {
  onSelectMode: (mode: GameMode) => void;
}

function MainMenu({ onSelectMode }: MainMenuProps) {
  return (
    <div className="main-menu">
      <button
        className="menu-button online"
        onClick={() => onSelectMode('online')}
      >
        온라인 대전
      </button>
      <button
        className="menu-button ai"
        onClick={() => onSelectMode('ai')}
      >
        AI 대전
      </button>
      <button
        className="menu-button local"
        onClick={() => onSelectMode('local')}
      >
        로컬 대전 (2인)
      </button>
    </div>
  );
}

export default MainMenu;
