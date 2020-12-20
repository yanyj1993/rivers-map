
window.app = {
  map: null,  //地图实例
  layers: {
      label:{},
  },  // 图层
  rivers: [],
  data: {
      jcLayer: [{
          name: '小市监测站',
          label: 'jc-label-2.png',
          coordinate: [32.09410041642852, 118.78932952880861],

      }],

      qxLayer: [{
          name: '小市气象站',
          label: 'qx-label-2.png',
          coordinate: [32.09110041642852, 118.78132952880861],

      }]
  }
};

//入口
$(document).ready(() => {
    initMap();
    // loadRiverJson();
    loadGeoJson('/json/rivers-polygon.json', riversJson => {
        riversJson.features.forEach(feature => {
            const per = Math.floor(Math.random()*10+1);
            const f = {
                id: feature.properties.FID,
                name: feature.properties.NAME,
                coordinates: feature.geometry.coordinates.map(a => a.reverse()),
                wq: per,
            };
            if(!!f.name && f.name.trim().length !== 0) {
                app.rivers.push(f);
            }

        });
        // 0.1: '#62BBE2',
        //             0.2: '#6098D3',
        //             0.3: '#84BD48',
        //             0.4: '#EEC112',
        //             0.5: '#F5901C',
        //             1.0: '#f50e62',

        app.riversPolygon = maptalks.GeoJSON.toGeometry(riversJson);

        app.riversLayer = new maptalks.VectorLayer(
            "rivers"
        ).addTo(app.map);
        initRiversSelect(app.rivers);
    });


    loadGeoJson('/json/nj.json', nj => {
        // new L.Line3(changeGeoJson(nj)).addTo(app.map);

        const features = nj.features;
        let region  = [];
        features.forEach((g, i) => {
            const properties = g.properties;
            const coordinates = g.geometry.coordinates;
            region .push(...drawPolygons(coordinates, 30));
        });
        const polygonsLayer = new maptalks.VectorLayer(
            "vector-polygon",
            {  enableAltitude: true}
        ).addGeometry([region[0]])
            .addTo(app.map);
        const polygonsLayer1 = new maptalks.VectorLayer(
            "vector-shadows"
        ).addGeometry([region[1]])
            .addTo(app.map);
        drawBoundary(nj.features[0].geometry.coordinates[0])
    });

    $('#wq').click( function () {
        const selected = $(this).hasClass('left-tool-selected');

        if(selected) {
            $(this).removeClass('left-tool-selected');
            $('.wq').hide();
            app.riversLayer.clear();
            // app.riversLayer = null;
            if(app.selectedRiverFeatrue) {
                app.map.removeLayer(app.selectedRiverFeatrue);
                app.selectedRiverFeatrue = null;
            }
            app.map.setView([32.04890673772848, 118.84283959865571],11);
        } else {
            // app.map.fitBounds(L.latLngBounds(app.rivers.map(a => a.coordinates).flat()));
            $(this).addClass('left-tool-selected');
            loadRiverJson();
            $('.wq').show();
            $('#riversSelect').val("");
        }
    });

    $('#label').click( function () {
        const selected = $(this).hasClass('left-tool-selected');

        if(selected) {
            // 取消选中
            $(this).removeClass('left-tool-selected');

            $('.label').fadeOut('slow');
            removeAllLabel();
            $('.label-pane').removeClass('label-pane-selected');
        } else {
            $(this).addClass('left-tool-selected');
            $('.label').fadeIn('slow');

        }
    });

    $('.label-pane').click(function () {
        const $this = $(this);
        const layer = $this.data("layer");
        if($this.hasClass("label-pane-selected")) {
            $this.removeClass('label-pane-selected');
            removeLabel(layer);
        } else {
            $this.addClass('label-pane-selected');
            addLabel(layer);
        }
    });

    $('#riversSelect').change(function () {
        const selected = $(this).val();
        if(app.riversTimeId) {
            stopRiversTime();
        }

        if(app.selectedRiverFeatrue) {
            app.riversLayer.removeGeometry(app.selectedRiverFeatrue);
            app.selectedRiverFeatrue = null;
        }
        if(!!selected) {
            const selectedRivers = app.riversPolygon.filter(v => v.properties.FID ==selected);
           app.map.fitExtent(selectedRivers[0].getExtent());

            app.selectedRiverFeatrue = selectedRivers[0].copy().setSymbol({
                lineWidth: 2,
                lineColor: 'red',
                lineDasharray:[10,5,2]
            });
            app.selectedRiverId = selected;

            app.riversLayer.addGeometry(app.selectedRiverFeatrue);

            $('.wqTime-area').show();
        } else {
            app.map.setCenterAndZoom([118.7787879,32.08410319999999], 14);
            app.selectedRiverFeatrue = null;
            app.selectedRiverId = null;
            $('.wqTime-area').hide();
        }
    });

    $('#wqTime').click(function () {

        const checked = $(this).prop('checked');
        if(checked) {
            startRiversTime();
        } else {
            stopRiversTime();
        }
    })
});


