'''
created on 2013/17/5

@author: tao.jiang@cs2c.com.cn
'''
import basefunction
import os
import sys
import shutil
import commands

dirr = "/opt/openstack"
os_type = "rhel6.4"
log_dir = "/var/log/openstack"

def create_repo():
    rpm_name="createrepo"
    re = basefunction.check_rpm(rpm_name ,None, logger)
    if re == False:
        basefunction.install_rpm(rpm_name, None, logger)
        re = basefunction.check_rpm(rpm_name ,None, logger)
        if re == False:
            print "create repo error ! Not installed createrepo"
            logger.error("create repo error !")
            sys.exit(-1)

    cmd = "cd %s/source/%s;tar xvf install.tar.gz install;createrepo install"%(dirr,os_type)
    basefunction.run_command(cmd, None, logger)
    if re == False:
        print "create repo error ! set repo error"
        logger.error("create repo error !")
        sys.exit(-1)
    strr = """[install-Server]
name=install-Server
baseurl=file://%s/source/%s/install
enabled=1
gpgcheck=0"""%(dirr,os_type)

    f = open("/etc/yum.repos.d/install.repo","w")
    f.write(strr)
    f.close()
    


if __name__ == '__main__':
    if os.path.exists(log_dir) == False:
        os.mkdir(log_dir)
    if os.path.exists("%s/nodes" %log_dir) == False:
        os.mkdir("%s/nodes" %log_dir)
    logger = basefunction.initlog("install")
    errorMessage = ""
    create_repo()
    rpm_name="telnet telnet-server syslinux cobbler puppet-server Django14 python-celery django-celery rabbitmq-server python-amqplib django-picklefield dhcp vsftpd ntpd"
    basefunction.install_rpm(rpm_name, None, logger)
    
    rpm_name=["telnet","telnet-server","syslinux","cobbler","puppet-server","Django14","python-celery","django-celery","rabbitmq-server","python-amqplib","django-picklefield","vsftpd"]
    for i in rpm_name:
        re = basefunction.check_rpm(i, None, logger)
        if re == False:
            print "rpm %s not installed" %i
            sys.exit()
            
    cmd = "sed -i \"/server    127.127.1.0/d\" /etc/ntp.conf"
    basefunction.run_command(cmd, None, logger)
    
    f = open("/etc/ntp.conf","a")
    f.write("\nserver    127.127.1.0\n")
    f.close()
    
    cmd = "sed -i \"s/disable.*/disable  = no /g\" /etc/xinetd.d/telnet"
    basefunction.run_command(cmd, None, logger)
    
    shutil.copy("%s/config/nc_listen"%dirr, "/etc/xinetd.d/nc_listen")
    shutil.copy("%s/config/log_listen"%dirr, "/etc/xinetd.d/log_listen")
    
    cmd = """sed -i \"/nc_listen/d\" /etc/services;
             echo "nc_listen       3336/tcp                # nc_listen\" >> /etc/services;
             sed -i \"/log_listen/d\" /etc/services;
             echo \"log_listen       3337/tcp                # log_listen\" >> /etc/services;
             service xinetd start;
             chkconfig xinetd on"""
    basefunction.run_command(cmd, None, logger)
    
    shutil.copy("%s/httpd/celery/celeryd" %dirr, "/etc/init.d/celeryd")
    shutil.copy("%s/httpd/celery/celeryd.sysconfig2" %dirr, "/etc/sysconfig/celeryd")
    
    cmd = [
           "service rabbitmq-server start;chkconfig rabbitmq-server on" ,
           "service ntpd start;chkconfig ntpd on" ,
           "service celeryd start",
           "service iptables stop" ,
           "chkconfig iptables off" ,
           "service vsftpd start;chkconfig vsftpd on" ,
           "setenforce 0" ,
           "service cobblerd restart" ,
           "chkconfig httpd on" ,
           "service httpd restart",
           "sed -i '/celeryd/d' /etc/rc.local" ,
           "sed -i '/setenforce/d' /etc/rc.local"
           ]
     
    for i in cmd:
        basefunction.run_command(i, None, logger)
        
    f = open("/etc/rc.local","a")
    f.write("service celeryd start\n")
    f.write("setenforce 0\n")
    f.close()
        
    service_name = ["cobblerd"]  
    for i in service_name:
        re = basefunction.check_service(i, errorMessage, logger)
        if re == False:
            print errorMessage
            logger.error(errorMessage)
            sys.exit(-1)
    
    import yaml
    dirr = "/opt/openstack/config"
    f = open("%s/cb.yaml" %dirr,"r")
    ya = yaml.load(f)
    f.close()
    status,output =commands.getstatusoutput("hostname")
    ya['cobber_server']['hostname']=output
    status,output =commands.getstatusoutput("ifconfig eth0 | grep \"inet addr:\" | cut -d: -f2 | awk '{print $1}'")
    ya['cobber_server']['ip']= output
    f = open("%s/cb.yaml" %dirr,"w")
    yaml.dump(ya,f,default_flow_style=False)
    f.close()
    
    
    f = open("%s/local.yaml" %dirr,"r")
    ya = yaml.load(f)
    f.close()
    ya['cobbler_server']['ip'] = output
    f = open("%s/local.yaml" %dirr,"w")
    yaml.dump(ya,f,default_flow_style=False)
    f.close()
    
    strr = "python /opt/openstack/httpd/oadt/manage.py syncdb"
    logger.info("start to sync db")
    basefunction.run_command(strr, None, logger)

    
    print "Install Successed" 