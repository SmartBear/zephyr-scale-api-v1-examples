// Create test cases from issues

const fetch = require('node-fetch');

class TestCaseCreator {
    constructor(jiraSettings, jql, projectKey) {
		this._jiraSettings = jiraSettings;
        this._jql = jql;
        this._projectKey = projectKey;
        this._authString = 'Basic ' + Buffer.from(this._jiraSettings.user + ':' + this._jiraSettings.password).toString('base64');
    }

    async createTestCases() {
        const issues = await this._searchIssues(this._jql);
        for(let issue of issues) {
            await this._createTestCase(issue.fields.summary, issue.key, this._projectKey);
        }
    }

    async _searchIssues(jql) {
        const url = encodeURI(`${this._jiraSettings.url}/rest/api/2/search?jql=${jql}`);
        const response = await fetch(url, {headers: {'Authorization': this._authString}});
        if(response.status !== 200) throw 'Error searching for issues:' + jql;
		let searchResults = await response.json();
		return searchResults.issues;
    }

    async _createTestCase(name, issueLink, projectKey) {
        const request = this._buildRequest({
            name: name,
            projectKey: projectKey,
            issueLinks: [issueLink]
        });
        const url = encodeURI(this._jiraSettings.url + '/rest/atm/1.0/testcase');
        const response = await fetch(url, request);
        if(response.status !== 201) throw 'Error creating test case: ' + name;
        const jsonResponse = await response.json();
        console.log('Test case created: ' + jsonResponse.key + ' - ' + name);
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

    const jql = '<<Some JQL e.g. project = PROJ>>';
    const projectKey = '<<A project key e.g. PROJ>>';
    await new TestCaseCreator(settings, jql, projectKey).createTestCases();
}

run();