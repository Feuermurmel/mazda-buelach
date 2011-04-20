
$(function(){
	$(".editable > img:first-child").click(callEditor);
	$(".editable > img:first-child").hover(function () {
		$(this).parent().addClass("hover");
	}, function () {
		$(this).parent().removeClass("hover");
	});
});

function setUpEditor(){
	$(".editor [name=save]").click(closeEditor);
}

function callEditor(){
	$('.editor_popup').load('editor.html');
	/* window.open("editor.html","Editor","width=800,height=400"); */
}
function closeEditor(){
	$('.editor_popup').empty();
}