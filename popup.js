var totalHeight = 0; //Total height of the body of the popup
var unmovedPins = []; //Stores pinned tabs that haven't been within the popup
var pinnedTabs = []; //Stores pinned tabs that have been moved within the popup
//Gets windows from storage
function getStorage(callback){
	chrome.storage.local.get("windows",callback);
}

function changeWindowName(windowId,newName,callback){
	getStorage(function(data){
		var windows = data.windows;
		var changedWindow = windows.filter(function(currentWindow){
			return currentWindow.id===windowId;
		});
		if (changedWindow.length===1){
			changedWindow[0].name = newName;
			chrome.storage.local.set({"windows":windows},callback);
			chrome.runtime.sendMessage({'nameChange':{'windowId':windowId,'name':newName}});
		}
		else{
			throw "More than one window has the id "+windowId+". This should never happen."
		}
	});
}

function getWindows(windowList,windows,callback){
	if (typeof windows==="function"){
		callback = windows;
		getStorage(function(data){
			if (data!=null){
				setupWindows(windowList,data.windows,callback);
			}
			else{
				throw "Windows is null, this hsould never happen.";
			}
		});
	}
	else{
		setupWindows(windowList,windows, callback);
	}
}

function setupWindows(windowList,windows,callback){
	windows.forEach(function(currentWindow){
		setupWindowElement(currentWindow, function(windowLi){
			setupTabs(currentWindow.tabs, function(tabElements){
				tabElements.forEach(function(currentTab){
					windowLi.querySelector('ul.tabs').appendChild(currentTab);
				});
				windowList.appendChild(windowLi);
				callback();
			});
		});			
	});
}

//Sets up all tabs to be in their window elements
function setupWindowElement(currentWindow,callback){
	var li = document.createElement("li");
	var ul = document.createElement("ul");
	var textContent = document.createElement("span");
	var windowName = document.createElement("span");
	var seperator = document.createElement("span");
	var tabCount = document.createElement("span");
	var tabWord = document.createElement("span");
	li.classList.add("window");
	li.classList.add("noselect");
	ul.classList.add("tabs");
	li.setAttribute("windowId", currentWindow.id);
	textContent.classList.add("textContent");
	windowName.classList.add("windowName");
	windowName.textContent = currentWindow.name;
	seperator.textContent=" - "
	tabCount.classList.add("tabCount");
	tabCount.textContent = currentWindow.tabs.length.toString();
	tabWord.classList.add("tabWord");
	tabWord.textContent = (currentWindow.tabs.length>1 ? " tabs":" tab");
	windowName.addEventListener('dblclick', function(event){
		var input = document.createElement('input');
		input.setAttribute('value',windowName.textContent);
		input.addEventListener('keydown', function(event){
			event.stopPropagation();
			if(event.keyCode===13){
				event.preventDefault();
				var windowId = parseInt(input.parentNode.parentNode.getAttribute('windowId'));
				windowName.textContent = input.value;
				input.parentNode.replaceChild(windowName,input);
				changeWindowName(windowId, input.value);
			}
		});
		windowName.parentNode.replaceChild(input,windowName);
		input.focus();
		input.select();
	});
	textContent.appendChild(windowName);
	textContent.appendChild(seperator)
	textContent.appendChild(tabCount);
	textContent.appendChild(tabWord);
	li.appendChild(textContent);
	li.appendChild(ul);
	callback(li);
}

