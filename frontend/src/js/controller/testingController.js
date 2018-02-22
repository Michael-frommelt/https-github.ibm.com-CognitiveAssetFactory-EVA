/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */

angular.module('eva.testing')
    .controller('TestingCtrl', ['$scope', '$interval', '$http', '$translate', '$uibModal', '$rootScope',
        function($scope, $interval, $http, $translate, $uibModal, $rootScope) {

            $scope.selectedAll = false;
            $scope.displayOption = "conf";
            $scope.groupBy = "TEST_FILE";
            $scope.testFiles = [];
            $scope.selectedObjectForDetail = "";
            $rootScope.testStatus = "no status";
            $rootScope.testInProgress = null;
            $rootScope.testError = null;
            $scope.runDates = [];
            $scope.selectedFiles = [];
            $scope.isLoadingTestPerformance = true;
            $scope.isLoadingTrend = true;
            $scope.isDeletingTestrun = false;
            $scope.isLoadingTestPerformanceDetail = false;
            $scope.selectedTestCase = "";
            $scope.resultPerDateAndFile = null;
            $scope.resultPerDateAndActualIntent = null;
            $scope.error = null;
            $scope.clientSelection = {};
            $scope.clientSelection.availableClients = [];
            $scope.disableClientChange = false;

            $scope.selectAll = function() {
                $scope.selectedAll = !$scope.selectedAll;
                angular.forEach($scope.testFiles, function(file) {
                    file.selected = $scope.selectedAll;
                });
            };

            $scope.checkIfAllSelected = function() {
                $scope.selectedAll = $scope.testFiles.every(function(file) {
                    return file.selected == true
                })
            };

            $scope.changeGroupBy = function(showGroupBy) {
                if (showGroupBy != null) {
                    $scope.groupBy = showGroupBy;
                }
                if ($scope.groupBy === "TEST_FILE" || showGroupBy == null) {
                    if ($scope.resultPerDateAndFile !== null) {
                        $scope.tableArray = $scope.resultPerDateAndFile;
                    } else {
                        $scope.isLoadingTestPerformance = true;
                        $scope.getTestResultByFile(function() {
                            $scope.tableArray = $scope.resultPerDateAndFile;
                        }, handleError);
                    }
                } else if ($scope.groupBy === "ACTUAL_INTENT") {
                    if ($scope.resultPerDateAndActualIntent !== null) {
                        $scope.tableArray = $scope.resultPerDateAndActualIntent;
                    } else {
                        $scope.isLoadingTestPerformance = true;
                        $scope.getTestResultByIntent(function() {
                            $scope.tableArray = $scope.resultPerDateAndActualIntent;
                        }, handleError);
                    }
                }
            };

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
                $scope.testcasePerformance = null;
                $scope.teststepPerformance = null;
                $scope.isRunning();
            };

            $scope.isRunning = function() {
                $scope.isLoadingFiles = true;
                $http({
                    method: "GET",
                    url: '/api/testing/dialog/running'
                }).then(function(response) {
                    $rootScope.testInProgress = response.data.testInProgress;
                    if ($scope.testInProgress) {
                        $rootScope.testError = null;
                        var status = $interval(function() {
                            $http({
                                method: "GET",
                                url: '/api/testing/dialog/status'
                            }).then(function(response) {
                                $rootScope.testProgress = response.data.testProgress;
                                $rootScope.testStatus = response.data.status;
                                if (response.data.status === "finished") {
                                    $rootScope.testStatus = "finished";
                                    $rootScope.testInProgress = false;
                                    $rootScope.testDate = response.data.testResult._id;
                                    $interval.cancel(status);
                                    $scope.getRun();
                                }
                            }, function(error) {
                                $rootScope.testError = error.data.testResult;
                                console.log($rootScope.testError);
                                $rootScope.testStatus = "failed"
                                $rootScope.testInProgress = false;
                                $interval.cancel(status);
                                $scope.disableClientChange = false;
                            });
                        }, 5000);
                    } else {
                        if(response.data.error) {
                            $rootScope.testStatus = "failed";
                            $scope.testError = response.data.error;
                        } else {
                            $rootScope.testStatus = "finished";
                        }
                    }
                    $scope.getRun();
                    $scope.getFileNames();
                }, handleError);
            };

            $scope.getFileNames = function() {
                $scope.isLoadingFiles = true;
                $http({
                    method: "POST",
                    url: '/api/testing/tableview/getFileNames',
                    data: {
                        clientId: $scope.clientSelection.chosen
                    }
                }).then(function(response) {
                    $scope.isLoadingFiles = false;
                    $scope.testFiles = response.data;
                }, handleError);
                $scope.isLoading = false;
            };

            $scope.getRun = function() {
                $http({
                    method: "POST",
                    url: '/api/testing/tableview/getRun',
                    data: {
                        clientId: $scope.clientSelection.chosen
                    }
                }).then(function(response) {
                    $scope.runDates = response.data;
                    $scope.getTestResultByFile(function() {
                        $scope.changeGroupBy();
                    }, handleError);
                    $scope.getTestcasePerformance();
                    $scope.getTeststepPerformance();
                }, handleError);
            };

            $scope.getTestResultByFile = function(callbackSuccess, callbackError) {
                if ($scope.runDates.length > 0) {
                    $scope.isLoadingTestPerformance = true;
                    $http({
                        method: "POST",
                        url: '/api/testing/tableview/getTestResultByFile',
                        data: {
                            run: $scope.runDates[$scope.runDates.length - 1]._id.timestamp,
                            clientId: $scope.clientSelection.chosen
                        }
                    }).then(function(response) {

                            var performancePerDateAndFile = response.data;
                            $scope.runDates.forEach(function(date, index) {
                                performancePerDateAndFile.forEach(function(file) {
                                    if (file.resultPerDate[index] != undefined) {
                                        if (date._id.date != file.resultPerDate[index].date) {
                                            file.resultPerDate.splice(index, 0, {});
                                        }
                                    } else file.resultPerDate.splice(index, 0, {});
                                    if (index == 0) {
                                        file.resultPerDate.forEach(function(filePerf) {

                                            filePerf.avgConfidence = Math.round(filePerf.avgConfidence * 100) / 100;
                                            filePerf.correctIntentRatio = Math.round((filePerf.numCorrectIntent / filePerf.testTotal) * 100) / 100;
                                            filePerf.correctAnswerIdRatio = Math.round((filePerf.numCorrectAnswerId / filePerf.testTotal) * 100) / 100;
                                        });
                                    }
                                });
                            });
                            $scope.resultPerDateAndFile = performancePerDateAndFile;
                            $scope.isLoadingTestPerformance = false;
                            callbackSuccess();

                        },
                        function(error) {
                            callbackError(error);
                        });
                } else {
                    $scope.isLoadingTestPerformance = false;
                    $scope.disableClientChange = false;
                }
            };

            $scope.getTestResultByIntent = function(callbackSuccess, callbackError) {
                if ($scope.runDates.length > 0) {
                    $scope.isLoadingTestPerformance = true;
                    $http({
                        method: "POST",
                        url: '/api/testing/tableview/getTestResultByIntent',
                        data: {
                            run: $scope.runDates[$scope.runDates.length - 1]._id.timestamp,
                            clientId: $scope.clientSelection.chosen
                        }
                    }).then(function(response) {

                            var performancePerDateAndActualIntent = response.data;
                            $scope.runDates.forEach(function(date, index) {
                                performancePerDateAndActualIntent.forEach(function(intent) {
                                    if (intent.resultPerDate[index] != undefined) {
                                        if (date._id.date != intent.resultPerDate[index].date) {
                                            intent.resultPerDate.splice(index, 0, {});
                                        }
                                    } else intent.resultPerDate.splice(index, 0, {});
                                    if (index == 0) {
                                        intent.resultPerDate.forEach(function(intentPerf) {

                                            intentPerf.avgConfidence = Math.round(intentPerf.avgConfidence * 100) / 100;
                                            intentPerf.correctIntentRatio = Math.round((intentPerf.numCorrectIntent / intentPerf.testTotal) * 100) / 100;
                                            intentPerf.correctAnswerIdRatio = Math.round((intentPerf.numCorrectAnswerId / intentPerf.testTotal) * 100) / 100;
                                        });
                                    }
                                });
                            });
                            $scope.resultPerDateAndActualIntent = performancePerDateAndActualIntent;
                            $scope.isLoadingTestPerformance = false;
                            callbackSuccess();

                        },
                        function(error) {
                            callbackError(error);
                        });
                } else {
                    $scope.isLoadingTestPerformance = false;
                    $scope.disableClientChange = false;
                }
            };

            $scope.openRunModal = function() {

                $scope.selectedFiles = [];
                for (i in $scope.testFiles) {
                    if ($scope.testFiles[i].selected == true) {
                        $scope.selectedFiles.push($scope.testFiles[i].name);
                    }
                }
                $uibModal.open({
                    templateUrl: 'runModal.html',
                    scope: $scope,
                    controller: ['$scope', function($scope) {
                        $scope.runTest = function(question) {
                            $scope.$dismiss();
                            $rootScope.testError = null;
                            console.log($scope.error);
                            $rootScope.testInProgress = true;
                            $rootScope.testStatus = "watsonIsTraining";
                            $http({
                                method: "POST",
                                url: '/api/testing/dialog/run',
                                data: {
                                    testCases: $scope.selectedFiles,
                                    clientId: $scope.clientSelection.chosen
                                }
                            }).then(function(response) {
                                var status = $interval(function() {
                                    $http({
                                        method: "GET",
                                        url: '/api/testing/dialog/status'
                                    }).then(function(response) {
                                        $rootScope.testProgress = response.data.testProgress;
                                        $rootScope.testStatus = response.data.status;
                                        if (response.data.status === "finished") {
                                            $scope.isLoadingTestPerformance = true;
                                            $rootScope.testStatus = "finished";
                                            $rootScope.testInProgress = false;
                                            $rootScope.testDate = response.data.testResult._id;
                                            $interval.cancel(status);
                                            $scope.getRun();
                                        }
                                    }, function(error) {
                                        $rootScope.testError = error.data.testResult;
                                        console.log($rootScope.testError);
                                        $rootScope.testStatus = "failed"
                                        $rootScope.testInProgress = false;
                                        $interval.cancel(status);
                                    });
                                }, 5000);
                            }, function(error) {
                                $scope.error = error;
                                console.log(error);
                                $rootScope.testStatus = "failed"
                                $rootScope.testInProgress = false;
                                $scope.error = error;
                            });
                        };
                    }]
                }).result.catch(function() {});
            };

            $scope.openEditModal = function(testcase) {
                $scope.selectedTestCase = testcase;
                $scope.isLoadingCase = true;
                $uibModal.open({
                    templateUrl: 'editModal.html',
                    scope: $scope,
                    controller: ['$scope', function($scope) {
                        $http({
                            method: "POST",
                            url: '/api/testing/testcases/get',
                            data: {
                                name: $scope.selectedTestCase,
                                clientId: $scope.clientSelection.chosen
                            }
                        }).then(function(response) {
                            $scope.isLoadingCase = false;
                            $scope.testCases = response.data[0].testCase;
                        }, handleError);

                        $scope.updateTestcase = function() {
                            $scope.isLoadingCase = true;
                            $http({
                                method: "POST",
                                url: '/api/testing/testcases/update',
                                data: {
                                    name: $scope.selectedTestCase,
                                    clientId: $scope.clientSelection.chosen,
                                    testcases: $scope.testCases
                                }
                            }).then(function(response) {
                                $scope.isLoadingCase = false;
                                $scope.testCases = null;
                                $scope.selectedTestCase = null;
                                $scope.getFileNames();
                                $scope.$dismiss();
                            }, handleError);
                        };

                        $scope.addRow = function(index) {
                            $scope.testCases.splice(index + 1, 0, {
                                'id': '',
                                'input': '',
                                'intent': '',
                                'answerId': ''
                            });
                        };

                        $scope.removeRow = function(index) {
                            $scope.testCases.splice(index, 1);
                        };

                        $scope.generateUuid = function(index) {
                            $scope.testCases[index].id = guid();
                        }
                    }]
                }).result.catch(function() {});
            };

            $scope.openAddModal = function() {
                $scope.addTestCaseName = '';
                $scope.errorAddingTestCase = false;
                $scope.testCases = [];
                $uibModal.open({
                    templateUrl: 'addModal.html',
                    scope: $scope,
                    controller: ['$scope', function($scope) {

                        $scope.createTestcase = function() {
                            if ($scope.addTestCaseName.trim() !== '') {
                                $scope.errorAddingTestCase = false;
                                $scope.isAddingCase = true;
                                $http({
                                    method: "POST",
                                    url: '/api/testing/testcases/create',
                                    data: {
                                        name: $scope.addTestCaseName,
                                        clientId: $scope.clientSelection.chosen,
                                        testcases: $scope.testCases
                                    }
                                }).then(function(response) {
                                    $scope.isAddingCase = false;
                                    $scope.testCases = null;
                                    $scope.getFileNames();
                                    $scope.$dismiss();
                                }, handleError);
                            } else {
                                $scope.errorAddingTestCase = true;
                                $scope.errorAddingTestCaseMessage = "Name field must not be empty."
                            }
                        };

                        $scope.addRow = function(index) {
                            $scope.testCases.splice(index + 1, 0, {
                                'id': '',
                                'input': '',
                                'intent': '',
                                'answerId': ''
                            });
                        };
                        $scope.addRow(0);

                        $scope.removeRow = function(index) {
                            $scope.testCases.splice(index, 1);
                        };

                        $scope.generateUuid = function(index) {
                            $scope.testCases[index].id = guid();
                        }
                    }]
                }).result.catch(function() {});
            };

            $scope.openDeleteModal = function(testcase) {
                $scope.selectedTestCaseForDeletion = testcase;
                $uibModal.open({
                    templateUrl: 'deleteModal.html',
                    scope: $scope,
                    controller: ['$scope', function($scope) {
                        $scope.deleteTestcase = function() {
                            $http({
                                method: "POST",
                                url: '/api/testing/testcases/delete',
                                data: {
                                    name: $scope.selectedTestCaseForDeletion,
                                    clientId: $scope.clientSelection.chosen
                                }
                            }).then(function(response) {
                                $scope.selectedTestCaseForDeletion = null;
                                $scope.getFileNames();
                                $scope.$dismiss();
                            }, handleError);
                        };
                    }]
                }).result.catch(function() {});
            };

            $scope.openViewModal = function(selectedRow) {
                $scope.selectedObjectForDetail = selectedRow;
                $scope.isLoadingTestPerformanceDetail = true;
                if ($scope.groupBy == "TEST_FILE") {
                    var url = '/api/testing/tableview/getTestResultByFileDetail';
                } else if ($scope.groupBy == "ACTUAL_INTENT") {
                    var url = '/api/testing/tableview/getTestResultByIntentDetail';
                }
                $uibModal.open({
                    templateUrl: 'viewModal.html',
                    scope: $scope,
                    controller: ['$scope', function($scope) {}]
                }).result.catch(function() {})
                $http({
                    method: "POST",
                    url: url,
                    data: {
                        run: $scope.runDates[$scope.runDates.length - 1]._id.timestamp,
                        object: $scope.selectedObjectForDetail,
                        clientId: $scope.clientSelection.chosen
                    }
                }).then(function(response) {
                    var rowPerformanceForObject = response.data;
                    $scope.runDates.forEach(function(date, index) {
                        rowPerformanceForObject.forEach(function(object) {
                            if (object.result[index + 1] != undefined && object.result[index].date == object.result[index + 1].date) {
                                object.result.splice(index + 1, 1);
                            } else if (object.result[index] != undefined) {
                                if (date._id.date != object.result[index].date) {
                                    object.result.splice(index, 0, {});
                                }
                            } else if (object.result[index] == undefined) {
                                object.result.splice(index, 0, {});
                            }
                            if (index == 0) {
                                object.result.forEach(function(objectPerf) {
                                    objectPerf.confidence = Math.round(objectPerf.confidence * 100) / 100;
                                });
                            }
                        });
                    });
                    $scope.rowResult = rowPerformanceForObject;
                }, handleError).then(function() {
                    $scope.isLoadingTestPerformanceDetail = false;
                });

                if ($scope.displayOption === "numCases") {
                    $scope.displayOptionModal = "conf";
                } else {
                    $scope.displayOptionModal = $scope.displayOption;
                }
            };

            $scope.openRemoveRunModal = function(run) {
                $scope.selectedTestRunForDeletion = run._id.date;
                $uibModal.open({
                    templateUrl: 'deleteTestrunModal.html',
                    scope: $scope,
                    controller: ['$scope', function($scope) {
                        $scope.deleteTestrun = function() {
                            $scope.isDeletingTestrun = true;
                            $http({
                                method: "POST",
                                url: '/api/testing/tableview/deleteRun',
                                data: {
                                    date: $scope.selectedTestRunForDeletion,
                                    clientId: $scope.clientSelection.chosen
                                }
                            }).then(function(response) {
                                $scope.isDeletingTestrun = false;
                                $scope.isLoadingTestPerformance = true;
                                $scope.$dismiss();
                                $scope.selectedTestRunForDeletion = null;
                                $scope.getRun();
                            }, handleError);
                        };
                    }]
                }).result.catch(function() {});
            }

            // get test results (per test case)
            $scope.getTestcasePerformance = function() {
                if ($scope.runDates.length > 0) {
                    $http({
                        method: "POST",
                        url: '/api/testing/tableview/getTestcasePerformance',
                        data: {
                            run: $scope.runDates[$scope.runDates.length - 1]._id.timestamp,
                            clientId: $scope.clientSelection.chosen
                        }
                    }).then(function(response) {
                        $scope.testcasePerformance = response.data;
                        drawChart()
                    }, function(error) {
                        $scope.$parent.failed_get = $translate.instant('INTENTS_ERROR');
                    });
                } else {
                    $scope.isLoadingTrend = false;
                    $scope.disableClientChange = false;
                }
            };

            // get test results (per test step)
            $scope.getTeststepPerformance = function() {
                if ($scope.runDates.length > 0) {
                    $http({
                        method: "POST",
                        url: '/api/testing/tableview/getTeststepPerformance',
                        data: {
                            run: $scope.runDates[$scope.runDates.length - 1]._id.timestamp,
                            clientId: $scope.clientSelection.chosen
                        }
                    }).then(function(response) {
                        $scope.teststepPerformance = response.data;
                        drawChart()
                    }, function(error) {
                        $scope.$parent.failed_get = $translate.instant('INTENTS_ERROR');
                    });
                } else {
                    $scope.isLoadingTrend = false;
                    $scope.disableClientChange = false;
                }
            };

            function mergeRowsIntents(result) {
                var array = [];

                //get a list of all files that are inlcuded in the queried runs
                angular.forEach(result, function(run) {
                    angular.forEach(run.resultPerActualIntent, function(test) {
                        if (array.indexOf(test.intent) == -1) {
                            array.push(test.intent);
                        }
                    });
                });

                return array;
            }

            function guid() {
                return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                    s4() + '-' + s4() + s4() + s4();
            }

            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }

            function handleError(error) {
                $scope.error = error;
                $scope.disableClientChange = false;
                console.log(error);
            }

            function drawChart() {

                $scope.isLoadingTrend = true;
                var caseData = $scope.testcasePerformance;
                var stepData = $scope.teststepPerformance;

                if (caseData && caseData !== null && stepData && stepData !== null) {
                    var div = d3.select("body").append("div")
                        .attr("class", "chart_tooltip")
                        .style("opacity", 0);

                    var width = 0;
                    var height = 0;
                    var container = angular.element('#container')[0];
                    if (container !== undefined) {
                        width = container.offsetWidth;
                        height = width / 5;
                    }

                    var margin = {
                        top: 40,
                        right: 40,
                        bottom: 40,
                        left: 40
                    };

                    var timeParse = d3.timeParse("%Y/%m/%d %H:%M:%S");

                    d3.select('#container').selectAll('*').remove();
                    var svg = d3.select('#container').append("svg")
                        //.attr("width", '100%')
                        //.attr("height", '100%')
                        .attr('viewBox', (-margin.left) + ' ' + (-margin.bottom) + ' ' + (width + 2 * margin.right + margin.left) + ' ' + (height + 2 * margin.top + margin.bottom))
                        .attr('preserveAspectRatio', 'xMinYMin')
                        .append('g')
                        .attr("class", "chart")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                    svg.append("clipPath")
                        .attr("id", "clip")
                        .append("rect")
                        .attr("width", width)
                        .attr("height", height);

                    var data = [];
                    caseData.forEach(function(p) {

                        var time = timeParse(p._id.date);
                        var d = {
                            "time": time,
                            "ratio": p.ratio
                        };

                        if (p.count > 100) {
                            data.push(d);
                        }
                    });

                    var stack = d3.stack;
                    var x = d3.scaleTime()
                        .rangeRound([0, width]);
                    var y = d3.scaleLinear()
                        .rangeRound([height, 0]);
                    var line = d3.line()
                        .x(function(d) {
                            return x(d.time);
                        })
                        .y(function(d) {
                            return y(d.ratio);
                        });
                    var formatTime = d3.timeFormat("%e %B");

                    x.domain(d3.extent(data, function(d) {
                        return d.time;
                    }));

                    y.domain([0, 1]);

                    svg.append("g")
                        .attr("transform", "translate(0," + height + ")")
                        .attr("class", "grid")
                        .call(d3.axisBottom(x).tickSizeInner(-height).tickSizeOuter(0));

                    svg.append("g")
                        .attr("class", "grid")
                        .call(d3.axisLeft(y).tickSizeInner(-width).tickSizeOuter(0))
                        .append("text")
                        .attr("fill", "#000")
                        .attr("transform", "rotate(-90)")
                        .attr("y", 6)
                        .attr("dy", "0.71em")
                        .attr("text-anchor", "end")
                        .text("\% success");

                    svg.append("path")
                        .datum(data)
                        .attr("fill", "none")
                        .attr("stroke", "steelblue")
                        .attr("stroke-linejoin", "round")
                        .attr("stroke-linecap", "round")
                        .attr("stroke-width", 2.5)
                        .attr('clip-path', 'url(#clip)')
                        .attr("d", line);

                    svg.selectAll(".chart")
                        .data(data)
                        .enter().append("circle")
                        .attr("fill", "steelblue")
                        .attr("cx", function(d) {
                            return x(d.time);
                        })

                        .attr("cy", function(d) {
                            return y(d.ratio);
                        })

                        .attr("r", 4)
                        .attr('clip-path', 'url(#clip)')
                        .on('mouseover', function(d, i) {
                            div.transition()
                                .duration(200)
                                .style("opacity", .9);

                            div.html(formatTime(d.time) + "<br/>" + d.ratio.toFixed(2))
                                .style("left", (d3.event.pageX) + "px")
                                .style("top", (d3.event.pageY - 28) + "px");
                        })

                        .on('mouseout', function(d) {
                            div.transition()
                                .duration(500)
                                .style("opacity", 0);
                        });

                    data = [];

                    stepData.forEach(function(p) {
                        var time = timeParse(p._id.date);
                        var d = {
                            "time": time,
                            "ratio": p.ratio
                        };

                        if (p.count > 100) {
                            data.push(d);
                        }
                    });

                    svg.append("path")
                        .datum(data)
                        .attr("fill", "none")
                        .attr("stroke", "red")
                        .attr("stroke-linejoin", "round")
                        .attr("stroke-linecap", "round")
                        .attr("stroke-width", 2.5)
                        .attr('clip-path', 'url(#clip)')
                        .attr("d", line);

                    svg.selectAll(".chart")
                        .data(data)
                        .enter().append("circle")
                        .attr("fill", "red")
                        .attr("cx", function(d) {
                            return x(d.time);
                        })
                        .attr("cy", function(d) {
                            return y(d.ratio);
                        })
                        .attr("r", 4)
                        .attr('clip-path', 'url(#clip)')
                        .on('mouseover', function(d, i) {
                            div.transition()
                                .duration(200)
                                .style("opacity", .9);
                            div.html(formatTime(d.time) + "<br/>" + d.ratio.toFixed(2))
                                .style("left", (d3.event.pageX) + "px")
                                .style("top", (d3.event.pageY - 28) + "px");
                        })

                        .on('mouseout', function(d) {
                            div.transition()
                                .duration(500)
                                .style("opacity", 0);
                        });

                    var curtain = svg.append('rect')
                        .attr('x', -1 * width)
                        .attr('y', -1 * height)
                        .attr('height', height)
                        .attr('width', width)
                        .attr('class', 'curtain')
                        .attr('transform', 'rotate(180)')
                        .style('fill', '#ffffff');

                    var t = svg.transition()
                        .delay(750)
                        .duration(3000)
                        .ease(d3.easeLinear);

                    t.select('rect.curtain')
                        .attr('width', 0);

                    $scope.isLoadingTrend = false;
                    $scope.disableClientChange = false;
                }
            }
        }
    ]);