function initRiversSelect(rivers) {
    const html = rivers.map(river => `<option value="${river.id}">${river.name}</option>`).join('');

    $('#riversSelect').append(html);
}


// 初始化地图方法{fadeAnimation: false}
function initMap() {
    app.map = new maptalks.Map('map', {
        center: [118.84283959865571,32.04890673772848],
        zoom: 11,
        pitch: 56,
        baseLayer: new maptalks.TileLayer('base', {
            urlTemplate: 'http://webrd{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
            subdomains: ['01','02','03','04'],
            cssFilter : 'sepia(100%) invert(100%) saturate(100%) brightness(150%)'
            // cssFilter : 'invert(1) grayscale(0) saturate(0.5) brightness(1.6) opacity(1) hue-rotate(334deg) sepia(10%)'
            // attribution: '&copy; <a href="http://osm.org">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/">CARTO</a>'
        })
    });

    // map1.addMapTiles('http://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}');
    // app.map = L.map('map', {
    //     minZoom: 1,
    //     maxZoom: 16,
    //     renderer: L.svg(),
    //     fadeAnimation: false,
    //     // center: [32.04890673772848, 118.84283959865571],
    //     // zoom: 11,
    //     // zoomDelta: 0.5,
    //     rotate:true,touchRotate:true,
    //     fullscreenControl: false,
    //     zoomControl: false,
    //     attributionControl: false
    // });
    //
    // app.map.setView([32.04890673772848, 118.84283959865571], 11, false);

//http://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineCommunity/MapServer/tile/{z}/{y}/{x}//arcgis在线地图
// const baseLayer=L.tileLayer.colorizr("http://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",{
// // const baseLayer=L.tileLayer("//webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",{  // 卫星
// //     const baseLayer=L.tileLayer("//webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",{ // 街道
//         attribution: '&copy; 高德地图',
//         subdomains: "1234",
//         colorize: function (pixel) {
//             // 这个方法用来调整所有的图片上的rgb值，pixel是图片原有的rgb值
//             pixel.r -= 13;
//             pixel.g -= 17;
//             pixel.b -= 90;
//             return pixel;
//         }
//     });
//
//
//     app.osmb = new OSMBuildings(app.map).load().set('/json/nj.json');
//
//     app.map.addLayer(baseLayer);
//
//     app.layers.baseLayer = baseLayer;
}


function loadRiverJson() {
    if(app.riversLayer) {
        if(app.selectedRiverFeatrue) {
            app.riversLayer.removeGeometry(app.selectedRiverFeatrue);
        }
        app.riversLayer.clear();
    }

    const riversPolygon =app.riversPolygon.map(p => {

        return p.copy().setSymbol({
            lineWidth: 2,
            lineColor: 'rgba(0,0,0,0.1)',
            'polygonFill' : {
                'type' : 'linear',
                'colorStops' : [
                    [0.00, '#62BBE2'],
                    [0.20, '#6098D3'],
                    [0.40, '#EEC112'],
                    [0.60, '#F5901C'],
                    [0.8, '#f50e62'],
                    [1, '#f50e62']
                ]
            }});
    });

    app.riversLayer.addGeometry(riversPolygon);
    if(!app.riversBounds) {
        app.riversBounds = app.riversLayer.getExtent();
    }

    app.map.setCenterAndZoom([118.7787879,32.08410319999999], 14);

}


