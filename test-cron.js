#!/usr/bin/env node

/**
 * Test script for debugging Betley cron job issues
 * Usage: node test-cron.js [your-domain] [cron-secret]
 */

const https = require('https');
const http = require('http');

const domain = process.argv[2] || 'your-domain.vercel.app';
const cronSecret = process.argv[3] || 'your-cron-secret';

if (!domain || !cronSecret || domain === 'your-domain.vercel.app' || cronSecret === 'your-cron-secret') {
  console.log('Usage: node test-cron.js <your-domain> <cron-secret>');
  console.log('Example: node test-cron.js betley.vercel.app abc123xyz');
  process.exit(1);
}

const url = `https://${domain}/api/analytics/daily-update`;

console.log('🔍 Testing Betley cron job endpoint...');
console.log(`📍 URL: ${url}`);
console.log(`🔑 Using CRON_SECRET: ${cronSecret.substring(0, 4)}...`);
console.log('');

// Test 1: Manual trigger with Bearer token
console.log('📋 Test 1: Manual trigger with Bearer token');
const postData = JSON.stringify({});

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${cronSecret}`,
    'User-Agent': 'test-script/1.0'
  }
};

const req = https.request(url, options, (res) => {
  console.log(`✅ Status: ${res.statusCode}`);
  console.log(`📄 Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📝 Response:');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log(data);
    }
    console.log('');
    
    // Test 2: Simulate Vercel cron request
    console.log('📋 Test 2: Simulate Vercel cron request');
    const cronOptions = {
      method: 'GET',
      headers: {
        'User-Agent': 'vercel-cron/1.0'
      }
    };
    
    const cronReq = https.request(url, cronOptions, (cronRes) => {
      console.log(`✅ Status: ${cronRes.statusCode}`);
      
      let cronData = '';
      cronRes.on('data', (chunk) => {
        cronData += chunk;
      });
      
      cronRes.on('end', () => {
        console.log('📝 Response:');
        try {
          const parsed = JSON.parse(cronData);
          console.log(JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log(cronData);
        }
        
        console.log('');
        console.log('🎯 Debugging Tips:');
        console.log('1. Check Vercel Function logs in your dashboard');
        console.log('2. Verify CRON_SECRET is set in Vercel environment variables');
        console.log('3. Ensure vercel.json is deployed (check deployment logs)');
        console.log('4. Cron schedule "0 6 * * *" runs at 6:00 AM UTC daily');
        console.log('5. Check if your Vercel plan supports cron jobs');
      });
    });
    
    cronReq.on('error', (e) => {
      console.error('❌ Cron test error:', e.message);
    });
    
    cronReq.end();
  });
});

req.on('error', (e) => {
  console.error('❌ Manual test error:', e.message);
});

req.write(postData);
req.end();