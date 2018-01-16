/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */


// CONFIG VARIABLES


var evaFrontendConfig = {
    routes: {
        resetSessionRoute: "/api/public/session/reset",
        sendUserMessageRoute: "/api/public/message",
        keepAliveRoute: "/api/public/session/keepalive",
        saveConversationFeedback: "/api/public/conversation-feedback"
    },
    loggingEnabled: false,
    shortConcatTimeout: 1500,
    longConcatTimeout: 3500,
    waitingTimePerChar: 30,
    minWaitingTime: 750,
    paths: {
        icon: "./EVA0.png"
    },
    chatBubble: {
        appearenceTime: 15000, //the time witch ChatBubbleNote is visible 1000 = 1 second
        firstAppearAfter: 5000, //first time witch ChatBubbleNote appears  if chat isn´t appeared 1000 = 1 second
        shakeAtFirstAppear: true,
        secondAppearAfter: 50000, //second time witch ChatBubbleNote appears if chat isn´t appeared 1000 = 1 second
        shakeAtSecondAppear: false,
        thirdAppearAfter: 125000, //third time witch ChatBubbleNote appears if chat isn´t appeared 1000 = 1 second
        shakeAtThirdAppear: false,
        showChatBubbleNoteOnMobileDevice: false
    },
    mobileDeviceWidth: 736,
    autoFocusOnMobileDevice: false,
    chatTitleHeight: 52,
    showConversationFeedbackAfter: 3000
};

var evaChatHolderObject = {
    clientId: "standard",
    userInput: undefined,
    previousUserInput: undefined,
    concatTimeout: undefined,
    feedbackComment: "",
    conversationFeedbackGiven: false,
    checkedStar: undefined,
    labels: {
        chatBubbleNoteTitle: "Hallo! Mein Name ist EVA, ich bin Ihre digitale Assistentin...",
        chatTitle: "EVA - Ihre digitale Assistentin",
        standardPlaceholder: "Ihre Nachricht...",
        profanityPlaceholder: "",
        answerProposalPlaceholder: "Bitte wählen Sie einen der Vorschläge",
        chatError: "In der Kommunikation mit EVA ist ein Fehler aufgetreten.",
        warnings: "Es ist ein interner Fehler aufgetreten. Die nachfolgende Nachricht könnte unvollständig oder inkorrekt sein.",
        feedbackSuccessMsg: "Herzlichen Dank für ihr Feedback.<br>Sie helfen uns damit, EVA stetig weiter zu entwickeln.",
        commentPlaceholder: "Hier ist Platz für Ihren Kommentar...",
        convFeedbackTitle: "Bitte bewerten Sie Ihr Chaterlebnis",
        convFeedbackSubTitle: "Helfen Sie uns dabei unseren Service und EVA zu verbessern.",
        feedbackFailMsg: "Beim Speichern des Feedbacks ist ein Fehler aufgetreten.",
        submitConvFeedback: "Feedback senden",
        cancelConvFeedback: "Abbrechen"
    },
    chatIsClicked: false
};


// RUNNING EVA

window.onload = function() {
    evaCreateChatSpeechBubble();
    evaCreateChatBubble();
    evaCreateChatWindow();
    evaCreateChatContainer();
    evaCreateChatMessages();
    evaCreateAnswerProposals();
    evaCreateAnimations();
    evaCreateChatInput();
    evaCreateAlertPopUp();

    evaInit();

    evaChatNoteAppearAtTimes();
}

setInterval(function() {
    evaLogger("EVA-Debug: Keep Alive every 10 Minutes.");
    evaKeepAliveRequest(function() {
        evaLogger("EVA-Debug: Keep Alive Session: Successful");
    }, function() {
        evaLogger("EVA-Debug: Keep Alive Session: Failed");
    });
}, 10 * 60 * 1000);


// INIT EVA CHAT

var evaInit = function() {
    evaLogger("EVA-Debug: init frontend variables");

    evaChatHolderObject.messages = [];
    evaChatHolderObject.answer_proposals = undefined;
}


// CREATE HTML ELEMENTS
var evaCreateChatBubble = function() {
    var bubbleChat = document.createElement("div");
    var bubbleChatFontAwesomeImgSignForChatBubble = document.createElement("div");
    bubbleChatFontAwesomeImgSignForChatBubble.className = "fa fa-comments-o";
    bubbleChat.id = "eva_bubble_Chat";
    bubbleChat.className = "eva_bubble_Chat";
    bubbleChat.onclick = function() {
        evaChatAppears();
    };
    bubbleChat.appendChild(bubbleChatFontAwesomeImgSignForChatBubble)
    document.body.appendChild(bubbleChat);
}

var evaCreateChatSpeechBubble = function() {
    var bubbleSpeechBubbleChat = document.createElement("div");
    bubbleSpeechBubbleChat.id = "eva_bubblechat_note";
    bubbleSpeechBubbleChat.className = "eva_bubble_Chat_note";
    var SpeechBubbleChatTabel = document.createElement("table");
    var SpeechBubbleChatTr = document.createElement("tr");
    var SpeechBubbleChatTdOne = document.createElement("td");
    var SpeechBubbleChatTdOneImg = document.createElement("img");
    SpeechBubbleChatTdOneImg.className = "eva_img_speechbubble";
    SpeechBubbleChatTdOneImg.setAttribute("src", evaFrontendConfig.paths.icon);
    SpeechBubbleChatTdOneImg.setAttribute("alt", "Eva");
    SpeechBubbleChatTdOne.appendChild(SpeechBubbleChatTdOneImg);
    var SpeechBubbleChatTdTwo = document.createElement("td");
    SpeechBubbleChatTdTwo.innerHTML = evaChatHolderObject.labels.chatBubbleNoteTitle;
    SpeechBubbleChatTr.appendChild(SpeechBubbleChatTdOne);
    SpeechBubbleChatTr.appendChild(SpeechBubbleChatTdTwo);
    SpeechBubbleChatTabel.appendChild(SpeechBubbleChatTr);
    bubbleSpeechBubbleChat.appendChild(SpeechBubbleChatTabel)
    bubbleSpeechBubbleChat.onclick = function() {
        evaChatAppears();
    };
    document.body.appendChild(bubbleSpeechBubbleChat);
}

