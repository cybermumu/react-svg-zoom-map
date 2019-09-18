import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import ReactSvgZoomMap from 'react-svg-zoom-map';

const DevRoot = () => {
  const [ area, setArea ] = useState(['', '', '']);
  const [ county, town, village ] = area;

  const [ inputCounty, setInputCounty ] = useState('');
  const [ inputTown, setInputTown ] = useState('');
  const [ inputVillage, setInputVillage ] = useState('');

  return (
    <div>
      <input type="text" value={inputCounty} onChange={ e => setInputCounty(e.target.value) }/>
      <input type="text" value={inputTown} onChange={ e => setInputTown(e.target.value) }/>
      <input type="text" value={inputVillage} onChange={ e => setInputVillage(e.target.value) }/>
      <button onClick={() => setArea([inputCounty, inputTown, inputVillage])}>Submit</button>
      { area }
    
      <ReactSvgZoomMap 
        countyJsonSrc="topojsons/taiwan-county.json"
        townJsonSrc="topojsons/taiwan-town.json"
        villageJsonSrc="topojsons/taiwan-village.json"
        county={ county }
        town={ town }
        village={ village }

        onAreaClick={ (newArea, e) => {
          setArea(newArea) 
          // console.log(newArea)
        }}
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
    </div>
  )
}


ReactDOM.render(
  <DevRoot />, 
  document.getElementById('root')
);
