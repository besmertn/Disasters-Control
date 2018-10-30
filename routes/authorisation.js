let express = require('express'),
    router = express.Router(),
    config = require('../config'),
    requests = require('../logic/sql/requests'),
    errorGenerator = require('../logic/error-generator'),
    language = require('../logic/language'),
    jwt = require('jsonwebtoken');

let sql = new requests({connection: config.get('sql_connect')}),
  localization = new language({defaultLayouts: ['title']});

router.get('/exit', function(req, res, next) {
  res.cookie('token', null, {expires: new Date(0)}).redirect('/');
});

router.all('*', function(req, res, next) {
  if(req.data.user && req.data.user.id !== undefined)
    return res.redirect(`/`);
  next();
});

router.get('/', function(req, res, next) {
  res.render('authorisation', {
    title: 'SmartShare',
    user: req.data.user,
    text: localization.getTranslate(req.data.lenguage, 'authorization')
  });
});

router.post('/login', function(req, res, next) {
  let data = req.body;

  if(
    data.mail === undefined || data.mail === "" ||
    data.password === undefined || data.password === ""
  )
    return res.send(errorGenerator.requireData());

  sql.getUser(data, function (answer) {
    if(!(answer !== undefined && answer.id !== undefined))
      return res.send(errorGenerator.loginError());

    let token = jwt.sign(answer.id, config.get('encode_server_key'));
    res.cookie('token', token, { expires: new Date(Date.now() + 315360000), httpOnly: true });
    res.send(true);
  });
});

module.exports = router;