var evaChatNoteAppearAtTimes = function() {
    if (!evaIsMobileDevice() || evaFrontendConfig.chatBubble.showChatBubbleNoteOnMobileDevice) {
        //first time chatNote appeared
        evaChatNoteAppear(evaFrontendConfig.chatBubble.firstAppearAfter, evaFrontendConfig.chatBubble.shakeAtFirstAppear);
        //second time chatNote appeared
        evaChatNoteAppear(evaFrontendConfig.chatBubble.secondAppearAfter, evaFrontendConfig.chatBubble.shakeAtSecondAppear);
        //third time chatNote appeared
        evaChatNoteAppear(evaFrontendConfig.chatBubble.thirdAppearAfter, evaFrontendConfig.chatBubble.shakeAtThirdAppear);
    }
}

var evaChatNoteAppear = function(timing, shake) {
    var bubblechatNote = document.getElementById("eva_bubblechat_note");
    setTimeout(function() {
        if (evaChatHolderObject.chatIsClicked === false) {
            bubblechatNote.style.display = "block";
            evaChatBubbleNoteFadeIn(bubblechatNote);

            if (shake) {
                setTimeout(function() {
                    var shakeAnimation = setInterval(function() {
                        evaChatBubbleNoteShakeFunction();
                    }, 700);

                    setTimeout(function() {
                        clearInterval(shakeAnimation);
                    }, 2150);
                }, 1200);
            }

            setTimeout(function() {
                evaChatBubbleNoteFadeOut(bubblechatNote);
            }, evaFrontendConfig.chatBubble.appearenceTime);
        }
    }, timing);
}



var evaCreateChatWindow = function() {
    var chatWindow = document.createElement("div");
    chatWindow.id = "eva_chatWindow";
    chatWindow.className = "eva_chat_holder";
    chatWindow.style.display = "none";
    document.body.appendChild(chatWindow);

    var chatTitle = document.createElement("div");
    chatTitle.className = "eva_chat_title";
    chatTitle.innerHTML = evaChatHolderObject.labels.chatTitle;
    chatTitle.onclick = function() {
        evaToggleChat();
    };

    var chatTitleSign = document.createElement("i");
    chatTitleSign.id = "eva_chatTitleSign";
    chatTitleSign.className = "fa fa-angle-up eva_chatTitleSign";
    chatTitleSign.setAttribute("title", "Maximieren");
    chatTitle.appendChild(chatTitleSign);
    chatWindow.appendChild(chatTitle);
}

var evaCreateChatContainer = function() {

    var chatWindow = document.getElementById("eva_chatWindow");

    var chatContent = document.createElement("div");
    chatContent.id = "eva_chatDisplay";
    chatContent.className = "eva_chat_content";
    chatWindow.appendChild(chatContent);

    // Chat History Wrapper
    var chatHistory = document.createElement("div");
    chatHistory.id = "eva_chatHistory";
    chatHistory.className = "eva_chat_history";
    chatContent.appendChild(chatHistory);

    // Tooltip
    var tooltip = document.createElement("div");
    tooltip.id = "eva_tooltipDiv";
    document.body.appendChild(tooltip);

    var conversationFeedback = document.createElement("div");
    conversationFeedback.className = "eva_conversation-feedback";
    conversationFeedback.id = "eva_conversationFeedback";
    conversationFeedback.style.display = "none";
    chatContent.appendChild(conversationFeedback);
    var titleText = document.createElement("div");
    titleText.innerHTML = evaChatHolderObject.labels.convFeedbackTitle;
    titleText.className = "eva_feedbackText";
    conversationFeedback.appendChild(titleText);
    var titleSubText = document.createElement("div");
    titleSubText.innerHTML = evaChatHolderObject.labels.convFeedbackSubTitle;
    titleSubText.className = "eva_feedbackSubText";
    conversationFeedback.appendChild(titleSubText);

    var starRating = document.createElement("fieldset");
    starRating.className = "eva_rating";
    conversationFeedback.appendChild(starRating);

    for (i = 0; i < 5; i++) {
        var starButton = document.createElement("input");
        starButton.type = "radio";
        starButton.id = "eva_star" + i;
        starButton.name = "eva_rating";
        starButton.className = "eva_starInput"
        starButton.value = 5 - i;
        starButton.onclick = function() {
            saveConversationFeedbackButton.disabled = false;
            evaChatHolderObject.checkedStar = starButton.value;
        }
        starRating.appendChild(starButton);
        var starLabel = document.createElement("label");
        starLabel.className = "eva_full";
        starLabel.title = 5 - i;
        starLabel.htmlFor = "eva_star" + i;
        starRating.appendChild(starLabel);
    }

    var feedbackField = document.createElement("textarea");
    feedbackField.placeholder = evaChatHolderObject.labels.commentPlaceholder;
    feedbackField.id = "eva_feedbackText";
    feedbackField.className = "eva_user-feedback";
    feedbackField.onkeyup = function() {
        if (feedbackField.value.length) {
            saveConversationFeedbackButton.disabled = false;
        } else {
            if (evaChatHolderObject.checkedStar == undefined)
                saveConversationFeedbackButton.disabled = true;
        }
    }
    conversationFeedback.appendChild(feedbackField);

    var saveConversationFeedbackButton = document.createElement("button");
    conversationFeedback.appendChild(saveConversationFeedbackButton);
    saveConversationFeedbackButton.innerHTML = evaChatHolderObject.labels.submitConvFeedback;
    saveConversationFeedbackButton.className = "eva_feedback-button";
    saveConversationFeedbackButton.id = "eva_feedbackButtonSave";
    saveConversationFeedbackButton.disabled = true;
    saveConversationFeedbackButton.onclick = function() {
        for (i = 0; i < 5; i++) {
            if (document.getElementById("eva_star" + i).checked == true) {
                evaChatHolderObject.checkedStar = document.getElementById("eva_star" + i).value;
            }
        }
        evaChatHolderObject.feedbackComment = document.getElementById("eva_feedbackText").value;
        conversationFeedback.style.display = "none";
        evaLockInputField(0);
        saveConversationFeedback(function() {
            evaChatHolderObject.conversationFeedbackGiven = true;
            chatContent.removeChild(conversationFeedback);
            evaPopUpAlertMessage(evaChatHolderObject.labels.feedbackSuccessMsg, "success");
        }, function() {
            evaPopUpAlertMessage(evaChatHolderObject.labels.feedbackFailMsg, "warning");
        });
    }

    var cancelConversationFeedbackButton = document.createElement("button");
    conversationFeedback.appendChild(cancelConversationFeedbackButton);
    cancelConversationFeedbackButton.innerHTML = evaChatHolderObject.labels.cancelConvFeedback;
    cancelConversationFeedbackButton.className = "eva_feedback-button";
    cancelConversationFeedbackButton.id = "eva_feedbackButtonCancel";
    cancelConversationFeedbackButton.onclick = function() {
        conversationFeedback.style.display = "none";
        evaLockInputField(0);
    }

}

