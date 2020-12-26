
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

    // 初始化地图
    initMap();

    // loadRiverJson();
    loadGeoJson('/json/rivers-polygon-tdt.json', riversJson => {
        let index = 0;
        riversJson.features.forEach(feature => {
            const per = Math.floor(Math.random()*10+1);
            const f = {
                id: feature.properties.KIND,
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


    loadGeoJson('/json/nj-part.json', nj => {
        // new L.Line3(changeGeoJson(nj)).addTo(app.map);
        app.area = nj.features[0].geometry.coordinates[0];
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
            const selectedRivers = app.riversPolygon.filter(v => v.properties.KIND ==selected);
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
    $('#themeSelect').change(function () {
        const selected = $(this).val();
        switchTheme(selected);
    });

    $('#areaSelect').change(function () {
        const selected = $(this).val();
        switchArea(selected);
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

//模拟数据 返回数据格式
const mock = {
    // 监测站的数据模拟
  'getAllJcData': {
      code: 200,
      success: true,
      data: [
          {
              name: '', // 监测站名称
              label: '', // 指定要展示的图标
              coordinate: [0, 0], // 坐标 lng,lat
              // 其他的属性 比如监测的水质数据
          }
      ]
  }
};


// 模拟数据入口
function loadData() {
    // 检测站数据 气象的类似
    app.data.jcLayer  = mock.getAllJcData.data;


}


function initRiversSelect(rivers) {
    const html = rivers.map(river => `<option value="${river.id}">${river.name}</option>`).join('');

    $('#riversSelect').append(html);
}


// 初始化地图方法
function initMap() {
    // 初始化地图
    app.map = new maptalks.Map(
        // 地图实例div 的id
        'map',
        {
        center: [118.84283959865571,32.04890673772848],
        zoom: 11,
        // 倾斜角度(设置)
        pitch: 45,
        // 底图
        //     new maptalks.wm WMTSTileLayer('layer', {
        //         tileSystem: [1, -1, -180, 90],
        //         layer: 'vec',
        //         tilematrixset: 'c',
        //         format: 'tiles',
        //         urlTemplate: 'http://t{s}.tianditu.com/vec_c/wmts?tk=34e168d12e2b79f61dc1e6e220659c71',
        //         subdomains: ['1', '2', '3', '4', '5'],
        //         attribution: '&copy; <a target="_blank" href="http://www.tianditu.cn">Tianditu</a>'
        //     })
        //     new maptalks.TileLayer('base', {
        //     urlTemplate: 'http://webrd{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        //     subdomains: ['01','02','03','04'],
        //     //通过这个进行主题的切换
        //     cssFilter : 'sepia(100%) invert(100%) saturate(100%) brightness(150%)'
        //     // cssFilter : 'invert(1) grayscale(0) saturate(0.5) brightness(1.6) opacity(1) hue-rotate(334deg) sepia(10%)'
        //     // attribution: '&copy; <a href="http://osm.org">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/">CARTO</a>'
        // })
    });

    var url = 'https://t0.tianditu.gov.cn/vec_c/wmts?request=GetCapabilities&service=wmts&tk=de0dc270a51aaca3dd4e64d4f8c81ff6';


    maptalks.SpatialReference.loadWMTS(url, function (err, conf) {
        if (err) {
            throw new Error(err);
        }
        var params = conf[0];
        params.urlTemplate += '&tk=de0dc270a51aaca3dd4e64d4f8c81ff6';
        var tileLayer = new maptalks.TileLayer('tilelayer', params);
        var spatialReference = params.spatialReference;
        tileLayer.setOptions({cssFilter: 'sepia(100%) invert(100%) saturate(100%) brightness(150%)'});

       app.map.setSpatialReference(spatialReference);
        maptalks.SpatialReference.loadWMTS('https://t0.tianditu.gov.cn/cva_c/wmts?request=GetCapabilities&service=wmts&tk=de0dc270a51aaca3dd4e64d4f8c81ff6', function (err, conf) {
            if (err) {
                throw new Error(err);
            }
            var params = conf[0];
            params.urlTemplate += '&tk=de0dc270a51aaca3dd4e64d4f8c81ff6';
            var tileLayerc = new maptalks.TileLayer('tilelayerCVA', params);
            var spatialReference = params.spatialReference;
            tileLayerc.setOptions({cssFilter: 'sepia(100%) invert(100%) saturate(100%) brightness(150%)'});

            app.map.setSpatialReference(spatialReference);
            app.map.setBaseLayer(new maptalks.GroupTileLayer('base', [
                tileLayer,

                tileLayerc
            ], {
                cssFilter: 'sepia(100%) invert(100%) saturate(100%) brightness(150%)'
            }));
        });
    });



}

// 加载河流数据
function loadRiverJson() {
    // 清除已有的河流数据
    if(app.riversLayer) {
        if(app.selectedRiverFeatrue) {
            app.riversLayer.removeGeometry(app.selectedRiverFeatrue);
        }
        app.riversLayer.clear();
    }

    // 生成河流数据Polygon
    const riversPolygon =app.riversPolygon.map(p => {

        //可以根据自己的数据进行设置， 方式是getSymbol(), 传水质参数
        return p.copy().setSymbol({
            lineWidth: 2,
            lineColor: 'rgba(0,0,0,0.1)',
            'polygonFill' : {
                'type' : 'linear',
                // 设置颜色渐变，
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
    // 将数据添加进图层
    app.riversLayer.addGeometry(riversPolygon);
    if(!app.riversBounds) {
        app.riversBounds = app.riversLayer.getExtent();
    }

    app.map.setCenterAndZoom([118.7787879,32.08410319999999], 14);

}

// ajax 请求json方法
function loadGeoJson(path, cb) {
    $.ajax(path, {}).done( josn => {
        cb && cb(josn);

    } )
}

// 开启河流数据变化
function startRiversTime() {

    app.riversLayer.removeGeometry(app.selectedRiverFeatrue);
    app.riversTimeId = setInterval(function () {
        // 可以通过河流数据进行获取。 这里采用模拟随机数进行模拟
        app.riversLayer.addGeometry(app.selectedRiverFeatrue.copy().setSymbol(getSymbol(Math.random()*10+1)))

    }, 1000)
}

// 该方法提供根据值进行渐变色取值，需要对应自己的数据区间进行修改
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

// 停止河流数据变化
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

// 添加标注图层
function addLabel(layerName) {
    let layer = app.layers.label[layerName];
    if(layer==null) {
        layer = initLayer(layerName);
    }
    app.map.addLayer(layer);
}

// 隐藏/移除标注图层
function removeLabel(layerName) {
    let layer = app.layers.label[layerName];
    app.map.removeLayer(layer);
}

// 清除所有标注图层
function removeAllLabel() {
    if(app.layers.label.qxLayer) {
        app.map.removeLayer(app.layers.label.qxLayer);
    }
    if(app.layers.label.jcLayer) {
        app.map.removeLayer(app.layers.label.jcLayer);
    }
}

// 初始化标注图层
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

        // 弹框内容
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
           // 点击非marker或者弹框自动关闭
           'autoCloseOn' : 'click'
       });
   });




}


// 设置区域外遮罩效果
function drawBoundary(blist = app.area, op = 0.5) {
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
            lineWidth: 2,
            lineColor: 'rgba(0,0,0,0)',
            polygonFill: '#0c40c0',
            polygonOpacity: op,
        },
    });
    plyall.addTo(app.map.getLayer('area-shadow') || new maptalks.VectorLayer(
        "area-shadow",
        {  enableAltitude: true}
    ).addTo(app.map));
}

// 设置边界高亮和伪3d效果
function drawPolygons(coordinates, properties) {
    const polygon = new maptalks.MultiPolygon(coordinates, {
        symbol: {
            lineWidth: 1,
            lineColor: '#6098D3',
            polygonFill: 'rgba(0,0,0,0)',
            polygonOpacity: 0.5
        },
        properties: {
            altitude : 120
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

// 改变主题
function switchTheme(themeName) {

    const  baseLayer = app.map.getBaseLayer();
    const shadowLayer = app.map.getLayer('area-shadow');
    baseLayer.hide();
    shadowLayer.clear();
    if(themeName == 'dark') {
        // 设置css filter  , 底图隐藏展示就能刷新




        baseLayer.setOptions({cssFilter: 'sepia(100%) invert(100%) saturate(100%) brightness(150%)'});

        drawBoundary(app.area, 0.5)

    } else {
        // 将css filter 清除  , 底图隐藏展示就能刷新

        baseLayer.setOptions({cssFilter: ''});
        drawBoundary(app.area, 0.1)
    }

    baseLayer.show();

}

//改变 行政区域
function switchArea(areaName) {
    const shadowLayer = app.map.getLayer('area-shadow');
    const vectorLayer = app.map.getLayer('vector-polygon');
    shadowLayer.clear();

    vectorLayer.clear();
    if(areaName == 'river') {
        // 设置css filter  , 底图隐藏展示就能刷新

        loadGeoJson('/json/nj-part.json', nj => {
            // new L.Line3(changeGeoJson(nj)).addTo(app.map);
            app.area = nj.features[0].geometry.coordinates[0];
            const features = nj.features;
            let region  = [];
            features.forEach((g, i) => {
                const properties = g.properties;
                const coordinates = g.geometry.coordinates;
                region .push(...drawPolygons(coordinates, 30));
            });
            const polygonsLayer = vectorLayer
            .addGeometry([region[0]]);
            const polygonsLayer1 = vectorLayer.addGeometry([region[1]]);
            drawBoundary(nj.features[0].geometry.coordinates[0])
        });



    } else {
        loadGeoJson('/json/nj.json', nj => {
            // new L.Line3(changeGeoJson(nj)).addTo(app.map);
            app.area = nj.features[0].geometry.coordinates[0];
            const features = nj.features;
            let region  = [];
            features.forEach((g, i) => {
                const properties = g.properties;
                const coordinates = g.geometry.coordinates;
                region .push(...drawPolygons(coordinates, 30));
            });
            const polygonsLayer = vectorLayer.addGeometry([region[0]]);
            const polygonsLayer1 = vectorLayer.addGeometry([region[1]]);
            drawBoundary(nj.features[0].geometry.coordinates[0])
        });
    }

}
