import { RACE_CONFIG } from '../constants/raceConfig';

export default class FastRaceCamera {
    constructor(map) {
      this.map = map;
    }
  
    update(leaderCoords) {
      if (!leaderCoords) return;
      this.map.jumpTo({
        center: leaderCoords,
        zoom: RACE_CONFIG.CAMERA.RACING.zoom,
        pitch: RACE_CONFIG.CAMERA.RACING.pitch
      });
    }
  
    resetToStart(startCoords) {
      this.map.jumpTo({
        center: startCoords,
        zoom: RACE_CONFIG.CAMERA.START.zoom,
        pitch: RACE_CONFIG.CAMERA.START.pitch,
        bearing: RACE_CONFIG.CAMERA.START.bearing
      });
    }
  }