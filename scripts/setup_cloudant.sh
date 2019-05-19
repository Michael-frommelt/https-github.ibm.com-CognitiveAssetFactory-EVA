#!/bin/bash
echo ""
echo "###########################################"
echo "##                                       ##"
echo "##      SETUP EVA FOR IBM CLOUDANT       ##"
echo "##                                       ##"
echo "###########################################"
echo ""
echo "####### CHECKING SCRIPT DEPENDENCIES #######"
echo ""

# Required environment variables are
# API_KEY
# APPLICATION_NAME
# USERNAME
# PASSWORD
# PROD_REGION
# PROD_ORGANIZATION
# PROD_SPACE
# PROD_RESOURCE_GROUP
# LANGUAGE

frontend_name="${APPLICATION_NAME}-Frontend"
backend_name="${APPLICATION_NAME}-Backend"
database_type="cloudant"

echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "IBM Cloud CLI version: $(ibmcloud --version)"
echo "Jq version: $(jq --version)"

echo ""
echo "####### TARGETING RESOURCE GROUP & ORGANIZATION #######"
echo ""

region_short=${PROD_REGION#ibm:yp:}
if [[ $region_short == "us-south" ]]
then
    endpoint="https://api.ng.bluemix.net"
else
    endpoint="https://api.${region_short}.bluemix.net"
fi

ibmcloud login -a "$endpoint" --apikey "${API_KEY}" -g "${PROD_RESOURCE_GROUP}"
ibmcloud target --cf-api "$endpoint" -o "${PROD_ORGANIZATION}" -s "${PROD_SPACE}"

echo ""
echo "######## CREATE DUMMY FRONTEND & BACKEND ########"
echo ""

cd ./runtimes
ibmcloud cf push "$frontend_name"
ibmcloud cf push "$backend_name"
cd ..

echo ""
echo "######## SET ENVIRONMENT VARIABLES ########"
echo ""

backend_url="https://$(cf app "$backend_name" | grep -e urls: -e routes: | awk '{print $2}')"

ibmcloud cf set-env "$frontend_name" BACKEND_URL "$backend_url"
ibmcloud cf set-env "$backend_name" DB_TYPE "$database_type"

echo ""
echo "######## CREATE & BIND CLOUDANT DB ########"
echo ""

ibmcloud resource service-instance-create "${APPLICATION_NAME}-cloudant" cloudantnosqldb lite "$region_short" -p "{\"legacyCredentials\":true}"

# if the last command failed, the resource group most likey already has the max number of lite instances, so try standard
if [[ $? != 0 ]]
then
    ibmcloud resource service-instance-create "${APPLICATION_NAME}-cloudant" cloudantnosqldb standard "$region_short" -p "{\"legacyCredentials\":true}"
fi

while
    db_state=$(ibmcloud resource service-instance "${APPLICATION_NAME}-cloudant" | grep -e State: | awk '{print $2}')
    sleep 15
    [[ "$db_state" != "active" ]]
do
    :
done
ibmcloud resource service-key-create "${APPLICATION_NAME}-cloudant-credentials" Manager --instance-name "${APPLICATION_NAME}-cloudant"

db_username=$(ibmcloud resource service-key "${APPLICATION_NAME}-cloudant-credentials" | grep -e Credentials: -e username: | awk '{print $2}' | tr -d '[:space:]')
db_password=$(ibmcloud resource service-key "${APPLICATION_NAME}-cloudant-credentials" | grep -e Credentials: -e password: | awk '{print $2}' | tr -d '[:space:]')

ibmcloud resource service-alias-create "${APPLICATION_NAME}-cloudant" --instance-name "${APPLICATION_NAME}-cloudant"
ibmcloud resource service-binding-create "${APPLICATION_NAME}-cloudant" "$backend_name" Manager

echo ""
echo "########### CREATE WATSON ASSISTANT INSTANCE ###########"
echo ""

ibmcloud resource service-instance-create "${APPLICATION_NAME}-conversation" conversation standard "$region_short"
while
    wa_state=$(ibmcloud resource service-instance "${APPLICATION_NAME}-conversation" | grep -e State: | awk '{print $2}')
    sleep 15
    [[ "$wa_state" != "active" ]]
do
    :
done
ibmcloud resource service-key-create "${APPLICATION_NAME}-conversation-credentials" Manager --instance-name "${APPLICATION_NAME}-conversation"

conversation_api_key=$(ibmcloud resource service-key "${APPLICATION_NAME}-conversation-credentials" | grep -e Credentials: -e apikey: | awk '{print $2}' | tr -d '[:space:]')
wcs_url=$(ibmcloud resource service-key "${APPLICATION_NAME}-conversation-credentials" | grep -e Credentials: -e url: | awk '{print $2}' | tr -d '[:space:]')

echo ""
echo "############ CREATE WORKSPACES ############"
echo ""

business_workspace=$(curl -H "Content-Type: application/json" -X POST -u "apikey":"$conversation_api_key" -T "wcs/business_${LANGUAGE}.json"  "${wcs_url}/v1/workspaces?version=2018-09-20" | jq -r '.workspace_id')
chitchat_workspace=$(curl -H "Content-Type: application/json" -X POST -u "apikey":"$conversation_api_key" -T "wcs/chitchat_${LANGUAGE}.json"  "${wcs_url}/v1/workspaces?version=2018-09-20" | jq -r '.workspace_id')

echo ""
echo "############## SETUP DATABASE #############"
echo ""

cd ./database
npm install
node app.js --db_type="$database_type" --db_username="$db_username" --db_password="$db_password" --conversation_api_key="$conversation_api_key" \
    --wcs_url="$wcs_url" --business_workspace="$business_workspace" --chitchat_workspace="$chitchat_workspace" \
    --username="$USERNAME" --password="$PASSWORD" --language="$LANGUAGE"
cd ..

echo ""
echo "###### CREATE .ENV FILE FOR LOCAL DEV #####"
echo ""

echo "DB_TYPE='"$database_type"'" > ../backend/.env
echo "DB_USERNAME='"$db_username"'" >> ../backend/.env
echo "DB_PASSWORD='"$db_password"'" >> ../backend/.env
cat ../backend/.env