var evaCreateChatMessages = function() {
    var chatHistory = document.getElementById("eva_chatHistory");

    var chatMessages = document.createElement("div");
    chatMessages.id = "eva_chatMessages";
    chatHistory.appendChild(chatMessages);
}

var evaCreateAnswerProposals = function() {
    var chatHistory = document.getElementById("eva_chatHistory");

    var answerProposals = document.createElement("div");
    answerProposals.id = "eva_answerProposals";
    answerProposals.className = "eva_answer_proposals";
    chatHistory.appendChild(answerProposals);
}

var evaCreateAnimations = function() {
    var chatHistory = document.getElementById("eva_chatHistory");
    var chatContent = document.getElementById("eva_chatDisplay");

    var chatHistoryEnd = document.createElement("div");
    chatHistory.id = "eva_chatHistory";
    chatHistoryEnd.id = "eva_chatHistoryEnd";
    chatHistory.appendChild(chatHistoryEnd);

    var typingAnimation = document.createElement("div");
    typingAnimation.id = "eva_typingAnimation";
    typingAnimation.className = "eva_typing_animation";
    typingAnimation.style.visibility = "hidden";
    chatContent.appendChild(typingAnimation);
}

var evaCreateChatInput = function() {
    var chatContent = document.getElementById("eva_chatDisplay");

    var chatInput = document.createElement("div");
    chatInput.className = "eva_chat_input";
    chatInput.id = "eva_textInputContainer";

    var textInput = document.createElement("input");
    textInput.id = "eva_textInput";
    textInput.type = "text";
    textInput.placeholder = evaChatHolderObject.labels.standardPlaceholder;
    textInput.tabIndex = -1;
    textInput.onkeydown = function(event) {
        evaInputKeyDown(event);
    }
    chatInput.appendChild(textInput);
    chatContent.appendChild(chatInput);
}

var evaCreateAlertPopUp = function() {
    var chatDisplay = document.getElementById("eva_chatDisplay");

    var chatAlertMessage = document.createElement("div");
    chatAlertMessage.id = "eva_alert_message";
    chatAlertMessage.className = "eva_alert";

    var blindChatAlert = document.createElement("div");
    blindChatAlert.id = "eva_blind_chat";

    var chatCloseAlert = document.createElement("div");
    chatCloseAlert.innerHTML = "&times;";
    chatCloseAlert.id = "eva_alert_close";
    chatCloseAlert.className = "eva_alert_closebtn";
    chatCloseAlert.id = "eva_alert_close";
    chatCloseAlert.onclick = function() {
        chatCloseAlert.style.visibility = 'hidden';
        chatAlertMessage.style.visibility = 'hidden';
        blindChatAlert.style.visibility = 'hidden';
    }

    chatDisplay.insertBefore(chatAlertMessage, chatDisplay.firstChild);
    chatDisplay.insertBefore(chatCloseAlert, chatDisplay.firstChild);
    chatDisplay.insertBefore(blindChatAlert, chatDisplay.firstChild);
}


// ADD HTML ELEMENTS FOR EVERY MESSAGE / ANSWER PROPOSAL

