echo ""
echo "###########################################"
echo "##                                       ##"
echo "##      SETUP EVA FOR IBM CLOUDANT       ##"
echo "##                                       ##"
echo "###########################################"
echo ""

echo ""
echo "####### INSTALL SCRIPT DEPENDENCIES #######"
echo ""

sudo apt-get update
sudo apt-get install -y jq

echo ""
echo "######## SET NODE VERSION TO 6.7.0 ########"
echo ""

export PATH=/opt/IBM/node-v6.7.0/bin:$PATH
node -v

echo ""
echo "######## CREATE BACKEND & FRONTEND ########"
echo ""

if [ "${PROD_REGION_ID#ibm:yp:}" == "us-south" ]; then
    endpoint="https://api.ng.bluemix.net"
else 
    endpoint="https://api.${PROD_REGION_ID#ibm:yp:}.bluemix.net"
fi

ibmcloud login -a "$endpoint" --apikey "$API_KEY" -g "$PROD_RESOURCE_GROUP_NAME"

(cd ./runtimes && cf push ${PROD_APP_NAME}-Backend)
(cd ./runtimes && cf push ${PROD_APP_NAME}-Frontend)

echo ""
echo "######## SET ENVIRONMENT VARIABLES ########"
echo ""

ibmcloud target --cf-api "$endpoint" -o "$PROD_ORG_NAME" -s "$PROD_SPACE_NAME"

backend_url=https://$(cf app ${PROD_APP_NAME}-Backend | grep -e urls: -e routes: | awk '{print $2}')
db_type="cloudant"

ibmcloud cf set-env ${PROD_APP_NAME}-Frontend BACKEND_URL $backend_url
ibmcloud cf set-env ${PROD_APP_NAME}-Backend DB_TYPE $db_type

echo ""
echo "######## CREATE & BIND CLOUDANT DB ########"
echo ""

ibmcloud resource service-instance-create ${PROD_APP_NAME}-cloudant cloudantnosqldb lite ${PROD_REGION_ID#ibm:yp:}
c_state=$(ibmcloud resource service-instance ${PROD_APP_NAME}-cloudant | grep -e State: | awk '{print $2}')

while [ "$c_state" != "active" ]
do
    sleep 15
    c_state=$(ibmcloud resource service-instance ${PROD_APP_NAME}-cloudant | grep -e State: | awk '{print $2}')
done

ibmcloud resource service-key-create ${PROD_APP_NAME}-cloudant-credentials Manager --instance-name ${PROD_APP_NAME}-cloudant

db_username=$(ibmcloud resource service-key ${PROD_APP_NAME}-cloudant-credentials | grep -e Credentials: -e username: | awk '{print $2}' | tr -d '[:space:]')
db_password=$(ibmcloud resource service-key ${PROD_APP_NAME}-cloudant-credentials | grep -e Credentials: -e password: | awk '{print $2}' | tr -d '[:space:]')

ibmcloud resource service-alias-create ${PROD_APP_NAME}-cloudant --instance-name ${PROD_APP_NAME}-cloudant
ibmcloud resource service-binding-create ${PROD_APP_NAME}-cloudant ${PROD_APP_NAME}-Backend Manager

echo ""
echo "########### CREATE WA INSTANCE ###########"
echo ""

ibmcloud resource service-instance-create ${PROD_APP_NAME}-conversation conversation standard ${PROD_REGION_ID#ibm:yp:} 

wa_state=$(ibmcloud resource service-instance ${PROD_APP_NAME}-conversation | grep -e State: | awk '{print $2}')

while [ "$wa_state" != "active" ]
do
    sleep 15
    wa_state=$(ibmcloud resource service-instance ${PROD_APP_NAME}-conversation | grep -e State: | awk '{print $2}')
done

ibmcloud resource service-key-create ${PROD_APP_NAME}-conversation-credentials Manager --instance-name ${PROD_APP_NAME}-conversation
conversation_api_key=$(ibmcloud resource service-key ${PROD_APP_NAME}-conversation-credentials | grep -e Credentials: -e apikey: | awk '{print $2}' | tr -d '[:space:]')
wcs_url=$(ibmcloud resource service-key ${PROD_APP_NAME}-conversation-credentials | grep -e Credentials: -e url: | awk '{print $2}' | tr -d '[:space:]')


echo ""
echo "############ CREATE WORKSPACES ############"
echo ""

business_workspace=$(curl -H "Content-Type: application/json" -X POST -u "apikey":"$conversation_api_key" -T wcs/business_$LANGUAGE.json  $wcs_url"/v1/workspaces?version=2018-09-20" | jq -r '.workspace_id')
chitchat_workspace=$(curl -H "Content-Type: application/json" -X POST -u "apikey":"$conversation_api_key" -T wcs/chitchat_$LANGUAGE.json  $wcs_url"/v1/workspaces?version=2018-09-20" | jq -r '.workspace_id')

echo ""
echo "############## SETUP DATABASE #############"
echo ""

(cd ./database && npm install && node app.js --db_type=$db_type --db_username=$db_username --db_password=$db_password --conversation_api_key=$conversation_api_key --wcs_url=$wcs_url --business_workspace=$business_workspace --chitchat_workspace=$chitchat_workspace --username=$USERNAME --password=$PASSWORD)

echo ""
echo "###### CREATE .ENV FILE FOR LOCAL DEV #####"
echo ""

echo "DB_TYPE='"$db_type"'" > ../backend/.env
echo "DB_USERNAME='"$db_username"'" >> ../backend/.env
echo "DB_PASSWORD='"$db_password"'" >> ../backend/.env
cat ../backend/.env
