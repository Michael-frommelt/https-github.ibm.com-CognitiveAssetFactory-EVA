echo ""
echo "###########################################"
echo "##                                       ##"
echo "##      RFRESH DESIGN DOCUMENTS          ##"
echo "##          FOR IBM CLOUDANT             ##"
echo "##                                       ##"
echo "###########################################"
echo ""

db_type="cloudant"
refresh="true"

# add specific cloudant credentials here
db_username=""
db_password=""

if [ "$db_username" == '' ] || [ "$db_password" == '' ]
 then
  echo ""
  echo "############# CLOUDANT CREDENTIALS UNDEFINED  #############"
  echo "############# ADD IN 'refreshCloudantSetup.sh' #############"
  exit 1
fi

(cd ./database && node app.js --refresh=$refresh --db_type=$db_type --db_username=$db_username --db_password=$db_password --wcs_username="" --wcs_password="" --wcs_url="" --business_workspace="" --chitchat_workspace="" --username="" --password="")
