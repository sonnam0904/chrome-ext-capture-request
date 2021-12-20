let color = '#3aa757';
let connections = {};
let log = {};
let settings = {};
let trace_id = '';
let port='';
chrome.runtime.onInstalled.addListener(() => {
  console.log('%cWelcome Bizfly Extension', `color: ${color}`);
});
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(request.request);

	//console.log(sender);
	switch(request.cmd) {
		case 'init':
			trace_id = createUUID();
			
			chrome.storage.local.set({key: trace_id}, function() {
			  console.log('Value is set to ' + trace_id);
			});
			port = request.tabId;
			log[port] = [];
			sendResponse({
				msg: "[Bizfly] Chúng tôi đang kiểm tra ứng dụng chạy trên trình duyệt của quý khách, thông tin của quý khách được chúng tôi cam kết bảo mật và không chia sẻ cho bất kỳ ứng dụng nào khác.",
				data: {
					trace_id: trace_id
				}
			});
			break;
			
		case 'request_finished':
			//console.log(port, request.request);
			addRequest(port, request.request)
			sendResponse({
				msg: "["+request.request._priority+"][Bizfly] Đang duyệt: "+ request.request.request.url,
				data: {
					trace_id: trace_id
				}
			});
			break;

		case 'navigated':
			console.log('Đã chuyển hướng: ' + request.url);
			send_log(port);
			
			break;
	}
  }
);

function send_log(port) {
    if (!log[port].length) {
        return;
    }

    var har = {
        log: {
            version: '1.2',
            creator: {
                name: "WebInspector",
                version: "537.36"
            },
            pages: [],
            entries: log[port]
        }
    };

    const dataURI = "data:application/json;base64," + JSON.stringify(har, null, 2).toBase64();
	// send log
	console.log('Data thu thập được', trace_id, dataURI);
	log[port] = [];
	trace_id = '';
}

function addRequest(port, request) {
    const content = request.response.content;
	
    if (content.size > 0) {
		//if (request._resourceType=='document'){
			//request.request.headers.forEach(element => console.log(element));
		//}
        if (content.text && !content.encoding && needsEncoding(content.text)) {
            // console.log("needs encoding!", content.text)
            request.response.content.text = content.text.toBase64();
            request.response.content.encoding = 'base64';
        }
    }
	
    log[port].push(request);
}

function createUUID() {
   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
   });
}

String.prototype.toBase64 = function () {
    /**
     * @param {number} b
     * @return {number}
     */
    function encodeBits(b) {
        return b < 26 ? b + 65 : b < 52 ? b + 71 : b < 62 ? b - 4 : b === 62 ? 43 : b === 63 ? 47 : 65;
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(this.toString());
    const n = data.length;
    let encoded = '';
    if (n === 0)
        return encoded;
    let shift;
    let v = 0;
    for (let i = 0; i < n; i++) {
        shift = i % 3;
        v |= data[i] << (16 >>> shift & 24);
        if (shift === 2) {
            encoded += String.fromCharCode(
                encodeBits(v >>> 18 & 63), encodeBits(v >>> 12 & 63), encodeBits(v >>> 6 & 63), encodeBits(v & 63));
            v = 0;
        }
    }
    if (shift === 0)
        encoded += String.fromCharCode(encodeBits(v >>> 18 & 63), encodeBits(v >>> 12 & 63), 61, 61);
    else if (shift === 1)
        encoded += String.fromCharCode(encodeBits(v >>> 18 & 63), encodeBits(v >>> 12 & 63), encodeBits(v >>> 6 & 63), 61);
    return encoded;
};

function isValidCharacter(code_point) {
    // Excludes non-characters (U+FDD0..U+FDEF, and all codepoints ending in
    // 0xFFFE or 0xFFFF) from the set of valid code points.
    return code_point < 0xD800 || (code_point >= 0xE000 && code_point < 0xFDD0) ||
        (code_point > 0xFDEF && code_point <= 0x10FFFF && (code_point & 0xFFFE) !== 0xFFFE);
}

function needsEncoding(content) {
    for (let i = 0; i < content.length; i++) {
      if (!isValidCharacter(content.charCodeAt(i)))
        return true;
    }

    return false;
}