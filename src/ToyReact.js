function merge(prevState, state) {
    if (typeof state === 'object') {
        for (let prop in state) {
            if (typeof state[prop] === 'object') {
                if (typeof prevState[prop] !== 'object') {
                    prevState[prop] = {};
                }
                merge(prevState[prop], state[prop]);
            } else {
                prevState[prop] = state[prop];
            }
        }
    }
}

class Component {
    constructor() {
        this.isMounted = false;
        this.children = [];
        this.props = Object.create(null);
    }

    _callLifeCircle(name, ...args) {
        const cb = this[name];
        if (typeof cb === 'function') {
            return cb.apply(this, args);
        }
    }

    appendChild(vchild) {
        this.children.push(vchild);
    }

    setAttribute(name, value) {
        this[name] = value;
        this.props[name] = value;
    }

    mountTo(range) {
        this._callLifeCircle('componentWillMount');

        this.range = range;
        this.update();

        this.isMounted = true;

        this._callLifeCircle('componentDidMount');
    }

    setState(state) {
        if (!this._callLifeCircle('shouldComponentUpdate', this.state, state)) {
            return;
        }
        this._callLifeCircle('componentWillReceiveProps', this.state, state)

        if (!this.state && state) {
            this.state = {};
        }
        merge(this.state, state);

        this.update();
    }

    update() {
        this.isMounted && this._callLifeCircle('componentWillUpdate');
        
        const range = document.createRange();
        range.setStart(this.range.endContainer, this.range.endOffset);
        range.setEnd(this.range.endContainer, this.range.endOffset);
        range.insertNode(document.createComment("placeholder"));

        this.range.deleteContents();
        const vdom = this.render();
        vdom.mountTo(this.range);

        this.isMounted && this._callLifeCircle('componentDidUpdate');
    }
}

class HTMLNode {
    constructor(type) {
        this.root = document.createElement(type);
    }

    appendChild(vchild) {
        const range = document.createRange();

        if (this.root.children.length) {
        // 如果有子元素，则添加在最后
        range.setStartAfter(this.root.lastChild);
        range.setEndAfter(this.root.lastChild);
        } else {
        range.setStart(this.root, 0);
        range.setEnd(this.root, 0);
        }

        vchild.mountTo(range);
    }

    setAttribute(name, value) {
        if (name.match(/^on([\s\S]+)$/)) {
            const evtName = RegExp.$1.toLowerCase();
            this.root.addEventListener(evtName, value);
        } else {
            if (name === 'className') {
                name = 'class';
            }
            this.root.setAttribute(name, value);
        }
    }

    mountTo(range) {
        range.deleteContents();
        range.insertNode(this.root);
    }
}

class TextNode {
    constructor(type) {
        this.root = document.createTextNode(type);
    }

    mountTo(range) {
        range.deleteContents();
        range.insertNode(this.root);
    }
}

function createElement(type, attributes, ...children) {
    let element;
    if (typeof type === 'string') {
        element = new HTMLNode(type);
    } else if (typeof type === 'function') {
        element = new type;
    }

    for (let x in attributes) {
        element.setAttribute(x, attributes[x]);
    }

    const insertChildren = (children) => {
        for (let child of children) {
            if (typeof child === 'object' && child instanceof Array) {
                insertChildren(child);
            } else {
                if (!(child instanceof Component) &&
                    !(child instanceof HTMLNode) &&
                    !(child instanceof TextNode)) {
                    child = String(child);
                }
                if (typeof child === 'string') {
                    child = new TextNode(child);
                }
                element.appendChild(child);
            }
        }
    };
    if (typeof children === 'object' && children instanceof Array) {
        insertChildren(children);
    }

    return element;
}

function render(vdom, rootNode) {
    const range = document.createRange();
    if (rootNode.children.length) {
        range.setStartAfter(rootNode.lastChild);
        range.setEndAfter(rootNode.lastChild);
    } else {
        range.setStart(rootNode, 0);
        range.setEnd(rootNode, 0);
    }
    
    vdom.mountTo(range);
}

module.exports = {
    Component,
    createElement,
    render,
};