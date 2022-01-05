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
Create a config file like: 
``` javascript
const path = __dirname
let BASE = "database"

module.exports = [
  {
    label: 'Server',
    description: 'This is the backend of an unbelievable project',
    git: {
      home: 'https://<an-awesome-url>',
      remote: 'git@github.com:<your-beautiful-profile>/<your-excellent-project>.git'
    },
    url: 'http://localhost:3010',
    spawnCmd: 'npm',
    spawnArgs: ['run', 'serve'],
    spawnOptions: {
      cwd: `${path}/server`,
      env: {
        PORT: "3010",
        mongoDbURL: `mongodb://root:123456@localhost:27017/${BASE}?authSource=admin`,
      }
    }
  },
  {
    label: 'Mongo',
    description: 'Just start the mongodb in docker',
    spawnCmd: 'docker',
    spawnArgs: ['start', 'mongo'],
  },
  {
    label: 'Front',
    description: 'This is the front of an unbelievable project',
    git: {
      home: 'https://<an-awesome-url>',
      remote: 'git@github.com:<your-beautiful-profile>/<your-excellent-project>.git'
    },
    url: 'http://localhost:8080',
    spawnCmd: 'npm',
    spawnArgs: ['run', 'serve'],
    spawnOptions: {
      cwd: `${path}/front`,
      env: {
        VUE_APP_API_URL: "http://localhost:3010"
      }
    }
  },
]
```

Then, in a terminal, type:
``` bash
stack-monitor <path/to/my/config>
```

You can type only ```stack-monitor``` and choose your config file later.

If you change a variable in conf after execution, the corresponding service restart.

## Screenshots
![Menu](https://raw.githubusercontent.com/clabroche/stack-monitor/master/README/1.png)
![Menu](https://raw.githubusercontent.com/clabroche/stack-monitor/master/README/2.png)
![Menu](https://raw.githubusercontent.com/clabroche/stack-monitor/master/README/3.png)
![Menu](https://raw.githubusercontent.com/clabroche/stack-monitor/master/README/4.png)
![Menu](https://raw.githubusercontent.com/clabroche/stack-monitor/master/README/5.png)
![Menu](https://raw.githubusercontent.com/clabroche/stack-monitor/master/README/6.png)
