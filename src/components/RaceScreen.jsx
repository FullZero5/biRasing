// RaceScreen.jsx
import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useMultiplayerState, usePlayersList, isHost } from 'playroomkit';
import mapboxgl from 'mapbox-gl';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
import 'mapbox-gl/dist/mapbox-gl.css';

import { 
  getRandomCity, 
  getRouteInfo,
  CITIES 
} from '../constants/routeCoordinates';
import { 
  createSmoothRoute, 
  createDistanceMarkers, 
  calculateRouteCenter 
} from '../utils/routeCalculations';
import './RaceScreen.css';
import { MAPBOX_ACCESS_TOKEN } from '../mapboxConfig';
import FastRaceCamera from './RaceCamera';

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
const language =  new MapboxLanguage({ defaultLanguage: 'ru' });

const RaceScreen = ({ onBackToLobby }) => {
  const players = usePlayersList();
  const [playerChoices] = useMultiplayerState("racerChoices", {});
  
  // ✅ ДОБАВЛЕНО: Состояние финиша
  const [finishedRacers, setFinishedRacers] = useMultiplayerState("finishedRacers", {});
  const [raceResults, setRaceResults] = useMultiplayerState("raceResults", []);
  
  const [selectedCity, setSelectedCity] = useMultiplayerState("selectedCity", null);
  const [raceStartTime, setRaceStartTime] = useMultiplayerState("raceStartTime", null);
  const [raceStatus, setRaceStatus] = useMultiplayerState("raceStatus", "waiting");
  const [racerSettings, setRacerSettings] = useMultiplayerState("racerSettings", {});
  
  const [mapLoaded, setMapLoaded] = useState(false);
  
  const mapContainer = useRef(null);
  const map = useRef(null);
  const camera = useRef(null);
  const animationRef = useRef(null);
  const playerMarkersRef = useRef({});

  // Активные гонщики
  const activeRacers = useMemo(() => {
    const active = players.filter(player => {
      const choice = playerChoices[player.id];
      return choice && (choice.selected || choice.isSelected || choice.racer || choice.color);
    });
    return active;
  }, [players, playerChoices]);

  // Создаем маршрут
  const { smoothRoute, routeLength } = useMemo(() => {
    if (!selectedCity?.route) {
      return { smoothRoute: [], routeLength: 0 };
    }
    
    const result = createSmoothRoute(selectedCity.route, 500);
    return {
      smoothRoute: result.coordinates,
      routeLength: result.totalLength
    };
  }, [selectedCity]);

  // Центр карты
  const mapCenter = useMemo(() => {
    return smoothRoute.length > 0 
      ? calculateRouteCenter(smoothRoute)
      : (selectedCity?.center || [37.6173, 55.7558]);
  }, [smoothRoute, selectedCity]);

  // ✅ ВАЖНО: Функция для получения координат по прогрессу
  const getPositionCoords = useCallback((position) => {
    if (!smoothRoute.length) return null;
    const clampedPosition = Math.max(0, Math.min(position, 1.0));
    const pointIndex = Math.floor(clampedPosition * (smoothRoute.length - 1));
    return smoothRoute[Math.min(pointIndex, smoothRoute.length - 1)];
  }, [smoothRoute]);

  // ✅ ОБНОВЛЕНО: Вычисление текущей позиции гонщика с контролем финиша
  const calculateRacerPosition = useCallback((racerId) => {
    if (!raceStartTime || raceStatus !== "racing") return 0;
    
    // Если гонщик уже финишировал, возвращаем 100%
    if (finishedRacers[racerId]) {
      return 1.0;
    }
    
    const settings = racerSettings[racerId];
    if (!settings) return 0;
    
    // Вычисляем прогресс на основе времени
    const elapsedTime = Date.now() - raceStartTime;
    const position = elapsedTime * settings.speed * 0.1;
    
    return Math.min(position, 1.0);
  }, [raceStartTime, raceStatus, racerSettings, finishedRacers]);

  // ✅ НОВАЯ ФУНКЦИЯ: Проверка финиша гонщиков
  const checkRaceFinish = useCallback(() => {
    if (!isHost() || raceStatus !== "racing") return;

    const newFinishedRacers = { ...finishedRacers };
    const newRaceResults = [...raceResults];
    let hasNewFinishes = false;

    activeRacers.forEach(player => {
      const playerId = player.id;
      
      // Если игрок еще не финишировал и достиг 100%
      if (!newFinishedRacers[playerId]) {
        const position = calculateRacerPosition(playerId);
        
        if (position >= 1.0 && !newFinishedRacers[playerId]) {
          console.log(`🏁 Игрок ${playerId} финишировал!`);
          newFinishedRacers[playerId] = {
            finishTime: Date.now(),
            position: position
          };
          
          // Добавляем в результаты с временем финиша
          const finishTime = Date.now() - raceStartTime;
          newRaceResults.push({
            playerId: playerId,
            name: player.getProfile()?.name || `Игрок ${playerId.slice(0, 4)}`,
            finishTime: finishTime,
            finishPosition: Object.keys(newFinishedRacers).length
          });
          
          hasNewFinishes = true;
        }
      }
    });

    if (hasNewFinishes) {
      setFinishedRacers(newFinishedRacers);
      setRaceResults(newRaceResults.sort((a, b) => a.finishTime - b.finishTime));
    }

    // ✅ ДОБАВЛЕНО: Проверка завершения гонки
    const finishedCount = Object.keys(newFinishedRacers).length;
    const totalRacers = activeRacers.length;
    
    if (finishedCount === totalRacers && totalRacers > 0 && raceStatus === "racing") {
      console.log("🎉 Все гонщики финишировали! Гонка завершена.");
      setRaceStatus("finished");
    }
  }, [activeRacers, calculateRacerPosition, finishedRacers, raceResults, raceStatus, raceStartTime, isHost()]);

  // ✅ ОБНОВЛЕННАЯ ФУНКЦИЯ ОБНОВЛЕНИЯ МАРКЕРОВ
  const updateAllMarkers = useCallback(() => {
    activeRacers.forEach(player => {
      const marker = playerMarkersRef.current[player.id];
      if (marker) {
        const position = calculateRacerPosition(player.id);
        const coords = getPositionCoords(position);
        if (coords) {
          marker.setLngLat(coords);
        }
      }
    });

    // Проверяем финиш на каждом кадре анимации
    checkRaceFinish();
  }, [activeRacers, calculateRacerPosition, getPositionCoords, checkRaceFinish]);

  // ✅ ЕДИНЫЙ ЭФФЕКТ АНИМАЦИИ ДЛЯ ВСЕХ КЛИЕНТОВ
  useEffect(() => {
    if (raceStatus !== "racing" || !smoothRoute.length) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    console.log("🎬 Запуск плавной анимации для всех клиентов");

    const animate = () => {
      updateAllMarkers();
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [raceStatus, smoothRoute, updateAllMarkers]);

  // ✅ ОБНОВЛЕННАЯ ИНИЦИАЛИЗАЦИЯ НАСТРОЕК ГОНКИ
  useEffect(() => {
    if (activeRacers.length === 0 || !smoothRoute.length || !isHost()) return;

    const needsInitialization = Object.keys(racerSettings).length === 0;

    if (needsInitialization) {
      console.log("🎯 Хост инициализирует настройки гонки");
      const settings = {};
      activeRacers.forEach(player => {
        settings[player.id] = {
          speed: 0.0005 + Math.random() * 0.0003,
          name: player.getProfile()?.name || `Игрок ${player.id.slice(0, 4)}`
        };
      });

      setRacerSettings(settings);
    }
  }, [activeRacers, smoothRoute, racerSettings, isHost()]);

  // Синхронизированный выбор города
  useEffect(() => {
    if (!selectedCity && players.length > 0 && isHost()) {
      const city = getRandomCity();
      console.log("🏙️ Хост выбирает город:", city.name);
      setSelectedCity(city);
    }
  }, [selectedCity, players]);

  // ✅ ДОБАВЛЕНО: Сброс состояния финиша при рестарте
  useEffect(() => {
    if (raceStatus === "waiting" && Object.keys(finishedRacers).length > 0 && isHost()) {
      setFinishedRacers({});
      setRaceResults([]);
    }
  }, [raceStatus, finishedRacers, isHost()]);

  // ОСНОВНАЯ ИНИЦИАЛИЗАЦИЯ КАРТЫ
  useEffect(() => {
    if (map.current || !mapContainer.current || !selectedCity) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/outdoors-v11',
        center: mapCenter,
        zoom: 10,
        pitch: 0,
        bearing: 0
      });

      map.current.on('load', () => {
        console.log("✅ Карта успешно загружена!");
        setMapLoaded(true);
        camera.current = new FastRaceCamera(map.current);
        initializeMapLayers();
      });

      map.current.addControl(new mapboxgl.NavigationControl());
      map.current.addControl(language);

    } catch (error) {
      console.error("❌ Ошибка при создании карты:", error);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [selectedCity]);

  // Инициализация слоев карты
  const initializeMapLayers = () => {
    if (!map.current || !smoothRoute.length) return;

    try {
      map.current.addSource('race-route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: smoothRoute
          }
        }
      });

      map.current.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'race-route',
        layout: {
            "line-join": 'round',
            "line-cap": 'round'
        },
        paint: {
          'line-color': '#ff0000',
          'line-width': 4
        }
      });

      // ✅ ДОБАВЛЕНО: Маркер финиша
      if (smoothRoute.length > 0) {
        const finishCoords = smoothRoute[smoothRoute.length - 1];
        const finishMarker = new mapboxgl.Marker({ color: '#00ff00' })
          .setLngLat(finishCoords)
          .setPopup(new mapboxgl.Popup().setHTML('<h3>🏁 Финиш</h3>'))
          .addTo(map.current);
      }

      createPlayerMarkers();
    } catch (error) {
      console.error("❌ Ошибка инициализации слоев:", error);
    }
  };

  // Создание маркеров игроков
  const createPlayerMarkers = () => {
    if (!map.current) return;

    Object.values(playerMarkersRef.current).forEach(marker => {
      if (marker) marker.remove();
    });
    playerMarkersRef.current = {};

    activeRacers.forEach(player => {
      try {
        const color = playerChoices[player.id]?.color || '#ff0000';
        const name = player.getProfile()?.name || 'Игрок';
        
        const el = document.createElement('div');
        el.className = 'player-marker';
        el.style.backgroundColor = color;
        el.style.width = '20px';
        el.style.height = '20px';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid white';
        el.title = name;
        
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat(smoothRoute[0] || mapCenter)
          .addTo(map.current);
        
        playerMarkersRef.current[player.id] = marker;
      } catch (error) {
        console.error("❌ Ошибка создания маркера:", error);
      }
    });
  };

  // ✅ ОБНОВЛЕННОЕ УПРАВЛЕНИЕ ГОНКОЙ
  const startRace = () => {
    if (activeRacers.length === 0 || !isHost()) return;

    console.log("🏁 Запуск гонки...");
    setRaceStartTime(Date.now());
    setRaceStatus("racing");
    // Сбрасываем результаты предыдущей гонки
    setFinishedRacers({});
    setRaceResults([]);
  };

  const resetRace = () => {
    if (!isHost()) return;

    console.log("🔄 Сброс гонки...");
    setRaceStatus("waiting");
    setRaceStartTime(null);
    setFinishedRacers({});
    setRaceResults([]);
    
    // Сбрасываем позиции маркеров
    activeRacers.forEach(player => {
      const marker = playerMarkersRef.current[player.id];
      if (marker) {
        marker.setLngLat(smoothRoute[0] || mapCenter);
      }
    });
  };

  // ✅ ОБНОВЛЕННАЯ ТАБЛИЦА ЛИДЕРОВ
  const leaderboard = useMemo(() => {
    return activeRacers.map(player => {
      const position = calculateRacerPosition(player.id);
      const settings = racerSettings[player.id];
      const hasFinished = finishedRacers[player.id];
      
      return {
        player,
        position,
        finished: hasFinished,
        name: settings?.name || 'Игрок',
        finishTime: hasFinished ? raceResults.find(r => r.playerId === player.id)?.finishTime : null
      };
    }).sort((a, b) => {
      // Сначала сортируем по финишу, потом по позиции
      if (a.finished && !b.finished) return -1;
      if (!a.finished && b.finished) return 1;
      if (a.finished && b.finished) {
        return (a.finishTime || 0) - (b.finishTime || 0);
      }
      return b.position - a.position;
    });
  }, [activeRacers, calculateRacerPosition, racerSettings, finishedRacers, raceResults]);

  return (
    <div className="race-screen">
      <div className="race-header">
        <div className="race-title">
          <h2>Велогонка {isHost() && "👑"}</h2>
          <div className="race-subtitle">
            {selectedCity ? `Город: ${selectedCity.name}` : "Выбор города..."}
            {raceStatus === "racing" && " - ГОНКА!"}
            {raceStatus === "finished" && " - ФИНИШ!"}
          </div>
        </div>
        {isHost() && (
        <div className="race-controls">
          {raceStatus === "waiting" && (
            <button 
              onClick={startRace} 
              className="btn start-button" 
              disabled={activeRacers.length === 0 || !isHost()}
            >
              Старт ({activeRacers.length})
            </button>
          )}
          {(raceStatus === "racing" || raceStatus === "finished") && (
            <button 
              onClick={resetRace} 
              className="btn reset-button"
              disabled={!isHost()}
            >
              Сброс
            </button>
          )}
          <button onClick={onBackToLobby} className="btn back-button">
            ← Лобби
          </button>
        </div>)}
      </div>

      <div className="race-container">
        <div className="map-container">
          <div 
            ref={mapContainer} 
            className="map-wrapper"
            style={{ width: '100%', height: '100%' }}
          />
          
          {!mapLoaded && (
            <div className="map-loading">
              <div className="loading-spinner"></div>
              <p>Загрузка карты {selectedCity?.name}...</p>
            </div>
          )}
        </div>

        <div className="race-sidebar">
          <div className="leaderboard">
            <h3>Гонщики ({activeRacers.length})</h3>
            {raceStatus === "finished" && (
              <div className="race-finished-banner">
                <h4>🎉 Гонка завершена!</h4>
                <p>Победитель: {leaderboard[0]?.name}</p>
              </div>
            )}
            {activeRacers.length === 0 ? (
              <div className="no-racers">
                <p>Нет участников</p>
              </div>
            ) : (
              <div className="racers-list">
                {leaderboard.map((item, index) => (
                  <div key={item.player.id} className={`racer-item ${item.finished ? 'finished' : ''}`}>
                    <div className="racer-position">
                      {item.finished ? `${index + 1}` : `#${index + 1}`}
                    </div>
                    <div className="racer-color" 
                         style={{ backgroundColor: playerChoices[item.player.id]?.color }} />
                    <div className="racer-name">{playerChoices[item.player.id]?.name}</div>
                    <div className="racer-progress">
                      {item.finished && "🏁"}
                    </div>
                    {item.finished && item.finishTime && (
                      <div className="finish-time">
                        {((item.finishTime || 0) / 1000).toFixed(1)}с
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaceScreen;