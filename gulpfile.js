'use strict';

const gulp = require('gulp');
const rename = require("gulp-rename");
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');
const es = require('event-stream');

var paths = {
  scripts: './public/assets/browserify/**/*.js',
};

gulp.task('default', [ 'browserify', 'uglify' ]);

gulp.task('browserify', function() {
  var files = [
    './public/assets/browserify/map.js',
    './public/assets/browserify/intensities.js'
  ];

  var tasks = files.map(function(f) {
    return browserify({
        entries: [f]
    }).on('error', console.log)
        .bundle()
        .pipe(source(f.split('/').pop()))
        .pipe(gulp.dest('./public/assets/js'));
  });

  return es.merge.apply(null, tasks);
});

gulp.task('uglify', ['browserify'], function() {
	return gulp.src(['./public/assets/js/*.js','!./public/assets/js/*.min.js'])
		.pipe(sourcemaps.init({loadMaps: true}))
		.pipe(uglify())
    .pipe(buffer())
		.pipe(rename({extname: '.min.js'}))
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('./public/assets/js'));
});

gulp.task('watch', function() {
  gulp.watch(paths.scripts, ['uglify']);
});
