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

function setUpEditor(type){
	$(".editor > .header > .editor-schliessen-img").click(closeEditor);
	areaName = $(".editable").attr("areaname");
	console.log(areaName);
	
	if(type === "gallery")
	{
		$(".text-editor").hide();
		$(".editor [name=submit]").click(function() { uploadGalleryImage(areaName); });
		showGallery();
	}
	else if(type === "text")
	{
		$(".gallery-editor").hide();
		loadImageList(areaName);
		$('.gallery').append("Texteditor");
		$(".editor [name=picture-insert]").click(insertImageInText);
	}
}
function uploadTextImage() {
	
}
function uploadGalleryImage(areaName) {
	var fd = new FormData();
	var xhr = new XMLHttpRequest();
	console.log($("[name=title]").val());
	console.log($("[name=comment]").val());
	alert(areaName);
	data = {
		'action': 'upload-gallery-image',
		'area-name': areaName,
		'title':$(".gallery-editor [name=title]").val(),
		'comment':$(".gallery-editor [name=comment]").val()
	};
	
	fd.append("image", $(".gallery-editor [name=picture]")[0].files[0]);

	xhr.addEventListener("load", function (evt) {
		console.log(evt.target.responseText);
	}, false);
	xhr.addEventListener("error", function (evt) {
		console.log(evt.target.responseText);
	}, false);
	
	xhr.open("POST", "cgi-bin/request-handler.py?" + $.toJSON(data));
	xhr.send(fd);
}

function callEditor(type){
	$('.editor_popup').load('editor.html', function() { setUpEditor(type);});
}
function closeEditor(){
	$('.editor_popup').empty();
}
function showGallery() {
	$('.gallery-content').append("Welt");
	// Mit remove Divs herausnehmen und clone und sovielmal einfügen wie man es braucht
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
function loadImageList (areaName) {
	var galleryName = '#test-list-gallery-images';
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
			imageListElem.options[imageListElem.length] = new Option(imageList[i].id, imageList[i].id, false, false);
		}
	});
	req = {
		'action': 'list-gallery-images',
		'area-name': areaName
	}
	xhr.open('GET', "cgi-bin/request-handler.py" + '?' + $.toJSON(req));
	xhr.send(fd);
}