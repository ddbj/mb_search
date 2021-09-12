#!/bin/sh

. ./mb-project.inc

for INDEX in ${INDEXES}
do
	RES=` curl -s http://${URL}/_cat/indices | grep " ${INDEX} "`
	if [ "${RES}" ]; then
		curl -XDELETE "http://${URL}/${INDEX}/" -H 'Content-Type: application/json'
	fi

	curl -XPUT "http://${URL}/${INDEX}/?pretty" -H 'Content-Type: application/json' -d'
{
  "settings" : {
      "number_of_shards"   : 1,
      "number_of_replicas" : 0
  },
  "mappings": {
    "properties": {
	"id":               {"type": "keyword"},
	"project":          {"type": "keyword"},
	"project_id":       {"type": "keyword"},
	"project_label":    {"type": "text"},
	"description":      {"type": "text"},
	"instruments":      {"type": "keyword"},
	"files_format":     {"type": "keyword"},
	"taxonomy_names":   {"type": "text"},
	"samples.sample_type":      {"type": "keyword"},
	"samples.species":          {"type": "keyword"},
	"samples.taxonomy":         {"type": "keyword"},
	"samples.taxonomy_id":      {"type": "keyword"},
	"samples.taxonomic_lieage": {"type": "keyword"},
	"files.instrument":  {"type": "keyword"},
	"files.file_format": {"type": "keyword"},
	"files.sample":      {"type": "keyword"},
	"files.filename":    {"type": "keyword"},
	"files.type":        {"type": "keyword"},
	"handling_type":   {"type": "keyword"}
    }
  }
}'

	curl -XPOST "http://${URL}/_bulk?pretty" -H "Content-Type: application/json" --data-binary @${INDEX}.data.json
done
