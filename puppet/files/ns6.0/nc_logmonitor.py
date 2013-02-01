#!/usr/bin/python

import os
import time
import sys

#logfile=r'/opt/inst-deploy.log'
logfile=r'/tmp/tmp.txt'

server_ip=sys.argv[1]

def nc_transport(line):
    hostname = os.popen("hostname").read().rstrip()
    os.system("telnet "+server_ip+" 3337 &")
    time.sleep(2)
    os.system("echo \""+hostname+":"+line+"\" | nc "+server_ip+ " 9999")

def log_read():
    try:
        with open(logfile, 'r+') as log:
            while 1:
                data = log.readline()
                print data
                if not data:
                    break
                else:
                    nc_transport(data)
    except IOError, e:
        print "Failed to open file %s" % e
        return

if __name__=="__main__":
    #hostname = os.popen("hostname").read().rstrip()
    #print hostname
    log_read()
