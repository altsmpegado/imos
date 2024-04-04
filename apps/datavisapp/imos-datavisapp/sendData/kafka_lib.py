#!/usr/bin/env python
# =============================================================================
#
# Helper module
#
# =============================================================================

import argparse


def parse_args():
    """Parse command line arguments"""

    parser = argparse.ArgumentParser(
             description="Confluent Python Client example to produce messages \
                  to Confluent Cloud")
    parser._action_groups.pop()
    required = parser.add_argument_group('required arguments')
    required.add_argument('-f',
                          dest="config_file",
                          help="path to Confluent Cloud configuration file",
                          required=False)
    required.add_argument('-t',
                          dest="topic",
                          help="topic name",
                          required=False)
    required.add_argument('-d',
                          dest="data",
                          help="data json format",
                          required=False)
    args = parser.parse_args()

    return args


def read_config(config_file):
    """Read Confluent Cloud configuration for lbrkafka clients"""

    conf = {}
    with open(config_file) as fh:
        for line in fh:
            line = line.strip()
            if len(line) != 0 and line[0] != "#":
                parameter, value = line.strip().split('=', 1)
                conf[parameter] = value.strip()

    return conf


# def create_topic(conf, topic):
#     """
#         Create a topic if needed
#         Examples of additional admin API functionality:
#         https://github.com/confluentinc/confluent-kafka-python/blob/master/examples/adminapi.py
#     """
#
#     a = AdminClient({
#            'bootstrap.servers': conf['bootstrap.servers'],
#            #'sasl.mechanisms': 'PLAIN',
#            #'security.protocol': 'SASL_SSL',
#            #'sasl.username': conf['sasl.username'],
#            #'sasl.password': conf['sasl.password']
#     })
#     fs = a.create_topics([NewTopic(
#          topic,
#          num_partitions=1,
#          replication_factor=1
#     )])
#     for topic, f in fs.items():
#         try:
#             f.result()  # The result itself is None
#             print("Topic {} created".format(topic))
#         except Exception as e:
#             # Continue if error code TOPIC_ALREADY_EXISTS, which may be true
#             # Otherwise fail fast
#             if e.args[0].code() != KafkaError.TOPIC_ALREADY_EXISTS:
#                 print("Failed to create topic {}: {}".format(topic, e))
#                 sys.exit(1)
