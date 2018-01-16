/**
  * Copyright 2018 IBM Deutschland. All Rights Reserved.
  *
  * Enhanced conVersation Asset - EVA
  * Repository: https://github.ibm.com/CognitiveAssetFactory/EVA
  */
  
'use strict';

//////////////////////////////
// Requires
//////////////////////////////
const gulp = require('gulp');
const autoprefixer = require('gulp-autoprefixer'); // prefix css attributes with vendor prefixes for older browsers
const browserSync = require('browser-sync').create(); // auto-reload changes in frontend files during development
const cache = require('gulp-cached'); // cache files and filter unchanged ones from the stream
const childProcess = require('child_process'); // Node core, create child processes for development servers
const chokidar = require('chokidar'); // performance efficient file watching, comes to gulp4
const gIf = require('gulp-if'); // execute a task in a gulp pipeline under a certain condition
const imagemin = require('gulp-imagemin'); // optimize images
const importOnce = require('node-sass-import-once'); // sass importer that prevents importing dependencies multiple times
const pump = require('pump'); // proper stream termination and error handling, comes to Node core
const sass = require('gulp-sass'); // precompile sass into minified css
const sourcemaps = require('gulp-sourcemaps'); // write sourcemaps for minification tasks in development
const uglify = require('gulp-uglify'); // minify javascript

//////////////////////////////
// Variables
//////////////////////////////
const defaultCacheName = 'defaultCache';
const isProd = process.env.NODE_ENV === 'production' ? true : false;
if (!isProd) {
    process.env.NODE_ENV = 'development';
}
const imageminOptions = [
    imagemin.jpegtran({ progressive: true }),
    imagemin.optipng({ optimizationLevel: 5 })
];
const sassOptions = {
    outputStyle: 'compressed',
    importer: importOnce,
    importOnce: {
        index: true,
        css: true,
        bower: true
    }
};
const uglifyOptions = {
    mangle: {
        reserved: ['$routeParams'] // implies mangle: true; needed for AngularCSS route function hack
    }
};

const frontendFolder = 'frontend/';
const frontendSrcFolder = frontendFolder + 'src/';
const frontendDestFolder = frontendFolder + 'public/';
const externalFrontendSrcFolder = 'external_frontend/';
const externalFrontendDestFolder = frontendDestFolder + 'external_frontend/'
const frontend = {
    src: {
        html: frontendSrcFolder + '**/*.html',
        js: [
            frontendSrcFolder + 'js/**/*.js',
            '!' + frontendSrcFolder + 'js/lib/**/*.js'
        ],
        sass: frontendSrcFolder + 'sass/**/*.scss',
        img: frontendSrcFolder + 'images/**/*.*',
        libs: frontendSrcFolder + 'js/lib/**/*.js',
        fonts: frontendSrcFolder + 'fonts/**/*.*',
        gridFonts: [
            frontendSrcFolder + 'js/lib/angular-ui-grid/ui-grid.ttf',
            frontendSrcFolder + 'js/lib/angular-ui-grid/ui-grid.woff'
        ],
        all: '**/*'
    },
    dest: {
        html: frontendDestFolder,
        js: frontendDestFolder + 'js/',
        css: frontendDestFolder + 'css/',
        img: frontendDestFolder + 'images/',
        libs: frontendDestFolder + 'js/lib/',
        fonts: frontendDestFolder + 'fonts/',
        gridFonts: frontendDestFolder + 'css/admin/'
    },
    server: {
        src: frontendFolder + '*.js',
        entry: frontendFolder + 'server.js'
    },
    srcmaps: 'maps'
};

const backendFolder = 'backend/';
const backend = {
    src: [
        backendFolder + '**/*.js',
        backendFolder + '**/*.json',
        backendFolder + '**/*.env'
    ],
    entry: backendFolder + 'server.js'
}

function watchFiles(watchGlob, taskOrCallback) {
    let watcher = chokidar.watch(watchGlob);
    watcher.on('ready', function() {
        watcher.on('all', function(eventName, filePath) {
            if (eventName === 'unlink') {
                delete cache.caches[defaultCacheName][filePath];
            }

            if (typeof taskOrCallback === 'function') {
                taskOrCallback();
            } else {
                gulp.start(taskOrCallback);
            }
        });
    });
}

//////////////////////////////
// HTML Task
//////////////////////////////
gulp.task('frontend:html', function(callback) {
    pump([
        gulp.src(frontend.src.html),
        cache(defaultCacheName),
        gulp.dest(frontend.dest.html)
    ], function(error) {
        browserSync.reload();
        callback(error)
    });
});

