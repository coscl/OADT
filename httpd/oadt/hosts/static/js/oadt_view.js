/**
 * Description: 以下全局方法为表格的操作方法 2013-3-12
 * ***********************************************************************************************
 * 
 * @author qianqian.yang
 */
var opt_delete = function(data) {
	var result = confirm("你确定要删除该主机吗？");
	if (result) {
		oadtView.deleteHostFromTable(data);
	}
};
var opt_config = function(data) {
	oadtView.configHost(data);
};
var opt_deploy = function(data) {
	oadtView.deployHost(data);
};

/**
 * Description: 以下代码为界面的逻辑控制 2013-3-12
 * ***********************************************************************************************
 * 
 * @author qianqian.yang
 */
window.onload = function() {

	MM_preloadImages('/static/images/botton_hover.png',
			'/static/images/log_hover.png', '/static/images/preview_hover.png');

	/**
	 * @author qianqian.yang oadt工具的整体界面展示View层
	 */
	var OADT_View = Backbone.View
			.extend({
				el : $('body'),
				/**
				 * 定义的私有成员控件
				 */
				_hostTable : null,
				_hostEditRolesDialog : null,
				_dhcpDialog : null,
				_deployTimeSpan : null,
				_deployHost:null,
				/**
				 * 初始化时渲染整个界面
				 */
				initialize : function() {
					this.render();
					this.reset();
				},

				/**
				 * 事件列表
				 */
				events : {

					// OS系统选择切换执行事件
					"change #os_type" : "os_right",

					// 打开界面的对话框
					"click #selectFile" : "openSelectFileDialog",
					"click #dhcpConfig" : "openDhcpDialog",
					"click #openBatchImportDialog" : "openBatchImportDialog",
					"click .icon-edit-role":"openEditRoleDialog",
					"click .opt-log":"openLogDialog",

					// 界面按钮的点击提交动作
					"click #cobblerconfig" : "cobblerconfig",
					"click #add_host" : "addHost",
					"click #batch_import" : "batchImportHosts"
					
					

				},

				render : function() {

					this.createHostTable();

					this.createMask();

					this.createDhcpDialog();

					this.createEditRolesDialog();
					this.createValidateBox();

					this.createConfigHostDialog();
					this.createOSTypeCombo();
					this.createCobblerSelectIsoDialog();

//					this.createBatchImportDialog();
					this.createBatchEditDialog();
					
					this.createAlertDialog();
				},
				
				
				/**
				 * 1.0 Description: 用户选择好OS之后，页面变化状态
				 * 
				 * @author qianqian.yang 2013-3-15
				 */
				os_right : function(e) {
					
					var select_os = e.currentTarget;
					var that = this;
					if (select_os.selectedIndex === 0) {
						
						var result = confirm("你确定要更换操作系统类型吗（如果更换操作系统类型，当前操作系统配置将会被重置）？");
						if (!result) {
							select_os.selectedIndex = 1;
							return;
						}
						$('#os_right').hide();
						$('#dhcp_right').hide();
						this.block2mask.isMask(true);
						this.block3mask.isMask(true);
					} else {
						$.post('ostype', {
							OS_TYPE : 'ns6.0'
						}, function(data) {
							$('#os_right').show();
							that.block2mask.isMask(false);
						}).error(function(){
							oadtView.alert('服务器错误，请查看日志。');
						});
					}
				},

				openLogDialog:function(e){
					var log = e.currentTarget;
					window.open('host/' + log.attributes[0].value + '/log', "查看主机日志");
				},
				
				openEditRoleDialog:function(e){
					var role = e.currentTarget;
					var data = eval('data='+role.attributes[0].value);
					this.createHostRolesCheckBox(data,e.clientX,e.clientY);
					this.hostData = data;
				},

				/**
				 * Description: 打开选择文件对话框
				 * 
				 * @author qianqian.yang 2013-3-15
				 */
				openSelectFileDialog : function() {
					this._selectIsoDialog.openDialog();
					this.isoInnerMask.isMask(true);
					$('#ISO').empty();
					$('#CD').empty();
					var that = this;
					$.get('iso', function(files) {
						if (files != '') {
							_.each(files, function(file) {
								$('#ISO').append(
										'<p><input type="radio" name="path"/>'
												+ file + '</p>');
							});
						}
						that.isoInnerMask.isMask(false);
					}).error(function(){
						$('#ISO').append('<p>无iso文件。</p>');
						that.isoInnerMask.isMask(false);
					});
					$.get('cdpoint',function(files) {
						if (files != '') {
							$('#CD').append('<p><input type="radio" name="path" value="'+files.slice(0,files.indexOf(' '))+'"/>'+ 
									files.slice(files.indexOf(' ') + 1)+ '</p>');
						}else{
							$('#CD').append('<p>无CD。</p>');
						}
						that.isoInnerMask.isMask(false);
					}).error(function(){
						$('#CD').append('<p>无CD。</p>');
						that.isoInnerMask.isMask(false);
					});
					
				},

				/**
				 * 打开DHCP配置的对话框
				 * 
				 * @author qianqian.yang 2013-3-11
				 */
				openDhcpDialog : function() {
					this._dhcpDialog.openDialog();
				},

				/**
				 * Description: 打开批量导入的对话框 2013-3-20
				 */
				_openBatchImportDialog : function() {
					$('#batch_import_dialog #hosttemplate').empty();
					$.get('hosttemplate', function(files) {
						if (files === '' || files.length === 0) {
							$('#batch_import_dialog #hosttemplate').append(
									'<p>找不到可添加的节点。</p>');
						} else {
							_.each(files, function(file) {
								$('#batch_import_dialog #hosttemplate').append(
										'<p><input type="radio" name=""/>'
												+ file + '</p>');
							});
						}
					});
					this._batchImportDialog.openDialog();
				},
				
				openBatchImportDialog:function(){
					$.get('hosttemplate', function(files) {
						$('#batch_import_edit_dialog').find('textarea').text(files);
					}).error(function(){
						oadtView.alert('服务器错误，请查看日志。');
					});
					this._batchEditDialog.openDialog();
				},

				/**
				 * Description: 批量导入主机节点
				 * 
				 * @author qianqian.yang 2013-3-15
				 */
				_batchImportHosts : function() {
					var filepath = '';
					var inputs = $('#batch_import_dialog input');
					_.each(inputs, function(input) {
						if (input.checked) {
							filepath = input.nextSibling.data;
						}
					});
					if(filepath===''){
						this.alert("请先【选择】需要导入的模板文件。");
						return;
					}
					$.post('batch_add', {
						batch_file_dir : filepath
					}, function(data) {
						oadtView.alert('导入成功。');
					}).error(function(){
						oadtView.alert('服务器错误，请查看日志。');
					});
				},
				
				batchImportHosts:function(){
					$.post('batch_add', function(data) {
						oadtView.alert('导入成功。');
					}).error(function(data){
						oadtView.alert(data.responseText);
					});
				},

				/**
				 * Description: 批量导入主机节点
				 * 
				 * @author qianqian.yang 2013-3-15
				 */
				cobblerconfig : function() {
					
					 
					var options = this.getDhcpFromDialog();
					var that = this;
					if (options != null) {
						this.submitTipmask.isMask(true);
						
//						$.ajax({
//							type : "POST",
//							url : 'dhcp',
//							processData : true,
//							data : options,
//							timeout:(1000*60*15),
//							success : function(data) {
//								that.submitTipmask.isMask(false);
//								$('#dhcp_right').show();
//								that.block3mask.isMask(false);
//								this.alert("提交成功。");
//							},
//							error:function(data){
//								that.submitTipmask.isMask(false);
//								this.alert(data.responseText);
//							}
//						});
						
						$.post('dhcp', options, function(data) {
						}).error(function(data) {
							if (typeof data === 'string') {
								oadtView.alert(data);
							} else {
								oadtView.alert(data.responseText);
							}
						});
						
						getShStatusTimer = setInterval(function(){
							$.get('deployresult',function(data){		
								if (data.indexOf('1')>=0) {
									$('#dhcp_right').show();
									that.block3mask.isMask(false);
									that.submitTipmask.isMask(false);
									that.alert("提交成功。");
									clearInterval(getShStatusTimer);
								}else if(data.indexOf('2')>=0){
									that.submitTipmask.isMask(false);
									that.alert("提交失败，请查看日志。");
									clearInterval(getShStatusTimer);
								}
							}).error(function(data) {
								oadtView.alert(data.responseText);
							});
						},20000);
						setTimeout(function(){
							clearInterval(getShStatusTimer);
							that.submitTipmask.isMask(false);
						},(1000*60*15));
						
						
					}
				},

				/**
				 * 添加主机表单的方法
				 * 
				 * @author qianqian.yang 2013-3-11
				 */
				addHost : function() {
					var dateStr = this.formatDateToString(new Date());

					// 验证校验框中的数据格式的正确性
					if (this.validatebox0.inputValidate()
							&& this.validatebox1.inputValidate()
							&& this.validatebox2.inputValidate()) {
						if(!this.validateIpRange($('#ip_start').val().trim(),$('#ip_stop').val().trim(),$('#add_host_ip').val().trim())){
							oadtView.alert("添加的主机IP地址不在DHCP范围之内。");
							return;
						}
						// 提交添加的主机
						$.post('host/add', {
							'status' : 'added',
							'hostname' : $('#add_hostname').val(),
							'static_ip' : $('#add_host_ip').val(),
							'hwaddr' : $('#add_host_mac').val(),
							'timestamp' : dateStr
						},
								function(data) {
									if (data) {
										oadtView._hostTable.tableView
												.refreshDataGrid();
										oadtView.alert("添加主机成功。");
										$('#add_hostname').val('主机名称');
										$('#add_host_ip').val('主机IP');
										$('#add_host_mac').val('MAC地址');
									}
								}).error(function(data){
									oadtView.alert(data.responseText);
								});
					}

				},

				/**
				 * *******************************************************************************
				 * 以下为：界面创建的控件和预加载的数据获取方法
				 * *******************************************************************************
				 */
				

				/**
				 * Description:为OS选择获取默认数据 2013-3-20
				 */
				createOSTypeCombo : function() {
					var that = this;
					$.get('ostype', function(data) {
						if (data.length===1||data[1] === '') {
							$('#os_type')[0].selectedIndex = 0;
						} else {
							$('#os_type')[0].selectedIndex = 1;
							$('#os_right').show();
							that.block2mask.isMask(false);
						}
					});
				},

				/**
				 * Description:创建添加主机节点的，批量导入主机模板的对话框 2013-3-20
				 */
				createBatchImportDialog : function() {
					
					this._batchImportDialog = new CS2C_Dialog({
						dialog_content_id : "batch_import_dialog",
						title : "批量节点选择",
						buttons : [ {
							id : 'ok',
							text : '确定'
						}, {
							id : 'cancel',
							text : '取消'
						} ],
						closable : true,
						modal : true
					}).render();

					this._batchImportDialog.okPressed = function() {
						this.closeDialog();
					};
				},

				/**
				 * Description:创建cobbler的配置的，选择iso或cd路径的对话框 2013-3-20
				 */
				createCobblerSelectIsoDialog : function() {
					
					this._selectIsoDialog = new CS2C_Dialog({
						dialog_content_id : "select_iso_dialog",
						title : "安装系统镜像",
						buttons : [ {
							id : 'ok',
							text : '确定'
						}, {
							id : 'cancel',
							text : '取消'
						} ],
						width : 310,
						closable : true,
						modal : true
					}).render();
					this._selectIsoDialog.okPressed = function() {
						this.closeDialog();
					};
				},

				/**
				 * Description: 创建下一步中功能模板
				 * 
				 * @author qianqian.yang 2013-3-15
				 */
				createMask : function() {
					this.block2mask = new CS2C_Shadow({
						isAllMask : false,
						parentEl_id : 'block2',
						isLoading : false
					}).render();

					this.block3mask = new CS2C_Shadow({
						isAllMask : false,
						parentEl_id : 'block3',
						isLoading : false
					}).render();

					this.block2mask.isMask(true);
					this.block3mask.isMask(true);
					
					this.submitTipmask = new CS2C_Shadow({
						isAllMask : true,
						position_id : 'logo',
						isLoading : true
					}).render();
					$(this.submitTipmask.$el[0].nextSibling).html('配置过程需要拷贝OS镜像内容，大概需要十分钟,后台正在处理，请稍后...');
					
					this.isoInnerMask = new CS2C_Shadow({
						isAllMask : false,
						parentEl_id : 'select_iso_dialog',
						isLoading : true
					}).render();
					$(this.isoInnerMask.$el[0].nextSibling).html('正在加载，请稍后...');
				},

				/**
				 * 创建界面上使用到的校验输入项
				 * 
				 * @author qianqian.yang 2013-3-11
				 */
				createValidateBox : function() {
					this.validatebox0 = new validateBoxView(
							{
								'id' : 'add_hostname',
								'tipmsg' : '请勿输入除英文字母（不区分大小写）、数字和下划线之外的字符，且必须以英文字母（不区分大小写）开头，字符个数不小于2且不大于20。',
								'reg_exp' : /^[a-zA-Z][a-zA-Z0-9\_]{1,19}$/,
								'reqmsg' : '必填项'
							});
					this.validatebox1 = new validateBoxView(
							{
								'id' : 'add_host_ip',
								'tipmsg' : '请输入有效的IP地址。',
								'reg_exp' : /^([1-9]|[1-9]\d|1\d{2}|2[0-1]\d|22[0-3])(\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])){3}$/,
								'reqmsg' : '必填项'
							});
					this.validatebox2 = new validateBoxView(
							{
								'id' : 'add_host_mac',
								'tipmsg' : '请输入有效的MAC地址，格式如：00:24:21:19:BD:E4等',
								'reg_exp' : /[A-F\d\a-f]{2}:[A-F\d\a-f]{2}:[A-F\d\a-f]{2}:[A-F\d\a-f]{2}:[A-F\d\a-f]{2}:[A-F\d\a-f]{2}$/,
								'reqmsg' : '必填项'
							});
					// DHCP对话框
					this.vbox_subnet = new validateBoxView(
							{
								'id' : 'subnet',
								'tipmsg' : '请输入有效的IP地址。',
								'reg_exp' : /^([1-9]|[1-9]\d|1\d{2}|2[0-1]\d|22[0-3])(\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])){3}$/,
								'reqmsg' : '必填项'
							});
					this.vbox_subnet_mask = new validateBoxView({
						'id' : 'subnet_netmask',
						'tipmsg' : '请输入有效的子网掩码。',
						'reg_exp' : /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
						'reqmsg' : '必填项'
					});
					this.vbox_subnet_mask.inputValidate = function() {
						return this.validateNetMask();
					};
					this.vbox_startIP = new validateBoxView(
							{
								'id' : 'ip_start',
								'tipmsg' : '请输入有效的IP地址。',
								'reg_exp' : /^([1-9]|[1-9]\d|1\d{2}|2[0-1]\d|22[0-3])(\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])){3}$/,
								'reqmsg' : '必填项'
							});
					this.vbox_stopIP = new validateBoxView(
							{
								'id' : 'ip_stop',
								'tipmsg' : '请输入有效的IP地址。',
								'reg_exp' : /^([1-9]|[1-9]\d|1\d{2}|2[0-1]\d|22[0-3])(\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])){3}$/,
								'reqmsg' : '必填项'
							});
					this.vbox_gateway = new validateBoxView(
							{
								'id' : 'gateway',
								'tipmsg' : '请输入有效的IP地址。',
								'reg_exp' : /^([1-9]|[1-9]\d|1\d{2}|2[0-1]\d|22[0-3])(\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])){3}$/,
								'reqmsg' : '必填项'
							});
					this.vbox_netmask = new validateBoxView({
						'id' : 'netmask',
						'tipmsg' : '请输入有效的子网掩码。',
						'reg_exp' : /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
						'reqmsg' : '必填项'
					});
					this.vbox_netmask.inputValidate = function() {
						return this.validateNetMask();
					};
					this.vbox_dns = new validateBoxView(
							{
								'id' : 'dns',
								'tipmsg' : '请输入有效的IP地址。',
								'reg_exp' : /^([1-9]|[1-9]\d|1\d{2}|2[0-1]\d|22[0-3])(\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])){3}$/,
								'reqmsg' : '必填项'
							});
				},

				/**
				 * 创建主机列表的表格控件
				 * 
				 * @author qianqian.yang 2013-3-11
				 */
				createHostTable : function() {
					this._hostTable = new TableManageView({
						parentEl : "#cs2c_datagrid",
						url : 'hosts',
						code : true,
						columns : [
								{
									sortable : true,
									width : 80,
									title : 'Hostname',
									content : 'hostname',
									formatter : function(value, rowData,
											rowIndex) {
										return value;
									}
								},
								{
									title : 'IP',
									width : 100,
									content : 'static_ip'
								},
								{
									width : 60,
									sortable : true,
									title : 'Status',
									content : 'status'
								},
								{
									width : 180,
									sortable : true,
									title : 'Role',
									content : 'ccrole_set',
									formatter : function(value, rowData,
											rowIndex) {

										var roles = eval(value);
										var roleStr = [];
										if (roles.length === 0) {
											return 'NC(Computer)';
										} else {
											_.each(roles, function(role) {
												roleStr.push(role.pk);
											});
											return 'CC(' + roleStr.join(',')
													+ ')';
										}
									}
								},
								{
									title : 'Operation',
									width : 120,
									operations : function(value, rowData,
											rowIndex) {
										var roleJson = eval(rowData
												.get("ccrole_set"));
										var optStr = {
											pk : rowData.get("hostname"),
											static_ip : rowData
													.get("static_ip"),
											status : rowData.get("status"),
											roles : roleJson.length === 0 ? ''
													: roleJson[0].pk,
											timestamp : rowData
													.get("timestamp")==null?'':rowData
															.get("timestamp").timestamp
										};
										var operate = [];
										operate.push(createOption1(
												json2str(optStr), "角色",
												"icon-edit-role"));
										operate.push(createOption("opt_config",
												json2str(optStr), "配置",
												"icon-config"));
										operate.push(createOption("opt_deploy",
												json2str(optStr), "部署",
												"icon-deploy"));
										operate.push(createOption("opt_delete",
												json2str(optStr), "删除",
												"icon-delete"));
										return operate.join(" ");
										
									}
								},
								{
									width : 30,
									sortable : true,
									title : 'Log',
									content : '',
									operations : function(value, rowData,
											rowIndex) {
									    return '<a href="#" class="opt-log" value=\"'+rowData.get("hostname")+'\"><img src="/static/images/log.png" width="16" height="16" border="0"/></a>';
									}
								} ],
						pager : {
							pageNo : 1,
							pageSize : 10,
							pageList : [ 10, 20, 30 ]
						}

					});
				},

				/**
				 * 创建DHCP配置对话框
				 * 
				 * @author qianqian.yang 2013-3-11
				 */
				createDhcpDialog : function() {
					this._dhcpDialog = new CS2C_Dialog({
						dialog_content_id : "dhcp_dialog",
						title : "DHCP配置",
						buttons : [ {
							id : 'ok',
							text : '确定'
						}, {
							id : 'cancel',
							text : '取消'
						} ],
						width : 327,
						height : 200,
						closable : true,
						modal : true
					}).render();

					var that = this;
					this._dhcpDialog.okPressed = function() {
						if (that.getDhcpFromDialog(true) != null) {
							oadtView._dhcpDialog.closeDialog();
						}
					};
					$('#dhcp_dialog').show();
				},
				
				/**
				 * 创建提示对话框
				 * 
				 * @author qianqian.yang 2013-3-25
				 */
				createAlertDialog:function(){
					this._alertDialog = new CS2C_Dialog({
						dialog_content_id : "alert_dialog",
						title : "提示",
						buttons : [ {
							id : 'ok',
							text : '确定'
						}],
						width:300,
						closable : false,
						modal : true
					}).render();
					this._alertDialog.okPressed = function() {
							this.closeDialog();
					};
				},

				/**
				 * Description: 获取DHCP用户配置的参数 2013-3-20
				 * 
				 * @returns
				 */
				getDhcpFromDialog : function(okbutton) {
					
					var filepath = '';
					var inputs = $('#select_iso_dialog input');
					_.each(inputs, function(input) {
						if (input.checked) {
							filepath = (input.value==='on'?input.nextSibling.data:input.value);
						}
					});
					
					if(filepath==='' && !okbutton){
						this.alert("请先【选择】需要安装的镜像文件。");
						return;
					}

					if (this.vbox_subnet.inputValidate()
							&& this.vbox_subnet_mask.inputValidate()
							&& this.vbox_startIP.inputValidate()
							&& this.vbox_stopIP.inputValidate()
							&& this.vbox_gateway.inputValidate()
							&& this.vbox_netmask.inputValidate()
							&& this.vbox_dns.inputValidate()) {
						// 界面上显示用户输入的开始和结束IP 地址
						$('.cobbler_put1').val(
								$('#ip_start').val() + " - "
										+ $('#ip_stop').val());
						// 将DHCP对话框中的数据都封装到一起
						var options = {
							subnet_ip : $('#subnet').val(),
							subnet_netmask : $('#subnet_netmask').val(),
							range_ip_start : $('#ip_start').val(),
							range_ip_stop : $('#ip_stop').val(),
							gateway_ip : $('#gateway').val(),
							netmask_ip : $('#netmask').val(),
							dns_ip : $('#dns').val(),
							iso_addr : filepath
						};
						return options;
					} else {
						return null;
					}

				},

				/**
				 * 创建编辑主机的角色列表对话框
				 * 
				 * @author qianqian.yang 2013-3-11
				 */
				createEditRolesDialog : function() {
					this._hostEditRolesDialog = new CS2C_Dialog({
						dialog_content_id : "role_dialog",
						title : "编辑角色",
						buttons : [ {
							id : 'ok',
							text : '确定'
						}, {
							id : 'cancel',
							text : '取消'
						} ],
						width : 127,
						height : 100,
						closable : true,
						modal : false
					}).render();

					this._hostEditRolesDialog.okPressed = function() {
						var inputs = $('#role_dialog').find('input');
						var options = [];

						_.each(inputs, function(input) {
							if (input.checked) {
								options.push(input.nextSibling.data);
							}
						});
						$.ajax({
									type : "POST",
									url : 'host/'
											+ $('#edit_role_hostname').val()
											+ '/roles',
									processData : true,
									data : {
										ccrole : options
									// 1.3.2版本中数组匹配相同的key值，在这里修改最新的jquery中的代码，将[]去掉
									},
									success : function(msg) {
										oadtView._hostEditRolesDialog
												.closeDialog();
										oadtView.alert("修改主机角色成功。");
										oadtView._hostTable.tableView
												.refreshDataGrid();
									}
								});
					};
				},

				/**
				 * *******************************************************************************
				 * 以下为主机列表的操作方法事件集合
				 * *******************************************************************************
				 */

				/**
				 * 创建主机角色列表的内容
				 * 
				 * @author qianqian.yang 2013-3-11
				 */
				createHostRolesCheckBox : function(data,x,y) {
					$('#role_dialog').empty();
					// 该主机现有的roles
					var thisData = data;

					// 取出全部的roles
					$.getJSON('host/' + thisData.pk + '/roles',
									function(roles) {
										if (roles.length === 0) {
											$('#role_dialog').append(
													'<p>无可编辑的角色。</p>');
										} else {
											_.each(roles,function(role) {
												if (thisData.pk === role.fields.host) {
													$('#role_dialog').append(
																	'<p><input type="checkbox" checked="checked"/>'
																			+ role.pk
																			+ '</p>');
												} else {
													$('#role_dialog').append(
																	'<p><input type="checkbox"/>'
																			+ role.pk
																			+ '</p>');
												}
										});
									}

									}).error(function(){
										oadtView.alert('服务器错误，请查看日志。');
									});
					$('#role_dialog').show();
					$('#role_dialog').append(
							'<input id="edit_role_hostname" type="hidden" value="'
									+ thisData.pk + '"/>');

					//角色对话框的弹出位置
					if((document.documentElement.clientHeight-y)<176){
						y = document.documentElement.clientHeight-180;
					}else{
						y=y-30;
					}
					this._hostEditRolesDialog.openDialog(x-147,y);
					
				},

				/**
				 * Description: 主机列表中，配置主机的对话框 2013-3-20
				 */
				createConfigHostDialog : function() {
					this._configHostDialog = new CS2C_Dialog({
						dialog_content_id : "config_host_dialog",
						title : "配置",
						buttons : [ {
							id : 'ok',
							text : '确定'
						}, {
							id : 'cancel',
							text : '取消'
						} ],
						width : 500,
						height : 290,
						closable : true,
						modal : true
					}).render();

					var that = this;
					this._configHostDialog.okPressed = function() {
						var hostname = $('#config_host_dialog').find('input')
								.val();
						$.post('host/' + hostname + '/config',
								{
									configs : $('#config_host_dialog').find(
											'textarea')[0].value
								}, function(data) {
									that._configHostDialog.closeDialog();
									oadtView.alert('配置成功。');
								}).error(function(){
									oadtView.alert('服务器错误，请查看日志。');
								});
					};
				},

				/**
				 * 配置主机节点
				 * 
				 * @author qianqian.yang 2013-3-18
				 */
				configHost : function(data) {
					if (data.status === 'installed' || data.status === 'deployed') {
						$('#config_host_dialog').find('input').val(data.pk);
						$.get('host/' + data.pk + '/config', function(data) {
							$('#config_host_dialog').find('textarea')
									.text(data);
						}).error(function(){
							oadtView.alert('服务器错误，请查看日志。');
						});
						this._configHostDialog.openDialog();
					} else {
						this.alert('此状态下不可配置该主机，请刷新主机列表。');
					}
				},
				
				createBatchEditDialog:function(){
					this._batchEditDialog = new CS2C_Dialog({
						dialog_content_id : "batch_import_edit_dialog",
						title : "编辑",
						buttons : [ {
							id : 'ok',
							text : '确定'
						}, {
							id : 'cancel',
							text : '取消'
						} ],
						width : 500,
						height : 290,
						closable : true,
						modal : true
					}).render();
					
					var that = this;
					this._batchEditDialog.okPressed = function() {
						$.post('hosttemplate',{
							template:$('#batch_import_edit_dialog').find('textarea')[0].value
							},
							function(data) {
							that._batchEditDialog.closeDialog();
							oadtView.alert('编辑文件成功。');
						}).error(function(){
							oadtView.alert('服务器错误，请查看日志。');
						});
					};
					
				},

				/**
				 * 配置主机节点
				 * 
				 * @author qianqian.yang 2013-3-18
				 */
				deployHost : function(data) {
					
					var that = this;

					var timeSpan = null;
					if (this._deployTimeSpan != null&&this._deployHost==data.pk) {
						timeSpan = Date.now() - this._deployTimeSpan;
						this._deployTimeSpan = Date.now();
					} else {
						this._deployTimeSpan = Date.now();
						this._deployHost = data.pk;
					}
					if (timeSpan != null && timeSpan < 30000) {
						this.alert('由于上次部署尚未完成，请不要在30秒内进行重复操作。');
						return;
					}
					if (data.status === 'installed'||data.status === 'deployed') {
						$.post('host/' + data.pk + '/deploy', function(data) {
							oadtView.alert('部署成功。');
						}).error(function(data) {
							if (typeof data === 'string') {
								oadtView.alert(data);
							} else {
								oadtView.alert(data.responseText);
							}
							that._deployTimeSpan = null;
							that._deployHost = null;
						});

					} else {
						this.alert('此状态下不可部署该主机，请刷新主机列表。');
					}
				},

				/**
				 * 将主机从主机列表中删除
				 * 
				 * @author qianqian.yang 2013-3-11
				 */
				deleteHostFromTable : function(data) {
					var that = this;
					$.post('host/' + data.pk + '/delete', function(data) {
						if (data) {
							that._hostTable.tableView.refreshDataGrid();
							oadtView.alert("删除成功。");
						}
					}).error(function(data){
						oadtView.alert("删除失败，无法链接或服务器错误，请查看日志。");
					});
				},

				/**
				 * 查看该主机的日志
				 * 
				 * @author qianqian.yang 2013-3-18
				 */
				hostLog : function(data) {
					window.open('host/' + data.pk + '/log', "查看主机日志");
				},

				reset : function() {
					// $('select')[0].options.selectedIndex = 0;
					$.get('dhcp', function(data) {
						// $('#selectfiledialog')[0].value=data.iso_addr;
						$('.cobbler_put1').val(
								data.range_ip_start + ' - '
										+ data.range_ip_stop);
						$('#add_hostname').val('主机名称');
						$('#add_host_ip').val('主机IP');
						$('#add_host_mac').val('MAC地址');

						$('#subnet').val(data.subnet_ip);
						$('#subnet_netmask').val(data.subnet_netmask);
						$('#ip_start').val(data.range_ip_start);
						$('#ip_stop').val(data.range_ip_stop);
						$('#gateway').val(data.gateway_ip);
						$('#netmask').val(data.netmask_ip);
						$('#dns').val(data.dns_ip);
					}).error(function(data){
					});
					
					var that = this;
					$.get('deployresult',function(data){		
						if (data.indexOf('1')>=0) {
							$('#dhcp_right').show();
							that.block3mask.isMask(false);
						}
					}).error(function(data) {
					});
					
					//对不同尺寸的屏幕进行响应
					if(document.documentElement.clientWidth>1024){
						$('#table-position').offset({left:350});
						$('.cobbler').css({margin:'0 0 0 41px'});
					}else{
						$('#table-position').offset({left:200});
						$('.cobbler').css({margin:'0 0 0 87px'});
					}
					
					$(window).resize(function() {
						if(document.documentElement.clientWidth>1024){
							$('#table-position').offset({left:350});
							$('.cobbler').css({margin:'0 0 0 41px'});
						}else{
							$('#table-position').offset({left:200});
							$('.cobbler').css({margin:'0 0 0 87px'});
						}
						that.block2mask.calMask();
						that.block3mask.calMask();
					});

				},
				
				/**
				 * 提示信息弹出框
				 * 
				 * @author qianqian.yang 2013-3-25
				 */
				alert:function(msg){
					this._alertDialog.openDialog();
					$('#alert_dialog').html(msg);
				},
				
				
				/**
				 * *******************************************************************************
				 * 以下为工具方法集合
				 * *******************************************************************************
				 */
				validateIpRange:function(startIP,endIP,hostIP){
					if(this.ip2number(startIP)<=this.ip2number(hostIP)&&this.ip2number(hostIP)<=this.ip2number(endIP)){
						return true;
					}
					return false;
				},
				
				
				ip2number:function(ip){
					var tokens = ip.split('.');
			        var numval = 0
			        for (num in tokens) {
			            numval = (numval << 8) + parseInt(tokens[num]);
			        }
			        return numval
				},
				
				
				readUploadFile : function(fileBrowser) {
					if (navigator.userAgent.indexOf("MSIE") != -1) {
						return this.readFileIE(fileBrowser);
					} else if (navigator.userAgent.indexOf("Firefox") != -1
							|| navigator.userAgent.indexOf("Mozilla") != -1) {
						return this.readFileFirefox(fileBrowser);
					} else {
						alert("Not IE or Firefox (userAgent="
								+ navigator.userAgent + ")");
					}
				},

				readFileFirefox : function(fileBrowser) {
					try {
						netscape.security.PrivilegeManager
								.enablePrivilege("UniversalXPConnect");
					} catch (e) {
						alert('由于浏览器安全问题 请按照以下设置 [1] 地址栏输入 "about:config" ; [2] 右键 新建 -> 布尔值 ; [3] 输入 "signed.applets.codebase_principal_support" (忽略引号).');
						return;
					}
					return fileBrowser.value;
				},

				readFileIE : function(fileBrowser) {
					return fileBrowser.value;
				},

				/**
				 * 将单个数据转化为双格式
				 * 
				 * @author qianqian.yang 2013-3-11
				 */
				parseDoubleLengthNumber : function(number) {
					if (parseInt(number, 10).toString().length == 1) {
						return "0" + number;
					} else {
						return number;
					}
				},
				/**
				 * Description:将一个时间类型的对象转换成一定格式的字符串
				 * 
				 * @author qianqian.yang
				 * 
				 * @param dateTime
				 * @returns
				 */
				formatDateToString : function(dateTime) {
					var dateTimeString = dateTime.getFullYear() + '-';
					dateTimeString += this.parseDoubleLengthNumber(dateTime
							.getMonth() + 1)
							+ '-';
					dateTimeString += this.parseDoubleLengthNumber(dateTime
							.getDate())
							+ ' ';
					dateTimeString += dateTime.getHours() + ':';
					dateTimeString += dateTime.getMinutes() + ':';
					dateTimeString += dateTime.getSeconds();

					return dateTimeString;
				}

			});

	oadtView = new OADT_View();
	

};

