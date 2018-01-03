var gulp = require('gulp'),
    watch = require('gulp-watch'),
    browserSync = require('browser-sync').create();

gulp.task('watch', function() {
  browserSync.init({
    notify: false,
    proxy: 'localhost:3000'
  });

  watch('./views/**/*.ejs', function() {
    console.log('ejs template changed');
    browserSync.reload();
  });

  watch('./assets/styles/**/*.css', function() {
    console.log("css");
    gulp.start('cssInject');
  });
});

gulp.task('cssInject', ['css'], function() {
  browserSync.reload();
});