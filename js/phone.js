$("#callStatus ,#callAnswer ,#hangUp ,#takeCall").addClass('d-none');
document.getElementById("status").innerHTML = "not active";

var ua;
var session;

JsSIP.debug.enable('JsSIP:*'); // JsSIP Debugger

// connect to the asterisk server
var socket = new JsSIP.WebSocketInterface('wss://' + asteriskIp + ':8089/ws');
configuration = {
    sockets:          [socket],
    'uri':            'sip:' + asteriskUser + '@' + asteriskIp,
    'password':       asteriskUserPass,
};

// audioStream
var remoteAudio = new window.Audio();
remoteAudio.autoplay = true;

// call options vor call() and answer()
var options = {
    'mediaConstraints' : { 'audio': true, 'video': false }
};

// new user agent
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

// new session for outbound and inbound calls
ua.on('newRTCSession', function (e) { 
    document.getElementById("status").innerHTML = "new rtc session";
    
    var newSession = e.session;
    session = newSession;

    // calling number for inbound call 
    var remote_identity_uri = session.remote_identity.uri.toString() ;
    var pos = remote_identity_uri.lastIndexOf('@');
    remote_identity_uri = remote_identity_uri.slice(4, pos);

    // call ended normally
    session.on('ended', function(e) {
        document.getElementById("status").innerHTML = "call ended";
        $("#callControl ,#connectCall").removeClass('d-none'); // updateUI
        $("#callStatus, #callAnswer, #hangUp").addClass('d-none');  // updateUI
        ringTone.pause();
        session = null;       
    });

    // call failed
    session.on('failed', function(e) {
        document.getElementById("status").innerHTML = "call failed";
        $("#callControl, #connectCall").removeClass('d-none'); // updateUI
        $("#callStatus, #callAnswer, #hangUp").addClass('d-none');  // updateUI
        ringTone.pause(); // stop ringtone for inbound calls
        session = null;
    });

    // call accepted
    session.on('accepted', function(e) {
        var starttime = session.start_time;
        document.getElementById("status").innerHTML = starttime; // starttime fired after accepted
        ringTone.pause(); // stop ringtone for inbound calls
    });

    // audioStream for outbound call
    session.on('connecting', audioStream);
    // audioStream for inbound call
    session.on('peerconnection', audioStream);

    // call confirmed
    session.on('confirmed', function(e) {
        ringTone.pause(); // stop ringtone for inbound calls
    });

    // incomming call
    if(session.direction == 'incoming') {
        document.getElementById("incommingNumber").innerHTML = "<i class='fas fa-phone-volume'>&nbsp;&nbsp;&nbsp;</i>" + remote_identity_uri;
        ringTone.play(); // stop ringtone for inbound alls
        $("#callControl ,#callStatus, #connectCall ,#callingNumber").addClass('d-none'); // updateUI
        $("#callAnswer ,#takeCall").removeClass('d-none'); // updateUI
    } 
});
// user agent start
ua.start();

// add audioStream
function audioStream() {
    session.connection.ontrack = function(e) {
        remoteAudio.srcObject = e.streams[0];
    }; 
}

$('#connectCall').click(function () {
    let callingNumber = $('#callNumber').val();
    document.getElementById("callingNumber").innerHTML = callingNumber;
    $("#callControl ,#connectCall").addClass('d-none'); // updateUI
    $("#callStatus ,#hangUp").removeClass('d-none'); // updateUI
    ua.call(callingNumber, options); // call()
});

$('#takeCall').click(function () {
    document.getElementById("status").innerHTML = "call accepted!";
    $("#hangUp").removeClass('d-none'); // updateUI
    $("#takeCall").addClass('d-none'); // updateUI
    session.answer(options); // answer()
    ringTone.pause(); // stop ringtone for inbound calls
});

$('#hangUp').click(function () {
    $("#callControl ,#connectCall").removeClass('d-none'); // updateUI
    $("#callStatus ,#hangUp").addClass('d-none'); // updateUI
    session.terminate(); // terminate session
});


