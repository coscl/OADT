$(function() {
	validateBoxView = Backbone.View.extend({
		el : $('body'),
		options : {
			id : null,// 页面input输入框的id
			tipmsg : null,// 提示信息
			reqmsg : null,// 必填项提示信息
			reg_exp : null
		// 正则表达式
		},
		initialize : function() {
			_.bindAll(this, 'render', 'inputValidate', 'inputFocus','inputMouseOver',
					'inputBlur','validateNetMask');
			$('#' + this.options.id + '').bind('input', this.inputValidate);
			$('#' + this.options.id + '').bind('focus', this.inputFocus);
			$('#' + this.options.id + '').bind('blur', this.inputBlur);
			$('#' + this.options.id + '').bind('mouseover', this.inputMouseOver);
			$('#' + this.options.id + '').bind('mouseout', this.inputBlur);
			this.render();
		},
		render : function() {//tip的页面元素
			var $tip = $('<span class="validate_tip"></span>');
			$tip.append('<p></p><span class="validate_tip_arrow_border"></span><span class="validate_tip_arrow"></span>');
			$('#' + this.options.id + '').after($tip);
		},

		inputValidate : function() {
			this.content = $('#' + this.options.id + '').val();
			$('#' + this.options.id + '').next().children().eq(0).text(this.options.tipmsg);

			if (this.options.reg_exp.test(this.content)) {
				$('#' + this.options.id + '').next().hide();
				return true;
			} else {
				var a = $('#' + this.options.id + '').next();
				$('#' + this.options.id + '').next().show();
				
				return false;
			}
			this.cssPosition();
			
		},
		inputFocus:function(){
			if ($('#' + this.options.id + '').val()) {// 有值的时候
				return this.inputValidate()? true:$('#' + this.options.id + '').val("");
			}
		   this.inputMouseOver();
		},
		inputMouseOver : function() {
			if ($('#' + this.options.id + '').val()) {// 有值的时候
				this.inputValidate();
			} else {
				$('#' + this.options.id + '').next().children().eq(0).text(this.options.reqmsg);

				$('#' + this.options.id + '').attr("required") ? $(
						'#' + this.options.id + '').next().show() : $(
						'#' + this.options.id + '').next().hide();
				this.cssPosition();
			}
		},
		inputBlur : function() {
			$('#' + this.options.id + '').next().hide();
		},
		cssPosition : function() {
			
			var p_y = $('#' + this.options.id + '').position().top;
			var p_x = $('#' + this.options.id + '').position().left
			+ $('#' + this.options.id + '').width() + 5;
//			$('#' + this.options.id + '').next().css({
//				position:relative,
//				left : p_x,
//				top : p_y
//			});
			$('#' + this.options.id + '').next().position({
				left : p_x,
				top : p_y
			});
		},
		validateNetMask:function(){
			
			this.content = $('#' + this.options.id + '').val();
			$('#' + this.options.id + '').next().children().eq(0).text(this.options.tipmsg);
			
			var IPPattern = this.options.reg_exp;
			if (!IPPattern.test(this.content)) {
				$('#' + this.options.id + '').next().show();
				return false;
			}
			var IPArray = this.content.split(".");
			var ip1 = parseInt(IPArray[0]);
			var ip2 = parseInt(IPArray[1]);
			var ip3 = parseInt(IPArray[2]);
			var ip4 = parseInt(IPArray[3]);
			if (ip1 < 0 || ip1 > 255 || ip2 < 0 || ip2 > 255 || ip3 < 0 || ip3 > 255 || ip4 < 0 || ip4 > 255) {
				$('#' + this.options.id + '').next().show();
				return false;
			}
			var ip_binary = this._checkIput_fomartIP(ip1) + this._checkIput_fomartIP(ip2) + this._checkIput_fomartIP(ip3) + this._checkIput_fomartIP(ip4);
			if (-1 != ip_binary.indexOf("01")) {
				$('#' + this.options.id + '').next().show();
				return false;
			}
			$('#' + this.options.id + '').next().hide();
			return true;
			this.cssPosition();
		},
		_checkIput_fomartIP : function(ip) {
			return (ip + 256).toString(2).substring(1);
		},
	});
}());
