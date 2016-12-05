/**
 * Created by Sven Busse on 22.11.2016.
 *
 */

import { readFileSync, writeFileSync } from 'fs';
import { omit, remove } from 'lodash';

const matchDefinitionBlockWithinMarkdown = /```js([\s\S]*?)```/gm;

const m_extend = '(extend(?=\\s))?';
const m_name = '(\\w+)';
const m_firstExtenderName = m_name;
const m_additionalExtenderName = '(?:(?:,\\s*)(\\w+))?';
const m_extenders = `(?:(?:<:\\s*)${m_firstExtenderName}${m_additionalExtenderName}${m_additionalExtenderName})?`; // Up to three extended interface names possible
const m_rawbody = '\\{\\s*([\\s\\S]*?)\\s*}';
const definitions = new RegExp(`${m_extend}.*(interface|enum)\\s*${m_name}\\s*${m_extenders}\\s*${m_rawbody}\\s*$`, 'gm');

const m_propertyName = '(?:(\\w+)(?::))';
const m_propertyNonListNonObjectValue = '(?:\\s*([^\\[\\{]*?))';
const m_propertyObjectValue = '(?:\\s*?\\{([\\s\\S]*?)})';
const m_propertyListValue = '(?:\\s*?\\[([\\s\\S]*?)])';
const m_propertyRawValue = `(?:${m_propertyNonListNonObjectValue}|${m_propertyObjectValue}|${m_propertyListValue})`; // This shall represent three mutually exclusive match alternatives, essentially like a switch


const definitionRawProperty = /((?:\w+(?:[^\S\n\r]*\|)).*)|((?:"\w+"(?:[^\S\n\r]*\|)).*)|(?:("\w+")[^\S\n\r]*)|(?:(\w+)(?:[^\S\n\r]*))/; // This shall represent four mutually exclusive match alternatives, essentially like a switch

interface IHash {
	[name: string]: any
}

interface IDestructedObject extends IHash {
	other: IHash;
}

export default function destructObject(object: IHash, ...keys: string[]): IDestructedObject {
	const newObject: IDestructedObject = { other: {} };

	Object.keys(object).forEach((key: string) => {
		const value: any = object[key];
		if (keys.indexOf(key) > -1) {
			newObject[key] = value;
		} else {
			newObject.other[key] = value;
		}
	});

	return newObject;
}


enum DefinitionType {
	ENUM_DEFINITION, INTERFACE_DEFINITION
}

enum PropValueType {
	OBJECT, UNION_LITERAL, UNION_IDENTIFIER, LITERAL, IDENTIFIER,
	UNION_LITERAL_LIST, UNION_IDENTIFIER_LIST, LITERAL_LIST, IDENTIFIER_LIST
}

type SinglePropValueTypes = PropValueType.OBJECT | PropValueType.UNION_LITERAL | PropValueType.LITERAL | PropValueType.IDENTIFIER;
type ListPropValueTypes = PropValueType.UNION_LITERAL_LIST | PropValueType.UNION_IDENTIFIER_LIST | PropValueType.LITERAL_LIST | PropValueType.IDENTIFIER_LIST;

type PropMap = { [index: string]: PropValue };

interface PropValue {
	value: PropMap | string;
	type: PropValueType
}

interface Definition {
	type: DefinitionType;
	name: string;
	extendList: string[];
	block: PropMap | string;
	isExtensionFromExistingInterface: boolean;
}

