#!/bin/sh

. ./mb-project.sh

curl -XDELETE "http://${URL}/${INDEX}/" -H 'Content-Type: application/json'
