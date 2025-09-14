import { useEffect, useState } from 'react'
import { useMultiplayerState, myPlayer, usePlayersList, isHost } from 'playroomkit'

// Данные о доступных гонщиках
const racersData = [
  { id: 1, name: "Красный", image: "https://cdn-icons-png.flaticon.com/512/744/744465.png", color: "#e74c3c" },
  { id: 2, name: "Синий", image: "https://cdn-icons-png.flaticon.com/512/744/744465.png", color: "#3498db" },
  { id: 3, name: "Зелёный", image: "https://cdn-icons-png.flaticon.com/512/744/744465.png", color: "#2ecc71" },
  { id: 4, name: "Жёлтый", image: "https://cdn-icons-png.flaticon.com/512/744/744465.png", color: "#f1c40f" },
  { id: 5, name: "Фиолетовый", image: "https://cdn-icons-png.flaticon.com/512/744/744465.png", color: "#9b59b6" },
  { id: 6, name: "Оранжевый", image: "https://cdn-icons-png.flaticon.com/512/744/744465.png", color: "#e67e22" }
]

function App() {
  const players = usePlayersList()
  const [playerChoices, setPlayerChoices] = useMultiplayerState("racerChoices", {})
  const [raceStarted, setRaceStarted] = useMultiplayerState("raceStarted", false)
  const myPlayerId = myPlayer()?.id

  // Проверяем, выбрал ли уже игрок гонщика
  const hasPlayerChosen = (playerId) => {
    return playerChoices[playerId] !== undefined
  }

  // Проверяем, занят ли гонщик другим игроком
  const isRacerTaken = (racerId) => {
    return Object.values(playerChoices).some(choice => choice.id === racerId)
  }

  // Выбор гонщика
  const selectRacer = (racer) => {
    if (!myPlayerId) return
    
    if (isRacerTaken(racer.id) && (!playerChoices[myPlayerId] || playerChoices[myPlayerId].id !== racer.id)) {
      console.log("Этот гонщик уже выбран!")
      return
    }

    setPlayerChoices({
      ...playerChoices,
      [myPlayerId]: racer
    })
  }

  // Отмена выбора
  const clearSelection = () => {
    if (!myPlayerId) return
    
    const newChoices = { ...playerChoices }
    delete newChoices[myPlayerId]
    setPlayerChoices(newChoices)
  }

  // Получаем гонщика текущего игрока
  const myRacer = myPlayerId ? playerChoices[myPlayerId] : null

  // Проверяем, все ли игроки выбрали гонщиков
  const allPlayersReady = players.length > 0 && players.every(player => hasPlayerChosen(player.id))

  // Запуск гонки
  const startRace = () => {
    if (allPlayersReady) {
      setRaceStarted(true)
      console.log("Гонка началась!")
    }
  }

  // Эффект для обработки начала гонки
  useEffect(() => {
    if (raceStarted) {
      alert("Гонка начинается!")
    }
  }, [raceStarted])

  if (!myPlayerId) {
    return (
      <div className="empty-state">
        Загрузка...
      </div>
    )
  }

  return (
    <div className={`App ${allPlayersReady ? 'all-ready' : ''}`} style={{ 
      background: `linear-gradient(135deg, #1a1a2e 0%, ${myPlayer().getProfile().color.hexString}33 100%)` 
    }}>
      {isHost() && (
        <div className="host-indicator">
          Вы хост
        </div>
      )}
      
      <div className="header">
        <h1>Выбор гонщиков</h1>
        <p>Выберите себе гонщика. Когда все выберут, хост может начать гонку.</p>
      </div>
      
      {/* Отображение выбора игроков */}
      <div className="players-display">
        {players.length === 0 ? (
          <div className="empty-state">
            Ожидаем подключения других игроков...
          </div>
        ) : (
          players.map(player => {
            const playerChoice = playerChoices[player.id]
            const isMe = player.id === myPlayerId
            const isReady = hasPlayerChosen(player.id)
            
            return (
              <div key={player.id} className={`player-card ${isMe ? 'selected' : ''} ${isReady ? 'ready' : ''}`}>
                <img 
                  src={player.getProfile().photo} 
                  className="player-avatar"
                  alt="Аватар"
                />
                <div className="player-name">
                  {player.getProfile().name || `Игрок ${player.id.slice(0, 4)}`}
                  {isMe && " (Вы)"}
                </div>
                
                {playerChoice ? (
                  <div>
                    <img 
                      src={playerChoice.image} 
                      className="player-racer"
                      alt={playerChoice.name}
                      style={{ filter: `drop-shadow(0 0 8px ${playerChoice.color})` }}
                    />
                    <div className="player-name">{playerChoice.name}</div>
                    <div className="player-status ready">Готов к гонке!</div>
                  </div>
                ) : (
                  <div className="player-status choosing">
                    {isMe ? "Выберите гонщика" : "Выбирает гонщика..."}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Панель выбора гонщиков */}
      <div className="racers-container">
        {racersData.map(racer => {
          const isTaken = isRacerTaken(racer.id)
          const isMyChoice = myRacer && myRacer.id === racer.id
          const isDisabled = isTaken && !isMyChoice

          return (
            <div 
              key={racer.id}
              className={`racer-button ${isMyChoice ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
              onClick={() => {
                if (isDisabled) return
                if (isMyChoice) {
                  clearSelection()
                } else {
                  selectRacer(racer)
                }
              }}
              title={isDisabled ? "Уже выбран" : isMyChoice ? "Отменить выбор" : racer.name}
              style={isMyChoice ? { borderColor: racer.color } : {}}
            >
              <img src={racer.image} alt={racer.name} />
              <span>{racer.name}</span>
            </div>
          )
        })}
        
        {/* Кнопка запуска гонки для хоста */}
        {isHost() && (
          <button 
            className="start-race-btn"
            onClick={startRace}
            disabled={!allPlayersReady || raceStarted}
          >
            {raceStarted ? "Гонка началась!" : "Старт гонки!"}
          </button>
        )}
      </div>
    </div>
  )
}

export default App