import gulp from 'gulp';
import plumber from 'gulp-plumber';
import sass from 'gulp-dart-sass';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import htmlmin from 'gulp-htmlmin';
import csso from 'postcss-csso';
import rename from 'gulp-rename';
import terser from 'gulp-terser';
import imagemin, { mozjpeg, optipng, svgo } from 'gulp-imagemin';
import webp from 'gulp-webp';
import svgstore from 'gulp-svgstore';
import { deleteAsync } from 'del';
import browser from 'browser-sync';

// Clean
export const clean = () => {
  return deleteAsync('build');
}

// Copy
export const copy = () => {
  return gulp.src('source/assets/**/*')
    .pipe(gulp.dest('build'));
}

// Styles
export const styles = () => {
  return gulp.src('source/sass/style.scss', { sourcemaps: true })
    .pipe(plumber())
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([
      autoprefixer(),
      csso()
    ]))
    .pipe(rename('style.min.css'))
    .pipe(gulp.dest('build/css', { sourcemaps: '.' }))
    .pipe(browser.stream());
}

// HTML
export const html = () => {
  return gulp.src('source/*.html')
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest('build'));
}

// Scripts
export const scripts = () => {
  return gulp.src('source/js/script.js')
    .pipe(terser())
    .pipe(rename('script.min.js'))
    .pipe(gulp.dest('build/js'));
}

// Images
export const copyImages = () => {
  return gulp.src('source/img/**/*.{jpg,png,svg}')
    .pipe(gulp.dest('build/img'));
}

export const optimizeImages = () => {
  return gulp.src('source/img/**/*.{jpg,png,svg}')
    .pipe(
      imagemin([
        mozjpeg({ quality: 100, progressive: true }),
        optipng({ optimizationLevel: 5 }),
        svgo({
          removeViewBox: true,
          cleanupIDs: true,
          inlineStyles: false,
        }),
      ]),
    )
    .pipe(gulp.dest('build/img'));
}

// Webp
export const createWebp = () => {
  return gulp.src('source/img/*.{jpg,png}')
    .pipe(webp({ quality: 100 }))
    .pipe(gulp.dest('build/img'));
}

// Sprite
export const sprite = () => {
  return gulp.src('source/img/*.svg')
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename('sprite.svg'))
    .pipe(gulp.dest('build/img'));
}

// Server
const server = (done) => {
  browser.init({
    server: {
      baseDir: 'build'
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
}

// Watcher
const watcher = () => {
  gulp.watch('source/img/**/*{jpg,png}', gulp.series(copyImages, createWebp, browser.reload));
  gulp.watch('source/sass/**/*.scss', gulp.series(styles));
  gulp.watch('source/*.html', gulp.series(html, browser.reload));
}

const build = gulp.series(clean, copy, optimizeImages, gulp.parallel(styles, html, sprite, createWebp)) // без скриптов
const dev = gulp.series(clean, copy, copyImages, createWebp, styles, html, server, watcher) // без скрипта

gulp.task('default', dev);

export { dev, build };
