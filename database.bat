cd /
C:
cd xampp
start /min xampp-control.exe

cd apache/bin
start httpd.exe

cd..
cd..
cd mysql/bin
start mysqld.exe

timeout 10
exit