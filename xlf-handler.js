const xmlJs = require('xml-js');

function getElement(src, path) {
    let result = src;

    for (const pnode of path) {
        if (!result.elements) {
            return null;
        }

        result = result.elements.find(e => e.name === pnode);
        if (!result) {
            return null;
        }
    }

    return result;
}

function convertToPlainText(src) {
    let result = '';
    if (!src || !src.elements) {
        return result;
    }

    for (const el of src.elements) {
        switch (el.type) {
            case 'text':
                result += el.text;
                break;
            
            case 'element':
                if (el.name === 'x') {
                    result += '{$' + el.attributes.id + '}';
                }

                break;
        }
    }

    const leftTrimmed = result.trimStart();
    if (leftTrimmed.length !== result.length) {
        result = ' ' + leftTrimmed;
    }

    const rightTrimmed = result.trimEnd();
    if (rightTrimmed.length !== result.length) {
        result = rightTrimmed + ' ';
    }

    return result;
}

function* getTransUnits(root) {
    if (!root.elements) {
        return;
    }

    for (const el of root.elements) {
        if (el.name === 'trans-unit') {
            yield el;
        }
    }
}

module.exports.createParser = function (fileContent) {
    return {
        getLocale: () => null,
        parse: function* () {
            const xml = xmlJs.xml2js(fileContent);
            const root = getElement(xml, ['xliff', 'file', 'body']);
        
            for (const transUnit of getTransUnits(root)) {
                const id = transUnit.attributes.id;
                const sourceElement = getElement(transUnit, ['source']);
                const text = convertToPlainText(sourceElement);
        
                yield { id, transUnit, text };
            }
        }
    };
}

module.exports.save = function (translatedEntries) {
    const xml = {
        declaration: {
            attributes: {
                version: '1.0',
                encoding: 'utf-8'
            }
        },
        elements: [
            {
                type: 'element',
                name: 'xliff',
                attributes: {
                    version: '1.2',
                    xmlns: 'urn:oasis:names:tc:xliff:document:1.2',
                    'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
                    'xsi:schemaLocation': 'urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-strict.xsd'
                },
                elements: [
                    {
                        type: 'element',
                        name: 'file',
                        attributes: {
                            'source-language': 'en-US',
                        },
                        elements: [
                            {
                                type: 'element',
                                name: 'body',
                                elements: translatedEntries.map(e => e.transUnit)
                            }
                        ]
                    }
                ]
            }
        ]
    };

    return xmlJs.js2xml(xml, { spaces: 2 });
};
