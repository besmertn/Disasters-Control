function mapCallback() {
  return (function(){
    let edditB = new editBlock({
      form: $("#editBlock"),
      wrapperBlock: $("#editBlockWrapper")
    });
    let tables = new manager({
      devicesTable: $("#devicesTable"),
      disastersTable: $("#disastersTable"),
      addDeviceButton: $("#addDeviceButton"),
      addDisasterButton: $("#addDisasterButton"),
      editForm: edditB
    });

    let dMap = new devicesMap({
      block: $("#devicesMap"),
      manager: tables
    });
  })();
}

function manager(options){
  let devicesTable = options.devicesTable,
      disastersTable = options.disastersTable,
      addDeviceButton = options.addDeviceButton,
      addDisasterButton = options.addDisasterButton,
      editForm = options.editForm,
      devicesData;

  function getRequest(){
    const path = "/account/api/getAccountTables";

    $.ajax({
      type: 'POST',
      url: path,
      asinc: true,
      success: function(answer){
        if(answer.error)
          throw new Error(`POST ERROR path: ${path}. \n ${answer.error.message}`);

        devicesData = answer.result[0].data;
        generateDevicesTables(devicesData);
        generateDisastersTables(answer.result[1].data);
        devicesTable.trigger("load");
      }
    });
  }

  function generateDevicesTables(data){
    let fragment = document.createDocumentFragment();

    for (var i = 0; i < data.length; i++) {
      fragment.appendChild(generateDevicesTablesHTML(data[i], i+1));
    }

    devicesTable.find("tbody").html(fragment);
  }

  function appendDevicesTables(data){
    devicesTable.find("tbody").append(generateDevicesTablesHTML(data));
    devicesTable.trigger("append", data);
  }

  function generateDevicesTablesHTML(data, iterator) {
    let html = document.createElement("tr"),
        temp = '',
        coordinates = JSON.parse(data.location);

    html.data = data;
    iterator = iterator || devicesTable.find("tbody tr").size() + 1;

    temp = `<td>${iterator}</td>
            <td>lat:${coordinates.lat}, lng:${coordinates.lng}</td>
            <td class="account__table-button-cell"><div class="account__table-button" data-action="removeCancel">${localization.delete}</div></td>`;

    html.innerHTML = temp

    return html;
  }

  function generateDisastersTables(data) {
    let fragment = document.createDocumentFragment();

    for (var i = 0; i < data.length; i++) {
      fragment.appendChild(generateDisastersTableHTML(data[i], i+1));
    }

    disastersTable.find("tbody").html(fragment);
  }

  function appendDisastersTables(data){

    disastersTable.find("tbody").append(generateDisastersTableHTML(data));
  }

  function generateDisastersTableHTML(data, iterator) {
    let html = document.createElement("tr"),
        temp = '',
        coordinates = JSON.parse(data.location);

    iterator = iterator || disastersTable.find("tbody tr").size() + 1;
    html.data = data;

    temp += `
        <td>${iterator}</td>
        <td>lat:${coordinates.lat}, lng:${coordinates.lng}</td>
        <td>${data.context}</td>
        <td>${data.dimension} km</td>
        <td class="account__table-button-cell">
          ${data.confirmed != null? '<i class="far fa-check-circle fa-2x"></i>' : '<i class="far fa-times-circle fa-2x"></i>'}
        </td>
        <td>${data.time}</td>
        <td class="account__table-button-cell"><div class="account__table-button" data-action="removeCancel">${localization.delete}</div></td>
    `;

    html.innerHTML = temp;
    return html;
  }

  function deleteDevice() {
    let block = $(this).parents("tr"),
        data = block.get(0).data;

    const path = `/account/api/deleteDevice`;
  
    $.ajax({
      type: 'POST',
      url: path,
      data: ({
        id: data.id
      }),
      asinc: true,
      success: function(answer){
        if(answer.error)
          throw new Error(`POST ERROR path: ${path}. \n ${answer.error.message}`);

        block.remove();
        devicesTable.trigger("delete", data.id);
      }
    });
  }

  function deleteDisaster() {
    let block = $(this).parents("tr"),
        data = block.get(0).data;

    const path = `/account/api/deleteDisaster`;
  
    $.ajax({
      type: 'POST',
      url: path,
      data: ({
        id: data.id
      }),
      asinc: true,
      success: function(answer){
        if(answer.error)
          throw new Error(`POST ERROR path: ${path}. \n ${answer.error.message}`);

        block.remove();
      }
    });
  }

  getRequest();
  addDeviceButton.click(function() {
    editForm.openDevice(appendDevicesTables);
  });
  addDisasterButton.click(function() {
    editForm.openDisaster(appendDisastersTables);
  });

  devicesTable.on('click', '.account__table-button', deleteDevice);
  disastersTable.on('click', '.account__table-button', deleteDisaster);

  this.getDevices = function(){return devicesData};
  this.devicesTable = devicesTable;
}

