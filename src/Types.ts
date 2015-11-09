import * as ltx from 'ltx';
import { XMLData, JSONData, FieldDefinition } from './Definitions';


export function createElement(namespace: string, name: string, parentNamespace: string): XMLData {
    let el = new ltx.Element(name);

    if (!parentNamespace || namespace !== parentNamespace) {
        el.attr('xmlns', namespace);
    }

    return el;
}

export function findOrCreate(xml: XMLData, namespace: string, element: string): XMLData {
    let existing = xml.getChild(element, namespace);
    if (existing) {
        return existing;
    }

    let created = createElement(namespace, element, xml.getNS());
    xml.cnode(created);
    return created;
}


export function attribute(name: string, defaultValue?: string): FieldDefinition {
    return {
        importer(xml: XMLData) {
            return xml.getAttr(name) || defaultValue;
        },
        exporter(xml: XMLData, value: string) {
            xml.attr(name, value);
        }
    };
}

export function booleanAttribute(name: string): FieldDefinition {
    return {
        importer(xml: XMLData) {
            let data = xml.getAttr(name);
            if (data === 'true' || data === '1') {
                return true;
            }
            if (data === 'false' || data === '0') {
                return false;
            }
        },
        exporter(xml: XMLData, value: boolean) {
            xml.attr(name, value ? '1' : '0');
        }
    };
}

export function integerAttribute(name: string, defaultValue?: number): FieldDefinition {
    return {
        importer(xml: XMLData) {
            let data = xml.getAttr(name);
            if (data) {
                return parseInt(data, 10);
            } else if (defaultValue) {
                return defaultValue;
            }
        },
        exporter(xml: XMLData, value: number) {
            xml.attr(name, value.toString());
        }
    };
}

export function floatAttribute(name: string, defaultValue?: number): FieldDefinition {
    return {
        importer(xml: XMLData) {
            let data = xml.getAttr(name);
            if (data) {
                return parseFloat(data);
            } else if (defaultValue) {
                return defaultValue;
            }
        },
        exporter(xml: XMLData, value: number) {
            xml.attr(name, value.toString());
        }
    };
}

export function dateAttribute(name: string, useCurrentDate: boolean = false): FieldDefinition {
    return {
        importer(xml: XMLData) {
            let data = xml.getAttr(name);
            if (data) {
                return new Date(data);
            } else if (useCurrentDate) {
                return new Date(Date.now());
            }
        },
        exporter(xml: XMLData, value: string|Date) {
            let data: string;

            if (typeof value === 'string') {
                data = value;
            } else {
                data = value.toISOString();
            }

            xml.attr(name, data);
        }
    };
}

export function languageAttribute(): FieldDefinition {
    return {
        importer(xml: XMLData) {
            return xml.getAttr('xml:lang');
        },
        exporter(xml: XMLData, value: string) {
            xml.attr('xml:lang', value);
        }
    };
}

export function text(defaultValue?: string): FieldDefinition {
    return {
        importer(xml: XMLData) {
            return xml.getText() || defaultValue;
        },
        exporter(xml: XMLData, value: string) {
            xml.children.push(value);
        }
    };
}

export function textBuffer(encoding: string = 'utf8'): FieldDefinition {
    return {
        importer(xml: XMLData) {
            let data = xml.getText();
            if (encoding === 'base64' && data === '=') {
                data = '';
            }
            return new Buffer(xml.getText(), encoding);
        },
        exporter(xml: XMLData, value: Buffer|string) {
            let data: string;
            if (typeof value === 'string') {
                data = new Buffer(value).toString(encoding);
            } else {
                data = value.toString(encoding);
            }
            if (encoding === 'base64') {
                data = data || '=';
            }
            xml.children.push(data);
        }
    };
}

export function childAttribute(namespace: string, element: string, name: string, defaultValue?: string): FieldDefinition {
    let converter = attribute(name, defaultValue);
    return {
        importer(xml: XMLData) {
            let child = xml.getChild(element, namespace);
            if (!child) {
                return defaultValue;
            }
            return converter.importer(child);
        },
        exporter(xml: XMLData, value: string) {
            let child = findOrCreate(xml, namespace, element);
            return converter.exporter(child, value);
        }
    };
}

export function childBooleanAttribute(namespace: string, element: string, name: string): FieldDefinition {
    let converter = booleanAttribute(name);
    return {
        importer(xml: XMLData) {
            let child = xml.getChild(element, namespace);
            if (!child) {
                return;
            }
            return converter.importer(child);
        },
        exporter(xml: XMLData, value: boolean) {
            let child = findOrCreate(xml, namespace, element);
            return converter.exporter(child, value);
        }
    };
}

export function childIntegerAttribute(namespace: string, element: string, name: string, defaultValue?: number): FieldDefinition {
    let converter = integerAttribute(name, defaultValue);
    return {
        importer(xml: XMLData) {
            let child = xml.getChild(element, namespace);
            if (!child) {
                return defaultValue;
            }
            return converter.importer(child);
        },
        exporter(xml: XMLData, value: number) {
            let child = findOrCreate(xml, namespace, element);
            return converter.exporter(child, value);
        }
    };
}

export function childFloatAttribute(namespace: string, element: string, name: string, defaultValue?: number): FieldDefinition {
    let converter = floatAttribute(name, defaultValue);
    return {
        importer(xml: XMLData) {
            let child = xml.getChild(element, namespace);
            if (!child) {
                return defaultValue;
            }
            return converter.importer(child);
        },
        exporter(xml: XMLData, value: number) {
            let child = findOrCreate(xml, namespace, element);
            return converter.exporter(child, value);
        }
    };
}

