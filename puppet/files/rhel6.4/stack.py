'''
created on 2013/5/21

@author: tao.jiang@cs2c.com.cn
'''

import basefunction
import os
import sys
import yaml
import shutil
import logmonitor
#import MySQLdb



f = open("local.yaml",'r')
ya = yaml.load(f)
server_ip = ya['cobbler_server']['ip']
f.close()

f = open("role.yaml",'r')
ya1 = yaml.load(f)
f.close()

logger = basefunction.initlog()

def nc_message(message):
    ip = ya['cobbler_server']['ip']
    name = ya['my_cfg']['hostname']
    cmd = ["telnet %s 3336 & " %ip,
           "sleep 2 ",
           "echo \"%s:%s\" | nc %s 6666 " %(name,message,ip)
           ]
    for i in cmd:
        basefunction.run_command(i,None,logger)
    
def log_message(message):
    ip = ya['cobbler_server']['ip']
    name = ya['my_cfg']['hostname']
    cmd = "telnet %s 3337 & ;sleep 2 ;echo \"%s:%s\" | nc %s 9999" %(ip,name,message,ip)
    basefunction.run_command(cmd,None,logger)  
    
def set_mysql():
    cmd = [
           "service mysqld start;chkconfig --level 2345 mysqld on" ,
           "mysqladmin -u root password %s" %ya['my_cfg']['my_sql_password']
           ]
    for i in cmd:
        basefunction.run_command(i,None,logger)
        
def set_keystone():
    logger.info("Start to set Keystone")
    rpm_name = "openstack-utils openstack-keystone python-keystoneclient PyYAML"
    basefunction.install_rpm(rpm_name,None,logger)
    rpm_name = ["openstack-utils" ,"openstack-keystone" ,"python-keystoneclient" ,"PyYAML"]
    for i in rpm_name:
        re = basefunction.check_rpm(i,None,logger)
        if re == False:
            nc_message("error")
            logger.info("Set Keystone error")
            sys.exit(-1)
    
    cmd = """mysql -uroot -p%s <<EOF
            DROP DATABASE keystone;
EOF"""%ya['my_cfg']['my_sql_password']

    basefunction.run_command(cmd,None,logger)
    
    cmd = """mysql -uroot -p%s <<EOF
            CREATE DATABASE keystone;
            GRANT ALL ON keystone.* TO 'keystone'@'%%' IDENTIFIED BY 'keystone';
            GRANT ALL ON keystone.* TO 'keystone'@'%s' IDENTIFIED BY 'keystone';
EOF""" %(ya['my_cfg']['my_sql_password'],ya['my_cfg']['hostname'])

    re = basefunction.run_command(cmd,None,logger)
    if re == False:
        nc_message("error")
        logger.info("create Keystone db error")
        logmonitor.log_read(server_ip)
        sys.exit(-1)
        
    cmd = [
           "ADMIN_TOKEN=$(openssl rand -hex 10);openstack-config --set /etc/keystone/keystone.conf DEFAULT admin_token $ADMIN_TOKEN;sed -i.bak \"s/token:.*/token:    $ADMIN_TOKEN/g\" config.yaml" ,
           "sed -i \"s/connection = mysql:\/\/keystone:keystone@.*/connection = mysql:\/\/keystone:keystone@%s\/keystone/g\" /etc/keystone/keystone.conf"%ya1['keystone'] ,
           "service openstack-keystone start &&  chkconfig openstack-keystone on" ,
           "keystone-manage db_sync" 
           ]
    
    for i in cmd:
        re == basefunction.run_command(i,None,logger)
    if re == False:
        nc_message("error")
        logger.info("Keystone db error")
        logmonitor.log_read(server_ip)
        sys.exit(-1)
        
    cmd = [
           "service openstack-keystone restart" ,
           "sleep 10"
           ]
    for i in cmd:
        basefunction.run_command(i,None,logger)
           
    f = open("config.yaml",'r')
    ya2 = yaml.load(f)
    f.close() 
    ya2['endpoint'] = "http://%s:35357/v2.0" %ya1['keystone']
    ya2['services and endpoints'][0]['publicurl'] = "http://%s:5000/v2.0" %ya1['keystone']
    ya2['services and endpoints'][0]['internalurl'] = "http://%s:5000/v2.0" %ya1['keystone']
    ya2['services and endpoints'][0]['adminurl'] = "http://%s:35357/v2.0" %ya1['keystone']
 
    ya2['services and endpoints'][1]['publicurl'] = "http://%s:8774/v2/%%(tenant_id)s" %ya1['nova']
    ya2['services and endpoints'][1]['internalurl'] = "http://%s:8774/v2/%%(tenant_id)s" %ya1['nova']
    ya2['services and endpoints'][1]['adminurl'] = "http://%s:8774/v2/%%(tenant_id)s" %ya1['nova']
    
    ya2['services and endpoints'][2]['publicurl'] = "http://%s:8776/v1/%%(tenant_id)s" %ya1['nova']
    ya2['services and endpoints'][2]['internalurl'] = "http://%s:8776/v1/%%(tenant_id)s" %ya1['nova']
    ya2['services and endpoints'][2]['adminurl'] = "http://%s:8776/v1/%%(tenant_id)s" %ya1['nova']

    ya2['services and endpoints'][3]['publicurl'] = "http://%s:9292/v1" %ya1['glance']
    ya2['services and endpoints'][3]['internalurl'] = "http://%s:9292/v1" %ya1['glance']
    ya2['services and endpoints'][3]['adminurl'] = "http://%s:9292/v1" %ya1['glance']
    f = open("config.yaml",'w')        
    yaml.dump(ya2,f,default_flow_style=False)
    f.close()
    import keystoneinit
    config = keystoneinit.parse_config("config.yaml")
    keystoneinit.configure_keystone(config)
    
    logger.info("install keystone successfully")
    
