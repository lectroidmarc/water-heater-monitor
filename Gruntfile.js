module.exports = function(grunt) {
  grunt.initConfig({
    js_files: ['js/*.js', '!js/*.min.js'],
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
      },
      files: ['Gruntfile.js', '<%= js_files %>']
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
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('dist', ['jshint', 'uglify']);
  grunt.registerTask('default', ['watch']);
};