function loadGeoJson(path, cb) {
    $.ajax(path, {}).done( josn => {
        cb && cb(josn);

    } )
}


function selectStyle(feature) {
    console.log(feature);
    return {color: 'red'};
}

function startRiversTime() {

    app.riversLayer.removeGeometry(app.selectedRiverFeatrue);
    app.riversTimeId = setInterval(function () {
        app.riversLayer.addGeometry(app.selectedRiverFeatrue.copy().setSymbol(getSymbol(Math.random()*10+1)))

    }, 1000)
}

function getSymbol(l) {
    if(l >= 0 && l <= 2) {
        return {
            lineWidth: 2,
            lineColor: 'rgba(0,0,0,0.1)',
            'polygonFill' : {
                'type' : 'linear',
                'colorStops' : [
                    [0.00, '#62BBE2'],
                    [0.50, '#6098D3'],
                    [1, '#EEC112'],
                ]
            }}
    } else if (l > 2 && l <= 4) {
        return {
            lineWidth: 2,
            lineColor: 'rgba(0,0,0,0.1)',
            'polygonFill' : {
                'type' : 'linear',
                'colorStops' : [
                    [0.00, '#6098D3'],
                    [0.50, '#EEC112'],
                    [0.10, '#F5901C'],
                ]
            }}
    } else if(l > 4 && l <= 6) {
        return {
            lineWidth: 2,
            lineColor: 'rgba(0,0,0,0.1)',
            'polygonFill' : {
                'type' : 'linear',
                'colorStops' : [
                    [0.00, '#EEC112'],
                    [0.50, '#F5901C'],
                    [1, '#f50e62'],
                ]
            }}
    } else {
        return {
            lineWidth: 2,
            lineColor: 'rgba(0,0,0,0.1)',
            'polygonFill' : {
                'type' : 'linear',
                'colorStops' : [
                    [0.00, '#F5901C'],
                    [0.5, '#f50e62'],
                    [1, '#f50e62']
                ]
            }}
    }
}

function stopRiversTime() {



    if(app.riversTimeId) {
        clearInterval(app.riversTimeId);
        app.riversTimeId = null;
    }

    setTimeout(function () {
        loadRiverJson();
        if(app.selectedRiverFeatrue) {
            app.riversLayer.addGeometry(app.selectedRiverFeatrue);
        }

    }, 1000);

    $('#wqTime').prop('checked', false);

    app.riversTimeId = null;
}

function addLabel(layerName) {
    let layer = app.layers.label[layerName];
    if(layer==null) {
        layer = initLayer(layerName);
    }
    app.map.addLayer(layer);
}


function removeLabel(layerName) {
    let layer = app.layers.label[layerName];
    app.map.removeLayer(layer);
}

function removeAllLabel() {
    if(app.layers.label.qxLayer) {
        app.map.removeLayer(app.layers.label.qxLayer);
    }
    if(app.layers.label.jcLayer) {
        app.map.removeLayer(app.layers.label.jcLayer);
    }
}

