import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import ReactSvgZoomMap from 'react-svg-zoom-map';

const DevRoot = () => {
  const [ area, setArea ] = useState(['', '', '']);

  return (
    <ReactSvgZoomMap 
      countyJsonSrc="topojsons/taiwan-county.json"
      townJsonSrc="topojsons/taiwan-town.json"
      villageJsonSrc="topojsons/taiwan-village.json"
      county={ area[0] }
      town={ area[1] }
      village={ area[2] }

      onAreaClick={ (newArea, e) => setArea(newArea) }
      // onPinClick={ console.log }
      // onAreaHover={ console.log }
      // onPinHover={ console.log }

      pinRadiusWithLayer={[2, 0.3, 0.15]}

      pins={
        [
          {
            id: 1,
            title: '台北101',
            location: [ 25.034000, 121.564670 ]
          },
          {
            id: 2,
            title: '台灣最南點',
            location: [ 21.897750, 120.857921 ]
          },

          {
            id: 3,
            title: '貓鼻頭燈塔',
            location: [ 25.129217, 121.923449 ]
          }
        ]
      }
    />
  )
}


ReactDOM.render(
  <DevRoot />, 
  document.getElementById('root')
);
