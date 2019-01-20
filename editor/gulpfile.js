// GULP MODULES ===============================================================
var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minifyCSS = require('gulp-minify-css');
var minifyHTML = require('gulp-minify-html');
var connect = require('gulp-connect');
var less = require('gulp-less');
var jshint = require('gulp-jshint');
var foreach = require("gulp-foreach");
var zip = require("gulp-zip");
var templateCache = require('gulp-angular-templatecache');
var replace = require('gulp-replace');
var stylish = require('jshint-stylish');
var exec = require('child_process').exec;
var fs = require('fs');
var rimraf = require('rimraf');
var merge = require('merge-stream');
var collect = require("gulp-collect");
var filenames = require("gulp-filenames");
var path = require('path');
var _ = require('underscore');


gulp.task("_buildB3", function () {
  // add this path to requires
  require('app-module-path').addPath('../server');
  require('app-module-path').addPath('../server/FSM/composites/');
  require('app-module-path').addPath('../server/FSM/decorators/');
  require('app-module-path').addPath('../server/FSM/actions/');
  require('app-module-path').addPath('../server/FSM/core/');
  require('app-module-path').addPath('../server/FSM/conditions/');
  require('app-module-path').addPath('../server/convocode/');
  // TODO: CREATE AUTOMATICALLY
  var b3Classes = require('./b3classes');
  var b3LibTemplate = fs.readFileSync('./b3libs.template.js').toString();

  var b3Lib = _.template(b3LibTemplate)({
    nodes: b3Classes
  });
  fs.writeFileSync('./src/assets/libs/b3nodes.js', b3Lib)

});
// VARIABLES ==================================================================
var project = JSON.parse(fs.readFileSync('package.json', 'utf8'));
var build_version = project.version;
var build_date = (new Date()).toISOString().replace(/T.*/, '');


// FILES ======================================================================
var vendor_js = [
  // 'src/assets/libs/jquery.min.js',
  'src/assets/libs/createjs.min.js',
  'src/assets/libs/creatine-1.0.0.min.js',
  'src/assets/libs/b3nodes.js',
  'src/assets/libs/mousetrap.min.js',
  'bower_components/angular/angular.min.js',
  'bower_components/angular-animate/angular-animate.min.js',
  'bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
  'bower_components/angular-ui-router/release/angular-ui-router.min.js',
  'bower_components/sweetalert/dist/sweetalert.min.js',
  'src/assets/js/jsoneditor.min.js',
  'bower_components/ng-jsoneditor/ng-jsoneditor.js',
  'node_modules/ag-grid/dist/ag-grid.js',
  'src/assets/js/quote-animate.js',
  'src/assets/js/voice/config-service.js',
  'src/assets/js/voice/tts.js',
  'src/assets/js/voice/asr.js',
  'src/assets/js/voice/servo-bridge.js',
  'src/assets/js/voice/servo-voice.js',
  'src/assets/js/bluebird.min.js'

];
var vendor_css = [
  'bower_components/bootstrap/dist/css/bootstrap.min.css',
  'bower_components/sweetalert/dist/sweetalert.css',
  'src/assets/css/jsoneditor.min.css',
  'src/assets/css/quote-animate.css'
];
var vendor_fonts = [
  'bower_components/fontawesome/fonts/*',
  'src/assets/fonts/**/*',
];

var preload_js = [
  'src/assets/js/preload.js',
];

var preload_css = [
  'bower_components/fontawesome/css/font-awesome.min.css',
  'src/assets/css/preload.css',
];

var app_js = [
  'src/editor/namespaces.js',
  'src/editor/utils/*.js',
  'src/editor/**/*.js',
  'src/app/app.js',
  'src/app/app.routes.js',
  'src/app/app.controller.js',
  'src/app/**/*.js',
  'src/start.js',
];
var app_less = [
  'src/assets/less/index.less',
];
var app_imgs = [
  'src/assets/imgs/**/*'
];

var vendor_css_imgs = [
  'src/assets/css/**/*'
];

var app_html = [
  'src/app/**/*.html',
];
var app_entry = [
  'src/index.html',
  'src/package.json',
  'src/desktop.js',
];

var config_file = 'config.json';

// TASKS (VENDOR) =============================================================
gulp.task('_vendor_js', function () {
  return gulp.src(vendor_js)
    .pipe(uglify())
    .pipe(concat('vendor.min.js'))
    .pipe(gulp.dest('build/js'))
});

gulp.task('_vendor_dev_js', function () {
  return gulp.src(vendor_js)
    .pipe(concat('vendor.min.js'))
    .pipe(gulp.dest('build/js'))
});
gulp.task('_vendor_css', function () {
  return gulp.src(vendor_css)
    .pipe(minifyCSS())
    .pipe(concat('vendor.min.css'))
    .pipe(gulp.dest('build/css'))
});

