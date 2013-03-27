#!/usr/bin/env python
# -*- coding: utf-8 -*-
from celery.task import task
from celery.task.sets import subtask
import logging
from subprocess import Popen,PIPE
import time

DEPLOY_RESULT_PATH = "/opt/openstack/config/deploy_result.conf"

logger = logging.getLogger(__name__)
run_cmd = lambda cmd: Popen(cmd,stdout=PIPE,stderr=PIPE,shell=True)

@task(ignore_result=True)
def puppet_run(host):
    uid = run_cmd("id")
    logger.info(uid.communicate()[0])
    logger.info("puppetrun to client host %s" % host)
    #host+=".sh.intel.com"
    logger.info("sudo /usr/sbin/puppetrun -p 10 --debug --host %s" % host)
    p = run_cmd("sudo /usr/sbin/puppetrun -p 10 --debug --host %s" % host)
    logger.info(p.communicate()[0])

@task(ignore_result=True)
def puppet_clean(host):
    logger.info("About to run puppetca clean %s" % host)
    #host+=".sh.intel.com"
    logger.info("sudo /usr/sbin/puppetca clean %s" % host)
    p = run_cmd("sudo /usr/sbin/puppetca clean %s" % host)
    logger.info(p.communicate()[0])
    
@task(ignore_result=True)
def add_one_host(host,callback=puppet_run):
	logger.info("sh add_one_host script")
	#print host.hostname ,host.static_ip
	logger.info("sudo sh /opt/openstack/scripts/add_one_host.sh %s %s %s" % (host.static_ip, host.hwaddr, host.hostname))
	p = run_cmd("sudo sh /opt/openstack/scripts/add_one_host.sh %s %s %s" % (host.static_ip, host.hwaddr, host.hostname))
	#p.communicate()[0]
	logger.info(p.communicate()[0])
	#ret = subtask(callback).delay(host.hostname)
	#time.sleep(250)
	#if ret.ready():
	#	logger.info("succeeded to deploy host.")
	#else:
	#	logger.info("failed to deploy host %s " % host.hostname)
	
@task(ignore_result=True)
def delete_host(host):
	logger.info("sh delete_host script")
	logger.info("sudo sh /opt/openstack/scripts/delete_host.sh %s %s" % (host.hostname , host.hwaddr))
	p = run_cmd("sudo sh /opt/openstack/scripts/delete_host.sh %s %s" % (host.hostname , host.hwaddr))
	#p.communicate()[0]
	logger.info(p.communicate()[0])


@task(ignore_result=True)
def add_puppet_node(host,callback=puppet_run):
	logger.info("sh add_puppet_node script")
	logger.info("sudo sh /opt/openstack/scripts/add_puppet_node.sh %s %s" % (host.static_ip , host.hostname))
	p = run_cmd("sudo sh /opt/openstack/scripts/add_puppet_node.sh %s %s" % (host.static_ip , host.hostname))
	logger.info(p.communicate()[0])
	ret = subtask(callback).delay(host.hostname)
	time.sleep(250)
	if ret.ready():
		logger.info("succeeded to deploy cc.")
	else:
		logger.info("failed to deploy cc on host %s " % host.hostname)
		
#deprecated
@task(ignore_result=True)
def add_host_from_file(batch_file_dir):
	logger.info("sh add_host_from_file script")
	logger.info("sudo sh /opt/openstack/scripts/add_host_from_file.sh %s" % batch_file_dir)
	p = run_cmd("sudo sh /opt/openstack/scripts/add_host_from_file.sh %s" % batch_file_dir)
	logger.info(p.communicate()[0])
	
@task(ignore_result=True)
def deploytask(iso_addr):
	f = open(DEPLOY_RESULT_PATH,'w')
	f.write('0')
	f.close()
	logger.info("sudo sh /opt/openstack/scripts/deploy.sh %s" % iso_addr)
	p = run_cmd("sudo sh /opt/openstack/scripts/deploy.sh %s" % iso_addr)
	logger.info(p.communicate()[0])
	print "p.returncode" + str(p.returncode)
	if p.returncode != 0:		
		f = open(DEPLOY_RESULT_PATH,'w')
		f.write('2')
		f.close()
