#! /bin/bash
SOCK_DIR=$1
allUser=""
for file in ${SOCK_DIR}/*.sock; do
    if  [ -S $file ] ; then
        tmp=${file#*@}
        user=${tmp%.*}
        allUser=${allUser}" "$user
    fi
done
echo $allUser