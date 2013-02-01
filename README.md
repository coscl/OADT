openstack_deploy
================

openstack deploy project for COSCL

Steps

1 Set the cobbler Server
    Install OS : NeoKylin Server 6.0
    mkdir /opt/openstack/
    cd /opt/openstack
    Download the Source code
    
2 Configure the cobbler Server
    set the network
    set the hostname
    Edit config/openstack_deploy.conf
    Edit config/os_deploy.conf
    add host config/host.template
    mount the NeoKylin Server 6.0 cd or iso to /mnt    
 
    sh install.sh
    sh deploy.sh

3 Start up the client
