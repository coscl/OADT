#!/bin/bash

info=`nc -l 6666`
OLD_IFS="$IFS"
IFS=":"
arr=($info)
IFS="$OLD_IFS"
#static_ip=${arr[0]}
#dhcp_ip=${arr[1]}
host_name=${arr[0]}
state=${arr[1]}

#echo -e "$static_ip\t$host_name.sh.intel.com" >> /etc/hosts

sqlite3 /opt/openstack/httpd/oadt/hosts.db 'update hosts_host set status="'$state'" where hostname = "'$host_name'"';
