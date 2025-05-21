// Mock the 'axios' module. This hoisting is important.
jest.mock('axios');

// Now, when we require('axios'), we get the mocked version.
const axios = require('axios');

// Define the mock implementations for axios instance methods that jiraApi will use
const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  interceptors: { // jiraService setup includes interceptors
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};

// Configure axios.create to return our mockAxiosInstance *before* requiring jiraService
axios.create.mockReturnValue(mockAxiosInstance);

// Now require the service to be tested. It will get the mocked axios and mocked instance.
const jiraService = require('../jiraService');
// config is not used directly in tests, but by jiraService.
// const config = require('../../config'); // Not needed in test file

// Spy on console.error to check error logging, and suppress it during tests
let consoleErrorSpy; 
// let consoleErrorSpy; // Duplicate removed

beforeEach(() => {
  // Reset all mocks on the instance before each test
  mockAxiosInstance.get.mockReset();
  mockAxiosInstance.post.mockReset();
  mockAxiosInstance.put.mockReset();
  mockAxiosInstance.interceptors.request.use.mockClear(); // Clear calls to interceptor setup
  mockAxiosInstance.interceptors.response.use.mockClear();
  
  // Spy on console.error and suppress its output during tests
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  // Restore console.error
  consoleErrorSpy.mockRestore();
});

afterEach(() => {
  // Restore console.error
  consoleErrorSpy.mockRestore();
});

