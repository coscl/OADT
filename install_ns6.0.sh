#!/bin/bash 

DIR="/opt/openstack"

##start create repo###
rm -rf /var/ftp/server >/dev/null 2>&1
mkdir /var/ftp/server
if [ -f "$DIR/source/ns6.0/server.tar.gz" ];then
    cp "$DIR/source/ns6.0/server.tar.gz" /var/ftp/server/
else
    echo "Do not find the server.tar.gz"
    exit  1
fi
cd /var/ftp/server/
tar xvf server.tar.gz server
rpm -qa | grep createrepo
if [ $? -ne 0 ];then
    echo "package lose , please install createrepo "
    exit 1
fi
createrepo /var/ftp/server/server
service vsftpd restart
chkconfig vsftpd on
rm -rf /etc/yum.repos.d/*
touch /etc/yum.repos.d/server.repo
echo "[server]" > /etc/yum.repos.d/server.repo
echo "name=server" >> /etc/yum.repos.d/server.repo
echo "baseurl=ftp://127.0.0.1/server/server" >> /etc/yum.repos.d/server.repo
echo "enabled=1" >> /etc/yum.repos.d/server.repo
echo "gpgcheck=0" >> /etc/yum.repos.d/server.repo

#### End ###############


#### Install Packages ###
yum install telnet telnet-server syslinux cobbler puppet-server Django14 python-celery django-celery rabbitmq-server python-amqplib django-picklefield -y


#### Configure Xinetd
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
### End ###

### Configure Django ###
mkdir -p /var/log/OADT
mkdir -p /var/log/OADT/nodes
python $DIR/httpd/oadt/manage.py syncdb
hostname=`hostname`
#sed -i "/$hostname/d" /etc/hosts
#echo "127.0.0.1 $hostname" >> /etc/hosts
service rabbitmq-server start
chkconfig rabbitmq-server on
cp -rf $DIR/httpd/celery/celeryd /etc/init.d/
cp -rf $DIR/httpd/celery/celeryd.sysconfig2 /etc/sysconfig/celeryd
service celeryd start
echo "service celeryd start" >> /etc/rc.local
python $DIR/httpd/oadt/manage.py runserver 0.0.0.0:8000 &
echo "python $DIR/httpd/oadt/manage.py runserver 0.0.0.0:8000 &" >> /etc/rc.local
### End ###


##check cobbler puppet has been installed##
rpm -qa | grep cobbler
if [ $? -ne 0 ];then
    echo "Please install cobbler.......,run install.sh"
    exit -1
fi
rpm -qa | grep puppet-server
if [ $? -ne 0 ];then
    echo "Please install puppet-server.......,run install.sh" 
    exit -1
fi
rpm -qa | grep facter
if [ $? -ne 0 ];then
    echo "Please install facter.......,run install.sh"
    exit -1
fi
rpm -qa | grep vsftpd
if [ $? -eq 0 ]
then
    echo 
    echo "ftp server has been install successfully, continue"
    echo
else
    echo
    echo "ftp server has not been installed"
    echo 
    exit -1
fi
### End ###

### Configure httpd for cobbler###
sed -i "s/^Listen.*/Listen 7112/g" /etc/httpd/conf/httpd.conf
sed -i "s/http_port:.*/http_port: 7112/g" /etc/cobbler/settings
service iptables stop >/dev/null 2>&1
setenforce 0 >/dev/null 2>&1
service cobblerd restart
chkconfig httpd on
service httpd restart
if [ $? -ne 0 ];then
        echo
        echo "httpd start error" >>/var/log/OADT/oadtdeploy.log
        echo 
        exit -1
fi


