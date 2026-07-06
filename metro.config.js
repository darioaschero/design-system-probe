const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const dsEntry = path.resolve(projectRoot, 'ds/nuri/index.ts');

const config = getDefaultConfig(projectRoot);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@ds') {
    return { type: 'sourceFile', filePath: dsEntry };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
