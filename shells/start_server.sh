#! /bin/bash
USER=$1
SOCK_DIR=$2
SOCK_FILE=${SOCK_DIR}/code-server@${USER}.sock
chmod -R a+w /tmp
chmod -R a+w ${SOCK_DIR}
if  [ -f ${SOCK_FILE} ] ; then
    rm ${SOCK_FILE}
fi
if  [ -S ${SOCK_FILE} ] ; then
    echo "err: socket file exist!"
else
    su ${USER} --command "code-server --auth none --socket ${SOCK_FILE} ${HOME}"&
fi