#!/usr/bin/env python
# =============================================================================
#
# Produce messages to Kafka
# Using Confluent Python Client for Apache Kafka
#
# =============================================================================

#ADAPTADO PARA ENVIAR UM FICHEIRO JSON PELO KAFKA, TESTADO E FUNCIONA
from producer_lib import ProducerEntity as Producer
from uuid import uuid4
import json
import kafka_lib
import time 

if __name__ == '__main__':

    # Read arguments and configurations and initialize
    #time.sleep(60)
    args = kafka_lib.parse_args()
    config_file = args.config_file
    topic = args.topic
    conf = kafka_lib.read_config(config_file)

    # Create Producer instance
    producer = Producer(conf)

    #Producing Sample Messages
   # # with open(args.data) as f:
    # product = json.load(open(args.data))
     # #   for i in product:
    # producer.produce(topic, str(uuid4()), product)

    with open(args.data) as f:
        product= json.load(open(args.data))
        for i in product:
            print(i)
            producer.produce(topic, str(uuid4()), i)
            time.sleep(1)
            
    while True:
        time.sleep(1)