ARG CADDY_VERSION

FROM caddy:${CADDY_VERSION}-alpine

COPY ./start-caddy.sh /usr/bin/start-caddy.sh

RUN chmod 755 /usr/bin/start-caddy.sh

CMD /usr/bin/start-caddy.sh
