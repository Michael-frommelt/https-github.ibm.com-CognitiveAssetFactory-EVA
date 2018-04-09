/**
 * Copyright 2018 IBM Deutschland. All Rights Reserved.
 *
 * Enhanced conVersation Asset - EVA
 * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
 */

'use strict'

var argv = require('minimist')(process.argv.slice(2));
var bcrypt = require('bcrypt-nodejs');
var config = require('./config.json');
var design_docs = require('./design_docs.json');
var containers = ["users", "conversation_logs", "clients", "config", "test_results", "test_files", "test_sessions", "variables", "apps", "sessions", "profanity", "question_proposals", "kfold_results", "roles", "conversation_feedback", "answers_chitchat_asset", "answers_chitchat_asset_versions", "answers_business_asset", "answers_business_asset_versions"];
var cloudantHelperContainer = ["test", "view_result_testing", "view_result_statistics"];

var mongoClient = require('mongodb').MongoClient;
var cloudantClient = require('cloudant');

var async = require('async');

insertCredentials();

if (argv.db_type === 'cloudant') {
  if (argv.db_username && argv.db_password) {
    connect2Cloudant(0, function(cloudant) {
      if (argv.refresh) {
        async.series([
          function(callback) {
            cloudant.db.list(function(err, body) {
              if (err) {
                callback(err);
              }
              async.forEachSeries(containers.concat(cloudantHelperContainer), function(containerName, callback) {
                if (body.indexOf(containerName) == -1) {
                  cloudant.db.create(containerName, function(err, body) {
                    if (err) {
                      console.log("## ABORTING: MISSING DATABASE " + containerName + " COULD NOT BE CREATED #####");
                      callback(err);
                    } else {
                      console.log("## SUCCESS: MISSING DATABASE " + containerName + "  WAS CREATED #####");
                      callback();
                    }
                  });
                } else callback();
              }, function(err) {
                if(err) {
                  callback();
                } else callback();
              })
            });
          },
          function(callback) {
            async.forEachSeries(containers.concat(cloudantHelperContainer), function(containerName, callback) {
              if (design_docs[containerName]) {
                  async.forEachSeries(design_docs[containerName], function(designDoc, callback) {
                    var queryCounter = 0;
                    cloudant.db.use(containerName).get(designDoc._id, function(err, doc) {
                      if (err && err.reason !== "deleted" && err.reason !== "missing") {
                        callback(err);
                      } else if (err && (err.reason == "deleted" || err.reason == "missing")) {
                        queryCounter++;
                        cloudant.db.use(containerName).insert(designDoc, function(err, body) {
                          if (err) {
                            console.log("## FAILED: Could not insert " + designDoc._id);
                            callback(err);
                          } else {
                            console.log("## INSERTED " + designDoc._id)
                            if (queryCounter > 5) {
                              queryCounter = 0;
                              setTimeout(function() {
                                callback();
                              }, 1000);
                            } else callback();
                          }
                        });
                      } else if (doc) {
                        queryCounter++;
                        cloudant.db.use(containerName).destroy(doc._id, doc._rev, function(err, body) {
                          if (err) {
                            callback(err);
                          } else {
                            console.log("## DELETED " + designDoc._id)
                            queryCounter++;
                            cloudant.db.use(containerName).insert(designDoc, function(err, body) {
                              if (err) {
                                console.log("## FAILED: Could not insert " + designDoc._id);
                                callback(err);
                              } else {
                                console.log("## INSERTED " + designDoc._id)
                                if (queryCounter > 5) {
                                  queryCounter = 0;
                                  setTimeout(function() {
                                    callback();
                                  }, 1000);
                                } else callback();
                              }
                            });
                          }
                        })
                      }
                    })
                  }, function(err) {
                    if (err) {
                      callback(err)
                    }
                    console.log("#############################################");
                    console.log("  Processed all docs for " + containerName);
                    console.log("#############################################");
                    setTimeout(function() {
                      callback();
                    }, 1000);
                  });
              } else {
                callback();
              }
            }, function(err) {
              if (err) {
                callback(err);
              }
              setTimeout(function() {
                callback();
              }, 1000);
            });
          }
        ], function(err, result) {
          if (err) {
            process.exit();
          }
          console.log("#############################################");
          console.log("##                                         ##");
          console.log("## Successfully refreshed design documents ##");
          console.log("##                                         ##");
          console.log("#############################################");
        })
      } else {
        async.forEachSeries(containers.concat(cloudantHelperContainer), function(containerName, callback) {
            cloudant.db.create(containerName, function(err, body) {

              if (err) throw new Error(err);

              console.log('Created the following container: ' + containerName);
              console.log('');

              async.parallel([
                function(callback) {
                  if (config[containerName]) {

                    var doc, fn;
                    if (Array.isArray(config[containerName])) {
                      doc = {
                        docs: config[containerName]
                      };
                      fn = cloudant.db.use(containerName).bulk;
                    } else {
                      doc = config[containerName];
                      fn = cloudant.db.use(containerName).insert;
                    }

                    fn(doc, function(err, body) {
                      if (err) {
                        callback(err);
                      } else {

                        console.log('Inserted the following container: ' + containerName);
                        console.log(body);
                        console.log('');

                        setTimeout(function() {
                          callback();
                        }, 1000);
                      }
                    });
                  } else {
                    callback();
                  }
                },
                function(callback) {
                  if (design_docs[containerName]) {

                    var doc, fn;
                    if (Array.isArray(design_docs[containerName])) {
                      doc = {
                        docs: design_docs[containerName]
                      };
                      fn = cloudant.db.use(containerName).bulk;
                    } else {
                      doc = design_docs[containerName];
                      fn = cloudant.db.use(containerName).insert;
                    }

                    fn(doc, function(err, body) {
                      if (err) {
                        callback(err);
                      } else {

                        console.log('Inserted the following container: ' + containerName);
                        console.log(body);
                        console.log('');

                        setTimeout(function() {
                          callback();
                        }, 1000);
                      }
                    });
                  } else {
                    callback();
                  }
                }
              ], function(err) {
                if (err) {
                  callback(err);
                }
                callback();
              });
            });
          },
          function(err) {
            if (err) console.log(err);
            process.exit();
          });
      }
    });
  } else {
    throw new Error('Insufficient Cloudant credentials.');
  }
} else if (argv.db_type === 'mongodb') {
  if (argv.db_ca_certificate && argv.db_uri) {
    connect2MongoDB(0, function(mongodb) {
      async.forEachSeries(containers, function(containerName, callback) {
        mongodb.db("evawatson").createCollection(containerName, function(err, res) {

          if (err) throw new Error(err);

          console.log('Created the following container: ' + containerName);
          console.log('');

          if (config[containerName]) {

            mongodb.db("evawatson").collection(containerName).insert(config[containerName], function(err, body) {
              if (err) {
                callback(err);
              } else {

                console.log('Inserted the following container: ' + containerName);
                console.log(body);
                console.log('');

                setTimeout(function() {
                  callback();
                }, 1000);
              }
            });
          } else {
            callback();
          }
        });
      }, function(err) {
        if (err) console.log(err);
        process.exit();
      });
    });
  } else {
    throw new Error('Insufficient MongoDB credentials.');
  }
} else {
  throw new Error('Unrecognized or unhandled database type.')
}

