const ticketController = require('../ticketController');
const jiraService = require('../../services/jiraService');
const { validationResult } = require('express-validator');
const { 
  JIRA_ISSUETYPE_DEFECT, 
  JQL_LABEL_TRIAGE_PENDING, 
  JQL_LABEL_TRIAGE_NEED_MORE_INFO,
  JQL_GENERAL_RCCL_TRIAGE_LABELS,
  JQL_STATUS_IN_PROGRESS,
  JQL_PRIORITY_P1_GATING,
  JQL_STATUS_COMPLETED,
  JQL_LABEL_TRIAGE_REJECTED,
  JQL_STATUS_REJECTED,
  buildJql,
  TICKET_STATE_PENDING,
  TICKET_STATE_COMPLETED,
  JIRA_LABEL_TRIAGE_PENDING,
  JIRA_LABEL_TRIAGE_COMPLETED,
  JIRA_LABEL_TRIAGE_NEED_MORE_INFO,
  JIRA_LABEL_TRIAGE_REJECTED,
  JIRA_LABEL_TRIAGE_NRI,
} = require('../../config/jiraConstants');

// Mock an entire module
jest.mock('../../services/jiraService'); // Mocks all functions in jiraService
jest.mock('express-validator'); // Mocks validationResult

// Helper to create mock request and response objects
const mockRequest = (query = {}, params = {}, body = {}) => ({
  query,
  params,
  body,
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res); // For .send() if used (e.g. 204 No Content)
  return res;
};

