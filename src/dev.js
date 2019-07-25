import React from 'react';
import ReactDOM from 'react-dom';
import ReactSvgZoomMap from 'react-svg-zoom-map';

ReactDOM.render(
  <ReactSvgZoomMap 
    countyJsonSrc="topojsons/taiwan-county.json"
    townJsonSrc="topojsons/taiwan-town.json"
    villageJsonSrc="topojsons/taiwan-village.json"

    onAreaClick={ console.log }
    onPinClick={ console.log }
    onAreaHover={ console.log }
    onPinHover={ console.log }

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
  />, 
  document.getElementById('root')
);
