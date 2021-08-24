#!/bin/sh

. ./mb-project.sh

curl -XPUT "http://${URL}/${INDEX}/?pretty" -H 'Content-Type: application/json' -d'
{
  "mappings": {
    "properties": {
	"project":          {"type": "keyword"},
	"project_id":       {"type": "keyword"},
	"project_label":    {"type": "text"},
	"instruments":      {"type": "keyword"},
	"files_format":     {"type": "keyword"},
	"files":            {"type": "keyword"},
	"description":      {"type": "text"},
	"taxonomy_names":   {"type": "text"},
	"samples.sample_type":      {"type": "keyword"},
	"samples.species":          {"type": "keyword"},
	"samples.taxonomy":         {"type": "keyword"},
	"samples.taxonomy_id":      {"type": "keyword"},
	"samples.taxonomic_lieage": {"type": "keyword"}
    }
  }
}'

