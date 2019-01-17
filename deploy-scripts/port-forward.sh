#run with a parameter of internal ip
sudo iptables -t nat -A PREROUTING -p tcp -i eth0 --dport 80 -j DNAT --to-destination $1:8081
 sudo iptables -A FORWARD -p tcp -d $1 --dport 8081 -m state --state NEW,ESTABLISHED
