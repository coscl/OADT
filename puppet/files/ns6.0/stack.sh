#!/usr/bin/env bash
echo "############################################################"
echo "start install and configure openstack"
echo "############################################################"

DEPLOY_DIR="/opt/openstack"

NODE_TYPE=`sed -n '/NODE_TYPE/p' $DEPLOY_DIR/local.conf | awk '{print $2}'`
NODE_ROLE=`sed -n '/NODE_ROLE/p' $DEPLOY_DIR/local.conf | awk '{print $2}'`
ROOT_MYSQL_PASSWORD=`sed -n '/ROOT_MYSQL_PASSWORD/p' $DEPLOY_DIR/local.conf | awk '{print $2}'`


###GET NETWORK CONFIGURATION####################
SERVER_YUM_IP=`sed -n '/SERVER_YUM_IP/p' $DEPLOY_DIR/local.conf | awk '{print $2}'`
MY_HOST_IP=`sed -n '/MY_HOST_IP/p' $DEPLOY_DIR/local.conf | awk '{print $2}'`
MY_HOST_NAME=`sed -n '/MY_HOST_NAME/p' $DEPLOY_DIR/local.conf | awk '{print $2}'`
NETWORK_MANAGER="nova.network.manager.FlatDHCPManager"
PUBLIC_INTERFACE=`sed -n '/PUBLIC_INTERFACE/p' $DEPLOY_DIR/local.conf | awk '{print $2}'`
FLAT_INTERFACE=`sed -n '/FLAT_INTERFACE/p' $DEPLOY_DIR/local.conf | awk '{print $2}'`
FLAT_NETWORK_BRIDGE=`sed -n '/FLAT_NETWORK_BRIDGE/p' $DEPLOY_DIR/local.conf | awk '{print $2}'`
FIXED_RANGE=`sed -n '/FIXED_RANGE/p' $DEPLOY_DIR/local.conf | awk '{print $2}'`
LIBVIRT_TYPE=`sed -n '/LIBVIRT_TYPE/p' $DEPLOY_DIR/local.conf | awk '{print $2}'`

KEYSTONE_HOST_IP=`sed -n '/KEYSTONE_HOST_IP/p' $DEPLOY_DIR/local.conf | awk '{print $2}'`
GLANCE_HOST_IP=`sed -n '/GLANCE_HOST_IP/p' $DEPLOY_DIR/local.conf | awk '{print $2}'`
NOVA_HOST_IP=`sed -n '/NOVA_HOST_IP/p' $DEPLOY_DIR/local.conf | awk '{print $2}'`


nc_message()
{
    message=$1
    telnet $SERVER_YUM_IP 3336 &
    sleep 2
    echo "$MY_HOST_NAME:$message" | nc $SERVER_YUM_IP 6666
}

nc_log()
{
    message=$1
    telnet $SERVER_YUM_IP 3337 &
    sleep 2
    echo "$MY_HOST_NAME:$message" | nc $SERVER_YUM_IP 9999
}

create_yum_rep()
{
    touch /etc/yum.repos.d/openstack.repo
    echo "[openstack]" > /etc/yum.repos.d/openstack.repo
    echo "name=openstack" >> /etc/yum.repos.d/openstack.repo
    echo "baseurl=ftp://$1/openstack-repo/openstack-packages" >> /etc/yum.repos.d/openstack.repo
    echo "enabled=1" >> /etc/yum.repos.d/openstack.repo
    echo "gpgcheck=0" >> /etc/yum.repos.d/openstack.repo
}

service iptables stop
chkconfig iptables off

nc_message "deploying"

nc_log "Start to deploy!" 

create_yum_rep $SERVER_YUM_IP

wget ftp://$SERVER_YUM_IP/openstack-repo/openstack-packages/parted-2.1-18.el6.x86_64.rpm
#wget ftp://$SERVER_YUM_IP/openstack-repo/openstack-packages/qpid-cpp-client-0.14-16.el6.x86_64.rpm

rpm -ivh parted-2.1-18.el6.x86_64.rpm --force
rm -rf parted-2.1-18.el6.x86_64.rpm
#rpm -ivh qpid-cpp-client-0.14-16.el6.x86_64.rpm --force

yum update libvirt -y
yum update qemu-kvm -y


if [ "$NODE_TYPE" == "cc" ];then

    chkconfig --level 2345 mysqld on
    service mysqld start
    mysqladmin -u root password "$ROOT_MYSQL_PASSWORD"


    if [ $MY_HOST_IP == $NOVA_HOST_IP ];then

        echo "install ntp" >> /tmp/tmp.txt
        yum install -y ntp
        service ntpd start
        chkconfig ntpd on

    fi

    yum install openstack-utils openstack-keystone python-keystoneclient -y

