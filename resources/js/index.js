
window.app = {
  map: null,  //地图实例
  layers: {},  // 图层
  rivers: [],
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
        } else {
            $(this).addClass('left-tool-selected');
            loadRiverJson();
            $('.wq').show();
        }
    });

    $('#riversSelect').change(function () {
        const selected = $(this).val();
        stopRiversTime();
        if(!!selected) {
            const selectedRivers = app.rivers.filter(a => a.id == selected);
            app.map.fitBounds(L.latLngBounds(selectedRivers[0].coordinates));

            app.selectedRiver = selectedRivers[0];
            app.selectedRiverId = selectedRivers[0].id;
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

    const hotlineLayer = L.hotline(app.rivers.map(a => a.coordinates.map(a1 => [...a1, a.wq])), {
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
    hotlineLayer.bindLabel("my tooltip text");
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
    app.riversTimeId = setInterval(function () {
        if(app.riversLayer) {
            app.map.removeLayer(app.riversLayer);
            app.riversLayer = null;
        }

        const hotlineLayer = L.hotline(app.rivers.map(a => {
            let per = Math.floor(Math.random()*10+1);
            if(a.id == app.selectedRiverId) {
                return a.coordinates.map(a1 => [...a1,per])
            } else {
               return  a.coordinates.map(a1 => [...a1, a.wq])
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
        hotlineLayer.bindLabel("my tooltip text");
        hotlineLayer.addTo(app.map);

        app.riversLayer = hotlineLayer;
    }, 1000)
}

function stopRiversTime() {
    if(app.riversTimeId) {
        clearInterval(app.riversTimeId);
    }

    setTimeout(function () {
        loadRiverJson();
    }, 1000);

    $('#wqTime').prop('checked', false);

    app.riversTimeId = null;
}
