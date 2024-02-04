const pathfs = require('path');
const additionalDeps = require('./additionalDeps');

describe('Gulp > additionalDeps', () => {
  it('getAdditionalDeps', async () => {
    const additionalDepsRes = await additionalDeps.getAdditionalDeps(pathfs.resolve(__dirname, '..'));
    expect(additionalDepsRes).toHaveLength(2);
    expect(additionalDepsRes[0].name).toEqual('@clabroche/common-jest');
    expect(additionalDepsRes[1].name).toEqual('@clabroche/common-retrigger-all-build');
  });
  it('getPkgJSON', async () => {
    const additionalDepsRes = await additionalDeps.getPkgJSON(pathfs.resolve(__dirname, '..', '..', 'express-logger'));
    expect(additionalDepsRes.name()).toEqual('@clabroche/common-express-logger');
    expect(additionalDepsRes.file().name).toEqual(additionalDepsRes.name());
    expect(additionalDepsRes.file().version).toEqual(additionalDepsRes.version());
  });
});