describe('jiraService', () => {
  // Test that axios.create is called with the correct base URL and headers
  // This is implicitly tested by the fact that jiraService functions correctly
  // if mockAxiosInstance methods are called. Can add an explicit test if desired.
  
  // Re-initialize jiraService before tests if its internal state (like jiraApi instance)
  // needs to be fresh based on the mocked axios.create.
  // However, since `jiraApi` is defined at the module level of `jiraService.js`,
  // `jest.mock('axios')` and `axios.create.mockReturnValue(mockAxiosInstance)`
  // should ensure it's the mock instance from the start.

  describe('searchIssues', () => {
    it('should call the mock instance get with correct parameters and return data on success', async () => {
      const mockData = { total: 1, issues: [{ key: 'TEST-1' }] };
      mockAxiosInstance.get.mockResolvedValue({ data: mockData });

      const jql = 'project = TEST';
      const options = { fields: 'summary', maxResults: 10, startAt: 0 };
      const result = await jiraService.searchIssues(jql, options);

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/search', {
        params: {
          jql: jql,
          fields: options.fields,
          maxResults: options.maxResults,
          startAt: options.startAt,
          validateQuery: 'strict',
        },
      });
      expect(result).toEqual(mockData);
    });

    it('should use default parameters if options are not provided', async () => {
      const mockData = { total: 0, issues: [] };
      mockAxiosInstance.get.mockResolvedValue({ data: mockData });

      const jql = 'project = DEFAULT';
      await jiraService.searchIssues(jql);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/search', {
        params: {
          jql: jql,
          fields: 'summary,status,issuetype,priority,created,updated,assignee,labels', // Default fields
          maxResults: 50, // Default maxResults
          startAt: 0,     // Default startAt
          validateQuery: 'strict',
        },
      });
    });

    it('should throw an error if the API call fails', async () => {
      const errorMessage = 'Network Error';
      mockAxiosInstance.get.mockRejectedValue(new Error(errorMessage));

      const jql = 'project = TEST';
      await expect(jiraService.searchIssues(jql)).rejects.toThrow(`Failed to search JIRA issues: ${errorMessage}`);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('getIssue', () => {
    it('should call the mock instance get with correct issueIdOrKey and return data', async () => {
      const mockIssueData = { key: 'TEST-1', fields: { summary: 'Test Issue' } };
      mockAxiosInstance.get.mockResolvedValue({ data: mockIssueData });

      const issueIdOrKey = 'TEST-1';
      const options = { fields: 'summary,status', expand: 'changelog' };
      const result = await jiraService.getIssue(issueIdOrKey, options);

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/issue/${issueIdOrKey}`, { 
        params: {
          fields: options.fields,
          expand: options.expand,
        }
      });
      expect(result).toEqual(mockIssueData);
    });
    
    it('should call the mock instance get with correct issueIdOrKey and default options if none provided', async () => {
        const mockIssueData = { key: 'TEST-1', fields: { summary: 'Test Issue' } };
        mockAxiosInstance.get.mockResolvedValue({ data: mockIssueData });
  
        const issueIdOrKey = 'TEST-1';
        const result = await jiraService.getIssue(issueIdOrKey); // No options
  
        expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
        expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/issue/${issueIdOrKey}`, { 
          params: {
            fields: undefined, // Default from function signature
            expand: undefined, // Default from function signature
          }
        });
        expect(result).toEqual(mockIssueData);
      });

    it('should throw an error if the API call fails', async () => {
      const issueIdOrKey = 'TEST-1';
      const errorMessage = 'Issue not found';
      mockAxiosInstance.get.mockRejectedValue(new Error(errorMessage));

      await expect(jiraService.getIssue(issueIdOrKey)).rejects.toThrow(`Failed to get JIRA issue ${issueIdOrKey}: ${errorMessage}`);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('addIssueComment', () => {
    it('should call the mock instance post with correct issueIdOrKey and commentBody', async () => {
      const mockCommentResponse = { id: '10001', body: 'Test comment added.' };
      mockAxiosInstance.post.mockResolvedValue({ data: mockCommentResponse });

      const issueIdOrKey = 'TEST-2';
      const commentBody = 'This is a test comment.';
      const result = await jiraService.addIssueComment(issueIdOrKey, commentBody);

      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(`/issue/${issueIdOrKey}/comment`, { body: commentBody });
      expect(result).toEqual(mockCommentResponse);
    });

    it('should throw an error if the API call fails', async () => {
      const issueIdOrKey = 'TEST-2';
      const commentBody = 'This is a test comment.';
      const errorMessage = 'Failed to add comment';
      mockAxiosInstance.post.mockRejectedValue(new Error(errorMessage));

      await expect(jiraService.addIssueComment(issueIdOrKey, commentBody)).rejects.toThrow(`Failed to add comment to JIRA issue ${issueIdOrKey}: ${errorMessage}`);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('updateIssue', () => {
    it('should call the mock instance put with correct issueIdOrKey and payload', async () => {
      // .put usually returns a 204 No Content, so data might be undefined or empty
      mockAxiosInstance.put.mockResolvedValue({}); 

      const issueIdOrKey = 'TEST-3';
      const updatePayload = { fields: { summary: 'New Summary' } };
      await jiraService.updateIssue(issueIdOrKey, updatePayload);

      expect(mockAxiosInstance.put).toHaveBeenCalledTimes(1);
      expect(mockAxiosInstance.put).toHaveBeenCalledWith(`/issue/${issueIdOrKey}`, updatePayload);
    });

    it('should throw an error if the API call fails', async () => {
      const issueIdOrKey = 'TEST-3';
      const updatePayload = { fields: { summary: 'New Summary' } };
      const errorMessage = 'Update failed';
      mockAxiosInstance.put.mockRejectedValue(new Error(errorMessage));

      await expect(jiraService.updateIssue(issueIdOrKey, updatePayload)).rejects.toThrow(`Failed to update JIRA issue ${issueIdOrKey}: ${errorMessage}`);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('getMyself', () => {
    it('should call the mock instance get with /myself and return data', async () => {
      const mockSelfData = { accountId: '123', displayName: 'Test User' };
      mockAxiosInstance.get.mockResolvedValue({ data: mockSelfData });

      const result = await jiraService.getMyself();

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/myself');
      expect(result).toEqual(mockSelfData);
    });

    it('should throw an error if the API call fails', async () => {
      const errorMessage = 'Unauthorized';
      mockAxiosInstance.get.mockRejectedValue(new Error(errorMessage));

      await expect(jiraService.getMyself()).rejects.toThrow(`Failed to fetch JIRA user details: ${errorMessage}`);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('getIssueComments', () => {
    it('should call the mock instance get with correct parameters and return comments', async () => {
      const mockComments = { startAt: 0, maxResults: 50, total: 1, comments: [{ id: 'c1', body: 'A comment' }] };
      mockAxiosInstance.get.mockResolvedValue({ data: mockComments });

      const issueIdOrKey = 'TEST-C1';
      const result = await jiraService.getIssueComments(issueIdOrKey);

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/issue/${issueIdOrKey}/comment`, {
        params: {
          orderBy: '-created'
        }
      });
      expect(result).toEqual(mockComments);
    });

    it('should throw an error if fetching comments fails', async () => {
      const issueIdOrKey = 'TEST-C1';
      const errorMessage = 'Failed to fetch comments';
      mockAxiosInstance.get.mockRejectedValue(new Error(errorMessage));

      await expect(jiraService.getIssueComments(issueIdOrKey)).rejects.toThrow(`Failed to get comments for JIRA issue ${issueIdOrKey}: ${errorMessage}`);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
