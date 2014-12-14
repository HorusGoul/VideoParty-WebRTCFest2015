// Language things
var language = "english_en";
var langData = $.ajax({
    "async": false,
    "global": false,
    "url": "languages/" + language + ".json",
    "dataType": "json",
    "success": function (data) {
        return data;
    }
}).responseJSON[language];

for (i = 0; i < langData["register"]["desc"].length; i++) {
    $("#register-desc[data-desc-value='" + i + "']").html(langData["register"]["desc"][i]);
}
for (i = 0; i < langData["register"]["placeholder"].length; i++) {
    $("[data-input-value='" + i + "']").attr("placeholder", langData["register"]["placeholder"][i]);
}
for (i = 0; i < langData["menu"]["button"].length; i++) {
    $("[data-menu-button-value='" + i + "']").children().html(langData["menu"]["button"][i]);
}
$("#optionsmodal").children("#cancel").html(langData["optionsmodal"]["basic"]["cancel"]);
$("#text-message").attr("placeholder", langData["messages"]["form"]["placeholder"]);
$("#search-contact").children().attr("placeholder", langData["contacts"]["form"]["placeholder"]);
for (i = 0; i < langData["profile"]["title"].length; i++) {
    $("[data-profile-title-value='" + i + "']").html(langData["profile"]["title"][i]);
}

// Register if you're a new user
if (!localStorage.userid || !localStorage.secretcode || !localStorage.secretid || !localStorage.rn || !localStorage.id || !localStorage.desc) {

    var register;
    var register2;
    var secretid;
    var userid;
    var desc;
    var avatar;
    toggleRegister("register", 0);
    $("#register-form button").on("click", function () {

        registerUser = $("#register-user").val();
        registerSecretcode = $("#register-secret-code").val();

        if (registerUser.length > 0 || registerSecretcode > 0) {
            localStorage.userid = registerUser;
            localStorage.useridperm = registerUser;
            localStorage.secretcode = registerSecretcode;
            localStorage.secretid = generateUsername(localStorage.useridperm, localStorage.secretcode);
            localStorage.rn = Math.floor(localStorage.secretid);
            localStorage.id = localStorage.useridperm + localStorage.rn;
            toggleRegister("register", 1);
            setTimeout(function () {
                toggleRegister("register2", 0);
                $("#register2-form button").on("click", function () {
                    registerAvatar = $("#register-avatar").val();
                    registerBio = $("#register-bio").val();
                    if (registerBio.length == 0) {
                        registerBio = langData["register"]["basic"][0];
                    }
                    localStorage.avatar = registerAvatar;
                    localStorage.desc = registerBio;
                    localStorage.agenda = [];
                    secretid = localStorage.secretid;
                    userid = localStorage.id;
                    desc = localStorage.desc;
                    avatar = localStorage.avatar;
                    startApp();
                    return toggleRegister("register2", 1);
                });
            }, 500);

        }

    });

} else {
    startApp();
}

