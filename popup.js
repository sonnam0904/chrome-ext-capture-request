let startDebug = document.getElementById("startDebug");

startDebug.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: setDebug,
  });
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: async () => {

	  // While we could have used `let url = "hello.html"`, using runtime.getURL is a bit more robust as
	  // it returns a full URL rather than just a path that Chrome needs to be resolved contextually at
	  // runtime.
	    let url = chrome.runtime.getURL("devtools.html");
      
		//window.open(url);
	},
  });
});

// current page
function setDebug() {
  
  chrome.storage.local.get(['key'], function(result) {
		if (typeof result.key !=='undefined'){
			alert('Mã Debug của bạn là: '+result.key);
		}
		else {
			alert('Vui lòng bấm F12 để bắt đầu');
		}
	});
}