#     yum install mysql mysql-server MySQL-python -y
    nc_log "Start to configure keystone"

    if [ $MY_HOST_IP == $KEYSTONE_HOST_IP ];then

        mysql -uroot -p$ROOT_MYSQL_PASSWORD <<EOF
            CREATE DATABASE keystone;
            GRANT ALL ON keystone.* TO 'keystone'@'%' IDENTIFIED BY 'keystone';
            GRANT ALL ON keystone.* TO 'keystone'@'$MY_HOST_NAME' IDENTIFIED BY 'keystone';
EOF

        ADMIN_TOKEN=$(openssl rand -hex 10)

        openstack-config --set /etc/keystone/keystone.conf DEFAULT admin_token $ADMIN_TOKEN

        sed -i "s/@localhost/@$MY_HOST_IP/g" /etc/keystone/keystone.conf

        service openstack-keystone start &&  chkconfig openstack-keystone on

        keystone-manage db_sync

        yum install PyYAML -y

#    cd $DEPLOY_DIR/keystone-init

        #sed -i.bak "s/192.168.206.130/$MY_HOST_IP/g" $DEPLOY_DIR/config.yaml
        sed -i.bak "s/192.168.206.130:8774/$NOVA_HOST_IP:8774/g" $DEPLOY_DIR/config.yaml
        sed -i.bak "s/192.168.206.130:8776/$NOVA_HOST_IP:8776/g" $DEPLOY_DIR/config.yaml
        sed -i.bak "s/192.168.206.130:8773/$NOVA_HOST_IP:8773/g" $DEPLOY_DIR/config.yaml
        sed -i.bak "s/192.168.206.130:8888/$NOVA_HOST_IP:8888/g" $DEPLOY_DIR/config.yaml

        sed -i.bak "s/192.168.206.130:5000/$KEYSTONE_HOST_IP:5000/g" $DEPLOY_DIR/config.yaml
        sed -i.bak "s/192.168.206.130:35357/$KEYSTONE_HOST_IP:35357/g" $DEPLOY_DIR/config.yaml

        sed -i.bak "s/192.168.206.130:9292/$GLANCE_HOST_IP:9292/g" $DEPLOY_DIR/config.yaml

        sed -i.bak "s/token:.*/token:    $ADMIN_TOKEN/g" $DEPLOY_DIR/config.yaml

        python $DEPLOY_DIR/keystone-init.py $DEPLOY_DIR/config.yaml

        if [ $? -ne 0 ];then
            nc_log "Configure keystone error!"
            exit -1
        else
            nc_log "Configure keystone successfully!"
        fi
    fi


    if [ $MY_HOST_IP == $GLANCE_HOST_IP ];then
        nc_log "start install and configure glance"        

        ADMIN_TENANT_NAME="service"
        ADMIN_USER_GLANCE="glance"
        ADMIN_PASSWORD_GLANCE="glance"

        yum install openstack-glance -y
    
        mysql -uroot -p$ROOT_MYSQL_PASSWORD <<EOF
            CREATE DATABASE glance;
            GRANT ALL ON glance.* TO 'glance'@'%' IDENTIFIED BY 'glance';
            GRANT ALL ON glance.* TO 'glance'@'$MY_HOST_NAME' IDENTIFIED BY 'glance';
