#!/usr/bin/env node

import dotenv from 'dotenv';
import { JiraMcpServer } from './server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
// 导入环境变量重载工具
import { reloadEnv, getJiraConfig } from './utils/env-loader';

// 使用环境变量重载工具替代原始的dotenv加载
// dotenv.config();
const env = reloadEnv();

// 获取Jira配置
const jiraConfig = getJiraConfig();
const JIRA_BASE_URL = jiraConfig.baseUrl;
const JIRA_USERNAME = jiraConfig.username;
const JIRA_API_TOKEN = jiraConfig.apiToken;
const HTTP_PORT = process.env.HTTP_PORT ? parseInt(process.env.HTTP_PORT, 10) : 3000;

// Validate required environment variables
if (!JIRA_BASE_URL) {
  console.error('❌ JIRA_BASE_URL environment variable is required');
  process.exit(1);
}

if (!JIRA_USERNAME) {
  console.error('❌ JIRA_USERNAME environment variable is required');
  process.exit(1);
}

if (!JIRA_API_TOKEN) {
  console.error('❌ JIRA_API_TOKEN environment variable is required');
  process.exit(1);
}

// Initialize the server
const server = new JiraMcpServer();

// Start the appropriate transport based on NODE_ENV
async function start() {
  console.log('Starting Jira MCP server...');
  console.log(`环境配置: JIRA_BASE_URL=${JIRA_BASE_URL}, JIRA_USERNAME=${JIRA_USERNAME}, HTTP_PORT=${HTTP_PORT}`);

  if (process.env.NODE_ENV === 'cli') {
    console.log('🔌 Using stdio transport');
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } else {
    console.log(`🌐 Starting HTTP server on port ${HTTP_PORT}`);
    await server.startHttpServer(HTTP_PORT);
  }
}

start().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}); 