import * as tape from 'tape';
import * as ltx from 'ltx';
import {
    Registry,
    attribute,
    booleanAttribute,
    integerAttribute,
    floatAttribute,
    dateAttribute,
    languageAttribute,
    text,
    textBuffer,
    childAttribute,
    childBooleanAttribute,
    childIntegerAttribute,
    childFloatAttribute,
    childDateAttribute,
    childLanguageAttribute,
    childText,
    childTextBuffer,
    childBoolean,
    childInteger,
    childFloat,
    childDate,
    childEnum,
    multipleChildAttribute,
    multipleChildText
} from '../src/index';


const test = tape.test;


interface Tester {
    attribute?: string;
    booleanAttribute?: boolean;
    integerAttribute?: number;
    floatAttribute?: number;
    dateAttribute?: string|Date;
    languageAttribute?: string;
    text?: string;
    base64Text?: Buffer|string;
    hexText?: Buffer|string;
    childAttribute?: string;
    childBooleanAttribute?: boolean;
    childIntegerAttribute?: number;
    childFloatAttribute?: number;
    childDateAttribute?: string|Date;
    childLanguageAttribute?: string;
    childText?: string;
    childBase64Text?: Buffer|string;
    childHexText?: Buffer|string;
    childInteger?: number;
    childFloat?: number;
    childBoolean?: boolean;
    childDate?: Date|string;
    childEnum?: string;
    multipleChildAttribute?: Array<string>;
    multipleChildText?: Array<string>;
}


function setupRegistry(): Registry {
    let registry = new Registry();

    registry.define({
        path: 'test',
        namespace: 'test',
        element: 'wrapper',
        fields: {
            attribute: attribute('a'),
            booleanAttribute: booleanAttribute('b'),
            integerAttribute: integerAttribute('c'),
            floatAttribute: floatAttribute('d'),
            dateAttribute: dateAttribute('e'),
            languageAttribute: languageAttribute(),
            text: text(),
            base64Text: textBuffer('base64'),
            hexText: textBuffer('hex'),
            childAttribute: childAttribute('test', 'child', 'a'),
            childBooleanAttribute: childBooleanAttribute('test', 'child', 'b'),
            childIntegerAttribute: childIntegerAttribute('test', 'child', 'c'),
            childFloatAttribute: childFloatAttribute('test', 'child', 'd'),
            childDateAttribute: childDateAttribute('test', 'child', 'e'),
            childLanguageAttribute: childLanguageAttribute('test', 'child'),
            childText: childText('test', 'ca'),
            childBase64Text: childTextBuffer('test', 'cb', 'base64'),
            childHexText: childTextBuffer('test', 'cc', 'hex'),
            childBoolean: childBoolean('test', 'cd'),
            childInteger: childInteger('test', 'ce'),
            childFloat: childFloat('test', 'cf'),
            childDate: childDate('test', 'cg'),
            childEnum: childEnum('test', ['one', 'two', 'three']),
            multipleChildAttribute: multipleChildAttribute('test', 'ch', 'attr'),
            multipleChildText: multipleChildText('test', 'ci')
        }
    });

    return registry;
}


export default function runTests() {

    test('[Types] Top-level Attributes', t => {
       let registry = setupRegistry();

       let exported = registry.export('test', <Tester>{
            attribute: 'string',
            booleanAttribute: true,
            integerAttribute: 5,
            floatAttribute: 6.28,
            dateAttribute: new Date('2000-01-01'),
            languageAttribute: 'en'
       });
       let imported = <Tester>registry.import(exported);

       t.equal(imported.attribute, 'string', 'Basic attribute');
       t.equal(imported.booleanAttribute, true, 'Boolean attribute');
       t.equal(imported.integerAttribute, 5, 'Integer attribute');
       t.equal(imported.floatAttribute, 6.28, 'Float attribute');
       t.equal(imported.dateAttribute.toString(), new Date('2000-01-01').toString(), 'Date attribute');
       t.equal(imported.languageAttribute, 'en', 'Language attribute');

       t.end();
    });

    test('[Types] Text', t => {
       let registry = setupRegistry();

       let exported1 = registry.export('test', <Tester>{ text: 'string' });
       let exported2 = registry.export('test', <Tester>{ base64Text: 'string' });
       let exported3 = registry.export('test', <Tester>{ hexText: 'string' });

       let imported1 = <Tester>registry.import(exported1);
       let imported2 = <Tester>registry.import(exported2);
       let imported3 = <Tester>registry.import(exported3);

       t.equal(imported1.text, 'string', 'Basic text');
       t.equal(imported2.base64Text.toString('utf8'), 'string', 'Base64 text');
       t.equal(imported3.hexText.toString('utf8'), 'string', 'Hex text');
       t.end();
    });

    test('[Types] Child Attributes', t => {
       let registry = setupRegistry();

       let exported = registry.export('test', <Tester>{
            childAttribute: 'string',
            childBooleanAttribute: true,
            childIntegerAttribute: 5,
            childFloatAttribute: 6.28,
            childDateAttribute: new Date('2000-01-01'),
            childLanguageAttribute: 'en'
       });
       let imported = <Tester>registry.import(exported);

       t.equal(imported.childAttribute, 'string', 'Basic attribute');
       t.equal(imported.childBooleanAttribute, true, 'Boolean attribute');
       t.equal(imported.childIntegerAttribute, 5, 'Integer attribute');
       t.equal(imported.childFloatAttribute, 6.28, 'Float attribute');
       t.equal(imported.childDateAttribute.toString(), new Date('2000-01-01').toString(), 'Date attribute');
       t.equal(imported.childLanguageAttribute, 'en', 'Language attribute');

       t.end();
    });

    test('[Types] Child Values', t => {
       let registry = setupRegistry();

       let exported = registry.export('test', <Tester>{
            childText: 'string',
            childBase64Text: 'string',
            childHexText: 'string',
            childInteger: 5,
            childFloat: 6.28,
            childDate: new Date('2000-01-01'),
            childBoolean: true,
            childEnum: 'two'
       });
       let imported = <Tester>registry.import(exported);

       t.equal(imported.childText, 'string', 'Child text');
       t.equal(imported.childBase64Text.toString('utf8'), 'string', 'Child base64 text');
       t.equal(imported.childHexText.toString('utf8'), 'string', 'Child hex text');
       t.equal(imported.childInteger, 5, 'Child integer');
       t.equal(imported.childFloat, 6.28, 'Child float');
       t.equal(imported.childBoolean, true, 'Child boolean');
       t.equal(imported.childDate.toString(), new Date('2000-01-01').toString(), 'Child date');
       t.equal(imported.childEnum, 'two', 'Child enum');
       t.end();
    });

    test('[Types] Multiple child values', t => {
       let registry = setupRegistry();

       let exported = registry.export('test', <Tester>{
            multipleChildAttribute: [ 'a', 'b', 'c'],
            multipleChildText: [ 'one', 'two', 'three' ]
       });
       console.log(exported.toString());
       let imported = <Tester>registry.import(exported);
       console.log(JSON.stringify(imported));

       t.deepEqual(imported.multipleChildAttribute, [ 'a', 'b', 'c'], 'Multiple child attributes');
       t.deepEqual(imported.multipleChildText, [ 'one', 'two', 'three'], 'Multiple child text');
       t.end();
    });
}
