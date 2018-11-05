// Migrate test cases with custom fields

const fetch = require('node-fetch');

class TestCaseMigrator {
    constructor(jiraSettings, testCasesToMigrate) {
		this._jiraSettings = jiraSettings;
        this._testCasesToMigrate = testCasesToMigrate;
        this._authString = 'Basic ' + Buffer.from(this._jiraSettings.user + ':' + this._jiraSettings.password).toString('base64');
    }

    async migrateTestCases() {
        for(let testCase of this._testCasesToMigrate) {
            await this._createTestCase(testCase);
        }
    }

    async _createTestCase(testCase) {
        const request = this._buildRequest(testCase);
        const url = encodeURI(this._jiraSettings.url + '/rest/atm/1.0/testcase');
        const response = await fetch(url, request);
        if(response.status !== 201) throw 'Error creating test case: ' + testCase.name;
        const jsonResponse = await response.json();
        console.log('Test case created: ' + jsonResponse.key + ' - ' + testCase.name);
    }

    _buildRequest(body) {
        return {
			method: 'POST',
			body: JSON.stringify(body),
			headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': this._authString
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
    // and transformed to have this exact format. Custom fields
    // need to exist prior to running this script
    const testCasesToMigrate = [{
        'projectKey': projectKey,
        'name': 'First test case',
        'folder': '/Import from legacy system',
        'customFields': {
            'A checkbox custom field': true,
            'A number custom field': 12,
            'A text custom field': 'Some text here'
        }
    }, {
        'projectKey': projectKey,
        'name': 'Another test case',
        'folder': '/Import from legacy system',
        'customFields': {
            'A user custom field': 'my.user.key',
            'A decimal number custom field': 1.2,
            'A select list custom field': 'This is the option label'
        }
    }];

    await new TestCaseMigrator(settings, testCasesToMigrate).migrateTestCases();
}

run();