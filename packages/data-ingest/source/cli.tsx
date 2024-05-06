#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';
//
import fs from 'fs';

// import path from 'path';
import * as XLSX from 'xlsx';
import dotenv from 'dotenv';
dotenv.config();

XLSX.set_fs(fs);

// const START_OF_FREE_UID_RANGE = 1000000000;
// const START_OF_FACT_UID_RANGE = 2000000000;

// const neo4jImportDir =
// 	'/home/marc/.config/Neo4j Desktop/Application/relate-data/dbmss/dbms-b8b722ad-f7b8-4148-be1b-204d42627625/import/relica';
// const dataSourceInputCSVDir = './seed/csv/';
const dataSourceInputXLSDir = './seed';

// get list of files in directory
const files = fs.readdirSync(dataSourceInputXLSDir);
// console.log(files);

//@ts-ignore
const cli = meow(
	`
	Usage
	  $ relica_data_ingestor

	Options
		--name  Your name

	Examples
	  $ relica_data_ingestor --name=Jane
	  Hello, Jane
`,
	{
		importMeta: import.meta,
		flags: {
			name: {
				type: 'string',
			},
		},
	},
);

render(<App files={files} />);