var evaPushChatMessages = function(message) {
    var chatMessages = document.getElementById("eva_chatMessages");

    var chatMessage = document.createElement("div");
    chatMessage.className = message.user == "watson" ? "eva_from-watson" : "eva_from-user";
    chatMessage.className += " eva_message";
    chatMessage.id = "eva_chatmessage_" + (evaChatHolderObject.messages.length - 1);

    var cursor = document.createElement("p");
    if (message.user === "watson") {
        cursor.innerHTML = message.text;
    } else {
        cursor.textContent = message.text;
    }
    chatMessage.appendChild(cursor);

    chatMessages.appendChild(chatMessage)

    var hr = document.createElement("hr");
    chatMessages.appendChild(hr);

    if (message.user == "watson") {
        evaShowTooltips(chatMessage);
    }
}

var evaPushAnswerProposals = function(answer_proposals) {
    var answerProposals = document.getElementById("eva_answerProposals");

    var classNameArray = [];
    // sorting answerproposals according their size to arrange them / fill lines with small buttons
    var sizeSortedAnswerProposals = evaSortProposalsBySize(answer_proposals);
    classNameArray = evaAdjustAnswerProposalsButtonSize(sizeSortedAnswerProposals, classNameArray);

    // use the index of the sorted array(!) so that the buttons fits the message
    for (var i = 0; i < sizeSortedAnswerProposals.length; i++) { // for proposal in in answer_proposals
        var proposalButton = document.createElement("button");
        var lastButton = (i == (sizeSortedAnswerProposals.length - 1));
        proposalButton.className = classNameArray[i];
        proposalButton.innerHTML = sizeSortedAnswerProposals[i];
        proposalButton.id = i;
        proposalButton.onclick = function() { // choose an proposal
            evaLoadOrChooseAnswer(sizeSortedAnswerProposals[this.id]);
        }
        answerProposals.appendChild(proposalButton);
    }
    answerProposals.style.visibility = "visible";
}


// HTTP REQUESTS FOR WATSON API CALLS

// endpoint to reset user session
var evaResetSessionRequest = function(resolve, reject) {
    var request = new XMLHttpRequest();
    request.open("POST", evaFrontendConfig.routes.resetSessionRoute, true);

    request.onreadystatechange = function() {
        if (request.readyState === XMLHttpRequest.DONE) {
            if (request.status === 200) {
                evaLogger("EVA-Debug: Reset Session: Successful");
                return resolve();
            } else {
                evaLogger("EVA-Debug: Reset Session: Failed");
                return reject();
            }
        }
    }
    request.send();
}

// request to keep the session alive
var evaKeepAliveRequest = function(resolve, reject) {
    var request = new XMLHttpRequest();
    request.open("POST", evaFrontendConfig.routes.keepAliveRoute, true);

    request.onreadystatechange = function() {
        if (request.readyState === XMLHttpRequest.DONE) {
            if (request.status === 200) {
                evaLogger("EVA-Debug: Keep Alive Session: Successful");
                return resolve();
            } else {
                evaLogger("EVA-Debug: Keep Alive Session: Failed");
                return reject();
            }
        }
    }
    request.send();
}

// request watson answer from user input
var evaSendUserMessageToWatson = function(clientId, inputText, resolve, reject) {
    var request = new XMLHttpRequest();
    request.open("POST", evaFrontendConfig.routes.sendUserMessageRoute, true);

    request.onreadystatechange = function() {
        if (request.readyState === XMLHttpRequest.DONE) {
            if (request.status === 200) {
                try {
                    evaLogger("EVA-Debug: Get Answer from Watson: Successful");
                    return resolve(JSON.parse(request.responseText));
                } catch (e) {
                    evaLogger("EVA-Debug: Get Answer from Watson: Failed. Empty response.");
                    return reject();
                }
            } else if (request.status === 500) {
                if (request.responseText) {
                    try {
                        evaLogger("EVA-Debug: Get Answer from Watson: Failed");
                        return reject(JSON.parse(request.responseText));
                    } catch (e) {
                        evaLogger("EVA-Debug: Get Answer from Watson: Failed. Empty response.");
                        return reject();
                    }
                } else {
                    evaLogger("EVA-Debug: Get Answer from Watson: Failed. Empty response.");
                    return reject();
                }
            } else {
                evaLogger("EVA-Debug: Get Answer from Watson: Failed. Empty response.");
                return reject();
            }
        }
    };

    var data = {};
    data.client_id = clientId;

    if (inputText) {
        data.text = inputText;
    }

    request.setRequestHeader("Content-Type", "application/json");
    request.send(JSON.stringify(data));
}

// save conversation feedback

var saveConversationFeedback = function(resolve, reject) {

    var requestFeedback = new XMLHttpRequest();
    requestFeedback.open("POST", evaFrontendConfig.routes.saveConversationFeedback, true);

    requestFeedback.onreadystatechange = function() {
        if (requestFeedback.readyState === XMLHttpRequest.DONE) {
            if (requestFeedback.status === 200) {
                try {
                    evaLogger("EVA-Debug: Feedback saved successfully");
                    return resolve(JSON.parse(requestFeedback.responseText));
                } catch (e) {
                    evaLogger("EVA-Debug: Failed to save feedback.");
                    return reject();
                }
            } else if (requestFeedback.status === 500) {
                if (requestFeedback.responseText) {
                    try {
                        evaLogger("EVA-Debug: Failed to save feedback");
                        return reject(JSON.parse(requestFeedback.responseText));
                    } catch (e) {
                        evaLogger("EVA-Debug: Failed to save feedback.");
                        return reject();
                    }
                }
            } else {
                evaLogger("EVA-Debug: Failed to save feedback.");
                return reject();
            }
        }
    }

    var data = {};
    data.client_id = evaChatHolderObject.clientId;
    data.comment = evaChatHolderObject.feedbackComment;
    data.rating = evaChatHolderObject.checkedStar;

    requestFeedback.setRequestHeader("Content-Type", "application/json");
    requestFeedback.send(JSON.stringify(data));
}

