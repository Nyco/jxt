import { Translator } from './Translator';


export interface JSONData {}
export interface XMLData {
    parent: XMLData;
    children: Array<XMLData|string>;
    getName: () => string;
    getNS: () => string;
    getText: () => string;
    attr: (name: string, value: string) => void;
    getAttr: (attr: string) => string;
    getChild: (tag: string, namespace?: string) => XMLData;
    getChildren: (tag: string, namespace?: string) => Array<XMLData>;
    cnode: (node: XMLData) => XMLData;
    toString: () => string;
}

export type FieldName = string;
export type XName = string;
export type Type = string;
export type FieldImporter = (xml: XMLData) => any;
export type FieldExporter = (xml: XMLData, data: any) => void;

export interface FieldDefinition {
    importer: FieldImporter;
    exporter: FieldExporter;
}

export interface Importer {
    namespace: string;
    element: string;
    fields: Map<FieldName, FieldImporter>;
}

export interface Exporter {
    namespace: string;
    element: string;
    fields: Map<FieldName, FieldExporter>;
}

export interface ChildTranslator {
    name: FieldName;
    translator: Translator;
    multiple: boolean;
}

export interface DefinitionUpdateOptions {
    namespace: string;
    element: string;
    type?: string;
    importers: Map<FieldName, FieldImporter>;
    exporters: Map<FieldName, FieldExporter>;
}

export interface DefinitionOptions {
    namespace: string;
    element: string;
    typeField?: string;
    type?: string;
    fields?: Object;
    path?: string;
    aliases?: Array<string|LinkPath>;
}

export interface LinkPath {
    path: string;
    multiple?: boolean;
}

export interface LinkOptions {
    namespace: string;
    element: string;
    path: string|Array<string>;
    multiple?: boolean;
}
