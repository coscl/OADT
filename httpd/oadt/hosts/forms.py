from django import forms
from models import Host


class HostForm(forms.ModelForm):
	class Meta:
		model = Host

class ConfigForm(forms.Form):
	subnet_ip = forms.CharField(max_length=20)
	subnet_netmask = forms.CharField(max_length=20)
	range_ip_start = forms.CharField(max_length=20)
	range_ip_stop = forms.CharField(max_length=20)
	gateway_ip = forms.CharField(max_length=20)
	netmask_ip = forms.CharField(max_length=20)
	dns_ip = forms.CharField(max_length=20)
	iso_addr = forms.CharField(max_length=255)
