DIR=/opt/openstack

PXE_CFG_DIR=/var/lib/tftpboot/pxelinux.cfg

while read line
do
    if [ "$line" == "" ];then
        continue
    fi
    if [ "${line:0:1}" == "#" ];then
        continue
    fi

    ip_addr=`echo $line|awk '{print $1}'`
    mac_addr=`echo $line|awk '{print $2}'`
    hostname=`echo $line|awk '{print $3}'`

    ping -c 2 $ip_addr

    if [ $? -eq 0 ];then
        cat $PXE_CFG_DIR/$mac_addr | grep "LOCALBOOT"
        if [ $? -eq 0 ];then
            status="Installed"
            ssh $hostname
            status=`sed -n "1p" /etc/hoststatus.conf`
        else
            status="Not installed"  
    else
        status="stopped"
    fi


done  < ./host.template
