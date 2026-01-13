import { useState } from 'react';
import { GameMode, Difficulty } from './types';
import MainMenu from './components/MainMenu';
import OnlineLobby from './components/OnlineLobby';
import LocalGame from './components/LocalGame';
import AIGame from './components/AIGame';

function App() {
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const handleBack = () => {
    setGameMode(null);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>오목 온라인</h1>
        <p>Gomoku - 5목을 먼저 완성하세요!</p>
      </header>

      {gameMode === null && (
        <MainMenu onSelectMode={setGameMode} />
      )}

      {gameMode === 'online' && (
        <OnlineLobby onBack={handleBack} />
      )}

      {gameMode === 'ai' && (
        <AIGame
          difficulty={difficulty}
          onChangeDifficulty={setDifficulty}
          onBack={handleBack}
        />
      )}

      {gameMode === 'local' && (
        <LocalGame onBack={handleBack} />
      )}
    </div>
  );
}

export default App;