function parseDefinitionDocument(rawDef: string,
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

			if (newDefinition.name in currentNameToDefinitionMap && newDefinition.isExtensionFromExistingInterface) {
				newDefinition.extendList = currentNameToDefinitionMap[newDefinition.name].extendList;
				if (newDefinition.type === DefinitionType.ENUM_DEFINITION) {
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

	// We put this here, because parseInterfaceDefinitionBody can be called recursively
	// and each recursion needs to have its own regex instance, otherwise the current string
	// position within the regex gets messed up.
	const definitionInterfaceBody = new RegExp(`\\s*?${m_propertyName}${m_propertyRawValue};`, 'g');

	let matchedProperty: string[];
	while ((matchedProperty = definitionInterfaceBody.exec(rawBodyString)) !== null) {
		if (matchedProperty[2] !== null && matchedProperty[2] !== undefined) { // single item or union of items
			result[matchedProperty[1]] = parseRawPropertyValue(matchedProperty[2].trim(), false);
		} else if (matchedProperty[3] !== null && matchedProperty[3] !== undefined) { // nested object
			result[matchedProperty[1]] = {
				value: parseInterfaceDefinitionBody(matchedProperty[3]),
				type: PropValueType.OBJECT
			};
		} else if (matchedProperty[4] !== null && matchedProperty[4] !== undefined) { // list of item or union of items
			result[matchedProperty[1]] = parseRawPropertyValue(matchedProperty[4].trim(), true);
		}
	}

	return result;
}

function parseRawPropertyValue(rawPropertyValue: string, inList: boolean): PropValue {

	let result: PropValue;

	const match: string[] = definitionRawProperty.exec(rawPropertyValue);
	if (match !== null) {
		if (match[1] !== null && match[1] !== undefined) { // union of identifiers
			result = {
				value: inList ? `Array<${match[1]}>` : match[1],
				type: inList ? PropValueType.UNION_IDENTIFIER_LIST : PropValueType.UNION_IDENTIFIER
			};
		} else if (match[2] !== null && match[2] !== undefined) { // union of string literals
			result = {
				value: inList ? `Array<${match[2]}>` : match[2],
				type: inList ? PropValueType.UNION_LITERAL_LIST : PropValueType.UNION_LITERAL
			};
		} else if (match[3] !== null && match[3] !== undefined) { // one string literal
			result = {
				value: inList ? `Array<${match[3]}>` : match[3],
				type: inList ? PropValueType.LITERAL_LIST : PropValueType.LITERAL
			};
		} else if (match[4] !== null && match[4] !== undefined) { // one identifier
			result = {
				value: inList ? `Array<${match[4]}>` : match[4],
				type: inList ? PropValueType.IDENTIFIER_LIST : PropValueType.IDENTIFIER
			};
		}
	}

	return result;
}

function exportDefinitionAsTypescriptString(definition: Definition): string {

	if (definition.type === DefinitionType.ENUM_DEFINITION) {
		return `\texport type ${definition.name}${definition.extendList.length ? ' extends ' + definition.extendList.join(', ') : ''} =
		${definition.block};`;
	} else {
		return `\texport interface ${definition.name}${definition.extendList.length ? ' extends ' + definition.extendList.join(', ') : ''} ${exportPropMapAsTypescriptString(definition.block, 1)}`;
	}
}

function exportPropMapAsTypescriptString(prop: PropMap | string, level: number): string {

	let result: string = "";
	let indentation = "\t".repeat(level);

	if (typeof prop === "string") {
		result = `${prop}`;
	} else {
		result = `{\n${Object.keys(prop).reduce((reduced: string, element: string, index: number, list: string[]): string => {
			return `${reduced !== "" ? `${reduced}\n` : reduced}${"\t".repeat(level + 1)}${element}: ${exportPropMapAsTypescriptString(prop[element].value, level + 1)};`;
		}, result)}\n${indentation}}`;
	}

	return result;
}

function checkForAndExtractOverridenLiteral(definition: Definition, nameToDefinitionsMap: { [name: string]: Definition }): void {
	if(definition.extendList.length > 0 && typeof definition.block !== "string") {
		for(let elmt in definition.block) {
			const element: PropValue = definition.block[elmt];
			if(element && element.type === PropValueType.LITERAL) {
				const parentsWithPropertyLiteralWithSameName = definition.extendList
					.filter(parent => {
						const parentDefinition: Definition = nameToDefinitionsMap[parent];
						if(typeof parentDefinition.block !== "string") {
							return Object.keys(parentDefinition.block).some((parentElmnt: string) => (
								(parentDefinition.block as PropMap)[parentElmnt].type === PropValueType.LITERAL && parentElmnt === elmt
							))
						}else {
							return false;
						}
					});
				if(parentsWithPropertyLiteralWithSameName.length > 0) {
					const normalParent: Definition = nameToDefinitionsMap[parentsWithPropertyLiteralWithSameName[0]];
					const destructedParentBlock = destructObject(normalParent.block as PropMap, elmt);
					const newAbstractParent: Definition = {
						type: DefinitionType.INTERFACE_DEFINITION,
						name: `Abstract${parentsWithPropertyLiteralWithSameName[0]}`,
						extendList: [].concat(normalParent.extendList),
						isExtensionFromExistingInterface: false,
						block: destructedParentBlock.other
					};
					nameToDefinitionsMap[newAbstractParent.name] = newAbstractParent;
					allDefinitions.push(newAbstractParent);

					// remove everything from the normal parents block except the literal in question
					// add new abstract parent to extendedList of normal parent
					normalParent.block = omit<PropMap, PropMap>(normalParent.block as PropMap, Object.keys(destructedParentBlock.other));
					normalParent.extendList = [newAbstractParent.name];

					// remove all the props in the child, which are shared with the normal parent, except the literal in question
					// exchange normal parent in extendedList of child to abstract parent
					definition.block = omit<PropMap, PropMap>(definition.block as PropMap, Object.keys(destructedParentBlock.other));
					definition.extendList = definition.extendList.filter(name => name != normalParent.name);
					definition.extendList.push(newAbstractParent.name);
				}
			}
		}
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
allDefinitions.forEach((definition: Definition) => { checkForAndExtractOverridenLiteral(definition, nameToDefinitionsMap); });
const result = `declare module "estree" {
${allDefinitions.map(exportDefinitionAsTypescriptString).join('\n')}
}`;

writeFileSync('typings/globals/estree/estree.d.ts', result, 'utf8');

console.log('parsed definitions have been written to: typings/globals/estree/estree.d.ts');

// https://regex101.com/r/NIgD49/1