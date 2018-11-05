// Create a test cycle with test executions.
// The test execution results could hame came from an automated test tool, for example.

const fetch = require('node-fetch');

class TestExecutionCreator {
    constructor(jiraSettings, executionResults, projectKey) {
		this._jiraSettings = jiraSettings;
        this._executionResults = executionResults;
        this._projectKey = projectKey;
    }

    async createExecutions() {
        const request = this._buildRequest({
            name: 'Automated test executions',
            projectKey: this._projectKey,
            items: this._executionResults
        });
        const url = encodeURI(`${this._jiraSettings.url}/rest/atm/1.0/testrun`);
        const response = await fetch(url, request);
        if(response.status !== 201) throw `Error creating test cycle.`;
        const jsonResponse = await response.json();
        console.log(`Test cycle created: ${jsonResponse.key}`);
    }

    _buildRequest(body) {
        return {
			method: 'POST',
			body: JSON.stringify(body),
			headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(`${this._jiraSettings.user}:${this._jiraSettings.password}`).toString('base64')
            }
		};
    }
}

async function run() {
    // Your settings
    const settings = {
		'url': '<<your-jira-url>>',
		'user': '<<your-user>>',
		'password': '<<your-password>>'
    };
    const projectKey = '<<A project key e.g. PROJ>>';

    // These test results could have been generated by an automated test tool
    const executionResults = [{
            'testCaseKey': '<<A test case key>>',
            'status': 'Pass',
            'environment': 'Firefox',
            'executionTime': 180000,
            'executionDate': '2018-12-13T15:22:00-0300',
        }, {
            'testCaseKey': '<<A test case key>>',
            'status': 'Fail',
            'environment': 'Chrome',
            'executionTime': 365000,
            'executionDate': '2018-12-13T18:11:00-0300',
        }, {
            'testCaseKey': '<<A test case key>>',
            'status': 'Pass'
        }, {
            'testCaseKey': '<<A test case key>>',
            'status': 'Fail'
        }];

    await new TestExecutionCreator(settings, executionResults, projectKey).createExecutions();
}

run();