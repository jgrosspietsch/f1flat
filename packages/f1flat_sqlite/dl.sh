#!/usr/bin/env bash
echo "Downloading f1db_csv.zip"
curl -s -o f1db_csv.zip https://ergast.com/downloads/f1db_csv.zip
echo "Unzipping f1db_csv.zip"
unzip -q f1db_csv.zip -d csv
echo "Removing f1db_csv.zip"
rm f1db_csv.zip
echo "Done"
