/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
	IPCMessageReader, IPCMessageWriter,
	createConnection, IConnection, TextDocumentSyncKind,
	TextDocuments, TextDocument, Diagnostic, DiagnosticSeverity,
	InitializeParams, InitializeResult, TextDocumentPositionParams,
	CompletionItem, CompletionItemKind
} from 'vscode-languageserver';
import * as single from './single';

// Create a connection for the server. The connection uses Node's IPC as a transport
let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
let csing=new single.sing();

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments = new TextDocuments();
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// After the server has started the client sends an initilize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilites. 
let workspaceRoot: string;
connection.onInitialize((params): InitializeResult => {
	workspaceRoot = params.rootPath;
	return {
		capabilities: {
			// Tell the client that the server works in FULL text document sync mode
			textDocumentSync:documents.syncKind,//TextDocumentSyncKind.Incremental,
			// Tell the client that the server support code complete
			completionProvider: {
				resolveProvider: true,
				triggerCharacters:['.','#','"',"'"]
			}
		}
	}
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
// documents.onDidChangeContent((change) => {
	// validateTextDocument(change.document);
// });

documents.onDidSave((change) => {
	if (change.document.languageId!='html') return;
	csing.parse(change.document.getText(),change.document.uri);
});

documents.onDidOpen((change) => {
	if (change.document.languageId!='html') return;
	csing.init(change.document);
});

// This handler provides the initial list of the completion items.
connection.onCompletion((textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
	// The pass parameter contains the position of the text document in 
	// which code complete got requested. For the example we ignore this
	// info and always provide the same completion items.
	let id=new RegExp('.*["\']#[a-zA-Z0-9]*$');
	let cla=new RegExp('.*["\']\\.[a-zA-Z0-9]*$');
	let data=new RegExp('.*data\\(["\'][a-zA-Z0-9]*$');
	let text=documents.get(textDocumentPosition.textDocument.uri).getText();
	let line=text.split('\n')[textDocumentPosition.position.line];
	let cha=line.substr(0,textDocumentPosition.position.character);
	let type:string=null;
	let res:Array<single.completeItem>;
	if (id.test(cha)){
		type=single.dataType.id;
	}else if (cla.test(cha)){
		type=single.dataType.cla;
	}else if (data.test(cha)){
		type=single.dataType.data;
	}
	if (type===null) return [];
	else res=csing.getComplete(textDocumentPosition.textDocument.uri,type);
	let ret=[];
	for (var x of res){
		ret.push({label:x.val,detail:type,documentation:x.from,kind:1});
	}
	return ret;
});

// This handler resolve additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
	return item;
});
// Listen on the connection
connection.listen();