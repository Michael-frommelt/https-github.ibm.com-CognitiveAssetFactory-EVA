![EVA logo](docs/logo.png)

EVA, the **E**nhanced con**V**ersation **A**sset, enables you to start your chatbot *within hours* instead of days by providing the things you'll need besides Watson Conversation Service.  

## How to run a Project with EVA

EVA is **property of IBM GBS**. Please contact [Rainer Groesser](mailto:rainer.groesser@de.ibm.com) or [Mascha Lentz](mailto:mascha.lentz@de.ibm.com) regarding terms and conditions for using EVA in a client engagement.

Once you start, be sure to have a look at the EVA Best Practices! This readme will only describe the technical parts.

## Deploy EVA using the Deploy to IBM Cloud button

Clicking on the button below creates an IBM Cloud DevOps Toolchain and deploys EVA to IBM Cloud.

[![Deploy to IBM Cloud](docs/deploy_button.png)](https://bluemix.net/devops/setup/deploy?repository=https://github.ibm.com/CognitiveAssetFactory/EVA&repository_token=869a6c8023cd323f68c42d898c09ed60f32b25c0)

## Support

To get support from the EVA core team, you can join the "Cognitive Factory" Slack Workspace and [visit the eva-support channel](https://cognitiveassetfactory.slack.com/messages/C9XGQT2QZ/).

## How to run EVA locally

EVA requires Node.JS. After the installation and provision of the source code, you can start EVA with the following commands in your terminal/command line (navigate to your application root folder first):
If you are using a windows machine do the following (otherwise proceed with step2):

**Step 1:** open a cmd with admin rights and execute:
```sh
npm install --global --production windows-build-tools

```

**Step 2:** Install Node.js dependencies

```sh
npm install

npm install -g gulp

npm rebuild node-sass

gulp build
```

**Step 3:** To start your application just type

```sh
gulp
```

## How to configure basic Services  

EVA comes with a basis set of services already integrated into the pipeline. To use them you can simply change the configuration in the database.  

### Change the configuration in the database.  

The other Services (Conversation, Spell Checker, Retrieve&Rank, Speech2Text) can be configured easily in the config collection such the following document.

```
"conversation": {
    "url": "https://gateway-fra.watsonplatform.net/conversation/api",
    "username": "a5e6bb7f-e0c9-45fd-9293-5efc0eece657",
    "password": "M2T61aztUELz",
    "show_alternate_intents": true
},
```

### Submit the changes

To take over the changes from the database into your application, please restart the app under the IBM Cloud console.  

![Screenshot of cloud foundry apps](docs/cloud_foundry_apps.png)

## How to change the UI

### Create Clients in Database

EVA supports multiple clients which is interesting as well for one client and multiple use cases or even designs. To create a client go to the “config” collection in Mongo DB with a tool as MongoBooster. Clients have the following structure:

```
{
    "id": "standard",
    "name": "Standard",
    "language": "de",
    "conversation_workspace_id": "b6e35506-826e-493e-b50f-ae11ed69d95e",
    "rar_collection": "",
    "answers_database": "answers_standard",
    "hidden": false
},
```

In MongoBooster, select config > clients > edit document. Copy the JSON structure of a client as depicted above and change id, name as well as the conversation workspace ID. If you want to set up a net answer store for this client, you can also change the answers_database variable. When you are finished click “run”.  

![Screenshot of users collection](docs/clients_db.png)

As a second action in MongoBooster you have to give the admin user access to the new client. In order to do so, select users > clients and add your new client to the list of existing clients. Please do not do further changes to this user.  

### Change the UI

![Screenshot of users collection](docs/users_db.png)

Next, in the following folders you have to copy the folder of an existing client (e.g. “standard”) and rename it to the id you set in MongoDB (e.g. “rente”). Please choose an existing client as you like to have the template.
* Frontend/src/sass/
* Frontend/src/views/

Important: Every client has his primary Conversation and Retrieve and Rank workspace. You need to insert the workspace/service ID there. If you need guidance please have a look at our example configuration in appendix.

## Further Information needed?
Have a look at our wiki (Cognitive Asset Factory): <http://ibm.biz/eva-asset>
Or read our technical documentation: <https://ibm.ent.box.com/file/288886407204>

## Changelog
### v1.2.8 (2018-10-24)
* Fixed Test Comparison Controller by changing $scope to this
* Created translation for Entry 'NAV_TEST' and renamed test in Dialog Test
* Changed Flow test behaviour: now answerId must be in answer exactly once
* Added Dialog Test Examples
* Fixed Dialog test for Cloudant (swapped group by file and intent)
* Fixed Dialog test statistics: now correct sorting of results in detail view
* Changed Confidence calculation in dialog test (wrong topIntent now equals 0) and added description field
* Fixed loading of Dropdown elements in Confusion matrix for Cloudant, enhanced for MongoDB
* correctly replace object variables in the answerStore (if entered in dot notation), dot not allowed as character for variables in the variableStore
* prevent duplicate answer_proposals
* all frontend pages (including reporting) will only show clients that the current user has the right to see
* fixed client filtering
* fixed uri encoding of answerIds
* support for custom database names

### v1.2.7 (2018-10-10)
* Added learning opt-out to all Watson services by default

### v1.2.6 (2018-10-10)
* Fixed handling with non self-signed certificates on MongoDB (see IBM Cloud changes)
* Fixed caching problems on Internet Explorer (e.g. reporting export getting stuck)
* Fixed size of trend overview chart on "testing" page in Internet Explorer

### v1.2.5 (2018-08-30)
* Added confidence check in Jumphandler for few word intents
* Fixed dropdown in K-fold Cross Validation

### v1.2.4 (2018-08-03)
* Fixed dropdown list containing test runs for the confusion matrix
* Fixed sorting and grouping of detailed test results view (modal) for MongoDB and Cloudant
* Moved data validation from frontend to backend for detailed test results

### v1.2.3 (2018-05-23)
* Critical bug fix: Invalid JSON file crashed initial auto deployment

### v1.2.2 (2018-05-23)
* Security fix: Deactivate external frontend test proxy on non local instances
* Critical bug fix: Set angular version to 1.6.8 (1.7.0 will crash the frontend!)
* Fixed bug: Fixed error handling for answer store import

### v1.2.1 (2018-05-23)
* Added external API definition file (Swagger 2.0)

### v1.2.0 (2018-05-09)
* Added new anaphora solution (see documentation)
* Formatted watson assistant workspaces

### v1.1.2 (2018-05-03)
* Fixed bug: Added missing second quotation mark for CC_Chatten_Wer - answer in chitchat.json
* Fixed bug: User could not get permission 'isAdmin' when the users client array is already enhanced

### v1.1.1 (2018-04-10)
* Removed unused container "external_frontend" from automatic set-up script
* Enhancement: Answer store import now shows answers that were not imported due to them being invalid
* Fixed bug: Corrected infinite answer import process when file contained invalid / badly formatted answers
* Fixed bug: Corrected saveFeedback function in conversationController to prevent need for double clicking on save Feedback button in oneColumn view
* Fixed bug: Corrected cloudant function of saveFeedback to return _id of inserted document (user feedback will be assigned to correct reporting entry now)
* Fixed bug: external frontend api always sent 500 error instead of correct error code

### v1.1.0 (2018-02-22)
* NEW FEATURE: Added APIs to connect EVA with Facebook and Alexa
* You can find the documentation for these new features in this repository: /docs/Documentation_Facebook_and_Alexa_Integration_for_EVA_v1.1.pdf

### v1.0.2 (2018-02-22)
* Fixed error handling in dialog testing
* Show error message in frontend for dialog tests
* Removed styling from default answers
* Changed "jumpTo" to "skip user input" in business workspace
* Fixed bug: profanity list using _rev from cloudant
* Fixed bug: Avoid crashing on testing when testing workspaces are not defined
* Fixed bug: Corrected cloudant implementations of getVersionsMarkedForDeletion and deleteAnswerProperty
* Fixed bug: Prevent answer schema json from becoming polluted
* Answer store: Added answer tags and answer option tags to import & export functionality

### v1.0.1 (2018-02-07)
* Fixed cloudant bug: Server crashing on wrong credentials when using cloudant db
* Fixed cloudant bug: Cloudant database functions checking for empty results in a wrong way
* Fixed frontend bug: Answer store import setting status correctly
* Fixed bugs in conversation workspaces: Changed is_zzv_question occurrences to is_business_question
* Fixed bug: Now storing kfold-test result in Cloudant in separate files to omit exceedance of maximum file size
* Fixed bug: One column design not using 2 input fields anymore (fixed error user can not send message by hitting enter)
* Fixed bug: On one column design chat & debug mode are too big on small desktop screens (not scrollable)
* Added refreshCloudantSetup-Bashscript, which adds cloudant design documents if not present (should be executed after every upgrade if using cloudant!)
* Feedback export now working as stream in cloudant database to omit errors on big sized files
* One column design: Buttons size not depending on chat input (always full size)
* Optimized status check for running answer store imports
* Deactivated extended feedback modal on standard installation
* Removed jargon-check for "getQuestionsByIntent" and "getQuestionsByEntity" (not implemented, can cause errors)
* Library upgrade: Minimatch to version 3.0.4 (fixes DoS security issue)