function insertCredentials() {
  if (true || (argv.wcs_username && argv.wcs_password && argv.wcs_url && argv.business_workspace && argv.chitchat_workspace)) {

    var conversation = config.config.find(function(element) {
      return element.id === "conversation";
    });

    conversation.username = argv.wcs_username;
    conversation.password = argv.wcs_password;
    conversation.url = argv.wcs_url;

    var chitchat = config.config.find(function(element) {
      return element.id === "chitchat";
    });

    chitchat.username = argv.wcs_username;
    chitchat.password = argv.wcs_password;
    chitchat.url = argv.wcs_url;
    chitchat.workspace = argv.chitchat_workspace;

    var testing = config.config.find(function(element) {
      return element.id === "testing";
    });

    testing.conversation.username = argv.wcs_username;
    testing.conversation.password = argv.wcs_password;
    testing.conversation.url = argv.wcs_url;

    var standardClient = config.clients.find(function(element) {
      return element.id === "standard";
    });

    standardClient.business_workspace = argv.business_workspace;
    standardClient.chitchat_workspace = argv.chitchat_workspace;

    var oneColumnClient = config.clients.find(function(element) {
      return element.id === "oneColumn";
    });

    oneColumnClient.business_workspace = argv.business_workspace;
    oneColumnClient.chitchat_workspace = argv.chitchat_workspace;

    config.users[0].username = argv.username;
    config.users[0].password = bcrypt.hashSync(argv.password);

  } else {
    throw new Error('Insufficient WCS credentials.');
  }
}

function connect2Cloudant(retry, callback) {
  cloudantClient({
    account: argv.db_username,
    password: argv.db_password
  }, function(err, cloudant) {
    if (err) {
      if (retry < 30) {
        console.log('');
        console.log("Cloudant apparently not provisioned yet. Retry in one minute...");
        console.log(err);
        console.log('');
        setTimeout(function() {
          connect2Cloudant(++retry, callback);
        }, 60000);
      } else {
        throw new Error("Connection still failing after 30 retries. Giving up!");
      }
    } else {
      callback(cloudant);
    }
  });
}

function connect2MongoDB(retry, callback) {
  var ca = [new Buffer(argv.db_ca_certificate, 'base64')];
  mongoClient.connect(argv.db_uri, {
      ssl: true,
      sslValidate: true,
      sslCA: ca,
      poolSize: 1,
      reconnectTries: 1
    },
    function(err, mongodb) {
      if (err) {
        if (retry < 30) {
          console.log('');
          console.log("MongoDB apparently not provisioned yet. Retry in one minute...");
          console.log(err);
          console.log('');
          setTimeout(function() {
            connect2MongoDB(++retry, callback);
          }, 60000);
        } else {
          throw new Error("Connection still failing after 30 retries. Giving up!");
        }
      } else {
        callback(mongodb);
      }
    });
}
