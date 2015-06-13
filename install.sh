#!/bin/bash

# get latest repos
add-apt-repository ppa:chris-lea/node.js
apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
echo "deb http://repo.mongodb.org/apt/ubuntu "$(lsb_release -sc)"/mongodb-org/3.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.0.list
sudo apt-get update

# install latest nodejs
apt-get install -y nodejs

# install latest mongodb
sudo apt-get install -y mongodb-org

# install project dependencies
npm install express
npm install mongodb
npm install body-parser
