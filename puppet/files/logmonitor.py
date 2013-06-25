#!/usr/bin/python

import os
import time

#logfile=r'/opt/inst-deploy.log'
logfile=r'/tmp/tmp.txt'

def nc_transport(server_ip , line):
    hostname = os.popen("hostname").read().rstrip()
    os.system("telnet "+server_ip+" 3337 &")
    time.sleep(2)
    os.system("echo '"+hostname+":"+line+"' | nc "+server_ip+ " 9999")

def log_read(server_ip):
    try:
        with open(logfile, 'r+') as log:
            while 1:
                data = log.readline()
                print data
                if not data:
                    break
                else:
                    nc_transport(server_ip,data)
    except IOError, e:
        print "Failed to open file %s" % e
        return