function startApp() {

    var secretid = localStorage.secretid;
    var userid = localStorage.id;
    var desc = localStorage.desc;
    var avatar = localStorage.avatar;
    var agenda = [];
    if (localStorage.agenda.length != 0) {

        agenda = JSON.parse(localStorage.agenda);

    }

    // Create our peer
    var peer = new Peer(userid, {

        key: "g05e87nxvr1cerk9",
        debug: 3

    });

    // Connection opened. You will can change your password in a future.
    peer.on("open", function (id) {

        console.log("My peer id is " + id);
        peer.label = localStorage.userid;
        peer.password = "videoparty";
        $("#id").append("<b>" + peer.label + "</b><br><i>" + id + "</i>");
        history.pushState(null, null, "?peer=" + id + "&pw=" + peer.password);

    });

    // Check if the url has a parameter. If all is correct, try to connect to peer defined in the url parameters.
    if (getUrlVars()["peer"] != undefined && getUrlVars()["pw"] != undefined) {

        if (getUrlVars()["peer"] != userid) {

            var c = peer.connect(getUrlVars()["peer"], {
                metadata: {
                    password: getUrlVars()["pw"],
                    from: peer.id
                }
            });
            c.on("open", function () {
                conexion(c);
            });
            c.on("error", function (error) {
                console.log(error);
            });

        }

    }
    // Call function conexion when a connection is detected.
    peer.on("connection", conexion);

    // General variables
    var conn;
    var conns = [];
    var connsid = [];
    var playing = false;
    var chat = false;
    var menu = false;
    var contacts = false;
    var container = true;
    var inchat = false;
    var chevronleft = false;
    var profile = false;
    var profilewaiting = false;
    var chatAttach = false;
    var arrayToStoreChunks = [];
    var player = {};
    var notifycount = 0;
    var max;

    function conexion(c, p) {

        conn = c;
        conns.push(c);
        connsid.push(c.peer);

        if (conn.open == false) {
            conn.on("open", function () {

                verifyConnection();

            });

        } else {
            verifyConnection(p);

        }

        // When you receive data, it will be filtered.
        // By example, data type 0 is a chat message.
        conn.on("data", function (data) {
            console.log("Received", data);

            if (data.type == undefined) {
                data = JSON.parse(data);
            }

            // It's the data for propagate the connections, If one of the peers received isn't in your list It will add it.
            if (data.type == 1) {
                if (data.wot != peer.id) {
                    if (connsid.indexOf(data.wot) == -1) {
                        var w = peer.connect(data.wot, {
                            label: data.name,
                            metadata: {
                                name: data.name,
                                password: data.password,
                                from: peer.id
                            }
                        });
                        conn = w;
                        conns.push(w);
                        connsid.push(w.peer);
                        for (i = 0; i < conns.length; i++) {
                            if (conns[i].options._payload) {
                                conns.splice(i, 1);
                                connsid.splice(i, 1);
                            }
                        }
                    }
                }
            }

            // Chat messages
            if (data.type == 0) {
                $('<div id="message" style="border-top-left-radius: 0px; float: left;"><div style="height: 5px;"><div id="author">' + data.name + '</div><div id="time">' + data.time + '</div></div><br><div id="text">' + data.message + '</div></div>').insertBefore(".bottom");

                emojify.run();
                var scrollH = $("#messages")[0].scrollHeight;
                $("#messages").scrollTop(scrollH);
                $("#chatvideo").on("click", function () {

                    var authorValue = $(this).attr("data-author-value");
                    for (i = 0; i < conns.length; i++) {
                        if (conns[i].peer == authorValue) {
                            conns[i].send({
                                type: 4,
                                from: peer.id
                            });
                        }
                    }

                });

            }

            // Videos
            if (data.type == 2) {
                $("#yt-container").append('<iframe id="ytplayer" width="100%" height="314" src="' + data.video + '" frameborder="0" allowfullscreen></iframe>');
                createPlayer();
                setTimeout(function () {
                    toggle("youtube", 0);
                }, 700);

            }

            // R.I.P data.type == 3

            // Somebody is asking for the video url that we are playing, we make the url and return it with the currently time video.
            if (data.type == 4) {
                if (profilewaiting == true) {

                    toggle("profile", 1);
                    toggle("chevronleft", 1);
                    profilewaiting = false;

                }
                if (profile == true) {

                    toggle("profile", 1);

                }
                if (inchat == true) {

                    toggle("inchat", 1);

                }
                if (contacts == true) {
                    toggle("contacts", 1);
                }
                if (playing == true) {
                    var iframesrc = $("#yt-container iframe").attr("src");
                    var videoid = player.ytplayer.getVideoData().video_id;
                    var list = getYoutubeURLParams(iframesrc)["list"];

                    if (videoid && !list) {
                        embed = "//www.youtube.com/embed/" + videoid + "?";
                    } else if (videoid && list) {
                        embed = "//www.youtube.com/embed/" + videoid + "?list=" + list + "&";
                    } else if (!videoid && list) {
                        embed = "//www.youtube.com/embed/videoseries?list=" + list + "&";
                    }
                    var video = embed + "enablejsapi=1&autoplay=1&playerapiid=ytplayer&start=" + Math.floor(player.ytplayer.getCurrentTime());
                    for (i = 0; i < conns.length; i++) {

                        if (conns[i].peer == data.from) {

                            conns[i].send({
                                type: 2,
                                video: video
                            });
                        }

                    }

                }

            }

            // If the password we introduced is wrong, close the connection.
            if (data.type == 5) {

                for (i = 0; i < conns.length; i++) {

                    if (conns[i].peer == data.from) {

                        conns.splice(i, 1);
                        conns[i].close();

                    }

                }

            }

            // Authorize connection
            if (data.type == 6) {

                // Get his name
                for (i = 0; i < conns.length; i++) {

                    if (data.from == conns[i].peer) {
                        conns[i].metadata.name = data.name;
                    }

                }

                // Show the chat if we're in the index.
                if (contacts == false && playing == false && inchat == false) {
                    toggle("menu", 1);
                    toggle("chat", 0);
                }

                // Check if somebody is playing a video
                conn.send({
                    type: 9,
                    from: peer.id
                });

            }

            // Somebody is asking for see your profile, send the data.
            if (data.type == 7) {

                for (i = 0; i < conns.length; i++) {
                    if (data.from == conns[i].peer) {
                        myProfile = {
                            type: 8,
                            from: peer.id,
                            avatar: avatar,
                            desc: desc,
                            name: peer.label
                        };
                        conns[i].send(myProfile);
                    }
                }

            }


            // Receive the profile data and if you was waiting for these data, show the profile.
            if (data.type == 8 && profilewaiting == true) {

                if (inchat == true) {

                    toggle("inchat", 1);

                }
                $("#profile-name").html(data.name);
                $("#profile-id").html(data.from);
                $("#profile-desc").html(data.desc);
                $("#profile-state").css({
                    "background": "url(" + data.avatar + ") no-repeat",
                    "background-size": "cover"
                });
                setTimeout(function () {
                    toggle("profile", 0);
                    toggle("chevronleft", 0);
                }, 600);
                $("#profile-settings").on("click", function () {
                    for (i = 0; i < agenda.length; i++) {
                        if (agenda[i].id == data.from) {
                            inAgenda = true;
                            continue;
                        } else {
                            inAgenda = false;
                        }
                    }
                    if (!inAgenda) {
                        $("#options").html('<button id="option" data-option-value="0">' + langData["optionsmodal"]["basic"]["contactadd"] + '</button>');
                        toggle("optionsmodal", 0);
                        $("#option[data-option-value='0']").on("click", function () {
                            contactId = data.from;
                            contactName = data.name;
                            agenda.push({

                                id: contactId,
                                name: contactName

                            });
                            localStorage.agenda = JSON.stringify(agenda);
                            return toggle("optionsmodal", 1);
                        });
                        $(".black").on("click", function () {
                            toggle("optionsmodal", 1);
                        });
                        $("#cancel").on("click", function () {
                            toggle("optionsmodal", 1);
                        });
                    } else {
                        $("#options").html('<button id="option" data-option-value="0">' + langData["optionsmodal"]["basic"]["contactremove"] + '</button>');
                        toggle("optionsmodal", 0);
                        $("#option[data-option-value='0']").on("click", function () {
                            for (i = 0; i < agenda.length; i++) {
                                if (data.from == agenda[i].id) {
                                    agenda.splice(i, 1);
                                }
                            }
                            return toggle("optionsmodal", 1);
                        });
                        $(".black").on("click", function () {
                            toggle("optionsmodal", 1);
                        });
                        $("#cancel").on("click", function () {
                            toggle("optionsmodal", 1);
                        });
                    }

                });

            }

            // Somebody check If you are watching any video in the app.
            if (data.type == 9) {

                if (playing == true) {

                    for (i = 0; i < conns.length; i++) {

                        if (conns[i].peer == data.from) {
                            conns[i].send({
                                type: 10,
                                from: peer.id
                            });
                        }

                    }

                }

            }

            // You sended that you're watching a video, then in his app will appear a notification
            if (data.type == 10) {

                notify("onvideo", data.from);

            }

        });

        // If a connection leave the chat, remove it.
        conn.on("close", function () {


            for (i = 0; i < conns.length; i++) {

                if (conns[i].peer == conn.peer) {
                    conns.splice(i, 1);
                    connsid.splice(i, 1);
                }

            }
            if (conns.length == 0) {
                toggle("chat", 1);
            }

        });
    }

    // The interval is for expand the connections to new peers that connected you.
    setInterval(function () {

        if (conn != undefined) {

            if (conn.open == true) {

                for (i = 0; i < conns.length; i++) {

                    for (x = 0; x < conns.length; x++) {

                        var comp = {
                            type: 1,
                            wot: conns[x].peer,
                            name: conns[x].metadata.name,
                            password: conns[x].metadata.password,
                            from: peer.id
                        };
                        if (conns[i].peer != conns[x].peer) {
                            conns[i].send(comp);
                        }

                    }

                }

            }

        }

    }, 5000);

    // Get the parameters of the URL
    function getUrlVars() {

        var vars = {};
        var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
            vars[key] = value;
        });
        return vars;

    }

    // EMOJIS, Work in progress...
    emojify.setConfig({

        emojify_tag_type: 'img',
        only_crawl_id: null,
        img_dir: 'images/emoji',
        ignored_tags: {

            'SCRIPT': 1,
            'TEXTAREA': 1,
            'A': 1,
            'PRE': 1,
            'CODE': 1

        }

    });

    // Menu button
    $("#menu").on("click", function () {

        if (menu == true) {

            toggle("menu", 1);

        } else {

            toggle("menu", 0);

        }

    });

    // Youtube video button
    $("#attach-youtube").on("click", function () {

        if (playing == false) {

            newModal("youtubeUrlModal", langData["modal"]["youtube"]["title"], '<input type="url" placeholder="' + langData["modal"]["youtube"]["placeholder"][0] + '" id="youtubeUrl">', 1);
            $("#option[data-option-value='0']").on("click", function () {

                var video = $("#youtubeUrl").val();
                var idvideo = getYoutubeURLParams(video)["v"];
                var list = getYoutubeURLParams(video)["list"];
                if (idvideo && !list) {
                    var params = idvideo + "?";
                } else if (idvideo && list) {
                    var params = idvideo + "?list=" + list + "&";
                } else {
                    return alert("MAS FALSO QE FALSIN");
                }
                var embed = "//www.youtube.com/embed/" + params + "enablejsapi=1&autoplay=1&playerapiid=ytplayer";
                $("#yt-container").append('<iframe id="ytplayer" width="100%" height="314" src="' + embed + '" frameborder="0" allowfullscreen></iframe>');
                createPlayer();
                var messagevideo = '<button id="chatvideo" data-author-value="' + peer.id + '">' + langData["modal"]["youtube"]["button"] + '</button>';
                var date = new Date();
                var h = date.getHours();
                var m = date.getMinutes();
                var time = h + ":" + m;
                for (i = 0; i < conns.length; i++) {
                    var comp = {
                        type: 0,
                        peer: peer.id,
                        time: time,
                        message: messagevideo,
                        name: peer.label
                    };

                    conns[i].send(comp);

                }

                setTimeout(function () {

                    toggle("youtube", 0);
                    toggle("messages-attach", 1);
                    toggle("optionsmodal", 1);
                    $(".modal").fadeOut(500);
                    setTimeout(function () {
                        $("#youtubeModal").remove();
                    }, 500);

                }, 700);
                toggle("menu", 1);
            });
            $("#cancel").on("click", function () {

                toggle("optionsmodal", 1);
                $(".modal").fadeOut(500);
                setTimeout(function () {
                    $("#youtubeModal").remove();
                }, 500);

            });
            $(".black").on("click", function () {
                toggle("optionsmodal", 1);
                $(".modal").fadeOut(500);
                setTimeout(function () {
                    $("#youtubeModal").remove();
                }, 500);
            });


        }

    });

    // Connection button.
    $("#connect").on("click", function () {

        newModal("connectModal", langData["modal"]["connect"]["title"], '<input type="text" placeholder="' + langData["modal"]["connect"]["placeholder"][0] + '" id="connectInput"><br><input type="text" placeholder="' + langData["modal"]["connect"]["placeholder"][1] + '" id="connectPassword">', 1);

        $("#option[data-option-value='0']").on("click", function () {

            var c = peer.connect($("#connectInput").val(), {
                metadata: {
                    password: $("#connectPassword").val(),
                    from: peer.id
                }
            });
            toggle("optionsmodal", 1);
            $(".modal").fadeOut(500);
            setTimeout(function () {
                $("#connectModal").remove();
            }, 500);
            c.on("open", function () {
                conexion(c, true);
            });
            c.on("error", function (error) {
                console.log(error);
            });

        });
        $("#cancel").on("click", function () {

            toggle("optionsmodal", 1);
            $(".modal").fadeOut(500);
            setTimeout(function () {
                $("#connectModal").remove();
            }, 500);

        });
        $(".black").on("click", function () {
            toggle("optionsmodal", 1);
            $(".modal").fadeOut(500);
            setTimeout(function () {
                $("#connectModal").remove();
            }, 500);
        });

    });

    // Send messages button
    $("#send-message").on("click", function () {
        if ($.trim($("#text-message").val().replace(" ", "")).length > 0) {
            sendMessage();
        } else {
            if (!playing) {
                if (chatAttach == false) {
                    toggle("chat-attach", 0);
                } else {
                    toggle("chat-attach", 1);
                }
            }
        }
    });
    $("#messages-attach button").on("click", function () {

        toggle("chat-attach", 1);

    });
    // Send messages with enter key
    $(document).keypress(function (e) {

        if (e.which == 13) {

            e.preventDefault();
            sendMessage();

        }

    });

    // Prompt for copy your peer id. It need an update
    $("#id").on("click", function () {

        prompt("You can copy the id or directly use the url", $("#id i").html());

    });

    // Chat textarea autosize.
    $("#text-message").on("focus", function () {

        $("#text-message").autosize();
        if ($("#text-message").val().length > 0) {
            $("#send-message").css("background", "url(images/icons/svg/send.svg) no-repeat 50% 50%");
        } else {
            $("#send-message").css("background", "url(images/icons/svg/attachment.svg) no-repeat 50% 50%");
        }
    });
    $("#text-message").focusout(function () {
        $("#text-message").trigger('autosize.destroy');
        $("#text-message").scrollTop($("#text-message")[0].scrollHeight);
        if ($("#text-message").val().length > 0) {
            $("#send-message").css("background", "url(images/icons/svg/send.svg) no-repeat 50% 50%");
        } else {
            $("#send-message").css("background", "url(images/icons/svg/attachment.svg) no-repeat 50% 50%");
        }
    });
    $("textarea#text-message").keyup(function () {
        if ($("#text-message").val().length > 0) {
            $("#send-message").css("background", "url(images/icons/svg/send.svg) no-repeat 50% 50%");
        } else {
            $("#send-message").css("background", "url(images/icons/svg/attachment.svg) no-repeat 50% 50%");
        }
    });

    // Add contacts to localStorage
    $("#new-contact-btn").on("click", function () {

        newModal("addContactModal", langData["modal"]["addcontact"]["title"], '<input type="text" placeholder="' + langData["modal"]["addcontact"]["placeholder"][0] + '" id="addcontact-name"><br><input type="text" placeholder="' + langData["modal"]["addcontact"]["placeholder"][1] + '" id="addcontact-id">', 1);

        $("#option[data-option-value='0']").on("click", function () {

            contactId = $("#addcontact-id").val();
            contactName = $("#addcontact-name").val();
            agenda.push({

                id: contactId,
                name: contactName

            });
            localStorage.agenda = JSON.stringify(agenda);
            $("* #contact").remove();
            for (i = 0; i < agenda.length; i++) {

                $("#contacts").append('<div id="contact"><button id="contact-delete"></button><div id="contact-status"></div><div id="contact-name" data-contact-name="' + agenda[i].name + '">' + agenda[i].name + '</div><br><div id="contact-id">' + agenda[i].id + '</div></div>');


                $("* #contact-delete").on("click", function () {
                    contactId = $(this).parent().children("#contact-id").html();
                    for (i = 0; i < agenda.length; i++) {
                        if (agenda[i].id == contactId) {
                            agenda.splice(i, 1);
                        }
                    }
                    localStorage.agenda = JSON.stringify(agenda);
                    $(this).parent().remove();
                    return;
                });
            }
            toggle("optionsmodal", 1);
            $(".modal").fadeOut(500);
            setTimeout(function () {
                $("#addContactModal").remove();
            }, 500);

        });
        $("#cancel").on("click", function () {

            toggle("optionsmodal", 1);
            $(".modal").fadeOut(500);
            setTimeout(function () {
                $("#addContactModal").remove();
            }, 500);

        });
        $(".black").on("click", function () {
            toggle("optionsmodal", 1);
            $(".modal").fadeOut(500);
            setTimeout(function () {
                $("#addContactModal").remove();
            }, 500);
        });

    });

    // Open the contact list.
    $("#contactsbtn").on("click", function () {
        if (profilewaiting == true) {

            toggle("profile", 1);
            toggle("chevronleft", 1);
            profilewaiting = false;

        }
        if (profile == true) {

            toggle("profile", 1);

        }
        if (inchat == true) {

            toggle("inchat", 1);

        }
        if (playing == true) {

            toggle("youtube", 1);

        }
        if (contacts == false) {

            if (localStorage.agenda.length >= 0) {

                for (i = 0; i < agenda.length; i++) {

                    $("#contacts").append('<div id="contact"><button id="contact-delete"></button><div id="contact-status"></div><div id="contact-name" data-contact-name="' + agenda[i].name + '">' + agenda[i].name + '</div><br><div id="contact-id">' + agenda[i].id + '</div></div>');

                    $("* #contact-delete").on("click", function () {
                        contactId = $(this).parent().children("#contact-id").html();
                        for (i = 0; i < agenda.length; i++) {
                            if (agenda[i].id == contactId) {
                                agenda.splice(i, 1);
                            }
                        }
                        localStorage.agenda = JSON.stringify(agenda);
                        $(this).parent().remove();
                        return;
                    });
                }
                toggle("chat", 1);
                setTimeout(function () {

                    toggle("contacts", 0);

                }, 700);
                toggle("menu", 1);
                $("#contacts-form input").keyup(function () {
                    $("* #contact").filter(function () {
                        contactName = $(this).children("#contact-name").html().toLowerCase();
                        if (contactName.indexOf($("#contacts-form input").val().toLowerCase()) == -1) {
                            return $(this).fadeOut(200);
                        } else {
                            return $(this).fadeIn(200);
                        }

                    });
                });



            }

        }

    });

    // Back to the app index
    $("#index").on("click", function () {

        if (conns.length > 0) {

            if (contacts == true) {

                toggle("contacts", 1);

            }

            if (inchat == true) {

                toggle("inchat", 1);

            }

            if (profile == true) {

                toggle("profile", 1)

            }
            if (profilewaiting == true) {

                toggle("profile", 1);
                toggle("chevronleft", 1);
                profilewaiting = false;

            }
            toggle("menu", 1);
            setTimeout(function () {

                toggle("chat", 0);

            }, 700);

        } else {

            if (contacts == true) {

                toggle("contacts", 1);

            }

            if (playing == true) {

                toggle("youtube", 1);
                playing = true;

            }

            if (profile == true) {

                toggle("profile", 1)

            }
            if (profilewaiting == true) {

                toggle("profile", 1);
                toggle("chevronleft", 1);
                profilewaiting = false;

            }

            toggle("menu", 1);

        }

    });

    // Clicking in the header chat function.
    $("#headertitle button").on("click", function () {

        if ($("#headertitle button").attr("class") == "clicable") {
            showedconns = [];
            for (i = 0; i < conns.length; i++) {
                if ((!conns[i].options._payload && !justPayLoad(i)) || payLoadAll() || showedconns.indexOf(conns[i].peer) == -1) {
                    $("#inchat").append('<div id="inchat-contact"><button id="contact-settings"></button><div id="contact-status"></div><div id="contact-name" data-contact-name="' + conns[i].metadata.name + '">' + conns[i].metadata.name + '</div><br><div id="contact-id">' + conns[i].peer + '</div></div>');
                    showedconns.push(conns[i].peer);
                    inChatContactSettings();
                }
            }
            toggle("chat", 1);
            setTimeout(function () {
                toggle("inchat", 0);
            }, 500);
            setInterval(function () {
                $("* #inchat-contact").remove();
                showedconns.length = 0;
                for (i = 0; i < conns.length; i++) {
                    if ((!conns[i].options._payload && !justPayLoad(i)) || payLoadAll() || showedconns.indexOf(conns[i].peer) == -1) {
                        $("#inchat").append('<div id="inchat-contact"><button id="contact-settings"></button><div id="contact-status"></div><div id="contact-name" data-contact-name="' + conns[i].metadata.name + '">' + conns[i].metadata.name + '</div><br><div id="contact-id">' + conns[i].peer + '</div></div>');
                        showedconns.push(conns[i].peer);
                        inChatContactSettings();
                    }
                }
            }, 5500);

            function justPayLoad(z) {
                for (x = 0; x < conns.length; x++) {
                    if (z != i) {
                        if (conns[x].peer == conns[z].peer) {
                            return true;
                        } else {
                            break;
                        }
                    }
                }
            }

            function inChatContactSettings() {
                $("* #contact-settings").on("click", function () {
                    contactName = $(this).parent().children("#contact-name").attr("data-contact-name");
                    contactId = $(this).parent().children("#contact-id").html();
                    if (agenda.length > 0) {
                        for (i = 0; i < agenda.length; i++) {
                            if (agenda[i].id == contactId) {
                                inAgenda = true;
                                continue;
                            } else {
                                inAgenda = false;
                            }
                        }
                    } else {
                        inAgenda = false;
                    }
                    if (inAgenda) {
                        $("#options").html('<button id="option" data-option-value="0">' + langData["optionsmodal"]["basic"]["contactremove"] + '</button><div id="option-separator"></div><button id="option" data-option-value="1">' + langData["optionsmodal"]["basic"]["profileview"] + '</button>');
                        toggle("optionsmodal", 0);
                        $("#option[data-option-value='0']").on("click", function () {
                            for (i = 0; i < agenda.length; i++) {
                                if (agenda[i].id == contactId) {
                                    agenda.splice(i, 1);
                                }
                            }
                            localStorage.agenda = JSON.stringify(agenda);
                            return toggle("optionsmodal", 1);
                        });
                    } else {
                        $("#options").html('<button id="option" data-option-value="0">' + langData["optionsmodal"]["basic"]["contactadd"] + '</button><div id="option-separator"></div><button id="option" data-option-value="1">' + langData["optionsmodal"]["basic"]["profileview"] + '</button>');
                        toggle("optionsmodal", 0);
                        $("#option[data-option-value='0']").on("click", function () {
                            agenda.push({

                                id: contactId,
                                name: contactName

                            });
                            localStorage.agenda = JSON.stringify(agenda);
                            return toggle("optionsmodal", 1);
                        });

                    }
                    $("#option[data-option-value='1']").on("click", function () {

                        for (i = 0; i < conns.length; i++) {

                            if (conns[i].peer == contactId) {
                                conns[i].send({
                                    type: 7,
                                    from: peer.id
                                });
                                profilewaiting = true;
                            }

                        }

                        return toggle("optionsmodal", 1);

                    });
                    $("#cancel").on("click", function () {
                        return toggle("optionsmodal", 1);
                    });
                    $(".black").on("click", function () {
                        return toggle("optionsmodal", 1);
                    });

                });
            }
        }

    });

    // Go backward
    $("#headerlogo").on("click", function () {

        if (chevronleft == true) {

            chevronLeftAction();

        }

    });

    // Open your profile
    $("#profilebtn").on("click", function () {
        if (profilewaiting == true) {

            toggle("profile", 1);
            toggle("chevronleft", 1);
            profilewaiting = false;

        }
        if (contacts == true) {

            toggle("contacts", 1);

        }
        if (inchat == true) {

            toggle("inchat", 1);

        }
        if (playing == true) {

            toggle("youtube", 1);

        }
        if (chat == true) {

            toggle("chat", 1);

        }
        $("#profile-name").html(peer.label);
        $("#profile-id").html(peer.id);
        $("#profile-desc").html(desc);
        $("#profile-state").css({
            "background": "url(" + avatar + ") no-repeat",
            "background-size": "cover"
        });
        setTimeout(function () {
            toggle("profile", 0);
        }, 500);
        toggle("menu", 1);
        $("#profile-settings").on("click", function () {
            $("#options").html('<button id="option" data-option-value="0">' + langData["optionsmodal"]["basic"]["editprofile"] + '</button>');
            toggle("optionsmodal", 0);
            $("#option[data-option-value='0']").on("click", function () {

                toggle("optionsmodal", 1);
                newModal(3, langData["modal"]["editprofile"]["title"], langData["modal"]["editprofile"]["desc"][0] + '<br> <textarea id="edit-profile-desc">' + desc + '</textarea><br>' + langData["modal"]["editprofile"]["desc"][1] + '<input type="url" id="edit-profile-avatar" value="' + avatar + '"/>', 1);
                $("#modalOptions #modal-accept").on("click", function () {
                    localStorage.desc = $("#edit-profile-desc").val();
                    desc = localStorage.desc;
                    localStorage.avatar = $("#edit-profile-avatar").val();
                    avatar = localStorage.avatar;
                    $("#profile-state").css({
                        "background": "url(" + avatar + ") no-repeat",
                        "background-size": "cover"
                    });
                    $("#profile-desc").html(desc);
                    $(this).parent().parent().remove();

                });
                $("#modalOptions #modal-cancel").on("click", function () {
                    $(this).parent().parent().remove();
                });

            });
            $("#cancel").on("click", function () {
                return toggle("optionsmodal", 1);
            });
            $(".black").on("click", function () {
                return toggle("optionsmodal", 1);
            });
        });

    });
    $("#notifications-area").on("click", function () {

        $("#notifications-list").slideToggle();

    });

    // Send Messages function
    function sendMessage() {

        var message = $("#text-message").val();
        var date = new Date();
        var h = date.getHours();
        var m = date.getMinutes();
        var time = h + ":" + m;
        var messageC = {
            type: 0,
            peer: peer.id,
            message: message,
            name: peer.label,
            time: time
        };

        if ($.trim(message.replace(" ", "")).length > 0) {

            for (i = 0; i < conns.length; i++) {

                conns[i].send(messageC);

            }

            $('<div id="message" style="float: right; border-bottom-right-radius: 0px;"><div style="height: 5px;"><div id="author">' + langData["messages"]["basic"]["me"] + '</div><div id="time">' + time + '</div></div><br><div id="text">' + message + '</div></div>').insertBefore(".bottom");
            $("#text-message").val("").trigger('autosize.resize').blur();
            emojify.run();
            var scrollH = $("#messages")[0].scrollHeight;
            $("#messages").scrollTop(scrollH);

        }

    }

    // Modals
    function newModal(id, title, body, options) {

        $("#options").html('<button id="option" data-option-value="0">' + langData["optionsmodal"]["basic"]["ok"] + '</button>');
        toggle("optionsmodal", 0);
        $("body").append('<div class="modal" id="' + id + '"><div id="modal-title">' + title + '</div><div id="modal-body">' + body + '</div></div>');

    }
    // Toggle sections
    function toggle(e, t) {

        if (e == "menu") {

            if (t == 0) {

                $("#menu-container").show("slide", {

                    direction: "right"

                }, "slow");
                menu = true;

            } else {

                $("#menu-container").hide("slide", {

                    direction: "right"

                }, "slow");
                menu = false;

            }

        } else if (e == "chat") {

            if (t == 0) {

                $("#headertitle button").addClass("clicable");
                $("#headertitle button").html(langData["messages"]["basic"]["title"]);
                $("#messages").fadeIn(500);
                $("#messages-form").fadeIn(500);
                chat = true;

            } else {

                $("#headertitle button").removeClass("clicable");
                $("#headertitle button").html("");
                $("#messages").fadeOut(500);
                $("#messages-form").fadeOut(500);
                chat = false;

            }

        } else if (e == "contacts") {

            if (t == 0) {

                $("#headertitle button").html(langData["contacts"]["basic"]["title"]);
                $("#contacts").fadeIn(500);
                $("#contacts-form").fadeIn(500);
                contacts = true;

            } else {

                $("#headertitle button").html("");
                $("#contacts").fadeOut(500);
                $("#contacts-form").fadeOut(500);
                setTimeout(function () {
                    $("* #contact").remove();
                }, 500);
                contacts = false;

            }
        } else if (e == "inchat") {

            if (t == 0) {

                $("#headertitle button").html(langData["inchat"]["basic"]["title"]);
                toggle("chevronleft", 0);
                $("#inchat").fadeIn(500);
                inchat = true;

            } else {

                $("#headertitle button").html("");
                toggle("chevronleft", 1);
                $("#inchat").fadeOut(500);
                setTimeout(function () {
                    $("* #inchat-contact").remove();
                }, 500);
                inchat = false;

            }

        } else if (e == "youtube") {

            if (t == 0) {

                toggle("chevronleft", 0);
                $("#headertitle button").removeClass("clicable");
                $("#headertitle button").html("Video Party");
                $("#yt-container").fadeIn(500);
                $("#messages").css({
                    "height": "calc(100% - 102px - 314px)",
                    "margin-top": "364px"
                });
                playing = true;

            } else {

                toggle("chevronleft", 1);
                $("#yt-container").fadeOut(500);
                $("#messages").css({
                    "height": "calc(100vh - 102px)",
                    "margin-top": "50px"
                });
                playing = false;
                setTimeout(function () {
                    $("#yt-container iframe").remove();
                }, 500);

            }

        } else if (e == "container") {

            if (t == 0) {

                $("#container").fadeIn(500);
                container = true;

            } else {

                $("#container").fadeOut(500);
                container = false;

            }

        } else if (e == "chevronleft") {

            if (t == 0) {

                $("#chevronleft").fadeIn(500);
                chevronleft = true;

            } else {

                $("#chevronleft").fadeOut(500);
                chevronleft = false;

            }

        } else if (e == "optionsmodal") {

            if (t == 0) {

                $(".black").fadeIn(500);
                $("#optionsmodal").fadeIn(500);

            } else {

                $(".black").fadeOut(500);
                $("#optionsmodal").fadeOut(500);
                setTimeout(function () {
                    $("* #option").remove();
                    $("* #option-separator").remove();
                }, 500);
            }

        } else if (e == "profile") {

            if (t == 0) {

                $("#headertitle button").html(langData["profile"]["basic"]["title"]);
                $("#profile").fadeIn(500);
                $("#profile-form").fadeIn(500);
                profile = true;

            } else {

                $("#headertitle button").html("");
                $("#profile").fadeOut(500);
                $("#profile-form").fadeOut(500);
                profile = false;

            }

        } else if (e == "chat-attach") {

            if (t == 0) {

                $("#messages-attach").show("slide", {

                    direction: "right"

                }, 500);
                chatAttach = true;

            } else {

                $("#messages-attach").hide("slide", {

                    direction: "right"

                }, 500);
                chatAttach = false;

            }

        } else if (e == "notifyalert") {

            if (t == 0) {

                $("#notifications-area").fadeIn(500);
                notifycount++;

            } else {

                $("#notifications-area").fadeOut(500);
                notifycount = 0;

            }

        }

    }

    // Go backward function
    function chevronLeftAction() {

        if (inchat == true) {

            toggle("inchat", 1);
            setTimeout(function () {
                toggle("chat", 0);
            }, 500);

        }
        if (profilewaiting == true) {

            toggle("profile", 1);
            toggle("chevronleft", 1);
            setTimeout(function () {
                toggle("inchat", 0);
            }, 500);
            profilewaiting = false;

        }
        if (playing == true) {

            $("#headertitle button").html(langData["messages"]["basic"]["title"]);
            $("#headertitle button").addClass("clicable");
            toggle("youtube", 1);

        }

    }

    // Verify connections function
    function verifyConnection(a) {

        // Comprobamos que la conexion es correcta verificando la contraseña.
        if (conn.metadata.from != peer.id && conn.metadata.password != peer.password) {

            conn.send({
                type: 5,
                from: peer.id
            });
            conn.close();
            conns.splice(conns.indexOf(conn), 1);
            connsid.splice(connsid.indexOf(conn.peer), 1);

        } else {

            conn.send({
                type: 6,
                from: peer.id,
                name: peer.label
            });

        }

    }

    // Check if the user is connected now
    function checkIfAlreadyConnected(x) {
        checkData = [];
        if (conns.length > 0) {
            for (i = 0; i < conns.length; i++) {
                if (conns[i].peer == x) {
                    checkData.push(1);
                    console.log(1);
                } else {
                    checkData.push(0);
                    console.log(0);
                }
                if (checkData.length == conns.length) {
                    if (checkData.indexOf(1) == -1) {
                        checkData.length = 0;
                        return true;
                    } else {
                        checkData.length = 0;
                        return false;
                    }
                }
            }
        } else {
            return true;
        }
    }

    // Some connections have a payload property in his object, the function is used to filter data
    function payLoadAll() {
        payLoadStats = [];
        for (x = 0; x < conns.length; x++) {

            if (conns[x].options._payload) {
                payLoadStats.push(1);
            } else {
                payLoadStats.push(0);
            }
            if (x == conns.length - 1) {
                if (payLoadStats.indexOf(0) == -1) {
                    payLoadStats.length = 0;
                    return true;
                } else {
                    payLoadStats.length = 0;
                    return false;
                }
            }
        }
    }



    // Get youtube url parameters
    function getYoutubeURLParams(url) {
        var vars = {};
        url.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
            vars[key] = value;
        });
        return vars;
    }

    // Create youtube player
    function createPlayer() {
        player.ytplayer = new YT.Player("ytplayer");
        player.ytplayer.addEventListener("onStateChange", onPlayerStateChange);
    }

    // Create notifications
    function notify(n, data) {
        if (n == "onvideo") {
            toggle("notifyalert", 0);
            $("#notifications-list").append('<div id="notify"><button id="notify-close"></button><div id="notify-icon-' + n + '"></div><div id="notify-title">' + langData["notify"]["onvideo"]["title"] + '</div><div id="notify-desc">' + langData["notify"]["onvideo"]["desc"] + '</div></div>');
            $("#notify-close").on("click", function () {
                remove(this);
            });
            $("#notify-icon").on("click", function () {
                ok(this);
            });
            $("#notify-title").on("click", function () {
                ok(this);
            });
            $("#notify-desc").on("click", function () {
                ok(this);
            });

            function ok(x) {
                remove(x);
                $("#notifications-list").slideToggle();
                for (i = 0; i < conns.length; i++) {
                    if (conns[i].peer == data) {
                        conns[i].send({
                            type: 4,
                            from: peer.id
                        });
                    }
                }
            }

            function remove(x) {
                $(x).parent().remove();
                notifycount--;
                if (notifycount <= 0) {
                    toggle("notifyalert", 1);
                }
            }

        }
    }

    // Check if the youtube player changed his state.
    function onPlayerStateChange(e) {
        if (e.data == 0) {
            toggle("youtube", 1);
        }

    }



}

// Toggle register sections
function toggleRegister(e, t) {
    if (e == "register") {

        if (t == 0) {

            $("#register").fadeIn(500);
            $("#register-form").fadeIn(500);
            register = true;

        } else {

            $("#register").fadeOut(500);
            $("#register-form").fadeOut(500);
            register = false;

        }
    } else if (e == "register2") {

        if (t == 0) {

            $("#register2").fadeIn(500);
            $("#register2-form").fadeIn(500);
            register2 = true;

        } else {

            $("#register2").fadeOut(500);
            $("#register2-form").fadeOut(500);
            register2 = false;

        }
    }
}