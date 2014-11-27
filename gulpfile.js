
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var jshint = require("gulp-jshint");
var sourcemaps = require("gulp-sourcemaps");

function log_error(error) {
  console.log(error.toString());
  this.emit('end');
}

gulp.task('default', ['check', 'js', 'js-min']);

gulp.task("check", function () {
  return gulp.src(["src/*.js", "!src/begin.js", "!src/end.js"])
    .pipe(jshint())
    .pipe(jshint.reporter("default"))
});

gulp.task('js', function () {
  return gulp.src(["src/begin.js", "src/!(end)*.js", "src/end.js"])
    .pipe(sourcemaps.init())
      .pipe(concat("grph.js"))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest("js"));
});

gulp.task('js-min', function () {
  return gulp.src(["src/begin.js", "src/!(end)*.js", "src/end.js"])
    .pipe(concat("grph.min.js"))
    .pipe(uglify())
    .on("error", log_error)
    .pipe(gulp.dest("js"));
});

gulp.task("watch", function() {
  gulp.watch(["src/*.js"], ["default"]);
});

