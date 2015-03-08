var windows = [];
var detached = [];
function createWindowStorage(callback){
	chrome.storage.local.set({'windows':[]},callback);
}

function createOptionsStorage(callback){
	var defaultSettings = {"options":{
		'darkMode':true,
		'sync':true,
	}};
	chrome.storage.sync.getBytesInUse(function(bytes){
		if (bytes===0){
			chrome.storage.sync.set(defaultSettings);
			chrome.storage.local.set(defaultSettings);
			
		}
		else{
			chrome.storage.sync.get("options",function(data){
				data = data.options;
				for (var setting in defaultSettings.options){
					if (!(setting in data)){
						data[setting] = defaultSettings.options[setting];		
					}
				}
				chrome.storage.sync.set({"options":data});
				chrome.storage.local.set({"options":data});
			});
		}
	});
}

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

function populateWindowStorage(callback){
	chrome.windows.getAll({'populate':true},function(result){
		result = result.filter(function(currentWindow){
			return currentWindow.type==="normal";
		})
		result.forEach(function(currentWindow,i){
			addWindow(currentWindow,i,function(j){
				if (j==result.length-1){
					saveWindows();
				}
			});
		});
	});
}

function clearWindowStorage(callback){
	chrome.storage.local.remove('windows',callback);
}

function saveWindows(callback){
	windows.forEach(function(currentWindow){
		if (currentWindow.tabs.indexOf(null)>-1){
			console.log("[DEBUG] FOUND A NULL ELEMENT.");
			console.log(new Error().stack);
			console.log(currentWindow.tabs);
		}
	})
	chrome.storage.local.set({'windows':windows},callback);
}

function getWindows(callback){
	chrome.storage.local.get("windows",callback);
}

function addWindow(currentWindow,i,callback){
	if (typeof i=='function'){
		callback = i;
	}
	var tabs = currentWindow.tabs!==undefined ? currentWindow.tabs : [];
	windows.push({'id':currentWindow.id,'name':'Window', 'tabs':tabs});
	if (callback!==undefined){
		callback(i);
	}
}

function findWindowById(windowId){
	var w = windows.filter(function(currentWindow){
		return currentWindow.id===windowId;
	});
	if (w.length===1){
		return {'window':w[0],'index':windows.indexOf(w[0])};
	}
	else if (w.length===0){ 
		throw "Could not find window with id "+windowId+" in window list. May be non-normal window such as a popup.";
	}
	else{
		throw "Found more than one window with id "+windowId;
	}
}

function findTabById(queryWindow,tabId){
	if (typeof queryWindow=="number"){
		var result = findWindowById(queryWindow);
		var windowIndex = result.index;
		queryWindow = result.window;
	}
	var t = queryWindow.tabs.filter(function(currentTab){
		return currentTab.id==tabId;
	});
	if (t.length===1){
		return {'tab':t[0],'index':queryWindow.tabs.indexOf(t[0]),'window':queryWindow,'windowIndex':windowIndex};
	}
	else if (t.length===0){
		throw "Could not find tab with id "+tabId+" in window with id "+queryWindow.id+" in window list. May be non-normal window such as a popup.";;
	}
	else{
		throw "Found more than one tab with id "+tabId+" in window with id "+queryWindow.id;
	}
}

function findTabInWindow(tabId){
	for (var i=0; i<windows.length; i++){
		var resultTab = windows[i].tabs.filter(function(currentTab){
			return currentTab.id===tabId;
		});
		if (resultTab.length===1){
			return {'tab':resultTab[0],'index':windows[i].tabs.indexOf(resultTab[0]),'window':windows[i],'windowIndex':i};
		}
	}	
	throw "A tab wasn't found with the id "+tabId;
}

chrome.windows.onCreated.addListener(function(currentWindow){
	if (currentWindow.type==="normal")
		addWindow(currentWindow,saveWindows);
});

chrome.windows.onRemoved.addListener(function(windowId){
	var result = findWindowById(windowId);
	windows.splice(result.index,1);
	saveWindows();
});

