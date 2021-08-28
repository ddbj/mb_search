#!/bin/sh

usage_exit() {
	echo "Usage: $0 [-r Path to DocumentRoot] [-o OWNER] [-g GROUP]" 1>&2
	exit 1
}

DOCUMENT_ROOT=/var/www/html
OWNER=apache
GROUP=apache
while getopts r:o:g:h OPT
do
	case $OPT in
		r) DOCUMENT_ROOT=$OPTARG
		   ;;
		o) OWNER=$OPTARG
		   ;;
		g) GROUP=$OPTARG
		   ;;
		h) usage_exit
		   ;;
		\?) usage_exit
		   ;;
	esac
done

echo "Place the data to \"${DOCUMENT_ROOT}/mb/\"."
echo "Owner is \"${OWNER}:${GROUP}\"."

cd react_app
cp ../download/* build/
mkdir -p build/download
mkdir -p build/tmp
chown -R ${OWNER}:${GROUP} build/
cp -aR build/ ${DOCUMENT_ROOT}/mb/
