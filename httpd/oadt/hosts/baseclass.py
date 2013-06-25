'''
created on 2013/17/5

@author: tao.jiang@cs2c.com.cn
'''

import sys
import basefunction
import yaml
import os
import shutil
from models import Host

logger = basefunction.initlog("deploy")
dirr = "/opt/openstack"

class set_cobbler():
    def __init__(self , yamlfile="%s/config/cb.yaml"%dirr):
        f = open(yamlfile, 'r')
        self.ya = yaml.load(f)
        self.os_type = self.ya['deploy_os_type']
        f.close()
        
    def mount_file(self,os_file):
        cmd = "umount /mnt"
        basefunction.run_command(cmd, None, logger)
        cmd = "mount -o loop %s /mnt" %os_file
        re = basefunction.run_command(cmd, None, logger)
        if re == False:
            cmd = "mount %s /mnt" %os_file
            re = basefunction.run_command(cmd, None, logger)
            if re == False:
                logger.error("mount file error")
                self.set_result("2")
                sys.exit(-1)
                
    def set_puppet(self):
        logger.info("start to set puppet")
        shutil.rmtree("/etc/puppet")
        shutil.copytree("%s/puppet/"%dirr, "/etc/puppet/")
        cmd = ["service puppetmaster restart ; chkconfig puppetmaster on"]
        basefunction.run_command(cmd, None, logger)

    def set_openstack_repo(self):
        logger.info("start to create openstack repo")
        os_type = self.ya['deploy_os_type']
        shutil.copy("%s/source/%s/openstack-packages.tar.gz" %(dirr,os_type), "/var/ftp/")
        
        cmd = "cd /var/ftp/;tar xvf openstack-packages.tar.gz;createrepo openstack-packages"
        re = basefunction.run_command(cmd, None, logger)
        if re == False:
            logger.error("create openstack repo error")
            self.set_result("2")
            sys.exit(-1)
        
        cmd = "cobbler repo remove --name=openstack-local"
        basefunction.run_command(cmd, None, logger)
        
        cmd = [
               "cobbler repo add --name=openstack-local --mirror=ftp://127.0.0.1/openstack-packages" ,
               "cobbler reposync",
               "cobbler profile edit --name=openstack_%s-x86_64 --repos=\"openstack-local\"" %os_type
               ]
        for i in cmd:
            re = basefunction.run_command(i, None, logger)
            if re == False:
                logger.error("add repo error")
                self.set_result("2")
                sys.exit(-1)       
        
    def set_distro(self):
        logger.info("start to create distro")
        os_type = self.ya['deploy_os_type']
        cmd = "cobbler distro remove --name=openstack_%s-x86_64" % os_type
        basefunction.run_command(cmd, None, logger)
        if os.path.exists("/var/www/cobbler/ks_mirror/openstack_%s-x86_64" % os_type):
            shutil.rmtree("/var/www/cobbler/ks_mirror/openstack_%s-x86_64" % os_type)
        cmd = "cobbler import --path=/mnt --name=openstack_%s --arch=x86_64" % os_type
        re = basefunction.run_command(cmd, None, logger)
        if re == False:
            logger.error("set distro error")
            self.set_result("2")
            sys.exit(-1)
            
            
            
    def set_cobbler_cfg(self):
        
        cmd = [
               "sed -i \"s/next_server:.*/next_server: %s/g\" /etc/cobbler/settings" % self.ya['cobber_server']['ip'] ,
               "sed -i \"s/server:.*/server: %s/g\" /etc/cobbler/settings" % self.ya['cobber_server']['ip'] ,
               "sed -i \"s/manage_dhcp:.*/manage_dhcp: 1/g\" /etc/cobbler/settings" ,
               "sed -i \"s/pxe_just_once:.*/pxe_just_once: 1/g\" /etc/cobbler/settings" ,
               "sed -i \"s/disable.*/disable  = no /g\" /etc/xinetd.d/tftp" ,
               "sed -i \"s/disable.*/disable  = no /g\" /etc/xinetd.d/rsync"
               ]
        for i in cmd:
            basefunction.run_command(i, None, logger)
        shutil.copy("%s/config/dhcp.template" %dirr, "/etc/cobbler/dhcp.template")
        
        cmd = [
               "sed -i \"s/subnet.*netmask.*{/subnet %s netmask %s {/g\" /etc/cobbler/dhcp.template" %(self.ya['cobbler_dhcp']['subnet_ip'],self.ya['cobbler_dhcp']['subnet_netmask']) ,
               "sed -i \"s/option routers.*/option routers    %s;/g\" /etc/cobbler/dhcp.template" %self.ya['cobbler_dhcp']['gateway_ip'] ,
               "sed -i \"s/option domain-name-servers.*/option domain-name-servers    %s;/g\" /etc/cobbler/dhcp.template" %self.ya['cobbler_dhcp']['dns_ip'] ,
               "sed -i \"s/option subnet-mask.*/option subnet-mask    %s;/g\" /etc/cobbler/dhcp.template" %self.ya['cobbler_dhcp']['netmask_ip'] ,
               "sed -i \"s/range dynamic-bootp.*/range dynamic-bootp    %s %s;/g\" /etc/cobbler/dhcp.template" %(self.ya['cobbler_dhcp']['range_ip_start'] ,self.ya['cobbler_dhcp']['range_ip_stop']) ,
               "service ntpd start;chkconfig ntpd on"
               ]
        for i in cmd:
            basefunction.run_command(i, None, logger)
        
        cmd = "service cobblerd restart;cobbler sync"
        re = basefunction.run_command(cmd, None, logger)
        if re == False:
            logger.error("Set cobbler error ,please check dhcp config")
            self.set_result("2")
            sys.exit(-1)

    def set_kickstart_file(self):
        logger.info("start to set kickstart file")
        os_type = self.ya['deploy_os_type']
        shutil.copy("%s/config/%s/ks.cfg" %(dirr,os_type), "/var/www/ks.cfg")
        cmd = [
               "sed -i \"s/ftp:\/\/192\.168\.1\.1\/pub/http:\/\/%s:80\/cobbler\/ks_mirror\/openstack_%s-x86_64/g\" /var/www/ks.cfg" %(self.ya['cobber_server']['ip'],os_type) ,
               "sed -i \"s/(@_@)/%s/g\" /var/www/ks.cfg" %self.ya['cobber_server']['hostname'],
               "sed -i \"s/(@-@)/%s/g\" /var/www/ks.cfg" %self.ya['cobber_server']['ip']
               ]
        for i in cmd:
            basefunction.run_command(i, None, logger) 
        
    def set_result(self,result):
        f = open("%s/config/deploy_result.conf" %dirr,'w')
        f.write(result)
        f.close()
        
    def done(self ,os_file):
        self.set_result("0")
        
        self.mount_file(os_file)
        self.set_puppet()
        self.set_cobbler_cfg()
        self.set_distro()
        self.set_openstack_repo()
        self.set_kickstart_file()
        
        ip = self.ya['cobber_server']['ip']
        hostname = self.ya['cobber_server']['hostname']
        basefunction.set_hosts(ip, hostname, logger)
        
        cmd = "service xinetd restart;cobbler sync"
        re = basefunction.run_command(cmd, None, logger)
        if re == False:
            logger.error("run cmd %s error "%cmd)
            self.set_result("2")
            sys.exit("-1")
        cmd = "service rabbitmq-server restart"
        basefunction.run_command(cmd, None, logger)
        self.set_result("1")
        
