# uw-lib-logger.js

Tiny wrapper around bunyan offering some better 'defaults'.

## Changes

ERRORs will be printed to SRDERR, everything else to STDOUT.

'level' has been translated into a string under 'severity' key.

Standard bunyan req serializer for req field.

Custom error serializer for err field. Will display basic error information as well as 'previous' error if key exists on processed error (see example);
