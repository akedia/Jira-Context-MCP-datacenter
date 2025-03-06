import axios, { AxiosError, AxiosResponse } from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
// 导入环境变量加载工具
import { reloadEnv, getJiraConfig } from '../utils/env-loader';
import { JiraError, JiraIssue, JiraProject, JiraProjectListResponse, JiraSearchParams, JiraSearchResponse, JiraIssueTypeResponse } from "~/types/jira";

// 移除原始环境变量加载
// dotenv.config();

// Jira API 服务类
export class JiraService {
  private baseUrl: string;
  private auth: {
    username: string;
    password: string;
  };

  constructor() {
    // 使用环境变量重载工具获取最新配置
    const jiraConfig = getJiraConfig();
    
    this.baseUrl = jiraConfig.baseUrl;
    this.auth = {
      username: jiraConfig.username,
      password: jiraConfig.apiToken
    };
    
    console.log(`Jira API 初始化: ${this.baseUrl} (${this.auth.username})`);
  }

  // 重新加载配置方法
  public reloadConfig(): void {
    const jiraConfig = getJiraConfig();
    
    this.baseUrl = jiraConfig.baseUrl;
    this.auth = {
      username: jiraConfig.username,
      password: jiraConfig.apiToken
    };
    
    console.log(`Jira API 配置已重新加载: ${this.baseUrl} (${this.auth.username})`);
  }

  private async request<T>(endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any): Promise<T> {
    try {
      console.log(`Calling ${this.baseUrl}${endpoint}`);
      
      // 使用Authorization头部来进行认证
      const authStr = Buffer.from(`${this.auth.username}:${this.auth.password}`).toString('base64');
      
      const config = {
        method,
        url: `${this.baseUrl}${endpoint}`,
        // 移除auth对象，使用Authorization头
        headers: {
          'Authorization': `Basic ${authStr}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        data: method === 'POST' ? data : undefined,
      };
      
      console.log(`使用认证: ${this.auth.username}`);
      
      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        console.error(`请求失败: ${error.response.status} ${JSON.stringify(error.response.data)}`);
        throw {
          status: error.response.status,
          err: (error.response.data as { errorMessages?: string[] })?.errorMessages?.[0] || "Unknown error",
        } as JiraError;
      }
      console.error(`请求错误: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to make request to Jira API: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a Jira issue by key
   */
  async getIssue(issueKey: string): Promise<JiraIssue> {
    const endpoint = `/rest/api/2/issue/${issueKey}`;
    const response = await this.request<JiraIssue>(endpoint);
    this.logResponseToFile(endpoint, response);
    return response;
  }

  /**
   * Search for Jira issues using JQL
   */
  async searchIssues(params: JiraSearchParams): Promise<JiraSearchResponse> {
    const endpoint = `/rest/api/2/search`;
    const response = await this.request<JiraSearchResponse>(endpoint, 'POST', params);
    this.logResponseToFile(endpoint, response);
    return response;
  }

  /**
   * Get issues assigned to the current user
   */
  async getAssignedIssues(projectKey?: string, maxResults: number = 50): Promise<JiraSearchResponse> {
    const jql = projectKey 
      ? `assignee = currentUser() AND project = ${projectKey} ORDER BY updated DESC` 
      : 'assignee = currentUser() ORDER BY updated DESC';
    
    return this.searchIssues({
      jql,
      maxResults,
      fields: ['summary', 'description', 'status', 'issuetype', 'priority', 'assignee', 'project'],
    });
  }

  /**
   * Get issues by type
   */
  async getIssuesByType(issueType: string, projectKey?: string, maxResults: number = 50): Promise<JiraSearchResponse> {
    const jql = projectKey 
      ? `issuetype = "${issueType}" AND project = ${projectKey} ORDER BY updated DESC` 
      : `issuetype = "${issueType}" ORDER BY updated DESC`;
    
    return this.searchIssues({
      jql,
      maxResults,
      fields: ['summary', 'description', 'status', 'issuetype', 'priority', 'assignee', 'project'],
    });
  }

  /**
   * Get list of projects
   */
  async getProjects(): Promise<JiraProject[]> {
    const endpoint = `/rest/api/2/project`;
    const response = await this.request<JiraProject[]>(endpoint);
    this.logResponseToFile(endpoint, response);
    return response;
  }
  
  /**
   * Get list of issue types
   */
  async getIssueTypes(): Promise<JiraIssueTypeResponse> {
    const endpoint = `/rest/api/2/issuetype`;
    const response = await this.request<JiraIssueTypeResponse>(endpoint);
    this.logResponseToFile(endpoint, response);
    return response;
  }

  // Helper function to log response to file
  private logResponseToFile(endpoint: string, response: any): void {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const filename = path.join(logsDir, `jira-${endpoint.replace(/\//g, '-')}-${Date.now()}.json`);
    fs.writeFileSync(filename, JSON.stringify(response, null, 2));
    console.log(`Response logged to ${filename}`);
  }
} 