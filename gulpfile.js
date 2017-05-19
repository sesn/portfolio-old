const gulp = require('gulp'),
    path = require('path'),
    babel = require('gulp-babel'),
    htmlmin = require('gulp-htmlmin'),
    cssmin = require('gulp-cssmin'),
    rename = require('gulp-rename'),
    autoprefixer = require('gulp-autoprefixer'),
    uglifyJs = require('gulp-uglify'),
    jshint = require('gulp-jshint'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    imagemin = require('gulp-imagemin'),
    fontmin = require('gulp-fontmin'),
    livereload = require('gulp-livereload'),
    server = require('gulp-server-livereload'),
    revAll = require('gulp-rev-all')
    revNapkin = require('gulp-rev-napkin'),
    version = require('gulp-version-number'),
    clean = require('gulp-dest-clean'),
    concat = require('gulp-concat-multi')
    concatFile = require('gulp-concat')
    useref = require('gulp-useref'),
    del = require('del'),
    processhtml = require('gulp-processhtml'),
    newer = require('gulp-newer');

//Copy html from src to dest
gulp.task('copy-html', () => {
    //Copy any html in src to dest
    del([
        'replacementlist.txt'
    ])

    /* options for processhtml */
    var options = {
        list: "replacementlist.txt"
    };

    return gulp.src(['src/**/*.html','src/**/*.php'],{ passthrough: true })
        .pipe(processhtml())
        // .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(version({ 'value': '%MDS%','append': {'key': 'v','to': ['css', 'js','image']}}))
        .pipe(gulp.dest('dist'));
});

//Configure jshint task
gulp.task('jshint', () => {
    return gulp.src(['src/**/*.js','!src/js/main.js', '!src/js/plugin.js', '!src/js/vendor/jquery-1.12.0.min.js', '!src/js/vendor/modernizr-2.8.3.min.js']).pipe(jshint()).pipe(jshint.reporter('jshint-stylish'));
});

//Optimize the image
gulp.task('optimize-image', () => {
    gulp.src('src/img/*')
        .pipe(newer('dist/img'))
        .pipe(imagemin([
            imagemin.gifsicle({ interlaced: true }),
            imagemin.jpegtran({ progressive: true }),
            imagemin.optipng({ optimizationLevel: 5 }),
            imagemin.svgo({ plugins: [{ removeViewBox: true }] })
        ], {
            verbose: true
        }))
        .pipe(gulp.dest('dist/img'));
});

//Minify font 
gulp.task('minify-font', () => {
    gulp.src(['src/css/fonts/*.ttf', 'src/css/fonts/*.eot', 'src/css/fonts/*.woff', 'src/css/fonts/*.svg','src/css/fonts/*.otf'])
        .pipe(newer('dist/css/fonts'))
        .pipe(fontmin())
        .pipe(gulp.dest('dist/css/fonts/'));
});

gulp.task('uglify-js', function() {
    return gulp.src(['src/**/*.js', 'src/js/main.js', 'src/js/plugin.js'])
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(jshint())
        .pipe(uglifyJs())
        .pipe(gulp.dest('dist/'));
});

//Converting from ES6
gulp.task('convert-es6', () => {
    return gulp.src('src/js/main.js')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(jshint())
        .pipe(uglifyJs())
        .pipe(gulp.dest('dist/js/'));
});

gulp.task('concat-js', ['convert-es6'],()=>{
    let concatOptions = { newLine: ';' };
    concat({
        'bundle.min.js': ['src/js/vendor/jquery-1.12.0.min.js','src/js/plugins.js','dist/js/main.js'],
        'modernizr.min.js' : 'src/js/vendor/modernizr-2.8.3.min.js'
    },concatOptions)
    // .pipe(babel({
    //     presets: ['es2015']
    // }))
    .pipe(jshint())
    .pipe(uglifyJs())
    .on('error',(data)=>{
        console.log(data)
    })
    .pipe(gulp.dest('dist/js'));
});

//CSS Min
gulp.task('build-css', () => {
    // return concat({
    //         'bundle.min.css':['src/css/normalize.css','src/css/slick.css','src/css/main.css']
    //     })
    return gulp.src(['src/sass/main.sass'])
        // .pipe(autoprefixer())
        .pipe(sass().on('error', sass.logError))
        .pipe(cssmin())
        .pipe(concatFile('bundle.min.css'))
        .pipe(gulp.dest('dist/css'));
});

//Configure which files to watch and what tasks to use on file changes
gulp.task('watch', () => {
    gulp.watch('src/js/**/*.js', ['jshint']);
    gulp.watch('src/js/**/*.js', ['concat-js']);
    // gulp.watch('src/js/main.js', ['convert-es6']);
    gulp.watch('src/sass/**/*.sass', ['build-css']);
    gulp.watch('src/*.html', ['copy-html']);
    gulp.watch('src/img/*',['optimize-image']);
});

gulp.task('webserver', function() {
    gulp.src('app')
        .pipe(server({
            livereload: true,
            directoryListing: true,
            open: true,
            log: 'debug',
            clientConsole: true
        }));
});

gulp.task('rev-all',['build-css','uglify-js','convert-es6','copy-html','minify-font'],() => {
    return gulp.src('tmp/**')
            .pipe(revAll.revision({ 
                dontRenameFile: ['.html','.php'],
                transformPath: function (rev, source, path) {
                    // on the remote server, image files are served from `/images` 
                    return rev.replace('/img', '/images');
                    }
            }))
            .pipe(gulp.dest('dest'))
            .pipe(revAll.manifestFile())
            .pipe(gulp.dest('dest'))
});

gulp.task('default', ['watch', 'copy-html','jshint','concat-js', 'build-css','optimize-image','minify-font']);