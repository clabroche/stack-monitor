# First Launch

When you connect for the first time, **Stack Monitor** will initialize files in a folder named `.stackmonitor` at the location you specified.

## Example

By running the following command:

```bash
stack-monitor /home/myuser/Project/awesome-project
```

The configurations will be written to:

```
/home/myuser/Project/awesome-project/.stackmonitor
```

## Security

Each file managed by Stack Monitor is encrypted with a key. You can find this key at:

```
/home/myuser/Project/awesome-project/.stackmonitor/dbs/encryption-key.json
```

Alternatively, you can access it via the web interface under:

```
/settings -> Encryption
```

For more information about the security measures used, visit the [security reference](/reference/security).

## Collaboration

This folder can be shared in the repository or by any other means with your team. This allows for the sharing of configurations necessary to launch your application, as well as all environment variables required for the launch.

## Next Steps

After initialization, Stack Monitor will open a web interface, allowing you to create your first service.
```

This version uses headings, code blocks, and links to make the information clear and easy to navigate.