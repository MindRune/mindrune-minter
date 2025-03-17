#!/bin/bash

# Change to the directory containing your Node.js application
cd ~/mindrune-minter

# Start the application using nodemon and log output to stdout and stderr
while true
do
    node index.js
    sleep 1
done
