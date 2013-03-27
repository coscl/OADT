openstack_deploy
================

openstack deploy project for COSCL

Steps

1 安装部署源(所有主机网卡请使用eth0)
    1)Install OS : NeoKylin Server 6.0（在安装过程中选择虚拟化组件）
    2)修改主机名
    3)mkdir /opt/openstack/
    4)cd /opt/openstack
    5)Download the Source code
    
    
2 执行安装脚本
    sh /opt/openstack/install_ns6.0.sh（确保代码在正确的路径）

3 登录web界面
    server_ip:8000/index




ps:功能正在逐步完善中(节点批量导入还有问题，测试时请使用单个节点添加)，欢迎大家测试使用，如有使用问题，请联系我
Email:tao.jiang@cs2c.com.cn


