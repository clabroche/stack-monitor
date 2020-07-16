# Stack Monitor

[![DeepScan grade](https://deepscan.io/api/teams/10201/projects/12903/branches/207230/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=10201&pid=12903&bid=207230)

Monitor processes as a stack 

## Install
``` npm i -g @iryu54/stack-monitor ```


## Usage
Create a config file like: 
``` javascript
const path = __dirname
let BASE = "espace-des-marques"

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
      env: Object.assign({
        PORT: "3010",
        mongoDbURL: `mongodb://root:123456@localhost:27017/${BASE}?authSource=admin`,
      }, process.env)
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
      env: Object.assign({
        VUE_APP_API_URL: "http://localhost:3010"
      }, process.env)
    }
  },
]
```

Then, in a terminal:
``` bash
stack-monitor <path/to/my/config>
```

This will show: 
![Menu](https://raw.githubusercontent.com/clabroche/stack-monitor/master/README/1.png)
![Menu](https://raw.githubusercontent.com/clabroche/stack-monitor/master/README/2.png)

