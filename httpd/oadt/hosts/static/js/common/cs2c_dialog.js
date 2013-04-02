(function() {
	window.Cs2c_Tab = Backbone.View.extend({
		options : {
			tab_id : '',
			tabTitles : [],
			height : 150
		},

		events : {
			"click .cs2c_tab_btn" : "changTab",
		},

		initialize : function() {
			$(this.el).addClass('cs2c_tab');
			// 在用户创建对话框内容位置创建对话框
			$('#' + this.options.tab_id).parent().append(this.el);
			// 创建控件内容
			this.createTabs();
			this.createTabsBody();

		},

		/**
		 * 创建选项卡控件的选项标题集合
		 * 
		 * @author qianqian.yang 2013-1-9
		 */
		createTabs : function() {
			$(this.el).append('<div class="cs2c_tab_title"></div>');
			// 设置Tab的标签的显示状态
			var tabTitles = '';
			for ( var i = 0; i < this.options.tabTitles.length; i++) {
				tabTitles += '<span class="cs2c_tab_btn '
						+ (i == 0 ? 'cs2c_tabs_selected ' : '') + '">'
						+ this.options.tabTitles[i] + '</span>';
			}
			$(this.el).find('.cs2c_tab_title').append(tabTitles);
		},

		/**
		 * 创建选项卡控件的选项内容集合
		 * 
		 * @author qianqian.yang 2013-1-9
		 */
		createTabsBody : function() {
			$(this.el).append($('#' + this.options.tab_id));
			var tabsBody = $(this.el).find('#' + this.options.tab_id);
			tabsBody.addClass('cs2c_tab_ctx');
			tabsBody.height(this.options.height);
			// 设置Tab的内容的显示状态
			tabsBody.children().eq(0).show().siblings().hide();
		},

		render : function() {
			return this;
		},

		/**
		 * 鼠标点击选项卡标题事件
		 * 
		 * @author qianqian.yang 2013-1-9
		 */
		changTab : function(e) {
			// 设置Tab的显示位置
			$(e.currentTarget).addClass('cs2c_tabs_selected').siblings()
					.removeClass('cs2c_tabs_selected');
			// 控制Tab内容的显示
			var index = $(e.currentTarget).index();// 同辈中的索引位置
			$('#' + this.options.tab_id).children().eq(index).show().siblings()
					.hide();

		}
	});
}());

