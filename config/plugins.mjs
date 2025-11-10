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
        
        // Track copied assets
        let totalChapters = 0;
        let assetCounts = { images: 0, audio: 0, pdf: 0, tts: 0, latex: 0 };
        
        // Copy chapter assets (images, audio, PDFs, AND TTS) to the build output
        const chaptersDir = path.join(context.siteDir, 'docs', 'chapters');
        
        if (fs.existsSync(chaptersDir)) {
          const chapters = fs.readdirSync(chaptersDir);
          
          for (const chapter of chapters) {
            const chapterPath = path.join(chaptersDir, chapter);
            
            // Skip if not a directory
            if (!fs.statSync(chapterPath).isDirectory()) continue;
            
            totalChapters++;
            
            // Copy images
            const chapterImgDir = path.join(chapterPath, 'img');
            if (fs.existsSync(chapterImgDir)) {
              const targetImgDir = path.join(outDir, 'chapters', chapter, 'img');
              fs.mkdirSync(targetImgDir, { recursive: true });
              
              const images = fs.readdirSync(chapterImgDir);
              for (const image of images) {
                const srcPath = path.join(chapterImgDir, image);
                const destPath = path.join(targetImgDir, image);
                fs.copyFileSync(srcPath, destPath);
              }
              assetCounts.images += images.length;
            }
            
            // Copy audio files
            const chapterAudioDir = path.join(chapterPath, 'audio');
            if (fs.existsSync(chapterAudioDir)) {
              const targetAudioDir = path.join(outDir, 'chapters', chapter, 'audio');
              fs.mkdirSync(targetAudioDir, { recursive: true });
              
              const audioFiles = fs.readdirSync(chapterAudioDir);
              for (const audioFile of audioFiles) {
                const srcPath = path.join(chapterAudioDir, audioFile);
                const destPath = path.join(targetAudioDir, audioFile);
                
                if (fs.statSync(srcPath).isFile()) {
                  fs.copyFileSync(srcPath, destPath);
                  assetCounts.audio++;
                }
              }
            }
            
            // Copy PDF files
            const chapterPdfDir = path.join(chapterPath, 'pdf');
            if (fs.existsSync(chapterPdfDir)) {
              const targetPdfDir = path.join(outDir, 'chapters', chapter, 'pdf');
              fs.mkdirSync(targetPdfDir, { recursive: true });
              
              const pdfFiles = fs.readdirSync(chapterPdfDir);
              for (const pdfFile of pdfFiles) {
                const srcPath = path.join(chapterPdfDir, pdfFile);
                const destPath = path.join(targetPdfDir, pdfFile);
                
                if (fs.statSync(srcPath).isFile()) {
                  fs.copyFileSync(srcPath, destPath);
                  assetCounts.pdf++;
                }
              }
            }
            
            // Copy TTS files
            const chapterTtsDir = path.join(chapterPath, 'tts');
            if (fs.existsSync(chapterTtsDir)) {
              const targetTtsDir = path.join(outDir, 'chapters', chapter, 'tts');
              fs.mkdirSync(targetTtsDir, { recursive: true });
              
              const ttsFiles = fs.readdirSync(chapterTtsDir);
              for (const ttsFile of ttsFiles) {
                const srcPath = path.join(chapterTtsDir, ttsFile);
                const destPath = path.join(targetTtsDir, ttsFile);
                
                if (fs.statSync(srcPath).isFile()) {
                  fs.copyFileSync(srcPath, destPath);
                  assetCounts.tts++;
                }
              }
            }
            
            // Copy LaTeX files (if they exist)
            const chapterLatexDir = path.join(chapterPath, 'latex');
            if (fs.existsSync(chapterLatexDir)) {
              const targetLatexDir = path.join(outDir, 'chapters', chapter, 'latex');
              fs.mkdirSync(targetLatexDir, { recursive: true });
              
              const latexFiles = fs.readdirSync(chapterLatexDir);
              for (const latexFile of latexFiles) {
                const srcPath = path.join(chapterLatexDir, latexFile);
                const destPath = path.join(targetLatexDir, latexFile);
                
                if (fs.statSync(srcPath).isFile()) {
                  fs.copyFileSync(srcPath, destPath);
                  assetCounts.latex++;
                }
              }
            }
          }
          
          // Single summary log at the end
          console.log(`[INFO] [plugins.mjs] Copied chapter assets: ${totalChapters} chapters, ${assetCounts.images} images, ${assetCounts.audio} audio, ${assetCounts.pdf} PDFs, ${assetCounts.tts} TTS, ${assetCounts.latex} LaTeX files`);
        }
      }
    };
  };
}

export const pluginsConfig = [
  createChapterImagesPlugin(),
];
