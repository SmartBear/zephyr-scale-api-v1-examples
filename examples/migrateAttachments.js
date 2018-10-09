// Migrate test cases with attachment

const fetch = require('node-fetch');
const fs = require('fs');
const FormData = require('form-data');

class TestCaseMigrator {
    constructor(jiraSettings, testCasesToMigrate) {
		this.jiraSettings = jiraSettings;
        this._testCasesToMigrate = testCasesToMigrate;
    }

    async migrateTestCases() {
        for(let testCase of this._testCasesToMigrate) {
            const filePath = testCase.attachment;
            delete(testCase.attachment);
            const testCaseKey = await this._createTestCase(testCase);
            await this._uploadAttachment(testCaseKey, filePath);
        }
    }

    async _createTestCase(testCase) {
        const request = this._buildRequest(testCase);
        const url = encodeURI(`${this.jiraSettings.url}/rest/atm/1.0/testcase`);
        const response = await fetch(url, request);
        const jsonResponse = await response.json();
        if(response.status !== 201) throw `Error creating test case: ${testCase.name}`;
        console.log(`Test case created: ${jsonResponse.key} - ${testCase.name}`);
        return jsonResponse.key;
    }

    async _uploadAttachment(testCaseKey, filePath) {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath));

        const request = {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        };
        request.headers.Authorization = 'Basic ' + Buffer.from(`${this.jiraSettings.user}:${this.jiraSettings.password}`).toString('base64');

        const url = encodeURI(`${this.jiraSettings.url}/rest/atm/1.0/testcase/${testCaseKey}/attachments`);
        const response = await fetch(url, request);
        if(response.status !== 201) throw `Error uploading attachment ${filePath} to test case ${testCaseKey}`;
        console.log(`Attachment uploaded: ${testCaseKey} - ${filePath}`);
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
        'name': 'Test case with attachment',
        'attachment': './aDocument.pdf'
    }, {
        'projectKey': projectKey,
        'name': 'Another test case with attachment',
        'attachment': './anImage.png'
    }];

    await new TestCaseMigrator(settings, testCasesToMigrate).migrateTestCases();
}

run();