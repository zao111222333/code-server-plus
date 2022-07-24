#! /bin/bash

for file in ${SOCK_DIR}/*.sock; do
    if  [ -S $file ] ; then
        tmp=${file#*@}
        user=${tmp%.*}
        echo $user
    fi
done