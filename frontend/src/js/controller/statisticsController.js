/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */

angular.module('eva.statistics').controller('StatisticsCtrl', ['$http', '$scope', 'conversationService',
  function($http, $scope, conversationService) {
    $scope.statisticsLoading = true;
    $scope.availableClients = [];
    $scope.error = false;
    $scope.errorText = "";

    var d = new Date();
    var today = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var localOffset = (-1) * today.getTimezoneOffset() * 60000;
    var todayTimestamp = getThisEvening(today);
    $scope.today = new Date(todayTimestamp).toDateString();
    var oneWeekBefore = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7);
    var oneWeekBeforeTimestamp = getThisMorning(oneWeekBefore);
    $scope.filter = {
      chosenClient: undefined,
      startDate: oneWeekBeforeTimestamp,
      endDate: todayTimestamp
    }
    $scope.loadingOne = false;
    $scope.loadingTwo = false;
    $scope.loadingThree = false;
    $scope.loadingFour = false;
    $scope.loadingFourB = false;
    $scope.loadingFourC = false;
    $scope.loadingFive = false;
    $scope.loadingSix = false;
    $scope.loadingSeven = false;
    $scope.weeklyBarChartStart = "";
    $scope.weeklyBarChartEnd = "";
    $scope.intervalStartDate = "";
    $scope.intervalEndDate = "";
    $scope.startOfMonth = "";
    $scope.firstDataEntry = "";

    // draw statistics with default params: 1 week interval and client
    getClients(function() {
      getStatistics();
    });

    // watch for loading
    $scope.$watch('statisticsLoading', function() {
      if ($scope.statisticsLoading == true) {
        var blur = document.getElementsByClassName("blur_hide");
        blur.className = "ng-show";
        // hide display
      } else {
        var blur = document.getElementById("blur_hide");
        blur.style.opacity = 0;
        blur.style.visibility = "hidden";
      }
    });

    function checkIfAllComplete() {
      if (!$scope.loadingOne && !$scope.loadingTwo && !$scope.loadingThree && !$scope.loadingFour && !$scope.loadingFourB && !$scope.loadingFourC && !$scope.loadingFive && !$scope.loadingSix && !$scope.loadingSeven) {
        $scope.statisticsLoading = false;

        // datetimepicker functionality
        $(function() {
          $('#datetimepickerFrom').datetimepicker({
            format: 'DD/MM/YYYY',
            defaultDate: $scope.filter.startDate,
          });
          $('#datetimepickerTill').datetimepicker({
            format: 'DD/MM/YYYY',
            useCurrent: false,
            defaultDate: $scope.filter.endDate,
          });
          $("#datetimepickerFrom").on("dp.change", function(e) {
            $scope.filter.startDate = getThisMorning(e.date);
            getStatistics();
          });
          $("#datetimepickerTill").on("dp.change", function(e) {
            $scope.filter.endDate = getThisEvening(e.date);
            getStatistics();
          });
        });
      }
    };


    function getClients(callback) {
      $http({
        method: "POST",
        url: '/api/user/getClientsForUser/true/false'
      }).then(function(response) {
        var data = response.data;
        if (data.length > 0) {
          $scope.availableClients = data;
          for (var i = 0; i < data.length; i++) {
            if (data[i].id == "admin") {
              $scope.availableClients.splice(i, 1);
            }
          }
          $scope.filter.chosenClient = $scope.availableClients[0].id;
          callback();
        }
      }, function(response) {
        $scope.errorText = "Couldn't load clients.";
      });
    };

    // draw statistics diagrams
    function getStatistics(callback) {
      $scope.statisticsLoading = true;
      $scope.error = false;
      if (!$scope.filter.chosenClient) return;
      if (($scope.filter.endDate - $scope.filter.startDate) < 0) {
        $scope.error = true;
        $scope.errorText = "The end date can not be before the start date. Please choose a different end date.";
        return;
      } else if (($scope.filter.endDate - $scope.filter.startDate) < 1000 * 60 * 60 * 24) {
        $scope.error = true;
        $scope.errorText = "You have to pick at least an interval of 1 day.";

        return;
      }

      console.info("draw statistics from interval >> " + (new Date($scope.filter.startDate)).toDateString() + " << till >> " + (new Date($scope.filter.endDate)).toDateString() + " <<");
      $scope.statistics = [];
      $scope.loadingOne = true;
      $scope.loadingTwo = true;
      $scope.loadingThree = true;
      $scope.loadingFour = true;
      $scope.loadingFourB = true;
      $scope.loadingFourC = true;
      $scope.loadingFive = true;
      $scope.loadingSix = true;
      $scope.loadingSeven = true;
      $scope.intervalStartDate = new Date($scope.filter.startDate).toDateString();
      $scope.intervalEndDate = new Date($scope.filter.endDate).toDateString();
      $scope.startOfMonth = new Date(getFirstDayOfTheMonth()).toDateString();

      $scope.getMessagesPerUser($scope.filter.chosenClient, $scope.filter.startDate, $scope.filter.endDate, function(status) {
        $scope.loadingOne = status;
        checkIfAllComplete();
      });
      $scope.getUserStatistic($scope.filter.chosenClient, $scope.filter.startDate, $scope.filter.endDate, function(status) {
        $scope.loadingTwo = status;
        $scope.getMessagesStatistic($scope.filter.chosenClient, function(status) {
          $scope.loadingThree = status;
          checkIfAllComplete();
        });
        checkIfAllComplete();
      });
      $scope.getConversationsByDay($scope.filter.chosenClient, $scope.filter.startDate, $scope.filter.endDate, function(status) {
        $scope.loadingFour = status;
        checkIfAllComplete();
      });
      $scope.getConversationsByHour($scope.filter.chosenClient, $scope.filter.startDate, $scope.filter.endDate, function(status) {
        $scope.loadingFourB = status;
        checkIfAllComplete();
      });
      $scope.getConversationsLongterm($scope.filter.chosenClient, $scope.filter.startDate, $scope.filter.endDate, function(status) {
        $scope.loadingFourC = status;
        checkIfAllComplete();
      });
      $scope.getClientStatistic($scope.filter.chosenClient, function(status) {
        $scope.loadingFive = status;
        checkIfAllComplete();
      });
      $scope.getTopIntentStatistic($scope.filter.chosenClient, $scope.filter.startDate, $scope.filter.endDate, function(status) {
        $scope.loadingSix = status;
        checkIfAllComplete();
      });
      $scope.getAnswerFromStatistic($scope.filter.chosenClient, $scope.filter.startDate, $scope.filter.endDate, function(status) {
        $scope.loadingSeven = status;
        checkIfAllComplete();
      });

    }

    $scope.getClientStatistic = function(clientId, callback) {
      conversationService.getClientStatistic(clientId).then(function(data) {
        console.log("data");
        console.log(data);
        if (data) {
          $scope.firstDataEntry = new Date(data.firstDate[0].firstDate).toDateString();
          // data formatting for client table on the left
          var clientTable = [];
          data.resultData.forEach(function(doc) {
            // calculate number per client
            var clientFeedback = {};
            clientFeedback.clientId = doc._id;
            clientFeedback.cnt_all = doc.positiveCount + doc.negativeCount + doc.falseCount;
            clientFeedback.cnt_pos = doc.positiveCount;
            clientFeedback.cnt_neg = doc.negativeCount;
            clientFeedback.cnt_und = doc.falseCount;

            // calculate percent per client
            clientFeedback.per_pos = clientFeedback.cnt_pos / clientFeedback.cnt_all;
            clientFeedback.per_und = clientFeedback.cnt_und / clientFeedback.cnt_all;
            clientFeedback.per_neg = clientFeedback.cnt_neg / clientFeedback.cnt_all;

            clientTable.push(clientFeedback);
          });
          $scope.clientTable = clientTable;

          // data formatting for client bar chart on the right
          $scope.clientBarChart = {
            labels: [],
            series: ["Positive", "Negative", "Undefined"],
            data: [],
            options: generalChartOptionsWithSeries
          }

          var positiveStatistics = [];
          var negativeStatistics = [];
          var undefinedStatistics = [];
          var counterPositive = 0;
          var counterNegative = 0;
          var counterUndefined = 0;
          var counterAll = 0;
          $scope.clientTable.forEach(function(clientFeedback) {
            $scope.clientBarChart.labels.push(clientFeedback.clientId);
            positiveStatistics.push((clientFeedback.per_pos * 100).toFixed());
            negativeStatistics.push((clientFeedback.per_neg * 100).toFixed());
            undefinedStatistics.push((clientFeedback.per_und * 100).toFixed());

            // for all clients diagramm
            counterPositive += clientFeedback.cnt_pos;
            counterNegative += clientFeedback.cnt_neg;
            counterUndefined += clientFeedback.cnt_und;
            counterAll += clientFeedback.cnt_all;
          });
          positiveStatistics.push((counterPositive / counterAll * 100).toFixed());
          negativeStatistics.push((counterNegative / counterAll * 100).toFixed());
          undefinedStatistics.push((counterUndefined / counterAll * 100).toFixed());
          $scope.clientBarChart.data.push(positiveStatistics);
          $scope.clientBarChart.data.push(negativeStatistics);
          $scope.clientBarChart.data.push(undefinedStatistics);
          $scope.clientBarChart.labels.push("All Clients");
        }
        return callback(false);

      }, function(data) {
        $scope.error = true;
        $scope.errorText = data;

        return callback();
      });
    }

    $scope.getMessagesStatistic = function(clientId, callback) {
      conversationService.getMessagesStatistic(clientId).then(function(data) {
        if (data) {
          if (!$scope.numOfUserTableChart) {
            $scope.numOfUserTableChart = {};
          }
          $scope.numOfUserTableChart.numOfMessagesToday = 0;
          $scope.numOfUserTableChart.numOfMessagesThisWeek = 0;
          $scope.numOfUserTableChart.numOfMessagesThisMonth = data.length;

          var thisMorning = getThisMorning(Date.now());
          var thisWeek = getFirstDayOfTheWeek();
          for (var i = 0; i < data.length; i++) { // user activity of 1 month

            if (data[i].created >= thisWeek) {
              $scope.numOfUserTableChart.numOfMessagesThisWeek++;

              if (data[i].created >= thisMorning) {
                $scope.numOfUserTableChart.numOfMessagesToday++;
              }
            }
          }
        }
        return callback(false);

      }, function(data) {
        $scope.error = true;
        $scope.errorText = data;

        return callback();
      });
    }

    $scope.getUserStatistic = function(clientId, start, end, callback) {

      var thisMorning = getThisMorning(Date.now());
      var thisWeek = getFirstDayOfTheWeek();
      if (!$scope.numOfUserTableChart) {
        $scope.numOfUserTableChart = {};
      }
      $scope.numOfUserTableChart.numOfUsersToday = 0;
      $scope.numOfUserTableChart.numOfUsersThisWeek = 0;
      $scope.numOfUserTableChart.numOfUsersThisMonth = 0;

      conversationService.getUserStatistic(clientId).then(function(dataMonth) {
        if (dataMonth) {
          var numOfUsersThisMonth;
          if (!dataMonth || !dataMonth[0] || !dataMonth[0].total) {
            numOfUsersThisMonth = 0;
          } else {
            numOfUsersThisMonth = dataMonth[0].total;
          }
          $scope.numOfUserTableChart.numOfUsersThisMonth = numOfUsersThisMonth;

        }
        return callback(false);
      }, function(dataMonth) {
        $scope.error = true;
        $scope.errorText = dataMonth;
        return callback();
      });

      conversationService.getUserStatistic(clientId, thisMorning).then(function(dataToday) {
        if (dataToday) {
          var numOfUsersToday;
          if (!dataToday || !dataToday[0] || !dataToday[0].total) {
            numOfUsersToday = 0;
          } else {
            numOfUsersToday = dataToday[0].total;
          }
          $scope.numOfUserTableChart.numOfUsersToday = numOfUsersToday;
        }
        return callback(false);
      }, function(dataToday) {
        $scope.error = true;
        $scope.errorText = dataToday;
        return callback();
      });

      conversationService.getUserStatistic(clientId, thisWeek).then(function(dataWeek) {
        if (dataWeek) {
          var numOfUsersThisWeek;
          if (!dataWeek || !dataWeek[0] || !dataWeek[0].total) {
            numOfUsersThisWeek = 0;
          } else {
            numOfUsersThisWeek = dataWeek[0].total;
          }
          $scope.numOfUserTableChart.numOfUsersThisWeek = numOfUsersThisWeek;
        }
        return callback(false);
      }, function(dataWeek) {
        $scope.error = true;
        $scope.errorText = dataWeek;
        return callback();
      });
    }



    // messages per user in the individual, given interval
    $scope.getMessagesPerUser = function(clientId, start, end, callback) {
      conversationService.getMessagesPerUser(clientId, start, end).then(function(data) {
        if (data) {
          $scope.messagesPerUserBarChart = {
            labels: ["<3 Nachr.", "3-5 Nachr.", "6-10 Nachr.", "11-15 Nachr.", ">15 Nachr."], // num of messages
            options: generalChartOptions,
            quitRate: 0,
            messagesPerUser: 0
          };

          // for the conversation statistic table chart
          var numOfUsersInGivenInterval = 0
          var numOfMessagesInGivenInterval = 0;

          // for messages per user bar chart
          var lessThanThreeMessages = 0;
          var threeToFiveMessages = 0;
          var sixToTenMessages = 0;
          var elevenToFifteenMessages = 0;
          var moreThanFifteenMessages = 0;
          for (var i = 0; i < data.length; i++) {
            if (data[i]._id < 3) { // num of messages <3 counts to quit rate users
              lessThanThreeMessages += data[i].numOfUsersPerXMessages;
            } else if (data[i]._id >= 3 && data[i]._id <= 5) {
              threeToFiveMessages += data[i].numOfUsersPerXMessages;
            } else if (data[i]._id >= 6 && data[i]._id <= 10) {
              sixToTenMessages += data[i].numOfUsersPerXMessages;
            } else if (data[i]._id >= 11 && data[i]._id <= 15) {
              elevenToFifteenMessages += data[i].numOfUsersPerXMessages;
            } else if (data[i]._id > 15) {
              moreThanFifteenMessages += data[i].numOfUsersPerXMessages;
            }
            numOfUsersInGivenInterval += data[i].numOfUsersPerXMessages;
            numOfMessagesInGivenInterval += data[i]._id * data[i].numOfUsersPerXMessages;
          };
          $scope.messagesPerUserBarChart.data = [lessThanThreeMessages, threeToFiveMessages, sixToTenMessages, elevenToFifteenMessages, moreThanFifteenMessages];


          $scope.messagesPerUserBarChart.quitRate = (lessThanThreeMessages / numOfUsersInGivenInterval * 100).toFixed();
          $scope.messagesPerUserBarChart.messagesPerUser = numOfMessagesInGivenInterval / numOfUsersInGivenInterval;
          $scope.messagesPerUserBarChart.messagesInInterval = numOfMessagesInGivenInterval;
          $scope.messagesPerUserBarChart.usersInInterval = numOfUsersInGivenInterval;
        }
        return callback(false);

      }, function(data) {
        $scope.error = true;
        $scope.errorText = data;

        return callback();
      });
    }

    $scope.getConversationsByDay = function(clientId, start, end, callback) {

      conversationService.getConversationsByDay(clientId, start, end).then(function(data) {
        if (data) {

          var numOfWeeks = Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 7)); // num of weeks between the two given timestamps

          start = end - (((numOfWeeks * 7) - 1) * 24 * 60 * 60 * 1000);

          $scope.weeklyBarChartStart = new Date(start).toDateString();
          $scope.weeklyBarChartEnd = new Date(end).toDateString();


          $scope.weeklyUserBarChart = {
            data: Array(7).fill(0),
            labels: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
            options: generalChartOptions
          };

          for (i = 0; i < data.length; i++) {

            var weekday = data[i]._id.day;
            $scope.weeklyUserBarChart.data[weekday - 1] = data[i].total;

          }

          // // calculate average values of week
          for (var i = 0; i < $scope.weeklyUserBarChart.data.length; i++) {
            $scope.weeklyUserBarChart.data[i] = Math.round($scope.weeklyUserBarChart.data[i] / numOfWeeks);
          }
        }
        return callback(false);

      }, function(data) {
        $scope.error = true;
        $scope.errorText = data;

        return callback();
      });
    }

    $scope.getConversationsByHour = function(clientId, start, end, callback) {
      conversationService.getConversationsByHour(clientId, start, end).then(function(data) {
        if (data) {
          var numOfDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1; // num of days between the two given timestamps

          $scope.dailyUserLineChart = {
            data: Array(24).fill(0),
            labels: [],
            options: generalChartOptions
          };

          for (i = 0; i < data.length; i++) {

            var time = data[i]._id.hour;
            $scope.dailyUserLineChart.labels[time] = time + ":00 Uhr";
            $scope.dailyUserLineChart.data[time] = data[i].total;

          }

          // // calculate average values of day
          for (var i = 0; i < $scope.dailyUserLineChart.data.length; i++) {
            $scope.dailyUserLineChart.data[i] = (Math.round(($scope.dailyUserLineChart.data[i] / numOfDays) * 10) / 10);
          }
        }
        return callback(false);

      }, function(data) {
        $scope.error = true;
        $scope.errorText = data;

        return callback();
      });
    }

    $scope.getConversationsLongterm = function(clientId, start, end, callback) {
      conversationService.getConversationsLongterm(clientId, start, end).then(function(data) {
        if (data) {
          var numOfDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1; // num of days between the two given timestamps


          $scope.longTermUserLineChart = {
            data: Array(numOfDays).fill(0),
            labels: [],
            options: generalChartOptions
          };

          for (i = 0; i < data.length; i++) {

            var time = new Date(data[i]._id.day);

            $scope.longTermUserLineChart.labels[i] = time.toDateString();
            $scope.longTermUserLineChart.data[i] = data[i].total;

          }
        }
        return callback(false);

      }, function(data) {
        $scope.error = true;
        $scope.errorText = data;

        return callback();
      });
    }

    $scope.getTopIntentStatistic = function(clientId, start, end, callback) {
      conversationService.getTopIntentStatistic(clientId, start, end).then(function(data) {
        if (data) {
          $scope.topIntentBarChart = {
            labels: [],
            data: [],
            options: generalChartOptions
          };

          // calculate average values of day or week
          var temp = 0;
          for (var i = 0; i < data.length; i++) {
            $scope.topIntentBarChart.labels[i] = data[i]._id;
            $scope.topIntentBarChart.data[i] = data[i].topIntentCount;
            temp += data[i].topIntentCount;
          }
          for (var i = 0; i < data.length; i++) {
            $scope.topIntentBarChart.data[i] = (data[i].topIntentCount / temp * 100).toFixed();
          }
        }
        return callback(false);

      }, function(data) {
        $scope.error = true;
        $scope.errorText = data;

        return callback();

      });
    }

    $scope.getAnswerFromStatistic = function(clientId, start, end, callback) {

      conversationService.getAnswerFromStatistic(clientId, start, end).then(function(data) {
        if (data) {
          $scope.answerFromBarChart = {
            labels: [],
            data: [],
            options: generalChartOptions
          };

          // calculate average values of day or week
          var temp = 0;
          for (var i = 0; i < data.length; i++) {
            $scope.answerFromBarChart.labels[i] = data[i]._id;
            $scope.answerFromBarChart.data[i] = data[i].answerFromCount;
            temp += data[i].answerFromCount;
          }
          for (var i = 0; i < data.length; i++) {
            $scope.answerFromBarChart.data[i] = (data[i].answerFromCount / temp * 100).toFixed();
          }
        }
        return callback(false);

      }, function(data) {
        $scope.error = true;
        $scope.errorText = data;

        return callback();
      });
    }

    // returns a timestamp of this morning 00:00am
    function getThisMorning(d) {
      d = new Date(d);
      d.setHours(0);
      d.setMinutes(0);
      d.setSeconds(0);
      d.setMilliseconds(0);
      return d.getTime();
    }

    // returns a timestamp of this evening 23:59pm
    function getThisEvening(d) {
      d = new Date(d);
      d.setHours(23);
      d.setMinutes(59);
      d.setSeconds(59);
      d.setMilliseconds(599);
      return d.getTime();
    }

    // returns a timestamp of the monday this week
    function getFirstDayOfTheWeek() {
      var d = new Date();
      var day = d.getDay();
      var diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
      var firstDayOfTheWeek = new Date(d.setDate(diff));
      return getThisMorning(firstDayOfTheWeek);
    }

    // returns the first day of the month
    function getFirstDayOfTheMonth() {
      var d = new Date();
      var firstDayOfTheMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      return getThisMorning(firstDayOfTheMonth);
    }

    // show all labels, dont show series legend, show tooltips
    var generalChartOptions = {
      scaleShowValues: true,
      scales: {
        xAxes: [{
          ticks: {
            beginAtZero: true,
            autoSkip: false,
            suggestedMin: 0,
            stepSize: 1
          }
        }]
      },
      legend: {
        display: false
      },
      hover: {
        animationDuration: 2
      },
    }

    // show all labels, show series legend, show tooltips
    var generalChartOptionsWithSeries = {
      scaleShowValues: true,
      scales: {
        xAxes: [{
          ticks: {
            beginAtZero: true,
            autoSkip: false,
            suggestedMin: 0,
            stepSize: 1
          }
        }]
      },
      legend: {
        display: true
      },
      hover: {
        animationDuration: 2
      },
    }

    $scope.setClientStatistics = function() {
      getStatistics();
    }
  }
]);
