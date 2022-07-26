#! /bin/bash
NEWUSER=$1
PASSWORD=$2
SU=$3
CODE_GROUP=$4

useradd -Nm -g ${CODE_GROUP} ${NEWUSER}
echo "${NEWUSER}:${PASSWORD}" | chpasswd
if [ ${SU} = true ]
then
    echo "${NEWUSER} ALL=(ALL) NOPASSWD: NOPASSWD: ALL">>/etc/sudoers
    usermod -G sudo ${NEWUSER}
fi
echo 'done'
