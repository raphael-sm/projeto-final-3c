#!/bin/bash

set -e

echo "Setting Up File Storage"

php artisan storage:link --relative

exec "$@"