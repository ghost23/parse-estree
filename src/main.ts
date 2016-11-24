/**
 * Created by Sven Busse on 22.11.2016.
 *
 */

import { readFileSync, writeFileSync } from 'fs';

const matchDefinitionBlock = /```js([\s\S]*?)```/gm;
const definitions = /(extend(?=\s))?.*(interface|enum)\s*(\w+)\s*(?:(?:<:\s*)(?:(\w+))(?:(?:,\s*)(\w+))?(?:(?:,\s*)(\w+))?)?\s*\{\s*([\s\S]*?)\s*}/gm;
const definitionBody = /\s*?(?:(\w+)(?::))(?:(?:\s*([^\[\{]*?))|(?:\s*?\{([\s\S]*?)})|(?:\s*?\[([\s\S]*?)]));/gm;

enum DefinitionType {
	ENUM_DEFINITION, INTERFACE_DEFINITION
}

type PropMap = { [index: string]: any };

interface Definition {
	type: DefinitionType;
	name: string;
	extendList: string[];
	block: PropMap | string;
	isExtensionFromExistingInterface: boolean;
}

function parseDefinitionDocument(
		rawDef: string,
		currentNameToDefinitionMap: { [name: string]: Definition }): void {

	let matchedDefinitionBlocks: string[];

	while ((matchedDefinitionBlocks = matchDefinitionBlock.exec(rawDef)) !== null) {

		let matchedDefinitions: string[];
		while ((matchedDefinitions = definitions.exec(matchedDefinitionBlocks[1])) !== null) {

			const newDefinition: Definition = {
				type: matchedDefinitions[2] === "enum" ? DefinitionType.ENUM_DEFINITION : DefinitionType.INTERFACE_DEFINITION,
				name: matchedDefinitions[3],
				extendList: [].concat(
					matchedDefinitions[4],
					matchedDefinitions[5],
					matchedDefinitions[6]
				).filter(
					elmt => elmt !== undefined && elmt !== null
				),
				block: matchedDefinitions[2] === "enum" ? matchedDefinitions[7].trim() : parseInterfaceDefinitionBody(matchedDefinitions[7]),
				isExtensionFromExistingInterface: matchedDefinitions[1] !== undefined
			};

			if(newDefinition.name in currentNameToDefinitionMap && newDefinition.isExtensionFromExistingInterface) {
				newDefinition.extendList = currentNameToDefinitionMap[newDefinition.name].extendList;
				if(newDefinition.type === DefinitionType.ENUM_DEFINITION) {
					newDefinition.block = currentNameToDefinitionMap[newDefinition.name].block + ' | ' + newDefinition.block;
				} else {
					newDefinition.block = Object.assign(currentNameToDefinitionMap[newDefinition.name].block, newDefinition.block);
				}
			}
			currentNameToDefinitionMap[newDefinition.name] = newDefinition;
		}
	}
}

function parseInterfaceDefinitionBody(rawBodyString: string): PropMap {

	const result: PropMap = {};

	let matchedProperty: string[];
	while ((matchedProperty = definitionBody.exec(rawBodyString)) !== null) {
		if(matchedProperty[2] !== null && matchedProperty[2] !== undefined) {
			result[matchedProperty[1]] = matchedProperty[2].trim();
		} else if(matchedProperty[3] !== null && matchedProperty[3] !== undefined) {
			result[matchedProperty[1]] = parseInterfaceDefinitionBody(matchedProperty[3]);
		} else if(matchedProperty[4] !== null && matchedProperty[4] !== undefined) {
			result[matchedProperty[1]] = `Array<${matchedProperty[4].trim()}>`
		}
	}

	return result;
}

function exportAsTypescriptString(definition: Definition): string {

	if(definition.type === DefinitionType.ENUM_DEFINITION) {
		return `export type ${definition.name}${definition.extendList.length ? ' extends ' + definition.extendList.join(', '):''} =
	${definition.block};`;
	} else {
		return `export interface ${definition.name}${definition.extendList.length ? ' extends ' + definition.extendList.join(', '):''} {
${Object.keys(definition.block as PropMap).map(elmt => '\t' + elmt + ": " + (definition.block as PropMap)[elmt] + ";").join('\n')}
}`;
	}
}

const es5MD: string = readFileSync('./estree/es5.md', 'utf8');
const es2015MD: string = readFileSync('./estree/es2015.md', 'utf8');
const es2016MD: string = readFileSync('./estree/es2016.md', 'utf8');
const es2017MD: string = readFileSync('./estree/es2017.md', 'utf8');

let nameToDefinitionsMap: { [name: string]: Definition } = {};

parseDefinitionDocument(es5MD, nameToDefinitionsMap);
parseDefinitionDocument(es2015MD, nameToDefinitionsMap);
parseDefinitionDocument(es2016MD, nameToDefinitionsMap);
parseDefinitionDocument(es2017MD, nameToDefinitionsMap);

const allDefinitions = Object.keys(nameToDefinitionsMap).map(key => nameToDefinitionsMap[key]);

writeFileSync('typings/globals/estree/estree.d.ts', allDefinitions.map(exportAsTypescriptString).join('\n'), 'utf8');

console.log('parsed definitions have been written to: typings/globals/estree/estree.d.ts');

// https://regex101.com/r/NIgD49/1