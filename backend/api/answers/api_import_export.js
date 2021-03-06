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
    answerOptionTag: 'Answer option tag',
    answerTag: 'Answer tag',
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
    answerOptionTag: 'Antwortmöglichkeits-Tag',
    answerTag: 'Antwort-Tag',
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
      return reject('Export timed out.');
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
            flattenedAnswer[strings.answerProposal + ' ' + (index + 1)] = answerProposal;
          });
        }

        // add answer tags
        if (Array.isArray(answer.tags)) {
          answer.tags.forEach(function(answerTag, index) {
            flattenedAnswer[strings.answerTag + ' ' + (index + 1)] = answerTag;
          });
        }

        // add additional answer proposals
        if (Array.isArray(answerOption.additionalAnswerProposals)) {
          answerOption.additionalAnswerProposals.forEach(function(answerProposal, index) {
            flattenedAnswer[strings.additionalAnswerProposal + ' ' + (index + 1)] = answerProposal;
          });
        }

        // add answer option tags
        if (Array.isArray(answerOption.tags)) {
          answerOption.tags.forEach(function (answerTag, index) {
            flattenedAnswer[strings.answerOptionTag + ' ' + (index + 1)] = answerTag;
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

function getDuplicates(answersJson, strings) {
    let duplicates = new Map();
    let count = 0;
    for (let answerRecord of answersJson) {
      for (let checkRecord of answersJson) {
        if (answerRecord[strings.answerId]===checkRecord[strings.answerId])
          count++;
      }
      if (count > 1 )
        duplicates.set(answerRecord[strings.answerId], answerRecord[strings.answerId]);
      count = 0;
    }
    return duplicates;
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
    if (answersJson[0].hasOwnProperty(languages.en.answerId) && answersJson[0].hasOwnProperty(languages.en.answerText)) {
      strings = languages.en;
    } else if (answersJson[0].hasOwnProperty(languages.de.answerId) && answersJson[0].hasOwnProperty(languages.de.answerText)) {
      strings = languages.de;
    } else {
      reject({
        status: 400,
        message: 'Could not detect required fields "Answer ID" and "Answer text"'
      });
      return;
    }

    //checking the importing file for the duplicates of AnswerIDs
    let duplicates = getDuplicates(answersJson, strings);
    if (duplicates.size > 0){
      let values = "";
      for (var value of duplicates.values())
        values = values + value + "; ";
      reject({
        status: 400,
        message: ' - import was rejected. AnswerID must be unique. Conflicting AnswerIDs: '+ values
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
          answerOptions: [],
          answerProposals: [],
          tags: [],
        };

        // add answer proposals
        for(let proposalIndex = 1; proposalIndex <= 1000; proposalIndex++) {
          let proposalPropertyName = strings.answerProposal + ' ' + proposalIndex;
          if (flatAnswer.hasOwnProperty(proposalPropertyName) && flatAnswer[proposalPropertyName].trim() !== '') {
            hydratedAnswer.answerProposals.push(flatAnswer[proposalPropertyName]);
          } else {
            // only accept subsequent indices and stop parsing answer proposals, if we dont find one
            break;
          }
        }

        // add answer tags
        for (let tagIndex = 1; tagIndex <= 1000; tagIndex++) {
          let tagPropertyName = strings.answerTag + ' ' + tagIndex;
          if (flatAnswer.hasOwnProperty(tagPropertyName) && flatAnswer[tagPropertyName].trim() !== '') {
            hydratedAnswer.tags.push(flatAnswer[tagPropertyName]);
          } else {
            // only accept subsequent indices and stop parsing answer tags, if we dont find one
            break;
          }
        }
      }

      // regardless of wether this is a new answer or not, add the answer option of this flatAnswer (row in the sheet)
      let answerOption = {
        answerText: flatAnswer[strings.answerText],
        properties: {},
        additionalAnswerProposals: [],
        tags: [],
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
      for(let proposalIndex = 1; proposalIndex <= 1000; proposalIndex++) {
        let proposalPropertyName = strings.additionalAnswerProposal + ' ' + proposalIndex;
        if (flatAnswer.hasOwnProperty(proposalPropertyName) && flatAnswer[proposalPropertyName].trim() !== '') {
          answerOption.additionalAnswerProposals.push(flatAnswer[proposalPropertyName]);
        } else {
          // only accept subsequent indices and stop parsing answer proposals, if we dont find one
          break;
        }
      }

      // add answer option tags
      for (let tagIndex = 1; tagIndex <= 1000; tagIndex++) {
        let tagPropertyName = strings.answerOptionTag + ' ' + tagIndex;
        if (flatAnswer.hasOwnProperty(tagPropertyName) && flatAnswer[tagPropertyName].trim() !== '') {
          answerOption.tags.push(flatAnswer[tagPropertyName]);
        } else {
          // only accept subsequent indices and stop parsing answer tags, if we dont find one
          break;
        }
      }

      // add the new answerOption to the hydrated answer and put it back in the map
      hydratedAnswer.answerOptions.push(answerOption);
      hydratedAnswers.set(hydratedAnswer.answerId, hydratedAnswer);
    }

    resolve(hydratedAnswers.values());
  });
};
