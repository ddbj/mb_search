#!/bin/sh

. ./mb-project.sh

curl -XPOST "http://${URL}/_bulk?pretty" -H "Content-Type: application/json" --data-binary @mb-project.data.json

