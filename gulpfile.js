'use strict'

const del = require('del')
const gulp = require('gulp')
const babel = require('gulp-babel')
const changed = require('gulp-changed')
const debug = require('gulp-debug')

const babelPresets = ['es2015']
const babelQuery = {
  presets: babelPresets,
  sourceMaps: 'inline'
}

gulp.task('build:js:clean', function () {
  return del(['built'])
})

function build(withPipe) {
  let pipe = gulp.src('src/**/*.js')

  if (undefined !== withPipe) {
    pipe = withPipe(pipe)
  }

  return pipe
    .pipe(debug({}))
    .pipe(babel(babelQuery))
    .pipe(gulp.dest('built'))
}

gulp.task('build', ['build:js:clean'], function () {
  return build()
})

gulp.task('build:dev', function () {
  return build(function (pipe) {
    return pipe.pipe(changed('built'))
  })
})

gulp.task('default', ['build'])
