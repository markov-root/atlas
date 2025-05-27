// debug-config.js - Test if all config modules load properly
async function testConfig() {
  try {
    console.log('Testing config imports...');
    
    const { metadata } = await import('./config/metadata.mjs');
    console.log('✅ metadata.mjs loaded:', !!metadata);
    console.log('   - url:', metadata.url);
    console.log('   - baseUrl:', metadata.baseUrl);
    
    const { themeConfig } = await import('./config/theme.mjs');
    console.log('✅ theme.mjs loaded:', !!themeConfig);
    console.log('   - has navbar:', !!themeConfig.navbar);
    console.log('   - has footer:', !!themeConfig.footer);
    
    const { presetsConfig } = await import('./config/presets.mjs');
    console.log('✅ presets.mjs loaded:', !!presetsConfig);
    
    const { pluginsConfig } = await import('./config/plugins.mjs');
    console.log('✅ plugins.mjs loaded:', !!pluginsConfig);
    
    const { stylesheetsConfig } = await import('./config/stylesheets.mjs');
    console.log('✅ stylesheets.mjs loaded:', !!stylesheetsConfig);
    
    console.log('\n🎯 Testing Docusaurus config loading...');
    const docusaurusConfig = await import('./docusaurus.config.js');
    console.log('✅ docusaurus.config.js loaded:', !!docusaurusConfig.default);
    
    const config = docusaurusConfig.default;
    console.log('   - Title:', config.title);
    console.log('   - URL:', config.url);
    console.log('   - BaseURL:', config.baseUrl);
    console.log('   - Has presets:', !!config.presets);
    console.log('   - Has themeConfig:', !!config.themeConfig);
    console.log('   - Has navbar in themeConfig:', !!config.themeConfig?.navbar);
    console.log('   - Has footer in themeConfig:', !!config.themeConfig?.footer);
    
  } catch (error) {
    console.error('❌ Config loading error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testConfig();