// CONVERSATION LOGIC

var evaStartConversation = function(callback) {
    evaToggleTypingAnimation(true);
    evaLockInputField(1);

    evaResetSessionRequest(function() {
        evaSendUserMessageToWatson(evaChatHolderObject.clientId, undefined, function(data) {
            evaToggleTypingAnimation(false);
            evaLockInputField(0);
            if (data.lockLevel) {
                evaLockInputField(data.lockLevel);
            }

            var welcomeMessage = {
                text: data.text[0] ? data.text[0] : "",
                user: 'watson',
                messageId: data.messageId,
                topIntent: data.topIntent ? data.topIntent : undefined,
                topConfidence: data.confidence ? data.confidence.toString() : undefined
            };
            evaPlotWatsonMessage(welcomeMessage);

            if (data.text.length <= 0) {
                evaPopUpAlertMessage(evaChatHolderObject.labels.warnings, "warning");
                console.warn("Error while showing the welcome message. Data.text is undefined");
            };

            return;
        }, function(data) {
            evaToggleTypingAnimation(false);
            evaLockInputField(0);
            if (!data || !data.text) {
                console.error(evaChatHolderObject.labels.chatError);
                evaPopUpAlertMessage(evaChatHolderObject.labels.chatError, "error");
            } else {
                evaHandleWatsonError(data);
            }
            evaPopUpAlertMessage(evaChatHolderObject.labels.chatError, "error");
            return;
        });
    }, function() {
        evaToggleTypingAnimation(false);
        evaLockInputField(0);
        console.error(evaChatHolderObject.labels.chatError);
        evaPopUpAlertMessage(evaChatHolderObject.labels.chatError, "error");
        return;
    });
};

var evaConductConversation = function(userInput) {
    evaToggleTypingAnimation(true);
    evaLockInputField(1);

    evaSendUserMessageToWatson(evaChatHolderObject.clientId, userInput, function(data) {
        if (data.lockLevel) {
            evaLockInputField(data.lockLevel);
        }

        var dontRemoveLock = false;

        if (data.actions.indexOf('requestConversationFeedback') !== -1 && evaChatHolderObject.conversationFeedbackGiven == false) {
            evaLockInputField(1);
            dontRemoveLock = true;
            setTimeout(function() {
                try {
                    document.getElementById("eva_conversationFeedback").style.display = "inline";
                } catch (e) {
                    console.error(e);
                    evaLogger("EVA-Debug: Can not set style of eva_conversationFeedback element.");
                }
            }, evaFrontendConfig.showConversationFeedbackAfter);
        }

        if (data.text.length > 0) {
            var wait = 0;
            var lastMessage = 0;
            for (var i = 0; i < data.text.length; i++) {
                var message = {};
                message.user = 'watson';
                message.text = data.text[i];
                message.messageId = data.messageId;
                message.automatedRated = data.rated ? data.rated : undefined;

                // show watson answer after short delay and stop input-disabling & animation after last message
                setTimeout(function(message, dontRemoveLock) {
                    lastMessage++;
                    evaPlotWatsonMessage(message);
                    if (lastMessage == data.text.length) {
                        evaToggleTypingAnimation(false);

                        if (!data.lockLevel && data.answer_id.indexOf("Profanity_1") == -1 && !dontRemoveLock) {
                            evaLockInputField(0);
                        }

                        if (data.answer_proposals && data.answer_proposals.length > 0) {
                            evaChatHolderObject.answer_proposals = data.answer_proposals;
                            evaPushAnswerProposals(data.answer_proposals);
                            // scrollToChatBottom();
                        }
                    }
                }, wait, message, dontRemoveLock);

                var text_without_html = String(data.text[i]).replace(/<[^>]+>/gm, '');
                var add_wait = text_without_html.length * evaFrontendConfig.waitingTimePerChar;
                if (add_wait < evaFrontendConfig.minWaitingTime) {
                    add_wait = evaFrontendConfig.minWaitingTime;
                }
                var wait = wait + add_wait;
            }

        } else {
            var message = {};
            message.user = 'watson';
            message.text = "";
            message.messageId = data.messageId;
            message.automatedRated = data.rated ? data.rated : undefined;

            // show message and stop input-disabling & animation after last message
            setTimeout(function() {
                evaPlotWatsonMessage(message);
                evaToggleTypingAnimation(false);
                evaLockInputField(0);

                if (data.answer_proposals && data.answer_proposals.length > 0) {
                    evaPushAnswerProposals(data.answer_proposals);
                    // scrollToChatBottom();
                }
            }, wait, message);
        }

        if (data.warnings.length > 0) {
            evaPopUpAlertMessage(evaChatHolderObject.labels.warnings, "warning");
            console.warn(data.warnings);
        }

    }, function(data) {
        if (!data || !data.text) {
            console.error(evaChatHolderObject.labels.chatError);
            evaPopUpAlertMessage(evaChatHolderObject.labels.chatError, "error");
        } else {
            evaHandleWatsonError(data);
        }
        evaToggleTypingAnimation(false);
        evaLockInputField(0);
        evaScrollToChatBottom();
    });
};


// CONVERSATION HELPER FUNCTIONS

