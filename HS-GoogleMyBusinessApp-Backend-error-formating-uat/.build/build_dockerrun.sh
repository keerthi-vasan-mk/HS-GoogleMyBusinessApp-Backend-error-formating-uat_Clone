#!/bin/bash
file=".env"
while IFS="=" read key val
do
    # display $line or do somthing with $line
    if [ -n "$val" ]; then
        eval "$key"=$val
    fi
done <"$file"

cat << EOF
{
  "AWSEBDockerrunVersion": 1,
  "Image": {
    "Name": "175302565902.dkr.ecr.ca-central-1.amazonaws.com/hootsuite-gmb-api/codebase:$GITHUB_SHA",
    "Update": "true"
  },
  "Ports": [
    {
      "ContainerPort": 5000,
      "HostPort": 443
    },
    {
      "ContainerPort": 5000,
      "HostPort": 80
    }
  ]
}
EOF


