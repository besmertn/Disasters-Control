let express = require('express'),
  router = express.Router(),
  config = require('../config'),
  requests = require('../logic/sql/requests'),
  errorGenerator = require('../logic/error-generator'),
  language = require('../logic/language');

let sql = new requests({connection: config.get('sql_connect')}),
  localization = new language({defaultLayouts: ['title', 'footer']});

router.all('*', function(req, res, next) {
  sql.isModerator({id:req.data.user.id}, function (answer) {
    if(!answer)
      return res.redirect(`/`);

    next();
  });
});

router.get('/', function(req, res, next) {
  res.render('moderation', {
    title: 'SmartShare',
    user: req.data.user,
    text: localization.getTranslate(req.data.lenguage, 'moderation'),
  });
});

router.post('/', function(req, res, next) {
  sql.getModerationData(function (answer) {
    res.send(answer);
  });
});

router.post('/confirmDisaster', function(req, res, next) {
  let data = req.body;

  if( data.id === undefined || data.id === "" )
    return res.send(errorGenerator.requireData());

  sql.confirmDisaster(data, function (answer) {
    res.send(answer);
  });
});

module.exports = router;
