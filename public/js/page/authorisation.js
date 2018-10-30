let form = new authorisation({
	block: $('#authorisationForm')
})

function authorisation(options) {
	let block = options.block,
			fields = {
				mail: block.find('#mailInput'),
				password: block.find('#passwordInput')
			};
			

	function submit(){
		let data = {
					mail: fields.mail.val(),
					password: fields.password.val()
				}, 
				option = {
					mail: ["required", "email"],
					password: ["required"]
				},
				result = new formValidator().validate(data, option);

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

  function login(){
  	const path = '/authorisation/login';
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

  block.find("#submitForm").click(login);
}