import * as tape from 'tape';
import * as ltx from 'ltx';
import * as JXT from '../src/index';

const test = tape.test;
const attribute = JXT.attribute;


interface Message {
    type: string;
    id: string;
    foo?: {
        a: string;
        x?: {
            b: string;
        };
    };
    description?: {
        descType: string;
        a?: string;
        b?: string;
    };
    multi?: Array<{
        c: string;
    }>;
}

interface Presence {
    id: string;
    type: string;
    foo2: {
        a: string;
    };
}


function setupRegistry(): JXT.Registry {
    let registry = new JXT.Registry();

    registry.define({
        path: 'message',
        namespace: 'jabber:client',
        element: 'message',
        fields: {
            type: attribute('type'),
            id: attribute('id')
        }
    });

    registry.define({
        path: 'presence',
        namespace: 'jabber:client',
        element: 'presence',
        fields: {
            type: attribute('type'),
            id: attribute('id')
        }
    });

    return registry;
}


export default function runTests() {
    test('[Import] Basic', t => {
        let registry = setupRegistry();

        let messageXML = ltx.parse(`
            <message xmlns="jabber:client" type="normal" id="123">
              <body>test body</body>
            </message>`);

        let msg = <Message>registry.import(messageXML);

        t.ok(msg, 'Message exists');
        t.equal(msg.type, 'normal', 'Message type is "normal"');
        t.equal(msg.id, '123', 'Message id is "123"');
        t.end();
    });

    test('[Import] Extension', t => {
        let registry = setupRegistry();

        registry.define({
            aliases: [
                'message.foo',
                'presence.foo2'
            ],
            namespace: 'bar',
            element: 'foo',
            fields: {
                a: attribute('a')
            }
        });

        let messageXML = ltx.parse(`
            <message xmlns="jabber:client" type="normal" id="123">
              <body>test body</body>
              <foo xmlns="bar" a="test" />
            </message>`);

        let msg = <Message>registry.import(messageXML);
        t.equal(msg.type, 'normal', 'Message type is "normal"');
        t.equal(msg.id, '123', 'Message id is "123"');
        t.equal(msg.foo.a, 'test', 'Message foo.a is "test"');

        let presenceXML = ltx.parse(`
            <presence xmlns="jabber:client" id="123">
              <foo xmlns="bar" a="test" />
            </presence>`);

        let pres = <Presence>registry.import(presenceXML);
        t.equal(pres.id, '123', 'Presence id is "123"');
        t.equal(pres.foo2.a, 'test', 'Presence foo2.a is "test"');

        t.end();
    });

    test('[Import] Nested Extensions', t => {
        let registry = setupRegistry();

        registry.define({
            path: 'message.foo',
            namespace: 'bar',
            element: 'foo',
            fields: {
                a: attribute('a')
            }
        });

        registry.define({
            path: 'message.foo.x',
            namespace: 'bar',
            element: 'x',
            fields: {
                b: attribute('b')
            }
        });

        let messageXML = ltx.parse(`
            <message xmlns="jabber:client" type="normal" id="123">
              <body>test body</body>
              <foo xmlns="bar" a="test">
                <x b="nested" />
              </foo>
            </message>`);

        let msg = <Message>registry.import(messageXML);
        t.equal(msg.type, 'normal', 'Message type is "normal"');
        t.equal(msg.id, '123', 'Message id is "123"');
        t.equal(msg.foo.a, 'test', 'Message foo.a is "test"');
        t.equal(msg.foo.x.b, 'nested', 'Message foo.x.b is "nested"');

        t.end();
    });

    test('[Import] Multiples', t => {
        let registry = setupRegistry();

        let multi = registry.define({
            namespace: 'foo',
            element: 'multi',
            aliases: [
                { path: 'message.multi', multiple: true }
            ],
            fields: {
                c: attribute('c')
            }
        });

        let messageXML = ltx.parse(`
            <message xmlns="jabber:client" type="normal" id="123">
              <body>test body</body>
              <multi xmlns="foo" c="1" />
              <multi xmlns="foo" c="2" />
              <multi xmlns="foo" c="3" />
            </message>`);

        let msg = <Message>registry.import(messageXML);
        t.equal(msg.type, 'normal', 'Message type is "normal"');
        t.equal(msg.id, '123', 'Message id is "123"');
        t.ok(msg.multi, 'Message multi exists');
        t.equal(msg.multi.length, 3, 'Message multi length is 3');
        t.equal(msg.multi[0].c, '1', 'Message multi[0].c is "1"');
        t.equal(msg.multi[1].c, '2', 'Message multi[0].c is "2"');
        t.equal(msg.multi[2].c, '3', 'Message multi[0].c is "3"');

        t.end();
    });

    test('[Import] Polymorphic', t => {
        let registry = setupRegistry();

        registry.define({
            path: 'message.description',
            namespace: 'foo',
            element: 'description',
            typeField: 'descType',
            type: 'foo',
            fields: {
                a: attribute('a')
            }
        });

        registry.define({
            path: 'message.description',
            namespace: 'bar',
            element: 'description',
            typeField: 'descType',
            type: 'bar',
            fields: {
                b: attribute('b')
            }
        });

        let message1XML = ltx.parse(`
            <message xmlns="jabber:client" type="normal" id="123">
              <body>test body</body>
              <description xmlns="foo" a="test" />
            </message>`);

        let msg1 = <Message>registry.import(message1XML);
        t.equal(msg1.description.descType, 'foo', 'Message description.descType is "foo"');
        t.equal(msg1.description.a, 'test', 'Message description.a is "test"');


        let message2XML = ltx.parse(`
            <message xmlns="jabber:client" type="normal" id="123">
              <body>test body</body>
              <description xmlns="bar" b="test2" />
            </message>`);

        let msg2 = <Message>registry.import(message2XML);
        t.equal(msg2.description.descType, 'bar', 'Message description.descType is "bar"');
        t.equal(msg2.description.b, 'test2', 'Message description.b is "test2"');

        t.end();
    });
}
