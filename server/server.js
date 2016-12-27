/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
const vscode_languageserver_1 = require('vscode-languageserver');
const single = require('./single');
// Create a connection for the server. The connection uses Node's IPC as a transport
let connection = vscode_languageserver_1.createConnection(new vscode_languageserver_1.IPCMessageReader(process), new vscode_languageserver_1.IPCMessageWriter(process));
let csing = new single.sing();
// Create a simple text document manager. The text document manager
// supports full document sync only
let documents = new vscode_languageserver_1.TextDocuments();
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
// After the server has started the client sends an initilize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilites. 
let workspaceRoot;
connection.onInitialize((params) => {
    workspaceRoot = params.rootPath;
    return {
        capabilities: {
            // Tell the client that the server works in FULL text document sync mode
            textDocumentSync: documents.syncKind,
            // Tell the client that the server support code complete
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: ['.', '#']
            }
        }
    };
});
// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
// documents.onDidChangeContent((change) => {
// validateTextDocument(change.document);
// });
documents.onDidSave((change) => {
    if (change.document.languageId != 'html')
        return;
    csing.parse(change.document.getText(), change.document.uri);
});
documents.onDidOpen((change) => {
    if (change.document.languageId != 'html')
        return;
    csing.init(change.document.uri);
    // connection.console.log(change.document.uri);
});
// hold the maxNumberOfProblems setting
let maxNumberOfProblems;
// The settings have changed. Is send on server activation
// as well.
connection.onDidChangeConfiguration((change) => {
    let settings = change.settings;
    maxNumberOfProblems = settings.languageServerExample.maxNumberOfProblems || 100;
    // Revalidate any open text documents
    // documents.all().forEach(validateTextDocument);
});
// connection.onDidChangeWatchedFiles((change) => {
// 	// Monitored files have change in VSCode
// 	connection.console.log('We recevied an file change event');
// });
// This handler provides the initial list of the completion items.
connection.onCompletion((textDocumentPosition) => {
    // The pass parameter contains the position of the text document in 
    // which code complete got requested. For the example we ignore this
    // info and always provide the same completion items.
    let id = new RegExp('.*["\']#[a-zA-Z0-9]*$');
    let cla = new RegExp('.*["\']\\.[a-zA-Z0-9]*$');
    let data = new RegExp('.*data\\(["\'][a-zA-Z0-9]*$');
    let text = documents.get(textDocumentPosition.textDocument.uri).getText();
    let line = text.split('\n')[textDocumentPosition.position.line];
    let cha = line.substr(0, textDocumentPosition.position.character);
    let type = null;
    let res;
    if (id.test(cha)) {
        type = single.dataType.id;
    }
    else if (cla.test(cha)) {
        type = single.dataType.cla;
    }
    else if (data.test(cha)) {
        type = single.dataType.data;
    }
    if (type === null)
        return [];
    else
        res = csing.getComplete(textDocumentPosition.textDocument.uri, type);
    let ret = [];
    for (var x of res) {
        ret.push({ label: x.val, detail: type, documentation: x.from, kind: 1 });
    }
    return ret;
});
// This handler resolve additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item) => {
    return item;
});
// Listen on the connection
connection.listen();
//# sourceMappingURL=server.js.map