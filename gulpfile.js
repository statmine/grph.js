
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var jshint = require("gulp-jshint");
var sourcemaps = require("gulp-sourcemaps");

gulp.task('default', ['js', 'js-min']);

gulp.task('js', function () {
  return gulp.src("src/*.js")
    .pipe(jshint())
    .pipe(jshint.reporter("default"))
    .pipe(sourcemaps.init())
      .pipe(concat("grph.js"))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest("js"));
});

gulp.task('js-min', function () {
  return gulp.src("src/*.js")
    .pipe(uglify())
    .pipe(concat("grph.min.js"))
    .pipe(gulp.dest("js"));
});