function setupTabs(tabs,callback){
	var tabElements = [];
	tabs.forEach(function(currentTab){
		var li = document.createElement("li");
		var textSpan = document.createElement("span");
		var closeButton = document.createElement("i");
		var pinButton = document.createElement("i");
		li.setAttribute('tabId', currentTab.id);
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
			pinnedTabs.push(li);
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

		closeButton.addEventListener('click',function(event){
			event.preventDefault();
			event.stopPropagation();
			chrome.tabs.remove(currentTab.id);
			decrementTabCount(li);
			if (li.parentNode.childNodes.length===0){
				li.parentNode.parentNode.removeChild(li.parentNode);
			}
			else{
				li.parentNode.removeChild(li);
			}
			setHeights();
		});
		
		pinButton.addEventListener('click',function(event){
			event.preventDefault();
			event.stopPropagation();
			if (pinButton.classList.contains('pinned')){
				pinButton.classList.remove("pinned");
				chrome.tabs.update(currentTab.id, {'pinned':false});
			}
			else{
				pinButton.classList.add("pinned");
				chrome.tabs.update(currentTab.id, {'pinned':true});
				unmovedPins.push(li);
			}
		});
		
		//Switches to the tab clicked
		li.addEventListener('click',function(event){
			event.stopPropagation();
			//If the mouse is clicked within the bounds of the closeButton, simulate a click event and return.
			if (event.pageX>=closeButton.getBoundingClientRect().left && event.pageX<=closeButton.getBoundingClientRect().right){
				closeButton.click();
				return;
			}
			//If the mouse is clicked within the bounds of the pinButton, simulate a click event and return.
			if (event.pageX>=pinButton.getBoundingClientRect().left && event.pageX<=pinButton.getBoundingClientRect().right){
				pinButton.click();
				return;
			}
			chrome.windows.getCurrent(function(resultWindow){
				if (currentTab.id!=resultWindow.id){
					chrome.windows.update(currentTab.windowId,{'focused':true});
				}
				chrome.tabs.update(currentTab.id,{'highlighted':true,'active':true});
			});
		});
		
		var mouseListenerFunction = function(event){
			//If the mouse is within the bounds of the closeButton, highlight it as if it's being hovered.
			if (event.clientX>=closeButton.getBoundingClientRect().left && event.clientX<=closeButton.getBoundingClientRect().right){
				console.log("Adding!");
				closeButton.classList.add('fakeHover');
				console.log(closeButton.classList);
			}
			else{
				closeButton.classList.remove('fakeHover');
			}
			//If the mouse is within the bounds of the pinButton, highlight it as if it's being hovered.
			if (event.clientX>=pinButton.getBoundingClientRect().left && event.clientX<=pinButton.getBoundingClientRect().right){
				pinButton.classList.add('fakeHover');
			}
			else{
				pinButton.classList.remove('fakeHover');
			}

		}
		
		li.addEventListener('mousein', mouseListenerFunction);
		li.addEventListener('mousemove', mouseListenerFunction);
		li.addEventListener('mouseout', function(event){
			closeButton.classList.remove('fakeHover');
			pinButton.classList.remove('fakeHover');
		});
		li.appendChild(textSpan);
		textSpan.appendChild(pinButton);
		textSpan.appendChild(closeButton);
		tabElements.push(li);
	});
	callback(tabElements);
}

function decrementTabCount(tabLi){
	var ul = tabLi.parentNode;
	if (ul.tagName.toLowerCase()!='ul' || !ul.classList.contains("tabs")){
		throw "Not a tab li";
	}
	var li = ul.parentNode;
	if (li.tagName.toLowerCase()!='li' || !li.classList.contains("window")){
		throw "Not a tab li";
	}	
	var tabCount = li.querySelector('span.textContent>span.tabCount');
	var num = parseInt(tabCount.textContent)-1;
	tabCount.textContent=num.toString();
	var windows = li.parentNode;
	if (windows.tagName.toLowerCase()!='ul' || windows.id!="windows"){
		throw "Not a tab li";
	}
	if (num===1){
		li.querySelector('span.textContent>span.tabWord').textContent = " tab"
	}
	if (num===0){
		windows.removeChild(li);
	}
	setHeights();
}

