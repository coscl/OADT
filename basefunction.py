'''
created on 2013/2/5

@author: tao.jiang@cs2c.com.cn
'''
import logging
import subprocess

def initlog(action):
    logger = logging.getLogger()
    f = open("/var/log/openstack/openstack%s.log" %action ,"w")
    f.close()
    hdlr = logging.FileHandler("/var/log/openstack/openstack%s.log" %action)
    formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
    hdlr.setFormatter(formatter)
    logger.addHandler(hdlr)
    logger.setLevel(logging.NOTSET)
    return logger

def run_command(cmd , errorMessage , logger):
    run_cmd = subprocess.Popen(cmd ,shell=True ,stdout=subprocess.PIPE ,stderr=subprocess.PIPE)
    logger.info(cmd)
    run_cmd.wait()
    if run_cmd.returncode != 0:
        errorMessage = run_cmd.stderr.readline()
        logger.error(errorMessage)
        return False
    else:
        return True
    
def check_rpm(rpm_name  ,errorMessage  ,logger):
    cmd = "rpm -qa | grep %s" % rpm_name
    re = run_command(cmd ,errorMessage ,logger)
    if re == False :
        errorMessage = "rpm %s is not installed" % rpm_name
        logger.error(errorMessage)
        return False
    return True

def install_rpm(rpm_name, errorMessage, logger):
    cmd = "yum install -y %s" % rpm_name
    
    run_command(cmd , errorMessage , logger)
        
    return True
    
def check_service(service_name,errorMessage ,logger):
    cmd = "service %s status" %service_name
    re = run_command(cmd ,errorMessage ,logger)
    if re == False :
        errorMessage = "%s is not started , please check it" % service_name
        logger.error(errorMessage)
        return False
    return True

def set_hosts(ip , hostname ,logger):
    logger.info("set /etc/hosts")
    cmd = [
               "sed -i \"/%s/d\" /etc/hosts" %ip ,
               "sed -i \"/%s/d\" /etc/hosts" %hostname ,
               "echo \"%s  %s\" >> /etc/hosts" %(ip,hostname)
               ]
    for i in cmd:
        run_command(i, None, logger)
