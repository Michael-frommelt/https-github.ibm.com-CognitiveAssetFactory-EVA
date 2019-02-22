/*

  IBM Services Artificial Intelligence Development Toolkit ISAIDT

  Enhanced conVersation Asset - EVA
  Repository: https://github.ibm.com/CognitiveAssetFactory/EVA

  Licensed Materials - Property of IBM
  6949-70S

  © Copyright IBM Corp. 2019 All Rights Reserved

  US Government Users Restricted Rights - Use, duplication or disclosure restricted by GSA ADP Schedule Contract with IBM Corp.

*/

'use strict';

// ##############################
// ## IMPORTS                  ##
// ##############################
const db = require('./db/db.js').getDatabase();
const importExportApi = require('./api_import_export.js');
const permissions = require('../../helper/permissions.js');
const clientsHelper = require('../../helper/clients.js');
const assert = require('assert');
const jsonValidator = require('ajv')();
const multer = require('multer');
const answerStoreConfig = require('../../helper/config.js').getConfig('answerStore');
const chitchatConfig = require('../../helper/config.js').getConfig('chitchat');
var async = require('async');

// ##############################
// ## ROUTES                   ##
// ##############################
exports.createRoutes = function(app) {
  app.get('/api/answerproperty/', permissions.mwHasSomePermission('editAnswers', 'editSettings'), this.getAnswerProperties);
  app.post('/api/answerproperty/:propertyName', permissions.mwHasPermission('editSettings'), this.saveAnswerProperty);
  app.delete('/api/answerproperty/:propertyName', permissions.mwHasPermission('editSettings'), this.deleteAnswerProperty);

  app.get('/api/answer/export/:clientId', permissions.mwHasPermission('editAnswers'), this.exportAnswers);
  app.post('/api/answer/import/:clientId', permissions.mwHasPermission('editAnswers'), this.importAnswers);
  app.get('/api/answer/status', permissions.mwHasPermission('editAnswers'), this.getImportStatus);
  app.get('/api/answer/:clientId', permissions.mwHasPermission('editAnswers'), this.getAnswers);
  app.get('/api/answer/:clientId/:answerId', permissions.mwHasPermission('editAnswers'), this.getAnswer);
  app.post('/api/answer/:clientId/:answerId', permissions.mwHasPermission('editAnswers'), this.saveAnswer);
  app.delete('/api/answer/:clientId/:answerId', permissions.mwHasPermission('editAnswers'), this.deleteAnswer);

  app.get('/api/answerversion/deleted/:clientId', permissions.mwHasPermission('editSettings'), this.getVersionsMarkedForDeletion);
  app.delete('/api/answerversion/deleted/:clientId/:answerId', permissions.mwHasPermission('editSettings'), this.unmarkVersionForDeletion);
  app.get('/api/answerversion/:clientId/:answerId', permissions.mwHasPermission('editAnswers'), this.getVersions);

  app.get('/api/answerset', permissions.mwHasPermission('editAnswers'), this.getAnswerSets);
};

// ##############################
// ## SETUP                    ##
// ##############################
const validAnswerPropertyTypes = {
  number: 'number',
  multipleChoice: 'multipleChoice'
};
const versionContainerAddon = '_versions';

// values loaded or derived from the answer store config
let additionalAnswerSets = [];
let answerProperties = [];
let answerVersionLimit = 5;
let answerVersionDeleteExpiration = 30; // days
let uploader = null;
let multipleChoiceDistanceMeasure = 5;
let versionDeleteInterval = null;

var importInProgress = false;
var importResults = [];
var importErrors = [];
var importAnswersLength = 0;

