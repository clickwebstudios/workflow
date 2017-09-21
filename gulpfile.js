/*  VARIABLES   */
var gulp = require('gulp');
var sass = require('gulp-sass');
var notify = require('gulp-notify');
var sassOptions = {
    outputStyle: 'expanded',
    precision: 2,
    includePaths: [
        'dev/bower_components',
        'node_modules'
    ]
};
var plumber = require('gulp-plumber');
var browserSync = require('browser-sync');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var spritesmith = require('gulp.spritesmith');
var gulpIf = require('gulp-if');
var nunjucksRender = require('gulp-nunjucks-render');
var data = require('gulp-data');
var fs = require('fs');
var del = require('del');
var runSequence = require('run-sequence');
var jshint = require('gulp-jshint') ;
var jscs = require('gulp-jscs');
var scssLint = require('gulp-scss-lint');
var Server = require('karma').Server;

/*  FUNCTIONS   */
function customPlumber(errTitle) {
    return plumber({
        errorHandler: notify.onError({
// Customizing error title
        title: errTitle || "Error running Gulp",
        message: "Error: <%= error.message %>",
        sound: "Glass"
        })
    });
}

/*  TASKS   */
gulp.task('sass', function(){
    return gulp.src('dev/scss/**/*.scss')
        .pipe(customPlumber('Error Running Sass'))
        .pipe(sourcemaps.init())
        .pipe(sass(sassOptions))
        .pipe(autoprefixer({
            browsers: ['ie 8-9', 'last 2 versions']
        }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dev/css'))
        .pipe(browserSync.reload({
            stream: true
        }));
});

gulp.task('watch-js', ['lint:js'], browserSync.reload);

gulp.task('watch', function () {
    gulp.watch('dev/scss/**/*.scss', ['sass', 'lint:scss']);
    gulp.watch('app/js/**/*.js', ['watch-js']);
    // gulp.watch('dev/js/**/*.js', browserSync.reload);
    gulp.watch('dev/*.html', browserSync.reload);
    gulp.watch([
        'dev/templates/**/*',
        'dev/pages/**/*.+(html|nunjucks)',
        'dev/data.json'
    ],['nunjucks']);
});

gulp.task('browserSync', function () {
    browserSync({
        server: {
            baseDir: 'dev'
        },
        // tunnel: 'computerfrustratie',
        browser: ['google chrome'],
        open: false
    });
});

gulp.task('sprites', function () {
    gulp.src('dev/images/sprites/**/*')
        .pipe(spritesmith({
            cssName: '_sprites.scss',
            imgName: 'sprites.png',
            imgPath: '../images/sprites.png',
            retinaSrcFilter: 'dev/images/sprites/*@2x.png',
            retinaImgName: 'sprites@2x.png',
            retinaImgPath: '../images/sprites@2x.png'
        }))
        .pipe(gulpIf('*.scss', gulp.dest('dev/scss')))
        .pipe(gulpIf('*.png', gulp.dest('dev/images')));
});

gulp.task('nunjucks', function() {
    return gulp.src('dev/pages/**/*.+(html|nunjucks)')
        .pipe(customPlumber('Error Running Nunjucks'))
        .pipe(data(function() {
            return JSON.parse(fs.readFileSync('./dev/data.json'));
        }))
        .pipe(nunjucksRender({
            path: ['dev/templates']
        }))
        .pipe(gulp.dest('dev'))
        .pipe(browserSync.reload({
            stream: true
        }));
});

gulp.task('clean:dev', function () {
    return del.sync([
        'dev/css',
        'dev/*.html'
    ]);
});

gulp.task('default', function (callback) {
    runSequence(
        'clean:dev',
        ['sprites', 'lint:js', 'lint:scss'],
        ['sass', 'nunjucks'],
        ['browserSync', 'watch'],
        callback
    )
});

gulp.task('lint:js', function () {
    return gulp.src('dev/js/**/*.js')
        .pipe(customPlumber('JSHint Error'))
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail', {
            ignoreWarning: true,
            ignoreInfo: true
        }))
        .pipe(jscs({
            fix: true,
            configPath: '.jscsrc'
        }))
        .pipe(gulp.dest('dev/js'))
});

gulp.task('lint:scss', function () {
    return gulp.src('dev/scss/**/*.scss')
        .pipe(scssLint({
            config: '.scss-lint.yml'
        }));
});

gulp.task('test', function (done) {
    new Server({
        configFile: process.cwd() + '/karma.conf.js',
        singleRun: true
    }, done).start();
});