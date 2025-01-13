---
outline: deep
---

# Global Environment Variables

Stack Monitor can be launched with environment variables that modify its behavior or add features.

Ca peut vous permettre de les overrider depuis un .env par exemple 

Here is a table listing them:

| Name              | Default Value           | Description                                    |
|-------------------|-------------------------|------------------------------------------------|
| `HTTP_PORT_SERVER` | Random available port  | Launch Stack Monitor on the specified port.    |
| `STACK_MONITOR_DEFAULT_ENVIRONMENT` | LOCAL  | Launch Stack Monitor with specified environment    |
| `STACK_MONITOR_GH_APIKEY` |   | Enable github features     |
| `STACK_MONITOR_OPENAI_APIKEY` |   | Enable openai features     |