// initialize the answer store backend; needs a db connection
var init = () => {
  // periodically check for expired versions for already deleted answers and remove them
  clearInterval(versionDeleteInterval);
  versionDeleteInterval = setInterval(() => {
    /* global clients */
    clientsHelper.getClients(true, true).forEach(client => {
      if (typeof client.answers_database === 'string') {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() - answerVersionDeleteExpiration);
        db.deleteExpiredVersions(client.answers_database + versionContainerAddon, expirationDate);
      }
    });
  }, 2 * 60 * 60 * 1000); // run this every 2 hours

  // setup answerProperty validator
  jsonValidator.removeSchema('eva-answer-store-answer-property');
  jsonValidator.addSchema(require('./src/schemaAnswerProperty.json'), 'eva-answer-store-answer-property');

  additionalAnswerSets = [];
  if (chitchatConfig && typeof chitchatConfig.answers_db === 'string') {
    additionalAnswerSets.push({
      id: 'virtual_chitchat',
      name: 'Virtual ChitChat',
      database: chitchatConfig.answers_db
    });
  }

  // setup file uploader with file size limit
  uploader = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: answerStoreConfig.fileSizeLimit * 1024 || 20480 * 1024
    } // default: 20MB
  }).single('uploadFile');

  // validate answer properties and cache them into a map
  answerProperties = [];
  if (Array.isArray(answerStoreConfig.answerProperties)) {
    for (const answerProperty of answerStoreConfig.answerProperties) {
      if (validateAnswerProperty(answerProperty, 'initAnswerStore')) {
        answerProperties.push(answerProperty);
      }
    }
  }
  // setup answer validator after loading answerProperties in loadConfig
  setupAnswerValidator(answerProperties);

  // load distance measure for mismatch with multiple choice answer properties
  multipleChoiceDistanceMeasure = answerStoreConfig.multipleChoiceDistanceMeasure || 5;

  // maximal versions for each answer
  answerVersionLimit = answerStoreConfig.answerVersionLimit ? Math.abs(Math.round(answerStoreConfig.answerVersionLimit)) : 5;

  // time in days, until versions of deleted answers get removed
  answerVersionDeleteExpiration = answerStoreConfig.answerVersionDeleteExpiration ? Math.abs(Math.round(answerStoreConfig.answerVersionDeleteExpiration)) : 30;
};
init();
clientsHelper.pushAfterReload(init);

// ##############################
// ## REST API                 ##
// ##############################
exports.getAnswers = function(req, res) {
  getAnswersInternal(req.user, req.params.clientId, req.query.limit).then(
    answers => res.json(answers),
    error => res.status(error.status || 500).send(error.message)
  );
};

exports.getAnswer = function(req, res) {
  getAnswerContainer(req.user, req.params.clientId).then(
    containerName => db.getAnswer(containerName, req.params.answerId)
  ).then(answer => {
    if (answer == null) {
      return res.status(404).send('Could not find an answer with this Id');
    }
    res.json(answer);
  }, error => res.status(error.status || 500).send(error.message));
};

exports.saveAnswer = function(req, res) {
  const answer = req.body;
  if (!validateAnswer(answer, 'saveAnswer')) {
    console.log("invalid answer format");
    return res.status(400).send('Invalid answer format');
  }
  getAnswerContainer(req.user, req.params.clientId).then(containerName => {
      db.getAnswer(containerName, answer.answerId).then(oldAnswer => {
        // Check if the new answer is deeply equal to the old, so it doesn't need to be changed
        try {
          assert.deepEqual(answer, oldAnswer);
          return Promise.resolve();
        } catch (assertionError) {
          // do nothing, since an assertion error is thrown, when the objects are not deeply equal
        }
        const upsertPromise = db.upsertAnswer(containerName, req.body.answerId, req.body, true);

        let versioningPromise = Promise.resolve();
        if (oldAnswer !== null) {
          versioningPromise = db.upsertVersion(containerName + versionContainerAddon, oldAnswer.answerId, {
            user: req.user.username,
            date: new Date(),
            answer: oldAnswer
          }, answerVersionLimit);
        }

        return Promise.all([upsertPromise, versioningPromise]);
      })
    }

  ).then(
    () => res.status(204).end(),
    error => res.status(error.status || 500).send(error.message)
  );
};

exports.deleteAnswer = function(req, res) {
  getAnswerContainer(req.user, req.params.clientId).then(containerName =>
    db.getAnswer(containerName, req.params.answerId).then(oldAnswer => {
      // if there is no answer with this Id, just return
      if (oldAnswer === null) {
        return;
      }
      const deletionPromise = db.deleteAnswer(containerName, req.params.answerId);
      const versioningPromise = db.upsertVersion(containerName + versionContainerAddon, oldAnswer.answerId, {
        user: req.user.username,
        date: new Date(),
        answer: oldAnswer
      }, answerVersionLimit).then(() => db.markVersionForDeletion(containerName + versionContainerAddon, req.params.answerId));

      return Promise.all([deletionPromise, versioningPromise]);
    })
  ).then(
    () => res.status(204).end(),
    error => res.status(error.status || 500).send(error.message)
  );
};

