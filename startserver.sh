#!/bin/sh
cd publicAuth && node auth.js --port 4000 &&
cd.. && cd graphql && npx serverless offline