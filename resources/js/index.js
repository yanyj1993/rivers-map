let map = L.map("map", {
    minZoom: 1,
    maxZoom: 15,
    center: [32.09410041642852, 118.78932952880861],
    zoom: 14,
    zoomDelta: 0.5,
    fullscreenControl: false,
    zoomControl: false,
    attributionControl: false
});
window.map = map;
//http://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineCommunity/MapServer/tile/{z}/{y}/{x}//arcgis在线地图
// const baseLayer=L.tileLayer("http://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",{
// const baseLayer=L.tileLayer("//webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",{  // 卫星
const baseLayer=L.tileLayer("//webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",{ // 街道
    attribution: '&copy; 高德地图',
    subdomains: "1234"
});
window.map.addLayer(baseLayer);
