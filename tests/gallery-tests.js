
$(function () {
	$('#test-gallery-image-upload [type=button]').click(testGalleryImageUpload);
	$('#test-list-gallery-images [type=button]').click(testListGalleryImages);
	$('#test-get-image [type=button]').click(testGetImage);
});

var handlerURL = '../cgi-bin/request-handler.py'

function testGalleryImageUpload() {
	var testName = '#test-gallery-image-upload';
	var file = $(testName + ' [name=image]')[0].files[0];
	
	if (file === undefined) {
		alert('Please select a file.');
		return
	}
	
	var fd = new FormData();
	var xhr = new XMLHttpRequest();
	
	// see http://dev.w3.org/2006/webapi/XMLHttpRequest-2/#the-append-method
	fd.append("image", file);
	
	xhr.addEventListener('load', function (evt) {
		displayResponse(testName, evt.target.responseText, '#ccf');
	}, false);
	
	xhr.addEventListener('error', function (evt) {
		displayResponse(testName, evt.target.responseText, '#fcc');
	}, false);
	
	// request data
	req = {
		'action': 'upload-gallery-image',
		'area-name': $(testName + ' [name=area-name]').val(),
		'title': $(testName + ' [name=title]').val(),
		'comment': $(testName + ' [name=comment]').val(),
	}
	
	xhr.open('POST', handlerURL + '?' + $.toJSON(req));
	xhr.send(fd);
	
	displayResponse(testName, 'Loading ...', '#ccc');
}

function testListGalleryImages() {
	var testName = '#test-list-gallery-images';
	
	var fd = new FormData();
	var xhr = new XMLHttpRequest();
	
	xhr.addEventListener('load', function (evt) {
		displayResponse(testName, evt.target.responseText, '#ccf');
	}, false);
	
	xhr.addEventListener('error', function (evt) {
		displayResponse(testName, evt.target.responseText, '#fcc');
	}, false);
	
	// request data
	req = {
		'action': 'list-gallery-images',
		'area-name': $(testName + ' [name=area-name]').val()
	}
	
	xhr.open('GET', handlerURL + '?' + $.toJSON(req));
	xhr.send(fd);
	
	displayResponse(testName, 'Loading ...', '#ccc');
}

function testGetImage() {
	var testName = '#test-get-image';
	
	var image = new Image();
	
	$(image).load(function (evt) {
		displayResponse(testName, image, '');
	});
	
	$(image).error(function (evt) {
		displayResponse(testName, evt.target.responseText, '#fcc');
	});
	
	// request data
	req = {
		'action': 'get-image',
		'id': $(testName + ' [name=id]').val()
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
	} else {
		elem.append(text);
	}
}

