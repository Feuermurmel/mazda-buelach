dom = (function () {
	var element = function (tag, attrs, contents) {
		var elem = document.createElement(tag);
		
		$(elem).attr(attrs || { }).append(contents || []);
		
		return elem;
	};
	
	var link = function (contents, attrs, action) {
		var elem = element("a", attrs, contents);
		
		$(elem).click(action);
		
		return elem;
	};
	
	var image = function (src, attrs) {
		return element("img", $.extend({ "src": src }, attrs || { }));
	};
	
	var text = function (text) {
		return document.createTextNode(text);
	};
	
	return {
		element: element,
		link: link,
		image: image,
		text: text
	};
}) ();
