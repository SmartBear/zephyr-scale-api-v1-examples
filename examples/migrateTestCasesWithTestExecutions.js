// Migrate test cases with test executions

const fetch = require('node-fetch');

class TestCaseMigrator {
    constructor(jiraSettings, testCasesToMigrate) {
		this.jiraSettings = jiraSettings;
        this._testCasesToMigrate = testCasesToMigrate;
    }

    async migrateTestCases() {
        for(let testCase of this._testCasesToMigrate) {
            await this._createTestCase(testCase);
        }
    }

    async _createTestCase(testCase) {
        const executions = testCase.executions;
        delete(testCase.executions);
        const request = this._buildRequest(testCase);
        const url = encodeURI(`${this.jiraSettings.url}/rest/atm/1.0/testcase`);
        const response = await fetch(url, request);
        if(response.status !== 201) throw `Error creating test case: ${testCase.name}`;
        const jsonResponse = await response.json();
        console.log(`Test case created: ${jsonResponse.key} - ${testCase.name}`);
        await this._createTestExecutions(testCase.projectKey, jsonResponse.key, executions);
    }

    async _createTestExecutions(projectKey, testCaseKey, executions) {
        for(let execution of executions) {
            execution.projectKey = projectKey;
            execution.testCaseKey = testCaseKey;
            const request = this._buildRequest(execution);
            const url = encodeURI(`${this.jiraSettings.url}/rest/atm/1.0/testresult`);
            const response = await fetch(url, request);
            if(response.status !== 201) throw `Error creating test execution: ${testCaseKey}`;
            console.log(`Test execution created: ${testCaseKey}`);
        }
    }

    _buildRequest(body) {
        return {
			method: 'POST',
			body: JSON.stringify(body),
			headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(`${this.jiraSettings.user}:${this.jiraSettings.password}`).toString('base64')
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

    // These test cases could have been read from any source
    // and transformed to have this exact format.
    const testCasesToMigrate = [{
        'projectKey': projectKey,
        'name': 'Test case with executions',
        'executions': [{
            'status': 'Pass',
            'environment': 'Firefox',
            'executionTime': 180000,
            'executionDate': '2018-12-13T15:22:00-0300',
        }, {
            'status': 'Fail',
            'environment': 'Chrome',
            'executionTime': 365000,
            'executionDate': '2018-12-13T18:11:00-0300',
        }]
    }, {
        'projectKey': projectKey,
        'name': 'Test case with simpler executions',
        'executions': [{
            'status': 'Pass'
        }, {
            'status': 'Fail'
        }]
    }];

    await new TestCaseMigrator(settings, testCasesToMigrate).migrateTestCases();
}

run();