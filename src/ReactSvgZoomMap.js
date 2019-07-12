import React, { Component } from 'react'
import PropTypes from 'prop-types'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import anime from 'animejs'
import axios from 'axios'

import './ReactSvgZoomMap.css'

export default class ReactSvgZoomMap extends Component {

  static propTypes = {
    
    className: PropTypes.string,

    countyJsonSrc: PropTypes.string,
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
  }

  static defaultProps = {
    pinRadiusWithLayer: [2, 0.3, 0.15],
    zoomDelay: 100,
    zoomDuration: 1000,
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

    !countyJsonSrc && this.setState({ countyJsonData: require('./topojsons/taiwan-county.json') }, calcSvg)
    !townJsonSrc && this.setState({ townJsonData: require('./topojsons/taiwan-town.json') }, calcSvg)
    !villageJsonSrc && this.setState({ villageJsonData: require('./topojsons/taiwan-village.json') }, calcSvg)

    countyJsonSrc && loadTopoJson(countyJsonSrc).then( countyJsonData => this.setState({ countyJsonData }, calcSvg))
    townJsonSrc && loadTopoJson(townJsonSrc).then( townJsonData => this.setState({ townJsonData }, calcSvg))
    villageJsonSrc && loadTopoJson(villageJsonSrc).then( villageJsonData => this.setState({ villageJsonData }, calcSvg))

    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }



  /* Event Handler */

  handleResize = () => { this.calcSvg(); }

  handleMapItemClick = (...selectArray) => {

    const { onAreaClick } = this.props;
    
    selectArray = selectArray.filter(item => item !== '');
    onAreaClick && onAreaClick(selectArray);

    if (this.state.animating || selectArray.length > 2) return;
    if (selectArray.length === 3) selectArray[2] = ''

    this.setState(
      { nowSelect: selectArray.filter(item => item) },
      () => this.executeAnimate(true)
    );
  }

  handleMapItemHover = (...selectArray) => {
    const { onAreaHover } = this.props;
    
    if (!onAreaHover) return;

    selectArray = selectArray.filter(item => item !== '');
    onAreaHover(selectArray);
  }

  handleUpperLayerClick = () => {
    if (this.state.animating || this.state.nowSelect.length === 0) return;

    const { nowSelect } = this.state;
    const { onAreaClick } = this.props;

    const selectArray = nowSelect.slice(0, -1).filter(item => item !== '');
    onAreaClick && onAreaClick(selectArray);

    this.setState(
      { nowSelect: selectArray },
      () => this.executeAnimate(false)
    )
  }

  handlePinClick = pinItem => {
    const { onPinClick } = this.props;
    onPinClick && onPinClick(pinItem);
  }

  handlePinHover = pinItem => {
    const { onPinHover } = this.props;
    onPinHover && onPinHover(pinItem);
  }
  

  /* Methods */

