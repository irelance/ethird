# 1. Abstract
This package is means to auto manage egret third party library

# 2. Install
```bash
npm i -g ethird
```

# 3. Create a third party project
```bash
ethird create package-name -e egret-compile-version
```
example:
```bash
ethird create ngraph -e 5.2.13
```
This will create the framework which describe in [my tutorial](https://github.com/irelance/egret-ngraph)

# 4. Init a Egret project with typings support
## 4.1.
```bash
# install typings first time
npm i -g typings
```

## 4.2.
```bash
ethird init
```
## 4.3.add dts and node_modules
```bash
ethird install package-name
```
example:
```bash
ethird install jquery
# will run
# npm install jquery
# typings install dt~jquery --global --save
```

## 4.4.add your require
find typing.js on your egret root
and add the package you want to use

example:
```js
jQuery=require('jquery');
//expose jQuery as global value
//I use jQuery as variable name because the typings export the name
```

## 4.5.build your project
```bash
ethird build
```
or
```bash
webpack
egret build typings
egret build
```


