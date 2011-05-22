function makeTests(testImage) {
	function activateChanges() {
		return function (success, failure) {
			rpc.activate_changes(success, failure);
		};
	}
	
	function textArea(areaName) {
		return {
			'deleteAllImages': function () {
				return function (success, failure) {
					rpc.list_text_images(areaName, 'new', function (vImages) {
						async.map(vImages, function (vImage, success, failure) {
							rpc.delete_text_image(areaName, vImage['image-id'], success, failure);
						}, success, failure);
					}, failure);
				};
			},
			'uploadImage': function () {
				return function (success, failure) {
					rpc.upload_text_image(areaName, testImage, success, failure);
				};
			},
			'updateContent': function (content) {
				return function (success, failure) {
					rpc.update_text_content(areaName, content);
				};
			},
			'revert': function (version) {
				return function (success, failure) {
					rpc.revert_text(areaName, success, failure);
				};
			},
			'getImage': function (imageId, version) {
				return function (success, failure) {
					rpc.get_text_image(areaName, imageId, version, success, failure);
				};
			}
		};
	}
	
	function galleryArea(areaName) {
		return {
			'deleteAllImages': function () {
				return function (success, failure) {
					rpc.list_gallery_images(areaName, 'new', function (vImages) {
						async.map(vImages, function (vImage, success, failure) {
							rpc.delete_gallery_image(areaName, vImage['image-id'], success, failure);
						}, success, failure);
					}, failure);
				};
			},
			'uploadImage': function (title, comment) {
				return function (success, failure) {
					rpc.upload_gallery_image(areaName, testImage, title, comment, success, failure);
				};
			},
			'deleteImage': function (imageId) {
				return function (success, failure) {
					rpc.delete_gallery_image(areaName, imageId, success, failure);
				};
			},
			'updateImage': function (imageId, title, comment) {
				return function (success, failure) {
					rpc.update_gallery_image(areaName, imageId, title, comment, success, failure);
				};
			},
			'setOrder': function (imageIds) {
				return function (success, failure) {
					rpc.set_gallery_order(areaName, imageIds, success, failure);
				};
			},
			'revert': function (version) {
				return function (success, failure) {
					rpc.revert_gallery(areaName, success, failure);
				};
			},
			'listImages': function (version) {
				return function (success, failure) {
					rpc.list_gallery_images(areaName, version, success, failure);
				};
			},
			'getImage': function (imageId, version) {
				return function (success, failure) {
					rpc.get_gallery_image(areaName, imageId, version, success, failure);
				};
			}
		};
	}
	
	var testTextArea = textArea('test-text');
	var testGalleryArea = galleryArea('test-gallery');
	
	var textContent = 'foo bar baz';
	var textImageIds = [];
	var galleryImageIds = [];
	
	function grabTextImageId(res) {
		textImageIds.push(res['image-id']);
	}
	
	function grabGalleryImageId(res) {
		galleryImageIds.push(res['image-id']);
	}
	
	return [
		// Gallery area tests
		{			
			'name': 'get the database into a known state',
			'test': chain([
				testTextArea.deleteAllImages(),
				grabResult(grabTextImageId, testTextArea.uploadImage()),
				grabResult(grabTextImageId, testTextArea.uploadImage()),
				grabResult(grabTextImageId, testTextArea.uploadImage()),
				testGalleryArea.deleteAllImages(),
				grabResult(grabGalleryImageId, testGalleryArea.uploadImage('image 1', 'image 1 comment')),
				grabResult(grabGalleryImageId, testGalleryArea.uploadImage('image 2', 'image 2 comment')),
				grabResult(grabGalleryImageId, testGalleryArea.uploadImage('image 3', 'image 3 comment')),
				activateChanges()
			])
		},
		{			
			'name': 'uploading a gallery image',
			'test': chain([
				grabResult(grabGalleryImageId, testGalleryArea.uploadImage('image 4', 'image 4 comment')),
				function (success, failure) {
					// the image id must be computet at the time we execute this command
					testGalleryArea.getImage(galleryImageIds.slice(-1)[0], 'new')(success, failure);
				}
			])
		},
		{			
			'name': 'uploading a gallery image into non-existant gallery',
			'test': chain([
				negate(galleryArea('doesnotexists', 'new').uploadImage('', ''))
			])
		},
		{			
			'name': 'list gallery images',
			'test': chain([
				tested(function (res) {
					assertEqual(res[0]['image-id'], galleryImageIds[0]);
					assertEqual(res[0]['title'], 'image 1');
					assertEqual(res[0]['comment'], 'image 1 comment');
					// we assume the rest's correct ...
					assertEqual(res[3]['image-id'], galleryImageIds[3]);
				}, testGalleryArea.listImages('new'))
			])
		},
		{	
			'name': 'list non-existing gallery',
			'test': chain([
				negate(galleryArea('doesnotexists', 'new').listImages())
			])
		},
		{			
			'name': 'update gallery image',
			'test': chain([
				function (success, failure) {
					// the image id must be computet at the time we execute this command
					testGalleryArea.updateImage(galleryImageIds[0], 'new title', 'new comment')(success, failure);
				},
				tested(function (res) {
					assertEqual(res[0].title, 'new title');
					assertEqual(res[0].comment, 'new comment');
				}, testGalleryArea.listImages())
			])
		},
		{			
			'name': 'update non-existing image',
			'test': chain([
				negate(testGalleryArea.updateImage('doesnotexist', '', ''))
			])
		},
		{			
			'name': 'set gallery order',
			'test': chain([
				function (success, failure) {
					testGalleryArea.setOrder(galleryImageIds.slice().reverse())(success, failure);
				},
				tested(function (res) {
					assertEqual(res[0]['image-id'], galleryImageIds[3]);
					// we assume the rest's correct ...
					assertEqual(res[3]['image-id'], galleryImageIds[0]);
				}, testGalleryArea.listImages('new'))
			])
		},
		{			
			'name': 'invalid set gallery order requests',
			'test': chain([
				function (success, failure) {
					negate(testGalleryArea.setOrder(galleryImageIds.slice(0, -1)))(success, failure);
				},
				function (success, failure) {
					negate(testGalleryArea.setOrder(galleryImageIds.slice().concat(['invalid'])))(success, failure);
				},
				function (success, failure) {
					negate(testGalleryArea.setOrder(galleryImageIds.map(function () {
						return galleryImageIds[0];
					})))(success, failure);
				},
				function (success, failure) {
					negate(testGalleryArea.setOrder([]))(success, failure);
				}
			])
		},
		{			
			'name': 'delete gallery image',
			'test': chain([
				function (success, failure) {
					testGalleryArea.deleteImage(galleryImageIds[0])(success, failure);
				},
				function (success, failure) {
					testGalleryArea.deleteImage(galleryImageIds[1])(success, failure);
				},
				function (success, failure) {
					testGalleryArea.deleteImage(galleryImageIds[2])(success, failure);
				},
				tested(function (res) {
					assertEqual(res.length, 1);
					assertEqual(res[0]['image-id'], galleryImageIds[3]);
				}, testGalleryArea.listImages('new'))
			])
		},
		{			
			'name': 'revert gallery',
			'test': chain([
				testGalleryArea.revert(),
				tested(function (res) {
					assertEqual(res.length, 3);
				}, testGalleryArea.listImages('new'))
			])
		}
		
		
		
	/*
		{
			'name': 'list gallery images',
			'test': function (success, failure) {
				rpc.list_gallery_images(testGalleryArea, success, failure);
			}
		},
		{
			'name': 'request gallery images',
			'test': function (success, failure) {
				async.map(imageIds, function (v, success, failure) {
					rpc.get_gallery_image(testGalleryArea, v, success, failure);
				}, success, failure);
			}
		},
		{
			'name': 'update gallery images',
			'test': function (success, failure) {
				var newTitle = 'new title';
				var newComment = 'new comment';
				
				async.map(imageIds, function (v, success, failure) {
					rpc.update_gallery_image(testGalleryArea, v, newTitle, newComment, success, failure);
				}, function () {
					rpc.list_gallery_images(testGalleryArea, function (v) {
						var res = v.every(function (v, k) {
							return v['title'] == newTitle && v['comment'] == newComment;
						});
						
						check(res, 'new titles or comments do not match', success, failure);
					}, failure);
				}, failure);
			}
		},
		{
			'name': 'set gallery image order',
			'test': function (success, failure) {
				// reverse the images in the gallery and test their order
				imageIds.reverse()
								
				rpc.set_gallery_order(testGalleryArea, imageIds, function () {
					rpc.list_gallery_images(testGalleryArea, function (vList) {
						var res = vList.every(function (v, k) {
							return v['image-id'] == imageIds[k];
						});
						
						check(res, 'new image ids do not match', success, failure);
					}, failure);
				}, failure);
			}
		},
		// Text area tests
		{
			'name': 'remove all text area images',
			'test': function (success, failure) {
				rpc.list_text_images(testTextArea, function (vImages) {
					async.map(vImages, function (vImage, success, failure) {
						rpc.delete_text_image(testTextArea, vImage['image-id'], success, failure);
					}, function () {
						rpc.list_text_images(testTextArea, function (v) {
							check(v.length == 0, 'image list not empty', success, failure);
						}, failure);
					}, failure);
				}, failure);
			}
		},
		{
			'name': 'upload text area images',
			'test': function (success, failure) {
				async.map(['foo', 'bar', 'baz'], function (v, success, failure) {
					rpc.upload_text_image(testTextArea, testImage, success, failure);
				}, function (res) {
					imageIds = res.map(function (v) {
						return v['image-id'];
					});
					success();
				}, failure);
			}
		},
		{
			'name': 'list text area images',
			'test': function (success, failure) {
				rpc.list_text_images(testTextArea, success, failure);
			}
		},
		{
			'name': 'request text area images',
			'test': function (success, failure) {
				async.map(imageIds, function (v, success, failure) {
					rpc.get_text_image(testTextArea, v, success, failure);
				}, success, failure);
			}
		},
		// Text area content
		{
			'name': 'get text area content',
			'test': function (success, failure) {
				rpc.get_text_content(testTextArea, success, failure);
			}
		},
		{
			'name': 'set text area content',
			'test': function (success, failure) {
				rpc.update_text_content(testTextArea, testContent, function (vData) {
					rpc.get_text_content(testTextArea, function (v) {
						check(v.content == testContent, 'content does not match!', success, failure);
					}, failure);
				}, failure);
			}
		} */
	]
}

