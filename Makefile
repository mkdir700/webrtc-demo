run:
	http-server -S -C .\172.12.0.9.pem -K .\172.12.0.9-key.pem -p 5050
	
server:
	node server.js
	
cert:
	mkcert 172.12.0.9