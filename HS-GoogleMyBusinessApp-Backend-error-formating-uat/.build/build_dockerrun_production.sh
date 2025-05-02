#!/bin/bash
file=".env"
GIT_BRANCH=`git rev-parse --abbrev-ref HEAD`
while IFS="=" read key val
do
    # display $line or do somthing with $line
    if [ -n "$val" ]; then
        eval "$key"=$val
    fi
done <"$file"

if [[ "$GIT_BRANCH" = "master" ]]
then
  MEM_APP=$MEM_APP_PROD
else
  MEM_APP=$MEM_APP_DEV
fi

cat << EOF
{
  "AWSEBDockerrunVersion": 1,
  "Image": {
    "Name": "336014837852.dkr.ecr.ca-central-1.amazonaws.com/google-my-business-api:production",
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


