let express = require('express'),
    router = express.Router(),
    config = require('../config'),
    requests = require('../logic/sql/requests'),
    errorGenerator = require('../logic/error-generator'),
    language = require('../logic/language');

let sql = new requests({connection: config.get('sql_connect')}),
    translate = new language({defaultLayouts: ['title', 'footer']});

router.all('*', function(req, res, next) {
  if(!(req.data.user && req.data.user.id !== undefined))
    return res.redirect(`/`);

  next();
});

router.get('/', function(req, res, next) {
  res.render('account', {
    title: 'Disasters Control',
    mapKey: config.get('map_key'),
    user: req.data.user,
    language: req.cookies.language,
    text: translate.getTranslate(req.data.lenguage, 'account')
  });
});

router.post('/api/getAccountTables', function(req, res, next) {
  sql.getAccountTables({
    id: req.data.user.id
  }, function (answer) {
    res.send(answer);
  });
});

router.post('/api/addDevice', function(req, res, next) {
  let data = req.body;

  if(data.location === undefined || data.location === "")
    return res.send(errorGenerator.requireData());

  data.userId = req.data.user.id;
  sql.addDevice(data, function (answer) {
    res.send(answer);
  });
});

router.post('/api/addDisaster', function(req, res, next) {
  let data = req.body;

  if(
    data.describe === undefined || data.describe === "" ||
    data.dimension === undefined || data.dimension === "" ||
    data.location === undefined || data.location === ""
    )
    return res.send(errorGenerator.requireData());

  data.userId = req.data.user.id;
  sql.addDisaster(data, function (answer) {
    res.send(answer);
  });
});

router.post('/api/deleteDevice', function(req, res, next) {
  let data = req.body;

  if(data.id === undefined || data.id === "")
    return res.send(errorGenerator.requireData());

  data.userId = req.data.user.id;
  sql.deleteDevice(data, function (answer) {
    res.send(answer);
  });
});

router.post('/api/deleteDisaster', function(req, res, next) {
  let data = req.body;

  if(data.id === undefined || data.id === "")
    return res.send(errorGenerator.requireData());

  data.userId = req.data.user.id;
  sql.deleteDisaster(data, function (answer) {
    res.send(answer);
  });
});


module.exports = router;