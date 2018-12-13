#!/usr/bin/env node
const fs = require('fs');
const program = require('commander');
const colors = require('colors');
const spawn = require('cross-spawn');

let typingsPackageName = 'typings';

function error(message) {
    console.error('[error]'.bgRed + (' : ' + message + "\n").red);
    process.exit(1);
}

function warn(message) {
    console.warn('[warn]'.bgYellow + (' : ' + message + "\n").yellow);
}

function info(message) {
    console.info((message + "\n").green);
}

function log(message) {
    console.log(message + "\n");
}

function write(file, content) {
    fs.writeFileSync(file, content);
}

function mkdir(path, option) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, option);
    }
}

function exec(command, options) {
    spawn.sync(command, options, {stdio: 'inherit'})
}

function buildEgretThirdPackage(basePath, packageName) {
    mkdir(basePath, {recursive: true});
    mkdir(basePath + '/typings', {recursive: true});
    let dts = 'typings/' + packageName + '.d.ts';
    write(basePath + '/' + dts, '');
    write(basePath + '/package.json',
        '{\n' +
        '  "name": "' + packageName + '",\n' +
        '  "typings": "' + dts + '"\n' +
        '}'
    );
    write(basePath + '/tsconfig.json',
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
        write(base + '/webpack.config.js',
            'module.exports = {\n' +
            '    entry:  __dirname + "/index.js",\n' +
            '    output: {\n' +
            '        path: __dirname + "/libsrc/src",\n' +
            '        filename: "' + name + '.js"\n' +
            '    }\n' +
            '}'
        );
        write(base + '/egretProperties.json',
            '{"compilerVersion": "' + egretCompilerVersion + '"}'
        );
        write(base + '/package.js',
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
        write(base + '/index.js', '');
    });

function initProjectTsconfigJson(base, packageName) {
    let tsconfig = JSON.parse(fs.readFileSync(base + '/tsconfig.json'));
    if (!tsconfig) {
        error("tsconfig.json not found!");
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
    write(base + '/tsconfig.json', JSON.stringify(tsconfig));
}


function initProjectEgretPropertiesJson(base, packageName) {
    let egretProperties = JSON.parse(fs.readFileSync(base + '/egretProperties.json'));
    if (!egretProperties) {
        error("egretProperties.json not found!");
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
    write(base + '/egretProperties.json', JSON.stringify(egretProperties));
}

program.command('init')
    .description('init Egret project with typings supports')
    .action(function () {
        let base = process.cwd();
        let name = typingsPackageName;

        // init project tsconfig.json
        initProjectTsconfigJson(base, name);

        // init project egretProperties.json
        initProjectEgretPropertiesJson(base, name);

        // init typings module
        buildEgretThirdPackage(base + '/' + name, name);

        mkdir(base + '/' + name + '/bin', {recursive: true});
        mkdir(base + '/' + name + '/bin/typings', {recursive: true});
        write(base + '/' + name + '/bin/' + name + '/' + name + '.d.ts', '');

        write(base + '/' + name + '.js', '');

        write(base + '/webpack.config.js',
            'module.exports = {\n' +
            '    entry:  __dirname + "/' + name + '.js",\n' +
            '    output: {\n' +
            '        path: __dirname + "/' + name + '/src",\n' +
            '        filename: "' + name + '.js"\n' +
            '    }\n' +
            '}'
        );
    });

program.command('install <typings>')
    .alias('i')
    .description('install typings dts')
    .action(function (typings) {
        exec('npm', ['install', typings]);
        exec('typings', ['install', 'dt~' + typings, '--global', '--save']);
    });

program.command('build')
    .alias('b')
    .description('build Egret project')
    .option('-p, --no-egret-build', 'without run: egret build')
    .option('-t, --no-egret-build-typings', 'without run: egret build typings')
    .action(function (cmd) {
        let name = typingsPackageName;
        exec('webpack', []);

        if (cmd.egretBuildTypings) {
            exec('egret', ['build', name]);
        }

        let webpackConfig = require(process.cwd() + '/webpack.config.js');
        if (!webpackConfig || !webpackConfig.output) {
            error('webpack.config.js not found in current dir');
            return;
        }
        if (!webpackConfig.output.filename) {
            error('webpack.config.js: output.filename not config');
            return;
        }
        if (!webpackConfig.output.path) {
            error('webpack.config.js: output.path not config');
            return;
        }
        let src = webpackConfig.output.path + '/' + webpackConfig.output.filename;
        fs.copyFileSync(src, process.cwd() + '/' + name + '/bin/' + name + '/' + name + '.js');
        fs.copyFileSync(src, process.cwd() + '/' + name + '/bin/' + name + '/' + name + '.min.js');

        if (cmd.egretBuild) {
            exec('egret', ['build']);
        }
    });

program.on('command:*', function () {
    warn('Invalid command: ' + program.rawArgs.join(' '));
    program.help()
});
program.unknownOption = function (flag) {
    if (this._allowUnknownOption) return;
    warn('Invalid command: ' + program.rawArgs.join(' '));
    program.help()
    process.exit(1);
};

program.parse(process.argv);

if (program.args.length === 0) {
    program.help()
}