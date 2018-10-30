let form = new authorisation({
	block: $('#registrationForm')
})

function authorisation(options) {
	let block = options.block,
			fields = {
				mail: block.find('#mailInput'),
        password: block.find('#passwordInput'),
				rePassword: block.find('#rePasswordInput')
			};
			

	function submit(){
		let validator = new formValidator(),
        data = {
          mail: fields.mail.val(),
          password: fields.password.val(),
          rePassword: fields.rePassword.val()
				}, 
				option = {
          mail: ["required", "email"],
					password: ["required", validator.setOptionObject("password", data.rePassword)],
					rePassword: ["required", validator.setOptionObject("password", data.password)]
				},
				result = validator.validate(data, option);

		if(Object.keys(result) == 0)
      return data;
    else
      setErrors(result);
      return false;
	}

	function setErrors(errors){
    clear();

    for(let key in errors){
      if(key in fields)
        fields[key].addClass('authorisation__form-error');
    }
  }

  function registration(){
  	const path = '/registration';
  	let values = submit();

    if(values == false) 
    	return;

    $.ajax({
      type: 'POST',
      url: path,
      data: (values),
      asinc: true,
      success: function(answer){
        if(answer.error){
        	alert(answer.error.message)
          throw new Error(`POST ERROR path: ${path}. \n ${answer.error.message}`);
        }

        location.reload();
      }
    });
  }

  function clear(){
  	block.find('.authorisation__form-error').removeClass("authorisation__form-error");
  }

  block.find("#submitForm").click(registration);
}