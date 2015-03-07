var options;

function getOptions(callback){
	chrome.storage.local.get("options",function(items){
		if (items.sync){
			chrome.storage.sync.get("options",callback);
		}
		else{
			callback(items);
		}
	});
}

function saveOptions(callback){
	chrome.storage.local.set({"options":options},function(){
		console.log(options);
		if (options.sync){
			chrome.storage.sync.set({"options":options},callback);
		}
		else{
			callback();
		}
	});
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