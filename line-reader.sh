#!/bin/bash

file="./fixtures/alexa-top-1m.csv"
# delimeter = ","


linenumber=0
max=300
while IFS= read line
do
  domain=${line#*,}
  echo $domain $linenumber
  linenumber=$((linenumber+1))
  if [ "$linenumber" -lt "$max" ]
  then
    echo https://categorify.org/api?website=$domain
    curl -s https://categorify.org/api/?website=$domain >> result.ndjson
    echo "" >> result.ndjson
    echo $linenumber
  fi
  sleep 0.01
done <"$file"
