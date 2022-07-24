#! /bin/bash
USER=$1
SOCK_FILE=${SOCK_DIR}/code-server@${USER}.sock
if  [ -f ${SOCK_FILE} ] ; then
    rm ${SOCK_FILE}
fi
if  [ -S ${SOCK_FILE} ] ; then
    echo "err: socket file exist!"
else
    su ${USER} --command "code-server --auth none --socket ${SOCK_FILE} ${WORKDIR}"&
fi
