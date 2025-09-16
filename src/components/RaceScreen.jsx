import React, { useEffect, useState } from 'react';
import { useMultiplayerState, usePlayersList } from 'playroomkit';
import './RaceScreen.css';

const RaceScreen = ({ onBackToLobby }) => {
  const players = usePlayersList();
  const [playerChoices] = useMultiplayerState("racerChoices", {});
  const [raceProgress, setRaceProgress] = useMultiplayerState("raceProgress", {});
  const [raceTime, setRaceTime] = useState(0);
  const [raceFinished, setRaceFinished] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setRaceTime(prev => prev + 0.1);
    }, 100);
    
    return () => clearInterval(timer);
  }, []);

  const simulateRace = () => {
    const newProgress = {};
    players.forEach(player => {
      if (playerChoices[player.id]) {
        const speed = Math.random() * 2 + 3; // Случайная скорость
        newProgress[player.id] = Math.min(100, (raceProgress[player.id] || 0) + speed);
        
        if (newProgress[player.id] >= 100 && !raceFinished) {
          setRaceFinished(true);
        }
      }
    });
    setRaceProgress(newProgress);
  };

  useEffect(() => {
    if (!raceFinished) {
      const raceInterval = setInterval(simulateRace, 500);
      return () => clearInterval(raceInterval);
    }
  }, [raceFinished]);

  const getWinner = () => {
    if (!raceFinished) return null;
    
    const playersWithProgress = players
      .filter(player => raceProgress[player.id] >= 100)
      .sort((a, b) => raceProgress[b.id] - raceProgress[a.id]);
    
    return playersWithProgress[0];
  };

  const winner = getWinner();

  return (
    <div className="race-screen">
      {/* Фон трассы */}
      <div className="race-track">
        <div className="finish-line"></div>
        
        {/* Отображение гонщиков на трассе */}
        {players.map(player => {
          const racer = playerChoices[player.id];
          if (!racer) return null;
          
          const progress = raceProgress[player.id] || 0;
          const isWinner = winner?.id === player.id;
          
          return (
            <div
              key={player.id}
              className={`racer-on-track ${isWinner ? 'winner' : ''}`}
              style={{ left: `${progress}%` }}
            >
              <img
                src={racer.image}
                alt={racer.name}
                className="race-racer-img"
                style={{ filter: `drop-shadow(0 0 10px ${racer.color})` }}
              />
              <div className="racer-name-tag">
                {player.getProfile().name || `Игрок ${player.id.slice(0, 4)}`}
                {isWinner && " 🏆"}
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${progress}%`, backgroundColor: racer.color }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Панель информации о гонке */}
      <div className="race-info-panel">
        <div className="race-timer">
          ⏱️ Время: {raceTime.toFixed(1)}с
        </div>
        
        <div className="race-leaderboard">
          <h3>🏁 ТАБЛО 🏁</h3>
          {players
            .filter(player => playerChoices[player.id])
            .sort((a, b) => (raceProgress[b.id] || 0) - (raceProgress[a.id] || 0))
            .map((player, index) => {
              const racer = playerChoices[player.id];
              const progress = raceProgress[player.id] || 0;
              
              return (
                <div key={player.id} className="leaderboard-item">
                  <span className="position">#{index + 1}</span>
                  <span 
                    className="racer-color"
                    style={{ backgroundColor: racer.color }}
                  ></span>
                  <span className="player-name">
                    {player.getProfile().name || `Игрок ${player.id.slice(0, 4)}`}
                  </span>
                  <span className="progress">{progress.toFixed(1)}%</span>
                  {progress >= 100 && <span className="finished">🏁</span>}
                </div>
              );
            })}
        </div>

        {raceFinished && winner && (
          <div className="winner-announcement">
            <div className="winner-title">🎉 ПОБЕДИТЕЛЬ! 🎉</div>
            <div className="winner-name">
              {winner.getProfile().name || `Игрок ${winner.id.slice(0, 4)}`}
            </div>
            <div className="winner-racer">
              на {playerChoices[winner.id]?.name}
            </div>
            <div className="winner-time">
              Время: {raceTime.toFixed(1)} секунд
            </div>
          </div>
        )}

        <button className="back-to-lobby-btn" onClick={onBackToLobby}>
          ← Вернуться в лобби
        </button>
      </div>

      {/* Эффекты гонки */}
      <div className="race-effects">
        <div className="speed-lines"></div>
        {!raceFinished && (
          <div className="countdown">
            {raceTime < 1 ? '3' : raceTime < 2 ? '2' : raceTime < 3 ? '1' : 'ГОНКА!'}
          </div>
        )}
      </div>
    </div>
  );
};

export default RaceScreen;