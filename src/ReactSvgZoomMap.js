import React from 'react'
import PropTypes from 'prop-types'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import anime from 'animejs'
import axios from 'axios'

import './ReactSvgZoomMap.css'

export default class ReactSvgZoomMap extends React.Component {

  static propTypes = {
    
    className: PropTypes.string,

    countyJsonSrc: PropTypes.string.isRequired,
    townJsonSrc: PropTypes.string,
    villageJsonSrc: PropTypes.string,
    
    pins: PropTypes.array,
    pinRadiusWithLayer: PropTypes.array,

    onAreaClick: PropTypes.func,
    onAreaHover: PropTypes.func,
    onPinClick: PropTypes.func,
    onPinHover: PropTypes.func,

    zoomDelay: PropTypes.number,
    zoomDuration: PropTypes.number,

    county: PropTypes.string,
    town: PropTypes.string,
    village: PropTypes.string,
  }

  static defaultProps = {
    pinRadiusWithLayer: [2, 0.3, 0.15],
    zoomDelay: 100,
    zoomDuration: 700,
    county: '',
    town: '',
    village: ''
  }

  state = {
    svgWidth: 1280,
    svgHeight: 720,
    svgScale: 10000,

    countyJsonData: null,
    townJsonData: null,
    villageJsonData: null,

    countyMapData: null,
    townMapData: null,
    villageMapData: null,
    
    nowSelect: [],
    nowScale: 1,
    animating: false,
    svgDisplayParams: [{ scale: 1, top: 0, left: 0 }],
  }

  mapCompRoot = React.createRef();
  mapSvgRoot = React.createRef();
  mapSvgRootGroup = React.createRef();




  /* Life Cycle */

