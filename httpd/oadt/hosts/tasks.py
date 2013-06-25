#!/usr/bin/env python
# -*- coding: utf-8 -*-
from celery.task import task
from celery.task.sets import subtask
import logging,commands
from subprocess import Popen,PIPE
import time
import baseclass



DEPLOY_RESULT_PATH = "/opt/openstack/config/deploy_result.conf"
HOST_LOG_DIR = "/var/log/openstack/nodes/"

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
	logger.info("Start to add host %s" %host.hostname)
	#print host.hostname ,host.static_ip
	add_one_host = baseclass.add_one_host(host.static_ip, host.hostname ,host.hwaddr)
	add_one_host.done()
	
@task(ignore_result=True)
def delete_host(host):
	logger.info("Delete host %s" %host.hostname)
	delete_host = baseclass.delete_host(host.hostname , host.hwaddr)
	delete_host.done()


@task(ignore_result=True)
def add_puppet_node(host,callback=puppet_run):
	logger.info("sh add_puppet_node script")
	add_puppet_node = baseclass.add_puppet_node(host.static_ip , host.hostname)
	add_puppet_node.done()
	ret = callback(host.hostname)
	time.sleep(250)
	if ret.ready():
		logger.info("succeeded to deploy cc.")
	else:
		logger.info("failed to deploy cc on host %s " % host.hostname)
		
#deprecated
@task(ignore_result=True)
def add_host_from_file(batch_file_dir):
	add_hosts_from_file = baseclass.add_hosts_from_file(batch_file_dir)
	add_hosts_from_file.done()
	
@task(ignore_result=True)
def deploytask(iso_addr):
	logger.info("start to deploy cobbler server")
	deploy = baseclass.set_cobbler()
	deploy.done(iso_addr)
		
#@task(ignore_result=True)
#def test(mits):
#	p = run_cmd("sleep %s" % mits)
#	print p
