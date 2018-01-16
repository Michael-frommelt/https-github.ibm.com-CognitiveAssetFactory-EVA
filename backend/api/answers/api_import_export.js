/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
'use strict';

const moment = require('moment');
const xlsx = require('xlsx');

const supportedLanguages = ['en', 'de'];
const supportedFormats = {
  xlsx: '.xlsx',
  xlml: '.xls',
  ods: '.ods',
  csv: '.csv'
};

const languages = {
  en: {
    additionalAnswerProposal: 'Additional answer proposal',
    answerId: 'Answer ID',
    answerText: 'Answer text',
    answerProposal: 'Answer proposal',
    answerListExport: 'Answer list export',
    sheetName: 'Answer list',
    dateFormat: 'MM.DD.YYYY',
    worksheetAuthor: 'EVA',
    worksheetKeywords: 'Answer list, Export'
  },
  de: {
    additionalAnswerProposal: 'Zusätzlicher Antwortvorschlag',
    answerId: 'Antwort ID',
    answerText: 'Antworttext',
    answerProposal: 'Antwortvorschlag',
    answerListExport: 'Antwortlisten-Export',
    sheetName: 'Antwortliste',
    dateFormat: 'DD.MM.YYYY',
    worksheetAuthor: 'EVA',
    worksheetKeywords: 'Antwortliste, Export'
  }
};

exports.exportAnswers = function(answers, answerProperties, language, fileType) {
  return new Promise(function(resolve, reject) {
    let timeout = setTimeout(function() {
      return reject('Import timed out.');
    }, 10000);
    
    // default language
    let strings = languages.en;

    // validate query parameters
    if (supportedLanguages.includes(language)) {
      strings = languages[language];
    }
    if (!supportedFormats.hasOwnProperty(fileType)) {
      fileType = 'xlsx';
    }

    // flatten answers to an array of objects with atomic properties for xlsx to parse
    let flattenedAnswers = [];
    for (let answer of answers) {
      for (let answerOption of answer.answerOptions) {
        // flatten constant parameters
        let flattenedAnswer = {
          [strings.answerId]: answer.answerId,
          [strings.answerText]: answerOption.answerText
        };

        // add all valid answer properties as fields
        for (let answerProperty of answerProperties) {
          if (answerOption.properties.hasOwnProperty(answerProperty.name)) {
            flattenedAnswer[answerProperty.displayName] = answerOption.properties[answerProperty.name];
          } else {
            flattenedAnswer[answerProperty.displayName] = '';
          }
        }

        // add answer proposals
        if (Array.isArray(answer.answerProposals)) {
          answer.answerProposals.forEach(function(answerProposal, index) {
            flattenedAnswer[strings.answerProposal + ' ' + (index+1)] = answerProposal;
          });
        }

        // add additional answer proposals
        if (Array.isArray(answerOption.additionalAnswerProposals)) {
          answerOption.additionalAnswerProposals.forEach(function(answerProposal, index) {
            flattenedAnswer[strings.additionalAnswerProposal + ' ' + (index+1)] = answerProposal;
          });
        }

        flattenedAnswers.push(flattenedAnswer);
      }
    }

    // build the workbook datastructure
    let now = moment();
    let worksheet = xlsx.utils.json_to_sheet(flattenedAnswers);
    let workbook = {
      SheetNames: [strings.sheetName],
      Sheets: {
        [strings.sheetName]: worksheet
      },
      Props: {
        Title: strings.answerListExport + ' ' + now.format(strings.dateFormat),
        Author: strings.worksheetAuthor,
        Keywords: strings.worksheetKeywords,
        LastAuthor: strings.worksheetAuthor,
        CreatedDate: now.toDate()
      }
    };

    // clear timeout
    clearTimeout(timeout);

    // write workbook
    resolve({
      filename: now.format('YYYY-MM-DD') + '_' + strings.sheetName.replace(' ', '_') + supportedFormats[fileType],
      buffer: xlsx.write(workbook, {bookType: fileType, type: 'buffer'})
    });
  });
};