var evaInputKeyDown = function(event) {
    var chatAlertMessage = document.getElementById("eva_alert_message");

    if (event.keyCode === 13) { // Submit on enter key
        evaChatHolderObject.userInput = document.getElementById("eva_textInput").value;
        if (evaChatHolderObject.previousUserInput) {
            evaChatHolderObject.previousUserInput += " " + evaChatHolderObject.userInput;
        } else {
            evaChatHolderObject.previousUserInput = evaChatHolderObject.userInput;
        }

        if (evaChatHolderObject.userInput != "") { // dis-allow blank messages
            evaPlotUserMessage(evaChatHolderObject.userInput);
        }
    }

    if (evaChatHolderObject.concatTimeout) {
        clearTimeout(evaChatHolderObject.concatTimeout);
    }

    var duration = event.keyCode === 13 ? evaFrontendConfig.shortConcatTimeout : evaFrontendConfig.longConcatTimeout;
    evaChatHolderObject.concatTimeout = setTimeout(function() {
        if (!evaChatHolderObject.previousUserInput) {
            return;
        }
        document.activeElement.blur();
        evaConductConversation(evaChatHolderObject.previousUserInput);
        evaChatHolderObject.previousUserInput = undefined;
        evaChatHolderObject.userInput = undefined;
    }, duration);
};

var evaPlotWatsonMessage = function(message) {
    evaChatHolderObject.messages.push(message);
    evaPushChatMessages(message);

    if (!evaIsMobileDevice() || evaFrontendConfig.autoFocusOnMobileDevice) {
        setTimeout(function() {
            var textInput = document.getElementById("eva_textInput");
            textInput.focus();
        }, 0);
    }

    evaScrollToChatBottom();
}

var evaPlotUserMessage = function(userInput) {
    // reset user input
    var textInput = document.getElementById("eva_textInput");
    textInput.value = "";

    // remove answerproposalbuttons after click or new message
    var answerProposals = document.getElementById("eva_answerProposals");
    if (evaChatHolderObject.answer_proposals) {
        while (answerProposals.firstChild) {
            answerProposals.removeChild(answerProposals.firstChild);
        }
        evaChatHolderObject.answer_proposals = undefined;
    }

    // remove warning pop up if user asks new questions
    var chatAlertMessage = document.getElementById("eva_alert_message");
    if (chatAlertMessage.className === "eva_alert eva_alert_yellow" || chatAlertMessage.className === "eva_alert eva_alert_blue") {
        chatAlertMessage.style.visibility = "hidden";
        var chatAlertClose = document.getElementById("eva_alert_close");
        chatAlertClose.style.visibility = "hidden";
    }

    // push user input to chat
    var userMessage = {
        text: userInput,
        user: 'human',
    };
    evaChatHolderObject.messages.push(userMessage);
    evaPushChatMessages(userMessage);

    evaScrollToChatBottom();
}

// Method for clicking an answer proposal button or doubleclicking on a user message and reloading it
var evaLoadOrChooseAnswer = function(message) {
    evaPlotUserMessage(message);
    evaConductConversation(message);
}

var evaHandleWatsonError = function(data) {
    if (data.err) {
        console.error(data.err);
    }

    var errorMessage = {
        text: data.text,
        user: 'watson'
    };
    evaPlotWatsonMessage(errorMessage);
}


// CSS ANIMATIONS & BUTTON RESIZING

var evaToggleChat = function() {
    var chat_display_div = document.getElementById("eva_chatDisplay");
    var chat_holder_div = document.getElementById("eva_chatWindow");
    var chat_history_div = document.getElementById("eva_chatHistory");
    if (chat_display_div.className.indexOf('eva_chat_content_show') != -1) {
        chat_display_div.className = chat_display_div.className.replace('eva_chat_content_show', '');
        chat_holder_div.className = chat_holder_div.className.replace('eva_chat_holder_move_top', '');
        chat_holder_div.className = chat_holder_div.className.replace('eva_chat_holder_show', '');
        chat_history_div.className = chat_history_div.className.replace('eva_chat_history_show', '');
    } else {
        chat_display_div.className += ' eva_chat_content_show';
        chat_holder_div.className += ' eva_chat_holder_show eva_chat_holder_move_top';
        chat_history_div.className += ' eva_chat_history_show';
        // evaToggleTypingAnimation(false);
        setTimeout(function() { // Focus user input field on opening
            if (!evaIsMobileDevice() || evaFrontendConfig.autoFocusOnMobileDevice) {
                setTimeout(function() {
                    var textInput = document.getElementById("eva_textInput");
                    textInput.focus();
                }, 0);
            }
        }, 1000);
    }
    var chatTitleSign = document.getElementById("eva_chatTitleSign");
    if (chat_display_div.className.indexOf('eva_chat_content_show') != -1) {
        chatTitleSign.className = chatTitleSign.className.replace('fa-angle-up', '');
        chatTitleSign.className += ' fa-angle-down';
        chatTitleSign.setAttribute("title", "Minimieren");
    } else {
        chatTitleSign.className = chatTitleSign.className.replace('fa-angle-down', '');
        chatTitleSign.className += ' fa-angle-up';
        chatTitleSign.setAttribute("title", "Maximieren");
    }
}

var evaToggleTypingAnimation = function(showTypingAnimation) {
    var typingAnimation = document.getElementById("eva_typingAnimation");
    typingAnimation.style.visibility = showTypingAnimation ? "visible" : "hidden";
}

