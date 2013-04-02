#!/bin/bash

echo "start to configure Server" >> /var/log/OADT/oadtdeploy.log

ISO_FILE=$1

## mount OS Server ##
umount /mnt
mount -o loop $ISO_FILE /mnt
if [ $? -ne 0 ];then
    mount $ISO_FILE /mnt
    if [ $? -ne 0 ];then
        echo "mount error" >>/var/log/OADT/oadtdeploy.log
        exit -1  
    fi
fi


DIR="/opt/openstack"
CONFIG="$DIR/config"
OS_TYPE=`sed -n '/OS_TYPE/p' "$CONFIG"/os_type.conf | awk '{print $2}'`


### create openstack yum repo ###
rm -rf /var/ftp/openstack-repo >/dev/null 2>&1
mkdir /var/ftp/openstack-repo
if [ -f "$DIR/source/$OS_TYPE/openstack-packages.tar.gz" ];then
    cp $DIR/source/$OS_TYPE/openstack-packages.tar.gz /var/ftp/openstack-repo/
else
    echo "Do not find the openstack-packages.tar.gz" >>/var/log/OADT/oadtdeploy.log
    exit  -1
fi
cd /var/ftp/openstack-repo/
tar xvf openstack-packages.tar.gz openstack-packages
createrepo /var/ftp/openstack-repo/openstack-packages
### End ###


### Configure puppet server ###
rm -rf /etc/puppet/*
cp -r $DIR/puppet/* /etc/puppet/
service puppetmaster start
chkconfig puppetmaster on 
### End ###




### Start to configure Cobbler Server ###
service vsftpd restart >>/var/log/OADT/oadtdeploy.log
if [ $? -ne 0 ];then
    echo "ftp start error" >>/var/log/OADT/oadtdeploy.log
    exit -1
fi
service cobblerd restart >>/var/log/OADT/oadtdeploy.log
if [ $? -ne 0 ];then
    echo "cobblerd start error" >>/var/log/OADT/oadtdeploy.log
    echo 
    exit -1
fi
cobbler_server_ip=`ifconfig eth0 | grep "inet addr:" | cut -d: -f2 | awk '{print $1}'`
cobbler_server_name=`hostname`
subnet=`sed -n '/subnet_ip/p' "$CONFIG"/os_deploy.conf | awk '{print $2}'`
subnet_netmask=`sed -n '/subnet_netmask/p' "$CONFIG"/os_deploy.conf | awk '{print $2}'`
range_ip_start=`sed -n '/range_ip_start/p' "$CONFIG"/os_deploy.conf | awk '{print $2}'`
range_ip_stop=`sed -n '/range_ip_stop/p' "$CONFIG"/os_deploy.conf | awk '{print $2}'`
gateway=`sed -n '/gateway_ip/p' "$CONFIG"/os_deploy.conf | awk '{print $2}'`
netmask=`sed -n '/netmask_ip/p' "$CONFIG"/os_deploy.conf | awk '{print $2}'`
dns=`sed -n '/dns_ip/p' "$CONFIG"/os_deploy.conf | awk '{print $2}'`
sed -i "s/SERVER_YUM_IP.*/SERVER_YUM_IP $cobbler_server_ip/g" $DIR/puppet/files/$OS_TYPE/local.conf
sed -i "s/next_server:.*/next_server: $cobbler_server_ip/g" /etc/cobbler/settings
sed -i "s/server:.*/server: $cobbler_server_ip/g" /etc/cobbler/settings
sed -i "s/manage_dhcp:.*/manage_dhcp: 1/g" /etc/cobbler/settings
sed -i "s/pxe_just_once:.*/pxe_just_once: 1/g" /etc/cobbler/settings
sed -i "s/disable.*/disable  = no /g" /etc/xinetd.d/tftp
sed -i "s/disable.*/disable  = no /g" /etc/xinetd.d/rsync
rm -rf /etc/cobbler/dhcp.template
cp $CONFIG/dhcp.template /etc/cobbler/dhcp.template
sed -i "s/subnet.*netmask.*{/subnet $subnet netmask $subnet_netmask {/g" /etc/cobbler/dhcp.template
sed -i "s/option routers.*/option routers    $gateway;/g" /etc/cobbler/dhcp.template
sed -i "s/option domain-name-servers.*/option domain-name-servers    $dns;/g" /etc/cobbler/dhcp.template
sed -i "s/option subnet-mask.*/option subnet-mask    $netmask;/g" /etc/cobbler/dhcp.template
sed -i "s/range dynamic-bootp.*/range dynamic-bootp    $range_ip_start $range_ip_stop;/g" /etc/cobbler/dhcp.template
cobbler sync >> /var/log/OADT/oadtdeploy.log
if [ $? -ne 0 ];then
    echo "cobbler sync error." >>/var/log/OADT/oadtdeploy.log
    exit -1
fi
### End ###

mount | grep "/mnt" >>/var/log/OADT/oadtdeploy.log
if [ $? -ne 0 ];then
    echo "please mount your ISO or CD to /mnt" >>/var/log/OADT/oadtdeploy.log
    exit -1
fi

### create distro ###
cobbler distro remove --name=openstack_"$OS_TYPE"-x86_64 >/dev/null 2>&1
rm -rf  /var/www/cobbler/ks_mirror/openstack_rhel-x86_64/ >/dev/null 2>&1
cobbler import --path=/mnt --name=openstack_"$OS_TYPE" --arch=x86_64 >>/var/log/OADT/oadtdeploy.log 2>&1
if [ $? -ne 0 ];then
    echo "create distro error" >>/var/log/OADT/oadtdeploy.log
    exit -1
fi

### configure kickstart file ###
ks="ks.cfg"
\cp -rf $CONFIG/$ks /var/www/
sed -i "s/ftp:\/\/192\.168\.1\.1\/pub/http:\/\/$cobbler_server_ip:7112\/cobbler\/ks_mirror\/openstack_"$OS_TYPE"-x86_64/g" /var/www/$ks
sed -i "s/(@_@)/$cobbler_server_name/g" /var/www/$ks
sed -i "s/(@-@)/$cobbler_server_ip/g" /var/www/$ks

### create profile ###
cobbler profile edit --name=openstack_"$OS_TYPE"-x86_64 --distro=openstack_"$OS_TYPE"-x86_64 --kickstart=/var/www/$ks >> /var/log/OADT/oadtdeploy.log 2>&1
if [ $? -ne 0 ];then
    echo "create profile error" >>/var/log/OADT/oadtdeploy.log
    exit -1
fi

sed -i "/$cobbler_server_ip/d" /etc/hosts
sed -i "/$cobbler_server_name/d" /etc/hosts
echo "$cobbler_server_ip  $cobbler_server_name" >> /etc/hosts
echo "127.0.0.1 localhost" >> /etc/hosts


service cobblerd restart >>/var/log/OADT/oadtdeploy.log
if [ $? -ne 0 ]
then
    echo "cobbler start error , please check it" >>/var/log/OADT/oadtdeploy.log
    exit -1
fi

service xinetd restart >>/var/log/OADT/oadtdeploy.log
cobbler sync >> cobbler.log 2>&1
if [ $? -ne 0 ];then
    echo "cobbler sync error." >>/var/log/OADT/oadtdeploy.log
    exit -1
fi

service ntpd start >>/var/log/OADT/oadtdeploy.log
chkconfig ntpd on

echo "server configure successfully" >>/var/log/OADT/oadtdeploy.log

echo "1" > $CONFIG/deploy_result.conf
