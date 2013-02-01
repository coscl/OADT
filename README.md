openstack_deploy
================

openstack deploy project for COSCL

Steps

1 Set the cobbler Server

    Install OS : NeoKylin Server 6.0((Do remember to select the Virtualization Compunents.)

    mkdir /opt/openstack/

    cd /opt/openstack

    Download the Source code
    
2 Configure the cobbler Server

    set the network

    set the hostname

    Edit config/openstack_deploy.conf(node_cc_ip openstack controllor node ip address)

    Edit config/os_deploy.conf (configure cobbler server ip  and   dhcp  server )

    add host config/host.template(example: 192.168.10.1 xx:xx:xx:xx:xx:xx nodename)

    mount the NeoKylin Server 6.0 cd or iso to /mnt    
 
    sh install.sh

    sh deploy.sh

3 Start up the client
