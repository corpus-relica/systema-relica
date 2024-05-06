import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { Text, Box, useInput } from 'ink';
import { findSheetBounds, readXLSFixDates, saveCSVFiles, } from '../datafile/xls.js';
import insertOneFact from '../insertOneFact.js';
const uidFactComponentMap = {
    0: 'sequence',
    69: 'language_uid',
    54: 'language',
    71: 'lh_context_uid',
    16: 'lh_context_name',
    39: 'lh_reality',
    2: 'lh_object_uid',
    44: 'lh_cardinalities',
    101: 'lh_object_name',
    72: 'lh_role_uid',
    73: 'lh_role_name',
    5: 'intention_uid',
    43: 'intention',
    19: 'val_context_uid',
    18: 'val_context_name',
    1: 'fact_uid',
    42: 'fact_description',
    60: 'rel_type_uid',
    3: 'rel_type_name',
    74: 'rh_role_uid',
    75: 'rh_role_name',
    15: 'rh_object_uid',
    45: 'rh_cardinalities',
    201: 'rh_object_name',
    65: 'partial_definition',
    4: 'full_definition',
    66: 'uom_uid',
    7: 'uom_name',
    76: 'accuracy_uid',
    77: 'accuracy_name',
    70: 'picklist_uid',
    20: 'picklist_name',
    14: 'remarks',
    8: 'approval_status',
    78: 'successor_uid',
    24: 'reason',
    9: 'effective_from',
    13: 'creator_uid',
    10: 'latest_update',
    6: 'author_uid',
    12: 'author',
    22: 'copy_date',
    23: 'availability_date',
    178: 'addressee_uid',
    179: 'addressee_name',
    53: 'line_uid',
    50: 'collection_uid',
    68: 'collection_name',
    80: 'lh_commonality',
    81: 'rh_commonality',
};
export default function LoadUserSpace({ next }) {
    const [log, setLog] = useState([]);
    //@ts-ignore
    useInput((input, key) => {
        if (key.return) {
            next();
        }
    });
    useEffect(() => {
        console.log('START: LoadUserSpace');
        const exec = async () => {
            // const response = await getSpecializationHierarchy(1);
            // console.log(response);
            const ws = await readXLSFixDates([
                '110_systema relica - Individuals.xls',
            ]);
            await saveCSVFiles(ws);
            const sheet = ws[0];
            if (!sheet) {
                console.log('ERROR: No worksheet found');
                return;
            }
            const sheetRange = findSheetBounds(sheet);
            const colCount = sheetRange.e.c;
            //@ts-ignore
            const header = new Array(colCount).fill('x').map((x, idx) => {
                const targ = XLSX.utils.encode_cell({ c: idx, r: 0 });
                const cell = sheet[targ];
                return cell ? parseInt(cell['v']) : null;
            });
            const facts = [];
            for (let i = 1; i < sheetRange.e.r - 1; i++) {
                //@ts-ignore
                const fact = {};
                for (let j = 0; j < colCount; j++) {
                    const targ = XLSX.utils.encode_cell({ c: j, r: i });
                    const cell = sheet[targ];
                    if (cell) {
                        const headerKey = header[j];
                        if (!headerKey)
                            continue;
                        const factKey = uidFactComponentMap[headerKey];
                        if (!factKey)
                            continue;
                        //handle dates and numbers specially
                        switch (factKey) {
                            case 'lh_object_name':
                            case 'rh_object_name':
                                //@ts-ignore
                                fact[factKey] = cell['w'];
                                break;
                            default:
                                //@ts-ignore
                                fact[factKey] = cell['v'];
                                break;
                        }
                        // console.log(
                        // 	`${factKey} - ${cell['t']}, ${cell['v']}:${typeof cell['v']}, ${
                        // 		cell['w']
                        // 	}:${typeof cell['w']}`,
                        // );
                    }
                }
                facts.push(fact);
            }
            // hacky sack, make sure that sequence, partial_definition and full_definition have values
            for (const fact of facts) {
                if (!fact.sequence)
                    fact.sequence = 0;
                if (!fact.partial_definition)
                    fact.partial_definition = '';
                if (!fact.full_definition)
                    fact.full_definition = '';
            }
            // hacky sack continues... make sure that lh_object_name and rh_object_name are strings
            for (const fact of facts) {
                // console.log(fact.lh_object_name, fact.rh_object_name);
                fact.lh_object_name = '' + fact.lh_object_name;
                fact.rh_object_name = '' + fact.rh_object_name;
            }
            for (const fact of facts) {
                await insertOneFact(fact);
                setLog(prev => ['inserted fact: ' + fact.fact_uid, ...prev]);
            }
            setLog(prev => ['END: LoadUserSpace', ...prev]);
        };
        exec();
    }, []);
    return (React.createElement(Box, { flexDirection: "column", flexGrow: 1, borderStyle: "single" },
        React.createElement(Text, null, '//// Load User Space ////'),
        React.createElement(Box, { flexDirection: "column", flexGrow: 1, borderStyle: "single", overflowY: "hidden", alignSelf: "flex-end" }, log.map((x, idx) => (React.createElement(Text, { key: idx }, x))))));
}