(function() {
	/**
	 * 层次显示的全局变量的大小，用于对话框和遮罩层次的确定
	 */
	window.zIndex = 9000;

	/**
	 * cs2c遮罩显示
	 * 
	 * @author qianqian.yang 2012-10-19
	 */
	window.CS2C_Shadow = Backbone.View.extend({
		options : {
			/**
			 * 创建遮罩的位置
			 */
			position_id : '',
			/**
			 * 是否是全局遮罩，默认为是
			 */
			isAllMask : true,
			/**
			 * 如果不是全局遮罩，局部遮罩父节点的id
			 */
			parentEl_id : '',
			/**
			 * 是否显示请等待的字样
			 */
			isLoading : true
		},

		initialize : function() {

			// 随着浏览器窗体大小的改变渲染，包括样式和位置
			var thisEl = this;
//			$(window).resize(function() {
//				thisEl.calMask();
//			});

		    $(this.el).addClass('dialog-mask');
		    
		    if(this.options.isAllMask){
		    	// 在用户创建对话框内容位置创建对话框
				$('#' + this.options.position_id).after(this.el);
		    }else{
		    	$('#' + this.options.parentEl_id).append(this.el);
		    }
			_.bindAll(this, 'render');
		},

		render : function() {
			if (this.options.isLoading) {
				$(this.el).after(
						'<div class="dialog-mask-msg">正在处理，请稍侯...</div>');
			}
			return this;
		},

		/**
		 * 计算遮罩的大小和位置
		 * 
		 * @author qianqian.yang 2012-11-6
		 */
		calMask : function() {
			// 遮罩等待字样居中显示
			var parent = this.options.isAllMask ? $(document) : $('#'
					+ this.options.parentEl_id);
			var mask = $(this.el);
			mask.css({
				height : parent.height(),
				width : parent.width()
				//zIndex : zIndex++
			});
			// 如果需要显示加载字样
			if (this.options.isLoading) {
				var msg = $(this.el).next();
				msg.css({
					left : (parent.width() - msg.outerWidth()) / 2,
					top : (parent.height() - msg.outerHeight()) / 2
					//zIndex : zIndex++
				});
			}
		},

		/**
		 * 是否显示对话框中的蒙板
		 * 
		 * @author qianqian.yang 2012-11-1
		 * @param flag
		 *            是否显示遮罩
		 */

		isMask : function(flag) {
			var parent = this.options.isAllMask ? $(document) : $('#'
					+ this.options.parentEl_id);
			var mask = $(this.el);
			mask.css({
				height : parent.height(),
				width : parent.width(),
				zIndex : zIndex++
			});
			
			if (flag) {
				mask.show();
			} else {
				mask.hide();
			}
			
			//如果需要显示加载字样
			if (this.options.isLoading) {
				var msg = $(this.el).next();
				msg.css({
					left : (parent.width() - msg.outerWidth()) / 2,
					top : (parent.height() - msg.outerHeight()) / 2,
					zIndex : zIndex++
				});
				
				if (flag) {
					msg.show();
				} else {
					msg.hide();
				}
			}
		}

	});

	/**
	 * cs2c对话框类
	 * 
	 * @author qianqian.yang 2012-10-19
	 */
	window.CS2C_Dialog = Backbone.View.extend({

		options : {
			/*
			 * 用户自定义的对话框内容的div层id号
			 */
			dialog_content_id : null,
			/*
			 * 对话框标题
			 */
			title : '',
			/*
			 * 对话框显示的按钮集
			 */
			buttons : [],
			/*
			 * 对话框的宽度、高度（不带单位）
			 */
			width : 250,
			height : 110,
			/*
			 * 是否可关闭
			 */
			closable : true,
			/*
			 * 是否显示背景蒙板
			 */
			modal : true,

			/*
			 * 对话框的绝对定位，如果有位置的定义，则如下：position:{x:100,y:200}
			 */
			position : {}
		},

		events : {
			"mousemove .cs2c_dialog_header" : "mouseMoveDone",
			"mousedown .cs2c_dialog_header" : "mouseDownDone",
			"click .cs2c_dialog_close_btn" : "closeDialog",
			"click .cs2c_dialog_button a" : "buttonAction"
		},

		initialize : function() {

			// 随着浏览器窗体大小的改变渲染，包括样式和位置
			var thisEl = this;
			$(window).resize(function() {
				thisEl.render();
			});
			$(this.el).addClass('cs2c_dialog');

			// 在用户创建对话框内容位置创建对话框
			$('#' + this.options.dialog_content_id).parent().append(this.el);

			// 创建对话框内容
			this.createHeader();
			this.insertContentDiv();
			this.createInnerMask();
			this.createDialogShadow();
			this.createBottomButtons();
			this.isShadowMask(this.options.modal);
			this.closeDialog();
			this.createOtherComponent();
			
			

		},

		render : function() {

			var top, left;

			var thisEl = $(this.el)[0];
			thisEl.style.zIndex = zIndex++;
			// thisEl.style.display = "block";
			thisEl.style.position = "fixed";

			if (!this.options.position.hasOwnProperty('x')) {
				top = (document.documentElement.clientHeight - this.options.height) / 2 + "px";
				left = (document.documentElement.clientWidth - this.options.width) / 2
						+ "px";
			} else {
				top = this.options.position.y + "px";
				left = this.options.position.x + "px";
			}
			thisEl.style.top = top;
			thisEl.style.left = left;
			thisEl.style.minwidth = this.options.width + "px";
			thisEl.style.width = this.options.width + "px";
			thisEl.style.minHeight = (65 + this.options.height) + "px";

			(document.all) ? $(this.el).siblings('.cs2c_dialog_shadow').css(
					'filter', 'alpha(opacity=30)') : '';

			return this;

		},

		/**
		 * 变换鼠标显示状态
		 * 
		 * @author qianqian.yang 2012-12-5
		 * @param e
		 */
		mouseMoveDone : function(e) {
			var header = e.currentTarget;
			header.style.cursor = "move";
		},

		mouseDownDone : function(e) {
			e = e || event;
			var moveObj = $(e.currentTarget).parent();
			var moveObjOffset = moveObj.offset();

			// x=鼠标相对于网页的x坐标-网页被卷去的宽-待移动对象的左外边距
			var x = e.clientX - document.body.scrollLeft - moveObjOffset.left;
			// y=鼠标相对于网页的y左边-网页被卷去的高-待移动对象的左上边距
			var y = e.clientY - document.body.scrollTop - moveObjOffset.top;

			document.onmousemove = function(e) {// 鼠标移动
				if (!e) {
					e = window.event; // 移动时创建一个事件
				}
				moveObj.offset({
					left : e.clientX + document.body.scrollLeft - x,
					top : e.clientY + document.body.scrollTop - y
				});
			};
			document.onmouseup = function() {// 鼠标放开
				document.onmousemove = null;
				document.onmouseup = null;
				moveObj.css("cursor", "normal");
			};
		},

		/**
		 * 创建对话框的标题
		 * 
		 * @author qianqian.yang 2012-10-19
		 */
		createHeader : function() {

			// 创建标题栏
			$(this.el).append('<div class="cs2c_dialog_header"></div>');

			// 将用户自定义的对话框标题写入新建对话框
			$(this.el).find('.cs2c_dialog_header').html(this.options.title);

			if (this.options.closable) {
				// 标题处工具栏
				var closedButton = document.createElement("a");
				closedButton.className = "cs2c_dialog_close_btn";
				$(this.el).find('.cs2c_dialog_header').append(closedButton);
				$(closedButton).html("关闭");
			}

		},

		/**
		 * 将用户定义的对话框内容层插入到绘制的对话框中
		 * 
		 * @author qianqian.yang 2012-10-19
		 */
		insertContentDiv : function() {

			// 创建对话框的内容显示区域
			var dialog_body = document.createElement("div");
			dialog_body.className = "cs2c_dialog_body";
			dialog_body.style.position = "relative";
			dialog_body.style.backgroundColor = "#fff";
			dialog_body.style.minHeight = this.options.height + "px";
			dialog_body.style.overflowY = "auto";
			dialog_body.style.overflowX = "hidden";
			dialog_body.style.maxHeight = "300px";

			$(this.el).append(dialog_body);

			$(dialog_body).append($("#" + this.options.dialog_content_id));

		},

		/**
		 * 创建对话框内部的遮罩
		 * 
		 * @author qianqian.yang 2012-11-1
		 */
		createInnerMask : function() {
			$(this.el).find('.cs2c_dialog_body').append(
					'<div class="dialog-mask"></div>');
			$(this.el).find('.cs2c_dialog_body').append(
					'<div class="dialog-mask-msg">正在处理，请稍侯...</div>');
		},

		/**
		 * 是否显示对话框中的蒙板
		 * 
		 * @author qianqian.yang 2012-11-1
		 * @param flag
		 */
		isInnerMask : function(flag) {
			if (flag) {
				// 遮罩等待字样居中显示
				var dialog_body = $(this.el).find('.cs2c_dialog_body');
				var mask = $(this.el).find('.dialog-mask');

				mask.css({
					height : dialog_body.height(),
					width : dialog_body.width(),
					zIndex : zIndex++
				});
				mask.show();

				var msg = $(this.el).find('.dialog-mask-msg');
				msg.css({
					left : (dialog_body.width() - msg.outerWidth()) / 2,
					top : (dialog_body.height() - msg.outerHeight()) / 2,
					zIndex : zIndex++
				});
				msg.show();
			} else {
				$(this.el).find('.dialog-mask').hide();
				$(this.el).find('.dialog-mask-msg').hide();
			}

		},

		/**
		 * 创建对话框背景蒙板层
		 * 
		 * @author qianqian.yang 2012-10-19
		 */
		createDialogShadow : function() {
			$(this.el).after(
					'<div class="cs2c_dialog_shadow" style="z-index:'
							+ (zIndex++) + '; height:'+ document.documentElement.scrollHeight+'px;"></div>');
		},

		/**
		 * 是否显示对话框的背景遮罩蒙板
		 * 
		 * @author qianqian.yang 2012-11-1
		 * @param flag
		 */
		isShadowMask : function(flag) {
			var outterMasks = $(this.el).siblings('.cs2c_dialog_shadow');
			if (outterMasks.length > 1) {
				var id = '#' + this.options.dialog_content_id;
				_.each(outterMasks, function(outterMask) {
					var length = $(outterMask.previousSibling).find(id).length;
					if (length !== 0) {
						outterMasks = $(outterMask);
					}
				});
			}
			if (flag) {
				outterMasks.show();
			} else {
				outterMasks.hide();
			}
		},

		/**
		 * 控制对话框的开关状态
		 * 
		 * @author qianqian.yang 2012-11-1
		 * @param flag
		 *            true 打开对话框 flase 关闭对话框
		 */
		isOpenDialog : function(flag) {
			$(this.el).css({zIndex : zIndex++});
			if (flag) {
				$(this.el).show();
				$('#'+this.options.dialog_content_id).show();
			} else {
				$(this.el).hide();
				$('#'+this.options.dialog_content_id).hide();
			}
		},

		/**
		 * 打开对话框
		 * 
		 * @author qianqian.yang 2012-10-29
		 */
		openDialog : function(x,y) {
			this.options.position = {x:x,y:y}
			this.isOpenDialog(true);
			
			this.isShadowMask(this.options.modal);
			this.createOtherComponent();
			this.render();
		},

		/**
		 * 关闭对话框
		 * 
		 * @author qianqian.yang 2012-10-29
		 */
		closeDialog : function() {
			this.isOpenDialog(false);
			this.isShadowMask(false);
		},

		/**
		 * 创建底部按钮集合层
		 * 
		 * @author qianqian.yang 2012-10-29
		 */
		createBottomButtons : function() {

			var dialog_btn = document.createElement("div");
			dialog_btn.className = "cs2c_dialog_button";
			dialog_btn.style.height = "28px";
			dialog_btn.style.display = "block";

			$(this.el).append(dialog_btn);

			for ( var i = 0; i < this.options.buttons.length; i++) {
				var btn = document.createElement("a");
				btn.className = "l-btn " + this.options.buttons[i].id;
				// btn.textContent = this.options.buttons[i].text;

				$(dialog_btn).append(btn);
				$(btn).append(
						'<span class="dialog-btn-left">'
								+ this.options.buttons[i].text + '</span>');
			}

		},

		/**
		 * 对话框按钮执行动作
		 * 
		 * @author qianqian.yang 2012-10-30
		 * @param e
		 */
		buttonAction : function(e) {
			var button = e.currentTarget.className.split(" ")[1];
			switch (button) {
			case "ok":
				this.okPressed();
				break;
			case "cancel":
				this.cancelPressed();
				break;
			default:
				this.otherPressed(button);
				break;
			}
		},

		/**
		 * 用户点击确定按钮执行动作
		 * 
		 * @author qianqian.yang 2012-11-1
		 */
		okPressed : function() {
			alert("ok");
		},

		/**
		 * 用户点击取消按钮执行动作
		 * 
		 * @author qianqian.yang 2012-11-1
		 */
		cancelPressed : function() {
			this.closeDialog();
		},

		/**
		 * 用户点击其他按钮执行动作，用户自定义可以重写
		 * 
		 * @author qianqian.yang 2012-11-1
		 */
		otherPressed : function(btnClass) {

		},

		/**
		 * 可自定义其他的控件
		 * 
		 * @author qianqian.yang 2012-12-21
		 */
		createOtherComponent : function() {

		}

	});

}());

