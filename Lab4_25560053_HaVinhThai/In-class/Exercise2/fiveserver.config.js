// Five Server config: don't live-reload the page when the backend writes files
module.exports = {
  ignore: [
    '**/uploads/**',
    '**/node_modules/**'
  ]
};
