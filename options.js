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

document.addEventListener('DOMContentLoaded', function(event){
	var optionsDiv = document.getElementById("options");
	getOptions(function(data){
		if (Object.keys(data).length===0){
			createOptionsStorage(function(){
				getOptions(function(data){
					options = data;
				});
			});
		}
		else{
			options = data;
		}
	});
});