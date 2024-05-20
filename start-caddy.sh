#!/bin/sh

CFG="${CADDY_CONFIG_FILE:-/etc/caddy/Caddyfile}"

if [[ ! -z "${CADDY_CONFIG}" ]]; then
    echo "${CADDY_CONFIG}" > $CFG
fi

caddy run --config $CFG --adapter caddyfile