class add_one_host():
    
    
    def __init__(self ,ip , hostname , mac ,yamlfile="%s/config/cb.yaml"%dirr):
        self.ip = ip
        self.hostname = hostname
        self.mac = mac
        f = open(yamlfile, 'r')
        self.ya = yaml.load(f)
        self.os_type = self.ya['deploy_os_type']
        self.subnet = self.ya['cobbler_dhcp']['netmask_ip']
        self.gateway = self.ya['cobbler_dhcp']['gateway_ip']
        self.dns = self.ya['cobbler_dhcp']['dns_ip']
        f.close()
        
        
    def set_kickstart(self):
        logger.info("set kickstart file for %s" %self.hostname)
        ks_path = "/var/www/%s" %self.mac
        re = os.path.exists(ks_path)
        if re == False:
            os.mkdir(ks_path)
        shutil.copy("/var/www/ks.cfg", ks_path)
        
        cmd = [
#               "sed -i \"s/DEVICE=.*/DEVICE=eth0/g\" %s/ks.cfg" %ks_path ,
#               "sed -i \"s/IPADDR=.*/IPADDR=%s/g\" %s/ks.cfg" %(self.ip ,ks_path) ,
#               "sed -i \s/NETMASK=.*/NETMASK=%s/g\" %s/ks.cfg" %(self.ya['cobbler_dhcp']['netmask_ip'] ,ks_path) ,
#               "sed -i \"s/GATEWAY=.*/GATEWAY=%s/g\" %s/ks.cfg" %(self.ya['cobbler_dhcp']['gateway_ip'] ,ks_path) ,
#               "sed -i \"s/DNS1=.*/DNS1=%s/g\" %s/ks.cfg" %(self.ya['cobbler_dhcp']['dns_ip'] ,ks_path) ,
#               "sed -i \"s/127\.0\.0\.1/%s/g\" %s/ks.cfg" %(self.ya['cobber_server']['ip'] ,ks_path) ,
               "sed -i \"s/myip/%s/g\" %s/ks.cfg" %(self.ip ,ks_path) ,
               "sed -i \"s/myhostname/%s/g\" %s/ks.cfg" %(self.hostname ,ks_path)               
               ]
        for i in cmd:
            basefunction.run_command(i, None, logger)

