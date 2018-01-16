#!/bin/sh

# Adjust username and password according to cloudant instance


USERNAME=""
PASSWORD=""


echo ""
echo "###### CREATING DESIGN DOCUMENTS FOR answers_business_asset DATABASE #####"
echo ""

{
  curl -H 'Content-Type: application/json' -X POST https://${USERNAME}:${PASSWORD}@${USERNAME}.cloudant.com/answers_business_asset -d @DesignDoc_answers_business_asset.json
} || {
  echo "!!! DESIGN DOCUMENTS FOR answers_business_asset DATABASE NOT CREATED - CHECK IF DATABASE OR DOCUMENT ALREADY EXISTS !!!"
}

echo ""
echo "###### CREATING DESIGN DOCUMENTS FOR answers_chitchat_asset DATABASE #####"
echo ""

{
  curl -H 'Content-Type: application/json' -X POST https://${USERNAME}:${PASSWORD}@${USERNAME}.cloudant.com/answers_chitchat_asset -d @DesignDoc_answers_chitchat_asset.json
} || {
  echo "!!! DESIGN DOCUMENTS FOR answers_chitchat_asset DATABASE NOT CREATED - CHECK IF DATABASE OR DOCUMENT ALREADY EXISTS !!!"
}

echo ""
echo "###### CREATING DESIGN DOCUMENTS FOR config DATABASE #####"
echo ""

{
  curl -H 'Content-Type: application/json' -X POST https://${USERNAME}:${PASSWORD}@${USERNAME}.cloudant.com/config -d @DesignDoc_config.json
} || {
  echo "!!! DESIGN DOCUMENTS FOR config DATABASE NOT CREATED - CHECK IF DATABASE OR DOCUMENT ALREADY EXISTS !!!"
}

echo ""
echo "###### CREATING DESIGN DOCUMENTS FOR conversation_feedback DATABASE #####"
echo ""

{
  curl -H 'Content-Type: application/json' -X POST https://${USERNAME}:${PASSWORD}@${USERNAME}.cloudant.com/conversation_feedback/_bulk_docs -d @DesignDocs_conversation_feedback.json
} || {
  echo "!!! DESIGN DOCUMENTS FOR conversation_feedback DATABASE NOT CREATED - CHECK IF DATABASE OR DOCUMENT ALREADY EXISTS !!!"
}

echo ""
echo "###### CREATING DESIGN DOCUMENTS FOR conversation_logs DATABASE #####"
echo ""

{
  curl -H 'Content-Type: application/json' -X POST https://${USERNAME}:${PASSWORD}@${USERNAME}.cloudant.com/conversation_logs/_bulk_docs -d @DesignDocs_conversation_logs.json
} || {
  echo "!!! DESIGN DOCUMENTS FOR conversation_logs DATABASE NOT CREATED - CHECK IF DATABASE OR DOCUMENT ALREADY EXISTS !!!"
}

echo ""
echo "###### CREATING DESIGN DOCUMENTS FOR kfold_results DATABASE #####"
echo ""

{
  curl -H 'Content-Type: application/json' -X POST https://${USERNAME}:${PASSWORD}@${USERNAME}.cloudant.com/kfold_results/_bulk_docs -d @DesignDocs_kfold_results.json
} || {
  echo "!!! DESIGN DOCUMENTS FOR kfold_results DATABASE NOT CREATED - CHECK IF DATABASE OR DOCUMENT ALREADY EXISTS !!!"
}

echo ""
echo "###### CREATING DESIGN DOCUMENTS FOR sessions DATABASE #####"
echo ""

{
  curl -H 'Content-Type: application/json' -X POST https://${USERNAME}:${PASSWORD}@${USERNAME}.cloudant.com/sessions -d @DesignDoc_sessions.json
} || {
  echo "!!! DESIGN DOCUMENTS FOR sessions DATABASE NOT CREATED - CHECK IF DATABASE OR DOCUMENT ALREADY EXISTS !!!"
}

echo ""
echo "###### CREATING DESIGN DOCUMENTS FOR test DATABASE #####"
echo ""

{
  curl -H 'Content-Type: application/json' -X POST https://${USERNAME}:${PASSWORD}@${USERNAME}.cloudant.com/test -d @DesignDoc_test.json
} || {
  echo "!!! DESIGN DOCUMENTS FOR test DATABASE NOT CREATED - CHECK IF DATABASE OR DOCUMENT ALREADY EXISTS !!!"
}

echo ""
echo "###### CREATING DESIGN DOCUMENTS FOR test_files DATABASE #####"
echo ""

{
  curl -H 'Content-Type: application/json' -X POST https://${USERNAME}:${PASSWORD}@${USERNAME}.cloudant.com/test_files -d @DesignDoc_test_files.json
} || {
  echo "!!! DESIGN DOCUMENTS FOR test_files DATABASE NOT CREATED - CHECK IF DATABASE OR DOCUMENT ALREADY EXISTS !!!"
}

echo ""
echo "###### CREATING DESIGN DOCUMENTS FOR test_results DATABASE #####"
echo ""

{
  curl -H 'Content-Type: application/json' -X POST https://${USERNAME}:${PASSWORD}@${USERNAME}.cloudant.com/test_results/_bulk_docs -d @DesignDocs_test_results.json
} || {
  echo "!!! DESIGN DOCUMENTS FOR test_results DATABASE NOT CREATED - CHECK IF DATABASE OR DOCUMENT ALREADY EXISTS !!!"
}

echo ""
echo "###### CREATING DESIGN DOCUMENTS FOR test_sessions DATABASE #####"
echo ""

{
  curl -H 'Content-Type: application/json' -X POST https://${USERNAME}:${PASSWORD}@${USERNAME}.cloudant.com/test_sessions -d @DesignDoc_test_sessions.json
} || {
  echo "!!! DESIGN DOCUMENTS FOR test_sessions DATABASE NOT CREATED - CHECK IF DATABASE OR DOCUMENT ALREADY EXISTS !!!"
}

echo ""
echo "###### CREATING DESIGN DOCUMENTS FOR view_result_testing DATABASE #####"
echo ""

{
  curl -H 'Content-Type: application/json' -X POST https://${USERNAME}:${PASSWORD}@${USERNAME}.cloudant.com/view_result_testing -d @DesignDoc_view_result_testing.json
} || {
  echo "!!! DESIGN DOCUMENTS FOR view_result_testing DATABASE NOT CREATED - CHECK IF DATABASE OR DOCUMENT ALREADY EXISTS !!!"
}
