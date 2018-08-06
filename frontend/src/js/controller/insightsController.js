/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
angular.module('eva.insightsOverview')
    .controller('InsightsCtrl', ['$scope', '$http', '$window', '$location', '$translate', 'ConfigService', '$uibModal', '$rootScope',
        function($scope, $http, $window, $location, $translate, ConfigServices, $uibModal, $rootScope) {

            $scope.showControls = false;
            $scope.testIntents = [];
            $scope.allIntents = [];
            $scope.testTimes = [];
            $scope.testClients = [];
            $scope.client = "";
            $scope.time = "";
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
                $scope.disableClientChange = true;
                $scope.showControls = false;
                $scope.testTimes = undefined;
                $scope.getTrainingIntents();
            };

            $scope.height = function(element) {
                var height = $(element).css("height");
                return height;
            };

            $scope.getTrainingIntents = function() {
                $http({
                    method: "POST",
                    url: '/api/testing/confusion/getTrainingIntents',
                    data: {
                        clientId: $scope.clientSelection.chosen
                    }
                }).then(function(response) {
                    $scope.allIntents = response.data;
                    $scope.allIntents.push({
                        intent: "Confidence level not met"
                    });
                    $scope.allIntents.push({
                        intent: "ChitChat"
                    });
                    $scope.getTestTimes();
                }, function(error) {
                    $scope.$parent.failed_get = $translate.instant('INTENTS_ERROR');
                });
            };

            $scope.getTestTimes = function() {

                $http({
                    method: "POST",
                    url: '/api/testing/confusion/getTestTimes',
                    data: {
                        clientId: $scope.clientSelection.chosen
                    }
                }).then(function(response) {
                    if (response.data[0]) {
                        $scope.testTimes = response.data;
                        $scope.selectedTime = $scope.testTimes[0];
                        $scope.time = $scope.testTimes[0]._id;
                        $scope.getTestIntents($scope.time, $scope.clientSelection.chosen);
                    } else {
                        $scope.showControls = true;
                        $scope.disableClientChange = false;
                    }
                }, function(error) {
                    $scope.$parent.failed_get = $translate.instant('INTENTS_ERROR');
                });
            };

            $scope.reloadMatrix = function(selectedTime) {
                $scope.getTestIntents(selectedTime._id, $scope.clientSelection.chosen);
            }

            $scope.getTestIntents = function(time, clientId) {

                $http({
                    method: "POST",
                    url: '/api/testing/confusion/getTestIntents',
                    data: {
                        time: time,
                        clientId: clientId
                    }
                }).then(function(response) {
                    $scope.testIntents = response.data;
                    $scope.initializeMatrix();
                }, function(error) {
                    $scope.$parent.failed_get = $translate.instant('INTENTS_ERROR');
                });
            };



            $scope.initializeMatrix = function() {

                $scope.confusionMatrix = [];
                var rows = $scope.allIntents.length - 2;
                var cols = $scope.allIntents.length;
                var row = [];
                while (cols--) row.push(0);
                while (rows--) $scope.confusionMatrix.push(row.slice());

                for (i in $scope.testIntents) {

                    var index_x = -1;

                    for (var x = 0, len = $scope.allIntents.length; x < len; x++) {

                        if ($scope.allIntents[x].intent === $scope.testIntents[i]._id.trim()) {
                            index_x = x;
                            break;
                        }
                    }

                    for (j in $scope.testIntents[i].result) {

                        var index_y = -1;

                        if ($scope.testIntents[i].result[j].givenIntent == undefined) {
                            index_y = $scope.allIntents.length - 2;
                        } else {

                            for (var y = 0, len = $scope.allIntents.length; y < len; y++) {
                                if ($scope.allIntents[y].intent === $scope.testIntents[i].result[j].givenIntent) {
                                    index_y = y;
                                    break;
                                } else {
                                    index_y = $scope.allIntents.length - 1;
                                }
                            }
                        }

                        if (index_x >= 0 && index_y >= 0) {
                            $scope.confusionMatrix[index_x][index_y] = $scope.confusionMatrix[index_x][index_y] + $scope.testIntents[i].result[j].count;
                        }
                    }
                }
                $scope.total = [];
                for (x = 0; x < ($scope.allIntents.length - 2); x++) {
                    $scope.total[x] = 0;
                    for (y = 0; y < $scope.allIntents.length; y++) {
                        $scope.total[x] = $scope.total[x] + $scope.confusionMatrix[x][y];
                    }
                }

                for (x = 0; x < ($scope.allIntents.length - 2); x++) {
                    for (y = 0; y < $scope.allIntents.length; y++) {
                        if ($scope.confusionMatrix[x][y] !== 0) {
                            var perc = $scope.confusionMatrix[x][y] / $scope.total[x]
                            $scope.confusionMatrix[x][y] = (perc * 100).toFixed(0);
                        }
                    }
                }

                var width = 1200;
                var height = 1000;
                var data = $scope.confusionMatrix;
                var container = '#container';
                var labelsData = [];
                var startColor = '#e60000';
                var endColor = '#00b300';
                var widthLegend = 100;
                var margin = {
                    top: 50,
                    right: 50,
                    bottom: 300,
                    left: 300
                };

                for (index in $scope.allIntents) {
                    labelsData.push($scope.allIntents[index].intent)
                }

                if (!data) {
                    throw new Error('Please pass data');
                }

                if (!Array.isArray(data) || !data.length || !Array.isArray(data[0])) {
                    throw new Error('It should be a 2-D array');
                }

                var maxValue = d3.max(data, function(layer) {
                    return d3.max(layer, function(d) {
                        return d;
                    });
                });
                var minValue = d3.min(data, function(layer) {
                    return d3.min(layer, function(d) {
                        return d;
                    });
                });

                var numrows = data.length;
                var numcols = data[0].length;

                d3.select(container).select("svg").remove();
                d3.select("#legend").select("svg").remove();

                var svg = d3.select(container).append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                var background = svg.append("rect")
                    .style("stroke", "black")
                    .style("stroke-width", "2px")
                    .attr("width", width)
                    .attr("height", height);

                var x = d3.scaleBand()
                    .domain(d3.range(numcols))
                    .rangeRound([0, width]);

                var y = d3.scaleBand()
                    .domain(d3.range(numrows))
                    .rangeRound([0, height]);

                var colorMap = d3.scaleLinear()
                    .domain([1, maxValue])
                    .range([startColor, endColor]);

                var row = svg.selectAll(".row")
                    .data(data)
                    .enter().append("g")
                    .attr("class", "row")
                    .attr("index", function(d, i) {
                        return i;
                    })
                    .attr("transform", function(d, i) {
                        return "translate(0," + y(i) + ")";
                    });

                var cell = row.selectAll(".cell")
                    .data(function(d) {
                        return d;
                    })
                    .style("font", "13px times")
                    .attr("index", function(d, i) {
                        return i;
                    })
                    .enter().append("g")
                    .attr("class", "cell")
                    .attr("transform", function(d, i) {
                        return "translate(" + x(i) + ", 0)";
                    });

                cell.append('rect')
                    .attr("width", x.bandwidth())
                    .attr("height", y.bandwidth())
                    .attr("stroke", "#c2c2a3")
                    .style("stroke-width", 0, 5);

                cell.append("text")
                    .attr("dy", ".32em")
                    .attr("x", x.bandwidth() / 2)
                    .attr("y", y.bandwidth() / 2)
                    .attr("text-anchor", "middle")
                    .style("fill", function(d, i) {
                        if (d == 0) {
                            return 'white';
                        } else {
                            return 'black'
                        }
                    })
                    .style("font", "13px times")
                    .text(function(d, i) {
                        return d;
                    });

                var count = 0;
                row.selectAll(".cell")
                    .data(function(d, i) {
                        return data[i];
                    })
                    .attr("id", function(d, i) {
                        return "fill" + count++;
                    })
                    .style("fill", function(d, i) {
                        if (d >= 80) {
                            return '#008000';
                        } else if (d >= 60) {
                            return '#86b300';
                        } else if (d >= 40) {
                            return '#ff9900';
                        } else if (d >= 20) {
                            return '#ff6600';
                        } else if (d >= 1) {
                            return '#e60000';
                        } else {
                            return 'white'
                        }
                    });

                var labels = svg.append('g')
                    .attr('class', "labels");

                var columnLabels = labels.selectAll(".column-label")
                    .data(labelsData)
                    .enter().append("g")
                    .attr("class", "column-label")
                    .attr("transform", function(d, i) {
                        return "translate(" + x(i) + "," + height + ")";
                    });

                columnLabels.append("line")
                    .style("stroke", "black")
                    .style("stroke-width", "2px")
                    .attr("x1", x.bandwidth() / 2)
                    .attr("x2", x.bandwidth() / 2)
                    .attr("y1", 0)
                    .attr("y2", 5);

                columnLabels.append("text")
                    .attr("x", -15)
                    .attr("y", y.bandwidth() / 2)
                    .attr("dy", ".22em")
                    .attr("text-anchor", "end")
                    .attr("transform", "rotate(-60)")
                    .text(function(d, i) {
                        return d;
                    });

                svg.append("text")
                    .attr("class", "x label")
                    .attr("text-anchor", "middle")
                    .attr("x", +width / 2)
                    .attr("y", height + 275)
                    .text($translate.instant('PREDICTED_INTENT'));

                var rowLabels = labels.selectAll(".row-label")
                    .data(labelsData)
                    .enter().append("g")
                    .attr("class", "row-label")
                    .attr("transform", function(d, i) {
                        return "translate(" + 0 + "," + y(i) + ")";
                    });

                rowLabels.append("line")
                    .style("stroke", "black")
                    .style("stroke-width", "2px")
                    .attr("x1", 0)
                    .attr("x2", -5)
                    .attr("y1", y.bandwidth() / 2)
                    .attr("y2", y.bandwidth() / 2);

                var count2 = 0;

                rowLabels.append("text")
                    .attr("x", -15)
                    .attr("id", function(d, i) {
                        return "rowlabel" + count2++;
                    })
                    .attr("y", y.bandwidth() / 2)
                    .attr("dy", ".32em")
                    .attr("text-anchor", "end")
                    .text(function(d, i) {
                        return d;
                    });

                svg.append("text")
                    .attr("class", "y label")
                    .attr("text-anchor", "middle")
                    .attr("y", -300)
                    .attr("x", -(height / 2))
                    .attr("transform", "rotate(-90)")
                    .attr("dy", ".75em")
                    .text($translate.instant('ACTUAL_INTENT'));

                var key = d3.select("#legend")
                    .append("svg")
                    .attr("width", widthLegend)
                    .attr("height", height + margin.top + margin.bottom);

                var legend = key
                    .append("defs")
                    .append("svg:linearGradient")
                    .attr("id", "gradient")
                    .attr("x1", "100%")
                    .attr("y1", "0%")
                    .attr("x2", "100%")
                    .attr("y2", "100%")
                    .attr("spreadMethod", "pad");

                legend
                    .append("stop")
                    .attr("offset", "0%")
                    .attr("stop-color", endColor)
                    .attr("stop-opacity", 1);

                legend
                    .append("stop")
                    .attr("offset", "100%")
                    .attr("stop-color", startColor)
                    .attr("stop-opacity", 1);

                key.append("rect")
                    .attr("width", widthLegend / 2 - 10)
                    .attr("height", height)
                    .style("fill", "url(#gradient)")
                    .attr("transform", "translate(0," + margin.top + ")");

                var y = d3.scaleLinear()
                    .range([height, 0])
                    .domain([minValue, maxValue]);

                var yAxis = d3.axisRight(y);

                key.append("g")
                    .attr("class", "y axis")
                    .attr("transform", "translate(41," + margin.top + ")")
                    .call(yAxis);

                for (i = 0; i < (($scope.allIntents.length - 2) * $scope.allIntents.length); i++) {
                    if (i % ($scope.allIntents.length + 1) !== 0) {
                        document.querySelector("#fill" + i).style.fill = "white";
                    }
                }

                for (i = 1; i < ($scope.allIntents.length - 1); i++) {
                    document.querySelector("#fill" + ((i * $scope.allIntents.length) - 1)).style.fill = "#cccccc";
                    document.querySelector("#fill" + ((i * $scope.allIntents.length) - 2)).style.fill = "#cccccc";

                    if ($scope.confusionMatrix[i - 1][$scope.allIntents.length - 1] == 0) {
                        document.querySelector("#fill" + ((i * $scope.allIntents.length) - 1)).childNodes[1].style.fill = "#cccccc";
                    }
                    if ($scope.confusionMatrix[i - 1][$scope.allIntents.length - 2] == 0) {
                        document.querySelector("#fill" + ((i * $scope.allIntents.length) - 2)).childNodes[1].style.fill = "#cccccc";
                    }
                }

                document.querySelector("#rowlabel" + (labelsData.length - 2)).style.display = "none";
                document.querySelector("#rowlabel" + (labelsData.length - 1)).style.display = "none";

                $scope.showControls = true;
                $scope.disableClientChange = false;
            };
        }
    ]);
