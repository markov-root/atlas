// config/plugins.mjs - Updated to handle audio, images, AND PDF files
export function createChapterImagesPlugin() {
  return function chapterImagesPlugin(context, options) {
    return {
      name: 'chapter-assets-plugin',
      
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
              
              // Serve chapter assets during development
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
        
        // Copy chapter assets (images, audio, AND PDFs) to the build output
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
            
            // Copy PDF files - NEW!
            const chapterPdfDir = path.join(chapterPath, 'pdf');
            if (fs.existsSync(chapterPdfDir)) {
              const targetPdfDir = path.join(outDir, 'chapters', chapter, 'pdf');
              
              // Create target directory
              fs.mkdirSync(targetPdfDir, { recursive: true });
              
              // Copy all PDF files
              const pdfFiles = fs.readdirSync(chapterPdfDir);
              for (const pdfFile of pdfFiles) {
                const srcPath = path.join(chapterPdfDir, pdfFile);
                const destPath = path.join(targetPdfDir, pdfFile);
                
                // Only copy actual files (not directories)
                if (fs.statSync(srcPath).isFile()) {
                  fs.copyFileSync(srcPath, destPath);
                }
              }
              
              console.log(`📄 Copied PDF files for chapter ${chapter}`);
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
