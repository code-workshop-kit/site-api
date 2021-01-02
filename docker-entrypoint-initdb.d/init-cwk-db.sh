#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 -v USER="$POSTGRES_USER" -U "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE site_api;
    GRANT ALL PRIVILEGES ON DATABASE site_api TO :USER;
    CREATE DATABASE site_api_test;
    GRANT ALL PRIVILEGES ON DATABASE site_api_test TO :USER;
EOSQL