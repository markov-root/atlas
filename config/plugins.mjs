// config/plugins.js
export function createChapterImagesPlugin() {
  return function chapterImagesPlugin(context, options) {
    return {
      name: 'chapter-images-plugin',
      
      configureWebpack(config, isServer, utils) {
        if (isServer) return {};
        
        const path = require('path');
        
        return {
          devServer: {
            setupMiddlewares: (middlewares, devServer) => {
              if (!devServer) {
                throw new Error('webpack-dev-server is not defined');
              }
              
              const express = require('express');
              
              // Serve chapter images during development
              devServer.app.use('/chapters', express.static(path.join(context.siteDir, 'docs/chapters')));
              
              return middlewares;
            },
          },
        };
      },
      
      async postBuild(props) {
        const fs = require('fs');
        const path = require('path');
        const { outDir } = props;
        
        // Copy chapter images to the build output
        const chaptersDir = path.join(context.siteDir, 'docs', 'chapters');
        
        if (fs.existsSync(chaptersDir)) {
          const chapters = fs.readdirSync(chaptersDir);
          
          for (const chapter of chapters) {
            const chapterImgDir = path.join(chaptersDir, chapter, 'img');
            
            if (fs.existsSync(chapterImgDir)) {
              const targetDir = path.join(outDir, 'chapters', chapter, 'img');
              
              // Create target directory
              fs.mkdirSync(targetDir, { recursive: true });
              
              // Copy all images
              const images = fs.readdirSync(chapterImgDir);
              for (const image of images) {
                const srcPath = path.join(chapterImgDir, image);
                const destPath = path.join(targetDir, image);
                fs.copyFileSync(srcPath, destPath);
              }
              
              console.log(`Copied images for chapter ${chapter}`);
            }
          }
        }
      }
    };
  };
}

export const pluginsConfig = [
  createChapterImagesPlugin(),
];