function runTests(tests) {
	$('#results').empty();
	
	async.map(tests, function (v, success, failure) {
		message("Test: " + v.name, 'title');
		
		v.test(function (res) {
			message('Test passed', 'success');
			success();
		}, function (msg) {
			message('Test failed: ' + msg, 'failure');
			failure(v.name);
		});
	}, function (res) {
		message('Test Summary:', 'title');
		message('All tests passed', 'success');
	}, function (msg) {
		message('Test Summary:', 'title');
		message('Test Failed: ' + msg, 'failure');
	});
}

function grabResult(resFn, fn) {
	return function (success, failure) {
		fn(function (res) {
			resFn(res);
			success();
		}, failure);
	};
}

function assertEqual(a, b) {
	if (a !== b)
		throw a + ' != ' + b
}

// checks the return value of an asynchronous function unsing the supplied function. The supplied function should throw a string describing the problem
function tested(check, fn) {
	return function (success, failure) {
		fn(function (res) {
			try {
				check(res);
				success();
			} catch (msg) {
				message('Assertion failed: ' + msg, 'failure');
				failure();
			}
		}, failure);
	}
}

// compose a list of asynchronous methods
function chain(fns) {
	return function (success, failure) {
		function run(i) {
			if (i < fns.length) {
				fns[i](function () {
					run(i + 1);
				}, failure);
			} else {
				success();
			}
		}
		
		run(0);
	}
}

