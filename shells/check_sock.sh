#! /bin/bash
SocketPath=$1
if  [ -S $SocketPath ] ; then
    echo true
fi