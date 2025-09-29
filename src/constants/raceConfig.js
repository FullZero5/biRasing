// constants/raceConfig.js
export const RACE_CONFIG = {
    CAMERA: {
        RACING: { zoom: 14, pitch: 35 },
        START: { zoom: 12, pitch: 25, bearing: 0 }
    },
    RACE: {
        STATUS: {
            WAITING: 'waiting',
            RACING: 'racing',
            FINISHED: 'finished'
        },
        SPEED: {
            BASE: 0.0005,
            VARIATION: 0.0003
        }
    }
};

export const MAP_CONFIG = {
    style: 'mapbox://styles/mapbox/outdoors-v11',
    center: [37.6173, 55.7558], // Москва по умолчанию
    zoom: 10
};