exports.getVersions = function(req, res) {
  getAnswerContainer(req.user, req.params.clientId).then(
    containerName => db.getVersions(containerName + versionContainerAddon, req.params.answerId)
  ).then(versionsDocument => {
    if (versionsDocument == null) {
      return res.status(404).send('Could not find versions of an answer with this Id');
    }
    res.json(versionsDocument.versions);
  }, error => res.status(error.status || 500).send(error.message));
};

exports.getVersionsMarkedForDeletion = function(req, res) {
  getAnswerContainer(req.user, req.params.clientId).then(
    containerName => db.getVersionsMarkedForDeletion(containerName + versionContainerAddon)
  ).then(
    versionsMarkedForDeletion => res.json(versionsMarkedForDeletion.map(versionsDocument => versionsDocument.versions)),
    error => res.status(error.status || 500).send(error.message)
  );
};

exports.unmarkVersionForDeletion = function(req, res) {
  getAnswerContainer(req.user, req.params.clientId).then(
    containerName => db.unmarkVersionForDeletion(containerName + versionContainerAddon, req.params.answerId)
  ).then(
    () => res.status(204).end(),
    error => res.status(error.status || 500).send(error.message)
  );
};

exports.getAnswerProperties = function(req, res) {
  res.json(answerProperties);
};

exports.saveAnswerProperty = function(req, res) {
  var answerProperty = req.body;
  if (!validateAnswerProperty(answerProperty, 'saveAnswerProperty')) {
    console.log("Invalid answer property format");
    return res.status(400).send('Invalid answer property format');
  }

  // update answer property cache and rebuild answer validator
  let isNew = true;
  for (let i = 0; i < answerProperties.length; i++) {
    if (answerProperties[i].name === req.body.name) {
      answerProperties[i] = answerProperty;
      isNew = false;
      break;
    }
  }
  if (isNew) {
    answerProperties.push(answerProperty);
  }
  setupAnswerValidator(answerProperties);

  db.upsertAnswerProperty(answerProperty.name, answerProperty).then(
    () => res.status(204).end(),
    error => res.status(error.status || 500).send(error.message)
  );
};

exports.deleteAnswerProperty = function(req, res) {
  // update answer property cache and rebuild answer validator
  for (let i = 0; i < answerProperties.length; i++) {
    if (answerProperties[i].name === req.params.propertyName) {
      answerProperties.splice(i, 1);
      break;
    }
  }
  setupAnswerValidator(answerProperties);

  db.deleteAnswerProperty(req.params.propertyName).then(
    () => res.status(204).end(),
    error => res.status(error.status || 500).send(error.message)
  );
};

exports.exportAnswers = function(req, res) {
  getAnswerContainer(req.user, req.params.clientId).then(
    containerName => db.getAnswers(containerName)
  ).then(answers => {
    answers = answers.filter(answer => validateAnswer(answer, 'exportAnswers'));
    return importExportApi.exportAnswers(answers, answerProperties, req.query.lang, req.query.type);
  }).then(download => {
    res.attachment(download.filename);
    res.send(download.buffer);
  }, error => res.status(error.status || 500).send(error.message));
};

exports.importAnswers = function(req, res) {
  const override = req.query.hasOwnProperty('override') && req.query.override == 'true';
  importResults = [];
  importErrors = [];
  importAnswersLength = 0;

  if (!uploader) {
    return res.status(500).send('AnswerStore_file_uploader_is_not_set_up');
  }
  uploader(req, res, error => {
    if (error) {
      importInProgress = false;
      return res.status(error.status || 500).send(error.message);
    }

    getAnswerContainer(req.user, req.params.clientId).then(containerName => {
      return importExportApi.importAnswers(req.file.buffer, answerProperties).then(function(answers) {
        const answersArray = Array.from(answers);
        importInProgress = true;
        importAnswersLength = answersArray.length;

        async.forEachLimit(answersArray, 25, function(answer, callback) {
          if (validateAnswer(answer, 'importAnswers')) {
            db.upsertAnswer(containerName, answer.answerId, answer, override).then(promiseResult => {
              importResults.push(promiseResult);
            }, error => {
              importErrors.push(answer);
            }).then(() => callback());
          } else {
            importErrors.push(answer);
          }
        });
        
        return res.status(200).send({
          importRunning: true,
        });
      }).catch(function(error) {
        importInProgress = false;
        return res.status(error.status || 500).send(error.message);
      });
    }, error => {
      importInProgress = false;
      return res.status(error.status || 500).send(error.message);
    });
  });
};

