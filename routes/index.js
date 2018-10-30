let express = require('express'),
    router = express.Router(),
    config = require('../config'),
    requests = require('../logic/sql/requests'),
    language = require('../logic/language');

let sql = new requests({connection: config.get('sql_connect')}),
    localization = new language({defaultLayouts: ['title', 'footer']});

router.get('/', function(req, res, next) {
  res.render('index', {
      title: 'Disasters Control',
      text: localization.getTranslate(req.data.lenguage, 'main'),
      mapKey: config.get('map_key'),
      user: req.data.user
  });
});

router.post("/", function (req, res, next) {
  sql.getGlobalData(function (answer) {
    res.send(answer);
  })
});

module.exports = router;
