#!/bin/bash

echo ""
echo "########### CLEAN DIRECTORY ############"
echo ""

rm -R docs
rm -R external_frontend
rm -R frontend
rm -R resources

echo ""
echo "######### MOVE BACKEND TO ROOT #########"
echo ""

mv -v ./backend/* ./
rm -R backend

echo ""
echo "######### REMOVE BUILDSCRIPTS ##########"
echo ""

rm -R scripts
ls -all
