module.exports = function(grunt) {
  grunt.initConfig({
    js_files: ['js/*.js', '!js/*.concat.js', '!js/*.min.js'],
    concat: {
      dist: {
        src: ['<%= js_files %>'],
        dest: 'js/main.concat.js'
      }
    },
    uglify: {
      options: {
        sourceMap: true,
        sourceMapName: 'js/sourcemap.map'
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
        newcap: true,
        quotmark: 'single',
        undef: true,
        globals: {
          Highcharts: true,
          mows: true
        },
        browser: true,
        devel: true,
        jquery: true,
        node: true
      },
      files: ['Gruntfile.js', 'js/main.concat.js']
    },
    watch: {
      scripts: {
        files: ['<%= js_files %>'],
        tasks: ['dist']
      },
      other: {
        options: {
          livereload: true,
        },
        files: ['index.html', 'css/main.css', 'js/*.min.js']
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
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-jsdoc');

  grunt.registerTask('dist', ['hintify', 'uglify']);
  grunt.registerTask('hintify', ['concat', 'jshint']);
  grunt.registerTask('default', ['watch']);
};
