"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""

from django.test import TestCase
from hosts.models import Host,Role
from django.test.client import Client 

class HostTest(TestCase):
        
    def setUp(self):
         r = Role.objects.create(name="a")   
         r.save()
         r = Role.objects.create(name="b")   
         r.save()
         self.assertEqual(len(Role.objects.all()), 2)
         
    def test_add_host(self):
        """
        Tests that add one host.
        """
        client = Client()
        resp = client.post('/index/host/add',{"hostname":"host_test","static_ip":"10.1.81.222","status":"added","hwaddr":"11:11:11:11:22:22","timestamp":"2013-01-22 12:22:22"})
        print resp.content
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.content,"True")
    def test_update_host(self):
        """
        Tests that update one host.
        """
        client2 = Client()
        resp2 = client2.post("/index/host/host_test/update",{"roles":"a","roles":"b","hostname":"host_test","static_ip":"10.1.81.222","status":"added","hwaddr":"11:11:11:11:22:22","timestamp":"2013-01-22 12:22:22"})
        print resp2.content
        self.assertEqual(resp2.status_code, 200)
        self.assertEqual(resp2.content,"True")
