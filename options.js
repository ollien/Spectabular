var options;

function createOptionsStorage(callback){
	chrome.storage.local.set({"options":{
		'darkMode':true,
	}});
}

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
	});
}

document.addEventListener('DOMContentLoaded', function(event){
	var optionsDiv = document.getElementById("options");
	getOptions(function(data){
		if (Object.keys(data).length===0){
			createOptionsStorage(function(){
				getOptions(function(data){
					options = data.options;
					setupOptionsView(optionsDiv);
				});
			});
		}
		else{
			options = data.options;
			setupOptionsView(optionsDiv);
		}
	});
});