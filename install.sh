#!/bin/bash 

OS_TYPE="ns6.0"
DIR="/opt/openstack"
##start create repo###
rm -rf /var/ftp/openstack-repo >/dev/null 2>&1
mkdir /var/ftp/openstack-repo

if [ -f "$DIR/source/$OS_TYPE/openstack-packages.tar.gz" ];then
    cp $DIR/source/$OS_TYPE/openstack-packages.tar.gz /var/ftp/openstack-repo/
else
    echo "Do not find the openstack-packages.tar.gz"
    exit  1
fi

cd /var/ftp/openstack-repo/
tar xvf openstack-packages.tar.gz openstack-packages

rpm -qa | grep createrepo
if [ $? -ne 0 ];then
    echo "package lose , please install createrepo "
    exit 1
fi

createrepo /var/ftp/openstack-repo/openstack-packages

####

service vsftpd restart
chkconfig vsftpd on

rm -rf /etc/yum.repos.d/*

touch /etc/yum.repos.d/openstack.repo

echo "[openstack]" > /etc/yum.repos.d/openstack.repo

echo "name=openstack" >> /etc/yum.repos.d/openstack.repo

echo "baseurl=ftp://127.0.0.1/openstack-repo/openstack-packages" >> /etc/yum.repos.d/openstack.repo

echo "enabled=1" >> /etc/yum.repos.d/openstack.repo

echo "gpgcheck=0" >> /etc/yum.repos.d/openstack.repo

yum install telnet telnet-server syslinux cobbler puppet-server -y

#if [ ! -r /root/.ssh/id_rsa.pub ]; then  
#    (sleep 2;echo -e "\n")|ssh-keygen  
#fi

if [ -f "/etc/xinetd.d/telnet" ];then
    sed -i "s/disable.*/disable  = no /g" /etc/xinetd.d/telnet  
else
    echo "Error:please install telnet"
    exit 1
fi

rm -rf /etc/xinetd.d/nc_listen
cp $DIR/config/nc_listen /etc/xinetd.d/
rm -rf /etc/xinetd.d/log_listen
cp $DIR/config/log_listen /etc/xinetd.d/
sed -i "/nc_listen/d" /etc/services
echo "nc_listen       3336/tcp                # nc_listen" >> /etc/services
sed -i "/log_listen/d" /etc/services
echo "log_listen       3337/tcp                # log_listen" >> /etc/services

service xinetd start
chkconfig xinetd on
