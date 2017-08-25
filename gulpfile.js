// *** dependencies *** //

const buffer = require('vinyl-buffer');
const source = require('vinyl-source-stream');
const path = require('path');
const gulp = require('gulp');
const runSequence = require('run-sequence');
const nodemon = require('gulp-nodemon');
const plumber = require('gulp-plumber');
const server = require('tiny-lr')();
const sass = require('gulp-sass');
const del = require('del');
const vinylPaths = require('vinyl-paths');
const tap = require('gulp-tap');
const browserify = require('browserify');
const imagemin = require('gulp-imagemin');
const sourcemaps = require('gulp-sourcemaps');

const rev = require('gulp-rev');

// *** config *** //

const paths = {
	copy: {
		input: [
			'src/client/*.*'
		],
		output: 'dist/'
	},
	scripts: {
		input: [
			'src/client/js/*.js'
		],
		output: 'dist/js/'
	},
	styles: {
		input: [
			'src/client/css/*.scss'
		],
		output: 'dist/css/'
	},
	images: {
		input: [
			'src/client/img/**/*.jpg',
			'src/client/img/**/*.png',
			'src/client/img/**/*.svg'
		],
		output: 'dist/img/'
	},
	server: path.join('src', 'server', 'server.js')
};

const lrPort = 35729;

const nodemonConfig = {
	script: paths.server,
	ext: 'html js css md',
	ignore: [
		'node_modules',
		'src/client'
	],
	env: {
		NODE_ENV: 'development'
	},
	'execMap': {
		'js': 'node'
	}
};

gulp.task('default', () => {
	runSequence(
		['clean'], ['styles'], ['scripts'], ['images'], ['copy'], ['lr'], ['nodemon'], ['watch']
	);
});

gulp.task('build', () => {
	runSequence(
		['clean'], ['styles'], ['scripts'], ['images'], ['copy']
	);
});

gulp.task('watch', () => {
	gulp.watch(paths.scripts.input);
	gulp.watch('src/client/css/**/*.scss', ['clean:css', 'styles']);
	gulp.watch('src/client/js/**/*.js', ['clean:js', 'scripts']);
	gulp.watch(paths.scripts.input, ['scripts']);
});

gulp.task('styles', () => {
	return gulp.src(paths.styles.input, {base: './src/client'})
		.pipe(sourcemaps.init())
		.pipe(sass().on('error', sass.logError))
		.pipe(rev())
		.pipe(sourcemaps.write('./'))
	    .pipe(gulp.dest('./dist'))
	    .pipe(rev.manifest('dist/rev-manifest.json',{
	    	merge: true
	    }))
	    .pipe(gulp.dest('.'));
});

const gutil = require('gulp-util');

gulp.task('scripts', () => {
	return gulp.src(paths.scripts.input, {base: './src/client'})
        .pipe(tap(function (file) {
            file.contents = browserify(file.path, {
        		debug: true
        	}).bundle();
        }))
        .pipe(buffer())
        .on('error', err => {
        	gutil.log(gutil.colors.red('[Error]'), err.toString());
        })
		.pipe(rev())
	    .pipe(gulp.dest('./dist'))
	    .pipe(rev.manifest('dist/rev-manifest.json',{
	    	merge: true
	    }))
	    .pipe(gulp.dest('.'));
});

gulp.task('images', () => {
	return gulp.src(paths.images.input, {base: './src/client'})
		.pipe(imagemin())
		.pipe(rev())
	    .pipe(gulp.dest('./dist'))
	    .pipe(rev.manifest('dist/rev-manifest.json',{
	    	merge: true
	    }))
	    .pipe(gulp.dest('.'));
});

gulp.task('copy', () => {
	return gulp.src(paths.copy.input)
	.pipe(gulp.dest(paths.copy.output));
});

gulp.task('clean', () => {
	return gulp.src('dist')
	.pipe(vinylPaths(del));
});

gulp.task('clean:css', () => {
	return gulp.src('dist/css')
	.pipe(vinylPaths(del));
});

gulp.task('clean:js', () => {
	return gulp.src('dist/js')
	.pipe(vinylPaths(del));
});

gulp.task('lr', () => {
	server.listen(lrPort, err => {
		if (err) {
			return console.error(err);
		}
	});
});

gulp.task('nodemon', () => {
	return nodemon(nodemonConfig);
});

