let tables = new manager({
  disasterTable: $("#disasterTable")
});

function manager(options){
  let disasterTable = options.disasterTable;

  function getRequest(){
    const path = "/moderation";

    $.ajax({
      type: 'POST',
      url: path,
      asinc: true,
      success: function(answer){
        if(answer.error)
          throw new Error(`POST ERROR path: ${path}. \n ${answer.error.message}`);

        generateDisastersTables(answer.result[0].data);
      }
    });
  }

  function generateDisastersTables(data) {
    let fragment = document.createDocumentFragment();

    for (var i = 0; i < data.length; i++) {
      fragment.appendChild(generateDisastersTableHTML(data[i], i+1));
    }

    disasterTable.find("tbody").html(fragment);
  }

  function generateDisastersTableHTML(data, iterator) {
    let html = document.createElement("tr"),
        temp = '';

    iterator = iterator || disastersTable.find("tbody tr").size() + 1;
    html.data = data;

    temp += `
        <td>${iterator}</td>
        <td>${data.id}</td>
        <td>${data.location}</td>
        <td>${data.context}</td>
        <td>${data.dimension} km</td>
        <td class="account__table-button-cell"><div class="account__table-button" data-action="removeCancel">${localization.confirm}</div></td>
    `;

    html.innerHTML = temp;
    return html;
  }

  function confirmDisaster() {
    let block = $(this).parents("tr"),
        data = block.get(0).data;

    const path = `/moderation/confirmDisaster`;
  
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

  disasterTable.on('click', '.account__table-button', confirmDisaster);
}