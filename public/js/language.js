$(function(){
	let languageBlock = new language({
		block: $('.footer__language-list').first()
	})
});

function language(options){
	let block = options.block;

	function changeLocalization() {
		let language = $(this).attr('data-value'),
			now = new Date();

		now.setTime(now.getTime() + 31536000000);
		document.cookie = `language=${language};path=/;expires=${now.toGMTString()}`;
		location.reload();
	}

	block.find('.footer__language-button').click(changeLocalization);
}