def set_glance():
    logger.info("Start to set glance")
    rpm_name = ["openstack-glance" ,"openstack-keystone" ,"python-keystoneclient"]
    for i in rpm_name:
        re = basefunction.check_rpm(i,None,logger)
        if re == False:
            re = basefunction.install_rpm(i,None,logger)
            re = basefunction.check_rpm(i,None,logger)
            if re == False:
                nc_message("error")
                logger.info("Set glance error")
                logmonitor.log_read(server_ip)
                sys.exit(-1)
                
    cmd = """mysql -uroot -p%s <<EOF
            CREATE DATABASE glance;
            GRANT ALL ON glance.* TO 'glance'@'%%' IDENTIFIED BY 'glance';
            GRANT ALL ON glance.* TO 'glance'@'%s' IDENTIFIED BY 'glance';
EOF""" %(ya['my_cfg']['my_sql_password'],ya['my_cfg']['hostname'])

    basefunction.run_command(cmd,None,logger)
                
                
    cmd = [
           "sed -i \"s/#enable_v1_api = True/enable_v1_api = True/g\" /etc/glance/glance-api.conf" ,
           "sed -i \"s/#enable_v2_api = True/enable_v2_api = True/g\" /etc/glance/glance-api.conf" ,
           "sed -i \"s/#flavor=/flavor=keystone/g\" /etc/glance/glance-api.conf" ,
           "sed -i \"s/admin_tenant_name.*/admin_tenant_name = service/g\" /etc/glance/glance-api.conf" ,
           "sed -i \"s/admin_user.*/admin_user = glance/g\" /etc/glance/glance-api.conf" ,
           "sed -i \"s/admin_password.*/admin_password = glance/g\" /etc/glance/glance-api.conf" ,
           "sed -i \"s/connection = mysql:\/\/glance:glance@.*/connection = mysql:\/\/glance:glance@%s\/glance/g\" /etc/glance/glance-api.conf"%ya1['glance'] ,
           "sed -i \"s/auth_host.*/auth_host = %s/g\" /etc/glance/glance-api.conf"%ya1['keystone'] ,
           "sed -i \"s/qpid_host.*/qpid_host = %s/g\" /etc/glance/glance-api.conf"%ya1['nova'] ,
           "sed -i \"s/auth_host.*/auth_host = %s/g\" /etc/glance/glance-registry.conf"%ya1['keystone'] ,
           "sed -i \"s/admin_tenant_name.*/admin_tenant_name = service/g\" /etc/glance/glance-registry.conf" ,
           "sed -i \"s/admin_user.*/admin_user = glance/g\" /etc/glance/glance-registry.conf" ,
           "sed -i \"s/admin_password.*/admin_password = glance/g\" /etc/glance/glance-registry.conf" ,
           "sed -i \"s/#flavor=/flavor=keystone/g\" /etc/glance/glance-registry.conf" ,
           "sed -i \"s/connection = mysql:\/\/glance:glance@.*/connection = mysql:\/\/glance:glance@%s\/glance/g\" /etc/glance/glance-registry.conf"%ya1['glance']
           ]
    for i in cmd:
        basefunction.run_command(i,None,logger)

    cmd = [
           "sed -i \"/admin_tenant_name/d\" /etc/glance/glance-api-paste.ini" ,
           "sed -i \"/admin_user/d\" /etc/glance/glance-api-paste.ini" ,
           "sed -i \"/admin_password/d\" /etc/glance/glance-api-paste.ini" 
           ]
    for i in cmd:
        basefunction.run_command(i,None,logger)
    
    strr = """admin_tenant_name = service
admin_user = glance
admin_password = glance"""
              
    f = open("/etc/glance/glance-api-paste.ini","a")
    f.write(strr)
    f.close()
    
    cmd = [
           "glance-manage db_sync" ,
           "glance-registry --config-file /etc/glance/glance-registry.conf --debug --verbose &" ,
           "service openstack-glance-api start && chkconfig openstack-glance-api on"
           ]
    for i in cmd:
        re == basefunction.run_command(i,None,logger)
        if re == False:
            nc_message("error")
            logger.info("glance db error")
            logmonitor.log_read(server_ip)
            sys.exit(-1)
     
    cmd = "sed -i \"/glance-registry/d\" /etc/rc.local" 
    basefunction.run_command(cmd,None,logger)
          
    strr = "glance-registry --config-file /etc/glance/glance-registry.conf --debug --verbose &" 
    f = open("/etc/rc.local","a")
    f.write(strr)
    f.close()
    
