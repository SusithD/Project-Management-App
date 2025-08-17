# JIRA Postman Testing

This project contains a Postman collection and environment configurations for testing JIRA-related endpoints. The collection includes various requests to interact with JIRA's API, allowing for comprehensive testing of its functionalities.

## Project Structure

```
jira-postman-testing
├── postman
│   ├── collections
│   │   └── jira.postman_collection.json
│   └── environments
│       ├── local.postman_environment.json
│       ├── staging.postman_environment.json
│       └── production.postman_environment.json
└── README.md
```

## Getting Started

### Prerequisites

- Postman installed on your machine.
- Access to a JIRA instance with API access.
- Valid API tokens and credentials for authentication.

### Importing the Postman Collection

1. Open Postman.
2. Click on the "Import" button in the top left corner.
3. Select the `jira.postman_collection.json` file located in the `postman/collections` directory.
4. Click "Import" to add the collection to your Postman workspace.

### Importing the Environments

1. In Postman, go to the "Environments" tab.
2. Click on the "Import" button.
3. Select the environment files located in the `postman/environments` directory (local, staging, or production).
4. Click "Import" to add the environments to your Postman workspace.

### Running the Tests

1. Select the imported JIRA collection from the left sidebar.
2. Choose the desired environment from the environment dropdown in the top right corner.
3. Click on the "Send" button for each request to test the JIRA endpoints.
4. Review the responses and ensure they match the expected results.

### Environment Variables

- Each environment file contains variables such as:
  - `baseUrl`: The base URL for the JIRA API.
  - `apiToken`: The authentication token for accessing the JIRA API.
  - Other relevant variables specific to the environment.

### Conclusion

This Postman collection provides a structured way to test JIRA-related endpoints efficiently. Ensure that you have the necessary permissions and tokens to interact with the JIRA API. Happy testing!