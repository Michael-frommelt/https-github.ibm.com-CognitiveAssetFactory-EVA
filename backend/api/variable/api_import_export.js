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
    variableName: 'Variable Name',
    tooltip: 'Tooltip',
    abbreviation: 'Abbreviation',
    variableValue: 'Variable Value',
    VariableListExport: 'Variable list export',
    sheetName: 'Variable list',
    dateFormat: 'MM.DD.YYYY',
    worksheetAuthor: 'EVA',
    worksheetKeywords: 'Variable list, Export'
  },
  de: {
    variableName: 'Variablennamen',
    tooltip: 'Tooltip',
    abbreviation: 'Abkürzung',
    variableValue: 'Variablenwerte',
    VariableListExport: 'Variablenliste export',
    sheetName: 'Variablenliste',
    dateFormat: 'MM.DD.YYYY',
    worksheetAuthor: 'EVA',
    worksheetKeywords: 'Variablenliste, Export'
  }
};

exports.exportVariables = function(Variables,  language, fileType) {
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

    // flatten Variables to an array of objects with atomic properties for xlsx to parse
    let flattenedVariables = [];
    for (let variable of Variables) {

      let flattened={
        [strings.variableName] : variable.name,
        [strings.tooltip] : variable.tooltip,
        [strings.abbreviation]: variable.abbreviation,
        [strings.variableValue]: variable.value
      };
      flattenedVariables.push(flattened);
    }


    // build the workbook datastructure
    let now = moment();
    let worksheet = xlsx.utils.json_to_sheet(flattenedVariables);
    let workbook = {
      SheetNames: [strings.sheetName],
      Sheets: {
        [strings.sheetName]: worksheet
      },
      Props: {
        Title: strings.VariableListExport + ' ' + now.format(strings.dateFormat),
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

/* function getDuplicates(VariablesJson, strings) {
  let duplicates = new Map();
  let count = 0;
  for (let VariableRecord of VariablesJson) {
    for (let checkRecord of VariablesJson) {
      if (VariableRecord[strings.variableName]===checkRecord[strings.variableName])
        count++;
    }
    if (count > 1 )
      duplicates.set(VariableRecord[strings.variableName], VariableRecord[strings.variableName]);
    count = 0;
  }
  return duplicates;
} */


exports.importVariables = function(fileBuffer) {
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
    let VariablesJson = xlsx.utils.sheet_to_json(worksheet);

    // try to detect language the second time by looking for 'Variable ID' and 'Variable text' fields
    if (VariablesJson[0].hasOwnProperty(languages.en.variableName) && VariablesJson[0].hasOwnProperty(languages.en.variableValue)) {
      strings = languages.en;
    } else if (VariablesJson[0].hasOwnProperty(languages.de.variableName) && VariablesJson[0].hasOwnProperty(languages.de.variableValue)) {
      strings = languages.de;
    } else {
      reject({
        status: 400,
        message: 'Could not detect required fields "Variable ID" and "Variable text"'
      });
      return;
    }

    // rehydrate Variables to their internal structure
    let hydratedVariables = new Map();
    for (let flatVariable of VariablesJson) {
      // get Variable with the same Variable ID from the map
      let hydratedVariable = hydratedVariables.get(flatVariable[strings.variableName]);

      // if there is no Variable with this ID in the map, create it
      if (hydratedVariable === undefined) {
        hydratedVariable = {
          variableName : flatVariable[strings.variableName],
          tooltip : flatVariable[strings.tooltip],
          abbreviation : flatVariable[strings.abbreviation],
          value : flatVariable[strings.variableValue]
        };
      }

      hydratedVariables.set(hydratedVariable.variableName, hydratedVariable);
    }

    resolve(hydratedVariables.values());
  });
};
