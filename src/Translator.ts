import {
    FieldName,
    XName,
    Importer,
    Exporter,
    ChildTranslator,
    Type,
    DefinitionUpdateOptions,
    XMLData,
    JSONData,
    TranslationContext
} from './Definitions';

import { createElement } from './Types';



export class Translator {
    public typeField: FieldName;
    public typeValues: Map<XName, Type>;
    public languageField: FieldName;
    private importers: Map<XName, Importer>;
    private exporters: Map<Type, Exporter>;
    private children: Map<FieldName, ChildTranslator>;
    private childrenIndex: Map<XName, FieldName>;

    constructor() {
        this.typeField = '';
        this.languageField = 'lang';
        this.typeValues = new Map();
        this.importers = new Map();
        this.exporters = new Map();
        this.children = new Map();
        this.childrenIndex = new Map();
    }

    public addChild(name: FieldName, translator: Translator, multiple?: boolean) {
        let child: ChildTranslator = { name, translator, multiple: multiple || false };
        let existingChild = this.children.get(name);

        if (!existingChild) {
            this.children.set(name, child);

            for (let [xid, importer] of translator.importers) {
                this.childrenIndex.set(xid, name);
            };
        } else {
            let existing = existingChild.translator;

            if (multiple === true || multiple === false) {
                existingChild.multiple = multiple;
            }

            for (let [xid, importer] of translator.importers) {
                existing.updateDefinition({
                    namespace: importer.namespace,
                    element: importer.element,
                    importers: importer.fields,
                    exporters: new Map()
                });
                this.childrenIndex.set(xid, name);
            }

            for (let [exportType, exporter] of translator.exporters) {
                existing.updateDefinition({
                    namespace: exporter.namespace,
                    element: exporter.element,
                    importers: new Map(),
                    exporters: exporter.fields
                });
            }
        }
    }

    public getChild(name: FieldName): Translator {
        let child = this.children.get(name);
        if (!child) {
            return null;
        }
        return child.translator;
    }

    public updateDefinition(opts: DefinitionUpdateOptions) {
        let xid = `{${opts.namespace}}${opts.element}`;

        let importer = this.importers.get(xid) || {
            namespace: opts.namespace,
            element: opts.element,
            fields: new Map()
        };
        opts.importers.forEach((fieldImporter, fieldName) => {
            importer.fields.set(fieldName, fieldImporter);
        });
        this.importers.set(xid, importer);

        let exporter = this.exporters.get(opts.type || '') || {
            namespace: opts.namespace,
            element: opts.element,
            fields: new Map()
        };
        opts.exporters.forEach((fieldExporter, fieldName) => {
            exporter.fields.set(fieldName, fieldExporter);
        });
        this.exporters.set(opts.type || '', exporter);
        if (opts.type) {
            this.typeValues.set(xid, opts.type);
        }
    }

    public import(xml: XMLData, parentContext: TranslationContext = {}): JSONData {
        let xid = `{${xml.getNS()}}${xml.getName()}`;
        let output = {};

        let importer = this.importers.get(xid);
        if (!importer) {
            return null;
        }

        let context = Object.assign({}, parentContext, {
            lang: xml.getAttr('xml:lang') || parentContext.lang
        });

        if (this.typeField && this.typeValues.get(xid)) {
            output[this.typeField] = this.typeValues.get(xid);
        }

        importer.fields.forEach((importField, fieldName) => {
            let value = importField(xml, context);
            if (value !== null && value !== undefined) {
                output[fieldName] = value;
            }
        });

        xml.children.forEach(child => {
            if (typeof child === 'string') {
                return;
            } else {
                let childName = `{${child.getNS()}}${child.getName()}`;
                if (!this.childrenIndex.has(childName)) {
                    return;
                }

                let fieldName = this.childrenIndex.get(childName);
                let { translator, multiple } = this.children.get(fieldName);

                let childOutput = translator.import(child, context);
                if (childOutput) {
                    if (multiple) {
                        if (!output[fieldName]) {
                            output[fieldName] = [];
                        }
                        output[fieldName].push(childOutput);
                    } else {
                        output[fieldName] = childOutput;
                    }
                }
            }
        });

        return output;
    }

    public export(data: JSONData, parentContext: TranslationContext = {}): XMLData {
        let exportType = '';
        if (this.typeField) {
            exportType = data[this.typeField] || '';
        }
        let exporter = this.exporters.get(exportType);
        if (!exporter) {
            return null;
        }

        let output = createElement(exporter.namespace, exporter.element, parentContext.namespace);
        let context = Object.assign({}, parentContext, {
            namespace: exporter.namespace,
            lang: data[this.languageField] || parentContext.lang
        });

        let langExporter = exporter.fields.get(this.languageField);
        if (langExporter) {
            langExporter(output, data[this.languageField], parentContext);
        }

        Object.keys(data).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(data, key)) {
                return;
            }
            if (key === this.languageField) {
                // We've already processed this field
                return;
            }

            let value = data[key];
            let fieldExporter = exporter.fields.get(key);

            if (fieldExporter) {
                fieldExporter(output, value, context);
            } else {
                let childTranslator = this.children.get(key);
                if (!childTranslator) {
                    return;
                }

                let { translator, multiple, name } = childTranslator;
                let items: Array<any>;

                if (multiple) {
                    items = value;
                } else {
                    items = [value];
                }

                for (let item of items) {
                    let childOutput = translator.export(item, context);
                    if (childOutput) {
                        output.cnode(childOutput);
                    }
                }
            }
        });

        return output;
    }
}