function removeChildren(element){
	Array.prototype.slice.call(element.childNodes).forEach(function(child){
		element.removeChild(child);
	});
}
function search(query,callback){
	getStorage(function(windows){
		windows = windows.windows;
		windows = windows.filter(function(currentWindow){
			currentWindow.tabs = currentWindow.tabs.filter(function(currentTab){
				return currentTab.title.toLowerCase().indexOf(query)>-1 || new URL(currentTab.url).hostname.indexOf(query)>-1;
			});
			return currentWindow.tabs.length>0;
		});
		callback(windows);
	});
}

function createWindowList(mainList){
	return mainList.querySelectorAll('li.window');
}

function createTabList(mainList,windowKeyIndex){
	return mainList.querySelectorAll('li.window')[windowKeyIndex].querySelector('ul.tabs').childNodes;
}
function setHeights(){
	var windows = document.getElementById("windows");
	var body = document.querySelector("body");
	var html = document.querySelector("html");
	var height = windows.offsetHeight+"px";
	if (windows.offsetHeight>=600){
		height = "600px";
	}
	html.style.height = height;
	body.style.height = height;
}
document.addEventListener('DOMContentLoaded', function() {
	var mainList = document.getElementById("windows");
	var filterInput = document.getElementById("search");
	var windowKeyIndex = 0;
	var tabKeyIndex = -2; //-2 indicates nothing is selected. -1 indicates the window is selected. Anything above that indicates that a tab is selected.
	getWindows(mainList,setHeights);
	filterInput.addEventListener('input', function(event){
		search(filterInput.value,function(windows){
			removeChildren(mainList);
			getWindows(mainList,windows,function(){
				if (filterInput.value.length>0){
					mainList.classList.add('searching');
				}
				else{
					mainList.classList.remove('searching');
				}
				setHeights();
			});
		});
	});
	//Workaround to prevent letters from triggering events.
	filterInput.addEventListener('keydown', function(event){
		if (event.keyCode!=40 && event.keyCode!=38 && event.keyCode!=13){
			event.stopPropagation();
		}
	});

	chrome.tabs.onMoved.addListener(function(tabId,object){
		if (!mainList.classList.contains('searching')){
			var startPos = object.fromIndex;
			var endPos = object.toIndex;
			var pinnedTab = unmovedPins.filter(function(tab){
				return parseInt(tab.getAttribute('tabId'))===tabId;
			});

			if (pinnedTab.length===0){
				pinnedTab = pinnedTabs.filter(function(tab){
					return parseInt(tab.getAttribute('tabId'))===tabId;
				});
			}

			if (pinnedTab.length===1){
				pinnedTab = pinnedTab[0];
				var ul = pinnedTab.parentNode; 
				var children = Array.prototype.slice.call(ul.childNodes);
				var pinnedPos = unmovedPins.indexOf(pinnedTab);
				if (pinnedPos==-1){
					pinnedPos = pinnedTabs.indexOf(pinnedTab);
				}
				var temp = children[startPos];
				children.splice(startPos,1);
				children.splice(endPos, 0,temp);
				removeChildren(ul);
				children.forEach(function(child){
					ul.appendChild(child);
				});
				pinnedTabs.push(pinnedTab);
				unmovedPins.splice(pinnedPos,1);
				if (pinnedTab.classList.contains("keyHover")){
					tabKeyIndex = endPos;
				}
			}
			else{
				debugger;
				console.log(pinnedTab);
			}
		}
	});

	window.addEventListener('keydown', function(event){
		var windowList = createWindowList(mainList, windowKeyIndex);
		var tabList = createTabList(mainList,windowKeyIndex);
		//If down is pressed, traverse through tabs.
		if (event.keyCode===40){
			event.preventDefault();
			event.stopPropagation();
			if (document.activeElement===filterInput){
				filterInput.blur();
			}
			//If nothing is selected, select the the window itself.
			if (tabKeyIndex===-2){
				windowList[windowKeyIndex].classList.add('keyHover');
				tabKeyIndex+=1;
			}
			//If we're at the last element, switch windows.
			else if (tabKeyIndex===tabList.length-1){
				if (windowKeyIndex<windowList.length-1){
					tabList[tabKeyIndex].classList.remove('keyHover');
					windowKeyIndex+=1;
					tabKeyIndex = -1;
					windowList[windowKeyIndex].classList.add('keyHover');
				}
			}
			//Otherwise, just traverse the tab list.
			else if (tabKeyIndex<tabList.length-1){
				windowList[windowKeyIndex].classList.remove('keyHover');
				if (tabKeyIndex>=0){
					tabList[tabKeyIndex].classList.remove('keyHover');
				}
				tabKeyIndex+=1;
				tabList[tabKeyIndex].classList.add('keyHover');
			}
			//Scroll if the index passes the bottom border
			if (tabList[tabKeyIndex].getBoundingClientRect().bottom>document.querySelector('body').clientHeight){
				scrollBy(0, tabList[tabKeyIndex].clientHeight);
			}
		}
		//If up is pressed, traverse through tabs
		else if (event.keyCode===38){
			event.preventDefault();
			event.stopPropagation();
			//If a window is selected, switch to the next one.
			if (tabKeyIndex===-1){
				windowList[windowKeyIndex].classList.remove('keyHover');
				if (windowKeyIndex>0){
					windowKeyIndex-=1;
					tabList = createTabList(mainList, windowKeyIndex);
					tabKeyIndex = tabList.length-1;
					tabList[tabKeyIndex].classList.add('keyHover');
				}
				//If it's the first window, highlight the search bar
				else{
					filterInput.focus();
				}
			}
			//If we're at the top of a tab list, highlight the tab itself.
			else if (tabKeyIndex===0){
				tabList[tabKeyIndex].classList.remove('keyHover');
				windowList[windowKeyIndex].classList.add('keyHover');
				tabKeyIndex-=1;
			}
			//In all other instances, just move up one.
			else if (tabKeyIndex>0){
				windowList[windowKeyIndex].classList.remove('keyHover');
				tabList[tabKeyIndex].classList.remove('keyHover');
				tabKeyIndex-=1;
				tabList[tabKeyIndex].classList.add('keyHover');
			}
			//Scroll if the tab index passes the top border.
			if (tabList[tabKeyIndex].getBoundingClientRect().top<=0){
				scrollBy(0, tabList[tabKeyIndex].clientHeight*-1);
			}	
		}
		//If enter is pressed, switch to the tab.
		else if (event.keyCode===13){
			if (tabKeyIndex>=0){
				tabList[tabKeyIndex].click();
			}
		}
		//Close when c is pressed
		else if (event.keyCode===67){
			tabList[tabKeyIndex].querySelector('i.close').click();
			//Move the selection after pressing c.
			//Check to make sure we're not leaving the bounds of the list
			if (tabKeyIndex-1>0){
				tabKeyIndex-=1;
			}
			//If we're closing a window with only one tab left, move to the previous list.
			if (tabList.length===0){
				//Remove the list from the popup
				//If we're at the front of the list, we move to the window below it.
				if (windowKeyIndex===0){
					tabList = createTabList(mainList, windowKeyIndex);
					tabKeyIndex=0;
				}
				//Otherwise, we move up one.
				if (windowKeyIndex>0){
					windowKeyIndex-=1;
					tabList = createTabList(mainList, windowKeyIndex);
					tabKeyIndex=tabList.length-1;
				}	
			}
			tabList[tabKeyIndex].classList.add('keyHover');
		}
		//Pin when p is pressed
		else if(event.keyCode===80){
			tabList[tabKeyIndex].querySelector('i.pin').click();
		}
		//Go to search box when s is pressed.
		else if (event.keyCode===83){
			event.preventDefault();
			scrollTo(0, 0);
			filterInput.focus();
		}
	});
});