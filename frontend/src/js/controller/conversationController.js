/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */

angular.module('main')
// neuer Conversation controller
.controller('ConversationCtrl', ['$compile', '$scope', 'conversationService', '$routeParams', '$uibModal', '$rootScope', '$location', '$http', '$timeout', 'AuthenticationService',
  function($compile, $scope, conversationService, $routeParams, $uibModal, $rootScope, $location, $http, $timeout, AuthenticationService) {

    $scope.requestConversationFeedback = false;
    $scope.conversationFeedbackGiven = false;
    $scope.loading = true;
    $scope.typing = true;
    $scope.oneWordSearch = true;
    $scope.numQuestionsShown = 99; // number of questions to show for long questions
    $scope.numAdditionalQuestions = 3; // number of questions to show for short questions
    $scope.autoScrollStop = true; //
    $rootScope.showDebug = false;
    $rootScope.toggleDebug = function() {
      $rootScope.showDebug = !$rootScope.showDebug;
      if($rootScope.showDebug) {
        $scope.shortConcatTimeout = 0;
        $scope.longConcatTimeout = 0;
      }
    };
    $scope.setNegativeRatingAutomatically = false;
    var ChatBubbleNoteAppearenceTime = 15000; //the time witch ChatBubbleNote is visible 1000 = 1 second
    var firstAppearChatBubbleNote = 5000; //first time witch ChatBubbleNote appears  if chat isn´t appeared 1000 = 1 second
    var shakeAtFirstAppear = true;
    var scondAppearChatBubbleNote = 50000; //second time witch ChatBubbleNote appears if chat isn´t appeared 1000 = 1 second
    var shakeAtSecondAppear = false;
    var thirdAppearChatBubbleNote = 125000; //third time witch ChatBubbleNote appears if chat isn´t appeared 1000 = 1 second
    var shakeAtThirdAppear = false;
    var chatIsclicked = false;
    var userData = AuthenticationService.getUserData();
    if (userData) {
      $scope.loggedInUser = userData.name;
      $scope.debugmode = userData.debugmode;
    }

    $scope.clientId = $routeParams.clientId;
    if($scope.clientId === "admin") {
      $location.path('/admin');
    }

    var init = function() {
      $scope.loading = false;
      $scope.typing = false;
      $scope.received = false;
      $scope.messages = [];
      $scope.largeWatsonText = "";
      $scope.chatError = "";
      $scope.audioEnabled = false;
      $scope.entities = [];
      $scope.intents = [];
      $scope.answer_proposals = undefined;
      $scope.lockLevel = 0;
      $scope.lockLevelPlaceholder = "Ihre Nachricht..."
    }

    var conversation = {};
    $scope.shortConcatTimeout = 1500;
    $scope.longConcatTimeout = 3500;

    $scope.startUrl = "https://www.ibm.com/de-de/";

    var startConversation = function(callback) {
      setTimeout(function () {
        var textInput = document.getElementById("textInput");
        textInput.focus();
      }, 2000);
      $scope.loading = true;
      $scope.locked = false;   //TODO kann das raus? wird nicht mehr benutzt von olivialike
      conversationService.getFirstMessage($scope.clientId).then(function(data) {
        $scope.loading = false;

        conversation.context = data.context;

        var tmp = document.createElement("DIV");
        tmp.innerHTML = data.text[0];
        var responseStripped = tmp.textContent || tmp.innerText || "";

        // add message to messages array in angular scope
        $scope.messages.push({
          text: data.text[0],
          strippedText: responseStripped,
          user: 'watson',
          messageId: data.messageId,
          topIntent: data.topIntent ? data.topIntent : undefined,
          topConfidence: data.confidence ? data.confidence.toString() : undefined
        });

        $scope.loadAudio(data.text[0]);

        if ($scope.debugmode) {
          $scope.debugOutput = JSON.stringify(data, null, 4);
        }

        if(data.answer_proposals && data.answer_proposals.length > 0) {
          $scope.answer_proposals = data.answer_proposals;
        }

        if(data.warnings) {
          $scope.warnings = data.warnings;
        }
        return callback();
      }, function(data) {
        $scope.chatError = "In der Kommunikation mit Watson ist ein Fehler aufgetreten:";
        $scope.errorText = JSON.stringify(data, null, 4);
        $scope.debugOutput = JSON.stringify(data.debug, null, 4);
        console.log(data);
        $scope.messages.push({
          text: data.text,
          user: 'watson'
        });
        $scope.scrollToChatBottom();
        return callback();
      });
    };

    $scope.loadAnswer = function(message) {
      if (message.user === "watson" && message.longAnswer !== undefined) {
        $scope.largeWatsonText = message.longAnswer;
      } else if (message.user === "watson" && message.longAnswerId !== undefined) {
        $scope.showLargeText(message.longAnswerId);
      } else if (message.user === 'human') {
        $scope.plotUserMessage(message.text);
        $scope.conductConversation(message.text);
      }
    };


    // show another questions
    $scope.showMoreQuestions = function(messages) {
      if($scope.numQuestionsShown + $scope.numAdditionalQuestions >= messages.length) {
        $scope.numQuestionsShown += $scope.numAdditionalQuestions;
      }
      if($scope.numQuestionsShown < messages.length) {
        $scope.numQuestionsShown += $scope.numAdditionalQuestions; // number of buttons shown in one step
      }
      $scope.scrollToChatBottom();
    };


    // check if question proposal size correct
    $scope.checkQuestion = function(messages) {
      // 'Buttons like a wall' methode
      // Counters:
      var fullButtons = 0;
      var smallButtons = 0;
      var halfButtons = 0;

      // search for tarif buttons
      for(var i = 0 ; i < messages.length; i++) {
        if(messages[i].length < 5) {
          smallButtons++;
        }
      }

        if(smallButtons > 3) { // apply css for tarif buttons
          for(var i = 1 ; i < messages.length + 1; i++) {
            $('.answer-proposals.ng-scope > button:nth-child(' + i + ')').css({'width' : '73px', 'margin' : '5px 0 0 5px', 'min-height' : '35px'});
          }
        } else {
          for(var i = 1 ; i < messages.length + 1; i++) {
            if(messages[i - 1].length > 19){ // word size > 20
              fullButtons++;
              $('.answer-proposals.ng-scope > button:nth-child(' + i + ')').css({'width' : '97%', 'margin' : '5px 0 0 5px', 'min-height' : '35px'});
            } else {
              halfButtons++;
              $('.answer-proposals.ng-scope > button:nth-child(' + i + ')').css({'width' : '48%', 'margin' : '5px 0 0 5px', 'min-height' : '35px'});
            }
          }
        }
      if(halfButtons % 2 !== 0) {
        $('.answer-proposals.ng-scope > button:last-child').css({'min-width': '97%', 'margin' : '5px 0 0 5px', 'min-height' : '35px'});
      }
      if(messages[0].length < 20 && messages[1].length > 19) {
        $('.answer-proposals.ng-scope > button:first-child').css({'min-width': '97%', 'margin' : '5px 0 0 5px', 'min-height' : '35px'});
      }
      if(messages.length < 2) {
        $('.answer-proposals.ng-scope > button:first-child').css({'min-width': '97%', 'margin' : '5px 0 0 5px', 'min-height' : '35px'});
      }
      if(halfButtons == 1) {
        for(var i = 1 ; i < messages.length + 1; i++) {
          if(messages[i - 1].length < 20) {
              $('.answer-proposals.ng-scope > button:nth-child(' + i + ')').css({'width' : '97%', 'margin' : '5px 0 0 5px', 'min-height' : '35px'});
          }
        }
      }
      // console.log($('#scrollingChat > div.answer-proposals.ng-scope.button:first'));
    };


    $scope.plotUserMessage = function(usrInput) {
      var userInput = usrInput || $scope.userInput;

      $scope.userInput = '';
      $scope.loading = false;
      $scope.resetLargeText();

      $scope.answer_proposals = undefined;
      $scope.warnings = undefined;

      $scope.messages.push({
        text: userInput,
        user: 'human',
        received: false
      });

      $scope.scrollToChatBottom();
    }

    // request next message from dialog service
    // TODO add plotUserMessage to before all methodcalls of conductConversation
    $scope.conductConversation = function(usrInput) {
      if ($scope.oneWordSearch) {
        $scope.numQuestionsShown = 10;
      }
      $scope.typing = true;
      $scope.lockLevelPlaceholder = "Ihre Nachricht";
      var userInput = usrInput || $scope.userInput;

      var timeoutFunction = function(message) {
        // plot watson messages
        $scope.messages.push(message);
        if (message.feedbackAllowed) {
          if (message.automatedRated && $scope.setNegativeRatingAutomatically) {
            var lastIndex = $scope.messages.length - 1;
            $scope.setNegativeRating(lastIndex, true);
          }
          $scope.typing = false;
        }

        // Tooltip (Bootstrap --> https://www.w3schools.com/bootstrap/bootstrap_tooltip.asp)
        $(document).ready(function() {
          $timeout(function() {
            // console.log('Tooltip / timeoutFunction --> in ready()'); // debug
            $('[data-toggle="tooltip"]').tooltip();
          }, 100, true);
        });

        // Add user cursor focus on input field
        var textInput = document.getElementById("textInput");
        textInput.focus();

        $scope.scrollToChatBottom();
      }


      conversationService.sendQuestionAndReceiveAnswer($scope.clientId, conversation.context, userInput).then(function(data) {
        console.log("'''#######################################################")
        console.log(data)
        console.log("'''#######################################################")
        $scope.loading = false;
        $scope.lockLevel = data.lockLevel;
        $scope.locked = data.lockLevel > 0 ? true : false; //TODO kann das raus? wird nicht mehr benutzt von olivialike

        if ($scope.lockLevel == 1) { // inputfield disabled "Ihre Nachricht"
          $scope.lockLevelPlaceholder = "Ihre Nachricht..."
        } else if ($scope.lockLevel == 2) { // inputfield disabled bei Antwortvorschläge
          $scope.lockLevelPlaceholder = "Bitte wählen Sie einen der Vorschläge";
        } else if ($scope.lockLevel == 3) { // inputfield disabled bei profanity
          $scope.lockLevelPlaceholder = "";
        }

        // check if conversation feedback is requested
        if (data.actions.indexOf('requestConversationFeedback') !== -1 && $scope.conversationFeedbackGiven == false) {
          $scope.requestConversationFeedback = true;
        }

        // check if One-Word-Search
        if (data.action === 'callFindQuestions') {
          $scope.oneWordSearch = true;
        } else {
          $scope.oneWordSearch = false;
        }

        conversation.context = data.context;

        var tmp = document.createElement("DIV");
        tmp.innerHTML = data.text[0];
        var responseStripped = tmp.textContent || tmp.innerText || "";

        var textArray = data.text;

        if (data.text.length > 0) {
          var wait = 0;
          for (var i = 0; i < data.text.length; i++) {
            var text = data.text[i];
            var text_without_html = String(text).replace(/<[^>]+>/gm, '');
            var message = {};
            if ((i + 1) === data.text.length) {
              message.feedbackAllowed = true;
            }

            message.text = data.text[i];
            message.strippedText = responseStripped;
            message.user = 'watson';
            message.messageId = data.messageId;
            message.topIntent = data.topIntent ? data.topIntent : undefined;
            message.topConfidence = data.confidence ? data.confidence.toString() : undefined;
            message.entities = data.entities;
            message.longAnswerId = data.answer_id ? data.answer_id : undefined;
            message.longAnswer = data.largeText ? data.largeText : undefined;
            message.automatedRated = data.rated ? data.rated : undefined;

            // add message to messages array in angular scope
            $timeout(timeoutFunction, wait, true, message);

            if (!$rootScope.showDebug) {
              var add_wait = text_without_html.length * 30;
              if (add_wait < 750) {
                add_wait = 750;
              }
              var wait = wait + add_wait;
            }
          }
        } else {
          var message = {};
          message.feedbackAllowed = true;
          message.text = "";
          message.strippedText = "";
          message.user = 'watson';
          message.messageId = data.messageId;
          message.topIntent = data.topIntent ? data.topIntent : undefined;
          message.topConfidence = data.confidence ? data.confidence.toString() : undefined;
          message.entities = data.entities;
          message.longAnswerId = data.answer_id ? data.answer_id : undefined;
          message.longAnswer = data.largeText ? data.largeText : undefined;
          message.automatedRated = data.rated ? data.rated : undefined;

          // add message to messages array in angular scope
          $timeout(timeoutFunction, 0, true, message);
        }

        var watsonTextMerged = "";
        for (var textIndex in data.text) {
          watsonTextMerged = watsonTextMerged + data.text[textIndex];
        }

        if (data.answer_proposals && data.answer_proposals.length > 0) {
          $scope.answer_proposals = data.answer_proposals;
          // sort answer_proposals by size
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
          $scope.answer_proposals = evaSortProposalsBySize($scope.answer_proposals);
        }

        if (data.warnings) {
          $scope.warnings = data.warnings;
        }

        if (watsonTextMerged.length > 0)
          $scope.loadAudio(watsonTextMerged);

        if (data.largeText && data.largeText.length > 0) {
          if (data.largeText.length > 1) {
            var largeText = "";
            var i = 0;
            data.largeText.forEach(function(doc) {
              i++;
              /*
              largeText += '<div id="parent_vorschlag_' + i + '" class="max-height-div"><h2>Vorschlag ' + i + ':</h2><br />';
              largeText += doc;
              largeText += '</div><div id="fadout_vorschlag_' + i + '" class="fadeout-div"></div><div type="button" class="btn btn-secondary btn-lg btn-block" onclick="readMore('+i+')">Weiterlesen</div>';
              */
              largeText += '<div><h2>Vorschlag ' + i + ':</h2><br />';
              largeText += doc;
              largeText += '</div>';
            });
            $scope.largeWatsonText = largeText;
          } else {
            $scope.largeWatsonText = data.largeText[0];
          }
        }

        if($scope.debugmode) {
          $scope.debugOutput = JSON.stringify(data.debug, null, 4);

          $scope.entities = [];
          $scope.entities = data.debug.callConversation.data.entities;
          $scope.intents = [];
          var intents = data.debug.callConversation.data.intents;
          var intent_counter = 0;
          for (var index in intents) {
            if (index < 3) {
              $scope.intents.push(intents[index]);
              $scope.intents[index].confidence = Math.round($scope.intents[index].confidence * 100).toFixed(2);
            } else {
              break;
            }
          }
        }

      }, function(data) {
        console.log(data);
        $scope.loading = false;
        $scope.typing = false;



        $scope.chatError = "In der Kommunikation mit Watson ist ein Fehler aufgetreten:";
        $scope.errorText = JSON.stringify(data, null, 4);
        $scope.debugOutput = JSON.stringify(data.debug, null, 4);

        $scope.messages.push({
          text: data.text,
          user: 'watson'
        });

        $scope.scrollToChatBottom();
      });
    };
    // scroll to the last watson message
    $scope.scrollToChatBottom = function() {
      $timeout(function() // execute script after specific delay
      {
        var scrollingChat = document.querySelector("#scrollingChat"); //fetch scrolling chat element
        var allMessages = scrollingChat.querySelectorAll(".ng-scope.from-watson"); // get all 'from-watson' elements
        var last = allMessages[allMessages.length - 1]; // grab last 'from-watson' element

        // set scrollTop property(the number of pixels an element's content is scrolled vertically)
        // 49 is the constant chat header size with padding
        $("#scrollingChat").animate({scrollTop: (last.offsetTop - 49)}, 'slow', 'swing');

        // stop scrolling if user scroll
        // if($scope.autoScrollStop) {
        //   $("#scrollingChat").bind('scroll wheel DOMMouseScroll mousewheel', function (e) {
        //     if (e.which > 0 || e.type == "mousedown"|| e.type == "mouseup" || e.type == "mousewheel" || e.type == "touchmove") {
        //       $("#scrollingChat").stop(); // stop animation
        //     }
        //   });
        // }
      }, 100); // amount of delay
    };


    $scope.deleteError = function() {
      $scope.chatError = "";
      $scope.errorText = "";
    };

    $scope.showLargeText = function(answerId) {
      conversationService.getLongAnswerById($scope.clientId, answerId).then(function(data) {
        $scope.largeWatsonText = data.answer_long;
      }, function(data) {
        $scope.chatError = "Beim Laden der Antwort aus der Datenbank ist ein Fehler aufgetreten:";
        if (data === "answer_not_found") {
            $scope.errorText = "Antwort-ID \"" + answerId + "\" konnte nicht gefunden werden.";
        } else {
            $scope.errorText = JSON.stringify(data, null, 4);
        }
      });
    };

    $scope.resetLargeText = function() {
      $scope.largeWatsonText = "";
    };

    var input = "";
    var concatTimeout;
    $scope.inputKeyDown = function(event) {
      // Submit on enter key, dis-allowing blank messages
      if (event.keyCode === 13 && $scope.userInput) {
        input += $scope.userInput + " ";
        $scope.plotUserMessage();
      }
      if (concatTimeout) {
          $timeout.cancel(concatTimeout);
      }
      var duration = event.keyCode === 13 ? $scope.shortConcatTimeout : $scope.longConcatTimeout;
      concatTimeout = $timeout(function() {
        if (!input) {
          return;
        }
        $scope.conductConversation(input);
        input = "";
      }, duration, true);
    };

    $scope.sendMessage = function(usrInput) {
      $scope.plotUserMessage(usrInput);

      var textInput = document.getElementById("textInput");
      textInput.focus();

      $scope.conductConversation(usrInput);
    }

    // save user rating in database
    $scope.setPositiveRating = function(index, positive) {

      $scope.messages[index].rated = true;
      $scope.messages[index].feedback = positive ? 'positive' : 'negative';

      // call service to save positive or negative rating in database
      conversationService.saveFeedback($scope.clientId,
            $scope.messages[index].messageId,
            $scope.messages[index].feedback,
            $scope.messages[index].comment || false
        )
        .then(function(data) {
          $scope.messages[index].id = data.id;
          $scope.messages[index].rev = data.rev;
        }, function(data) {
          $scope.chatError = "Feedback konnte nicht gespeichert werden:";
          $scope.errorText = data;
          $scope.messages[index].rated = false;
          $scope.messages[index].feedback = undefined;
        });
    };

    // call service to store user comment in database
    $scope.setComment = function(index) {

        $scope.messages[index].commenting = false;
        $scope.messages[index].commented = true;

        conversationService.saveFeedback($scope.clientId,
                $scope.messages[index].messageId,
                $scope.messages[index].feedback || false,
                $scope.messages[index].comment
            )
            .then(function(data) {
                $scope.messages[index].id = data.id;
                $scope.messages[index].rev = data.rev;
            }, function(data) {
                $scope.chatError = "Feedback konnte nicht gespeichert werden:";
                $scope.errorText = data;
                $scope.messages[index].commenting = true;
                $scope.messages[index].commented = false;
            });
    };

    $scope.setNegativeRating = function(index, no_answer) {
        var feedbackRowSource = {};
        feedbackRowSource.no_answer = no_answer;
        var messages = $scope.messages;
        var messageId = $scope.messages[index].messageId;
        var j = 0;
        for(var i in messages) {
          if(messages[i].messageId === messageId) {
            if(j === 0) {
              feedbackRowSource.question = messages[i - 1];
              j = 1;
            }

            if(feedbackRowSource.answer && feedbackRowSource.answer.text) {
              feedbackRowSource.answer.text += messages[i].text;
            } else {
              feedbackRowSource.answer = JSON.parse(JSON.stringify(messages[i]));
            }
          }
        }

        $scope.setPositiveRating(index, false);

    };

    $scope.loadAudio = function(message) {
      if ($scope.audioEnabled) {
        console.log("loadAudio");
        var audio = new Audio('api/audio/get?text=' + message);
        audio.play();
      }
    }

    $rootScope.switchVolumeControl = function() {
      var volumeControlButton = document.querySelector("#volume-control");
      volumeControlButton.className = volumeControlButton.className.replace('glyphicon-volume-off', '');
      volumeControlButton.className = volumeControlButton.className.replace('glyphicon-volume-up', '');
      if ($scope.audioEnabled) {
        $scope.audioEnabled = false;
        volumeControlButton.className += " glyphicon-volume-off";
      } else {
        $scope.audioEnabled = true;
        volumeControlButton.className += " glyphicon-volume-up";
      }
    };

    $scope.show_large_text = function() {
      var long_answer_div = document.querySelector("#long_answer_div");
      long_answer_div.style.left = "0";

      var show_chat = document.querySelector("#show_chat");
      show_chat.style.display = "block";

      var show_large_text = document.querySelector("#show_large_text");
      show_large_text.style.display = "none";
    }

    $scope.show_chat = function() {
      var long_answer_div = document.querySelector("#long_answer_div");
      long_answer_div.style.left = "100%";

      var show_chat = document.querySelector("#show_chat");
      show_chat.style.display = "none";

      var show_large_text = document.querySelector("#show_large_text");
      show_large_text.style.display = "block";
    }

    $scope.toggleChat = function() {
      chatIsclicked=true;
       setTimeout(function () {
         var textInput = document.getElementById("textInput");
         textInput.focus();
       }, 1000);
      var chat_display_div = document.querySelector("#chat_display");
      var chatTitleSign=document.getElementById('chatTitleSign');
      var chatTitle=document.getElementById('chatTitle');
      if(chat_display_div.className.indexOf('chat_content_show') >= 0) {
        chatTitleSign.title="Maximieren";
        chat_display_div.className = chat_display_div.className.replace('chat_content_show', '');
        $scope.toggleAdditionalContent(true);
      } else {
        chatTitleSign.title="Minimieren";
        chat_display_div.className += ' chat_content_show';
      }
      chatTitle.addEventListener("click", function(){
        if(chat_display_div.className.indexOf('chat_content_show') >= 0) {
          chatTitleSign.className = "glyphicon glyphicon-menu-down";
        } else {
          chatTitleSign.className = "glyphicon glyphicon-menu-up";
        }
      });
    }

    $scope.toggleAdditionalContent = function(onlyRemove) {
      var additional_chat_display_div = document.querySelector("#additional_chat_display");
      if(additional_chat_display_div.className.indexOf('additional_content_show') >= 0) {
        additional_chat_display_div.className = additional_chat_display_div.className.replace('additional_content_show', '');
      } else {
        if(!onlyRemove) {
          additional_chat_display_div.className += ' additional_content_show';
        }
      }
    }

    $scope.resetSession = function() {
      $scope.resetButtonDisabled = true;
      $http({
        method: 'POST',
        url: '/api/session/reset',
        data: {
          clientId: $scope.clientId
        }
      }).then(function(response) {
        if(response.status === 200 && response.data.session_reset === true) {
          console.log("session reset ok")
          init();
          startConversation(function() {
            $scope.resetButtonDisabled=false;
            chatNote();

          });
        } else {
          $scope.error = "Session konnte nicht gelöscht werden.<br />Debug:" + JSON.stringify(response);
          $scope.resetButtonDisabled=false;

        }

      }, function(error) {
        $scope.error = "Session konnte nicht gelöscht werden.<br />Debug:" + JSON.stringify(error);
        $scope.resetButtonDisabled=false;
      });
    };
    $scope.resetSession();

    var chatNote=function(){
      var bubblechatNote =document.getElementById("bubblechat_note");
        //first time chatNote appeared
      setTimeout(function () {
        if(chatIsclicked === false){
          bubblechatNote.style.display="block";
          fadeIn(bubblechatNote);
          if(shakeAtFirstAppear) {
              setTimeout(function(){
                var shakeAnimation = setInterval(function(){
                  shake();
                },700);
                setTimeout(function(){
                  clearInterval(shakeAnimation);
                }, 2150);
              }, 1200);
          }

          setTimeout(function () {
            fadeOut(bubblechatNote);
          }, ChatBubbleNoteAppearenceTime);

        }

      }, firstAppearChatBubbleNote);
      //second time chatNote appeared
      setTimeout(function () {
        if(chatIsclicked === false){
          bubblechatNote.style.display="block";
          fadeIn(bubblechatNote);
          if(shakeAtSecondAppear) {
              setTimeout(function(){
                var shakeAnimation = setInterval(function(){
                  shake();
                },700);
                setTimeout(function(){
                  clearInterval(shakeAnimation);
                }, 2150);
              }, 1200);
          }

          setTimeout(function () {
            fadeOut(bubblechatNote);
          }, ChatBubbleNoteAppearenceTime);

        }

      }, scondAppearChatBubbleNote);
      //third time chatNote appeared
      setTimeout(function () {
        if(chatIsclicked === false){
          bubblechatNote.style.display="block";
          fadeIn(bubblechatNote);
          if(shakeAtThirdAppear) {
              setTimeout(function(){
                var shakeAnimation = setInterval(function(){
                  shake();
                },700);
                setTimeout(function(){
                  clearInterval(shakeAnimation);
                }, 2150);
              }, 1200);
          }

          setTimeout(function () {
            fadeOut(bubblechatNote);
          }, ChatBubbleNoteAppearenceTime);

        }

      }, thirdAppearChatBubbleNote);


    }

    $scope.chatAppears = function(){
      var chatAppearAfterClick = document.getElementById("chat");
      chatAppearAfterClick.style.display = "block";
      setTimeout(function () {
        var bubblechatNote =document.getElementById("bubblechat_note");
        bubblechatNote.style.display= "none";
        var bubblechat =document.getElementById("bubblechat");
        bubblechat.style.display= "none";
        $scope.toggleChat();
        var chatTitleSign=document.getElementById("chatTitleSign")
        chatTitleSign.className = "glyphicon glyphicon-menu-down";
      }, 1000);
    }


    var  fadeIn = function(elem) {

      elem.style.opacity = 0;
      var incOpacity=0;
			var inInterval = setInterval(function() {
        incOpacity+=0.1
        elem.style.opacity = incOpacity;
				if (elem.style.opacity >= 1){
          clearInterval(inInterval);
        }
			}, 70 );
    }

    var fadeOut = function(elem) {
      elem.style.opacity = 1;
      var decOpacity=1;
      var outInterval = setInterval(function() {
        decOpacity-=0.1
        elem.style.opacity = decOpacity;
        if (elem.style.opacity <= 0){
          clearInterval(outInterval);
          elem.style.display= "none";
        }
      }, 70 );
    }


  var shake = function(){
    var bubblechatNote =document.getElementById("bubblechat_note");
    var animation = setInterval(function(){
      animationShakeSpeechbubblePositions();
    },100);

    setTimeout(function(){
      clearInterval(animation)
    },350);
  }

 var animationShakeSpeechbubblePositions=function(){
   var bubblechatNote =document.getElementById("bubblechat_note");
   setTimeout(function(){
     bubblechatNote.style.right = 9.5 + "em";
   },10);
   setTimeout(function(){
     bubblechatNote.style.right = 10.3+ "em";
   },20);
   setTimeout(function(){
     bubblechatNote.style.right = 9.5 + "em";
   },30);
   setTimeout(function(){
     bubblechatNote.style.right = 10.3 + "em";
   },40);
   setTimeout(function(){
     bubblechatNote.style.right = 9.5 + "em";
   },50);
   setTimeout(function(){
     bubblechatNote.style.right = 10.3 + "em";
   },60);
   setTimeout(function(){
     bubblechatNote.style.right = 9.5 + "em";
   },70);
   setTimeout(function(){
     bubblechatNote.style.right = 10.3 + "em";
   },80);
   setTimeout(function(){
     bubblechatNote.style.right = 10+ "em";
   },90);
 }

 // save user feedback about conversation in database
 $scope.saveConversationFeedback = function(stars, feedback) {

   $scope.checkedStar = stars;
   $scope.conversationFeedback = feedback;

  //  call service to save rating and comment in database
   conversationService.saveConversationFeedback($scope.conversationFeedback, $scope.checkedStar, $scope.clientId)
     .then(function(data) {
     }, function(data) {
       $scope.chatError = "Feedback konnte nicht gespeichert werden:";
       $scope.errorText = data;
     });

      $scope.conversationFeedbackGiven = true;
      $scope.requestConversationFeedback = false;
 };

 // set feedback to false
 $scope.cancelConversationFeedback = function() {
      $scope.requestConversationFeedback = false;
 };

}]);