  calcSvg = () => {
    const { countyJsonData, townJsonData, villageJsonData } = this.state;
    if ( !countyJsonData || !townJsonData || !villageJsonData ) return;

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
          townMapData: this.topoSvgConverter(townJsonData),
          villageMapData: this.topoSvgConverter(villageJsonData)
        })
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
      })
    });
    
    return temp
  }

  executeAnimate = (isZoomIn = true) => {

    const { nowSelect, svgDisplayParams } = this.state;
    const { pinRadiusWithLayer, zoomDuration, zoomDelay } = this.props;

    const svgRect = this.mapSvgRoot.current.getBoundingClientRect();
    const groupRect = this.mapSvgRootGroup.current.getBoundingClientRect();

    let computedGroupRect = {
      top: groupRect.top - svgRect.top,
      left: groupRect.left - svgRect.left,
      width: groupRect.width,
      height: groupRect.height
    }

    if (nowSelect.length === 0) {
      computedGroupRect = {
        top: 0,
        left: 0,
        width: svgRect.width,
        height: svgRect.height
      }
    }

    let scale = svgRect.width / computedGroupRect.width < svgRect.height / computedGroupRect.height ? 
            svgRect.width / computedGroupRect.width : 
            svgRect.height / computedGroupRect.height;

    let newSvgDisplayParams = [...svgDisplayParams];
    const oldSvgDisplayParams = {...newSvgDisplayParams.slice(-1)[0]};
    

    if (isZoomIn) {
      const sumScale = newSvgDisplayParams.map(item => item.scale).reduce((acc, curr) => acc * curr);
      const sumLeft = newSvgDisplayParams.map(item => item.left / item.scale).reduce((acc, curr) =>  acc + curr * scale * sumScale);
      const sumTop = newSvgDisplayParams.map(item => item.top / item.scale).reduce((acc, curr) =>  acc + curr * scale * sumScale);
      
      newSvgDisplayParams[nowSelect.length] = {
        scale: scale * sumScale,
        left: -computedGroupRect.left * scale + sumLeft,
        top: -computedGroupRect.top * scale + sumTop
      };
    } else {
      newSvgDisplayParams = newSvgDisplayParams.slice(0, -1);
    }

    if (newSvgDisplayParams.length === 0) {
      newSvgDisplayParams = [{ scale: 1, top: 0, left: 0 }];
    }

    const tmpSvgDisplayParam = newSvgDisplayParams.slice(-1)[0];

    this.setState({ animating: true, nowScale: tmpSvgDisplayParam.scale, svgDisplayParams: newSvgDisplayParams })

    const gTransform = {
      scale: oldSvgDisplayParams.scale,
      translateX: oldSvgDisplayParams.left,
      translateY: oldSvgDisplayParams.top,
    };

    anime({
      targets: this.mapSvgRoot.current,
      translateX: (svgRect.width * 0.5 - computedGroupRect.width * scale * 0.5).toFixed(2),
      translateY: (svgRect.height * 0.5 - computedGroupRect.height * scale * 0.5).toFixed(2),
      easing: 'easeOutQuint',
      duration: zoomDuration,
      delay: zoomDelay
    });

    anime({
      targets: this.mapSvgRoot.current.querySelectorAll('.map-item-path'),
      keyframes: isZoomIn ? 
        [
          {strokeWidth: 1 / tmpSvgDisplayParam.scale},
          {strokeWidth: 0.5 / tmpSvgDisplayParam.scale},
        ]:
        [
          {strokeWidth: 0.1 / tmpSvgDisplayParam.scale},
          {strokeWidth: 0.5 / tmpSvgDisplayParam.scale},
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
    })

    anime({
      targets: gTransform,
      translateX: tmpSvgDisplayParam.left,
      translateY: tmpSvgDisplayParam.top,
      scale: tmpSvgDisplayParam.scale,
      easing: 'easeOutQuint',
      duration: zoomDuration,
      delay: zoomDelay,
      complete: () => {
        this.setState({ animating: false })
      },
      update: () => {
        this.mapSvgRootGroup.current.setAttribute('transform', `translate(${gTransform.translateX} ${gTransform.translateY}) scale(${gTransform.scale})`);
      }
    });

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

    const loaded = (countyMapData && townMapData && villageMapData);

    const { className } = this.props;

    return (
      <div className={'react-svg-zoom-map' + (className ? ` ${className}` : '') } ref={this.mapCompRoot}>
        
        <div className="controls">
          { loaded && <button onClick={this.handleUpperLayerClick}>上一層</button> }
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
      onClick={ () => this.handleMapItemClick(item.countyName, item.townName, item.villageName) }
      onMouseEnter={ () => this.handleMapItemHover(item.countyName, item.townName, item.villageName) }
    >
      <path d={item.d} id={item.location} className="map-item-path" >
        <title>{item.countyName + item.townName + item.villageName}</title>
      </path>
    </g>
  )

  mapPinsRender = () => {
    const { nowSelect } = this.state;
    const { pins } = this.props;

    return (<>
      {
        pins && 
        pins.filter(item => {
          const { county, town, village } = item;
          return (county + town + village).indexOf(this.getNowSelectString()) >= 0;
        }).
        map((item, index) => {
          const point = this.getProjection()([item.location[1], item.location[0]]);
          return (
            <circle 
              className={`pin -layer-${nowSelect.length}`} key={`pin${index}`} 
              onClick={ () => {this.handlePinClick(item)} }
              onMouseEnter={ () => {this.handlePinHover(item)} }
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
