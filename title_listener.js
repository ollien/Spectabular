var title = document.querySelector("title");
if (title!=null){
	var observer = new MutationObserver(function(mutations){
		mutations.forEach(function(mutation){
			if (mutation.addedNodes.length===1 && mutation.removedNodes.length===1){
				var newTitle = mutation.addedNodes[0].nodeValue;
				var oldTitle = mutation.removedNodes[0].nodeValue;
				chrome.runtime.sendMessage({"titleChange":{"newTitle":newTitle,"oldTitle":oldTitle}});
			}
		});
	});
	observer.observe(title,{childList:true,characterData:true,characterDataOldValue:true});
}