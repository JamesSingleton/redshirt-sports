#!/bin/bash
# usage: groq-time.sh <label> <groq> [params as &$k="v"...]
P=8pbt9f8w; D=production; V=v2025-02-19
label=$1; q=$2; extra=$3
for host in api; do
  ms=()
  for i in 1 2 3 4 5 6 7 8 9 10; do
    r=$(curl -sG "https://$P.$host.sanity.io/$V/data/query/$D" --data-urlencode "query=$q" $extra --data-urlencode "perspective=published" --data-urlencode "\$n=\"$RANDOM$i\"")
    ms+=($(echo "$r" | python3 -I -c 'import sys,json;d=json.load(sys.stdin);print(d.get("ms","ERR:"+str(d)[:200]))'))
  done
  echo "$label [$host] ms: ${ms[*]}"
done
