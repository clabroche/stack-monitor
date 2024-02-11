# Stack Monitor

[![DeepScan grade](https://deepscan.io/api/teams/10201/projects/12903/branches/207230/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=10201&pid=12903&bid=207230)

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=clabroche_stack-monitor&metric=alert_status)](https://sonarcloud.io/dashboard?id=clabroche_stack-monitor)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=clabroche_stack-monitor&metric=code_smells)](https://sonarcloud.io/dashboard?id=clabroche_stack-monitor)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=clabroche_stack-monitor&metric=bugs)](https://sonarcloud.io/dashboard?id=clabroche_stack-monitor)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=clabroche_stack-monitor&metric=sqale_index)](https://sonarcloud.io/dashboard?id=clabroche_stack-monitor)

Launch multiples command at once. You can monitor projects.(like npm projects, git projects ...)

## Install
``` npm i -g @iryu54/stack-monitor ```

## Features
#### Command:
 - Launch multiple commands at once
 - Check in realtime logs produced by command
 - Restart process

#### Git
 - Stash / Stash pop
 - Pull if there is update in branch
 - View branches
 - Change branch
 - Reset branch 
 - Checkout file
 
#### Npm
 - Launch a script
 - Install 
 - Rebuild
 - Log of script in real time
 - Show all dependencies
 - Check if update exist for each dependency

#### Bugs
 - Check problems with typescript

#### Misc
 - Open folder in vscode
 - Open folder in explorer
 - Open Url for micro service
 - Open remote url of git

#### System
 - Show CPU percentage for global system
 - Show Mem percentage for global system
 - Show CPU percentage for each commands
 - Show Mem percentage for each commands

## Usage
Create a config file

Then, in a terminal, type:
``` bash
stack-monitor <path/to/my/config>
```

You can type only ```stack-monitor``` and choose your config file later.

If you change a variable in conf after execution, the corresponding service restart.

## Snippet

Add this in your vscode to print easily variables in debug output of service:
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

Example:

if you type this somewhere in server service: 

```javascript
console.log(JSON.stringify(['stack-monitor', "debug:", {port} ]));
```

Output should appeart in debug section of logs

