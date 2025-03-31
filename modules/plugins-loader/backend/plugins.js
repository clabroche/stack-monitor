const plugins = {
  bugs: require('@clabroche/modules-bugs-backend'),
  configuration: require('@clabroche/modules-configuration-backend'),
  devOps: require('@clabroche/modules-dev-ops-backend'),
  diff: require('@clabroche/modules-diff-backend'),
  documentation: require('@clabroche/modules-documentation-backend'),
  finder: require('@clabroche/modules-finder-backend'),
  git: require('@clabroche/modules-git-backend'),
  github: require('@clabroche/modules-github-backend'),
  globalScripts: require('@clabroche/modules-global-scripts-backend'),
  httpClient: require('@clabroche/modules-http-client-backend'),
  jsonFormatter: require('@clabroche/modules-json-formatter-backend'),
  jwt: require('@clabroche/modules-jwt-backend'),
  kanban: require('@clabroche/modules-kanban-backend'),
  logs: require('@clabroche/modules-logs-backend'),
  mongo: require('@clabroche/modules-mongo-backend'),
  nodeRepl: require('@clabroche/modules-node-repl-backend'),
  npm: require('@clabroche/modules-npm-backend'),
  openai: require('@clabroche/modules-openai-backend'),
  regex: require('@clabroche/modules-regex-backend'),
  sqlBeautifier: require('@clabroche/modules-sql-beautifier-backend'),
  toolbox: require('@clabroche/modules-toolbox-backend'),
  uuid: require('@clabroche/modules-uuid-backend'),
  help: require('@clabroche/modules-help-backend'),
  openapi: require('@clabroche/modules-openapi-backend'),
  vscode: require('@clabroche/modules-vscode-backend'),
  docker: require('@clabroche/modules-docker-backend'),
  nodered: require('@clabroche/modules-workflows-backend'),
};
module.exports = Object.keys(plugins).reduce((acc, key) => {
  if (plugins[key].enabled) acc[key] = plugins[key];
  return acc;
}, {});
