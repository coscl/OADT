$os_type="ns6.0"
class deploy{
        file{ "/opt/openstack/stack.sh":
                ensure => present,
                alias => "stack.sh",
                source => "puppet:///files/$os_type/stack.sh",
                owner => root,
                group => root,
                mode => 755;
        }

        file{ "/opt/openstack/nova.conf":
                ensure => present,
                alias => "nova.conf",
                source => "puppet:///files/$os_type/nova.conf",
                owner => root,
                group => root,
                mode => 640;
        }

        file{ "/opt/openstack/keystone-init.py":
                ensure => present,
                alias => "keystone-init.py",
                source => "puppet:///files/$os_type/keystone-init.py",
                owner => root,
                group => root,
                mode => 755;
        }

        file{ "/opt/openstack/config.yaml":
                ensure => present,
                alias => "config.yaml",
                source => "puppet:///files/$os_type/config.yaml",
                owner => root,
                group => root,
                mode => 644;
        }

        file{ "/opt/openstack/nc_logmonitor.py":
                ensure => present,
                alias => "nc_logmonitor.py",
                source => "puppet:///files/$os_type/nc_logmonitor.py",
                owner => root,
                group => root,
                mode => 755;
        }


        exec{ "ospc":
                command => "/bin/bash /opt/openstack/stack.sh",
                require => File["/opt/openstack/stack.sh","/opt/openstack/nova.conf","/opt/openstack/keystone-init.py","/opt/openstack/config.yaml","/opt/openstack/nc_logmonitor.py","/opt/openstack/local.conf"],
                path => ["/bin", "/usr/bin","/sbin","/usr/sbin"],
        }

        exec{ "rm":
                command => "sed -i '/start.sh/d' /etc/rc.local",
                path => ["/bin", "/usr/bin"],
        }
}

class getpubkey {
        file{ "/root/.ssh/id_rsa.pub":
                ensure => present,
                alias => "id_rsa.pub",
                source => "puppet:///files/id_rsa.pub",
                owner => root,
                group => root,
                mode => 644;
        }

        file{ "/root/.ssh/id_rsa":
                ensure => present,
                alias => "id_rsa",
                source => "puppet:///files/id_rsa",
                owner => root,
                group => root,
                mode => 600;
        }

}

node default {
    include getpubkey
}