gulp.task('_vendor_fonts', function () {
  return gulp.src(vendor_fonts)
    .pipe(gulp.dest('build/fonts'))
});

gulp.task('_vendor', ['_buildB3', '_vendor_js', '_vendor_css', '_vendor_css_imgs', '_vendor_fonts']);
gulp.task('_vendor_dev', ['_buildB3', '_vendor_dev_js', '_vendor_css', '_vendor_css_imgs', '_vendor_fonts']);


// TASKS (PRELOAD) ============================================================
gulp.task('_preload_js', function () {
  return gulp.src(preload_js)
    .pipe(uglify())
    .pipe(concat('preload.min.js'))
    .pipe(gulp.dest('build/js'))
    .pipe(connect.reload())
});

gulp.task('_preload_css', function () {
  return gulp.src(preload_css)
    .pipe(minifyCSS())
    .pipe(concat('preload.min.css'))
    .pipe(gulp.dest('build/css'))
    .pipe(connect.reload())
});

gulp.task('_preload', ['_preload_js', '_preload_css']);


// TASKS (APP) ================================================================
gulp.task('_app_config', function () {
  return gulp.src(config_file)
    .pipe(gulp.dest('build/'));
});
gulp.task('_app_js_dev', function () {
  return gulp.src(app_js)
    .pipe(jshint())
    .pipe(jshint.reporter(stylish))
    .pipe(replace('[BUILD_VERSION]', build_version))
    .pipe(replace('[BUILD_DATE]', build_date))
    .pipe(concat('app.min.js'))
    .pipe(gulp.dest('build/js'))
    .pipe(connect.reload())
});
gulp.task('_app_js_build', function () {
  return gulp.src(app_js)
    .pipe(jshint())
    .pipe(jshint.reporter(stylish))
    .pipe(replace('[BUILD_VERSION]', build_version))
    .pipe(replace('[BUILD_DATE]', build_date))
    .pipe(uglify())
    .pipe(concat('app.min.js'))
    .pipe(gulp.dest('build/js'))
    .pipe(connect.reload())
});

gulp.task('_app_less', function () {
  return gulp.src(app_less)
    .pipe(less())
    .pipe(minifyCSS())
    .pipe(concat('app.min.css'))
    .pipe(gulp.dest('build/css'))
    .pipe(connect.reload())
});

gulp.task('_app_imgs', function () {
  return gulp.src(app_imgs)
    .pipe(gulp.dest('build/imgs'))
});

gulp.task('_vendor_css_imgs', function () {
  return gulp.src(vendor_css_imgs)
    .pipe(gulp.dest('build/css'))
});

gulp.task('_app_html', function () {
  return gulp.src(app_html)
    .pipe(minifyHTML({
      empty: true
    }))
    .pipe(replace('[BUILD_VERSION]', build_version))
    .pipe(replace('[BUILD_DATE]', build_date))
    .pipe(templateCache('templates.min.js', {
      standalone: true
    }))
    .pipe(gulp.dest('build/js'))
    .pipe(connect.reload())
});

gulp.task('_app_entry', function () {
  return gulp.src(app_entry)
    // .pipe(minifyHTML({empty:true})) 
    .pipe(replace('[BUILD_VERSION]', build_version))
    .pipe(replace('[BUILD_DATE]', build_date))
    .pipe(gulp.dest('build'))
    .pipe(connect.reload())
});

gulp.task('_app_dev', [
  '_app_config',
  '_app_js_dev',
  '_app_less',
  '_app_imgs',
  '_app_html',
  '_app_entry'
]);
gulp.task('_app_build', [
  '_app_config',
  '_app_js_build',
  '_app_less',
  '_app_imgs',
  '_app_html',
  '_app_entry'
]);


// TASKS (LIVE RELOAD) ========================================================
gulp.task('_livereload', function () {
  connect.server({
    livereload: true,
    root: 'build',
    port: 8000,
  });
});

gulp.task('_watch', ['_livereload'], function () {
  gulp.watch(preload_js, ['_preload_js']);
  gulp.watch(preload_css, ['_preload_css']);
  gulp.watch(app_js, ['_app_js_dev']);
  gulp.watch(app_less, ['_app_less']);
  gulp.watch(app_html, ['_app_html']);
  gulp.watch(app_entry, ['_app_entry']);
});


gulp.task('docs', function () {
  return gulp.src('../../server/outdocs/**/*.*')
    .pipe(gulp.dest('build/outdocs'))
    .pipe(connect.reload())
});

// COMMANDS ===================================================================
gulp.task('build', ['_vendor', '_preload', '_app_build', 'docs']);
gulp.task('dev', ['_vendor_dev', '_preload', '_app_dev']);
gulp.task('serve', ['_vendor_dev', '_preload', '_app_dev', 'docs', '_watch']);