function editBlock(options) {
  let form = options.form,
      wrapperBlock = options.wrapperBlock,
      map, mapMarker, mapRound,
      fields = {
        location: form.find('#editFieldMap'),
        describe: form.find('#editFieldDescribe'),
        dimension: form.find('#editFieldDimension')
     };

  function openDevice(callback){
    let filterOption = {
      location: ["required"]
    };
        
    open(callback, "addDevice", filterOption);
    fields.describe.parent().hide();
    fields.dimension.parent().hide();
  }

  function openDisaster(callback){
    let filterOption = {
      location: ["required"],
      describe: ["required"],
      dimension: ["required", "float"]
    };
        
    open(callback, "addDisaster", filterOption);
    fields.describe.parent().show();
    fields.dimension.parent().show();
  }

  function open(callback, action, filterOption){
    clearForm();
    wrapperBlock.show();
    form.show();
    wrapperBlock.one("click", close);
    form.find("#editBlockSubmit").on("click", null, {callback, action, filterOption}, request);
  }

  function clearForm(){
    setErrors();

    form.find("input").val("");
    if(mapMarker) {
      mapMarker.setMap(null);
      mapMarker = undefined;
    }
    if(mapRound) {
      mapRound.setMap(null);
      mapRound = undefined;
    }
  }

  function close(){
    form.hide();
    wrapperBlock.hide();
  }

  function submit(option){
    let data = {
        location: mapMarker ? `{ "lat": ${mapMarker.getPosition().lat()}, "lng": ${mapMarker.getPosition().lng()} }` : mapMarker,
        describe: fields.describe.val(),
        dimension: fields.dimension.val()
      },
        result = new formValidator().validate(data, option);

    if(Object.keys(result) == 0)
      return data;
    else
      setErrors(result);
    return false;
  }

  function request(e){
    let values = submit(e.data.filterOption);
    if(values != false)    
      addDataRequest();

    function addDataRequest(){
      const path = `/account/api/${e.data.action}`;
      $.ajax({
        type: 'POST',
        url: path,
        data: (values),
        asinc: true,
        success: function(answer){console.log(answer)
          if(answer.error)
            throw new Error(`POST ERROR path: ${path}. \n ${answer.error.message}`);

          form.find("#editBlockSubmit").off("click", request);
          close();

          e.data.callback(getResultFromAnswer(answer.result, "selectAnswer")[0]);
        }
      });
    }
  }

  function setErrors(errors){
    let errorClass = "edit-product__form-error"
    
    form.find('.'+errorClass).removeClass(errorClass);

    for(let key in errors){
      if(key in fields)
        fields[key].addClass(errorClass);
    }
  }

  function createMap() {
    const mapCenter = {lat: 48.8423042, lng: 31.4628628};

    map = new google.maps.Map(document.getElementById('editFieldMap'), {
      zoom: 6,
      center: mapCenter
    });
    map.addListener('click', function(event) {
       placeMarker(event.latLng);
    });
    fields.dimension.change(function() {
      setRound();
    });

    function placeMarker(location) {
      mapMarker = mapMarker || new google.maps.Marker({
          map: map
      });

      mapMarker.setPosition( location );
      setRound();
    }

    function setRound() {
      if(mapRound === undefined) {
        mapRound = new google.maps.Circle({
          strokeColor: '#FF0000',
          strokeOpacity: 0.8,
          strokeWeight: 1,
          fillColor: '#FF0000',
          fillOpacity: 0.35,
          map: map
        });
      }
      if(mapMarker)
        mapRound.setCenter(mapMarker.getPosition());
      mapRound.setRadius( parseInt( fields.dimension.val() * 100 ) );
    }
  }

  createMap();
  form.find("#editBlockBack").click(close);

  this.openDevice = openDevice;
  this.openDisaster = openDisaster;
  this.close = close;
}

function devicesMap(options) {
  const mapCenter = {lat: 48.8423042, lng: 31.4628628},
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
        };

  let block = options.block,
      manager = options.manager,
      markers = [], map;

  function createMap() {
    map = new google.maps.Map( block.get(0), {
      zoom: 6,
      center: mapCenter
    });

    manager.devicesTable.on("load", setMarkers);
    manager.devicesTable.on("append", appendMarker);
    manager.devicesTable.on("delete", removeMarker);
  }

  function setMarkers() {
    let devices = manager.getDevices();

    markers = devices.map(function(device) {
      let mType = setMarkerType(device),
          marker = new google.maps.Marker({
        position: JSON.parse(device.location),
        icon: icons[mType],
        map: map
      });
      marker.deviceId = device.id;
      return marker;
    });

  }

  function appendMarker(e, device) {
    let mType = setMarkerType(device),
        marker = new google.maps.Marker({
        position: JSON.parse(device.location),
        icon: icons[mType],
        map: map
      });
    marker.deviceId = device.id;
    markers.push(marker);
  }

  function removeMarker(e, id) {
    for(let i = 0; i < markers.length; i++)
      if(markers[i].deviceId == id)
        return markers[i].setMap(null);
  }

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

  createMap();
}

function getResultFromAnswer(answer, title) {
  for(let i = 0; i < answer.length; i++){
    if(answer[i].title == title)
      return answer[i].data;
  }
  return false;
}