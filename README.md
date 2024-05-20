# inline-caddy

A caddy image which built on top of official caddy docker image, but with additional
script to make it configured through single docker-compose file posible.

```yaml
# docker-compose.yml

services:
  proxy:
    image: eslym/inline-caddy
    restart: always
    ports:
      - 80:80
      - 443:443
    environment:
      # no more caddyfile mounting!
      CADDY_CONFIG: |
        example.com {
            reverse_proxy /api/* http://backend:80
            reverse_proxy * http://frontend
        }
  backend:
    ...
  frontend:
    ...
```
