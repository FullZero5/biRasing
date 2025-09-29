import React, { useState, useRef, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import './RacerSlider.css';
import logo from '../assets/logo.png'
import racers from '../constants/racersData';

const RacerSlider = ({ onSelectRacer, selectedRacer, isRacerTaken }) => {
  const [swiper, setSwiper] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const productImgRef = useRef(null);
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  

  useEffect(() => {
    if (productImgRef.current) {
      const items = productImgRef.current.children;
      for (let i = 0; i < items.length; i++) {
        items[i].classList.remove('active');
      }
      if (items[activeIndex]) {
        items[activeIndex].classList.add('active');
      }
    }
  }, [activeIndex]);

  const handleSlideChange = (swiper) => {
    setActiveIndex(swiper.activeIndex);
  };

  const handleSelect = (racer) => {
    if (!isRacerTaken(racer.id) || selectedRacer?.id === racer.id) {
      onSelectRacer(racer);
    }
  };

  return (
    <div className="racer-slider-wrapper">
      <div className="content">
        <div className="bg-shape">
          <img src={logo} alt="Racing Logo" />
        </div>

        <div className="product-img" ref={productImgRef}>
          {racers.map((racer, index) => (
            <div 
            key={racer.id} 
            className={`product-img__item ${activeIndex === racer.id ? 'active' : ''}`} 
            id={`img${index + 1}`}>
              <img src={racer.image} alt={racer.name} className="product-img__img" />
            </div>
          ))}
        </div>

        <div className="product-slider">
          <button ref={prevRef} 
            className={`prev ${activeIndex === 0 ? 'disabled' : ''}`}
            onClick={() => swiper?.slidePrev()}
          >
            <span className="icon">
              <FaArrowLeft />
            </span>
          </button>

          <button ref={nextRef}
            className={`next ${activeIndex === racers.length - 1 ? 'disabled' : ''}`}
            onClick={() => swiper?.slideNext()}
          >
            <span className="icon">
              <FaArrowRight />
            </span>
          </button>

          <Swiper
            modules={[EffectFade, Navigation]}
            spaceBetween={30}
            effect={'fade'}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}                   
            onSlideChange={handleSlideChange}
            onInit={(swiper) => {
              swiper.params.navigation.prevEl = prevRef.current;
              swiper.params.navigation.nextEl = nextRef.current;
              swiper.navigation.init();
              swiper.navigation.update();
            }}
            className="product-slider__wrp"
          >
            {racers.map((racer, index) => (
              <SwiperSlide key={racer.id} data-target={`img${index + 1}`}>                
                  <div className="product-slider__card">
                    <img src={racer.bgImage} alt={racer.name} className="product-slider__cover" />
                    <div className="product-slider__content">
                      <h1 className="product-slider__title">
                        {racer.name.toUpperCase()}
                      </h1>
                      <span className="product-slider__price">СКОРОСТЬ: {racer.speed}</span>

                      <div className="product-ctr">
                        <div className="product-labels">
                          <div className="product-labels__title">ХАРАКТЕРИСТИКИ</div>

                          <div className="product-labels__group">
                            <div className="product-labels__item">
                              <span className="product-labels__txt">Разгон: {racer.acceleration}</span>
                            </div>
                            <div className="product-labels__item">
                              <span className="product-labels__txt">Мощность: {racer.power}</span>
                            </div>
                          </div>

                          <div className="product-labels__title">СТАТУС</div>
                          <div className="product-labels__group">
                            <span className="product-labels__txt">
                              {isRacerTaken(racer.id) && selectedRacer?.id !== racer.id
                                ? "ЗАНЯТ"
                                : selectedRacer?.id === racer.id
                                  ? "ВЫБРАН ВАМИ"
                                  : "СВОБОДЕН"
                              }
                            </span>
                          </div>
                        </div>

                        <span className="hr-vertical"></span>

                        <div className="product-inf">
                          <div className="product-inf__percent">
                            <div className="product-inf__percent-circle">
                              <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
                                <defs>
                                  <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#0c1e2c" stopOpacity="0" />
                                    <stop offset="100%" stopColor={racer.color} stopOpacity="1" />
                                  </linearGradient>
                                </defs>
                                <circle cx="50" cy="50" r="47" strokeDasharray="240, 300" stroke={racer.color} strokeWidth="4" fill="none" />
                              </svg>
                            </div>
                            <div className="product-inf__percent-txt">
                              {Math.floor(Math.random() * 30) + 70}%
                            </div>
                          </div>
                          <span className="product-inf__title">ШАНС ПОБЕДЫ</span>
                        </div>
                      </div>

                      <div className="product-slider__bottom">
                        <button
                          className={`product-slider__cart ${isRacerTaken(racer.id) && selectedRacer?.id !== racer.id ? 'disabled' : ''
                            }`}
                          onClick={() => handleSelect(racer)}
                          disabled={isRacerTaken(racer.id) && selectedRacer?.id !== racer.id}
                        >
                          {selectedRacer?.id === racer.id ? "ОТМЕНИТЬ" : "ВЫБРАТЬ"}
                        </button>
                      </div>
                    </div>
                  </div>                
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
};

export default RacerSlider;