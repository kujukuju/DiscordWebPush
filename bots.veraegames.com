# SSL server configuration
server {
	listen 4002 ssl http2;
	listen [::]:4002 ssl http2;

	# SSL certs
	ssl_certificate /etc/letsencrypt/live/bots.veraegames.com/fullchain.pem;
	ssl_certificate_key /etc/letsencrypt/live/bots.veraegames.com/privkey.pem;

	# Improve performance with session resumption
	ssl_session_cache shared:SSL:10m;
	ssl_session_timeout 10m;

	# Enable server-side protection against BEAST attacks
	ssl_protocols TLSv1.2;
	ssl_prefer_server_ciphers on;
	ssl_ciphers "ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA384";

	# https://developer.mozilla.org/en-US/docs/Security/HTTP_Strict_Transport_Security
	add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

	# https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
	add_header X-Frame-Options DENY always;

	# https://developer.mozilla.org/en-IZ/docs/Web/HTTP/Headers/X-Content-Type-Options
	add_header X-Content-Type-Options nosniff always;

	location / {
		proxy_pass http://localhost:4000;
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection 'upgrade';
		proxy_set_header Host $host;
		proxy_cache_bypass $http_upgrade;
	}
}
