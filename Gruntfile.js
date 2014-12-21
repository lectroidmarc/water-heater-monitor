module.exports = function(grunt) {
  grunt.initConfig({
    uglify: {
      options: {
        sourceMap: true,
        sourceMapName: 'js/sourcemap.map'
      },
      scripts: {
        files: {
          'js/main.min.js': ['js/*.js', '!js/*.min.js']
        }
      }
    },
    watch: {
      scripts: {
        files: ['js/*.js', '!js/*.min.js'],
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
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('dist', ['uglify']);
  grunt.registerTask('default', ['watch']);
};
