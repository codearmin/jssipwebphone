$("#callStatus").addClass('d-none');
$("#callAnswer").addClass('d-none');
document.getElementById("status").innerHTML = "not active";

var ua;
var session;

JsSIP.debug.enable('JsSIP:*'); // JsSIP Debugger

// + + + + + Start Call Funktionen  + + + + + 
var socket = new JsSIP.WebSocketInterface('wss://' + asteriskIp + ':8089/ws');
configuration = {
    sockets:          [socket],
    'uri':            'sip:' + asteriskUser + '@' + asteriskIp,
    'password':       asteriskUserPass,
};

var remoteAudio = new window.Audio();
remoteAudio.autoplay = true;

var options = {
    'mediaConstraints' : { 'audio': true, 'video': false }
};

ua = new JsSIP.UA(configuration);

ua.on('connected', function(e) {
    document.getElementById("user-status").innerHTML = "connected";
});

ua.on('disconnected', function(e) {
    document.getElementById("user-status").innerHTML = "disconnected";
});

ua.on('registered', function(e) {
    document.getElementById("user-status").innerHTML = "registered";
});

ua.on('registrationFailed', function(e) {
    document.getElementById("user-status").innerHTML = "Registering on SIP server failed with error: " + e.cause;
});

ua.on('newRTCSession', function (e) { // new session for outbound and inbound calls
    document.getElementById("status").innerHTML = "new rtc session";

    var newSession = e.session;
    session = newSession;

    session.on('ended', function(e) {
        document.getElementById("status").innerHTML = "call ended";
        $("#callControl").removeClass('d-none');
        $("#callStatus").addClass('d-none'); 
        $("#callAnswer").addClass('d-none');
        ringTone.pause();
        session = null;       
    });

    session.on('failed', function(e) {
        document.getElementById("status").innerHTML = "call failed";
        $("#callControl").removeClass('d-none');
        $("#callStatus").addClass('d-none'); 
        $("#callAnswer").addClass('d-none');
        ringTone.pause();
        session = null;
    });

    session.on('accepted', function(e) {
        document.getElementById("status").innerHTML = "call accepted";
        ringTone.pause();
    });

    session.on('peerconnection', audioStream);

    session.on('confirmed', function(e) {
        document.getElementById("status").innerHTML = "call confirmed";
        ringTone.pause();
    });

    if(session.direction == 'incoming') {
        document.getElementById("status").innerHTML = "incomming call";
        ringTone.play();
        $("#callControl").addClass('d-none');
        $("#callStatus").addClass('d-none');
        $("#callAnswer").removeClass('d-none'); 
    } 
});

ua.start();

function audioStream() {
    session.connection.ontrack = function(e) {
        remoteAudio.srcObject = e.streams[0];
    }; 
}

$('#connectCall').click(function () {
    let callingNumber = $('#callNumber').val();
    document.getElementById("callingNumber").innerHTML = callingNumber;
    $("#callControl").addClass('d-none');
    $("#callStatus").removeClass('d-none'); 
    ua.call(callingNumber, options);
});

$('#takeCall').click(function () {
    document.getElementById("status").innerHTML = "call accepted!";
    $("#callControl").addClass('d-none');
    $("#callStatus").removeClass('d-none'); 
    $("#callAnswer").addClass('d-none');
    session.answer(options);
    ringTone.pause();
});

$('#hangUp').click(function () {
    $("#callControl").removeClass('d-none');
    $("#callStatus").addClass('d-none');
    session.terminate();
});


