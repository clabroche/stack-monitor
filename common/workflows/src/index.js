const fs = require('fs');
const pathfs = require('path');
const walker = require('./walker');

const root = pathfs.resolve(__dirname, '..', '..', '..');
const githubRoot = pathfs.resolve(root, '.github');
const workflowsRoot = pathfs.resolve(githubRoot, 'workflows');

const workflowTemplateDockerPath = pathfs.resolve(githubRoot, 'workflow-template-docker.yml');
const workflowTemplateDocker = fs.readFileSync(workflowTemplateDockerPath, 'utf-8');

const workflowTemplateTestPath = pathfs.resolve(githubRoot, 'workflow-template-test.yml');
const workflowTemplateTest = fs.readFileSync(workflowTemplateTestPath, 'utf-8');

const workflowTemplateDeployPath = pathfs.resolve(githubRoot, 'workflow-template-deploy.yml');
const workflowTemplateDeploy = fs.readFileSync(workflowTemplateDeployPath, 'utf-8');

const prependText = `
# Autogenerated by @clabroche/common-workflows package
# If you must edit this file, edit files in .github/workflow-*.yml
# Then launch "yarn ci:generate"

`;
(async () => {
  let files = await walker.import({ paths: ['.'] });
  files = files.sort((a, b) => a.localeCompare(b));
  await generateDeployWorkflows(files);
  await generateTestWorkflows();
})();
async function generateDeployWorkflows(files) {
  let workflow = workflowTemplateDeploy;
  workflow = prependText + workflow;

  // Generate docker steps
  const dockerfiles = files.filter((file) => file.endsWith('Dockerfile'));
  dockerfiles.forEach((dockerfilePath) => {
    const LOCATION = pathfs.dirname(dockerfilePath).split(root).join('').split(pathfs.sep)
      .filter((a) => a)
      .join('/');
    const NAME_ROUTE = pathfs.dirname(dockerfilePath).split(root).join('').split(pathfs.sep)
      .filter((a) => a)
      .join('-');
    workflow += `${workflowTemplateDocker
      .replaceAll(/{{LOCATION}}/gi, LOCATION)
      .replaceAll(/{{NAME_ROUTE_SANITIZED}}/gi, NAME_ROUTE.replaceAll('.', '_'))
      .replaceAll(/{{NAME_ROUTE}}/gi, NAME_ROUTE)}\n`;
  });
  fs.writeFileSync(pathfs.join(workflowsRoot, 'all-deploy.yml'), workflow);
}

async function generateTestWorkflows() {
  let workflow = workflowTemplateTest;
  workflow = prependText + workflow;
  fs.writeFileSync(pathfs.join(workflowsRoot, 'all-test.yml'), workflow);
}