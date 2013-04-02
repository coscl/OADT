#!/bin/bash

ip_addr=$1
hostname=$2

echo "start add puppet host $hostname" >>/var/log/OADT/oadtdeploy.log

DIR="/opt/openstack"
CONFIG="$DIR/config"
OS_TYPE=`sed -n '/OS_TYPE/p' "$CONFIG"/os_type.conf | awk '{print $2}'`

sed -i "s/MY_HOST_IP.*/MY_HOST_IP $ip_addr/g" /etc/puppet/files/$OS_TYPE/$hostname/local.conf
sed -i "s/MY_HOST_NAME.*/MY_HOST_NAME $hostname/g" /etc/puppet/files/$OS_TYPE/$hostname/local.conf

keystone_cc_ip=`sed -n '/keystone_cc_ip/p' "$CONFIG"/openstack_deploy.conf | awk '{print $2}'`
glance_cc_ip=`sed -n '/glance_cc_ip/p' "$CONFIG"/openstack_deploy.conf | awk '{print $2}'`
nova_cc_ip=`sed -n '/nova_cc_ip/p' "$CONFIG"/openstack_deploy.conf | awk '{print $2}'`

sed -i "s/KEYSTONE_HOST_IP.*/KEYSTONE_HOST_IP $keystone_cc_ip/g" /etc/puppet/files/$OS_TYPE/$hostname/local.conf
sed -i "s/GLANCE_HOST_IP.*/GLANCE_HOST_IP $glance_cc_ip/g" /etc/puppet/files/$OS_TYPE/$hostname/local.conf
sed -i "s/NOVA_HOST_IP.*/NOVA_HOST_IP $nova_cc_ip/g" /etc/puppet/files/$OS_TYPE/$hostname/local.conf

sed -i "/$hostname/,+10d" /etc/puppet/manifests/nodes.pp
echo "
node '$hostname' {
  file{ \"/opt/openstack/local.conf\":
                ensure => present,
                alias => \"local.conf\",
                source => \"puppet:///files/$OS_TYPE/$hostname/local.conf\",
                owner => root,
                group => root,
                mode => 644;
  }
  include deploy
}
" >> /etc/puppet/manifests/nodes.pp

echo "add puppet host $hostname end" >>/var/log/OADT/oadtdeploy.log
