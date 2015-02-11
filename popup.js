var totalHeight = 0; //Total height of the body of the popup
//Gets all windows
function getWindows(windowList,tabList,callback){
	if (typeof tabList=='function'){
		callback = tabList;
		tabList = null;
	}
	removeChildren(windowList);
	if (tabList==null){
		chrome.windows.getAll(function(windows){
			//loop through every window and append it ot the list
			windows.forEach(function(currentWindow,i){
				getTabs(currentWindow.id,i,function(li,ul){
					li.appendChild(ul);
					windowList.appendChild(li);
					callback(li);
				});
			});
		});
	}
	else{
		tabList.forEach(function(tabs,i){
			setupTabs(tabs,i,function(li,ul){
				li.appendChild(ul);
				windowList.appendChild(li);
				callback(li);
			});
		});
	}

}
//Gets all tabs in a window and sets them up
function getTabs(windowId,windowIndex,callback){
	var windowTabs = []
	chrome.tabs.query({'windowId':windowId},function(tabs){
		tabs.forEach(function(currentTab){
			setupTab(currentTab,function(li){
				windowTabs.push(li);	
			});
		});
		setupTabs(windowTabs,windowIndex,callback);
	});
}

//Sets up all tabs to be in their window elements
function setupTabs(tabs,windowIndex,callback){
	var li = document.createElement("li");
	var ul = document.createElement("ul");
	var windowName = document.createElement("span");
	var seperator = document.createElement("span");
	var tabCount = document.createElement("span");
	var tabWord = document.createElement("span");
	li.classList.add("window");
	li.classList.add("noselect");
	ul.classList.add("tabs");
	windowName.classList.add("windowIndex");
	windowName.textContent = "Window "+(windowIndex+1);
	seperator.textContent=" - "
	tabCount.classList.add("tabCount");
	tabCount.textContent = tabs.length.toString();
	tabCount.classList.add("tabWord");
	tabWord.textContent = (tabs.length>1 ? " tabs":" tab");
	li.appendChild(windowName);
	li.appendChild(seperator)
	li.appendChild(tabCount);
	li.appendChild(tabWord);
	tabs.forEach(function(currentTab){
		ul.appendChild(currentTab);
	});
	callback(li,ul);
}

function setupTab(currentTab,callback){
	var li = document.createElement("li");
	var textSpan = document.createElement("span");
	var closeButton = document.createElement("i");
	var pinButton = document.createElement("i");
	closeButton.classList.add("fa");
	closeButton.classList.add("fa-remove");
	closeButton.classList.add("close");
	closeButton.classList.add("noselect");
	closeButton.classList.add("pointer");
	pinButton.classList.add("fa");
	pinButton.classList.add("fa-thumb-tack");
	pinButton.classList.add("pin");
	pinButton.classList.add("noselect");
	closeButton.classList.add("pointer");
	if (currentTab.pinned){
		pinButton.classList.add("pinned");
	}
	li.classList.add("tab");
	li.classList.add("noselect");
	li.classList.add("pointer");
	//Setup favicon
	li.style.backgroundImage = "url(\'"+(currentTab.favIconUrl!==undefined && currentTab.favIconUrl!==null ? currentTab.favIconUrl:"img/default-favicon.png")+"\')";
	textSpan.classList.add("tabName");
	textSpan.textContent=currentTab.title;
	if (textSpan.textContent==""){
		textSpan.textContent="Untitled";	
	}
	
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
	
	li.appendChild(textSpan);
	textSpan.appendChild(pinButton);
	textSpan.appendChild(closeButton);
	callback(li);
}


function removeChildren(element){
	Array.prototype.slice.call(element.childNodes).forEach(function(child){
		element.removeChild(child);
	})
}

function createSearchableWindows(callback){
	var result = [];
	chrome.windows.getAll(function(windows){
		var tabs = [];
		windows.forEach(function(currentWindow,i){
			getTabs(currentWindow.id,i,function(li,ul){
				tabs = Array.prototype.slice.call(ul.childNodes);
				result.push(tabs);
				if (i==windows.length-1){
					callback(result);
				}
			});
		});
	});
}
function search(query,windows,callback){
	windows = windows.slice(); //Clone the JSON object so we don't modify the origional
	windows.forEach(function(tabs,i){
		matchedTabs = [];
		tabs.forEach(function(currentTab){
			if (currentTab.textContent.toLowerCase().indexOf(query.toLowerCase())>-1)
				matchedTabs.push(currentTab);
		});
		windows[i] = matchedTabs;
	});
	callback(windows);
}
function setHeights(tabs){
	var body = document.getElementsByTagName("body")[0];
	var html = document.getElementsByTagName("html")[0];
	totalHeight+=tabs.clientHeight;
	var height = 600+"px";
	if (totalHeight<600){
		height = totalHeight+"px";
	}
	html.style.height = height;
	body.style.height = height;
}
document.addEventListener('DOMContentLoaded', function() {
	var mainList = document.getElementById("windows");
	var filterInput = document.getElementById("search");
	getWindows(mainList,setHeights);
	filterInput.oninput = function(){
		createSearchableWindows(function(result){
			search(filterInput.value,result,function(windows){
				getWindows(mainList, windows, setHeights);
			});
		});
	};
});