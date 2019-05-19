#!/bin/bash

echo ""
echo "########### CLEAN DIRECTORY ############"
echo ""

rm -R .bluemix
rm -R backend
rm -R docs

echo ""
echo "############# NPM INSTALL ##############"
echo ""

npm install

echo ""
echo "############# BOWER INSTALL ##############"
echo ""

npm install -g bower
bower install --allow-root

echo ""
echo "############# BUILD: SASS ##############"
echo ""

npm rebuild node-sass

echo ""
echo "############# BUILD: GULP ##############"
echo ""

npm run gulp build

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
