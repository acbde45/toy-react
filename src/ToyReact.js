function merge(prevState, state) {
  if (typeof state === "object") {
    for (let prop in state) {
      if (typeof state[prop] === "object" && state[prop] !== null) {
        if (typeof prevState[prop] !== "object") {
          prevState[prop] = state[prop] instanceof Array ? [] : {};
        }
        merge(prevState[prop], state[prop]);
      } else {
        prevState[prop] = state[prop];
      }
    }
  }
}

function isSameNode(node1, node2) {
  if (node1 !== node2) {
    return false;
  }

  if (node1.type !== node2.type) {
    return false;
  }

  if (node1.props.length !== node2.props.length) {
    return false;
  }

  for (let prop in node1.props) {
    if (typeof node1[prop] === 'function' && typeof node2[prop] === 'function' &&
      JSON.stringify(node1[props]) === JSON.stringify(node2[props])) {
        continue;
    }
    if (typeof node1[prop] === 'object' && typeof node2[prop] === 'object' &&
      JSON.stringify(node1[props]) === JSON.stringify(node2[props])) {
        continue;
    }
    if (node1[prop] !== node2[prop]) {
      return false;
    }
  }

  return true;
}

function isSameTree(node1, node2) {
  if (!isSameNode(node1, node2)) return false;

  if (node1.children.length !== node2.children.length) return false;

  for (let i = 0; i < node1.children.length; i++) {
    if (!isSameNode(node1.children[i], node2.children[i])) return false;
  }

  return true;
}

let lastRange = null;
function replaceNode(newNode, oldNode) {
  if (!oldNode && lastRange) {
    lastRange.setStartAfter(lastRange.endContainer.lastChild);
    lastRange.setEndAfter(lastRange.endContainer.lastChild);
    newTree.mountTo(lastRange);
    return;
  }

  if (isSameTree(newNode, oldNode)) return;

  if (!isSameNode(newNode, oldNode)) {
    newNode.mountTo(oldNode.range);
  } else {
    for (let i = 0; i < newNode.children; i++) {
      lastRange = oldNode.children[i] ? oldNode.children[i].range : lastRange;
      replaceNode(newNode.children[i], oldNode.children[i]);
    }
    lastRange = null;
  }
}

class Component {
  constructor() {
    this.isMounted = false;
    this.children = [];
    this.props = Object.create(null);
  }

  get vdom() {
    return this.render().vdom;
  }

  get type() {
    return this.constructor.name;
  }

  componentWillMount() {}
  componentDidMount() {}
  shouldComponentUpdate() { return true; }
  componentWillReceiveProps() {}
  componentWillUpdate() {}
  componentDidUpdate() {}
  componentWillUnMount() {}

  _callLifeCircle(name, ...args) {
    const cb = this[name];
    if (typeof cb === "function") {
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

  mountTo(prange) {
    this._callLifeCircle("componentWillMount");

    this.range = prange;
    this.update();

    this.isMounted = true;

    this._callLifeCircle("componentDidMount");
  }

  setState(state) {
    if (!this._callLifeCircle("shouldComponentUpdate", this.state, state)) {
      return;
    }
    this._callLifeCircle("componentWillReceiveProps", this.state, state);

    if (!this.state && state) {
      this.state = {};
    }
    merge(this.state, state);

    this.update();
  }

  update() {
    this.isMounted && this._callLifeCircle("componentWillUpdate");

    const vdom = this.render();
    if (this.oldVdom) {
      if (isSameTree(vdom, this.oldVdom)) return;
      if (!isSameNode(vdom, this.oldVdom)) {
        this._callLifeCircle("componentWillUpdate")
        this.range.deleteContents();
        vdom.mountTo(this.range);
      } else {
        replaceNode(vdom, this.oldVdom);
      }
    } else {
      this.range.deleteContents();
      vdom.mountTo(this.range);
    }

    this.isMounted && this._callLifeCircle("componentDidUpdate");
  }
}

class HTMLNode {
  constructor(type) {
    this.type = type;
    this.props = Object.create(null);
    this.children = [];
  }

  get vdom() {
    return this;
  }

  setAttribute(name, value) {
    this.props[name] = value;
  }

  appendChild(vchild) {
    this.children.push(vchild);
  }

  setAttribute(name, value) {
    this.props[name] = value;
  }

  mountTo(prange) {
    prange.deleteContents();
    this.range = prange;

    const element = document.createElement(this.type);

    for (let name in this.props) {
      const value = this.props[name];

      if (name.match(/^on([\s\S]+)$/)) {
        // 事件监听处理
        const evtName = RegExp.$1.toLowerCase();
        element.addEventListener(evtName, value);
      } else {
        // className 处理
        if (name === "className") name = "class";

        element.setAttribute(name, value);
      }
    }

    for (let vchild of this.children) {
      const crange = document.createRange();
      if (element.children.length) {
        // 如果有子元素，则添加在最后
        crange.setStartAfter(element.lastChild);
        crange.setEndAfter(element.lastChild);
      } else {
        crange.setStart(element, 0);
        crange.setEnd(element, 0);
      }

      vchild.mountTo(crange);
    }
    
    prange.insertNode(element);
  }
}

class TextNode {
  constructor(type) {
    this.type = type;
    this.props = Object.create(null);
    this.children = [];
  }

  get vdom() {
    return this;
  }

  mountTo(prange) {
    prange.deleteContents();
    const element = document.createTextNode(this.type);
    prange.insertNode(element);
  }
}

function createElement(type, attributes, ...children) {
  let element;
  if (typeof type === "string") {
    element = new HTMLNode(type);
  } else if (typeof type === "function") {
    element = new type();
  }

  for (let x in attributes) {
    element.setAttribute(x, attributes[x]);
  }

  const insertChildren = (children) => {
    for (let child of children) {
      if (typeof child === "object" && child instanceof Array) {
        insertChildren(child);
      } else {
        if (child === null || child === void 0) {
          child = '';
        }
        if (
          !(child instanceof Component) &&
          !(child instanceof HTMLNode) &&
          !(child instanceof TextNode)
        ) {
          child = String(child);
        }
        if (typeof child === "string") {
          child = new TextNode(child);
        }
        element.appendChild(child);
      }
    }
  };
  if (typeof children === "object" && children instanceof Array) {
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
