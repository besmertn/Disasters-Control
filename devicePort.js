let express = require('express'),
  bodyParser = require("body-parser"),
  requests = require('./logic/sql/requests'),
  config = require('./config');

let app = express();
let sql = new requests({connection: config.get('sql_connect')});

app.use(bodyParser.urlencoded({extended: true}));

app.post('/device', function(req, res, next) {
  let data = req.body;
  if(
    data.moduleId === undefined || data.moduleId === "" ||
    data.data === undefined || data.data === ""
  )
    return res.send(false);

  sql.setDeviceData(data, function (answer) {
    if(answer.error)
      return res.send(false);

    return res.send(true);
  });
});

app.post('/deviceSettings', function(req, res, next) {
  let data = req.body;
  if(data.moduleId === undefined || data.moduleId === "")
    return res.send(false);

  sql.getDeviceSettings(data, function (answer) {
    if(answer.error)
      return res.send(false);

    answer = answer.result[0].data[0];
    let result ={answer: [answer.avg_magnitude, answer.avg_temperature, answer.avg_water_level, answer.avg_gamma_rays]};

    return res.send(JSON.stringify(result));
  });
});

module.exports = app;
