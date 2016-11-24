/**
 * Created by Sven Busse on 22.11.2016.
 *
 */

import { readFileSync, writeFileSync } from 'fs';

const matchDefinitionBlockWithinMarkdown = /```js([\s\S]*?)```/gm;

const m_extend = '(extend(?=\\s))?';
const m_name = '(\\w+)';
const m_firstExtenderName = m_name;
const m_additionalExtenderName = '(?:(?:,\\s*)(\\w+))?';
const m_extenders = `(?:(?:<:\\s*)${m_firstExtenderName}${m_additionalExtenderName}${m_additionalExtenderName})?`; // Up to three extended interface names possible
const m_rawbody = '\\{\\s*([\\s\\S]*?)\\s*}';
const definitions = new RegExp(`${m_extend}.*(interface|enum)\\s*${m_name}\\s*${m_extenders}\\s*${m_rawbody}`, 'gm');

const m_propertyName = '(?:(\\w+)(?::))';
const m_propertyNonListNonObjectValue = '(?:\\s*([^\\[\\{]*?))';
const m_propertyObjectValue = '(?:\\s*?\\{([\\s\\S]*?)})';
const m_propertyListValue = '(?:\\s*?\\[([\\s\\S]*?)])';
const m_propertyRawValue = `(?:${m_propertyNonListNonObjectValue}|${m_propertyObjectValue}|${m_propertyListValue})`;
const definitionInterfaceBody = new RegExp(`\\s*?${m_propertyName}${m_propertyRawValue};`, 'gm');

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

	while ((matchedDefinitionBlocks = matchDefinitionBlockWithinMarkdown.exec(rawDef)) !== null) {

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
	while ((matchedProperty = definitionInterfaceBody.exec(rawBodyString)) !== null) {
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
		return `\texport type ${definition.name}${definition.extendList.length ? ' extends ' + definition.extendList.join(', '):''} =
		${definition.block};`;
	} else {
		return `\texport interface ${definition.name}${definition.extendList.length ? ' extends ' + definition.extendList.join(', '):''} {
${Object.keys(definition.block as PropMap).map(elmt => '\t\t' + elmt + ": " + (definition.block as PropMap)[elmt] + ";").join('\n')}
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
const result = `declare module "estree" {
${allDefinitions.map(exportAsTypescriptString).join('\n')}
}`;

writeFileSync('typings/globals/estree/estree.d.ts', result, 'utf8');

console.log('parsed definitions have been written to: typings/globals/estree/estree.d.ts');

// https://regex101.com/r/NIgD49/1