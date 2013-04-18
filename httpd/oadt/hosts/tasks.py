#!/usr/bin/env python
# -*- coding: utf-8 -*-
from celery.task import task
from celery.task.sets import subtask
import logging,commands
from subprocess import Popen,PIPE
import time

DEPLOY_RESULT_PATH = "/opt/openstack/config/deploy_result.conf"
HOST_LOG_DIR = "/var/log/OADT/nodes/"

logger = logging.getLogger(__name__)
#run_cmd = lambda cmd: Popen(cmd,stdout=PIPE,stderr=PIPE,shell=True)
run_cmd = lambda cmd: commands.getstatusoutput(cmd)

@task(ignore_result=True)
def puppet_run(host):
	logger.info("puppetrun to client host %s" % host)
	logger.info("/usr/sbin/puppetrun -p 10 --debug --host %s" % host)
	p = run_cmd("/usr/sbin/puppetrun -p 10 --debug --host %s" % host)
	logger.info(p[1])
	if p[0]!=0:
		logger.error("script error:" + str(p[1]))
	else:
		logger.info("script result:" + str(p[1]))
	f = open(HOST_LOG_DIR + host + '.log','a')
	f.write(str(p[1]))
	f.close()	
	
@task(ignore_result=True)
def puppet_clean(host):
	logger.info("About to run puppetca clean %s" % host)
	#host+=".sh.intel.com"
	logger.info("/usr/sbin/puppetca clean %s" % host)
	p = run_cmd("/usr/sbin/puppetca clean %s" % host)
	logger.info(p[1])
	if p[0]!=0:
		logger.error("script error:" + str(p[1]))
	else:
		logger.info("script result:" + str(p[1]))
	
@task(ignore_result=True)
def add_one_host(host,callback=puppet_run):
	logger.info("sh add_one_host script")
	#print host.hostname ,host.static_ip
	logger.info("sh /opt/openstack/scripts/add_one_host.sh %s %s %s" % (host.static_ip, host.hwaddr, host.hostname))
	p = run_cmd("sh /opt/openstack/scripts/add_one_host.sh %s %s %s" % (host.static_ip, host.hwaddr, host.hostname))
	#p.communicate()[0]
	logger.info(p[1])
	if p[0]!=0:
		logger.error("script error:" + str(p[1]))
	else:
		logger.info("script result:" + str(p[1]))
	
@task(ignore_result=True)
def delete_host(host):
	logger.info("sh delete_host script")
	logger.info("sh /opt/openstack/scripts/delete_host.sh %s %s" % (host.hostname , host.hwaddr))
	p = run_cmd("sh /opt/openstack/scripts/delete_host.sh %s %s" % (host.hostname , host.hwaddr))
	#p.communicate()[0]
	logger.info(p[1])
	if p[0]!=0:
		logger.error("script error:" + str(p[1]))
	else:
		logger.info("script result:" + str(p[1]))


@task(ignore_result=True)
def add_puppet_node(host,callback=puppet_run):
	logger.info("sh add_puppet_node script")
	logger.info("sh /opt/openstack/scripts/add_puppet_node.sh %s %s" % (host.static_ip , host.hostname))
	p = run_cmd("sh /opt/openstack/scripts/add_puppet_node.sh %s %s" % (host.static_ip , host.hostname))
	ret = subtask(callback).delay(host.hostname)
	time.sleep(250)
	if ret.ready():
		logger.info("succeeded to deploy cc.")
	else:
		logger.info("failed to deploy cc on host %s " % host.hostname)
	logger.info(p[1])
	if p[0]!=0:
		logger.error("script error:" + str(p[1]))
	else:
		logger.info("script result:" + str(p[1]))
		
#deprecated
@task(ignore_result=True)
def add_host_from_file(batch_file_dir):
	logger.info("sh add_host_from_file script")
	logger.info("sh /opt/openstack/scripts/add_host_from_file.sh %s" % batch_file_dir)
	p = run_cmd("sh /opt/openstack/scripts/add_host_from_file.sh %s" % batch_file_dir)
	logger.info(p[1])
	if p[0]!=0:
		logger.error("script error:" + str(p[1]))
	else:
		logger.info("script result:" + str(p[1]))
	
@task(ignore_result=True)
def deploytask(iso_addr):
	f = open(DEPLOY_RESULT_PATH,'w')
	f.write('0')
	f.close()
	logger.info("sh /opt/openstack/scripts/deploy.sh %s" % iso_addr)
	p = run_cmd("sh /opt/openstack/scripts/deploy.sh %s" % iso_addr)
	logger.info("script result:" + str(p[1]))
	if p[0]!=0:		
		logger.error("script error:" + str(p[1]))
		f = open(DEPLOY_RESULT_PATH,'w')
		f.write('2')
		f.close()
		
#@task(ignore_result=True)
#def test(mits):
#	p = run_cmd("sleep %s" % mits)
#	print p
