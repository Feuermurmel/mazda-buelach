
var handlerURL = '../cgi-bin/request-handler.py'

function testGalleryImageUpload() {
	var testName = '#test-gallery-image-upload';
	var file = $(testName + ' [name=image]')[0].files[0];
	
	if (file === undefined) {
		alert('Please select a file.');
		return
	}
	
	// request data
	var data = {
		'action': 'upload-gallery-image',
		'area-name': $(testName + ' [name=area-name]').val(),
		'title': $(testName + ' [name=title]').val(),
		'comment': $(testName + ' [name=comment]').val(),
		'image': file
	}
	
	jsonrpc(handlerURL, data, function (res) {
		displayResponse(testName, res, '#ccf');
	}, function (res) {
		displayResponse(testName, res, '#fcc');
	});
	
	displayResponse(testName, 'Loading ...', '#ccc');
}

function testListGalleryImages() {
	var testName = '#test-list-gallery-images';
	
	// request data
	data = {
		'action': 'list-gallery-images',
		'area-name': $(testName + ' [name=area-name]').val()
	}
	
	jsonrpc(handlerURL, data, function (res) {
		displayResponse(testName, res, '#ccf');
	}, function (res) {
		displayResponse(testName, res, '#fcc');
	});
	
	displayResponse(testName, 'Loading ...', '#ccc');
}

function testGetImage() {
	var testName = '#test-get-image';
	var image = new Image();
	
	$(image).load(function (evt) {
		displayResponse(testName, image, '');
	});
	
	$(image).error(function (evt) {
		displayResponse(testName, 'Could not load image!', '#fcc');
	});
	
	// request data
	req = {
		'action': 'get-image',
		'image-id': $(testName + ' [name=image-id]').val()
	}
	
	image.src = handlerURL + '?' + $.toJSON(req);
	
	displayResponse(testName, 'Loading ...', '#ccc');
}

function displayResponse(testName, text, color) {
	var elem = $(testName + ' .response');
	
	elem.empty();
	elem.css('background-color', color);
	
	if (typeof text == 'string') {
	//	console.log(text);
		text.split('\n').map(function (i) {
			var textElem = $(document.createElement('p'));
			var str = i.replace(' ', '\xa0').replace('\t', '\xa0\xa0\xa0\xa0');
			
			textElem.text(str);
			elem.append(textElem);
		});
	} else if (text instanceof HTMLElement) {
		elem.append(text);
	} else {
		elem.append($.toJSON(text));
	}
	
	console.log(text);
}

function jsonrpc(url, data, success, failure) {
	var fd = new FormData();
	var xhr = new XMLHttpRequest();
	
	xhr.addEventListener('load', function (evt) {
		contentType = xhr.getResponseHeader('Content-Type').split(';')[0]
		
		if (contentType == 'text/plain') {
			var res = xhr.responseText;
		} else if (contentType == 'application/json') {
			var res = $.parseJSON(xhr.responseText);
		} else {
			failure('Response with invalid content type: ' + contentType);
			return;
		}
		
		if (xhr.status == 200)
			success(res);
		else
			failure(res);
	}, false);
	
	var req = { };
	var method = 'GET'; // FIXME: do not default to either GET or POST, as some requests may change server state
	
	for (i in data) {
		value = data[i];
		
		if (value instanceof File) {
			fd.append(i, value);
			method = 'POST';
		} else {
			req[i] = value;
		}
	}
	
	xhr.open(method, url + '?' + $.toJSON(req));
	xhr.send(fd);
}


