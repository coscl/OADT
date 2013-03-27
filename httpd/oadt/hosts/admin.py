#!/usr/bin/python
import django
from hosts.models import Host,CCRole
from django.contrib import admin
admin.site.register(Host)
admin.site.register(CCRole)
