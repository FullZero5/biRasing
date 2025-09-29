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
  console.log(playerChoices)
  // ✅ ИЗМЕНЕНО: Синхронизируем только время старта и настройки
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

  // ✅ ОСНОВНАЯ ФУНКЦИЯ: Вычисление текущей позиции гонщика
  const calculateRacerPosition = useCallback((racerId) => {
    if (!raceStartTime || raceStatus !== "racing") return 0;
    
    const settings = racerSettings[racerId];
    if (!settings) return 0;
    
    // Вычисляем прогресс на основе времени
    const elapsedTime = Date.now() - raceStartTime;
    const position = elapsedTime  * settings.speed * 0.1; // позиция = время * скорость
    
    return Math.min(position, 1.0); // Ограничиваем 100%
  }, [raceStartTime, raceStatus, racerSettings]);

  // ✅ ФУНКЦИЯ ОБНОВЛЕНИЯ МАРКЕРОВ
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
  }, [activeRacers, calculateRacerPosition, getPositionCoords]);

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

  // ✅ ИНИЦИАЛИЗАЦИЯ НАСТРОЕК ГОНКИ (ТОЛЬКО ХОСТ)
  useEffect(() => {
    if (activeRacers.length === 0 || !smoothRoute.length || !isHost()) return;

    const needsInitialization = Object.keys(racerSettings).length === 0;

    if (needsInitialization) {
      console.log("🎯 Хост инициализирует настройки гонки");
      const settings = {};
      activeRacers.forEach(player => {
        settings[player.id] = {
          speed: 0.0005 + Math.random() * 0.0003, // Более реалистичная скорость
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
        paint: {
          'line-color': '#ff0000',
          'line-width': 4
        }
      });

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
  };

  const resetRace = () => {
    if (!isHost()) return;

    console.log("🔄 Сброс гонки...");
    setRaceStatus("waiting");
    setRaceStartTime(null);
    
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
      
      return {
        player,
        position,
        finished: position >= 1.0,
        name: settings?.name || 'Игрок'
      };
    }).sort((a, b) => b.position - a.position);
  }, [activeRacers, calculateRacerPosition, racerSettings]);

  return (
    <div className="race-screen">
      <div className="race-header">
        <div className="race-title">
          <h2>🏁 Велогонка {isHost() && "👑"}</h2>
          <div className="race-subtitle">
            {selectedCity ? `Город: ${selectedCity.name}` : "Выбор города..."}
            {raceStatus === "racing" && " - ГОНКА!"}
            {raceStatus === "finished" && " - ФИНИШ!"}
          </div>
        </div>
        
        <div className="race-controls">
          {raceStatus === "waiting" && (
            <button 
              onClick={startRace} 
              className="start-button" 
              disabled={activeRacers.length === 0 || !isHost()}
            >
              🏁 Старт ({activeRacers.length})
            </button>
          )}
          {(raceStatus === "racing" || raceStatus === "finished") && (
            <button 
              onClick={resetRace} 
              className="reset-button"
              disabled={!isHost()}
            >
              🔄 Сброс
            </button>
          )}
          <button onClick={onBackToLobby} className="back-button">
            ← Лобби
          </button>
        </div>
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
            <h3>🏆 Гонщики ({activeRacers.length})</h3>
            {activeRacers.length === 0 ? (
              <div className="no-racers">
                <p>Нет участников</p>
              </div>
            ) : (
              <div className="racers-list">
                {leaderboard.map((item, index) => (
                  <div key={item.player.id} className="racer-item">
                    <div className="racer-position">#{index + 1}</div>
                    <div className="racer-color" 
                         style={{ backgroundColor: playerChoices[item.player.id]?.color }} />
                    <div className="racer-name">{playerChoices[item.player.id]?.name }</div>
                    <div className="racer-progress">
                      {Math.round(item.position * 100)}%
                      {item.finished && " 🏁"}
                    </div>
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