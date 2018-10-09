// Create test cycle folders from sprints

const fetch = require('node-fetch');

class TestCycleFolderCreator {
    constructor(jiraSettings, projectKey) {
		this._jiraSettings = jiraSettings;
        this._projectKey = projectKey;
        this._authString = 'Basic ' + Buffer.from(`${this._jiraSettings.user}:${this._jiraSettings.password}`).toString('base64');
    }

    async createFolders() {
        const board = await this._getBoardForProject(this._projectKey);
        const sprints = await this._getSprintsForBoard(board);
        for(let sprint of sprints) {
            await this._createTestCycleFolder(sprint.name, this._projectKey)
        }
    }

    async _getBoardForProject(projectKey) {
        const url = encodeURI(`${this._jiraSettings.url}/rest/agile/1.0/board?projectKeyOrId=${projectKey}`);
        const response = await fetch(url, {headers: {'Authorization': this._authString}});
        if(response.status !== 200) throw `Error retrieving boards for project: ${projectKey}`;
		let searchResults = await response.json();
		return searchResults.values[0];
    }

    async _getSprintsForBoard(board) {
        const url = encodeURI(`${this._jiraSettings.url}/rest/agile/1.0/board/${board.id}/sprint`);
        const response = await fetch(url, {headers: {'Authorization': this._authString}});
        if(response.status !== 200) throw `Error retrieving sprints for board: ${board.name}`;
		let searchResults = await response.json();
		return searchResults.values;
    }

    async _createTestCycleFolder(name, projectKey) {
        const reqHeadersObj = this._buildRequest({
            'projectKey': projectKey,
            'name': `/${name}`,
            'type': 'TEST_RUN'
        });
        const url = encodeURI(`${this._jiraSettings.url}/rest/atm/1.0/folder`);
        const response = await fetch(url, reqHeadersObj);
        if(response.status !== 201) throw `Error creating test cycle folder: ${name}`;
        console.log(`Created test cycle folder: ${name}`);
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
    await new TestCycleFolderCreator(settings, projectKey).createFolders();
}

run();