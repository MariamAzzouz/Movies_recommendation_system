import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const MovieSlider = ({ movies }) => {
  return (
    <Swiper
      spaceBetween={30}
      slidesPerView={3}
      navigation
      pagination={{ clickable: true }}
    >
      {movies?.map((movie) => (
        <SwiperSlide key={movie.id}>
          {/* Your movie content */}
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default MovieSlider; 