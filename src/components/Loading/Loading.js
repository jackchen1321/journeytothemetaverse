import React from 'react';
import './Loading.scss';

export const Loading = () => {
  return (
    <div className='spinner-container'>
      <div className='loading-box'>
        <div className='loader'></div>
        <div className='text'>Loading ...</div>
      </div>
    </div>
  );
};
