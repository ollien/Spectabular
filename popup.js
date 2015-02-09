function getWindows(windowList){
	chrome.windows.getAll(function(windows){
		//loop through every window and append it ot the list
		windows.forEach(function(currentWindow,i){
			var li = document.createElement("li");
			var ul = document.createElement("ul");
			li.classList.add("window");
			chrome.tabs.query({'windowId':currentWindow.id},function(tabs){
				li.textContent="Window "+(i+1)+" - "+tabs.length+" tabs";
				li.appendChild(ul);
				windowList.appendChild(li);
				tabs.forEach(function(currentTab){
					var li = document.createElement("li");
					li.classList.add("tab");
					li.textContent=currentTab.title;
					ul.appendChild(li);
				});
			});
		});
	});

}

document.addEventListener('DOMContentLoaded', function() {
	var mainList = document.getElementById("windows");
	var body = document.getElementsByTagName("body")[0];
	getWindows(mainList);
	if (mainList.clientHeight<600){
		body.style.height = mainList.clientHeight;
	}
	
});