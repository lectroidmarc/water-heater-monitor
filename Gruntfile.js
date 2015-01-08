module.exports = function(grunt) {
  grunt.initConfig({
    js_files: ['src/js/*.js'],
    css_files: ['src/css/*.css'],
    concat: {
      scripts: {
        src: ['<%= js_files %>'],
        dest: 'build/main.concat.js'
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
    cssmin: {
      styles: {
        files: {
          'css/main.min.css': ['<%= css_files %>']
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
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-jsdoc');

  grunt.registerTask('hintify', ['jshint:beforeconcat', 'concat:scripts', 'jshint:afterconcat']);
  grunt.registerTask('jsdist', ['hintify', 'uglify']);
  grunt.registerTask('dist', ['jsdist', 'cssmin']);
  grunt.registerTask('default', ['watch']);
};