EOF
#     openstack-config --set /etc/glance/glance-api.conf paste_deploy flavor keystone
#     openstack-config --set /etc/glance/glance-api-paste.ini filter:authtoken admin_token $ADMIN_TOKEN
#     openstack-config --set /etc/glance/glance-registry.conf paste_deploy flavor keystone
#     openstack-config --set /etc/glance/glance-registry-paste.ini filter:authtoken admin_token $ADMIN_TOKEN

        sed -i "s/#enable_v1_api = True/enable_v1_api = True/g" /etc/glance/glance-api.conf
        sed -i "s/#enable_v2_api = True/enable_v2_api = True/g" /etc/glance/glance-api.conf
        sed -i "s/#flavor=/flavor=keystone/g" /etc/glance/glance-api.conf
        sed -i "s/admin_tenant_name.*/admin_tenant_name = $ADMIN_TENANT_NAME/g" /etc/glance/glance-api.conf
        sed -i "s/admin_user.*/admin_user = $ADMIN_USER_GLANCE/g" /etc/glance/glance-api.conf
        sed -i "s/admin_password.*/admin_password = $ADMIN_PASSWORD_GLANCE/g" /etc/glance/glance-api.conf
        sed -i "s/@localhost/@$GLANCE_HOST_IP/g" /etc/glance/glance-api.conf
        sed -i "s/auth_host.*/auth_host = $KEYSTONE_HOST_IP/g" /etc/glance/glance-api.conf
        sed -i "s/qpid_host.*/qpid_host = $NOVA_HOST_IP/g" /etc/glance/glance-api.conf       

        echo "admin_tenant_name = $ADMIN_TENANT_NAME" >> /etc/glance/glance-api-paste.ini
        echo "admin_user = $ADMIN_USER_GLANCE" >> /etc/glance/glance-api-paste.ini
        echo "admin_password = $ADMIN_PASSWORD_GLANCE" >> /etc/glance/glance-api-paste.ini    

     #sed -i "s/admin_tenant_name.*/admin_tenant_name = $ADMIN_TENANT_NAME/g" /etc/glance/glance-api-paste.ini
     #sed -i "s/admin_user.*/admin_user = $ADMIN_USER_GLANCE/g" /etc/glance/glance-api-paste.ini
     #sed -i "s/admin_password.*/admin_password = $ADMIN_PASSWORD_GLANCE/g" /etc/glance/glance-api-paste.ini

        sed -i "s/auth_host.*/auth_host = $KEYSTONE_HOST_IP/g" /etc/glance/glance-registry.conf
        sed -i "s/admin_tenant_name.*/admin_tenant_name = $ADMIN_TENANT_NAME/g" /etc/glance/glance-registry.conf
        sed -i "s/admin_user.*/admin_user = $ADMIN_USER_GLANCE/g" /etc/glance/glance-registry.conf
        sed -i "s/admin_password.*/admin_password = $ADMIN_PASSWORD_GLANCE/g" /etc/glance/glance-registry.conf
        sed -i "s/#flavor=/flavor=keystone/g" /etc/glance/glance-registry.conf                                                            

    # sed -i "s/pipeline = context registryapp.*/pipeline = authtoken auth-context context registryapp/g" /etc/glance/glance-registry-paste.ini

        sed -i "s/@localhost/@$GLANCE_HOST_IP/g" /etc/glance/glance-registry.conf

        glance-manage db_sync
        #service openstack-glance-registry start
        #service openstack-glance-registry status
        #if [ $? -ne 0 ];then
        glance-registry --config-file /etc/glance/glance-registry.conf --debug --verbose & 
        echo " glance-registry --config-file /etc/glance/glance-registry.conf --debug --verbose &" >> /etc/rc.local 
        #fi
        service openstack-glance-api start
        #chkconfig openstack-glance-registry on
        chkconfig openstack-glance-api on
        service openstack-glance-api status
        if [ $? -ne 0 ];then
            nc_log "Configure glance error!"
            exit -1
        else
            nc_log "Configure glance successfully!"
        fi

    fi

    if [ $MY_HOST_IP == $NOVA_HOST_IP ];then
        nc_log "start install and configure nova"
        wget ftp://$SERVER_YUM_IP/openstack-repo/openstack-packages/qpid-cpp-client-0.14-16.el6.x86_64.rpm
        rpm -ivh qpid-cpp-client-0.14-16.el6.x86_64.rpm --force
        rm -rf qpid-cpp-client-0.14-16.el6.x86_64.rpm
        ip link set eth0 promisc on
        touch /etc/sysconfig/network-scripts/ifcfg-br100

        echo "DEVICE=br100" > /etc/sysconfig/network-scripts/ifcfg-br100
        echo "TYPE=Bridge" >> /etc/sysconfig/network-scripts/ifcfg-br100
        echo "ONBOOT=yes" >> /etc/sysconfig/network-scripts/ifcfg-br100
        echo "DELAY=0" >> /etc/sysconfig/network-scripts/ifcfg-br100
        echo "BOOTPROTO=static" >> /etc/sysconfig/network-scripts/ifcfg-br100
        echo "IPADDR=192.168.100.2" >> /etc/sysconfig/network-scripts/ifcfg-br100
        echo "NETMASK=255.255.255.0" >> /etc/sysconfig/network-scripts/ifcfg-br100

        brctl addbr br100
        service network restart

        yum install openstack-utils openstack-nova openstack-nova-novncproxy  memcached qpid-cpp-server -y

        mysql -uroot -p$ROOT_MYSQL_PASSWORD <<EOF
            CREATE DATABASE nova;
            GRANT ALL ON nova.* TO 'nova'@'%' IDENTIFIED BY 'nova';
            GRANT ALL ON nova.* TO 'nova'@'$MY_HOST_NAME' IDENTIFIED BY 'nova';
