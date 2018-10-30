let fs = require('fs'),
    config = require('../../config'),
    filePath = require('path');

function translator(options){
	const defaultLanguage = config.get('default_language');
  this.default = Array.isArray(options.defaultLayouts) ? options.defaultLayouts : [options.defaultLayouts];

  this.getTranslate = function (language, page, layouts) {
    let result = Object.create(null);

    if ( !isFileExists(`/${language}`) ) {
      language = defaultLanguage;
    }

    for(let i = 0; i < this.default.length; i++)
      result[this.default[i]] = getJSON(language, this.default[i]);

  	result["page"] = getJSON(language, page);

  	if(layouts)
      result.layouts  = copyLayoutsProperties(Array.isArray(layouts) ? layouts : [layouts.toString()], language);

    return result;
  };

  function copyLayoutsProperties(layouts, language){
      let temp = {};

      for(let i = 0; i < layouts.length; i++){
        Object.assign(temp, getJSON(language, layouts[i]));
      }

      return temp;
  }

  function getJSON(language, name) {
    let path = `./${language}/${name}.json`;

    if ( !isFileExists(path) ) {
      path = `./${defaultLanguage}/${name}.json`;
      if( !isFileExists(path) )
        return {}
    }

    return require(path);
  }

  function isFileExists(path) {
    return fs.existsSync(filePath.join(__dirname, path));
  }
}

module.exports = translator;