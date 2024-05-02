@echo off
cd gui
docker build -f Dockerfile.gui -t ppeapp-gui .
cd ../model-detector
docker build -f Dockerfile.model-detector -t ppeapp-model-detector .