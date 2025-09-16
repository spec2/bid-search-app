#!/bin/sh
set -e

# Replace scram-sha-256 with md5 in the default pg_hba.conf
sed -i 's/scram-sha-256/md5/g' "$PGDATA/pg_hba.conf"

# Also ensure password encryption is md5 for new passwords
echo "password_encryption = md5" >> "$PGDATA/postgresql.conf"