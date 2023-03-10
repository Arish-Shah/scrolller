#!/usr/bin/env bash

dir="$(dirname $0)"

if [[ $1 = "start" ]]
then
  microk8s kubectl apply -f $dir/scrolller-api-configmap.yaml
  microk8s kubectl apply -f $dir/scrolller-api-secret.yaml
  microk8s kubectl apply -f $dir/scrolller-api-deployment.yaml
  microk8s kubectl apply -f $dir/scrolller-api-service.yaml
elif [[ $1 = "stop" ]]
then
  microk8s kubectl delete service scrolller-api-service -n scrolller
  microk8s kubectl delete deployment scrolller-api-deployment -n scrolller
  microk8s kubectl delete secret scrolller-api-secret -n scrolller
  microk8s kubectl delete configmaps scrolller-api-config -n scrolller
else
  echo "usage: ./kube.sh start/stop"
fi