// returns a function that fails when the supplied function succeeds and vice-versa.
function negate(fn) {
	return function (success, failure) {
		fn(failure, success);
	};
}

// output a message to the testing log
function message(text, type) {
	if (type === undefined)
		type = 'message';
	
	var elems = text.split('\n').map(function (i) {
		return dom.element('p', { }, [dom.text(i.replace(' ', '\xa0').replace('\t', '\xa0\xa0\xa0\xa0'))])
	});
	
	$('#results').append(dom.element('p', { 'class': type }, elems));
	
	$('body').scrollTop($('body').height());
}

// format and output a message from a JSON-RCP request object.
function rpcMessage(data) {
	var args = [];
	
	lambda.map(data, function (k, v) {
		if (k != 'action')
			args.push(k + ' = ' + $.toJSON(v));
	});
	
	message(data['action'] + '(' + args.join(', ') + ')');
}

// turn a synchronous function, which may throw an exception into an asynchronous function guaranteed not to throw an exception
function checked(fn, success, failure) {
	return function() {
		try {
			success(fn.apply(undefined, arguments))
		} catch (e) {
			failure(e);
		}
	};
}

// redefining jsonrpc to output a message for each request
var jsonrpc = (function (jsonrpc) {
	return function (url, data, success, failure) {
		rpcMessage(data);
		jsonrpc(url, data, success, failure);
	}
}) (jsonrpc)

