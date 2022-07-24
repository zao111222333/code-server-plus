#! /bin/bash
USER=$1

su ${USER} --command "code-server --auth none --socket ${SOCK_DIR}/code-server@${USER}.sock ${WORKDIR}"&
