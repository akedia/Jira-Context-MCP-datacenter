export interface JiraError {
  status: number;
  err: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    description?: string;
    status: {
      name: string;
      statusCategory: {
        name: string;
      };
    };
    issuetype: {
      name: string;
      iconUrl: string;
    };
    priority?: {
      name: string;
      iconUrl: string;
    };
    assignee?: {
      displayName: string;
      emailAddress: string;
      name: string;
    };
    reporter?: {
      displayName: string;
      emailAddress: string;
      name: string;
    };
    created: string;
    updated: string;
    project: {
      key: string;
      name: string;
    };
    labels?: string[];
    components?: Array<{
      name: string;
    }>;
    fixVersions?: Array<{
      name: string;
    }>;
    duedate?: string;
  };
}

export interface JiraSearchParams {
  jql: string;
  startAt?: number;
  maxResults?: number;
  fields?: string[];
  expand?: string[];
}

export interface JiraSearchResponse {
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraIssue[];
}

export interface JiraUser {
  name: string;
  displayName: string;
  emailAddress: string;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  description?: string;
  lead: JiraUser;
}

export interface JiraProjectListResponse {
  projects: JiraProject[];
}

export interface JiraIssueTypeResponse {
  issueTypes: Array<{
    id: string;
    name: string;
    description: string;
    iconUrl: string;
  }>;
} 