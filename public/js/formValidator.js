;(function(){
  window.formValidator = window.formValidator || function(){
    let result, error = Object.create(null);

    this.validate = function(values, options) {
      for(let vKey in values)
      if(vKey in options)
        for(let i = 0; i < options[vKey].length; i++)
          chooseTest(options[vKey][i], vKey, values[vKey]);
          
      function chooseTest(option, key, data){
        let isError = false;
  
        switch(option.toString()) {
          case 'required':
            isError = required(data);
            break;
          case 'float':
            isError = float(data);
            break;
          case 'email':
            isError = email(data);
            break;
          case "password":
            isError = password(data, option.value);
            break;
          default:
            break;
        }
  
        if(isError)
          error[key] && (error[key].push(option.toString())) || (error[key] = [option.toString()]);
      }
  
      function required(data){
        return (data === undefined || data == "" || data === null);
      }
  
      function float(data){
        return required(data) || isNaN(data);
      }
  
      function email(data){
        let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return !re.test(String(data).toLowerCase());
      }

      function password(pass, rePass){
        return pass !== rePass;
      }

      return error;
    }
    
    this.setOptionObject = function(name, value){
      return {
        name,
        value,
        toString(){
          return name
        }
      }
    }
  }
})();