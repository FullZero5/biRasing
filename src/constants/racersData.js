import solovkin from '../assets/solovkin.png'
import valay from '../assets/valay.png'
import oleg from '../assets/oleg.png'
import olegY from '../assets/olegY.png'
import grisha from '../assets/grisha.png'
import roma from '../assets/roma.png'
import viktor from '../assets/viktor.png'
import bg from '../assets/bg.webp'

export const racers = [
    {
        id: 1,
        name: "СОЛОВКИН СЕРГЕЙ",
        image: solovkin,
        bgImage: bg,
        color: "#ff0000",
        speed: "320 км/ч",
        acceleration: "3.2s",
        power: "850 л.с."
    },
    {
        id: 2,
        name: "КУРОПАТКИНА ВАЛЕНТИНА",
        image: valay,
        bgImage: bg,
        color: "#ffff00",
        speed: "340 км/ч",
        acceleration: "2.9s",
        power: "920 л.с."
    },
    {
        id: 3,
        name: "МАНДРИЧЕНКО ОЛЕГ",
        image: oleg,
        bgImage: bg,
        color: "#00ff00",
        speed: "360 км/ч",
        acceleration: "2.5s",
        power: "1050 л.с."
    },
    {
        id: 4,
        name: "ЯРИГА ОЛЕГ",
        image: olegY,
        bgImage: bg,
        color: "#000000",
        speed: "330 км/ч",
        acceleration: "3.0s",
        power: "880 л.с."
    },
    {   
        id: 5,
        name: "ГРИША",
        image: grisha,
        bgImage: bg,
        color: "#0f5504",
        speed: "300 км/ч",
        acceleration: "3.0s",
        power: "890 л.с."
    },
    {   
        id: 6,
        name: "РОМА",
        image: roma,
        bgImage: bg,
        color: "#115bf4",
        speed: "200 км/ч",
        acceleration: "3.1s",
        power: "840 л.с."
    },
    {
        id: 6,
        name: "ВИКТОР ЛАРИОНОВ",
        image: viktor,
        bgImage: bg,
        color: "#ff1b04",
        speed: "900 км/ч",
        acceleration: "1.1s",
        power: "1840 л.с."
    }
];

export default racers;