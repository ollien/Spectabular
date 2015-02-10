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
			var textSpan = document.createElement("span");
			closeButton.classList.add("fa");
			closeButton.classList.add("fa-remove");
			closeButton.classList.add("close");
			closeButton.classList.add("noselect");
			textSpan.classList.add("tabName")
			closeButton.onclick = function(event){
				event.preventDefault();
				event.stopPropagation();
				chrome.tabs.remove(currentTab.id);
				li.parentNode.removeChild(li);
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
			textSpan.appendChild(closeButton);
			windowTabs.push(li);
		});
		callback(windowTabs);
	});
}
document.addEventListener('DOMContentLoaded', function() {
	var mainList = document.getElementById("windows");
	var body = document.getElementsByTagName("body")[0];
	var html = document.getElementsByTagName("html")[0];
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
});