//////////////////////////////
// Javascript Task
//////////////////////////////
gulp.task('frontend:js', function(callback) {
    pump([
        gulp.src(frontend.src.js),
        cache(defaultCacheName),
        gIf(!isProd, sourcemaps.init()),
        uglify(uglifyOptions),
        gIf(!isProd, sourcemaps.write(frontend.srcmaps)),
        browserSync.stream({ once: true }),
        gulp.dest(frontend.dest.js)
    ], callback);
});

//////////////////////////////
// Sass Task
//////////////////////////////
gulp.task('frontend:sass', function(callback) {
    pump([
        gulp.src(frontend.src.sass),
        cache(defaultCacheName),
        gIf(!isProd, sourcemaps.init()),
        sass(sassOptions),
        autoprefixer(), // TODO define, which browser versions we want to support
        gIf(!isProd, sourcemaps.write(frontend.srcmaps)),
        browserSync.stream({ once: true }),
        gulp.dest(frontend.dest.css)
    ], callback);
});

//////////////////////////////
// Image Task
//////////////////////////////
gulp.task('frontend:img', function(callback) {
    pump([
        gulp.src(frontend.src.img),
        cache(defaultCacheName),
        gIf(isProd, imagemin(imageminOptions)),
        gulp.dest(frontend.dest.img)
    ], callback);
});

//////////////////////////////
// Library Task
//////////////////////////////
gulp.task('frontend:libs', function(callback) {
    pump([
        gulp.src(frontend.src.libs),
        cache(defaultCacheName),
        gulp.dest(frontend.dest.libs)
    ], callback);
});

//////////////////////////////
// Font Tasks
//////////////////////////////
gulp.task('frontend:fonts', function(callback) {
    pump([
        gulp.src(frontend.src.fonts),
        cache(defaultCacheName),
        gulp.dest(frontend.dest.fonts)
    ], callback);
});

gulp.task('frontend:gridFonts', function(callback) {
    pump([
        gulp.src(frontend.src.gridFonts),
        cache(defaultCacheName),
        gulp.dest(frontend.dest.gridFonts)
    ], callback);
});

//////////////////////////////
// External Frontend Task
//////////////////////////////
gulp.task('frontend:extFrontend', function(callback) {
    pump([
        gulp.src(externalFrontendSrcFolder + frontend.src.all),
        cache(defaultCacheName),
        gulp.dest(externalFrontendDestFolder)
    ], function(error) {
        browserSync.reload();
        callback(error)
    });
});

//////////////////////////////
// Watch Tasks
//////////////////////////////
gulp.task('frontend:serverWatch', function() {
    let frontendServer;

    function startFrontend() {
        frontendServer = childProcess.fork(frontend.server.entry, {
            env: process.env
        });
    }

    startFrontend();
    watchFiles(frontend.server.src, function() {
        console.log('Change detected - Restarting frontend server');
        frontendServer.kill();
        frontendServer.on('exit', startFrontend);
    });
});

gulp.task('frontend:watch', ['build'], function() {
    watchFiles(frontend.src.html, ['frontend:html']);
    watchFiles(frontend.src.js, ['frontend:js']);
    watchFiles(frontend.src.sass, ['frontend:sass']);
    watchFiles(frontend.src.img, ['frontend:img']);
    watchFiles(frontend.src.libs, ['frontend:libs']);
    watchFiles(frontend.src.fonts, ['frontend:fonts']);
    watchFiles(frontend.src.gridFonts, ['frontend:gridFonts']);
    watchFiles(externalFrontendSrcFolder + frontend.src.all, ['frontend:extFrontend']);
});

gulp.task('backend:watch', function() {
    let backendServer;

    function startBackend() {
        backendServer = childProcess.fork(backend.entry, {
            env: process.env
        });
    }

    startBackend();
    watchFiles(backend.src, function() {
        console.log('Change detected - Restarting backend server');
        backendServer.kill();
        backendServer.on('exit', startBackend);
    });
});

//////////////////////////////
// Browser Sync Task
//////////////////////////////
gulp.task('browserSync', ['frontend:serverWatch', 'frontend:watch'], function() {
    browserSync.init({
        'proxy': 'http://localhost:8080'
    });
});

//////////////////////////////
// Running Tasks
//////////////////////////////
gulp.task('build', ['frontend:html', 'frontend:js', 'frontend:sass', 'frontend:img', 'frontend:libs', 'frontend:fonts', 'frontend:gridFonts', 'frontend:extFrontend']);

gulp.task('watch', ['frontend:watch', 'frontend:serverWatch', 'backend:watch', 'browserSync']);

gulp.task('backend', ['backend:watch']);

gulp.task('default', ['build', 'watch']);