EOF

    # openstack-config --set /etc/nova/nova.conf DEFAULT auth_strategy keystone
    # openstack-config --set /etc/nova/api-paste.ini filter:authtoken admin_token $ADMIN_TOKEN

        ADMIN_USER_NOVA="nova"
        ADMIN_PASSWORD_NOVA="nova"

        sed -i "s/admin_tenant_name.*/admin_tenant_name = $ADMIN_TENANT_NAME/g" /etc/nova/nova.conf
        sed -i "s/admin_user.*/admin_user = $ADMIN_USER_NOVA/g" /etc/nova/nova.conf
        sed -i "s/admin_password.*/admin_password = $ADMIN_PASSWORD_NOVA/g" /etc/nova/nova.conf

        setenforce permissive
        sed -i 's/auth=yes/auth=no/g' /etc/qpidd.conf

        service qpidd start
        chkconfig qpidd on

    # rm -rf /etc/nova/nova.conf
    # cp $DEPLOY_DIR/nova.conf /etc/nova/nova.conf
    # chown -R root:nova /etc/nova/nova.conf

        sed -i "s/@localhost/@$NOVA_HOST_IP/g" $DEPLOY_DIR/nova.conf
        sed -i "s/my_ip =.*/my_ip = $MY_HOST_IP/g" $DEPLOY_DIR/nova.conf
        sed -i "s/network_manager =.*/network_manager = $NETWORK_MANAGER/g" $DEPLOY_DIR/nova.conf

        sed -i "/fixed_range =.*/d" $DEPLOY_DIR/nova.conf
        echo "fixed range = $FIXED_RANGE" >> $DEPLOY_DIR/nova.conf

        sed -i "s/flat_interface =.*/flat_interface = $FLAT_INTERFACE/g" $DEPLOY_DIR/nova.conf
        sed -i "s/flat_network_bridge =.*/flat_network_bridge = $FLAT_NETWORK_BRIDGE/g" $DEPLOY_DIR/nova.conf

        sed -i "s/libvirt_type =.*/libvirt_type = $LIBVIRT_TYPE/g" $DEPLOY_DIR/nova.conf

        sed -i "s/novncproxy_base_url =.*/novncproxy_base_url = http:\/\/$NOVA_HOST_IP:6080\/vnc_auto.html/g" $DEPLOY_DIR/nova.conf

        sed -i "s/vncserver_proxyclient_address =.*/vncserver_proxyclient_address = $NOVA_HOST_IP/g" $DEPLOY_DIR/nova.conf

        sed -i "s/vncserver_listen =.*/vncserver_listen = $NOVA_HOST_IP/g" $DEPLOY_DIR/nova.conf

        sed -i "s/ec2_dmz_host=.*/ec2_dmz_host=$NOVA_HOST_IP/g" $DEPLOY_DIR/nova.conf
        sed -i "s/s3_host=.*/s3_host=$NOVA_HOST_IP/g" $DEPLOY_DIR/nova.conf
        sed -i "s/qpid_hostname=.*/qpid_hostname=$NOVA_HOST_IP/g" $DEPLOY_DIR/nova.conf
        sed -i "s/glance_api_servers=.*/glance_api_servers=$GLANCE_HOST_IP:9292/g" $DEPLOY_DIR/nova.conf

        sed -i "s/auth_host =.*/auth_host = $KEYSTONE_HOST_IP/g" $DEPLOY_DIR/nova.conf

        rm -rf /etc/nova/nova.conf
        cp $DEPLOY_DIR/nova.conf /etc/nova/nova.conf
        chown -R root:nova /etc/nova/nova.conf

        if [ $LIBVIRT_TYPE == "qemu" ];then
            ln -s /usr/libexec/qemu-kvm /usr/bin/qemu-system-x86_64
            service libvirtd restart
        fi

        for svc in api objectstore compute network volume scheduler cert novncproxy consoleauth
        do
            service openstack-nova-$svc stop
            chkconfig openstack-nova-$svc on
        done

        nova-manage db sync

        for svc in api objectstore compute network volume scheduler cert novncproxy consoleauth
        do
            service openstack-nova-$svc start
        done

        ####
        #install dashboard
        ####
        yum install -y openstack-dashboard mod_wsgi

        sed -i "s/CACHE_BACKEND =.*/CACHE_BACKEND = \'memcached:\/\/127.0.0.1:11211\/\'/g" /etc/openstack-dashboard/local_settings
        sed -i "s/OPENSTACK_HOST =.*/OPENSTACK_HOST = \"$KEYSTONE_HOST_IP\"/g" /etc/openstack-dashboard/local_settings

        service memcached start
        chkconfig memcached on

        service httpd start
        chkconfig httpd on

        service openstack-nova-compute status

        if [ $? -ne 0 ];then
            nc_log "Configure nova error!"
            exit -1
        else
            nc_log "Configure nova successfully!"
        fi
    fi
    nc_message "deployed"
