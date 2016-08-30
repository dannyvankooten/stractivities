'use strict';

const gulp = require('gulp');
const rename = require("gulp-rename");
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');

gulp.task('default', ['js-map', 'js-intensities' ]);

gulp.task('js-map', function() {
    return browserify({
        entries: './public/assets/browserify/map.js'
    }).on('error', console.log)
        .bundle()
        .pipe(source('map.js'))
        .pipe(buffer())
        .pipe(gulp.dest('./public/assets/js'));
});

gulp.task('js-intensities', function() {
    return browserify({
        entries: './public/assets/browserify/intensities.js'
    }).on('error', console.log)
        .bundle()
        .pipe(source('intensities.js'))
        .pipe(buffer())
        .pipe(gulp.dest('./public/assets/js'));
});
