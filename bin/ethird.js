#!/usr/bin/env node
const fs = require('fs');
const program = require('commander');

program.version('v' + require('../package.json').version)
    .description('Egret third party tools');

program.command('create <name>')
    .alias('c')
    .option('-e, --egret-compiler-version [version]', 'the egret compiler version')
    .description('create Egret third party library project')
    .action(function (name,cmd) {
        let egretCompilerVersion = cmd.egretCompilerVersion ? cmd.egretCompilerVersion : '5.2.13';
        let project = 'egret-' + name;
        let base = './' + project;
        fs.mkdirSync(base, {recursive: true});
        fs.mkdirSync(base + '/libsrc', {recursive: true});
        fs.mkdirSync(base + '/libsrc/typings', {recursive: true});
        fs.writeFileSync(base + '/libsrc/typings/' + name + '.d.ts', '');
        fs.writeFileSync(base + '/libsrc/package.json',
            '{\n' +
            '  "name": "' + name + '",\n' +
            '  "typings": "typings/' + name + '.d.ts"\n' +
            '}'
        );
        fs.writeFileSync(base + '/libsrc/tsconfig.json',
            '{\n' +
            '  "compilerOptions": {\n' +
            '    "target": "es5",\n' +
            '    "noImplicitAny": false,\n' +
            '    "sourceMap": false,\n' +
            '    "outFile": "bin/' + name + '/' + name + '.js",\n' +
            '    "allowJs": true\n' +
            '  },\n' +
            '  "include": [\n' +
            '    "src/' + name + '.js"\n' +
            '  ]\n' +
            '}'
        );
        fs.writeFileSync(base + '/webpack.config.js',
            'module.exports = {\n' +
            '    entry:  __dirname + "/index.js",\n' +
            '    output: {\n' +
            '        path: __dirname + "/libsrc/src",\n' +
            '        filename: "' + name + '.js"\n' +
            '    }\n' +
            '}'
        );
        fs.writeFileSync(base + '/egretProperties.json',
            '{"compilerVersion": "' + egretCompilerVersion + '"}'
        );
        fs.writeFileSync(base + '/package.js',
            '{\n' +
            '  "name": "egret-' + name + '",\n' +
            '  "version": "1.0.0",\n' +
            '  "main": "index.js",\n' +
            '  "scripts": {\n' +
            '    "test": "echo \\"Error: no test specified\\" && exit 1"\n' +
            '  },\n' +
            '  "author": "",\n' +
            '  "license": ""\n' +
            '}'
        );
        fs.writeFileSync(base + '/index.js', '');
    });
program.parse(process.argv);

if (program.args.length === 0) {
    program.help()
}