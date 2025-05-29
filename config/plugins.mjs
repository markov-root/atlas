// config/plugins.mjs - Updated to handle audio subfolder structure
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
        
        // Copy chapter assets (images and audio) to the build output
        const chaptersDir = path.join(context.siteDir, 'docs', 'chapters');
        
        if (fs.existsSync(chaptersDir)) {
          const chapters = fs.readdirSync(chaptersDir);
          
          for (const chapter of chapters) {
            const chapterPath = path.join(chaptersDir, chapter);
            
            // Skip if not a directory
            if (!fs.statSync(chapterPath).isDirectory()) continue;
            
            // Copy images
            const chapterImgDir = path.join(chapterPath, 'img');
            if (fs.existsSync(chapterImgDir)) {
              const targetImgDir = path.join(outDir, 'chapters', chapter, 'img');
              
              // Create target directory
              fs.mkdirSync(targetImgDir, { recursive: true });
              
              // Copy all images
              const images = fs.readdirSync(chapterImgDir);
              for (const image of images) {
                const srcPath = path.join(chapterImgDir, image);
                const destPath = path.join(targetImgDir, image);
                fs.copyFileSync(srcPath, destPath);
              }
              
              console.log(`✅ Copied images for chapter ${chapter}`);
            }
            
            // Copy audio files
            const chapterAudioDir = path.join(chapterPath, 'audio');
            if (fs.existsSync(chapterAudioDir)) {
              const targetAudioDir = path.join(outDir, 'chapters', chapter, 'audio');
              
              // Create target directory
              fs.mkdirSync(targetAudioDir, { recursive: true });
              
              // Copy all audio files
              const audioFiles = fs.readdirSync(chapterAudioDir);
              for (const audioFile of audioFiles) {
                const srcPath = path.join(chapterAudioDir, audioFile);
                const destPath = path.join(targetAudioDir, audioFile);
                
                // Only copy actual files (not directories)
                if (fs.statSync(srcPath).isFile()) {
                  fs.copyFileSync(srcPath, destPath);
                }
              }
              
              console.log(`🎵 Copied audio files for chapter ${chapter}`);
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
