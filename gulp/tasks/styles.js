var gulp = require('gulp'),
    postcss = require('gulp-postcss'),
    cssvars = require('postcss-simple-vars'),
    nested = require('postcss-nested'),
    cssImport = require('postcss-import'),
    autoprefixer = require('autoprefixer'),
    mixins = require('postcss-mixins');

gulp.task('css', function () {
    var plugins = [
        postcss,
        cssImport,
        mixins,
        cssvars,
        nested,
        autoprefixer
    ];
    return gulp.src('./assets/styles/styles.css')
        .pipe(postcss(plugins))
        .on('error', function(errorInfo) {
            console.log(errorInfo.toString());
            this.emit('end');
        })
        .pipe(gulp.dest('./public'));
});