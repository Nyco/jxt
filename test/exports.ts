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
    description?: {
        descType: string;
        a?: string;
        b?: string;
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
    test('[Export] Basic', t => {
        let registry = setupRegistry();
        let output = registry.export('message', <Message>{
            id: '123',
            type: 'normal'
        });

        let reimported = registry.import(output);
        let msg = <Message>reimported;
        t.equal(msg.type, 'normal', 'Message type is "normal"');
        t.equal(msg.id, '123', 'Message id is "123"');
        t.end();
    });

    test('[Export] Extension', t => {
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

        let msgOutput = registry.export('message', <Message>{
            id: '123',
            type: 'normal',
            foo: {
                a: 'test'
            }
        });

        let parsedMsg = registry.import(msgOutput);
        let msg = <Message>parsedMsg;
        t.equal(msg.type, 'normal', 'Message type is "normal"');
        t.equal(msg.id, '123', 'Message id is "123"');
        t.equal(msg.foo.a, 'test', 'Message foo.a is "test"');

        let presenceOutput = registry.export('presence', <Presence>{
            id: '123',
            foo2: {
                a: 'test'
            }
        });

        let parsedPres = registry.import(presenceOutput);
        let pres = <Presence>parsedPres;
        t.equal(pres.id, '123', 'Presence id is "123"');
        t.equal(pres.foo2.a, 'test', 'Presence foo2.a is "test"');

        t.end();
    });

    test('[Export] Nested Extensions', t => {
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

        let ext = registry.define({
            namespace: 'bar',
            element: 'x',
            fields: {
                b: attribute('b')
            }
        });

        registry.alias('bar', 'x', 'message.foo.x');

        let msgOutput = registry.export('message', <Message>{
            id: '123',
            type: 'normal',
            foo: {
                a: 'test',
                x: {
                    b: 'nested'
                }
            }
        });

        let parsedMsg = registry.import(msgOutput);
        let msg = <Message>parsedMsg;
        t.equal(msg.type, 'normal', 'Message type is "normal"');
        t.equal(msg.id, '123', 'Message id is "123"');
        t.equal(msg.foo.a, 'test', 'Message foo.a is "test"');
        t.equal(msg.foo.x.b, 'nested', 'Message foo.x.b is "nested"');

        t.end();
    });

    test('[Export] Multiples', t => {
        let registry = setupRegistry();

        let multi = registry.define({
            namespace: 'foo',
            element: 'multi',
            aliases: [
                { path: 'message.multi', multiple: true}
            ],
            fields: {
                c: attribute('c')
            }
        });

        let msgOutput = registry.export('message', <Message>{
            id: '123',
            type: 'normal',
            multi: [
                { c: '1' },
                { c: '2' },
                { c: '3' }
            ]
        });

        let parsedMsg = registry.import(msgOutput);
        let msg = <Message>parsedMsg;
        t.equal(msg.type, 'normal', 'Message type is "normal"');
        t.equal(msg.id, '123', 'Message id is "123"');
        t.ok(msg.multi, 'Message multi exists');
        t.equal(msg.multi.length, 3, 'Message multi length is 3');
        t.equal(msg.multi[0].c, '1', 'Message multi[0].c is "1"');
        t.equal(msg.multi[1].c, '2', 'Message multi[0].c is "2"');
        t.equal(msg.multi[2].c, '3', 'Message multi[0].c is "3"');

        t.end();
    });

    test('[Export] Polymorphic', t => {
        let registry = setupRegistry();

        registry.define({
            path: 'message.description',
            aliases: [
                'presence.description'
            ],
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
            aliases: [
                'presence.description'
            ],
            namespace: 'bar',
            element: 'description',
            typeField: 'descType',
            type: 'bar',
            fields: {
                b: attribute('b')
            }
        });

        let msg1Output = registry.export('presence', <Message>{
            id: '123',
            type: 'normal',
            description: {
                descType: 'foo',
                a: 'test'
            }
        });

        let msg1 = <Message>registry.import(msg1Output);
        t.equal(msg1.description.descType, 'foo', 'Message description.descType is "foo"');
        t.equal(msg1.description.a, 'test', 'Message description.a is "test"');


        let msg2Output = registry.export('presence', <Message>{
            id: '123',
            type: 'normal',
            description: {
                descType: 'bar',
                b: 'test2'
            }
        });

        let msg2 = <Message>registry.import(msg2Output);
        t.equal(msg2.description.descType, 'bar', 'Message description.descType is "bar"');
        t.equal(msg2.description.b, 'test2', 'Message description.b is "test2"');

        t.end();
    });
}
