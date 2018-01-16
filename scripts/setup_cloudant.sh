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

(cd ./runtimes && cf push)

echo ""
echo "######## SET ENVIRONMENT VARIABLES ########"
echo ""

backend_url=https://$(cf app EVA-Backend | grep -e urls: -e routes: | awk '{print $2}')
db_type="cloudant"

cf set-env EVA-Frontend BACKEND_URL $backend_url
cf set-env EVA-Backend DB_TYPE $db_type

echo ""
echo "######## CREATE & BIND CLOUDANT DB ########"
echo ""

cf create-service cloudantNoSQLDB Lite eva-cloudant
cf create-service-key eva-cloudant credentials

db_username=$(cf service-key eva-cloudant credentials | sed -n '/{/,/}/p' | jq -r '.username')
db_password=$(cf service-key eva-cloudant credentials | sed -n '/{/,/}/p' | jq -r '.password')

cf bind-service EVA-Backend eva-cloudant

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

(cd ./database && npm install && node app.js --db_type=$db_type --db_username=$db_username --db_password=$db_password --wcs_username=$wcs_username --wcs_password=$wcs_password --wcs_url=$wcs_url --business_workspace=$business_workspace --chitchat_workspace=$chitchat_workspace --username=$USERNAME --password=$PASSWORD)

echo ""
echo "###### CREATE .ENV FILE FOR LOCAL DEV #####"
echo ""

echo "DB_TYPE='"$db_type"'" > ../backend/.env
echo "DB_USERNAME='"$db_username"'" >> ../backend/.env
echo "DB_PASSWORD='"$db_password"'" >> ../backend/.env
cat ../backend/.env
