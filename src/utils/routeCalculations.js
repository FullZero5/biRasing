// src/utils/routeCalculations.js
import { length, lineString, along } from '@turf/turf';

/**
 * Рассчитывает точную длину маршрута в километрах
 */
export const calculateRouteLength = (coordinates) => {
  if (!coordinates || coordinates.length < 2) return 0;
  
  try {
    const line = lineString(coordinates);
    return length(line, { units: 'kilometers' });
  } catch (error) {
    console.error('Ошибка расчета длины маршрута:', error);
    return 0;
  }
};

/**
 * Рассчитывает приблизительное время гонки
 */
export const calculateRaceTime = (routeLength, averageSpeed = 35) => {
  if (routeLength <= 0) return { minutes: 0, formatted: '0 мин' };
  
  const minutes = Math.round((routeLength / averageSpeed) * 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  let formatted = '';
  if (hours > 0) {
    formatted = `${hours}ч ${remainingMinutes}мин`;
  } else {
    formatted = `${minutes}мин`;
  }
  
  return { minutes, hours, remainingMinutes, formatted };
};

/**
 * Создает сглаженный маршрут с равномерными сегментами
 */
export const createSmoothRoute = (coordinates, segmentsCount = 200) => {
  if (!coordinates || coordinates.length < 2) return [];
  
  try {
    const line = lineString(coordinates);
    const totalLength = length(line, { units: 'kilometers' });
    
    const smoothRoute = [];
    for (let i = 0; i <= segmentsCount; i++) {
      const distance = (i / segmentsCount) * totalLength;
      const point = along(line, distance, { units: 'kilometers' });
      smoothRoute.push(point.geometry.coordinates);
    }
    
    return {
      coordinates: smoothRoute,
      totalLength: Math.round(totalLength * 10) / 10,
      segmentsCount: smoothRoute.length
    };
  } catch (error) {
    console.error('Ошибка создания сглаженного маршрута:', error);
    return { coordinates: [], totalLength: 0, segmentsCount: 0 };
  }
};

/**
 * Рассчитывает позицию на маршруте по прогрессу (0-100%)
 */
export const calculatePositionOnRoute = (route, progress) => {
  if (!route || route.length === 0 || progress < 0) return null;
  
  const clampedProgress = Math.min(progress, 100);
  const segmentIndex = (clampedProgress / 100) * (route.length - 1);
  const index = Math.floor(segmentIndex);
  const fraction = segmentIndex - index;
  
  if (index >= route.length - 1) {
    return route[route.length - 1];
  }
  
  // Линейная интерполяция между точками
  const start = route[index];
  const end = route[index + 1];
  
  return [
    start[0] + (end[0] - start[0]) * fraction,
    start[1] + (end[1] - start[1]) * fraction
  ];
};

/**
 * Создает километровые отметки на маршруте
 */
export const createDistanceMarkers = (route, intervalKm = 2) => {
  if (!route || route.length < 2) return [];
  
  try {
    const line = lineString(route);
    const totalLength = length(line, { units: 'kilometers' });
    
    const markers = [];
    for (let km = intervalKm; km < totalLength; km += intervalKm) {
      const point = along(line, km, { units: 'kilometers' });
      markers.push({
        coordinates: point.geometry.coordinates,
        distance: km,
        label: `${km} км`
      });
    }
    
    return markers;
  } catch (error) {
    console.error('Ошибка создания километровых отметок:', error);
    return [];
  }
};

/**
 * Рассчитывает центр маршрута для позиционирования карты
 */
export const calculateRouteCenter = (coordinates) => {
  if (!coordinates || coordinates.length === 0) return [37.6173, 55.7558];
  
  const lng = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;
  const lat = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;
  
  return [lng, lat];
};

/**
 * Оптимизирует маршрут - убирает слишком близкие точки
 */
export const optimizeRoute = (coordinates, minDistanceKm = 0.01) => {
  if (!coordinates || coordinates.length < 2) return coordinates;
  
  const optimized = [coordinates[0]];
  const line = lineString(coordinates);
  
  for (let i = 1; i < coordinates.length - 1; i++) {
    const prevPoint = lineString([optimized[optimized.length - 1], coordinates[i]]);
    const distance = length(prevPoint, { units: 'kilometers' });
    
    if (distance >= minDistanceKm) {
      optimized.push(coordinates[i]);
    }
  }
  
  optimized.push(coordinates[coordinates.length - 1]);
  return optimized;
};

export default {
  calculateRouteLength,
  calculateRaceTime,
  createSmoothRoute,
  calculatePositionOnRoute,
  createDistanceMarkers,
  calculateRouteCenter,
  optimizeRoute
};