function getWindows(windowList,callback){
	chrome.windows.getAll(function(windows){
		//loop through every window and append it ot the list
		windows.forEach(function(currentWindow,i){
			getTabs(currentWindow.id,function(tabs){
				var li = document.createElement("li");
				var ul = document.createElement("ul");
				li.classList.add("window");
				li.classList.add("noselect");
				ul.classList.add("tabs");
				li.textContent="Window "+(i+1)+" - "+tabs.length+ (tabs.length>1 ? " tabs":" tab");
				tabs.forEach(function(currentTab){
					ul.appendChild(currentTab);
				});
				li.appendChild(ul);
				windowList.appendChild(li);
				callback(li);
			});
		});
	});

}

function getTabs(windowId,callback){
	var windowTabs = []
	chrome.tabs.query({'windowId':windowId},function(tabs){
		tabs.forEach(function(currentTab){
			var li = document.createElement("li");
			var closeButton = document.createElement("i");
			var pinButton = document.createElement("i");
			var textSpan = document.createElement("span");
			closeButton.classList.add("fa");
			closeButton.classList.add("fa-remove");
			closeButton.classList.add("close");
			closeButton.classList.add("noselect");
			pinButton.classList.add("fa");
			pinButton.classList.add("fa-thumb-tack");
			pinButton.classList.add("pin");
			pinButton.classList.add("noselect");
			if (currentTab.pinned){
				pinButton.classList.add("pinned");
			}
			textSpan.classList.add("tabName")
			closeButton.onclick = function(event){
				event.preventDefault();
				event.stopPropagation();
				chrome.tabs.remove(currentTab.id);
				li.parentNode.removeChild(li);
			}
			pinButton.onclick = function(event){
				event.preventDefault();
				event.stopPropagation();
				if (currentTab.pinned || pinButton.classList.contains('pinned')){
					pinButton.classList.remove("pinned");
					chrome.tabs.update(currentTab.id, {'pinned':false});
				}
				else{
					pinButton.classList.add("pinned");
					chrome.tabs.update(currentTab.id, {'pinned':true});
				}
			}
			//Switches to the tab clicked
			li.onclick = function(event){
				event.stopPropagation();
				chrome.windows.getCurrent(function(resultWindow){
					if (currentTab.id!=resultWindow.id){
						chrome.windows.update(currentTab.windowId,{'focused':true});
					}
					chrome.tabs.update(currentTab.id,{'highlighted':true,'active':true});
				});
			}
			li.classList.add("tab");
			li.style.backgroundImage = "url(\'"+(currentTab.favIconUrl!==undefined && currentTab.favIconUrl!==null ? currentTab.favIconUrl:"img/default-favicon.png")+"\')"
			textSpan.textContent=currentTab.title;
			li.appendChild(textSpan);
			textSpan.appendChild(pinButton);
			textSpan.appendChild(closeButton);
			windowTabs.push(li);
		});
		callback(windowTabs);
	});
}
function createSearchableWindows(callback){
	var result = [];
	chrome.windows.getAll(function(windows){
		var tabs = [];
		windows.forEach(function(currentWindow,i)){
			getTabs(currentWindow.id,function(windowTabs){
				tabs = windowsTabs;
				result.push(result);
				if (i==windows.length-1){
					callback(result);
				}
			});
		}
	});
}
function search(query,windows,callback){
	windows = JSON.parse(JSON.stringify(windows)); //Clone the JSON object so we don't modify the origional
	windows.forEach(function(tabs,i){
		matchedTabs = [];
		tabs.forEach(function(currentTab){
			if (currentTab.textContent.indexOf(query)>-1)
				matchedTabs.push(currentTab);
		});
		windows[i] = matchedTabs;
	});
	callback(windows);
}

document.addEventListener('DOMContentLoaded', function() {
	var mainList = document.getElementById("windows");
	var body = document.getElementsByTagName("body")[0];
	var html = document.getElementsByTagName("html")[0];
	var filterInput = document.getElementById("search");
	var totalHeight = 0;
	getWindows(mainList,function(tabs){
		totalHeight+=tabs.clientHeight;
		var height = 600+"px";
		if (totalHeight<600){
			height = totalHeight+"px";
		}
		html.style.height = height;
		body.style.height = height;
	});
	filterInput.oninput = search(filterInput.value, createSearchableWindows(function(result){
		
	}));
});