// 模仿块级作用域
(function() {
	/**
	 * Cs2c_wizard_dialog是继承自CS2C_Dialog的子类，创建对象时，初始化都在父类里，在子类只是重写父类中的方法
	 */
	window.Cs2c_wizard_dialog = CS2C_Dialog
			.extend({
				// 使用的标志参数
				_pageNum : 1,
				options : {
					// 在上下步骤控制时，是否需要显示取消按钮
					cancelable : false,
					steps : []
				},
				/**
				 * 可自定义其他的控件，重写父类的方法
				 * 
				 * @author qianqian.yang 2012-12-21
				 */
				createOtherComponent : function() {
					// 页面选择定位初始化
					this._pageNum = 1;

					// 创建向导的导航提示条幅
					var exitClassName = $('#' + this.options.dialog_content_id)
							.children()[0].className;
					if (exitClassName != 'cs2c_wizard_dialog_banner') {
						$('#' + this.options.dialog_content_id).wrapInner(
								'<div class="cs2c_wizard_dialog_ctx"></div>');

						var bannerStepString = '';
						for ( var i = 0; i < this.options.steps.length; i++) {
							var redText = (i == 0 ? 'redText' : '');
							bannerStepString += '<span class="cs2c_wizard_dialog_banner_span '
									+ redText
									+ '">'
									+ this.options.steps[i]
									+ '</span>';
						}
						$('#' + this.options.dialog_content_id).prepend(
								'<div class="cs2c_wizard_dialog_banner">'
										+ bannerStepString + '</div>');
					}
					// 只显示第一屏的内容
					$('.cs2c_wizard_dialog_ctx').find('.dialog_wizard_1')
							.show().siblings().hide();
					$(this.el).find('.cs2c_wizard_dialog_banner').children()
							.eq(0).addClass('redText').siblings().removeClass(
									'redText');

					this.createUpDownButton();
				},

				createUpDownButton : function() {
					var dialog_btn = $(this.el).find('.cs2c_dialog_button');
					if (dialog_btn.children().length <= 2) {
						dialog_btn
								.prepend('<a class="l-btn down" href="#"><span class="dialog-btn-left">下一步</span></a>');
						dialog_btn
								.prepend('<a class="l-btn up" href="#"><span class="dialog-btn-left">上一步</span></a>');
					} else {
						dialog_btn.find('.down').show();
					}
					dialog_btn.find('.up').hide();
					dialog_btn.find('.ok').hide();
					if (this.options.cancelable) {
						dialog_btn.find('.cancel').show();
					} else {
						dialog_btn.find('.cancel').hide();
					}
				},

				/**
				 * 其他按钮的执行动作
				 * 
				 * @author qianqian.yang 2012-12-26
				 * @param btnClass
				 */
				otherPressed : function(btnClass) {

					switch (btnClass) {
					case 'up':
						this._pageNum--;
						break;
					case 'down':
						this._pageNum++;
						break;
					default:
						break;
					}

					var dialog_btn = $(this.el).find('.cs2c_dialog_button');

					// 1、控制步骤进度条的显示
					var banners = $(this.el).find('.cs2c_wizard_dialog_banner')
							.children();
					banners.eq(this._pageNum - 1).addClass('redText')
							.siblings().removeClass('redText');

					// 2、控制界面内容切换的显示
					$('#' + this.options.dialog_content_id).find(
							'.dialog_wizard_' + this._pageNum).show()
							.siblings().hide();

					// 控制按钮的显示：如果是最后一页，显示完成和取消按钮
					var wizardNum = $('#' + this.options.dialog_content_id)
							.find(".cs2c_wizard_dialog_ctx").children().length;
					if (this._pageNum === wizardNum) {
						dialog_btn.find('.up').hide();
						dialog_btn.find('.down').hide();
						dialog_btn.find('.ok').show();
						dialog_btn.find('.cancel').show();
					} else if (this._pageNum === 1) {
						dialog_btn.find('.up').hide();
						dialog_btn.find('.down').show();
					} else {
						dialog_btn.find('.up').show();
					}

				}

			});

}());
