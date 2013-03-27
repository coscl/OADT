from django.conf.urls import patterns, include, url

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
import settings
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'oadt.views.home', name='home'),
    # url(r'^oadt/', include('oadt.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^index/$','hosts.views.index'),
    url(r'^index/hosts/$','hosts.views.hosts'),
    url(r'^host/$','hosts.views.host'),
    url(r'^index/host/add','hosts.views.add'),
    url(r'^index/host/(?P<hostname>\w+)/delete$','hosts.views.delete'),
    url(r'^index/host/(?P<hostname>\w+)/log$','hosts.views.hostlog'),
    url(r'^index/host/(?P<hostname>\w+)/config$','hosts.views.config'),
    url(r'^index/host/(?P<hostname>\w+)/roles$','hosts.views.roles'),
    url(r'^index/host/(?P<hostname>\w+)/deploy$','hosts.views.deploy'),   
    url(r'^index/batch_add$','hosts.views.batch_add'),
    url(r'^index/dhcp$','hosts.views.dhcp'),
    url(r'^index/ostype$','hosts.views.ostype'),    
    url(r'^index/iso$','hosts.views.iso'),
    url(r'^index/cdpoint$','hosts.views.cdpoint'),
    url(r'^index/hosttemplate$','hosts.views.hosttemplate'),    
    url(r'^index/deployresult$','hosts.views.deployresult'), 
    #url(r'^admin/', include(admin.site.urls)),
    (r'^static/(?P<path>.*)$','django.views.static.serve',{'document_root': settings.STATIC_URL}),
)
