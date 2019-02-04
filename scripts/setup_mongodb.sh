echo ""
echo "###########################################"
echo "##                                       ##"
echo "##         SETUP EVA FOR MONGODB         ##"
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
db_type="mongodb"

ibmcloud cf set-env EVA-Frontend BACKEND_URL $backend_url
ibmcloud cf set-env EVA-Backend DB_TYPE $db_type

echo ""
echo "########## CREATE & BIND MONGODB ##########"
echo ""

cf create-service compose-for-mongodb Standard eva-mongodb
cf create-service-key eva-mongodb credentials

db_uri=$(cf service-key eva-mongodb credentials | sed -n '/{/,/}$/p' | jq -r '.uri')
db_ca_certificate=$(cf service-key eva-mongodb credentials | sed -n '/{/,/}$/p' | jq -r '.ca_certificate_base64')

cf bind-service EVA-Backend eva-mongodb

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

(cd ./database && npm install && node app.js --db_type=$db_type --db_uri=$db_uri --db_ca_certificate=$db_ca_certificate --conversation_api_key=$conversation_api_key --wcs_url=$wcs_url --business_workspace=$business_workspace --chitchat_workspace=$chitchat_workspace --username=$USERNAME --password=$PASSWORD)

echo ""
echo "###### CREATE .ENV FILE FOR LOCAL DEV #####"
echo ""

echo "DB_TYPE='"$db_type"'" > ../backend/.env
echo "DB_URI='"$db_uri"'" >> ../backend/.env
echo "DB_CA_CERTIFICATE='"$db_ca_certificate"'" >> ../backend/.env
cat ../backend/.env
