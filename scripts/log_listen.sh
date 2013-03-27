#!/bin/bash

info=`nc -l 9999`
OLD_IFS="$IFS"
IFS=":"
arr=($info)
IFS=$OLD_IFS
host_name=${arr[0]}
log=${arr[1]}
echo $log >> /var/log/OADT/nodes/${host_name}.log
