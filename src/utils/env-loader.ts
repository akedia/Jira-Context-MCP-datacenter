/**
 * 环境变量加载工具
 * 用于确保每次使用环境变量时都获取最新值
 */

import dotenv from 'dotenv';
import path from 'path';

/**
 * 重新加载环境变量
 * 清除缓存并重新从.env文件加载
 * @param envPath - .env文件路径（可选）
 * @param varsToReset - 要重置的环境变量列表（默认为Jira相关变量）
 * @returns 加载的环境变量对象
 */
export function reloadEnv(
  envPath?: string, 
  varsToReset: string[] = ['JIRA_BASE_URL', 'JIRA_USERNAME', 'JIRA_API_TOKEN']
): NodeJS.ProcessEnv {
  // 清除指定的环境变量
  varsToReset.forEach(varName => {
    delete process.env[varName];
  });
  
  // 加载配置
  const result = dotenv.config({ path: envPath });
  
  if (result.error) {
    console.warn(`环境变量加载警告: ${result.error.message}`);
  }
  
  // 验证关键环境变量是否存在
  const missingVars: string[] = [];
  varsToReset.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.warn(`警告: 以下环境变量未设置: ${missingVars.join(', ')}`);
  }
  
  return process.env;
}

/**
 * 获取特定环境变量的值
 * 每次调用都确保获取最新值
 * @param varName - 环境变量名称
 * @param defaultValue - 若环境变量不存在时的默认值
 * @returns 环境变量值或默认值
 */
export function getEnvVar<T>(varName: string, defaultValue?: T): string | T | undefined {
  // 仅重新加载特定的环境变量
  reloadEnv(undefined, [varName]);
  
  return process.env[varName] || defaultValue;
}

/**
 * 获取Jira API配置
 * @returns Jira API配置对象
 */
export function getJiraConfig(): { baseUrl: string; username: string; apiToken: string } {
  const env = reloadEnv();
  
  const baseUrl = env.JIRA_BASE_URL;
  const username = env.JIRA_USERNAME;
  const apiToken = env.JIRA_API_TOKEN;
  
  if (!baseUrl || !username || !apiToken) {
    throw new Error('缺少必要的Jira API配置。请检查环境变量是否设置正确。');
  }
  
  return {
    baseUrl,
    username,
    apiToken
  };
} 