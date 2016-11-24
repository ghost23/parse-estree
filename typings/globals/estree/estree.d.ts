declare module "estree" {
	export interface Node {
		type: string;
		loc: SourceLocation | null;
	}
	export interface SourceLocation {
		source: string | null;
		start: Position;
		end: Position;
	}
	export interface Position {
		line: number;
		column: number;
	}
	export interface Identifier extends Expression, Pattern {
		type: "Identifier";
		name: string;
	}
	export interface Literal extends Expression {
		type: "Literal";
		value: string | boolean | null | number | RegExp;
	}
	export interface RegExpLiteral extends Literal {
		pattern: string;
		flags: string;
	}
	export interface Program extends Node {
		type: "Program";
		body: Array<Statement | ModuleDeclaration>;
		sourceType: "script" | "module";
	}
	export interface Function extends Node {
		id: Identifier | null;
		params: Array<Pattern>;
		body: any;
		generator: boolean;
		async: boolean;
	}
	export interface Statement extends Node {

	}
	export interface ExpressionStatement extends Statement {
		type: "ExpressionStatement";
		expression: Expression;
	}
	export interface BlockStatement extends Statement {
		type: "BlockStatement";
		body: Array<Statement>;
	}
	export interface EmptyStatement extends Statement {
		type: "EmptyStatement";
	}
	export interface DebuggerStatement extends Statement {
		type: "DebuggerStatement";
	}
	export interface WithStatement extends Statement {
		type: "WithStatement";
		object: Expression;
		body: Statement;
	}
	export interface ReturnStatement extends Statement {
		type: "ReturnStatement";
		argument: Expression | null;
	}
	export interface LabeledStatement extends Statement {
		type: "LabeledStatement";
		label: Identifier;
		body: Statement;
	}
	export interface BreakStatement extends Statement {
		type: "BreakStatement";
		label: Identifier | null;
	}
	export interface ContinueStatement extends Statement {
		type: "ContinueStatement";
		label: Identifier | null;
	}
	export interface IfStatement extends Statement {
		type: "IfStatement";
		test: Expression;
		consequent: Statement;
		alternate: Statement | null;
	}
	export interface SwitchStatement extends Statement {
		type: "SwitchStatement";
		discriminant: Expression;
		cases: Array<SwitchCase>;
	}
	export interface SwitchCase extends Node {
		type: "SwitchCase";
		test: Expression | null;
		consequent: Array<Statement>;
	}
	export interface ThrowStatement extends Statement {
		type: "ThrowStatement";
		argument: Expression;
	}
	export interface TryStatement extends Statement {
		type: "TryStatement";
		block: BlockStatement;
		handler: CatchClause | null;
		finalizer: BlockStatement | null;
	}
	export interface CatchClause extends Node {
		type: "CatchClause";
		param: Pattern;
		body: BlockStatement;
	}
	export interface WhileStatement extends Statement {
		type: "WhileStatement";
		test: Expression;
		body: Statement;
	}
	export interface DoWhileStatement extends Statement {
		type: "DoWhileStatement";
		body: Statement;
		test: Expression;
	}
	export interface ForStatement extends Statement {
		type: "ForStatement";
		init: VariableDeclaration | Expression | null;
		test: Expression | null;
		update: Expression | null;
		body: Statement;
	}
	export interface ForIterableStatement extends Statement {
		left: VariableDeclaration |  Pattern;
		right: Expression;
		body: Statement;
	}
	export interface ForInStatement extends ForIterableStatement {
		type: "ForInStatement";
	}
	export interface Declaration extends Statement {

	}
	export interface FunctionDeclaration extends Function, Declaration {
		type: "FunctionDeclaration";
		body: BlockStatement;
		id: Identifier;
	}
	export interface VariableDeclaration extends Declaration {
		type: "VariableDeclaration";
		declarations: Array<VariableDeclarator>;
		kind: "var" | "let" | "const";
	}
	export interface VariableDeclarator extends Node {
		type: "VariableDeclarator";
		id: Pattern;
		init: Expression | null;
	}
	export interface Expression extends Node {

	}
	export interface ThisExpression extends Expression {
		type: "ThisExpression";
	}
	export interface ArrayExpression extends Expression {
		type: "ArrayExpression";
		elements: Array<Expression | SpreadElement | null>;
	}
	export interface ObjectExpression extends Expression {
		type: "ObjectExpression";
		properties: Array<Property>;
	}
	export interface Property extends Node {
		type: "Property";
		key: Expression;
		value: Expression;
		kind: "init" | "get" | "set";
		method: boolean;
		shorthand: boolean;
		computed: boolean;
	}
	export interface FunctionExpression extends Function, Expression {
		type: "FunctionExpression";
		body: BlockStatement;
	}
	export interface UnaryExpression extends Expression {
		type: "UnaryExpression";
		operator: UnaryOperator;
		prefix: boolean;
		argument: Expression;
	}
	export type UnaryOperator =
		"-" | "+" | "!" | "~" | "typeof" | "void" | "delete";
	export interface UpdateExpression extends Expression {
		type: "UpdateExpression";
		operator: UpdateOperator;
		argument: Expression;
		prefix: boolean;
	}
	export type UpdateOperator =
		"++" | "--";
	export interface BinaryExpression extends Expression {
		type: "BinaryExpression";
		operator: BinaryOperator;
		left: Expression;
		right: Expression;
	}
	export type BinaryOperator =
		"==" | "!=" | "===" | "!=="
         | "<" | "<=" | ">" | ">="
         | "<<" | ">>" | ">>>"
         | "+" | "-" | "*" | "/" | "%"
         | "|" | "^" | "&" | "in"
         | "instanceof" | "**";
	export interface AssignmentExpression extends Expression {
		type: "AssignmentExpression";
		operator: AssignmentOperator;
		left: Pattern;
		right: Expression;
	}
	export type AssignmentOperator =
		"=" | "+=" | "-=" | "*=" | "/=" | "%="
        | "<<=" | ">>=" | ">>>="
        | "|=" | "^=" | "&=" | "**=";
	export interface LogicalExpression extends Expression {
		type: "LogicalExpression";
		operator: LogicalOperator;
		left: Expression;
		right: Expression;
	}
	export type LogicalOperator =
		"||" | "&&";
	export interface MemberExpression extends Expression, Pattern {
		type: "MemberExpression";
		object: Expression | Super;
		property: Expression;
		computed: boolean;
	}
	export interface ConditionalExpression extends Expression {
		type: "ConditionalExpression";
		test: Expression;
		alternate: Expression;
		consequent: Expression;
	}
	export interface CallableExpression extends Expression {
		callee: Expression | Super;
		arguments: Array<Expression | SpreadElement>;
	}
	export interface CallExpression extends CallableExpression {
		type: "CallExpression";
	}
	export interface NewExpression extends CallableExpression {
		type: "NewExpression";
	}
	export interface SequenceExpression extends Expression {
		type: "SequenceExpression";
		expressions: Array<Expression>;
	}
	export interface Pattern extends Node {

	}
	export interface ForOfStatement extends ForIterableStatement {
		type: "ForOfStatement";
	}
	export interface Super extends Node {
		type: "Super";
	}
	export interface SpreadElement extends Node {
		type: "SpreadElement";
		argument: Expression;
	}
	export interface ArrowFunctionExpression extends Function, Expression {
		type: "ArrowFunctionExpression";
		body: BlockStatement | Expression;
		expression: boolean;
	}
	export interface YieldExpression extends Expression {
		type: "YieldExpression";
		argument: Expression | null;
		delegate: boolean;
	}
	export interface TemplateLiteral extends Expression {
		type: "TemplateLiteral";
		quasis: Array<TemplateElement>;
		expressions: Array<Expression>;
	}
	export interface TaggedTemplateExpression extends Expression {
		type: "TaggedTemplateExpression";
		tag: Expression;
		quasi: TemplateLiteral;
	}
	export interface TemplateElement extends Node {
		type: "TemplateElement";
		tail: boolean;
		cooked: string;
		raw: string;
	}
	export interface AssignmentProperty extends Property {
		type: "Property";
		value: Pattern;
		kind: "init";
		method: false;
	}
	export interface ObjectPattern extends Pattern {
		type: "ObjectPattern";
		properties: Array<AssignmentProperty>;
	}
	export interface ArrayPattern extends Pattern {
		type: "ArrayPattern";
		elements: Array<Pattern | null>;
	}
	export interface RestElement extends Pattern {
		type: "RestElement";
		argument: Pattern;
	}
	export interface AssignmentPattern extends Pattern {
		type: "AssignmentPattern";
		left: Pattern;
		right: Expression;
	}
	export interface Class extends Node {
		id: Identifier | null;
		superClass: Expression | null;
		body: ClassBody;
	}
	export interface ClassBody extends Node {
		type: "ClassBody";
		body: Array<MethodDefinition>;
	}
	export interface MethodDefinition extends Node {
		type: "MethodDefinition";
		key: Expression;
		value: FunctionExpression;
		kind: "constructor" | "method" | "get" | "set";
		computed: boolean;
		static: boolean;
	}
	export interface ClassDeclaration extends Class, Declaration {
		type: "ClassDeclaration";
		id: Identifier;
	}
	export interface ClassExpression extends Class, Expression {
		type: "ClassExpression";
	}
	export interface MetaProperty extends Expression {
		type: "MetaProperty";
		meta: Identifier;
		property: Identifier;
	}
	export interface ModuleDeclaration extends Node {

	}
	export interface ModuleSpecifier extends Node {
		local: Identifier;
	}
	export interface ImportDeclaration extends ModuleDeclaration {
		type: "ImportDeclaration";
		specifiers: Array<ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier>;
		source: Literal;
	}
	export interface ImportSpecifier extends ModuleSpecifier {
		type: "ImportSpecifier";
		imported: Identifier;
	}
	export interface ImportDefaultSpecifier extends ModuleSpecifier {
		type: "ImportDefaultSpecifier";
	}
	export interface ImportNamespaceSpecifier extends ModuleSpecifier {
		type: "ImportNamespaceSpecifier";
	}
	export interface ExportNamedDeclaration extends ModuleDeclaration {
		type: "ExportNamedDeclaration";
		declaration: Declaration | null;
		specifiers: Array<ExportSpecifier>;
		source: Literal | null;
	}
	export interface ExportSpecifier extends ModuleSpecifier {
		type: "ExportSpecifier";
		exported: Identifier;
	}
	export interface ExportDefaultDeclaration extends ModuleDeclaration {
		type: "ExportDefaultDeclaration";
		declaration: Declaration | Expression;
	}
	export interface ExportAllDeclaration extends ModuleDeclaration {
		type: "ExportAllDeclaration";
		source: Literal;
	}
	export interface AwaitExpression extends Expression {
		type: "AwaitExpression";
		argument: Expression;
	}
}