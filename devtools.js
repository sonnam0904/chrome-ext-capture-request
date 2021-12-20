var backgroundPageConnection = chrome.runtime.connect({
	name: "devtools-page"
});

backgroundPageConnection.onMessage.addListener(function (message) {
	// Handle responses from the background page, if any
	
});

// Relay the tab ID to the background page
backgroundPageConnection.postMessage({
	tabId: chrome.devtools.inspectedWindow.tabId,
	scriptToInject: "content_script.js"
});

const trace = {
    log: function(...args) {
        const escaped = args.map(JSON.stringify).join(",");
        chrome.devtools.inspectedWindow.eval(`console.info(${escaped});`);
    },
};


chrome.runtime.sendMessage({
    cmd: 'init',
	tabId: chrome.devtools.inspectedWindow.tabId
}, function(response) {
    trace.log(response.msg);
	trace.log('Đây là mã debug của bạn, vui lòng copy và gửi cho chúng tôi báo lỗi: %c'+response.data.trace_id, 'background: #222; color: #bada55; padding:5px');
});


chrome.devtools.network.onRequestFinished.addListener(function(request) {

    if (request.response.status == 0) {
        return;
    }

    const mimeType = request.response.content.mimeType;
    if (mimeType.startsWith('text/css') || mimeType.startsWith('image/') || mimeType.startsWith('font/')) {
        return;
    }

	request.getContent((content, encoding) => {

		if (chrome.runtime.lastError) {
			trace.log(chrome.runtime.lastError);
		}

		if (content) {
			delete request.response.content.comment;
			request.response.content.text = content;

			if (encoding) {
				request.response.content.encoding = encoding;
			}
		}
		
		chrome.runtime.sendMessage({
			cmd: 'request_finished',
			request: request
		}, function(response) {
			trace.log(response.msg);
		});

	});
});

chrome.devtools.network.onNavigated.addListener(function(url) {
    trace.log("[Bizfly] Chuyển hướng sang URL: ", url);

	chrome.runtime.sendMessage({
		cmd: 'navigated',
		url: url
	});
});
