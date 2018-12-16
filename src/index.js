#!/usr/bin/env node
import lang from './language';
import fs from 'fs';

const filename = process.argv[2];
const content = fs.readFileSync(filename, 'utf8');
const parsed = lang.Document.tryParse(content);

process.stdout.write(JSON.stringify(parsed, null, 2));
