var chunkLength = 1000;
var transferid;
var max;
function onReadAsDataURL(event, text) {
    var data = {}; // data object to transmit over data channel

    if (event) {
        text = event.target.result; // on first invocation
        data.first = true;
        transferid = Math.round((new Date()).getTime());
        max = text.length;
        transferbar(max, text.length, "Yo", transferid);
    }

    if (text.length > chunkLength) {
        data.message = text.slice(0, chunkLength); // getting chunk using predefined chunk length
        data.type = 7;
        data.current = text.length;
        data.name = peer.label;
        data.transferid = transferid;
    } else {
        data.message = text;
        data.last = true;
        data.type = 7;
        data.current = text.length;
        data.name = peer.label;
        data.transferid = transferid;
    }
    for (i = 0; i < conns.length; i++) {
        conns[i].send(JSON.stringify(data)); // use JSON.stringify for chrome!
    }

    var remainingDataURL = text.slice(data.message.length);
    if (remainingDataURL.length) setTimeout(function () {
        transferbar(max, remainingDataURL.length, "Yo", transferid);
        onReadAsDataURL(null, remainingDataURL); // continue transmitting
    }, 100)
}
function saveToDisk(fileUrl, fileName, transferid) {
    var save = document.createElement('a');
    save.href = fileUrl;
    save.target = '_blank';
    save.download = fileName || fileUrl;

    var event = document.createEvent('Event');
    event.initEvent('click', true, true);
    $('#message[data-transfer-id="' + transferid + '"]').children("#text").html('<img src="' + fileUrl + '" id="dataimage"></iframe>');
    //save.dispatchEvent(event);
    //(window.URL || window.webkitURL).revokeObjectURL(save.href);
}
function transferbar (max, current, name, transferid) {
    if($("#message[data-transfer-id='"+ transferid + "']").html() == undefined){
        if(name != "Yo") {
            $('<div id="message" data-transfer-id="' + transferid + '" style="border-top-left-radius: 0px; float: left;"><div style="height: 5px;"><div id="author">' + name + '</div></div><br><div id="text"><progress id="file-progress" value="' + (max-current) + '" max="' + max + '"></progress></div></div>').insertBefore(".bottom");
        } else {
            $('<div id="message" data-transfer-id="' + transferid + '" style="float: right; border-bottom-right-radius: 0px;"><div style="height: 5px;"><div id="author">' + name + '</div></div><br><div id="text"><progress id="file-progress" value="' + (max-current) + '" max="' + max + '"></progress></div></div>').insertBefore(".bottom");      
        }
    } else {
            $("#message[data-transfer-id='"+ transferid +"']").children("#text").children("progress").attr("value", (max-current));
    }
}