exports.importAnswers = function(fileBuffer, answerProperties) {
  return new Promise(function(resolve, reject) {
    // default language
    let strings = languages.en;

    // read workbook
    let workbook = xlsx.read(fileBuffer, {type: 'buffer'});

    let worksheet;
    // get worksheet and try to detect language the first time by parsing the sheet names
    if (workbook.SheetNames.includes(languages.en.sheetName)) {
      strings = languages.en;
      worksheet = workbook.Sheets[languages.en.sheetName];
    } else if (workbook.SheetNames.includes(languages.de.sheetName)) {
      strings = languages.de;
      worksheet = workbook.Sheets[languages.de.sheetName];
    } else {
      worksheet = workbook.Sheets[workbook.SheetNames[0]];
    }

    // parse worksheet to json
    let answersJson = xlsx.utils.sheet_to_json(worksheet);

    // try to detect language the second time by looking for 'answer ID' and 'answer text' fields
    if (answersJson[1].hasOwnProperty(languages.en.answerId) && answersJson[1].hasOwnProperty(languages.en.answerText)) {
      strings = languages.en;
    } else if (answersJson[1].hasOwnProperty(languages.de.answerId) && answersJson[1].hasOwnProperty(languages.de.answerText)) {
      strings = languages.de;
    } else {
      reject({
        status: 400,
        message: 'Could not detect required fields "Answer ID" and "Answer text"'
      });
      return;
    }

    // rehydrate answers to their internal structure
    let hydratedAnswers = new Map();
    for (let flatAnswer of answersJson) {
      // get answer with the same answer ID from the map
      let hydratedAnswer = hydratedAnswers.get(flatAnswer[strings.answerId]);

      // if there is no answer with this ID in the map, create it
      if (hydratedAnswer === undefined) {
        hydratedAnswer = {
          answerId: flatAnswer[strings.answerId],
          answerOptions: []
        };

        // add answer proposals
        let answerProposals = [];
        for(let proposalIndex = 1; proposalIndex <= 1000; proposalIndex++) {
          let proposalPropertyName = strings.answerProposal + ' ' + proposalIndex;
          if (flatAnswer.hasOwnProperty(proposalPropertyName)) {
            answerProposals.push(flatAnswer[proposalPropertyName]);
          } else {
            // only accept subsequent indices and stop parsing answer proposals, if we dont find one
            break;
          }
        }
        hydratedAnswer.answerProposals = answerProposals;
      }

      // regardless of wether this is a new answer or not, add the answer option of this flatAnswer (row in the sheet)
      let answerOption = {
        answerText: flatAnswer[strings.answerText],
        properties: {}
      };

      // add all valid answer properties to the answer option
      for (let validAnswerProperty of answerProperties) {
        if (flatAnswer.hasOwnProperty(validAnswerProperty.displayName) && flatAnswer[validAnswerProperty.displayName] !== '') {
          let propertyValue = flatAnswer[validAnswerProperty.displayName];

          // convert property string to number for the corresponding type
          if (validAnswerProperty.type === 'number' && !Number.isNaN(Number.parseFloat(propertyValue))) {
            propertyValue = Number.parseFloat(propertyValue);
            if (propertyValue >= validAnswerProperty.minValue && propertyValue <= validAnswerProperty.maxValue) {
              answerOption.properties[validAnswerProperty.name] = propertyValue;
            }
          } else if (validAnswerProperty.type === 'multipleChoice' && validAnswerProperty.choices.includes(propertyValue)) {
            answerOption.properties[validAnswerProperty.name] = propertyValue;
          }
        }
      }

      // add all additional answer proposals to the answer option
      let additionalAnswerProposals = [];
      for(let proposalIndex = 1; proposalIndex <= 1000; proposalIndex++) {
        let proposalPropertyName = strings.additionalAnswerProposal + ' ' + proposalIndex;
        if (flatAnswer.hasOwnProperty(proposalPropertyName)) {
          additionalAnswerProposals.push(flatAnswer[proposalPropertyName]);
        } else {
          // only accept subsequent indices and stop parsing answer proposals, if we dont find one
          break;
        }
      }
      answerOption.additionalAnswerProposals = additionalAnswerProposals;

      // add the new answerOption to the hydrated answer and put it back in the map
      hydratedAnswer.answerOptions.push(answerOption);
      hydratedAnswers.set(hydratedAnswer.answerId, hydratedAnswer);
    }

    resolve(hydratedAnswers.values());
  });
};
