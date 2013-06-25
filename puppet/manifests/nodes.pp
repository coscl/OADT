$os_type="rhel6.4"
class deploy{
        file{ "/opt/openstack/stack.py":
                ensure => present,
                alias => "stack.py",
                source => "puppet:///files/$os_type/stack.py",
                owner => root,
                group => root,
                mode => 755;
        }

        file{ "/opt/openstack/nova.conf":
                ensure => present,
                alias => "nova.conf",
                source => "puppet:///files/nova.conf",
                owner => root,
                group => root,
                mode => 640;
        }

        file{ "/opt/openstack/keystoneinit.py":
                ensure => present,
                alias => "keystoneinit.py",
                source => "puppet:///files/keystoneinit.py",
                owner => root,
                group => root,
                mode => 755;
        }

        file{ "/opt/openstack/config.yaml":
                ensure => present,
                alias => "config.yaml",
                source => "puppet:///files/config.yaml",
                owner => root,
                group => root,
                mode => 644;
        } 
        
        file{ "/opt/openstack/role.yaml":
                ensure => present,
                alias => "role.yaml",
                source => "puppet:///files/role.yaml",
                owner => root,
                group => root,
                mode => 644;
        }       

        file{ "/opt/openstack/logmonitor.py":
                ensure => present,
                alias => "logmonitor.py",
                source => "puppet:///files/logmonitor.py",
                owner => root,
                group => root,
                mode => 644;
        }

        file{ "/opt/openstack/basefunction.py":
                ensure => present,
                alias => "basefunction.py",
                source => "puppet:///files/basefunction.py",
                owner => root,
                group => root,
                mode => 644;
        }
 

        exec{ "ospc":
                cwd => "/opt/openstack" ,
                command => "/usr/bin/python /opt/openstack/stack.py",
                require => File["/opt/openstack/stack.py","/opt/openstack/nova.conf","/opt/openstack/keystoneinit.py","/opt/openstack/config.yaml","/opt/openstack/role.yaml","/opt/openstack/logmonitor.py","/opt/openstack/local.yaml","/opt/openstack/basefunction.py"],
                path => ["/bin", "/usr/bin","/sbin","/usr/sbin"],
                subscribe => File["/opt/openstack/role.yaml","/opt/openstack/local.yaml"],
                refreshonly => true
        }

        exec{ "rm":
                command => "sed -i '/start.sh/d' /etc/rc.local",
                path => ["/bin", "/usr/bin"],
        }
}


node default {
}
