module.exports = {
  clearMocks: true, // Automatically clear mock calls and instances between every test
  coverageProvider: "v8", // V8 is the default, but explicitly stating
  testEnvironment: "node", // Environment for testing Node.js applications
  transform: {
    '^.+\\.js$': 'babel-jest', // Use babel-jest for .js files
  },
  // You might want to add setupFilesAfterEnv for global setup if needed later
  // setupFilesAfterEnv: ['./jest.setup.js'], 
};