var evaLockInputField = function(lockLevel) {
    evaLogger("EVA-Debug: Locklevel of Textinput set to " + lockLevel)
    var textInput = document.getElementById("eva_textInput");
    textInput.disabled = lockLevel > 0 ? true : false;

    if (lockLevel <= 1) { // inputfield disabled "Ihre Nachricht"
        textInput.placeholder = evaChatHolderObject.labels.standardPlaceholder;
    } else if (lockLevel == 2) { // inputfield disabled bei Antwortvorschläge
        textInput.placeholder = evaChatHolderObject.labels.answerProposalPlaceholder;
    } else if (lockLevel == 3) { // inputfield disabled bei profanity
        textInput.placeholder = evaChatHolderObject.labels.profanityPlaceholder;
    }
}

var evaPopUpAlertMessage = function(message, type) {
    var chatAlertMessage = document.getElementById("eva_alert_message");
    var chatCloseAlert = document.getElementById("eva_alert_close");
    chatAlertMessage.innerHTML = message;
    chatAlertMessage.style.visibility = "visible";

    // covering/blocking the chat with darkgrey field. To make clear you should not chat.
    var blindChat = document.getElementById("eva_blind_chat");
    blindChat.style.visibility = "visible";

    var closeErrorMsg = document.getElementById("eva_alert_close");
    closeErrorMsg.style.visibility = "visible";

    if (type == "error") {
        chatAlertMessage.className = "eva_alert eva_alert_red";
        chatCloseAlert.className = "eva_alert_closebtn";

    } else if (type == "warning") {
        chatAlertMessage.className = "eva_alert eva_alert_yellow";
        chatCloseAlert.className = "eva_alert_closebtn";
        blindChat.style.visibility = "hidden"; // warning needs no covering/blocking of chat

    } else if (type == "success") {
        chatAlertMessage.className = "eva_alert eva_alert_blue";
        chatCloseAlert.className = "eva_alert_closebtnblack";
        blindChat.style.visibility = "hidden"; // warning needs no covering/blocking of chat

    }
}

// scroll to the last watson message
var evaScrollToChatBottom = function() {
    // grab chat window
    var chatMessages = document.getElementById("eva_chatHistory");
    var allMessages = chatMessages.querySelectorAll(".eva_from-watson"); // get all 'from-watson' elements
    var last = allMessages[allMessages.length - 1]; // grab last 'from-watson' element
    var start = Date.now();

    setTimeout(function() {
        var lastScrollTop = chatMessages.scrollTop;
        if (chatMessages.scrollTop < (last.offsetTop - 10)) {

            var refresh = setInterval(function() {
                    var chatMessages = document.getElementById("eva_chatHistory"); //fetch scrolling chat element

                    var timePassed = Date.now() - start;
                    if (timePassed >= 3000) {
                        clearInterval(refresh);
                        return;
                    }

                    if (chatMessages.scrollTop < (last.offsetTop - 10)) {
                        lastScrollTop = chatMessages.scrollTop;
                        chatMessages.scrollTop += 5; // increment
                        if (chatMessages.scrollTop === lastScrollTop) {
                            clearInterval(refresh);
                            return;
                        }
                    } else {
                        clearInterval(refresh);
                        return;
                    }
                },
                5); // frequency
        } else {
            return;
        }
    }, 500);
};

// Pop up tooltips on hover
var evaShowTooltips = function(message) {
    var tooltips = message.querySelectorAll(".eva_tooltip");
    var tooltipDiv = document.getElementById("eva_tooltipDiv");

    var hideTooltip = function(e) {
        tooltipDiv.className = "";
        tooltipDiv.style.zIndex = "-1";
    };

    var showTooltip = function(e, elem) {
        var text = elem.getAttribute('data-tooltip');

        tooltipDiv.innerText = text;

        var offsetHeight = tooltipDiv.offsetHeight + window.pageYOffset;
        if (window.parseInt(eva_helper_getAbsolutePosition(elem).top, 10) > offsetHeight) {
            tooltipDiv.style.top = window.parseInt(eva_helper_getAbsolutePosition(elem).top, 10) + "px";

            tooltipDiv.className = "eva_tooltip_div_after";
        } else {
            tooltipDiv.style.top = window.parseInt((eva_helper_getAbsolutePosition(elem).top + tooltipDiv.offsetHeight + elem.offsetHeight + 5), 10) + "px";

            tooltipDiv.className = "eva_tooltip_div_before";
        }

        var w = window,
            d = document,
            e = d.documentElement,
            g = d.getElementsByTagName('body')[0],
            x = w.innerWidth || e.clientWidth || g.clientWidth;

        var left = window.parseInt(eva_helper_getAbsolutePosition(elem).left + (elem.offsetWidth / 2), 10);

        var maxLeft = x + window.pageXOffset - (tooltipDiv.offsetWidth / 2) - 5;
        if (left > maxLeft) {
            left = maxLeft;
        }

        var minLeft = window.pageXOffset + (tooltipDiv.offsetWidth / 2) + 5;
        if (left < minLeft) {
            left = minLeft;
        }

        tooltipDiv.style.left = left + "px";
        tooltipDiv.style.zIndex = "";

        tooltipDiv.className += " eva_tooltip_show";
    };

    for (var i = 0; i < tooltips.length; i++) {
        var tooltip_span = tooltips[i];
        tooltip_span.setAttribute("data-tooltip", tooltips[i].title);
        tooltip_span.removeAttribute("title");

        tooltip_span.addEventListener("mouseover", function(e) {
            var elem = this;

            showTooltip(e, elem);
        });

        tooltip_span.addEventListener("touchstart", function(e) {
            var elem = this;

            showTooltip(e, elem);

            e.preventDefault();
        });

        tooltip_span.addEventListener("touchend", function(e) {
            hideTooltip(e);
            e.preventDefault();
        });

        tooltip_span.addEventListener("mouseout", hideTooltip);
    }
}

