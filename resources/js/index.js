
window.app = {
  map: null,  //地图实例
  layers: {
      label:{},
  },  // 图层
  rivers: [],
  data: {
      jcLayer: [{
          name: '小市监测站',
          label: 'jc-label.png',
          coordinate: [32.09410041642852, 118.78932952880861],

      }],

      qxLayer: [{
          name: '小市气象站',
          label: 'qx-label.png',
          coordinate: [32.09110041642852, 118.78132952880861],

      }]
  }
};

//入口
$(document).ready(() => {
    initMap();
    // loadRiverJson();
    loadGeoJson('/json/rivers.json', riversJson => {
        riversJson.features.forEach(feature => {
            const per = Math.floor(Math.random()*10+1);
            const f = {
                id: feature.properties.FID,
                name: feature.properties.name,
                coordinates: feature.geometry.coordinates.map(a => a.reverse()),
                wq: per,
            };
            if(!!f.name && f.name.trim().length !== 0) {
                app.rivers.push(f);
            }

        });
        initRiversSelect(app.rivers);
    });

    $('#wq').click( function () {
        const selected = $(this).hasClass('left-tool-selected');

        if(selected) {
            $(this).removeClass('left-tool-selected');
            $('.wq').hide();
            app.map.removeLayer(app.riversLayer);
            app.riversLayer = null;
            if(app.selectedRiverFeatrue) {
                app.map.removeLayer(app.selectedRiverFeatrue);
                app.selectedRiverFeatrue = null;
            }
        } else {
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

            $('.label').hide();
            removeAllLabel();
            $('.label-pane').removeClass('label-pane-selected');
        } else {
            $(this).addClass('left-tool-selected');
            $('.label').show();

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
        stopRiversTime();
        if(app.selectedRiverFeatrue) {
            app.map.removeLayer(app.selectedRiverFeatrue);
            app.selectedRiverFeatrue = null;
        }
        if(!!selected) {
            const selectedRivers = app.rivers.filter(a => a.id == selected);
            app.map.fitBounds(L.latLngBounds(selectedRivers[0].coordinates));

            app.selectedRiver = selectedRivers[0];
            app.selectedRiverId = selectedRivers[0].id;


            app.selectedRiverFeatrue = L.polyline.antPath(app.rivers.filter(v => v.id == app.selectedRiverId)[0].coordinates, {
                "delay": 1000,
                "dashArray": [
                    10,
                    20
                ],
                "weight": 5,
                "color": "#F2F2F7",
                "pulseColor": "#1E40D0",
                "paused": false,
                "reverse": false,
                opacity: 0.3,
                "hardwareAccelerated": true
            }).addTo(app.map);

            $('.wqTime-area').show();
        } else {

            app.map.fitBounds(L.latLngBounds(app.rivers.map(a => a.coordinates).flat()));
            app.selectedRiver = null;
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


// 初始化地图方法
function initMap() {
    app.map = L.map("map", {
        minZoom: 1,
        maxZoom: 16,
        center: [32.09410041642852, 118.78932952880861],
        zoom: 14,
        zoomDelta: 0.5,
        fullscreenControl: false,
        zoomControl: false,
        attributionControl: false
    });
//http://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineCommunity/MapServer/tile/{z}/{y}/{x}//arcgis在线地图
const baseLayer=L.tileLayer("http://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",{
// const baseLayer=L.tileLayer("//webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",{  // 卫星
//     const baseLayer=L.tileLayer("//webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",{ // 街道
        attribution: '&copy; 高德地图',
        subdomains: "1234"
    });

    app.map.addLayer(baseLayer);

    app.layers.baseLayer = baseLayer;
}


function loadRiverJson() {
    if(app.riversLayer) {
        app.map.removeLayer(app.riversLayer);
        app.riversLayer = null;
    }

    const hotlineLayer = L.hotline(app.rivers.map(a => {
        let index = 0;
        const length  = a.wq / 10;
        const per  = length;
        return  a.coordinates.map(a1 => {
            a1 = [...a1, per + (length * (index ++))];

            return a1;

        })
    }), {
        min: 1,
        max: 10,
        palette: {
            0.1: '#62BBE2',
            0.2: '#6098D3',
            0.3: '#84BD48',
            0.4: '#EEC112',
            0.5: '#F5901C',
            1.0: '#f50e62',
        },
        weight: 5,
        outlineColor: '#000000',
        outlineWidth: 1
    });
    hotlineLayer.addTo(app.map);

    app.riversLayer = hotlineLayer;
    console.log(app.rivers.sort((a,b) => a.id -b.id));
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

    app.map.removeLayer(app.selectedRiverFeatrue);
    app.riversTimeId = setInterval(function () {
        if(app.riversLayer) {
            app.map.removeLayer(app.riversLayer);
            app.riversLayer = null;
        }

        const hotlineLayer = L.hotline(app.rivers.map(a => {
            const length  = a.coordinates.length / 2;
            let per = Math.floor(Math.random()*10+1)/10;
            let index = 0;


            if(a.id == app.selectedRiverId) {
                index = 0;
                return a.coordinates.map(a1 => {
                    index ++;
                   a1 =  [...a1,per + (per * index)];

                    return a1;
                })
            } else {
                index = 0;
               return  a.coordinates.map(a1 => {
                   index ++;
                   let per1 = a.wq/10;
                   a1 =  [...a1, per1 + (per1 * index)];

                   return a1;
               })
            }
        }), {
            min: 1,
            max: 10,
            palette: {
                0.1: '#62BBE2',
                0.2: '#6098D3',
                0.3: '#84BD48',
                0.4: '#EEC112',
                0.5: '#F5901C',
                1.0: '#f50e62',
            },
            weight: 5,
            outlineColor: '#000000',
            outlineWidth: 1
        });
        hotlineLayer.addTo(app.map);



        app.riversLayer = hotlineLayer;
    }, 1000)
}

function stopRiversTime() {
    if(app.selectedRiverFeatrue) {
        app.map.addLayer(app.selectedRiverFeatrue);
    }

    if(app.riversTimeId) {
        clearInterval(app.riversTimeId);
    }

    setTimeout(function () {
        loadRiverJson();
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
   data.forEach(m => {
        const icon = L.icon({
            iconUrl: '/asserts/images/' + m.label,
            // shadowUrl: 'leaf-shadow.png',

            iconSize:     [26, 26], // size of the icon
            // shadowSize:   [50, 64], // size of the shadow
            // iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
            // shadowAnchor: [4, 62],  // the same for the shadow
            // popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
        });

        const html = `<div class="custom-popup-content">
                            <div class="popup-title">${m.name}</div>
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
       layers.push(L.marker(m.coordinate, {icon}).bindPopup(html, { minWidth: 200, className: 'custom-popup'}));
   });

    app.layers.label[layerName] = L.layerGroup(layers);
   app.map.addLayer(app.layers.label[layerName]);
}
