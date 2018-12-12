#!/usr/bin/env node
const fs = require('fs');
const program = require('commander');
let childProcess = require('child_process');

function mkdir(path, option) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, option);
    }
}

function buildEgretThirdPackage(basePath, packageName) {
    mkdir(basePath, {recursive: true});
    mkdir(basePath + '/typings', {recursive: true});
    fs.writeFileSync(basePath + '/typings/' + packageName + '.d.ts', '');
    fs.writeFileSync(basePath + '/package.json',
        '{\n' +
        '  "name": "' + packageName + '",\n' +
        '  "typings": "typings/' + packageName + '.d.ts"\n' +
        '}'
    );
    fs.writeFileSync(basePath + '/tsconfig.json',
        '{\n' +
        '  "compilerOptions": {\n' +
        '    "target": "es5",\n' +
        '    "noImplicitAny": false,\n' +
        '    "sourceMap": false,\n' +
        '    "outFile": "bin/' + packageName + '/' + packageName + '.js",\n' +
        '    "allowJs": true\n' +
        '  },\n' +
        '  "include": [\n' +
        '    "src/' + packageName + '.js"\n' +
        '  ]\n' +
        '}'
    );
}

program.version('v' + require('../package.json').version)
    .description('Egret third party tools');

program.command('create <name>')
    .alias('c')
    .option('-e, --egret-compiler-version [version]', 'the egret compiler version')
    .description('create Egret third party library project')
    .action(function (name, cmd) {
        let egretCompilerVersion = cmd.egretCompilerVersion ? cmd.egretCompilerVersion : '5.2.13';
        let project = 'egret-' + name;
        let base = './' + project;
        mkdir(base, {recursive: true});
        buildEgretThirdPackage(base + '/libsrc', name);
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

function initProjectTsconfigJson(base, packageName) {
    let tsconfig = JSON.parse(fs.readFileSync(base + '/tsconfig.json'));
    if (!tsconfig) {
        console.error("tsconfig.json not found!\n");
        return;
    }
    if (tsconfig.include instanceof Array) {
        for (let i = 0; i < tsconfig.include.length; i++) {
            if (tsconfig.include[i] == packageName) {
                return;
            }
        }
        tsconfig.include.push(packageName)
    }
    fs.writeFileSync(base + '/tsconfig.json', JSON.stringify(tsconfig));
}


function initProjectEgretPropertiesJson(base, packageName) {
    let egretProperties = JSON.parse(fs.readFileSync(base + '/egretProperties.json'));
    if (!egretProperties) {
        console.error("egretProperties.json not found!\n");
        return;
    }
    if (egretProperties.modules instanceof Array) {
        for (let i = 0; i < egretProperties.modules.length; i++) {
            if (egretProperties.modules[i].name == packageName) {
                return;
            }
        }
        egretProperties.modules.push({"name": packageName, "path": packageName});
    }
    fs.writeFileSync(base + '/egretProperties.json', JSON.stringify(egretProperties));
}

program.command('init')
    .description('init Egret project with typings supports')
    .action(function () {
        let base = '.';
        let name = 'typings';

        // init project tsconfig.json
        initProjectTsconfigJson(base, name);

        // init project egretProperties.json
        initProjectEgretPropertiesJson(base, name);

        // init typings module
        buildEgretThirdPackage(base + '/typings', name);

        fs.writeFileSync(base + '/typings.js', '');

        fs.writeFileSync(base + '/webpack.config.js',
            'module.exports = {\n' +
            '    entry:  __dirname + "/typings.js",\n' +
            '    output: {\n' +
            '        path: __dirname + "/typings/src",\n' +
            '        filename: "typings.js"\n' +
            '    }\n' +
            '}'
        );
        //childProcess.execSync('npm i -g typings')
    });

program.command('install <typings>')
    .alias('i')
    .description('install typings dts')
    .action(function (typings) {
        childProcess.execSync('npm install ' + typings);
        childProcess.execSync('typings install dt~' + typings + ' --global --save');
    });

program.command('build')
    .alias('b')
    .description('build Egret project')
    .action(function () {
        childProcess.execSync('webpack');
        childProcess.execSync('egret build');
    });


program.parse(process.argv);

if (program.args.length === 0) {
    program.help()
}