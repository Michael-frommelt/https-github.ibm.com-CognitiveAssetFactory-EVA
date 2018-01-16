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

(cd ./runtimes && cf push)

echo ""
echo "######## SET ENVIRONMENT VARIABLES ########"
echo ""

backend_url=https://$(cf app EVA-Backend | grep -e urls: -e routes: | awk '{print $2}')
db_type="mongodb"

cf set-env EVA-Frontend BACKEND_URL $backend_url
cf set-env EVA-Backend DB_TYPE $db_type

echo ""
echo "########## CREATE & BIND MONGODB ##########"
echo ""

cf create-service compose-for-mongodb Standard eva-mongodb
cf create-service-key eva-mongodb credentials

db_uri=$(cf service-key eva-mongodb credentials | sed -n '/{/,/}$/p' | jq -r '.uri')
db_ca_certificate=$(cf service-key eva-mongodb credentials | sed -n '/{/,/}$/p' | jq -r '.ca_certificate_base64')

cf bind-service EVA-Backend eva-mongodb

echo ""
echo "########### CREATE WCS INSTANCE ###########"
echo ""

cf create-service conversation standard eva-conversation
cf create-service-key eva-conversation credentials

wcs_username=$(cf service-key eva-conversation credentials | sed -n '/{/,/}/p' | jq -r '.username')
wcs_password=$(cf service-key eva-conversation credentials | sed -n '/{/,/}/p' | jq -r '.password')
wcs_url=$(cf service-key eva-conversation credentials | sed -n '/{/,/}/p' | jq -r '.url')

echo ""
echo "############ CREATE WORKSPACES ############"
echo ""

business_workspace=$(curl -H "Content-Type: application/json" -X POST -u $wcs_username:$wcs_password -T wcs/business.json $wcs_url"/v1/workspaces?version=2017-05-26" | jq -r '.workspace_id')
chitchat_workspace=$(curl -H "Content-Type: application/json" -X POST -u $wcs_username:$wcs_password -T wcs/chitchat.json $wcs_url"/v1/workspaces?version=2017-05-26" | jq -r '.workspace_id')

echo ""
echo "############## SETUP DATABASE #############"
echo ""

(cd ./database && npm install && node app.js --db_type=$db_type --db_uri=$db_uri --db_ca_certificate=$db_ca_certificate --wcs_username=$wcs_username --wcs_password=$wcs_password --wcs_url=$wcs_url --business_workspace=$business_workspace --chitchat_workspace=$chitchat_workspace --username=$USERNAME --password=$PASSWORD)

echo ""
echo "###### CREATE .ENV FILE FOR LOCAL DEV #####"
echo ""

echo "DB_TYPE='"$db_type"'" > ../backend/.env
echo "DB_URI='"$db_uri"'" >> ../backend/.env
echo "DB_CA_CERTIFICATE='"$db_ca_certificate"'" >> ../backend/.env
cat ../backend/.env