fi

    if [ "$NODE_TYPE" == "nc" ];then
        ntpdate $NOVA_HOST_IP
        hwclock -w
    
        yum install -y openstack-nova-compute
    
        ADMIN_USER_NOVA="nova"
        ADMIN_PASSWORD_NOVA="nova"
    
        sed -i "s/admin_tenant_name.*/admin_tenant_name = $ADMIN_TENANT_NAME/g" /etc/nova/api-paste.ini
        sed -i "s/admin_user.*/admin_user = $ADMIN_USER_NOVA/g" /etc/nova/api-paste.ini
        sed -i "s/admin_password.*/admin_password = $ADMIN_PASSWORD_NOVA/g" /etc/nova/api-paste.ini

        setenforce permissive
        
        sed -i "s/@localhost/@$NOVA_HOST_IP/g" $DEPLOY_DIR/nova.conf
        sed -i "s/my_ip =.*/my_ip = $MY_HOST_IP/g" $DEPLOY_DIR/nova.conf
        sed -i "s/network_manager =.*/network_manager = $NETWORK_MANAGER/g" $DEPLOY_DIR/nova.conf
        sed -i "/fixed_range =.*/d" $DEPLOY_DIR/nova.conf
        echo "fixed range = $FIXED_RANGE" >> $DEPLOY_DIR/nova.conf
        sed -i "s/flat_interface =.*/flat_interface = $FLAT_INTERFACE/g" $DEPLOY_DIR/nova.conf
        sed -i "s/flat_network_bridge =.*/flat_network_bridge = $FLAT_NETWORK_BRIDGE/g" $DEPLOY_DIR/nova.conf

        sed -i "s/libvirt_type =.*/libvirt_type = $LIBVIRT_TYPE/g" $DEPLOY_DIR/nova.conf

        sed -i "s/novncproxy_base_url =.*/novncproxy_base_url = http:\/\/$NOVA_HOST_IP:6080\/vnc_auto.html/g" $DEPLOY_DIR/nova.conf

        sed -i "s/vncserver_proxyclient_address =.*/vncserver_proxyclient_address = $MY_HOST_IP/g" $DEPLOY_DIR/nova.conf

        sed -i "s/vncserver_listen =.*/vncserver_listen = $MY_HOST_IP/g" $DEPLOY_DIR/nova.conf

        sed -i "s/ec2_dmz_host=.*/ec2_dmz_host=$NOVA_HOST_IP/g" $DEPLOY_DIR/nova.conf
        sed -i "s/s3_host=.*/s3_host=$NOVA_HOST_IP/g" $DEPLOY_DIR/nova.conf
        sed -i "s/qpid_hostname=.*/qpid_hostname=$NOVA_HOST_IP/g" $DEPLOY_DIR/nova.conf
        sed -i "s/glance_api_servers=.*/glance_api_servers=$GLANCE_HOST_IP:9292/g" $DEPLOY_DIR/nova.conf

        sed -i "s/auth_host =.*/auth_host = $KEYSTONE_HOST_IP/g" $DEPLOY_DIR/nova.conf


        rm -rf /etc/nova/nova.conf
        cp $DEPLOY_DIR/nova.conf /etc/nova/nova.conf
        chown -R root:nova /etc/nova/nova.conf

        if [ $LIBVIRT_TYPE == "qemu" ];then
            ln -s /usr/libexec/qemu-kvm /usr/bin/qemu-system-x86_64
            service libvirtd restart
        fi

        service openstack-nova-compute start
#     service openstack-nova-network start

        chkconfig openstack-nova-compute on
#     chkconfig openstack-nova-network on

        service openstack-nova-compute status

        if [ $? -ne 0 ];then
            nc_log "Configure nova error!"
            exit -1
        else
            nc_log "Configure nova successfully!"
        fi

        nc_message "deployed"

    fi    

