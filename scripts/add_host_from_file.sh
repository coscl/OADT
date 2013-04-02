#!/bin/bash
echo "Start to add hosts" >>/var/log/OADT/oadtdeploy.log

file_path=$1

DIR="/opt/openstack"
CONFIG="$DIR/config"
OS_TYPE=`sed -n '/OS_TYPE/p' "$CONFIG"/os_type.conf | awk '{print $2}'`

cobbler_server_ip=`ifconfig eth0 | grep "inet addr:" | cut -d: -f2 | awk '{print $1}'`
cobbler_server_name=`hostname`

gateway=`sed -n '/gateway_ip/p' "$CONFIG"/os_deploy.conf | awk '{print $2}'`
netmask=`sed -n '/netmask_ip/p' "$CONFIG"/os_deploy.conf | awk '{print $2}'`
dns=`sed -n '/dns_ip/p' "$CONFIG"/os_deploy.conf | awk '{print $2}'`



if [ ! -f $file_path ];then
    echo "file does not exist,so exit"
    exit -1
fi

while read line
do
    if [ "$line" == "" ];then
        continue
    fi
    if [ "${line:0:1}" == "#" ];then
        continue
    fi
    ip_addr=`echo $line|awk '{print $1}'`
    mac_addr=`echo $line|awk '{print $2}'`
    hostname=`echo $line|awk '{print $3}'`
    if [ "$mac_addr" == "" ] || [ "$ip_addr" == "" ] || [ "$hostname" == "" ];then
        echo "you must fill in host.template in right format, now exit"
        exit
    fi
    
    sqlite3 /opt/openstack/httpd/oadt/hosts.db 'insert into hosts_host values ("'$hostname'","'$ip_addr'",CURRENT_TIMESTAMP,"added","'$mac_addr'")';

    if [ $? -ne 0 ];then
        continue
    fi

    sed -i "/$ip_addr/d" /etc/hosts
    sed -i "/$hostname/d" /etc/hosts
    echo "$ip_addr  $hostname" >> /etc/hosts


    rm -rf /var/www/$mac_addr > /dev/null 2>&1
    mkdir /var/www/$mac_addr
    cp /var/www/$ks /var/www/$mac_addr/ks.cfg
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
    cobbler system add --name=$mac_addr --profile=openstack_rhel-x86_64 --mac=$mac_addr --static=yes --ip-address=$ip_addr --kickstart=/var/www/$mac_addr/ks.cfg --hostname=$hostname --netboot-enabled=true

    mkdir -p /etc/puppet/files/$OS_TYPE/$hostname
    rm -rf /etc/puppet/files/$OS_TYPE/$hostname/*
    cp /etc/puppet/files/$OS_TYPE/local.conf /etc/puppet/files/$OS_TYPE/$hostname/

    touch /var/log/OADT/"$hostname".log

done  < $DIR/upload/hosts/host.template


cobbler sync >> /var/log/OADT/oadtdeploy.log

echo "add hosts  end" >>/var/log/OADT/oadtdeploy.log
