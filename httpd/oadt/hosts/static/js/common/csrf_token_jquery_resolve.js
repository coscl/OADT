/**
 * 每次提交的时候，都触发这个过程，在提交的http头上加入csrf
 * token。不过还好，如果你是用jQuery来处理ajax的话，Django直接送了一段解决问题的代码。把它放在一个独立的js文件中，在html页面中都引入即可。注意这个js文件必须在jquery的js文件引入之后，再引入
 */
$('html')
		.ajaxSend(
				function(event, xhr, settings) {
					function getCookie(name) {
						var cookieValue = null;
						if (document.cookie && document.cookie != '') {
							var cookies = document.cookie.split(';');
							for ( var i = 0; i < cookies.length; i++) {
								var cookie = jQuery.trim(cookies[i]);
								// Does this cookie string begin with the name
								// we want?
								if (cookie.substring(0, name.length + 1) == (name + '=')) {
									cookieValue = decodeURIComponent(cookie
											.substring(name.length + 1));
									break;
								}
							}
						}
						return cookieValue;
					}
					if (!(/^http:.*/.test(settings.url) || /^https:.*/
							.test(settings.url))) {
						// Only send the token to relative URLs i.e. locally.
						xhr.setRequestHeader("X-CSRFToken",
								getCookie('csrftoken'));
					}
				});
