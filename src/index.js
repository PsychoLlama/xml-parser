#!/usr/bin/env node
import lang from './language';

const content = process.argv[2];
const parsed = lang.Document.tryParse(content);

process.stdout.write(JSON.stringify(parsed, null, 2));