describe('ticketController', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset mocks for jiraService functions before each test
    jiraService.searchIssues.mockReset();
    jiraService.updateIssue.mockReset();
    // Reset express-validator mock
    validationResult.mockReset();

    // Default to validation passing
    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([]), // For completeness
    });
    
    res = mockResponse();
    next = jest.fn(); // Mock for error handling or next middleware
  });

  describe('getDashboardSummary', () => {
    it('should fetch summary counts and return them as JSON', async () => {
      req = mockRequest({ 
        selectedDateFilter: 'week', 
        activeAssigneeFilter: 'me' 
      });

      // Mock return values for each call to jiraService.searchIssues
      jiraService.searchIssues
        .mockResolvedValueOnce({ total: 10 }) // Triage Pending
        .mockResolvedValueOnce({ total: 5 })  // In Progress
        .mockResolvedValueOnce({ total: 2 })  // Active P1
        .mockResolvedValueOnce({ total: 20 }) // Completed
        .mockResolvedValueOnce({ total: 3 })  // Rejected
        .mockResolvedValueOnce({ total: 1 }); // Waiting for Info

      await ticketController.getDashboardSummary(req, res, next);

      expect(jiraService.searchIssues).toHaveBeenCalledTimes(6);
      // Detailed JQL assertions can be added here if needed, using constants to build expected strings
      // For example, for the first call (Triage Pending):
      const { JIRA_ISSUETYPE_DEFECT, JQL_LABEL_TRIAGE_PENDING, buildJql: testBuildJql } = require('../../config/jiraConstants'); // require for test-side JQL construction
      const expectedTriagePendingJql = testBuildJql([JIRA_ISSUETYPE_DEFECT, JQL_LABEL_TRIAGE_PENDING]);
      expect(jiraService.searchIssues).toHaveBeenNthCalledWith(1, expectedTriagePendingJql, { maxResults: 0 });
      
      expect(res.json).toHaveBeenCalledWith({
        triagePending: 10,
        inProgress: 5,
        activeP1: 2,
        completed: 20,
        rejected: 3,
        waitingForInfo: 1,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 0 for counts if jiraService.searchIssues returns undefined total', async () => {
        req = mockRequest({}); // No filters
  
        jiraService.searchIssues.mockResolvedValue({}); // Simulate undefined total
  
        await ticketController.getDashboardSummary(req, res, next);
  
        expect(res.json).toHaveBeenCalledWith({
          triagePending: 0,
          inProgress: 0,
          activeP1: 0,
          completed: 0,
          rejected: 0,
          waitingForInfo: 0,
        });
        expect(next).not.toHaveBeenCalled();
      });

    it('should call next with error if jiraService.searchIssues fails', async () => {
      req = mockRequest({});
      const errorMessage = 'JIRA API Error';
      // Ensure this mock rejection is specific to this test and does not affect others.
      // mockReset in beforeEach should handle this, but being explicit if needed:
      jiraService.searchIssues.mockReset(); // Reset before setting new mock behavior
      jiraService.searchIssues.mockRejectedValueOnce(new Error(errorMessage)); // mockRejectedValueOnce for single rejection

      await ticketController.getDashboardSummary(req, res, next);
      
      // Error is caught by controller's own try-catch, not passed to next by asyncHandler here
      expect(next).not.toHaveBeenCalled(); 
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Failed to fetch dashboard summary data" });
    });

    it('should return early if validation errors exist', async () => {
        validationResult.mockReturnValue({
          isEmpty: jest.fn().mockReturnValue(false), // Simulate validation failure
          array: jest.fn().mockReturnValue([{ msg: 'Invalid input' }]),
        });
        req = mockRequest({});
  
        await ticketController.getDashboardSummary(req, res, next);
  
        // Expect that no jiraService methods were called and no response was sent by this controller
        expect(jiraService.searchIssues).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled(); // The validation middleware in routes should handle the response
      });
  });

  describe('updateTicketState', () => {
    const issueKey = 'TEST-100';

    it('should update ticket state to pending and return 204', async () => {
      req = mockRequest({}, { issueKey }, { targetState: TICKET_STATE_PENDING });
      jiraService.updateIssue.mockResolvedValue(undefined); // Simulate successful update (no content)

      await ticketController.updateTicketState(req, res, next);

      const expectedLabelsToRemove = [
        JIRA_LABEL_TRIAGE_PENDING, JIRA_LABEL_TRIAGE_COMPLETED, 
        JIRA_LABEL_TRIAGE_NEED_MORE_INFO, JIRA_LABEL_TRIAGE_REJECTED, JIRA_LABEL_TRIAGE_NRI
      ];
      const expectedUpdateOperations = expectedLabelsToRemove.map(label => ({ remove: label }));
      expectedUpdateOperations.push({ add: JIRA_LABEL_TRIAGE_PENDING });

      expect(jiraService.updateIssue).toHaveBeenCalledWith(issueKey, {
        update: {
          labels: expectedUpdateOperations,
        },
      });
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should update ticket state to completed and return 204', async () => {
        req = mockRequest({}, { issueKey }, { targetState: TICKET_STATE_COMPLETED });
        jiraService.updateIssue.mockResolvedValue(undefined);
  
        await ticketController.updateTicketState(req, res, next);
  
        const expectedLabelsToRemove = [
          JIRA_LABEL_TRIAGE_PENDING, JIRA_LABEL_TRIAGE_COMPLETED, 
          JIRA_LABEL_TRIAGE_NEED_MORE_INFO, JIRA_LABEL_TRIAGE_REJECTED, JIRA_LABEL_TRIAGE_NRI
        ];
        const expectedUpdateOperations = expectedLabelsToRemove.map(label => ({ remove: label }));
        expectedUpdateOperations.push({ add: JIRA_LABEL_TRIAGE_COMPLETED });
  
        expect(jiraService.updateIssue).toHaveBeenCalledWith(issueKey, {
          update: {
            labels: expectedUpdateOperations,
          },
        });
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.send).toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
      });

    it('should return 400 if targetState is invalid (though mostly handled by validation middleware)', async () => {
      // This test covers the default case in the switch statement of the controller
      req = mockRequest({}, { issueKey }, { targetState: 'invalidStateXYZ' });
      
      await ticketController.updateTicketState(req, res, next);

      expect(jiraService.updateIssue).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid target state.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if jiraService.updateIssue fails', async () => {
      req = mockRequest({}, { issueKey }, { targetState: TICKET_STATE_PENDING });
      const errorMessage = 'Failed to update issue';
      // Simulate a more complete Jira error object structure
      const jiraError = new Error(errorMessage);
      jiraError.response = { 
        status: 500, 
        data: { errorMessages: ['JIRA internal error'], errors: {} } 
      };
      jiraService.updateIssue.mockRejectedValue(jiraError);

      await ticketController.updateTicketState(req, res, next);

      // Error is caught by controller's own try-catch, not passed to next by asyncHandler here
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(jiraError.response.status || 500);
      expect(res.json).toHaveBeenCalledWith({
        message: `Failed to update ticket state: ${errorMessage}`,
        jiraError: jiraError.response.data.errorMessages || jiraError.response.data.errors
      });
    });

    it('should return early if validation errors exist for updateTicketState', async () => {
        validationResult.mockReturnValue({
          isEmpty: jest.fn().mockReturnValue(false), // Simulate validation failure
          array: jest.fn().mockReturnValue([{ msg: 'Invalid targetState' }]),
        });
        req = mockRequest({}, { issueKey: 'TEST-1' }, { targetState: 'someInvalidState' });
  
        await ticketController.updateTicketState(req, res, next);
  
        expect(jiraService.updateIssue).not.toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled(); // Validation middleware handles response
      });
  });
});
