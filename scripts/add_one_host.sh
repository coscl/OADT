#!/bin/bash

ip_addr=$1
mac_addr=$2
hostname=$3

echo "start to add host $hostname" >>/var/log/OADT/oadtdeploy.log

DIR="/opt/openstack"
CONFIG="$DIR/config"
OS_TYPE=`sed -n '/OS_TYPE/p' "$CONFIG"/os_type.conf | awk '{print $2}'`

cobbler_server_ip=`ifconfig eth0 | grep "inet addr:" | cut -d: -f2 | awk '{print $1}'`
cobbler_server_name=`hostname`

gateway=`sed -n '/gateway_ip/p' "$CONFIG"/os_deploy.conf | awk '{print $2}'`
netmask=`sed -n '/netmask_ip/p' "$CONFIG"/os_deploy.conf | awk '{print $2}'`
dns=`sed -n '/dns_ip/p' "$CONFIG"/os_deploy.conf | awk '{print $2}'`

sed -i "/$ip_addr/d" /etc/hosts
sed -i "/$hostname/d" /etc/hosts
echo "$ip_addr  $hostname" >> /etc/hosts

rm -rf /var/www/$mac_addr > /dev/null 2>&1
mkdir /var/www/$mac_addr
cp /var/www/ks.cfg /var/www/$mac_addr/ks.cfg
sed -i "s/DEVICE=.*/DEVICE=eth0/g" /var/www/$mac_addr/ks.cfg
sed -i "s/IPADDR=.*/IPADDR=$ip_addr/g" /var/www/$mac_addr/ks.cfg
sed -i "s/NETMASK=.*/NETMASK=$netmask/g" /var/www/$mac_addr/ks.cfg
sed -i "s/GATEWAY=.*/GATEWAY=$gateway/g" /var/www/$mac_addr/ks.cfg
sed -i "s/DNS1=.*/DNS1=$dns/g" /var/www/$mac_addr/ks.cfg
sed -i "s/127\.0\.0\.1/$cobbler_server_ip/g" /var/www/$mac_addr/ks.cfg
sed -i "s/myip/$ip_addr/g" /var/www/$mac_addr/ks.cfg
sed -i "s/myhostname/$hostname/g" /var/www/$mac_addr/ks.cfg
echo "\$SNIPPET('kickstart_done')" >> /var/www/$mac_addr/ks.cfg
cobbler system remove --name=$mac_addr > /dev/null 2>&1
cobbler system add --name=$mac_addr --profile=openstack_"$OS_TYPE"-x86_64 --mac=$mac_addr --static=yes --ip-address=$ip_addr --kickstart=/var/www/$mac_addr/ks.cfg --hostname=$hostname --netboot-enabled=true


cobbler sync

mkdir -p /etc/puppet/files/$OS_TYPE/$hostname
rm -rf /etc/puppet/files/$OS_TYPE/$hostname/*
cp /etc/puppet/files/$OS_TYPE/local.conf /etc/puppet/files/$OS_TYPE/$hostname/
sed -i "s/SERVER_YUM_IP.*/SERVER_YUM_IP $cobbler_server_ip/g" /etc/puppet/files/$OS_TYPE/$hostname/local.conf


touch /var/log/OADT/nodes/"$hostname".log

echo "add host $hostname end" >>/var/log/OADT/oadtdeploy.log
