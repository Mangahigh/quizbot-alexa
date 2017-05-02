/*global module:true */

module.exports = function (grunt) {
    /*jshint camelcase: false */
    'use strict';

    grunt.initConfig({
        mochaTest: {
            test: {
                src: ['test/**/*.js']
            }
        },

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

        prompt: {
            target: {
                options: {
                    questions: [
                        {
                            config: 'appId',
                            type: 'input',
                            message: 'Enter your APP ID',
                            validate: function (str) {
                                return !!str.match(/^amzn1\.ask\.skill\.[a-f0-9\-]+$/);
                            }
                        }
                    ]
                }
            }
        },

        replace: {
            appId: {
                src: ['dist/index.js'],
                overwrite: true,                 // overwrite matched source files
                replacements: [{
                    from: /var APP_ID = undefined;/g,
                    to: "var APP_ID = '<%= appId %>';"
                }]
            }
        },

        compress: {
            main: {
                options: {
                    archive: 'dist/production.zip',
                    store: false,
                    mode: 'zip',
                    level: 'zip'
                },
                files: [{
                    expand: true,
                    cwd: 'dist/',
                    src: ['**/*'],
                    dest: ''
                }]
            }
        }
    });

    grunt.loadNpmTasks('grunt-mocha-test');

    grunt.loadNpmTasks('grunt-text-replace');
    grunt.loadNpmTasks('grunt-prompt');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-contrib-compress');

    grunt.registerTask(
        'default',
        [
            'prompt',
            'test',
            'shell:makeDistFolder',
            'shell:copyPackage',
            'shell:npmInstall',
            'shell:copySrc',
            'replace',
            'compress'
        ]
    );

    grunt.registerTask('test', ['mochaTest']);
};
