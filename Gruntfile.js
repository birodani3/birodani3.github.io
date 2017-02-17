module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        concat: {
            options: {
                separator: ';'
            },
            basic: {
                src: ['src/js/app.module.js', 'src/js/app.config.js', 'src/js/controllers/*.js', 'src/js/services/*.js'],
                dest: 'src/js/bundle.js'
            },
            extras: {
                src: ['src/js/lib/angular.min.js', 'src/js/lib/*.js'],
                dest: 'dist/vendor.js'
            }
        },
        babel: {
            options: {
                sourceMap: true,
                presets: ['babel-preset-es2015']
            },
            dist: {
                files: {
                    'dist/bundle.js': 'src/js/bundle.js'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask('default', ['concat', 'babel']);
}