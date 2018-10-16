/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */

angular.module('eva.kfoldOverview')
    .controller('KFoldCtrl', ['$scope', '$http', '$interval', '$window', '$location', '$translate', 'ConfigService', '$uibModal', '$rootScope',
        function($scope, $http, $interval, $window, $location, $translate, ConfigServices, $uibModal, $rootScope) {

            $scope.kValues = [5, 6, 7, 8, 9, 10];
            $scope.selectedK = 10;
            $scope.testStatus = "no status";
            $scope.testInProgress = null;
            $scope.displayOption = "conf";
            $scope.isLoading = true;
            $scope.clientSelection = {};
            $scope.clientSelection.availableClients = [];
            $scope.disableClientChange = false;

            var getClients = function() {
                $scope.isLoading = true;
                $http({
                    method: "POST",
                    url: '/api/user/getClients/true/false'
                }).then(function(response) {
                    var data = response.data;
                    if (data.length > 0) {
                        $scope.clientSelection.availableClients = data;
                    }
                }, function(response) {
                    $scope.errorText = "Mandanten konnten nicht geladen werden.";
                });
            };
            getClients();

            $scope.changeClient = function() {
                $scope.clientSelection.chosen = "";
            }

            $scope.setClient = function() {
                $scope.disableClientChange = true;
                $scope.error = null;
                $scope.errorText = null;
                $scope.testTimes = undefined;
                $scope.isRunning();
            };

            $scope.isRunning = function() {
                $http({
                    method: "GET",
                    url: '/api/testing/kfold/running'
                }).then(function(response) {
                    $scope.testInProgress = response.data.testInProgress;
                    if ($scope.testInProgress) {
                            var status = $interval(function() {
                                $http({
                                    method: "POST",
                                    url: '/api/testing/kfold/status',
                                    data: {
                                        date: $scope.date
                                    }
                                }).then(function(response) {
                                    $scope.testProgress = response.data.testProgress;
                                    $scope.testStatus = response.data.status;
                                    if (response.data.status === "finished") {
                                        $scope.testStatus = "finished";
                                        $scope.testInProgress = false;
                                        $scope.testDate = response.data.testResult[0]._id.date;
                                        $scope.getResult($scope.testDate);
                                        $interval.cancel(status);
                                    }
                                }, function(error) {
                                    $rootScope.testStatus = "failed"
                                    $rootScope.testInProgress = false;
                                    $interval.cancel(status);
                                });
                            }, 5000);
                    } else {
                        $scope.testStatus = "finished"
                    }
                    $scope.getTestTimes();
                }, function(error) {
                    $scope.$parent.failed_get = $translate.instant('INTENTS_ERROR');
                });
            };

            $scope.getIntents = function() {
                $http({
                    method: "POST",
                    url: '/api/testing/kfold/intents',
                    data: {
                        clientId: $scope.clientSelection.chosen
                    }
                }).then(function(response) {
                    $scope.intents = response.data.intents;
                    $scope.tableObject = createTableObject($scope.testResult, $scope.intents);
                }, function(error) {
                    $scope.$parent.failed_get = $translate.instant('INTENTS_ERROR');
                });
            };


            $scope.getTestTimes = function() {
                $http({
                    method: "POST",
                    url: '/api/testing/kfold/times',
                    data: {
                        clientId: $scope.clientSelection.chosen
                    }
                }).then(function(response) {
                    if (response.data[0]) {
                        $scope.testTimes = response.data;
                        $scope.selectedTime = $scope.testTimes[0];
                        $scope.date = $scope.testTimes[0]._id;
                        $scope.getResult($scope.date);
                    } else {
                        $scope.disableClientChange = false;
                        $scope.isLoading = false;
                    }
                }, function(error) {
                    $scope.$parent.failed_get = $translate.instant('INTENTS_ERROR');
                });
            };


            $scope.getResult = function(date) {
                $scope.isLoading = true;
                $http({
                    method: "POST",
                    url: '/api/testing/kfold/result',
                    data: {
                        date: date,
                        clientId: $scope.clientSelection.chosen
                    }
                }).then(function(response) {
                    $scope.testResult = response.data[0];
                    if ($scope.testResult.frequency) {
                        $scope.tableObject = createTableObject($scope.testResult, $scope.testResult.frequency);
                    } else {
                        $scope.getIntents();
                    }
                }, function(error) {
                    $scope.$parent.failed_get = $translate.instant('INTENTS_ERROR');
                });
            };


            $scope.getResultsForDate = function(date) {
                $scope.getResult(date._id);
            }


            $scope.runTest = function(k) {
                $scope.testInProgress = true;
                $scope.testStatus = "watsonIsTraining";

                $http({
                    method: "POST",
                    url: '/api/testing/kfold/run',
                    data: {
                        clientId: $scope.clientSelection.chosen,
                        k: k
                    }
                }).then(function(response) {
                    var status = $interval(function() {
                        $http({
                            method: "POST",
                            url: '/api/testing/kfold/status',
                            data: {
                                date: null
                            }
                        }).then(function(response) {
                            $scope.testProgress = response.data.testProgress;
                            $scope.testStatus = response.data.status;
                            if ($scope.testStatus === "finished") {
                                $scope.testStatus = "finished";
                                $scope.testInProgress = false;
                                $scope.testDate = response.data.testResult[0]._id.date;
                                $scope.getResult($scope.testDate);
                                $interval.cancel(status);
                            }
                        }, function(error) {
                            $rootScope.testStatus = "failed"
                            $rootScope.testInProgress = false;
                            $interval.cancel(status);
                        });
                    }, 10000);
                }, function(error) {
                    $rootScope.testStatus = "failed"
                    $rootScope.testInProgress = false;
                });
            };

            $scope.showTestcasesModal = function(run, index, intent) {
                $scope.testcasesPerRunCases = run.examples;
                $scope.testcasesPerRunIndex = index;
                $scope.testcasesPerRunIntent = intent;

                for (var i = 0; i < $scope.testcasesPerRunCases.length; i++) {
                    if ($scope.testcasesPerRunCases[i].classifiedIntent === undefined) {
                        $scope.testcasesPerRunCases[i].classifiedIntent = $scope.testcasesPerRunIntent;
                    }
                    $scope.testcasesPerRunCases[i].confidence = Math.round($scope.testcasesPerRunCases[i].confidence * 100) / 100;
                }

                $uibModal.open({
                    templateUrl: 'showTestcases.html',
                    scope: $scope,
                    controller: ['$scope', function($scope) {}]
                }).result.catch(function() {});
            };

            $scope.openSankeyChart = function(intent) {
                $scope.sankeyIntent = intent;

                var modal = $uibModal.open({
                    templateUrl: 'showSankeyChart.html',
                    scope: $scope,
                    controller: ['$scope', function($scope) {}]
                }).rendered.then(function() {

                    var sankeyObject = {
                        nodes: [],
                        links: []
                    };

                    //source node
                    sankeyObject.nodes.push({
                        name: $scope.sankeyIntent.intent
                    });

                    //represent correct cases
                    sankeyObject.nodes.push({
                        name: $scope.sankeyIntent.intent
                    });

                    var alreadyInArray = [];
                    var correctIntents = 0;

                    angular.forEach($scope.sankeyIntent.result, function(run) {
                        angular.forEach(run.examples, function(example) {
                            if (example.classifiedIntent !== undefined) {
                                var classifiedIntent = example.classifiedIntent;
                                if (alreadyInArray.indexOf(example.classifiedIntent) == -1) {
                                    sankeyObject.nodes.push({
                                        name: classifiedIntent
                                    });
                                    sankeyObject.links.push({
                                        source: 0,
                                        target: sankeyObject.nodes.length - 1,
                                        value: 1
                                    });
                                    alreadyInArray.push(classifiedIntent);
                                } else {
                                    var classifiedIntentIndex;
                                    for (var i = 0; i < sankeyObject.nodes.length; i++) {
                                        if (sankeyObject.nodes[i].name === classifiedIntent) {
                                            classifiedIntentIndex = i;
                                        }
                                    }
                                    angular.forEach(sankeyObject.links, function(link) {
                                        if (link.source === 0 && link.target === classifiedIntentIndex) {
                                            link.value++;
                                        }
                                    });
                                }
                            } else {
                                correctIntents++;
                            }
                        });
                    });

                    sankeyObject.links.push({
                        source: 0,
                        target: 1,
                        value: correctIntents
                    });

                    initializeMatrix(sankeyObject);
                });
            };


            function createTableObject(result, intents) {
                var tableArray = [];

                angular.forEach(intents, function(intent) {
                    var resultPerIntent = [];
                    angular.forEach(result.result, function(run) {
                        angular.forEach(run, function(testCase) {
                            if (testCase.intent === intent.intent) {
                                if (testCase.totalTestCases < 1) {
                                    testCase.successRatio = 'NaN';
                                    testCase.confidence = 'NaN';
                                } else {
                                    testCase.confidence = Math.round(testCase.confidence * 100) / 100;
                                    testCase.successRatio = Math.round(testCase.successRatio * 100) / 100;
                                }
                                resultPerIntent.push(testCase);
                            }
                        });
                    });

                    var sum = 0.0;
                    var count = 0;

                    angular.forEach(resultPerIntent, function(run) {
                        if (run.confidence != 'NaN') {
                            sum += run.confidence;
                            count++;
                        }
                    });

                    var confidence = Math.round((sum / count) * 100) / 100;
                    var confidenceColor = getColor(confidence);

                    sum = 0.0;

                    angular.forEach(resultPerIntent, function(run) {
                        if (run.successRatio != 'NaN') {
                            sum += run.successRatio;
                        }
                    });

                    var successRatio = Math.round((sum / count) * 100) / 100;
                    var successRatioColor = getColor(successRatio);

                    sum = 0;

                    angular.forEach(resultPerIntent, function(run) {
                        sum += run.totalTestCases;
                    });

                    var totalTestCases = sum;

                    tableArray.push({
                        intent: intent.intent,
                        confidence: confidence,
                        confidenceColor: confidenceColor,
                        successRatio: successRatio,
                        successRatioColor: successRatioColor,
                        totalTestCases: totalTestCases,
                        result: resultPerIntent
                    });
                });

                var overallConfidenceSum = 0.0;
                var overallSuccessRatioSum = 0.0;
                var overallTotalTestCases = 0;

                angular.forEach(tableArray, function(intent) {
                    overallConfidenceSum += intent.confidence;
                    overallSuccessRatioSum += intent.successRatio;
                    overallTotalTestCases += intent.totalTestCases
                });

                var overallConfidence = Math.round((overallConfidenceSum / tableArray.length) * 100) / 100;
                var overallConfidenceColor = getColor(overallConfidence);
                var overallSuccessRatio = Math.round((overallSuccessRatioSum / tableArray.length) * 100) / 100;
                var overallSuccessRatioColor = getColor(overallSuccessRatio);

                $scope.overall = {
                    intent: $translate.instant('OVERALL'),
                    confidence: overallConfidence,
                    confidenceColor: overallConfidenceColor,
                    successRatio: overallSuccessRatio,
                    successRatioColor: overallSuccessRatioColor,
                    totalTestCases: overallTotalTestCases
                };

                function getColor(value) {
                    var hue = (value * 120).toString(10);
                    return ["hsl(", hue, ",65%,50%)"].join("");
                }

                $scope.isLoading = false;
                $scope.disableClientChange = false;

                return tableArray;
            }

            var width = 0;
            var height = 0;

            function initializeMatrix(sankeyObject) {
                onResize();

                var svg = d3.select('#container').append("svg")
                    .attr("width", '100%')
                    .attr("height", '100%')
                    .attr('viewBox', '0 0 ' + width + ' ' + height)
                    .attr('preserveAspectRatio', 'xMinYMin');

                var formatNumber = d3.format(",.0f"),
                    format = function(d) {
                        return formatNumber(d) + " test case(s)";
                    },
                    color = d3.scaleOrdinal(d3.schemeCategory10);

                var sankey = d3.sankey()
                    .nodeWidth(15)
                    .nodePadding(10)
                    .extent([
                        [1, 1],
                        [width - 1, height - 6]
                    ]);

                var link = svg.append("g")
                    .attr("class", "links")
                    .attr("fill", "none")
                    .attr("stroke", "#000")
                    .attr("stroke-opacity", 0.15)
                    .selectAll("path");

                var node = svg.append("g")
                    .attr("class", "nodes")
                    .attr("font-family", "sans-serif")
                    .attr("font-size", 12)
                    .selectAll("g");

                sankey(sankeyObject);

                link = link
                    .data(sankeyObject.links)
                    .enter().append("path")
                    .attr("d", d3.sankeyLinkHorizontal())
                    .attr("stroke-width", function(d) {
                        return Math.max(1, d.width);
                    });

                link.append("title")
                    .text(function(d) {
                        return d.source.name + " → " + d.target.name + "\n" + format(d.value);
                    });

                node = node
                    .data(sankeyObject.nodes)
                    .enter().append("g");

                node.append("rect")
                    .attr("x", function(d) {
                        return d.x0;
                    })
                    .attr("y", function(d) {
                        return d.y0;
                    })
                    .attr("height", function(d) {
                        return d.y1 - d.y0;
                    })
                    .attr("width", function(d) {
                        return d.x1 - d.x0;
                    })
                    .attr("fill", function(d) {
                        return color(d.name.replace(/ .*/, ""));
                    })
                    .attr("stroke", "#000");

                node.append("text")
                    .attr("x", function(d) {
                        return d.x0 - 6;
                    })
                    .attr("y", function(d) {
                        return (d.y1 + d.y0) / 2;
                    })
                    .attr("dy", "0.35em")
                    .attr("text-anchor", "end")
                    .text(function(d) {
                        return d.name;
                    })
                    .filter(function(d) {
                        return d.x0 < width / 2;
                    })
                    .attr("x", function(d) {
                        return d.x1 + 6;
                    })
                    .attr("text-anchor", "start");

                node.append("title")
                    .text(function(d) {
                        return d.name + "\n" + format(d.value);
                    });
            }

            angular.element($window).bind('resize', function() {
                onResize();
            });

            function onResize() {
                var container = angular.element('#container')[0];
                if (container !== undefined) {
                    width = container.offsetWidth;
                    height = width / 1.5;
                }
            }
        }
    ]);
