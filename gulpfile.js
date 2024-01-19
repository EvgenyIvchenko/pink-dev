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
import { deleteAsync } from 'del';
import browser from 'browser-sync';
import svgSprite from 'gulp-svg-sprite';

// Remove
export const remove = () => {
  return deleteAsync('build');
}

// Copy
export const copy = () => {
  return gulp.src('source/assets/**/*')
    .pipe(gulp.dest('build'));
}

const reload = done => {
  browser.reload();
  done();
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

// Script
export const script = () => {
  return gulp.src('source/js/main.js')
    .pipe(terser())
    .pipe(rename('main.min.js'))
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
export const convertWebp = () => {
  return gulp.src('source/img/*.{jpg,png}')
    .pipe(webp({ quality: 100 }))
    .pipe(gulp.dest('build/img'));
}

// Sprite
export const createSprite = () => gulp.src('source/icons/**/*.svg', {})
    .pipe(svgSprite({
        mode: {
            symbol: {
                sprite: '../sprite.svg',
            },
        },
        shape: {
            transform: [
                {
                    svgo: {
                        plugins: [
                            { cleanupIDs: { minify: true } },
                            { removeViewBox: false },
                            { removeAttrs: { attrs: '(fill|stroke|class|data-name)' } },
                        ],
                    },
                },
            ],
        },
    }))
    .pipe(gulp.dest('build/img'))
    .pipe(browser.stream());

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
  gulp.watch('source/js/**/*.js', gulp.series(script, reload));
  gulp.watch('source/icons/*.svg', gulp.series(createSprite, reload));
  gulp.watch('source/img/**/*{jpg,png,svg}', gulp.series(copyImages, convertWebp, reload));
  gulp.watch('source/sass/**/*.scss', gulp.series(styles));
  gulp.watch('source/*.html', gulp.series(html, reload));
}

const build = gulp.series(remove, copy, optimizeImages, convertWebp, createSprite, styles, html, script)
const dev = gulp.series(remove, copy, copyImages, convertWebp, createSprite, styles, html, script, server, watcher)

gulp.task('default', dev);

export { dev, build };