def set_nova():
    logger.info("Start set nova")
    
    rpm_name = "openstack-utils openstack-nova openstack-nova-novncproxy  memcached qpid-cpp-server openstack-keystone python-keystoneclient"
    basefunction.install_rpm(rpm_name,None,logger)
    rpm_name = ["openstack-utils","openstack-nova","openstack-nova-novncproxy","memcached","qpid-cpp-server"]
    for i in rpm_name:
        re = basefunction.check_rpm(i,None,logger)
        if re == False:
            nc_message("error")
            logger.info("Set Keystone error")
            sys.exit(-1)
    
    cmd = [
           "sed -i \"s/admin_tenant_name.*/admin_tenant_name = service/g\" /etc/nova/nova.conf" ,
           "sed -i \"s/admin_user.*/admin_user = nova/g\" /etc/nova/nova.conf" ,
           "sed -i \"s/admin_password.*/admin_password = nova/g\" /etc/nova/nova.conf" ,
           "setenforce permissive" ,
           "sed -i 's/auth=yes/auth=no/g' /etc/qpidd.conf" ,
           "service qpidd start;chkconfig qpidd on"
           ]
    
    for i in cmd:
        basefunction.run_command(i,None,logger)
    
    cmd = """mysql -uroot -p%s <<EOF
            CREATE DATABASE nova;
            GRANT ALL ON nova.* TO 'nova'@'%%' IDENTIFIED BY 'nova';
            GRANT ALL ON nova.* TO 'nova'@'%s' IDENTIFIED BY 'nova';
EOF""" %(ya['my_cfg']['my_sql_password'],ya['my_cfg']['hostname'])

    basefunction.run_command(cmd,None,logger)

    
    
    nova_ip = ya1['nova']
    glance_ip = ya1['glance']
    keystone_ip = ya1['keystone']
    my_ip = ya['my_cfg']['ip']
    net_manager = ya['my_cfg']['network_manager']
    fix_r = ya['my_cfg']['fixed_range']
    flat_i = ya['my_cfg']['flat_interface']
    flat_b = ya['my_cfg']['flat_network_bridge']
    libv_t = ya['my_cfg']['libvirt_type']
    
    cmd = """sed -e \"
                 s,connection = mysql://nova:nova@.*,connection = mysql://nova:nova@%s/nova,g;
                 s,my_ip =.*,my_ip = %s,g;
                 s,network_manager =.*,network_manager = %s,g;
                 s,fixed_range =.*,fixed_range = %s,g;
                 s,flat_interface =.*,flat_interface = %s,g;
                 s,flat_network_bridge =.*,flat_network_bridge = %s,g;
                 s,libvirt_type =.*,libvirt_type = %s,g
                 s,novncproxy_base_url =.*,novncproxy_base_url = http://%s:6080/vnc_auto.html,g;
                 s,vncserver_proxyclient_address =.*,vncserver_proxyclient_address = %s,g;
                 s,vncserver_listen =.*,vncserver_listen = %s,g;
                 s,ec2_dmz_host=.*,ec2_dmz_host=%s,g;
                 s,s3_host=.*,s3_host=%s,g;
                 s,qpid_hostname=.*,qpid_hostname=%s,g;
                 s,glance_api_servers=.*,glance_api_servers=%s:9292,g;
                 s,auth_host =.*,auth_host = %s,g;
                 \" /opt/openstack/nova.conf > /etc/nova/nova.conf""" %(nova_ip,my_ip,net_manager,fix_r,flat_i,flat_b,libv_t,nova_ip,nova_ip,nova_ip,nova_ip,nova_ip,nova_ip,glance_ip,keystone_ip)
    
    basefunction.run_command(cmd, None, logger)
                 
    cmd = "service libvirtd restart;chkconfig libvirtd on"
    basefunction.run_command(cmd, None, logger)
