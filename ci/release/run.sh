docker create -ti --name dummy IMAGE_NAME bash
docker cp dummy:/path/to/file /dest/to/file
docker rm -f dummy