Auto Starting (systemd)
----
If using systemd, install the water-heater-monitor.service file with the following command:

    sudo ln -sf ~/water-heater-monitor/systemd/water-heater-monitor.service /etc/systemd/system/

Then enable it with the following:

    sudo systemctl enable water-heater-monitor
    sudo systemctl start water-heater-monitor

Of course the opposite is:

    sudo systemctl stop water-heater-monitor
    sudo systemctl disable water-heater-monitor

Status checks can be done with:

    systemctl status water-heater-monitor

And log checks with:

    journalctl -u water-heater-monitor

-30-
