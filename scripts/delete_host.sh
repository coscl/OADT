#!/bin/bash

hostname=$1
mac=$2

cobbler system remove --name="$mac"

sed -i '/$hostname/,+10d' /etc/puppet/manifests/nodes.pp

puppetca clean $hostname

rm -rf /var/log/OADT/nodes/"$hostname".log

sed -i "/$hostname/d" /etc/hosts
