---
outline: deep
---
# Vscode

## Snippet

Add this in your vscode to print variables easily in debug output of service:
``` json
"Print to stack-monitor": {
  "prefix": "log",
  "body": [
    "console.log(JSON.stringify(['stack-monitor', $1]));",
    "$2"
  ],
  "description": "Print to stack-monitor"
}
```

Type ```log``` in vs code, it should produce something like that:

``` javascript 
console.log(JSON.stringify(['stack-monitor', <what you want>, <and others>]));
```
