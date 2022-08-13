#! /bin/sh
docker build --network host -t code-server-plus:go-dev -f ci/dev/Dockerfile .
docker run -it -p 8000:8000 -p 8080:8080 code-server-plus:go-dev