#    shutil.copy("/opt/openstack/nova.conf", "/etc/nova/nova.conf")

        
def set_dashboard():
    cmd = "openstack-dashboard mod_wsgi"
    basefunction.install_rpm(cmd, None, logger)
    
    cmd = ["openstack-dashboard" ,"mod_wsgi"]
    for i in cmd:
        re == basefunction.check_rpm(i, None, logger)
        if re == False:
            nc_message("error")
            logger.error("rpm %s not installed " %i) 
            logmonitor.log_read(server_ip)
            sys.exit()
            
    cmd = [
           "sed -i \"s/CACHE_BACKEND =.*/CACHE_BACKEND = \'memcached:\/\/127.0.0.1:11211\/\'/g\" /etc/openstack-dashboard/local_settings" ,
           "sed -i \'s/OPENSTACK_HOST =.*/OPENSTACK_HOST = \"%s\"/g' /etc/openstack-dashboard/local_settings" %ya1['keystone'],
           "service memcached start;chkconfig memcached on",
           "service httpd start;chkconfig httpd on"
           ]
    
    for i in cmd:
        basefunction.run_command(i, None, logger)
        
    
if __name__ == '__main__':
    nc_message("deploying")
    set_mysql()
    if ya['my_cfg']['ip'] == ya1['keystone']:
        set_keystone()
    if ya['my_cfg']['ip'] == ya1['glance']:
        set_glance()
    if ya['my_cfg']['ip'] == ya1['nova']:
        
        strr = """DEVICE=br100
TYPE=Bridge
ONBOOT=yes
DELAY=0
BOOTPROTO=static
IPADDR=192.168.100.2
NETMASK=255.255.255.0"""
        
        f = open("/etc/sysconfig/network-scripts/ifcfg-br100","w")
        f.write(strr)
        f.close()
        
        cmd = "brctl addbr br100;service network restart"
        basefunction.run_command(cmd, None, logger)
        
        set_nova()
        
        for i in ["api","objectstore","compute","network","volume","scheduler","cert","novncproxy","consoleauth"]:
            cmd = "service openstack-nova-%s stop;chkconfig openstack-nova-%s on" %(i,i)
            basefunction.run_command(cmd, None, logger)
    
        cmd = "nova-manage db sync"
        re = basefunction.run_command(cmd, None, logger)
        if re == False:
            nc_message("error")
            logger.error("nova-manage db sync error")
            logmonitor.log_read(server_ip)
            sys.exit()
        
        for i in ["api","objectstore","compute","network","volume","scheduler","cert","novncproxy","consoleauth"]:
            cmd = "service openstack-nova-%s start" %i
            basefunction.run_command(cmd, None, logger)
            
        set_dashboard()
    else:
        set_nova()
        cmd = "service openstack-nova-compute start;chkconfig openstack-nova-compute on"
        basefunction.run_command(cmd, None, logger)
    nc_message("deployed")
    logmonitor.log_read(server_ip)
    