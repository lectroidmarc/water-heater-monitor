module.exports = function(grunt) {
  grunt.initConfig({
    css_files: ['src/css/*.css'],
    js_files: ['src/js/*.js'],
    concat: {
      scripts: {
        src: ['<%= js_files %>'],
        dest: 'build/main.concat.js'
      }
    },
    connect: {
      server: {
        options: {
          livereload: true
        }
      }
    },
    cssmin: {
      styles: {
        files: {
          'css/main.min.css': ['<%= css_files %>']
        }
      }
    },
    htmlmin: {
      options: {
        removeComments: true,
        collapseWhitespace: true
      },
      dist: {
        files: {
          'index.html': ['src/index.html']
        }
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        esnext: true,
        newcap: true,
        quotmark: 'single'
      },
      beforeconcat: {
        src: ['Gruntfile.js', '<%= js_files %>']
      },
      afterconcat: {
        options: {
          undef: true,
          globals: {
            Highcharts: true,
            mows: true
          },
          browser: true,
          devel: true,
          jquery: true
        },
        src: ['<%= concat.scripts.dest %>']
      }
    },
    uglify: {
      options: {
        sourceMap: true
      },
      scripts: {
        files: {
          'js/main.min.js': ['<%= js_files %>']
        }
      }
    },
    watch: {
      scripts: {
        files: ['<%= js_files %>'],
        tasks: ['jsdist']
      },
      styles: {
        files: ['<%= css_files %>'],
        tasks: ['cssmin']
      },
      html: {
        files: ['src/index.html'],
        tasks: ['htmlmin']
      },
      other: {
        options: {
          livereload: true,
        },
        files: ['index.html', 'css/main.min.css', 'js/main.min.js']
      }
    },
    jsdoc: {
      dist: {
        src: ['<%= js_files %>'],
        dest: 'jsdoc'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-jsdoc');

  grunt.registerTask('jsdist', ['hintify', 'uglify']);
  grunt.registerTask('dist', ['jsdist', 'cssmin', 'htmlmin']);
  grunt.registerTask('hintify', ['jshint:beforeconcat', 'concat', 'jshint:afterconcat']);
  grunt.registerTask('default', ['connect', 'watch']);
};