var handlerURL = '../cgi-bin/request-handler.py'

var rpc = {
	'upload_gallery_image': function (area_name, image, title, comment, success, failure) {
		jsonrpc(handlerURL, {
			'action': 'upload-gallery-image',
			'area-name': area_name,
			'image': image,
			'title': title,
			'comment': comment
		}, success, failure);
	},
	'update_gallery_image': function (area_name, image_id, title, comment, success, failure) {
		jsonrpc(handlerURL, {
			'action': 'update-gallery-image',
			'area-name': area_name,
			'image-id': image_id,
			'title': title,
			'comment': comment
		}, success, failure);
	},
	'set_gallery_order': function (area_name, image_ids, success, failure) {
		jsonrpc(handlerURL, {
			'action': 'set-gallery-order',
			'area-name': area_name,
			'image-ids': image_ids
		}, success, failure);
	},
	'delete_gallery_image': function (area_name, image_id, success, failure) {
		jsonrpc(handlerURL, {
			'action': 'delete-gallery-image',
			'area-name': area_name,
			'image-id': image_id
		}, success, failure);
	},
	'revert_gallery': function (area_name, success, failure) {
		jsonrpc(handlerURL, {
			'action': 'revert-gallery',
			'area-name': area_name
		}, success, failure);
	},
	'list_gallery_images': function (area_name, version, success, failure) {
		jsonrpc(handlerURL, {
			'action': 'list-gallery-images',
			'area-name': area_name,
			'version': version
		}, success, failure);
	},
	'get_gallery_image': function (area_name, image_id, version, success, failure) {
		var image = new Image();
		
		$(image).load(function () { success(image); });
		$(image).error(function () { failure('bäääh!'); });
		
		request = {
			'action': 'get-gallery-image',
			'area-name': area_name,
			'image-id': image_id,
			'version': version
		};
		
		rpcMessage(request);
		image.src = handlerURL + '?' + $.toJSON(request);
	},
	'upload_text_image': function (area_name, image, success, failure) {
		jsonrpc(handlerURL, {
			'action': 'upload-text-image',
			'area-name': area_name,
			'image': image
		}, success, failure);
	},
	'delete_text_image': function (area_name, image_id, success, failure) {
		jsonrpc(handlerURL, {
			'action': 'delete-text-image',
			'area-name': area_name,
			'image-id': image_id
		}, success, failure);
	},
	'update_text_content': function (area_name, content, success, failure) {
		jsonrpc(handlerURL, {
			'action': 'update-text-content',
			'area-name': area_name,
			'content': content
		}, success, failure);
	},
	'revert_text': function (area_name, success, failure) {
		jsonrpc(handlerURL, {
			'action': 'revert-text',
			'area-name': area_name
		}, success, failure);
	},
	'get_text_content': function (area_name, version, success, failure) {
		jsonrpc(handlerURL, {
			'action': 'get-text-content',
			'area-name': area_name,
			'version': version
		}, success, failure);
	},
	'list_text_images': function (area_name, version, success, failure) {
		jsonrpc(handlerURL, {
			'action': 'list-text-images',
			'area-name': area_name,
			'version': version
		}, success, failure);
	},
	'get_text_image': function (area_name, image_id, version, success, failure) {
		var image = new Image();
		
		$(image).load(function () { success(image); });
		$(image).error(function () { failure('bäääh!'); });
		
		request = {
			'action': 'get-text-image',
			'area-name': area_name,
			'image-id': image_id,
			'version': version
		};
		
		rpcMessage(request);
		image.src = handlerURL + '?' + $.toJSON(request);
	},
	'activate_changes': function (success, failure) {
		jsonrpc(handlerURL, {
			'action': 'activate_changes',
			'generate-page': false
		}, success, failure);
	}
}


