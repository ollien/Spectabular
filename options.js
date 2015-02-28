var options;

function getOptions(callback){
	chrome.storage.local.get("options",callback);
}

function saveOptions(callback){
	chrome.storage.local.set({"options":options},callback);
}

function setupOptionsView(optionsDiv){
	var children = Array.prototype.slice.call(optionsDiv.querySelectorAll('input.option'));
	children.forEach(function(child){
		child.checked = options[child.id];
		child.addEventListener('change', function(event){
			options[event.target.id] = event.target.checked;
			saveOptions();
		});
	});
}

document.addEventListener('DOMContentLoaded', function(event){
	var optionsDiv = document.getElementById("options");
	getOptions(function(data){
		options = data.options;
		setupOptionsView(optionsDiv);
	});
});