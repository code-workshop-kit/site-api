#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 -v USER="$POSTGRES_USER" -U "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE cwk_site_api;
    GRANT ALL PRIVILEGES ON DATABASE cwk_site_api TO :USER;
    CREATE DATABASE cwk_site_api_test;
    GRANT ALL PRIVILEGES ON DATABASE cwk_site_api_test TO :USER;
EOSQL