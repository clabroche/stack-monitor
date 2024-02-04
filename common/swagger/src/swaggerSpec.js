const path = require('path');
const { getPackageInfos } = require('workspace-tools');
const { readJsonSync } = require('fs-extra');
const swaggerJSDoc = require('swagger-jsdoc');
const marked = require('marked');
const { existsSync, readFileSync } = require('fs');

function getDependencies(baseUrl, packageName, recursiveAggr = []) {
  const dependencies = (getPackageInfos(baseUrl)[packageName]?.dependencies || {});
  const devDependencies = (getPackageInfos(baseUrl)[packageName]?.devDependencies || {});
  const deps = [
    ...Object.keys(dependencies),
    ...Object.keys(devDependencies),
  ].filter((f) => f.startsWith('@clabroche') && (dependencies[f] === 'workspace:*' || devDependencies[f] === 'workspace:*'));
  deps.forEach((f) => {
    if (!recursiveAggr.includes(f)) {
      recursiveAggr.push(f);
      deps.map((dep) => getDependencies(baseUrl, dep, recursiveAggr)).flat();
    }
  });
  return recursiveAggr;
}

async function getReadme(baseUrl) {
  let file = '';
  ['Readme.md', 'README.md', 'README.MD', 'readme.md'].forEach((readme) => {
    const readmePath = path.resolve(baseUrl, readme);
    if (existsSync(readmePath)) {
      file = readFileSync(readmePath, 'utf-8');
    }
  });
  return file;
}

async function getOpenApi({
  appVersion, baseUrl, appName, additionalSwaggerPaths = [],
}) {
  const packageJson = readJsonSync(path.resolve(baseUrl, 'package.json'));
  const addworkingPackages = getDependencies(baseUrl, packageJson.name);

  const readme = `
    <details>
      <summary>Readme</summary>
      ${marked.parse(await getReadme(baseUrl))}`
    .trim();

  /**
   * Documentation
   */
  return {
    definition: {
      openapi: '3.0.3',
      info: {
        title: `API ${appName || packageJson?.name}`,
        description: readme,
        version: appVersion || packageJson?.version,
      },
    },
    apis: [
      ...additionalSwaggerPaths,
      `${__dirname}/auth.js`,
      ...['.ts', '.js', '.swagger.yml', '.swagger.yaml'].map((ext) => `${baseUrl}/src/**/*${ext}`),
      ...addworkingPackages.flatMap((packageName) => [
        ...['.ts', '.js', '.swagger.yml', '.swagger.yaml'].map((ext) => `${baseUrl}/node_modules/${packageName}/src/**/*${ext}`),
        ...['.ts', '.js', '.swagger.yml', '.swagger.yaml'].map((ext) => `${baseUrl}/../../../node_modules/${packageName}/src/**/*${ext}`),
      ]),
    ],
  };
}

module.exports = {
  getOpenApi,
  async getSwaggerSpec({
    appVersion = '', baseUrl, appName = '', additionalSwaggerPaths = [],
  }) {
    const swaggerSpec = await swaggerJSDoc(await getOpenApi({
      appVersion, baseUrl, appName, additionalSwaggerPaths,
    }));
    return swaggerSpec;
  },
};
