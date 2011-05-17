$(function(){
	$.ajaxSetup ({
	    // Disable caching of AJAX responses
	    cache: false
	});
	$(".editable.editor-gallery > img:first-child").click(function() { callEditor("gallery"); });
	$(".editable.editor-text > img:first-child").click(function() { callEditor("text"); });
	$(".editable > img:first-child").hover(function () {
		$(this).parent().addClass("hover");
		}, function () {
		$(this).parent().removeClass("hover");
	});
});


function callEditor(type){
	$('.editor_popup').load('editor.html', function() { setUpEditor(type);});
}

function setUpEditor(type){
	
	
	// Funktionen
	function uploadGalleryImage() {
		var fd = new FormData();
		var xhr = new XMLHttpRequest();
		console.log($("[name=title]").val());
		console.log($("[name=comment]").val());
		data = {
			'action': 'upload-gallery-image',
			'area-name': areaName,
			'title':$(".gallery-editor [name=title]").val(),
			'comment':$(".gallery-editor [name=comment]").val()
		};
		
		fd.append("image", $(".gallery-editor [name=picture]")[0].files[0]);
	
		xhr.addEventListener("load", function (evt) {
			console.log(evt.target.responseText);
			showGallery();
		}, false);
		xhr.addEventListener("error", function (evt) {
			console.log(evt.target.responseText);
		}, false);
		
		xhr.open("POST", "cgi-bin/request-handler.py?" + $.toJSON(data));
		xhr.send(fd);
	}
	function uploadTextImage() {
		
	}
	
	function showGallery() {
		var fd = new FormData();
		var xhr = new XMLHttpRequest();
		$('.gallery-content').empty();
		xhr.addEventListener('load', function(evt) {
			imageList = $.evalJSON(evt.target.responseText);
			for(i = 0; i < imageList.length ; i++)
			{
				divToFill = divToClone.clone();
				var image = new Image();
				req = {
					'action': 'get-gallery-image',
					'area-name': areaName,
					'image-id': imageList[i]['image-id']
				}
				console.log(imageList[i]['image-id']);
				image.src = "cgi-bin/request-handler.py?" + $.toJSON(req);
				$(image).width('100px');
				$(image).height('100px');
				
				$('.image', divToFill).append(image);
				$('.title', divToFill).append(imageList[i]['title']);
				$('.comment', divToFill).append(imageList[i]['comment']);
				$('.gallery-content').append(divToFill);
			}
			
		}, false);
		req = {
			'action': 'list-gallery-images',
			'area-name': areaName
		}
		xhr.open('GET', "cgi-bin/request-handler.py" + '?' + $.toJSON(req));
		xhr.send(fd);
	}
	function insertImageInText() {
		textarea = $(".editor [name=editor-textarea]")   
		str = textarea[0].value;  // Text aus Textarea auslesen und in str speichern
		imgString = "![Alt text](/path/to/" + $(".editor [name=text-editor-img-list]")[0].value + ")";  // Bild String zusammensetzten
		pos = textarea[0].selectionStart;  // position des Cursors herausfinden
		str = str.slice(0, pos) + imgString + str.slice(pos); // Bild String in Text einsetzen
		textarea[0].value = str;  // String in der Textarea einsetzten
		textarea[0].setSelectionRange(pos + imgString.length , pos + imgString.length);  // Cursor hinter dem Bild setzten
	}
	function loadImageList () {
		var fd = new FormData();
		var xhr = new XMLHttpRequest();
		var imageListElem = $(".editor [name=text-editor-img-list]")[0];
		console.log("im loadImageList");
		xhr.addEventListener('load', function(evt) {
			imageListElem.length = null;
			imageList = $.evalJSON(evt.target.responseText);
			console.log(imageList.length);
			for(i = 0; i < imageList.length ; i++)
			{
				console.log(i);
				imageListElem.options[imageListElem.length] = new Option(imageList[i]['image-id'], imageList[i]['image-id'], false, false);
			}
		}, false);
		req = {
			'action': 'list-gallery-images',
			'area-name': areaName
		}
		xhr.open('GET', "cgi-bin/request-handler.py" + '?' + $.toJSON(req));
		xhr.send(fd);
	}
	
	function closeEditor(){
		$('.editor_popup').empty();
	}
	
	// -----------------------------------------------------------------
	// Variabeln
	var areaName = $(".editable").attr("areaname");
	
	
	// -----------------------------------------------------------------
	// Set Up Editor
	$(".editor > .header > .editor-schliessen-img").click(closeEditor);
	if(type === "gallery")
	{
		$(".text-editor").hide();
		var divToClone = $('.gallery-content > .image-with-all');
		$('.gallery-content > .image-with-all').remove();
		$(".editor [name=submit]").click(uploadGalleryImage);
		showGallery();
	}
	else if(type === "text")
	{
		$(".gallery-editor").hide();
		loadImageList();
		$('.gallery').append("Texteditor");
		$(".editor [name=picture-insert]").click(insertImageInText);
	}
	
}


