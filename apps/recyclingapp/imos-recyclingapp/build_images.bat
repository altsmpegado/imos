@echo off
cd gui
docker build -f Dockerfile.gui -t recyclingapp-gui .
cd ../model-detector
docker build -f Dockerfile.model-detector -t recyclingapp-model-detector .