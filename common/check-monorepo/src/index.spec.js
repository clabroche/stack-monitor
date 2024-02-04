const pathfs = require('path');
const fse = require('fs');
const { checkIfAllWorkspacesAreLinkedToYarn, checkIfAllWorkspacesAreLinkedToLerna, getWorkspaces } = require('./searchForWorkspaces');

describe('Workspaces binding', () => {
  it('All workspaces should be bind to Yarn', () => {
    checkIfAllWorkspacesAreLinkedToYarn();
  });
  it('All workspaces should be bind to Lerna', () => {
    checkIfAllWorkspacesAreLinkedToLerna();
  });
});

describe('Workspaces naming', () => {
  it('All packages should have correct names', () => {
    const rootDir = pathfs.resolve(__dirname, '../../..');
    getWorkspaces().forEach((workspace) => {
      const expectedName = workspace.path
        .replace(`${rootDir}/`, '')
        .split('/')
        .join('-');
      const rootName = require(pathfs.resolve(rootDir, 'package.json')).name;
      const prefix = rootName.split('/').length === 2 // If is a scoped package
        ? rootName.split('/')[0]
        : null;
      if(workspace.packageJSON.name === '@iryu54/stack-monitor') return
      if (prefix) {
        expect(workspace.packageJSON.name).toBe(`${prefix}/${expectedName}`);
      } else {
        expect(workspace.packageJSON.name).toBe(expectedName);
      }
    });
  });
});

describe('Dependencies', () => {
  describe('All packages should inherit from the retrigger-all-build package', () => {
    const workspaces = getWorkspaces();
    const retriggerAllPackage = workspaces.find((w) => w.packageJSON.name.includes('retrigger-all-build'));
    if (!retriggerAllPackage) return;
    workspaces
      .filter((workspace) => workspace.packageJSON.name !== retriggerAllPackage.packageJSON.name)
      .forEach((workspace) => {
        it(`${workspace.packageJSON.name} should have a devDependencies section`, () => {
          if (!fse.readdirSync(workspace.path).includes('.independant')) {
            expect(workspace.packageJSON.devDependencies).not.toBeFalsy();
          }
        });
        it(`${workspace.packageJSON.name} should inherit from the retrigger-all-build package`, () => {
          if (!fse.readdirSync(workspace.path).includes('.independant')) {
            expect(workspace.packageJSON.devDependencies).toMatchObject({
              [retriggerAllPackage.packageJSON.name]: 'workspace:*',
            });
          }
        });
      });
  });
  describe('All packages should have a test script', () => {
    const workspaces = getWorkspaces();
    const retriggerAllPackage = workspaces.find((w) => w.packageJSON.name.includes('retrigger-all-build'));
    if (!retriggerAllPackage) return;
    workspaces
      .filter((workspace) => workspace.packageJSON.name !== retriggerAllPackage.packageJSON.name)
      .forEach((workspace) => {
        it(`${workspace.path} should have a test script`, () => {
          if (!fse.readdirSync(workspace.path).includes('.independant')) {
            expect(workspace.packageJSON.scripts?.test).toEqual(expect.any(String));
          }
        });
      });
  });
});

describe('Files', () => {
  describe('All packages should have a npmrc to the root of package', () => {
    getWorkspaces().forEach((workspace) => {
      it(`${workspace.packageJSON.name} should have a npmrc to the root of package`, () => {
        const hasNpmRC = fse.existsSync(pathfs.resolve(workspace.path, '.npmrc'));
        expect(hasNpmRC).toBe(true);
      });
    });
  });
  describe('All packages should not have a packagelock to the root of package', () => {
    getWorkspaces().forEach((workspace) => {
      it(`${workspace.packageJSON.name} should not have a packagelock to the root of package`, () => {
        const hasPackageLock = fse.existsSync(pathfs.resolve(workspace.path, 'package-lock.json'));
        expect(hasPackageLock).toBe(false);
      });
    });
  });
});

// describe('Jest', () => {
//   getWorkspaces().filter((workspace) => fse.existsSync(pathfs.resolve(workspace.path, 'jest.config.js'))
//       || fse.existsSync(pathfs.resolve(workspace.path, 'jest.config.ts'))).forEach((workspace) => {
//     it(`${workspace.packageJSON.name} should depend on Jest sonar reporter in devDependencies`, () => {
//       if (!workspace.packageJSON.devDependencies['jest-sonar-reporter']) {
//         expect(undefined).toBe('jest-sonar-reporter: ^2.0.0');
//       }
//       expect(workspace.packageJSON.devDependencies['jest-sonar-reporter']).toBe('^2.0.0');
//     });
//   });
// });

describe('Publish config', () => {
  getWorkspaces().filter((workspace) => fse.existsSync(pathfs.resolve(workspace.path, 'package.json'))).forEach((workspace) => {
    it(`${workspace.packageJSON.name} should not been in private mode`, () => {
      if(workspace.packageJSON.name === '@iryu54/stack-monitor') return
      if(!workspace.packageJSON.private) {
        expect(workspace.path+ '/package.json').toBe('to be in private mode')
      }
    });
    it(`${workspace.packageJSON.name} should have a repository field`, () => {
      if (!workspace.packageJSON.repository) {
        expect(undefined).toBe('"repository": "https://github.com/clabroche/stack-monitor",');
      }
      expect(workspace.packageJSON.repository).toBe('https://github.com/clabroche/stack-monitor');
    });
  });
});
// "postinstall": "yarn workspaces foreach --since exec npx check-peer-dependencies --yarn --install || true",
