import React, { useState } from 'react';
import { useMultiplayerState, myPlayer, usePlayersList, isHost } from 'playroomkit';
import RacerSlider from './components/RacerSlider';
import RaceScreen from './components/RaceScreen';
import './App.css';

const App = () => {
  const players = usePlayersList();
  const [playerChoices, setPlayerChoices] = useMultiplayerState("racerChoices", {});
  const [raceStarted, setRaceStarted] = useMultiplayerState("raceStarted", false);
  const [localRaceStarted, setLocalRaceStarted] = useState(false);
  const myPlayerId = myPlayer()?.id;

  // Проверяем, занят ли гонщик другим игроком
  const isRacerTaken = (racerId) => {
    return Object.values(playerChoices).some(choice => choice.id === racerId);
  };

  // Выбор гонщика
  const handleSelectRacer = (racer) => {
    if (!myPlayerId) return;
    
    if (playerChoices[myPlayerId]?.id === racer.id) {
      const newChoices = { ...playerChoices };
      delete newChoices[myPlayerId];
      setPlayerChoices(newChoices);
      return;
    }

    if (!isRacerTaken(racer.id)) {
      setPlayerChoices({
        ...playerChoices,
        [myPlayerId]: racer
      });
    }
  };

  // Получаем гонщика текущего игрока
  const myRacer = myPlayerId ? playerChoices[myPlayerId] : null;

  // Проверяем, все ли игроки выбрали гонщиков
  const allPlayersReady = players.length > 0 && players.every(player => playerChoices[player.id]);

  // Запуск гонки
  const startRace = () => {
    if (allPlayersReady && isHost()) {
      setRaceStarted(true);
      setLocalRaceStarted(true);
      console.log("Гонка началась!");
    }
  };

  // Возврат в лобби
  const backToLobby = () => {
    if (isHost()) {
      setRaceStarted(false);
    }
    setLocalRaceStarted(false);
  };

  // Синхронизация состояния гонки
  React.useEffect(() => {
    if (raceStarted) {
      setLocalRaceStarted(true);
    } else {
      setLocalRaceStarted(false);
    }
  }, [raceStarted]);
  if (!myPlayerId) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Подключение к игре...</p>
      </div>
    );
  }

  // Если гонка началась, показываем экран гонки
  if (localRaceStarted) {
    return <RaceScreen onBackToLobby={backToLobby} />;
  }

  return (
    <div className="app-container">
      {isHost() && (
        <div className="host-indicator">
          ★ Вы хост
        </div>
      )}
      <div className="main-content">
        <RacerSlider
          onSelectRacer={handleSelectRacer}
          selectedRacer={myRacer}
          isRacerTaken={isRacerTaken}
        />

        {/* Статус игроков */}
        <div className="players-status">
          <h3>Статус игроков:</h3>
          <div className="players-list">
            {players.map(player => {
              const playerRacer = playerChoices[player.id];
              const isMe = player.id === myPlayerId;
              
              return (
                <div key={player.id} className="player-status-item">
                  <img 
                    src={player.getProfile().photo} 
                    alt="Avatar" 
                    className={`player-avatar ${isMe ? 'my-avatar' : ''}`}
                  />
                  <span className="player-name">
                    {player.getProfile().name || `Игрок ${player.id.slice(0, 4)}`}
                    {isMe && " (Вы)"}
                  </span>
                  <span className={`status ${
                    playerRacer ? 'ready' : 'choosing'
                  }`}>
                    {playerRacer ? `✅ ${playerRacer.name}` : 'Выбирает...'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Информация о готовности */}
        <div className="readiness-info">
          <div className={`readiness-indicator ${allPlayersReady ? 'ready' : 'waiting'}`}>
            {allPlayersReady ? '🎉 Все готовы к гонке!' : '⏳ Ожидаем других игроков...'}
          </div>
          
          {allPlayersReady && (
            <div className="ready-players-count">
              Готово игроков: {players.filter(p => playerChoices[p.id]).length}/{players.length}
            </div>
          )}
        </div>

        {/* Кнопка запуска для хоста */}
        {isHost() && (
          <div className="race-controls">
            <button
              className={`start-race-btn ${allPlayersReady ? 'active' : ''}`}
              onClick={startRace}
              disabled={!allPlayersReady}
            >
              {allPlayersReady ? '🚀 СТАРТ ГОНКИ!' : 'Не все игроки выбрали гонщиков'}
            </button>
          </div>
        )}       
      </div>
    </div>
  );
};

export default App;