chrome.tabs.onCreated.addListener(function(currentTab){
	var containingWindow = findWindowById(currentTab.windowId);
	if (containingWindow.window.tabs.indexOf(currentTab)==-1){
		containingWindow.window.tabs.push(currentTab);
		saveWindows();
	}
	if (containingWindow.window.tabs.indexOf(null)>-1){
		console.log("[DEBUG] FOUND A NULL ELEMENT.");
		console.log(containingWindow.window.tabs);
	}
	
});

chrome.tabs.onUpdated.addListener(function(tabId,changeInfo,resultingTab){
	var tab = findTabById(resultingTab.windowId, tabId);
	// tab.window.tabs[tab.index] = resultingTab; //Old method that worked, but was weird on some pages such a gist
	chrome.tabs.get(tabId,function(currentTab){
		if (currentTabs===null){
			console.log("[DEBUG] FOUND A NULL ELEMENT.");
			console.log(tab.window.tabs);
		}
		tab.window.tabs[tab.index] = currentTab;
		saveWindows();
		if (tab.window.tabs.indexOf(null)>-1){
			console.log("[DEBUG] FOUND A NULL ELEMENT.");
			console.log(tab.window.tabs);
		}
	});
});

chrome.tabs.onMoved.addListener(function(tabId,objects){
	var windowId = objects.windowId;
	var startPos = objects.fromIndex;
	var endPos = objects.toIndex;
	var tab = findTabById(windowId,tabId);
	tab.window.tabs.splice(startPos,1);
	tab.window.tabs.splice(endPos,0,tab.tab);
	if (tab.window.tabs.indexOf(null)>-1){
		console.log("[DEBUG] FOUND A NULL ELEMENT.");
		console.log(tab.window.tabs);
	}
	saveWindows();
});

chrome.tabs.onRemoved.addListener(function(tabId,objects){
    var windowId = objects.windowId;
    var windowClosing = objects.isWindowClosing;
    //We don't need to worry about this if the window is closing. If the window is closing, it will be handled by the window remove event.
    if (!windowClosing){
    		var tab = findTabById(windowId, tabId);
		tab.window.tabs.splice(tab.index,1);
    		saveWindows();
    }
});

chrome.tabs.onReplaced.addListener(function(newId,oldId){
	var tab = findTabInWindow(oldId);
	tab.window.tabs[tab.index].id=newId;
	saveWindows();
})

chrome.tabs.onDetached.addListener(function(tabId, objects){
	var windowId = objects.oldWindowId;
	var startPos = objects.oldPosition;
	var tab = findTabById(windowId, tabId);
	//Add it to the list of detached tabs, which can be used in onAttached.
	detached.push(tab.tab);
	tab.window.tabs.splice(tab.index,1);
	saveWindows();
});

chrome.tabs.onAttached.addListener(function(tabId,objects){
	var windowId = objects.newWindowId;
	var endPos = objects.newPosition;
	var containingWindow = findWindowById(windowId);
	var detachedTab = detached.filter(function(currentTab){
		return currentTab.id===tabId;
	});
	if (detachedTab.length===1){
		detachedTab = detachedTab[0];
		containingWindow.window.tabs.splice(endPos,0,detachedTab);
		var tabIndex = detached.indexOf(detachedTab);
		//Remove it from the detached list
		detached.splice(tabIndex, 1);
		saveWindows();	
	}
});

chrome.runtime.onMessage.addListener(function(response){
	if (response.hasOwnProperty('nameChange')){
		var currentWindow = findWindowById(response.nameChange.windowId);
		currentWindow.window.name = response.nameChange.name;
		saveWindows();
	}
});

//init
chrome.storage.local.get('windows',function(result){
	console.log(result);
});

clearWindowStorage(function(){
	getOptions(function(data){
		if (Object.keys(data).length===0){
			createOptionsStorage(function(){
				getOptions(function(data){
					options = data.options;
					setupOptionsView(optionsDiv);
				});
			});
		}
		createWindowStorage(function(){
			populateWindowStorage();
		});
	});
});
