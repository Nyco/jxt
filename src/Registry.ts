import {
    JSONData,
    XMLData,
    XName,
    FieldName,
    FieldImporter,
    FieldExporter,
    FieldDefinition,
    DefinitionOptions,
    LinkOptions
} from './Definitions';

import { Translator } from './Translator';


export class Registry {
    public root: Translator;
    public translators: Map<XName, Translator>;

    constructor() {
        this.translators = new Map();
        this.root = new Translator();
    }

    public import(xml: XMLData): JSONData {
        let translator = this.findTranslator(xml.getNS(), xml.getName());
        if (!translator) {
            return null;
        }

        return translator.import(xml);
    }

    public export(path: string, data: JSONData): XMLData {
        let fields = path.split('.').filter(item => {
            return item !== '';
        });
        let translator = this.root;

        for (let field of fields) {
            translator = translator.getChild(field);
            if (!translator) {
                return null;
            }
        }

        return translator.export(data);
    }

    public define(definition: DefinitionOptions): void {
        let translator: Translator;
        if (definition.type && definition.path) {
            translator = this.walkToTranslator(definition.path.split('.'), true);
        } else {
            translator = this.findTranslator(definition.namespace, definition.element, true);
        }
        this.indexTranslator(definition.namespace, definition.element, translator);

        let fields = definition.fields || {};
        let importers = new Map();
        let exporters = new Map();

        Object.keys(fields).forEach(key => {
            if (!fields.hasOwnProperty(key)) {
                return;
            }

            let field = <FieldDefinition>fields[key];
            importers.set(key, field.importer);
            exporters.set(key, field.exporter);
        });

        if (definition.typeField) {
            translator.typeField = definition.typeField;
        }

        translator.updateDefinition({
            namespace: definition.namespace,
            element: definition.element,
            type: definition.type,
            importers,
            exporters
        });

        if (definition.path) {
            this.alias(definition.namespace, definition.element, definition.path);
        }

        if (definition.aliases) {
            for (let link of definition.aliases) {
                if (typeof link === 'string') {
                    this.alias(definition.namespace, definition.element, link);
                } else {
                    this.alias(definition.namespace, definition.element, link.path, link.multiple);
                }
            }
        }
    }

    public alias(namespace: string, element: string, path: string, multiple: boolean = false): void {
        let linkedTranslator = this.findTranslator(namespace, element);
        if (!linkedTranslator) {
            linkedTranslator = new Translator();
        }
        this.indexTranslator(namespace, element, linkedTranslator);


        let keys = path.split('.').filter(key => {
            return key !== '';
        });

        let finalKey = keys.pop();
        let translator = this.walkToTranslator(keys, true);
        translator.addChild(finalKey, linkedTranslator, multiple);
    }

    public findTranslator(namespace: string, element: string, autovifiy: boolean = false): Translator {
        let translator = this.translators.get(`{${namespace}}${element}`);
        if (!translator && autovifiy) {
            translator = new Translator();
            this.indexTranslator(namespace, element, translator);
        }
        return translator;
    }

    public walkToTranslator(path: Array<string>, autovivify: boolean = false): Translator {
        let translator = this.root;
        for (let key of path) {
            let next = translator.getChild(key);
            if (!next) {
                if (autovivify) {
                    next = new Translator();
                    translator.addChild(key, next);
                } else {
                    return null;
                }
            }
            translator = next;
        }

        return translator;
    }

    private indexTranslator(namespace: string, element: string, translator: Translator): void {
        this.translators.set(`{${namespace}}${element}`, translator);
    }
}
