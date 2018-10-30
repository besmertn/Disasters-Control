let express = require('express'),
    router = express.Router(),
    config = require('../config'),
    jwt = require('jsonwebtoken');

router.all('*', function(req, res, next) {
  req.data = {};
  req.data.user = {};

  if(req.cookies.token !== undefined) {
    jwt.verify(req.cookies.token, config.get('encode_server_key'), function(err, decoded) {
      if(err) {
        res.cookie('token', null, {expires: new Date(0)});
        return;
      }

      req.data.user = {id: decoded};
    });
  }

  if(req.cookies.language === undefined) {
    let l = config.get('default_language');
    res.cookie('language', l, {expires: new Date(Date.now() + 31536000000), path: "/"});
    req.data.lenguage = l;
  }else{
    req.data.lenguage = req.cookies.language;
  }

  next();
});

module.exports = router;
