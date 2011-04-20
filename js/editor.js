
$(function(){
	$(".editable > img:first-child").click(callEditor);
	$(".editable > img:first-child").hover(function () {
		$(this).parent().addClass("hover");
	}, function () {
		$(this).parent().removeClass("hover");
	});
});

function callEditor(){
	window.open("editor.html","Editor","width=800,height=400");
}