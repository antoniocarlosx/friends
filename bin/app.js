#! /usr/bin/env node

import main from '../index.js';

main({
  port: process.env.PORT || 8000,
  host: process.env.HOST || 'localhost'
});