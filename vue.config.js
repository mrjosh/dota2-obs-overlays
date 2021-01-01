module.exports = {
  runtimeCompiler: true,
  devServer: {
    port: "8000",
  },
  outputDir: `${process.cwd()}/dist/`,
  configureWebpack: config => {
    config.performance = {
      hints: false,
    };
  },
  publicPath: process.env.TARGET_BUILD === 'electron' ? `${process.cwd()}/dist/` : "/",
  pages: {
    index: {
      entry: 'src/main.js',
      template: 'public/index.html',
      filename: 'index.html',
    },
  },
};
