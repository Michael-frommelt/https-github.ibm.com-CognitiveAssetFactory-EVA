#!/bin/bash

echo ""
echo "###### SET NODE VERSION TO 6.7.0 #######"
echo ""

export PATH=/opt/IBM/node-v6.7.0/bin:$PATH
node -v

echo ""
echo "########### CLEAN DIRECTORY ############"
echo ""

rm -R backend
rm -R docs
rm -R resources

echo ""
echo "############# NPM INSTALL ##############"
echo ""

npm install
npm install -g gulp

echo ""
echo "############# BUILD: SASS ##############"
echo ""

npm rebuild node-sass

echo ""
echo "############# BUILD: GULP ##############"
echo ""

gulp --version
gulp build

echo ""
echo "########### CLEAN DIRECTORY ############"
echo ""

rm -R frontend/src
rm -R node_modules

echo ""
echo "######## MOVE FRONTEND TO ROOT #########"
echo ""

mv -v ./frontend/* ./
rm -R frontend

echo ""
echo "######### REMOVE BUILDSCRIPTS ##########"
echo ""

rm -R scripts
ls -all