function initLayer(layerName) {
   const data =  app.data[layerName];
    const layers = [];
    app.layers.label[layerName] = new maptalks.VectorLayer(layerName ,{enableAltitude: true}).addTo(app.map);
   data.forEach(m => {
       var marker = new maptalks.Marker(
           m.coordinate.reverse(),
           {
               'properties' : {
                   altitude: 200,
                   name: m.name,
               },
               symbol : [
                   {
                       'markerFile'   : '/asserts/images/' + m.label,
                       'markerWidth'  : 26,
                       'markerHeight' : 26
                   },
                   {
                       'textFaceName' : 'sans-serif',
                       'textName' : '{name}',
                       'textDy'   : 24,
                       'textHaloFill' : '#fff',
                       'textHaloRadius' : 4,
                       'textSize' : 18,
                       'textWeight' : 'bold',
                       'textVerticalAlignment' : 'top',
                       textFill: 'red'
                   }
               ]
           }
       ).addTo( app.layers.label[layerName]);


        const html = `<div class="custom-popup-content">
                          
                            <div class="popup-part">
                                <div class="part-title">水质</div>
                                <div class="part-content">
                                    <div class="row">
                                        <div class="col">
                                            <div class="f-label">氨氮</div>
                                            <div class="f-value">0 mg/L</div>
                                        </div>
                                        <div class="col">
                                            <div class="f-label">高锰酸钾</div>
                                            <div class="f-value">6 mg/L</div>
                                        </div>
                                    </div>  
                                     <div class="row">
                                        <div class="col">
                                            <div class="f-label">溶解氧</div>
                                            <div class="f-value">6 mg/L</div>
                                        </div>
                                        <div class="col">
                                            <div class="f-label">总磷</div>
                                            <div class="f-value">0 mg/L</div>
                                        </div>
                                    </div>  
                                    <div class="row">
                                        <div class="col">
                                            <div class="f-label">水温</div>
                                            <div class="f-value">13.8摄氏度</div>
                                        </div>
                                        <div class="col">
                                            <div class="f-label">PH值</div>
                                            <div class="f-value">7.07</div>
                                        </div>
                                    </div>  
                                </div>
                            </div>
                            <div class="popup-part">
                                <div class="part-title">水位</div>
                                <div class="part-content">
                                    <div class="row">
                                        <div class="col">
                                            <div class="f-label">水位</div>
                                            <div class="f-value">6.792m</div>
                                        </div>
                                        <div class="col">
                                            <div class="f-label"></div>
                                            <div class="f-value"></div>
                                        </div>
                                    </div>  
                                     <div class="row">
                                        <div class="col">
                                            <div class="f-label">时间</div>
                                            <div class="f-value">2020-12-16 10:59:56</div>
                                        </div>
                                        <div class="col">
                                            <div class="f-label"></div>
                                            <div class="f-value"></div>
                                        </div>
                                    </div>  
                                
                                </div>
                            </div>
                       </div>`;

       marker.setInfoWindow({
           'title'     : m.name,
           'content'   : html,

           // 'autoPan': true,
           // 'width': 300,
           // 'minHeight': 120,
           // 'custom': false,
           //'autoOpenOn' : 'click',  //set to null if not to open when clicking on marker
           'autoCloseOn' : 'click'
       });
   });




}


// 边界高亮及遮罩效果
function drawBoundary(blist) {
    // let pNW = { lat: 59.0, lng: 73.0 };
    let pNW = [73.0, 59.0];
    let pNE = [136.0, 59];
    // let pNE = { lat: 59.0, lng: 136.0 };
    // let pSE = { lat: 3.0, lng: 136.0 };
    let pSE = [136, 3];
    // let pSW = { lat: 3.0, lng: 73.0 };
    let pSW = [ 73.0,3.0 ];
    let pArray = [];

    pArray.push(pNW);
    pArray.push(pSW);
    pArray.push(pSE);
    pArray.push(pNE);
    pArray.push(pNW);

    for (let i = 0; i < blist.length; i++) {
        let points = [];
        $.each(blist[i],function(k,v){
            points.push([v[0], v[1]]);
        });
        pArray = pArray.concat(points);
        pArray.push(pArray[0]);
    }
    let plyall =  new maptalks.Polygon(pArray, {
        symbol: {
            // lineWidth: 2,
            // lineColor: '#6098D3',
            polygonFill: '#0c40c0',
            polygonOpacity: 0.5
        },
    });
    plyall.addTo(app.map.getLayer('vector-polygon'));
}

function changeGeoJson(json) {
    let  j = json;
    let coordinates = json.features[0].geometry.coordinates;

    j.features[0].properties = { color: '#99cc99' };
    j.features[0].geometry.coordinates = coordinates.map(v => v.map(a => a.map(a1 => [...a1, 5])));
    return j;
}


function drawPolygons(coordinates, properties) {
    const polygon = new maptalks.MultiPolygon(coordinates, {
        symbol: {
            lineWidth: 1,
            lineColor: '#6098D3',
            polygonFill: 'rgba(0,0,0,0)',
            polygonOpacity: 0.5
        },
        properties: {
            altitude : 150
        }
    });
    const shadowSymbol = {
        lineColor: 'rgba(0,0,0, 0.3)',
        // lineDasharray : [10, 5, 5],
        lineWidth: 10,
        polygonFill: 'rgba(0,0,0,0)',
        polygonOpacity: 0.4
    };

    return [polygon, polygon.copy().setSymbol(shadowSymbol)];

}