export function childDateAttribute(namespace: string, element: string, name: string, useCurrentDate: boolean = false): FieldDefinition {
    let converter = dateAttribute(name, useCurrentDate);
    return {
        importer(xml: XMLData) {
            let child = xml.getChild(element, namespace);
            if (!child) {
                if (useCurrentDate) {
                    return new Date(Date.now());
                }
                return null;
            }
            return converter.importer(child);
        },
        exporter(xml: XMLData, value: Date|string) {
            let child = findOrCreate(xml, namespace, element);
            return converter.exporter(child, value);
        }
    };
}

export function childLanguageAttribute(namespace: string, element: string): FieldDefinition {
    let converter = languageAttribute();
    return {
        importer(xml: XMLData) {
            let child = xml.getChild(element, namespace);
            if (!child) {
                return null;
            }
            return converter.importer(child);
        },
        exporter(xml: XMLData, value: string) {
            let child = findOrCreate(xml, namespace, element);
            return converter.exporter(child, value);
        }
    };
}

export function childText(namespace: string, element: string, defaultValue?: string): FieldDefinition {
    return {
        importer(xml: XMLData) {
            let child = xml.getChild(element, namespace);
            if (!child) {
                return defaultValue;
            }
            return child.getText() || defaultValue;
        },
        exporter(xml: XMLData, value: string) {
            let child = findOrCreate(xml, namespace, element);
            child.children.push(value);
        }
    };
}

export function childTextBuffer(namespace: string, element: string, encoding: string = 'utf8'): FieldDefinition {
    return {
        importer(xml: XMLData) {
            let child = xml.getChild(element, namespace);
            let data = child ? child.getText() || '' : '';
            if (encoding === 'base64' && data === '=') {
                data = '';
            }
            return new Buffer(data, encoding);
        },
        exporter(xml: XMLData, value: Buffer|string) {
            let child = findOrCreate(xml, namespace, element);

            let data: string;
            if (typeof value === 'string') {
                data = new Buffer(value).toString(encoding);
            } else {
                data = value.toString(encoding);
            }
            if (encoding === 'base64') {
                data = data || '=';
            }
            child.children.push(data);
        }
    };
}

export function childBoolean(namespace: string, element: string): FieldDefinition {
    return {
        importer(xml: XMLData) {
            let child = xml.getChild(element, namespace);
            if (child) {
                return true;
            }
        },
        exporter(xml: XMLData, value: boolean) {
            if (value) {
                findOrCreate(xml, namespace, element);
            }
        }
    };
}

export function childDate(namespace: string, element: string, useCurrentDate: boolean = false): FieldDefinition {
    return {
        importer(xml: XMLData) {
            let child = xml.getChild(element, namespace);
            if (!child) {
                if (useCurrentDate) {
                    return new Date(Date.now());
                }
                return null;
            }
            let data = child.getText();
            if (data) {
                return new Date(data);
            } else if (useCurrentDate) {
                return new Date(Date.now());
            }
        },
        exporter(xml: XMLData, value: Date|string) {
            let child = findOrCreate(xml, namespace, element);
            let data: string;

            if (typeof value === 'string') {
                data = value;
            } else {
                data = value.toISOString();
            }

            child.children.push(data);
        }
    };
}

export function childInteger(namespace: string, element: string, defaultValue?: number): FieldDefinition {
    return {
        importer(xml: XMLData) {
            let child = xml.getChild(element, namespace);
            if (!child) {
                return defaultValue;
            }
            let data = child.getText();
            if (data) {
                return parseInt(data, 10);
            } else if (defaultValue) {
                return defaultValue;
            }
        },
        exporter(xml: XMLData, value: number) {
            let child = findOrCreate(xml, namespace, element);
            child.children.push(value.toString());
        }
    };
}

export function childFloat(namespace: string, element: string, defaultValue?: number): FieldDefinition {
    return {
        importer(xml: XMLData) {
            let child = xml.getChild(element, namespace);
            if (!child) {
                return defaultValue;
            }
            let data = child.getText();
            if (data) {
                return parseFloat(data);
            } else if (defaultValue) {
                return defaultValue;
            }
        },
        exporter(xml: XMLData, value: number) {
            let child = findOrCreate(xml, namespace, element);
            child.children.push(value.toString());
        }
    };
}

export function childEnum(namespace: string, elements: Array<string>): FieldDefinition {
    let names = new Set(elements);
    return {
        importer(xml: XMLData) {
            for (let child of xml.children) {
                if (typeof child === 'string') {
                    continue;
                } else if (child.getNS() === namespace && names.has(child.getName())) {
                    return child.getName();
                }
            }
        },
        exporter(xml: XMLData, value: string) {
            findOrCreate(xml, namespace, value);
        }
    };
}

export function multipleChildText(namespace: string, element: string): FieldDefinition {
    return {
        importer(xml: XMLData) {
            let result: Array<string> = [];
            let children = xml.getChildren(element, namespace);
            for (let child of children) {
                result.push(child.getText());
            }
            return result;
        },
        exporter(xml: XMLData, values: Array<string>) {
            for (let value of values) {
                let child = createElement(namespace, element, xml.getNS());
                child.children.push(value);
                xml.cnode(child);
            }
        }
    };
}

export function multipleChildAttribute(namespace: string, element: string, name: string): FieldDefinition {
    return {
        importer(xml: XMLData) {
            let result: Array<string> = [];
            let children = xml.getChildren(element, namespace);
            for (let child of children) {
                result.push(child.getAttr(name));
            }
            return result;
        },
        exporter(xml: XMLData, values: Array<string>) {
            for (let value of values) {
                let child = createElement(namespace, element, xml.getNS());
                child.attr(name, value);
                xml.cnode(child);
            }
        }
    };
}
