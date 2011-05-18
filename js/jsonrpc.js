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