#        cmd = "sed -i \"s/myhostname/%s/g\" %s/ks.cfg" %(self.hostname ,ks_path)
#        basefunction.run_command(cmd, None, logger)
        
        strr = """$yum_config_stanza
$yum_repo_stanza
$SNIPPET('kickstart_done')"""
        f = open("%s/ks.cfg" %ks_path,"a")
        f.write(strr)
        f.close()
        
    def add_cobbler_system(self):
        logger.info("Start to add cobbler system for %s" %self.hostname)
        cmd = "cobbler system remove --name=%s" %self.mac
        basefunction.run_command(cmd, None, logger)
        cmd = "cobbler system add --name=%s --profile=openstack_%s-x86_64 --mac=%s --static=yes --ip-address=%s --subnet=%s --gateway=%s --name-servers=%s --kickstart=/var/www/%s/ks.cfg --hostname=%s --netboot-enabled=true" %(self.mac,self.os_type,self.mac,self.ip,self.subnet,self.gateway,self.dns,self.mac,self.hostname)
        re = basefunction.run_command(cmd, None, logger)
        if re == False:
            logger.error("Set cobbler system error")
            sys.exit(-1)
        cmd = "cobbler sync"
        re = basefunction.run_command(cmd, None, logger)
        if re == False:
            logger.error("cobbler sync error")
            sys.exit(-1)
            
    def add_puppet_file(self):
        logger.info("add host %s info to puppet" %self.hostname)
        path = "/etc/puppet/files/%s/%s" %(self.os_type,self.hostname)
        re = os.path.exists(path)
        if re == False:
            os.mkdir(path)
            
        shutil.copy("%s/config/local.yaml" %dirr, "%s/local.yaml"%path)
        f = open("%s/local.yaml"%path ,"r")
        ya = yaml.load(f)
        f.close()
        ya['my_cfg']['ip'] = self.ip
        ya['my_cfg']['hostname'] = self.hostname
        f = open("%s/local.yaml"%path ,"w")
        yaml.dump(ya,f,default_flow_style=False)
        f.close()
              
        
    def done(self):
        self.set_kickstart()
        self.add_cobbler_system()
        self.add_puppet_file()
        basefunction.set_hosts(self.ip, self.hostname, logger)
        
        re = os.path.exists("/var/log/openstack/nodes/%s.log" %self.hostname)
        if re == False:
            f = open("/var/log/openstack/nodes/%s.log" %self.hostname ,"w")
            f.close()
class add_hosts_from_file():
    def __init__(self,file_dir ,yamlfile="%s/config/cb.yaml"%dirr):
        self.file_dir = file_dir
        f = open(yamlfile, 'r')
        self.ya = yaml.load(f)
        self.os_type = self.ya['deploy_os_type']
        f.close()
        f = open(file_dir, 'r')
        self.yal = yaml.load(f)
        f.close()
    def done(self):
        logger.info("start to add hosts")
        for h in self.yal['host']:
            name = h['name']
            ip = h['ip']
            mac = h['mac']
            logger.info(mac)
            logger.info(ip)
            add_host = add_one_host(ip,name ,mac)
            add_host.done() 
            new_host = Host(hostname=name,static_ip=ip,status="added",hwaddr=mac)
            new_host.save()          


class delete_host():
    def __init__(self ,hostname ,mac ,yamlfile="%s/config/cb.yaml"%dirr):
        self.hostname = hostname
        self.mac = mac
        f = open(yamlfile, 'r')
        self.ya = yaml.load(f)
        self.os_type = self.ya['deploy_os_type']
        f.close()
    
    def done(self):
        logger.info("Start to delete host %s" %self.hostname)
        cmd = [
               "cobbler system remove --name=%s" %self.mac ,
               "cobbler sync" ,
               "sed -i \"/%s/,+10d\" /etc/puppet/manifests/nodes.pp" %self.hostname ,
               "puppetca clean %s" %self.hostname ,
               "sed -i \"/%s/d\" /etc/hosts" %self.hostname
               ]
        for i in cmd:
            basefunction.run_command(i, None, logger)
            
        if os.path.exists("/var/log/openstack/nodes/%s.log" %self.hostname) :
            os.remove("/var/log/openstack/nodes/%s.log" %self.hostname)
            
        if os.path.exists("/etc/puppet/files/%s/%s" %(self.os_type,self.hostname)) :
            shutil.rmtree("/etc/puppet/files/%s/%s" %(self.os_type,self.hostname))
            
class add_puppet_node():
    def __init__(self , ip ,hostname ,yamlfile="%s/config/cb.yaml"%dirr):
        self.ip = ip
        self.hostname = hostname
        f = open(yamlfile, 'r')
        self.ya = yaml.load(f)
        self.os_type = self.ya['deploy_os_type']
        f.close()        
    
    def done(self):
        cmd = "sed -i \"/%s/,+10d\" /etc/puppet/manifests/nodes.pp" %self.hostname
        basefunction.run_command(cmd, None, logger)
        
        strr = """node '%s' {
            file{ \"/opt/openstack/local.yaml\":
                ensure => present,
                alias => \"local.yaml\",
                source => \"puppet:///files/%s/%s/local.yaml\",
                owner => root,
                group => root,
                mode => 644;
            }
            include deploy
        }\n""" % (self.hostname,self.os_type,self.hostname)
        
        f = open("/etc/puppet/manifests/nodes.pp","a")
        f.write(strr)
        f.close()
        
        
        