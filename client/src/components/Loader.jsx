import React from 'react'
import LoaderGif from '../assets/Loader.gif';

const Loader = () => {
  return (
    <div className='loader'>
      <div className='loader__image'>
        <img src={LoaderGif} alt='loader' />
      </div>
    </div>
  )
}

export default Loader