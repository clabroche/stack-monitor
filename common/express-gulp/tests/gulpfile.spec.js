const Gulp = require('../src/gulpfile');

describe('Gulp', () => {
  it('dede', () => {
    const gulp = Gulp.generateGulpfile({
      entryPoint: './a.js',
      baseUrl: '.',
      port: '1000',
    });
    expect(gulp.constructor.name).toBe('Function');
  });
});
