CREATE STREAM DataStream (UniqueId VARCHAR, Temperature double, Gas int) WITH (KAFKA_TOPIC='Data',VALUE_FORMAT='JSON', PARTITIONS='1');

CREATE STREAM FINALDATA WITH (VALUE_FORMAT='AVRO') AS SELECT *, ROWTIME AS send_time FROM DataStream;

CREATE SINK CONNECTOR POSTGRES_CONNECTOR WITH ('connector.class' = 'io.confluent.connect.jdbc.JdbcSinkConnector','connection.url' = 'jdbc:postgresql://postgres:5432/Kafka','connection.user' = 'postgres','connection.password' = 'postgres','topics' = 'FINALDATA','table.name.format' = 'Machine_Data','key.converter' = 'org.apache.kafka.connect.storage.StringConverter','auto.create' = 'true','auto.evolve' = 'true');

show connectors;