/**
 * 界面美工js
 */
function MM_preloadImages() { // v3.0
	var d = document;
	if (d.images) {
		if (!d.MM_p) {
			d.MM_p = new Array();
		}
		var i, j = d.MM_p.length, a = MM_preloadImages.arguments;
		for (i = 0; i < a.length; i++) {
			if (a[i].indexOf("#") != 0) {
				d.MM_p[j] = new Image;
				d.MM_p[j++].src = a[i];
			}
		}
	}
}

function MM_findObj(n, d) { // v4.01
	var p, i, x;
	if (!d) {
		d = document;
	}
	if ((p = n.indexOf("?")) > 0 && parent.frames.length) {
		d = parent.frames[n.substring(p + 1)].document;
		n = n.substring(0, p);
	}
	if (!(x = d[n]) && d.all) {
		x = d.all[n];
	}
	for (i = 0; !x && i < d.forms.length; i++) {
		x = d.forms[i][n];
	}
	for (i = 0; !x && d.layers && i < d.layers.length; i++) {
		x = MM_findObj(n, d.layers[i].document);
	}
	if (!x && d.getElementById) {
		x = d.getElementById(n);
	}
	return x;
}
function MM_swapImgRestore() { // v3.0
	var i, x, a = document.MM_sr;
	for (i = 0; a && i < a.length && (x = a[i]) && x.oSrc; i++) {
		x.src = x.oSrc;
	}
}
function MM_swapImage() { // v3.0
	var i, j = 0, x, a = MM_swapImage.arguments;
	document.MM_sr = new Array;
	for (i = 0; i < (a.length - 2); i += 3) {
		if ((x = MM_findObj(a[i])) != null) {
			document.MM_sr[j++] = x;
			if (!x.oSrc) {
				x.oSrc = x.src;
			}
			x.src = a[i + 2];
		}
	}
}