exports.getImportStatus = function(req, res) {
  if (importInProgress) {
    const currentProgress = ((importResults.length + importErrors.length) * 100 / importAnswersLength).toFixed(2);

    if (currentProgress >= 100) {
      res.status(200).send({
        importRunning: false,
        finishedImport: true,
        errors: importErrors,
      });
      importInProgress = false;
      importResults = [];
      importErrors = [];
      importAnswersLength = 0;
      return;
    } else {
      return res.status(200).send({
        importRunning: true,
        importProgress: currentProgress,
      });
    }
  } else {
    return res.status(200).send({
      importRunning: false
    });
  }
};

exports.getAnswerSets = function(req, res) {
  res.json(getAnswerSetsInternal(req.user));
};

function getAnswersInternal(user, clientId, limit) {
  return getAnswerContainer(user, clientId).then(containerName => {
    const resultLimit = limit || null;
    return db.getAnswers(containerName, resultLimit);
  });
}
exports.getAnswersInternal = getAnswersInternal;

function setupAnswerValidator(answerProperties) {
  jsonValidator.removeSchema('eva-answer-store-answer');

  // read answerSchema and enhance it with the loaded answerProperties
  const answerSchema = JSON.parse(JSON.stringify(require('./src/schemaAnswer.template.json')));
  for (const answerProperty of answerProperties) {
    // insert answerProperty into answerSchema at the right point
    if (answerProperty.type === validAnswerPropertyTypes.number) {
      answerSchema.properties.answerOptions.items.properties.properties.properties[answerProperty.name] = {
        type: ['number', 'null'],
        minimum: answerProperty.minValue,
        maximum: answerProperty.maxValue
      };
    } else if (answerProperty.type === validAnswerPropertyTypes.multipleChoice) {
      answerSchema.properties.answerOptions.items.properties.properties.properties[answerProperty.name] = {
        type: ['string', 'null'],
        enum: answerProperty.choices
      };
    }

    // add 'required' attribute of answerProperty
    if (answerProperty.required) {
      answerSchema.properties.answerOptions.items.properties.properties.required.push(answerProperty.name);
    }
  }
  jsonValidator.addSchema(answerSchema, 'eva-answer-store-answer');
}

function validateAnswerProperty(property, callingFunctionString) {
  const result = jsonValidator.validate('eva-answer-store-answer-property', property);
  if (!result) {
    console.log('Error validating an answer in ', callingFunctionString);
    console.log(jsonValidator.errors);
  }
  return result;
}

function validateAnswer(answer, callingFunctionString) {
  const result = jsonValidator.validate('eva-answer-store-answer', answer);
  if (!result) {
    console.log('Error validating an answer property in ', callingFunctionString);
    console.log(jsonValidator.errors);
  }
  return result;
}

function getAnswerSetsInternal(user) {
  const clients = user.clients;
  const clientAnswerSets = [];
  if (Array.isArray(clients)) {
    clients.forEach(client => {
      if (client.hasOwnProperty('business_answers_db') && client.business_answers_db.trim() !== '') {
        clientAnswerSets.push({
          id: client.id,
          name: client.name,
          database: client.business_answers_db
        });
      }

      if (client.hasOwnProperty('chitchat_answers_db') && client.chitchat_answers_db.trim() !== '') {
        clientAnswerSets.push({
          id: client.id + '_chitchat',
          name: client.name + ' - Chitchat',
          database: client.chitchat_answers_db
        });
      }

    });
  }
  return clientAnswerSets.concat(additionalAnswerSets);
}

function getAnswerContainer(user, clientId) {
  return new Promise((resolve, reject) => {
    const answerSets = getAnswerSetsInternal(user);
    const foundSet = answerSets.find(answerSet => answerSet.id === clientId);
    if (foundSet === undefined) {
      return reject({
        status: 400,
        message: 'no answer container available for this client'
      });
    }
    resolve(foundSet.database);
  });
}
