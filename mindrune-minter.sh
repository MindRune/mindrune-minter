#!/bin/bash

# Change to the directory containing your Node.js application
cd ~/mindrune-minter/src

# Start the application using nodemon and log output to stdout and stderr
while true
do
    node index.js
    sleep 1
done
