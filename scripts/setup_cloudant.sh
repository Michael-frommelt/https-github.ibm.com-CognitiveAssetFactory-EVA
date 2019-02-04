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

ibmcloud login -a "$endpoint" --apikey "$API_KEY" -o "$PROD_ORG_NAME" -s "$PROD_SPACE_NAME"

(cd ./runtimes && ibmcloud cf push)

echo ""
echo "######## SET ENVIRONMENT VARIABLES ########"
echo ""

backend_url=https://$(cf app EVA-Backend | grep -e urls: -e routes: | awk '{print $2}')
db_type="cloudant"

ibmcloud cf set-env EVA-Frontend BACKEND_URL $backend_url
ibmcloud cf set-env EVA-Backend DB_TYPE $db_type

echo ""
echo "######## CREATE & BIND CLOUDANT DB ########"
echo ""

cf create-service cloudantNoSQLDB Lite eva-cloudant
cf create-service-key eva-cloudant credentials

db_username=$(cf service-key eva-cloudant credentials | sed -n '/{/,/}/p' | jq -r '.username')
db_password=$(cf service-key eva-cloudant credentials | sed -n '/{/,/}/p' | jq -r '.password')

cf bind-service EVA-Backend eva-cloudant

echo ""
echo "########### CREATE WA INSTANCE ###########"
echo ""

ibmcloud service create conversation standard eva-conversation
ibmcloud iam service-id-create eva-conversation
ibmcloud service key-create eva-conversation eva-conversation-key
conversation_api_key=$(ibmcloud service key-show eva-conversation eva-conversation-key | sed -n '/{/,/}/p' | jq -r '.apikey')
wcs_url=$(ibmcloud service key-show eva-conversation eva-conversation-key | sed -n '/{/,/}/p' | jq -r '.url')

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