  componentDidMount() {
    const { loadTopoJson, calcSvg } = this;
    const { countyJsonSrc, townJsonSrc, villageJsonSrc } = this.props;

    countyJsonSrc && loadTopoJson(countyJsonSrc).then( countyJsonData => this.setState({ countyJsonData }, calcSvg))
    townJsonSrc && loadTopoJson(townJsonSrc).then( townJsonData => this.setState({ townJsonData }, calcSvg))
    villageJsonSrc && loadTopoJson(villageJsonSrc).then( villageJsonData => this.setState({ villageJsonData }, calcSvg))

    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  componentDidUpdate( prevProps ) 
  {
    const { county, town, village } = this.props;
    if (county != prevProps.county || town != prevProps.town || village != prevProps.village) {
      this.handleAreaUpdate(county, town, village);
    }
  }

  /* Event Handler */

  handleResize = () => { this.calcSvg(); }

  handleAreaUpdate = (...selectArray) => {
    const { countyMapData, townMapData, villageMapData, nowSelect } = this.state;
    const [ county, town, village ] = selectArray;

    if (county && !countyMapData.find( _ => _.countyName === county)) return;
    if (town && !townMapData.find( _ => _.townName === town)) return;
    if (village && !countyMapData.find( _ => _.villageName === village)) return;

    selectArray = selectArray.filter(item => item)

    if (selectArray.length >= 1 && townMapData == null) return;
    if (selectArray.length >= 2 && villageMapData == null) return;

    if (this.state.animating || selectArray.length > 2) return;
    if (selectArray.length === 3) selectArray[2] = ''

    const isZoomIn = selectArray.length > nowSelect.length;

    this.setState(
      { nowSelect: selectArray },
      () => this.executeAnimate(isZoomIn)
    );
  }

  handleMapItemClick = ( county, town, village, e) => {
    const { onAreaClick } = this.props;
    onAreaClick && onAreaClick([county, town, village], e);
  }

  handleMapItemHover = ( county, town, village, e) => {
    const { onAreaHover } = this.props;
    onAreaHover && onAreaHover([county, town, village], e);
  }

  handleUpperLayerClick = () => {
    if (this.state.animating || this.state.nowSelect.length === 0) return;

    const { nowSelect } = this.state;
    const { onAreaClick } = this.props;

    const selectArray = nowSelect.slice(0, -1).filter(item => item);
    onAreaClick && onAreaClick([selectArray[0] || '', selectArray[1] || '', selectArray[2] || '']);
  }

  handlePinClick = (pinItem, e) => {
    const { onPinClick } = this.props;
    onPinClick && onPinClick(pinItem, e);
  }

  handlePinHover = (pinItem, e) => {
    const { onPinHover } = this.props;
    onPinHover && onPinHover(pinItem, e);
  }
  

  /* Methods */

  calcSvg = () => {
    const { countyJsonData, townJsonData, villageJsonData } = this.state;
    if ( !countyJsonData ) return;

    const mapCompRootRect = this.mapCompRoot.current.getBoundingClientRect();
    const svgScale = mapCompRootRect.width > mapCompRootRect.height ?
                      mapCompRootRect.height / 1083.04 * 10000 :
                      mapCompRootRect.width / 1216.83 * 10000;
    this.setState(
      {
        svgWidth: mapCompRootRect.width,
        svgHeight: mapCompRootRect.height,
        svgScale
      }, 
      () => {
        this.setState({
          countyMapData: this.topoSvgConverter(countyJsonData),
          townMapData: townJsonData ? this.topoSvgConverter(townJsonData) : null,
          villageMapData: villageJsonData ? this.topoSvgConverter(villageJsonData) : null
        })
        this.executeAnimate();
      }
    );
  }

  loadTopoJson = jsonSrc => {
    return new Promise((resolve, reject) => {
      axios.get(jsonSrc)
        .then( res => {
          resolve(res.data);
        })
        .catch( err => {
          reject(err);
        })
    })
  }

  topoSvgConverter = jsonData => {
    let mapPropertyName = 'map';

    if (!jsonData.objects.map) {
      mapPropertyName = Object.keys(jsonData.objects).filter(item => item.indexOf('MOI') >= 0)[0];
    }

    let topo = topojson.feature(jsonData, jsonData.objects[mapPropertyName]);
    let prj = this.getProjection();
    let path = d3.geoPath().projection(prj)
    
    let temp = []

    topo.features.forEach(feature => {
      temp.push({
        d: path(feature),
        countyName: feature.properties.COUNTYNAME,
        townName: feature.properties.TOWNNAME || '',
        villageName: feature.properties.VILLNAME || '',
        geoJsonObject: feature
      })
    });
    
    return temp
  }

  executeAnimate = (isZoomIn = true) => {
    const { nowSelect } = this.state;
    const { pinRadiusWithLayer, zoomDuration, zoomDelay } = this.props;

    const svgRect = this.mapSvgRoot.current.getBoundingClientRect();
    const tRect = this.mapSvgRootGroup.current.getBBox();
    const cScale = svgRect.width / tRect.width;

    anime({
      targets: this.mapSvgRoot.current.querySelectorAll('.map-item-path'),
      keyframes: isZoomIn ? 
        [
          {strokeWidth: 1 / cScale},
          {strokeWidth: 0.5 / cScale},
        ]:
        [
          {strokeWidth: 0.5 / cScale},
          {strokeWidth: 0.5 / cScale},
        ]
      ,
      easing: 'easeOutQuint',
      duration: zoomDuration + zoomDelay,
    });

    anime({
      targets: this.mapSvgRoot.current.querySelectorAll('.pin'),
      r: pinRadiusWithLayer[nowSelect.length] || 0,
      easing: 'easeOutQuint',
      duration: zoomDuration,
      delay: zoomDelay,
    });


    let rootRect = this.mapSvgRoot.current.viewBox.baseVal;

    anime({
      targets: rootRect,
      x: tRect.x,
      y: tRect.y,
      width: tRect.width,
      height: tRect.height,
      easing: 'easeOutQuint',
      duration: zoomDuration,
      delay: zoomDelay,
      complete: () => {
        this.setState({ animating: false })
      },
      update: () => {
        this.mapSvgRoot.current.setAttribute('viewBox', `${rootRect.x} ${rootRect.y} ${rootRect.width} ${rootRect.height}`);
      }
    });

    return;
  }
  



  /* Getters */

  getProjection = () => {
    const { svgWidth, svgHeight, svgScale } = this.state;
    return d3.geoMercator()
            .center([120.751864, 23.575998])
            .scale(svgScale)
            .translate([svgWidth/2, svgHeight/2])
  }
  
  getNowSelectString = () => this.state.nowSelect.length > 0 ? this.state.nowSelect.reduce((acc, curr) => acc + curr) : '';




  /* Renders */

  render() {
    const { 
      svgWidth, svgHeight, 
      countyMapData, townMapData, villageMapData, nowSelect
    } = this.state;

    const loaded = (countyMapData);

    const { className } = this.props;

    return (
      <div className={'react-svg-zoom-map' + (className ? ` ${className}` : '') } ref={this.mapCompRoot}>
        
        <div className="controls">
          { loaded && nowSelect.length > 0 && <button onClick={this.handleUpperLayerClick}>上一層</button> }
        </div>

        <div className="labels">
          { this.getNowSelectString() }
          { !loaded ? 'Loading...' : '' }
        </div>

        <svg width={svgWidth} height={svgHeight} ref={this.mapSvgRoot}>
          <g className="map-g" ref={this.mapSvgRootGroup} >
            {
              loaded &&
              <g className="map-items">
                { nowSelect.length === 0 && this.mapItemsRender(countyMapData, '-county') }
                { nowSelect.length === 1 && this.mapItemsRender(townMapData, '-town') }
                { nowSelect.length >= 2 && this.mapItemsRender(villageMapData, '-village') }
              </g>
            }
            <g className="pins">
              { loaded && this.mapPinsRender() }
            </g>
          </g>
        </svg>
      </div>
    )
  }

  mapItemsRender = (mapData, className) => {
    if (mapData) {
      return mapData.filter(item => {
        const { countyName, townName, villageName } = item;
        return (countyName + townName + villageName).indexOf(this.getNowSelectString()) >= 0;
      })
      .map((item, index) => this.mapItemRender(item, index, className)) 
    }
    return null
  }

  mapItemRender = (item, index, className) => (
    <g 
      className={'map-item ' + className} key={className + index} 
      onClick={ e => this.handleMapItemClick(item.countyName, item.townName, item.villageName, e) }
      onMouseEnter={ e => this.handleMapItemHover(item.countyName, item.townName, item.villageName, e) }
    >
      <path d={item.d} id={item.location} className="map-item-path" >
        <title>{item.countyName + item.townName + item.villageName}</title>
      </path>
    </g>
  )

  mapPinsRender = () => {
    const { nowSelect, countyMapData, townMapData } = this.state;
    const { pins } = this.props;

    return (<>
      {
        pins && 
        pins.filter(item => {
          const depth = nowSelect.length;
          let nowArea = {};

          if (depth === 0) {
            return item;
          }
          else if (depth === 1) {
            nowArea = countyMapData.find(item => item.countyName == nowSelect[0]);
          }
          else if (depth === 2) {
            nowArea = townMapData.find(item => item.countyName == nowSelect[0] && item.townName == nowSelect[1]);
          }
          return d3.geoContains(nowArea.geoJsonObject, [item.location[1], item.location[0]]) ? item : null;
        }).
        map((item, index) => {
          const point = this.getProjection()([item.location[1], item.location[0]]);
          return (
            <circle 
              className={`pin -layer-${nowSelect.length}`} key={`pin${index}`} 
              onClick={ e => {this.handlePinClick(item, e)} }
              onMouseEnter={ e => {this.handlePinHover(item, e)} }
              transform={`translate(${point[0].toFixed(2)} ${point[1].toFixed(2)})`} 
              cx="0%" cy="0%" r="1"
            >
              <title>{ item.title }</title>
            </circle>
          )
        })
      }
    </>)
  }
}
