#!/bin/bash
cd imos-datavisapp
docker build -f Dockerfile.zookeeper -t datavisapp-zookeeper .
docker build -f Dockerfile.broker -t datavisapp-broker .
docker build -f Dockerfile.schema-registry -t datavisapp-schema-registry .
docker build -f Dockerfile.connect -t datavisapp-connect .
docker build -f Dockerfile.control-center -t datavisapp-control-center .
docker build -f Dockerfile.kafka-connect -t datavisapp-kafka-connect .
docker build -f Dockerfile.ksqldb-server -t datavisapp-ksqldb-server .
docker build -f Dockerfile.ksqldb-cli -t datavisapp-ksqldb-cli .
docker build -f Dockerfile.rest-proxy -t datavisapp-rest-proxy .
docker build -f Dockerfile.postgres -t datavisapp-postgres .
docker build -f Dockerfile.grafana -t datavisapp-grafana .