function mapCallback() {
  return (function(){
    let mapBlock = new mapInterface({
      mapBlock: $("#map"),
      describeBlock: $("#mapDescribe")
    });
  })();
}

let disasterTable = new generalTable({
  table: $("#disasterTable")
});

function mapInterface(options) {
  const mapCenter = {lat: 48.8423042, lng: 31.4628628};
  let mapBlock = options.block,
      describeBlock = options.describeBlock,
      icons = {
        rescueBase: {
          url: '/img/markers/rescue-base.png',
          anchor: new google.maps.Point(15, 15)
        },
        fire: {
          url: '/img/markers/fire.png',
          scaledSize : new google.maps.Size(30, 40)
        },
        earthquake: {
          url: '/img/markers/earthquake.png',
          scaledSize : new google.maps.Size(30, 40)
        },
        flood: {
          url: '/img/markers/flood.png',
          scaledSize : new google.maps.Size(30, 40)
        },
        radiation: {
          url: '/img/markers/radiation.png',
          scaledSize : new google.maps.Size(30, 40)
        },
        default: {
          url: '/img/markers/default.png',
          scaledSize : new google.maps.Size(30, 40)
        }
      },
      colorScheme = {
        round: {
          strokeColor: '#FF0000',
          strokeOpacity: 0.8,
          strokeWeight: 1,
          fillColor: '#FF0000',
          fillOpacity: 0.35
        },
        lineToRound: {
          strokeColor: '#9c2700', 
          strokeWeight: 3
        },
        lineToMarker: {
          strokeColor: '#ff5100', 
          strokeWeight: 2
        }
      },
      map;

  function getRequest() {
    const path = "/";

    $.ajax({
      type: 'POST',
      url: path,
      asinc: true,
      success: function(answer){
        if(answer.error)
          throw new Error(`POST ERROR path: ${path}. \n ${answer.error.message}`);

        createMap([
          createMarkeTemplate(answer.result[0].data),
          createBaseTemplate(answer.result[2].data),
          createDisasterTemplate(answer.result[1].data),
        ]);


      }
    });

    function createMarkeTemplate(data) {
      return data.map(function(item){
        let iType = setMarkerType(item);

        return {
          position: JSON.parse(item.location),
          type: iType,
          context: localization[iType]
        }
      });

      function setMarkerType(data) {
        if(data.magnitude > data.avg_magnitude)
          return "earthquake"
        if(data.temperature > data.avg_temperature)
          return "fire"
        if(data.water_level > data.avg_water_level)
          return "flood"
        if(data.gamma_rays > data.avg_gamma_rays)
          return "radiation"
        return "default";
      }
    }

    function createBaseTemplate(data) {
      return data.map(function(item){
        return {
          position: JSON.parse(item.location),
          type: 'rescueBase',
          context: item.address
        }
      });
    }

    function createDisasterTemplate(data) {
      return data.map(function(item){
        return {
          center: JSON.parse(item.location),
          dimension: item.dimension,
          describe: item.context
        }
      });
    }
  }

  function createMap(data) {
    let devices = data[0],
        bases = data[1],
        disasters = data[2];

    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 6,
      center: mapCenter
    });
    devices = createInfoWindow(devices, "context", "position");
    bases = createInfoWindow(bases, "context", "position");
    disasters = createInfoWindow(disasters, "describe", "center");
    setMarker(devices);
    setMarker(bases);
    setRounds(disasters);

    function createInfoWindow(data, contentField, positionField) {
      data = data.map(function(obj){
        obj[contentField] = new google.maps.InfoWindow({
          content:  obj[contentField],
          position: obj[positionField]
        });
        return obj;
      });
      return data;
    }  

    function setMarker(data) {
      data.forEach(function(feature) {
        var marker = new google.maps.Marker({
          position: feature.position,
          icon: icons[feature.type],
          map: map
        });
        marker.addListener('mouseover', function() {
          feature.context.open(map, marker);
          data.way = createLines(feature.position, {
            strokeColor: colorScheme.lineToMarker.strokeColor , 
            strokeWeight: colorScheme.lineToMarker.strokeWeight
          });
        });
        marker.addListener('mouseout', function() {
          feature.context.close(map, marker);
          deleteLines(data.way)
        });
      });
    }

    function setRounds(data) {
      data.forEach(function(disaster) {
        let circle = new google.maps.Circle({
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 1,
            fillColor: '#FF0000',
            fillOpacity: 0.35,
            map: map,
            center: disaster.center,
            radius: disaster.dimension * 100
        });
        circle.addListener('mouseover', function() {
          disaster.describe.open(map, circle);
          circle.way = createLines(disaster.center, {
            strokeColor: colorScheme.lineToRound.strokeColor , 
            strokeWeight: colorScheme.lineToRound.strokeWeight
          });
        });
        circle.addListener('mouseout', function() {
          disaster.describe.close(map, circle);
          deleteLines(circle.way)
        });
      });
    }

    function createLines(initialCoord, optons) {
      initialCoord = new google.maps.LatLng(initialCoord.lat, initialCoord.lng);
      let temp = [], result = [], minValue;

      bases.forEach(function(base) {
        let obj = Object.create(null);

        obj.coord = new google.maps.LatLng(base.position.lat, base.position.lng);
        obj.distance = google.maps.geometry.spherical.computeDistanceBetween(initialCoord, obj.coord);
        minValue == undefined && (minValue = obj.distance) || (minValue = minValue > obj.distance ? obj.distance : minValue);
        temp.push(obj)
      });

      result = temp.filter(function(item, i, arr) {
        return item.distance / minValue < 1.25;
      });

      result = result.map(function(item, i, arr) {
        let temp = new google.maps.Polyline({
          path: [item.coord, initialCoord],
          geodesic: true,
          strokeColor: optons.strokeColor,
          strokeOpacity: 1.0,
          strokeWeight: optons.strokeWeight
        });

        temp.setMap(map);
        return temp;
      });

      return result;
    }

    function deleteLines(data) {
      data.forEach(function(item) {
        item.setMap(null);
      });
    }
  }

  function createDescribe() {
    describeBlock.find("#describeRound").css({
      background: `rgba(${hexToRgb(colorScheme.round.fillColor)}, ${colorScheme.round.fillOpacity})`,
      border: `${colorScheme.round.strokeWeight}px solid rgba(${hexToRgb(colorScheme.round.strokeColor)}, ${colorScheme.round.strokeOpacity})`
    });

    describeBlock.find("#describeLineToRound").css({
      height: colorScheme.lineToRound.strokeWeight + "px",
      background: colorScheme.lineToRound.strokeColor
    });

    describeBlock.find("#describeLineToDevice").css({
      height: colorScheme.lineToMarker.strokeWeight + "px",
      background: colorScheme.lineToMarker.strokeColor
    });

    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
          : null;
    }
  }

  getRequest();
  createDescribe();
}

function generalTable(options) {
  let table = options.table;

  function retRequest() {
    const path = "/";

    $.ajax({
      type: 'POST',
      url: path,
      asinc: true,
      success: function(answer){
        if(answer.error)
          throw new Error(`POST ERROR path: ${path}. \n ${answer.error.message}`);

        generateTable(answer.result[1].data);
      }
    });
  }

  function generateTable(data) {
    let fragment = document.createDocumentFragment();

    for (var i = 0; i < data.length; i++) {
      fragment.appendChild(generateTablesHTML(data[i], i+1));
    }

    table.find("tbody").html(fragment);
  }

  function generateTablesHTML(data, iterator) {
    let html = document.createElement("tr"),
        temp = '',
        coordinates = JSON.parse(data.location);

    html.data = data;

    temp =  `<td>${iterator}</td>
             <td>lat: ${coordinates.lat}, lng: ${coordinates.lng}</td>
             <td>${data.dimension} km</td>
             <td>${data.context}</td>`;

    html.innerHTML = temp

    return html;
  }

  retRequest();
}