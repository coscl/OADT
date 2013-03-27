// 工具方法，将json对象转化为字符串，在行内添加option时用到
function json2str(o) {
	var arr = [];
	var fmt = function(s) {
		if (typeof s == 'object' && s != null) {
			return json2str(s);
		}
		return /^(string|number)$/.test(typeof s) ? "'" + s + "'" : s;
	};
	for ( var i in o)
		arr.push("'" + i + "':" + fmt(o[i]));
	return '{' + arr.join(',') + '}';
}



// 行内操作，添加操作按钮调用的方法
function createOption(funcName, optStr, optName, className) {
	var option = '<span class="' + className + '" onclick=\"'
			+ funcName + '(' + optStr + ');\">&nbsp;'+optName+'</span>'
			;
	return option;
}

function createOption1(optStr, optName, className) {
	var option = '<span class="' + className + ' "value=\"'+ optStr + '\">&nbsp;'+optName+'</span>'
			;
	return option;
}
