#!/usr/bin/env node

const pngToIcns = require('png-to-icns');
const fs = require('fs');
const path = require('path');

const input = path.join(__dirname, '..', 'build', 'icon.png');
const output = path.join(__dirname, '..', 'build', 'icon.icns');

console.log('Converting PNG to ICNS...');
console.log('Input:', input);
console.log('Output:', output);

pngToIcns(input, output)
  .then(() => {
    console.log('✓ ICNS file created successfully!');
  })
  .catch((err) => {
    console.error('Error creating ICNS file:', err);
    process.exit(1);
  });

