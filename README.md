# react-svg-zoom-map
擁有三層放大功能的台灣地圖 React Component，地圖圖形資料使用 Topojson，並透過 D3 繪製 

## [Live Demo](https://cybermumu.github.io/react-svg-zoom-map/example/)

## Installation

#### 透過 NPM 安裝：

`npm install react-svg-zoom-map --save`

## Development

#### 開啟測試伺服器並執行 example 

`npm run watch`

#### develop 建置

`npm run dev`

#### production 建置

`npm run build`

## Usage

```jsx
  import React, { useState } from 'react';
  import ReactSvgZoomMap from 'react-svg-zoom-map';

  const Example = () => {
    const [ area, setArea ] = useState(['', '', '']);

    return (
      <ReactSvgZoomMap 
        countyJsonSrc="https://cybermumu.github.io/react-svg-zoom-map/example/topojsons/taiwan-county.json"
        townJsonSrc="https://cybermumu.github.io/react-svg-zoom-map/example/topojsons/taiwan-town.json"
        villageJsonSrc="https://cybermumu.github.io/react-svg-zoom-map/example/topojsons/taiwan-village.json"
        county={ area[0] }
        town={ area[1] }
        village={ area[2] }
        onAreaClick={ (newArea, e) => setArea(newArea) }
        onPinClick={ console.log }
        pins={[
          {
            id: 1,
            title: '台北101',
            county: '臺北市',
            town: '信義區',
            village: '西村里',
            location: [ 25.034000, 121.564670 ]
          },
          {
            id: 2,
            title: '台灣最南點',
            county: '屏東縣',
            town: '恆春鎮',
            village: '鵝鑾里',
            location: [ 21.897750, 120.857921 ]
          },
          {
            id: 3,
            title: '貓鼻頭燈塔',
            county: '新北市',
            town: '瑞芳區',
            village: '鼻頭里',
            location: [ 25.129217, 121.923449 ]
          }
        ]}
      />
    )
  }
```

## Props

#### `county: string;`

目前選取的縣市。

#### `town: string;`

目前選取的鄉鎮。

#### `village: string;`

目前選取的村里。

#### `className?: string;`

自訂此 Component 的 className。

#### `countyJsonSrc: string;`

導入外部的縣市界圖 TopoJson Source，此值為必填。

#### `townJsonSrc: string;`

導入外部的鄉鎮界圖 TopoJson Source，此值為必填。

#### `villageJsonSrc: string;`

導入外部的村里界圖 TopoJson Source，此值為必填。

#### `pins?: array[{ title: string, county: string, town: string, village: string, location: [lat: number, long: number] }];`

要 pin 上地圖的資訊，需帶點的縣市、鄉鎮、村里資訊，進入放大模式時，系統會篩選掉該區外的 pin。

範例資料如下：
```js
{
  title: '台北101',
  county: '臺北市',
  town: '信義區',
  village: '西村里',
  location: [ 25.034000, 121.564670 ]
}
```

`title` 會帶入至 svg circle 內。此物件可以任意攜帶其他 property，此物件將會在 `click` 或 `hover` 的 callback 被完整傳回。

#### `pinRadiusWithLayer?: array [ layer_0_reduis: number, layer_1_reduis: number, layer_2_reduis: number ];`

每一層 pin 的半徑，預設為 `[2, 0.3, 0.15]`。

#### `zoomDuration?: number;`

放大動畫的時間長度（毫秒），預設為 `1000`。

#### `zoomDelay?: number;`

放大動畫的前置延遲（毫秒），預設為 `100`。

## Callback

#### `onAreaClick?(selectAreaArray: array[countyName?: string, townName?: string, village?: string], event: MouseEvent )`

`selectAreaArray` 格式為：[ 縣市名稱, 鄉鎮名稱, 村里名稱 ]，若選取層級僅到縣市時，陣列長度為1，依此類推。

#### `onAreaHover?(selectAreaArray: array[countyName?: string, townName?: string, village?: string], event: MouseEvent )`

`selectAreaArray` 格式同上。

#### `onPinClick?(selectPinObject: object, event: MouseEvent)`

`selectPinObject` 格式與 Props 中帶入的 pins 單項物件相同。

#### `onPinHover?(selectPinObject: object, event: MouseEvent)`

`selectPinObject` 格式同上。

## 其他資訊

### 台灣行政區界圖資訊

- [政府資料開放平臺 - 直轄市、縣市界線(TWD97經緯度)](https://data.gov.tw/dataset/7442)
- [政府資料開放平臺 - 鄉鎮市區界線(TWD97經緯度)](https://data.gov.tw/dataset/7441)
- [政府資料開放平臺 - 村里界圖(TWD97經緯度)](https://data.gov.tw/dataset/7438)
- [mapshaper - 地圖格式轉換工具](https://mapshaper.org/)
