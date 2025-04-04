const pathfs = require('path');
const { readFileSync, existsSync } = require('fs');
const ts = require('typescript');

process.on('message', (/** @type {string} */cwd) => {
  const tsConfigPath = pathfs.resolve(cwd, 'tsconfig.json');
  const jsConfigPath = pathfs.resolve(cwd, 'jsconfig.json');
  let configPath = pathfs.resolve(__dirname, 'defaultJsConfig.json');
  if (existsSync(tsConfigPath)) {
    configPath = tsConfigPath;
  } else if (existsSync(jsConfigPath)) {
    configPath = jsConfigPath;
  }
  const tsconfigFile = ts.readJsonConfigFile(configPath, (path) => readFileSync(path, { encoding: 'utf-8' }));
  const config = ts.parseJsonSourceFileConfigFileContent(
    tsconfigFile,
    {
      useCaseSensitiveFileNames: true,
      readDirectory: ts.sys.readDirectory,
      readFile: ts.sys.readFile,
      fileExists: ts.sys.fileExists,
    },
    cwd,
  );
  if (existsSync(pathfs.resolve(cwd, 'node_modules', '@types'))) {
    if (!config.options.typeRoots) config.options.typeRoots = [];
    config.options.typeRoots.push(pathfs.resolve(cwd, 'node_modules', '@types'));
  }
  const typescriptProgram = ts.createProgram(config.fileNames, {
    ...config.options,
    noEmit: true,
    resolveJsonModule: true,
    checkJs: true,
  });

  const errCodeMapping = {
    [ts.DiagnosticCategory.Error]: 'error',
    [ts.DiagnosticCategory.Warning]: 'warning',
    [ts.DiagnosticCategory.Suggestion]: 'info',
  };
  const errorTypes = Object.keys(errCodeMapping).map((key) => +key);
  const errorFilter = (/** @type {ts.Diagnostic} */result) => errorTypes.includes(result.category)
    && !result.file?.fileName?.includes('node_modules')
    && !result.file?.fileName?.includes('.spec.');
  const results = ts.getPreEmitDiagnostics(typescriptProgram)
    .filter(errorFilter)
    .map((err) => {
      if (!err.file) return null;
      const start = err.start || 0;
      const lines = err.file.text.substring(0, start).split('\n');
      const line = lines.length;
      const column = start - lines.slice(0, lines.length - 1).join().length;
      return {
        code: err.code,
        // @ts-ignore
        category: errCodeMapping[err.category],
        fileName: err.file.fileName.replace(cwd, ''),
        line,
        column,
        path: `${err.file.fileName}:${line}:${column}`,
        messageText: typeof err.messageText === 'string'
          ? err.messageText
          : err.messageText.messageText,
      };
    })
    .filter((a) => a);
  process.send?.(results);
});