// Sort Answer Proposals in Size for nice plotting
var evaSortProposalsBySize = function(answer_proposals) {
    var longAnswerProposals = [];
    var middleAnswerProposals = [];

    for (var i = 0; i < answer_proposals.length; i++) {
        if (answer_proposals[i].length > 19) {
            longAnswerProposals.push(answer_proposals[i]);
        } else {
            middleAnswerProposals.push(answer_proposals[i]);
        }
    }

    return longAnswerProposals.concat(middleAnswerProposals);
}

// 3 sizes for buttons: fullline (100%), half (50%), small (25%)
var evaAdjustAnswerProposalsButtonSize = function(sizeSortedAnswerProposals, classNameArray) {
    var halfButtons = 0;
    var smallButtons = 0;

    for (var i = 0; i < sizeSortedAnswerProposals.length; i++) {
        if (sizeSortedAnswerProposals[i].length > 19) {
            classNameArray[i] = "eva_big-button";
        } else if (sizeSortedAnswerProposals[i].length < 5) {
            classNameArray[i] = "eva_small-button";
            smallButtons++;
        } else {
            classNameArray[i] = "eva_half-button";
            halfButtons++;
        }
    }

    if (smallButtons % 4 != 0) {
        for (var i = 0; i < sizeSortedAnswerProposals.length; i++) {
            if (classNameArray[i] == "eva_small-button") {
                classNameArray[i] = "eva_half-button";
            }
        }
    }

    if (halfButtons % 2 != 0) {
        classNameArray[(sizeSortedAnswerProposals.length - 1)] = "eva_big-button";
    }

    return classNameArray;
}

// if chatbubble or chat bubble is clicked chat appear
evaChatAppears = function() {
    var chatAppearAfterClick = document.getElementById("eva_chatWindow");
    chatAppearAfterClick.style.display = "block";

    // chat clicked and should appear, lets start the conversation
    evaStartConversation();

    setTimeout(function() {
        var bubblechatNote = document.getElementById("eva_bubblechat_note");
        bubblechatNote.style.display = "none";
        var bubblechat = document.getElementById("eva_bubble_Chat");
        bubblechat.style.display = "none";
        evaToggleChat();
        evaChatHolderObject.chatIsClicked = true;
    }, 500);
}

// animation function of the chat bubble note
var evaChatBubbleNoteShakeFunction = function() {
    var animation = setInterval(function() {
        evaChatBubbleNoteShakeFunctionPositions();
    }, 100);

    setTimeout(function() {
        clearInterval(animation)
    }, 350);
}

var evaChatBubbleNoteShakeFunctionPositions = function() {
    var bubblechatNote = document.getElementById("eva_bubblechat_note");
    setTimeout(function() {
        bubblechatNote.style.right = 9.5 + "em";
    }, 10);
    setTimeout(function() {
        bubblechatNote.style.right = 10.3 + "em";
    }, 20);
    setTimeout(function() {
        bubblechatNote.style.right = 9.5 + "em";
    }, 30);
    setTimeout(function() {
        bubblechatNote.style.right = 10.3 + "em";
    }, 40);
    setTimeout(function() {
        bubblechatNote.style.right = 9.5 + "em";
    }, 50);
    setTimeout(function() {
        bubblechatNote.style.right = 10.3 + "em";
    }, 60);
    setTimeout(function() {
        bubblechatNote.style.right = 9.5 + "em";
    }, 70);
    setTimeout(function() {
        bubblechatNote.style.right = 10.3 + "em";
    }, 80);
    setTimeout(function() {
        bubblechatNote.style.right = 10 + "em";
    }, 90);
}

// fade in chat bubble note animation
var evaChatBubbleNoteFadeIn = function(elem) {
    elem.style.opacity = 0;
    var incOpacity = 0;
    var inInterval = setInterval(function() {
        incOpacity += 0.1;
        elem.style.opacity = incOpacity;
        if (elem.style.opacity >= 1) {
            clearInterval(inInterval);
        }
    }, 70);
}

// fade out chat bubble note animation
var evaChatBubbleNoteFadeOut = function(elem) {
    elem.style.opacity = 1;
    var decOpacity = 1;
    var outInterval = setInterval(function() {
        decOpacity -= 0.1
        elem.style.opacity = decOpacity;
        if (elem.style.opacity <= 0) {
            clearInterval(outInterval);
            elem.style.display = "none";
        }
    }, 70);
}

// function to check if EVA is running on mobile device
var evaIsMobileDevice = function() {
    var w = window,
        d = document,
        e = d.documentElement,
        g = d.getElementsByTagName('body')[0],
        x = w.innerWidth || e.clientWidth || g.clientWidth;
    if (x <= evaFrontendConfig.mobileDeviceWidth) {
        return true;
    } else {
        return false;
    }
}


// HELPER
var eva_helper_getAbsolutePosition = function(el) {
    var result = {};
    var bodyRect = document.body.getBoundingClientRect();
    var elemRect = el.getBoundingClientRect();

    result.top = elemRect.top - bodyRect.top;
    result.left = elemRect.left - bodyRect.left;

    return result;
};


// LOGGING

var evaLogger = function(loggingMessage) {
    if (evaFrontendConfig.loggingEnabled) {
        console.log(loggingMessage);
    }
}
