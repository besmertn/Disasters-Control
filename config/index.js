let nconf = require('nconf'),
    path = require('path'),
    fs = require('fs');

let getPath = path.join.bind(null, __dirname);

nconf
  .argv()
  .env()
  .file({ file: getPath('config.json') })
  .set('httpsOptions', {
    key: fs.readFileSync(getPath('server.key')),
    cert: fs.readFileSync(getPath('server.crt')),
    passphrase: nconf.get('https_key')
  });

nconf.getOnes = function (key) {
  let result = this.get(key);
  this.set(key, undefined);
  return result;
};

module.exports = nconf;