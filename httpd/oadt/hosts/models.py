from django.db import models
from datetime import datetime
# Create your models here.

#CHOICE = (('CC,KEYSTONE,DASHBOARD,GLANCE','CC,KEYSTONE,DASHBOARD,GLANCE'),('NC','NC'))
STATUS_CHOICE = (('added','added'),('installed','installed'),('deploying','deploying'),('deployed','deployed'))	
	
class Host(models.Model):
    hostname = models.CharField(max_length=25,primary_key=True, blank=False)
    static_ip = models.CharField(max_length=20,unique = True)
    timestamp = models.DateTimeField(default=datetime.now,blank=True)
    status = models.CharField(max_length=20,choices=STATUS_CHOICE,null=True)
    #role = models.CharField(max_length=50, choices=CHOICE, null=True)
    #roles = models.ManyToManyField(Role,null=True,blank=True) 
    hwaddr = models.CharField(max_length=20,blank=True,unique = True)
    def __str__(self):
        return self.hostname
    class Meta:
        ordering = ["hostname"]

class CCRole(models.Model):
	name = models.CharField(max_length = 20,primary_key = True)
	host = models.ForeignKey(Host,null=True,blank=True,on_delete=models.SET_NULL)
	def __unicode__(self):
		return self.name
