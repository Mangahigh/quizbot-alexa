/*global module:true */

module.exports = function (grunt) {
    /*jshint camelcase: false */
    'use strict';

    grunt.initConfig({
        shell: {
            makeDistFolder: {
                command: 'rm -rf dist && mkdir -p dist'
            },
            copyPackage: {
                command: 'cp package.json dist'
            },
            npmInstall: {
                command: 'cd dist && npm --only=prod install'
            },
            copySrc: {
                command: 'cp src/* dist'
            }
        },

        compress: {
            main: {
                options: {
                    archive: 'production.zip'
                },
                files: [
                    {src: ['dist/*']}
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-shell');

    grunt.registerTask(
        'default',
        [
            'shell:makeDistFolder',
            'shell:copyPackage',
            'shell:npmInstall',
            'shell:copySrc',
            'compress'
        ]
    );
};
