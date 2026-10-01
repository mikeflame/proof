#!/usr/bin/env node
import { createRequire as __proofRequire } from 'node:module'; const require = __proofRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a2, b) => (typeof require !== "undefined" ? require : a2)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all2) => {
  for (var name in all2)
    __defProp(target, name, { get: all2[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/yaml/dist/nodes/identity.js
var require_identity = __commonJS({
  "node_modules/yaml/dist/nodes/identity.js"(exports) {
    "use strict";
    var ALIAS = /* @__PURE__ */ Symbol.for("yaml.alias");
    var DOC = /* @__PURE__ */ Symbol.for("yaml.document");
    var MAP = /* @__PURE__ */ Symbol.for("yaml.map");
    var PAIR = /* @__PURE__ */ Symbol.for("yaml.pair");
    var SCALAR = /* @__PURE__ */ Symbol.for("yaml.scalar");
    var SEQ = /* @__PURE__ */ Symbol.for("yaml.seq");
    var NODE_TYPE = /* @__PURE__ */ Symbol.for("yaml.node.type");
    var isAlias = (node2) => !!node2 && typeof node2 === "object" && node2[NODE_TYPE] === ALIAS;
    var isDocument = (node2) => !!node2 && typeof node2 === "object" && node2[NODE_TYPE] === DOC;
    var isMap = (node2) => !!node2 && typeof node2 === "object" && node2[NODE_TYPE] === MAP;
    var isPair = (node2) => !!node2 && typeof node2 === "object" && node2[NODE_TYPE] === PAIR;
    var isScalar = (node2) => !!node2 && typeof node2 === "object" && node2[NODE_TYPE] === SCALAR;
    var isSeq = (node2) => !!node2 && typeof node2 === "object" && node2[NODE_TYPE] === SEQ;
    function isCollection(node2) {
      if (node2 && typeof node2 === "object")
        switch (node2[NODE_TYPE]) {
          case MAP:
          case SEQ:
            return true;
        }
      return false;
    }
    function isNode(node2) {
      if (node2 && typeof node2 === "object")
        switch (node2[NODE_TYPE]) {
          case ALIAS:
          case MAP:
          case SCALAR:
          case SEQ:
            return true;
        }
      return false;
    }
    var hasAnchor = (node2) => (isScalar(node2) || isCollection(node2)) && !!node2.anchor;
    exports.ALIAS = ALIAS;
    exports.DOC = DOC;
    exports.MAP = MAP;
    exports.NODE_TYPE = NODE_TYPE;
    exports.PAIR = PAIR;
    exports.SCALAR = SCALAR;
    exports.SEQ = SEQ;
    exports.hasAnchor = hasAnchor;
    exports.isAlias = isAlias;
    exports.isCollection = isCollection;
    exports.isDocument = isDocument;
    exports.isMap = isMap;
    exports.isNode = isNode;
    exports.isPair = isPair;
    exports.isScalar = isScalar;
    exports.isSeq = isSeq;
  }
});

// node_modules/yaml/dist/visit.js
var require_visit = __commonJS({
  "node_modules/yaml/dist/visit.js"(exports) {
    "use strict";
    var identity = require_identity();
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP2 = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove node");
    function visit(node2, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node2)) {
        const cd = visit_(null, node2.contents, visitor_, Object.freeze([node2]));
        if (cd === REMOVE)
          node2.contents = null;
      } else
        visit_(null, node2, visitor_, Object.freeze([]));
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP2;
    visit.REMOVE = REMOVE;
    function visit_(key, node2, visitor, path2) {
      const ctrl = callVisitor(key, node2, visitor, path2);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path2, ctrl);
        return visit_(key, ctrl, visitor, path2);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node2)) {
          path2 = Object.freeze(path2.concat(node2));
          for (let i = 0; i < node2.items.length; ++i) {
            const ci = visit_(i, node2.items[i], visitor, path2);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node2.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node2)) {
          path2 = Object.freeze(path2.concat(node2));
          const ck = visit_("key", node2.key, visitor, path2);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node2.key = null;
          const cv = visit_("value", node2.value, visitor, path2);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node2.value = null;
        }
      }
      return ctrl;
    }
    async function visitAsync(node2, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node2)) {
        const cd = await visitAsync_(null, node2.contents, visitor_, Object.freeze([node2]));
        if (cd === REMOVE)
          node2.contents = null;
      } else
        await visitAsync_(null, node2, visitor_, Object.freeze([]));
    }
    visitAsync.BREAK = BREAK;
    visitAsync.SKIP = SKIP2;
    visitAsync.REMOVE = REMOVE;
    async function visitAsync_(key, node2, visitor, path2) {
      const ctrl = await callVisitor(key, node2, visitor, path2);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path2, ctrl);
        return visitAsync_(key, ctrl, visitor, path2);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node2)) {
          path2 = Object.freeze(path2.concat(node2));
          for (let i = 0; i < node2.items.length; ++i) {
            const ci = await visitAsync_(i, node2.items[i], visitor, path2);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node2.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node2)) {
          path2 = Object.freeze(path2.concat(node2));
          const ck = await visitAsync_("key", node2.key, visitor, path2);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node2.key = null;
          const cv = await visitAsync_("value", node2.value, visitor, path2);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node2.value = null;
        }
      }
      return ctrl;
    }
    function initVisitor(visitor) {
      if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
        return Object.assign({
          Alias: visitor.Node,
          Map: visitor.Node,
          Scalar: visitor.Node,
          Seq: visitor.Node
        }, visitor.Value && {
          Map: visitor.Value,
          Scalar: visitor.Value,
          Seq: visitor.Value
        }, visitor.Collection && {
          Map: visitor.Collection,
          Seq: visitor.Collection
        }, visitor);
      }
      return visitor;
    }
    function callVisitor(key, node2, visitor, path2) {
      if (typeof visitor === "function")
        return visitor(key, node2, path2);
      if (identity.isMap(node2))
        return visitor.Map?.(key, node2, path2);
      if (identity.isSeq(node2))
        return visitor.Seq?.(key, node2, path2);
      if (identity.isPair(node2))
        return visitor.Pair?.(key, node2, path2);
      if (identity.isScalar(node2))
        return visitor.Scalar?.(key, node2, path2);
      if (identity.isAlias(node2))
        return visitor.Alias?.(key, node2, path2);
      return void 0;
    }
    function replaceNode(key, path2, node2) {
      const parent = path2[path2.length - 1];
      if (identity.isCollection(parent)) {
        parent.items[key] = node2;
      } else if (identity.isPair(parent)) {
        if (key === "key")
          parent.key = node2;
        else
          parent.value = node2;
      } else if (identity.isDocument(parent)) {
        parent.contents = node2;
      } else {
        const pt = identity.isAlias(parent) ? "alias" : "scalar";
        throw new Error(`Cannot replace node with ${pt} parent`);
      }
    }
    exports.visit = visit;
    exports.visitAsync = visitAsync;
  }
});

// node_modules/yaml/dist/doc/directives.js
var require_directives = __commonJS({
  "node_modules/yaml/dist/doc/directives.js"(exports) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    var escapeChars = {
      "!": "%21",
      ",": "%2C",
      "[": "%5B",
      "]": "%5D",
      "{": "%7B",
      "}": "%7D"
    };
    var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);
    var Directives = class _Directives {
      constructor(yaml, tags) {
        this.docStart = null;
        this.docEnd = false;
        this.yaml = Object.assign({}, _Directives.defaultYaml, yaml);
        this.tags = Object.assign({}, _Directives.defaultTags, tags);
      }
      clone() {
        const copy = new _Directives(this.yaml, this.tags);
        copy.docStart = this.docStart;
        return copy;
      }
      /**
       * During parsing, get a Directives instance for the current document and
       * update the stream state according to the current version's spec.
       */
      atDocument() {
        const res = new _Directives(this.yaml, this.tags);
        switch (this.yaml.version) {
          case "1.1":
            this.atNextDocument = true;
            break;
          case "1.2":
            this.atNextDocument = false;
            this.yaml = {
              explicit: _Directives.defaultYaml.explicit,
              version: "1.2"
            };
            this.tags = Object.assign({}, _Directives.defaultTags);
            break;
        }
        return res;
      }
      /**
       * @param onError - May be called even if the action was successful
       * @returns `true` on success
       */
      add(line, onError) {
        if (this.atNextDocument) {
          this.yaml = { explicit: _Directives.defaultYaml.explicit, version: "1.1" };
          this.tags = Object.assign({}, _Directives.defaultTags);
          this.atNextDocument = false;
        }
        const parts = line.trim().split(/[ \t]+/);
        const name = parts.shift();
        switch (name) {
          case "%TAG": {
            if (parts.length !== 2) {
              onError(0, "%TAG directive should contain exactly two parts");
              if (parts.length < 2)
                return false;
            }
            const [handle, prefix] = parts;
            this.tags[handle] = prefix;
            return true;
          }
          case "%YAML": {
            this.yaml.explicit = true;
            if (parts.length !== 1) {
              onError(0, "%YAML directive should contain exactly one part");
              return false;
            }
            const [version] = parts;
            if (version === "1.1" || version === "1.2") {
              this.yaml.version = version;
              return true;
            } else {
              const isValid = /^\d+\.\d+$/.test(version);
              onError(6, `Unsupported YAML version ${version}`, isValid);
              return false;
            }
          }
          default:
            onError(0, `Unknown directive ${name}`, true);
            return false;
        }
      }
      /**
       * Resolves a tag, matching handles to those defined in %TAG directives.
       *
       * @returns Resolved tag, which may also be the non-specific tag `'!'` or a
       *   `'!local'` tag, or `null` if unresolvable.
       */
      tagName(source, onError) {
        if (source === "!")
          return "!";
        if (source[0] !== "!") {
          onError(`Not a valid tag: ${source}`);
          return null;
        }
        if (source[1] === "<") {
          const verbatim = source.slice(2, -1);
          if (verbatim === "!" || verbatim === "!!") {
            onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
            return null;
          }
          if (source[source.length - 1] !== ">")
            onError("Verbatim tags must end with a >");
          return verbatim;
        }
        const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
        if (!suffix)
          onError(`The ${source} tag has no suffix`);
        const prefix = this.tags[handle];
        if (prefix) {
          try {
            return prefix + decodeURIComponent(suffix);
          } catch (error) {
            onError(String(error));
            return null;
          }
        }
        if (handle === "!")
          return source;
        onError(`Could not resolve tag: ${source}`);
        return null;
      }
      /**
       * Given a fully resolved tag, returns its printable string form,
       * taking into account current tag prefixes and defaults.
       */
      tagString(tag) {
        for (const [handle, prefix] of Object.entries(this.tags)) {
          if (tag.startsWith(prefix))
            return handle + escapeTagName(tag.substring(prefix.length));
        }
        return tag[0] === "!" ? tag : `!<${tag}>`;
      }
      toString(doc) {
        const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
        const tagEntries = Object.entries(this.tags);
        let tagNames;
        if (doc && tagEntries.length > 0 && identity.isNode(doc.contents)) {
          const tags = {};
          visit.visit(doc.contents, (_key, node2) => {
            if (identity.isNode(node2) && node2.tag)
              tags[node2.tag] = true;
          });
          tagNames = Object.keys(tags);
        } else
          tagNames = [];
        for (const [handle, prefix] of tagEntries) {
          if (handle === "!!" && prefix === "tag:yaml.org,2002:")
            continue;
          if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
            lines.push(`%TAG ${handle} ${prefix}`);
        }
        return lines.join("\n");
      }
    };
    Directives.defaultYaml = { explicit: false, version: "1.2" };
    Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
    exports.Directives = Directives;
  }
});

// node_modules/yaml/dist/doc/anchors.js
var require_anchors = __commonJS({
  "node_modules/yaml/dist/doc/anchors.js"(exports) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    function anchorIsValid(anchor) {
      if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
        const sa = JSON.stringify(anchor);
        const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
        throw new Error(msg);
      }
      return true;
    }
    function anchorNames(root) {
      const anchors = /* @__PURE__ */ new Set();
      visit.visit(root, {
        Value(_key, node2) {
          if (node2.anchor)
            anchors.add(node2.anchor);
        }
      });
      return anchors;
    }
    function findNewAnchor(prefix, exclude) {
      for (let i = 1; true; ++i) {
        const name = `${prefix}${i}`;
        if (!exclude.has(name))
          return name;
      }
    }
    function createNodeAnchors(doc, prefix) {
      const aliasObjects = [];
      const sourceObjects = /* @__PURE__ */ new Map();
      let prevAnchors = null;
      return {
        onAnchor: (source) => {
          aliasObjects.push(source);
          prevAnchors ?? (prevAnchors = anchorNames(doc));
          const anchor = findNewAnchor(prefix, prevAnchors);
          prevAnchors.add(anchor);
          return anchor;
        },
        /**
         * With circular references, the source node is only resolved after all
         * of its child nodes are. This is why anchors are set only after all of
         * the nodes have been created.
         */
        setAnchors: () => {
          for (const source of aliasObjects) {
            const ref = sourceObjects.get(source);
            if (typeof ref === "object" && ref.anchor && (identity.isScalar(ref.node) || identity.isCollection(ref.node))) {
              ref.node.anchor = ref.anchor;
            } else {
              const error = new Error("Failed to resolve repeated object (this should not happen)");
              error.source = source;
              throw error;
            }
          }
        },
        sourceObjects
      };
    }
    exports.anchorIsValid = anchorIsValid;
    exports.anchorNames = anchorNames;
    exports.createNodeAnchors = createNodeAnchors;
    exports.findNewAnchor = findNewAnchor;
  }
});

// node_modules/yaml/dist/doc/applyReviver.js
var require_applyReviver = __commonJS({
  "node_modules/yaml/dist/doc/applyReviver.js"(exports) {
    "use strict";
    function applyReviver(reviver, obj, key, val) {
      if (val && typeof val === "object") {
        if (Array.isArray(val)) {
          for (let i = 0, len = val.length; i < len; ++i) {
            const v0 = val[i];
            const v1 = applyReviver(reviver, val, String(i), v0);
            if (v1 === void 0)
              delete val[i];
            else if (v1 !== v0)
              val[i] = v1;
          }
        } else if (val instanceof Map) {
          for (const k of Array.from(val.keys())) {
            const v0 = val.get(k);
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              val.delete(k);
            else if (v1 !== v0)
              val.set(k, v1);
          }
        } else if (val instanceof Set) {
          for (const v0 of Array.from(val)) {
            const v1 = applyReviver(reviver, val, v0, v0);
            if (v1 === void 0)
              val.delete(v0);
            else if (v1 !== v0) {
              val.delete(v0);
              val.add(v1);
            }
          }
        } else {
          for (const [k, v0] of Object.entries(val)) {
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              delete val[k];
            else if (v1 !== v0)
              val[k] = v1;
          }
        }
      }
      return reviver.call(obj, key, val);
    }
    exports.applyReviver = applyReviver;
  }
});

// node_modules/yaml/dist/nodes/toJS.js
var require_toJS = __commonJS({
  "node_modules/yaml/dist/nodes/toJS.js"(exports) {
    "use strict";
    var identity = require_identity();
    function toJS(value2, arg, ctx) {
      if (Array.isArray(value2))
        return value2.map((v, i) => toJS(v, String(i), ctx));
      if (value2 && typeof value2.toJSON === "function") {
        if (!ctx || !identity.hasAnchor(value2))
          return value2.toJSON(arg, ctx);
        const data = { aliasCount: 0, count: 1, res: void 0 };
        ctx.anchors.set(value2, data);
        ctx.onCreate = (res2) => {
          data.res = res2;
          delete ctx.onCreate;
        };
        const res = value2.toJSON(arg, ctx);
        if (ctx.onCreate)
          ctx.onCreate(res);
        return res;
      }
      if (typeof value2 === "bigint" && !ctx?.keep)
        return Number(value2);
      return value2;
    }
    exports.toJS = toJS;
  }
});

// node_modules/yaml/dist/nodes/Node.js
var require_Node = __commonJS({
  "node_modules/yaml/dist/nodes/Node.js"(exports) {
    "use strict";
    var applyReviver = require_applyReviver();
    var identity = require_identity();
    var toJS = require_toJS();
    var NodeBase = class {
      constructor(type) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: type });
      }
      /** Create a copy of this node.  */
      clone() {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** A plain JavaScript representation of this node. */
      toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        if (!identity.isDocument(doc))
          throw new TypeError("A document argument is required");
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc,
          keep: true,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this, "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
    };
    exports.NodeBase = NodeBase;
  }
});

// node_modules/yaml/dist/nodes/Alias.js
var require_Alias = __commonJS({
  "node_modules/yaml/dist/nodes/Alias.js"(exports) {
    "use strict";
    var anchors = require_anchors();
    var visit = require_visit();
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var Alias = class extends Node.NodeBase {
      constructor(source) {
        super(identity.ALIAS);
        this.source = source;
        Object.defineProperty(this, "tag", {
          set() {
            throw new Error("Alias nodes cannot have tags");
          }
        });
      }
      /**
       * Resolve the value of this alias within `doc`, finding the last
       * instance of the `source` anchor before this node.
       */
      resolve(doc, ctx) {
        if (ctx?.maxAliasCount === 0)
          throw new ReferenceError("Alias resolution is disabled");
        let nodes;
        if (ctx?.aliasResolveCache) {
          nodes = ctx.aliasResolveCache;
        } else {
          nodes = [];
          visit.visit(doc, {
            Node: (_key, node2) => {
              if (identity.isAlias(node2) || identity.hasAnchor(node2))
                nodes.push(node2);
            }
          });
          if (ctx)
            ctx.aliasResolveCache = nodes;
        }
        let found = void 0;
        for (const node2 of nodes) {
          if (node2 === this)
            break;
          if (node2.anchor === this.source)
            found = node2;
        }
        if (found && ctx) {
          const { anchors: anchors2, doc: doc2, maxAliasCount } = ctx;
          let data = anchors2.get(found);
          if (!data) {
            toJS.toJS(found, null, ctx);
            data = anchors2.get(found);
          }
          if (data?.res === void 0) {
            const msg = "This should not happen: Alias anchor was not resolved?";
            throw new ReferenceError(msg);
          }
          if (maxAliasCount >= 0) {
            data.count += 1;
            if (data.aliasCount === 0)
              data.aliasCount = getAliasCount(doc2, found, anchors2);
            if (data.count * data.aliasCount > maxAliasCount) {
              const msg = "Excessive alias count indicates a resource exhaustion attack";
              throw new ReferenceError(msg);
            }
          }
        }
        return found;
      }
      toJSON(_arg, ctx) {
        if (!ctx)
          return { source: this.source };
        const source = this.resolve(ctx.doc, ctx);
        if (!source) {
          const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
          throw new ReferenceError(msg);
        }
        return ctx.anchors.get(source).res;
      }
      toString(ctx, _onComment, _onChompKeep) {
        const src = `*${this.source}`;
        if (ctx) {
          anchors.anchorIsValid(this.source);
          if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
            const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
            throw new Error(msg);
          }
          if (ctx.implicitKey)
            return `${src} `;
        }
        return src;
      }
    };
    function getAliasCount(doc, node2, anchors2) {
      if (identity.isAlias(node2)) {
        const source = node2.resolve(doc);
        const anchor = anchors2 && source && anchors2.get(source);
        return anchor ? anchor.count * anchor.aliasCount : 0;
      } else if (identity.isCollection(node2)) {
        let count = 0;
        for (const item2 of node2.items) {
          const c = getAliasCount(doc, item2, anchors2);
          if (c > count)
            count = c;
        }
        return count;
      } else if (identity.isPair(node2)) {
        const kc = getAliasCount(doc, node2.key, anchors2);
        const vc = getAliasCount(doc, node2.value, anchors2);
        return Math.max(kc, vc);
      }
      return 1;
    }
    exports.Alias = Alias;
  }
});

// node_modules/yaml/dist/nodes/Scalar.js
var require_Scalar = __commonJS({
  "node_modules/yaml/dist/nodes/Scalar.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var isScalarValue = (value2) => !value2 || typeof value2 !== "function" && typeof value2 !== "object";
    var Scalar = class extends Node.NodeBase {
      constructor(value2) {
        super(identity.SCALAR);
        this.value = value2;
      }
      toJSON(arg, ctx) {
        return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
      }
      toString() {
        return String(this.value);
      }
    };
    Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
    Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
    Scalar.PLAIN = "PLAIN";
    Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
    Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
    exports.Scalar = Scalar;
    exports.isScalarValue = isScalarValue;
  }
});

// node_modules/yaml/dist/doc/createNode.js
var require_createNode = __commonJS({
  "node_modules/yaml/dist/doc/createNode.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var defaultTagPrefix = "tag:yaml.org,2002:";
    function findTagObject(value2, tagName, tags) {
      if (tagName) {
        const match = tags.filter((t) => t.tag === tagName);
        const tagObj = match.find((t) => !t.format) ?? match[0];
        if (!tagObj)
          throw new Error(`Tag ${tagName} not found`);
        return tagObj;
      }
      return tags.find((t) => t.identify?.(value2) && !t.format);
    }
    function createNode(value2, tagName, ctx) {
      if (identity.isDocument(value2))
        value2 = value2.contents;
      if (identity.isNode(value2))
        return value2;
      if (identity.isPair(value2)) {
        const map = ctx.schema[identity.MAP].createNode?.(ctx.schema, null, ctx);
        map.items.push(value2);
        return map;
      }
      if (value2 instanceof String || value2 instanceof Number || value2 instanceof Boolean || typeof BigInt !== "undefined" && value2 instanceof BigInt) {
        value2 = value2.valueOf();
      }
      const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
      let ref = void 0;
      if (aliasDuplicateObjects && value2 && typeof value2 === "object") {
        ref = sourceObjects.get(value2);
        if (ref) {
          ref.anchor ?? (ref.anchor = onAnchor(value2));
          return new Alias.Alias(ref.anchor);
        } else {
          ref = { anchor: null, node: null };
          sourceObjects.set(value2, ref);
        }
      }
      if (tagName?.startsWith("!!"))
        tagName = defaultTagPrefix + tagName.slice(2);
      let tagObj = findTagObject(value2, tagName, schema.tags);
      if (!tagObj) {
        if (value2 && typeof value2.toJSON === "function") {
          value2 = value2.toJSON();
        }
        if (!value2 || typeof value2 !== "object") {
          const node3 = new Scalar.Scalar(value2);
          if (ref)
            ref.node = node3;
          return node3;
        }
        tagObj = value2 instanceof Map ? schema[identity.MAP] : Symbol.iterator in Object(value2) ? schema[identity.SEQ] : schema[identity.MAP];
      }
      if (onTagObj) {
        onTagObj(tagObj);
        delete ctx.onTagObj;
      }
      const node2 = tagObj?.createNode ? tagObj.createNode(ctx.schema, value2, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value2, ctx) : new Scalar.Scalar(value2);
      if (tagName)
        node2.tag = tagName;
      else if (!tagObj.default)
        node2.tag = tagObj.tag;
      if (ref)
        ref.node = node2;
      return node2;
    }
    exports.createNode = createNode;
  }
});

// node_modules/yaml/dist/nodes/Collection.js
var require_Collection = __commonJS({
  "node_modules/yaml/dist/nodes/Collection.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var identity = require_identity();
    var Node = require_Node();
    function collectionFromPath(schema, path2, value2) {
      let v = value2;
      for (let i = path2.length - 1; i >= 0; --i) {
        const k = path2[i];
        if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
          const a2 = [];
          a2[k] = v;
          v = a2;
        } else {
          v = /* @__PURE__ */ new Map([[k, v]]);
        }
      }
      return createNode.createNode(v, void 0, {
        aliasDuplicateObjects: false,
        keepUndefined: false,
        onAnchor: () => {
          throw new Error("This should not happen, please report a bug.");
        },
        schema,
        sourceObjects: /* @__PURE__ */ new Map()
      });
    }
    var isEmptyPath = (path2) => path2 == null || typeof path2 === "object" && !!path2[Symbol.iterator]().next().done;
    var Collection = class extends Node.NodeBase {
      constructor(type, schema) {
        super(type);
        Object.defineProperty(this, "schema", {
          value: schema,
          configurable: true,
          enumerable: false,
          writable: true
        });
      }
      /**
       * Create a copy of this collection.
       *
       * @param schema - If defined, overwrites the original's schema
       */
      clone(schema) {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (schema)
          copy.schema = schema;
        copy.items = copy.items.map((it) => identity.isNode(it) || identity.isPair(it) ? it.clone(schema) : it);
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /**
       * Adds a value to the collection. For `!!map` and `!!omap` the value must
       * be a Pair instance or a `{ key, value }` object, which may not have a key
       * that already exists in the map.
       */
      addIn(path2, value2) {
        if (isEmptyPath(path2))
          this.add(value2);
        else {
          const [key, ...rest] = path2;
          const node2 = this.get(key, true);
          if (identity.isCollection(node2))
            node2.addIn(rest, value2);
          else if (node2 === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value2));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
      /**
       * Removes a value from the collection.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path2) {
        const [key, ...rest] = path2;
        if (rest.length === 0)
          return this.delete(key);
        const node2 = this.get(key, true);
        if (identity.isCollection(node2))
          return node2.deleteIn(rest);
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path2, keepScalar) {
        const [key, ...rest] = path2;
        const node2 = this.get(key, true);
        if (rest.length === 0)
          return !keepScalar && identity.isScalar(node2) ? node2.value : node2;
        else
          return identity.isCollection(node2) ? node2.getIn(rest, keepScalar) : void 0;
      }
      hasAllNullValues(allowScalar) {
        return this.items.every((node2) => {
          if (!identity.isPair(node2))
            return false;
          const n = node2.value;
          return n == null || allowScalar && identity.isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
        });
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       */
      hasIn(path2) {
        const [key, ...rest] = path2;
        if (rest.length === 0)
          return this.has(key);
        const node2 = this.get(key, true);
        return identity.isCollection(node2) ? node2.hasIn(rest) : false;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path2, value2) {
        const [key, ...rest] = path2;
        if (rest.length === 0) {
          this.set(key, value2);
        } else {
          const node2 = this.get(key, true);
          if (identity.isCollection(node2))
            node2.setIn(rest, value2);
          else if (node2 === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value2));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
    };
    exports.Collection = Collection;
    exports.collectionFromPath = collectionFromPath;
    exports.isEmptyPath = isEmptyPath;
  }
});

// node_modules/yaml/dist/stringify/stringifyComment.js
var require_stringifyComment = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyComment.js"(exports) {
    "use strict";
    var stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
    function indentComment(comment, indent2) {
      if (/^\n+$/.test(comment))
        return comment.substring(1);
      return indent2 ? comment.replace(/^(?! *$)/gm, indent2) : comment;
    }
    var lineComment = (str, indent2, comment) => str.endsWith("\n") ? indentComment(comment, indent2) : comment.includes("\n") ? "\n" + indentComment(comment, indent2) : (str.endsWith(" ") ? "" : " ") + comment;
    exports.indentComment = indentComment;
    exports.lineComment = lineComment;
    exports.stringifyComment = stringifyComment;
  }
});

// node_modules/yaml/dist/stringify/foldFlowLines.js
var require_foldFlowLines = __commonJS({
  "node_modules/yaml/dist/stringify/foldFlowLines.js"(exports) {
    "use strict";
    var FOLD_FLOW = "flow";
    var FOLD_BLOCK = "block";
    var FOLD_QUOTED = "quoted";
    function foldFlowLines(text4, indent2, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
      if (!lineWidth || lineWidth < 0)
        return text4;
      if (lineWidth < minContentWidth)
        minContentWidth = 0;
      const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent2.length);
      if (text4.length <= endStep)
        return text4;
      const folds = [];
      const escapedFolds = {};
      let end = lineWidth - indent2.length;
      if (typeof indentAtStart === "number") {
        if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
          folds.push(0);
        else
          end = lineWidth - indentAtStart;
      }
      let split = void 0;
      let prev = void 0;
      let overflow = false;
      let i = -1;
      let escStart = -1;
      let escEnd = -1;
      if (mode === FOLD_BLOCK) {
        i = consumeMoreIndentedLines(text4, i, indent2.length);
        if (i !== -1)
          end = i + endStep;
      }
      for (let ch; ch = text4[i += 1]; ) {
        if (mode === FOLD_QUOTED && ch === "\\") {
          escStart = i;
          switch (text4[i + 1]) {
            case "x":
              i += 3;
              break;
            case "u":
              i += 5;
              break;
            case "U":
              i += 9;
              break;
            default:
              i += 1;
          }
          escEnd = i;
        }
        if (ch === "\n") {
          if (mode === FOLD_BLOCK)
            i = consumeMoreIndentedLines(text4, i, indent2.length);
          end = i + indent2.length + endStep;
          split = void 0;
        } else {
          if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
            const next = text4[i + 1];
            if (next && next !== " " && next !== "\n" && next !== "	")
              split = i;
          }
          if (i >= end) {
            if (split) {
              folds.push(split);
              end = split + endStep;
              split = void 0;
            } else if (mode === FOLD_QUOTED) {
              while (prev === " " || prev === "	") {
                prev = ch;
                ch = text4[i += 1];
                overflow = true;
              }
              const j = i > escEnd + 1 ? i - 2 : escStart - 1;
              if (escapedFolds[j])
                return text4;
              folds.push(j);
              escapedFolds[j] = true;
              end = j + endStep;
              split = void 0;
            } else {
              overflow = true;
            }
          }
        }
        prev = ch;
      }
      if (overflow && onOverflow)
        onOverflow();
      if (folds.length === 0)
        return text4;
      if (onFold)
        onFold();
      let res = text4.slice(0, folds[0]);
      for (let i2 = 0; i2 < folds.length; ++i2) {
        const fold = folds[i2];
        const end2 = folds[i2 + 1] || text4.length;
        if (fold === 0)
          res = `
${indent2}${text4.slice(0, end2)}`;
        else {
          if (mode === FOLD_QUOTED && escapedFolds[fold])
            res += `${text4[fold]}\\`;
          res += `
${indent2}${text4.slice(fold + 1, end2)}`;
        }
      }
      return res;
    }
    function consumeMoreIndentedLines(text4, i, indent2) {
      let end = i;
      let start = i + 1;
      let ch = text4[start];
      while (ch === " " || ch === "	") {
        if (i < start + indent2) {
          ch = text4[++i];
        } else {
          do {
            ch = text4[++i];
          } while (ch && ch !== "\n");
          end = i;
          start = i + 1;
          ch = text4[start];
        }
      }
      return end;
    }
    exports.FOLD_BLOCK = FOLD_BLOCK;
    exports.FOLD_FLOW = FOLD_FLOW;
    exports.FOLD_QUOTED = FOLD_QUOTED;
    exports.foldFlowLines = foldFlowLines;
  }
});

// node_modules/yaml/dist/stringify/stringifyString.js
var require_stringifyString = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyString.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var foldFlowLines = require_foldFlowLines();
    var getFoldOptions = (ctx, isBlock) => ({
      indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
      lineWidth: ctx.options.lineWidth,
      minContentWidth: ctx.options.minContentWidth
    });
    var containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
    function lineLengthOverLimit(str, lineWidth, indentLength) {
      if (!lineWidth || lineWidth < 0)
        return false;
      const limit = lineWidth - indentLength;
      const strLen = str.length;
      if (strLen <= limit)
        return false;
      for (let i = 0, start = 0; i < strLen; ++i) {
        if (str[i] === "\n") {
          if (i - start > limit)
            return true;
          start = i + 1;
          if (strLen - start <= limit)
            return false;
        }
      }
      return true;
    }
    function doubleQuotedString(value2, ctx) {
      const json = JSON.stringify(value2);
      if (ctx.options.doubleQuotedAsJSON)
        return json;
      const { implicitKey } = ctx;
      const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
      const indent2 = ctx.indent || (containsDocumentMarker(value2) ? "  " : "");
      let str = "";
      let start = 0;
      for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
        if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
          str += json.slice(start, i) + "\\ ";
          i += 1;
          start = i;
          ch = "\\";
        }
        if (ch === "\\")
          switch (json[i + 1]) {
            case "u":
              {
                str += json.slice(start, i);
                const code2 = json.substr(i + 2, 4);
                switch (code2) {
                  case "0000":
                    str += "\\0";
                    break;
                  case "0007":
                    str += "\\a";
                    break;
                  case "000b":
                    str += "\\v";
                    break;
                  case "001b":
                    str += "\\e";
                    break;
                  case "0085":
                    str += "\\N";
                    break;
                  case "00a0":
                    str += "\\_";
                    break;
                  case "2028":
                    str += "\\L";
                    break;
                  case "2029":
                    str += "\\P";
                    break;
                  default:
                    if (code2.substr(0, 2) === "00")
                      str += "\\x" + code2.substr(2);
                    else
                      str += json.substr(i, 6);
                }
                i += 5;
                start = i + 1;
              }
              break;
            case "n":
              if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
                i += 1;
              } else {
                str += json.slice(start, i) + "\n\n";
                while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
                  str += "\n";
                  i += 2;
                }
                str += indent2;
                if (json[i + 2] === " ")
                  str += "\\";
                i += 1;
                start = i + 1;
              }
              break;
            default:
              i += 1;
          }
      }
      str = start ? str + json.slice(start) : json;
      return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent2, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
    }
    function singleQuotedString(value2, ctx) {
      if (ctx.options.singleQuote === false || ctx.implicitKey && value2.includes("\n") || /[ \t]\n|\n[ \t]/.test(value2))
        return doubleQuotedString(value2, ctx);
      const indent2 = ctx.indent || (containsDocumentMarker(value2) ? "  " : "");
      const res = "'" + value2.replace(/'/g, "''").replace(/\n+/g, `$&
${indent2}`) + "'";
      return ctx.implicitKey ? res : foldFlowLines.foldFlowLines(res, indent2, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function quotedString(value2, ctx) {
      const { singleQuote } = ctx.options;
      let qs;
      if (singleQuote === false)
        qs = doubleQuotedString;
      else {
        const hasDouble = value2.includes('"');
        const hasSingle = value2.includes("'");
        if (hasDouble && !hasSingle)
          qs = singleQuotedString;
        else if (hasSingle && !hasDouble)
          qs = doubleQuotedString;
        else
          qs = singleQuote ? singleQuotedString : doubleQuotedString;
      }
      return qs(value2, ctx);
    }
    var blockEndNewlines;
    try {
      blockEndNewlines = new RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
    } catch {
      blockEndNewlines = /\n+(?!\n|$)/g;
    }
    function blockString({ comment, type, value: value2 }, ctx, onComment, onChompKeep) {
      const { blockQuote: blockQuote2, commentString, lineWidth } = ctx.options;
      if (!blockQuote2 || /\n[\t ]+$/.test(value2)) {
        return quotedString(value2, ctx);
      }
      const indent2 = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value2) ? "  " : "");
      const literal = blockQuote2 === "literal" ? true : blockQuote2 === "folded" || type === Scalar.Scalar.BLOCK_FOLDED ? false : type === Scalar.Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value2, lineWidth, indent2.length);
      if (!value2)
        return literal ? "|\n" : ">\n";
      let chomp;
      let endStart;
      for (endStart = value2.length; endStart > 0; --endStart) {
        const ch = value2[endStart - 1];
        if (ch !== "\n" && ch !== "	" && ch !== " ")
          break;
      }
      let end = value2.substring(endStart);
      const endNlPos = end.indexOf("\n");
      if (endNlPos === -1) {
        chomp = "-";
      } else if (value2 === end || endNlPos !== end.length - 1) {
        chomp = "+";
        if (onChompKeep)
          onChompKeep();
      } else {
        chomp = "";
      }
      if (end) {
        value2 = value2.slice(0, -end.length);
        if (end[end.length - 1] === "\n")
          end = end.slice(0, -1);
        end = end.replace(blockEndNewlines, `$&${indent2}`);
      }
      let startWithSpace = false;
      let startEnd;
      let startNlPos = -1;
      for (startEnd = 0; startEnd < value2.length; ++startEnd) {
        const ch = value2[startEnd];
        if (ch === " ")
          startWithSpace = true;
        else if (ch === "\n")
          startNlPos = startEnd;
        else
          break;
      }
      let start = value2.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
      if (start) {
        value2 = value2.substring(start.length);
        start = start.replace(/\n+/g, `$&${indent2}`);
      }
      const indentSize = indent2 ? "2" : "1";
      let header = (startWithSpace ? indentSize : "") + chomp;
      if (comment) {
        header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
        if (onComment)
          onComment();
      }
      if (!literal) {
        const foldedValue = value2.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent2}`);
        let literalFallback = false;
        const foldOptions = getFoldOptions(ctx, true);
        if (blockQuote2 !== "folded" && type !== Scalar.Scalar.BLOCK_FOLDED) {
          foldOptions.onOverflow = () => {
            literalFallback = true;
          };
        }
        const body = foldFlowLines.foldFlowLines(`${start}${foldedValue}${end}`, indent2, foldFlowLines.FOLD_BLOCK, foldOptions);
        if (!literalFallback)
          return `>${header}
${indent2}${body}`;
      }
      value2 = value2.replace(/\n+/g, `$&${indent2}`);
      return `|${header}
${indent2}${start}${value2}${end}`;
    }
    function plainString(item2, ctx, onComment, onChompKeep) {
      const { type, value: value2 } = item2;
      const { actualString, implicitKey, indent: indent2, indentStep, inFlow } = ctx;
      if (implicitKey && value2.includes("\n") || inFlow && /[[\]{},]/.test(value2)) {
        return quotedString(value2, ctx);
      }
      if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value2)) {
        return implicitKey || inFlow || !value2.includes("\n") ? quotedString(value2, ctx) : blockString(item2, ctx, onComment, onChompKeep);
      }
      if (!implicitKey && !inFlow && type !== Scalar.Scalar.PLAIN && value2.includes("\n")) {
        return blockString(item2, ctx, onComment, onChompKeep);
      }
      if (containsDocumentMarker(value2)) {
        if (indent2 === "") {
          ctx.forceBlockIndent = true;
          return blockString(item2, ctx, onComment, onChompKeep);
        } else if (implicitKey && indent2 === indentStep) {
          return quotedString(value2, ctx);
        }
      }
      const str = value2.replace(/\n+/g, `$&
${indent2}`);
      if (actualString) {
        const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str);
        const { compat, tags } = ctx.doc.schema;
        if (tags.some(test) || compat?.some(test))
          return quotedString(value2, ctx);
      }
      return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent2, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function stringifyString(item2, ctx, onComment, onChompKeep) {
      const { implicitKey, inFlow } = ctx;
      const ss = typeof item2.value === "string" ? item2 : Object.assign({}, item2, { value: String(item2.value) });
      let { type } = item2;
      if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
        if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
          type = Scalar.Scalar.QUOTE_DOUBLE;
      }
      const _stringify = (_type) => {
        switch (_type) {
          case Scalar.Scalar.BLOCK_FOLDED:
          case Scalar.Scalar.BLOCK_LITERAL:
            return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
          case Scalar.Scalar.QUOTE_DOUBLE:
            return doubleQuotedString(ss.value, ctx);
          case Scalar.Scalar.QUOTE_SINGLE:
            return singleQuotedString(ss.value, ctx);
          case Scalar.Scalar.PLAIN:
            return plainString(ss, ctx, onComment, onChompKeep);
          default:
            return null;
        }
      };
      let res = _stringify(type);
      if (res === null) {
        const { defaultKeyType, defaultStringType } = ctx.options;
        const t = implicitKey && defaultKeyType || defaultStringType;
        res = _stringify(t);
        if (res === null)
          throw new Error(`Unsupported default string type ${t}`);
      }
      return res;
    }
    exports.stringifyString = stringifyString;
  }
});

// node_modules/yaml/dist/stringify/stringify.js
var require_stringify = __commonJS({
  "node_modules/yaml/dist/stringify/stringify.js"(exports) {
    "use strict";
    var anchors = require_anchors();
    var identity = require_identity();
    var stringifyComment = require_stringifyComment();
    var stringifyString = require_stringifyString();
    function createStringifyContext(doc, options) {
      const opt = Object.assign({
        blockQuote: true,
        commentString: stringifyComment.stringifyComment,
        defaultKeyType: null,
        defaultStringType: "PLAIN",
        directives: null,
        doubleQuotedAsJSON: false,
        doubleQuotedMinMultiLineLength: 40,
        falseStr: "false",
        flowCollectionPadding: true,
        indentSeq: true,
        lineWidth: 80,
        minContentWidth: 20,
        nullStr: "null",
        simpleKeys: false,
        singleQuote: null,
        trailingComma: false,
        trueStr: "true",
        verifyAliasOrder: true
      }, doc.schema.toStringOptions, options);
      let inFlow;
      switch (opt.collectionStyle) {
        case "block":
          inFlow = false;
          break;
        case "flow":
          inFlow = true;
          break;
        default:
          inFlow = null;
      }
      return {
        anchors: /* @__PURE__ */ new Set(),
        doc,
        flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
        indent: "",
        indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
        inFlow,
        options: opt
      };
    }
    function getTagObject(tags, item2) {
      if (item2.tag) {
        const match = tags.filter((t) => t.tag === item2.tag);
        if (match.length > 0)
          return match.find((t) => t.format === item2.format) ?? match[0];
      }
      let tagObj = void 0;
      let obj;
      if (identity.isScalar(item2)) {
        obj = item2.value;
        let match = tags.filter((t) => t.identify?.(obj));
        if (match.length > 1) {
          const testMatch = match.filter((t) => t.test);
          if (testMatch.length > 0)
            match = testMatch;
        }
        tagObj = match.find((t) => t.format === item2.format) ?? match.find((t) => !t.format);
      } else {
        obj = item2;
        tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
      }
      if (!tagObj) {
        const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
        throw new Error(`Tag not resolved for ${name} value`);
      }
      return tagObj;
    }
    function stringifyProps(node2, tagObj, { anchors: anchors$1, doc }) {
      if (!doc.directives)
        return "";
      const props = [];
      const anchor = (identity.isScalar(node2) || identity.isCollection(node2)) && node2.anchor;
      if (anchor && anchors.anchorIsValid(anchor)) {
        anchors$1.add(anchor);
        props.push(`&${anchor}`);
      }
      const tag = node2.tag ?? (tagObj.default ? null : tagObj.tag);
      if (tag)
        props.push(doc.directives.tagString(tag));
      return props.join(" ");
    }
    function stringify2(item2, ctx, onComment, onChompKeep) {
      if (identity.isPair(item2))
        return item2.toString(ctx, onComment, onChompKeep);
      if (identity.isAlias(item2)) {
        if (ctx.doc.directives)
          return item2.toString(ctx);
        if (ctx.resolvedAliases?.has(item2)) {
          throw new TypeError(`Cannot stringify circular structure without alias nodes`);
        } else {
          if (ctx.resolvedAliases)
            ctx.resolvedAliases.add(item2);
          else
            ctx.resolvedAliases = /* @__PURE__ */ new Set([item2]);
          item2 = item2.resolve(ctx.doc);
        }
      }
      let tagObj = void 0;
      const node2 = identity.isNode(item2) ? item2 : ctx.doc.createNode(item2, { onTagObj: (o) => tagObj = o });
      tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node2));
      const props = stringifyProps(node2, tagObj, ctx);
      if (props.length > 0)
        ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
      const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node2, ctx, onComment, onChompKeep) : identity.isScalar(node2) ? stringifyString.stringifyString(node2, ctx, onComment, onChompKeep) : node2.toString(ctx, onComment, onChompKeep);
      if (!props)
        return str;
      return identity.isScalar(node2) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}
${ctx.indent}${str}`;
    }
    exports.createStringifyContext = createStringifyContext;
    exports.stringify = stringify2;
  }
});

// node_modules/yaml/dist/stringify/stringifyPair.js
var require_stringifyPair = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyPair.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var stringify2 = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyPair({ key, value: value2 }, ctx, onComment, onChompKeep) {
      const { allNullValues, doc, indent: indent2, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
      let keyComment = identity.isNode(key) && key.comment || null;
      if (simpleKeys) {
        if (keyComment) {
          throw new Error("With simple keys, key nodes cannot have comments");
        }
        if (identity.isCollection(key) || !identity.isNode(key) && typeof key === "object") {
          const msg = "With simple keys, collection cannot be used as a key value";
          throw new Error(msg);
        }
      }
      let explicitKey = !simpleKeys && (!key || keyComment && value2 == null && !ctx.inFlow || identity.isCollection(key) || (identity.isScalar(key) ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL : typeof key === "object"));
      ctx = Object.assign({}, ctx, {
        allNullValues: false,
        implicitKey: !explicitKey && (simpleKeys || !allNullValues),
        indent: indent2 + indentStep
      });
      let keyCommentDone = false;
      let chompKeep = false;
      let str = stringify2.stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
      if (!explicitKey && !ctx.inFlow && str.length > 1024) {
        if (simpleKeys)
          throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
        explicitKey = true;
      }
      if (ctx.inFlow) {
        if (allNullValues || value2 == null) {
          if (keyCommentDone && onComment)
            onComment();
          return str === "" ? "?" : explicitKey ? `? ${str}` : str;
        }
      } else if (allNullValues && !simpleKeys || value2 == null && explicitKey) {
        str = `? ${str}`;
        if (keyComment && !keyCommentDone) {
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        } else if (chompKeep && onChompKeep)
          onChompKeep();
        return str;
      }
      if (keyCommentDone)
        keyComment = null;
      if (explicitKey) {
        if (keyComment)
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        str = `? ${str}
${indent2}:`;
      } else {
        str = `${str}:`;
        if (keyComment)
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
      }
      let vsb, vcb, valueComment;
      if (identity.isNode(value2)) {
        vsb = !!value2.spaceBefore;
        vcb = value2.commentBefore;
        valueComment = value2.comment;
      } else {
        vsb = false;
        vcb = null;
        valueComment = null;
        if (value2 && typeof value2 === "object")
          value2 = doc.createNode(value2);
      }
      ctx.implicitKey = false;
      if (!explicitKey && !keyComment && identity.isScalar(value2))
        ctx.indentAtStart = str.length + 1;
      chompKeep = false;
      if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && identity.isSeq(value2) && !value2.flow && !value2.tag && !value2.anchor) {
        ctx.indent = ctx.indent.substring(2);
      }
      let valueCommentDone = false;
      const valueStr = stringify2.stringify(value2, ctx, () => valueCommentDone = true, () => chompKeep = true);
      let ws = " ";
      if (keyComment || vsb || vcb) {
        ws = vsb ? "\n" : "";
        if (vcb) {
          const cs = commentString(vcb);
          ws += `
${stringifyComment.indentComment(cs, ctx.indent)}`;
        }
        if (valueStr === "" && !ctx.inFlow) {
          if (ws === "\n" && valueComment)
            ws = "\n\n";
        } else {
          ws += `
${ctx.indent}`;
        }
      } else if (!explicitKey && identity.isCollection(value2)) {
        const vs0 = valueStr[0];
        const nl0 = valueStr.indexOf("\n");
        const hasNewline = nl0 !== -1;
        const flow3 = ctx.inFlow ?? value2.flow ?? value2.items.length === 0;
        if (hasNewline || !flow3) {
          let hasPropsLine = false;
          if (hasNewline && (vs0 === "&" || vs0 === "!")) {
            let sp0 = valueStr.indexOf(" ");
            if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
              sp0 = valueStr.indexOf(" ", sp0 + 1);
            }
            if (sp0 === -1 || nl0 < sp0)
              hasPropsLine = true;
          }
          if (!hasPropsLine)
            ws = `
${ctx.indent}`;
        }
      } else if (valueStr === "" || valueStr[0] === "\n") {
        ws = "";
      }
      str += ws + valueStr;
      if (ctx.inFlow) {
        if (valueCommentDone && onComment)
          onComment();
      } else if (valueComment && !valueCommentDone) {
        str += stringifyComment.lineComment(str, ctx.indent, commentString(valueComment));
      } else if (chompKeep && onChompKeep) {
        onChompKeep();
      }
      return str;
    }
    exports.stringifyPair = stringifyPair;
  }
});

// node_modules/yaml/dist/log.js
var require_log = __commonJS({
  "node_modules/yaml/dist/log.js"(exports) {
    "use strict";
    var node_process = __require("process");
    function debug(logLevel, ...messages) {
      if (logLevel === "debug")
        console.log(...messages);
    }
    function warn(logLevel, warning) {
      if (logLevel === "debug" || logLevel === "warn") {
        if (typeof node_process.emitWarning === "function")
          node_process.emitWarning(warning);
        else
          console.warn(warning);
      }
    }
    exports.debug = debug;
    exports.warn = warn;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/merge.js
var require_merge = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/merge.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var MERGE_KEY = "<<";
    var merge = {
      identify: (value2) => value2 === MERGE_KEY || typeof value2 === "symbol" && value2.description === MERGE_KEY,
      default: "key",
      tag: "tag:yaml.org,2002:merge",
      test: /^<<$/,
      resolve: () => Object.assign(new Scalar.Scalar(Symbol(MERGE_KEY)), {
        addToJSMap: addMergeToJSMap
      }),
      stringify: () => MERGE_KEY
    };
    var isMergeKey = (ctx, key) => (merge.identify(key) || identity.isScalar(key) && (!key.type || key.type === Scalar.Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
    function addMergeToJSMap(ctx, map, value2) {
      const source = resolveAliasValue(ctx, value2);
      if (identity.isSeq(source))
        for (const it of source.items)
          mergeValue(ctx, map, it);
      else if (Array.isArray(source))
        for (const it of source)
          mergeValue(ctx, map, it);
      else
        mergeValue(ctx, map, source);
    }
    function mergeValue(ctx, map, value2) {
      const source = resolveAliasValue(ctx, value2);
      if (!identity.isMap(source))
        throw new Error("Merge sources must be maps or map aliases");
      const srcMap = source.toJSON(null, ctx, Map);
      for (const [key, value3] of srcMap) {
        if (map instanceof Map) {
          if (!map.has(key))
            map.set(key, value3);
        } else if (map instanceof Set) {
          map.add(key);
        } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
          Object.defineProperty(map, key, {
            value: value3,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
      return map;
    }
    function resolveAliasValue(ctx, value2) {
      return ctx && identity.isAlias(value2) ? value2.resolve(ctx.doc, ctx) : value2;
    }
    exports.addMergeToJSMap = addMergeToJSMap;
    exports.isMergeKey = isMergeKey;
    exports.merge = merge;
  }
});

// node_modules/yaml/dist/nodes/addPairToJSMap.js
var require_addPairToJSMap = __commonJS({
  "node_modules/yaml/dist/nodes/addPairToJSMap.js"(exports) {
    "use strict";
    var log = require_log();
    var merge = require_merge();
    var stringify2 = require_stringify();
    var identity = require_identity();
    var toJS = require_toJS();
    function addPairToJSMap(ctx, map, { key, value: value2 }) {
      if (identity.isNode(key) && key.addToJSMap)
        key.addToJSMap(ctx, map, value2);
      else if (merge.isMergeKey(ctx, key))
        merge.addMergeToJSMap(ctx, map, value2);
      else {
        const jsKey = toJS.toJS(key, "", ctx);
        if (map instanceof Map) {
          map.set(jsKey, toJS.toJS(value2, jsKey, ctx));
        } else if (map instanceof Set) {
          map.add(jsKey);
        } else {
          const stringKey = stringifyKey(key, jsKey, ctx);
          const jsValue = toJS.toJS(value2, stringKey, ctx);
          if (stringKey in map)
            Object.defineProperty(map, stringKey, {
              value: jsValue,
              writable: true,
              enumerable: true,
              configurable: true
            });
          else
            map[stringKey] = jsValue;
        }
      }
      return map;
    }
    function stringifyKey(key, jsKey, ctx) {
      if (jsKey === null)
        return "";
      if (typeof jsKey !== "object")
        return String(jsKey);
      if (identity.isNode(key) && ctx?.doc) {
        const strCtx = stringify2.createStringifyContext(ctx.doc, {});
        strCtx.anchors = /* @__PURE__ */ new Set();
        for (const node2 of ctx.anchors.keys())
          strCtx.anchors.add(node2.anchor);
        strCtx.inFlow = true;
        strCtx.inStringifyKey = true;
        const strKey = key.toString(strCtx);
        if (!ctx.mapKeyWarned) {
          let jsonStr = JSON.stringify(strKey);
          if (jsonStr.length > 40)
            jsonStr = jsonStr.substring(0, 36) + '..."';
          log.warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
          ctx.mapKeyWarned = true;
        }
        return strKey;
      }
      return JSON.stringify(jsKey);
    }
    exports.addPairToJSMap = addPairToJSMap;
  }
});

// node_modules/yaml/dist/nodes/Pair.js
var require_Pair = __commonJS({
  "node_modules/yaml/dist/nodes/Pair.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var stringifyPair = require_stringifyPair();
    var addPairToJSMap = require_addPairToJSMap();
    var identity = require_identity();
    function createPair(key, value2, ctx) {
      const k = createNode.createNode(key, void 0, ctx);
      const v = createNode.createNode(value2, void 0, ctx);
      return new Pair(k, v);
    }
    var Pair = class _Pair {
      constructor(key, value2 = null) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.PAIR });
        this.key = key;
        this.value = value2;
      }
      clone(schema) {
        let { key, value: value2 } = this;
        if (identity.isNode(key))
          key = key.clone(schema);
        if (identity.isNode(value2))
          value2 = value2.clone(schema);
        return new _Pair(key, value2);
      }
      toJSON(_, ctx) {
        const pair = ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        return addPairToJSMap.addPairToJSMap(ctx, pair, this);
      }
      toString(ctx, onComment, onChompKeep) {
        return ctx?.doc ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
      }
    };
    exports.Pair = Pair;
    exports.createPair = createPair;
  }
});

// node_modules/yaml/dist/stringify/stringifyCollection.js
var require_stringifyCollection = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyCollection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var stringify2 = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyCollection(collection, ctx, options) {
      const flow3 = ctx.inFlow ?? collection.flow;
      const stringify3 = flow3 ? stringifyFlowCollection : stringifyBlockCollection;
      return stringify3(collection, ctx, options);
    }
    function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
      const { indent: indent2, options: { commentString } } = ctx;
      const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
      let chompKeep = false;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item2 = items[i];
        let comment2 = null;
        if (identity.isNode(item2)) {
          if (!chompKeep && item2.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item2.commentBefore, chompKeep);
          if (item2.comment)
            comment2 = item2.comment;
        } else if (identity.isPair(item2)) {
          const ik = identity.isNode(item2.key) ? item2.key : null;
          if (ik) {
            if (!chompKeep && ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
          }
        }
        chompKeep = false;
        let str2 = stringify2.stringify(item2, itemCtx, () => comment2 = null, () => chompKeep = true);
        if (comment2)
          str2 += stringifyComment.lineComment(str2, itemIndent, commentString(comment2));
        if (chompKeep && comment2)
          chompKeep = false;
        lines.push(blockItemPrefix + str2);
      }
      let str;
      if (lines.length === 0) {
        str = flowChars.start + flowChars.end;
      } else {
        str = lines[0];
        for (let i = 1; i < lines.length; ++i) {
          const line = lines[i];
          str += line ? `
${indent2}${line}` : "\n";
        }
      }
      if (comment) {
        str += "\n" + stringifyComment.indentComment(commentString(comment), indent2);
        if (onComment)
          onComment();
      } else if (chompKeep && onChompKeep)
        onChompKeep();
      return str;
    }
    function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
      const { indent: indent2, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
      itemIndent += indentStep;
      const itemCtx = Object.assign({}, ctx, {
        indent: itemIndent,
        inFlow: true,
        type: null
      });
      let reqNewline = false;
      let linesAtValue = 0;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item2 = items[i];
        let comment = null;
        if (identity.isNode(item2)) {
          if (item2.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item2.commentBefore, false);
          if (item2.comment)
            comment = item2.comment;
        } else if (identity.isPair(item2)) {
          const ik = identity.isNode(item2.key) ? item2.key : null;
          if (ik) {
            if (ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, false);
            if (ik.comment)
              reqNewline = true;
          }
          const iv = identity.isNode(item2.value) ? item2.value : null;
          if (iv) {
            if (iv.comment)
              comment = iv.comment;
            if (iv.commentBefore)
              reqNewline = true;
          } else if (item2.value == null && ik?.comment) {
            comment = ik.comment;
          }
        }
        if (comment)
          reqNewline = true;
        let str = stringify2.stringify(item2, itemCtx, () => comment = null);
        reqNewline || (reqNewline = lines.length > linesAtValue || str.includes("\n"));
        if (i < items.length - 1) {
          str += ",";
        } else if (ctx.options.trailingComma) {
          if (ctx.options.lineWidth > 0) {
            reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str.length + 2) > ctx.options.lineWidth);
          }
          if (reqNewline) {
            str += ",";
          }
        }
        if (comment)
          str += stringifyComment.lineComment(str, itemIndent, commentString(comment));
        lines.push(str);
        linesAtValue = lines.length;
      }
      const { start, end } = flowChars;
      if (lines.length === 0) {
        return start + end;
      } else {
        if (!reqNewline) {
          const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
          reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
        }
        if (reqNewline) {
          let str = start;
          for (const line of lines)
            str += line ? `
${indentStep}${indent2}${line}` : "\n";
          return `${str}
${indent2}${end}`;
        } else {
          return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
        }
      }
    }
    function addCommentBefore({ indent: indent2, options: { commentString } }, lines, comment, chompKeep) {
      if (comment && chompKeep)
        comment = comment.replace(/^\n+/, "");
      if (comment) {
        const ic = stringifyComment.indentComment(commentString(comment), indent2);
        lines.push(ic.trimStart());
      }
    }
    exports.stringifyCollection = stringifyCollection;
  }
});

// node_modules/yaml/dist/nodes/YAMLMap.js
var require_YAMLMap = __commonJS({
  "node_modules/yaml/dist/nodes/YAMLMap.js"(exports) {
    "use strict";
    var stringifyCollection = require_stringifyCollection();
    var addPairToJSMap = require_addPairToJSMap();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    function findPair(items, key) {
      const k = identity.isScalar(key) ? key.value : key;
      for (const it of items) {
        if (identity.isPair(it)) {
          if (it.key === key || it.key === k)
            return it;
          if (identity.isScalar(it.key) && it.key.value === k)
            return it;
        }
      }
      return void 0;
    }
    var YAMLMap = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:map";
      }
      constructor(schema) {
        super(identity.MAP, schema);
        this.items = [];
      }
      /**
       * A generic collection parsing method that can be extended
       * to other node classes that inherit from YAMLMap
       */
      static from(schema, obj, ctx) {
        const { keepUndefined, replacer } = ctx;
        const map = new this(schema);
        const add = (key, value2) => {
          if (typeof replacer === "function")
            value2 = replacer.call(obj, key, value2);
          else if (Array.isArray(replacer) && !replacer.includes(key))
            return;
          if (value2 !== void 0 || keepUndefined)
            map.items.push(Pair.createPair(key, value2, ctx));
        };
        if (obj instanceof Map) {
          for (const [key, value2] of obj)
            add(key, value2);
        } else if (obj && typeof obj === "object") {
          for (const key of Object.keys(obj))
            add(key, obj[key]);
        }
        if (typeof schema.sortMapEntries === "function") {
          map.items.sort(schema.sortMapEntries);
        }
        return map;
      }
      /**
       * Adds a value to the collection.
       *
       * @param overwrite - If not set `true`, using a key that is already in the
       *   collection will throw. Otherwise, overwrites the previous value.
       */
      add(pair, overwrite) {
        let _pair;
        if (identity.isPair(pair))
          _pair = pair;
        else if (!pair || typeof pair !== "object" || !("key" in pair)) {
          _pair = new Pair.Pair(pair, pair?.value);
        } else
          _pair = new Pair.Pair(pair.key, pair.value);
        const prev = findPair(this.items, _pair.key);
        const sortEntries = this.schema?.sortMapEntries;
        if (prev) {
          if (!overwrite)
            throw new Error(`Key ${_pair.key} already set`);
          if (identity.isScalar(prev.value) && Scalar.isScalarValue(_pair.value))
            prev.value.value = _pair.value;
          else
            prev.value = _pair.value;
        } else if (sortEntries) {
          const i = this.items.findIndex((item2) => sortEntries(_pair, item2) < 0);
          if (i === -1)
            this.items.push(_pair);
          else
            this.items.splice(i, 0, _pair);
        } else {
          this.items.push(_pair);
        }
      }
      delete(key) {
        const it = findPair(this.items, key);
        if (!it)
          return false;
        const del = this.items.splice(this.items.indexOf(it), 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const it = findPair(this.items, key);
        const node2 = it?.value;
        return (!keepScalar && identity.isScalar(node2) ? node2.value : node2) ?? void 0;
      }
      has(key) {
        return !!findPair(this.items, key);
      }
      set(key, value2) {
        this.add(new Pair.Pair(key, value2), true);
      }
      /**
       * @param ctx - Conversion context, originally set in Document#toJS()
       * @param {Class} Type - If set, forces the returned collection type
       * @returns Instance of Type, Map, or Object
       */
      toJSON(_, ctx, Type) {
        const map = Type ? new Type() : ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const item2 of this.items)
          addPairToJSMap.addPairToJSMap(ctx, map, item2);
        return map;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        for (const item2 of this.items) {
          if (!identity.isPair(item2))
            throw new Error(`Map items must all be pairs; found ${JSON.stringify(item2)} instead`);
        }
        if (!ctx.allNullValues && this.hasAllNullValues(false))
          ctx = Object.assign({}, ctx, { allNullValues: true });
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "",
          flowChars: { start: "{", end: "}" },
          itemIndent: ctx.indent || "",
          onChompKeep,
          onComment
        });
      }
    };
    exports.YAMLMap = YAMLMap;
    exports.findPair = findPair;
  }
});

// node_modules/yaml/dist/schema/common/map.js
var require_map = __commonJS({
  "node_modules/yaml/dist/schema/common/map.js"(exports) {
    "use strict";
    var identity = require_identity();
    var YAMLMap = require_YAMLMap();
    var map = {
      collection: "map",
      default: true,
      nodeClass: YAMLMap.YAMLMap,
      tag: "tag:yaml.org,2002:map",
      resolve(map2, onError) {
        if (!identity.isMap(map2))
          onError("Expected a mapping for this tag");
        return map2;
      },
      createNode: (schema, obj, ctx) => YAMLMap.YAMLMap.from(schema, obj, ctx)
    };
    exports.map = map;
  }
});

// node_modules/yaml/dist/nodes/YAMLSeq.js
var require_YAMLSeq = __commonJS({
  "node_modules/yaml/dist/nodes/YAMLSeq.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var stringifyCollection = require_stringifyCollection();
    var Collection = require_Collection();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var toJS = require_toJS();
    var YAMLSeq = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:seq";
      }
      constructor(schema) {
        super(identity.SEQ, schema);
        this.items = [];
      }
      add(value2) {
        this.items.push(value2);
      }
      /**
       * Removes a value from the collection.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       *
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return false;
        const del = this.items.splice(idx, 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return void 0;
        const it = this.items[idx];
        return !keepScalar && identity.isScalar(it) ? it.value : it;
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       */
      has(key) {
        const idx = asItemIndex(key);
        return typeof idx === "number" && idx < this.items.length;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       *
       * If `key` does not contain a representation of an integer, this will throw.
       * It may be wrapped in a `Scalar`.
       */
      set(key, value2) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          throw new Error(`Expected a valid index, not ${key}.`);
        const prev = this.items[idx];
        if (identity.isScalar(prev) && Scalar.isScalarValue(value2))
          prev.value = value2;
        else
          this.items[idx] = value2;
      }
      toJSON(_, ctx) {
        const seq = [];
        if (ctx?.onCreate)
          ctx.onCreate(seq);
        let i = 0;
        for (const item2 of this.items)
          seq.push(toJS.toJS(item2, String(i++), ctx));
        return seq;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "- ",
          flowChars: { start: "[", end: "]" },
          itemIndent: (ctx.indent || "") + "  ",
          onChompKeep,
          onComment
        });
      }
      static from(schema, obj, ctx) {
        const { replacer } = ctx;
        const seq = new this(schema);
        if (obj && Symbol.iterator in Object(obj)) {
          let i = 0;
          for (let it of obj) {
            if (typeof replacer === "function") {
              const key = obj instanceof Set ? it : String(i++);
              it = replacer.call(obj, key, it);
            }
            seq.items.push(createNode.createNode(it, void 0, ctx));
          }
        }
        return seq;
      }
    };
    function asItemIndex(key) {
      let idx = identity.isScalar(key) ? key.value : key;
      if (idx && typeof idx === "string")
        idx = Number(idx);
      return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
    }
    exports.YAMLSeq = YAMLSeq;
  }
});

// node_modules/yaml/dist/schema/common/seq.js
var require_seq = __commonJS({
  "node_modules/yaml/dist/schema/common/seq.js"(exports) {
    "use strict";
    var identity = require_identity();
    var YAMLSeq = require_YAMLSeq();
    var seq = {
      collection: "seq",
      default: true,
      nodeClass: YAMLSeq.YAMLSeq,
      tag: "tag:yaml.org,2002:seq",
      resolve(seq2, onError) {
        if (!identity.isSeq(seq2))
          onError("Expected a sequence for this tag");
        return seq2;
      },
      createNode: (schema, obj, ctx) => YAMLSeq.YAMLSeq.from(schema, obj, ctx)
    };
    exports.seq = seq;
  }
});

// node_modules/yaml/dist/schema/common/string.js
var require_string = __commonJS({
  "node_modules/yaml/dist/schema/common/string.js"(exports) {
    "use strict";
    var stringifyString = require_stringifyString();
    var string3 = {
      identify: (value2) => typeof value2 === "string",
      default: true,
      tag: "tag:yaml.org,2002:str",
      resolve: (str) => str,
      stringify(item2, ctx, onComment, onChompKeep) {
        ctx = Object.assign({ actualString: true }, ctx);
        return stringifyString.stringifyString(item2, ctx, onComment, onChompKeep);
      }
    };
    exports.string = string3;
  }
});

// node_modules/yaml/dist/schema/common/null.js
var require_null = __commonJS({
  "node_modules/yaml/dist/schema/common/null.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var nullTag = {
      identify: (value2) => value2 == null,
      createNode: () => new Scalar.Scalar(null),
      default: true,
      tag: "tag:yaml.org,2002:null",
      test: /^(?:~|[Nn]ull|NULL)?$/,
      resolve: () => new Scalar.Scalar(null),
      stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
    };
    exports.nullTag = nullTag;
  }
});

// node_modules/yaml/dist/schema/core/bool.js
var require_bool = __commonJS({
  "node_modules/yaml/dist/schema/core/bool.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var boolTag = {
      identify: (value2) => typeof value2 === "boolean",
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
      resolve: (str) => new Scalar.Scalar(str[0] === "t" || str[0] === "T"),
      stringify({ source, value: value2 }, ctx) {
        if (source && boolTag.test.test(source)) {
          const sv = source[0] === "t" || source[0] === "T";
          if (value2 === sv)
            return source;
        }
        return value2 ? ctx.options.trueStr : ctx.options.falseStr;
      }
    };
    exports.boolTag = boolTag;
  }
});

// node_modules/yaml/dist/stringify/stringifyNumber.js
var require_stringifyNumber = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyNumber.js"(exports) {
    "use strict";
    function stringifyNumber({ format, minFractionDigits, tag, value: value2 }) {
      if (typeof value2 === "bigint")
        return String(value2);
      const num = typeof value2 === "number" ? value2 : Number(value2);
      if (!isFinite(num))
        return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
      let n = Object.is(value2, -0) ? "-0" : JSON.stringify(value2);
      if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^-?\d/.test(n) && !n.includes("e")) {
        let i = n.indexOf(".");
        if (i < 0) {
          i = n.length;
          n += ".";
        }
        let d = minFractionDigits - (n.length - i - 1);
        while (d-- > 0)
          n += "0";
      }
      return n;
    }
    exports.stringifyNumber = stringifyNumber;
  }
});

// node_modules/yaml/dist/schema/core/float.js
var require_float = __commonJS({
  "node_modules/yaml/dist/schema/core/float.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value2) => typeof value2 === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value2) => typeof value2 === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
      resolve: (str) => parseFloat(str),
      stringify(node2) {
        const num = Number(node2.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node2);
      }
    };
    var float = {
      identify: (value2) => typeof value2 === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
      resolve(str) {
        const node2 = new Scalar.Scalar(parseFloat(str));
        const dot = str.indexOf(".");
        if (dot !== -1 && str[str.length - 1] === "0")
          node2.minFractionDigits = str.length - dot - 1;
        return node2;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports.float = float;
    exports.floatExp = floatExp;
    exports.floatNaN = floatNaN;
  }
});

// node_modules/yaml/dist/schema/core/int.js
var require_int = __commonJS({
  "node_modules/yaml/dist/schema/core/int.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value2) => typeof value2 === "bigint" || Number.isInteger(value2);
    var intResolve = (str, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix);
    function intStringify(node2, radix, prefix) {
      const { value: value2 } = node2;
      if (intIdentify(value2) && value2 >= 0)
        return prefix + value2.toString(radix);
      return stringifyNumber.stringifyNumber(node2);
    }
    var intOct = {
      identify: (value2) => intIdentify(value2) && value2 >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^0o[0-7]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 8, opt),
      stringify: (node2) => intStringify(node2, 8, "0o")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: (value2) => intIdentify(value2) && value2 >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^0x[0-9a-fA-F]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
      stringify: (node2) => intStringify(node2, 16, "0x")
    };
    exports.int = int;
    exports.intHex = intHex;
    exports.intOct = intOct;
  }
});

// node_modules/yaml/dist/schema/core/schema.js
var require_schema = __commonJS({
  "node_modules/yaml/dist/schema/core/schema.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string3 = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = [
      map.map,
      seq.seq,
      string3.string,
      _null.nullTag,
      bool.boolTag,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float
    ];
    exports.schema = schema;
  }
});

// node_modules/yaml/dist/schema/json/schema.js
var require_schema2 = __commonJS({
  "node_modules/yaml/dist/schema/json/schema.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var map = require_map();
    var seq = require_seq();
    function intIdentify(value2) {
      return typeof value2 === "bigint" || Number.isInteger(value2);
    }
    var stringifyJSON = ({ value: value2 }) => JSON.stringify(value2);
    var jsonScalars = [
      {
        identify: (value2) => typeof value2 === "string",
        default: true,
        tag: "tag:yaml.org,2002:str",
        resolve: (str) => str,
        stringify: stringifyJSON
      },
      {
        identify: (value2) => value2 == null,
        createNode: () => new Scalar.Scalar(null),
        default: true,
        tag: "tag:yaml.org,2002:null",
        test: /^null$/,
        resolve: () => null,
        stringify: stringifyJSON
      },
      {
        identify: (value2) => typeof value2 === "boolean",
        default: true,
        tag: "tag:yaml.org,2002:bool",
        test: /^true$|^false$/,
        resolve: (str) => str === "true",
        stringify: stringifyJSON
      },
      {
        identify: intIdentify,
        default: true,
        tag: "tag:yaml.org,2002:int",
        test: /^-?(?:0|[1-9][0-9]*)$/,
        resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
        stringify: ({ value: value2 }) => intIdentify(value2) ? value2.toString() : JSON.stringify(value2)
      },
      {
        identify: (value2) => typeof value2 === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
        resolve: (str) => parseFloat(str),
        stringify: stringifyJSON
      }
    ];
    var jsonError = {
      default: true,
      tag: "",
      test: /^/,
      resolve(str, onError) {
        onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
        return str;
      }
    };
    var schema = [map.map, seq.seq].concat(jsonScalars, jsonError);
    exports.schema = schema;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/binary.js
var require_binary = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/binary.js"(exports) {
    "use strict";
    var node_buffer = __require("buffer");
    var Scalar = require_Scalar();
    var stringifyString = require_stringifyString();
    var binary = {
      identify: (value2) => value2 instanceof Uint8Array,
      // Buffer inherits from Uint8Array
      default: false,
      tag: "tag:yaml.org,2002:binary",
      /**
       * Returns a Buffer in node and an Uint8Array in browsers
       *
       * To use the resulting buffer as an image, you'll want to do something like:
       *
       *   const blob = new Blob([buffer], { type: 'image/jpeg' })
       *   document.querySelector('#photo').src = URL.createObjectURL(blob)
       */
      resolve(src, onError) {
        if (typeof node_buffer.Buffer === "function") {
          return node_buffer.Buffer.from(src, "base64");
        } else if (typeof atob === "function") {
          const str = atob(src.replace(/[\n\r]/g, ""));
          const buffer = new Uint8Array(str.length);
          for (let i = 0; i < str.length; ++i)
            buffer[i] = str.charCodeAt(i);
          return buffer;
        } else {
          onError("This environment does not support reading binary tags; either Buffer or atob is required");
          return src;
        }
      },
      stringify({ comment, type, value: value2 }, ctx, onComment, onChompKeep) {
        if (!value2)
          return "";
        const buf = value2;
        let str;
        if (typeof node_buffer.Buffer === "function") {
          str = buf instanceof node_buffer.Buffer ? buf.toString("base64") : node_buffer.Buffer.from(buf.buffer).toString("base64");
        } else if (typeof btoa === "function") {
          let s = "";
          for (let i = 0; i < buf.length; ++i)
            s += String.fromCharCode(buf[i]);
          str = btoa(s);
        } else {
          throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
        }
        type ?? (type = Scalar.Scalar.BLOCK_LITERAL);
        if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
          const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
          const n = Math.ceil(str.length / lineWidth);
          const lines = new Array(n);
          for (let i = 0, o = 0; i < n; ++i, o += lineWidth) {
            lines[i] = str.substr(o, lineWidth);
          }
          str = lines.join(type === Scalar.Scalar.BLOCK_LITERAL ? "\n" : " ");
        }
        return stringifyString.stringifyString({ comment, type, value: str }, ctx, onComment, onChompKeep);
      }
    };
    exports.binary = binary;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/pairs.js
var require_pairs = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/pairs.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLSeq = require_YAMLSeq();
    function resolvePairs(seq, onError) {
      if (identity.isSeq(seq)) {
        for (let i = 0; i < seq.items.length; ++i) {
          let item2 = seq.items[i];
          if (identity.isPair(item2))
            continue;
          else if (identity.isMap(item2)) {
            if (item2.items.length > 1)
              onError("Each pair must have its own sequence indicator");
            const pair = item2.items[0] || new Pair.Pair(new Scalar.Scalar(null));
            if (item2.commentBefore)
              pair.key.commentBefore = pair.key.commentBefore ? `${item2.commentBefore}
${pair.key.commentBefore}` : item2.commentBefore;
            if (item2.comment) {
              const cn = pair.value ?? pair.key;
              cn.comment = cn.comment ? `${item2.comment}
${cn.comment}` : item2.comment;
            }
            item2 = pair;
          }
          seq.items[i] = identity.isPair(item2) ? item2 : new Pair.Pair(item2);
        }
      } else
        onError("Expected a sequence for this tag");
      return seq;
    }
    function createPairs(schema, iterable, ctx) {
      const { replacer } = ctx;
      const pairs2 = new YAMLSeq.YAMLSeq(schema);
      pairs2.tag = "tag:yaml.org,2002:pairs";
      let i = 0;
      if (iterable && Symbol.iterator in Object(iterable))
        for (let it of iterable) {
          if (typeof replacer === "function")
            it = replacer.call(iterable, String(i++), it);
          let key, value2;
          if (Array.isArray(it)) {
            if (it.length === 2) {
              key = it[0];
              value2 = it[1];
            } else
              throw new TypeError(`Expected [key, value] tuple: ${it}`);
          } else if (it && it instanceof Object) {
            const keys = Object.keys(it);
            if (keys.length === 1) {
              key = keys[0];
              value2 = it[key];
            } else {
              throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
            }
          } else {
            key = it;
          }
          pairs2.items.push(Pair.createPair(key, value2, ctx));
        }
      return pairs2;
    }
    var pairs = {
      collection: "seq",
      default: false,
      tag: "tag:yaml.org,2002:pairs",
      resolve: resolvePairs,
      createNode: createPairs
    };
    exports.createPairs = createPairs;
    exports.pairs = pairs;
    exports.resolvePairs = resolvePairs;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/omap.js
var require_omap = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/omap.js"(exports) {
    "use strict";
    var identity = require_identity();
    var toJS = require_toJS();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var pairs = require_pairs();
    var YAMLOMap = class _YAMLOMap extends YAMLSeq.YAMLSeq {
      constructor() {
        super();
        this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
        this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
        this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
        this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
        this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
        this.tag = _YAMLOMap.tag;
      }
      /**
       * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
       * but TypeScript won't allow widening the signature of a child method.
       */
      toJSON(_, ctx) {
        if (!ctx)
          return super.toJSON(_);
        const map = /* @__PURE__ */ new Map();
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const pair of this.items) {
          let key, value2;
          if (identity.isPair(pair)) {
            key = toJS.toJS(pair.key, "", ctx);
            value2 = toJS.toJS(pair.value, key, ctx);
          } else {
            key = toJS.toJS(pair, "", ctx);
          }
          if (map.has(key))
            throw new Error("Ordered maps must not include duplicate keys");
          map.set(key, value2);
        }
        return map;
      }
      static from(schema, iterable, ctx) {
        const pairs$1 = pairs.createPairs(schema, iterable, ctx);
        const omap2 = new this();
        omap2.items = pairs$1.items;
        return omap2;
      }
    };
    YAMLOMap.tag = "tag:yaml.org,2002:omap";
    var omap = {
      collection: "seq",
      identify: (value2) => value2 instanceof Map,
      nodeClass: YAMLOMap,
      default: false,
      tag: "tag:yaml.org,2002:omap",
      resolve(seq, onError) {
        const pairs$1 = pairs.resolvePairs(seq, onError);
        const seenKeys = [];
        for (const { key } of pairs$1.items) {
          if (identity.isScalar(key)) {
            if (seenKeys.includes(key.value)) {
              onError(`Ordered maps must not include duplicate keys: ${key.value}`);
            } else {
              seenKeys.push(key.value);
            }
          }
        }
        return Object.assign(new YAMLOMap(), pairs$1);
      },
      createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
    };
    exports.YAMLOMap = YAMLOMap;
    exports.omap = omap;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/bool.js
var require_bool2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/bool.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    function boolStringify({ value: value2, source }, ctx) {
      const boolObj = value2 ? trueTag : falseTag;
      if (source && boolObj.test.test(source))
        return source;
      return value2 ? ctx.options.trueStr : ctx.options.falseStr;
    }
    var trueTag = {
      identify: (value2) => value2 === true,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
      resolve: () => new Scalar.Scalar(true),
      stringify: boolStringify
    };
    var falseTag = {
      identify: (value2) => value2 === false,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
      resolve: () => new Scalar.Scalar(false),
      stringify: boolStringify
    };
    exports.falseTag = falseTag;
    exports.trueTag = trueTag;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/float.js
var require_float2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/float.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value2) => typeof value2 === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value2) => typeof value2 === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
      resolve: (str) => parseFloat(str.replace(/_/g, "")),
      stringify(node2) {
        const num = Number(node2.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node2);
      }
    };
    var float = {
      identify: (value2) => typeof value2 === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
      resolve(str) {
        const node2 = new Scalar.Scalar(parseFloat(str.replace(/_/g, "")));
        const dot = str.indexOf(".");
        if (dot !== -1) {
          const f = str.substring(dot + 1).replace(/_/g, "");
          if (f[f.length - 1] === "0")
            node2.minFractionDigits = f.length;
        }
        return node2;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports.float = float;
    exports.floatExp = floatExp;
    exports.floatNaN = floatNaN;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/int.js
var require_int2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/int.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value2) => typeof value2 === "bigint" || Number.isInteger(value2);
    function intResolve(str, offset, radix, { intAsBigInt }) {
      const sign = str[0];
      if (sign === "-" || sign === "+")
        offset += 1;
      str = str.substring(offset).replace(/_/g, "");
      if (intAsBigInt) {
        switch (radix) {
          case 2:
            str = `0b${str}`;
            break;
          case 8:
            str = `0o${str}`;
            break;
          case 16:
            str = `0x${str}`;
            break;
        }
        const n2 = BigInt(str);
        return sign === "-" ? BigInt(-1) * n2 : n2;
      }
      const n = parseInt(str, radix);
      return sign === "-" ? -1 * n : n;
    }
    function intStringify(node2, radix, prefix) {
      const { value: value2 } = node2;
      if (intIdentify(value2)) {
        const str = value2.toString(radix);
        return value2 < 0 ? "-" + prefix + str.substr(1) : prefix + str;
      }
      return stringifyNumber.stringifyNumber(node2);
    }
    var intBin = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "BIN",
      test: /^[-+]?0b[0-1_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 2, opt),
      stringify: (node2) => intStringify(node2, 2, "0b")
    };
    var intOct = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^[-+]?0[0-7_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 1, 8, opt),
      stringify: (node2) => intStringify(node2, 8, "0")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9][0-9_]*$/,
      resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^[-+]?0x[0-9a-fA-F_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
      stringify: (node2) => intStringify(node2, 16, "0x")
    };
    exports.int = int;
    exports.intBin = intBin;
    exports.intHex = intHex;
    exports.intOct = intOct;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/set.js
var require_set = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/set.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSet = class _YAMLSet extends YAMLMap.YAMLMap {
      constructor(schema) {
        super(schema);
        this.tag = _YAMLSet.tag;
      }
      add(key) {
        let pair;
        if (identity.isPair(key))
          pair = key;
        else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
          pair = new Pair.Pair(key.key, null);
        else
          pair = new Pair.Pair(key, null);
        const prev = YAMLMap.findPair(this.items, pair.key);
        if (!prev)
          this.items.push(pair);
      }
      /**
       * If `keepPair` is `true`, returns the Pair matching `key`.
       * Otherwise, returns the value of that Pair's key.
       */
      get(key, keepPair) {
        const pair = YAMLMap.findPair(this.items, key);
        return !keepPair && identity.isPair(pair) ? identity.isScalar(pair.key) ? pair.key.value : pair.key : pair;
      }
      set(key, value2) {
        if (typeof value2 !== "boolean")
          throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value2}`);
        const prev = YAMLMap.findPair(this.items, key);
        if (prev && !value2) {
          this.items.splice(this.items.indexOf(prev), 1);
        } else if (!prev && value2) {
          this.items.push(new Pair.Pair(key));
        }
      }
      toJSON(_, ctx) {
        return super.toJSON(_, ctx, Set);
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        if (this.hasAllNullValues(true))
          return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
        else
          throw new Error("Set items must all have null values");
      }
      static from(schema, iterable, ctx) {
        const { replacer } = ctx;
        const set2 = new this(schema);
        if (iterable && Symbol.iterator in Object(iterable))
          for (let value2 of iterable) {
            if (typeof replacer === "function")
              value2 = replacer.call(iterable, value2, value2);
            set2.items.push(Pair.createPair(value2, null, ctx));
          }
        return set2;
      }
    };
    YAMLSet.tag = "tag:yaml.org,2002:set";
    var set = {
      collection: "map",
      identify: (value2) => value2 instanceof Set,
      nodeClass: YAMLSet,
      default: false,
      tag: "tag:yaml.org,2002:set",
      createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
      resolve(map, onError) {
        if (identity.isMap(map)) {
          if (map.hasAllNullValues(true))
            return Object.assign(new YAMLSet(), map);
          else
            onError("Set items must all have null values");
        } else
          onError("Expected a mapping for this tag");
        return map;
      }
    };
    exports.YAMLSet = YAMLSet;
    exports.set = set;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/timestamp.js
var require_timestamp = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/timestamp.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    function parseSexagesimal(str, asBigInt) {
      const sign = str[0];
      const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
      const num = (n) => asBigInt ? BigInt(n) : Number(n);
      const res = parts.replace(/_/g, "").split(":").reduce((res2, p) => res2 * num(60) + num(p), num(0));
      return sign === "-" ? num(-1) * res : res;
    }
    function stringifySexagesimal(node2) {
      let { value: value2 } = node2;
      let num = (n) => n;
      if (typeof value2 === "bigint")
        num = (n) => BigInt(n);
      else if (isNaN(value2) || !isFinite(value2))
        return stringifyNumber.stringifyNumber(node2);
      let sign = "";
      if (value2 < 0) {
        sign = "-";
        value2 *= num(-1);
      }
      const _60 = num(60);
      const parts = [value2 % _60];
      if (value2 < 60) {
        parts.unshift(0);
      } else {
        value2 = (value2 - parts[0]) / _60;
        parts.unshift(value2 % _60);
        if (value2 >= 60) {
          value2 = (value2 - parts[0]) / _60;
          parts.unshift(value2);
        }
      }
      return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
    }
    var intTime = {
      identify: (value2) => typeof value2 === "bigint" || Number.isInteger(value2),
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
      resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
      stringify: stringifySexagesimal
    };
    var floatTime = {
      identify: (value2) => typeof value2 === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
      resolve: (str) => parseSexagesimal(str, false),
      stringify: stringifySexagesimal
    };
    var timestamp = {
      identify: (value2) => value2 instanceof Date,
      default: true,
      tag: "tag:yaml.org,2002:timestamp",
      // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
      // may be omitted altogether, resulting in a date format. In such a case, the time part is
      // assumed to be 00:00:00Z (start of day, UTC).
      test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
      resolve(str) {
        const match = str.match(timestamp.test);
        if (!match)
          throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
        const [, year, month, day, hour, minute, second] = match.map(Number);
        const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
        let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
        const tz = match[8];
        if (tz && tz !== "Z") {
          let d = parseSexagesimal(tz, false);
          if (Math.abs(d) < 30)
            d *= 60;
          date -= 6e4 * d;
        }
        return new Date(date);
      },
      stringify: ({ value: value2 }) => value2?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
    };
    exports.floatTime = floatTime;
    exports.intTime = intTime;
    exports.timestamp = timestamp;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/schema.js
var require_schema3 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/schema.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string3 = require_string();
    var binary = require_binary();
    var bool = require_bool2();
    var float = require_float2();
    var int = require_int2();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var set = require_set();
    var timestamp = require_timestamp();
    var schema = [
      map.map,
      seq.seq,
      string3.string,
      _null.nullTag,
      bool.trueTag,
      bool.falseTag,
      int.intBin,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float,
      binary.binary,
      merge.merge,
      omap.omap,
      pairs.pairs,
      set.set,
      timestamp.intTime,
      timestamp.floatTime,
      timestamp.timestamp
    ];
    exports.schema = schema;
  }
});

// node_modules/yaml/dist/schema/tags.js
var require_tags = __commonJS({
  "node_modules/yaml/dist/schema/tags.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string3 = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = require_schema();
    var schema$1 = require_schema2();
    var binary = require_binary();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var schema$2 = require_schema3();
    var set = require_set();
    var timestamp = require_timestamp();
    var schemas = /* @__PURE__ */ new Map([
      ["core", schema.schema],
      ["failsafe", [map.map, seq.seq, string3.string]],
      ["json", schema$1.schema],
      ["yaml11", schema$2.schema],
      ["yaml-1.1", schema$2.schema]
    ]);
    var tagsByName = {
      binary: binary.binary,
      bool: bool.boolTag,
      float: float.float,
      floatExp: float.floatExp,
      floatNaN: float.floatNaN,
      floatTime: timestamp.floatTime,
      int: int.int,
      intHex: int.intHex,
      intOct: int.intOct,
      intTime: timestamp.intTime,
      map: map.map,
      merge: merge.merge,
      null: _null.nullTag,
      omap: omap.omap,
      pairs: pairs.pairs,
      seq: seq.seq,
      set: set.set,
      timestamp: timestamp.timestamp
    };
    var coreKnownTags = {
      "tag:yaml.org,2002:binary": binary.binary,
      "tag:yaml.org,2002:merge": merge.merge,
      "tag:yaml.org,2002:omap": omap.omap,
      "tag:yaml.org,2002:pairs": pairs.pairs,
      "tag:yaml.org,2002:set": set.set,
      "tag:yaml.org,2002:timestamp": timestamp.timestamp
    };
    function getTags(customTags, schemaName, addMergeTag) {
      const schemaTags = schemas.get(schemaName);
      if (schemaTags && !customTags) {
        return addMergeTag && !schemaTags.includes(merge.merge) ? schemaTags.concat(merge.merge) : schemaTags.slice();
      }
      let tags = schemaTags;
      if (!tags) {
        if (Array.isArray(customTags))
          tags = [];
        else {
          const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
        }
      }
      if (Array.isArray(customTags)) {
        for (const tag of customTags)
          tags = tags.concat(tag);
      } else if (typeof customTags === "function") {
        tags = customTags(tags.slice());
      }
      if (addMergeTag)
        tags = tags.concat(merge.merge);
      return tags.reduce((tags2, tag) => {
        const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
        if (!tagObj) {
          const tagName = JSON.stringify(tag);
          const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
        }
        if (!tags2.includes(tagObj))
          tags2.push(tagObj);
        return tags2;
      }, []);
    }
    exports.coreKnownTags = coreKnownTags;
    exports.getTags = getTags;
  }
});

// node_modules/yaml/dist/schema/Schema.js
var require_Schema = __commonJS({
  "node_modules/yaml/dist/schema/Schema.js"(exports) {
    "use strict";
    var identity = require_identity();
    var map = require_map();
    var seq = require_seq();
    var string3 = require_string();
    var tags = require_tags();
    var sortMapEntriesByKey = (a2, b) => a2.key < b.key ? -1 : a2.key > b.key ? 1 : 0;
    var Schema = class _Schema {
      constructor({ compat, customTags, merge, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
        this.compat = Array.isArray(compat) ? tags.getTags(compat, "compat") : compat ? tags.getTags(null, compat) : null;
        this.name = typeof schema === "string" && schema || "core";
        this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
        this.tags = tags.getTags(customTags, this.name, merge);
        this.toStringOptions = toStringDefaults ?? null;
        Object.defineProperty(this, identity.MAP, { value: map.map });
        Object.defineProperty(this, identity.SCALAR, { value: string3.string });
        Object.defineProperty(this, identity.SEQ, { value: seq.seq });
        this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
      }
      clone() {
        const copy = Object.create(_Schema.prototype, Object.getOwnPropertyDescriptors(this));
        copy.tags = this.tags.slice();
        return copy;
      }
    };
    exports.Schema = Schema;
  }
});

// node_modules/yaml/dist/stringify/stringifyDocument.js
var require_stringifyDocument = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyDocument.js"(exports) {
    "use strict";
    var identity = require_identity();
    var stringify2 = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyDocument(doc, options) {
      const lines = [];
      let hasDirectives = options.directives === true;
      if (options.directives !== false && doc.directives) {
        const dir = doc.directives.toString(doc);
        if (dir) {
          lines.push(dir);
          hasDirectives = true;
        } else if (doc.directives.docStart)
          hasDirectives = true;
      }
      if (hasDirectives)
        lines.push("---");
      const ctx = stringify2.createStringifyContext(doc, options);
      const { commentString } = ctx.options;
      if (doc.commentBefore) {
        if (lines.length !== 1)
          lines.unshift("");
        const cs = commentString(doc.commentBefore);
        lines.unshift(stringifyComment.indentComment(cs, ""));
      }
      let chompKeep = false;
      let contentComment = null;
      if (doc.contents) {
        if (identity.isNode(doc.contents)) {
          if (doc.contents.spaceBefore && hasDirectives)
            lines.push("");
          if (doc.contents.commentBefore) {
            const cs = commentString(doc.contents.commentBefore);
            lines.push(stringifyComment.indentComment(cs, ""));
          }
          ctx.forceBlockIndent = !!doc.comment;
          contentComment = doc.contents.comment;
        }
        const onChompKeep = contentComment ? void 0 : () => chompKeep = true;
        let body = stringify2.stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
        if (contentComment)
          body += stringifyComment.lineComment(body, "", commentString(contentComment));
        if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") {
          lines[lines.length - 1] = `--- ${body}`;
        } else
          lines.push(body);
      } else {
        lines.push(stringify2.stringify(doc.contents, ctx));
      }
      if (doc.directives?.docEnd) {
        if (doc.comment) {
          const cs = commentString(doc.comment);
          if (cs.includes("\n")) {
            lines.push("...");
            lines.push(stringifyComment.indentComment(cs, ""));
          } else {
            lines.push(`... ${cs}`);
          }
        } else {
          lines.push("...");
        }
      } else {
        let dc = doc.comment;
        if (dc && chompKeep)
          dc = dc.replace(/^\n+/, "");
        if (dc) {
          if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
            lines.push("");
          lines.push(stringifyComment.indentComment(commentString(dc), ""));
        }
      }
      return lines.join("\n") + "\n";
    }
    exports.stringifyDocument = stringifyDocument;
  }
});

// node_modules/yaml/dist/doc/Document.js
var require_Document = __commonJS({
  "node_modules/yaml/dist/doc/Document.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var toJS = require_toJS();
    var Schema = require_Schema();
    var stringifyDocument = require_stringifyDocument();
    var anchors = require_anchors();
    var applyReviver = require_applyReviver();
    var createNode = require_createNode();
    var directives = require_directives();
    var Document = class _Document {
      constructor(value2, replacer, options) {
        this.commentBefore = null;
        this.comment = null;
        this.errors = [];
        this.warnings = [];
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.DOC });
        let _replacer = null;
        if (typeof replacer === "function" || Array.isArray(replacer)) {
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const opt = Object.assign({
          intAsBigInt: false,
          keepSourceTokens: false,
          logLevel: "warn",
          prettyErrors: true,
          strict: true,
          stringKeys: false,
          uniqueKeys: true,
          version: "1.2"
        }, options);
        this.options = opt;
        let { version } = opt;
        if (options?._directives) {
          this.directives = options._directives.atDocument();
          if (this.directives.yaml.explicit)
            version = this.directives.yaml.version;
        } else
          this.directives = new directives.Directives({ version });
        this.setSchema(version, options);
        this.contents = value2 === void 0 ? null : this.createNode(value2, _replacer, options);
      }
      /**
       * Create a deep copy of this Document and its contents.
       *
       * Custom Node values that inherit from `Object` still refer to their original instances.
       */
      clone() {
        const copy = Object.create(_Document.prototype, {
          [identity.NODE_TYPE]: { value: identity.DOC }
        });
        copy.commentBefore = this.commentBefore;
        copy.comment = this.comment;
        copy.errors = this.errors.slice();
        copy.warnings = this.warnings.slice();
        copy.options = Object.assign({}, this.options);
        if (this.directives)
          copy.directives = this.directives.clone();
        copy.schema = this.schema.clone();
        copy.contents = identity.isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** Adds a value to the document. */
      add(value2) {
        if (assertCollection(this.contents))
          this.contents.add(value2);
      }
      /** Adds a value to the document. */
      addIn(path2, value2) {
        if (assertCollection(this.contents))
          this.contents.addIn(path2, value2);
      }
      /**
       * Create a new `Alias` node, ensuring that the target `node` has the required anchor.
       *
       * If `node` already has an anchor, `name` is ignored.
       * Otherwise, the `node.anchor` value will be set to `name`,
       * or if an anchor with that name is already present in the document,
       * `name` will be used as a prefix for a new unique anchor.
       * If `name` is undefined, the generated anchor will use 'a' as a prefix.
       */
      createAlias(node2, name) {
        if (!node2.anchor) {
          const prev = anchors.anchorNames(this);
          node2.anchor = // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          !name || prev.has(name) ? anchors.findNewAnchor(name || "a", prev) : name;
        }
        return new Alias.Alias(node2.anchor);
      }
      createNode(value2, replacer, options) {
        let _replacer = void 0;
        if (typeof replacer === "function") {
          value2 = replacer.call({ "": value2 }, "", value2);
          _replacer = replacer;
        } else if (Array.isArray(replacer)) {
          const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
          const asStr = replacer.filter(keyToStr).map(String);
          if (asStr.length > 0)
            replacer = replacer.concat(asStr);
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const { aliasDuplicateObjects, anchorPrefix, flow: flow3, keepUndefined, onTagObj, tag } = options ?? {};
        const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(
          this,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          anchorPrefix || "a"
        );
        const ctx = {
          aliasDuplicateObjects: aliasDuplicateObjects ?? true,
          keepUndefined: keepUndefined ?? false,
          onAnchor,
          onTagObj,
          replacer: _replacer,
          schema: this.schema,
          sourceObjects
        };
        const node2 = createNode.createNode(value2, tag, ctx);
        if (flow3 && identity.isCollection(node2))
          node2.flow = true;
        setAnchors();
        return node2;
      }
      /**
       * Convert a key and a value into a `Pair` using the current schema,
       * recursively wrapping all values as `Scalar` or `Collection` nodes.
       */
      createPair(key, value2, options = {}) {
        const k = this.createNode(key, null, options);
        const v = this.createNode(value2, null, options);
        return new Pair.Pair(k, v);
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        return assertCollection(this.contents) ? this.contents.delete(key) : false;
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path2) {
        if (Collection.isEmptyPath(path2)) {
          if (this.contents == null)
            return false;
          this.contents = null;
          return true;
        }
        return assertCollection(this.contents) ? this.contents.deleteIn(path2) : false;
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      get(key, keepScalar) {
        return identity.isCollection(this.contents) ? this.contents.get(key, keepScalar) : void 0;
      }
      /**
       * Returns item at `path`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path2, keepScalar) {
        if (Collection.isEmptyPath(path2))
          return !keepScalar && identity.isScalar(this.contents) ? this.contents.value : this.contents;
        return identity.isCollection(this.contents) ? this.contents.getIn(path2, keepScalar) : void 0;
      }
      /**
       * Checks if the document includes a value with the key `key`.
       */
      has(key) {
        return identity.isCollection(this.contents) ? this.contents.has(key) : false;
      }
      /**
       * Checks if the document includes a value at `path`.
       */
      hasIn(path2) {
        if (Collection.isEmptyPath(path2))
          return this.contents !== void 0;
        return identity.isCollection(this.contents) ? this.contents.hasIn(path2) : false;
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      set(key, value2) {
        if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, [key], value2);
        } else if (assertCollection(this.contents)) {
          this.contents.set(key, value2);
        }
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path2, value2) {
        if (Collection.isEmptyPath(path2)) {
          this.contents = value2;
        } else if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, Array.from(path2), value2);
        } else if (assertCollection(this.contents)) {
          this.contents.setIn(path2, value2);
        }
      }
      /**
       * Change the YAML version and schema used by the document.
       * A `null` version disables support for directives, explicit tags, anchors, and aliases.
       * It also requires the `schema` option to be given as a `Schema` instance value.
       *
       * Overrides all previously set schema options.
       */
      setSchema(version, options = {}) {
        if (typeof version === "number")
          version = String(version);
        let opt;
        switch (version) {
          case "1.1":
            if (this.directives)
              this.directives.yaml.version = "1.1";
            else
              this.directives = new directives.Directives({ version: "1.1" });
            opt = { resolveKnownTags: false, schema: "yaml-1.1" };
            break;
          case "1.2":
          case "next":
            if (this.directives)
              this.directives.yaml.version = version;
            else
              this.directives = new directives.Directives({ version });
            opt = { resolveKnownTags: true, schema: "core" };
            break;
          case null:
            if (this.directives)
              delete this.directives;
            opt = null;
            break;
          default: {
            const sv = JSON.stringify(version);
            throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
          }
        }
        if (options.schema instanceof Object)
          this.schema = options.schema;
        else if (opt)
          this.schema = new Schema.Schema(Object.assign(opt, options));
        else
          throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
      }
      // json & jsonArg are only used from toJSON()
      toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc: this,
          keep: !json,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this.contents, jsonArg ?? "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
      /**
       * A JSON representation of the document `contents`.
       *
       * @param jsonArg Used by `JSON.stringify` to indicate the array index or
       *   property name.
       */
      toJSON(jsonArg, onAnchor) {
        return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
      }
      /** A YAML representation of the document. */
      toString(options = {}) {
        if (this.errors.length > 0)
          throw new Error("Document with errors cannot be stringified");
        if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
          const s = JSON.stringify(options.indent);
          throw new Error(`"indent" option must be a positive integer, not ${s}`);
        }
        return stringifyDocument.stringifyDocument(this, options);
      }
    };
    function assertCollection(contents) {
      if (identity.isCollection(contents))
        return true;
      throw new Error("Expected a YAML collection as document contents");
    }
    exports.Document = Document;
  }
});

// node_modules/yaml/dist/errors.js
var require_errors = __commonJS({
  "node_modules/yaml/dist/errors.js"(exports) {
    "use strict";
    var YAMLError = class extends Error {
      constructor(name, pos, code2, message) {
        super();
        this.name = name;
        this.code = code2;
        this.message = message;
        this.pos = pos;
      }
    };
    var YAMLParseError = class extends YAMLError {
      constructor(pos, code2, message) {
        super("YAMLParseError", pos, code2, message);
      }
    };
    var YAMLWarning = class extends YAMLError {
      constructor(pos, code2, message) {
        super("YAMLWarning", pos, code2, message);
      }
    };
    var prettifyError = (src, lc) => (error) => {
      if (error.pos[0] === -1)
        return;
      error.linePos = error.pos.map((pos) => lc.linePos(pos));
      const { line, col } = error.linePos[0];
      error.message += ` at line ${line}, column ${col}`;
      let ci = col - 1;
      let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
      if (ci >= 60 && lineStr.length > 80) {
        const trimStart = Math.min(ci - 39, lineStr.length - 79);
        lineStr = "\u2026" + lineStr.substring(trimStart);
        ci -= trimStart - 1;
      }
      if (lineStr.length > 80)
        lineStr = lineStr.substring(0, 79) + "\u2026";
      if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
        let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
        if (prev.length > 80)
          prev = prev.substring(0, 79) + "\u2026\n";
        lineStr = prev + lineStr;
      }
      if (/[^ ]/.test(lineStr)) {
        let count = 1;
        const end = error.linePos[1];
        if (end?.line === line && end.col > col) {
          count = Math.max(1, Math.min(end.col - col, 80 - ci));
        }
        const pointer = " ".repeat(ci) + "^".repeat(count);
        error.message += `:

${lineStr}
${pointer}
`;
      }
    };
    exports.YAMLError = YAMLError;
    exports.YAMLParseError = YAMLParseError;
    exports.YAMLWarning = YAMLWarning;
    exports.prettifyError = prettifyError;
  }
});

// node_modules/yaml/dist/compose/resolve-props.js
var require_resolve_props = __commonJS({
  "node_modules/yaml/dist/compose/resolve-props.js"(exports) {
    "use strict";
    function resolveProps(tokens, { flow: flow3, indicator, next, offset, onError, parentIndent, startOnNewline }) {
      let spaceBefore = false;
      let atNewline = startOnNewline;
      let hasSpace = startOnNewline;
      let comment = "";
      let commentSep = "";
      let hasNewline = false;
      let reqSpace = false;
      let tab = null;
      let anchor = null;
      let tag = null;
      let newlineAfterProp = null;
      let comma = null;
      let found = null;
      let start = null;
      for (const token of tokens) {
        if (reqSpace) {
          if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
            onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
          reqSpace = false;
        }
        if (tab) {
          if (atNewline && token.type !== "comment" && token.type !== "newline") {
            onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
          }
          tab = null;
        }
        switch (token.type) {
          case "space":
            if (!flow3 && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("	")) {
              tab = token;
            }
            hasSpace = true;
            break;
          case "comment": {
            if (!hasSpace)
              onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
            const cb = token.source.substring(1) || " ";
            if (!comment)
              comment = cb;
            else
              comment += commentSep + cb;
            commentSep = "";
            atNewline = false;
            break;
          }
          case "newline":
            if (atNewline) {
              if (comment)
                comment += token.source;
              else if (!found || indicator !== "seq-item-ind")
                spaceBefore = true;
            } else
              commentSep += token.source;
            atNewline = true;
            hasNewline = true;
            if (anchor || tag)
              newlineAfterProp = token;
            hasSpace = true;
            break;
          case "anchor":
            if (anchor)
              onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
            if (token.source.endsWith(":"))
              onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
            anchor = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          case "tag": {
            if (tag)
              onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
            tag = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          }
          case indicator:
            if (anchor || tag)
              onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
            if (found)
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow3 ?? "collection"}`);
            found = token;
            atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
            hasSpace = false;
            break;
          case "comma":
            if (flow3) {
              if (comma)
                onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow3}`);
              comma = token;
              atNewline = false;
              hasSpace = false;
              break;
            }
          // else fallthrough
          default:
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
            atNewline = false;
            hasSpace = false;
        }
      }
      const last = tokens[tokens.length - 1];
      const end = last ? last.offset + last.source.length : offset;
      if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) {
        onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
      }
      if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq"))
        onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
      return {
        comma,
        found,
        spaceBefore,
        comment,
        hasNewline,
        anchor,
        tag,
        newlineAfterProp,
        end,
        start: start ?? end
      };
    }
    exports.resolveProps = resolveProps;
  }
});

// node_modules/yaml/dist/compose/util-contains-newline.js
var require_util_contains_newline = __commonJS({
  "node_modules/yaml/dist/compose/util-contains-newline.js"(exports) {
    "use strict";
    function containsNewline(key) {
      if (!key)
        return null;
      switch (key.type) {
        case "alias":
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          if (key.source.includes("\n"))
            return true;
          if (key.end) {
            for (const st of key.end)
              if (st.type === "newline")
                return true;
          }
          return false;
        case "flow-collection":
          for (const it of key.items) {
            for (const st of it.start)
              if (st.type === "newline")
                return true;
            if (it.sep) {
              for (const st of it.sep)
                if (st.type === "newline")
                  return true;
            }
            if (containsNewline(it.key) || containsNewline(it.value))
              return true;
          }
          return false;
        default:
          return true;
      }
    }
    exports.containsNewline = containsNewline;
  }
});

// node_modules/yaml/dist/compose/util-flow-indent-check.js
var require_util_flow_indent_check = __commonJS({
  "node_modules/yaml/dist/compose/util-flow-indent-check.js"(exports) {
    "use strict";
    var utilContainsNewline = require_util_contains_newline();
    function flowIndentCheck(indent2, fc, onError) {
      if (fc?.type === "flow-collection") {
        const end = fc.end[0];
        if (end.indent === indent2 && (end.source === "]" || end.source === "}") && utilContainsNewline.containsNewline(fc)) {
          const msg = "Flow end indicator should be more indented than parent";
          onError(end, "BAD_INDENT", msg, true);
        }
      }
    }
    exports.flowIndentCheck = flowIndentCheck;
  }
});

// node_modules/yaml/dist/compose/util-map-includes.js
var require_util_map_includes = __commonJS({
  "node_modules/yaml/dist/compose/util-map-includes.js"(exports) {
    "use strict";
    var identity = require_identity();
    function mapIncludes(ctx, items, search2) {
      const { uniqueKeys } = ctx.options;
      if (uniqueKeys === false)
        return false;
      const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a2, b) => a2 === b || identity.isScalar(a2) && identity.isScalar(b) && a2.value === b.value;
      return items.some((pair) => isEqual(pair.key, search2));
    }
    exports.mapIncludes = mapIncludes;
  }
});

// node_modules/yaml/dist/compose/resolve-block-map.js
var require_resolve_block_map = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-map.js"(exports) {
    "use strict";
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    var utilMapIncludes = require_util_map_includes();
    var startColMsg = "All mapping items must start at the same column";
    function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLMap.YAMLMap;
      const map = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      let offset = bm.offset;
      let commentEnd = null;
      for (const collItem of bm.items) {
        const { start, key, sep, value: value2 } = collItem;
        const keyProps = resolveProps.resolveProps(start, {
          indicator: "explicit-key-ind",
          next: key ?? sep?.[0],
          offset,
          onError,
          parentIndent: bm.indent,
          startOnNewline: true
        });
        const implicitKey = !keyProps.found;
        if (implicitKey) {
          if (key) {
            if (key.type === "block-seq")
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
            else if ("indent" in key && key.indent !== bm.indent)
              onError(offset, "BAD_INDENT", startColMsg);
          }
          if (!keyProps.anchor && !keyProps.tag && !sep) {
            commentEnd = keyProps.end;
            if (keyProps.comment) {
              if (map.comment)
                map.comment += "\n" + keyProps.comment;
              else
                map.comment = keyProps.comment;
            }
            continue;
          }
          if (keyProps.newlineAfterProp || utilContainsNewline.containsNewline(key)) {
            onError(key ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
          }
        } else if (keyProps.found?.indent !== bm.indent) {
          onError(offset, "BAD_INDENT", startColMsg);
        }
        ctx.atKey = true;
        const keyStart = keyProps.end;
        const keyNode = key ? composeNode(ctx, key, keyProps, onError) : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bm.indent, key, onError);
        ctx.atKey = false;
        if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
          onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
        const valueProps = resolveProps.resolveProps(sep ?? [], {
          indicator: "map-value-ind",
          next: value2,
          offset: keyNode.range[2],
          onError,
          parentIndent: bm.indent,
          startOnNewline: !key || key.type === "block-scalar"
        });
        offset = valueProps.end;
        if (valueProps.found) {
          if (implicitKey) {
            if (value2?.type === "block-map" && !valueProps.hasNewline)
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
            if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
              onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
          }
          const valueNode = value2 ? composeNode(ctx, value2, valueProps, onError) : composeEmptyNode(ctx, offset, sep, null, valueProps, onError);
          if (ctx.schema.compat)
            utilFlowIndentCheck.flowIndentCheck(bm.indent, value2, onError);
          offset = valueNode.range[2];
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        } else {
          if (implicitKey)
            onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
          if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        }
      }
      if (commentEnd && commentEnd < offset)
        onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
      map.range = [bm.offset, offset, commentEnd ?? offset];
      return map;
    }
    exports.resolveBlockMap = resolveBlockMap;
  }
});

// node_modules/yaml/dist/compose/resolve-block-seq.js
var require_resolve_block_seq = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-seq.js"(exports) {
    "use strict";
    var YAMLSeq = require_YAMLSeq();
    var resolveProps = require_resolve_props();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLSeq.YAMLSeq;
      const seq = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = bs.offset;
      let commentEnd = null;
      for (const { start, value: value2 } of bs.items) {
        const props = resolveProps.resolveProps(start, {
          indicator: "seq-item-ind",
          next: value2,
          offset,
          onError,
          parentIndent: bs.indent,
          startOnNewline: true
        });
        if (!props.found) {
          if (props.anchor || props.tag || value2) {
            if (value2?.type === "block-seq")
              onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
            else
              onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
          } else {
            commentEnd = props.end;
            if (props.comment)
              seq.comment = props.comment;
            continue;
          }
        }
        const node2 = value2 ? composeNode(ctx, value2, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bs.indent, value2, onError);
        offset = node2.range[2];
        seq.items.push(node2);
      }
      seq.range = [bs.offset, offset, commentEnd ?? offset];
      return seq;
    }
    exports.resolveBlockSeq = resolveBlockSeq;
  }
});

// node_modules/yaml/dist/compose/resolve-end.js
var require_resolve_end = __commonJS({
  "node_modules/yaml/dist/compose/resolve-end.js"(exports) {
    "use strict";
    function resolveEnd(end, offset, reqSpace, onError) {
      let comment = "";
      if (end) {
        let hasSpace = false;
        let sep = "";
        for (const token of end) {
          const { source, type } = token;
          switch (type) {
            case "space":
              hasSpace = true;
              break;
            case "comment": {
              if (reqSpace && !hasSpace)
                onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
              const cb = source.substring(1) || " ";
              if (!comment)
                comment = cb;
              else
                comment += sep + cb;
              sep = "";
              break;
            }
            case "newline":
              if (comment)
                sep += source;
              hasSpace = true;
              break;
            default:
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
          }
          offset += source.length;
        }
      }
      return { comment, offset };
    }
    exports.resolveEnd = resolveEnd;
  }
});

// node_modules/yaml/dist/compose/resolve-flow-collection.js
var require_resolve_flow_collection = __commonJS({
  "node_modules/yaml/dist/compose/resolve-flow-collection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilMapIncludes = require_util_map_includes();
    var blockMsg = "Block collections are not allowed within flow collections";
    var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
    function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
      const isMap = fc.start.source === "{";
      const fcName = isMap ? "flow map" : "flow sequence";
      const NodeClass = tag?.nodeClass ?? (isMap ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq);
      const coll = new NodeClass(ctx.schema);
      coll.flow = true;
      const atRoot = ctx.atRoot;
      if (atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = fc.offset + fc.start.source.length;
      for (let i = 0; i < fc.items.length; ++i) {
        const collItem = fc.items[i];
        const { start, key, sep, value: value2 } = collItem;
        const props = resolveProps.resolveProps(start, {
          flow: fcName,
          indicator: "explicit-key-ind",
          next: key ?? sep?.[0],
          offset,
          onError,
          parentIndent: fc.indent,
          startOnNewline: false
        });
        if (!props.found) {
          if (!props.anchor && !props.tag && !sep && !value2) {
            if (i === 0 && props.comma)
              onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
            else if (i < fc.items.length - 1)
              onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
            if (props.comment) {
              if (coll.comment)
                coll.comment += "\n" + props.comment;
              else
                coll.comment = props.comment;
            }
            offset = props.end;
            continue;
          }
          if (!isMap && ctx.options.strict && utilContainsNewline.containsNewline(key))
            onError(
              key,
              // checked by containsNewline()
              "MULTILINE_IMPLICIT_KEY",
              "Implicit keys of flow sequence pairs need to be on a single line"
            );
        }
        if (i === 0) {
          if (props.comma)
            onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
        } else {
          if (!props.comma)
            onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
          if (props.comment) {
            let prevItemComment = "";
            loop: for (const st of start) {
              switch (st.type) {
                case "comma":
                case "space":
                  break;
                case "comment":
                  prevItemComment = st.source.substring(1);
                  break loop;
                default:
                  break loop;
              }
            }
            if (prevItemComment) {
              let prev = coll.items[coll.items.length - 1];
              if (identity.isPair(prev))
                prev = prev.value ?? prev.key;
              if (prev.comment)
                prev.comment += "\n" + prevItemComment;
              else
                prev.comment = prevItemComment;
              props.comment = props.comment.substring(prevItemComment.length + 1);
            }
          }
        }
        if (!isMap && !sep && !props.found) {
          const valueNode = value2 ? composeNode(ctx, value2, props, onError) : composeEmptyNode(ctx, props.end, sep, null, props, onError);
          coll.items.push(valueNode);
          offset = valueNode.range[2];
          if (isBlock(value2))
            onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
        } else {
          ctx.atKey = true;
          const keyStart = props.end;
          const keyNode = key ? composeNode(ctx, key, props, onError) : composeEmptyNode(ctx, keyStart, start, null, props, onError);
          if (isBlock(key))
            onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
          ctx.atKey = false;
          const valueProps = resolveProps.resolveProps(sep ?? [], {
            flow: fcName,
            indicator: "map-value-ind",
            next: value2,
            offset: keyNode.range[2],
            onError,
            parentIndent: fc.indent,
            startOnNewline: false
          });
          if (valueProps.found) {
            if (!isMap && !props.found && ctx.options.strict) {
              if (sep)
                for (const st of sep) {
                  if (st === valueProps.found)
                    break;
                  if (st.type === "newline") {
                    onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                    break;
                  }
                }
              if (props.start < valueProps.found.offset - 1024)
                onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
            }
          } else if (value2) {
            if ("source" in value2 && value2.source?.[0] === ":")
              onError(value2, "MISSING_CHAR", `Missing space after : in ${fcName}`);
            else
              onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
          }
          const valueNode = value2 ? composeNode(ctx, value2, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep, null, valueProps, onError) : null;
          if (valueNode) {
            if (isBlock(value2))
              onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
          } else if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          if (isMap) {
            const map = coll;
            if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
              onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
            map.items.push(pair);
          } else {
            const map = new YAMLMap.YAMLMap(ctx.schema);
            map.flow = true;
            map.items.push(pair);
            const endRange = (valueNode ?? keyNode).range;
            map.range = [keyNode.range[0], endRange[1], endRange[2]];
            coll.items.push(map);
          }
          offset = valueNode ? valueNode.range[2] : valueProps.end;
        }
      }
      const expectedEnd = isMap ? "}" : "]";
      const [ce, ...ee] = fc.end;
      let cePos = offset;
      if (ce?.source === expectedEnd)
        cePos = ce.offset + ce.source.length;
      else {
        const name = fcName[0].toUpperCase() + fcName.substring(1);
        const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
        onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
        if (ce && ce.source.length !== 1)
          ee.unshift(ce);
      }
      if (ee.length > 0) {
        const end = resolveEnd.resolveEnd(ee, cePos, ctx.options.strict, onError);
        if (end.comment) {
          if (coll.comment)
            coll.comment += "\n" + end.comment;
          else
            coll.comment = end.comment;
        }
        coll.range = [fc.offset, cePos, end.offset];
      } else {
        coll.range = [fc.offset, cePos, cePos];
      }
      return coll;
    }
    exports.resolveFlowCollection = resolveFlowCollection;
  }
});

// node_modules/yaml/dist/compose/compose-collection.js
var require_compose_collection = __commonJS({
  "node_modules/yaml/dist/compose/compose-collection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveBlockMap = require_resolve_block_map();
    var resolveBlockSeq = require_resolve_block_seq();
    var resolveFlowCollection = require_resolve_flow_collection();
    function resolveCollection(CN, ctx, token, onError, tagName, tag) {
      const coll = token.type === "block-map" ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
      const Coll = coll.constructor;
      if (tagName === "!" || tagName === Coll.tagName) {
        coll.tag = Coll.tagName;
        return coll;
      }
      if (tagName)
        coll.tag = tagName;
      return coll;
    }
    function composeCollection(CN, ctx, token, props, onError) {
      const tagToken = props.tag;
      const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
      if (token.type === "block-seq") {
        const { anchor, newlineAfterProp: nl } = props;
        const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor ?? tagToken;
        if (lastProp && (!nl || nl.offset < lastProp.offset)) {
          const message = "Missing newline after block sequence props";
          onError(lastProp, "MISSING_CHAR", message);
        }
      }
      const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
      if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.YAMLSeq.tagName && expType === "seq") {
        return resolveCollection(CN, ctx, token, onError, tagName);
      }
      let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
      if (!tag) {
        const kt = ctx.schema.knownTags[tagName];
        if (kt?.collection === expType) {
          ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
          tag = kt;
        } else {
          if (kt) {
            onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`, true);
          } else {
            onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
          }
          return resolveCollection(CN, ctx, token, onError, tagName);
        }
      }
      const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
      const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
      const node2 = identity.isNode(res) ? res : new Scalar.Scalar(res);
      node2.range = coll.range;
      node2.tag = tagName;
      if (tag?.format)
        node2.format = tag.format;
      return node2;
    }
    exports.composeCollection = composeCollection;
  }
});

// node_modules/yaml/dist/compose/resolve-block-scalar.js
var require_resolve_block_scalar = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-scalar.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    function resolveBlockScalar(ctx, scalar, onError) {
      const start = scalar.offset;
      const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
      if (!header)
        return { value: "", type: null, comment: "", range: [start, start, start] };
      const type = header.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
      const lines = scalar.source ? splitLines(scalar.source) : [];
      let chompStart = lines.length;
      for (let i = lines.length - 1; i >= 0; --i) {
        const content3 = lines[i][1];
        if (content3 === "" || content3 === "\r")
          chompStart = i;
        else
          break;
      }
      if (chompStart === 0) {
        const value3 = header.chomp === "+" && lines.length > 0 ? "\n".repeat(Math.max(1, lines.length - 1)) : "";
        let end2 = start + header.length;
        if (scalar.source)
          end2 += scalar.source.length;
        return { value: value3, type, comment: header.comment, range: [start, end2, end2] };
      }
      let trimIndent = scalar.indent + header.indent;
      let offset = scalar.offset + header.length;
      let contentStart = 0;
      for (let i = 0; i < chompStart; ++i) {
        const [indent2, content3] = lines[i];
        if (content3 === "" || content3 === "\r") {
          if (header.indent === 0 && indent2.length > trimIndent)
            trimIndent = indent2.length;
        } else {
          if (indent2.length < trimIndent) {
            const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
            onError(offset + indent2.length, "MISSING_CHAR", message);
          }
          if (header.indent === 0)
            trimIndent = indent2.length;
          contentStart = i;
          if (trimIndent === 0 && !ctx.atRoot) {
            const message = "Block scalar values in collections must be indented";
            onError(offset, "BAD_INDENT", message);
          }
          break;
        }
        offset += indent2.length + content3.length + 1;
      }
      for (let i = lines.length - 1; i >= chompStart; --i) {
        if (lines[i][0].length > trimIndent)
          chompStart = i + 1;
      }
      let value2 = "";
      let sep = "";
      let prevMoreIndented = false;
      for (let i = 0; i < contentStart; ++i)
        value2 += lines[i][0].slice(trimIndent) + "\n";
      for (let i = contentStart; i < chompStart; ++i) {
        let [indent2, content3] = lines[i];
        offset += indent2.length + content3.length + 1;
        const crlf = content3[content3.length - 1] === "\r";
        if (crlf)
          content3 = content3.slice(0, -1);
        if (content3 && indent2.length < trimIndent) {
          const src = header.indent ? "explicit indentation indicator" : "first line";
          const message = `Block scalar lines must not be less indented than their ${src}`;
          onError(offset - content3.length - (crlf ? 2 : 1), "BAD_INDENT", message);
          indent2 = "";
        }
        if (type === Scalar.Scalar.BLOCK_LITERAL) {
          value2 += sep + indent2.slice(trimIndent) + content3;
          sep = "\n";
        } else if (indent2.length > trimIndent || content3[0] === "	") {
          if (sep === " ")
            sep = "\n";
          else if (!prevMoreIndented && sep === "\n")
            sep = "\n\n";
          value2 += sep + indent2.slice(trimIndent) + content3;
          sep = "\n";
          prevMoreIndented = true;
        } else if (content3 === "") {
          if (sep === "\n")
            value2 += "\n";
          else
            sep = "\n";
        } else {
          value2 += sep + content3;
          sep = " ";
          prevMoreIndented = false;
        }
      }
      switch (header.chomp) {
        case "-":
          break;
        case "+":
          for (let i = chompStart; i < lines.length; ++i)
            value2 += "\n" + lines[i][0].slice(trimIndent);
          if (value2[value2.length - 1] !== "\n")
            value2 += "\n";
          break;
        default:
          value2 += "\n";
      }
      const end = start + header.length + scalar.source.length;
      return { value: value2, type, comment: header.comment, range: [start, end, end] };
    }
    function parseBlockScalarHeader({ offset, props }, strict, onError) {
      if (props[0].type !== "block-scalar-header") {
        onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
        return null;
      }
      const { source } = props[0];
      const mode = source[0];
      let indent2 = 0;
      let chomp = "";
      let error = -1;
      for (let i = 1; i < source.length; ++i) {
        const ch = source[i];
        if (!chomp && (ch === "-" || ch === "+"))
          chomp = ch;
        else {
          const n = Number(ch);
          if (!indent2 && n)
            indent2 = n;
          else if (error === -1)
            error = offset + i;
        }
      }
      if (error !== -1)
        onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
      let hasSpace = false;
      let comment = "";
      let length = source.length;
      for (let i = 1; i < props.length; ++i) {
        const token = props[i];
        switch (token.type) {
          case "space":
            hasSpace = true;
          // fallthrough
          case "newline":
            length += token.source.length;
            break;
          case "comment":
            if (strict && !hasSpace) {
              const message = "Comments must be separated from other tokens by white space characters";
              onError(token, "MISSING_CHAR", message);
            }
            length += token.source.length;
            comment = token.source.substring(1);
            break;
          case "error":
            onError(token, "UNEXPECTED_TOKEN", token.message);
            length += token.source.length;
            break;
          /* istanbul ignore next should not happen */
          default: {
            const message = `Unexpected token in block scalar header: ${token.type}`;
            onError(token, "UNEXPECTED_TOKEN", message);
            const ts = token.source;
            if (ts && typeof ts === "string")
              length += ts.length;
          }
        }
      }
      return { mode, indent: indent2, chomp, comment, length };
    }
    function splitLines(source) {
      const split = source.split(/\n( *)/);
      const first = split[0];
      const m = first.match(/^( *)/);
      const line0 = m?.[1] ? [m[1], first.slice(m[1].length)] : ["", first];
      const lines = [line0];
      for (let i = 1; i < split.length; i += 2)
        lines.push([split[i], split[i + 1]]);
      return lines;
    }
    exports.resolveBlockScalar = resolveBlockScalar;
  }
});

// node_modules/yaml/dist/compose/resolve-flow-scalar.js
var require_resolve_flow_scalar = __commonJS({
  "node_modules/yaml/dist/compose/resolve-flow-scalar.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var resolveEnd = require_resolve_end();
    function resolveFlowScalar(scalar, strict, onError) {
      const { offset, type, source, end } = scalar;
      let _type;
      let value2;
      const _onError = (rel, code2, msg) => onError(offset + rel, code2, msg);
      switch (type) {
        case "scalar":
          _type = Scalar.Scalar.PLAIN;
          value2 = plainValue(source, _onError);
          break;
        case "single-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_SINGLE;
          value2 = singleQuotedValue(source, _onError);
          break;
        case "double-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_DOUBLE;
          value2 = doubleQuotedValue(source, _onError);
          break;
        /* istanbul ignore next should not happen */
        default:
          onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
          return {
            value: "",
            type: null,
            comment: "",
            range: [offset, offset + source.length, offset + source.length]
          };
      }
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, strict, onError);
      return {
        value: value2,
        type: _type,
        comment: re.comment,
        range: [offset, valueEnd, re.offset]
      };
    }
    function plainValue(source, onError) {
      let badChar = "";
      switch (source[0]) {
        /* istanbul ignore next should not happen */
        case "	":
          badChar = "a tab character";
          break;
        case ",":
          badChar = "flow indicator character ,";
          break;
        case "%":
          badChar = "directive indicator character %";
          break;
        case "|":
        case ">": {
          badChar = `block scalar indicator ${source[0]}`;
          break;
        }
        case "@":
        case "`": {
          badChar = `reserved character ${source[0]}`;
          break;
        }
      }
      if (badChar)
        onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
      return unfoldLines(source);
    }
    function singleQuotedValue(source, onError) {
      if (source[source.length - 1] !== "'" || source.length === 1)
        onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
      return unfoldLines(source.slice(1, -1)).replace(/''/g, "'");
    }
    function unfoldLines(source) {
      const line = /(.*?)\r?\n/sy;
      let match = line.exec(source);
      if (!match)
        return source;
      let trimEnd, trimBoth;
      try {
        trimEnd = new RegExp("(?<![ 	])[ 	]+$");
        trimBoth = new RegExp("^[ 	]+|(?<![ 	])[ 	]+$", "g");
      } catch {
        trimEnd = /[ \t]+$/;
        trimBoth = /^[ \t]+|[ \t]+$/g;
      }
      let res = match[1].replace(trimEnd, "");
      let sep = " ";
      let pos = line.lastIndex;
      while (match = line.exec(source)) {
        const lm = match[1].replace(trimBoth, "");
        if (lm === "") {
          if (sep === "\n")
            res += sep;
          else
            sep = "\n";
        } else {
          res += sep + lm;
          sep = " ";
        }
        pos = line.lastIndex;
      }
      const last = /[ \t]*(.*)/sy;
      last.lastIndex = pos;
      match = last.exec(source);
      return res + sep + (match?.[1] ?? "");
    }
    function doubleQuotedValue(source, onError) {
      let res = "";
      for (let i = 1; i < source.length - 1; ++i) {
        const ch = source[i];
        if (ch === "\r" && source[i + 1] === "\n")
          continue;
        if (ch === "\n") {
          const { fold, offset } = foldNewline(source, i);
          res += fold;
          i = offset;
        } else if (ch === "\\") {
          let next = source[++i];
          const cc = escapeCodes[next];
          if (cc)
            res += cc;
          else if (next === "\n") {
            next = source[i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "\r" && source[i + 1] === "\n") {
            next = source[++i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "x" || next === "u" || next === "U") {
            const length = next === "x" ? 2 : next === "u" ? 4 : 8;
            res += parseCharCode(source, i + 1, length, onError);
            i += length;
          } else {
            const raw = source.substr(i - 1, 2);
            onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
            res += raw;
          }
        } else if (ch === " " || ch === "	") {
          const wsStart = i;
          let next = source[i + 1];
          while (next === " " || next === "	")
            next = source[++i + 1];
          if (next !== "\n" && !(next === "\r" && source[i + 2] === "\n"))
            res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
        } else {
          res += ch;
        }
      }
      if (source[source.length - 1] !== '"' || source.length === 1)
        onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
      return res;
    }
    function foldNewline(source, offset) {
      let fold = "";
      let ch = source[offset + 1];
      while (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
        if (ch === "\r" && source[offset + 2] !== "\n")
          break;
        if (ch === "\n")
          fold += "\n";
        offset += 1;
        ch = source[offset + 1];
      }
      if (!fold)
        fold = " ";
      return { fold, offset };
    }
    var escapeCodes = {
      "0": "\0",
      // null character
      a: "\x07",
      // bell character
      b: "\b",
      // backspace
      e: "\x1B",
      // escape character
      f: "\f",
      // form feed
      n: "\n",
      // line feed
      r: "\r",
      // carriage return
      t: "	",
      // horizontal tab
      v: "\v",
      // vertical tab
      N: "\x85",
      // Unicode next line
      _: "\xA0",
      // Unicode non-breaking space
      L: "\u2028",
      // Unicode line separator
      P: "\u2029",
      // Unicode paragraph separator
      " ": " ",
      '"': '"',
      "/": "/",
      "\\": "\\",
      "	": "	"
    };
    function parseCharCode(source, offset, length, onError) {
      const cc = source.substr(offset, length);
      const ok3 = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
      const code2 = ok3 ? parseInt(cc, 16) : NaN;
      try {
        return String.fromCodePoint(code2);
      } catch {
        const raw = source.substr(offset - 2, length + 2);
        onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
        return raw;
      }
    }
    exports.resolveFlowScalar = resolveFlowScalar;
  }
});

// node_modules/yaml/dist/compose/compose-scalar.js
var require_compose_scalar = __commonJS({
  "node_modules/yaml/dist/compose/compose-scalar.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    function composeScalar(ctx, token, tagToken, onError) {
      const { value: value2, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar.resolveBlockScalar(ctx, token, onError) : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
      const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
      let tag;
      if (ctx.options.stringKeys && ctx.atKey) {
        tag = ctx.schema[identity.SCALAR];
      } else if (tagName)
        tag = findScalarTagByName(ctx.schema, value2, tagName, tagToken, onError);
      else if (token.type === "scalar")
        tag = findScalarTagByTest(ctx, value2, token, onError);
      else
        tag = ctx.schema[identity.SCALAR];
      let scalar;
      try {
        const res = tag.resolve(value2, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
        scalar = identity.isScalar(res) ? res : new Scalar.Scalar(res);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
        scalar = new Scalar.Scalar(value2);
      }
      scalar.range = range;
      scalar.source = value2;
      if (type)
        scalar.type = type;
      if (tagName)
        scalar.tag = tagName;
      if (tag.format)
        scalar.format = tag.format;
      if (comment)
        scalar.comment = comment;
      return scalar;
    }
    function findScalarTagByName(schema, value2, tagName, tagToken, onError) {
      if (tagName === "!")
        return schema[identity.SCALAR];
      const matchWithTest = [];
      for (const tag of schema.tags) {
        if (!tag.collection && tag.tag === tagName) {
          if (tag.default && tag.test)
            matchWithTest.push(tag);
          else
            return tag;
        }
      }
      for (const tag of matchWithTest)
        if (tag.test?.test(value2))
          return tag;
      const kt = schema.knownTags[tagName];
      if (kt && !kt.collection) {
        schema.tags.push(Object.assign({}, kt, { default: false, test: void 0 }));
        return kt;
      }
      onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
      return schema[identity.SCALAR];
    }
    function findScalarTagByTest({ atKey, directives, schema }, value2, token, onError) {
      const tag = schema.tags.find((tag2) => (tag2.default === true || atKey && tag2.default === "key") && tag2.test?.test(value2)) || schema[identity.SCALAR];
      if (schema.compat) {
        const compat = schema.compat.find((tag2) => tag2.default && tag2.test?.test(value2)) ?? schema[identity.SCALAR];
        if (tag.tag !== compat.tag) {
          const ts = directives.tagString(tag.tag);
          const cs = directives.tagString(compat.tag);
          const msg = `Value may be parsed as either ${ts} or ${cs}`;
          onError(token, "TAG_RESOLVE_FAILED", msg, true);
        }
      }
      return tag;
    }
    exports.composeScalar = composeScalar;
  }
});

// node_modules/yaml/dist/compose/util-empty-scalar-position.js
var require_util_empty_scalar_position = __commonJS({
  "node_modules/yaml/dist/compose/util-empty-scalar-position.js"(exports) {
    "use strict";
    function emptyScalarPosition(offset, before, pos) {
      if (before) {
        pos ?? (pos = before.length);
        for (let i = pos - 1; i >= 0; --i) {
          let st = before[i];
          switch (st.type) {
            case "space":
            case "comment":
            case "newline":
              offset -= st.source.length;
              continue;
          }
          st = before[++i];
          while (st?.type === "space") {
            offset += st.source.length;
            st = before[++i];
          }
          break;
        }
      }
      return offset;
    }
    exports.emptyScalarPosition = emptyScalarPosition;
  }
});

// node_modules/yaml/dist/compose/compose-node.js
var require_compose_node = __commonJS({
  "node_modules/yaml/dist/compose/compose-node.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var composeCollection = require_compose_collection();
    var composeScalar = require_compose_scalar();
    var resolveEnd = require_resolve_end();
    var utilEmptyScalarPosition = require_util_empty_scalar_position();
    var CN = { composeNode, composeEmptyNode };
    function composeNode(ctx, token, props, onError) {
      const atKey = ctx.atKey;
      const { spaceBefore, comment, anchor, tag } = props;
      let node2;
      let isSrcToken = true;
      switch (token.type) {
        case "alias":
          node2 = composeAlias(ctx, token, onError);
          if (anchor || tag)
            onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
          break;
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "block-scalar":
          node2 = composeScalar.composeScalar(ctx, token, tag, onError);
          if (anchor)
            node2.anchor = anchor.source.substring(1);
          break;
        case "block-map":
        case "block-seq":
        case "flow-collection":
          try {
            node2 = composeCollection.composeCollection(CN, ctx, token, props, onError);
            if (anchor)
              node2.anchor = anchor.source.substring(1);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            onError(token, "RESOURCE_EXHAUSTION", message);
          }
          break;
        default: {
          const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
          onError(token, "UNEXPECTED_TOKEN", message);
          isSrcToken = false;
        }
      }
      node2 ?? (node2 = composeEmptyNode(ctx, token.offset, void 0, null, props, onError));
      if (anchor && node2.anchor === "")
        onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      if (atKey && ctx.options.stringKeys && (!identity.isScalar(node2) || typeof node2.value !== "string" || node2.tag && node2.tag !== "tag:yaml.org,2002:str")) {
        const msg = "With stringKeys, all keys must be strings";
        onError(tag ?? token, "NON_STRING_KEY", msg);
      }
      if (spaceBefore)
        node2.spaceBefore = true;
      if (comment) {
        if (token.type === "scalar" && token.source === "")
          node2.comment = comment;
        else
          node2.commentBefore = comment;
      }
      if (ctx.options.keepSourceTokens && isSrcToken)
        node2.srcToken = token;
      return node2;
    }
    function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
      const token = {
        type: "scalar",
        offset: utilEmptyScalarPosition.emptyScalarPosition(offset, before, pos),
        indent: -1,
        source: ""
      };
      const node2 = composeScalar.composeScalar(ctx, token, tag, onError);
      if (anchor) {
        node2.anchor = anchor.source.substring(1);
        if (node2.anchor === "")
          onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      }
      if (spaceBefore)
        node2.spaceBefore = true;
      if (comment) {
        node2.comment = comment;
        node2.range[2] = end;
      }
      return node2;
    }
    function composeAlias({ options }, { offset, source, end }, onError) {
      const alias = new Alias.Alias(source.substring(1));
      if (alias.source === "")
        onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
      if (alias.source.endsWith(":"))
        onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, options.strict, onError);
      alias.range = [offset, valueEnd, re.offset];
      if (re.comment)
        alias.comment = re.comment;
      return alias;
    }
    exports.composeEmptyNode = composeEmptyNode;
    exports.composeNode = composeNode;
  }
});

// node_modules/yaml/dist/compose/compose-doc.js
var require_compose_doc = __commonJS({
  "node_modules/yaml/dist/compose/compose-doc.js"(exports) {
    "use strict";
    var Document = require_Document();
    var composeNode = require_compose_node();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    function composeDoc(options, directives, { offset, start, value: value2, end }, onError) {
      const opts = Object.assign({ _directives: directives }, options);
      const doc = new Document.Document(void 0, opts);
      const ctx = {
        atKey: false,
        atRoot: true,
        directives: doc.directives,
        options: doc.options,
        schema: doc.schema
      };
      const props = resolveProps.resolveProps(start, {
        indicator: "doc-start",
        next: value2 ?? end?.[0],
        offset,
        onError,
        parentIndent: 0,
        startOnNewline: true
      });
      if (props.found) {
        doc.directives.docStart = true;
        if (value2 && (value2.type === "block-map" || value2.type === "block-seq") && !props.hasNewline)
          onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
      }
      doc.contents = value2 ? composeNode.composeNode(ctx, value2, props, onError) : composeNode.composeEmptyNode(ctx, props.end, start, null, props, onError);
      const contentEnd = doc.contents.range[2];
      const re = resolveEnd.resolveEnd(end, contentEnd, false, onError);
      if (re.comment)
        doc.comment = re.comment;
      doc.range = [offset, contentEnd, re.offset];
      return doc;
    }
    exports.composeDoc = composeDoc;
  }
});

// node_modules/yaml/dist/compose/composer.js
var require_composer = __commonJS({
  "node_modules/yaml/dist/compose/composer.js"(exports) {
    "use strict";
    var node_process = __require("process");
    var directives = require_directives();
    var Document = require_Document();
    var errors = require_errors();
    var identity = require_identity();
    var composeDoc = require_compose_doc();
    var resolveEnd = require_resolve_end();
    function getErrorPos(src) {
      if (typeof src === "number")
        return [src, src + 1];
      if (Array.isArray(src))
        return src.length === 2 ? src : [src[0], src[1]];
      const { offset, source } = src;
      return [offset, offset + (typeof source === "string" ? source.length : 1)];
    }
    function parsePrelude(prelude) {
      let comment = "";
      let atComment = false;
      let afterEmptyLine = false;
      for (let i = 0; i < prelude.length; ++i) {
        const source = prelude[i];
        switch (source[0]) {
          case "#":
            comment += (comment === "" ? "" : afterEmptyLine ? "\n\n" : "\n") + (source.substring(1) || " ");
            atComment = true;
            afterEmptyLine = false;
            break;
          case "%":
            if (prelude[i + 1]?.[0] !== "#")
              i += 1;
            atComment = false;
            break;
          default:
            if (!atComment)
              afterEmptyLine = true;
            atComment = false;
        }
      }
      return { comment, afterEmptyLine };
    }
    var Composer = class {
      constructor(options = {}) {
        this.doc = null;
        this.atDirectives = false;
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
        this.onError = (source, code2, message, warning) => {
          const pos = getErrorPos(source);
          if (warning)
            this.warnings.push(new errors.YAMLWarning(pos, code2, message));
          else
            this.errors.push(new errors.YAMLParseError(pos, code2, message));
        };
        this.directives = new directives.Directives({ version: options.version || "1.2" });
        this.options = options;
      }
      decorate(doc, afterDoc) {
        const { comment, afterEmptyLine } = parsePrelude(this.prelude);
        if (comment) {
          const dc = doc.contents;
          if (afterDoc) {
            doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
          } else if (afterEmptyLine || doc.directives.docStart || !dc) {
            doc.commentBefore = comment;
          } else if (identity.isCollection(dc) && !dc.flow && dc.items.length > 0) {
            let it = dc.items[0];
            if (identity.isPair(it))
              it = it.key;
            const cb = it.commentBefore;
            it.commentBefore = cb ? `${comment}
${cb}` : comment;
          } else {
            const cb = dc.commentBefore;
            dc.commentBefore = cb ? `${comment}
${cb}` : comment;
          }
        }
        if (afterDoc) {
          for (let i = 0; i < this.errors.length; ++i)
            doc.errors.push(this.errors[i]);
          for (let i = 0; i < this.warnings.length; ++i)
            doc.warnings.push(this.warnings[i]);
        } else {
          doc.errors = this.errors;
          doc.warnings = this.warnings;
        }
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
      }
      /**
       * Current stream status information.
       *
       * Mostly useful at the end of input for an empty stream.
       */
      streamInfo() {
        return {
          comment: parsePrelude(this.prelude).comment,
          directives: this.directives,
          errors: this.errors,
          warnings: this.warnings
        };
      }
      /**
       * Compose tokens into documents.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *compose(tokens, forceDoc = false, endOffset = -1) {
        for (const token of tokens)
          yield* this.next(token);
        yield* this.end(forceDoc, endOffset);
      }
      /** Advance the composer by one CST token. */
      *next(token) {
        if (node_process.env.LOG_STREAM)
          console.dir(token, { depth: null });
        switch (token.type) {
          case "directive":
            this.directives.add(token.source, (offset, message, warning) => {
              const pos = getErrorPos(token);
              pos[0] += offset;
              this.onError(pos, "BAD_DIRECTIVE", message, warning);
            });
            this.prelude.push(token.source);
            this.atDirectives = true;
            break;
          case "document": {
            const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
            if (this.atDirectives && !doc.directives.docStart)
              this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
            this.decorate(doc, false);
            if (this.doc)
              yield this.doc;
            this.doc = doc;
            this.atDirectives = false;
            break;
          }
          case "byte-order-mark":
          case "space":
            break;
          case "comment":
          case "newline":
            this.prelude.push(token.source);
            break;
          case "error": {
            const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
            const error = new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
            if (this.atDirectives || !this.doc)
              this.errors.push(error);
            else
              this.doc.errors.push(error);
            break;
          }
          case "doc-end": {
            if (!this.doc) {
              const msg = "Unexpected doc-end without preceding document";
              this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
              break;
            }
            this.doc.directives.docEnd = true;
            const end = resolveEnd.resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
            this.decorate(this.doc, true);
            if (end.comment) {
              const dc = this.doc.comment;
              this.doc.comment = dc ? `${dc}
${end.comment}` : end.comment;
            }
            this.doc.range[2] = end.offset;
            break;
          }
          default:
            this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
        }
      }
      /**
       * Call at end of input to yield any remaining document.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *end(forceDoc = false, endOffset = -1) {
        if (this.doc) {
          this.decorate(this.doc, true);
          yield this.doc;
          this.doc = null;
        } else if (forceDoc) {
          const opts = Object.assign({ _directives: this.directives }, this.options);
          const doc = new Document.Document(void 0, opts);
          if (this.atDirectives)
            this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
          doc.range = [0, endOffset, endOffset];
          this.decorate(doc, false);
          yield doc;
        }
      }
    };
    exports.Composer = Composer;
  }
});

// node_modules/yaml/dist/parse/cst-scalar.js
var require_cst_scalar = __commonJS({
  "node_modules/yaml/dist/parse/cst-scalar.js"(exports) {
    "use strict";
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    var errors = require_errors();
    var stringifyString = require_stringifyString();
    function resolveAsScalar(token, strict = true, onError) {
      if (token) {
        const _onError = (pos, code2, message) => {
          const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
          if (onError)
            onError(offset, code2, message);
          else
            throw new errors.YAMLParseError([offset, offset + 1], code2, message);
        };
        switch (token.type) {
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
          case "block-scalar":
            return resolveBlockScalar.resolveBlockScalar({ options: { strict } }, token, _onError);
        }
      }
      return null;
    }
    function createScalarToken(value2, context) {
      const { implicitKey = false, indent: indent2, inFlow = false, offset = -1, type = "PLAIN" } = context;
      const source = stringifyString.stringifyString({ type, value: value2 }, {
        implicitKey,
        indent: indent2 > 0 ? " ".repeat(indent2) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      const end = context.end ?? [
        { type: "newline", offset: -1, indent: indent2, source: "\n" }
      ];
      switch (source[0]) {
        case "|":
        case ">": {
          const he = source.indexOf("\n");
          const head = source.substring(0, he);
          const body = source.substring(he + 1) + "\n";
          const props = [
            { type: "block-scalar-header", offset, indent: indent2, source: head }
          ];
          if (!addEndtoBlockProps(props, end))
            props.push({ type: "newline", offset: -1, indent: indent2, source: "\n" });
          return { type: "block-scalar", offset, indent: indent2, props, source: body };
        }
        case '"':
          return { type: "double-quoted-scalar", offset, indent: indent2, source, end };
        case "'":
          return { type: "single-quoted-scalar", offset, indent: indent2, source, end };
        default:
          return { type: "scalar", offset, indent: indent2, source, end };
      }
    }
    function setScalarValue(token, value2, context = {}) {
      let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
      let indent2 = "indent" in token ? token.indent : null;
      if (afterKey && typeof indent2 === "number")
        indent2 += 2;
      if (!type)
        switch (token.type) {
          case "single-quoted-scalar":
            type = "QUOTE_SINGLE";
            break;
          case "double-quoted-scalar":
            type = "QUOTE_DOUBLE";
            break;
          case "block-scalar": {
            const header = token.props[0];
            if (header.type !== "block-scalar-header")
              throw new Error("Invalid block scalar header");
            type = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
            break;
          }
          default:
            type = "PLAIN";
        }
      const source = stringifyString.stringifyString({ type, value: value2 }, {
        implicitKey: implicitKey || indent2 === null,
        indent: indent2 !== null && indent2 > 0 ? " ".repeat(indent2) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      switch (source[0]) {
        case "|":
        case ">":
          setBlockScalarValue(token, source);
          break;
        case '"':
          setFlowScalarValue(token, source, "double-quoted-scalar");
          break;
        case "'":
          setFlowScalarValue(token, source, "single-quoted-scalar");
          break;
        default:
          setFlowScalarValue(token, source, "scalar");
      }
    }
    function setBlockScalarValue(token, source) {
      const he = source.indexOf("\n");
      const head = source.substring(0, he);
      const body = source.substring(he + 1) + "\n";
      if (token.type === "block-scalar") {
        const header = token.props[0];
        if (header.type !== "block-scalar-header")
          throw new Error("Invalid block scalar header");
        header.source = head;
        token.source = body;
      } else {
        const { offset } = token;
        const indent2 = "indent" in token ? token.indent : -1;
        const props = [
          { type: "block-scalar-header", offset, indent: indent2, source: head }
        ];
        if (!addEndtoBlockProps(props, "end" in token ? token.end : void 0))
          props.push({ type: "newline", offset: -1, indent: indent2, source: "\n" });
        for (const key of Object.keys(token))
          if (key !== "type" && key !== "offset")
            delete token[key];
        Object.assign(token, { type: "block-scalar", indent: indent2, props, source: body });
      }
    }
    function addEndtoBlockProps(props, end) {
      if (end)
        for (const st of end)
          switch (st.type) {
            case "space":
            case "comment":
              props.push(st);
              break;
            case "newline":
              props.push(st);
              return true;
          }
      return false;
    }
    function setFlowScalarValue(token, source, type) {
      switch (token.type) {
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          token.type = type;
          token.source = source;
          break;
        case "block-scalar": {
          const end = token.props.slice(1);
          let oa = source.length;
          if (token.props[0].type === "block-scalar-header")
            oa -= token.props[0].source.length;
          for (const tok of end)
            tok.offset += oa;
          delete token.props;
          Object.assign(token, { type, source, end });
          break;
        }
        case "block-map":
        case "block-seq": {
          const offset = token.offset + source.length;
          const nl = { type: "newline", offset, indent: token.indent, source: "\n" };
          delete token.items;
          Object.assign(token, { type, source, end: [nl] });
          break;
        }
        default: {
          const indent2 = "indent" in token ? token.indent : -1;
          const end = "end" in token && Array.isArray(token.end) ? token.end.filter((st) => st.type === "space" || st.type === "comment" || st.type === "newline") : [];
          for (const key of Object.keys(token))
            if (key !== "type" && key !== "offset")
              delete token[key];
          Object.assign(token, { type, indent: indent2, source, end });
        }
      }
    }
    exports.createScalarToken = createScalarToken;
    exports.resolveAsScalar = resolveAsScalar;
    exports.setScalarValue = setScalarValue;
  }
});

// node_modules/yaml/dist/parse/cst-stringify.js
var require_cst_stringify = __commonJS({
  "node_modules/yaml/dist/parse/cst-stringify.js"(exports) {
    "use strict";
    var stringify2 = (cst) => "type" in cst ? stringifyToken(cst) : stringifyItem(cst);
    function stringifyToken(token) {
      switch (token.type) {
        case "block-scalar": {
          let res = "";
          for (const tok of token.props)
            res += stringifyToken(tok);
          return res + token.source;
        }
        case "block-map":
        case "block-seq": {
          let res = "";
          for (const item2 of token.items)
            res += stringifyItem(item2);
          return res;
        }
        case "flow-collection": {
          let res = token.start.source;
          for (const item2 of token.items)
            res += stringifyItem(item2);
          for (const st of token.end)
            res += st.source;
          return res;
        }
        case "document": {
          let res = stringifyItem(token);
          if (token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
        default: {
          let res = token.source;
          if ("end" in token && token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
      }
    }
    function stringifyItem({ start, key, sep, value: value2 }) {
      let res = "";
      for (const st of start)
        res += st.source;
      if (key)
        res += stringifyToken(key);
      if (sep)
        for (const st of sep)
          res += st.source;
      if (value2)
        res += stringifyToken(value2);
      return res;
    }
    exports.stringify = stringify2;
  }
});

// node_modules/yaml/dist/parse/cst-visit.js
var require_cst_visit = __commonJS({
  "node_modules/yaml/dist/parse/cst-visit.js"(exports) {
    "use strict";
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP2 = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove item");
    function visit(cst, visitor) {
      if ("type" in cst && cst.type === "document")
        cst = { start: cst.start, value: cst.value };
      _visit(Object.freeze([]), cst, visitor);
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP2;
    visit.REMOVE = REMOVE;
    visit.itemAtPath = (cst, path2) => {
      let item2 = cst;
      for (const [field, index2] of path2) {
        const tok = item2?.[field];
        if (tok && "items" in tok) {
          item2 = tok.items[index2];
        } else
          return void 0;
      }
      return item2;
    };
    visit.parentCollection = (cst, path2) => {
      const parent = visit.itemAtPath(cst, path2.slice(0, -1));
      const field = path2[path2.length - 1][0];
      const coll = parent?.[field];
      if (coll && "items" in coll)
        return coll;
      throw new Error("Parent collection not found");
    };
    function _visit(path2, item2, visitor) {
      let ctrl = visitor(item2, path2);
      if (typeof ctrl === "symbol")
        return ctrl;
      for (const field of ["key", "value"]) {
        const token = item2[field];
        if (token && "items" in token) {
          for (let i = 0; i < token.items.length; ++i) {
            const ci = _visit(Object.freeze(path2.concat([[field, i]])), token.items[i], visitor);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              token.items.splice(i, 1);
              i -= 1;
            }
          }
          if (typeof ctrl === "function" && field === "key")
            ctrl = ctrl(item2, path2);
        }
      }
      return typeof ctrl === "function" ? ctrl(item2, path2) : ctrl;
    }
    exports.visit = visit;
  }
});

// node_modules/yaml/dist/parse/cst.js
var require_cst = __commonJS({
  "node_modules/yaml/dist/parse/cst.js"(exports) {
    "use strict";
    var cstScalar = require_cst_scalar();
    var cstStringify = require_cst_stringify();
    var cstVisit = require_cst_visit();
    var BOM = "\uFEFF";
    var DOCUMENT = "";
    var FLOW_END = "";
    var SCALAR = "";
    var isCollection = (token) => !!token && "items" in token;
    var isScalar = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
    function prettyToken(token) {
      switch (token) {
        case BOM:
          return "<BOM>";
        case DOCUMENT:
          return "<DOC>";
        case FLOW_END:
          return "<FLOW_END>";
        case SCALAR:
          return "<SCALAR>";
        default:
          return JSON.stringify(token);
      }
    }
    function tokenType(source) {
      switch (source) {
        case BOM:
          return "byte-order-mark";
        case DOCUMENT:
          return "doc-mode";
        case FLOW_END:
          return "flow-error-end";
        case SCALAR:
          return "scalar";
        case "---":
          return "doc-start";
        case "...":
          return "doc-end";
        case "":
        case "\n":
        case "\r\n":
          return "newline";
        case "-":
          return "seq-item-ind";
        case "?":
          return "explicit-key-ind";
        case ":":
          return "map-value-ind";
        case "{":
          return "flow-map-start";
        case "}":
          return "flow-map-end";
        case "[":
          return "flow-seq-start";
        case "]":
          return "flow-seq-end";
        case ",":
          return "comma";
      }
      switch (source[0]) {
        case " ":
        case "	":
          return "space";
        case "#":
          return "comment";
        case "%":
          return "directive-line";
        case "*":
          return "alias";
        case "&":
          return "anchor";
        case "!":
          return "tag";
        case "'":
          return "single-quoted-scalar";
        case '"':
          return "double-quoted-scalar";
        case "|":
        case ">":
          return "block-scalar-header";
      }
      return null;
    }
    exports.createScalarToken = cstScalar.createScalarToken;
    exports.resolveAsScalar = cstScalar.resolveAsScalar;
    exports.setScalarValue = cstScalar.setScalarValue;
    exports.stringify = cstStringify.stringify;
    exports.visit = cstVisit.visit;
    exports.BOM = BOM;
    exports.DOCUMENT = DOCUMENT;
    exports.FLOW_END = FLOW_END;
    exports.SCALAR = SCALAR;
    exports.isCollection = isCollection;
    exports.isScalar = isScalar;
    exports.prettyToken = prettyToken;
    exports.tokenType = tokenType;
  }
});

// node_modules/yaml/dist/parse/lexer.js
var require_lexer = __commonJS({
  "node_modules/yaml/dist/parse/lexer.js"(exports) {
    "use strict";
    var cst = require_cst();
    function isEmpty(ch) {
      switch (ch) {
        case void 0:
        case " ":
        case "\n":
        case "\r":
        case "	":
          return true;
        default:
          return false;
      }
    }
    var hexDigits = new Set("0123456789ABCDEFabcdef");
    var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
    var flowIndicatorChars = new Set(",[]{}");
    var invalidAnchorChars = new Set(" ,[]{}\n\r	");
    var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
    var Lexer = class {
      constructor() {
        this.atEnd = false;
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        this.buffer = "";
        this.flowKey = false;
        this.flowLevel = 0;
        this.indentNext = 0;
        this.indentValue = 0;
        this.lineEndPos = null;
        this.next = null;
        this.pos = 0;
      }
      /**
       * Generate YAML tokens from the `source` string. If `incomplete`,
       * a part of the last line may be left as a buffer for the next call.
       *
       * @returns A generator of lexical tokens
       */
      *lex(source, incomplete = false) {
        if (source) {
          if (typeof source !== "string")
            throw TypeError("source is not a string");
          this.buffer = this.buffer ? this.buffer + source : source;
          this.lineEndPos = null;
        }
        this.atEnd = !incomplete;
        let next = this.next ?? "stream";
        while (next && (incomplete || this.hasChars(1)))
          next = yield* this.parseNext(next);
      }
      atLineEnd() {
        let i = this.pos;
        let ch = this.buffer[i];
        while (ch === " " || ch === "	")
          ch = this.buffer[++i];
        if (!ch || ch === "#" || ch === "\n")
          return true;
        if (ch === "\r")
          return this.buffer[i + 1] === "\n";
        return false;
      }
      charAt(n) {
        return this.buffer[this.pos + n];
      }
      continueScalar(offset) {
        let ch = this.buffer[offset];
        if (this.indentNext > 0) {
          let indent2 = 0;
          while (ch === " ")
            ch = this.buffer[++indent2 + offset];
          if (ch === "\r") {
            const next = this.buffer[indent2 + offset + 1];
            if (next === "\n" || !next && !this.atEnd)
              return offset + indent2 + 1;
          }
          return ch === "\n" || indent2 >= this.indentNext || !ch && !this.atEnd ? offset + indent2 : -1;
        }
        if (ch === "-" || ch === ".") {
          const dt = this.buffer.substr(offset, 3);
          if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3]))
            return -1;
        }
        return offset;
      }
      getLine() {
        let end = this.lineEndPos;
        if (typeof end !== "number" || end !== -1 && end < this.pos) {
          end = this.buffer.indexOf("\n", this.pos);
          this.lineEndPos = end;
        }
        if (end === -1)
          return this.atEnd ? this.buffer.substring(this.pos) : null;
        if (this.buffer[end - 1] === "\r")
          end -= 1;
        return this.buffer.substring(this.pos, end);
      }
      hasChars(n) {
        return this.pos + n <= this.buffer.length;
      }
      setNext(state) {
        this.buffer = this.buffer.substring(this.pos);
        this.pos = 0;
        this.lineEndPos = null;
        this.next = state;
        return null;
      }
      peek(n) {
        return this.buffer.substr(this.pos, n);
      }
      *parseNext(next) {
        switch (next) {
          case "stream":
            return yield* this.parseStream();
          case "line-start":
            return yield* this.parseLineStart();
          case "block-start":
            return yield* this.parseBlockStart();
          case "doc":
            return yield* this.parseDocument();
          case "flow":
            return yield* this.parseFlowCollection();
          case "quoted-scalar":
            return yield* this.parseQuotedScalar();
          case "block-scalar":
            return yield* this.parseBlockScalar();
          case "plain-scalar":
            return yield* this.parsePlainScalar();
        }
      }
      *parseStream() {
        let line = this.getLine();
        if (line === null)
          return this.setNext("stream");
        if (line[0] === cst.BOM) {
          yield* this.pushCount(1);
          line = line.substring(1);
        }
        if (line[0] === "%") {
          let dirEnd = line.length;
          let cs = line.indexOf("#");
          while (cs !== -1) {
            const ch = line[cs - 1];
            if (ch === " " || ch === "	") {
              dirEnd = cs - 1;
              break;
            } else {
              cs = line.indexOf("#", cs + 1);
            }
          }
          while (true) {
            const ch = line[dirEnd - 1];
            if (ch === " " || ch === "	")
              dirEnd -= 1;
            else
              break;
          }
          const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
          yield* this.pushCount(line.length - n);
          this.pushNewline();
          return "stream";
        }
        if (this.atLineEnd()) {
          const sp = yield* this.pushSpaces(true);
          yield* this.pushCount(line.length - sp);
          yield* this.pushNewline();
          return "stream";
        }
        yield cst.DOCUMENT;
        return yield* this.parseLineStart();
      }
      *parseLineStart() {
        const ch = this.charAt(0);
        if (!ch && !this.atEnd)
          return this.setNext("line-start");
        if (ch === "-" || ch === ".") {
          if (!this.atEnd && !this.hasChars(4))
            return this.setNext("line-start");
          const s = this.peek(3);
          if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
            yield* this.pushCount(3);
            this.indentValue = 0;
            this.indentNext = 0;
            return s === "---" ? "doc" : "stream";
          }
        }
        this.indentValue = yield* this.pushSpaces(false);
        if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
          this.indentNext = this.indentValue;
        return yield* this.parseBlockStart();
      }
      *parseBlockStart() {
        const [ch0, ch1] = this.peek(2);
        if (!ch1 && !this.atEnd)
          return this.setNext("block-start");
        if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
          const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
          this.indentNext = this.indentValue + 1;
          this.indentValue += n;
          return "block-start";
        }
        return "doc";
      }
      *parseDocument() {
        yield* this.pushSpaces(true);
        const line = this.getLine();
        if (line === null)
          return this.setNext("doc");
        let n = yield* this.pushIndicators();
        switch (line[n]) {
          case "#":
            yield* this.pushCount(line.length - n);
          // fallthrough
          case void 0:
            yield* this.pushNewline();
            return yield* this.parseLineStart();
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel = 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            return "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "doc";
          case '"':
          case "'":
            return yield* this.parseQuotedScalar();
          case "|":
          case ">":
            n += yield* this.parseBlockScalarHeader();
            n += yield* this.pushSpaces(true);
            yield* this.pushCount(line.length - n);
            yield* this.pushNewline();
            return yield* this.parseBlockScalar();
          default:
            return yield* this.parsePlainScalar();
        }
      }
      *parseFlowCollection() {
        let nl, sp;
        let indent2 = -1;
        do {
          nl = yield* this.pushNewline();
          if (nl > 0) {
            sp = yield* this.pushSpaces(false);
            this.indentValue = indent2 = sp;
          } else {
            sp = 0;
          }
          sp += yield* this.pushSpaces(true);
        } while (nl + sp > 0);
        const line = this.getLine();
        if (line === null)
          return this.setNext("flow");
        if (indent2 !== -1 && indent2 < this.indentNext && line[0] !== "#" || indent2 === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
          const atFlowEndMarker = indent2 === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
          if (!atFlowEndMarker) {
            this.flowLevel = 0;
            yield cst.FLOW_END;
            return yield* this.parseLineStart();
          }
        }
        let n = 0;
        while (line[n] === ",") {
          n += yield* this.pushCount(1);
          n += yield* this.pushSpaces(true);
          this.flowKey = false;
        }
        n += yield* this.pushIndicators();
        switch (line[n]) {
          case void 0:
            return "flow";
          case "#":
            yield* this.pushCount(line.length - n);
            return "flow";
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel += 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            this.flowKey = true;
            this.flowLevel -= 1;
            return this.flowLevel ? "flow" : "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "flow";
          case '"':
          case "'":
            this.flowKey = true;
            return yield* this.parseQuotedScalar();
          case ":": {
            const next = this.charAt(1);
            if (this.flowKey || isEmpty(next) || next === ",") {
              this.flowKey = false;
              yield* this.pushCount(1);
              yield* this.pushSpaces(true);
              return "flow";
            }
          }
          // fallthrough
          default:
            this.flowKey = false;
            return yield* this.parsePlainScalar();
        }
      }
      *parseQuotedScalar() {
        const quote = this.charAt(0);
        let end = this.buffer.indexOf(quote, this.pos + 1);
        if (quote === "'") {
          while (end !== -1 && this.buffer[end + 1] === "'")
            end = this.buffer.indexOf("'", end + 2);
        } else {
          while (end !== -1) {
            let n = 0;
            while (this.buffer[end - 1 - n] === "\\")
              n += 1;
            if (n % 2 === 0)
              break;
            end = this.buffer.indexOf('"', end + 1);
          }
        }
        const qb = this.buffer.substring(0, end);
        let nl = qb.indexOf("\n", this.pos);
        if (nl !== -1) {
          while (nl !== -1) {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = qb.indexOf("\n", cs);
          }
          if (nl !== -1) {
            end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
          }
        }
        if (end === -1) {
          if (!this.atEnd)
            return this.setNext("quoted-scalar");
          end = this.buffer.length;
        }
        yield* this.pushToIndex(end + 1, false);
        return this.flowLevel ? "flow" : "doc";
      }
      *parseBlockScalarHeader() {
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        let i = this.pos;
        while (true) {
          const ch = this.buffer[++i];
          if (ch === "+")
            this.blockScalarKeep = true;
          else if (ch > "0" && ch <= "9")
            this.blockScalarIndent = Number(ch) - 1;
          else if (ch !== "-")
            break;
        }
        return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
      }
      *parseBlockScalar() {
        let nl = this.pos - 1;
        let indent2 = 0;
        let ch;
        loop: for (let i2 = this.pos; ch = this.buffer[i2]; ++i2) {
          switch (ch) {
            case " ":
              indent2 += 1;
              break;
            case "\n":
              nl = i2;
              indent2 = 0;
              break;
            case "\r": {
              const next = this.buffer[i2 + 1];
              if (!next && !this.atEnd)
                return this.setNext("block-scalar");
              if (next === "\n")
                break;
            }
            // fallthrough
            default:
              break loop;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("block-scalar");
        if (indent2 >= this.indentNext) {
          if (this.blockScalarIndent === -1)
            this.indentNext = indent2;
          else {
            this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
          }
          do {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = this.buffer.indexOf("\n", cs);
          } while (nl !== -1);
          if (nl === -1) {
            if (!this.atEnd)
              return this.setNext("block-scalar");
            nl = this.buffer.length;
          }
        }
        let i = nl + 1;
        ch = this.buffer[i];
        while (ch === " ")
          ch = this.buffer[++i];
        if (ch === "	") {
          while (ch === "	" || ch === " " || ch === "\r" || ch === "\n")
            ch = this.buffer[++i];
          nl = i - 1;
        } else if (!this.blockScalarKeep) {
          do {
            let i2 = nl - 1;
            let ch2 = this.buffer[i2];
            if (ch2 === "\r")
              ch2 = this.buffer[--i2];
            const lastChar = i2;
            while (ch2 === " ")
              ch2 = this.buffer[--i2];
            if (ch2 === "\n" && i2 >= this.pos && i2 + 1 + indent2 > lastChar)
              nl = i2;
            else
              break;
          } while (true);
        }
        yield cst.SCALAR;
        yield* this.pushToIndex(nl + 1, true);
        return yield* this.parseLineStart();
      }
      *parsePlainScalar() {
        const inFlow = this.flowLevel > 0;
        let end = this.pos - 1;
        let i = this.pos - 1;
        let ch;
        while (ch = this.buffer[++i]) {
          if (ch === ":") {
            const next = this.buffer[i + 1];
            if (isEmpty(next) || inFlow && flowIndicatorChars.has(next))
              break;
            end = i;
          } else if (isEmpty(ch)) {
            let next = this.buffer[i + 1];
            if (ch === "\r") {
              if (next === "\n") {
                i += 1;
                ch = "\n";
                next = this.buffer[i + 1];
              } else
                end = i;
            }
            if (next === "#" || inFlow && flowIndicatorChars.has(next))
              break;
            if (ch === "\n") {
              const cs = this.continueScalar(i + 1);
              if (cs === -1)
                break;
              i = Math.max(i, cs - 2);
            }
          } else {
            if (inFlow && flowIndicatorChars.has(ch))
              break;
            end = i;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("plain-scalar");
        yield cst.SCALAR;
        yield* this.pushToIndex(end + 1, true);
        return inFlow ? "flow" : "doc";
      }
      *pushCount(n) {
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos += n;
          return n;
        }
        return 0;
      }
      *pushToIndex(i, allowEmpty) {
        const s = this.buffer.slice(this.pos, i);
        if (s) {
          yield s;
          this.pos += s.length;
          return s.length;
        } else if (allowEmpty)
          yield "";
        return 0;
      }
      *pushIndicators() {
        let n = 0;
        loop: while (true) {
          switch (this.charAt(0)) {
            case "!":
              n += yield* this.pushTag();
              n += yield* this.pushSpaces(true);
              continue loop;
            case "&":
              n += yield* this.pushUntil(isNotAnchorChar);
              n += yield* this.pushSpaces(true);
              continue loop;
            case "-":
            // this is an error
            case "?":
            // this is an error outside flow collections
            case ":": {
              const inFlow = this.flowLevel > 0;
              const ch1 = this.charAt(1);
              if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
                if (!inFlow)
                  this.indentNext = this.indentValue + 1;
                else if (this.flowKey)
                  this.flowKey = false;
                n += yield* this.pushCount(1);
                n += yield* this.pushSpaces(true);
                continue loop;
              }
            }
          }
          break loop;
        }
        return n;
      }
      *pushTag() {
        if (this.charAt(1) === "<") {
          let i = this.pos + 2;
          let ch = this.buffer[i];
          while (!isEmpty(ch) && ch !== ">")
            ch = this.buffer[++i];
          return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
        } else {
          let i = this.pos + 1;
          let ch = this.buffer[i];
          while (ch) {
            if (tagChars.has(ch))
              ch = this.buffer[++i];
            else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) {
              ch = this.buffer[i += 3];
            } else
              break;
          }
          return yield* this.pushToIndex(i, false);
        }
      }
      *pushNewline() {
        const ch = this.buffer[this.pos];
        if (ch === "\n")
          return yield* this.pushCount(1);
        else if (ch === "\r" && this.charAt(1) === "\n")
          return yield* this.pushCount(2);
        else
          return 0;
      }
      *pushSpaces(allowTabs) {
        let i = this.pos - 1;
        let ch;
        do {
          ch = this.buffer[++i];
        } while (ch === " " || allowTabs && ch === "	");
        const n = i - this.pos;
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos = i;
        }
        return n;
      }
      *pushUntil(test) {
        let i = this.pos;
        let ch = this.buffer[i];
        while (!test(ch))
          ch = this.buffer[++i];
        return yield* this.pushToIndex(i, false);
      }
    };
    exports.Lexer = Lexer;
  }
});

// node_modules/yaml/dist/parse/line-counter.js
var require_line_counter = __commonJS({
  "node_modules/yaml/dist/parse/line-counter.js"(exports) {
    "use strict";
    var LineCounter = class {
      constructor() {
        this.lineStarts = [];
        this.addNewLine = (offset) => this.lineStarts.push(offset);
        this.linePos = (offset) => {
          let low = 0;
          let high = this.lineStarts.length;
          while (low < high) {
            const mid = low + high >> 1;
            if (this.lineStarts[mid] < offset)
              low = mid + 1;
            else
              high = mid;
          }
          if (this.lineStarts[low] === offset)
            return { line: low + 1, col: 1 };
          if (low === 0)
            return { line: 0, col: offset };
          const start = this.lineStarts[low - 1];
          return { line: low, col: offset - start + 1 };
        };
      }
    };
    exports.LineCounter = LineCounter;
  }
});

// node_modules/yaml/dist/parse/parser.js
var require_parser = __commonJS({
  "node_modules/yaml/dist/parse/parser.js"(exports) {
    "use strict";
    var node_process = __require("process");
    var cst = require_cst();
    var lexer = require_lexer();
    function includesToken(list2, type) {
      for (let i = 0; i < list2.length; ++i)
        if (list2[i].type === type)
          return true;
      return false;
    }
    function findNonEmptyIndex(list2) {
      for (let i = 0; i < list2.length; ++i) {
        switch (list2[i].type) {
          case "space":
          case "comment":
          case "newline":
            break;
          default:
            return i;
        }
      }
      return -1;
    }
    function isFlowToken(token) {
      switch (token?.type) {
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "flow-collection":
          return true;
        default:
          return false;
      }
    }
    function getPrevProps(parent) {
      switch (parent.type) {
        case "document":
          return parent.start;
        case "block-map": {
          const it = parent.items[parent.items.length - 1];
          return it.sep ?? it.start;
        }
        case "block-seq":
          return parent.items[parent.items.length - 1].start;
        /* istanbul ignore next should not happen */
        default:
          return [];
      }
    }
    function getFirstKeyStartProps(prev) {
      if (prev.length === 0)
        return [];
      let i = prev.length;
      loop: while (--i >= 0) {
        switch (prev[i].type) {
          case "doc-start":
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
          case "newline":
            break loop;
        }
      }
      while (prev[++i]?.type === "space") {
      }
      return prev.splice(i, prev.length);
    }
    function arrayPushArray(target, source) {
      if (source.length < 1e5)
        Array.prototype.push.apply(target, source);
      else
        for (let i = 0; i < source.length; ++i)
          target.push(source[i]);
    }
    function fixFlowSeqItems(fc) {
      if (fc.start.type === "flow-seq-start") {
        for (const it of fc.items) {
          if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
            if (it.key)
              it.value = it.key;
            delete it.key;
            if (isFlowToken(it.value)) {
              if (it.value.end)
                arrayPushArray(it.value.end, it.sep);
              else
                it.value.end = it.sep;
            } else
              arrayPushArray(it.start, it.sep);
            delete it.sep;
          }
        }
      }
    }
    var Parser = class {
      /**
       * @param onNewLine - If defined, called separately with the start position of
       *   each new line (in `parse()`, including the start of input).
       */
      constructor(onNewLine) {
        this.atNewLine = true;
        this.atScalar = false;
        this.indent = 0;
        this.offset = 0;
        this.onKeyLine = false;
        this.stack = [];
        this.source = "";
        this.type = "";
        this.lexer = new lexer.Lexer();
        this.onNewLine = onNewLine;
      }
      /**
       * Parse `source` as a YAML stream.
       * If `incomplete`, a part of the last line may be left as a buffer for the next call.
       *
       * Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
       *
       * @returns A generator of tokens representing each directive, document, and other structure.
       */
      *parse(source, incomplete = false) {
        if (this.onNewLine && this.offset === 0)
          this.onNewLine(0);
        for (const lexeme of this.lexer.lex(source, incomplete))
          yield* this.next(lexeme);
        if (!incomplete)
          yield* this.end();
      }
      /**
       * Advance the parser by the `source` of one lexical token.
       */
      *next(source) {
        this.source = source;
        if (node_process.env.LOG_TOKENS)
          console.log("|", cst.prettyToken(source));
        if (this.atScalar) {
          this.atScalar = false;
          yield* this.step();
          this.offset += source.length;
          return;
        }
        const type = cst.tokenType(source);
        if (!type) {
          const message = `Not a YAML token: ${source}`;
          yield* this.pop({ type: "error", offset: this.offset, message, source });
          this.offset += source.length;
        } else if (type === "scalar") {
          this.atNewLine = false;
          this.atScalar = true;
          this.type = "scalar";
        } else {
          this.type = type;
          yield* this.step();
          switch (type) {
            case "newline":
              this.atNewLine = true;
              this.indent = 0;
              if (this.onNewLine)
                this.onNewLine(this.offset + source.length);
              break;
            case "space":
              if (this.atNewLine && source[0] === " ")
                this.indent += source.length;
              break;
            case "explicit-key-ind":
            case "map-value-ind":
            case "seq-item-ind":
              if (this.atNewLine)
                this.indent += source.length;
              break;
            case "doc-mode":
            case "flow-error-end":
              return;
            default:
              this.atNewLine = false;
          }
          this.offset += source.length;
        }
      }
      /** Call at end of input to push out any remaining constructions */
      *end() {
        while (this.stack.length > 0)
          yield* this.pop();
      }
      get sourceToken() {
        const st = {
          type: this.type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
        return st;
      }
      *step() {
        const top = this.peek(1);
        if (this.type === "doc-end" && top?.type !== "doc-end") {
          while (this.stack.length > 0)
            yield* this.pop();
          this.stack.push({
            type: "doc-end",
            offset: this.offset,
            source: this.source
          });
          return;
        }
        if (!top)
          return yield* this.stream();
        switch (top.type) {
          case "document":
            return yield* this.document(top);
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return yield* this.scalar(top);
          case "block-scalar":
            return yield* this.blockScalar(top);
          case "block-map":
            return yield* this.blockMap(top);
          case "block-seq":
            return yield* this.blockSequence(top);
          case "flow-collection":
            return yield* this.flowCollection(top);
          case "doc-end":
            return yield* this.documentEnd(top);
        }
        yield* this.pop();
      }
      peek(n) {
        return this.stack[this.stack.length - n];
      }
      *pop(error) {
        const token = error ?? this.stack.pop();
        if (!token) {
          const message = "Tried to pop an empty stack";
          yield { type: "error", offset: this.offset, source: "", message };
        } else if (this.stack.length === 0) {
          yield token;
        } else {
          const top = this.peek(1);
          if (token.type === "block-scalar") {
            token.indent = "indent" in top ? top.indent : 0;
          } else if (token.type === "flow-collection" && top.type === "document") {
            token.indent = 0;
          }
          if (token.type === "flow-collection")
            fixFlowSeqItems(token);
          switch (top.type) {
            case "document":
              top.value = token;
              break;
            case "block-scalar":
              top.props.push(token);
              break;
            case "block-map": {
              const it = top.items[top.items.length - 1];
              if (it.value) {
                top.items.push({ start: [], key: token, sep: [] });
                this.onKeyLine = true;
                return;
              } else if (it.sep) {
                it.value = token;
              } else {
                Object.assign(it, { key: token, sep: [] });
                this.onKeyLine = !it.explicitKey;
                return;
              }
              break;
            }
            case "block-seq": {
              const it = top.items[top.items.length - 1];
              if (it.value)
                top.items.push({ start: [], value: token });
              else
                it.value = token;
              break;
            }
            case "flow-collection": {
              const it = top.items[top.items.length - 1];
              if (!it || it.value)
                top.items.push({ start: [], key: token, sep: [] });
              else if (it.sep)
                it.value = token;
              else
                Object.assign(it, { key: token, sep: [] });
              return;
            }
            /* istanbul ignore next should not happen */
            default:
              yield* this.pop();
              yield* this.pop(token);
          }
          if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
            const last = token.items[token.items.length - 1];
            if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
              if (top.type === "document")
                top.end = last.start;
              else
                top.items.push({ start: last.start });
              token.items.splice(-1, 1);
            }
          }
        }
      }
      *stream() {
        switch (this.type) {
          case "directive-line":
            yield { type: "directive", offset: this.offset, source: this.source };
            return;
          case "byte-order-mark":
          case "space":
          case "comment":
          case "newline":
            yield this.sourceToken;
            return;
          case "doc-mode":
          case "doc-start": {
            const doc = {
              type: "document",
              offset: this.offset,
              start: []
            };
            if (this.type === "doc-start")
              doc.start.push(this.sourceToken);
            this.stack.push(doc);
            return;
          }
        }
        yield {
          type: "error",
          offset: this.offset,
          message: `Unexpected ${this.type} token in YAML stream`,
          source: this.source
        };
      }
      *document(doc) {
        if (doc.value)
          return yield* this.lineEnd(doc);
        switch (this.type) {
          case "doc-start": {
            if (findNonEmptyIndex(doc.start) !== -1) {
              yield* this.pop();
              yield* this.step();
            } else
              doc.start.push(this.sourceToken);
            return;
          }
          case "anchor":
          case "tag":
          case "space":
          case "comment":
          case "newline":
            doc.start.push(this.sourceToken);
            return;
        }
        const bv = this.startBlockValue(doc);
        if (bv)
          this.stack.push(bv);
        else {
          yield {
            type: "error",
            offset: this.offset,
            message: `Unexpected ${this.type} token in YAML document`,
            source: this.source
          };
        }
      }
      *scalar(scalar) {
        if (this.type === "map-value-ind") {
          const prev = getPrevProps(this.peek(2));
          const start = getFirstKeyStartProps(prev);
          let sep;
          if (scalar.end) {
            sep = scalar.end;
            sep.push(this.sourceToken);
            delete scalar.end;
          } else
            sep = [this.sourceToken];
          const map = {
            type: "block-map",
            offset: scalar.offset,
            indent: scalar.indent,
            items: [{ start, key: scalar, sep }]
          };
          this.onKeyLine = true;
          this.stack[this.stack.length - 1] = map;
        } else
          yield* this.lineEnd(scalar);
      }
      *blockScalar(scalar) {
        switch (this.type) {
          case "space":
          case "comment":
          case "newline":
            scalar.props.push(this.sourceToken);
            return;
          case "scalar":
            scalar.source = this.source;
            this.atNewLine = true;
            this.indent = 0;
            if (this.onNewLine) {
              let nl = this.source.indexOf("\n") + 1;
              while (nl !== 0) {
                this.onNewLine(this.offset + nl);
                nl = this.source.indexOf("\n", nl) + 1;
              }
            }
            yield* this.pop();
            break;
          /* istanbul ignore next should not happen */
          default:
            yield* this.pop();
            yield* this.step();
        }
      }
      *blockMap(map) {
        const it = map.items[map.items.length - 1];
        switch (this.type) {
          case "newline":
            this.onKeyLine = false;
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              it.start.push(this.sourceToken);
            }
            return;
          case "space":
          case "comment":
            if (it.value) {
              map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              if (this.atIndentedComment(it.start, map.indent)) {
                const prev = map.items[map.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  map.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
        }
        if (this.indent >= map.indent) {
          const atMapIndent = !this.onKeyLine && this.indent === map.indent;
          const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
          let start = [];
          if (atNextItem && it.sep && !it.value) {
            const nl = [];
            for (let i = 0; i < it.sep.length; ++i) {
              const st = it.sep[i];
              switch (st.type) {
                case "newline":
                  nl.push(i);
                  break;
                case "space":
                  break;
                case "comment":
                  if (st.indent > map.indent)
                    nl.length = 0;
                  break;
                default:
                  nl.length = 0;
              }
            }
            if (nl.length >= 2)
              start = it.sep.splice(nl[1]);
          }
          switch (this.type) {
            case "anchor":
            case "tag":
              if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start });
                this.onKeyLine = true;
              } else if (it.sep) {
                it.sep.push(this.sourceToken);
              } else {
                it.start.push(this.sourceToken);
              }
              return;
            case "explicit-key-ind":
              if (!it.sep && !it.explicitKey) {
                it.start.push(this.sourceToken);
                it.explicitKey = true;
              } else if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start, explicitKey: true });
              } else {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: [this.sourceToken], explicitKey: true }]
                });
              }
              this.onKeyLine = true;
              return;
            case "map-value-ind":
              if (it.explicitKey) {
                if (!it.sep) {
                  if (includesToken(it.start, "newline")) {
                    Object.assign(it, { key: null, sep: [this.sourceToken] });
                  } else {
                    const start2 = getFirstKeyStartProps(it.start);
                    this.stack.push({
                      type: "block-map",
                      offset: this.offset,
                      indent: this.indent,
                      items: [{ start: start2, key: null, sep: [this.sourceToken] }]
                    });
                  }
                } else if (it.value) {
                  map.items.push({ start: [], key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start, key: null, sep: [this.sourceToken] }]
                  });
                } else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
                  const start2 = getFirstKeyStartProps(it.start);
                  const key = it.key;
                  const sep = it.sep;
                  sep.push(this.sourceToken);
                  delete it.key;
                  delete it.sep;
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: start2, key, sep }]
                  });
                } else if (start.length > 0) {
                  it.sep = it.sep.concat(start, this.sourceToken);
                } else {
                  it.sep.push(this.sourceToken);
                }
              } else {
                if (!it.sep) {
                  Object.assign(it, { key: null, sep: [this.sourceToken] });
                } else if (it.value || atNextItem) {
                  map.items.push({ start, key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: [], key: null, sep: [this.sourceToken] }]
                  });
                } else {
                  it.sep.push(this.sourceToken);
                }
              }
              this.onKeyLine = true;
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs = this.flowScalar(this.type);
              if (atNextItem || it.value) {
                map.items.push({ start, key: fs, sep: [] });
                this.onKeyLine = true;
              } else if (it.sep) {
                this.stack.push(fs);
              } else {
                Object.assign(it, { key: fs, sep: [] });
                this.onKeyLine = true;
              }
              return;
            }
            default: {
              const bv = this.startBlockValue(map);
              if (bv) {
                if (bv.type === "block-seq") {
                  if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
                    yield* this.pop({
                      type: "error",
                      offset: this.offset,
                      message: "Unexpected block-seq-ind on same line with key",
                      source: this.source
                    });
                    return;
                  }
                } else if (atMapIndent) {
                  map.items.push({ start });
                }
                this.stack.push(bv);
                return;
              }
            }
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *blockSequence(seq) {
        const it = seq.items[seq.items.length - 1];
        switch (this.type) {
          case "newline":
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                seq.items.push({ start: [this.sourceToken] });
            } else
              it.start.push(this.sourceToken);
            return;
          case "space":
          case "comment":
            if (it.value)
              seq.items.push({ start: [this.sourceToken] });
            else {
              if (this.atIndentedComment(it.start, seq.indent)) {
                const prev = seq.items[seq.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  seq.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
          case "anchor":
          case "tag":
            if (it.value || this.indent <= seq.indent)
              break;
            it.start.push(this.sourceToken);
            return;
          case "seq-item-ind":
            if (this.indent !== seq.indent)
              break;
            if (it.value || includesToken(it.start, "seq-item-ind"))
              seq.items.push({ start: [this.sourceToken] });
            else
              it.start.push(this.sourceToken);
            return;
        }
        if (this.indent > seq.indent) {
          const bv = this.startBlockValue(seq);
          if (bv) {
            this.stack.push(bv);
            return;
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *flowCollection(fc) {
        const it = fc.items[fc.items.length - 1];
        if (this.type === "flow-error-end") {
          let top;
          do {
            yield* this.pop();
            top = this.peek(1);
          } while (top?.type === "flow-collection");
        } else if (fc.end.length === 0) {
          switch (this.type) {
            case "comma":
            case "explicit-key-ind":
              if (!it || it.sep)
                fc.items.push({ start: [this.sourceToken] });
              else
                it.start.push(this.sourceToken);
              return;
            case "map-value-ind":
              if (!it || it.value)
                fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                Object.assign(it, { key: null, sep: [this.sourceToken] });
              return;
            case "space":
            case "comment":
            case "newline":
            case "anchor":
            case "tag":
              if (!it || it.value)
                fc.items.push({ start: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                it.start.push(this.sourceToken);
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs = this.flowScalar(this.type);
              if (!it || it.value)
                fc.items.push({ start: [], key: fs, sep: [] });
              else if (it.sep)
                this.stack.push(fs);
              else
                Object.assign(it, { key: fs, sep: [] });
              return;
            }
            case "flow-map-end":
            case "flow-seq-end":
              fc.end.push(this.sourceToken);
              return;
          }
          const bv = this.startBlockValue(fc);
          if (bv)
            this.stack.push(bv);
          else {
            yield* this.pop();
            yield* this.step();
          }
        } else {
          const parent = this.peek(2);
          if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
            yield* this.pop();
            yield* this.step();
          } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            fixFlowSeqItems(fc);
            const sep = fc.end.splice(1, fc.end.length);
            sep.push(this.sourceToken);
            const map = {
              type: "block-map",
              offset: fc.offset,
              indent: fc.indent,
              items: [{ start, key: fc, sep }]
            };
            this.onKeyLine = true;
            this.stack[this.stack.length - 1] = map;
          } else {
            yield* this.lineEnd(fc);
          }
        }
      }
      flowScalar(type) {
        if (this.onNewLine) {
          let nl = this.source.indexOf("\n") + 1;
          while (nl !== 0) {
            this.onNewLine(this.offset + nl);
            nl = this.source.indexOf("\n", nl) + 1;
          }
        }
        return {
          type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
      }
      startBlockValue(parent) {
        switch (this.type) {
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return this.flowScalar(this.type);
          case "block-scalar-header":
            return {
              type: "block-scalar",
              offset: this.offset,
              indent: this.indent,
              props: [this.sourceToken],
              source: ""
            };
          case "flow-map-start":
          case "flow-seq-start":
            return {
              type: "flow-collection",
              offset: this.offset,
              indent: this.indent,
              start: this.sourceToken,
              items: [],
              end: []
            };
          case "seq-item-ind":
            return {
              type: "block-seq",
              offset: this.offset,
              indent: this.indent,
              items: [{ start: [this.sourceToken] }]
            };
          case "explicit-key-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            start.push(this.sourceToken);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, explicitKey: true }]
            };
          }
          case "map-value-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, key: null, sep: [this.sourceToken] }]
            };
          }
        }
        return null;
      }
      atIndentedComment(start, indent2) {
        if (this.type !== "comment")
          return false;
        if (this.indent <= indent2)
          return false;
        return start.every((st) => st.type === "newline" || st.type === "space");
      }
      *documentEnd(docEnd) {
        if (this.type !== "doc-mode") {
          if (docEnd.end)
            docEnd.end.push(this.sourceToken);
          else
            docEnd.end = [this.sourceToken];
          if (this.type === "newline")
            yield* this.pop();
        }
      }
      *lineEnd(token) {
        switch (this.type) {
          case "comma":
          case "doc-start":
          case "doc-end":
          case "flow-seq-end":
          case "flow-map-end":
          case "map-value-ind":
            yield* this.pop();
            yield* this.step();
            break;
          case "newline":
            this.onKeyLine = false;
          // fallthrough
          case "space":
          case "comment":
          default:
            if (token.end)
              token.end.push(this.sourceToken);
            else
              token.end = [this.sourceToken];
            if (this.type === "newline")
              yield* this.pop();
        }
      }
    };
    exports.Parser = Parser;
  }
});

// node_modules/yaml/dist/public-api.js
var require_public_api = __commonJS({
  "node_modules/yaml/dist/public-api.js"(exports) {
    "use strict";
    var composer2 = require_composer();
    var Document = require_Document();
    var errors = require_errors();
    var log = require_log();
    var identity = require_identity();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    function parseOptions(options) {
      const prettyErrors = options.prettyErrors !== false;
      const lineCounter$1 = options.lineCounter || prettyErrors && new lineCounter.LineCounter() || null;
      return { lineCounter: lineCounter$1, prettyErrors };
    }
    function parseAllDocuments(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer2.Composer(options);
      const docs = Array.from(composer$1.compose(parser$1.parse(source)));
      if (prettyErrors && lineCounter2)
        for (const doc of docs) {
          doc.errors.forEach(errors.prettifyError(source, lineCounter2));
          doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
        }
      if (docs.length > 0)
        return docs;
      return Object.assign([], { empty: true }, composer$1.streamInfo());
    }
    function parseDocument2(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer2.Composer(options);
      let doc = null;
      for (const _doc of composer$1.compose(parser$1.parse(source), true, source.length)) {
        if (!doc)
          doc = _doc;
        else if (doc.options.logLevel !== "silent") {
          doc.errors.push(new errors.YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
          break;
        }
      }
      if (prettyErrors && lineCounter2) {
        doc.errors.forEach(errors.prettifyError(source, lineCounter2));
        doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
      }
      return doc;
    }
    function parse3(src, reviver, options) {
      let _reviver = void 0;
      if (typeof reviver === "function") {
        _reviver = reviver;
      } else if (options === void 0 && reviver && typeof reviver === "object") {
        options = reviver;
      }
      const doc = parseDocument2(src, options);
      if (!doc)
        return null;
      doc.warnings.forEach((warning) => log.warn(doc.options.logLevel, warning));
      if (doc.errors.length > 0) {
        if (doc.options.logLevel !== "silent")
          throw doc.errors[0];
        else
          doc.errors = [];
      }
      return doc.toJS(Object.assign({ reviver: _reviver }, options));
    }
    function stringify2(value2, replacer, options) {
      let _replacer = null;
      if (typeof replacer === "function" || Array.isArray(replacer)) {
        _replacer = replacer;
      } else if (options === void 0 && replacer) {
        options = replacer;
      }
      if (typeof options === "string")
        options = options.length;
      if (typeof options === "number") {
        const indent2 = Math.round(options);
        options = indent2 < 1 ? void 0 : indent2 > 8 ? { indent: 8 } : { indent: indent2 };
      }
      if (value2 === void 0) {
        const { keepUndefined } = options ?? replacer ?? {};
        if (!keepUndefined)
          return void 0;
      }
      if (identity.isDocument(value2) && !_replacer)
        return value2.toString(options);
      return new Document.Document(value2, _replacer, options).toString(options);
    }
    exports.parse = parse3;
    exports.parseAllDocuments = parseAllDocuments;
    exports.parseDocument = parseDocument2;
    exports.stringify = stringify2;
  }
});

// node_modules/yaml/dist/index.js
var require_dist = __commonJS({
  "node_modules/yaml/dist/index.js"(exports) {
    "use strict";
    var composer2 = require_composer();
    var Document = require_Document();
    var Schema = require_Schema();
    var errors = require_errors();
    var Alias = require_Alias();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var cst = require_cst();
    var lexer = require_lexer();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    var publicApi = require_public_api();
    var visit = require_visit();
    exports.Composer = composer2.Composer;
    exports.Document = Document.Document;
    exports.Schema = Schema.Schema;
    exports.YAMLError = errors.YAMLError;
    exports.YAMLParseError = errors.YAMLParseError;
    exports.YAMLWarning = errors.YAMLWarning;
    exports.Alias = Alias.Alias;
    exports.isAlias = identity.isAlias;
    exports.isCollection = identity.isCollection;
    exports.isDocument = identity.isDocument;
    exports.isMap = identity.isMap;
    exports.isNode = identity.isNode;
    exports.isPair = identity.isPair;
    exports.isScalar = identity.isScalar;
    exports.isSeq = identity.isSeq;
    exports.Pair = Pair.Pair;
    exports.Scalar = Scalar.Scalar;
    exports.YAMLMap = YAMLMap.YAMLMap;
    exports.YAMLSeq = YAMLSeq.YAMLSeq;
    exports.CST = cst;
    exports.Lexer = lexer.Lexer;
    exports.LineCounter = lineCounter.LineCounter;
    exports.Parser = parser.Parser;
    exports.parse = publicApi.parse;
    exports.parseAllDocuments = publicApi.parseAllDocuments;
    exports.parseDocument = publicApi.parseDocument;
    exports.stringify = publicApi.stringify;
    exports.visit = visit.visit;
    exports.visitAsync = visit.visitAsync;
  }
});

// node_modules/format/format.js
var require_format = __commonJS({
  "node_modules/format/format.js"(exports, module) {
    (function() {
      var namespace;
      if (typeof module !== "undefined") {
        namespace = module.exports = format;
      } else {
        namespace = (function() {
          return this || (1, eval)("this");
        })();
      }
      namespace.format = format;
      namespace.vsprintf = vsprintf;
      if (typeof console !== "undefined" && typeof console.log === "function") {
        namespace.printf = printf;
      }
      function printf() {
        console.log(format.apply(null, arguments));
      }
      function vsprintf(fmt, replacements) {
        return format.apply(null, [fmt].concat(replacements));
      }
      function format(fmt) {
        var argIndex = 1, args = [].slice.call(arguments), i = 0, n = fmt.length, result = "", c, escaped = false, arg, tmp, leadingZero = false, precision, nextArg = function() {
          return args[argIndex++];
        }, slurpNumber = function() {
          var digits = "";
          while (/\d/.test(fmt[i])) {
            digits += fmt[i++];
            c = fmt[i];
          }
          return digits.length > 0 ? parseInt(digits) : null;
        };
        for (; i < n; ++i) {
          c = fmt[i];
          if (escaped) {
            escaped = false;
            if (c == ".") {
              leadingZero = false;
              c = fmt[++i];
            } else if (c == "0" && fmt[i + 1] == ".") {
              leadingZero = true;
              i += 2;
              c = fmt[i];
            } else {
              leadingZero = true;
            }
            precision = slurpNumber();
            switch (c) {
              case "b":
                result += parseInt(nextArg(), 10).toString(2);
                break;
              case "c":
                arg = nextArg();
                if (typeof arg === "string" || arg instanceof String)
                  result += arg;
                else
                  result += String.fromCharCode(parseInt(arg, 10));
                break;
              case "d":
                result += parseInt(nextArg(), 10);
                break;
              case "f":
                tmp = String(parseFloat(nextArg()).toFixed(precision || 6));
                result += leadingZero ? tmp : tmp.replace(/^0/, "");
                break;
              case "j":
                result += JSON.stringify(nextArg());
                break;
              case "o":
                result += "0" + parseInt(nextArg(), 10).toString(8);
                break;
              case "s":
                result += nextArg();
                break;
              case "x":
                result += "0x" + parseInt(nextArg(), 10).toString(16);
                break;
              case "X":
                result += "0x" + parseInt(nextArg(), 10).toString(16).toUpperCase();
                break;
              default:
                result += c;
                break;
            }
          } else if (c === "%") {
            escaped = true;
          } else {
            result += c;
          }
        }
        return result;
      }
    })();
  }
});

// src/cli.ts
import { spawnSync as spawnSync8 } from "node:child_process";
import { existsSync as existsSync9, mkdirSync as mkdirSync3, writeFileSync as writeFileSync6 } from "node:fs";
import { join as join12, resolve as resolve3 } from "node:path";
import { parseArgs } from "node:util";

// src/discover.ts
import { existsSync as existsSync2, readdirSync, realpathSync, statSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join as join2, posix } from "node:path";

// src/core/git.ts
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, lstatSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
var run = (cwd, args, env) => execFileSync("git", args, { cwd, env: env ?? process.env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 256 * 1024 * 1024 }).trim();
var safe = (cwd, args) => {
  try {
    return run(cwd, args) || null;
  } catch {
    return null;
  }
};
function gitAvailable() {
  return spawnSync("git", ["--version"], { stdio: "ignore" }).status === 0;
}
function repoRoot(cwd) {
  return safe(cwd, ["rev-parse", "--show-toplevel"]);
}
function workingTreeHash(root, excluding = []) {
  const gitDir = run(root, ["rev-parse", "--absolute-git-dir"]);
  const tmp = mkdtempSync(join(tmpdir(), "proof-index-"));
  const index2 = join(tmp, "index");
  try {
    const realIndex = join(gitDir, "index");
    if (existsSync(realIndex)) copyFileSync(realIndex, index2);
    const env = { ...process.env, GIT_INDEX_FILE: index2 };
    run(root, ["add", "--all", "--", "."], env);
    if (excluding.length) run(root, ["rm", "-q", "-r", "--cached", "--ignore-unmatch", "--", ...excluding], env);
    return run(root, ["write-tree"], env);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
function gitState(cwd) {
  const root = repoRoot(cwd);
  if (!root) return null;
  const branch = safe(root, ["rev-parse", "--abbrev-ref", "HEAD"]);
  const upstream = safe(root, ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"]) ?? safe(root, ["symbolic-ref", "--short", "refs/remotes/origin/HEAD"]);
  const behindText = upstream ? safe(root, ["rev-list", "--count", `HEAD..${upstream}`]) : null;
  return {
    root,
    tree: workingTreeHash(root),
    head: safe(root, ["rev-parse", "--verify", "--quiet", "HEAD"]),
    branch: branch === "HEAD" ? null : branch,
    upstream,
    behind: behindText === null ? null : Number(behindText)
  };
}
function listFiles(root) {
  const out = run(root, ["ls-files", "-z", "--cached", "--others", "--exclude-standard"]);
  const deleted = new Set(run(root, ["ls-files", "-z", "--deleted"]).split("\0").filter(Boolean));
  return [...new Set(out.split("\0").filter((f) => f && !deleted.has(f)))];
}
function ignoredFiles(root, globs) {
  const res = spawnSync("git", ["ls-files", "-z", "--others", "--ignored", "--exclude-standard", "--", ...globs.map((g) => `:(glob)${g}`)], { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return res.status === 0 ? res.stdout.split("\0").filter(Boolean) : [];
}
function symlinkAbove(root, rel) {
  const parts = rel.replace(/\/$/, "").split("/");
  for (let i = parts.length; i > 0; i--) {
    const p = parts.slice(0, i).join("/");
    try {
      if (lstatSync(join(root, p)).isSymbolicLink()) return p;
    } catch {
    }
  }
  return null;
}
function ignoredPaths(root, paths) {
  const asked = new Map(paths.map((p) => [p, /* @__PURE__ */ new Set([p])]));
  for (let attempt = 0; attempt < 32 && asked.size; attempt++) {
    const res = spawnSync("git", ["check-ignore", "--stdin", "-z"], { cwd: root, input: [...asked.keys()].join("\0") + "\0", encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    if (res.status === 0 || res.status === 1) {
      const hits = /* @__PURE__ */ new Set();
      for (const h of res.stdout.split("\0").filter(Boolean)) for (const p of asked.get(h) ?? [h]) hits.add(p);
      return hits;
    }
    const bad = res.stderr.match(/pathspec '(.+?)' is beyond a symbolic link/)?.[1];
    if (!bad || !asked.has(bad)) return null;
    const link = symlinkAbove(root, bad) ?? bad.replace(/\/$/, "");
    const merged = asked.get(link) ?? /* @__PURE__ */ new Set();
    for (const [q, originals] of [...asked]) {
      if (q !== bad && !q.startsWith(`${link}/`)) continue;
      for (const o of originals) merged.add(o);
      asked.delete(q);
    }
    asked.set(link, merged);
  }
  return asked.size ? null : /* @__PURE__ */ new Set();
}
function gitGrep(root, needle, opts = {}) {
  const args = ["grep", "-I", "--untracked", "-F", "-n", "--column", ...opts.word ? ["-w"] : [], "-e", needle, "--", ...opts.pathspec ?? ["."]];
  const res = spawnSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (res.status === 1) return { status: "miss" };
  if (res.status !== 0) return { status: "error", message: (res.stderr || res.error?.message || `git grep exited ${res.status}`).split("\n")[0] ?? "git grep failed" };
  const lines = [];
  for (const raw of res.stdout.split("\n")) {
    if (!raw) continue;
    const m = raw.match(/^(.*?):(\d+):(\d+):(.*)$/);
    if (!m) continue;
    lines.push({ file: m[1] ?? "", line: Number(m[2]), column: Number(m[3]), text: m[4] ?? "" });
    if (opts.limit && lines.length >= opts.limit) break;
  }
  return { status: "match", lines };
}

// src/discover.ts
var CLAUDE_AGENTS = "Claude Code reads it only when no CLAUDE.md, .claude/CLAUDE.md or CLAUDE.local.md is in the folder or above it, and Codex, Cursor and others read it always";
var PROJECT_FILES = [
  [/(^|\/)CLAUDE\.md$/, "Claude Code project instructions (at launch for this folder and above, on demand below)", "project"],
  [/(^|\/)CLAUDE\.local\.md$/, "Claude Code local instructions, loaded after CLAUDE.md in the same folder", "local"],
  [/(^|\/)\.claude\/AGENTS\.md$/, CLAUDE_AGENTS, "project"],
  [/(^|\/)AGENTS\.md$/, CLAUDE_AGENTS, "project"],
  [/(^|\/)\.claude\/rules\/.+\.md$/, "Claude Code rule: at launch, or when a file matching its paths: is read", "project"],
  [/^\.github\/copilot-instructions\.md$/, "GitHub Copilot repository instructions", "project"],
  [/^\.github\/instructions\/.+\.instructions\.md$/, "GitHub Copilot path instructions (applyTo:)", "project"],
  [/(^|\/)GEMINI\.md$/, "Gemini CLI instructions", "project"],
  [/(^|\/)\.cursor\/rules\/.+\.mdc?$/, "Cursor rule", "project"],
  [/(^|\/)\.cursorrules$/, "Cursor rules (legacy file)", "project"],
  [/(^|\/)\.windsurfrules$/, "Windsurf rules", "project"],
  [/(^|\/)\.windsurf\/rules\/.+\.md$/, "Windsurf rule", "project"],
  [/(^|\/)\.clinerules(\/.+\.md)?$/, "Cline rules", "project"],
  [/(^|\/)CONVENTIONS\.md$/, "Aider conventions", "project"]
];
var NOT_LOADED = /(^|\/)(AGENTS\.local\.md|AGENTS\.override\.md)$|(^|\/)\.agents\//;
var FIXTURES = /(^|\/)(fixtures?|__fixtures__|testdata|test-data|__snapshots__|examples?)\//;
var MANAGED_PATHS = {
  linux: "/etc/claude-code/CLAUDE.md",
  darwin: "/Library/Application Support/ClaudeCode/CLAUDE.md",
  win32: "C:\\Program Files\\ClaudeCode\\CLAUDE.md"
};
function classify(file) {
  for (const [re, why, scope] of PROJECT_FILES) if (re.test(file)) return { file, why, scope };
  return null;
}
function walkMarkdown(dir) {
  const out = [];
  let entries = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const full = join2(dir, name);
    try {
      if (statSync(full).isDirectory()) out.push(...walkMarkdown(full));
      else if (name.endsWith(".md")) out.push(full);
    } catch {
    }
  }
  return out;
}
function discover(repo, opts = {}) {
  const found = [];
  const skipped = [];
  const candidates = [...repo.files];
  if (repo.isGit) {
    for (const f of ignoredFiles(repo.root, ["**/CLAUDE.local.md", "CLAUDE.local.md"])) if (!candidates.includes(f)) candidates.push(f);
  }
  for (const file of candidates) {
    const hit = classify(file);
    if (!hit) continue;
    if (NOT_LOADED.test(file)) {
      skipped.push({ file, reason: "no agent loads it (Claude Code skips AGENTS.local.md, AGENTS.override.md and anything under .agents/)" });
      continue;
    }
    if (FIXTURES.test(file)) {
      skipped.push({ file, reason: "inside a test-data or examples folder; pass it by name to check it" });
      continue;
    }
    found.push(hit);
  }
  found.sort((a2, b) => a2.file.split("/").length - b.file.split("/").length || a2.file.localeCompare(b.file));
  if (opts.user) {
    const home = join2(homedir(), ".claude");
    const managed = MANAGED_PATHS[platform()];
    if (managed && existsSync2(managed)) found.push({ file: managed, why: "managed policy instructions for every user of this machine; listed and checked, never edited", scope: "managed" });
    if (existsSync2(join2(home, "CLAUDE.md"))) found.push({ file: join2(home, "CLAUDE.md"), why: "your user instructions, loaded in every project", scope: "user" });
    for (const f of walkMarkdown(join2(home, "rules")).sort()) found.push({ file: f, why: "your user rule, loaded in every project", scope: "user" });
  }
  const seen = /* @__PURE__ */ new Set();
  const files2 = found.filter((d) => {
    let real = d.file;
    try {
      real = realpathSync(posix.isAbsolute(d.file) ? d.file : join2(repo.root, d.file));
    } catch {
    }
    if (seen.has(real)) return false;
    seen.add(real);
    return true;
  });
  return { files: files2, skipped };
}

// src/model.ts
var VERIFYING_LEVELS = /* @__PURE__ */ new Set(["definition", "declaration", "reference"]);
var EXIT_CODE = {
  PROVEN: 0,
  "PROVEN WITH OVERRIDES": 0,
  FIXED: 0,
  "PARTLY PROVEN": 0,
  "NOT PROVEN": 1,
  UNTESTED: 2
};
var LEVEL_RANK = { definition: 5, declaration: 4, reference: 3, comment: 2, substring: 1, none: 0 };

// src/agent/claude.ts
import { spawn, spawnSync as spawnSync2 } from "node:child_process";
function claudeBinary() {
  return process.env.PROOF_CLAUDE ?? "claude";
}
function claudeVersion(bin = claudeBinary()) {
  const res = spawnSync2(bin, ["--version"], { encoding: "utf8", timeout: 2e4 });
  return res.status === 0 ? res.stdout.trim() : null;
}
function runClaude(call) {
  const args = [
    "-p",
    "--output-format",
    "json",
    "--json-schema",
    JSON.stringify(call.schema),
    "--model",
    call.model,
    "--effort",
    call.effort,
    "--max-budget-usd",
    call.budgetUsd.toFixed(2),
    "--setting-sources",
    "user",
    "--strict-mcp-config",
    "--no-session-persistence",
    "--permission-mode",
    "dontAsk",
    "--tools",
    call.tools.join(","),
    "--allowedTools",
    call.allowedTools.join(" "),
    "--disallowedTools",
    "Edit Write NotebookEdit WebFetch WebSearch"
  ];
  return new Promise((resolve4) => {
    let out = "";
    let err = "";
    let settled = false;
    const finish = (r) => {
      if (!settled) {
        settled = true;
        resolve4(r);
      }
    };
    const child = spawn(claudeBinary(), args, { cwd: call.cwd, env: { ...process.env, CLAUDE_CODE_DISABLE_AUTO_MEMORY: "1" }, stdio: ["pipe", "pipe", "pipe"] });
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      finish({ ok: false, structured: null, costUsd: 0, subtype: "timeout", error: `no answer within ${Math.round(call.timeoutMs / 1e3)} s` });
    }, call.timeoutMs);
    child.stdout.on("data", (d) => {
      out += d.toString();
    });
    child.stderr.on("data", (d) => {
      err += d.toString();
    });
    child.on("error", (e) => {
      clearTimeout(timer);
      finish({ ok: false, structured: null, costUsd: 0, subtype: "spawn", error: `${claudeBinary()} did not start: ${e.message}` });
    });
    child.on("close", () => {
      clearTimeout(timer);
      try {
        const json = JSON.parse(out);
        const subtype = json.subtype ?? "unknown";
        const ok3 = subtype === "success" && !json.is_error && json.structured_output !== void 0;
        finish({ ok: ok3, structured: json.structured_output ?? null, costUsd: Number(json.total_cost_usd ?? 0), subtype, error: ok3 ? null : (json.result ?? subtype).slice(0, 300) });
      } catch {
        finish({ ok: false, structured: null, costUsd: 0, subtype: "parse", error: (err || out || "no output").trim().split("\n")[0]?.slice(0, 300) ?? "no output" });
      }
    });
    child.stdin.end(call.prompt);
  });
}

// src/agent/evidence.ts
import { spawnSync as spawnSync3 } from "node:child_process";

// src/parse/shell.ts
import { posix as posix2 } from "node:path";
var OPERATORS = ["2>&", "&>>", "2>>", "&&", "||", "|&", ";;", ">>", ">&", "&>", "2>", "|", ";", "&", "(", ")", ">", "<"];
var WRAPPERS = /* @__PURE__ */ new Set(["sudo", "time", "nohup", "exec", "command", "builtin", "env", "nice", "doas"]);
var WRAPPER_FLAGS_WITH_VALUE = { sudo: /* @__PURE__ */ new Set(["-u", "-g", "-C", "-D"]), nice: /* @__PURE__ */ new Set(["-n"]) };
function tokenize(line) {
  const out = [];
  let word = "";
  let inWord = false;
  const flush = () => {
    if (inWord) out.push({ word });
    word = "";
    inWord = false;
  };
  for (let i = 0; i < line.length; i++) {
    const c = line[i] ?? "";
    if (c === "\\") {
      word += line[i + 1] ?? "";
      inWord = true;
      i++;
      continue;
    }
    if (c === "'") {
      const end = line.indexOf("'", i + 1);
      word += end < 0 ? line.slice(i + 1) : line.slice(i + 1, end);
      inWord = true;
      i = end < 0 ? line.length : end;
      continue;
    }
    if (c === '"') {
      let j = i + 1;
      for (; j < line.length && line[j] !== '"'; j++) {
        if (line[j] === "\\" && j + 1 < line.length) {
          word += line[j + 1];
          j++;
        } else word += line[j];
      }
      inWord = true;
      i = j;
      continue;
    }
    const placeholder = c === "<" ? /^<[A-Za-z][\w.-]*>/.exec(line.slice(i))?.[0] : void 0;
    if (placeholder) {
      word += placeholder;
      inWord = true;
      i += placeholder.length - 1;
      continue;
    }
    if (c === "$" && line[i + 1] === "(") {
      let depth = 0;
      let j = i + 1;
      for (; j < line.length; j++) {
        if (line[j] === "(") depth++;
        else if (line[j] === ")" && --depth === 0) break;
      }
      word += line.slice(i, j + 1);
      inWord = true;
      i = j;
      continue;
    }
    if (c === "`") {
      const end = line.indexOf("`", i + 1);
      word += line.slice(i, end < 0 ? line.length : end + 1);
      inWord = true;
      i = end < 0 ? line.length : end;
      continue;
    }
    if (c === "#" && !inWord) break;
    if (/\s/.test(c)) {
      flush();
      continue;
    }
    const op = OPERATORS.find((o) => line.startsWith(o, i));
    if (op) {
      if (op.startsWith("2") && inWord) {
        word += c;
        continue;
      }
      flush();
      out.push({ op });
      i += op.length - 1;
      continue;
    }
    word += c;
    inWord = true;
  }
  flush();
  return out;
}
var isAssignment = (w) => /^[A-Za-z_][A-Za-z0-9_]*=/.test(w);
function unwrap(words) {
  const env = {};
  let i = 0;
  for (; ; ) {
    while (i < words.length && isAssignment(words[i] ?? "")) {
      const w = words[i] ?? "";
      const eq = w.indexOf("=");
      env[w.slice(0, eq)] = w.slice(eq + 1);
      i++;
    }
    const head = words[i];
    if (!head || !WRAPPERS.has(head)) break;
    i++;
    const withValue = WRAPPER_FLAGS_WITH_VALUE[head] ?? /* @__PURE__ */ new Set();
    while (i < words.length && (words[i] ?? "").startsWith("-")) {
      if (withValue.has(words[i] ?? "")) i++;
      i++;
    }
  }
  return { argv: words.slice(i), env };
}
var REDIRECTS = /* @__PURE__ */ new Set([">", ">>", "<", "&>", "&>>", "2>", "2>>", "2>&", ">&"]);
function splitShell(line, startCwd = "") {
  const tokens = tokenize(line);
  const commands = [];
  const stack = [];
  let cwd = startCwd;
  let cwdUnknown = false;
  let words = [];
  const end = () => {
    if (!words.length) return;
    const { argv, env } = unwrap(words);
    words = [];
    if (!argv.length) return;
    const prefix = Object.entries(env).map(([k, v]) => `${k}=${v}`);
    commands.push({ argv, env, cwd, cwdUnknown, text: [...prefix, ...argv].join(" ") });
    if (argv[0] === "cd" || argv[0] === "pushd") {
      const target = argv[1];
      if (!target || target === "-" || target.startsWith("~") || target.includes("$") || target.startsWith("/")) {
        cwd = void 0;
        cwdUnknown = true;
      } else if (cwd !== void 0) {
        cwd = posix2.normalize(posix2.join(cwd, target)).replace(/^\.$/, "").replace(/\/$/, "");
      }
    }
  };
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!t) continue;
    if ("word" in t) {
      words.push(t.word);
      continue;
    }
    if (REDIRECTS.has(t.op)) {
      i++;
      continue;
    }
    end();
    if (t.op === "(") stack.push({ cwd, unknown: cwdUnknown });
    else if (t.op === ")") {
      const outer = stack.pop();
      if (outer) {
        cwd = outer.cwd;
        cwdUnknown = outer.unknown;
      }
    }
  }
  end();
  return commands;
}

// src/agent/evidence.ts
var READ_ONLY = {
  git: (a2) => ["log", "grep", "ls-files", "show", "blame", "rev-list", "shortlog", "ls-tree", "cat-file", "describe", "rev-parse", "tag", "branch"].includes(a2[1] ?? "") && !a2.some((x) => /^--(output|exec)/.test(x)) && !(a2[1] === "branch" && a2.some((x) => /^-[dDmMcC]$/.test(x))) && !(a2[1] === "tag" && a2.some((x) => /^-[ad]$/.test(x))),
  ls: () => true,
  wc: () => true,
  grep: () => true,
  rg: (a2) => !a2.some((x) => x.startsWith("--pre")),
  find: (a2) => !a2.some((x) => ["-exec", "-execdir", "-delete", "-ok", "-okdir", "-fprint", "-fprintf", "-fls"].includes(x)),
  cat: () => true,
  head: () => true,
  tail: () => true,
  sort: (a2) => !a2.some((x) => x === "-o" || x.startsWith("--output")),
  uniq: (a2) => a2.filter((x) => !x.startsWith("-")).length <= 2,
  cut: () => true,
  jq: () => true,
  tr: () => true,
  awk: (a2) => !a2.some((x) => /system|>|getline/.test(x))
};
var normalize = (s) => s.replace(/\s+/g, " ").trim();
function unsafeCommand(ref) {
  if (/[;&<>`]|\$\(|\|\|/.test(ref.replace(/'[^']*'|"[^"]*"/g, '""'))) return "uses redirection, substitution or chaining";
  const commands = splitShell(ref);
  if (!commands.length) return "empty command";
  for (const c of commands) {
    const bin = c.argv[0] ?? "";
    const ok3 = READ_ONLY[bin];
    if (!ok3) return `\`${bin}\` is not a read-only command proof re-runs`;
    if (!ok3(c.argv)) return `\`${c.argv.join(" ")}\` could write`;
    if (Object.keys(c.env).length) return "sets environment variables";
  }
  return null;
}
function rerun(root, ref) {
  const res = spawnSync3("bash", ["-c", ref], { cwd: root, encoding: "utf8", timeout: 2e4, maxBuffer: 16 * 1024 * 1024, env: { PATH: process.env.PATH ?? "/usr/bin:/bin", HOME: process.env.HOME ?? "/", LANG: "C", GIT_PAGER: "cat", PAGER: "cat" } });
  if (res.error) return { out: "", error: res.error.message };
  if (res.status !== 0 && res.status !== 1) return { out: res.stdout, error: (res.stderr || `exit ${res.status}`).split("\n")[0] ?? "failed" };
  return { out: res.stdout, error: null };
}
function checkEvidence(repo, e) {
  const bad = (problem) => ({ ...e, valid: false, problem, level: "none" });
  if (e.kind === "file_line") {
    const m = /^(.+?):(\d+)(?:-(\d+))?$/.exec(e.ref.trim());
    if (!m) return bad("ref is not path:line");
    const file = (m[1] ?? "").replace(/^\.\//, "");
    const rel = repo.rel(file);
    if (rel === null) return bad("points outside the repository");
    const text4 = repo.read(rel);
    if (text4 === null) return bad(`${file} does not exist`);
    const lines = text4.split("\n");
    const from = Number(m[2]);
    const to = Number(m[3] ?? m[2]);
    if (from < 1 || to < from || from > lines.length) return bad(`${file} has ${lines.length} lines`);
    if (e.excerpt) {
      const window = normalize(lines.slice(Math.max(0, from - 4), Math.min(lines.length, to + 3)).join("\n"));
      const want = normalize(e.excerpt).replace(/…$/, "");
      if (want && !window.includes(want)) return bad(`the excerpt is not at ${file}:${from}`);
    }
    return { ...e, valid: true, problem: "", level: "definition" };
  }
  if (e.kind === "command_output" || e.kind === "count" || e.kind === "git_log" || e.kind === "absence") {
    const unsafe = unsafeCommand(e.ref);
    if (unsafe) return bad(`not re-run: ${unsafe}`);
    const { out, error } = rerun(repo.root, e.ref);
    if (error) return bad(`re-run failed: ${error}`);
    if (e.kind === "absence") return out.trim() ? bad(`the search prints ${out.trim().split("\n").length} line(s), so the thing is not absent`) : { ...e, valid: true, problem: "", level: "definition" };
    const want = normalize(e.excerpt ?? "");
    if (!want) return bad("a command citation needs an excerpt of its output");
    if (!normalize(out).includes(want)) return bad("the re-run output does not contain the excerpt");
    return { ...e, valid: true, problem: "", level: "declaration" };
  }
  return bad(`unknown evidence kind ${e.kind}`);
}

// src/agent/rules.ts
var VERIFIER_RULES = [
  "Judge each statement against this repository as it is on disk now, never against your memory of how projects usually look.",
  "A verdict of true or stale must cite evidence[]. Without evidence the verdict is rejected and the statement stays unverified.",
  "Evidence is inspectable: a file_line ref is `path:line` (or `path:start-end`) with an excerpt copied from that line; a command, count, git_log or absence ref is a read-only command proof re-runs, and its excerpt must appear in the output (absence: the command prints nothing).",
  "Do the work before you answer: open the files a statement names, search for what it claims, count what it counts, read the config it relies on. Every number is recounted and the command you used is the evidence. You have time and budget for this.",
  'An unverified_with_reason answer names the evidence you looked for and did not find, and where you looked. "I did not check" is never a reason.',
  "Stale means something the statement asserts is false in this repository. A statement that leaves out an exception or a detail, or is less precise than the code, is not stale: answer true if what it does state holds, and name the omission in the reason.",
  'Rules ("never", "always", "prefer", "must") are checked against the repository tooling (lint, formatter, type-checker, CI, pre-commit), never against taste. A rule is stale only when the repository makes it wrong to follow: tooling enforces the opposite, or the thing it refers to is gone; cite the config file. Code that does not always follow a rule does not make the rule stale: answer unverified_with_reason and cite the exceptions. A rule is true only with evidence that tooling enforces it or the code follows it.',
  "Status words (active, legacy, deprecated, canonical, preferred) are checked against `git log` recency and against where new code lands.",
  "A statement that something was removed or renamed is checked for absence: cite the search that finds nothing, as kind absence with the command as ref (for example `git grep -n old_name`). The same goes for a stale path or name: an absence citation proves it is gone.",
  "Command refs run from the repository root; write paths relative to it.",
  "When the mechanical check already proved a name, do not repeat it; verify what the reason says is still open.",
  "If the mechanical check marked a statement stale, confirm it and propose the corrected text, or dispute it with evidence.",
  "For a stale statement, proposed_text is the corrected statement in the author's words and format, changed only where the evidence requires.",
  "When in doubt the verdict is unverified_with_reason, never true. Your confidence is not evidence.",
  "Never edit, create or delete files. Never run a command that writes."
];
var EVIDENCE_KINDS = ["file_line", "command_output", "count", "git_log", "absence"];
var VERIFIER_VERDICTS = ["true", "stale", "unverified_with_reason"];
var ACTIONS = ["auto-fix", "fix-with-evidence", "pointer", "needs-decision", "no-op"];
var VERIFIER_SCHEMA = {
  type: "object",
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        properties: {
          statement_id: { type: "string" },
          verdict: { type: "string", enum: [...VERIFIER_VERDICTS] },
          evidence: {
            type: "array",
            items: {
              type: "object",
              properties: {
                kind: { type: "string", enum: [...EVIDENCE_KINDS] },
                ref: { type: "string" },
                excerpt: { type: "string", maxLength: 200 }
              },
              required: ["kind", "ref"]
            }
          },
          reason: { type: "string" },
          proposed_text: { type: "string" },
          action: { type: "string", enum: [...ACTIONS] }
        },
        required: ["statement_id", "verdict", "evidence", "reason", "action"]
      }
    }
  },
  required: ["results"]
};
var FIXER_RULES = [
  "Correct only what the evidence shows is wrong. Never add a statement, a line or a section, and never add content to close a gap.",
  "Tier A (mechanical): a stale path, link, import, script name, subcommand or version where the repository offers exactly one candidate. Use the candidate.",
  "Tier B (rewrite with evidence): rewrite the statement to what the evidence shows, keeping the author's phrasing and format wherever it still holds.",
  "Tier C (pointer): when the statement copies something the repository owns (a command list from package.json or a Makefile), replace the copy with a pointer to the owner named in the ownership map, or to the file the evidence came from.",
  "Never delete a rule; rewrite it to match the tooling, citing the config file.",
  `Never rewrite a rule or a convention into a description of the code that breaks it ("some endpoints also \u2026", "the main place" for "the only place"): whether the exceptions or the convention should change is a person's decision, so return action none for that part.`,
  "Delete a fact only with evidence that the thing is absent (an absence citation). A fact that is merely unverified stays.",
  "`old` is an exact substring of the statement's source lines, as written in the file, and `new` replaces it. Keep list markers, backticks, links and line breaks; `new` has no more lines than `old`.",
  "Every edit cites the evidence it relies on, in the same kinds the verifier uses. An edit without a citation that checks out is not applied.",
  "Never propose again a fix a person or the re-verifier rejected; the rejected fixes are listed.",
  "If no edit is justified, return action none with the reason.",
  "Never edit, create or delete files yourself; proof applies the edits you return."
];
var FIXER_SCHEMA = {
  type: "object",
  properties: {
    edits: {
      type: "array",
      items: {
        type: "object",
        properties: {
          statement_id: { type: "string" },
          tier: { type: "string", enum: ["A", "B", "C"] },
          action: { type: "string", enum: ["replace", "delete", "none"] },
          old: { type: "string" },
          new: { type: "string" },
          evidence: {
            type: "array",
            items: {
              type: "object",
              properties: { kind: { type: "string", enum: [...EVIDENCE_KINDS] }, ref: { type: "string" }, excerpt: { type: "string", maxLength: 200 } },
              required: ["kind", "ref"]
            }
          },
          reason: { type: "string" }
        },
        required: ["statement_id", "action", "evidence", "reason"]
      }
    }
  },
  required: ["edits"]
};

// src/agent/gaps.ts
var SCHEMA = {
  type: "object",
  properties: {
    proposals: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          section: { type: "string" },
          reason: { type: "string" },
          evidence: { type: "array", items: { type: "object", properties: { kind: { type: "string", enum: [...EVIDENCE_KINDS] }, ref: { type: "string" }, excerpt: { type: "string", maxLength: 200 } }, required: ["kind", "ref"] } }
        },
        required: ["text", "section", "reason", "evidence"]
      }
    }
  },
  required: ["proposals"]
};
var RULES = [
  "Propose at most five facts a new agent session in this repository would need and the file does not state: a command, a layout fact, a convention the tooling enforces.",
  "Each proposal is one line in the file's own style and names the section it belongs in.",
  "Each cites evidence (file_line with an excerpt, or a read-only command): a proposal without a citation that checks out is dropped.",
  "Never propose what the file already says, a restatement of tool defaults, or anything the code makes obvious at a glance.",
  "Never edit, create or delete files."
];
async function proposeGaps(repo, file, text4, opts) {
  const prompt = [`You look for what the instruction file ${file} is missing, against the repository in your working directory.`, "", "Rules:", ...RULES.map((r, i) => `${i + 1}. ${r}`), "", "<file>", text4, "</file>"].join("\n");
  const result = await runClaude({ cwd: repo.root, prompt, schema: SCHEMA, model: opts.model, effort: opts.effort, budgetUsd: opts.budgetUsd * 0.8, tools: ["Read", "Grep", "Glob", "Bash"], allowedTools: ["Read", "Grep", "Glob", "Bash(git log:*)", "Bash(git ls-files:*)", "Bash(ls:*)", "Bash(cat:*)", "Bash(grep:*)"], timeoutMs: opts.timeoutMs });
  if (!result.ok) return { proposals: [], costUsd: result.costUsd, failure: `${result.subtype}${result.error ? ` (${result.error})` : ""}` };
  const raw = result.structured?.proposals ?? [];
  const proposals = [];
  for (const p of raw.slice(0, 5)) {
    if (typeof p.text !== "string" || !p.text.trim()) continue;
    const cited = Array.isArray(p.evidence) ? p.evidence.filter((e) => Boolean(e) && typeof e.ref === "string" && typeof e.kind === "string") : [];
    const evidence = cited.slice(0, 4).map((e) => {
      const c = checkEvidence(repo, e);
      return { kind: c.kind, ref: c.ref, excerpt: c.excerpt, valid: c.valid, problem: c.problem };
    });
    if (!evidence.some((e) => e.valid)) continue;
    proposals.push({ text: p.text.trim().split("\n")[0] ?? "", section: typeof p.section === "string" ? p.section : "", reason: typeof p.reason === "string" ? p.reason : "", evidence });
  }
  return { proposals, costUsd: result.costUsd, failure: null };
}

// src/agent/verify.ts
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir as homedir2 } from "node:os";
import { join as join3 } from "node:path";
var PROMPT_VERSION = "4";
var DEFAULT_VERIFY = { model: "claude-sonnet-5-5", effort: "high", budgetUsd: 10, perStatementUsd: 0.25, batchSize: 8, jobs: 2, cache: true, timeoutMs: 15 * 6e4 };
function needsAgent(st) {
  if (st.kind === "marker" || st.override?.reason) return false;
  if (st.status === "VERIFIED") return !st.settled;
  return st.status === "UNCONFIRMED" || st.status === "UNVERIFIED_WITH_REASON" || st.status === "STALE";
}
var TOOLS = ["Read", "Grep", "Glob", "Bash"];
var ALLOWED = ["Read", "Grep", "Glob", "Bash(git log:*)", "Bash(git grep:*)", "Bash(git ls-files:*)", "Bash(git show:*)", "Bash(git blame:*)", "Bash(git rev-list:*)", "Bash(ls:*)", "Bash(wc:*)", "Bash(find:*)", "Bash(grep:*)", "Bash(rg:*)", "Bash(head:*)", "Bash(cat:*)", "Bash(sort:*)", "Bash(uniq:*)", "Bash(jq:*)"];
function buildPrompt(file, why, batch, note) {
  const items = batch.map(({ key, st }) => ({
    statement_id: key,
    line: st.line,
    section: st.section,
    text: st.text,
    mechanical: {
      status: st.status,
      reason: st.reason,
      still_open: st.residual,
      spans: st.results.filter((r) => r.kind !== "prose").map((r) => ({ text: r.text, status: r.status, level: r.level, expect: r.expect, reason: r.reason, evidence: r.evidence.slice(0, 2).map((e) => e.ref) }))
    }
  }));
  return [
    `You verify statements from the instruction file ${file} (${why}) against the repository in your working directory.`,
    ...note ? ["", note] : [],
    "",
    "Rules:",
    ...VERIFIER_RULES.map((r, i) => `${i + 1}. ${r}`),
    "",
    `Return exactly one result for each of the ${batch.length} statement ids below, in the structured output schema. Evidence kinds: file_line, command_output, count, git_log, absence. Excerpts at most 200 characters.`,
    "",
    "<statements>",
    JSON.stringify(items, null, 1),
    "</statements>"
  ].join("\n");
}
function judge(repo, raw, model, cached = false) {
  if (typeof raw.verdict !== "string" || !VERIFIER_VERDICTS.includes(raw.verdict)) return null;
  const verdict = raw.verdict;
  const action = typeof raw.action === "string" && ACTIONS.includes(raw.action) ? raw.action : "needs-decision";
  const cited = Array.isArray(raw.evidence) ? raw.evidence.filter((e) => Boolean(e) && typeof e.ref === "string" && typeof e.kind === "string") : [];
  const evidence = cited.slice(0, 6).map((e) => {
    const c = checkEvidence(repo, e);
    return { kind: c.kind, ref: c.ref, excerpt: c.excerpt, valid: c.valid, problem: c.problem };
  });
  const reason = typeof raw.reason === "string" ? raw.reason.slice(0, 600) : "";
  const proposedText = typeof raw.proposed_text === "string" && raw.proposed_text.trim() ? raw.proposed_text.trim() : null;
  let rejected = null;
  if (verdict !== "unverified_with_reason" && !evidence.some((e) => e.valid)) {
    rejected = evidence.length ? `no citation checks out (${evidence.map((e) => `${e.ref}: ${e.problem}`).join("; ").slice(0, 300)})` : "a verdict without evidence";
  }
  if (verdict === "unverified_with_reason" && !reason) rejected = "unverified without a reason";
  return { verdict, evidence, reason, proposedText, action, rejected, cached, model };
}
function applyVerdict(st, v) {
  const out = { ...st, agent: v };
  if (v.rejected) return { ...out, status: st.status === "STALE" ? "STALE" : "UNVERIFIED_WITH_REASON", reason: st.status === "STALE" ? st.reason : `verifier answer refused: ${v.rejected}`, settled: false };
  if (v.verdict === "true") {
    if (st.status === "STALE") return { ...out, status: "UNVERIFIED_WITH_REASON", reason: `the mechanical check says stale (${st.reason}); the verifier disputes it: ${v.reason || "see evidence"}`, settled: false };
    return { ...out, status: "VERIFIED", reason: v.reason || "the verifier proved it", settled: true };
  }
  if (v.verdict === "stale") return { ...out, status: "STALE", reason: st.status === "STALE" ? st.reason : v.reason || "the verifier found it contradicted", settled: false };
  return { ...out, status: st.status === "STALE" ? "STALE" : "UNVERIFIED_WITH_REASON", reason: st.status === "STALE" ? st.reason : v.reason, settled: false };
}
var treeMemo = /* @__PURE__ */ new WeakMap();
function codeTreeOf(repo, instructionFiles) {
  if (!repo.isGit) return "no-git";
  const excluded = [...new Set(instructionFiles.filter((f) => !f.startsWith("/")))].sort();
  const key = excluded.join("\0");
  const memo = treeMemo.get(repo) ?? /* @__PURE__ */ new Map();
  treeMemo.set(repo, memo);
  const known = memo.get(key);
  if (known) return known;
  const tree = workingTreeHash(repo.root, [...excluded, ":(glob)**/*.proof.json"]);
  memo.set(key, tree);
  return tree;
}
function cacheDir(root) {
  const base = process.env.XDG_CACHE_HOME ?? join3(homedir2(), ".cache");
  return join3(base, "proof", createHash("sha1").update(root).digest("hex").slice(0, 16));
}
function loadCache(root) {
  try {
    return JSON.parse(readFileSync(join3(cacheDir(root), "verdicts.json"), "utf8"));
  } catch {
    return {};
  }
}
function saveCache(root, cache2) {
  try {
    mkdirSync(cacheDir(root), { recursive: true });
    writeFileSync(join3(cacheDir(root), "verdicts.json"), JSON.stringify(cache2));
  } catch {
  }
}
async function verifyFiles(repo, files2, instructionFiles, opts) {
  const coverage = /* @__PURE__ */ new Map();
  const version = claudeVersion();
  const codeTree = codeTreeOf(repo, instructionFiles);
  const cache2 = opts.cache ? loadCache(repo.root) : {};
  let spent = 0;
  const jobs = [];
  for (const f of files2) {
    const cov = { sent: 0, answered: 0, cached: 0, costUsd: 0, model: opts.model, failures: [] };
    coverage.set(f.file, cov);
    const open = f.statements.map((st, index2) => ({ st, index: index2 })).filter(({ st }) => needsAgent(st));
    cov.sent = open.length;
    const fresh = [];
    for (const { st, index: index2 } of open) {
      const cacheKey = createHash("sha1").update([PROMPT_VERSION, opts.model, codeTree, f.file, st.id, st.status, st.reason, f.note ?? ""].join("\0")).digest("hex");
      const hit = cache2[cacheKey];
      const v = hit ? judge(repo, hit.raw, opts.model, true) : null;
      if (v) {
        f.statements[index2] = applyVerdict(st, v);
        cov.answered += 1;
        cov.cached += 1;
      } else fresh.push({ st, index: index2, cacheKey });
    }
    if (fresh.length && !version) {
      cov.failures.push("the claude CLI does not run: install Claude Code, or set PROOF_CLAUDE to its path");
      continue;
    }
    for (let i = 0; i < fresh.length; i += opts.batchSize) {
      jobs.push({ file: f, cov, batch: fresh.slice(i, i + opts.batchSize).map((x, j) => ({ ...x, key: `s${i + j + 1}` })) });
    }
  }
  let reserved = 0;
  const HEADROOM = 0.8;
  const call = async (prompt, ceiling) => {
    reserved += ceiling;
    try {
      return await runClaude({ cwd: repo.root, prompt, schema: VERIFIER_SCHEMA, model: opts.model, effort: opts.effort, budgetUsd: ceiling * HEADROOM, tools: TOOLS, allowedTools: ALLOWED, timeoutMs: opts.timeoutMs });
    } finally {
      reserved -= ceiling;
    }
  };
  const runJob = async (job, retry = false) => {
    const ceiling = Math.min(opts.budgetUsd - spent - reserved, job.batch.length * opts.perStatementUsd);
    if (ceiling < 0.05) {
      job.cov.failures.push(`budget of $${opts.budgetUsd.toFixed(2)} spent before L${job.batch[0]?.st.line}\u2013L${job.batch[job.batch.length - 1]?.st.line} were verified`);
      return;
    }
    const prompt = buildPrompt(job.file.file, job.file.why, job.batch, job.file.note);
    let result = await call(prompt, ceiling);
    spent += result.costUsd;
    job.cov.costUsd += result.costUsd;
    if (!result.ok && (result.subtype === "parse" || result.subtype === "error_max_structured_output_retries")) {
      const again = Math.min(opts.budgetUsd - spent - reserved, ceiling);
      if (again >= 0.05) {
        result = await call(prompt, again);
        spent += result.costUsd;
        job.cov.costUsd += result.costUsd;
      }
    }
    if (!result.ok) {
      job.cov.failures.push(`L${job.batch[0]?.st.line}\u2013L${job.batch[job.batch.length - 1]?.st.line}: ${result.subtype}${result.error ? ` (${result.error})` : ""}`);
      return;
    }
    const answers = result.structured?.results ?? [];
    const missing = [];
    for (const item2 of job.batch) {
      const raw = answers.find((a2) => a2.statement_id === item2.key);
      const v = raw ? judge(repo, raw, opts.model) : null;
      if (!v) {
        missing.push(item2);
        continue;
      }
      job.file.statements[item2.index] = applyVerdict(item2.st, v);
      job.cov.answered += 1;
      if (raw && !v.rejected) cache2[item2.cacheKey] = { raw, at: (/* @__PURE__ */ new Date()).toISOString() };
    }
    if (missing.length && !retry) await runJob({ ...job, batch: missing }, true);
    else if (missing.length) job.cov.failures.push(`no well-formed verdict for ${missing.map((m) => `L${m.st.line}`).join(", ")}`);
  };
  const queue = [...jobs];
  await Promise.all(
    Array.from({ length: Math.max(1, opts.jobs) }, async () => {
      for (let job = queue.shift(); job; job = queue.shift()) await runJob(job);
    })
  );
  if (opts.cache) saveCache(repo.root, cache2);
  return coverage;
}

// src/pipeline.ts
import { existsSync as existsSync7, realpathSync as realpathSync2, writeFileSync as writeFileSync4 } from "node:fs";
import { homedir as homedir5 } from "node:os";
import { isAbsolute as isAbsolute4, join as join9, posix as posix8, resolve as resolve2 } from "node:path";

// src/core/repo.ts
import { existsSync as existsSync3, readdirSync as readdirSync2, readFileSync as readFileSync2, statSync as statSync2 } from "node:fs";
import { homedir as homedir3 } from "node:os";
import { isAbsolute, join as join4, posix as posix3, relative, resolve } from "node:path";

// node_modules/smol-toml/dist/error.js
function getLineColFromPtr(string3, ptr) {
  let lines = string3.slice(0, ptr).split(/\r?\n/);
  return [lines.length, lines.pop().length + 1];
}
function makeCodeBlock(string3, line, column) {
  let lines = string3.split(/\r?\n/);
  let codeblock = "";
  let numberLen = (Math.log10(line + 1) | 0) + 1;
  for (let i = line - 1; i <= line + 1; i++) {
    let l = lines[i - 1];
    if (!l)
      continue;
    codeblock += i.toString().padEnd(numberLen, " ");
    codeblock += ":  ";
    codeblock += l;
    codeblock += "\n";
    if (i === line) {
      codeblock += " ".repeat(numberLen + column + 2);
      codeblock += "^\n";
    }
  }
  return codeblock;
}
var TomlError = class _TomlError extends Error {
  line;
  column;
  codeblock;
  constructor(message, options) {
    const [line, column] = getLineColFromPtr(options.toml, options.ptr);
    const codeblock = makeCodeBlock(options.toml, line, column);
    super(`Invalid TOML document: ${message}

${codeblock}`, options);
    this.line = line;
    this.column = column;
    this.codeblock = codeblock;
  }
  /** @internal */
  static x(message, ctx, ptr) {
    throw new _TomlError(message, { toml: ctx.s, ptr: ptr ?? ctx.p });
  }
};

// node_modules/smol-toml/dist/primitive.js
function parseString(ctx) {
  let startPtr = ctx.p;
  let c = ctx.s.charCodeAt(ctx.p++);
  let first = c;
  let isLiteral = c === 39;
  let isMultiline = c === ctx.s.charCodeAt(ctx.p) && c === ctx.s.charCodeAt(ctx.p + 1);
  if (isMultiline) {
    if ((c = ctx.s.charCodeAt(ctx.p += 2)) === 10)
      ctx.p++;
    else if (c === 13 && ctx.s.charCodeAt(ctx.p + 1) === 10)
      ctx.p += 2;
  }
  let parsed = "";
  let sliceStart = ctx.p;
  let state = 0;
  for (; ctx.p < ctx.s.length; ctx.p++) {
    c = ctx.s.charCodeAt(ctx.p);
    if (isMultiline && (c === 10 || c === 13 && ctx.s.charCodeAt(ctx.p + 1) === 10)) {
      state = state && 3;
    } else if (c < 32 && c !== 9 || c === 127) {
      TomlError.x("control characters are not allowed in strings", ctx);
    } else if ((!state || state === 3) && c === first && (!isMultiline || ctx.s.charCodeAt(ctx.p + 1) === first && ctx.s.charCodeAt(ctx.p + 2) === first)) {
      if (isMultiline) {
        if (ctx.s.charCodeAt(ctx.p + 3) === first)
          ctx.p++;
        if (ctx.s.charCodeAt(ctx.p + 3) === first)
          ctx.p++;
      }
      if (!state) {
        let s = ctx.s.slice(sliceStart, ctx.p);
        parsed = parsed ? parsed + s : s;
      }
      ctx.p += isMultiline ? 3 : 1;
      return parsed;
    } else if (!state) {
      if (!isLiteral && c === 92) {
        parsed += ctx.s.slice(sliceStart, sliceStart = ctx.p);
        state = 1;
      }
    } else if (state === 1) {
      if (c === 120 || c === 117 || c === 85) {
        let errPtr = ctx.p++ - 1;
        let value2 = 0;
        let len = c === 120 ? 2 : c === 117 ? 4 : 8;
        for (let j = 0; j < len; j++, ctx.p++) {
          let hex = ctx.s.charCodeAt(ctx.p);
          let digit = (
            /* 0-9 */
            hex >= 48 && hex <= 57 ? hex - 48 : (
              /* A-F */
              hex >= 65 && hex <= 70 ? hex - 65 + 10 : (
                /* a-f */
                hex >= 97 && hex <= 102 ? hex - 97 + 10 : -1
              )
            )
          );
          if (digit < 0)
            TomlError.x("invalid non-hex character in unicode escape", ctx);
          value2 = value2 << 4 | digit;
        }
        if (value2 < 0 || value2 > 1114111 || value2 >= 55296 && value2 <= 57343) {
          TomlError.x("invalid unicode escape", ctx, errPtr);
        }
        parsed += String.fromCodePoint(value2);
        sliceStart = ctx.p--;
        state = 0;
      } else if (isMultiline && (c === 32 || c === 9)) {
        state = 2;
      } else {
        if (c === 98)
          parsed += "\b";
        else if (c === 116)
          parsed += "	";
        else if (c === 110)
          parsed += "\n";
        else if (c === 102)
          parsed += "\f";
        else if (c === 114)
          parsed += "\r";
        else if (c === 101)
          parsed += "\x1B";
        else if (c === 34)
          parsed += '"';
        else if (c === 92)
          parsed += "\\";
        else
          TomlError.x("unrecognised escape sequence", ctx);
        sliceStart = ctx.p + 1;
        state = 0;
      }
    } else if (c !== 32 && c !== 9) {
      if (state === 2)
        TomlError.x("invalid escape: only line-ending whitespace may be escaped", ctx, sliceStart);
      state = !isLiteral && c === 92 ? 1 : 0;
      sliceStart = ctx.p;
    }
  }
  TomlError.x("unfinished string", ctx, startPtr);
}

// node_modules/smol-toml/dist/date.js
var DATE_TIME_RE = /^(\d{4}-\d{2}-\d{2})?[Tt ]?(?:(\d{2}):\d{2}(?::\d{2}(?:\.\d+)?)?)?(Z|z|[-+]\d{2}:\d{2})?$/i;
var TomlDate = class _TomlDate extends Date {
  #hasDate = false;
  #hasTime = false;
  #offset = null;
  constructor(date, fasttype, unsafeDelim) {
    let hasDate = true;
    let hasTime = true;
    let offset = "Z";
    let c;
    if (typeof date === "string") {
      if (fasttype)
        prep: {
          if (fasttype < 3) {
            if (+date.slice(11, 13) > 23) {
              date = "";
              break prep;
            }
            if (fasttype === 2) {
              offset = null;
              date += "Z";
            } else if ((c = date.charCodeAt(date.length - 1)) !== 90 && c !== 122) {
              offset = date.slice(date.length - 6);
            }
            if (unsafeDelim)
              date = date.slice(0, 10) + "T" + date.slice(11);
          } else if (fasttype === 4) {
            date = +date.slice(0, 2) > 23 ? "" : `0000-01-01T${date}Z`;
          }
          hasDate = fasttype !== 4;
          hasTime = fasttype !== 3;
        }
      else {
        let match = date.match(DATE_TIME_RE);
        if (match) {
          if (!match[1]) {
            hasDate = false;
            date = `0000-01-01T${date}`;
          }
          hasTime = !!match[2];
          hasTime && date[10] === " " && (date = date.replace(" ", "T"));
          if (match[2] && +match[2] > 23) {
            date = "";
          } else {
            offset = match[3] || null;
            if (!offset && hasTime)
              date += "Z";
          }
        } else {
          date = "";
        }
      }
    }
    super(date);
    if (!isNaN(this.getTime())) {
      this.#hasDate = hasDate;
      this.#hasTime = hasTime;
      this.#offset = offset;
    }
  }
  isDateTime() {
    return this.#hasDate && this.#hasTime;
  }
  isLocal() {
    return !this.#hasDate || !this.#hasTime || !this.#offset;
  }
  isDate() {
    return this.#hasDate && !this.#hasTime;
  }
  isTime() {
    return this.#hasTime && !this.#hasDate;
  }
  isValid() {
    return this.#hasDate || this.#hasTime;
  }
  toISOString() {
    let iso = super.toISOString();
    if (this.isDate())
      return iso.slice(0, 10);
    if (this.isTime())
      return iso.slice(11, 23);
    if (this.#offset === null)
      return iso.slice(0, -1);
    if (this.#offset === "Z" || this.#offset === "z")
      return iso;
    let offset = +this.#offset.slice(1, 3) * 60 + +this.#offset.slice(4, 6);
    offset = this.#offset[0] === "-" ? offset : -offset;
    let offsetDate = new Date(this.getTime() - offset * 6e4);
    return offsetDate.toISOString().slice(0, -1) + this.#offset;
  }
  static wrapAsOffsetDateTime(jsDate, offset = "Z") {
    let date = new _TomlDate(jsDate);
    date.#offset = offset;
    return date;
  }
  static wrapAsLocalDateTime(jsDate) {
    let date = new _TomlDate(jsDate);
    date.#offset = null;
    return date;
  }
  static wrapAsLocalDate(jsDate) {
    let date = new _TomlDate(jsDate);
    date.#hasTime = false;
    date.#offset = null;
    return date;
  }
  static wrapAsLocalTime(jsDate) {
    let date = new _TomlDate(jsDate);
    date.#hasDate = false;
    date.#offset = null;
    return date;
  }
};

// node_modules/smol-toml/dist/extract.js
function isDigit(char, base = 10) {
  return base === 16 ? char > 47 && char < 58 || char > 64 && char < 71 || char > 96 && char < 103 : char > 47 && char < 48 + base;
}
function isEndOfValue(char, delim) {
  return char === 32 || char === 9 || char === 10 || char === 13 || // Structure end or next value delimiter
  delim && (char === delim || char === 44) || // Comment
  char === 35;
}
function extractValue(ctx, end) {
  let errPtr = ctx.p;
  let c = ctx.s.charCodeAt(ctx.p);
  if (c === 91 || c === 123) {
    ctx.d-- || TomlError.x("document contains excessively nested structures. aborting.", ctx);
    let value2 = c === 91 ? parseArray(ctx) : parseInlineTable(ctx);
    ctx.d++;
    return value2;
  }
  if (c === 34 || c === 39) {
    return parseString(ctx);
  }
  if (c === 116) {
    if (ctx.s.charCodeAt(++ctx.p) !== 114 || ctx.s.charCodeAt(++ctx.p) !== 117 || ctx.s.charCodeAt(++ctx.p) !== 101)
      TomlError.x("invalid value", ctx, errPtr);
    return ctx.p++, true;
  }
  if (c === 102) {
    if (ctx.s.charCodeAt(++ctx.p) !== 97 || ctx.s.charCodeAt(++ctx.p) !== 108 || ctx.s.charCodeAt(++ctx.p) !== 115 || ctx.s.charCodeAt(++ctx.p) !== 101)
      TomlError.x("invalid value", ctx, errPtr);
    return ctx.p++, false;
  }
  if (c === 43 || c === 45) {
    return parseNumber(ctx, ctx.p, ctx.s.charCodeAt(++ctx.p), 44 - c, end);
  }
  if (ctx.s.charCodeAt(ctx.p + 4) === 45 && ctx.s.charCodeAt(ctx.p + 7) === 45) {
    return parseDate(ctx, c, end);
  }
  if (ctx.s.charCodeAt(ctx.p + 2) === 58) {
    return parseTime(ctx, c, end);
  }
  return parseNumber(ctx, ctx.p, c, 0, end);
}
function parseNumber(ctx, startPtr, startChr, sign, endChr) {
  let c = startChr;
  let state = 0;
  let hasUnderscores = false;
  if (c === 105) {
    if (ctx.s.charCodeAt(++ctx.p) !== 110 || ctx.s.charCodeAt(++ctx.p) !== 102)
      TomlError.x("invalid value", ctx, startPtr);
    return ctx.p++, (sign || 1) / 0;
  }
  if (c === 110) {
    if (ctx.s.charCodeAt(++ctx.p) !== 97 || ctx.s.charCodeAt(++ctx.p) !== 110)
      TomlError.x("invalid value", ctx, startPtr);
    return ctx.p++, NaN;
  }
  if (c === 48) {
    if (++ctx.p >= ctx.s.length || isEndOfValue(c = ctx.s.charCodeAt(ctx.p), endChr))
      return ctx.bi === true ? 0n : 0;
    if (!sign) {
      if (c === 120)
        return parseIntegerBaseN(ctx, startPtr, 16, endChr);
      else if (c === 98)
        return parseIntegerBaseN(ctx, startPtr, 2, endChr);
      else if (c === 111)
        return parseIntegerBaseN(ctx, startPtr, 8, endChr);
    }
    if (c === 46)
      state = 2;
    else if (c === 101 || c === 69)
      state = 4;
    else
      TomlError.x("illegal leading zero", ctx, startPtr);
  } else if (!isDigit(c))
    TomlError.x("invalid value", ctx, startPtr);
  while (++ctx.p < ctx.s.length && (c = ctx.s.charCodeAt(ctx.p), !isEndOfValue(c, endChr))) {
    if (!state)
      state = 1;
    if (c === 95) {
      if (!(state & 1))
        TomlError.x("illegal underscore", ctx);
      state += 11;
      hasUnderscores = true;
    } else if (state === 1 && c === 46)
      state = 2;
    else if ((state === 1 || state === 3) && (c === 101 || c === 69))
      state = 4;
    else if (state === 4 && (c === 43 || c === 45)) {
    } else if (!isDigit(c))
      TomlError.x(`illegal character in numeric literal`, ctx);
    else if (state > 9)
      state -= 11;
    else if (!(state & 1))
      state++;
  }
  if (!state) {
    let val = (startChr - 48) * (sign || 1);
    return ctx.bi === true ? BigInt(val) : val;
  }
  if (!(state & 1))
    TomlError.x("unfinished numeric value", ctx, startPtr);
  let str = ctx.s.slice(startPtr, ctx.p);
  if (hasUnderscores)
    str = str.replaceAll("_", "");
  return state > 1 ? parseFloat(str) : parseInteger(ctx, str, 10, startPtr);
}
function parseIntegerBaseN(ctx, startPtr, base, endChr) {
  let c, underscore = 1;
  while (++ctx.p < ctx.s.length && (c = ctx.s.charCodeAt(ctx.p), !isEndOfValue(c, endChr))) {
    if (c === 95) {
      if (underscore & 1)
        TomlError.x("illegal underscore", ctx);
      underscore = 3;
    } else if (!isDigit(c, base))
      TomlError.x(`illegal character in numeric literal`, ctx);
    else if (underscore & 1)
      underscore--;
  }
  if (underscore & 1)
    TomlError.x("unfinished numeric value", ctx);
  let str = ctx.s.slice(startPtr + 2, ctx.p);
  if (underscore)
    str = str.replaceAll("_", "");
  return parseInteger(ctx, str, base, startPtr);
}
function parseInteger(ctx, str, base, startPtr) {
  if (ctx.bi !== true)
    int: {
      let val = parseInt(str, base);
      if (!Number.isSafeInteger(val)) {
        if (ctx.bi)
          break int;
        TomlError.x("integer value cannot be represented losslessly", ctx, startPtr);
      }
      return val;
    }
  return base === 10 ? BigInt(str) : BigInt((base === 2 ? "0b" : base === 8 ? "0o" : "0x") + str);
}
function parseDate(ctx, c, endChr) {
  let startPtr = ctx.p++, unsafeSeparator;
  if (!isDigit(c) || !isDigit(ctx.s.charCodeAt(ctx.p++)) || !isDigit(ctx.s.charCodeAt(ctx.p++)) || !isDigit(ctx.s.charCodeAt(ctx.p++))) {
    return parseNumber(ctx, ctx.p = startPtr, c, 0, endChr);
  }
  ctx.p += 5;
  if (!isDigit(ctx.s.charCodeAt(ctx.p++)))
    TomlError.x("invalid date-time: date part is malformed", ctx, startPtr);
  if (ctx.p >= ctx.s.length || ((c = ctx.s.charCodeAt(ctx.p)) !== 32 || (unsafeSeparator = true, !isDigit(ctx.s.charCodeAt(ctx.p + 1)))) && c !== 84 && c !== 116) {
    let t2 = ctx.s.slice(startPtr, ctx.p);
    return readDate(ctx, t2, 3, false, startPtr);
  }
  if (ctx.s.charCodeAt(ctx.p += 3) !== 58)
    TomlError.x("invalid date-time: time part is malformed", ctx, startPtr);
  if (ctx.s.charCodeAt(ctx.p += 3) === 58)
    ctx.p += 3;
  if (ctx.s.charCodeAt(ctx.p) === 46)
    while (isDigit(ctx.s.charCodeAt(++ctx.p)))
      ;
  if (c = ctx.s.charCodeAt(ctx.p)) {
    if (c === 90 || c === 122) {
      let t2 = ctx.s.slice(startPtr, ++ctx.p);
      return readDate(ctx, t2, 1, unsafeSeparator, startPtr, "[+00:00]");
    }
    if (c === 43 || c === 45) {
      let t2 = ctx.s.slice(startPtr, ctx.p += 6);
      return readDate(ctx, t2, 1, unsafeSeparator, startPtr, !ctx.ld && "[" + ctx.s.slice(ctx.p - 6, ctx.p) + "]");
    }
  }
  let t = ctx.s.slice(startPtr, ctx.p);
  return readDate(ctx, t, 2, unsafeSeparator, startPtr);
}
function parseTime(ctx, c, endChr) {
  let start = ctx.p;
  if (!isDigit(c) || !isDigit(ctx.s.charCodeAt(++ctx.p))) {
    return parseNumber(ctx, --ctx.p, c, 0, endChr);
  }
  if (ctx.s.charCodeAt(ctx.p += 4) === 58)
    ctx.p += 3;
  if (ctx.s.charCodeAt(ctx.p) === 46)
    while (isDigit(ctx.s.charCodeAt(++ctx.p)))
      ;
  let t = ctx.s.slice(start, ctx.p);
  return readDate(ctx, t, 4, false, start);
}
function readDate(ctx, str, type, unsafeDelim, errPtr, temporalSuffix) {
  if (ctx.ld) {
    let date = new TomlDate(str, type, unsafeDelim);
    if (!date.isValid())
      TomlError.x("invalid date", ctx, errPtr);
    return date;
  }
  try {
    if (temporalSuffix)
      str += temporalSuffix;
    switch (type) {
      case 1:
        return Temporal.ZonedDateTime.from(str);
      case 2:
        return Temporal.PlainDateTime.from(str);
      case 3:
        return Temporal.PlainDate.from(str);
      case 4:
        return Temporal.PlainTime.from(str);
    }
  } catch (e) {
    TomlError.x(e instanceof Error ? e.message : "" + e, ctx, errPtr);
  }
}

// node_modules/smol-toml/dist/util.js
function skipComment(ctx) {
  for (; ctx.p < ctx.s.length; ctx.p++) {
    let c = ctx.s.charCodeAt(ctx.p);
    if (c === 10)
      break;
    if (c === 13 && ctx.s.charCodeAt(ctx.p + 1) === 10) {
      ctx.p++;
      break;
    }
    if (c < 32 && c !== 9 || c === 127) {
      TomlError.x("control characters are not allowed in comments", ctx);
    }
  }
}
function skipVoid(ctx, banNewLines, banComments) {
  let c;
  while (ctx.p < ctx.s.length) {
    while (ctx.p < ctx.s.length && ((c = ctx.s.charCodeAt(ctx.p)) === 32 || c === 9 || !banNewLines && (c === 10 || c === 13 && ctx.s.charCodeAt(ctx.p + 1) === 10)))
      ctx.p++;
    if (banComments || c !== 35)
      break;
    skipComment(ctx);
  }
}

// node_modules/smol-toml/dist/struct.js
function parseKey(ctx, end = 61) {
  let startPtr;
  let state = 0;
  let parsed = [];
  let sliceStart;
  let c = ctx.s.charCodeAt(startPtr = ctx.p);
  do {
    if (c === end) {
      if (!state)
        TomlError.x("unexpected end of key", ctx);
      if (state === 1)
        parsed.push(ctx.s.slice(sliceStart, ctx.p));
      return ctx.p++, parsed;
    } else if (c === 46) {
      if (!state)
        TomlError.x("illegal empty bare key", ctx);
      if (state === 1)
        parsed.push(ctx.s.slice(sliceStart, ctx.p));
      state = 0;
    } else if (!state && (c === 34 || c === 39)) {
      if (c === ctx.s.charCodeAt(ctx.p + 1) && c === ctx.s.charCodeAt(ctx.p + 2))
        TomlError.x("illegal quoted key: multiline strings are not allowed", ctx);
      parsed.push(parseString(ctx));
      state = 2;
      ctx.p--;
    } else if (c === 32 || c === 9) {
      if (state === 1) {
        parsed.push(ctx.s.slice(sliceStart, ctx.p));
        state = 2;
      }
    } else if (state === 2 || c < 48 && c !== 45 || c > 57 && c < 65 || c > 90 && c < 97 && c !== 95 || c > 122) {
      TomlError.x("illegal character in key", ctx);
    } else if (!state) {
      state = 1;
      sliceStart = ctx.p;
    }
  } while (c = ctx.s.charCodeAt(++ctx.p));
  TomlError.x("incomplete key-value: cannot find end of key", ctx, startPtr);
}
function parseInlineTable(ctx) {
  let startPtr = ctx.p++;
  let res = /* @__PURE__ */ Object.create(null);
  let seen = /* @__PURE__ */ new Set();
  let c;
  while (ctx.p < ctx.s.length) {
    skipVoid(ctx);
    if ((c = ctx.s.charCodeAt(ctx.p)) === 125) {
      ctx.p++;
      return res;
    }
    let k;
    let t = res;
    let hasOwn = false;
    let errPtr = ctx.p;
    let key = parseKey(ctx);
    for (let i = 0; i < key.length; i++) {
      if (i)
        t = hasOwn ? t[k] : t[k] = /* @__PURE__ */ Object.create(null);
      k = key[i];
      if ((hasOwn = Object.hasOwn(t, k)) && (typeof t[k] !== "object" || seen.has(t[k]))) {
        TomlError.x("trying to redefine an already defined value", ctx, errPtr);
      }
      let unsafe = k === "__proto__";
      if (ctx.uk && (unsafe || k === "constructor")) {
        t = ctx.uk !== 1 && TomlError.x("document contains an unsafe property", ctx, errPtr);
        break;
      }
      if (!hasOwn && unsafe) {
        Object.defineProperty(t, k, { enumerable: true, configurable: true, writable: true });
      }
    }
    if (hasOwn) {
      TomlError.x("trying to redefine an already defined value", ctx, errPtr);
    }
    skipVoid(ctx, true, true);
    let value2 = extractValue(
      ctx,
      125
      /* } */
    );
    if (t && typeof (t[k] = value2) === "object")
      seen.add(value2);
    skipVoid(ctx);
    if ((c = ctx.s.charCodeAt(ctx.p++)) === 125) {
      return res;
    }
    if (c !== 44)
      TomlError.x("expected comma or end of structure", ctx, ctx.p - 1);
  }
  TomlError.x("unfinished table", ctx, startPtr);
}
function parseArray(ctx) {
  let startPtr = ctx.p++;
  let res = [];
  let c;
  while (ctx.p < ctx.s.length) {
    skipVoid(ctx);
    if ((c = ctx.s.charCodeAt(ctx.p)) === 93) {
      ctx.p++;
      return res;
    }
    res.push(extractValue(
      ctx,
      93
      /* ] */
    ));
    skipVoid(ctx);
    if ((c = ctx.s.charCodeAt(ctx.p++)) === 93) {
      return res;
    }
    if (c !== 44)
      TomlError.x("expected comma or end of structure", ctx, ctx.p - 1);
  }
  TomlError.x("unfinished array", ctx, startPtr);
}

// node_modules/smol-toml/dist/parse.js
function peekTable(ctx, key, table, meta, type) {
  let t = table;
  let m = meta;
  let k;
  let hasOwn = false;
  let state;
  for (let i = 0; i < key.length; i++) {
    if (i) {
      t = hasOwn ? t[k] : t[k] = /* @__PURE__ */ Object.create(null);
      m = (state = m[k]).c;
      if (type === 0 && (state.t === 1 || state.t === 2)) {
        return null;
      }
      if (state.t === 2) {
        let l = t.length - 1;
        t = t[l];
        m = m[l].c;
      }
    }
    k = key[i];
    if ((hasOwn = Object.hasOwn(t, k)) && m[k]?.t === 0 && m[k]?.d) {
      return null;
    }
    if (!hasOwn) {
      let unsafe = k === "__proto__";
      if (ctx.uk && (unsafe || k === "constructor"))
        return false;
      if (unsafe) {
        Object.defineProperty(t, k, { enumerable: true, configurable: true, writable: true });
        Object.defineProperty(m, k, { enumerable: true, configurable: true, writable: true });
      }
      m[k] = {
        t: i < key.length - 1 && type === 2 ? 3 : type,
        d: false,
        i: 0,
        c: /* @__PURE__ */ Object.create(null)
      };
    }
  }
  state = m[k];
  if (state.t !== type && !(type === 1 && state.t === 3)) {
    return null;
  }
  if (type === 2) {
    if (!state.d) {
      state.d = true;
      t[k] = [];
    }
    t[k].push(t = /* @__PURE__ */ Object.create(null));
    state.c[state.i++] = state = { t: 1, d: false, i: 0, c: /* @__PURE__ */ Object.create(null) };
  }
  if (state.d) {
    return null;
  }
  state.d = true;
  if (type === 1) {
    t = hasOwn ? t[k] : t[k] = /* @__PURE__ */ Object.create(null);
  } else if (type === 0 && hasOwn) {
    return null;
  }
  return [k, t, state.c];
}
function validateTablePeek(ctx, peek, ptr) {
  if (peek === null || ctx.uk === 2)
    TomlError.x(peek === null ? "trying to redefine an already defined table or value" : "document contains an unsafe property", ctx, ptr);
}
function parse(toml, options = {}) {
  let ctx = {
    s: toml,
    p: 0,
    d: options.maxDepth ?? 1e3,
    bi: options.integersAsBigInt ?? false,
    ld: options.useLegacyDate ?? true,
    uk: options.unsafeKeyBehaviour === "throw" ? 2 : options.unsafeKeyBehaviour === "drop" ? 1 : 0
  };
  let res = /* @__PURE__ */ Object.create(null);
  let meta = /* @__PURE__ */ Object.create(null);
  let tmp;
  let skipping = false;
  let tbl = res;
  let m = meta;
  if (toml.charCodeAt(0) === 65279)
    ctx.p++;
  skipVoid(ctx);
  while (ctx.p < toml.length) {
    if (toml.charCodeAt(ctx.p) === 91) {
      let isTableArray = toml.charCodeAt(++ctx.p) === 91;
      tmp = ctx.p += +isTableArray;
      skipping = false;
      let k = parseKey(
        ctx,
        93
        /* ] */
      );
      if (isTableArray) {
        if (toml.charCodeAt(ctx.p) !== 93) {
          TomlError.x("expected end of table array declaration", ctx);
        }
        ctx.p++;
      }
      let p = peekTable(
        ctx,
        k,
        res,
        meta,
        isTableArray ? 2 : 1
        /* Type.EXPLICIT */
      );
      if (!p) {
        validateTablePeek(ctx, p, tmp);
        skipping = true;
      } else {
        m = p[2];
        tbl = p[1];
      }
    } else {
      tmp = ctx.p;
      let k = parseKey(ctx);
      let p = peekTable(
        ctx,
        k,
        tbl,
        m,
        0
        /* Type.DOTTED */
      );
      if (!p && !skipping)
        validateTablePeek(ctx, p, tmp);
      skipVoid(ctx, true, true);
      let v = extractValue(ctx, void 0);
      if (p && !skipping)
        p[1][p[0]] = v;
    }
    skipVoid(ctx, true);
    if (ctx.p < toml.length && (tmp = toml.charCodeAt(ctx.p)) !== 10 && (tmp !== 13 || toml.charCodeAt(ctx.p + 1) !== 10)) {
      TomlError.x("each key-value declaration must be followed by an end-of-line", ctx);
    }
    skipVoid(ctx);
  }
  return res;
}

// node_modules/smol-toml/dist/stringify.js
var HAS_WELLFORMED = !!"".isWellFormed;

// src/core/repo.ts
var import_yaml = __toESM(require_dist(), 1);
var SKIP_DIRS = /(^|\/)(node_modules|\.git|dist|build|out|target|vendor|\.next|\.venv|venv|__pycache__|\.proof)(\/|$)/;
var RepoContext = class {
  root;
  isGit;
  degraded = [];
  fileList = null;
  dirList = null;
  texts = /* @__PURE__ */ new Map();
  lineCache = /* @__PURE__ */ new Map();
  ignoreCache = /* @__PURE__ */ new Map();
  pkgs = null;
  broken = /* @__PURE__ */ new Map();
  parsed = /* @__PURE__ */ new Map();
  generated = null;
  constructor(cwd) {
    const git = gitAvailable() ? repoRoot(cwd) : null;
    this.root = git ?? resolve(cwd);
    this.isGit = Boolean(git);
    if (!gitAvailable()) this.degrade("git", "git is not installed: no ignore rules, no identifier lookups, no history");
    else if (!git) this.degrade("git", `${this.root} is not a git repository: no ignore rules, identifier lookups or history`);
  }
  degrade(subject, reason) {
    if (!this.degraded.some((d) => d.subject === subject && d.reason === reason)) this.degraded.push({ subject, reason });
  }
  /** Tracked and untracked files git does not ignore (or a filesystem walk outside git). */
  get files() {
    if (!this.fileList) {
      this.fileList = this.isGit ? listFiles(this.root) : walk(this.root);
    }
    return this.fileList;
  }
  get dirs() {
    if (!this.dirList) {
      const dirs = /* @__PURE__ */ new Set();
      for (const f of this.files) for (let d = posix3.dirname(f); d !== "." && !dirs.has(d); d = posix3.dirname(d)) dirs.add(d);
      this.dirList = dirs;
    }
    return this.dirList;
  }
  /** Repository-relative path, or null when it leaves the repository. */
  rel(path2, base = "") {
    const abs = path2.startsWith("~/") ? join4(homedir3(), path2.slice(2)) : isAbsolute(path2) ? path2 : resolve(this.root, base, path2);
    const r = relative(this.root, abs).split("\\").join("/");
    if (r.startsWith("..") || isAbsolute(r)) return null;
    return r;
  }
  exists(rel) {
    return existsSync3(join4(this.root, rel));
  }
  isDir(rel) {
    try {
      return statSync2(join4(this.root, rel)).isDirectory();
    } catch {
      return false;
    }
  }
  /** The file split into lines, cached. */
  lines(rel) {
    let out = this.lineCache.get(rel);
    if (!out) {
      out = (this.read(rel) ?? "").split("\n");
      this.lineCache.set(rel, out);
    }
    return out;
  }
  /** A file's text by repository-relative path, or by absolute path for files outside it (user instructions). */
  read(rel) {
    if (!this.texts.has(rel)) {
      try {
        this.texts.set(rel, readFileSync2(isAbsolute(rel) ? rel : join4(this.root, rel), "utf8"));
      } catch {
        this.texts.set(rel, null);
      }
    }
    return this.texts.get(rel) ?? null;
  }
  /**
   * Whether git ignores `rel`, or any folder above it. Folders are queried with a trailing slash so
   * directory-only patterns (`bin/`) match even when the folder does not exist.
   */
  ignored(rel) {
    if (!this.isGit) return null;
    const clean = rel.replace(/\/$/, "");
    const parts = clean.split("/");
    const queries = parts.map((_, i) => parts.slice(0, i + 1).join("/")).flatMap((p, i) => i < parts.length - 1 || rel.endsWith("/") ? [`${p}/`] : [p, `${p}/`]);
    this.lookupIgnored(queries.filter((q) => !this.ignoreCache.has(q)));
    return queries.find((q) => this.ignoreCache.get(q)) ?? null;
  }
  /** Warm the ignore cache for many paths with one git process. */
  primeIgnored(rels) {
    if (!this.isGit) return;
    const queries = /* @__PURE__ */ new Set();
    for (const rel of rels) {
      const parts = rel.replace(/\/$/, "").split("/");
      parts.forEach((_, i) => {
        const p = parts.slice(0, i + 1).join("/");
        queries.add(`${p}/`);
        if (i === parts.length - 1) queries.add(p);
      });
    }
    this.lookupIgnored([...queries].filter((q) => !this.ignoreCache.has(q)));
  }
  lookupIgnored(all2) {
    const queries = all2.filter((q) => {
      const n = posix3.normalize(q);
      const inside = q !== "" && !isAbsolute(q) && !q.startsWith("~") && n !== ".." && !n.startsWith("../");
      if (!inside) this.ignoreCache.set(q, false);
      return inside;
    });
    if (!queries.length) return;
    const hits = ignoredPaths(this.root, queries);
    if (!hits) this.degrade("git check-ignore", "failed; ignored output may be reported as missing");
    for (const q of queries) this.ignoreCache.set(q, hits?.has(q) ?? false);
  }
  /** Every package.json in the repository. One that does not parse is a degradation, never a crash. */
  get packages() {
    if (!this.pkgs) {
      this.pkgs = [];
      for (const file of this.files.filter((f) => /(^|\/)package\.json$/.test(f) && !SKIP_DIRS.test(f))) {
        const text4 = this.read(file);
        if (text4 === null) continue;
        try {
          const json = JSON.parse(text4);
          const rec = (v) => v && typeof v === "object" && !Array.isArray(v) ? v : {};
          const ws = json.workspaces;
          this.pkgs.push({
            dir: posix3.dirname(file) === "." ? "" : posix3.dirname(file),
            file,
            name: typeof json.name === "string" ? json.name : null,
            scripts: rec(json.scripts),
            deps: { ...rec(json.peerDependencies), ...rec(json.optionalDependencies), ...rec(json.devDependencies), ...rec(json.dependencies) },
            engines: rec(json.engines),
            workspaces: Array.isArray(ws) ? ws.map(String) : Array.isArray(ws?.packages) ? ws.packages.map(String) : []
          });
        } catch (err) {
          const reason = err instanceof Error ? err.message.split("\n")[0] ?? "invalid JSON" : String(err);
          this.broken.set(file, reason);
          this.degrade(file, `does not parse (${reason}); its scripts, dependencies and engines are not checked`);
        }
      }
    }
    return this.pkgs;
  }
  /** The parse error of a manifest that failed, or null. */
  brokenManifest(file) {
    void this.packages;
    return this.broken.get(file) ?? null;
  }
  /** Folders that hold a package manifest of any ecosystem, used to resolve paths written relative to a sub-project. */
  get projectDirs() {
    const manifests = /(^|\/)(package\.json|pyproject\.toml|go\.mod|Cargo\.toml|Gemfile|composer\.json|pom\.xml|build\.gradle(\.kts)?|setup\.py|requirements\.txt|mix\.exs|deno\.json)$/;
    const dirs = /* @__PURE__ */ new Set();
    for (const f of this.files) if (manifests.test(f) && !SKIP_DIRS.test(f) && f.includes("/")) dirs.add(posix3.dirname(f));
    for (const f of this.badManifestDirs()) dirs.add(f);
    return [...dirs].sort((a2, b) => a2.split("/").length - b.split("/").length || a2.localeCompare(b));
  }
  badManifestDirs() {
    void this.packages;
    return [...this.broken.keys()].map((f) => posix3.dirname(f)).filter((d) => d !== ".");
  }
  /**
   * A TOML or YAML or JSON file parsed once; a parse failure is recorded as a degradation and returns null.
   * `quiet` skips the degradation, for files read only to look something up (templated YAML is common).
   */
  structured(rel, opts = {}) {
    if (this.parsed.has(rel)) return this.parsed.get(rel);
    const text4 = this.read(rel);
    let value2 = null;
    if (text4 !== null) {
      try {
        if (/\.toml$/.test(rel) || /(^|\/)(Cargo\.lock)$/.test(rel)) value2 = parse(text4);
        else if (/\.ya?ml$/.test(rel)) value2 = (0, import_yaml.parse)(text4, { uniqueKeys: false });
        else if (/\.json$/.test(rel)) value2 = JSON.parse(text4);
      } catch (err) {
        if (!opts.quiet) this.degrade(rel, `does not parse (${err instanceof Error ? err.message.split("\n")[0] ?? "parse error" : String(err)}); claims it would prove are not checked`);
        value2 = null;
      }
    }
    this.parsed.set(rel, value2);
    return value2;
  }
  /**
   * Pathspecs that keep generated and vendored files out of evidence: `.gitattributes` entries marked
   * `linguist-generated` or `linguist-vendored` (the convention GitHub reads), minified bundles and vendor folders.
   */
  get generatedExcludes() {
    if (!this.generated) {
      const patterns = ["**/*.min.js", "**/*.min.css", "**/*.map", "vendor/**", "**/vendor/**", "third_party/**"];
      for (const file of this.files.filter((f) => /(^|\/)\.gitattributes$/.test(f))) {
        const base = posix3.dirname(file) === "." ? "" : `${posix3.dirname(file)}/`;
        for (const line of (this.read(file) ?? "").split("\n")) {
          const [pattern, ...attrs] = line.trim().split(/\s+/);
          if (!pattern || pattern.startsWith("#") || !attrs.some((a2) => /^linguist-(generated|vendored)(=true)?$/.test(a2))) continue;
          const rooted = pattern.startsWith("/") ? pattern.slice(1) : pattern.includes("/") ? pattern : `**/${pattern}`;
          patterns.push(`${base}${rooted}`);
        }
      }
      this.generated = patterns.map((p) => `:(exclude,glob)${p}`);
    }
    return this.generated;
  }
  /** Files matching a regular expression over the repository-relative path. */
  find(re) {
    return this.files.filter((f) => re.test(f) && !SKIP_DIRS.test(f));
  }
  /** Path of `rel` as seen from the folder of `fromFile`. */
  static near(fromFile, rel) {
    return posix3.normalize(posix3.join(posix3.dirname(fromFile), rel));
  }
};
function walk(root, base = "") {
  const out = [];
  let entries = [];
  try {
    entries = readdirSync2(join4(root, base), { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const rel = base ? `${base}/${e.name}` : e.name;
    if (SKIP_DIRS.test(rel)) continue;
    if (e.isDirectory()) out.push(...walk(root, rel));
    else out.push(rel);
  }
  return out;
}

// src/core/syntax.ts
import { existsSync as existsSync4 } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join as join5 } from "node:path";
import { fileURLToPath } from "node:url";
var GRAMMAR_OF = [
  [/\.go$/, "go"],
  [/\.(ts|mts|cts)$/, "typescript"],
  [/\.tsx$/, "tsx"],
  [/\.(js|mjs|cjs|jsx)$/, "javascript"],
  [/\.pyi?$/, "python"],
  [/\.rs$/, "rust"],
  [/\.java$/, "java"],
  [/(\.rb|\.rake|(^|\/)(Rakefile|Gemfile))$/, "ruby"],
  [/\.php$/, "php"],
  [/\.cs$/, "c-sharp"],
  [/\.(c|h|cc|cpp|cxx|hpp|hh)$/, "cpp"],
  [/(\.(sh|bash|zsh)|(^|\/)(\.bashrc|\.zshrc|\.profile))$/, "bash"]
];
var GRAMMARS = [...new Set(GRAMMAR_OF.map(([, g]) => g))];
var NO_GRAMMAR = [
  [/\.kts?$/, "Kotlin"],
  [/\.swift$/, "Swift"],
  [/\.scala$/, "Scala"],
  [/\.(ex|exs)$/, "Elixir"],
  [/\.dart$/, "Dart"],
  [/\.lua$/, "Lua"],
  [/\.(fs|fsx)$/, "F#"],
  [/\.(clj|cljs)$/, "Clojure"],
  [/\.(hs)$/, "Haskell"],
  [/\.(zig)$/, "Zig"]
];
function grammarFor(file, text4) {
  for (const [re, lang] of GRAMMAR_OF) if (re.test(file)) return lang;
  if (text4 && /^#!.*\b(ba|z)?sh\b/.test(text4)) return "bash";
  return null;
}
function runtimeIn(dir) {
  for (const name of ["tree-sitter.cjs", "tree-sitter.js"]) if (existsSync4(join5(dir, name))) return join5(dir, name);
  return null;
}
function grammarDir() {
  const candidates = [];
  if (process.env.PROOF_GRAMMARS) candidates.push(process.env.PROOF_GRAMMARS);
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    candidates.push(join5(here, "grammars"));
    candidates.push(join5(here, "..", "..", "node_modules", "@vscode", "tree-sitter-wasm", "wasm"));
  } catch {
  }
  try {
    const req = createRequire(import.meta.url);
    candidates.push(join5(dirname(req.resolve("@vscode/tree-sitter-wasm/package.json")), "wasm"));
  } catch {
  }
  return candidates.find((d) => runtimeIn(d) !== null) ?? null;
}
var Syntax = class {
  mod = null;
  dir = null;
  failed = null;
  languages = /* @__PURE__ */ new Map();
  trees = /* @__PURE__ */ new Map();
  parser = null;
  repo;
  constructor(repo) {
    this.repo = repo;
  }
  async init() {
    if (this.mod) return true;
    if (this.failed) return false;
    this.dir = grammarDir();
    if (!this.dir) {
      this.failed = "tree-sitter grammars not found; definitions are matched by line patterns";
      this.repo.degrade("syntax", this.failed);
      return false;
    }
    try {
      const req = createRequire(import.meta.url);
      const mod = req(runtimeIn(this.dir) ?? join5(this.dir, "tree-sitter.js"));
      const dir = this.dir;
      await mod.Parser.init({ locateFile: (f) => join5(dir, f) });
      this.mod = mod;
      this.parser = new mod.Parser();
      return true;
    } catch (err) {
      this.failed = `tree-sitter failed to start (${err instanceof Error ? err.message : String(err)}); definitions are matched by line patterns`;
      this.repo.degrade("syntax", this.failed);
      return false;
    }
  }
  async language(name) {
    if (this.languages.has(name)) return this.languages.get(name) ?? null;
    let lang = null;
    try {
      if (this.mod && this.dir) lang = await this.mod.Language.load(join5(this.dir, `tree-sitter-${name}.wasm`));
    } catch (err) {
      this.repo.degrade(`grammar ${name}`, `failed to load (${err instanceof Error ? err.message : String(err)}); ${name} files are matched by line patterns`);
    }
    this.languages.set(name, lang);
    return lang;
  }
  /** Parse tree of a repository file, or null when no grammar covers it. */
  async tree(file) {
    if (this.trees.has(file)) return this.trees.get(file) ?? null;
    const text4 = this.repo.read(file);
    const name = grammarFor(file, text4);
    let tree = null;
    if (text4 !== null && name && text4.length < 2e6 && await this.init()) {
      const lang = await this.language(name);
      if (lang && this.parser) {
        this.parser.setLanguage(lang);
        tree = this.parser.parse(text4);
      }
    }
    this.trees.set(file, tree);
    return tree;
  }
};
var COMMENT = /comment/;
var STRING = /^(string|string_fragment|string_content|template_string|interpreted_string_literal|raw_string_literal|string_literal|char_literal|encapsed_string|heredoc_body|heredoc_content|raw_string|interpolated_string_expression|verbatim_string_literal|string_value)$/;
var DEFINITION_PARENT = /declaration|definition|declarator|_spec$|signature|_item$|^method|^function|^class|^interface|^enum|^struct|^type_alias|^module$|^namespace|^trait|^impl|^field_declaration|^property_signature|^public_field_definition|^pair$|^variable_assignment$|^assignment$|^decorated_definition$|^macro_definition$|^singleton_method$/;
var NAME_TYPES = /identifier$|^word$|^name$|^constant$|^variable_name$|^property_identifier$|^type_identifier$|^field_identifier$|^package_identifier$|^shorthand_property_identifier$|^namespace_identifier$/;
var ENV_READ = /(getenv|environ|env\[|ENV\[|env::var|GetEnvironmentVariable|process\.env|os\.Getenv|LookupEnv|System\.getenv|import\.meta\.env)/;
function isDefinitionName(node2) {
  for (let anc = node2.parent, depth = 0; anc && depth < 3; anc = anc.parent, depth++) {
    if (!DEFINITION_PARENT.test(anc.type)) continue;
    const names = [...anc.childrenForFieldName("name"), ...anc.childrenForFieldName("left"), ...anc.childrenForFieldName("key")];
    if (names.some((n) => n.startPosition.row === node2.startPosition.row && n.startPosition.column === node2.startPosition.column)) return true;
    const declarators = anc.namedChildren.filter((c) => /declarator|_spec$/.test(c.type));
    if (declarators.some((d) => d.childForFieldName("name")?.startPosition.column === node2.startPosition.column && d.startPosition.row === node2.startPosition.row)) return true;
  }
  return false;
}
async function classifyOccurrence(syntax, repo, file, line, column, name) {
  const tree = await syntax.tree(file);
  const lines = repo.lines(file);
  const lineText = lines[line - 1] ?? "";
  if (!tree) return classifyByPattern(file, lineText, name, { lines, index: line - 1 });
  const row = line - 1;
  const col = Math.max(0, column - 1);
  let node2 = tree.rootNode.descendantForPosition({ row, column: col }, { row, column: col + name.length });
  while (node2 && node2.text !== name && node2.parent && node2.parent.text.length <= name.length + 2) node2 = node2.parent;
  if (!node2) return "none";
  for (let anc = node2; anc; anc = anc.parent) {
    if (COMMENT.test(anc.type)) return "comment";
    if (STRING.test(anc.type)) {
      let str = anc;
      while (str.parent && STRING.test(str.parent.type)) str = str.parent;
      return stringLevel(lineText, name, column, unquote(str.text), declaresValue(str));
    }
  }
  if (NAME_TYPES.test(node2.type) && isDefinitionName(node2)) return "definition";
  return "reference";
}
var esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
var unquote = (t) => t.replace(/^[rbfuRBFU@$]*("{3}|'{3}|["'`])/, "").replace(/("{3}|'{3}|["'`])$/, "");
var SQL_TYPES = "(?:INTEGER|INT|BIGINT|SMALLINT|TINYINT|TEXT|VARCHAR|CHAR|CHARACTER|BOOLEAN|BOOL|REAL|DOUBLE|FLOAT|NUMERIC|DECIMAL|DATE|TIME|TIMESTAMP|TIMESTAMPTZ|DATETIME|INTERVAL|JSON|JSONB|UUID|BLOB|BYTEA|SERIAL|BIGSERIAL|CITEXT|INET|MONEY)";
var SQL_STRONG = /\b(?:SELECT|UPDATE|INSERT INTO|DELETE FROM|WHERE|SET|JOIN|ORDER BY|GROUP BY|RETURNING|VALUES|ON CONFLICT|COALESCE|IS NOT NULL|IS NULL)\b/;
var SQL_WEAK = /\b(?:AND|OR|THEN|WHEN|CASE|ELSE|END|AS|FROM|LIMIT|DESC|ASC|IN|NOT)\b/g;
var looksLikeSql = (line) => SQL_STRONG.test(line) || (line.match(SQL_WEAK) ?? []).length >= 2;
var VALUE_HOLDER = /^(const_spec|var_spec|const_declaration|var_declaration|variable_declarator|lexical_declaration|enum_assignment|enum_member|enum_variant|enumerator|assignment|field_declaration|property_declaration|static_item|const_item|let_declaration|public_field_definition|property_signature|class_constant|const_element)$/;
function declaresValue(str) {
  for (let anc = str.parent, depth = 0; anc && depth < 3; anc = anc.parent, depth++) {
    if (/^(pair|keyed_element|dictionary_entry|key_value_pair|map_entry|element_value_pair)$/.test(anc.type)) {
      const key = anc.childForFieldName("key") ?? anc.namedChildren[0];
      return Boolean(key && key.startIndex <= str.startIndex && key.endIndex >= str.endIndex);
    }
    if (VALUE_HOLDER.test(anc.type)) return true;
    if (/call|argument|binary|comparison|return|if_|case|switch|match/.test(anc.type)) return false;
  }
  return false;
}
function stringLevel(lineText, name, column, content3, declares) {
  const n = esc(name);
  const q = '["`\\[]?';
  if (/^[A-Z][A-Z0-9_]*$/.test(name) && ENV_READ.test(lineText)) return "definition";
  if (content3 !== null && content3 === name) return declares ? "declaration" : "reference";
  const declaresSql = [
    new RegExp(`\\bCREATE\\s+(?:OR\\s+REPLACE\\s+)?(?:TEMP(?:ORARY)?\\s+|UNIQUE\\s+)?(?:TABLE|VIEW|INDEX|TYPE|SEQUENCE|MATERIALIZED\\s+VIEW)\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(?:\\w+\\.)?${q}${n}\\b`, "i"),
    new RegExp(`\\bADD\\s+(?:COLUMN\\s+)?(?:IF\\s+NOT\\s+EXISTS\\s+)?${q}${n}${q}\\s+\\w`, "i"),
    new RegExp(`^\\s*\\(?\\s*${q}${n}${q}\\s+${SQL_TYPES}\\b`, "i"),
    new RegExp(`\\bRENAME\\s+(?:COLUMN\\s+)?\\w+\\s+TO\\s+${q}${n}\\b`, "i")
  ];
  if (declaresSql.some((re) => re.test(lineText))) return "declaration";
  if (new RegExp(`\\b(?:json|yaml|toml|db|xml|bson|mapstructure|form|query|msgpack|koanf|env|hcl|gorm|protobuf)\\s*:\\s*"(?:[^"]*;)?(?:column:|name=)?${n}[,;"]`).test(lineText)) return "declaration";
  if (new RegExp(`\\b(?:rename|alias|serialization_alias|validation_alias|db_column|column_name|serialize|deserialize)\\s*=\\s*["']${n}["']`).test(lineText)) return "declaration";
  const at = column - 1;
  const before = lineText[at - 1] ?? "";
  const after = lineText[at + name.length] ?? "";
  const bounded2 = !/[\w$-]/.test(before) && !/[\w$-]/.test(after);
  if (bounded2 && looksLikeSql(lineText) && /^[a-z_][a-z0-9_]*$/.test(name)) return "reference";
  if (bounded2 && /[-./:]/.test(name) && content3 !== null && !/\s/.test(content3.trim())) return "reference";
  return "substring";
}
function quotedAround(lineText, column) {
  const at = column - 1;
  for (let start = at - 1; start >= 0; start--) {
    const q = lineText[start] ?? "";
    if (!/["'`]/.test(q)) continue;
    const end = lineText.indexOf(q, at);
    if (end < 0) return null;
    const before = lineText.slice(0, start).split(q).length - 1;
    return before % 2 === 0 ? lineText.slice(start + 1, end) : null;
  }
  return null;
}
var OWNER_TYPES = /^(class_declaration|class_definition|class_specifier|struct_specifier|class|abstract_class_declaration|interface_declaration|trait_declaration|enum_declaration|record_declaration|struct_declaration|object_declaration|type_spec|type_alias_declaration|struct_item|enum_item|trait_item|impl_item|union_item|module|module_declaration|internal_module|namespace_declaration|protocol_declaration)$/;
var bareType = (t) => t.replace(/<.*$|\[.*$/s, "").replace(/^[\s*&(]+|[\s)]+$/g, "").split(/[.:]+/).pop()?.match(/^[A-Za-z_]\w*/)?.[0] ?? null;
async function ownerOf(syntax, file, line, column, name) {
  const tree = await syntax.tree(file);
  if (!tree) return null;
  const row = line - 1;
  const col = Math.max(0, column - 1);
  let node2 = tree.rootNode.descendantForPosition({ row, column: col }, { row, column: col + name.length });
  while (node2 && node2.text !== name && node2.parent && node2.parent.text.length <= name.length + 2) node2 = node2.parent;
  for (let anc = node2?.parent ?? null; anc; anc = anc.parent) {
    if (anc.type === "method_declaration") {
      const receiver = anc.childForFieldName("receiver");
      if (receiver) {
        const param = receiver.namedChildren.find((c) => c.type === "parameter_declaration");
        const type = param?.childForFieldName("type")?.text;
        if (type) return bareType(type);
      }
    }
    if (anc.type === "qualified_identifier" && anc.parent?.type === "function_declarator") {
      const scope = anc.childForFieldName("scope")?.text;
      if (scope) return bareType(scope);
    }
    if (OWNER_TYPES.test(anc.type)) {
      const named = anc.childForFieldName("name") ?? (anc.type === "impl_item" ? anc.childForFieldName("type") : null);
      if (named) return bareType(named.text);
    }
  }
  return null;
}
var SHELL_KEYS = /^\s*-?\s*(?:run|script|command|cmd|entrypoint|args|before_script|after_script|exec)\s*:/;
function yamlValueLevel(lines, index2) {
  const line = lines[index2] ?? "";
  const single = line.match(/^\s*-?\s*[\w.-]+\s*:\s*(.+)$/);
  if (single && !/^[|>][-+]?\s*$/.test(single[1] ?? "")) {
    if (SHELL_KEYS.test(line)) return "reference";
    return /\s/.test((single[1] ?? "").trim().replace(/^["']|["']$/g, "")) ? "substring" : "reference";
  }
  const indent2 = line.search(/\S/);
  for (let i = index2 - 1; i >= 0; i--) {
    const parent = lines[i] ?? "";
    if (!parent.trim() || parent.search(/\S/) >= indent2) continue;
    if (/[|>][-+]?\s*$/.test(parent)) return SHELL_KEYS.test(parent) ? "reference" : "substring";
    return "reference";
  }
  return "reference";
}
function classifyByPattern(file, lineText, name, context) {
  const t = lineText.trim();
  const esc4 = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (/^(\/\/|#(?!!)|\*|\/\*|--|;|<!--|%|')/.test(t) && !/^#\s*(define|include)\b/.test(t)) return "comment";
  const inQuotes = new RegExp(`(["'\`])[^"'\`]*\\b${esc4}\\b[^"'\`]*\\1`).test(lineText);
  if (/\.(ya?ml|toml|ini|env|properties|json|jsonc|json5)$/.test(file) || /(^|\/)\.env/.test(file)) {
    if (new RegExp(`^\\s*-?\\s*["']?${esc4}["']?\\s*[:=]`).test(lineText)) return "declaration";
    if (new RegExp(`^\\s*(?:-\\s+|[\\w.-]+\\s*[:=]\\s*)["']?${esc4}["']?\\s*,?\\s*(?:#.*)?$`).test(lineText)) return "reference";
    if (/\.ya?ml$/.test(file) && context) return yamlValueLevel(context.lines, context.index);
    if (/\.json5?c?$/.test(file) && /^\s*"[^"]*"\s*:\s*"[^"]*\s[^"]*"/.test(lineText)) return "substring";
  }
  if (/\.sql$/i.test(file)) {
    const level = stringLevel(lineText, name, lineText.indexOf(name) + 1, null, false);
    return level === "substring" ? "reference" : level;
  }
  if (new RegExp(`\\b(func|function|def|class|interface|type|struct|enum|trait|impl|module|const|let|var|val|fun|fn|sub|macro|alias|object|record|protocol|extension)\\s+(\\([^)]*\\)\\s*)?${esc4}\\b`).test(lineText)) return "definition";
  if (new RegExp(`^\\s*(export\\s+)?${esc4}\\s*(\\(\\)\\s*\\{|=)`).test(lineText)) return "definition";
  if (inQuotes) {
    const exact = new RegExp(`(["'\`])${esc4}\\1`).exec(lineText);
    if (exact) return /(?:^|[^=!<>])=\s*$|:=\s*$|=>\s*$|:\s*$|^\s*$/.test(lineText.slice(0, exact.index)) ? "declaration" : "reference";
    const col = lineText.indexOf(name) + 1;
    return stringLevel(lineText, name, col, quotedAround(lineText, col), false);
  }
  return "reference";
}
async function shellEntries(syntax, repo, file) {
  const text4 = repo.read(file);
  if (text4 === null) return null;
  const tree = await syntax.tree(file);
  const out = /* @__PURE__ */ new Map();
  if (tree && grammarFor(file, text4) === "bash") {
    for (const fn of tree.rootNode.descendantsOfType("function_definition")) {
      const name = fn.childForFieldName("name")?.text;
      if (name && !out.has(name)) out.set(name, { line: fn.startPosition.row + 1, kind: "function" });
    }
    for (const item2 of tree.rootNode.descendantsOfType("case_item")) {
      for (const value2 of item2.childrenForFieldName("value")) {
        const label = value2.text.replace(/^["']|["']$/g, "");
        if (label && label !== "*" && !out.has(label)) out.set(label, { line: item2.startPosition.row + 1, kind: "case" });
      }
    }
    return out;
  }
  text4.split("\n").forEach((l, i) => {
    const fn = l.match(/^\s*(?:function\s+([\w:.-]+)|([\w:.-]+)\s*\(\)\s*\{?)/);
    const name = fn?.[1] ?? fn?.[2];
    if (name && !out.has(name)) out.set(name, { line: i + 1, kind: "function" });
    const cs = l.match(/^\s*([\w:.|"'-]+)\)/);
    if (cs?.[1]) {
      for (const label of cs[1].split("|").map((x) => x.replace(/^["']|["']$/g, ""))) if (label && label !== "*" && !out.has(label)) out.set(label, { line: i + 1, kind: "case" });
    }
  });
  return out;
}

// src/decisions.ts
import { spawnSync as spawnSync4 } from "node:child_process";
import { existsSync as existsSync5, readFileSync as readFileSync3, writeFileSync as writeFileSync2 } from "node:fs";
import { isAbsolute as isAbsolute2, join as join6 } from "node:path";
var sidecarPath = (file) => `${file}.proof.json`;
function loadDecisions(root, file) {
  const path2 = isAbsolute2(file) ? sidecarPath(file) : join6(root, sidecarPath(file));
  if (!existsSync5(path2)) return { records: [], error: null };
  try {
    const data = JSON.parse(readFileSync3(path2, "utf8"));
    if (!Array.isArray(data)) return { records: [], error: `${sidecarPath(file)} is not an array of records` };
    return { records: data.filter((r) => Boolean(r) && typeof r.statement_id === "string" && typeof r.kind === "string"), error: null };
  } catch (err) {
    return { records: [], error: `${sidecarPath(file)} does not parse (${err instanceof Error ? err.message.split("\n")[0] : String(err)})` };
  }
}
function appendDecisions(root, file, add) {
  if (!add.length) return;
  const { records } = loadDecisions(root, file);
  const path2 = isAbsolute2(file) ? sidecarPath(file) : join6(root, sidecarPath(file));
  writeFileSync2(path2, `${JSON.stringify([...records, ...add], null, 2)}
`);
}
var ageCache = /* @__PURE__ */ new Map();
function commitsSince(root, head) {
  if (!head) return null;
  const key = `${root}\0${head}`;
  if (!ageCache.has(key)) {
    const res = spawnSync4("git", ["rev-list", "--count", `${head}..HEAD`], { cwd: root, encoding: "utf8" });
    ageCache.set(key, res.status === 0 ? Number(res.stdout.trim()) : null);
  }
  return ageCache.get(key) ?? null;
}
function replayDecisions(root, statements, records) {
  const decisions = /* @__PURE__ */ new Map();
  for (const r of records) if (r.kind === "rule" || r.kind === "fact") decisions.set(r.statement_id, r);
  const ids = new Set(statements.map((s) => s.id));
  const reopened = [...decisions.values()].filter((r) => !ids.has(r.statement_id));
  const out = statements.map((s) => {
    const d = decisions.get(s.id);
    if (!d || s.kind === "marker" || s.status === "OVERRIDDEN") return s;
    const age = commitsSince(root, d.head);
    const when = age === null ? `on ${d.at.slice(0, 10)}` : age === 0 ? "at the current commit" : `${age} commit${age === 1 ? "" : "s"} ago`;
    if (s.status === "STALE") return { ...s, reason: `${s.reason} (decided as a ${d.kind} by ${d.by} ${when}, but the repository now contradicts it)` };
    return { ...s, status: "DECIDED", reason: `decided as a ${d.kind} by ${d.by} ${when}: ${d.reason}`, settled: true };
  });
  return { statements: out, reopened };
}

// src/parse/markdown.ts
import { createHash as createHash2 } from "node:crypto";

// node_modules/mdast-util-to-string/lib/index.js
var emptyOptions = {};
function toString(value2, options) {
  const settings = options || emptyOptions;
  const includeImageAlt = typeof settings.includeImageAlt === "boolean" ? settings.includeImageAlt : true;
  const includeHtml = typeof settings.includeHtml === "boolean" ? settings.includeHtml : true;
  return one(value2, includeImageAlt, includeHtml);
}
function one(value2, includeImageAlt, includeHtml) {
  if (node(value2)) {
    if ("value" in value2) {
      return value2.type === "html" && !includeHtml ? "" : value2.value;
    }
    if (includeImageAlt && "alt" in value2 && value2.alt) {
      return value2.alt;
    }
    if ("children" in value2) {
      return all(value2.children, includeImageAlt, includeHtml);
    }
  }
  if (Array.isArray(value2)) {
    return all(value2, includeImageAlt, includeHtml);
  }
  return "";
}
function all(values, includeImageAlt, includeHtml) {
  const result = [];
  let index2 = -1;
  while (++index2 < values.length) {
    result[index2] = one(values[index2], includeImageAlt, includeHtml);
  }
  return result.join("");
}
function node(value2) {
  return Boolean(value2 && typeof value2 === "object");
}

// node_modules/character-entities/index.js
var characterEntities = {
  AElig: "\xC6",
  AMP: "&",
  Aacute: "\xC1",
  Abreve: "\u0102",
  Acirc: "\xC2",
  Acy: "\u0410",
  Afr: "\u{1D504}",
  Agrave: "\xC0",
  Alpha: "\u0391",
  Amacr: "\u0100",
  And: "\u2A53",
  Aogon: "\u0104",
  Aopf: "\u{1D538}",
  ApplyFunction: "\u2061",
  Aring: "\xC5",
  Ascr: "\u{1D49C}",
  Assign: "\u2254",
  Atilde: "\xC3",
  Auml: "\xC4",
  Backslash: "\u2216",
  Barv: "\u2AE7",
  Barwed: "\u2306",
  Bcy: "\u0411",
  Because: "\u2235",
  Bernoullis: "\u212C",
  Beta: "\u0392",
  Bfr: "\u{1D505}",
  Bopf: "\u{1D539}",
  Breve: "\u02D8",
  Bscr: "\u212C",
  Bumpeq: "\u224E",
  CHcy: "\u0427",
  COPY: "\xA9",
  Cacute: "\u0106",
  Cap: "\u22D2",
  CapitalDifferentialD: "\u2145",
  Cayleys: "\u212D",
  Ccaron: "\u010C",
  Ccedil: "\xC7",
  Ccirc: "\u0108",
  Cconint: "\u2230",
  Cdot: "\u010A",
  Cedilla: "\xB8",
  CenterDot: "\xB7",
  Cfr: "\u212D",
  Chi: "\u03A7",
  CircleDot: "\u2299",
  CircleMinus: "\u2296",
  CirclePlus: "\u2295",
  CircleTimes: "\u2297",
  ClockwiseContourIntegral: "\u2232",
  CloseCurlyDoubleQuote: "\u201D",
  CloseCurlyQuote: "\u2019",
  Colon: "\u2237",
  Colone: "\u2A74",
  Congruent: "\u2261",
  Conint: "\u222F",
  ContourIntegral: "\u222E",
  Copf: "\u2102",
  Coproduct: "\u2210",
  CounterClockwiseContourIntegral: "\u2233",
  Cross: "\u2A2F",
  Cscr: "\u{1D49E}",
  Cup: "\u22D3",
  CupCap: "\u224D",
  DD: "\u2145",
  DDotrahd: "\u2911",
  DJcy: "\u0402",
  DScy: "\u0405",
  DZcy: "\u040F",
  Dagger: "\u2021",
  Darr: "\u21A1",
  Dashv: "\u2AE4",
  Dcaron: "\u010E",
  Dcy: "\u0414",
  Del: "\u2207",
  Delta: "\u0394",
  Dfr: "\u{1D507}",
  DiacriticalAcute: "\xB4",
  DiacriticalDot: "\u02D9",
  DiacriticalDoubleAcute: "\u02DD",
  DiacriticalGrave: "`",
  DiacriticalTilde: "\u02DC",
  Diamond: "\u22C4",
  DifferentialD: "\u2146",
  Dopf: "\u{1D53B}",
  Dot: "\xA8",
  DotDot: "\u20DC",
  DotEqual: "\u2250",
  DoubleContourIntegral: "\u222F",
  DoubleDot: "\xA8",
  DoubleDownArrow: "\u21D3",
  DoubleLeftArrow: "\u21D0",
  DoubleLeftRightArrow: "\u21D4",
  DoubleLeftTee: "\u2AE4",
  DoubleLongLeftArrow: "\u27F8",
  DoubleLongLeftRightArrow: "\u27FA",
  DoubleLongRightArrow: "\u27F9",
  DoubleRightArrow: "\u21D2",
  DoubleRightTee: "\u22A8",
  DoubleUpArrow: "\u21D1",
  DoubleUpDownArrow: "\u21D5",
  DoubleVerticalBar: "\u2225",
  DownArrow: "\u2193",
  DownArrowBar: "\u2913",
  DownArrowUpArrow: "\u21F5",
  DownBreve: "\u0311",
  DownLeftRightVector: "\u2950",
  DownLeftTeeVector: "\u295E",
  DownLeftVector: "\u21BD",
  DownLeftVectorBar: "\u2956",
  DownRightTeeVector: "\u295F",
  DownRightVector: "\u21C1",
  DownRightVectorBar: "\u2957",
  DownTee: "\u22A4",
  DownTeeArrow: "\u21A7",
  Downarrow: "\u21D3",
  Dscr: "\u{1D49F}",
  Dstrok: "\u0110",
  ENG: "\u014A",
  ETH: "\xD0",
  Eacute: "\xC9",
  Ecaron: "\u011A",
  Ecirc: "\xCA",
  Ecy: "\u042D",
  Edot: "\u0116",
  Efr: "\u{1D508}",
  Egrave: "\xC8",
  Element: "\u2208",
  Emacr: "\u0112",
  EmptySmallSquare: "\u25FB",
  EmptyVerySmallSquare: "\u25AB",
  Eogon: "\u0118",
  Eopf: "\u{1D53C}",
  Epsilon: "\u0395",
  Equal: "\u2A75",
  EqualTilde: "\u2242",
  Equilibrium: "\u21CC",
  Escr: "\u2130",
  Esim: "\u2A73",
  Eta: "\u0397",
  Euml: "\xCB",
  Exists: "\u2203",
  ExponentialE: "\u2147",
  Fcy: "\u0424",
  Ffr: "\u{1D509}",
  FilledSmallSquare: "\u25FC",
  FilledVerySmallSquare: "\u25AA",
  Fopf: "\u{1D53D}",
  ForAll: "\u2200",
  Fouriertrf: "\u2131",
  Fscr: "\u2131",
  GJcy: "\u0403",
  GT: ">",
  Gamma: "\u0393",
  Gammad: "\u03DC",
  Gbreve: "\u011E",
  Gcedil: "\u0122",
  Gcirc: "\u011C",
  Gcy: "\u0413",
  Gdot: "\u0120",
  Gfr: "\u{1D50A}",
  Gg: "\u22D9",
  Gopf: "\u{1D53E}",
  GreaterEqual: "\u2265",
  GreaterEqualLess: "\u22DB",
  GreaterFullEqual: "\u2267",
  GreaterGreater: "\u2AA2",
  GreaterLess: "\u2277",
  GreaterSlantEqual: "\u2A7E",
  GreaterTilde: "\u2273",
  Gscr: "\u{1D4A2}",
  Gt: "\u226B",
  HARDcy: "\u042A",
  Hacek: "\u02C7",
  Hat: "^",
  Hcirc: "\u0124",
  Hfr: "\u210C",
  HilbertSpace: "\u210B",
  Hopf: "\u210D",
  HorizontalLine: "\u2500",
  Hscr: "\u210B",
  Hstrok: "\u0126",
  HumpDownHump: "\u224E",
  HumpEqual: "\u224F",
  IEcy: "\u0415",
  IJlig: "\u0132",
  IOcy: "\u0401",
  Iacute: "\xCD",
  Icirc: "\xCE",
  Icy: "\u0418",
  Idot: "\u0130",
  Ifr: "\u2111",
  Igrave: "\xCC",
  Im: "\u2111",
  Imacr: "\u012A",
  ImaginaryI: "\u2148",
  Implies: "\u21D2",
  Int: "\u222C",
  Integral: "\u222B",
  Intersection: "\u22C2",
  InvisibleComma: "\u2063",
  InvisibleTimes: "\u2062",
  Iogon: "\u012E",
  Iopf: "\u{1D540}",
  Iota: "\u0399",
  Iscr: "\u2110",
  Itilde: "\u0128",
  Iukcy: "\u0406",
  Iuml: "\xCF",
  Jcirc: "\u0134",
  Jcy: "\u0419",
  Jfr: "\u{1D50D}",
  Jopf: "\u{1D541}",
  Jscr: "\u{1D4A5}",
  Jsercy: "\u0408",
  Jukcy: "\u0404",
  KHcy: "\u0425",
  KJcy: "\u040C",
  Kappa: "\u039A",
  Kcedil: "\u0136",
  Kcy: "\u041A",
  Kfr: "\u{1D50E}",
  Kopf: "\u{1D542}",
  Kscr: "\u{1D4A6}",
  LJcy: "\u0409",
  LT: "<",
  Lacute: "\u0139",
  Lambda: "\u039B",
  Lang: "\u27EA",
  Laplacetrf: "\u2112",
  Larr: "\u219E",
  Lcaron: "\u013D",
  Lcedil: "\u013B",
  Lcy: "\u041B",
  LeftAngleBracket: "\u27E8",
  LeftArrow: "\u2190",
  LeftArrowBar: "\u21E4",
  LeftArrowRightArrow: "\u21C6",
  LeftCeiling: "\u2308",
  LeftDoubleBracket: "\u27E6",
  LeftDownTeeVector: "\u2961",
  LeftDownVector: "\u21C3",
  LeftDownVectorBar: "\u2959",
  LeftFloor: "\u230A",
  LeftRightArrow: "\u2194",
  LeftRightVector: "\u294E",
  LeftTee: "\u22A3",
  LeftTeeArrow: "\u21A4",
  LeftTeeVector: "\u295A",
  LeftTriangle: "\u22B2",
  LeftTriangleBar: "\u29CF",
  LeftTriangleEqual: "\u22B4",
  LeftUpDownVector: "\u2951",
  LeftUpTeeVector: "\u2960",
  LeftUpVector: "\u21BF",
  LeftUpVectorBar: "\u2958",
  LeftVector: "\u21BC",
  LeftVectorBar: "\u2952",
  Leftarrow: "\u21D0",
  Leftrightarrow: "\u21D4",
  LessEqualGreater: "\u22DA",
  LessFullEqual: "\u2266",
  LessGreater: "\u2276",
  LessLess: "\u2AA1",
  LessSlantEqual: "\u2A7D",
  LessTilde: "\u2272",
  Lfr: "\u{1D50F}",
  Ll: "\u22D8",
  Lleftarrow: "\u21DA",
  Lmidot: "\u013F",
  LongLeftArrow: "\u27F5",
  LongLeftRightArrow: "\u27F7",
  LongRightArrow: "\u27F6",
  Longleftarrow: "\u27F8",
  Longleftrightarrow: "\u27FA",
  Longrightarrow: "\u27F9",
  Lopf: "\u{1D543}",
  LowerLeftArrow: "\u2199",
  LowerRightArrow: "\u2198",
  Lscr: "\u2112",
  Lsh: "\u21B0",
  Lstrok: "\u0141",
  Lt: "\u226A",
  Map: "\u2905",
  Mcy: "\u041C",
  MediumSpace: "\u205F",
  Mellintrf: "\u2133",
  Mfr: "\u{1D510}",
  MinusPlus: "\u2213",
  Mopf: "\u{1D544}",
  Mscr: "\u2133",
  Mu: "\u039C",
  NJcy: "\u040A",
  Nacute: "\u0143",
  Ncaron: "\u0147",
  Ncedil: "\u0145",
  Ncy: "\u041D",
  NegativeMediumSpace: "\u200B",
  NegativeThickSpace: "\u200B",
  NegativeThinSpace: "\u200B",
  NegativeVeryThinSpace: "\u200B",
  NestedGreaterGreater: "\u226B",
  NestedLessLess: "\u226A",
  NewLine: "\n",
  Nfr: "\u{1D511}",
  NoBreak: "\u2060",
  NonBreakingSpace: "\xA0",
  Nopf: "\u2115",
  Not: "\u2AEC",
  NotCongruent: "\u2262",
  NotCupCap: "\u226D",
  NotDoubleVerticalBar: "\u2226",
  NotElement: "\u2209",
  NotEqual: "\u2260",
  NotEqualTilde: "\u2242\u0338",
  NotExists: "\u2204",
  NotGreater: "\u226F",
  NotGreaterEqual: "\u2271",
  NotGreaterFullEqual: "\u2267\u0338",
  NotGreaterGreater: "\u226B\u0338",
  NotGreaterLess: "\u2279",
  NotGreaterSlantEqual: "\u2A7E\u0338",
  NotGreaterTilde: "\u2275",
  NotHumpDownHump: "\u224E\u0338",
  NotHumpEqual: "\u224F\u0338",
  NotLeftTriangle: "\u22EA",
  NotLeftTriangleBar: "\u29CF\u0338",
  NotLeftTriangleEqual: "\u22EC",
  NotLess: "\u226E",
  NotLessEqual: "\u2270",
  NotLessGreater: "\u2278",
  NotLessLess: "\u226A\u0338",
  NotLessSlantEqual: "\u2A7D\u0338",
  NotLessTilde: "\u2274",
  NotNestedGreaterGreater: "\u2AA2\u0338",
  NotNestedLessLess: "\u2AA1\u0338",
  NotPrecedes: "\u2280",
  NotPrecedesEqual: "\u2AAF\u0338",
  NotPrecedesSlantEqual: "\u22E0",
  NotReverseElement: "\u220C",
  NotRightTriangle: "\u22EB",
  NotRightTriangleBar: "\u29D0\u0338",
  NotRightTriangleEqual: "\u22ED",
  NotSquareSubset: "\u228F\u0338",
  NotSquareSubsetEqual: "\u22E2",
  NotSquareSuperset: "\u2290\u0338",
  NotSquareSupersetEqual: "\u22E3",
  NotSubset: "\u2282\u20D2",
  NotSubsetEqual: "\u2288",
  NotSucceeds: "\u2281",
  NotSucceedsEqual: "\u2AB0\u0338",
  NotSucceedsSlantEqual: "\u22E1",
  NotSucceedsTilde: "\u227F\u0338",
  NotSuperset: "\u2283\u20D2",
  NotSupersetEqual: "\u2289",
  NotTilde: "\u2241",
  NotTildeEqual: "\u2244",
  NotTildeFullEqual: "\u2247",
  NotTildeTilde: "\u2249",
  NotVerticalBar: "\u2224",
  Nscr: "\u{1D4A9}",
  Ntilde: "\xD1",
  Nu: "\u039D",
  OElig: "\u0152",
  Oacute: "\xD3",
  Ocirc: "\xD4",
  Ocy: "\u041E",
  Odblac: "\u0150",
  Ofr: "\u{1D512}",
  Ograve: "\xD2",
  Omacr: "\u014C",
  Omega: "\u03A9",
  Omicron: "\u039F",
  Oopf: "\u{1D546}",
  OpenCurlyDoubleQuote: "\u201C",
  OpenCurlyQuote: "\u2018",
  Or: "\u2A54",
  Oscr: "\u{1D4AA}",
  Oslash: "\xD8",
  Otilde: "\xD5",
  Otimes: "\u2A37",
  Ouml: "\xD6",
  OverBar: "\u203E",
  OverBrace: "\u23DE",
  OverBracket: "\u23B4",
  OverParenthesis: "\u23DC",
  PartialD: "\u2202",
  Pcy: "\u041F",
  Pfr: "\u{1D513}",
  Phi: "\u03A6",
  Pi: "\u03A0",
  PlusMinus: "\xB1",
  Poincareplane: "\u210C",
  Popf: "\u2119",
  Pr: "\u2ABB",
  Precedes: "\u227A",
  PrecedesEqual: "\u2AAF",
  PrecedesSlantEqual: "\u227C",
  PrecedesTilde: "\u227E",
  Prime: "\u2033",
  Product: "\u220F",
  Proportion: "\u2237",
  Proportional: "\u221D",
  Pscr: "\u{1D4AB}",
  Psi: "\u03A8",
  QUOT: '"',
  Qfr: "\u{1D514}",
  Qopf: "\u211A",
  Qscr: "\u{1D4AC}",
  RBarr: "\u2910",
  REG: "\xAE",
  Racute: "\u0154",
  Rang: "\u27EB",
  Rarr: "\u21A0",
  Rarrtl: "\u2916",
  Rcaron: "\u0158",
  Rcedil: "\u0156",
  Rcy: "\u0420",
  Re: "\u211C",
  ReverseElement: "\u220B",
  ReverseEquilibrium: "\u21CB",
  ReverseUpEquilibrium: "\u296F",
  Rfr: "\u211C",
  Rho: "\u03A1",
  RightAngleBracket: "\u27E9",
  RightArrow: "\u2192",
  RightArrowBar: "\u21E5",
  RightArrowLeftArrow: "\u21C4",
  RightCeiling: "\u2309",
  RightDoubleBracket: "\u27E7",
  RightDownTeeVector: "\u295D",
  RightDownVector: "\u21C2",
  RightDownVectorBar: "\u2955",
  RightFloor: "\u230B",
  RightTee: "\u22A2",
  RightTeeArrow: "\u21A6",
  RightTeeVector: "\u295B",
  RightTriangle: "\u22B3",
  RightTriangleBar: "\u29D0",
  RightTriangleEqual: "\u22B5",
  RightUpDownVector: "\u294F",
  RightUpTeeVector: "\u295C",
  RightUpVector: "\u21BE",
  RightUpVectorBar: "\u2954",
  RightVector: "\u21C0",
  RightVectorBar: "\u2953",
  Rightarrow: "\u21D2",
  Ropf: "\u211D",
  RoundImplies: "\u2970",
  Rrightarrow: "\u21DB",
  Rscr: "\u211B",
  Rsh: "\u21B1",
  RuleDelayed: "\u29F4",
  SHCHcy: "\u0429",
  SHcy: "\u0428",
  SOFTcy: "\u042C",
  Sacute: "\u015A",
  Sc: "\u2ABC",
  Scaron: "\u0160",
  Scedil: "\u015E",
  Scirc: "\u015C",
  Scy: "\u0421",
  Sfr: "\u{1D516}",
  ShortDownArrow: "\u2193",
  ShortLeftArrow: "\u2190",
  ShortRightArrow: "\u2192",
  ShortUpArrow: "\u2191",
  Sigma: "\u03A3",
  SmallCircle: "\u2218",
  Sopf: "\u{1D54A}",
  Sqrt: "\u221A",
  Square: "\u25A1",
  SquareIntersection: "\u2293",
  SquareSubset: "\u228F",
  SquareSubsetEqual: "\u2291",
  SquareSuperset: "\u2290",
  SquareSupersetEqual: "\u2292",
  SquareUnion: "\u2294",
  Sscr: "\u{1D4AE}",
  Star: "\u22C6",
  Sub: "\u22D0",
  Subset: "\u22D0",
  SubsetEqual: "\u2286",
  Succeeds: "\u227B",
  SucceedsEqual: "\u2AB0",
  SucceedsSlantEqual: "\u227D",
  SucceedsTilde: "\u227F",
  SuchThat: "\u220B",
  Sum: "\u2211",
  Sup: "\u22D1",
  Superset: "\u2283",
  SupersetEqual: "\u2287",
  Supset: "\u22D1",
  THORN: "\xDE",
  TRADE: "\u2122",
  TSHcy: "\u040B",
  TScy: "\u0426",
  Tab: "	",
  Tau: "\u03A4",
  Tcaron: "\u0164",
  Tcedil: "\u0162",
  Tcy: "\u0422",
  Tfr: "\u{1D517}",
  Therefore: "\u2234",
  Theta: "\u0398",
  ThickSpace: "\u205F\u200A",
  ThinSpace: "\u2009",
  Tilde: "\u223C",
  TildeEqual: "\u2243",
  TildeFullEqual: "\u2245",
  TildeTilde: "\u2248",
  Topf: "\u{1D54B}",
  TripleDot: "\u20DB",
  Tscr: "\u{1D4AF}",
  Tstrok: "\u0166",
  Uacute: "\xDA",
  Uarr: "\u219F",
  Uarrocir: "\u2949",
  Ubrcy: "\u040E",
  Ubreve: "\u016C",
  Ucirc: "\xDB",
  Ucy: "\u0423",
  Udblac: "\u0170",
  Ufr: "\u{1D518}",
  Ugrave: "\xD9",
  Umacr: "\u016A",
  UnderBar: "_",
  UnderBrace: "\u23DF",
  UnderBracket: "\u23B5",
  UnderParenthesis: "\u23DD",
  Union: "\u22C3",
  UnionPlus: "\u228E",
  Uogon: "\u0172",
  Uopf: "\u{1D54C}",
  UpArrow: "\u2191",
  UpArrowBar: "\u2912",
  UpArrowDownArrow: "\u21C5",
  UpDownArrow: "\u2195",
  UpEquilibrium: "\u296E",
  UpTee: "\u22A5",
  UpTeeArrow: "\u21A5",
  Uparrow: "\u21D1",
  Updownarrow: "\u21D5",
  UpperLeftArrow: "\u2196",
  UpperRightArrow: "\u2197",
  Upsi: "\u03D2",
  Upsilon: "\u03A5",
  Uring: "\u016E",
  Uscr: "\u{1D4B0}",
  Utilde: "\u0168",
  Uuml: "\xDC",
  VDash: "\u22AB",
  Vbar: "\u2AEB",
  Vcy: "\u0412",
  Vdash: "\u22A9",
  Vdashl: "\u2AE6",
  Vee: "\u22C1",
  Verbar: "\u2016",
  Vert: "\u2016",
  VerticalBar: "\u2223",
  VerticalLine: "|",
  VerticalSeparator: "\u2758",
  VerticalTilde: "\u2240",
  VeryThinSpace: "\u200A",
  Vfr: "\u{1D519}",
  Vopf: "\u{1D54D}",
  Vscr: "\u{1D4B1}",
  Vvdash: "\u22AA",
  Wcirc: "\u0174",
  Wedge: "\u22C0",
  Wfr: "\u{1D51A}",
  Wopf: "\u{1D54E}",
  Wscr: "\u{1D4B2}",
  Xfr: "\u{1D51B}",
  Xi: "\u039E",
  Xopf: "\u{1D54F}",
  Xscr: "\u{1D4B3}",
  YAcy: "\u042F",
  YIcy: "\u0407",
  YUcy: "\u042E",
  Yacute: "\xDD",
  Ycirc: "\u0176",
  Ycy: "\u042B",
  Yfr: "\u{1D51C}",
  Yopf: "\u{1D550}",
  Yscr: "\u{1D4B4}",
  Yuml: "\u0178",
  ZHcy: "\u0416",
  Zacute: "\u0179",
  Zcaron: "\u017D",
  Zcy: "\u0417",
  Zdot: "\u017B",
  ZeroWidthSpace: "\u200B",
  Zeta: "\u0396",
  Zfr: "\u2128",
  Zopf: "\u2124",
  Zscr: "\u{1D4B5}",
  aacute: "\xE1",
  abreve: "\u0103",
  ac: "\u223E",
  acE: "\u223E\u0333",
  acd: "\u223F",
  acirc: "\xE2",
  acute: "\xB4",
  acy: "\u0430",
  aelig: "\xE6",
  af: "\u2061",
  afr: "\u{1D51E}",
  agrave: "\xE0",
  alefsym: "\u2135",
  aleph: "\u2135",
  alpha: "\u03B1",
  amacr: "\u0101",
  amalg: "\u2A3F",
  amp: "&",
  and: "\u2227",
  andand: "\u2A55",
  andd: "\u2A5C",
  andslope: "\u2A58",
  andv: "\u2A5A",
  ang: "\u2220",
  ange: "\u29A4",
  angle: "\u2220",
  angmsd: "\u2221",
  angmsdaa: "\u29A8",
  angmsdab: "\u29A9",
  angmsdac: "\u29AA",
  angmsdad: "\u29AB",
  angmsdae: "\u29AC",
  angmsdaf: "\u29AD",
  angmsdag: "\u29AE",
  angmsdah: "\u29AF",
  angrt: "\u221F",
  angrtvb: "\u22BE",
  angrtvbd: "\u299D",
  angsph: "\u2222",
  angst: "\xC5",
  angzarr: "\u237C",
  aogon: "\u0105",
  aopf: "\u{1D552}",
  ap: "\u2248",
  apE: "\u2A70",
  apacir: "\u2A6F",
  ape: "\u224A",
  apid: "\u224B",
  apos: "'",
  approx: "\u2248",
  approxeq: "\u224A",
  aring: "\xE5",
  ascr: "\u{1D4B6}",
  ast: "*",
  asymp: "\u2248",
  asympeq: "\u224D",
  atilde: "\xE3",
  auml: "\xE4",
  awconint: "\u2233",
  awint: "\u2A11",
  bNot: "\u2AED",
  backcong: "\u224C",
  backepsilon: "\u03F6",
  backprime: "\u2035",
  backsim: "\u223D",
  backsimeq: "\u22CD",
  barvee: "\u22BD",
  barwed: "\u2305",
  barwedge: "\u2305",
  bbrk: "\u23B5",
  bbrktbrk: "\u23B6",
  bcong: "\u224C",
  bcy: "\u0431",
  bdquo: "\u201E",
  becaus: "\u2235",
  because: "\u2235",
  bemptyv: "\u29B0",
  bepsi: "\u03F6",
  bernou: "\u212C",
  beta: "\u03B2",
  beth: "\u2136",
  between: "\u226C",
  bfr: "\u{1D51F}",
  bigcap: "\u22C2",
  bigcirc: "\u25EF",
  bigcup: "\u22C3",
  bigodot: "\u2A00",
  bigoplus: "\u2A01",
  bigotimes: "\u2A02",
  bigsqcup: "\u2A06",
  bigstar: "\u2605",
  bigtriangledown: "\u25BD",
  bigtriangleup: "\u25B3",
  biguplus: "\u2A04",
  bigvee: "\u22C1",
  bigwedge: "\u22C0",
  bkarow: "\u290D",
  blacklozenge: "\u29EB",
  blacksquare: "\u25AA",
  blacktriangle: "\u25B4",
  blacktriangledown: "\u25BE",
  blacktriangleleft: "\u25C2",
  blacktriangleright: "\u25B8",
  blank: "\u2423",
  blk12: "\u2592",
  blk14: "\u2591",
  blk34: "\u2593",
  block: "\u2588",
  bne: "=\u20E5",
  bnequiv: "\u2261\u20E5",
  bnot: "\u2310",
  bopf: "\u{1D553}",
  bot: "\u22A5",
  bottom: "\u22A5",
  bowtie: "\u22C8",
  boxDL: "\u2557",
  boxDR: "\u2554",
  boxDl: "\u2556",
  boxDr: "\u2553",
  boxH: "\u2550",
  boxHD: "\u2566",
  boxHU: "\u2569",
  boxHd: "\u2564",
  boxHu: "\u2567",
  boxUL: "\u255D",
  boxUR: "\u255A",
  boxUl: "\u255C",
  boxUr: "\u2559",
  boxV: "\u2551",
  boxVH: "\u256C",
  boxVL: "\u2563",
  boxVR: "\u2560",
  boxVh: "\u256B",
  boxVl: "\u2562",
  boxVr: "\u255F",
  boxbox: "\u29C9",
  boxdL: "\u2555",
  boxdR: "\u2552",
  boxdl: "\u2510",
  boxdr: "\u250C",
  boxh: "\u2500",
  boxhD: "\u2565",
  boxhU: "\u2568",
  boxhd: "\u252C",
  boxhu: "\u2534",
  boxminus: "\u229F",
  boxplus: "\u229E",
  boxtimes: "\u22A0",
  boxuL: "\u255B",
  boxuR: "\u2558",
  boxul: "\u2518",
  boxur: "\u2514",
  boxv: "\u2502",
  boxvH: "\u256A",
  boxvL: "\u2561",
  boxvR: "\u255E",
  boxvh: "\u253C",
  boxvl: "\u2524",
  boxvr: "\u251C",
  bprime: "\u2035",
  breve: "\u02D8",
  brvbar: "\xA6",
  bscr: "\u{1D4B7}",
  bsemi: "\u204F",
  bsim: "\u223D",
  bsime: "\u22CD",
  bsol: "\\",
  bsolb: "\u29C5",
  bsolhsub: "\u27C8",
  bull: "\u2022",
  bullet: "\u2022",
  bump: "\u224E",
  bumpE: "\u2AAE",
  bumpe: "\u224F",
  bumpeq: "\u224F",
  cacute: "\u0107",
  cap: "\u2229",
  capand: "\u2A44",
  capbrcup: "\u2A49",
  capcap: "\u2A4B",
  capcup: "\u2A47",
  capdot: "\u2A40",
  caps: "\u2229\uFE00",
  caret: "\u2041",
  caron: "\u02C7",
  ccaps: "\u2A4D",
  ccaron: "\u010D",
  ccedil: "\xE7",
  ccirc: "\u0109",
  ccups: "\u2A4C",
  ccupssm: "\u2A50",
  cdot: "\u010B",
  cedil: "\xB8",
  cemptyv: "\u29B2",
  cent: "\xA2",
  centerdot: "\xB7",
  cfr: "\u{1D520}",
  chcy: "\u0447",
  check: "\u2713",
  checkmark: "\u2713",
  chi: "\u03C7",
  cir: "\u25CB",
  cirE: "\u29C3",
  circ: "\u02C6",
  circeq: "\u2257",
  circlearrowleft: "\u21BA",
  circlearrowright: "\u21BB",
  circledR: "\xAE",
  circledS: "\u24C8",
  circledast: "\u229B",
  circledcirc: "\u229A",
  circleddash: "\u229D",
  cire: "\u2257",
  cirfnint: "\u2A10",
  cirmid: "\u2AEF",
  cirscir: "\u29C2",
  clubs: "\u2663",
  clubsuit: "\u2663",
  colon: ":",
  colone: "\u2254",
  coloneq: "\u2254",
  comma: ",",
  commat: "@",
  comp: "\u2201",
  compfn: "\u2218",
  complement: "\u2201",
  complexes: "\u2102",
  cong: "\u2245",
  congdot: "\u2A6D",
  conint: "\u222E",
  copf: "\u{1D554}",
  coprod: "\u2210",
  copy: "\xA9",
  copysr: "\u2117",
  crarr: "\u21B5",
  cross: "\u2717",
  cscr: "\u{1D4B8}",
  csub: "\u2ACF",
  csube: "\u2AD1",
  csup: "\u2AD0",
  csupe: "\u2AD2",
  ctdot: "\u22EF",
  cudarrl: "\u2938",
  cudarrr: "\u2935",
  cuepr: "\u22DE",
  cuesc: "\u22DF",
  cularr: "\u21B6",
  cularrp: "\u293D",
  cup: "\u222A",
  cupbrcap: "\u2A48",
  cupcap: "\u2A46",
  cupcup: "\u2A4A",
  cupdot: "\u228D",
  cupor: "\u2A45",
  cups: "\u222A\uFE00",
  curarr: "\u21B7",
  curarrm: "\u293C",
  curlyeqprec: "\u22DE",
  curlyeqsucc: "\u22DF",
  curlyvee: "\u22CE",
  curlywedge: "\u22CF",
  curren: "\xA4",
  curvearrowleft: "\u21B6",
  curvearrowright: "\u21B7",
  cuvee: "\u22CE",
  cuwed: "\u22CF",
  cwconint: "\u2232",
  cwint: "\u2231",
  cylcty: "\u232D",
  dArr: "\u21D3",
  dHar: "\u2965",
  dagger: "\u2020",
  daleth: "\u2138",
  darr: "\u2193",
  dash: "\u2010",
  dashv: "\u22A3",
  dbkarow: "\u290F",
  dblac: "\u02DD",
  dcaron: "\u010F",
  dcy: "\u0434",
  dd: "\u2146",
  ddagger: "\u2021",
  ddarr: "\u21CA",
  ddotseq: "\u2A77",
  deg: "\xB0",
  delta: "\u03B4",
  demptyv: "\u29B1",
  dfisht: "\u297F",
  dfr: "\u{1D521}",
  dharl: "\u21C3",
  dharr: "\u21C2",
  diam: "\u22C4",
  diamond: "\u22C4",
  diamondsuit: "\u2666",
  diams: "\u2666",
  die: "\xA8",
  digamma: "\u03DD",
  disin: "\u22F2",
  div: "\xF7",
  divide: "\xF7",
  divideontimes: "\u22C7",
  divonx: "\u22C7",
  djcy: "\u0452",
  dlcorn: "\u231E",
  dlcrop: "\u230D",
  dollar: "$",
  dopf: "\u{1D555}",
  dot: "\u02D9",
  doteq: "\u2250",
  doteqdot: "\u2251",
  dotminus: "\u2238",
  dotplus: "\u2214",
  dotsquare: "\u22A1",
  doublebarwedge: "\u2306",
  downarrow: "\u2193",
  downdownarrows: "\u21CA",
  downharpoonleft: "\u21C3",
  downharpoonright: "\u21C2",
  drbkarow: "\u2910",
  drcorn: "\u231F",
  drcrop: "\u230C",
  dscr: "\u{1D4B9}",
  dscy: "\u0455",
  dsol: "\u29F6",
  dstrok: "\u0111",
  dtdot: "\u22F1",
  dtri: "\u25BF",
  dtrif: "\u25BE",
  duarr: "\u21F5",
  duhar: "\u296F",
  dwangle: "\u29A6",
  dzcy: "\u045F",
  dzigrarr: "\u27FF",
  eDDot: "\u2A77",
  eDot: "\u2251",
  eacute: "\xE9",
  easter: "\u2A6E",
  ecaron: "\u011B",
  ecir: "\u2256",
  ecirc: "\xEA",
  ecolon: "\u2255",
  ecy: "\u044D",
  edot: "\u0117",
  ee: "\u2147",
  efDot: "\u2252",
  efr: "\u{1D522}",
  eg: "\u2A9A",
  egrave: "\xE8",
  egs: "\u2A96",
  egsdot: "\u2A98",
  el: "\u2A99",
  elinters: "\u23E7",
  ell: "\u2113",
  els: "\u2A95",
  elsdot: "\u2A97",
  emacr: "\u0113",
  empty: "\u2205",
  emptyset: "\u2205",
  emptyv: "\u2205",
  emsp13: "\u2004",
  emsp14: "\u2005",
  emsp: "\u2003",
  eng: "\u014B",
  ensp: "\u2002",
  eogon: "\u0119",
  eopf: "\u{1D556}",
  epar: "\u22D5",
  eparsl: "\u29E3",
  eplus: "\u2A71",
  epsi: "\u03B5",
  epsilon: "\u03B5",
  epsiv: "\u03F5",
  eqcirc: "\u2256",
  eqcolon: "\u2255",
  eqsim: "\u2242",
  eqslantgtr: "\u2A96",
  eqslantless: "\u2A95",
  equals: "=",
  equest: "\u225F",
  equiv: "\u2261",
  equivDD: "\u2A78",
  eqvparsl: "\u29E5",
  erDot: "\u2253",
  erarr: "\u2971",
  escr: "\u212F",
  esdot: "\u2250",
  esim: "\u2242",
  eta: "\u03B7",
  eth: "\xF0",
  euml: "\xEB",
  euro: "\u20AC",
  excl: "!",
  exist: "\u2203",
  expectation: "\u2130",
  exponentiale: "\u2147",
  fallingdotseq: "\u2252",
  fcy: "\u0444",
  female: "\u2640",
  ffilig: "\uFB03",
  fflig: "\uFB00",
  ffllig: "\uFB04",
  ffr: "\u{1D523}",
  filig: "\uFB01",
  fjlig: "fj",
  flat: "\u266D",
  fllig: "\uFB02",
  fltns: "\u25B1",
  fnof: "\u0192",
  fopf: "\u{1D557}",
  forall: "\u2200",
  fork: "\u22D4",
  forkv: "\u2AD9",
  fpartint: "\u2A0D",
  frac12: "\xBD",
  frac13: "\u2153",
  frac14: "\xBC",
  frac15: "\u2155",
  frac16: "\u2159",
  frac18: "\u215B",
  frac23: "\u2154",
  frac25: "\u2156",
  frac34: "\xBE",
  frac35: "\u2157",
  frac38: "\u215C",
  frac45: "\u2158",
  frac56: "\u215A",
  frac58: "\u215D",
  frac78: "\u215E",
  frasl: "\u2044",
  frown: "\u2322",
  fscr: "\u{1D4BB}",
  gE: "\u2267",
  gEl: "\u2A8C",
  gacute: "\u01F5",
  gamma: "\u03B3",
  gammad: "\u03DD",
  gap: "\u2A86",
  gbreve: "\u011F",
  gcirc: "\u011D",
  gcy: "\u0433",
  gdot: "\u0121",
  ge: "\u2265",
  gel: "\u22DB",
  geq: "\u2265",
  geqq: "\u2267",
  geqslant: "\u2A7E",
  ges: "\u2A7E",
  gescc: "\u2AA9",
  gesdot: "\u2A80",
  gesdoto: "\u2A82",
  gesdotol: "\u2A84",
  gesl: "\u22DB\uFE00",
  gesles: "\u2A94",
  gfr: "\u{1D524}",
  gg: "\u226B",
  ggg: "\u22D9",
  gimel: "\u2137",
  gjcy: "\u0453",
  gl: "\u2277",
  glE: "\u2A92",
  gla: "\u2AA5",
  glj: "\u2AA4",
  gnE: "\u2269",
  gnap: "\u2A8A",
  gnapprox: "\u2A8A",
  gne: "\u2A88",
  gneq: "\u2A88",
  gneqq: "\u2269",
  gnsim: "\u22E7",
  gopf: "\u{1D558}",
  grave: "`",
  gscr: "\u210A",
  gsim: "\u2273",
  gsime: "\u2A8E",
  gsiml: "\u2A90",
  gt: ">",
  gtcc: "\u2AA7",
  gtcir: "\u2A7A",
  gtdot: "\u22D7",
  gtlPar: "\u2995",
  gtquest: "\u2A7C",
  gtrapprox: "\u2A86",
  gtrarr: "\u2978",
  gtrdot: "\u22D7",
  gtreqless: "\u22DB",
  gtreqqless: "\u2A8C",
  gtrless: "\u2277",
  gtrsim: "\u2273",
  gvertneqq: "\u2269\uFE00",
  gvnE: "\u2269\uFE00",
  hArr: "\u21D4",
  hairsp: "\u200A",
  half: "\xBD",
  hamilt: "\u210B",
  hardcy: "\u044A",
  harr: "\u2194",
  harrcir: "\u2948",
  harrw: "\u21AD",
  hbar: "\u210F",
  hcirc: "\u0125",
  hearts: "\u2665",
  heartsuit: "\u2665",
  hellip: "\u2026",
  hercon: "\u22B9",
  hfr: "\u{1D525}",
  hksearow: "\u2925",
  hkswarow: "\u2926",
  hoarr: "\u21FF",
  homtht: "\u223B",
  hookleftarrow: "\u21A9",
  hookrightarrow: "\u21AA",
  hopf: "\u{1D559}",
  horbar: "\u2015",
  hscr: "\u{1D4BD}",
  hslash: "\u210F",
  hstrok: "\u0127",
  hybull: "\u2043",
  hyphen: "\u2010",
  iacute: "\xED",
  ic: "\u2063",
  icirc: "\xEE",
  icy: "\u0438",
  iecy: "\u0435",
  iexcl: "\xA1",
  iff: "\u21D4",
  ifr: "\u{1D526}",
  igrave: "\xEC",
  ii: "\u2148",
  iiiint: "\u2A0C",
  iiint: "\u222D",
  iinfin: "\u29DC",
  iiota: "\u2129",
  ijlig: "\u0133",
  imacr: "\u012B",
  image: "\u2111",
  imagline: "\u2110",
  imagpart: "\u2111",
  imath: "\u0131",
  imof: "\u22B7",
  imped: "\u01B5",
  in: "\u2208",
  incare: "\u2105",
  infin: "\u221E",
  infintie: "\u29DD",
  inodot: "\u0131",
  int: "\u222B",
  intcal: "\u22BA",
  integers: "\u2124",
  intercal: "\u22BA",
  intlarhk: "\u2A17",
  intprod: "\u2A3C",
  iocy: "\u0451",
  iogon: "\u012F",
  iopf: "\u{1D55A}",
  iota: "\u03B9",
  iprod: "\u2A3C",
  iquest: "\xBF",
  iscr: "\u{1D4BE}",
  isin: "\u2208",
  isinE: "\u22F9",
  isindot: "\u22F5",
  isins: "\u22F4",
  isinsv: "\u22F3",
  isinv: "\u2208",
  it: "\u2062",
  itilde: "\u0129",
  iukcy: "\u0456",
  iuml: "\xEF",
  jcirc: "\u0135",
  jcy: "\u0439",
  jfr: "\u{1D527}",
  jmath: "\u0237",
  jopf: "\u{1D55B}",
  jscr: "\u{1D4BF}",
  jsercy: "\u0458",
  jukcy: "\u0454",
  kappa: "\u03BA",
  kappav: "\u03F0",
  kcedil: "\u0137",
  kcy: "\u043A",
  kfr: "\u{1D528}",
  kgreen: "\u0138",
  khcy: "\u0445",
  kjcy: "\u045C",
  kopf: "\u{1D55C}",
  kscr: "\u{1D4C0}",
  lAarr: "\u21DA",
  lArr: "\u21D0",
  lAtail: "\u291B",
  lBarr: "\u290E",
  lE: "\u2266",
  lEg: "\u2A8B",
  lHar: "\u2962",
  lacute: "\u013A",
  laemptyv: "\u29B4",
  lagran: "\u2112",
  lambda: "\u03BB",
  lang: "\u27E8",
  langd: "\u2991",
  langle: "\u27E8",
  lap: "\u2A85",
  laquo: "\xAB",
  larr: "\u2190",
  larrb: "\u21E4",
  larrbfs: "\u291F",
  larrfs: "\u291D",
  larrhk: "\u21A9",
  larrlp: "\u21AB",
  larrpl: "\u2939",
  larrsim: "\u2973",
  larrtl: "\u21A2",
  lat: "\u2AAB",
  latail: "\u2919",
  late: "\u2AAD",
  lates: "\u2AAD\uFE00",
  lbarr: "\u290C",
  lbbrk: "\u2772",
  lbrace: "{",
  lbrack: "[",
  lbrke: "\u298B",
  lbrksld: "\u298F",
  lbrkslu: "\u298D",
  lcaron: "\u013E",
  lcedil: "\u013C",
  lceil: "\u2308",
  lcub: "{",
  lcy: "\u043B",
  ldca: "\u2936",
  ldquo: "\u201C",
  ldquor: "\u201E",
  ldrdhar: "\u2967",
  ldrushar: "\u294B",
  ldsh: "\u21B2",
  le: "\u2264",
  leftarrow: "\u2190",
  leftarrowtail: "\u21A2",
  leftharpoondown: "\u21BD",
  leftharpoonup: "\u21BC",
  leftleftarrows: "\u21C7",
  leftrightarrow: "\u2194",
  leftrightarrows: "\u21C6",
  leftrightharpoons: "\u21CB",
  leftrightsquigarrow: "\u21AD",
  leftthreetimes: "\u22CB",
  leg: "\u22DA",
  leq: "\u2264",
  leqq: "\u2266",
  leqslant: "\u2A7D",
  les: "\u2A7D",
  lescc: "\u2AA8",
  lesdot: "\u2A7F",
  lesdoto: "\u2A81",
  lesdotor: "\u2A83",
  lesg: "\u22DA\uFE00",
  lesges: "\u2A93",
  lessapprox: "\u2A85",
  lessdot: "\u22D6",
  lesseqgtr: "\u22DA",
  lesseqqgtr: "\u2A8B",
  lessgtr: "\u2276",
  lesssim: "\u2272",
  lfisht: "\u297C",
  lfloor: "\u230A",
  lfr: "\u{1D529}",
  lg: "\u2276",
  lgE: "\u2A91",
  lhard: "\u21BD",
  lharu: "\u21BC",
  lharul: "\u296A",
  lhblk: "\u2584",
  ljcy: "\u0459",
  ll: "\u226A",
  llarr: "\u21C7",
  llcorner: "\u231E",
  llhard: "\u296B",
  lltri: "\u25FA",
  lmidot: "\u0140",
  lmoust: "\u23B0",
  lmoustache: "\u23B0",
  lnE: "\u2268",
  lnap: "\u2A89",
  lnapprox: "\u2A89",
  lne: "\u2A87",
  lneq: "\u2A87",
  lneqq: "\u2268",
  lnsim: "\u22E6",
  loang: "\u27EC",
  loarr: "\u21FD",
  lobrk: "\u27E6",
  longleftarrow: "\u27F5",
  longleftrightarrow: "\u27F7",
  longmapsto: "\u27FC",
  longrightarrow: "\u27F6",
  looparrowleft: "\u21AB",
  looparrowright: "\u21AC",
  lopar: "\u2985",
  lopf: "\u{1D55D}",
  loplus: "\u2A2D",
  lotimes: "\u2A34",
  lowast: "\u2217",
  lowbar: "_",
  loz: "\u25CA",
  lozenge: "\u25CA",
  lozf: "\u29EB",
  lpar: "(",
  lparlt: "\u2993",
  lrarr: "\u21C6",
  lrcorner: "\u231F",
  lrhar: "\u21CB",
  lrhard: "\u296D",
  lrm: "\u200E",
  lrtri: "\u22BF",
  lsaquo: "\u2039",
  lscr: "\u{1D4C1}",
  lsh: "\u21B0",
  lsim: "\u2272",
  lsime: "\u2A8D",
  lsimg: "\u2A8F",
  lsqb: "[",
  lsquo: "\u2018",
  lsquor: "\u201A",
  lstrok: "\u0142",
  lt: "<",
  ltcc: "\u2AA6",
  ltcir: "\u2A79",
  ltdot: "\u22D6",
  lthree: "\u22CB",
  ltimes: "\u22C9",
  ltlarr: "\u2976",
  ltquest: "\u2A7B",
  ltrPar: "\u2996",
  ltri: "\u25C3",
  ltrie: "\u22B4",
  ltrif: "\u25C2",
  lurdshar: "\u294A",
  luruhar: "\u2966",
  lvertneqq: "\u2268\uFE00",
  lvnE: "\u2268\uFE00",
  mDDot: "\u223A",
  macr: "\xAF",
  male: "\u2642",
  malt: "\u2720",
  maltese: "\u2720",
  map: "\u21A6",
  mapsto: "\u21A6",
  mapstodown: "\u21A7",
  mapstoleft: "\u21A4",
  mapstoup: "\u21A5",
  marker: "\u25AE",
  mcomma: "\u2A29",
  mcy: "\u043C",
  mdash: "\u2014",
  measuredangle: "\u2221",
  mfr: "\u{1D52A}",
  mho: "\u2127",
  micro: "\xB5",
  mid: "\u2223",
  midast: "*",
  midcir: "\u2AF0",
  middot: "\xB7",
  minus: "\u2212",
  minusb: "\u229F",
  minusd: "\u2238",
  minusdu: "\u2A2A",
  mlcp: "\u2ADB",
  mldr: "\u2026",
  mnplus: "\u2213",
  models: "\u22A7",
  mopf: "\u{1D55E}",
  mp: "\u2213",
  mscr: "\u{1D4C2}",
  mstpos: "\u223E",
  mu: "\u03BC",
  multimap: "\u22B8",
  mumap: "\u22B8",
  nGg: "\u22D9\u0338",
  nGt: "\u226B\u20D2",
  nGtv: "\u226B\u0338",
  nLeftarrow: "\u21CD",
  nLeftrightarrow: "\u21CE",
  nLl: "\u22D8\u0338",
  nLt: "\u226A\u20D2",
  nLtv: "\u226A\u0338",
  nRightarrow: "\u21CF",
  nVDash: "\u22AF",
  nVdash: "\u22AE",
  nabla: "\u2207",
  nacute: "\u0144",
  nang: "\u2220\u20D2",
  nap: "\u2249",
  napE: "\u2A70\u0338",
  napid: "\u224B\u0338",
  napos: "\u0149",
  napprox: "\u2249",
  natur: "\u266E",
  natural: "\u266E",
  naturals: "\u2115",
  nbsp: "\xA0",
  nbump: "\u224E\u0338",
  nbumpe: "\u224F\u0338",
  ncap: "\u2A43",
  ncaron: "\u0148",
  ncedil: "\u0146",
  ncong: "\u2247",
  ncongdot: "\u2A6D\u0338",
  ncup: "\u2A42",
  ncy: "\u043D",
  ndash: "\u2013",
  ne: "\u2260",
  neArr: "\u21D7",
  nearhk: "\u2924",
  nearr: "\u2197",
  nearrow: "\u2197",
  nedot: "\u2250\u0338",
  nequiv: "\u2262",
  nesear: "\u2928",
  nesim: "\u2242\u0338",
  nexist: "\u2204",
  nexists: "\u2204",
  nfr: "\u{1D52B}",
  ngE: "\u2267\u0338",
  nge: "\u2271",
  ngeq: "\u2271",
  ngeqq: "\u2267\u0338",
  ngeqslant: "\u2A7E\u0338",
  nges: "\u2A7E\u0338",
  ngsim: "\u2275",
  ngt: "\u226F",
  ngtr: "\u226F",
  nhArr: "\u21CE",
  nharr: "\u21AE",
  nhpar: "\u2AF2",
  ni: "\u220B",
  nis: "\u22FC",
  nisd: "\u22FA",
  niv: "\u220B",
  njcy: "\u045A",
  nlArr: "\u21CD",
  nlE: "\u2266\u0338",
  nlarr: "\u219A",
  nldr: "\u2025",
  nle: "\u2270",
  nleftarrow: "\u219A",
  nleftrightarrow: "\u21AE",
  nleq: "\u2270",
  nleqq: "\u2266\u0338",
  nleqslant: "\u2A7D\u0338",
  nles: "\u2A7D\u0338",
  nless: "\u226E",
  nlsim: "\u2274",
  nlt: "\u226E",
  nltri: "\u22EA",
  nltrie: "\u22EC",
  nmid: "\u2224",
  nopf: "\u{1D55F}",
  not: "\xAC",
  notin: "\u2209",
  notinE: "\u22F9\u0338",
  notindot: "\u22F5\u0338",
  notinva: "\u2209",
  notinvb: "\u22F7",
  notinvc: "\u22F6",
  notni: "\u220C",
  notniva: "\u220C",
  notnivb: "\u22FE",
  notnivc: "\u22FD",
  npar: "\u2226",
  nparallel: "\u2226",
  nparsl: "\u2AFD\u20E5",
  npart: "\u2202\u0338",
  npolint: "\u2A14",
  npr: "\u2280",
  nprcue: "\u22E0",
  npre: "\u2AAF\u0338",
  nprec: "\u2280",
  npreceq: "\u2AAF\u0338",
  nrArr: "\u21CF",
  nrarr: "\u219B",
  nrarrc: "\u2933\u0338",
  nrarrw: "\u219D\u0338",
  nrightarrow: "\u219B",
  nrtri: "\u22EB",
  nrtrie: "\u22ED",
  nsc: "\u2281",
  nsccue: "\u22E1",
  nsce: "\u2AB0\u0338",
  nscr: "\u{1D4C3}",
  nshortmid: "\u2224",
  nshortparallel: "\u2226",
  nsim: "\u2241",
  nsime: "\u2244",
  nsimeq: "\u2244",
  nsmid: "\u2224",
  nspar: "\u2226",
  nsqsube: "\u22E2",
  nsqsupe: "\u22E3",
  nsub: "\u2284",
  nsubE: "\u2AC5\u0338",
  nsube: "\u2288",
  nsubset: "\u2282\u20D2",
  nsubseteq: "\u2288",
  nsubseteqq: "\u2AC5\u0338",
  nsucc: "\u2281",
  nsucceq: "\u2AB0\u0338",
  nsup: "\u2285",
  nsupE: "\u2AC6\u0338",
  nsupe: "\u2289",
  nsupset: "\u2283\u20D2",
  nsupseteq: "\u2289",
  nsupseteqq: "\u2AC6\u0338",
  ntgl: "\u2279",
  ntilde: "\xF1",
  ntlg: "\u2278",
  ntriangleleft: "\u22EA",
  ntrianglelefteq: "\u22EC",
  ntriangleright: "\u22EB",
  ntrianglerighteq: "\u22ED",
  nu: "\u03BD",
  num: "#",
  numero: "\u2116",
  numsp: "\u2007",
  nvDash: "\u22AD",
  nvHarr: "\u2904",
  nvap: "\u224D\u20D2",
  nvdash: "\u22AC",
  nvge: "\u2265\u20D2",
  nvgt: ">\u20D2",
  nvinfin: "\u29DE",
  nvlArr: "\u2902",
  nvle: "\u2264\u20D2",
  nvlt: "<\u20D2",
  nvltrie: "\u22B4\u20D2",
  nvrArr: "\u2903",
  nvrtrie: "\u22B5\u20D2",
  nvsim: "\u223C\u20D2",
  nwArr: "\u21D6",
  nwarhk: "\u2923",
  nwarr: "\u2196",
  nwarrow: "\u2196",
  nwnear: "\u2927",
  oS: "\u24C8",
  oacute: "\xF3",
  oast: "\u229B",
  ocir: "\u229A",
  ocirc: "\xF4",
  ocy: "\u043E",
  odash: "\u229D",
  odblac: "\u0151",
  odiv: "\u2A38",
  odot: "\u2299",
  odsold: "\u29BC",
  oelig: "\u0153",
  ofcir: "\u29BF",
  ofr: "\u{1D52C}",
  ogon: "\u02DB",
  ograve: "\xF2",
  ogt: "\u29C1",
  ohbar: "\u29B5",
  ohm: "\u03A9",
  oint: "\u222E",
  olarr: "\u21BA",
  olcir: "\u29BE",
  olcross: "\u29BB",
  oline: "\u203E",
  olt: "\u29C0",
  omacr: "\u014D",
  omega: "\u03C9",
  omicron: "\u03BF",
  omid: "\u29B6",
  ominus: "\u2296",
  oopf: "\u{1D560}",
  opar: "\u29B7",
  operp: "\u29B9",
  oplus: "\u2295",
  or: "\u2228",
  orarr: "\u21BB",
  ord: "\u2A5D",
  order: "\u2134",
  orderof: "\u2134",
  ordf: "\xAA",
  ordm: "\xBA",
  origof: "\u22B6",
  oror: "\u2A56",
  orslope: "\u2A57",
  orv: "\u2A5B",
  oscr: "\u2134",
  oslash: "\xF8",
  osol: "\u2298",
  otilde: "\xF5",
  otimes: "\u2297",
  otimesas: "\u2A36",
  ouml: "\xF6",
  ovbar: "\u233D",
  par: "\u2225",
  para: "\xB6",
  parallel: "\u2225",
  parsim: "\u2AF3",
  parsl: "\u2AFD",
  part: "\u2202",
  pcy: "\u043F",
  percnt: "%",
  period: ".",
  permil: "\u2030",
  perp: "\u22A5",
  pertenk: "\u2031",
  pfr: "\u{1D52D}",
  phi: "\u03C6",
  phiv: "\u03D5",
  phmmat: "\u2133",
  phone: "\u260E",
  pi: "\u03C0",
  pitchfork: "\u22D4",
  piv: "\u03D6",
  planck: "\u210F",
  planckh: "\u210E",
  plankv: "\u210F",
  plus: "+",
  plusacir: "\u2A23",
  plusb: "\u229E",
  pluscir: "\u2A22",
  plusdo: "\u2214",
  plusdu: "\u2A25",
  pluse: "\u2A72",
  plusmn: "\xB1",
  plussim: "\u2A26",
  plustwo: "\u2A27",
  pm: "\xB1",
  pointint: "\u2A15",
  popf: "\u{1D561}",
  pound: "\xA3",
  pr: "\u227A",
  prE: "\u2AB3",
  prap: "\u2AB7",
  prcue: "\u227C",
  pre: "\u2AAF",
  prec: "\u227A",
  precapprox: "\u2AB7",
  preccurlyeq: "\u227C",
  preceq: "\u2AAF",
  precnapprox: "\u2AB9",
  precneqq: "\u2AB5",
  precnsim: "\u22E8",
  precsim: "\u227E",
  prime: "\u2032",
  primes: "\u2119",
  prnE: "\u2AB5",
  prnap: "\u2AB9",
  prnsim: "\u22E8",
  prod: "\u220F",
  profalar: "\u232E",
  profline: "\u2312",
  profsurf: "\u2313",
  prop: "\u221D",
  propto: "\u221D",
  prsim: "\u227E",
  prurel: "\u22B0",
  pscr: "\u{1D4C5}",
  psi: "\u03C8",
  puncsp: "\u2008",
  qfr: "\u{1D52E}",
  qint: "\u2A0C",
  qopf: "\u{1D562}",
  qprime: "\u2057",
  qscr: "\u{1D4C6}",
  quaternions: "\u210D",
  quatint: "\u2A16",
  quest: "?",
  questeq: "\u225F",
  quot: '"',
  rAarr: "\u21DB",
  rArr: "\u21D2",
  rAtail: "\u291C",
  rBarr: "\u290F",
  rHar: "\u2964",
  race: "\u223D\u0331",
  racute: "\u0155",
  radic: "\u221A",
  raemptyv: "\u29B3",
  rang: "\u27E9",
  rangd: "\u2992",
  range: "\u29A5",
  rangle: "\u27E9",
  raquo: "\xBB",
  rarr: "\u2192",
  rarrap: "\u2975",
  rarrb: "\u21E5",
  rarrbfs: "\u2920",
  rarrc: "\u2933",
  rarrfs: "\u291E",
  rarrhk: "\u21AA",
  rarrlp: "\u21AC",
  rarrpl: "\u2945",
  rarrsim: "\u2974",
  rarrtl: "\u21A3",
  rarrw: "\u219D",
  ratail: "\u291A",
  ratio: "\u2236",
  rationals: "\u211A",
  rbarr: "\u290D",
  rbbrk: "\u2773",
  rbrace: "}",
  rbrack: "]",
  rbrke: "\u298C",
  rbrksld: "\u298E",
  rbrkslu: "\u2990",
  rcaron: "\u0159",
  rcedil: "\u0157",
  rceil: "\u2309",
  rcub: "}",
  rcy: "\u0440",
  rdca: "\u2937",
  rdldhar: "\u2969",
  rdquo: "\u201D",
  rdquor: "\u201D",
  rdsh: "\u21B3",
  real: "\u211C",
  realine: "\u211B",
  realpart: "\u211C",
  reals: "\u211D",
  rect: "\u25AD",
  reg: "\xAE",
  rfisht: "\u297D",
  rfloor: "\u230B",
  rfr: "\u{1D52F}",
  rhard: "\u21C1",
  rharu: "\u21C0",
  rharul: "\u296C",
  rho: "\u03C1",
  rhov: "\u03F1",
  rightarrow: "\u2192",
  rightarrowtail: "\u21A3",
  rightharpoondown: "\u21C1",
  rightharpoonup: "\u21C0",
  rightleftarrows: "\u21C4",
  rightleftharpoons: "\u21CC",
  rightrightarrows: "\u21C9",
  rightsquigarrow: "\u219D",
  rightthreetimes: "\u22CC",
  ring: "\u02DA",
  risingdotseq: "\u2253",
  rlarr: "\u21C4",
  rlhar: "\u21CC",
  rlm: "\u200F",
  rmoust: "\u23B1",
  rmoustache: "\u23B1",
  rnmid: "\u2AEE",
  roang: "\u27ED",
  roarr: "\u21FE",
  robrk: "\u27E7",
  ropar: "\u2986",
  ropf: "\u{1D563}",
  roplus: "\u2A2E",
  rotimes: "\u2A35",
  rpar: ")",
  rpargt: "\u2994",
  rppolint: "\u2A12",
  rrarr: "\u21C9",
  rsaquo: "\u203A",
  rscr: "\u{1D4C7}",
  rsh: "\u21B1",
  rsqb: "]",
  rsquo: "\u2019",
  rsquor: "\u2019",
  rthree: "\u22CC",
  rtimes: "\u22CA",
  rtri: "\u25B9",
  rtrie: "\u22B5",
  rtrif: "\u25B8",
  rtriltri: "\u29CE",
  ruluhar: "\u2968",
  rx: "\u211E",
  sacute: "\u015B",
  sbquo: "\u201A",
  sc: "\u227B",
  scE: "\u2AB4",
  scap: "\u2AB8",
  scaron: "\u0161",
  sccue: "\u227D",
  sce: "\u2AB0",
  scedil: "\u015F",
  scirc: "\u015D",
  scnE: "\u2AB6",
  scnap: "\u2ABA",
  scnsim: "\u22E9",
  scpolint: "\u2A13",
  scsim: "\u227F",
  scy: "\u0441",
  sdot: "\u22C5",
  sdotb: "\u22A1",
  sdote: "\u2A66",
  seArr: "\u21D8",
  searhk: "\u2925",
  searr: "\u2198",
  searrow: "\u2198",
  sect: "\xA7",
  semi: ";",
  seswar: "\u2929",
  setminus: "\u2216",
  setmn: "\u2216",
  sext: "\u2736",
  sfr: "\u{1D530}",
  sfrown: "\u2322",
  sharp: "\u266F",
  shchcy: "\u0449",
  shcy: "\u0448",
  shortmid: "\u2223",
  shortparallel: "\u2225",
  shy: "\xAD",
  sigma: "\u03C3",
  sigmaf: "\u03C2",
  sigmav: "\u03C2",
  sim: "\u223C",
  simdot: "\u2A6A",
  sime: "\u2243",
  simeq: "\u2243",
  simg: "\u2A9E",
  simgE: "\u2AA0",
  siml: "\u2A9D",
  simlE: "\u2A9F",
  simne: "\u2246",
  simplus: "\u2A24",
  simrarr: "\u2972",
  slarr: "\u2190",
  smallsetminus: "\u2216",
  smashp: "\u2A33",
  smeparsl: "\u29E4",
  smid: "\u2223",
  smile: "\u2323",
  smt: "\u2AAA",
  smte: "\u2AAC",
  smtes: "\u2AAC\uFE00",
  softcy: "\u044C",
  sol: "/",
  solb: "\u29C4",
  solbar: "\u233F",
  sopf: "\u{1D564}",
  spades: "\u2660",
  spadesuit: "\u2660",
  spar: "\u2225",
  sqcap: "\u2293",
  sqcaps: "\u2293\uFE00",
  sqcup: "\u2294",
  sqcups: "\u2294\uFE00",
  sqsub: "\u228F",
  sqsube: "\u2291",
  sqsubset: "\u228F",
  sqsubseteq: "\u2291",
  sqsup: "\u2290",
  sqsupe: "\u2292",
  sqsupset: "\u2290",
  sqsupseteq: "\u2292",
  squ: "\u25A1",
  square: "\u25A1",
  squarf: "\u25AA",
  squf: "\u25AA",
  srarr: "\u2192",
  sscr: "\u{1D4C8}",
  ssetmn: "\u2216",
  ssmile: "\u2323",
  sstarf: "\u22C6",
  star: "\u2606",
  starf: "\u2605",
  straightepsilon: "\u03F5",
  straightphi: "\u03D5",
  strns: "\xAF",
  sub: "\u2282",
  subE: "\u2AC5",
  subdot: "\u2ABD",
  sube: "\u2286",
  subedot: "\u2AC3",
  submult: "\u2AC1",
  subnE: "\u2ACB",
  subne: "\u228A",
  subplus: "\u2ABF",
  subrarr: "\u2979",
  subset: "\u2282",
  subseteq: "\u2286",
  subseteqq: "\u2AC5",
  subsetneq: "\u228A",
  subsetneqq: "\u2ACB",
  subsim: "\u2AC7",
  subsub: "\u2AD5",
  subsup: "\u2AD3",
  succ: "\u227B",
  succapprox: "\u2AB8",
  succcurlyeq: "\u227D",
  succeq: "\u2AB0",
  succnapprox: "\u2ABA",
  succneqq: "\u2AB6",
  succnsim: "\u22E9",
  succsim: "\u227F",
  sum: "\u2211",
  sung: "\u266A",
  sup1: "\xB9",
  sup2: "\xB2",
  sup3: "\xB3",
  sup: "\u2283",
  supE: "\u2AC6",
  supdot: "\u2ABE",
  supdsub: "\u2AD8",
  supe: "\u2287",
  supedot: "\u2AC4",
  suphsol: "\u27C9",
  suphsub: "\u2AD7",
  suplarr: "\u297B",
  supmult: "\u2AC2",
  supnE: "\u2ACC",
  supne: "\u228B",
  supplus: "\u2AC0",
  supset: "\u2283",
  supseteq: "\u2287",
  supseteqq: "\u2AC6",
  supsetneq: "\u228B",
  supsetneqq: "\u2ACC",
  supsim: "\u2AC8",
  supsub: "\u2AD4",
  supsup: "\u2AD6",
  swArr: "\u21D9",
  swarhk: "\u2926",
  swarr: "\u2199",
  swarrow: "\u2199",
  swnwar: "\u292A",
  szlig: "\xDF",
  target: "\u2316",
  tau: "\u03C4",
  tbrk: "\u23B4",
  tcaron: "\u0165",
  tcedil: "\u0163",
  tcy: "\u0442",
  tdot: "\u20DB",
  telrec: "\u2315",
  tfr: "\u{1D531}",
  there4: "\u2234",
  therefore: "\u2234",
  theta: "\u03B8",
  thetasym: "\u03D1",
  thetav: "\u03D1",
  thickapprox: "\u2248",
  thicksim: "\u223C",
  thinsp: "\u2009",
  thkap: "\u2248",
  thksim: "\u223C",
  thorn: "\xFE",
  tilde: "\u02DC",
  times: "\xD7",
  timesb: "\u22A0",
  timesbar: "\u2A31",
  timesd: "\u2A30",
  tint: "\u222D",
  toea: "\u2928",
  top: "\u22A4",
  topbot: "\u2336",
  topcir: "\u2AF1",
  topf: "\u{1D565}",
  topfork: "\u2ADA",
  tosa: "\u2929",
  tprime: "\u2034",
  trade: "\u2122",
  triangle: "\u25B5",
  triangledown: "\u25BF",
  triangleleft: "\u25C3",
  trianglelefteq: "\u22B4",
  triangleq: "\u225C",
  triangleright: "\u25B9",
  trianglerighteq: "\u22B5",
  tridot: "\u25EC",
  trie: "\u225C",
  triminus: "\u2A3A",
  triplus: "\u2A39",
  trisb: "\u29CD",
  tritime: "\u2A3B",
  trpezium: "\u23E2",
  tscr: "\u{1D4C9}",
  tscy: "\u0446",
  tshcy: "\u045B",
  tstrok: "\u0167",
  twixt: "\u226C",
  twoheadleftarrow: "\u219E",
  twoheadrightarrow: "\u21A0",
  uArr: "\u21D1",
  uHar: "\u2963",
  uacute: "\xFA",
  uarr: "\u2191",
  ubrcy: "\u045E",
  ubreve: "\u016D",
  ucirc: "\xFB",
  ucy: "\u0443",
  udarr: "\u21C5",
  udblac: "\u0171",
  udhar: "\u296E",
  ufisht: "\u297E",
  ufr: "\u{1D532}",
  ugrave: "\xF9",
  uharl: "\u21BF",
  uharr: "\u21BE",
  uhblk: "\u2580",
  ulcorn: "\u231C",
  ulcorner: "\u231C",
  ulcrop: "\u230F",
  ultri: "\u25F8",
  umacr: "\u016B",
  uml: "\xA8",
  uogon: "\u0173",
  uopf: "\u{1D566}",
  uparrow: "\u2191",
  updownarrow: "\u2195",
  upharpoonleft: "\u21BF",
  upharpoonright: "\u21BE",
  uplus: "\u228E",
  upsi: "\u03C5",
  upsih: "\u03D2",
  upsilon: "\u03C5",
  upuparrows: "\u21C8",
  urcorn: "\u231D",
  urcorner: "\u231D",
  urcrop: "\u230E",
  uring: "\u016F",
  urtri: "\u25F9",
  uscr: "\u{1D4CA}",
  utdot: "\u22F0",
  utilde: "\u0169",
  utri: "\u25B5",
  utrif: "\u25B4",
  uuarr: "\u21C8",
  uuml: "\xFC",
  uwangle: "\u29A7",
  vArr: "\u21D5",
  vBar: "\u2AE8",
  vBarv: "\u2AE9",
  vDash: "\u22A8",
  vangrt: "\u299C",
  varepsilon: "\u03F5",
  varkappa: "\u03F0",
  varnothing: "\u2205",
  varphi: "\u03D5",
  varpi: "\u03D6",
  varpropto: "\u221D",
  varr: "\u2195",
  varrho: "\u03F1",
  varsigma: "\u03C2",
  varsubsetneq: "\u228A\uFE00",
  varsubsetneqq: "\u2ACB\uFE00",
  varsupsetneq: "\u228B\uFE00",
  varsupsetneqq: "\u2ACC\uFE00",
  vartheta: "\u03D1",
  vartriangleleft: "\u22B2",
  vartriangleright: "\u22B3",
  vcy: "\u0432",
  vdash: "\u22A2",
  vee: "\u2228",
  veebar: "\u22BB",
  veeeq: "\u225A",
  vellip: "\u22EE",
  verbar: "|",
  vert: "|",
  vfr: "\u{1D533}",
  vltri: "\u22B2",
  vnsub: "\u2282\u20D2",
  vnsup: "\u2283\u20D2",
  vopf: "\u{1D567}",
  vprop: "\u221D",
  vrtri: "\u22B3",
  vscr: "\u{1D4CB}",
  vsubnE: "\u2ACB\uFE00",
  vsubne: "\u228A\uFE00",
  vsupnE: "\u2ACC\uFE00",
  vsupne: "\u228B\uFE00",
  vzigzag: "\u299A",
  wcirc: "\u0175",
  wedbar: "\u2A5F",
  wedge: "\u2227",
  wedgeq: "\u2259",
  weierp: "\u2118",
  wfr: "\u{1D534}",
  wopf: "\u{1D568}",
  wp: "\u2118",
  wr: "\u2240",
  wreath: "\u2240",
  wscr: "\u{1D4CC}",
  xcap: "\u22C2",
  xcirc: "\u25EF",
  xcup: "\u22C3",
  xdtri: "\u25BD",
  xfr: "\u{1D535}",
  xhArr: "\u27FA",
  xharr: "\u27F7",
  xi: "\u03BE",
  xlArr: "\u27F8",
  xlarr: "\u27F5",
  xmap: "\u27FC",
  xnis: "\u22FB",
  xodot: "\u2A00",
  xopf: "\u{1D569}",
  xoplus: "\u2A01",
  xotime: "\u2A02",
  xrArr: "\u27F9",
  xrarr: "\u27F6",
  xscr: "\u{1D4CD}",
  xsqcup: "\u2A06",
  xuplus: "\u2A04",
  xutri: "\u25B3",
  xvee: "\u22C1",
  xwedge: "\u22C0",
  yacute: "\xFD",
  yacy: "\u044F",
  ycirc: "\u0177",
  ycy: "\u044B",
  yen: "\xA5",
  yfr: "\u{1D536}",
  yicy: "\u0457",
  yopf: "\u{1D56A}",
  yscr: "\u{1D4CE}",
  yucy: "\u044E",
  yuml: "\xFF",
  zacute: "\u017A",
  zcaron: "\u017E",
  zcy: "\u0437",
  zdot: "\u017C",
  zeetrf: "\u2128",
  zeta: "\u03B6",
  zfr: "\u{1D537}",
  zhcy: "\u0436",
  zigrarr: "\u21DD",
  zopf: "\u{1D56B}",
  zscr: "\u{1D4CF}",
  zwj: "\u200D",
  zwnj: "\u200C"
};

// node_modules/decode-named-character-reference/index.js
var own = {}.hasOwnProperty;
function decodeNamedCharacterReference(value2) {
  return own.call(characterEntities, value2) ? characterEntities[value2] : false;
}

// node_modules/micromark-util-chunked/index.js
function splice(list2, start, remove, items) {
  const end = list2.length;
  let chunkStart = 0;
  let parameters;
  if (start < 0) {
    start = -start > end ? 0 : end + start;
  } else {
    start = start > end ? end : start;
  }
  remove = remove > 0 ? remove : 0;
  if (items.length < 1e4) {
    parameters = Array.from(items);
    parameters.unshift(start, remove);
    list2.splice(...parameters);
  } else {
    if (remove) list2.splice(start, remove);
    while (chunkStart < items.length) {
      parameters = items.slice(chunkStart, chunkStart + 1e4);
      parameters.unshift(start, 0);
      list2.splice(...parameters);
      chunkStart += 1e4;
      start += 1e4;
    }
  }
}
function push(list2, items) {
  if (list2.length > 0) {
    splice(list2, list2.length, 0, items);
    return list2;
  }
  return items;
}

// node_modules/micromark-util-combine-extensions/index.js
var hasOwnProperty = {}.hasOwnProperty;
function combineExtensions(extensions) {
  const all2 = {};
  let index2 = -1;
  while (++index2 < extensions.length) {
    syntaxExtension(all2, extensions[index2]);
  }
  return all2;
}
function syntaxExtension(all2, extension2) {
  let hook;
  for (hook in extension2) {
    const maybe = hasOwnProperty.call(all2, hook) ? all2[hook] : void 0;
    const left = maybe || (all2[hook] = {});
    const right = extension2[hook];
    let code2;
    if (right) {
      for (code2 in right) {
        if (!hasOwnProperty.call(left, code2)) left[code2] = [];
        const value2 = right[code2];
        constructs(
          // @ts-expect-error Looks like a list.
          left[code2],
          Array.isArray(value2) ? value2 : value2 ? [value2] : []
        );
      }
    }
  }
}
function constructs(existing, list2) {
  let index2 = -1;
  const before = [];
  while (++index2 < list2.length) {
    ;
    (list2[index2].add === "after" ? existing : before).push(list2[index2]);
  }
  splice(existing, 0, 0, before);
}

// node_modules/micromark-util-decode-numeric-character-reference/index.js
function decodeNumericCharacterReference(value2, base) {
  const code2 = Number.parseInt(value2, base);
  if (
    // C0 except for HT, LF, FF, CR, space.
    code2 < 9 || code2 === 11 || code2 > 13 && code2 < 32 || // Control character (DEL) of C0, and C1 controls.
    code2 > 126 && code2 < 160 || // Lone high surrogates and low surrogates.
    code2 > 55295 && code2 < 57344 || // Noncharacters.
    code2 > 64975 && code2 < 65008 || /* eslint-disable no-bitwise */
    (code2 & 65535) === 65535 || (code2 & 65535) === 65534 || /* eslint-enable no-bitwise */
    // Out of range
    code2 > 1114111
  ) {
    return "\uFFFD";
  }
  return String.fromCodePoint(code2);
}

// node_modules/micromark-util-normalize-identifier/index.js
function normalizeIdentifier(value2) {
  return value2.replace(/[\t\n\r ]+/g, " ").replace(/^ | $/g, "").toLowerCase().toUpperCase();
}

// node_modules/micromark-util-character/index.js
var asciiAlpha = regexCheck(/[A-Za-z]/);
var asciiAlphanumeric = regexCheck(/[\dA-Za-z]/);
var asciiAtext = regexCheck(/[#-'*+\--9=?A-Z^-~]/);
function asciiControl(code2) {
  return (
    // Special whitespace codes (which have negative values), C0 and Control
    // character DEL
    code2 !== null && (code2 < 32 || code2 === 127)
  );
}
var asciiDigit = regexCheck(/\d/);
var asciiHexDigit = regexCheck(/[\dA-Fa-f]/);
var asciiPunctuation = regexCheck(/[!-/:-@[-`{-~]/);
function markdownLineEnding(code2) {
  return code2 !== null && code2 < -2;
}
function markdownLineEndingOrSpace(code2) {
  return code2 !== null && (code2 < 0 || code2 === 32);
}
function markdownSpace(code2) {
  return code2 === -2 || code2 === -1 || code2 === 32;
}
var unicodePunctuation = regexCheck(new RegExp("\\p{P}|\\p{S}", "u"));
var unicodeWhitespace = regexCheck(/\s/);
function regexCheck(regex) {
  return check;
  function check(code2) {
    return code2 !== null && code2 > -1 && regex.test(String.fromCharCode(code2));
  }
}

// node_modules/micromark-factory-space/index.js
function factorySpace(effects, ok3, type, max) {
  const limit = max ? max - 1 : Infinity;
  let size = 0;
  return start;
  function start(code2) {
    if (markdownSpace(code2)) {
      effects.enter(type);
      return prefix(code2);
    }
    return ok3(code2);
  }
  function prefix(code2) {
    if (markdownSpace(code2) && size++ < limit) {
      effects.consume(code2);
      return prefix;
    }
    effects.exit(type);
    return ok3(code2);
  }
}
function factorySpaceMinMax(effects, ok3, nok, type, min, max) {
  let size = 0;
  return start;
  function start(code2) {
    if (max > 0 && markdownSpace(code2)) {
      effects.enter(type);
      return prefix(code2);
    }
    return after(code2);
  }
  function prefix(code2) {
    if (markdownSpace(code2) && size < max) {
      effects.consume(code2);
      size++;
      return prefix;
    }
    effects.exit(type);
    return after(code2);
  }
  function after(code2) {
    return size >= min ? ok3(code2) : nok(code2);
  }
}

// node_modules/micromark/lib/initialize/content.js
var content = {
  tokenize: initializeContent
};
function initializeContent(effects) {
  const contentStart = effects.attempt(this.parser.constructs.contentInitial, afterContentStartConstruct, paragraphInitial);
  let previous3;
  return contentStart;
  function afterContentStartConstruct(code2) {
    if (code2 === null) {
      effects.consume(code2);
      return;
    }
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return factorySpace(effects, contentStart, "linePrefix");
  }
  function paragraphInitial(code2) {
    effects.enter("paragraph");
    return lineStart(code2);
  }
  function lineStart(code2) {
    const token = effects.enter("chunkText", {
      contentType: "text",
      previous: previous3
    });
    if (previous3) {
      previous3.next = token;
    }
    previous3 = token;
    return data(code2);
  }
  function data(code2) {
    if (code2 === null) {
      effects.exit("chunkText");
      effects.exit("paragraph");
      effects.consume(code2);
      return;
    }
    if (markdownLineEnding(code2)) {
      effects.consume(code2);
      effects.exit("chunkText");
      return lineStart;
    }
    effects.consume(code2);
    return data;
  }
}

// node_modules/micromark-util-edit-map/index.js
var EditMap = class {
  /**
   * Create a new edit map.
   *
   * @returns
   *   New instance.
   */
  constructor() {
    this.index = /* @__PURE__ */ new Map();
    this.map = [];
  }
  /**
   * Create an edit: a remove and/or add at a certain place.
   *
   * @param {number} index
   *   Index at which to apply the edit.
   * @param {number} remove
   *   Count of items to remove at the index.
   * @param {Array<Event>} add
   *   Items to add at the index.
   * @returns {undefined}
   *   Nothing.
   */
  add(index2, remove, add) {
    addImplementation(this, index2, remove, add, false);
  }
  /**
   * Create an edit: but insert `add` before existing additions, instead of
   * after them.
   *
   * @param {number} index
   *   Index at which to apply the edit.
   * @param {number} remove
   *   Count of items to remove at the index.
   * @param {Array<Event>} add
   *   Items to add at the index.
   * @returns {undefined}
   *   Nothing.
   */
  addBefore(index2, remove, add) {
    addImplementation(this, index2, remove, add, true);
  }
  /**
   * Done, change the events.
   *
   * @param {Array<Event>} events
   *   List of events to apply the edits to.
   * @returns {undefined}
   *   Nothing.
   */
  consume(events) {
    this.map.sort(function(a2, b) {
      return a2[0] - b[0];
    });
    if (this.map.length === 0) {
      return;
    }
    let index2 = this.map.length;
    const vecs = [];
    while (index2 > 0) {
      index2 -= 1;
      vecs.push(events.slice(this.map[index2][0] + this.map[index2][1]), this.map[index2][2]);
      events.length = this.map[index2][0];
    }
    vecs.push(events.slice());
    events.length = 0;
    let slice = vecs.pop();
    while (slice) {
      for (const element of slice) {
        events.push(element);
      }
      slice = vecs.pop();
    }
    this.map.length = 0;
    this.index.clear();
  }
};
function addImplementation(editMap, at, remove, add, before) {
  if (remove === 0 && add.length === 0) {
    return;
  }
  const existing = editMap.index.get(at);
  if (existing) {
    existing[1] += remove;
    if (before) {
      add.push(...existing[2]);
      existing[2] = add;
    } else {
      existing[2].push(...add);
    }
    return;
  }
  const change = [at, remove, add];
  editMap.map.push(change);
  editMap.index.set(at, change);
}

// node_modules/micromark/lib/initialize/document.js
var document = {
  tokenize: initializeDocument
};
var containerConstruct = {
  tokenize: tokenizeContainer
};
function initializeDocument(effects) {
  const self = this;
  const stack = [];
  let continued = 0;
  let childFlow;
  let childToken;
  let lineStartOffset;
  return start;
  function start(code2) {
    if (continued < stack.length) {
      const item2 = stack[continued];
      self.containerState = item2[1];
      return effects.attempt(item2[0].continuation, documentContinue, checkNewContainers)(code2);
    }
    return checkNewContainers(code2);
  }
  function documentContinue(code2) {
    continued++;
    if (self.containerState._closeFlow) {
      self.containerState._closeFlow = void 0;
      if (childFlow) {
        closeFlow();
      }
      const indexBeforeExits = self.events.length;
      let indexBeforeFlow = indexBeforeExits;
      let point3;
      while (indexBeforeFlow--) {
        if (self.events[indexBeforeFlow][0] === "exit" && self.events[indexBeforeFlow][1].type === "chunkFlow") {
          point3 = self.events[indexBeforeFlow][1].end;
          break;
        }
      }
      exitContainers(continued);
      let index2 = indexBeforeExits;
      while (index2 < self.events.length) {
        self.events[index2][1].end = {
          ...point3
        };
        index2++;
      }
      const editMap = new EditMap();
      editMap.add(indexBeforeFlow + 1, 0, self.events.slice(indexBeforeExits));
      editMap.add(indexBeforeExits, index2 - indexBeforeExits, []);
      editMap.consume(self.events);
      return checkNewContainers(code2);
    }
    return start(code2);
  }
  function checkNewContainers(code2) {
    if (continued === stack.length) {
      if (!childFlow) {
        return documentContinued(code2);
      }
      if (childFlow.currentConstruct && childFlow.currentConstruct.concrete) {
        return flowStart(code2);
      }
      self.interrupt = Boolean(childFlow.currentConstruct && !childFlow._gfmTableDynamicInterruptHack);
    }
    self.containerState = {};
    return effects.check(containerConstruct, thereIsANewContainer, thereIsNoNewContainer)(code2);
  }
  function thereIsANewContainer(code2) {
    if (childFlow) {
      closeFlow();
    }
    exitContainers(continued);
    return documentContinued(code2);
  }
  function thereIsNoNewContainer(code2) {
    self.parser.lazy[self.now().line] = continued !== stack.length;
    lineStartOffset = self.now().offset;
    return flowStart(code2);
  }
  function documentContinued(code2) {
    self.containerState = {};
    return effects.attempt(containerConstruct, containerContinue, flowStart)(code2);
  }
  function containerContinue(code2) {
    continued++;
    stack.push([self.currentConstruct, self.containerState]);
    return documentContinued(code2);
  }
  function flowStart(code2) {
    if (code2 === null) {
      if (childFlow) {
        closeFlow();
      }
      exitContainers(0);
      effects.consume(code2);
      return;
    }
    childFlow = childFlow || self.parser.flow(self.now());
    effects.enter("chunkFlow", {
      _tokenizer: childFlow,
      contentType: "flow",
      previous: childToken
    });
    return flowContinue(code2);
  }
  function flowContinue(code2) {
    if (code2 === null) {
      writeToChild(effects.exit("chunkFlow"), true);
      exitContainers(0);
      effects.consume(code2);
      return;
    }
    if (markdownLineEnding(code2)) {
      effects.consume(code2);
      writeToChild(effects.exit("chunkFlow"));
      continued = 0;
      self.interrupt = void 0;
      return start;
    }
    effects.consume(code2);
    return flowContinue;
  }
  function writeToChild(token, endOfFile) {
    const stream = self.sliceStream(token);
    if (endOfFile) {
      stream.push(null);
    }
    token.previous = childToken;
    if (childToken) {
      childToken.next = token;
    }
    childToken = token;
    childFlow.defineSkip(token.start);
    childFlow.write(stream);
    if (self.parser.lazy[token.start.line]) {
      let index2 = childFlow.events.length;
      while (index2--) {
        if (
          // The token starts before the line ending…
          childFlow.events[index2][1].start.offset < lineStartOffset && // …and either is not ended yet…
          (!childFlow.events[index2][1].end || // …or ends after it.
          childFlow.events[index2][1].end.offset > lineStartOffset)
        ) {
          return;
        }
      }
      const indexBeforeExits = self.events.length;
      let indexBeforeFlow = indexBeforeExits;
      let seen;
      let point3;
      while (indexBeforeFlow--) {
        if (self.events[indexBeforeFlow][0] === "exit" && self.events[indexBeforeFlow][1].type === "chunkFlow") {
          if (seen) {
            point3 = self.events[indexBeforeFlow][1].end;
            break;
          }
          seen = true;
        }
      }
      exitContainers(continued);
      index2 = indexBeforeExits;
      while (index2 < self.events.length) {
        self.events[index2][1].end = {
          ...point3
        };
        index2++;
      }
      const editMap = new EditMap();
      editMap.add(indexBeforeFlow + 1, 0, self.events.slice(indexBeforeExits));
      editMap.add(indexBeforeExits, index2 - indexBeforeExits, []);
      editMap.consume(self.events);
    }
  }
  function exitContainers(size) {
    let index2 = stack.length;
    while (index2-- > size) {
      const entry = stack[index2];
      self.containerState = entry[1];
      entry[0].exit.call(self, effects);
    }
    stack.length = size;
  }
  function closeFlow() {
    childFlow.write([null]);
    childToken = void 0;
    childFlow = void 0;
    self.containerState._closeFlow = void 0;
  }
}
function tokenizeContainer(effects, ok3, nok) {
  return factorySpace(effects, effects.attempt(this.parser.constructs.document, ok3, nok), "linePrefix", this.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4);
}

// node_modules/micromark-util-classify-character/index.js
function classifyCharacter(code2) {
  if (code2 === null || markdownLineEndingOrSpace(code2) || unicodeWhitespace(code2)) {
    return 1;
  }
  if (unicodePunctuation(code2)) {
    return 2;
  }
}

// node_modules/micromark-util-resolve-all/index.js
function resolveAll(constructs2, events, context) {
  const called = [];
  let index2 = -1;
  while (++index2 < constructs2.length) {
    const resolve4 = constructs2[index2].resolveAll;
    if (resolve4 && !called.includes(resolve4)) {
      events = resolve4(events, context);
      called.push(resolve4);
    }
  }
  return events;
}

// node_modules/micromark-core-commonmark/lib/attention.js
var attention = {
  name: "attention",
  resolveAll: resolveAllAttention,
  tokenize: tokenizeAttention
};
function resolveAllAttention(events, context) {
  let index2 = -1;
  let nextEvents;
  while (++index2 < events.length) {
    if (events[index2][0] === "enter" && events[index2][1].type === "attentionSequence" && events[index2][1]._close) {
      let open = index2;
      while (open--) {
        if (events[open][0] === "exit" && events[open][1].type === "attentionSequence" && events[open][1]._open && // If the markers are the same:
        context.sliceSerialize(events[open][1]).charCodeAt(0) === context.sliceSerialize(events[index2][1]).charCodeAt(0)) {
          if ((events[open][1]._close || events[index2][1]._open) && (events[index2][1].end.offset - events[index2][1].start.offset) % 3 && !((events[open][1].end.offset - events[open][1].start.offset + events[index2][1].end.offset - events[index2][1].start.offset) % 3)) {
            continue;
          }
          const use = events[open][1].end.offset - events[open][1].start.offset > 1 && events[index2][1].end.offset - events[index2][1].start.offset > 1 ? 2 : 1;
          const start = {
            ...events[open][1].end
          };
          const end = {
            ...events[index2][1].start
          };
          movePoint(start, -use);
          movePoint(end, use);
          const openingSequence = {
            type: use > 1 ? "strongSequence" : "emphasisSequence",
            start,
            end: {
              ...events[open][1].end
            }
          };
          const closingSequence = {
            type: use > 1 ? "strongSequence" : "emphasisSequence",
            start: {
              ...events[index2][1].start
            },
            end
          };
          const text4 = {
            type: use > 1 ? "strongText" : "emphasisText",
            start: {
              ...events[open][1].end
            },
            end: {
              ...events[index2][1].start
            }
          };
          const group = {
            type: use > 1 ? "strong" : "emphasis",
            start: {
              ...openingSequence.start
            },
            end: {
              ...closingSequence.end
            }
          };
          events[open][1].end = {
            ...openingSequence.start
          };
          events[index2][1].start = {
            ...closingSequence.end
          };
          nextEvents = [];
          if (events[open][1].end.offset - events[open][1].start.offset) {
            nextEvents = push(nextEvents, [["enter", events[open][1], context], ["exit", events[open][1], context]]);
          }
          nextEvents = push(nextEvents, [["enter", group, context], ["enter", openingSequence, context], ["exit", openingSequence, context], ["enter", text4, context]]);
          nextEvents = push(nextEvents, resolveAll(context.parser.constructs.insideSpan.null, events.slice(open + 1, index2), context));
          nextEvents = push(nextEvents, [["exit", text4, context], ["enter", closingSequence, context], ["exit", closingSequence, context], ["exit", group, context]]);
          let offset = 0;
          if (events[index2][1].end.offset - events[index2][1].start.offset) {
            offset = 2;
            nextEvents = push(nextEvents, [["enter", events[index2][1], context], ["exit", events[index2][1], context]]);
          }
          splice(events, open - 1, index2 - open + 3, nextEvents);
          index2 = open + nextEvents.length - offset - 2;
          break;
        }
      }
    }
  }
  index2 = -1;
  while (++index2 < events.length) {
    if (events[index2][1].type === "attentionSequence") {
      events[index2][1].type = "data";
    }
  }
  return events;
}
function tokenizeAttention(effects, ok3) {
  const attentionMarkers2 = this.parser.constructs.attentionMarkers.null;
  const previous3 = this.previous;
  const before = classifyCharacter(previous3);
  let marker;
  return start;
  function start(code2) {
    marker = code2;
    effects.enter("attentionSequence");
    return inside(code2);
  }
  function inside(code2) {
    if (code2 === marker) {
      effects.consume(code2);
      return inside;
    }
    const token = effects.exit("attentionSequence");
    const after = classifyCharacter(code2);
    const open = !after || after === 2 && before || attentionMarkers2.includes(code2) && code2 !== 42 && code2 !== 95;
    const close2 = !before || before === 2 && after || attentionMarkers2.includes(previous3) && previous3 !== 42 && previous3 !== 95;
    token._open = Boolean(marker === 42 ? open : open && (before || !close2));
    token._close = Boolean(marker === 42 ? close2 : close2 && (after || !open));
    return ok3(code2);
  }
}
function movePoint(point3, offset) {
  point3.column += offset;
  point3.offset += offset;
  point3._bufferIndex += offset;
}

// node_modules/micromark-core-commonmark/lib/autolink.js
var autolink = {
  name: "autolink",
  tokenize: tokenizeAutolink
};
function tokenizeAutolink(effects, ok3, nok) {
  let size = 0;
  return start;
  function start(code2) {
    effects.enter("autolink");
    effects.enter("autolinkMarker");
    effects.consume(code2);
    effects.exit("autolinkMarker");
    effects.enter("autolinkProtocol");
    return open;
  }
  function open(code2) {
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      return schemeOrEmailAtext;
    }
    if (code2 === 64) {
      return nok(code2);
    }
    return emailAtext(code2);
  }
  function schemeOrEmailAtext(code2) {
    if (code2 === 43 || code2 === 45 || code2 === 46 || asciiAlphanumeric(code2)) {
      size = 1;
      return schemeInsideOrEmailAtext(code2);
    }
    return emailAtext(code2);
  }
  function schemeInsideOrEmailAtext(code2) {
    if (code2 === 58) {
      effects.consume(code2);
      size = 0;
      return urlInside;
    }
    if ((code2 === 43 || code2 === 45 || code2 === 46 || asciiAlphanumeric(code2)) && size++ < 32) {
      effects.consume(code2);
      return schemeInsideOrEmailAtext;
    }
    size = 0;
    return emailAtext(code2);
  }
  function urlInside(code2) {
    if (code2 === 62) {
      effects.exit("autolinkProtocol");
      effects.enter("autolinkMarker");
      effects.consume(code2);
      effects.exit("autolinkMarker");
      effects.exit("autolink");
      return ok3;
    }
    if (code2 === null || code2 === 32 || code2 === 60 || asciiControl(code2)) {
      return nok(code2);
    }
    effects.consume(code2);
    return urlInside;
  }
  function emailAtext(code2) {
    if (code2 === 64) {
      effects.consume(code2);
      return emailAtSignOrDot;
    }
    if (asciiAtext(code2)) {
      effects.consume(code2);
      return emailAtext;
    }
    return nok(code2);
  }
  function emailAtSignOrDot(code2) {
    return asciiAlphanumeric(code2) ? emailLabel(code2) : nok(code2);
  }
  function emailLabel(code2) {
    if (code2 === 46) {
      effects.consume(code2);
      size = 0;
      return emailAtSignOrDot;
    }
    if (code2 === 62) {
      effects.exit("autolinkProtocol").type = "autolinkEmail";
      effects.enter("autolinkMarker");
      effects.consume(code2);
      effects.exit("autolinkMarker");
      effects.exit("autolink");
      return ok3;
    }
    return emailValue(code2);
  }
  function emailValue(code2) {
    if ((code2 === 45 || asciiAlphanumeric(code2)) && size++ < 63) {
      const next = code2 === 45 ? emailValue : emailLabel;
      effects.consume(code2);
      return next;
    }
    return nok(code2);
  }
}

// node_modules/micromark-core-commonmark/lib/blank-line.js
var blankLine = {
  partial: true,
  tokenize: tokenizeBlankLine
};
function tokenizeBlankLine(effects, ok3, nok) {
  return start;
  function start(code2) {
    return markdownSpace(code2) ? factorySpace(effects, after, "linePrefix")(code2) : after(code2);
  }
  function after(code2) {
    return code2 === null || markdownLineEnding(code2) ? ok3(code2) : nok(code2);
  }
}

// node_modules/micromark-core-commonmark/lib/block-quote.js
var blockQuote = {
  continuation: {
    tokenize: tokenizeBlockQuoteContinuation
  },
  exit,
  name: "blockQuote",
  tokenize: tokenizeBlockQuoteStart
};
function tokenizeBlockQuoteStart(effects, ok3, nok) {
  const self = this;
  return start;
  function start(code2) {
    if (code2 === 62) {
      const state = self.containerState;
      if (!state.open) {
        effects.enter("blockQuote", {
          _container: true
        });
        state.open = true;
      }
      effects.enter("blockQuotePrefix");
      effects.enter("blockQuoteMarker");
      effects.consume(code2);
      effects.exit("blockQuoteMarker");
      return after;
    }
    return nok(code2);
  }
  function after(code2) {
    if (markdownSpace(code2)) {
      effects.enter("blockQuotePrefixWhitespace");
      effects.consume(code2);
      effects.exit("blockQuotePrefixWhitespace");
      effects.exit("blockQuotePrefix");
      return ok3;
    }
    effects.exit("blockQuotePrefix");
    return ok3(code2);
  }
}
function tokenizeBlockQuoteContinuation(effects, ok3, nok) {
  const self = this;
  return contStart;
  function contStart(code2) {
    if (markdownSpace(code2)) {
      return factorySpace(effects, contBefore, "linePrefix", self.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(code2);
    }
    return contBefore(code2);
  }
  function contBefore(code2) {
    return effects.attempt(blockQuote, ok3, nok)(code2);
  }
}
function exit(effects) {
  effects.exit("blockQuote");
}

// node_modules/micromark-core-commonmark/lib/character-escape.js
var characterEscape = {
  name: "characterEscape",
  tokenize: tokenizeCharacterEscape
};
function tokenizeCharacterEscape(effects, ok3, nok) {
  return start;
  function start(code2) {
    effects.enter("characterEscape");
    effects.enter("escapeMarker");
    effects.consume(code2);
    effects.exit("escapeMarker");
    return inside;
  }
  function inside(code2) {
    if (asciiPunctuation(code2)) {
      effects.enter("characterEscapeValue");
      effects.consume(code2);
      effects.exit("characterEscapeValue");
      effects.exit("characterEscape");
      return ok3;
    }
    return nok(code2);
  }
}

// node_modules/micromark-core-commonmark/lib/character-reference.js
var characterReference = {
  name: "characterReference",
  tokenize: tokenizeCharacterReference
};
function tokenizeCharacterReference(effects, ok3, nok) {
  const self = this;
  let size = 0;
  let max;
  let test;
  return start;
  function start(code2) {
    effects.enter("characterReference");
    effects.enter("characterReferenceMarker");
    effects.consume(code2);
    effects.exit("characterReferenceMarker");
    return open;
  }
  function open(code2) {
    if (code2 === 35) {
      effects.enter("characterReferenceMarkerNumeric");
      effects.consume(code2);
      effects.exit("characterReferenceMarkerNumeric");
      return numeric;
    }
    effects.enter("characterReferenceValue");
    max = 31;
    test = asciiAlphanumeric;
    return value2(code2);
  }
  function numeric(code2) {
    if (code2 === 88 || code2 === 120) {
      effects.enter("characterReferenceMarkerHexadecimal");
      effects.consume(code2);
      effects.exit("characterReferenceMarkerHexadecimal");
      effects.enter("characterReferenceValue");
      max = 6;
      test = asciiHexDigit;
      return value2;
    }
    effects.enter("characterReferenceValue");
    max = 7;
    test = asciiDigit;
    return value2(code2);
  }
  function value2(code2) {
    if (code2 === 59 && size) {
      const token = effects.exit("characterReferenceValue");
      if (test === asciiAlphanumeric && !decodeNamedCharacterReference(self.sliceSerialize(token))) {
        return nok(code2);
      }
      effects.enter("characterReferenceMarker");
      effects.consume(code2);
      effects.exit("characterReferenceMarker");
      effects.exit("characterReference");
      return ok3;
    }
    if (test(code2) && size++ < max) {
      effects.consume(code2);
      return value2;
    }
    return nok(code2);
  }
}

// node_modules/micromark-core-commonmark/lib/partial-non-lazy-continuation.js
var nonLazyContinuation = {
  partial: true,
  tokenize: tokenizeNonLazyContinuation
};
function tokenizeNonLazyContinuation(effects, ok3, nok) {
  const self = this;
  return start;
  function start(code2) {
    if (code2 === null) {
      return nok(code2);
    }
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return after;
  }
  function after(code2) {
    return self.parser.lazy[self.now().line] ? nok(code2) : ok3(code2);
  }
}

// node_modules/micromark-core-commonmark/lib/code-fenced.js
var codeFenced = {
  concrete: true,
  name: "codeFenced",
  tokenize: tokenizeCodeFenced
};
function tokenizeCodeFenced(effects, ok3, nok) {
  const self = this;
  const closeStart = {
    partial: true,
    tokenize: tokenizeCloseStart
  };
  let initialPrefix = 0;
  let sizeOpen = 0;
  let marker;
  return start;
  function start(code2) {
    return beforeSequenceOpen(code2);
  }
  function beforeSequenceOpen(code2) {
    const tail = self.events[self.events.length - 1];
    initialPrefix = tail && tail[1].type === "linePrefix" ? tail[2].sliceSerialize(tail[1], true).length : 0;
    marker = code2;
    effects.enter("codeFenced");
    effects.enter("codeFencedFence");
    effects.enter("codeFencedFenceSequence");
    return sequenceOpen(code2);
  }
  function sequenceOpen(code2) {
    if (code2 === marker) {
      sizeOpen++;
      effects.consume(code2);
      return sequenceOpen;
    }
    if (sizeOpen < 3) {
      return nok(code2);
    }
    effects.exit("codeFencedFenceSequence");
    return markdownSpace(code2) ? factorySpace(effects, infoBefore, "whitespace")(code2) : infoBefore(code2);
  }
  function infoBefore(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("codeFencedFence");
      return self.interrupt ? ok3(code2) : effects.check(nonLazyContinuation, atNonLazyBreak, after)(code2);
    }
    effects.enter("codeFencedFenceInfo");
    effects.enter("chunkString", {
      contentType: "string"
    });
    return info(code2);
  }
  function info(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("chunkString");
      effects.exit("codeFencedFenceInfo");
      return infoBefore(code2);
    }
    if (markdownSpace(code2)) {
      effects.exit("chunkString");
      effects.exit("codeFencedFenceInfo");
      return factorySpace(effects, metaBefore, "whitespace")(code2);
    }
    if (code2 === 96 && code2 === marker) {
      return nok(code2);
    }
    effects.consume(code2);
    return info;
  }
  function metaBefore(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      return infoBefore(code2);
    }
    effects.enter("codeFencedFenceMeta");
    effects.enter("chunkString", {
      contentType: "string"
    });
    return meta(code2);
  }
  function meta(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("chunkString");
      effects.exit("codeFencedFenceMeta");
      return infoBefore(code2);
    }
    if (code2 === 96 && code2 === marker) {
      return nok(code2);
    }
    effects.consume(code2);
    return meta;
  }
  function atNonLazyBreak(code2) {
    return effects.attempt(closeStart, after, contentBefore)(code2);
  }
  function contentBefore(code2) {
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return contentStart;
  }
  function contentStart(code2) {
    return initialPrefix > 0 && markdownSpace(code2) ? factorySpace(effects, beforeContentChunk, "linePrefix", initialPrefix + 1)(code2) : beforeContentChunk(code2);
  }
  function beforeContentChunk(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      return effects.check(nonLazyContinuation, atNonLazyBreak, after)(code2);
    }
    effects.enter("codeFlowValue");
    return contentChunk(code2);
  }
  function contentChunk(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("codeFlowValue");
      return beforeContentChunk(code2);
    }
    effects.consume(code2);
    return contentChunk;
  }
  function after(code2) {
    effects.exit("codeFenced");
    return ok3(code2);
  }
  function tokenizeCloseStart(effects2, ok4, nok2) {
    let size = 0;
    return startBefore;
    function startBefore(code2) {
      effects2.enter("lineEnding");
      effects2.consume(code2);
      effects2.exit("lineEnding");
      return start2;
    }
    function start2(code2) {
      effects2.enter("codeFencedFence");
      return markdownSpace(code2) ? factorySpace(effects2, beforeSequenceClose, "linePrefix", self.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(code2) : beforeSequenceClose(code2);
    }
    function beforeSequenceClose(code2) {
      if (code2 === marker) {
        effects2.enter("codeFencedFenceSequence");
        return sequenceClose(code2);
      }
      return nok2(code2);
    }
    function sequenceClose(code2) {
      if (code2 === marker) {
        size++;
        effects2.consume(code2);
        return sequenceClose;
      }
      if (size >= sizeOpen) {
        effects2.exit("codeFencedFenceSequence");
        return markdownSpace(code2) ? factorySpace(effects2, sequenceCloseAfter, "whitespace")(code2) : sequenceCloseAfter(code2);
      }
      return nok2(code2);
    }
    function sequenceCloseAfter(code2) {
      if (code2 === null || markdownLineEnding(code2)) {
        effects2.exit("codeFencedFence");
        return ok4(code2);
      }
      return nok2(code2);
    }
  }
}

// node_modules/micromark-core-commonmark/lib/code-indented.js
var codeIndented = {
  name: "codeIndented",
  tokenize: tokenizeCodeIndented
};
var furtherStart = {
  partial: true,
  tokenize: tokenizeFurtherStart
};
function tokenizeCodeIndented(effects, ok3, nok) {
  return start;
  function start(code2) {
    effects.enter("codeIndented");
    return factorySpaceMinMax(effects, atBreak, nok, "linePrefix", 4, 4)(code2);
  }
  function atBreak(code2) {
    if (code2 === null) {
      return after(code2);
    }
    if (markdownLineEnding(code2)) {
      return effects.attempt(furtherStart, atBreak, after)(code2);
    }
    effects.enter("codeFlowValue");
    return inside(code2);
  }
  function inside(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("codeFlowValue");
      return atBreak(code2);
    }
    effects.consume(code2);
    return inside;
  }
  function after(code2) {
    effects.exit("codeIndented");
    return ok3(code2);
  }
}
function tokenizeFurtherStart(effects, ok3, nok) {
  const self = this;
  return furtherStart2;
  function furtherStart2(code2) {
    if (self.parser.lazy[self.now().line]) {
      return nok(code2);
    }
    if (markdownLineEnding(code2)) {
      effects.enter("lineEnding");
      effects.consume(code2);
      effects.exit("lineEnding");
      return furtherStart2;
    }
    return factorySpaceMinMax(effects, ok3, onNotEnoughPrefix, "linePrefix", 4, 4)(code2);
  }
  function onNotEnoughPrefix(code2) {
    return markdownLineEnding(code2) ? furtherStart2(code2) : nok(code2);
  }
}

// node_modules/micromark-core-commonmark/lib/code-text.js
var codeText = {
  name: "codeText",
  previous,
  resolve: resolveCodeText,
  tokenize: tokenizeCodeText
};
function resolveCodeText(events) {
  let tailExitIndex = events.length - 4;
  let headEnterIndex = 3;
  let index2;
  let enter;
  if ((events[headEnterIndex][1].type === "lineEnding" || events[headEnterIndex][1].type === "space") && (events[tailExitIndex][1].type === "lineEnding" || events[tailExitIndex][1].type === "space")) {
    index2 = headEnterIndex;
    while (++index2 < tailExitIndex) {
      if (events[index2][1].type === "codeTextData") {
        events[headEnterIndex][1].type = "codeTextPadding";
        events[tailExitIndex][1].type = "codeTextPadding";
        headEnterIndex += 2;
        tailExitIndex -= 2;
        break;
      }
    }
  }
  index2 = headEnterIndex - 1;
  tailExitIndex++;
  while (++index2 <= tailExitIndex) {
    if (enter === void 0) {
      if (index2 !== tailExitIndex && events[index2][1].type !== "lineEnding") {
        enter = index2;
      }
    } else if (index2 === tailExitIndex || events[index2][1].type === "lineEnding") {
      events[enter][1].type = "codeTextData";
      if (index2 !== enter + 2) {
        events[enter][1].end = events[index2 - 1][1].end;
        events.splice(enter + 2, index2 - enter - 2);
        tailExitIndex -= index2 - enter - 2;
        index2 = enter + 2;
      }
      enter = void 0;
    }
  }
  return events;
}
function previous(code2) {
  return code2 !== 96 || this.events[this.events.length - 1][1].type === "characterEscape";
}
function tokenizeCodeText(effects, ok3, nok) {
  const self = this;
  let sizeOpen = 0;
  let size;
  let token;
  return start;
  function start(code2) {
    effects.enter("codeText");
    effects.enter("codeTextSequence");
    return sequenceOpen(code2);
  }
  function sequenceOpen(code2) {
    if (code2 === 96) {
      effects.consume(code2);
      sizeOpen++;
      return sequenceOpen;
    }
    effects.exit("codeTextSequence");
    return between(code2);
  }
  function between(code2) {
    if (code2 === null) {
      return nok(code2);
    }
    if (code2 === 32) {
      effects.enter("space");
      effects.consume(code2);
      effects.exit("space");
      return between;
    }
    if (code2 === 96) {
      token = effects.enter("codeTextSequence");
      size = 0;
      return sequenceClose(code2);
    }
    if (markdownLineEnding(code2)) {
      effects.enter("lineEnding");
      effects.consume(code2);
      effects.exit("lineEnding");
      return between;
    }
    effects.enter("codeTextData");
    return data(code2);
  }
  function data(code2) {
    if (code2 === null || code2 === 32 || code2 === 96 || markdownLineEnding(code2)) {
      effects.exit("codeTextData");
      return between(code2);
    }
    effects.consume(code2);
    return data;
  }
  function sequenceClose(code2) {
    if (code2 === 96) {
      effects.consume(code2);
      size++;
      return sequenceClose;
    }
    if (size === sizeOpen) {
      effects.exit("codeTextSequence");
      effects.exit("codeText");
      return ok3(code2);
    }
    token.type = "codeTextData";
    return data(code2);
  }
}

// node_modules/micromark-util-subtokenize/lib/splice-buffer.js
var SpliceBuffer = class {
  /**
   * @param {ReadonlyArray<T> | null | undefined} [initial]
   *   Initial items (optional).
   * @returns
   *   Splice buffer.
   */
  constructor(initial) {
    this.left = initial ? [...initial] : [];
    this.right = [];
  }
  /**
   * Array access;
   * does not move the cursor.
   *
   * @param {number} index
   *   Index.
   * @return {T}
   *   Item.
   */
  get(index2) {
    if (index2 < 0 || index2 >= this.left.length + this.right.length) {
      throw new RangeError("Cannot access index `" + index2 + "` in a splice buffer of size `" + (this.left.length + this.right.length) + "`");
    }
    if (index2 < this.left.length) return this.left[index2];
    return this.right[this.right.length - index2 + this.left.length - 1];
  }
  /**
   * The length of the splice buffer, one greater than the largest index in the
   * array.
   */
  get length() {
    return this.left.length + this.right.length;
  }
  /**
   * Remove and return `list[0]`;
   * moves the cursor to `0`.
   *
   * @returns {T | undefined}
   *   Item, optional.
   */
  shift() {
    this.setCursor(0);
    return this.right.pop();
  }
  /**
   * Slice the buffer to get an array;
   * does not move the cursor.
   *
   * @param {number} start
   *   Start.
   * @param {number | null | undefined} [end]
   *   End (optional).
   * @returns {Array<T>}
   *   Array of items.
   */
  slice(start, end) {
    const stop = end === null || end === void 0 ? Number.POSITIVE_INFINITY : end;
    if (stop < this.left.length) {
      return this.left.slice(start, stop);
    }
    if (start > this.left.length) {
      return this.right.slice(this.right.length - stop + this.left.length, this.right.length - start + this.left.length).reverse();
    }
    return this.left.slice(start).concat(this.right.slice(this.right.length - stop + this.left.length).reverse());
  }
  /**
   * Mimics the behavior of Array.prototype.splice() except for the change of
   * interface necessary to avoid segfaults when patching in very large arrays.
   *
   * This operation moves cursor is moved to `start` and results in the cursor
   * placed after any inserted items.
   *
   * @param {number} start
   *   Start;
   *   zero-based index at which to start changing the array;
   *   negative numbers count backwards from the end of the array and values
   *   that are out-of bounds are clamped to the appropriate end of the array.
   * @param {number | null | undefined} [deleteCount=0]
   *   Delete count (default: `0`);
   *   maximum number of elements to delete, starting from start.
   * @param {Array<T> | null | undefined} [items=[]]
   *   Items to include in place of the deleted items (default: `[]`).
   * @return {Array<T>}
   *   Any removed items.
   */
  splice(start, deleteCount, items) {
    const count = deleteCount || 0;
    this.setCursor(Math.trunc(start));
    const removed = this.right.splice(this.right.length - count, Number.POSITIVE_INFINITY);
    if (items) chunkedPush(this.left, items);
    return removed.reverse();
  }
  /**
   * Remove and return the highest-numbered item in the array, so
   * `list[list.length - 1]`;
   * Moves the cursor to `length`.
   *
   * @returns {T | undefined}
   *   Item, optional.
   */
  pop() {
    this.setCursor(Number.POSITIVE_INFINITY);
    return this.left.pop();
  }
  /**
   * Inserts a single item to the high-numbered side of the array;
   * moves the cursor to `length`.
   *
   * @param {T} item
   *   Item.
   * @returns {undefined}
   *   Nothing.
   */
  push(item2) {
    this.setCursor(Number.POSITIVE_INFINITY);
    this.left.push(item2);
  }
  /**
   * Inserts many items to the high-numbered side of the array.
   * Moves the cursor to `length`.
   *
   * @param {Array<T>} items
   *   Items.
   * @returns {undefined}
   *   Nothing.
   */
  pushMany(items) {
    this.setCursor(Number.POSITIVE_INFINITY);
    chunkedPush(this.left, items);
  }
  /**
   * Inserts a single item to the low-numbered side of the array;
   * Moves the cursor to `0`.
   *
   * @param {T} item
   *   Item.
   * @returns {undefined}
   *   Nothing.
   */
  unshift(item2) {
    this.setCursor(0);
    this.right.push(item2);
  }
  /**
   * Inserts many items to the low-numbered side of the array;
   * moves the cursor to `0`.
   *
   * @param {Array<T>} items
   *   Items.
   * @returns {undefined}
   *   Nothing.
   */
  unshiftMany(items) {
    this.setCursor(0);
    chunkedPush(this.right, items.reverse());
  }
  /**
   * Move the cursor to a specific position in the array. Requires
   * time proportional to the distance moved.
   *
   * If `n < 0`, the cursor will end up at the beginning.
   * If `n > length`, the cursor will end up at the end.
   *
   * @param {number} n
   *   Position.
   * @return {undefined}
   *   Nothing.
   */
  setCursor(n) {
    if (n === this.left.length || n > this.left.length && this.right.length === 0 || n < 0 && this.left.length === 0) return;
    if (n < this.left.length) {
      const removed = this.left.splice(n, Number.POSITIVE_INFINITY);
      chunkedPush(this.right, removed.reverse());
    } else {
      const removed = this.right.splice(this.left.length + this.right.length - n, Number.POSITIVE_INFINITY);
      chunkedPush(this.left, removed.reverse());
    }
  }
};
function chunkedPush(list2, right) {
  let chunkStart = 0;
  if (right.length < 1e4) {
    list2.push(...right);
  } else {
    while (chunkStart < right.length) {
      list2.push(...right.slice(chunkStart, chunkStart + 1e4));
      chunkStart += 1e4;
    }
  }
}

// node_modules/micromark-util-subtokenize/index.js
function subtokenize(eventsArray) {
  const jumps = {};
  let index2 = -1;
  let event;
  let lineIndex;
  let otherIndex;
  let otherEvent;
  let parameters;
  let subevents;
  let more;
  const events = new SpliceBuffer(eventsArray);
  while (++index2 < events.length) {
    while (index2 in jumps) {
      index2 = jumps[index2];
    }
    event = events.get(index2);
    if (index2 && event[1].type === "chunkFlow" && events.get(index2 - 1)[1].type === "listItemPrefix") {
      subevents = event[1]._tokenizer.events;
      otherIndex = 0;
      if (otherIndex < subevents.length && subevents[otherIndex][1].type === "lineEndingBlank") {
        otherIndex += 2;
      }
      if (otherIndex < subevents.length && subevents[otherIndex][1].type === "content") {
        while (++otherIndex < subevents.length) {
          if (subevents[otherIndex][1].type === "content") {
            break;
          }
          if (subevents[otherIndex][1].type === "chunkText") {
            subevents[otherIndex][1]._isInFirstContentOfListItem = true;
            otherIndex++;
          }
        }
      }
    }
    if (event[0] === "enter") {
      if (event[1].contentType) {
        Object.assign(jumps, subcontent(events, index2));
        index2 = jumps[index2];
        more = true;
      }
    } else if (event[1]._container) {
      otherIndex = index2;
      lineIndex = void 0;
      while (otherIndex--) {
        otherEvent = events.get(otherIndex);
        if (otherEvent[1].type === "lineEnding" || otherEvent[1].type === "lineEndingBlank") {
          if (otherEvent[0] === "enter") {
            if (lineIndex) {
              events.get(lineIndex)[1].type = "lineEndingBlank";
            }
            otherEvent[1].type = "lineEnding";
            lineIndex = otherIndex;
          }
        } else if (otherEvent[1].type === "linePrefix" || otherEvent[1].type === "listItemIndent") {
        } else {
          break;
        }
      }
      if (lineIndex) {
        event[1].end = {
          ...events.get(lineIndex)[1].start
        };
        parameters = events.slice(lineIndex, index2);
        parameters.unshift(event);
        events.splice(lineIndex, index2 - lineIndex + 1, parameters);
      }
    }
  }
  splice(eventsArray, 0, Number.POSITIVE_INFINITY, events.slice(0));
  return !more;
}
function subcontent(events, eventIndex) {
  const token = events.get(eventIndex)[1];
  const context = events.get(eventIndex)[2];
  let startPosition = eventIndex - 1;
  const startPositions = [];
  let tokenizer = token._tokenizer;
  if (!tokenizer) {
    tokenizer = context.parser[token.contentType](token.start);
    if (token._contentTypeTextTrailing) {
      tokenizer._contentTypeTextTrailing = true;
    }
  }
  const childEvents = tokenizer.events;
  const jumps = [];
  const gaps = {};
  let stream;
  let previous3;
  let index2 = -1;
  let current = token;
  let adjust = 0;
  let start = 0;
  const breaks = [start];
  while (current) {
    while (events.get(++startPosition)[1] !== current) {
    }
    startPositions.push(startPosition);
    if (!current._tokenizer) {
      stream = context.sliceStream(current);
      if (!current.next) {
        stream.push(null);
      }
      if (previous3) {
        tokenizer.defineSkip(current.start);
      }
      if (current._isInFirstContentOfListItem) {
        tokenizer._gfmTasklistFirstContentOfListItem = true;
      }
      tokenizer.write(stream);
      if (current._isInFirstContentOfListItem) {
        tokenizer._gfmTasklistFirstContentOfListItem = void 0;
      }
    }
    previous3 = current;
    current = current.next;
  }
  current = token;
  while (++index2 < childEvents.length) {
    if (
      // Find a void token that includes a break.
      childEvents[index2][0] === "exit" && childEvents[index2 - 1][0] === "enter" && childEvents[index2][1].type === childEvents[index2 - 1][1].type && childEvents[index2][1].start.line !== childEvents[index2][1].end.line
    ) {
      start = index2 + 1;
      breaks.push(start);
      current._tokenizer = void 0;
      current.previous = void 0;
      current = current.next;
    }
  }
  tokenizer.events = [];
  if (current) {
    current._tokenizer = void 0;
    current.previous = void 0;
  } else {
    breaks.pop();
  }
  index2 = breaks.length;
  while (index2--) {
    const slice = childEvents.slice(breaks[index2], breaks[index2 + 1]);
    const start2 = startPositions.pop();
    jumps.push([start2, start2 + slice.length - 1]);
    events.splice(start2, 2, slice);
  }
  jumps.reverse();
  index2 = -1;
  while (++index2 < jumps.length) {
    gaps[adjust + jumps[index2][0]] = adjust + jumps[index2][1];
    adjust += jumps[index2][1] - jumps[index2][0] - 1;
  }
  return gaps;
}

// node_modules/micromark-core-commonmark/lib/content.js
var content2 = {
  resolve: resolveContent,
  tokenize: tokenizeContent
};
var continuationConstruct = {
  partial: true,
  tokenize: tokenizeContinuation
};
function resolveContent(events) {
  subtokenize(events);
  return events;
}
function tokenizeContent(effects, ok3) {
  let previous3;
  return chunkStart;
  function chunkStart(code2) {
    effects.enter("content");
    previous3 = effects.enter("chunkContent", {
      contentType: "content"
    });
    return chunkInside(code2);
  }
  function chunkInside(code2) {
    if (code2 === null) {
      return contentEnd(code2);
    }
    if (markdownLineEnding(code2)) {
      return effects.check(continuationConstruct, contentContinue, contentEnd)(code2);
    }
    effects.consume(code2);
    return chunkInside;
  }
  function contentEnd(code2) {
    effects.exit("chunkContent");
    effects.exit("content");
    return ok3(code2);
  }
  function contentContinue(code2) {
    effects.consume(code2);
    effects.exit("chunkContent");
    previous3.next = effects.enter("chunkContent", {
      contentType: "content",
      previous: previous3
    });
    previous3 = previous3.next;
    return chunkInside;
  }
}
function tokenizeContinuation(effects, ok3, nok) {
  const self = this;
  return startLookahead;
  function startLookahead(code2) {
    effects.exit("chunkContent");
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return factorySpace(effects, prefixed, "linePrefix");
  }
  function prefixed(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      return nok(code2);
    }
    const tail = self.events[self.events.length - 1];
    if (!self.parser.constructs.disable.null.includes("codeIndented") && tail && tail[1].type === "linePrefix" && tail[2].sliceSerialize(tail[1], true).length >= 4) {
      return ok3(code2);
    }
    return effects.interrupt(self.parser.constructs.flow, nok, ok3)(code2);
  }
}

// node_modules/micromark-factory-destination/index.js
function factoryDestination(effects, ok3, nok, type, literalType, literalMarkerType, rawType, stringType, max) {
  const limit = max || Number.POSITIVE_INFINITY;
  let balance = 0;
  return start;
  function start(code2) {
    if (code2 === 60) {
      effects.enter(type);
      effects.enter(literalType);
      effects.enter(literalMarkerType);
      effects.consume(code2);
      effects.exit(literalMarkerType);
      return enclosedBefore;
    }
    if (code2 === null || code2 === 32 || code2 === 41 || asciiControl(code2)) {
      return nok(code2);
    }
    effects.enter(type);
    effects.enter(rawType);
    effects.enter(stringType);
    effects.enter("chunkString", {
      contentType: "string"
    });
    return raw(code2);
  }
  function enclosedBefore(code2) {
    if (code2 === 62) {
      effects.enter(literalMarkerType);
      effects.consume(code2);
      effects.exit(literalMarkerType);
      effects.exit(literalType);
      effects.exit(type);
      return ok3;
    }
    effects.enter(stringType);
    effects.enter("chunkString", {
      contentType: "string"
    });
    return enclosed(code2);
  }
  function enclosed(code2) {
    if (code2 === 62) {
      effects.exit("chunkString");
      effects.exit(stringType);
      return enclosedBefore(code2);
    }
    if (code2 === null || code2 === 60 || markdownLineEnding(code2)) {
      return nok(code2);
    }
    effects.consume(code2);
    return code2 === 92 ? enclosedEscape : enclosed;
  }
  function enclosedEscape(code2) {
    if (code2 === 60 || code2 === 62 || code2 === 92) {
      effects.consume(code2);
      return enclosed;
    }
    return enclosed(code2);
  }
  function raw(code2) {
    if (!balance && (code2 === null || code2 === 41 || markdownLineEndingOrSpace(code2))) {
      effects.exit("chunkString");
      effects.exit(stringType);
      effects.exit(rawType);
      effects.exit(type);
      return ok3(code2);
    }
    if (balance < limit && code2 === 40) {
      effects.consume(code2);
      balance++;
      return raw;
    }
    if (code2 === 41) {
      effects.consume(code2);
      balance--;
      return raw;
    }
    if (code2 === null || code2 === 32 || code2 === 40 || asciiControl(code2)) {
      return nok(code2);
    }
    effects.consume(code2);
    return code2 === 92 ? rawEscape : raw;
  }
  function rawEscape(code2) {
    if (code2 === 40 || code2 === 41 || code2 === 92) {
      effects.consume(code2);
      return raw;
    }
    return raw(code2);
  }
}

// node_modules/micromark-factory-label/index.js
function factoryLabel(effects, ok3, nok, type, markerType, stringType) {
  const self = this;
  let size = 0;
  let seen;
  return start;
  function start(code2) {
    effects.enter(type);
    effects.enter(markerType);
    effects.consume(code2);
    effects.exit(markerType);
    effects.enter(stringType);
    return atBreak;
  }
  function atBreak(code2) {
    if (size > 999 || code2 === null || code2 === 91 || code2 === 93 && !seen || // To do: remove in the future once we’ve switched from
    // `micromark-extension-footnote` to `micromark-extension-gfm-footnote`,
    // which doesn’t need this.
    // Hidden footnotes hook.
    /* c8 ignore next 3 */
    code2 === 94 && !size && "_hiddenFootnoteSupport" in self.parser.constructs) {
      return nok(code2);
    }
    if (code2 === 93) {
      effects.exit(stringType);
      effects.enter(markerType);
      effects.consume(code2);
      effects.exit(markerType);
      effects.exit(type);
      return ok3;
    }
    if (markdownLineEnding(code2)) {
      effects.enter("lineEnding");
      effects.consume(code2);
      effects.exit("lineEnding");
      return atBreak;
    }
    effects.enter("chunkString", {
      contentType: "string"
    });
    return labelInside(code2);
  }
  function labelInside(code2) {
    if (code2 === null || code2 === 91 || code2 === 93 || markdownLineEnding(code2) || size++ > 999) {
      effects.exit("chunkString");
      return atBreak(code2);
    }
    effects.consume(code2);
    if (!seen) seen = !markdownSpace(code2);
    return code2 === 92 ? labelEscape : labelInside;
  }
  function labelEscape(code2) {
    if (code2 === 91 || code2 === 92 || code2 === 93) {
      effects.consume(code2);
      size++;
      return labelInside;
    }
    return labelInside(code2);
  }
}

// node_modules/micromark-factory-title/index.js
function factoryTitle(effects, ok3, nok, type, markerType, stringType) {
  let marker;
  return start;
  function start(code2) {
    if (code2 === 34 || code2 === 39 || code2 === 40) {
      effects.enter(type);
      effects.enter(markerType);
      effects.consume(code2);
      effects.exit(markerType);
      marker = code2 === 40 ? 41 : code2;
      return begin;
    }
    return nok(code2);
  }
  function begin(code2) {
    if (code2 === marker) {
      effects.enter(markerType);
      effects.consume(code2);
      effects.exit(markerType);
      effects.exit(type);
      return ok3;
    }
    effects.enter(stringType);
    return atBreak(code2);
  }
  function atBreak(code2) {
    if (code2 === marker) {
      effects.exit(stringType);
      return begin(marker);
    }
    if (code2 === null) {
      return nok(code2);
    }
    if (markdownLineEnding(code2)) {
      effects.enter("lineEnding");
      effects.consume(code2);
      effects.exit("lineEnding");
      return factorySpace(effects, atBreak, "linePrefix");
    }
    effects.enter("chunkString", {
      contentType: "string"
    });
    return inside(code2);
  }
  function inside(code2) {
    if (code2 === marker || code2 === null || markdownLineEnding(code2)) {
      effects.exit("chunkString");
      return atBreak(code2);
    }
    effects.consume(code2);
    return code2 === 92 ? escape : inside;
  }
  function escape(code2) {
    if (code2 === marker || code2 === 92) {
      effects.consume(code2);
      return inside;
    }
    return inside(code2);
  }
}

// node_modules/micromark-factory-whitespace/index.js
function factoryWhitespace(effects, ok3) {
  let seen;
  return start;
  function start(code2) {
    if (markdownLineEnding(code2)) {
      effects.enter("lineEnding");
      effects.consume(code2);
      effects.exit("lineEnding");
      seen = true;
      return start;
    }
    if (markdownSpace(code2)) {
      return factorySpace(effects, start, seen ? "linePrefix" : "lineSuffix")(code2);
    }
    return ok3(code2);
  }
}

// node_modules/micromark-core-commonmark/lib/definition.js
var definition = {
  name: "definition",
  tokenize: tokenizeDefinition
};
var titleBefore = {
  partial: true,
  tokenize: tokenizeTitleBefore
};
function tokenizeDefinition(effects, ok3, nok) {
  const self = this;
  let identifier;
  return start;
  function start(code2) {
    effects.enter("definition");
    return before(code2);
  }
  function before(code2) {
    return factoryLabel.call(
      self,
      effects,
      labelAfter,
      // Note: we don’t need to reset the way `markdown-rs` does.
      nok,
      "definitionLabel",
      "definitionLabelMarker",
      "definitionLabelString"
    )(code2);
  }
  function labelAfter(code2) {
    identifier = normalizeIdentifier(self.sliceSerialize(self.events[self.events.length - 1][1]).slice(1, -1));
    if (code2 === 58) {
      effects.enter("definitionMarker");
      effects.consume(code2);
      effects.exit("definitionMarker");
      return markerAfter;
    }
    return nok(code2);
  }
  function markerAfter(code2) {
    return markdownLineEndingOrSpace(code2) ? factoryWhitespace(effects, destinationBefore)(code2) : destinationBefore(code2);
  }
  function destinationBefore(code2) {
    return factoryDestination(
      effects,
      destinationAfter,
      // Note: we don’t need to reset the way `markdown-rs` does.
      nok,
      "definitionDestination",
      "definitionDestinationLiteral",
      "definitionDestinationLiteralMarker",
      "definitionDestinationRaw",
      "definitionDestinationString"
    )(code2);
  }
  function destinationAfter(code2) {
    return effects.attempt(titleBefore, after, after)(code2);
  }
  function after(code2) {
    return markdownSpace(code2) ? factorySpace(effects, afterWhitespace, "whitespace")(code2) : afterWhitespace(code2);
  }
  function afterWhitespace(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("definition");
      self.parser.defined.push(identifier);
      return ok3(code2);
    }
    return nok(code2);
  }
}
function tokenizeTitleBefore(effects, ok3, nok) {
  return titleBefore2;
  function titleBefore2(code2) {
    return markdownLineEndingOrSpace(code2) ? factoryWhitespace(effects, beforeMarker)(code2) : nok(code2);
  }
  function beforeMarker(code2) {
    return factoryTitle(effects, titleAfter, nok, "definitionTitle", "definitionTitleMarker", "definitionTitleString")(code2);
  }
  function titleAfter(code2) {
    return markdownSpace(code2) ? factorySpace(effects, titleAfterOptionalWhitespace, "whitespace")(code2) : titleAfterOptionalWhitespace(code2);
  }
  function titleAfterOptionalWhitespace(code2) {
    return code2 === null || markdownLineEnding(code2) ? ok3(code2) : nok(code2);
  }
}

// node_modules/micromark-core-commonmark/lib/hard-break-escape.js
var hardBreakEscape = {
  name: "hardBreakEscape",
  tokenize: tokenizeHardBreakEscape
};
function tokenizeHardBreakEscape(effects, ok3, nok) {
  return start;
  function start(code2) {
    effects.enter("hardBreakEscape");
    effects.consume(code2);
    return after;
  }
  function after(code2) {
    if (markdownLineEnding(code2)) {
      effects.exit("hardBreakEscape");
      return ok3(code2);
    }
    return nok(code2);
  }
}

// node_modules/micromark-core-commonmark/lib/heading-atx.js
var headingAtx = {
  name: "headingAtx",
  resolve: resolveHeadingAtx,
  tokenize: tokenizeHeadingAtx
};
function resolveHeadingAtx(events, context) {
  let contentEnd = events.length - 2;
  let contentStart = 3;
  if (events[contentStart][1].type === "whitespace") {
    contentStart += 2;
  }
  if (contentEnd - 2 > contentStart && events[contentEnd][1].type === "whitespace") {
    contentEnd -= 2;
  }
  if (events[contentEnd][1].type === "atxHeadingSequence" && (contentStart === contentEnd - 1 || contentEnd - 4 > contentStart && events[contentEnd - 2][1].type === "whitespace")) {
    contentEnd -= contentStart + 1 === contentEnd ? 2 : 4;
  }
  if (contentEnd > contentStart) {
    const content3 = {
      type: "atxHeadingText",
      start: events[contentStart][1].start,
      end: events[contentEnd][1].end
    };
    const text4 = {
      type: "chunkText",
      start: events[contentStart][1].start,
      end: events[contentEnd][1].end,
      contentType: "text"
    };
    splice(events, contentStart, contentEnd - contentStart + 1, [["enter", content3, context], ["enter", text4, context], ["exit", text4, context], ["exit", content3, context]]);
  }
  return events;
}
function tokenizeHeadingAtx(effects, ok3, nok) {
  let size = 0;
  return start;
  function start(code2) {
    effects.enter("atxHeading");
    return before(code2);
  }
  function before(code2) {
    effects.enter("atxHeadingSequence");
    return sequenceOpen(code2);
  }
  function sequenceOpen(code2) {
    if (code2 === 35 && size++ < 6) {
      effects.consume(code2);
      return sequenceOpen;
    }
    if (code2 === null || markdownLineEndingOrSpace(code2)) {
      effects.exit("atxHeadingSequence");
      return atBreak(code2);
    }
    return nok(code2);
  }
  function atBreak(code2) {
    if (code2 === 35) {
      effects.enter("atxHeadingSequence");
      return sequenceFurther(code2);
    }
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("atxHeading");
      return ok3(code2);
    }
    if (markdownSpace(code2)) {
      return factorySpace(effects, atBreak, "whitespace")(code2);
    }
    effects.enter("atxHeadingText");
    return data(code2);
  }
  function sequenceFurther(code2) {
    if (code2 === 35) {
      effects.consume(code2);
      return sequenceFurther;
    }
    effects.exit("atxHeadingSequence");
    return atBreak(code2);
  }
  function data(code2) {
    if (code2 === null || code2 === 35 || markdownLineEndingOrSpace(code2)) {
      effects.exit("atxHeadingText");
      return atBreak(code2);
    }
    effects.consume(code2);
    return data;
  }
}

// node_modules/micromark-util-html-tag-name/index.js
var htmlBlockNames = [
  "address",
  "article",
  "aside",
  "base",
  "basefont",
  "blockquote",
  "body",
  "caption",
  "center",
  "col",
  "colgroup",
  "dd",
  "details",
  "dialog",
  "dir",
  "div",
  "dl",
  "dt",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "frame",
  "frameset",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hr",
  "html",
  "iframe",
  "legend",
  "li",
  "link",
  "main",
  "menu",
  "menuitem",
  "nav",
  "noframes",
  "ol",
  "optgroup",
  "option",
  "p",
  "param",
  "search",
  "section",
  "summary",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "title",
  "tr",
  "track",
  "ul"
];
var htmlRawNames = ["pre", "script", "style", "textarea"];

// node_modules/micromark-core-commonmark/lib/html-flow.js
var htmlFlow = {
  concrete: true,
  name: "htmlFlow",
  resolveTo: resolveToHtmlFlow,
  tokenize: tokenizeHtmlFlow
};
var blankLineBefore = {
  partial: true,
  tokenize: tokenizeBlankLineBefore
};
function resolveToHtmlFlow(events) {
  let index2 = events.length;
  while (index2--) {
    if (events[index2][0] === "enter" && events[index2][1].type === "htmlFlow") {
      break;
    }
  }
  if (index2 > 1 && events[index2 - 2][1].type === "linePrefix") {
    events[index2][1].start = events[index2 - 2][1].start;
    events[index2 + 1][1].start = events[index2 - 2][1].start;
    events.splice(index2 - 2, 2);
  }
  return events;
}
function tokenizeHtmlFlow(effects, ok3, nok) {
  const self = this;
  let marker;
  let closingTag;
  let buffer;
  let index2;
  let markerB;
  return start;
  function start(code2) {
    return before(code2);
  }
  function before(code2) {
    effects.enter("htmlFlow");
    effects.enter("htmlFlowData");
    effects.consume(code2);
    return open;
  }
  function open(code2) {
    if (code2 === 33) {
      effects.consume(code2);
      return declarationOpen;
    }
    if (code2 === 47) {
      effects.consume(code2);
      closingTag = true;
      return tagCloseStart;
    }
    if (code2 === 63) {
      effects.consume(code2);
      marker = 3;
      return self.interrupt ? ok3 : continuationDeclarationInside;
    }
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      buffer = String.fromCharCode(code2);
      return tagName;
    }
    return nok(code2);
  }
  function declarationOpen(code2) {
    if (code2 === 45) {
      effects.consume(code2);
      marker = 2;
      return commentOpenInside;
    }
    if (code2 === 91) {
      effects.consume(code2);
      marker = 5;
      index2 = 0;
      return cdataOpenInside;
    }
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      marker = 4;
      return self.interrupt ? ok3 : continuationDeclarationInside;
    }
    return nok(code2);
  }
  function commentOpenInside(code2) {
    if (code2 === 45) {
      effects.consume(code2);
      return self.interrupt ? ok3 : continuationDeclarationInside;
    }
    return nok(code2);
  }
  function cdataOpenInside(code2) {
    const value2 = "CDATA[";
    if (code2 === value2.charCodeAt(index2++)) {
      effects.consume(code2);
      if (index2 === value2.length) {
        return self.interrupt ? ok3 : continuation;
      }
      return cdataOpenInside;
    }
    return nok(code2);
  }
  function tagCloseStart(code2) {
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      buffer = String.fromCharCode(code2);
      return tagName;
    }
    return nok(code2);
  }
  function tagName(code2) {
    if (code2 === null || code2 === 47 || code2 === 62 || markdownLineEndingOrSpace(code2)) {
      const slash = code2 === 47;
      const name = buffer.toLowerCase();
      if (!slash && !closingTag && htmlRawNames.includes(name)) {
        marker = 1;
        return self.interrupt ? ok3(code2) : continuation(code2);
      }
      if (htmlBlockNames.includes(buffer.toLowerCase())) {
        marker = 6;
        if (slash) {
          effects.consume(code2);
          return basicSelfClosing;
        }
        return self.interrupt ? ok3(code2) : continuation(code2);
      }
      marker = 7;
      return self.interrupt && !self.parser.lazy[self.now().line] ? nok(code2) : closingTag ? completeClosingTagAfter(code2) : completeAttributeNameBefore(code2);
    }
    if (code2 === 45 || asciiAlphanumeric(code2)) {
      effects.consume(code2);
      buffer += String.fromCharCode(code2);
      return tagName;
    }
    return nok(code2);
  }
  function basicSelfClosing(code2) {
    if (code2 === 62) {
      effects.consume(code2);
      return self.interrupt ? ok3 : continuation;
    }
    return nok(code2);
  }
  function completeClosingTagAfter(code2) {
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return completeClosingTagAfter;
    }
    return completeEnd(code2);
  }
  function completeAttributeNameBefore(code2) {
    if (code2 === 47) {
      effects.consume(code2);
      return completeEnd;
    }
    if (code2 === 58 || code2 === 95 || asciiAlpha(code2)) {
      effects.consume(code2);
      return completeAttributeName;
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return completeAttributeNameBefore;
    }
    return completeEnd(code2);
  }
  function completeAttributeName(code2) {
    if (code2 === 45 || code2 === 46 || code2 === 58 || code2 === 95 || asciiAlphanumeric(code2)) {
      effects.consume(code2);
      return completeAttributeName;
    }
    return completeAttributeNameAfter(code2);
  }
  function completeAttributeNameAfter(code2) {
    if (code2 === 61) {
      effects.consume(code2);
      return completeAttributeValueBefore;
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return completeAttributeNameAfter;
    }
    return completeAttributeNameBefore(code2);
  }
  function completeAttributeValueBefore(code2) {
    if (code2 === null || code2 === 60 || code2 === 61 || code2 === 62 || code2 === 96) {
      return nok(code2);
    }
    if (code2 === 34 || code2 === 39) {
      effects.consume(code2);
      markerB = code2;
      return completeAttributeValueQuoted;
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return completeAttributeValueBefore;
    }
    return completeAttributeValueUnquoted(code2);
  }
  function completeAttributeValueQuoted(code2) {
    if (code2 === markerB) {
      effects.consume(code2);
      markerB = null;
      return completeAttributeValueQuotedAfter;
    }
    if (code2 === null || markdownLineEnding(code2)) {
      return nok(code2);
    }
    effects.consume(code2);
    return completeAttributeValueQuoted;
  }
  function completeAttributeValueUnquoted(code2) {
    if (code2 === null || code2 === 34 || code2 === 39 || code2 === 47 || code2 === 60 || code2 === 61 || code2 === 62 || code2 === 96 || markdownLineEndingOrSpace(code2)) {
      return completeAttributeNameAfter(code2);
    }
    effects.consume(code2);
    return completeAttributeValueUnquoted;
  }
  function completeAttributeValueQuotedAfter(code2) {
    if (code2 === 47 || code2 === 62 || markdownSpace(code2)) {
      return completeAttributeNameBefore(code2);
    }
    return nok(code2);
  }
  function completeEnd(code2) {
    if (code2 === 62) {
      effects.consume(code2);
      return completeAfter;
    }
    return nok(code2);
  }
  function completeAfter(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      return continuation(code2);
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return completeAfter;
    }
    return nok(code2);
  }
  function continuation(code2) {
    if (code2 === 45 && marker === 2) {
      effects.consume(code2);
      return continuationCommentInside;
    }
    if (code2 === 60 && marker === 1) {
      effects.consume(code2);
      return continuationRawTagOpen;
    }
    if (code2 === 62 && marker === 4) {
      effects.consume(code2);
      return continuationClose;
    }
    if (code2 === 63 && marker === 3) {
      effects.consume(code2);
      return continuationDeclarationInside;
    }
    if (code2 === 93 && marker === 5) {
      effects.consume(code2);
      return continuationCdataInside;
    }
    if (markdownLineEnding(code2) && (marker === 6 || marker === 7)) {
      effects.exit("htmlFlowData");
      return effects.check(blankLineBefore, continuationAfter, continuationStart)(code2);
    }
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("htmlFlowData");
      return continuationStart(code2);
    }
    effects.consume(code2);
    return continuation;
  }
  function continuationStart(code2) {
    return effects.check(nonLazyContinuation, continuationStartNonLazy, continuationAfter)(code2);
  }
  function continuationStartNonLazy(code2) {
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return continuationBefore;
  }
  function continuationBefore(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      return continuationStart(code2);
    }
    effects.enter("htmlFlowData");
    return continuation(code2);
  }
  function continuationCommentInside(code2) {
    if (code2 === 45) {
      effects.consume(code2);
      return continuationDeclarationInside;
    }
    return continuation(code2);
  }
  function continuationRawTagOpen(code2) {
    if (code2 === 47) {
      effects.consume(code2);
      buffer = "";
      return continuationRawEndTag;
    }
    return continuation(code2);
  }
  function continuationRawEndTag(code2) {
    if (code2 === 62) {
      const name = buffer.toLowerCase();
      if (htmlRawNames.includes(name)) {
        effects.consume(code2);
        return continuationClose;
      }
      return continuation(code2);
    }
    if (asciiAlpha(code2) && buffer.length < 8) {
      effects.consume(code2);
      buffer += String.fromCharCode(code2);
      return continuationRawEndTag;
    }
    return continuation(code2);
  }
  function continuationCdataInside(code2) {
    if (code2 === 93) {
      effects.consume(code2);
      return continuationDeclarationInside;
    }
    return continuation(code2);
  }
  function continuationDeclarationInside(code2) {
    if (code2 === 62) {
      effects.consume(code2);
      return continuationClose;
    }
    if (code2 === 45 && marker === 2) {
      effects.consume(code2);
      return continuationDeclarationInside;
    }
    return continuation(code2);
  }
  function continuationClose(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("htmlFlowData");
      return continuationAfter(code2);
    }
    effects.consume(code2);
    return continuationClose;
  }
  function continuationAfter(code2) {
    effects.exit("htmlFlow");
    return ok3(code2);
  }
}
function tokenizeBlankLineBefore(effects, ok3, nok) {
  return start;
  function start(code2) {
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return effects.attempt(blankLine, ok3, nok);
  }
}

// node_modules/micromark-core-commonmark/lib/html-text.js
var htmlText = {
  name: "htmlText",
  tokenize: tokenizeHtmlText
};
function tokenizeHtmlText(effects, ok3, nok) {
  const self = this;
  let marker;
  let index2;
  let returnState;
  return start;
  function start(code2) {
    effects.enter("htmlText");
    effects.enter("htmlTextData");
    effects.consume(code2);
    return open;
  }
  function open(code2) {
    if (code2 === 33) {
      effects.consume(code2);
      return declarationOpen;
    }
    if (code2 === 47) {
      effects.consume(code2);
      return tagCloseStart;
    }
    if (code2 === 63) {
      effects.consume(code2);
      return instruction;
    }
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      return tagOpen;
    }
    return nok(code2);
  }
  function declarationOpen(code2) {
    if (code2 === 45) {
      effects.consume(code2);
      return commentOpenInside;
    }
    if (code2 === 91) {
      effects.consume(code2);
      index2 = 0;
      return cdataOpenInside;
    }
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      return declaration;
    }
    return nok(code2);
  }
  function commentOpenInside(code2) {
    if (code2 === 45) {
      effects.consume(code2);
      return commentEnd;
    }
    return nok(code2);
  }
  function comment(code2) {
    if (code2 === null) {
      return nok(code2);
    }
    if (code2 === 45) {
      effects.consume(code2);
      return commentClose;
    }
    if (markdownLineEnding(code2)) {
      returnState = comment;
      return lineEndingBefore(code2);
    }
    effects.consume(code2);
    return comment;
  }
  function commentClose(code2) {
    if (code2 === 45) {
      effects.consume(code2);
      return commentEnd;
    }
    return comment(code2);
  }
  function commentEnd(code2) {
    return code2 === 62 ? end(code2) : code2 === 45 ? commentClose(code2) : comment(code2);
  }
  function cdataOpenInside(code2) {
    const value2 = "CDATA[";
    if (code2 === value2.charCodeAt(index2++)) {
      effects.consume(code2);
      return index2 === value2.length ? cdata : cdataOpenInside;
    }
    return nok(code2);
  }
  function cdata(code2) {
    if (code2 === null) {
      return nok(code2);
    }
    if (code2 === 93) {
      effects.consume(code2);
      return cdataClose;
    }
    if (markdownLineEnding(code2)) {
      returnState = cdata;
      return lineEndingBefore(code2);
    }
    effects.consume(code2);
    return cdata;
  }
  function cdataClose(code2) {
    if (code2 === 93) {
      effects.consume(code2);
      return cdataEnd;
    }
    return cdata(code2);
  }
  function cdataEnd(code2) {
    if (code2 === 62) {
      return end(code2);
    }
    if (code2 === 93) {
      effects.consume(code2);
      return cdataEnd;
    }
    return cdata(code2);
  }
  function declaration(code2) {
    if (code2 === null || code2 === 62) {
      return end(code2);
    }
    if (markdownLineEnding(code2)) {
      returnState = declaration;
      return lineEndingBefore(code2);
    }
    effects.consume(code2);
    return declaration;
  }
  function instruction(code2) {
    if (code2 === null) {
      return nok(code2);
    }
    if (code2 === 63) {
      effects.consume(code2);
      return instructionClose;
    }
    if (markdownLineEnding(code2)) {
      returnState = instruction;
      return lineEndingBefore(code2);
    }
    effects.consume(code2);
    return instruction;
  }
  function instructionClose(code2) {
    return code2 === 62 ? end(code2) : instruction(code2);
  }
  function tagCloseStart(code2) {
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      return tagClose;
    }
    return nok(code2);
  }
  function tagClose(code2) {
    if (code2 === 45 || asciiAlphanumeric(code2)) {
      effects.consume(code2);
      return tagClose;
    }
    return tagCloseBetween(code2);
  }
  function tagCloseBetween(code2) {
    if (markdownLineEnding(code2)) {
      returnState = tagCloseBetween;
      return lineEndingBefore(code2);
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return tagCloseBetween;
    }
    return end(code2);
  }
  function tagOpen(code2) {
    if (code2 === 45 || asciiAlphanumeric(code2)) {
      effects.consume(code2);
      return tagOpen;
    }
    if (code2 === 47 || code2 === 62 || markdownLineEndingOrSpace(code2)) {
      return tagOpenBetween(code2);
    }
    return nok(code2);
  }
  function tagOpenBetween(code2) {
    if (code2 === 47) {
      effects.consume(code2);
      return end;
    }
    if (code2 === 58 || code2 === 95 || asciiAlpha(code2)) {
      effects.consume(code2);
      return tagOpenAttributeName;
    }
    if (markdownLineEnding(code2)) {
      returnState = tagOpenBetween;
      return lineEndingBefore(code2);
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return tagOpenBetween;
    }
    return end(code2);
  }
  function tagOpenAttributeName(code2) {
    if (code2 === 45 || code2 === 46 || code2 === 58 || code2 === 95 || asciiAlphanumeric(code2)) {
      effects.consume(code2);
      return tagOpenAttributeName;
    }
    return tagOpenAttributeNameAfter(code2);
  }
  function tagOpenAttributeNameAfter(code2) {
    if (code2 === 61) {
      effects.consume(code2);
      return tagOpenAttributeValueBefore;
    }
    if (markdownLineEnding(code2)) {
      returnState = tagOpenAttributeNameAfter;
      return lineEndingBefore(code2);
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return tagOpenAttributeNameAfter;
    }
    return tagOpenBetween(code2);
  }
  function tagOpenAttributeValueBefore(code2) {
    if (code2 === null || code2 === 60 || code2 === 61 || code2 === 62 || code2 === 96) {
      return nok(code2);
    }
    if (code2 === 34 || code2 === 39) {
      effects.consume(code2);
      marker = code2;
      return tagOpenAttributeValueQuoted;
    }
    if (markdownLineEnding(code2)) {
      returnState = tagOpenAttributeValueBefore;
      return lineEndingBefore(code2);
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return tagOpenAttributeValueBefore;
    }
    effects.consume(code2);
    return tagOpenAttributeValueUnquoted;
  }
  function tagOpenAttributeValueQuoted(code2) {
    if (code2 === marker) {
      effects.consume(code2);
      marker = void 0;
      return tagOpenAttributeValueQuotedAfter;
    }
    if (code2 === null) {
      return nok(code2);
    }
    if (markdownLineEnding(code2)) {
      returnState = tagOpenAttributeValueQuoted;
      return lineEndingBefore(code2);
    }
    effects.consume(code2);
    return tagOpenAttributeValueQuoted;
  }
  function tagOpenAttributeValueUnquoted(code2) {
    if (code2 === null || code2 === 34 || code2 === 39 || code2 === 60 || code2 === 61 || code2 === 96) {
      return nok(code2);
    }
    if (code2 === 47 || code2 === 62 || markdownLineEndingOrSpace(code2)) {
      return tagOpenBetween(code2);
    }
    effects.consume(code2);
    return tagOpenAttributeValueUnquoted;
  }
  function tagOpenAttributeValueQuotedAfter(code2) {
    if (code2 === 47 || code2 === 62 || markdownLineEndingOrSpace(code2)) {
      return tagOpenBetween(code2);
    }
    return nok(code2);
  }
  function end(code2) {
    if (code2 === 62) {
      effects.consume(code2);
      effects.exit("htmlTextData");
      effects.exit("htmlText");
      return ok3;
    }
    return nok(code2);
  }
  function lineEndingBefore(code2) {
    effects.exit("htmlTextData");
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return lineEndingAfter;
  }
  function lineEndingAfter(code2) {
    return markdownSpace(code2) ? factorySpace(effects, lineEndingAfterPrefix, "linePrefix", self.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(code2) : lineEndingAfterPrefix(code2);
  }
  function lineEndingAfterPrefix(code2) {
    effects.enter("htmlTextData");
    return returnState(code2);
  }
}

// node_modules/micromark-core-commonmark/lib/label-end.js
var labelEnd = {
  name: "labelEnd",
  resolveAll: resolveAllLabelEnd,
  resolveTo: resolveToLabelEnd,
  tokenize: tokenizeLabelEnd
};
var resourceConstruct = {
  tokenize: tokenizeResource
};
var referenceFullConstruct = {
  tokenize: tokenizeReferenceFull
};
var referenceCollapsedConstruct = {
  tokenize: tokenizeReferenceCollapsed
};
function resolveAllLabelEnd(events) {
  let index2 = -1;
  const newEvents = [];
  while (++index2 < events.length) {
    const token = events[index2][1];
    newEvents.push(events[index2]);
    if (token.type === "labelImage" || token.type === "labelLink" || token.type === "labelEnd") {
      const offset = token.type === "labelImage" ? 4 : 2;
      token.type = "data";
      index2 += offset;
    }
  }
  if (events.length !== newEvents.length) {
    splice(events, 0, events.length, newEvents);
  }
  return events;
}
function resolveToLabelEnd(events, context) {
  let index2 = events.length;
  let offset = 0;
  let open;
  let close2;
  let media;
  while (index2--) {
    const token = events[index2][1];
    if (open) {
      if (token.type === "link" || token.type === "labelLink" && token._inactive) {
        break;
      }
      if (events[index2][0] === "enter" && token.type === "labelLink") {
        token._inactive = true;
      }
    } else if (close2) {
      if (events[index2][0] === "enter" && (token.type === "labelImage" || token.type === "labelLink") && !token._balanced) {
        open = index2;
        if (token.type !== "labelLink") {
          offset = 2;
          break;
        }
      }
    } else if (token.type === "labelEnd") {
      close2 = index2;
    }
  }
  const group = {
    type: events[open][1].type === "labelLink" ? "link" : "image",
    start: {
      ...events[open][1].start
    },
    end: {
      ...events[events.length - 1][1].end
    }
  };
  const label = {
    type: "label",
    start: {
      ...events[open][1].start
    },
    end: {
      ...events[close2][1].end
    }
  };
  const text4 = {
    type: "labelText",
    start: {
      ...events[open + offset + 2][1].end
    },
    end: {
      ...events[close2 - 2][1].start
    }
  };
  media = [["enter", group, context], ["enter", label, context]];
  media = push(media, events.slice(open + 1, open + offset + 3));
  media = push(media, [["enter", text4, context]]);
  media = push(media, resolveAll(context.parser.constructs.insideSpan.null, events.slice(open + offset + 4, close2 - 3), context));
  media = push(media, [["exit", text4, context], events[close2 - 2], events[close2 - 1], ["exit", label, context]]);
  media = push(media, events.slice(close2 + 1));
  media = push(media, [["exit", group, context]]);
  splice(events, open, events.length, media);
  return events;
}
function tokenizeLabelEnd(effects, ok3, nok) {
  const self = this;
  const labelStarts = self._labelStarts;
  let labelStart;
  let defined;
  if (labelStarts) {
    while (labelStarts.length > 0 && labelStarts[labelStarts.length - 1]._balanced) {
      labelStarts.pop();
    }
    labelStart = labelStarts[labelStarts.length - 1];
  }
  return start;
  function start(code2) {
    if (!labelStart) {
      return nok(code2);
    }
    if (labelStart._inactive) {
      return labelEndNok(code2);
    }
    defined = self.parser.defined.includes(normalizeIdentifier(self.sliceSerialize({
      start: labelStart.end,
      end: self.now()
    })));
    effects.enter("labelEnd");
    effects.enter("labelMarker");
    effects.consume(code2);
    effects.exit("labelMarker");
    effects.exit("labelEnd");
    return after;
  }
  function after(code2) {
    if (code2 === 40) {
      return effects.attempt(resourceConstruct, labelEndOk, defined ? labelEndOk : labelEndNok)(code2);
    }
    if (code2 === 91) {
      return effects.attempt(referenceFullConstruct, labelEndOk, defined ? referenceNotFull : labelEndNok)(code2);
    }
    return defined ? labelEndOk(code2) : labelEndNok(code2);
  }
  function referenceNotFull(code2) {
    return effects.attempt(referenceCollapsedConstruct, labelEndOk, labelEndNok)(code2);
  }
  function labelEndOk(code2) {
    labelStarts.pop();
    return ok3(code2);
  }
  function labelEndNok(code2) {
    labelStart._balanced = true;
    return nok(code2);
  }
}
function tokenizeResource(effects, ok3, nok) {
  return resourceStart;
  function resourceStart(code2) {
    effects.enter("resource");
    effects.enter("resourceMarker");
    effects.consume(code2);
    effects.exit("resourceMarker");
    return resourceBefore;
  }
  function resourceBefore(code2) {
    return markdownLineEndingOrSpace(code2) ? factoryWhitespace(effects, resourceOpen)(code2) : resourceOpen(code2);
  }
  function resourceOpen(code2) {
    if (code2 === 41) {
      return resourceEnd(code2);
    }
    return factoryDestination(effects, resourceDestinationAfter, resourceDestinationMissing, "resourceDestination", "resourceDestinationLiteral", "resourceDestinationLiteralMarker", "resourceDestinationRaw", "resourceDestinationString", 32)(code2);
  }
  function resourceDestinationAfter(code2) {
    return markdownLineEndingOrSpace(code2) ? factoryWhitespace(effects, resourceBetween)(code2) : resourceEnd(code2);
  }
  function resourceDestinationMissing(code2) {
    return nok(code2);
  }
  function resourceBetween(code2) {
    if (code2 === 34 || code2 === 39 || code2 === 40) {
      return factoryTitle(effects, resourceTitleAfter, nok, "resourceTitle", "resourceTitleMarker", "resourceTitleString")(code2);
    }
    return resourceEnd(code2);
  }
  function resourceTitleAfter(code2) {
    return markdownLineEndingOrSpace(code2) ? factoryWhitespace(effects, resourceEnd)(code2) : resourceEnd(code2);
  }
  function resourceEnd(code2) {
    if (code2 === 41) {
      effects.enter("resourceMarker");
      effects.consume(code2);
      effects.exit("resourceMarker");
      effects.exit("resource");
      return ok3;
    }
    return nok(code2);
  }
}
function tokenizeReferenceFull(effects, ok3, nok) {
  const self = this;
  return referenceFull;
  function referenceFull(code2) {
    return factoryLabel.call(self, effects, referenceFullAfter, referenceFullMissing, "reference", "referenceMarker", "referenceString")(code2);
  }
  function referenceFullAfter(code2) {
    return self.parser.defined.includes(normalizeIdentifier(self.sliceSerialize(self.events[self.events.length - 1][1]).slice(1, -1))) ? ok3(code2) : nok(code2);
  }
  function referenceFullMissing(code2) {
    return nok(code2);
  }
}
function tokenizeReferenceCollapsed(effects, ok3, nok) {
  return referenceCollapsedStart;
  function referenceCollapsedStart(code2) {
    effects.enter("reference");
    effects.enter("referenceMarker");
    effects.consume(code2);
    effects.exit("referenceMarker");
    return referenceCollapsedOpen;
  }
  function referenceCollapsedOpen(code2) {
    if (code2 === 93) {
      effects.enter("referenceMarker");
      effects.consume(code2);
      effects.exit("referenceMarker");
      effects.exit("reference");
      return ok3;
    }
    return nok(code2);
  }
}

// node_modules/micromark-core-commonmark/lib/label-start-image.js
var labelStartImage = {
  name: "labelStartImage",
  resolveAll: labelEnd.resolveAll,
  tokenize: tokenizeLabelStartImage
};
function tokenizeLabelStartImage(effects, ok3, nok) {
  const self = this;
  let labelImage;
  return start;
  function start(code2) {
    effects.enter("labelImage");
    effects.enter("labelImageMarker");
    effects.consume(code2);
    effects.exit("labelImageMarker");
    return open;
  }
  function open(code2) {
    if (code2 === 91) {
      effects.enter("labelMarker");
      effects.consume(code2);
      effects.exit("labelMarker");
      labelImage = effects.exit("labelImage");
      return after;
    }
    return nok(code2);
  }
  function after(code2) {
    if (code2 === 94 && "_hiddenFootnoteSupport" in self.parser.constructs) {
      return nok(code2);
    }
    self._labelStarts = self._labelStarts || [];
    self._labelStarts.push(labelImage);
    return ok3(code2);
  }
}

// node_modules/micromark-core-commonmark/lib/label-start-link.js
var labelStartLink = {
  name: "labelStartLink",
  resolveAll: labelEnd.resolveAll,
  tokenize: tokenizeLabelStartLink
};
function tokenizeLabelStartLink(effects, ok3, nok) {
  const self = this;
  let labelLink;
  return start;
  function start(code2) {
    effects.enter("labelLink");
    effects.enter("labelMarker");
    effects.consume(code2);
    effects.exit("labelMarker");
    labelLink = effects.exit("labelLink");
    return after;
  }
  function after(code2) {
    if (code2 === 94 && "_hiddenFootnoteSupport" in self.parser.constructs) {
      return nok(code2);
    }
    self._labelStarts = self._labelStarts || [];
    self._labelStarts.push(labelLink);
    return ok3(code2);
  }
}

// node_modules/micromark-core-commonmark/lib/line-ending.js
var lineEnding = {
  name: "lineEnding",
  tokenize: tokenizeLineEnding
};
function tokenizeLineEnding(effects, ok3) {
  return start;
  function start(code2) {
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return factorySpace(effects, ok3, "linePrefix");
  }
}

// node_modules/micromark-core-commonmark/lib/thematic-break.js
var thematicBreak = {
  name: "thematicBreak",
  tokenize: tokenizeThematicBreak
};
function tokenizeThematicBreak(effects, ok3, nok) {
  let size = 0;
  let marker;
  return start;
  function start(code2) {
    effects.enter("thematicBreak");
    return before(code2);
  }
  function before(code2) {
    marker = code2;
    return atBreak(code2);
  }
  function atBreak(code2) {
    if (code2 === marker) {
      effects.enter("thematicBreakSequence");
      return sequence(code2);
    }
    if (size >= 3 && (code2 === null || markdownLineEnding(code2))) {
      effects.exit("thematicBreak");
      return ok3(code2);
    }
    return nok(code2);
  }
  function sequence(code2) {
    if (code2 === marker) {
      effects.consume(code2);
      size++;
      return sequence;
    }
    effects.exit("thematicBreakSequence");
    return markdownSpace(code2) ? factorySpace(effects, atBreak, "whitespace")(code2) : atBreak(code2);
  }
}

// node_modules/micromark-core-commonmark/lib/list.js
var list = {
  continuation: {
    tokenize: tokenizeListContinuation
  },
  exit: tokenizeListEnd,
  name: "list",
  tokenize: tokenizeListStart
};
var listItemPrefixWhitespaceConstruct = {
  partial: true,
  tokenize: tokenizeListItemPrefixWhitespace
};
var indentConstruct = {
  partial: true,
  tokenize: tokenizeIndent
};
function tokenizeListStart(effects, ok3, nok) {
  const self = this;
  const tail = self.events[self.events.length - 1];
  let initialSize = tail && tail[1].type === "linePrefix" ? tail[2].sliceSerialize(tail[1], true).length : 0;
  let size = 0;
  return start;
  function start(code2) {
    const kind = self.containerState.type || (code2 === 42 || code2 === 43 || code2 === 45 ? "listUnordered" : "listOrdered");
    if (kind === "listUnordered" ? !self.containerState.marker || code2 === self.containerState.marker : asciiDigit(code2)) {
      if (!self.containerState.type) {
        self.containerState.type = kind;
        effects.enter(kind, {
          _container: true
        });
      }
      if (kind === "listUnordered") {
        effects.enter("listItemPrefix");
        return code2 === 42 || code2 === 45 ? effects.check(thematicBreak, nok, atMarker)(code2) : atMarker(code2);
      }
      if (!self.interrupt || code2 === 49) {
        effects.enter("listItemPrefix");
        effects.enter("listItemValue");
        return inside(code2);
      }
    }
    return nok(code2);
  }
  function inside(code2) {
    if (asciiDigit(code2) && ++size < 10) {
      effects.consume(code2);
      return inside;
    }
    if ((!self.interrupt || size < 2) && (self.containerState.marker ? code2 === self.containerState.marker : code2 === 41 || code2 === 46)) {
      effects.exit("listItemValue");
      return atMarker(code2);
    }
    return nok(code2);
  }
  function atMarker(code2) {
    effects.enter("listItemMarker");
    effects.consume(code2);
    effects.exit("listItemMarker");
    self.containerState.marker = self.containerState.marker || code2;
    return effects.check(
      blankLine,
      // Can’t be empty when interrupting.
      self.interrupt ? nok : onBlank,
      effects.attempt(listItemPrefixWhitespaceConstruct, endOfPrefix, otherPrefix)
    );
  }
  function onBlank(code2) {
    self.containerState.initialBlankLine = true;
    initialSize++;
    return endOfPrefix(code2);
  }
  function otherPrefix(code2) {
    if (markdownSpace(code2)) {
      effects.enter("listItemPrefixWhitespace");
      effects.consume(code2);
      effects.exit("listItemPrefixWhitespace");
      return endOfPrefix;
    }
    return nok(code2);
  }
  function endOfPrefix(code2) {
    self.containerState.size = initialSize + self.sliceSerialize(effects.exit("listItemPrefix"), true).length;
    return ok3(code2);
  }
}
function tokenizeListContinuation(effects, ok3, nok) {
  const self = this;
  self.containerState._closeFlow = void 0;
  return effects.check(blankLine, onBlank, notBlank);
  function onBlank(code2) {
    self.containerState.furtherBlankLines = self.containerState.furtherBlankLines || self.containerState.initialBlankLine;
    return factorySpace(effects, ok3, "listItemIndent", self.containerState.size + 1)(code2);
  }
  function notBlank(code2) {
    if (self.containerState.furtherBlankLines || !markdownSpace(code2)) {
      self.containerState.furtherBlankLines = void 0;
      self.containerState.initialBlankLine = void 0;
      return notInCurrentItem(code2);
    }
    self.containerState.furtherBlankLines = void 0;
    self.containerState.initialBlankLine = void 0;
    return effects.attempt(indentConstruct, ok3, notInCurrentItem)(code2);
  }
  function notInCurrentItem(code2) {
    self.containerState._closeFlow = true;
    self.interrupt = void 0;
    return factorySpace(effects, effects.attempt(list, ok3, nok), "linePrefix", self.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(code2);
  }
}
function tokenizeIndent(effects, ok3, nok) {
  const self = this;
  return factorySpace(effects, afterPrefix, "listItemIndent", self.containerState.size + 1);
  function afterPrefix(code2) {
    const tail = self.events[self.events.length - 1];
    return tail && tail[1].type === "listItemIndent" && tail[2].sliceSerialize(tail[1], true).length === self.containerState.size ? ok3(code2) : nok(code2);
  }
}
function tokenizeListEnd(effects) {
  effects.exit(this.containerState.type);
}
function tokenizeListItemPrefixWhitespace(effects, ok3, nok) {
  const self = this;
  return factorySpace(effects, afterPrefix, "listItemPrefixWhitespace", self.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4 + 1);
  function afterPrefix(code2) {
    const tail = self.events[self.events.length - 1];
    return !markdownSpace(code2) && tail && tail[1].type === "listItemPrefixWhitespace" ? ok3(code2) : nok(code2);
  }
}

// node_modules/micromark-core-commonmark/lib/setext-underline.js
var setextUnderline = {
  name: "setextUnderline",
  resolveTo: resolveToSetextUnderline,
  tokenize: tokenizeSetextUnderline
};
function resolveToSetextUnderline(events, context) {
  const editMap = new EditMap();
  let index2 = events.length;
  let content3;
  let text4;
  let definition2;
  while (index2--) {
    if (events[index2][0] === "enter") {
      if (events[index2][1].type === "content") {
        content3 = index2;
        break;
      }
      if (events[index2][1].type === "paragraph") {
        text4 = index2;
      }
    } else {
      if (events[index2][1].type === "content") {
        editMap.add(index2, 1, []);
      }
      if (!definition2 && events[index2][1].type === "definition") {
        definition2 = index2;
      }
    }
  }
  const heading = {
    type: "setextHeading",
    start: {
      ...events[content3][1].start
    },
    end: {
      ...events[events.length - 1][1].end
    }
  };
  events[text4][1].type = "setextHeadingText";
  if (definition2) {
    editMap.add(text4, 0, [["enter", heading, context]]);
    editMap.add(definition2 + 1, 0, [["exit", events[content3][1], context]]);
    events[content3][1].end = {
      ...events[definition2][1].end
    };
  } else {
    events[content3][1] = heading;
  }
  editMap.add(events.length, 0, [["exit", heading, context]]);
  editMap.consume(events);
  return events;
}
function tokenizeSetextUnderline(effects, ok3, nok) {
  const self = this;
  let marker;
  return start;
  function start(code2) {
    let index2 = self.events.length;
    let paragraph;
    while (index2--) {
      if (self.events[index2][1].type !== "lineEnding" && self.events[index2][1].type !== "linePrefix" && self.events[index2][1].type !== "content") {
        paragraph = self.events[index2][1].type === "paragraph";
        break;
      }
    }
    if (!self.parser.lazy[self.now().line] && (self.interrupt || paragraph)) {
      effects.enter("setextHeadingLine");
      marker = code2;
      return before(code2);
    }
    return nok(code2);
  }
  function before(code2) {
    effects.enter("setextHeadingLineSequence");
    return inside(code2);
  }
  function inside(code2) {
    if (code2 === marker) {
      effects.consume(code2);
      return inside;
    }
    effects.exit("setextHeadingLineSequence");
    return markdownSpace(code2) ? factorySpace(effects, after, "lineSuffix")(code2) : after(code2);
  }
  function after(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("setextHeadingLine");
      return ok3(code2);
    }
    return nok(code2);
  }
}

// node_modules/micromark/lib/initialize/flow.js
var flow = {
  tokenize: initializeFlow
};
function initializeFlow(effects) {
  const self = this;
  const initial = effects.attempt(
    // Try to parse a blank line.
    blankLine,
    atBlankEnding,
    // Try to parse initial flow (essentially, only code).
    effects.attempt(this.parser.constructs.flowInitial, afterConstruct, factorySpace(effects, effects.attempt(this.parser.constructs.flow, afterConstruct, effects.attempt(content2, afterConstruct)), "linePrefix"))
  );
  return initial;
  function atBlankEnding(code2) {
    if (code2 === null) {
      effects.consume(code2);
      return;
    }
    effects.enter("lineEndingBlank");
    effects.consume(code2);
    effects.exit("lineEndingBlank");
    self.currentConstruct = void 0;
    return initial;
  }
  function afterConstruct(code2) {
    if (code2 === null) {
      effects.consume(code2);
      return;
    }
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    self.currentConstruct = void 0;
    return initial;
  }
}

// node_modules/micromark/lib/initialize/text.js
var resolver = {
  resolveAll: createResolver()
};
var string = initializeFactory("string");
var text = initializeFactory("text");
function initializeFactory(field) {
  return {
    resolveAll: createResolver(field === "text" ? resolveAllLineSuffixes : void 0),
    tokenize: initializeText
  };
  function initializeText(effects) {
    const self = this;
    const constructs2 = this.parser.constructs[field];
    const text4 = effects.attempt(constructs2, start, notText);
    return start;
    function start(code2) {
      return atBreak(code2) ? text4(code2) : notText(code2);
    }
    function notText(code2) {
      if (code2 === null) {
        effects.consume(code2);
        return;
      }
      effects.enter("data");
      effects.consume(code2);
      return data;
    }
    function data(code2) {
      if (atBreak(code2)) {
        effects.exit("data");
        return text4(code2);
      }
      effects.consume(code2);
      return data;
    }
    function atBreak(code2) {
      if (code2 === null) {
        return true;
      }
      const list2 = constructs2[code2];
      let index2 = -1;
      if (list2) {
        while (++index2 < list2.length) {
          const item2 = list2[index2];
          if (!item2.previous || item2.previous.call(self, self.previous)) {
            return true;
          }
        }
      }
      return false;
    }
  }
}
function createResolver(extraResolver) {
  return resolveAllText;
  function resolveAllText(events, context) {
    let index2 = -1;
    let enter;
    while (++index2 <= events.length) {
      if (enter === void 0) {
        if (events[index2] && events[index2][1].type === "data") {
          enter = index2;
          index2++;
        }
      } else if (!events[index2] || events[index2][1].type !== "data") {
        if (index2 !== enter + 2) {
          events[enter][1].end = events[index2 - 1][1].end;
          events.splice(enter + 2, index2 - enter - 2);
          index2 = enter + 2;
        }
        enter = void 0;
      }
    }
    return extraResolver ? extraResolver(events, context) : events;
  }
}
function resolveAllLineSuffixes(events, context) {
  const editMap = new EditMap();
  let eventIndex = 0;
  while (++eventIndex <= events.length) {
    if ((eventIndex === events.length || events[eventIndex][1].type === "lineEnding") && events[eventIndex - 1][1].type === "data") {
      const data = events[eventIndex - 1][1];
      const chunks = context.sliceStream(data);
      let index2 = chunks.length;
      let bufferIndex = -1;
      let size = 0;
      let tabs;
      while (index2--) {
        const chunk = chunks[index2];
        if (typeof chunk === "string") {
          bufferIndex = chunk.length;
          while (chunk.charCodeAt(bufferIndex - 1) === 32) {
            size++;
            bufferIndex--;
          }
          if (bufferIndex) {
            break;
          }
          bufferIndex = -1;
        } else if (chunk === -2) {
          tabs = true;
          size++;
        } else if (chunk === -1) {
        } else {
          index2++;
          break;
        }
      }
      if (context._contentTypeTextTrailing && eventIndex === events.length) {
        size = 0;
      }
      if (size) {
        const token = {
          type: eventIndex === events.length || tabs || size < 2 ? "lineSuffix" : "hardBreakTrailing",
          start: {
            _bufferIndex: index2 ? bufferIndex : data.start._bufferIndex + bufferIndex,
            _index: data.start._index + index2,
            line: data.end.line,
            column: data.end.column - size,
            offset: data.end.offset - size
          },
          end: {
            ...data.end
          }
        };
        data.end = {
          ...token.start
        };
        if (data.start.offset === data.end.offset) {
          Object.assign(data, token);
        } else {
          editMap.add(eventIndex, 0, [["enter", token, context], ["exit", token, context]]);
        }
      }
      eventIndex++;
    }
  }
  editMap.consume(events);
  return events;
}

// node_modules/micromark/lib/constructs.js
var constructs_exports = {};
__export(constructs_exports, {
  attentionMarkers: () => attentionMarkers,
  contentInitial: () => contentInitial,
  disable: () => disable,
  document: () => document2,
  flow: () => flow2,
  flowInitial: () => flowInitial,
  insideSpan: () => insideSpan,
  string: () => string2,
  text: () => text2
});
var document2 = {
  [42]: list,
  [43]: list,
  [45]: list,
  [48]: list,
  [49]: list,
  [50]: list,
  [51]: list,
  [52]: list,
  [53]: list,
  [54]: list,
  [55]: list,
  [56]: list,
  [57]: list,
  [62]: blockQuote
};
var contentInitial = {
  [91]: definition
};
var flowInitial = {
  [-2]: codeIndented,
  [-1]: codeIndented,
  [32]: codeIndented
};
var flow2 = {
  [35]: headingAtx,
  [42]: thematicBreak,
  [45]: [setextUnderline, thematicBreak],
  [60]: htmlFlow,
  [61]: setextUnderline,
  [95]: thematicBreak,
  [96]: codeFenced,
  [126]: codeFenced
};
var string2 = {
  [38]: characterReference,
  [92]: characterEscape
};
var text2 = {
  [-5]: lineEnding,
  [-4]: lineEnding,
  [-3]: lineEnding,
  [33]: labelStartImage,
  [38]: characterReference,
  [42]: attention,
  [60]: [autolink, htmlText],
  [91]: labelStartLink,
  [92]: [hardBreakEscape, characterEscape],
  [93]: labelEnd,
  [95]: attention,
  [96]: codeText
};
var insideSpan = {
  null: [attention, resolver]
};
var attentionMarkers = {
  null: [42, 95]
};
var disable = {
  null: []
};

// node_modules/micromark/lib/create-tokenizer.js
function createTokenizer(parser, initialize, from) {
  let point3 = {
    _bufferIndex: -1,
    _index: 0,
    line: from && from.line || 1,
    column: from && from.column || 1,
    offset: from && from.offset || 0
  };
  const columnStart = {};
  const resolveAllConstructs = [];
  let chunks = [];
  let stack = [];
  let consumed = true;
  const effects = {
    attempt: constructFactory(onsuccessfulconstruct),
    check: constructFactory(onsuccessfulcheck),
    consume,
    enter,
    exit: exit3,
    interrupt: constructFactory(onsuccessfulcheck, {
      interrupt: true
    })
  };
  const context = {
    code: null,
    containerState: {},
    defineSkip,
    events: [],
    now,
    parser,
    previous: null,
    sliceSerialize,
    sliceStream,
    write
  };
  let state = initialize.tokenize.call(context, effects);
  let expectedCode;
  if (initialize.resolveAll) {
    resolveAllConstructs.push(initialize);
  }
  return context;
  function write(slice) {
    chunks = push(chunks, slice);
    main2();
    if (chunks[chunks.length - 1] !== null) {
      return [];
    }
    addResult(initialize, 0);
    context.events = resolveAll(resolveAllConstructs, context.events, context);
    return context.events;
  }
  function sliceSerialize(token, expandTabs) {
    return serializeChunks(sliceStream(token), expandTabs);
  }
  function sliceStream(token) {
    return sliceChunks(chunks, token);
  }
  function now() {
    const {
      _bufferIndex,
      _index,
      line,
      column,
      offset
    } = point3;
    return {
      _bufferIndex,
      _index,
      line,
      column,
      offset
    };
  }
  function defineSkip(value2) {
    columnStart[value2.line] = value2.column;
    accountForPotentialSkip();
  }
  function main2() {
    while (point3._index < chunks.length) {
      const chunk = chunks[point3._index];
      if (typeof chunk === "string") {
        const chunkIndex = point3._index;
        if (point3._bufferIndex < 0) {
          point3._bufferIndex = 0;
        }
        while (point3._index === chunkIndex && point3._bufferIndex < chunk.length) {
          go(chunk.charCodeAt(point3._bufferIndex));
        }
      } else {
        go(chunk);
      }
    }
  }
  function go(code2) {
    consumed = void 0;
    expectedCode = code2;
    state = state(code2);
  }
  function consume(code2) {
    if (markdownLineEnding(code2)) {
      point3.line++;
      point3.column = 1;
      point3.offset += code2 === -3 ? 2 : 1;
      accountForPotentialSkip();
    } else if (code2 !== -1) {
      point3.column++;
      point3.offset++;
    }
    if (point3._bufferIndex < 0) {
      point3._index++;
    } else {
      point3._bufferIndex++;
      if (point3._bufferIndex === // Points w/ non-negative `_bufferIndex` reference
      // strings.
      /** @type {string} */
      chunks[point3._index].length) {
        point3._bufferIndex = -1;
        point3._index++;
      }
    }
    context.previous = code2;
    consumed = true;
  }
  function enter(type, fields) {
    const token = fields || {};
    token.type = type;
    token.start = now();
    context.events.push(["enter", token, context]);
    stack.push(token);
    return token;
  }
  function exit3(type) {
    const token = stack.pop();
    token.end = now();
    context.events.push(["exit", token, context]);
    return token;
  }
  function onsuccessfulconstruct(construct, info) {
    addResult(construct, info.from);
  }
  function onsuccessfulcheck(_, info) {
    info.restore();
  }
  function constructFactory(onreturn, fields) {
    return hook;
    function hook(constructs2, returnState, bogusState) {
      let listOfConstructs;
      let constructIndex;
      let currentConstruct;
      let info;
      return Array.isArray(constructs2) ? (
        /* c8 ignore next 1 */
        handleListOfConstructs(constructs2)
      ) : "tokenize" in constructs2 ? (
        // Looks like a construct.
        handleListOfConstructs([
          /** @type {Construct} */
          constructs2
        ])
      ) : handleMapOfConstructs(constructs2);
      function handleMapOfConstructs(map) {
        return start;
        function start(code2) {
          const left = code2 !== null && map[code2];
          const all2 = code2 !== null && map.null;
          const list2 = [
            // To do: add more extension tests.
            /* c8 ignore next 2 */
            ...Array.isArray(left) ? left : left ? [left] : [],
            ...Array.isArray(all2) ? all2 : all2 ? [all2] : []
          ];
          return handleListOfConstructs(list2)(code2);
        }
      }
      function handleListOfConstructs(list2) {
        listOfConstructs = list2;
        constructIndex = 0;
        if (list2.length === 0) {
          return bogusState;
        }
        return handleConstruct(list2[constructIndex]);
      }
      function handleConstruct(construct) {
        return start;
        function start(code2) {
          info = store();
          currentConstruct = construct;
          if (!construct.partial) {
            context.currentConstruct = construct;
          }
          if (construct.name && context.parser.constructs.disable.null.includes(construct.name)) {
            return nok(code2);
          }
          return construct.tokenize.call(
            // If we do have fields, create an object w/ `context` as its
            // prototype.
            // This allows a “live binding”, which is needed for `interrupt`.
            fields ? Object.assign(Object.create(context), fields) : context,
            effects,
            ok3,
            nok
          )(code2);
        }
      }
      function ok3(code2) {
        consumed = true;
        onreturn(currentConstruct, info);
        return returnState;
      }
      function nok(code2) {
        consumed = true;
        info.restore();
        if (++constructIndex < listOfConstructs.length) {
          return handleConstruct(listOfConstructs[constructIndex]);
        }
        return bogusState;
      }
    }
  }
  function addResult(construct, from2) {
    if (construct.resolveAll && !resolveAllConstructs.includes(construct)) {
      resolveAllConstructs.push(construct);
    }
    if (construct.resolve) {
      splice(context.events, from2, context.events.length - from2, construct.resolve(context.events.slice(from2), context));
    }
    if (construct.resolveTo) {
      context.events = construct.resolveTo(context.events, context);
    }
  }
  function store() {
    const startPoint = now();
    const startPrevious = context.previous;
    const startCurrentConstruct = context.currentConstruct;
    const startEventsIndex = context.events.length;
    const startStack = Array.from(stack);
    return {
      from: startEventsIndex,
      restore
    };
    function restore() {
      point3 = startPoint;
      context.previous = startPrevious;
      context.currentConstruct = startCurrentConstruct;
      context.events.length = startEventsIndex;
      stack = startStack;
      accountForPotentialSkip();
    }
  }
  function accountForPotentialSkip() {
    if (point3.line in columnStart && point3.column < 2) {
      point3.column = columnStart[point3.line];
      point3.offset += columnStart[point3.line] - 1;
    }
  }
}
function sliceChunks(chunks, token) {
  const startIndex = token.start._index;
  const startBufferIndex = token.start._bufferIndex;
  const endIndex = token.end._index;
  const endBufferIndex = token.end._bufferIndex;
  let view;
  if (startIndex === endIndex) {
    view = [chunks[startIndex].slice(startBufferIndex, endBufferIndex)];
  } else {
    view = chunks.slice(startIndex, endIndex);
    if (startBufferIndex > -1) {
      const head = view[0];
      if (typeof head === "string") {
        view[0] = head.slice(startBufferIndex);
      } else {
        view.shift();
      }
    }
    if (endBufferIndex > 0) {
      view.push(chunks[endIndex].slice(0, endBufferIndex));
    }
  }
  return view;
}
function serializeChunks(chunks, expandTabs) {
  let index2 = -1;
  const result = [];
  let atTab;
  while (++index2 < chunks.length) {
    const chunk = chunks[index2];
    let value2;
    if (typeof chunk === "string") {
      value2 = chunk;
    } else {
      switch (chunk) {
        case -5: {
          value2 = "\r";
          break;
        }
        case -4: {
          value2 = "\n";
          break;
        }
        case -3: {
          value2 = "\r\n";
          break;
        }
        case -2: {
          value2 = expandTabs ? " " : "	";
          break;
        }
        case -1: {
          if (!expandTabs && atTab) {
            continue;
          }
          value2 = " ";
          break;
        }
        default: {
          value2 = String.fromCharCode(chunk);
        }
      }
    }
    atTab = chunk === -2;
    result.push(value2);
  }
  return result.join("");
}

// node_modules/micromark/lib/parse.js
function parse2(options) {
  const settings = options || {};
  const constructs2 = (
    /** @type {FullNormalizedExtension} */
    combineExtensions([constructs_exports, ...settings.extensions || []])
  );
  const parser = {
    constructs: constructs2,
    content: create2(content),
    defined: [],
    document: create2(document),
    flow: create2(flow),
    lazy: {},
    string: create2(string),
    text: create2(text)
  };
  return parser;
  function create2(initial) {
    return creator;
    function creator(from) {
      return createTokenizer(parser, initial, from);
    }
  }
}

// node_modules/micromark/lib/postprocess.js
function postprocess(events) {
  while (!subtokenize(events)) {
  }
  return events;
}

// node_modules/micromark/lib/preprocess.js
var search = /[\0\t\n\r]/g;
function preprocess() {
  let column = 1;
  let buffer = "";
  let start = true;
  let atCarriageReturn;
  return preprocessor;
  function preprocessor(value2, encoding, end) {
    value2 = buffer + (typeof value2 === "string" ? value2.toString() : new TextDecoder(encoding || void 0).decode(value2));
    const chunks = [];
    let startPosition = 0;
    buffer = "";
    if (start) {
      if (value2.charCodeAt(0) === 65279) {
        startPosition++;
      }
      start = void 0;
    }
    while (startPosition < value2.length) {
      search.lastIndex = startPosition;
      const match = search.exec(value2);
      const endPosition = match && match.index !== void 0 ? match.index : value2.length;
      const code2 = value2.charCodeAt(endPosition);
      if (!match) {
        buffer = value2.slice(startPosition);
        break;
      }
      if (code2 === 10 && startPosition === endPosition && atCarriageReturn) {
        chunks.push(-3);
        atCarriageReturn = void 0;
      } else {
        if (atCarriageReturn) {
          chunks.push(-5);
          atCarriageReturn = void 0;
        }
        if (startPosition < endPosition) {
          chunks.push(value2.slice(startPosition, endPosition));
          column += endPosition - startPosition;
        }
        switch (code2) {
          case 0: {
            chunks.push(65533);
            column++;
            break;
          }
          case 9: {
            const next = Math.ceil(column / 4) * 4;
            chunks.push(-2);
            while (column++ < next) {
              chunks.push(-1);
            }
            break;
          }
          case 10: {
            chunks.push(-4);
            column = 1;
            break;
          }
          default: {
            atCarriageReturn = true;
            column = 1;
          }
        }
      }
      startPosition = endPosition + 1;
    }
    if (end) {
      if (atCarriageReturn) {
        chunks.push(-5);
      }
      if (buffer) {
        chunks.push(buffer);
      }
      chunks.push(null);
    }
    return chunks;
  }
}

// node_modules/micromark-util-decode-string/index.js
var characterEscapeOrReference = /\\([!-/:-@[-`{-~])|&(#(?:\d{1,7}|x[\da-f]{1,6})|[\da-z]{1,31});/gi;
function decodeString(value2) {
  return value2.replace(characterEscapeOrReference, decode);
}
function decode($0, $1, $2) {
  if ($1) {
    return $1;
  }
  const head = $2.charCodeAt(0);
  if (head === 35) {
    const head2 = $2.charCodeAt(1);
    const hex = head2 === 120 || head2 === 88;
    return decodeNumericCharacterReference($2.slice(hex ? 2 : 1), hex ? 16 : 10);
  }
  return decodeNamedCharacterReference($2) || $0;
}

// node_modules/unist-util-stringify-position/lib/index.js
function stringifyPosition(value2) {
  if (!value2 || typeof value2 !== "object") {
    return "";
  }
  if ("position" in value2 || "type" in value2) {
    return position(value2.position);
  }
  if ("start" in value2 || "end" in value2) {
    return position(value2);
  }
  if ("line" in value2 || "column" in value2) {
    return point(value2);
  }
  return "";
}
function point(point3) {
  return index(point3 && point3.line) + ":" + index(point3 && point3.column);
}
function position(pos) {
  return point(pos && pos.start) + "-" + point(pos && pos.end);
}
function index(value2) {
  return value2 && typeof value2 === "number" ? value2 : 1;
}

// node_modules/mdast-util-from-markdown/lib/index.js
var own2 = {}.hasOwnProperty;
function fromMarkdown(value2, encoding, options) {
  if (encoding && typeof encoding === "object") {
    options = encoding;
    encoding = void 0;
  }
  return compiler(options)(postprocess(parse2(options).document().write(preprocess()(value2, encoding, true))));
}
function compiler(options) {
  const config = {
    transforms: [],
    canContainEols: ["emphasis", "fragment", "heading", "paragraph", "strong"],
    enter: {
      autolink: opener2(link),
      autolinkProtocol: onenterdata,
      autolinkEmail: onenterdata,
      atxHeading: opener2(heading),
      blockQuote: opener2(blockQuote2),
      characterEscape: onenterdata,
      characterReference: onenterdata,
      codeFenced: opener2(codeFlow),
      codeFencedFenceInfo: buffer,
      codeFencedFenceMeta: buffer,
      codeIndented: opener2(codeFlow, buffer),
      codeText: opener2(codeText2, buffer),
      codeTextData: onenterdata,
      data: onenterdata,
      codeFlowValue: onenterdata,
      definition: opener2(definition2),
      definitionDestinationString: buffer,
      definitionLabelString: buffer,
      definitionTitleString: buffer,
      emphasis: opener2(emphasis),
      hardBreakEscape: opener2(hardBreak),
      hardBreakTrailing: opener2(hardBreak),
      htmlFlow: opener2(html, buffer),
      htmlFlowData: onenterdata,
      htmlText: opener2(html, buffer),
      htmlTextData: onenterdata,
      image: opener2(image),
      label: buffer,
      link: opener2(link),
      listItem: opener2(listItem),
      listItemValue: onenterlistitemvalue,
      listOrdered: opener2(list2, onenterlistordered),
      listUnordered: opener2(list2),
      paragraph: opener2(paragraph),
      reference: onenterreference,
      referenceString: buffer,
      resourceDestinationString: buffer,
      resourceTitleString: buffer,
      setextHeading: opener2(heading),
      strong: opener2(strong),
      thematicBreak: opener2(thematicBreak2)
    },
    exit: {
      atxHeading: closer(),
      atxHeadingSequence: onexitatxheadingsequence,
      autolink: closer(),
      autolinkEmail: onexitautolinkemail,
      autolinkProtocol: onexitautolinkprotocol,
      blockQuote: closer(),
      characterEscapeValue: onexitdata,
      characterReferenceMarkerHexadecimal: onexitcharacterreferencemarker,
      characterReferenceMarkerNumeric: onexitcharacterreferencemarker,
      characterReferenceValue: onexitcharacterreferencevalue,
      characterReference: onexitcharacterreference,
      codeFenced: closer(onexitcodefenced),
      codeFencedFence: onexitcodefencedfence,
      codeFencedFenceInfo: onexitcodefencedfenceinfo,
      codeFencedFenceMeta: onexitcodefencedfencemeta,
      codeFlowValue: onexitdata,
      codeIndented: closer(onexitcodeindented),
      codeText: closer(onexitcodetext),
      codeTextData: onexitdata,
      data: onexitdata,
      definition: closer(),
      definitionDestinationString: onexitdefinitiondestinationstring,
      definitionLabelString: onexitdefinitionlabelstring,
      definitionTitleString: onexitdefinitiontitlestring,
      emphasis: closer(),
      hardBreakEscape: closer(onexithardbreak),
      hardBreakTrailing: closer(onexithardbreak),
      htmlFlow: closer(onexithtmlflow),
      htmlFlowData: onexitdata,
      htmlText: closer(onexithtmltext),
      htmlTextData: onexitdata,
      image: closer(onexitimage),
      label: onexitlabel,
      labelText: onexitlabeltext,
      lineEnding: onexitlineending,
      link: closer(onexitlink),
      listItem: closer(),
      listOrdered: closer(),
      listUnordered: closer(),
      paragraph: closer(),
      referenceString: onexitreferencestring,
      resourceDestinationString: onexitresourcedestinationstring,
      resourceTitleString: onexitresourcetitlestring,
      resource: onexitresource,
      setextHeading: closer(onexitsetextheading),
      setextHeadingLineSequence: onexitsetextheadinglinesequence,
      setextHeadingText: onexitsetextheadingtext,
      strong: closer(),
      thematicBreak: closer()
    }
  };
  configure(config, (options || {}).mdastExtensions || []);
  const data = {};
  return compile;
  function compile(events) {
    let tree = {
      type: "root",
      children: []
    };
    const context = {
      stack: [tree],
      tokenStack: [],
      config,
      enter,
      exit: exit3,
      buffer,
      resume,
      data
    };
    const listStack = [];
    let index2 = -1;
    while (++index2 < events.length) {
      if (events[index2][1].type === "listOrdered" || events[index2][1].type === "listUnordered") {
        if (events[index2][0] === "enter") {
          listStack.push(index2);
        } else {
          const tail = listStack.pop();
          index2 = prepareList(events, tail, index2);
        }
      }
    }
    index2 = -1;
    while (++index2 < events.length) {
      const handler = config[events[index2][0]];
      if (own2.call(handler, events[index2][1].type)) {
        handler[events[index2][1].type].call(Object.assign({
          sliceSerialize: events[index2][2].sliceSerialize
        }, context), events[index2][1]);
      }
    }
    if (context.tokenStack.length > 0) {
      const tail = context.tokenStack[context.tokenStack.length - 1];
      const handler = tail[1] || defaultOnError;
      handler.call(context, void 0, tail[0]);
    }
    tree.position = {
      start: point2(events.length > 0 ? events[0][1].start : {
        line: 1,
        column: 1,
        offset: 0
      }),
      end: point2(events.length > 0 ? events[events.length - 2][1].end : {
        line: 1,
        column: 1,
        offset: 0
      })
    };
    index2 = -1;
    while (++index2 < config.transforms.length) {
      tree = config.transforms[index2](tree) || tree;
    }
    return tree;
  }
  function prepareList(events, start, length) {
    let index2 = start - 1;
    let containerBalance = -1;
    let listSpread = false;
    let listItem2;
    let lineIndex;
    let firstBlankLineIndex;
    let atMarker;
    while (++index2 <= length) {
      const event = events[index2];
      switch (event[1].type) {
        case "listUnordered":
        case "listOrdered":
        case "blockQuote": {
          if (event[0] === "enter") {
            containerBalance++;
          } else {
            containerBalance--;
          }
          atMarker = void 0;
          break;
        }
        case "lineEndingBlank": {
          if (event[0] === "enter") {
            if (listItem2 && !atMarker && !containerBalance && !firstBlankLineIndex) {
              firstBlankLineIndex = index2;
            }
            atMarker = void 0;
          }
          break;
        }
        case "linePrefix":
        case "listItemValue":
        case "listItemMarker":
        case "listItemPrefix":
        case "listItemPrefixWhitespace": {
          break;
        }
        default: {
          atMarker = void 0;
        }
      }
      if (!containerBalance && event[0] === "enter" && event[1].type === "listItemPrefix" || containerBalance === -1 && event[0] === "exit" && (event[1].type === "listUnordered" || event[1].type === "listOrdered")) {
        if (listItem2) {
          let tailIndex = index2;
          lineIndex = void 0;
          while (tailIndex--) {
            const tailEvent = events[tailIndex];
            if (tailEvent[1].type === "lineEnding" || tailEvent[1].type === "lineEndingBlank") {
              if (tailEvent[0] === "exit") continue;
              if (lineIndex) {
                events[lineIndex][1].type = "lineEndingBlank";
                listSpread = true;
              }
              tailEvent[1].type = "lineEnding";
              lineIndex = tailIndex;
            } else if (tailEvent[1].type === "linePrefix" || tailEvent[1].type === "blockQuotePrefix" || tailEvent[1].type === "blockQuotePrefixWhitespace" || tailEvent[1].type === "blockQuoteMarker" || tailEvent[1].type === "listItemIndent") {
            } else {
              break;
            }
          }
          if (firstBlankLineIndex && (!lineIndex || firstBlankLineIndex < lineIndex)) {
            listItem2._spread = true;
          }
          listItem2.end = Object.assign({}, lineIndex ? events[lineIndex][1].start : event[1].end);
          events.splice(lineIndex || index2, 0, ["exit", listItem2, event[2]]);
          index2++;
          length++;
        }
        if (event[1].type === "listItemPrefix") {
          const item2 = {
            type: "listItem",
            _spread: false,
            start: Object.assign({}, event[1].start),
            // @ts-expect-error: we’ll add `end` in a second.
            end: void 0
          };
          listItem2 = item2;
          events.splice(index2, 0, ["enter", item2, event[2]]);
          index2++;
          length++;
          firstBlankLineIndex = void 0;
          atMarker = true;
        }
      }
    }
    events[start][1]._spread = listSpread;
    return length;
  }
  function opener2(create2, and) {
    return open;
    function open(token) {
      enter.call(this, create2(token), token);
      if (and) and.call(this, token);
    }
  }
  function buffer() {
    this.stack.push({
      type: "fragment",
      children: []
    });
  }
  function enter(node2, token, errorHandler) {
    const parent = this.stack[this.stack.length - 1];
    const siblings = parent.children;
    siblings.push(node2);
    this.stack.push(node2);
    this.tokenStack.push([token, errorHandler || void 0]);
    node2.position = {
      start: point2(token.start),
      // @ts-expect-error: `end` will be patched later.
      end: void 0
    };
  }
  function closer(and) {
    return close2;
    function close2(token) {
      if (and) and.call(this, token);
      exit3.call(this, token);
    }
  }
  function exit3(token, onExitError) {
    const node2 = this.stack.pop();
    const open = this.tokenStack.pop();
    if (!open) {
      throw new Error("Cannot close `" + token.type + "` (" + stringifyPosition({
        start: token.start,
        end: token.end
      }) + "): it\u2019s not open");
    } else if (open[0].type !== token.type) {
      if (onExitError) {
        onExitError.call(this, token, open[0]);
      } else {
        const handler = open[1] || defaultOnError;
        handler.call(this, token, open[0]);
      }
    }
    node2.position.end = point2(token.end);
  }
  function resume() {
    return toString(this.stack.pop());
  }
  function onenterlistordered() {
    this.data.expectingFirstListItemValue = true;
  }
  function onenterlistitemvalue(token) {
    if (this.data.expectingFirstListItemValue) {
      const ancestor = this.stack[this.stack.length - 2];
      ancestor.start = Number.parseInt(this.sliceSerialize(token), 10);
      this.data.expectingFirstListItemValue = void 0;
    }
  }
  function onexitcodefencedfenceinfo() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.lang = data2;
  }
  function onexitcodefencedfencemeta() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.meta = data2;
  }
  function onexitcodefencedfence() {
    if (this.data.flowCodeInside) return;
    this.buffer();
    this.data.flowCodeInside = true;
  }
  function onexitcodefenced() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.value = data2.replace(/^(\r?\n|\r)|(\r?\n|\r)$/g, "");
    this.data.flowCodeInside = void 0;
  }
  function onexitcodeindented() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.value = data2.replace(/(\r?\n|\r)$/g, "");
  }
  function onexitdefinitionlabelstring(token) {
    const label = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.label = label;
    node2.identifier = normalizeIdentifier(this.sliceSerialize(token)).toLowerCase();
  }
  function onexitdefinitiontitlestring() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.title = data2;
  }
  function onexitdefinitiondestinationstring() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.url = data2;
  }
  function onexitatxheadingsequence(token) {
    const node2 = this.stack[this.stack.length - 1];
    if (!node2.depth) {
      const depth = this.sliceSerialize(token).length;
      node2.depth = depth;
    }
  }
  function onexitsetextheadingtext() {
    this.data.setextHeadingSlurpLineEnding = true;
  }
  function onexitsetextheadinglinesequence(token) {
    const node2 = this.stack[this.stack.length - 1];
    node2.depth = this.sliceSerialize(token).codePointAt(0) === 61 ? 1 : 2;
  }
  function onexitsetextheading() {
    this.data.setextHeadingSlurpLineEnding = void 0;
  }
  function onenterdata(token) {
    const node2 = this.stack[this.stack.length - 1];
    const siblings = node2.children;
    let tail = siblings[siblings.length - 1];
    if (!tail || tail.type !== "text") {
      tail = text4();
      tail.position = {
        start: point2(token.start),
        // @ts-expect-error: we’ll add `end` later.
        end: void 0
      };
      siblings.push(tail);
    }
    this.stack.push(tail);
  }
  function onexitdata(token) {
    const tail = this.stack.pop();
    tail.value += this.sliceSerialize(token);
    tail.position.end = point2(token.end);
  }
  function onexitlineending(token) {
    const context = this.stack[this.stack.length - 1];
    if (this.data.atHardBreak) {
      const tail = context.children[context.children.length - 1];
      tail.position.end = point2(token.end);
      this.data.atHardBreak = void 0;
      return;
    }
    if (!this.data.setextHeadingSlurpLineEnding && config.canContainEols.includes(context.type)) {
      onenterdata.call(this, token);
      onexitdata.call(this, token);
    }
  }
  function onexithardbreak() {
    this.data.atHardBreak = true;
  }
  function onexithtmlflow() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.value = data2;
  }
  function onexithtmltext() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.value = data2;
  }
  function onexitcodetext() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.value = data2;
  }
  function onexitlink() {
    const node2 = this.stack[this.stack.length - 1];
    if (this.data.inReference) {
      const referenceType = this.data.referenceType || "shortcut";
      node2.type += "Reference";
      node2.referenceType = referenceType;
      delete node2.url;
      delete node2.title;
    } else {
      delete node2.identifier;
      delete node2.label;
    }
    this.data.referenceType = void 0;
  }
  function onexitimage() {
    const node2 = this.stack[this.stack.length - 1];
    if (this.data.inReference) {
      const referenceType = this.data.referenceType || "shortcut";
      node2.type += "Reference";
      node2.referenceType = referenceType;
      delete node2.url;
      delete node2.title;
    } else {
      delete node2.identifier;
      delete node2.label;
    }
    this.data.referenceType = void 0;
  }
  function onexitlabeltext(token) {
    const string3 = this.sliceSerialize(token);
    const ancestor = this.stack[this.stack.length - 2];
    ancestor.label = decodeString(string3);
    ancestor.identifier = normalizeIdentifier(string3).toLowerCase();
  }
  function onexitlabel() {
    const fragment = this.stack[this.stack.length - 1];
    const value2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    this.data.inReference = true;
    if (node2.type === "link") {
      const children = fragment.children;
      node2.children = children;
    } else {
      node2.alt = value2;
    }
  }
  function onexitresourcedestinationstring() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.url = data2;
  }
  function onexitresourcetitlestring() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.title = data2;
  }
  function onexitresource() {
    this.data.inReference = void 0;
  }
  function onenterreference() {
    this.data.referenceType = "collapsed";
  }
  function onexitreferencestring(token) {
    const label = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.label = label;
    node2.identifier = normalizeIdentifier(this.sliceSerialize(token)).toLowerCase();
    this.data.referenceType = "full";
  }
  function onexitcharacterreferencemarker(token) {
    this.data.characterReferenceType = token.type;
  }
  function onexitcharacterreferencevalue(token) {
    const data2 = this.sliceSerialize(token);
    const type = this.data.characterReferenceType;
    let value2;
    if (type) {
      value2 = decodeNumericCharacterReference(data2, type === "characterReferenceMarkerNumeric" ? 10 : 16);
      this.data.characterReferenceType = void 0;
    } else {
      const result = decodeNamedCharacterReference(data2);
      value2 = result;
    }
    const tail = this.stack[this.stack.length - 1];
    tail.value += value2;
  }
  function onexitcharacterreference(token) {
    const tail = this.stack.pop();
    tail.position.end = point2(token.end);
  }
  function onexitautolinkprotocol(token) {
    onexitdata.call(this, token);
    const node2 = this.stack[this.stack.length - 1];
    node2.url = this.sliceSerialize(token);
  }
  function onexitautolinkemail(token) {
    onexitdata.call(this, token);
    const node2 = this.stack[this.stack.length - 1];
    node2.url = "mailto:" + this.sliceSerialize(token);
  }
  function blockQuote2() {
    return {
      type: "blockquote",
      children: []
    };
  }
  function codeFlow() {
    return {
      type: "code",
      lang: null,
      meta: null,
      value: ""
    };
  }
  function codeText2() {
    return {
      type: "inlineCode",
      value: ""
    };
  }
  function definition2() {
    return {
      type: "definition",
      identifier: "",
      label: null,
      title: null,
      url: ""
    };
  }
  function emphasis() {
    return {
      type: "emphasis",
      children: []
    };
  }
  function heading() {
    return {
      type: "heading",
      // @ts-expect-error `depth` will be set later.
      depth: 0,
      children: []
    };
  }
  function hardBreak() {
    return {
      type: "break"
    };
  }
  function html() {
    return {
      type: "html",
      value: ""
    };
  }
  function image() {
    return {
      type: "image",
      title: null,
      url: "",
      alt: null
    };
  }
  function link() {
    return {
      type: "link",
      title: null,
      url: "",
      children: []
    };
  }
  function list2(token) {
    return {
      type: "list",
      ordered: token.type === "listOrdered",
      start: null,
      spread: token._spread,
      children: []
    };
  }
  function listItem(token) {
    return {
      type: "listItem",
      spread: token._spread,
      checked: null,
      children: []
    };
  }
  function paragraph() {
    return {
      type: "paragraph",
      children: []
    };
  }
  function strong() {
    return {
      type: "strong",
      children: []
    };
  }
  function text4() {
    return {
      type: "text",
      value: ""
    };
  }
  function thematicBreak2() {
    return {
      type: "thematicBreak"
    };
  }
}
function point2(d) {
  return {
    line: d.line,
    column: d.column,
    offset: d.offset
  };
}
function configure(combined, extensions) {
  let index2 = -1;
  while (++index2 < extensions.length) {
    const value2 = extensions[index2];
    if (Array.isArray(value2)) {
      configure(combined, value2);
    } else {
      extension(combined, value2);
    }
  }
}
function extension(combined, extension2) {
  let key;
  for (key in extension2) {
    if (own2.call(extension2, key)) {
      switch (key) {
        case "canContainEols": {
          const right = extension2[key];
          if (right) {
            combined[key].push(...right);
          }
          break;
        }
        case "transforms": {
          const right = extension2[key];
          if (right) {
            combined[key].push(...right);
          }
          break;
        }
        case "enter":
        case "exit": {
          const right = extension2[key];
          if (right) {
            Object.assign(combined[key], right);
          }
          break;
        }
      }
    }
  }
}
function defaultOnError(left, right) {
  if (left) {
    throw new Error("Cannot close `" + left.type + "` (" + stringifyPosition({
      start: left.start,
      end: left.end
    }) + "): a different token (`" + right.type + "`, " + stringifyPosition({
      start: right.start,
      end: right.end
    }) + ") is open");
  } else {
    throw new Error("Cannot close document, a token (`" + right.type + "`, " + stringifyPosition({
      start: right.start,
      end: right.end
    }) + ") is still open");
  }
}

// node_modules/devlop/lib/default.js
function ok() {
}

// node_modules/fault/index.js
var import_format = __toESM(require_format(), 1);
var fault = Object.assign(create(Error), {
  eval: create(EvalError),
  range: create(RangeError),
  reference: create(ReferenceError),
  syntax: create(SyntaxError),
  type: create(TypeError),
  uri: create(URIError)
});
function create(Constructor) {
  FormattedError.displayName = Constructor.displayName || Constructor.name;
  return FormattedError;
  function FormattedError(format, ...values) {
    const reason = format ? (0, import_format.default)(format, ...values) : format;
    return new Constructor(reason);
  }
}

// node_modules/micromark-extension-frontmatter/lib/to-matters.js
var own3 = {}.hasOwnProperty;
var markers = {
  yaml: "-",
  toml: "+"
};
function toMatters(options) {
  const result = [];
  let index2 = -1;
  const presetsOrMatters = Array.isArray(options) ? options : options ? [options] : ["yaml"];
  while (++index2 < presetsOrMatters.length) {
    result[index2] = matter(presetsOrMatters[index2]);
  }
  return result;
}
function matter(option) {
  let result = option;
  if (typeof result === "string") {
    if (!own3.call(markers, result)) {
      throw fault("Missing matter definition for `%s`", result);
    }
    result = {
      type: result,
      marker: markers[result]
    };
  } else if (typeof result !== "object") {
    throw fault("Expected matter to be an object, not `%j`", result);
  }
  if (!own3.call(result, "type")) {
    throw fault("Missing `type` in matter `%j`", result);
  }
  if (!own3.call(result, "fence") && !own3.call(result, "marker")) {
    throw fault("Missing `marker` or `fence` in matter `%j`", result);
  }
  return result;
}

// node_modules/micromark-extension-frontmatter/lib/syntax.js
function frontmatter(options) {
  const matters = toMatters(options);
  const flow3 = {};
  let index2 = -1;
  while (++index2 < matters.length) {
    const matter2 = matters[index2];
    const code2 = fence(matter2, "open").charCodeAt(0);
    const construct = createConstruct(matter2);
    const existing = flow3[code2];
    if (Array.isArray(existing)) {
      existing.push(construct);
    } else {
      flow3[code2] = [construct];
    }
  }
  return {
    flow: flow3
  };
}
function createConstruct(matter2) {
  const anywhere2 = matter2.anywhere;
  const frontmatterType = (
    /** @type {TokenType} */
    matter2.type
  );
  const fenceType = (
    /** @type {TokenType} */
    frontmatterType + "Fence"
  );
  const sequenceType = (
    /** @type {TokenType} */
    fenceType + "Sequence"
  );
  const valueType = (
    /** @type {TokenType} */
    frontmatterType + "Value"
  );
  const closingFenceConstruct = {
    tokenize: tokenizeClosingFence,
    partial: true
  };
  let buffer;
  let bufferIndex = 0;
  return {
    tokenize: tokenizeFrontmatter,
    concrete: true
  };
  function tokenizeFrontmatter(effects, ok3, nok) {
    const self = this;
    return start;
    function start(code2) {
      const position2 = self.now();
      if (
        // Indent not allowed.
        position2.column === 1 && // Normally, only allowed in first line.
        (position2.line === 1 || anywhere2)
      ) {
        buffer = fence(matter2, "open");
        bufferIndex = 0;
        if (code2 === buffer.charCodeAt(bufferIndex)) {
          effects.enter(frontmatterType);
          effects.enter(fenceType);
          effects.enter(sequenceType);
          return openSequence(code2);
        }
      }
      return nok(code2);
    }
    function openSequence(code2) {
      if (bufferIndex === buffer.length) {
        effects.exit(sequenceType);
        if (markdownSpace(code2)) {
          effects.enter("whitespace");
          return openSequenceWhitespace(code2);
        }
        return openAfter(code2);
      }
      if (code2 === buffer.charCodeAt(bufferIndex++)) {
        effects.consume(code2);
        return openSequence;
      }
      return nok(code2);
    }
    function openSequenceWhitespace(code2) {
      if (markdownSpace(code2)) {
        effects.consume(code2);
        return openSequenceWhitespace;
      }
      effects.exit("whitespace");
      return openAfter(code2);
    }
    function openAfter(code2) {
      if (markdownLineEnding(code2)) {
        effects.exit(fenceType);
        effects.enter("lineEnding");
        effects.consume(code2);
        effects.exit("lineEnding");
        buffer = fence(matter2, "close");
        bufferIndex = 0;
        return effects.attempt(closingFenceConstruct, after, contentStart);
      }
      return nok(code2);
    }
    function contentStart(code2) {
      if (code2 === null || markdownLineEnding(code2)) {
        return contentEnd(code2);
      }
      effects.enter(valueType);
      return contentInside(code2);
    }
    function contentInside(code2) {
      if (code2 === null || markdownLineEnding(code2)) {
        effects.exit(valueType);
        return contentEnd(code2);
      }
      effects.consume(code2);
      return contentInside;
    }
    function contentEnd(code2) {
      if (code2 === null) {
        return nok(code2);
      }
      effects.enter("lineEnding");
      effects.consume(code2);
      effects.exit("lineEnding");
      return effects.attempt(closingFenceConstruct, after, contentStart);
    }
    function after(code2) {
      effects.exit(frontmatterType);
      return ok3(code2);
    }
  }
  function tokenizeClosingFence(effects, ok3, nok) {
    let bufferIndex2 = 0;
    return closeStart;
    function closeStart(code2) {
      if (code2 === buffer.charCodeAt(bufferIndex2)) {
        effects.enter(fenceType);
        effects.enter(sequenceType);
        return closeSequence(code2);
      }
      return nok(code2);
    }
    function closeSequence(code2) {
      if (bufferIndex2 === buffer.length) {
        effects.exit(sequenceType);
        if (markdownSpace(code2)) {
          effects.enter("whitespace");
          return closeSequenceWhitespace(code2);
        }
        return closeAfter(code2);
      }
      if (code2 === buffer.charCodeAt(bufferIndex2++)) {
        effects.consume(code2);
        return closeSequence;
      }
      return nok(code2);
    }
    function closeSequenceWhitespace(code2) {
      if (markdownSpace(code2)) {
        effects.consume(code2);
        return closeSequenceWhitespace;
      }
      effects.exit("whitespace");
      return closeAfter(code2);
    }
    function closeAfter(code2) {
      if (code2 === null || markdownLineEnding(code2)) {
        effects.exit(fenceType);
        return ok3(code2);
      }
      return nok(code2);
    }
  }
}
function fence(matter2, prop) {
  return matter2.marker ? pick(matter2.marker, prop).repeat(3) : (
    // @ts-expect-error: They’re mutually exclusive.
    pick(matter2.fence, prop)
  );
}
function pick(schema, prop) {
  return typeof schema === "string" ? schema : schema[prop];
}

// node_modules/escape-string-regexp/index.js
function escapeStringRegexp(string3) {
  if (typeof string3 !== "string") {
    throw new TypeError("Expected a string");
  }
  return string3.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
}

// node_modules/mdast-util-frontmatter/lib/index.js
function frontmatterFromMarkdown(options) {
  const matters = toMatters(options);
  const enter = {};
  const exit3 = {};
  let index2 = -1;
  while (++index2 < matters.length) {
    const matter2 = matters[index2];
    enter[matter2.type] = opener(matter2);
    exit3[matter2.type] = close;
    exit3[matter2.type + "Value"] = value;
  }
  return { enter, exit: exit3 };
}
function opener(matter2) {
  return open;
  function open(token) {
    this.enter({ type: matter2.type, value: "" }, token);
    this.buffer();
  }
}
function close(token) {
  const data = this.resume();
  const node2 = this.stack[this.stack.length - 1];
  ok("value" in node2);
  this.exit(token);
  node2.value = data.replace(/^(\r?\n|\r)|(\r?\n|\r)$/g, "");
}
function value(token) {
  this.config.enter.data.call(this, token);
  this.config.exit.data.call(this, token);
}

// node_modules/ccount/index.js
function ccount(value2, character) {
  const source = String(value2);
  if (typeof character !== "string") {
    throw new TypeError("Expected character");
  }
  let count = 0;
  let index2 = source.indexOf(character);
  while (index2 !== -1) {
    count++;
    index2 = source.indexOf(character, index2 + character.length);
  }
  return count;
}

// node_modules/unist-util-is/lib/index.js
var convert = (
  // Note: overloads in JSDoc can’t yet use different `@template`s.
  /**
   * @type {(
   *   (<Condition extends string>(test: Condition) => (node: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node & {type: Condition}) &
   *   (<Condition extends Props>(test: Condition) => (node: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node & Condition) &
   *   (<Condition extends TestFunction>(test: Condition) => (node: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node & Predicate<Condition, Node>) &
   *   ((test?: null | undefined) => (node?: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node) &
   *   ((test?: Test) => Check)
   * )}
   */
  /**
   * @param {Test} [test]
   * @returns {Check}
   */
  (function(test) {
    if (test === null || test === void 0) {
      return ok2;
    }
    if (typeof test === "function") {
      return castFactory(test);
    }
    if (typeof test === "object") {
      return Array.isArray(test) ? anyFactory(test) : (
        // Cast because `ReadonlyArray` goes into the above but `isArray`
        // narrows to `Array`.
        propertiesFactory(
          /** @type {Props} */
          test
        )
      );
    }
    if (typeof test === "string") {
      return typeFactory(test);
    }
    throw new Error("Expected function, string, or object as test");
  })
);
function anyFactory(tests) {
  const checks = [];
  let index2 = -1;
  while (++index2 < tests.length) {
    checks[index2] = convert(tests[index2]);
  }
  return castFactory(any);
  function any(...parameters) {
    let index3 = -1;
    while (++index3 < checks.length) {
      if (checks[index3].apply(this, parameters)) return true;
    }
    return false;
  }
}
function propertiesFactory(check) {
  const checkAsRecord = (
    /** @type {Record<string, unknown>} */
    check
  );
  return castFactory(all2);
  function all2(node2) {
    const nodeAsRecord = (
      /** @type {Record<string, unknown>} */
      /** @type {unknown} */
      node2
    );
    let key;
    for (key in check) {
      if (nodeAsRecord[key] !== checkAsRecord[key]) return false;
    }
    return true;
  }
}
function typeFactory(check) {
  return castFactory(type);
  function type(node2) {
    return node2 && node2.type === check;
  }
}
function castFactory(testFunction) {
  return check;
  function check(value2, index2, parent) {
    return Boolean(
      looksLikeANode(value2) && testFunction.call(
        this,
        value2,
        typeof index2 === "number" ? index2 : void 0,
        parent || void 0
      )
    );
  }
}
function ok2() {
  return true;
}
function looksLikeANode(value2) {
  return value2 !== null && typeof value2 === "object" && "type" in value2;
}

// node_modules/unist-util-visit-parents/lib/color.node.js
function color(d) {
  return "\x1B[33m" + d + "\x1B[39m";
}

// node_modules/unist-util-visit-parents/lib/index.js
var empty = [];
var CONTINUE = true;
var EXIT = false;
var SKIP = "skip";
function visitParents(tree, test, visitor, reverse) {
  let check;
  if (typeof test === "function" && typeof visitor !== "function") {
    reverse = visitor;
    visitor = test;
  } else {
    check = test;
  }
  const is2 = convert(check);
  const step = reverse ? -1 : 1;
  factory(tree, void 0, [])();
  function factory(node2, index2, parents) {
    const value2 = (
      /** @type {Record<string, unknown>} */
      node2 && typeof node2 === "object" ? node2 : {}
    );
    if (typeof value2.type === "string") {
      const name = (
        // `hast`
        typeof value2.tagName === "string" ? value2.tagName : (
          // `xast`
          typeof value2.name === "string" ? value2.name : void 0
        )
      );
      Object.defineProperty(visit, "name", {
        value: "node (" + color(node2.type + (name ? "<" + name + ">" : "")) + ")"
      });
    }
    return visit;
    function visit() {
      let result = empty;
      let subresult;
      let offset;
      let grandparents;
      if (!test || is2(node2, index2, parents[parents.length - 1] || void 0)) {
        result = toResult(visitor(node2, parents));
        if (result[0] === EXIT) {
          return result;
        }
      }
      if ("children" in node2 && node2.children) {
        const nodeAsParent = (
          /** @type {UnistParent} */
          node2
        );
        if (nodeAsParent.children && result[0] !== SKIP) {
          offset = (reverse ? nodeAsParent.children.length : -1) + step;
          grandparents = parents.concat(nodeAsParent);
          while (offset > -1 && offset < nodeAsParent.children.length) {
            const child = nodeAsParent.children[offset];
            subresult = factory(child, offset, grandparents)();
            if (subresult[0] === EXIT) {
              return subresult;
            }
            offset = typeof subresult[1] === "number" ? subresult[1] : offset + step;
          }
        }
      }
      return result;
    }
  }
}
function toResult(value2) {
  if (Array.isArray(value2)) {
    return value2;
  }
  if (typeof value2 === "number") {
    return [CONTINUE, value2];
  }
  return value2 === null || value2 === void 0 ? empty : [value2];
}

// node_modules/mdast-util-find-and-replace/lib/index.js
function findAndReplace(tree, list2, options) {
  const settings = options || {};
  const ignored = convert(settings.ignore || []);
  const pairs = toPairs(list2);
  let pairIndex = -1;
  while (++pairIndex < pairs.length) {
    visitParents(tree, "text", visitor);
  }
  function visitor(node2, parents) {
    let index2 = -1;
    let grandparent;
    while (++index2 < parents.length) {
      const parent = parents[index2];
      const siblings = grandparent ? grandparent.children : void 0;
      if (ignored(
        parent,
        siblings ? siblings.indexOf(parent) : void 0,
        grandparent
      )) {
        return;
      }
      grandparent = parent;
    }
    if (grandparent) {
      return handler(node2, parents);
    }
  }
  function handler(node2, parents) {
    const parent = parents[parents.length - 1];
    const find = pairs[pairIndex][0];
    const replace2 = pairs[pairIndex][1];
    let start = 0;
    const siblings = parent.children;
    const index2 = siblings.indexOf(node2);
    let change = false;
    let nodes = [];
    find.lastIndex = 0;
    let match = find.exec(node2.value);
    while (match) {
      const position2 = match.index;
      const matchObject = {
        index: match.index,
        input: match.input,
        stack: [...parents, node2]
      };
      let value2 = replace2(...match, matchObject);
      if (typeof value2 === "string") {
        value2 = value2.length > 0 ? { type: "text", value: value2 } : void 0;
      }
      if (value2 === false) {
        find.lastIndex = position2 + 1;
      } else {
        if (start !== position2) {
          nodes.push({
            type: "text",
            value: node2.value.slice(start, position2)
          });
        }
        if (Array.isArray(value2)) {
          nodes.push(...value2);
        } else if (value2) {
          nodes.push(value2);
        }
        start = position2 + match[0].length;
        change = true;
      }
      if (!find.global) {
        break;
      }
      match = find.exec(node2.value);
    }
    if (change) {
      if (start < node2.value.length) {
        nodes.push({ type: "text", value: node2.value.slice(start) });
      }
      parent.children.splice(index2, 1, ...nodes);
    } else {
      nodes = [node2];
    }
    return index2 + nodes.length;
  }
}
function toPairs(tupleOrList) {
  const result = [];
  if (!Array.isArray(tupleOrList)) {
    throw new TypeError("Expected find and replace tuple or list of tuples");
  }
  const list2 = !tupleOrList[0] || Array.isArray(tupleOrList[0]) ? tupleOrList : [tupleOrList];
  let index2 = -1;
  while (++index2 < list2.length) {
    const tuple = list2[index2];
    result.push([toExpression(tuple[0]), toFunction(tuple[1])]);
  }
  return result;
}
function toExpression(find) {
  return typeof find === "string" ? new RegExp(escapeStringRegexp(find), "g") : find;
}
function toFunction(replace2) {
  return typeof replace2 === "function" ? replace2 : function() {
    return replace2;
  };
}

// node_modules/mdast-util-gfm-autolink-literal/lib/index.js
function gfmAutolinkLiteralFromMarkdown() {
  return {
    transforms: [transformGfmAutolinkLiterals],
    enter: {
      literalAutolink: enterLiteralAutolink,
      literalAutolinkEmail: enterLiteralAutolinkValue,
      literalAutolinkHttp: enterLiteralAutolinkValue,
      literalAutolinkWww: enterLiteralAutolinkValue
    },
    exit: {
      literalAutolink: exitLiteralAutolink,
      literalAutolinkEmail: exitLiteralAutolinkEmail,
      literalAutolinkHttp: exitLiteralAutolinkHttp,
      literalAutolinkWww: exitLiteralAutolinkWww
    }
  };
}
function enterLiteralAutolink(token) {
  this.enter({ type: "link", title: null, url: "", children: [] }, token);
}
function enterLiteralAutolinkValue(token) {
  this.config.enter.autolinkProtocol.call(this, token);
}
function exitLiteralAutolinkHttp(token) {
  this.config.exit.autolinkProtocol.call(this, token);
}
function exitLiteralAutolinkWww(token) {
  this.config.exit.data.call(this, token);
  const node2 = this.stack[this.stack.length - 1];
  ok(node2.type === "link");
  node2.url = "http://" + this.sliceSerialize(token);
}
function exitLiteralAutolinkEmail(token) {
  this.config.exit.autolinkEmail.call(this, token);
}
function exitLiteralAutolink(token) {
  this.exit(token);
}
function transformGfmAutolinkLiterals(tree) {
  findAndReplace(
    tree,
    [
      [/(https?:\/\/|www(?=\.))([-.\w]+)([^ \t\r\n]*)/gi, findUrl],
      [new RegExp("(?<=^|\\s|\\p{P}|\\p{S})([-.\\w+]+)@([-\\w]+(?:\\.[-\\w]+)+)", "gu"), findEmail]
    ],
    { ignore: ["link", "linkReference"] }
  );
}
function findUrl(_, protocol, domain2, path2, match) {
  let prefix = "";
  if (!previous2(match)) {
    return false;
  }
  if (/^w/i.test(protocol)) {
    domain2 = protocol + domain2;
    protocol = "";
    prefix = "http://";
  }
  if (!isCorrectDomain(domain2)) {
    return false;
  }
  const parts = splitUrl(domain2 + path2);
  if (!parts[0]) return false;
  const result = {
    type: "link",
    title: null,
    url: prefix + protocol + parts[0],
    children: [{ type: "text", value: protocol + parts[0] }]
  };
  if (parts[1]) {
    return [result, { type: "text", value: parts[1] }];
  }
  return result;
}
function findEmail(_, atext, label, match) {
  if (
    // Not an expected previous character.
    !previous2(match, true) || // Label ends in not allowed character.
    /[-\d_]$/.test(label)
  ) {
    return false;
  }
  return {
    type: "link",
    title: null,
    url: "mailto:" + atext + "@" + label,
    children: [{ type: "text", value: atext + "@" + label }]
  };
}
function isCorrectDomain(domain2) {
  const parts = domain2.split(".");
  if (parts.length < 2 || parts[parts.length - 1] && (/_/.test(parts[parts.length - 1]) || !/[a-zA-Z\d]/.test(parts[parts.length - 1])) || parts[parts.length - 2] && (/_/.test(parts[parts.length - 2]) || !/[a-zA-Z\d]/.test(parts[parts.length - 2]))) {
    return false;
  }
  return true;
}
function splitUrl(url) {
  const trailExec = /[!"&'),.:;<>?\]}]+$/.exec(url);
  if (!trailExec) {
    return [url, void 0];
  }
  url = url.slice(0, trailExec.index);
  let trail2 = trailExec[0];
  let closingParenIndex = trail2.indexOf(")");
  const openingParens = ccount(url, "(");
  let closingParens = ccount(url, ")");
  while (closingParenIndex !== -1 && openingParens > closingParens) {
    url += trail2.slice(0, closingParenIndex + 1);
    trail2 = trail2.slice(closingParenIndex + 1);
    closingParenIndex = trail2.indexOf(")");
    closingParens++;
  }
  return [url, trail2];
}
function previous2(match, email) {
  const code2 = match.input.charCodeAt(match.index - 1);
  return (match.index === 0 || unicodeWhitespace(code2) || unicodePunctuation(code2)) && // If it’s an email, the previous character should not be a slash.
  (!email || code2 !== 47);
}

// node_modules/mdast-util-gfm-footnote/lib/index.js
footnoteReference.peek = footnoteReferencePeek;
function enterFootnoteCallString() {
  this.buffer();
}
function enterFootnoteCall(token) {
  this.enter({ type: "footnoteReference", identifier: "", label: "" }, token);
}
function enterFootnoteDefinitionLabelString() {
  this.buffer();
}
function enterFootnoteDefinition(token) {
  this.enter(
    { type: "footnoteDefinition", identifier: "", label: "", children: [] },
    token
  );
}
function exitFootnoteCallString(token) {
  const label = this.resume();
  const node2 = this.stack[this.stack.length - 1];
  ok(node2.type === "footnoteReference");
  node2.identifier = normalizeIdentifier(
    this.sliceSerialize(token)
  ).toLowerCase();
  node2.label = label;
}
function exitFootnoteCall(token) {
  this.exit(token);
}
function exitFootnoteDefinitionLabelString(token) {
  const label = this.resume();
  const node2 = this.stack[this.stack.length - 1];
  ok(node2.type === "footnoteDefinition");
  node2.identifier = normalizeIdentifier(
    this.sliceSerialize(token)
  ).toLowerCase();
  node2.label = label;
}
function exitFootnoteDefinition(token) {
  this.exit(token);
}
function footnoteReferencePeek() {
  return "[";
}
function footnoteReference(node2, _, state, info) {
  const tracker = state.createTracker(info);
  let value2 = tracker.move("[^");
  const exit3 = state.enter("footnoteReference");
  const subexit = state.enter("reference");
  value2 += tracker.move(
    state.safe(state.associationId(node2), { after: "]", before: value2 })
  );
  subexit();
  exit3();
  value2 += tracker.move("]");
  return value2;
}
function gfmFootnoteFromMarkdown() {
  return {
    enter: {
      gfmFootnoteCallString: enterFootnoteCallString,
      gfmFootnoteCall: enterFootnoteCall,
      gfmFootnoteDefinitionLabelString: enterFootnoteDefinitionLabelString,
      gfmFootnoteDefinition: enterFootnoteDefinition
    },
    exit: {
      gfmFootnoteCallString: exitFootnoteCallString,
      gfmFootnoteCall: exitFootnoteCall,
      gfmFootnoteDefinitionLabelString: exitFootnoteDefinitionLabelString,
      gfmFootnoteDefinition: exitFootnoteDefinition
    }
  };
}

// node_modules/mdast-util-gfm-strikethrough/lib/index.js
handleDelete.attention = attentionDelete;
handleDelete.peek = peekDelete;
function gfmStrikethroughFromMarkdown() {
  return {
    canContainEols: ["delete"],
    enter: { strikethrough: enterStrikethrough },
    exit: { strikethrough: exitStrikethrough }
  };
}
function enterStrikethrough(token) {
  this.enter({ type: "delete", children: [], position: void 0 }, token);
}
function exitStrikethrough(token) {
  this.exit(token);
}
function handleDelete(node2, _, state, info) {
  const tracker = state.createTracker(info);
  const sequence = state.stack.includes("strikethrough") ? "~" : "~~";
  const exit3 = state.enter("strikethrough");
  let value2 = tracker.move(sequence);
  value2 += state.containerPhrasing(node2, {
    ...tracker.current(),
    before: value2,
    after: "~"
  });
  value2 += tracker.move(sequence);
  exit3();
  return value2;
}
function attentionDelete() {
  return { construct: "strikethrough", markers: ["~"], sizes: [2, 1] };
}
function peekDelete() {
  return "~";
}

// node_modules/mdast-util-gfm-table/lib/index.js
function gfmTableFromMarkdown() {
  return {
    enter: {
      table: enterTable,
      tableData: enterCell,
      tableHeader: enterCell,
      tableRow: enterRow
    },
    exit: {
      codeText: exitCodeText,
      table: exitTable,
      tableData: exit2,
      tableHeader: exit2,
      tableRow: exit2
    }
  };
}
function enterTable(token) {
  const align = token._align;
  ok(align, "expected `_align` on table");
  this.enter(
    {
      type: "table",
      align: align.map(function(d) {
        return d === "none" ? null : d;
      }),
      children: []
    },
    token
  );
  this.data.inTable = true;
}
function exitTable(token) {
  this.exit(token);
  this.data.inTable = void 0;
}
function enterRow(token) {
  this.enter({ type: "tableRow", children: [] }, token);
}
function exit2(token) {
  this.exit(token);
}
function enterCell(token) {
  this.enter({ type: "tableCell", children: [] }, token);
}
function exitCodeText(token) {
  let value2 = this.resume();
  if (this.data.inTable) {
    value2 = value2.replace(/\\([\\|])/g, replace);
  }
  const node2 = this.stack[this.stack.length - 1];
  ok(node2.type === "inlineCode");
  node2.value = value2;
  this.exit(token);
}
function replace($0, $1) {
  return $1 === "|" ? $1 : $0;
}

// node_modules/mdast-util-gfm-task-list-item/lib/index.js
function gfmTaskListItemFromMarkdown() {
  return {
    exit: {
      taskListCheckValueChecked: exitCheck,
      taskListCheckValueUnchecked: exitCheck,
      paragraph: exitParagraphWithTaskListItem
    }
  };
}
function exitCheck(token) {
  const node2 = this.stack[this.stack.length - 2];
  ok(node2.type === "listItem");
  node2.checked = token.type === "taskListCheckValueChecked";
}
function exitParagraphWithTaskListItem(token) {
  const parent = this.stack[this.stack.length - 2];
  if (parent && parent.type === "listItem" && typeof parent.checked === "boolean") {
    const node2 = this.stack[this.stack.length - 1];
    ok(node2.type === "paragraph");
    const head = node2.children[0];
    if (head && head.type === "text") {
      const siblings = parent.children;
      let index2 = -1;
      let firstParaghraph;
      while (++index2 < siblings.length) {
        const sibling = siblings[index2];
        if (sibling.type === "paragraph") {
          firstParaghraph = sibling;
          break;
        }
      }
      if (firstParaghraph === node2) {
        head.value = head.value.slice(1);
        if (head.value.length === 0) {
          node2.children.shift();
        } else if (node2.position && head.position && typeof head.position.start.offset === "number") {
          head.position.start.column++;
          head.position.start.offset++;
          node2.position.start = Object.assign({}, head.position.start);
        }
      }
    }
  }
  this.exit(token);
}

// node_modules/mdast-util-gfm/lib/index.js
function gfmFromMarkdown() {
  return [
    gfmAutolinkLiteralFromMarkdown(),
    gfmFootnoteFromMarkdown(),
    gfmStrikethroughFromMarkdown(),
    gfmTableFromMarkdown(),
    gfmTaskListItemFromMarkdown()
  ];
}

// node_modules/micromark-extension-gfm-autolink-literal/lib/syntax.js
var wwwPrefix = {
  tokenize: tokenizeWwwPrefix,
  partial: true
};
var domain = {
  tokenize: tokenizeDomain,
  partial: true
};
var path = {
  tokenize: tokenizePath,
  partial: true
};
var trail = {
  tokenize: tokenizeTrail,
  partial: true
};
var emailDomainDotTrail = {
  tokenize: tokenizeEmailDomainDotTrail,
  partial: true
};
var wwwAutolink = {
  name: "wwwAutolink",
  tokenize: tokenizeWwwAutolink,
  previous: previousWww
};
var protocolAutolink = {
  name: "protocolAutolink",
  tokenize: tokenizeProtocolAutolink,
  previous: previousProtocol
};
var emailAutolink = {
  name: "emailAutolink",
  tokenize: tokenizeEmailAutolink,
  previous: previousEmail
};
var text3 = {};
function gfmAutolinkLiteral() {
  return {
    text: text3
  };
}
var code = 48;
while (code < 123) {
  text3[code] = emailAutolink;
  code++;
  if (code === 58) code = 65;
  else if (code === 91) code = 97;
}
text3[43] = emailAutolink;
text3[45] = emailAutolink;
text3[46] = emailAutolink;
text3[95] = emailAutolink;
text3[72] = [emailAutolink, protocolAutolink];
text3[104] = [emailAutolink, protocolAutolink];
text3[87] = [emailAutolink, wwwAutolink];
text3[119] = [emailAutolink, wwwAutolink];
function tokenizeEmailAutolink(effects, ok3, nok) {
  const self = this;
  let dot;
  let data;
  return start;
  function start(code2) {
    if (!gfmAtext(code2) || !previousEmail.call(self, self.previous) || previousUnbalanced(self.events)) {
      return nok(code2);
    }
    effects.enter("literalAutolink");
    effects.enter("literalAutolinkEmail");
    return atext(code2);
  }
  function atext(code2) {
    if (gfmAtext(code2)) {
      effects.consume(code2);
      return atext;
    }
    if (code2 === 64) {
      effects.consume(code2);
      return emailDomain;
    }
    return nok(code2);
  }
  function emailDomain(code2) {
    if (code2 === 46) {
      return effects.check(emailDomainDotTrail, emailDomainAfter, emailDomainDot)(code2);
    }
    if (code2 === 45 || code2 === 95 || asciiAlphanumeric(code2)) {
      data = true;
      effects.consume(code2);
      return emailDomain;
    }
    return emailDomainAfter(code2);
  }
  function emailDomainDot(code2) {
    effects.consume(code2);
    dot = true;
    return emailDomain;
  }
  function emailDomainAfter(code2) {
    if (data && dot && asciiAlpha(self.previous)) {
      effects.exit("literalAutolinkEmail");
      effects.exit("literalAutolink");
      return ok3(code2);
    }
    return nok(code2);
  }
}
function tokenizeWwwAutolink(effects, ok3, nok) {
  const self = this;
  return wwwStart;
  function wwwStart(code2) {
    if (code2 !== 87 && code2 !== 119 || !previousWww.call(self, self.previous) || previousUnbalanced(self.events)) {
      return nok(code2);
    }
    effects.enter("literalAutolink");
    effects.enter("literalAutolinkWww");
    return effects.check(wwwPrefix, effects.attempt(domain, effects.attempt(path, wwwAfter), nok), nok)(code2);
  }
  function wwwAfter(code2) {
    effects.exit("literalAutolinkWww");
    effects.exit("literalAutolink");
    return ok3(code2);
  }
}
function tokenizeProtocolAutolink(effects, ok3, nok) {
  const self = this;
  let buffer = "";
  let seen = false;
  return protocolStart;
  function protocolStart(code2) {
    if ((code2 === 72 || code2 === 104) && previousProtocol.call(self, self.previous) && !previousUnbalanced(self.events)) {
      effects.enter("literalAutolink");
      effects.enter("literalAutolinkHttp");
      buffer += String.fromCodePoint(code2);
      effects.consume(code2);
      return protocolPrefixInside;
    }
    return nok(code2);
  }
  function protocolPrefixInside(code2) {
    if (asciiAlpha(code2) && buffer.length < 5) {
      buffer += String.fromCodePoint(code2);
      effects.consume(code2);
      return protocolPrefixInside;
    }
    if (code2 === 58) {
      const protocol = buffer.toLowerCase();
      if (protocol === "http" || protocol === "https") {
        effects.consume(code2);
        return protocolSlashesInside;
      }
    }
    return nok(code2);
  }
  function protocolSlashesInside(code2) {
    if (code2 === 47) {
      effects.consume(code2);
      if (seen) {
        return afterProtocol;
      }
      seen = true;
      return protocolSlashesInside;
    }
    return nok(code2);
  }
  function afterProtocol(code2) {
    return code2 === null || asciiControl(code2) || markdownLineEndingOrSpace(code2) || unicodeWhitespace(code2) || unicodePunctuation(code2) ? nok(code2) : effects.attempt(domain, effects.attempt(path, protocolAfter), nok)(code2);
  }
  function protocolAfter(code2) {
    effects.exit("literalAutolinkHttp");
    effects.exit("literalAutolink");
    return ok3(code2);
  }
}
function tokenizeWwwPrefix(effects, ok3, nok) {
  let size = 0;
  return wwwPrefixInside;
  function wwwPrefixInside(code2) {
    if ((code2 === 87 || code2 === 119) && size < 3) {
      size++;
      effects.consume(code2);
      return wwwPrefixInside;
    }
    if (code2 === 46 && size === 3) {
      effects.consume(code2);
      return wwwPrefixAfter;
    }
    return nok(code2);
  }
  function wwwPrefixAfter(code2) {
    return code2 === null ? nok(code2) : ok3(code2);
  }
}
function tokenizeDomain(effects, ok3, nok) {
  let underscoreInLastSegment;
  let underscoreInLastLastSegment;
  let seen;
  return domainInside;
  function domainInside(code2) {
    if (code2 === 46 || code2 === 95) {
      return effects.check(trail, domainAfter, domainAtPunctuation)(code2);
    }
    if (code2 === null || markdownLineEndingOrSpace(code2) || unicodeWhitespace(code2) || code2 !== 45 && unicodePunctuation(code2)) {
      return domainAfter(code2);
    }
    seen = true;
    effects.consume(code2);
    return domainInside;
  }
  function domainAtPunctuation(code2) {
    if (code2 === 95) {
      underscoreInLastSegment = true;
    } else {
      underscoreInLastLastSegment = underscoreInLastSegment;
      underscoreInLastSegment = void 0;
    }
    effects.consume(code2);
    return domainInside;
  }
  function domainAfter(code2) {
    if (underscoreInLastLastSegment || underscoreInLastSegment || !seen) {
      return nok(code2);
    }
    return ok3(code2);
  }
}
function tokenizePath(effects, ok3) {
  let sizeOpen = 0;
  let sizeClose = 0;
  return pathInside;
  function pathInside(code2) {
    if (code2 === 40) {
      sizeOpen++;
      effects.consume(code2);
      return pathInside;
    }
    if (code2 === 41 && sizeClose < sizeOpen) {
      return pathAtPunctuation(code2);
    }
    if (code2 === 33 || code2 === 34 || code2 === 38 || code2 === 39 || code2 === 41 || code2 === 42 || code2 === 44 || code2 === 46 || code2 === 58 || code2 === 59 || code2 === 60 || code2 === 63 || code2 === 93 || code2 === 95 || code2 === 126) {
      return effects.check(trail, ok3, pathAtPunctuation)(code2);
    }
    if (code2 === null || markdownLineEndingOrSpace(code2) || unicodeWhitespace(code2)) {
      return ok3(code2);
    }
    effects.consume(code2);
    return pathInside;
  }
  function pathAtPunctuation(code2) {
    if (code2 === 41) {
      sizeClose++;
    }
    effects.consume(code2);
    return pathInside;
  }
}
function tokenizeTrail(effects, ok3, nok) {
  return trail2;
  function trail2(code2) {
    if (code2 === 33 || code2 === 34 || code2 === 39 || code2 === 41 || code2 === 42 || code2 === 44 || code2 === 46 || code2 === 58 || code2 === 59 || code2 === 63 || code2 === 95 || code2 === 126) {
      effects.consume(code2);
      return trail2;
    }
    if (code2 === 38) {
      effects.consume(code2);
      return trailCharacterReferenceStart;
    }
    if (code2 === 93) {
      effects.consume(code2);
      return trailBracketAfter;
    }
    if (
      // `<` is an end.
      code2 === 60 || // So is whitespace.
      code2 === null || markdownLineEndingOrSpace(code2) || unicodeWhitespace(code2)
    ) {
      return ok3(code2);
    }
    return nok(code2);
  }
  function trailBracketAfter(code2) {
    if (code2 === null || code2 === 40 || code2 === 91 || markdownLineEndingOrSpace(code2) || unicodeWhitespace(code2)) {
      return ok3(code2);
    }
    return trail2(code2);
  }
  function trailCharacterReferenceStart(code2) {
    return asciiAlpha(code2) ? trailCharacterReferenceInside(code2) : nok(code2);
  }
  function trailCharacterReferenceInside(code2) {
    if (code2 === 59) {
      effects.consume(code2);
      return trail2;
    }
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      return trailCharacterReferenceInside;
    }
    return nok(code2);
  }
}
function tokenizeEmailDomainDotTrail(effects, ok3, nok) {
  return start;
  function start(code2) {
    effects.consume(code2);
    return after;
  }
  function after(code2) {
    return asciiAlphanumeric(code2) ? nok(code2) : ok3(code2);
  }
}
function previousWww(code2) {
  return code2 === null || code2 === 40 || code2 === 42 || code2 === 95 || code2 === 91 || code2 === 93 || code2 === 126 || markdownLineEndingOrSpace(code2);
}
function previousProtocol(code2) {
  return !asciiAlpha(code2);
}
function previousEmail(code2) {
  return !(code2 === 47 || gfmAtext(code2));
}
function gfmAtext(code2) {
  return code2 === 43 || code2 === 45 || code2 === 46 || code2 === 95 || asciiAlphanumeric(code2);
}
function previousUnbalanced(events) {
  let index2 = events.length;
  let result = false;
  while (index2--) {
    const token = events[index2][1];
    if ((token.type === "labelLink" || token.type === "labelImage") && !token._balanced) {
      result = true;
      break;
    }
    if (token._gfmAutolinkLiteralWalkedInto) {
      result = false;
      break;
    }
  }
  if (events.length > 0 && !result) {
    events[events.length - 1][1]._gfmAutolinkLiteralWalkedInto = true;
  }
  return result;
}

// node_modules/micromark-extension-gfm-footnote/lib/syntax.js
var indent = {
  tokenize: tokenizeIndent2,
  partial: true
};
function gfmFootnote() {
  return {
    document: {
      [91]: {
        name: "gfmFootnoteDefinition",
        tokenize: tokenizeDefinitionStart,
        continuation: {
          tokenize: tokenizeDefinitionContinuation
        },
        exit: gfmFootnoteDefinitionEnd
      }
    },
    text: {
      [91]: {
        name: "gfmFootnoteCall",
        tokenize: tokenizeGfmFootnoteCall
      },
      [93]: {
        name: "gfmPotentialFootnoteCall",
        add: "after",
        tokenize: tokenizePotentialGfmFootnoteCall,
        resolveTo: resolveToPotentialGfmFootnoteCall
      }
    }
  };
}
function tokenizePotentialGfmFootnoteCall(effects, ok3, nok) {
  const self = this;
  let index2 = self.events.length;
  const defined = self.parser.gfmFootnotes || (self.parser.gfmFootnotes = []);
  let labelStart;
  while (index2--) {
    const token = self.events[index2][1];
    if (token.type === "labelImage") {
      labelStart = token;
      break;
    }
    if (token.type === "gfmFootnoteCall" || token.type === "labelLink" || token.type === "label" || token.type === "image" || token.type === "link") {
      break;
    }
  }
  return start;
  function start(code2) {
    if (!labelStart || !labelStart._balanced) {
      return nok(code2);
    }
    const id = normalizeIdentifier(self.sliceSerialize({
      start: labelStart.end,
      end: self.now()
    }));
    if (id.codePointAt(0) !== 94 || !defined.includes(id.slice(1))) {
      return nok(code2);
    }
    effects.enter("gfmFootnoteCallLabelMarker");
    effects.consume(code2);
    effects.exit("gfmFootnoteCallLabelMarker");
    return ok3(code2);
  }
}
function resolveToPotentialGfmFootnoteCall(events, context) {
  let index2 = events.length;
  let labelStart;
  while (index2--) {
    if (events[index2][1].type === "labelImage" && events[index2][0] === "enter") {
      labelStart = events[index2][1];
      break;
    }
  }
  events[index2 + 1][1].type = "data";
  events[index2 + 3][1].type = "gfmFootnoteCallLabelMarker";
  const call = {
    type: "gfmFootnoteCall",
    start: Object.assign({}, events[index2 + 3][1].start),
    end: Object.assign({}, events[events.length - 1][1].end)
  };
  const marker = {
    type: "gfmFootnoteCallMarker",
    start: Object.assign({}, events[index2 + 3][1].end),
    end: Object.assign({}, events[index2 + 3][1].end)
  };
  marker.end.column++;
  marker.end.offset++;
  marker.end._bufferIndex++;
  const string3 = {
    type: "gfmFootnoteCallString",
    start: Object.assign({}, marker.end),
    end: Object.assign({}, events[events.length - 1][1].start)
  };
  const chunk = {
    type: "chunkString",
    contentType: "string",
    start: Object.assign({}, string3.start),
    end: Object.assign({}, string3.end)
  };
  const replacement = [
    // Take the `labelImageMarker` (now `data`, the `!`)
    events[index2 + 1],
    events[index2 + 2],
    ["enter", call, context],
    // The `[`
    events[index2 + 3],
    events[index2 + 4],
    // The `^`.
    ["enter", marker, context],
    ["exit", marker, context],
    // Everything in between.
    ["enter", string3, context],
    ["enter", chunk, context],
    ["exit", chunk, context],
    ["exit", string3, context],
    // The ending (`]`, properly parsed and labelled).
    events[events.length - 2],
    events[events.length - 1],
    ["exit", call, context]
  ];
  events.splice(index2, events.length - index2 + 1, ...replacement);
  return events;
}
function tokenizeGfmFootnoteCall(effects, ok3, nok) {
  const self = this;
  const defined = self.parser.gfmFootnotes || (self.parser.gfmFootnotes = []);
  let size = 0;
  let data;
  return start;
  function start(code2) {
    effects.enter("gfmFootnoteCall");
    effects.enter("gfmFootnoteCallLabelMarker");
    effects.consume(code2);
    effects.exit("gfmFootnoteCallLabelMarker");
    return callStart;
  }
  function callStart(code2) {
    if (code2 !== 94) return nok(code2);
    effects.enter("gfmFootnoteCallMarker");
    effects.consume(code2);
    effects.exit("gfmFootnoteCallMarker");
    effects.enter("gfmFootnoteCallString");
    effects.enter("chunkString").contentType = "string";
    return callData;
  }
  function callData(code2) {
    if (
      // Too long.
      size > 999 || // Closing brace with nothing.
      code2 === 93 && !data || // Space or tab is not supported by GFM for some reason.
      // `\n` and `[` not being supported makes sense.
      code2 === null || code2 === 91 || markdownLineEndingOrSpace(code2)
    ) {
      return nok(code2);
    }
    if (code2 === 93) {
      effects.exit("chunkString");
      const token = effects.exit("gfmFootnoteCallString");
      if (!defined.includes(normalizeIdentifier(self.sliceSerialize(token)))) {
        return nok(code2);
      }
      effects.enter("gfmFootnoteCallLabelMarker");
      effects.consume(code2);
      effects.exit("gfmFootnoteCallLabelMarker");
      effects.exit("gfmFootnoteCall");
      return ok3;
    }
    if (!markdownLineEndingOrSpace(code2)) {
      data = true;
    }
    size++;
    effects.consume(code2);
    return code2 === 92 ? callEscape : callData;
  }
  function callEscape(code2) {
    if (code2 === 91 || code2 === 92 || code2 === 93) {
      effects.consume(code2);
      size++;
      return callData;
    }
    return callData(code2);
  }
}
function tokenizeDefinitionStart(effects, ok3, nok) {
  const self = this;
  const defined = self.parser.gfmFootnotes || (self.parser.gfmFootnotes = []);
  let identifier;
  let size = 0;
  let data;
  return start;
  function start(code2) {
    effects.enter("gfmFootnoteDefinition")._container = true;
    effects.enter("gfmFootnoteDefinitionLabel");
    effects.enter("gfmFootnoteDefinitionLabelMarker");
    effects.consume(code2);
    effects.exit("gfmFootnoteDefinitionLabelMarker");
    return labelAtMarker;
  }
  function labelAtMarker(code2) {
    if (code2 === 94) {
      effects.enter("gfmFootnoteDefinitionMarker");
      effects.consume(code2);
      effects.exit("gfmFootnoteDefinitionMarker");
      effects.enter("gfmFootnoteDefinitionLabelString");
      effects.enter("chunkString").contentType = "string";
      return labelInside;
    }
    return nok(code2);
  }
  function labelInside(code2) {
    if (
      // Too long.
      size > 999 || // Closing brace with nothing.
      code2 === 93 && !data || // Space or tab is not supported by GFM for some reason.
      // `\n` and `[` not being supported makes sense.
      code2 === null || code2 === 91 || markdownLineEndingOrSpace(code2)
    ) {
      return nok(code2);
    }
    if (code2 === 93) {
      effects.exit("chunkString");
      const token = effects.exit("gfmFootnoteDefinitionLabelString");
      identifier = normalizeIdentifier(self.sliceSerialize(token));
      effects.enter("gfmFootnoteDefinitionLabelMarker");
      effects.consume(code2);
      effects.exit("gfmFootnoteDefinitionLabelMarker");
      effects.exit("gfmFootnoteDefinitionLabel");
      return labelAfter;
    }
    if (!markdownLineEndingOrSpace(code2)) {
      data = true;
    }
    size++;
    effects.consume(code2);
    return code2 === 92 ? labelEscape : labelInside;
  }
  function labelEscape(code2) {
    if (code2 === 91 || code2 === 92 || code2 === 93) {
      effects.consume(code2);
      size++;
      return labelInside;
    }
    return labelInside(code2);
  }
  function labelAfter(code2) {
    if (code2 === 58) {
      effects.enter("definitionMarker");
      effects.consume(code2);
      effects.exit("definitionMarker");
      if (!defined.includes(identifier)) {
        defined.push(identifier);
      }
      return factorySpace(effects, whitespaceAfter, "gfmFootnoteDefinitionWhitespace");
    }
    return nok(code2);
  }
  function whitespaceAfter(code2) {
    return ok3(code2);
  }
}
function tokenizeDefinitionContinuation(effects, ok3, nok) {
  return effects.check(blankLine, ok3, effects.attempt(indent, ok3, nok));
}
function gfmFootnoteDefinitionEnd(effects) {
  effects.exit("gfmFootnoteDefinition");
}
function tokenizeIndent2(effects, ok3, nok) {
  const self = this;
  return factorySpace(effects, afterPrefix, "gfmFootnoteDefinitionIndent", 4 + 1);
  function afterPrefix(code2) {
    const tail = self.events[self.events.length - 1];
    return tail && tail[1].type === "gfmFootnoteDefinitionIndent" && tail[2].sliceSerialize(tail[1], true).length === 4 ? ok3(code2) : nok(code2);
  }
}

// node_modules/micromark-extension-gfm-strikethrough/lib/syntax.js
function gfmStrikethrough(options) {
  const options_ = options || {};
  let single = options_.singleTilde;
  const tokenizer = {
    name: "strikethrough",
    tokenize: tokenizeStrikethrough,
    resolveAll: resolveAllStrikethrough
  };
  if (single === null || single === void 0) {
    single = true;
  }
  return {
    text: {
      [126]: tokenizer
    },
    insideSpan: {
      null: [tokenizer]
    },
    attentionMarkers: {
      null: [126]
    }
  };
  function resolveAllStrikethrough(events, context) {
    let index2 = -1;
    while (++index2 < events.length) {
      if (events[index2][0] === "enter" && events[index2][1].type === "strikethroughSequenceTemporary" && events[index2][1]._close) {
        let open = index2;
        while (open--) {
          if (events[open][0] === "exit" && events[open][1].type === "strikethroughSequenceTemporary" && events[open][1]._open && // If the sizes are the same:
          events[index2][1].end.offset - events[index2][1].start.offset === events[open][1].end.offset - events[open][1].start.offset) {
            events[index2][1].type = "strikethroughSequence";
            events[open][1].type = "strikethroughSequence";
            const strikethrough = {
              type: "strikethrough",
              start: Object.assign({}, events[open][1].start),
              end: Object.assign({}, events[index2][1].end)
            };
            const text4 = {
              type: "strikethroughText",
              start: Object.assign({}, events[open][1].end),
              end: Object.assign({}, events[index2][1].start)
            };
            const nextEvents = [["enter", strikethrough, context], ["enter", events[open][1], context], ["exit", events[open][1], context], ["enter", text4, context]];
            const insideSpan2 = context.parser.constructs.insideSpan.null;
            if (insideSpan2) {
              splice(nextEvents, nextEvents.length, 0, resolveAll(insideSpan2, events.slice(open + 1, index2), context));
            }
            splice(nextEvents, nextEvents.length, 0, [["exit", text4, context], ["enter", events[index2][1], context], ["exit", events[index2][1], context], ["exit", strikethrough, context]]);
            splice(events, open - 1, index2 - open + 3, nextEvents);
            index2 = open + nextEvents.length - 2;
            break;
          }
        }
      }
    }
    index2 = -1;
    while (++index2 < events.length) {
      if (events[index2][1].type === "strikethroughSequenceTemporary") {
        events[index2][1].type = "data";
      }
    }
    return events;
  }
  function tokenizeStrikethrough(effects, ok3, nok) {
    const previous3 = this.previous;
    const events = this.events;
    let size = 0;
    return start;
    function start(code2) {
      if (previous3 === 126 && events[events.length - 1][1].type !== "characterEscape") {
        return nok(code2);
      }
      effects.enter("strikethroughSequenceTemporary");
      return more(code2);
    }
    function more(code2) {
      const before = classifyCharacter(previous3);
      if (code2 === 126) {
        if (size > 1) return nok(code2);
        effects.consume(code2);
        size++;
        return more;
      }
      if (size < 2 && !single) return nok(code2);
      const token = effects.exit("strikethroughSequenceTemporary");
      const after = classifyCharacter(code2);
      token._open = !after || after === 2 && Boolean(before);
      token._close = !before || before === 2 && Boolean(after);
      return ok3(code2);
    }
  }
}

// node_modules/micromark-extension-gfm-table/lib/edit-map.js
var EditMap2 = class {
  /**
   * Create a new edit map.
   */
  constructor() {
    this.map = [];
    this.index = /* @__PURE__ */ new Map();
  }
  /**
   * Create an edit: a remove and/or add at a certain place.
   *
   * @param {number} index
   *   Index at which to apply the edit.
   * @param {number} remove
   *   Count of items to remove at the index.
   * @param {Array<Event>} add
   *   Items to add at the index.
   * @returns {undefined}
   *   Nothing.
   */
  add(index2, remove, add) {
    addImplementation2(this, index2, remove, add);
  }
  // To do: add this when moving to `micromark`.
  // /**
  //  * Create an edit: but insert `add` before existing additions.
  //  *
  //  * @param {number} index
  //  * @param {number} remove
  //  * @param {Array<Event>} add
  //  * @returns {undefined}
  //  */
  // addBefore(index, remove, add) {
  //   addImplementation(this, index, remove, add, true)
  // }
  /**
   * Done, change the events.
   *
   * @param {Array<Event>} events
   *   List of events to apply the edits to.
   * @returns {undefined}
   *   Nothing.
   */
  consume(events) {
    this.map.sort(function(a2, b) {
      return a2[0] - b[0];
    });
    if (this.map.length === 0) {
      return;
    }
    let index2 = this.map.length;
    const vecs = [];
    while (index2 > 0) {
      index2 -= 1;
      vecs.push(events.slice(this.map[index2][0] + this.map[index2][1]), this.map[index2][2]);
      events.length = this.map[index2][0];
    }
    vecs.push(events.slice());
    events.length = 0;
    let slice = vecs.pop();
    while (slice) {
      for (const element of slice) {
        events.push(element);
      }
      slice = vecs.pop();
    }
    this.map.length = 0;
    this.index.clear();
  }
};
function addImplementation2(editMap, at, remove, add) {
  if (remove === 0 && add.length === 0) {
    return;
  }
  const existing = editMap.index.get(at);
  if (existing) {
    existing[1] += remove;
    existing[2].push(...add);
    return;
  }
  const change = [at, remove, add];
  editMap.map.push(change);
  editMap.index.set(at, change);
}

// node_modules/micromark-extension-gfm-table/lib/infer.js
function gfmTableAlign(events, index2) {
  let inDelimiterRow = false;
  const align = [];
  while (index2 < events.length) {
    const event = events[index2];
    if (inDelimiterRow) {
      if (event[0] === "enter") {
        if (event[1].type === "tableContent") {
          align.push(events[index2 + 1][1].type === "tableDelimiterMarker" ? "left" : "none");
        }
      } else if (event[1].type === "tableContent") {
        if (events[index2 - 1][1].type === "tableDelimiterMarker") {
          const alignIndex = align.length - 1;
          align[alignIndex] = align[alignIndex] === "left" ? "center" : "right";
        }
      } else if (event[1].type === "tableDelimiterRow") {
        break;
      }
    } else if (event[0] === "enter" && event[1].type === "tableDelimiterRow") {
      inDelimiterRow = true;
    }
    index2 += 1;
  }
  return align;
}

// node_modules/micromark-extension-gfm-table/lib/syntax.js
function gfmTable() {
  return {
    flow: {
      null: {
        name: "table",
        tokenize: tokenizeTable,
        resolveAll: resolveTable
      }
    }
  };
}
function tokenizeTable(effects, ok3, nok) {
  const self = this;
  let size = 0;
  let sizeB = 0;
  let seen;
  return start;
  function start(code2) {
    let index2 = self.events.length - 1;
    while (index2 > -1) {
      const {
        type
      } = self.events[index2][1];
      if (type === "lineEnding" || // Note: markdown-rs uses `whitespace` instead of `linePrefix`
      type === "linePrefix") {
        index2--;
      } else {
        break;
      }
    }
    const tail = index2 > -1 ? self.events[index2][1].type : null;
    const next = tail === "tableHead" || tail === "tableRow" ? bodyRowStart : headRowBefore;
    if (next === bodyRowStart && self.parser.lazy[self.now().line]) {
      return nok(code2);
    }
    return next(code2);
  }
  function headRowBefore(code2) {
    effects.enter("tableHead");
    effects.enter("tableRow");
    return headRowStart(code2);
  }
  function headRowStart(code2) {
    if (code2 === 124) {
      return headRowBreak(code2);
    }
    seen = true;
    sizeB += 1;
    return headRowBreak(code2);
  }
  function headRowBreak(code2) {
    if (code2 === null) {
      return nok(code2);
    }
    if (markdownLineEnding(code2)) {
      if (sizeB > 1) {
        sizeB = 0;
        self.interrupt = true;
        effects.exit("tableRow");
        effects.enter("lineEnding");
        effects.consume(code2);
        effects.exit("lineEnding");
        return headDelimiterStart;
      }
      return nok(code2);
    }
    if (markdownSpace(code2)) {
      return factorySpace(effects, headRowBreak, "whitespace")(code2);
    }
    sizeB += 1;
    if (seen) {
      seen = false;
      size += 1;
    }
    if (code2 === 124) {
      effects.enter("tableCellDivider");
      effects.consume(code2);
      effects.exit("tableCellDivider");
      seen = true;
      return headRowBreak;
    }
    effects.enter("data");
    return headRowData(code2);
  }
  function headRowData(code2) {
    if (code2 === null || code2 === 124 || markdownLineEndingOrSpace(code2)) {
      effects.exit("data");
      return headRowBreak(code2);
    }
    effects.consume(code2);
    return code2 === 92 ? headRowEscape : headRowData;
  }
  function headRowEscape(code2) {
    if (code2 === 92 || code2 === 124) {
      effects.consume(code2);
      return headRowData;
    }
    return headRowData(code2);
  }
  function headDelimiterStart(code2) {
    self.interrupt = false;
    if (self.parser.lazy[self.now().line]) {
      return nok(code2);
    }
    effects.enter("tableDelimiterRow");
    seen = false;
    if (markdownSpace(code2)) {
      return factorySpace(effects, headDelimiterBefore, "linePrefix", self.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(code2);
    }
    return headDelimiterBefore(code2);
  }
  function headDelimiterBefore(code2) {
    if (code2 === 45 || code2 === 58) {
      return headDelimiterValueBefore(code2);
    }
    if (code2 === 124) {
      seen = true;
      effects.enter("tableCellDivider");
      effects.consume(code2);
      effects.exit("tableCellDivider");
      return headDelimiterCellBefore;
    }
    return headDelimiterNok(code2);
  }
  function headDelimiterCellBefore(code2) {
    if (markdownSpace(code2)) {
      return factorySpace(effects, headDelimiterValueBefore, "whitespace")(code2);
    }
    return headDelimiterValueBefore(code2);
  }
  function headDelimiterValueBefore(code2) {
    if (code2 === 58) {
      sizeB += 1;
      seen = true;
      effects.enter("tableDelimiterMarker");
      effects.consume(code2);
      effects.exit("tableDelimiterMarker");
      return headDelimiterLeftAlignmentAfter;
    }
    if (code2 === 45) {
      sizeB += 1;
      return headDelimiterLeftAlignmentAfter(code2);
    }
    if (code2 === null || markdownLineEnding(code2)) {
      return headDelimiterCellAfter(code2);
    }
    return headDelimiterNok(code2);
  }
  function headDelimiterLeftAlignmentAfter(code2) {
    if (code2 === 45) {
      effects.enter("tableDelimiterFiller");
      return headDelimiterFiller(code2);
    }
    return headDelimiterNok(code2);
  }
  function headDelimiterFiller(code2) {
    if (code2 === 45) {
      effects.consume(code2);
      return headDelimiterFiller;
    }
    if (code2 === 58) {
      seen = true;
      effects.exit("tableDelimiterFiller");
      effects.enter("tableDelimiterMarker");
      effects.consume(code2);
      effects.exit("tableDelimiterMarker");
      return headDelimiterRightAlignmentAfter;
    }
    effects.exit("tableDelimiterFiller");
    return headDelimiterRightAlignmentAfter(code2);
  }
  function headDelimiterRightAlignmentAfter(code2) {
    if (markdownSpace(code2)) {
      return factorySpace(effects, headDelimiterCellAfter, "whitespace")(code2);
    }
    return headDelimiterCellAfter(code2);
  }
  function headDelimiterCellAfter(code2) {
    if (code2 === 124) {
      return headDelimiterBefore(code2);
    }
    if (code2 === null || markdownLineEnding(code2)) {
      if (!seen || size !== sizeB) {
        return headDelimiterNok(code2);
      }
      effects.exit("tableDelimiterRow");
      effects.exit("tableHead");
      return ok3(code2);
    }
    return headDelimiterNok(code2);
  }
  function headDelimiterNok(code2) {
    return nok(code2);
  }
  function bodyRowStart(code2) {
    effects.enter("tableRow");
    return bodyRowBreak(code2);
  }
  function bodyRowBreak(code2) {
    if (code2 === 124) {
      effects.enter("tableCellDivider");
      effects.consume(code2);
      effects.exit("tableCellDivider");
      return bodyRowBreak;
    }
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("tableRow");
      return ok3(code2);
    }
    if (markdownSpace(code2)) {
      return factorySpace(effects, bodyRowBreak, "whitespace")(code2);
    }
    effects.enter("data");
    return bodyRowData(code2);
  }
  function bodyRowData(code2) {
    if (code2 === null || code2 === 124 || markdownLineEndingOrSpace(code2)) {
      effects.exit("data");
      return bodyRowBreak(code2);
    }
    effects.consume(code2);
    return code2 === 92 ? bodyRowEscape : bodyRowData;
  }
  function bodyRowEscape(code2) {
    if (code2 === 92 || code2 === 124) {
      effects.consume(code2);
      return bodyRowData;
    }
    return bodyRowData(code2);
  }
}
function resolveTable(events, context) {
  let index2 = -1;
  let inFirstCellAwaitingPipe = true;
  let rowKind = 0;
  let lastCell = [0, 0, 0, 0];
  let cell = [0, 0, 0, 0];
  let afterHeadAwaitingFirstBodyRow = false;
  let lastTableEnd = 0;
  let currentTable;
  let currentBody;
  let currentCell;
  const map = new EditMap2();
  while (++index2 < events.length) {
    const event = events[index2];
    const token = event[1];
    if (event[0] === "enter") {
      if (token.type === "tableHead") {
        afterHeadAwaitingFirstBodyRow = false;
        if (lastTableEnd !== 0) {
          flushTableEnd(map, context, lastTableEnd, currentTable, currentBody);
          currentBody = void 0;
          lastTableEnd = 0;
        }
        currentTable = {
          type: "table",
          start: Object.assign({}, token.start),
          // Note: correct end is set later.
          end: Object.assign({}, token.end)
        };
        map.add(index2, 0, [["enter", currentTable, context]]);
      } else if (token.type === "tableRow" || token.type === "tableDelimiterRow") {
        inFirstCellAwaitingPipe = true;
        currentCell = void 0;
        lastCell = [0, 0, 0, 0];
        cell = [0, index2 + 1, 0, 0];
        if (afterHeadAwaitingFirstBodyRow) {
          afterHeadAwaitingFirstBodyRow = false;
          currentBody = {
            type: "tableBody",
            start: Object.assign({}, token.start),
            // Note: correct end is set later.
            end: Object.assign({}, token.end)
          };
          map.add(index2, 0, [["enter", currentBody, context]]);
        }
        rowKind = token.type === "tableDelimiterRow" ? 2 : currentBody ? 3 : 1;
      } else if (rowKind && (token.type === "data" || token.type === "tableDelimiterMarker" || token.type === "tableDelimiterFiller")) {
        inFirstCellAwaitingPipe = false;
        if (cell[2] === 0) {
          if (lastCell[1] !== 0) {
            cell[0] = cell[1];
            currentCell = flushCell(map, context, lastCell, rowKind, void 0, currentCell);
            lastCell = [0, 0, 0, 0];
          }
          cell[2] = index2;
        }
      } else if (token.type === "tableCellDivider") {
        if (inFirstCellAwaitingPipe) {
          inFirstCellAwaitingPipe = false;
        } else {
          if (lastCell[1] !== 0) {
            cell[0] = cell[1];
            currentCell = flushCell(map, context, lastCell, rowKind, void 0, currentCell);
          }
          lastCell = cell;
          cell = [lastCell[1], index2, 0, 0];
        }
      }
    } else if (token.type === "tableHead") {
      afterHeadAwaitingFirstBodyRow = true;
      lastTableEnd = index2;
    } else if (token.type === "tableRow" || token.type === "tableDelimiterRow") {
      lastTableEnd = index2;
      if (lastCell[1] !== 0) {
        cell[0] = cell[1];
        currentCell = flushCell(map, context, lastCell, rowKind, index2, currentCell);
      } else if (cell[1] !== 0) {
        currentCell = flushCell(map, context, cell, rowKind, index2, currentCell);
      }
      rowKind = 0;
    } else if (rowKind && (token.type === "data" || token.type === "tableDelimiterMarker" || token.type === "tableDelimiterFiller")) {
      cell[3] = index2;
    }
  }
  if (lastTableEnd !== 0) {
    flushTableEnd(map, context, lastTableEnd, currentTable, currentBody);
  }
  map.consume(context.events);
  index2 = -1;
  while (++index2 < context.events.length) {
    const event = context.events[index2];
    if (event[0] === "enter" && event[1].type === "table") {
      event[1]._align = gfmTableAlign(context.events, index2);
    }
  }
  return events;
}
function flushCell(map, context, range, rowKind, rowEnd, previousCell) {
  const groupName = rowKind === 1 ? "tableHeader" : rowKind === 2 ? "tableDelimiter" : "tableData";
  const valueName = "tableContent";
  if (range[0] !== 0) {
    previousCell.end = Object.assign({}, getPoint(context.events, range[0]));
    map.add(range[0], 0, [["exit", previousCell, context]]);
  }
  const now = getPoint(context.events, range[1]);
  previousCell = {
    type: groupName,
    start: Object.assign({}, now),
    // Note: correct end is set later.
    end: Object.assign({}, now)
  };
  map.add(range[1], 0, [["enter", previousCell, context]]);
  if (range[2] !== 0) {
    const relatedStart = getPoint(context.events, range[2]);
    const relatedEnd = getPoint(context.events, range[3]);
    const valueToken = {
      type: valueName,
      start: Object.assign({}, relatedStart),
      end: Object.assign({}, relatedEnd)
    };
    map.add(range[2], 0, [["enter", valueToken, context]]);
    if (rowKind !== 2) {
      const start = context.events[range[2]];
      const end = context.events[range[3]];
      start[1].end = Object.assign({}, end[1].end);
      start[1].type = "chunkText";
      start[1].contentType = "text";
      if (range[3] > range[2] + 1) {
        const a2 = range[2] + 1;
        const b = range[3] - range[2] - 1;
        map.add(a2, b, []);
      }
    }
    map.add(range[3] + 1, 0, [["exit", valueToken, context]]);
  }
  if (rowEnd !== void 0) {
    previousCell.end = Object.assign({}, getPoint(context.events, rowEnd));
    map.add(rowEnd, 0, [["exit", previousCell, context]]);
    previousCell = void 0;
  }
  return previousCell;
}
function flushTableEnd(map, context, index2, table, tableBody) {
  const exits = [];
  const related = getPoint(context.events, index2);
  if (tableBody) {
    tableBody.end = Object.assign({}, related);
    exits.push(["exit", tableBody, context]);
  }
  table.end = Object.assign({}, related);
  exits.push(["exit", table, context]);
  map.add(index2 + 1, 0, exits);
}
function getPoint(events, index2) {
  const event = events[index2];
  const side = event[0] === "enter" ? "start" : "end";
  return event[1][side];
}

// node_modules/micromark-extension-gfm-task-list-item/lib/syntax.js
var tasklistCheck = {
  name: "tasklistCheck",
  tokenize: tokenizeTasklistCheck
};
function gfmTaskListItem() {
  return {
    text: {
      [91]: tasklistCheck
    }
  };
}
function tokenizeTasklistCheck(effects, ok3, nok) {
  const self = this;
  return open;
  function open(code2) {
    if (
      // Exit if there’s stuff before.
      self.previous !== null || // Exit if not in the first content that is the first child of a list
      // item.
      !self._gfmTasklistFirstContentOfListItem
    ) {
      return nok(code2);
    }
    effects.enter("taskListCheck");
    effects.enter("taskListCheckMarker");
    effects.consume(code2);
    effects.exit("taskListCheckMarker");
    return inside;
  }
  function inside(code2) {
    if (markdownLineEndingOrSpace(code2)) {
      effects.enter("taskListCheckValueUnchecked");
      effects.consume(code2);
      effects.exit("taskListCheckValueUnchecked");
      return close2;
    }
    if (code2 === 88 || code2 === 120) {
      effects.enter("taskListCheckValueChecked");
      effects.consume(code2);
      effects.exit("taskListCheckValueChecked");
      return close2;
    }
    return nok(code2);
  }
  function close2(code2) {
    if (code2 === 93) {
      effects.enter("taskListCheckMarker");
      effects.consume(code2);
      effects.exit("taskListCheckMarker");
      effects.exit("taskListCheck");
      return after;
    }
    return nok(code2);
  }
  function after(code2) {
    if (markdownLineEnding(code2)) {
      return ok3(code2);
    }
    if (markdownSpace(code2)) {
      return effects.check({
        tokenize: spaceThenNonSpace
      }, ok3, nok)(code2);
    }
    return nok(code2);
  }
}
function spaceThenNonSpace(effects, ok3, nok) {
  return factorySpace(effects, after, "whitespace");
  function after(code2) {
    return code2 === null ? nok(code2) : ok3(code2);
  }
}

// node_modules/micromark-extension-gfm/index.js
function gfm(options) {
  return combineExtensions([
    gfmAutolinkLiteral(),
    gfmFootnote(),
    gfmStrikethrough(options),
    gfmTable(),
    gfmTaskListItem()
  ]);
}

// src/parse/markdown.ts
var import_yaml2 = __toESM(require_dist(), 1);

// src/parse/aliases.ts
var a = (name, pattern, rest) => ({ name, pattern, ...rest });
var DEPENDENCY_ALIASES = [
  // Payments, messaging, email
  a("Stripe", /\bStripe\b/, { npm: ["stripe", "@stripe/"], pypi: ["stripe"], go: ["github.com/stripe/stripe-go"], gem: ["stripe"], composer: ["stripe/stripe-php"] }),
  a("Twilio", /\bTwilio\b/, { npm: ["twilio"], pypi: ["twilio"], go: ["github.com/twilio/twilio-go"], gem: ["twilio-ruby"], composer: ["twilio/sdk"] }),
  a("SendGrid", /\bSendGrid\b/, { npm: ["@sendgrid/"], pypi: ["sendgrid"], gem: ["sendgrid-ruby"] }),
  a("Mailgun", /\bMailgun\b/, { npm: ["mailgun.js", "mailgun-js"], pypi: ["mailgun"] }),
  a("Resend", /\bResend\b/, { npm: ["resend"], pypi: ["resend"] }),
  a("MJML", /\bMJML\b/, { npm: ["mjml"] }),
  a("Slack", /\bSlack\b/, { npm: ["@slack/"], pypi: ["slack-sdk", "slack_sdk", "slack-bolt"], go: ["github.com/slack-go/slack"] }),
  a("Notion", /\bNotion\b/, { npm: ["@notionhq/client"], pypi: ["notion-client"] }),
  // AI
  a("OpenAI", /\bOpenAI\b/, { npm: ["openai", "@ai-sdk/openai"], pypi: ["openai"], go: ["github.com/openai/openai-go", "github.com/sashabaranov/go-openai"] }),
  a("Anthropic", /\bAnthropic\b/, { npm: ["@anthropic-ai/"], pypi: ["anthropic"], go: ["github.com/anthropics/anthropic-sdk-go"] }),
  a("LangChain", /\bLangChain\b/, { npm: ["langchain", "@langchain/"], pypi: ["langchain"] }),
  // Auth
  a("Cognito", /\bCognito\b/, { npm: ["amazon-cognito-identity-js", "@aws-sdk/client-cognito-identity-provider", "aws-amplify"], pypi: ["boto3"] }),
  a("Auth0", /\bAuth0\b/, { npm: ["@auth0/", "auth0"], pypi: ["auth0-python"] }),
  a("Clerk", /\bClerk\b/, { npm: ["@clerk/"] }),
  a("NextAuth", /\bNextAuth\b|\bAuth\.js\b/, { npm: ["next-auth", "@auth/"] }),
  a("Passport", /\bPassport(?:\.js)?\b/, { npm: ["passport"] }),
  // Observability and product analytics
  a("Sentry", /\bSentry\b/, { npm: ["@sentry/"], pypi: ["sentry-sdk"], go: ["github.com/getsentry/sentry-go"], gem: ["sentry-ruby"] }),
  a("Datadog", /\bDatadog\b/, { npm: ["dd-trace", "@datadog/"], pypi: ["ddtrace", "datadog"], go: ["gopkg.in/DataDog/", "github.com/DataDog/"] }),
  a("PostHog", /\bPostHog\b/, { npm: ["posthog-js", "posthog-node"], pypi: ["posthog"] }),
  a("OpenTelemetry", /\bOpenTelemetry\b/, { npm: ["@opentelemetry/"], pypi: ["opentelemetry-"], go: ["go.opentelemetry.io/"] }),
  a("Segment", /\bSegment\b(?= (?:analytics|events|tracking))/, { npm: ["@segment/", "analytics-node"] }),
  a("Mixpanel", /\bMixpanel\b/, { npm: ["mixpanel", "mixpanel-browser"], pypi: ["mixpanel"] }),
  a("LaunchDarkly", /\bLaunchDarkly\b/, { npm: ["launchdarkly-", "@launchdarkly/"], pypi: ["launchdarkly-server-sdk"] }),
  a("GrowthBook", /\bGrowthBook\b/, { npm: ["@growthbook/"], pypi: ["growthbook"] }),
  // Data stores and queues
  a("PostgreSQL", /\bPostgreSQL\b|\bPostgres\b/, { npm: ["pg", "postgres", "@neondatabase/serverless"], pypi: ["psycopg", "psycopg2", "psycopg2-binary", "asyncpg"], go: ["github.com/lib/pq", "github.com/jackc/pgx"], gem: ["pg"], files: [/(^|\/)(docker-)?compose[\w.-]*\.ya?ml$/] }),
  a("MySQL", /\bMySQL\b/, { npm: ["mysql", "mysql2"], pypi: ["mysqlclient", "pymysql"], go: ["github.com/go-sql-driver/mysql"], gem: ["mysql2"] }),
  a("SQLite", /\bSQLite\b/, { npm: ["sqlite3", "better-sqlite3", "sqlite"], go: ["github.com/mattn/go-sqlite3", "modernc.org/sqlite"], gem: ["sqlite3"] }),
  a("MongoDB", /\bMongoDB\b|\bMongo\b/, { npm: ["mongodb", "mongoose"], pypi: ["pymongo", "motor"], go: ["go.mongodb.org/mongo-driver"], gem: ["mongoid", "mongo"] }),
  a("Redis", /\bRedis\b/, { npm: ["redis", "ioredis", "@redis/"], pypi: ["redis"], go: ["github.com/redis/go-redis", "github.com/go-redis/redis"], gem: ["redis"] }),
  a("BullMQ", /\bBullMQ\b/, { npm: ["bullmq"] }),
  a("Kafka", /\bKafka\b/, { npm: ["kafkajs", "@confluentinc/"], pypi: ["kafka-python", "confluent-kafka"], go: ["github.com/segmentio/kafka-go", "github.com/IBM/sarama", "github.com/confluentinc/"] }),
  a("RabbitMQ", /\bRabbitMQ\b/, { npm: ["amqplib"], pypi: ["pika", "aio-pika"], go: ["github.com/rabbitmq/amqp091-go"] }),
  a("Elasticsearch", /\bElasticsearch\b/, { npm: ["@elastic/elasticsearch"], pypi: ["elasticsearch"] }),
  a("OpenSearch", /\bOpenSearch\b/, { npm: ["@opensearch-project/opensearch"], pypi: ["opensearch-py"] }),
  a("Supabase", /\bSupabase\b/, { npm: ["@supabase/"], pypi: ["supabase"] }),
  a("Firebase", /\bFirebase\b/, { npm: ["firebase", "firebase-admin"], pypi: ["firebase-admin"] }),
  // ORMs and query builders
  a("Prisma", /\bPrisma\b/, { npm: ["prisma", "@prisma/client"] }),
  a("Drizzle", /\bDrizzle\b/, { npm: ["drizzle-orm"] }),
  a("Knex", /\bKnex\b/, { npm: ["knex"] }),
  a("Sequelize", /\bSequelize\b/, { npm: ["sequelize"] }),
  a("TypeORM", /\bTypeORM\b/, { npm: ["typeorm"] }),
  a("Mongoose", /\bMongoose\b/, { npm: ["mongoose"] }),
  a("SQLAlchemy", /\bSQLAlchemy\b/, { pypi: ["sqlalchemy"] }),
  a("Alembic", /\bAlembic\b/, { pypi: ["alembic"] }),
  a("GORM", /\bGORM\b/, { go: ["gorm.io/gorm"] }),
  // Web frameworks
  a("Express", /\bExpress(?:\.js)?\b/, { npm: ["express"] }),
  a("Fastify", /\bFastify\b/, { npm: ["fastify"] }),
  a("NestJS", /\bNestJS\b|\bNest\.js\b/, { npm: ["@nestjs/"] }),
  a("Hono", /\bHono\b/, { npm: ["hono"] }),
  a("Koa", /\bKoa\b/, { npm: ["koa"] }),
  a("Next.js", /\bNext\.js\b/, { npm: ["next"] }),
  a("React", /\bReact\b(?! Native)/, { npm: ["react"] }),
  a("React Native", /\bReact Native\b/, { npm: ["react-native"] }),
  a("Vue", /\bVue(?:\.js)?\b/, { npm: ["vue"] }),
  a("Nuxt", /\bNuxt\b/, { npm: ["nuxt"] }),
  a("Svelte", /\bSvelte(?:Kit)?\b/, { npm: ["svelte", "@sveltejs/kit"] }),
  a("Angular", /\bAngular\b/, { npm: ["@angular/core"] }),
  a("Astro", /\bAstro\b/, { npm: ["astro"] }),
  a("Remix", /\bRemix\b/, { npm: ["@remix-run/"] }),
  a("Django", /\bDjango\b/, { pypi: ["django"] }),
  a("Flask", /\bFlask\b/, { pypi: ["flask"] }),
  a("FastAPI", /\bFastAPI\b/, { pypi: ["fastapi"] }),
  a("Celery", /\bCelery\b/, { pypi: ["celery"] }),
  a("Pydantic", /\bPydantic\b/, { pypi: ["pydantic"] }),
  a("Rails", /\bRails\b/, { gem: ["rails", "railties"] }),
  a("Sidekiq", /\bSidekiq\b/, { gem: ["sidekiq"] }),
  a("Laravel", /\bLaravel\b/, { composer: ["laravel/framework"] }),
  a("Gin", /\bGin\b(?= (?:framework|router|server|handlers?))/, { go: ["github.com/gin-gonic/gin"] }),
  a("Cobra", /\bCobra\b/, { go: ["github.com/spf13/cobra"] }),
  a("Tokio", /\bTokio\b/, { cargo: ["tokio"] }),
  a("Axum", /\bAxum\b/, { cargo: ["axum"] }),
  a("Serde", /\bSerde\b/, { cargo: ["serde"] }),
  a("Spring Boot", /\bSpring Boot\b/, { maven: ["org.springframework.boot"] }),
  // Frontend state, styling, UI
  a("Redux", /\bRedux\b/, { npm: ["redux", "@reduxjs/toolkit", "react-redux"] }),
  a("Recoil", /\bRecoil\b/, { npm: ["recoil"] }),
  a("Jotai", /\bJotai\b/, { npm: ["jotai"] }),
  a("Zustand", /\bZustand\b/, { npm: ["zustand"] }),
  a("MobX", /\bMobX\b/, { npm: ["mobx"] }),
  a("TanStack Query", /\bTanStack Query\b|\bReact Query\b/, { npm: ["@tanstack/react-query", "react-query"] }),
  a("MUI", /\bMUI\b|\bMaterial UI\b/, { npm: ["@mui/material", "@material-ui/core"] }),
  a("Emotion", /\bEmotion\b/, { npm: ["@emotion/"] }),
  a("Tailwind", /\bTailwind(?:CSS)?\b/, { npm: ["tailwindcss"] }),
  a("Chakra UI", /\bChakra(?: UI)?\b/, { npm: ["@chakra-ui/"] }),
  a("shadcn/ui", /\bshadcn\b/, { npm: ["@radix-ui/"], files: [/(^|\/)components\.json$/] }),
  a("Storybook", /\bStorybook\b/, { npm: ["storybook", "@storybook/"] }),
  // Validation and APIs
  a("Zod", /\bZod\b/, { npm: ["zod"] }),
  a("tRPC", /\btRPC\b/, { npm: ["@trpc/"] }),
  a("GraphQL", /\bGraphQL\b/, { npm: ["graphql", "@apollo/", "graphql-yoga"], pypi: ["graphene", "strawberry-graphql"], go: ["github.com/99designs/gqlgen"], files: [/\.(graphql|gql)$/] }),
  a("Apollo", /\bApollo\b/, { npm: ["@apollo/"] }),
  a("Socket.IO", /\bSocket\.IO\b/i, { npm: ["socket.io", "socket.io-client"] }),
  // Tooling
  a("Jest", /\bJest\b/, { npm: ["jest"] }),
  a("Vitest", /\bVitest\b/, { npm: ["vitest"] }),
  a("Mocha", /\bMocha\b/, { npm: ["mocha"] }),
  a("Cypress", /\bCypress\b/, { npm: ["cypress"] }),
  a("Playwright", /\bPlaywright\b/, { npm: ["@playwright/test", "playwright", "playwright-core"], pypi: ["playwright"] }),
  a("Puppeteer", /\bPuppeteer\b/, { npm: ["puppeteer", "puppeteer-core"] }),
  a("ESLint", /\bESLint\b/, { npm: ["eslint"] }),
  a("Prettier", /\bPrettier\b/, { npm: ["prettier"] }),
  a("Biome", /\bBiome\b/, { npm: ["@biomejs/biome"] }),
  a("Husky", /\bHusky\b/, { npm: ["husky"] }),
  a("Webpack", /\bWebpack\b/, { npm: ["webpack"] }),
  a("Vite", /\bVite\b/, { npm: ["vite"] }),
  a("esbuild", /\besbuild\b/, { npm: ["esbuild"] }),
  a("Turborepo", /\bTurborepo\b/, { npm: ["turbo"] }),
  a("Nx", /\bNx\b(?= (?:workspace|monorepo))/, { npm: ["nx"] }),
  a("pytest", /\bpytest\b/, { pypi: ["pytest"] }),
  a("Ruff", /\bRuff\b/, { pypi: ["ruff"] }),
  // Infrastructure
  a("Docker", /\bDocker\b/, { files: [/(^|\/)Dockerfile(\.[\w.-]+)?$/, /(^|\/)(docker-)?compose[\w.-]*\.ya?ml$/] }),
  a("Kubernetes", /\bKubernetes\b|\bk8s\b/, { files: [/(^|\/)Chart\.yaml$/, /(^|\/)(k8s|kubernetes|manifests|helm|charts)\//, /(^|\/)kustomization\.ya?ml$/], content: { files: /\.ya?ml$/, pattern: /^apiVersion:\s*\S+[\s\S]*?^kind:\s*\w+/m } }),
  a("Helm", /\bHelm\b/, { files: [/(^|\/)Chart\.yaml$/] }),
  a("Terraform", /\bTerraform\b/, { files: [/\.tf$/] }),
  a("Pulumi", /\bPulumi\b/, { npm: ["@pulumi/"], pypi: ["pulumi"], files: [/(^|\/)Pulumi\.ya?ml$/] }),
  a("GitHub Actions", /\bGitHub Actions\b/, { files: [/^\.github\/workflows\/[^/]+\.ya?ml$/] }),
  a("AWS", /\bAWS\b/, { npm: ["aws-sdk", "@aws-sdk/", "aws-cdk-lib", "sst"], pypi: ["boto3", "aws-cdk-lib"], go: ["github.com/aws/aws-sdk-go"], files: [/\.tf$/, /(^|\/)serverless\.ya?ml$/, /(^|\/)cdk\.json$/] })
];

// src/parse/classify.ts
import { posix as posix4 } from "node:path";
var KNOWN_TOOLS = /* @__PURE__ */ new Set([
  "yarn",
  "npm",
  "npx",
  "pnpm",
  "bun",
  "bunx",
  "deno",
  "node",
  "tsx",
  "ts-node",
  "corepack",
  "bash",
  "sh",
  "zsh",
  "fish",
  "source",
  "make",
  "gmake",
  "just",
  "task",
  "mise",
  "asdf",
  "python",
  "python3",
  "pip",
  "pip3",
  "pipx",
  "uv",
  "uvx",
  "poetry",
  "pdm",
  "hatch",
  "conda",
  "pytest",
  "tox",
  "nox",
  "pre-commit",
  "go",
  "gofmt",
  "cargo",
  "rustup",
  "rustc",
  "java",
  "mvn",
  "gradle",
  "kotlin",
  "dotnet",
  "ruby",
  "bundle",
  "rake",
  "rails",
  "gem",
  "php",
  "composer",
  "docker",
  "docker-compose",
  "podman",
  "kubectl",
  "helm",
  "terraform",
  "terragrunt",
  "tofu",
  "pulumi",
  "aws",
  "gcloud",
  "az",
  "sops",
  "eksctl",
  "git",
  "gh",
  "glab",
  "curl",
  "wget",
  "brew",
  "apt",
  "apt-get",
  "dnf",
  "yum",
  "pacman",
  "snap",
  "echo",
  "cat",
  "ls",
  "grep",
  "rg",
  "find",
  "sed",
  "awk",
  "chmod",
  "mkdir",
  "rm",
  "cp",
  "mv",
  "cd",
  "tee",
  "touch",
  "ln",
  "xargs",
  "jq",
  "yq",
  "psql",
  "mysql",
  "redis-cli",
  "mongosh",
  "sqlite3",
  "openssl",
  "ssh",
  "scp",
  "rsync",
  "tar",
  "unzip",
  "eslint",
  "prettier",
  "tsc",
  "vitest",
  "jest",
  "cypress",
  "playwright",
  "biome",
  "ruff",
  "black",
  "mypy",
  "flake8",
  "golangci-lint",
  "claude",
  "codex",
  "gemini",
  "pm2",
  "nodemon",
  "ngrok",
  "vercel",
  "netlify",
  "wrangler",
  "firebase",
  "supabase",
  "fly",
  "heroku",
  "sudo",
  "env",
  "time",
  "export",
  "sysctl",
  "systemctl",
  "journalctl",
  "kill",
  "lsof",
  "ps"
]);
var FILE_RUNNERS = /* @__PURE__ */ new Set(["bash", "sh", "zsh", "fish", "source", "node", "deno", "tsx", "ts-node", "python", "python3", "ruby", "php", "bun"]);
var FILE_EXT = /\.(targets|props|slnx|nuspec|ruleset|resx|razor|cshtml|xaml|fsproj|vbproj|proj|nupkg|adoc|asciidoc|rst|org|tex|ipynb|tmpl|tpl|j2|jinja2?|hbs|ejs|njk|erb|liquid|mustache|template|dist|snap|ts|tsx|mts|cts|js|jsx|mjs|cjs|json|jsonc|json5|md|mdx|mdc|ya?ml|sh|bash|zsh|toml|ini|cfg|conf|sql|env|example|sample|mjml|css|scss|sass|less|lock|txt|py|pyi|go|mod|sum|rs|rb|php|java|kt|kts|gradle|cs|csproj|sln|fs|swift|c|h|cc|cpp|hpp|html|vue|svelte|astro|xml|proto|graphql|gql|tf|tfvars|hcl|dockerfile|ps1|bat|cmd|wasm|pem|crt|key|csv|tsv|png|svg|jpg|jpeg|gif|webp|ico|pdf|zip|gz|tgz)$/i;
var BARE_EXTENSION = /^\.[a-z0-9]{1,6}$/i;
var IDENT = /^[A-Za-z_$][\w$]*$/;
function isPathLike(t) {
  if (!t || /\s/.test(t) || /^[a-z][\w+.-]*:\/\//i.test(t) || /^[a-z]+:/i.test(t)) return false;
  if (BARE_EXTENSION.test(t) && !/^\.(env|gitignore|nvmrc|npmrc|editorconfig|prettierrc|eslintrc|babelrc|dockerignore|tool-versions|node-version|python-version|ruby-version)$/i.test(t)) return false;
  if (!t.includes("/") && /^[A-Za-z_$][\w$]*\.env$/.test(t)) return false;
  if (t.startsWith("@") && !t.includes("/")) return false;
  if (t.includes("/")) return /^[\w.~@<>[\]{}|*?()+,=-]+(\/[\w.~@<>[\]{}|*?()+,=-]*)*\/?$/.test(t) || t.startsWith("/") || t.startsWith("~/");
  return FILE_EXT.test(t) || /^\.[\w.-]+$/.test(t) || /^(Makefile|Dockerfile|Procfile|Gemfile|Rakefile|Justfile|justfile|Taskfile|Brewfile|Vagrantfile|Jenkinsfile|LICENSE|README|CHANGELOG|CODEOWNERS)(\.[\w.]+)?$/.test(t);
}
function qualifiedName(t) {
  const m = t.match(/^([\w./-]*[\w-])\.([A-Za-z_]\w*)$/);
  if (!m) return null;
  const [, scope = "", name = ""] = m;
  if (FILE_EXT.test(`.${name}`) || /^(json|yaml|yml|lock|config|test|spec|d|min|local|example)$/i.test(name)) return null;
  if (/\.[A-Za-z0-9]{1,6}$/.test(scope.split("/").pop() ?? "") && scope.includes("/")) return null;
  if (scope.includes("/") && /^[a-z0-9]{1,6}$/.test(name)) return null;
  if (!scope.includes("/") && !IDENT.test(scope.split(".").pop() ?? "")) return null;
  return { scope, name };
}
var OUTPUT_FLAGS = /* @__PURE__ */ new Set(["-o", "--out", "--output", "--outfile", "--out-file", "--outdir", "--out-dir", "--output-dir", "-coverprofile", "-cpuprofile", "-memprofile", "--coverage-dir", "--junit-xml", "--report"]);
function pathArgs(argv, cwd, hintDirs) {
  const skipFirst = FILE_RUNNERS.has(argv[0] ?? "") || /^\.?\.?\//.test(argv[0] ?? "");
  return argv.slice(skipFirst ? 2 : 1).filter((tok, i, all2) => !OUTPUT_FLAGS.has(all2[i - 1] ?? "")).filter((tok) => !/^[\w:-]+\[.*\]$/.test(tok)).filter((tok) => !tok.startsWith("-") && !tok.startsWith("/") && !tok.startsWith("~") && !tok.includes("$") && !tok.includes("=") && !/^[a-z]+:\/\//i.test(tok)).filter((tok) => tok.includes("/") && isPathLike(tok) && !qualifiedName(tok)).map((tok) => ({ kind: "path", text: tok, expect: "present", ...cwd ? { cwd } : {}, ...hintDirs.length ? { hintDirs } : {} }));
}
var inClone = (path2, clones) => {
  if (!path2) return null;
  for (const c of clones) if (path2 === c.dir || path2.startsWith(`${c.dir}/`)) return { clone: c, rest: path2.slice(c.dir.length + 1) };
  return null;
};
function commandSpans(line, hintDirs = [], clones = []) {
  const spans = [];
  for (const sc of splitShell(line)) {
    const raw = sc.cwdUnknown ? void 0 : sc.cwd || void 0;
    const cloned = inClone(raw, clones);
    const cwd = cloned ? cloned.rest || void 0 : raw;
    const cloneOf = (extra) => cloned?.clone ?? extra ? { clone: cloned?.clone ?? extra } : {};
    if (sc.argv[0] === "git" && sc.argv[1] === "clone") {
      const args = sc.argv.slice(2).filter((a2, i, all2) => !a2.startsWith("-") && !["-b", "--branch", "--depth", "-o", "--origin", "--filter", "--reference"].includes(all2[i - 1] ?? ""));
      const url = args[0];
      if (url) clones.push({ url, dir: args[1] ?? (url.split(/[/:]/).pop() ?? "").replace(/\.git$/, "") });
    }
    if (sc.argv[0] === "cd" || sc.argv[0] === "pushd") {
      const target = sc.argv[1];
      if (target && !target.startsWith("/") && !target.startsWith("~") && !target.includes("$") && target !== "-") {
        const into = inClone(posix4.join(raw ?? "", target.replace(/\/$/, "")), clones);
        if (into && !into.rest) continue;
        spans.push({ kind: "path", text: `${(into ? into.rest : target).replace(/\/$/, "")}/`, expect: "present", ...cwd && !into ? { cwd } : {}, ...into ? { clone: into.clone } : cloneOf(void 0) });
      }
      continue;
    }
    const named = clones.find((c) => sc.argv.some((a2) => a2.startsWith(`${c.dir}/`)));
    spans.push({ kind: "command", text: sc.text, expect: "present", ...cwd ? { cwd } : {}, ...hintDirs.length ? { hintDirs } : {}, ...cloneOf(named) });
    for (const p of pathArgs(sc.argv, cwd, hintDirs)) {
      const c = inClone(p.text, clones)?.clone ?? cloned?.clone;
      spans.push({ ...p, ...c ? { clone: c } : {} });
    }
  }
  return spans;
}
var DISPATCHED = /* @__PURE__ */ new Set(["yarn", "npm", "pnpm", "bun", "make", "gmake", "just", "task", "go", "cargo", "rake", "composer", "tox", "nox", "uv", "poetry", "pdm", "hatch", "python", "python3", "node", "deno", "bash", "sh", "source", "time", "env", "export", "find", "echo", "cat", "ls", "kill", "ps", "touch", "cd", "sudo"]);
var FLAG_TOKEN = /^--?[A-Za-z][\w-]*$/;
var PLACEHOLDER = /^<[^>]+>$/;
var NOT_CALLS = /* @__PURE__ */ new Set(["if", "for", "while", "switch", "catch", "function", "return", "typeof", "await", "async", "super", "require", "import", "export", "sizeof", "defined", "elif", "print"]);
function codeCalls(t) {
  const bare = t.replace(/"[^"]*"|'[^']*'|`[^`]*`/g, '""').replace(/\$\(/g, " ");
  const snippet = /^(?:export\s+(?:default|const|let|var|function|class|type|interface|async|\{)|import\s+[\w{*'"]|(?:const|let|var|function|class|def|func|return|await|new)\s)/.test(t) || /[A-Za-z_$][\w$]*\(/.test(bare) || /=>/.test(bare);
  if (!snippet) return null;
  const names = [...bare.matchAll(/([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*\(/g)].map((m) => m[1] ?? "").filter((n) => n.length >= 3 && !NOT_CALLS.has(n));
  const spans = [...new Set(names)].map((n) => ({ kind: "symbol", text: `${n}()`, expect: "present" }));
  return spans.length ? spans : [{ kind: "unknown", text: t, expect: "present" }];
}
function classifyCode(code2) {
  const t = code2.trim().replace(/^\$\s+/, "");
  if (!t) return [];
  const first = t.split(/\s+/)[0] ?? "";
  const words = t.split(/\s+/);
  if (FLAG_TOKEN.test(first) && words.every((w) => FLAG_TOKEN.test(w) || PLACEHOLDER.test(w))) {
    return words.filter((w) => FLAG_TOKEN.test(w)).map((w) => ({ kind: "symbol", text: w, expect: "present" }));
  }
  const list2 = t.match(/^[([{]\s*([\w.]+(?:\s*,\s*[\w.]+)+)\s*[)\]}]$/);
  if (list2?.[1]) return list2[1].split(/\s*,\s*/).filter((n) => n.length >= 3 && /^[A-Za-z_]/.test(n)).map((n) => ({ kind: "symbol", text: n, expect: "present" }));
  const callee = t.match(/^([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\((?:[^()]|\([^()]*\))*\)$/);
  if (callee?.[1] && callee[1].length >= 3) return [{ kind: "symbol", text: `${callee[1]}()`, expect: "present" }];
  const quoted = t.match(/^"([\w.-]{3,})"$|^'([\w.-]{3,})'$/);
  if (quoted) return [{ kind: "symbol", text: quoted[1] ?? quoted[2] ?? "", expect: "present" }];
  if (!/\s/.test(t) && KNOWN_TOOLS.has(t) && !DISPATCHED.has(t)) return [{ kind: "command", text: t, expect: "present" }];
  if (/^(?:Test|Benchmark|Fuzz|Example)[A-Z_]\w*\/\S+$/.test(t) || /^refs\/[\w./<>-]+$/.test(t) || /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*-?<[^>\s]+>$/.test(t)) return [{ kind: "symbol", text: t, expect: "present" }];
  if (/^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/.test(t) && !FILE_EXT.test(t)) return [{ kind: "symbol", text: t, expect: "present" }];
  if (/\s/.test(t) || /&&|\|\||;/.test(t)) {
    const calls = codeCalls(t);
    if (calls) return calls;
    if (KNOWN_TOOLS.has(first) || /^\.?\.?\/[\w./-]+$/.test(first) || /^[A-Za-z_][A-Za-z0-9_]*=\S*$/.test(first)) return commandSpans(t);
    const paths = t.split(/\s+/).filter((tok) => tok.includes("/") && isPathLike(tok) && !tok.startsWith("-") && !qualifiedName(tok)).map((tok) => ({ kind: "path", text: tok, expect: "present" }));
    return [{ kind: "unknown", text: t, expect: "present" }, ...paths];
  }
  if (/^[A-Z][A-Z0-9_]*=\S+$/.test(t)) return [{ kind: "env", text: t, expect: "present" }];
  if (/^\/[a-z][\w-]*(?::[\w-]+)?$/.test(t)) return [{ kind: "symbol", text: t, expect: "present" }];
  const scoped = t.match(/^(@[a-z0-9][\w.-]*\/(?:[a-z0-9][\w.-]*|\*))(?:\/[\w./-]*)?$/);
  if (scoped?.[1]) return [{ kind: "dependency", text: scoped[1], expect: "present" }];
  if (qualifiedName(t) && (t.includes("/") || /^[a-z]/.test(t))) return [{ kind: "symbol", text: t, expect: "present" }];
  if (isPathLike(t)) return [{ kind: "path", text: t, expect: "present" }];
  if (/^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*(\(\))?$/.test(t) && t.replace(/\(\)$/, "").length >= 3) return [{ kind: "symbol", text: t, expect: "present" }];
  return [{ kind: "unknown", text: t, expect: "present" }];
}
var VERSION_TECH = "Node(?:\\.js)?|Next\\.js|React|MUI|Material UI|PostgreSQL|Postgres|Redis|Valkey|TypeScript|Express(?:\\.js)?|Recoil|BullMQ|Knex|Sequelize|Prisma|Cypress|Jest|Vitest|Vite|Vue|Nuxt|Angular|Svelte|SvelteKit|Tailwind(?:CSS)?|Playwright|ESLint|Python|Go|Golang|Rust|Ruby|Java|Kotlin|PHP|Django|Rails|Laravel|Deno|Bun|pnpm|Yarn|npm|MySQL|MongoDB|Elasticsearch|Kafka|Gradle|Spring Boot|\\.NET";
var VERSION_RE = new RegExp(`(?<![\\w.])(${VERSION_TECH})\\s*(?:v|version\\s+)?(>=|\u2265|\\^|~)?\\s*(\\d+(?:\\.\\d+){0,2})(\\.x|\\+)?(?![\\w.]*\\d)`, "g");
function versionSpans(prose) {
  const unquoted = prose.replace(/"[^"]*"|“[^”]*”/g, " ");
  return [...unquoted.matchAll(VERSION_RE)].map((m) => ({ kind: "version", text: m[0].trim(), expect: "present" }));
}
function dependencySpans(prose) {
  const unquoted = prose.replace(/"[^"]*"|“[^”]*”/g, " ");
  const found = /* @__PURE__ */ new Map();
  for (const alias of DEPENDENCY_ALIASES) {
    if (alias.pattern.test(unquoted) && !found.has(alias.name)) found.set(alias.name, { kind: "dependency", text: alias.name, expect: "present" });
  }
  const versioned = new Set(versionSpans(prose).map((v) => v.text.split(/\s|\d/)[0]?.toLowerCase()));
  return [...found.values()].filter((s) => !versioned.has(s.text.toLowerCase()));
}

// src/parse/markdown.ts
var SHELL_LANGS = /* @__PURE__ */ new Set(["bash", "sh", "shell", "zsh", "console", "terminal", "shell-session", "shellsession", "fish", "ps1", "powershell"]);
var SCRIPT_LANGS = /* @__PURE__ */ new Set(["ts", "tsx", "typescript", "js", "jsx", "javascript", "mjs", "cjs", "go", "py", "python", "rust", "rs"]);
function normalizeText(text4) {
  return text4.replace(/(\*\*|__|~~)/g, "").replace(/\s+/g, " ").trim().replace(/[.;:]+$/, "");
}
var statementId = (text4) => createHash2("sha1").update(normalizeText(text4)).digest("hex");
function renderInline(nodes) {
  return nodes.map((n) => {
    switch (n.type) {
      case "text":
        return n.value;
      case "inlineCode":
        return `\`${n.value}\``;
      case "emphasis":
      case "strong":
      case "delete":
        return renderInline(n.children);
      case "link":
        return `[${renderInline(n.children)}](${n.url})`;
      case "break":
        return " ";
      default:
        return "children" in n ? renderInline(n.children) : "";
    }
  }).join("");
}
function proseOfText(text4) {
  return text4.replace(/`[^`]*`/g, " ").replace(/\]\([^)]*\)/g, "]").replace(/[[\]]/g, " ");
}
var safeDecode = (s) => {
  try {
    return decodeURI(s);
  } catch {
    return s;
  }
};
var segmenter = new Intl.Segmenter("en", { granularity: "sentence" });
function runsSomething(line) {
  const words = line.split(/\s+/).filter((w) => !/^[A-Za-z_][A-Za-z0-9_]*=/.test(w) && w !== "sudo");
  const first = words[0] ?? "";
  return KNOWN_TOOLS.has(first) || /^\.{0,2}\/[\w./-]+$/.test(first);
}
function sentenceParts(text4) {
  const kept = [];
  const protectedText = text4.replace(/`[^`]*`|\]\([^)]*\)/g, (m) => {
    kept.push(m);
    const tag = `${kept.length - 1}`;
    return tag.padEnd(m.length, "");
  });
  const restore = (s) => s.replace(/\u0001(\d+)\u0001\u0002*/g, (_, i) => kept[Number(i)] ?? "");
  const out = [];
  for (const seg of segmenter.segment(protectedText.replace(/\n/g, " "))) {
    const t = restore(seg.segment).trim();
    if (t) out.push({ text: t, line: (text4.slice(0, seg.index + (seg.segment.length - seg.segment.trimStart().length)).match(/\n/g) ?? []).length });
  }
  return out;
}
function importsIn(prose) {
  const out = [];
  for (const m of prose.matchAll(/(?:^|[\s(])@((?:\\ |[^\s,;)"'])+)/g)) {
    const raw = (m[1] ?? "").replace(/\\ /g, " ").replace(/[.:]+$/, "");
    if (raw && /[\w~/.]/.test(raw[0] ?? "")) out.push(raw);
  }
  return out;
}
var NEGATION = /\b(?:was|were|has been|have been|got|is now|are now|been)\s+(?:deleted|removed|retired|dropped|renamed|replaced|moved)\b|\bno longer (?:exists?|used|present|needed|available|in use|supported)\b|\b(?:is|are) not a (?:project )?dependency\b|\bdoes not exist\b|\bwere?n't kept\b/i;
var NEGATION_ALL = new RegExp(NEGATION.source, "gi");
var REDIRECT = /\b(?:renamed|moved|replaced|migrated)\s+(?:to|with|by|into)\s+$/i;
function clauses(text4) {
  const out = [];
  let start = 0;
  let inCode = false;
  for (let i = 0; i < text4.length; i++) {
    const c = text4[i];
    if (c === "`") inCode = !inCode;
    if (inCode) continue;
    const boundary = c === ";" || c === "\u2014" || (c === "." || c === ":" || c === "!" || c === "?") && /\s|$/.test(text4[i + 1] ?? "") || c === "-" && text4[i - 1] === " " && text4[i + 1] === " ";
    if (boundary) {
      out.push({ start, end: i });
      start = i + 1;
    }
  }
  out.push({ start, end: text4.length });
  return out;
}
function applyNegation(text4, spans) {
  let negated = false;
  for (const clause of clauses(text4)) {
    const part = text4.slice(clause.start, clause.end);
    const m = part.match(NEGATION);
    if (!m || m.index === void 0) continue;
    negated = true;
    const verbAt = clause.start + m.index;
    for (const s of spans) {
      const at = text4.indexOf(`\`${s.text}\``, clause.start);
      const pos = at >= 0 ? at : text4.indexOf(s.text, clause.start);
      if (pos < clause.start || pos >= clause.end) continue;
      if (pos < verbAt && !REDIRECT.test(text4.slice(clause.start, pos))) s.expect = "absent";
    }
  }
  return negated;
}
var RULE_WORDS = /\b(?:must|never|always|don'?t|do not|avoid|prefer|should|shouldn'?t|required?|forbidden)\b/i;
var STATUS_WORDS = /\b(?:active|legacy|deprecated|canonical|preferred|primary|obsolete|experimental|in-migration|in migration|sole|single source)\b/i;
var QUANTIFIERS = /\b(?:only|every|all|none|each)\b/i;
var STOP_WORDS = new Set(
  "a an the and or but of to in on at for from with by via into onto over under inside within as is are was were be been being it its this that these those there here than then also all any each every see use using run runs running from also only just when where which who what how why if else not no yes do does did done can could should would will may might must here see e.g i.e etc via per vs see".split(" ")
);
function contentWords(prose) {
  return (prose.match(/[A-Za-z][A-Za-z'-]{2,}/g) ?? []).filter((w) => !STOP_WORDS.has(w.toLowerCase()));
}
function residualOf(text4) {
  const prose = text4.replace(/`[^`]*`/g, " ").replace(/\]\([^)]*\)/g, "]");
  const out = [];
  for (const m of prose.matchAll(/(?<![\w.:-])(\d+(?:[.,]\d+)?\+?)\s+(?!px\b|ms\b|s\b|%|kb\b|mb\b|gb\b|lines?\b|minutes?\b|seconds?\b|hours?\b|days?\b|weeks?\b|chars?\b|characters?\b)([a-z][\w-]*(?:\s[a-z][\w-]*)?)/gi)) {
    if (/^(19|20)\d\d$/.test(m[1] ?? "")) continue;
    out.push(`count "${m[1]} ${m[2]}"`);
  }
  const status = prose.match(STATUS_WORDS);
  if (status) out.push(`status "${status[0]}"`);
  const quantifier = prose.match(QUANTIFIERS);
  if (quantifier) out.push(`quantifier "${quantifier[0]}"`);
  const rule = prose.match(RULE_WORDS);
  if (rule) out.push(`rule "${rule[0]}"`);
  let described = prose.replace(/\[[^\]]*\]/g, " ").replace(/@\S+/g, " ");
  for (const v of versionSpans(described)) described = described.replace(v.text, " ");
  for (const d of dependencySpans(described)) described = described.replace(new RegExp(`\\b${d.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g"), " ");
  const words = contentWords(described);
  if (words.length >= 2) out.push(`description "${words.slice(0, 6).join(" ")}${words.length > 6 ? " \u2026" : ""}"`);
  return out;
}
var MARKER = /<!--\s*proof:(ignore(?:-start|-end)?)\b([^>]*)-->/;
function readMarker(html) {
  const m = html.match(MARKER);
  if (!m) return null;
  const reason = (m[2] ?? "").match(/reason\s*=\s*"([^"]*)"|reason\s*=\s*'([^']*)'/);
  const text4 = (reason?.[1] ?? reason?.[2] ?? "").trim();
  return { kind: m[1] ?? "ignore", reason: text4 || null };
}
function scopeField(file) {
  if (/\.mdc$/.test(file)) return "globs";
  if (/\.instructions\.md$/.test(file)) return "applyTo";
  return "paths";
}
function parseDocument(source, file) {
  const tree = fromMarkdown(source, {
    extensions: [gfm(), frontmatter(["yaml"])],
    mdastExtensions: [gfmFromMarkdown(), frontmatterFromMarkdown(["yaml"])]
  });
  const statements = [];
  const imports = [];
  let paths = null;
  let frontmatterError = null;
  let section = "";
  const markers2 = { block: null, next: null, findings: [] };
  const clones = [];
  const lineOf = (n) => n.position?.start.line ?? 0;
  const endOf = (n) => n.position?.end.line ?? lineOf(n);
  const push2 = (kind, text4, line, endLine, spans, negatable = true) => {
    const clean = text4.replace(/\s+/g, " ").trim();
    if (!clean) return;
    if (kind !== "command" && kind !== "import" && /:\**$/.test(clean) && !spans.length) return;
    const negated = negatable && applyNegation(clean, spans);
    const st = {
      id: statementId(clean),
      file,
      line,
      endLine,
      section,
      kind,
      text: clean,
      spans,
      // In "the `x` block was deleted" the removal is what the absence check proves; it is not a description.
      residual: kind === "command" || kind === "frontmatter" || kind === "import" ? [] : residualOf(negated ? clean.replace(NEGATION_ALL, " ") : clean),
      negated
    };
    const override = markers2.block ?? markers2.next;
    if (override) st.override = override;
    markers2.next = null;
    statements.push(st);
  };
  const spansOf = (text4, line) => {
    const spans = [];
    for (const m of text4.matchAll(/`([^`]+)`/g)) spans.push(...classifyCode(m[1] ?? ""));
    for (const m of text4.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      const target = safeDecode((m[1] ?? "").split("#")[0] ?? "");
      if (target && !/^[a-z][\w+.-]*:/i.test(target)) spans.push({ kind: "link", text: target, expect: "present" });
    }
    const prose = proseOfText(text4);
    for (const p of importsIn(prose)) {
      spans.push({ kind: "import", text: p, expect: "present" });
      imports.push({ path: p, line });
    }
    spans.push(...versionSpans(prose), ...dependencySpans(prose));
    return spans;
  };
  const paragraph = (p, kind) => {
    const text4 = renderInline(p.children);
    if (kind === "item") {
      push2("item", text4, lineOf(p), endOf(p), spansOf(text4, lineOf(p)));
      return;
    }
    const whole = text4.trim();
    const parts = /^\*\*[^*]+\*\*$/.test(whole) ? [{ text: whole, line: 0 }] : sentenceParts(text4);
    for (const s of parts) push2("sentence", s.text, lineOf(p) + s.line, endOf(p), spansOf(s.text, lineOf(p) + s.line));
  };
  const code2 = (c, hintDirs) => {
    const lang = (c.lang ?? "").toLowerCase();
    const lines = c.value.split("\n");
    const start = lineOf(c) + 1;
    if (SHELL_LANGS.has(lang) || lang === "" || lang === "text" || lang === "txt") {
      for (let i = 0; i < lines.length; i++) {
        let logical = lines[i] ?? "";
        const first = i;
        while (/\\\s*$/.test(logical) && i + 1 < lines.length) logical = `${logical.replace(/\\\s*$/, " ")}${lines[++i] ?? ""}`;
        const cmd = logical.trim().replace(/^\$\s+/, "").replace(/^>\s+/, "");
        if (!cmd || cmd.startsWith("#")) continue;
        if (!SHELL_LANGS.has(lang) && !runsSomething(cmd)) continue;
        const spans = commandSpans(cmd, hintDirs, clones);
        push2("command", cmd, start + first, start + i, spans, false);
      }
      return;
    }
    if (SCRIPT_LANGS.has(lang)) {
      lines.forEach((l, i) => {
        const m = l.trim().match(/^(?:\/\/|#)\s*(\S+\.(?:ts|tsx|js|jsx|mjs|cjs|go|py|rs))\s*$/);
        if (m?.[1]) push2("code-path", l.trim(), start + i, start + i, [{ kind: "path", text: m[1], expect: "present" }], false);
      });
    }
  };
  const hintsFrom = (prev) => {
    if (!prev || prev.type !== "paragraph") return [];
    const text4 = renderInline(prev.children);
    return [...text4.matchAll(/`([^`\s]+\/)`/g)].map((m) => (m[1] ?? "").replace(/^\.\//, "").replace(/\/$/, ""));
  };
  const listItem = (item2) => {
    for (const [i, child] of item2.children.entries()) {
      if (child.type === "paragraph") paragraph(child, "item");
      else if (child.type === "list") list2(child);
      else if (child.type === "code") code2(child, hintsFrom(item2.children[i - 1]));
      else if (child.type === "table") table(child);
      else if (child.type === "html") html(child.value, lineOf(child));
      else if (child.type === "blockquote") blocks(child.children);
    }
  };
  const list2 = (l) => {
    for (const item2 of l.children) listItem(item2);
  };
  const table = (t) => {
    t.children.forEach((row, i) => {
      if (i === 0) return;
      const cells = row.children.map((cell) => renderInline(cell.children)).filter((c) => c.trim());
      const text4 = cells.join(" \xB7 ");
      push2("row", text4, lineOf(row), endOf(row), spansOf(cells.join(" "), lineOf(row)));
    });
  };
  const html = (value2, line) => {
    const marker = readMarker(value2);
    if (!marker) return;
    if (marker.kind === "ignore-end") {
      markers2.block = null;
      return;
    }
    if (!marker.reason) {
      markers2.findings.push({
        id: statementId(`proof:${marker.kind} without a reason at line ${line}`),
        file,
        line,
        endLine: line,
        section,
        kind: "marker",
        text: `proof:${marker.kind} marker without a reason`,
        spans: [],
        residual: [],
        negated: false
      });
      return;
    }
    const override = { reason: marker.reason, line };
    if (marker.kind === "ignore-start") markers2.block = override;
    else markers2.next = override;
  };
  const blocks = (children) => {
    children.forEach((node2, i) => {
      switch (node2.type) {
        case "heading":
          section = renderInline(node2.children).trim();
          break;
        case "paragraph":
          paragraph(node2, "sentence");
          break;
        case "list":
          list2(node2);
          break;
        case "table":
          table(node2);
          break;
        case "code":
          code2(node2, hintsFrom(children[i - 1]));
          break;
        case "blockquote":
          blocks(node2.children);
          break;
        case "html":
          html(node2.value, lineOf(node2));
          break;
        case "yaml": {
          try {
            const data = (0, import_yaml2.parse)(node2.value);
            const field = scopeField(file);
            const raw = data?.[field];
            const list3 = Array.isArray(raw) ? raw.map(String) : typeof raw === "string" ? raw.split(",").map((s) => s.trim()).filter(Boolean) : null;
            if (list3?.length) {
              paths = list3;
              push2("frontmatter", `${field}: ${list3.join(", ")}`, lineOf(node2), endOf(node2), list3.map((glob) => ({ kind: "glob", text: glob, expect: "present" })), false);
            }
          } catch (err) {
            frontmatterError = err instanceof Error ? err.message.split("\n")[0] ?? "invalid YAML" : String(err);
          }
          break;
        }
        default:
          break;
      }
    });
  };
  blocks(tree.children);
  return { statements: [...statements, ...markers2.findings], imports, paths, frontmatterError };
}

// src/agent/fix.ts
import { spawnSync as spawnSync5 } from "node:child_process";
import { mkdtempSync as mkdtempSync2, rmSync as rmSync2, writeFileSync as writeFileSync3 } from "node:fs";
import { tmpdir as tmpdir2 } from "node:os";
import { join as join7 } from "node:path";
var TOOLS2 = ["Read", "Grep", "Glob", "Bash"];
var ALLOWED2 = ["Read", "Grep", "Glob", "Bash(git log:*)", "Bash(git grep:*)", "Bash(git ls-files:*)", "Bash(git show:*)", "Bash(ls:*)", "Bash(wc:*)", "Bash(find:*)", "Bash(grep:*)", "Bash(cat:*)", "Bash(jq:*)"];
var sourceOf = (source, st) => source.split("\n").slice(st.line - 1, Math.max(st.line, st.endLine)).join("\n");
function evidenceOf(st) {
  const out = [];
  for (const r of st.results) if (r.status === "STALE" || r.status === "VERIFIED") out.push({ kind: "mechanical", ref: `${r.status.toLowerCase()} \`${r.text}\``, excerpt: `${r.reason}${r.evidence[0] ? ` (${r.evidence[0].ref})` : ""}`.slice(0, 200) });
  for (const e of st.agent?.evidence ?? []) if (e.valid) out.push({ kind: e.kind, ref: e.ref, ...e.excerpt ? { excerpt: e.excerpt } : {} });
  return out;
}
function buildFixPrompt(file, source, stale2, records, config) {
  const rejected = records.filter((r) => r.kind === "fix-rejected").map((r) => ({ statement: r.previous ?? r.text, rejected_edit: r.edit?.new ?? null, why: r.reason }));
  const items = stale2.map(({ key, st }) => ({ statement_id: key, lines: `${st.line}-${st.endLine}`, source: sourceOf(source, st), verdict: "stale", evidence: evidenceOf(st) }));
  const tiers = ["A", "B", "C"].filter((t) => config.autofix[t]);
  return [
    `You correct stale statements in the instruction file ${file} so they match the repository in your working directory.`,
    "",
    "Policy:",
    ...FIXER_RULES.map((r, i) => `${i + 1}. ${r}`),
    "",
    `Tiers allowed in this repository: ${tiers.join(", ") || "none"}.`,
    `Ownership map: ${Object.keys(config.ownership).length ? JSON.stringify(config.ownership) : "none; a pointer may only name the file the evidence came from"}.`,
    `Fixes rejected before (never propose these again): ${rejected.length ? JSON.stringify(rejected) : "none"}.`,
    "",
    `Return one edit (or action none) for each of the ${stale2.length} statement ids below.`,
    "",
    "<statements>",
    JSON.stringify(items, null, 1),
    "</statements>"
  ].join("\n");
}
var isRule = (st) => st.residual.some((r) => r.startsWith("rule "));
var lineCount = (t) => t.split("\n").length;
var STRUCTURE = /^\s*(?:[-*+]\s|\d+[.)]\s|#|>|```|~~~|\|)|^\s*$/;
function fitLines(st, old, next) {
  const want = lineCount(old);
  const lines = next.split("\n");
  if (lines.length <= want) return next;
  if (st.kind !== "item" && st.kind !== "sentence" || lines.slice(1).some((l) => STRUCTURE.test(l))) return null;
  const tail = lines.slice(want - 1).map((l, i) => i ? l.trim() : l.trimEnd()).join(" ");
  return [...lines.slice(0, want - 1), tail].join("\n");
}
function vetEdit(repo, source, st, raw, scope, opts) {
  if (raw.action !== "replace" && raw.action !== "delete") return null;
  const action = raw.action;
  const tier = raw.tier === "A" || raw.tier === "B" || raw.tier === "C" ? raw.tier : "B";
  const old = typeof raw.old === "string" ? raw.old : action === "delete" ? sourceOf(source, st) : "";
  const proposed = action === "delete" ? "" : typeof raw.new === "string" ? raw.new : "";
  const fitted = action === "replace" ? fitLines(st, old, proposed) : proposed;
  const next = fitted ?? proposed;
  const cited = Array.isArray(raw.evidence) ? raw.evidence.filter((e) => Boolean(e) && typeof e.ref === "string" && typeof e.kind === "string") : [];
  const evidence = cited.slice(0, 6).map((e) => {
    const c = checkEvidence(repo, e);
    return { kind: c.kind, ref: c.ref, excerpt: c.excerpt, valid: c.valid, problem: c.problem };
  });
  const edit = { statementId: st.id, line: st.line, endLine: st.endLine, tier, action, old, new: next, evidence, reason: typeof raw.reason === "string" ? raw.reason.slice(0, 600) : "", was: st.text, refused: null };
  const lines = sourceOf(source, st);
  const count = old ? lines.split(old).length - 1 : 0;
  if (scope === "managed") edit.refused = "a managed policy file: proof reports it and never edits it";
  else if (scope === "user" && !opts.user) edit.refused = "a user-level file: pass --user to let proof edit it";
  else if (!opts.config.autofix[tier]) edit.refused = `tier ${tier} is switched off in .proof.yaml`;
  else if (!old) edit.refused = "no `old` text to replace";
  else if (count !== 1) edit.refused = count ? "`old` appears more than once in the statement" : "`old` is not in the statement as written";
  else if (old === next) edit.refused = "the edit changes nothing";
  else if (fitted === null) edit.refused = "the edit adds lines; proof never adds content (gap proposals need --gaps)";
  else if (action === "delete" && isRule(st)) edit.refused = "a rule is rewritten to match the tooling, never deleted";
  else if (action === "delete" && /\b(currently empty|(is|are) empty|none yet|not yet|no .{1,30} yet|nothing (here|yet)|placeholder)\b/i.test(st.text)) edit.refused = "the statement itself says the thing is empty or absent; absence does not contradict it";
  else if (action === "delete" && !evidence.some((e) => e.valid && e.kind === "absence") && !st.results.some((r) => r.status === "STALE" && /not found|does not exist|said to be gone/.test(r.reason))) edit.refused = "a deletion needs evidence that the thing is absent";
  else if (!evidence.some((e) => e.valid)) edit.refused = evidence.length ? `no citation checks out (${evidence.map((e) => `${e.ref}: ${e.problem}`).join("; ").slice(0, 240)})` : "an edit without evidence";
  return edit;
}
async function proposeFixes(repo, file, scope, stale2, records, opts) {
  const source = repo.read(file) ?? "";
  const keyed = stale2.map((st, i) => ({ key: `s${i + 1}`, st }));
  const result = await runClaude({ cwd: repo.root, prompt: buildFixPrompt(file, source, keyed, records, opts.config), schema: FIXER_SCHEMA, model: opts.model, effort: opts.effort, budgetUsd: opts.budgetUsd * 0.8, tools: TOOLS2, allowedTools: ALLOWED2, timeoutMs: opts.timeoutMs });
  if (!result.ok) return { edits: [], costUsd: result.costUsd, failure: `${result.subtype}${result.error ? ` (${result.error})` : ""}` };
  const raw = result.structured?.edits ?? [];
  const edits = [];
  for (const { key, st } of keyed) {
    const r = raw.find((e) => e.statement_id === key);
    const vetted = r ? vetEdit(repo, source, st, r, scope, opts) : null;
    if (vetted) edits.push(vetted);
  }
  return { edits, costUsd: result.costUsd, failure: null };
}
function applyEdits(source, edits) {
  const markerOnly = /^\s*(?:[-*+]|\d+[.)])?\s*$/;
  let lines = source.split("\n");
  for (const e of [...edits].sort((a2, b) => b.line - a2.line)) {
    const from = e.line - 1;
    const to = Math.max(e.line, e.endLine);
    const block = lines.slice(from, to).join("\n");
    const at = block.indexOf(e.old);
    if (at < 0) continue;
    const before = block.split("\n");
    const after = `${block.slice(0, at)}${e.new}${block.slice(at + e.old.length)}`.split("\n");
    const kept = e.action === "delete" ? after.filter((l, i) => !(markerOnly.test(l) && !markerOnly.test(before[i] ?? "x"))) : after;
    lines = [...lines.slice(0, from), ...kept, ...lines.slice(to)];
  }
  return lines.join("\n");
}
function unifiedDiff(file, before, after) {
  if (before === after) return "";
  const dir = mkdtempSync2(join7(tmpdir2(), "proof-diff-"));
  try {
    writeFileSync3(join7(dir, "a"), before);
    writeFileSync3(join7(dir, "b"), after);
    const res = spawnSync5("git", ["diff", "--no-index", "--no-color", "--no-ext-diff", "--", "a", "b"], { cwd: dir, encoding: "utf8" });
    return res.stdout.replace(/^diff --git a\/a b\/b\n(index [^\n]*\n)?/, "").replace(/^--- a\/a$/m, `--- a/${file}`).replace(/^\+\+\+ b\/b$/m, `+++ b/${file}`);
  } finally {
    rmSync2(dir, { recursive: true, force: true });
  }
}

// src/verify/index.ts
import { spawnSync as spawnSync6 } from "node:child_process";

// src/verify/commands.ts
import { posix as posix6 } from "node:path";

// src/verify/rake.ts
async function rakeTasks(syntax, repo, file) {
  const out = /* @__PURE__ */ new Map();
  const tree = await syntax.tree(file);
  if (!tree) {
    (repo.read(file) ?? "").split("\n").forEach((l, i) => {
      const m = /\btask\s*\(?\s*[:"']?([\w:-]+)/.exec(l) ?? /Task\.new\(\s*:(\w+)/.exec(l);
      if (m?.[1] && !out.has(m[1])) out.set(m[1], i + 1);
    });
    return out;
  }
  const symbolText = (n) => {
    if (!n) return null;
    if (n.type === "simple_symbol") return n.text.replace(/^:/, "");
    if (n.type === "string" || n.type === "bare_symbol" || n.type === "bare_string") return n.text.replace(/^["':]|["']$/g, "");
    return null;
  };
  const loopValues = (id, node2) => {
    for (let anc = node2.parent; anc; anc = anc.parent) {
      if (anc.type !== "call" || anc.childForFieldName("method")?.text !== "each") continue;
      const params = anc.childForFieldName("block")?.namedChildren.find((c) => c.type === "block_parameters");
      if (!params?.namedChildren.some((p) => p.text === id)) continue;
      const receiver = anc.childForFieldName("receiver");
      if (receiver && /array/.test(receiver.type)) return receiver.namedChildren.map((e) => symbolText(e) ?? e.text.replace(/^["':]|["']$/g, ""));
    }
    return [];
  };
  const visit = (node2, prefix) => {
    if (node2.type === "call") {
      const method = node2.childForFieldName("method")?.text;
      const args = node2.childForFieldName("arguments")?.namedChildren ?? [];
      const first = args[0];
      const block = node2.childForFieldName("block");
      if (method === "namespace") {
        const ns = symbolText(first);
        if (ns && block) {
          for (const c of block.namedChildren) visit(c, [...prefix, ns]);
          return;
        }
      }
      const names = [];
      if (method === "task" && first) {
        const direct = symbolText(first);
        if (direct) names.push(direct);
        else if (first.type === "pair") {
          const key = first.childForFieldName("key");
          const k = symbolText(key) ?? key?.text.replace(/:$/, "");
          if (k) names.push(k);
        } else if (first.type === "hash") {
          const key = first.namedChildren[0]?.childForFieldName("key");
          const k = symbolText(key) ?? key?.text.replace(/:$/, "");
          if (k) names.push(k);
        } else if (first.type === "identifier") names.push(...loopValues(first.text, node2));
      }
      if (method === "new" && /Task$/.test(node2.childForFieldName("receiver")?.text ?? "")) {
        const n = symbolText(first);
        if (n) names.push(n);
      }
      for (const n of names) {
        const full = [...prefix, n].join(":");
        if (!out.has(full)) out.set(full, node2.startPosition.row + 1);
      }
    }
    for (const c of node2.namedChildren) visit(c, prefix);
  };
  visit(tree.rootNode, []);
  return out;
}

// src/verify/symbols.ts
import { posix as posix5 } from "node:path";

// src/verify/util.ts
function pathBaseOf(docFile, docDir) {
  const cfg = /^(.*?)(?:^|\/)\.(?:claude|cursor|windsurf|github|clinerules)\//.exec(docFile);
  return cfg ? cfg[1] ?? "" : docDir;
}
var docExclude = (ctx) => ctx.docFile.startsWith("/") || /^[A-Za-z]:[\\/]/.test(ctx.docFile) ? [] : [`:(exclude)${ctx.docFile}`];
var verified = (span, level, evidence, reason) => ({ ...span, status: "VERIFIED", level, evidence, reason });
var stale = (span, reason, evidence = []) => ({ ...span, status: "STALE", level: "none", evidence, reason });
var unconfirmed = (span, reason, evidence = [], level = "none") => ({ ...span, status: "UNCONFIRMED", level, evidence, reason });
var notChecked = (span, reason, evidence = []) => ({ ...span, status: "NOT_CHECKED", level: "none", evidence, reason });
var blocked = (span, reason) => ({ ...span, status: "NOT_CHECKED", level: "none", evidence: [], reason, blocked: true });
var join8 = (...parts) => parts.filter((p) => Boolean(p)).join("/").replace(/\/+/g, "/").replace(/(^|\/)\.\//g, "$1").replace(/\/$/, "");
function workingDirs(ctx, span) {
  const out = [];
  if (span.cwd !== void 0) out.push(join8(ctx.pathBase, span.cwd));
  for (const h of span.hintDirs ?? []) out.push(join8(ctx.pathBase, h));
  out.push(ctx.pathBase, ctx.docDir, "");
  return [...new Set(out.map((d) => d.replace(/^\.$/, "")))];
}
var clip = (s, n = 120) => {
  const t = s.trim().replace(/\s+/g, " ");
  return t.length > n ? `${t.slice(0, n - 1)}\u2026` : t;
};
function globToRegExp(glob) {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i] ?? "";
    if (c === "*") {
      if (glob[i + 1] === "*") {
        re += glob[i + 2] === "/" ? "(?:.*/)?" : ".*";
        i += glob[i + 2] === "/" ? 2 : 1;
      } else re += "[^/]*";
    } else if (c === "?") re += "[^/]";
    else re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${re}$`);
}
function expandAlternatives(p) {
  const withStars = p.replace(/<[^>/]+>/g, "*").replace(/\{[A-Za-z_][\w-]*\}/g, "*");
  const alt = withStars.match(/\{([^{}]+)\}/);
  if (!alt) return [withStars];
  return (alt[1] ?? "").split(/[|,]/).flatMap((choice) => expandAlternatives(withStars.replace(alt[0], choice.trim())));
}
var bracketsAsWildcards = (p) => p.replace(/\[[A-Za-z.][\w.-]*\]/g, "*");

// src/verify/symbols.ts
var NOT_CODE = [":(exclude,glob)**/*.md", ":(exclude,glob)**/*.mdx", ":(exclude,glob)**/*.txt", ":(exclude,glob)**/*.rst", ":(exclude,glob)**/*.lock", ":(exclude,glob)**/package-lock.json", ":(exclude,glob)**/CHANGELOG*", ":(exclude,glob)**/*.proof.json"];
var MAX_HITS = 400;
var MAX_FILES_PARSED = 40;
var MAX_CONFIG_FILES = 300;
var MAX_CONFIG_BYTES = 256 * 1024;
var KEBAB = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/;
var LONG_FLAG = /^--[A-Za-z][\w-]*$/;
var SHORT_FLAG = /^-[A-Za-z]$/;
var HOST = /^(?:[a-z0-9-]+\.)+(?:com|org|net|io|dev|app|ai|co|cloud|sh|gg|me|us|uk|de|xyz|run|page|site|tech|so|gov|edu)$/;
var TEST_PATH = /^((?:Test|Benchmark|Fuzz|Example)[A-Z_]\w*)\/(.+)$/;
var KEY = /^[a-z_][a-z0-9_]*$/;
var SLASH_COMMAND = /^\/([a-z][\w-]*)(?::([\w-]+))?$/;
var BUILTIN_COMMANDS = /* @__PURE__ */ new Set(["init", "memory", "context", "compact", "config", "doctor", "clear", "help", "model", "review", "agents", "mcp", "plugin", "permissions", "hooks", "status", "cost", "login", "logout", "resume", "rewind", "export", "add-dir", "ide", "vim", "terminal-setup", "bug", "release-notes", "pr-comments", "security-review", "statusline", "todos", "usage", "output-style", "fast", "effort", "loop", "workflows", "artifacts", "import", "upgrade"]);
var LITERALS = /* @__PURE__ */ new Set(["true", "false", "null", "nil", "None", "True", "False", "undefined", "NaN", "yes", "no", "on", "off"]);
var esc2 = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function bounded(hit, needle, tokenChars = /[\w$]/) {
  const at = hit.column - 1;
  const before = hit.text[at - 1] ?? "";
  const after = hit.text[at + needle.length] ?? "";
  const open = !tokenChars.test(needle[needle.length - 1] ?? "");
  return !tokenChars.test(before) && (open || !tokenChars.test(after)) && before !== ".";
}
async function classifyHits(ctx, hits, name, opts = {}) {
  const last = name.split(".").pop() ?? name;
  const defLike = new RegExp(`\\b(func|function|def|class|interface|type|struct|enum|trait|impl|const|let|var|fn|module)\\s+(\\([^)]*\\)\\s*)?${esc2(last)}\\b`);
  const score = (h) => Number(defLike.test(h.text)) * 2 + Number(Boolean(opts.prefer && h.text.includes(opts.prefer)));
  const ordered = [...hits].sort((a2, b) => score(b) - score(a2));
  const files2 = /* @__PURE__ */ new Set();
  const out = [];
  for (const hit of ordered) {
    if (!files2.has(hit.file)) {
      if (files2.size >= MAX_FILES_PARSED) continue;
      files2.add(hit.file);
    }
    out.push({ hit, level: await classifyOccurrence(ctx.syntax, ctx.repo, hit.file, hit.line, hit.column, name) });
    if (!opts.all && out.some((c) => c.level === "definition")) break;
  }
  return out;
}
var ev = (c) => ({ ref: `${c.hit.file}:${c.hit.line}`, excerpt: clip(c.hit.text), level: c.level });
var asFound = (list2, scopeNote = "") => list2.map((c) => ({ level: c.level, evidence: [ev(c)], why: `${c.level} at ${c.hit.file}:${c.hit.line}${scopeNote}` }));
function decide(span, found, name, missing) {
  const top = found.reduce((acc, f) => !acc || LEVEL_RANK[f.level] > LEVEL_RANK[acc.level] ? f : acc, null);
  if (span.expect === "absent") {
    const defined = found.find((f) => f.level === "definition");
    if (defined) return stale(span, `said to be gone, but ${name} is still there: ${defined.why}`, defined.evidence);
    const live = found.find((f) => VERIFYING_LEVELS.has(f.level));
    if (live) return unconfirmed(span, `said to be gone, but ${name} is still ${live.level === "declaration" ? "declared" : "used"}: ${live.why}`, live.evidence, live.level);
    const mentions = found.length ? `; ${found.length} mention${found.length === 1 ? "" : "s"} in comments or strings remain` : "";
    return verified(span, "definition", [{ ref: `no definition or use of ${name}`, level: "definition" }], `absent, as the statement says${mentions}`);
  }
  if (!top) return unconfirmed(span, missing);
  const evidence = [...top.evidence, ...found.filter((f) => f !== top && f.level === top.level).flatMap((f) => f.evidence)].slice(0, 2);
  if (VERIFYING_LEVELS.has(top.level)) return verified(span, top.level, evidence, top.why);
  if (top.level === "none" || !top.evidence.length) return unconfirmed(span, top.why, evidence, top.level);
  const where = top.level === "comment" ? "comments" : "strings or longer names";
  return unconfirmed(span, `${name} appears only in ${where} (${top.evidence[0]?.ref ?? ""})`, evidence, top.level);
}
function scopeDirs(ctx, scope) {
  const out = /* @__PURE__ */ new Set();
  for (const s of [scope, scope.replace(/\./g, "/")]) {
    for (const base of ["", ctx.pathBase, ...ctx.repo.projectDirs]) {
      const d = join8(base, s);
      if (ctx.repo.dirs.has(d)) out.add(d);
    }
  }
  if (!scope.includes("/") && !scope.includes(".")) {
    for (const d of ctx.repo.dirs) if (posix5.basename(d) === scope) out.add(d);
  }
  if (scope.includes("/") && !out.size) {
    for (const d of ctx.repo.dirs) if (scope.endsWith(`/${d}`)) out.add(d);
  }
  return [...out];
}
var LookupError = class extends Error {
};
function grep(ctx, needle, word, pathspec = ["."], limit = MAX_HITS) {
  const res = gitGrep(ctx.repo.root, needle, { word, pathspec: [...pathspec, ...NOT_CODE, ...ctx.repo.generatedExcludes, ...docExclude(ctx)], limit });
  if (res.status === "error") return { error: res.message };
  return res.status === "miss" ? [] : res.lines;
}
async function grepClassified(ctx, needle, word, pathspec = ["."], opts = {}) {
  const hits = grep(ctx, needle, word, pathspec);
  if ("error" in hits) return hits;
  const kept = word && !opts.tokenChars ? hits : hits.filter((h) => bounded(h, needle, opts.tokenChars));
  return classifyHits(ctx, kept, opts.name ?? needle, opts);
}
async function checkSymbol(ctx, span) {
  if (!ctx.repo.isGit) return blocked(span, "identifier lookups need a git repository");
  const call = span.text.endsWith("()");
  const text4 = call ? span.text.slice(0, -2) : span.text;
  if (SLASH_COMMAND.test(text4)) return checkSlashCommand(ctx, span, text4);
  const test = text4.match(TEST_PATH);
  if (test) return checkSubtest(ctx, span, test[1] ?? "", test[2] ?? "");
  if (LONG_FLAG.test(text4)) return checkFlag(ctx, span, text4);
  if (LITERALS.has(text4)) return notChecked(span, "a literal value, not a name");
  if (SHORT_FLAG.test(text4)) return blocked(span, "a short flag; which command it belongs to is in the sentence");
  if (KEBAB.test(text4) || HOST.test(text4) || text4.includes("<") || text4.startsWith("refs/")) return checkLiteral(ctx, span, text4);
  const q = qualifiedName(text4);
  if (q && q.scope.includes("/") && (ctx.repo.files.includes(text4) || ctx.repo.dirs.has(text4))) return verified(span, "definition", [{ ref: text4, level: "definition" }], `${text4} is a file of this repository`);
  if (q && (q.scope.includes("/") || scopeDirs(ctx, q.scope).length)) {
    const dirs = scopeDirs(ctx, q.scope);
    if (dirs.length) {
      const list3 = await grepClassified(ctx, q.name, true, dirs);
      if ("error" in list3) return blocked(span, `lookup failed: ${list3.error}`);
      const note = ` in ${dirs.slice(0, 2).join(", ")}`;
      if (list3.length || q.scope.includes("/")) return decide(span, asFound(list3, note), q.name, `${q.name} appears in no code file${note}`);
    }
    if (q.scope.includes("/")) return span.expect === "absent" ? verified(span, "definition", [{ ref: `no ${q.scope}/`, level: "definition" }], "absent, as the statement says") : stale(span, `no package folder ${q.scope}/ for ${q.name}`);
  }
  if (text4.includes(".")) return checkDotted(ctx, span, text4);
  if (/^[A-Za-z][A-Za-z0-9]*_$/.test(text4)) return checkPrefix(ctx, span, text4);
  const list2 = await grepClassified(ctx, call ? `${text4}(` : text4, !call, ["."], { name: text4 });
  if ("error" in list2) return blocked(span, `lookup failed: ${list2.error}`);
  if (list2.length || span.expect === "absent") return decide(span, asFound(list2), text4, `${text4} appears in no code file`);
  const named = ctx.repo.files.filter((f) => posix5.basename(f).includes(text4));
  if (named.length) return verified(span, "reference", named.slice(0, 2).map((f) => ({ ref: f, level: "reference" })), `used in file names: ${named.slice(0, 2).join(", ")}${named.length > 2 ? ` and ${named.length - 2} more` : ""}`);
  return unconfirmed(span, `${text4} appears in no code file or file name`);
}
async function checkDotted(ctx, span, text4) {
  const segs = text4.split(".");
  const pkgDirs = segs.length >= 3 ? scopeDirs(ctx, segs[0] ?? "") : [];
  const rest = pkgDirs.length ? segs.slice(1) : segs;
  const found = [];
  const literal = await grepClassified(ctx, text4, false);
  if ("error" in literal) return blocked(span, `lookup failed: ${literal.error}`);
  found.push(...asFound(literal));
  const owner = rest[rest.length - 2] ?? "";
  const member = rest[rest.length - 1] ?? "";
  if (/^[A-Z]/.test(owner) && member) found.push(...await memberOf(ctx, owner, member, pkgDirs));
  const keys = segs.every((s) => KEY.test(s));
  if (keys && segs.length === 2) found.push(...sqlColumn(ctx, segs[0] ?? "", segs[1] ?? ""));
  if (keys && !found.some((f) => f.level === "definition" || f.level === "declaration")) found.push(...configKey(ctx, segs));
  if (found.some((f) => VERIFYING_LEVELS.has(f.level) || f.level === "comment") || span.expect === "absent") return decide(span, found, text4, "");
  const reasoned = found.find((f) => f.level === "substring" && !f.evidence.length);
  if (reasoned) return unconfirmed(span, `${text4}: ${reasoned.why}`, [], "substring");
  const last = segs[segs.length - 1] ?? text4;
  const other = await grepClassified(ctx, last, true);
  if ("error" in other) throw new LookupError(other.error);
  if (other.length) {
    const sample = other[0];
    return unconfirmed(span, `${text4} appears nowhere; ${last} exists elsewhere${sample ? ` (${sample.hit.file}:${sample.hit.line})` : ""}, on something not shown to be ${segs.slice(0, -1).join(".")}`, other.slice(0, 2).map((c) => ({ ...ev(c), level: "substring" })), "substring");
  }
  return decide(span, found, text4, `${text4} appears in no code file`);
}
async function memberOf(ctx, owner, member, dirs) {
  const list2 = await grepClassified(ctx, member, true, dirs.length ? dirs : ["."], { all: true, prefer: owner });
  if ("error" in list2) throw new LookupError(list2.error);
  const out = [];
  const others = /* @__PURE__ */ new Set();
  for (const c of list2.filter((x) => x.level === "definition")) {
    const of = await ownerOf(ctx.syntax, c.hit.file, c.hit.line, c.hit.column, member);
    if (of === owner) return [{ level: "definition", evidence: [ev(c)], why: `${member} is defined on ${owner} at ${c.hit.file}:${c.hit.line}` }];
    if (of) others.add(of);
    else out.push({ level: "substring", evidence: [{ ...ev(c), level: "substring" }], why: `${member} is defined at ${c.hit.file}:${c.hit.line}, but not shown to be a member of ${owner}` });
  }
  if (others.size && !out.length) out.push({ level: "substring", evidence: [], why: `${member} is defined on ${[...others].slice(0, 3).join(", ")}, not on ${owner}` });
  return out;
}
var SQL_COLUMN = /^\s*\(?\s*["`[]?(\w+)["`\]]?\s+(?:INTEGER|INT|BIGINT|SMALLINT|TINYINT|TEXT|VARCHAR|CHAR|CHARACTER|BOOLEAN|BOOL|REAL|DOUBLE|FLOAT|NUMERIC|DECIMAL|DATE|TIME|TIMESTAMP|TIMESTAMPTZ|DATETIME|INTERVAL|JSON|JSONB|UUID|BLOB|BYTEA|SERIAL|BIGSERIAL|CITEXT|INET|MONEY)\b/i;
var CREATE_TABLE = /\bCREATE\s+(?:TEMP(?:ORARY)?\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:\w+\.)?["`[]?(\w+)/i;
function sqlColumn(ctx, table, column) {
  const hits = grep(ctx, column, true);
  if ("error" in hits) throw new LookupError(hits.error);
  const t = esc2(table);
  const c = esc2(column);
  const alter = new RegExp(`\\bALTER\\s+TABLE\\s+(?:IF\\s+EXISTS\\s+)?(?:\\w+\\.)?["\`[]?${t}["\`\\]]?\\s+ADD\\s+(?:COLUMN\\s+)?(?:IF\\s+NOT\\s+EXISTS\\s+)?["\`[]?${c}\\b`, "i");
  const use = new RegExp(`\\b(?:UPDATE|INTO|FROM|JOIN)\\s+["\`[]?${t}\\b`);
  const out = [];
  for (const hit of hits) {
    const at = `${hit.file}:${hit.line}`;
    if (alter.test(hit.text)) return [{ level: "declaration", evidence: [{ ref: at, excerpt: clip(hit.text), level: "declaration" }], why: `column ${column} added to ${table} at ${at}` }];
    if (SQL_COLUMN.exec(hit.text)?.[1] === column) {
      const lines = (ctx.repo.read(hit.file) ?? "").split("\n");
      for (let i = hit.line - 2; i >= 0 && i >= hit.line - 400; i--) {
        const m = CREATE_TABLE.exec(lines[i] ?? "");
        if (!m) continue;
        if (m[1] === table) return [{ level: "declaration", evidence: [{ ref: at, excerpt: clip(hit.text), level: "declaration" }], why: `column ${column} of table ${table} at ${at}` }];
        break;
      }
    }
    if (use.test(hit.text) && !out.length) out.push({ level: "reference", evidence: [{ ref: at, excerpt: clip(hit.text), level: "reference" }], why: `SQL on ${table} uses ${column} at ${at}` });
  }
  return out;
}
var configCache = /* @__PURE__ */ new WeakMap();
function configFiles(ctx) {
  const cached = configCache.get(ctx.repo);
  if (cached) return cached;
  const files2 = ctx.repo.find(/\.(ya?ml|toml|json)$/).filter((f) => !/(^|\/)(package-lock\.json|pnpm-lock\.yaml|composer\.lock|tsconfig\.tsbuildinfo)$/.test(f) && !/(^|\/)(fixtures?|testdata|__snapshots__)\//.test(f)).slice(0, MAX_CONFIG_FILES);
  const out = [];
  for (const file of files2) {
    const text4 = ctx.repo.read(file);
    if (!text4 || text4.length > MAX_CONFIG_BYTES) continue;
    const data = ctx.repo.structured(file, { quiet: true });
    if (data && typeof data === "object") out.push({ file, data });
  }
  configCache.set(ctx.repo, out);
  return out;
}
function hasPath(data, segs) {
  if (!segs.length) return true;
  if (Array.isArray(data)) return data.some((d) => hasPath(d, segs));
  if (!data || typeof data !== "object") return false;
  const [head = "", ...tail] = segs;
  return head in data && hasPath(data[head], tail);
}
var taggedField = (seg) => new RegExp(`^\\s*\\w+\\s+([\\w.*\\[\\]]+)\\s+\`[^\`]*\\b(?:yaml|json|toml|mapstructure|koanf|hcl):"${esc2(seg)}[,"]`);
function configKey(ctx, segs) {
  const path2 = segs.join(".");
  for (const { file, data } of configFiles(ctx)) {
    if (!hasPath(data, segs)) continue;
    const last = segs[segs.length - 1] ?? "";
    const line = (ctx.repo.read(file) ?? "").split("\n").findIndex((l) => new RegExp(`^\\s*-?\\s*["']?${esc2(last)}["']?\\s*[:=]`).test(l));
    const ref = line >= 0 ? `${file}:${line + 1}` : file;
    return [{ level: "declaration", evidence: [{ ref, level: "declaration" }], why: `key ${path2} in ${ref}` }];
  }
  let types = null;
  let at = "";
  for (const seg of segs) {
    const hits = grep(ctx, `:"${seg}`, false, ["*.go"]);
    if ("error" in hits) throw new LookupError(hits.error);
    if (!hits.length) return [];
    const fields = hits.map((h) => ({ h, m: taggedField(seg).exec(h.text) })).filter((x) => x.m);
    const allowed = types;
    const inType = allowed === null ? fields : fields.filter((x) => allowed.includes(structOf(ctx, x.h.file, x.h.line) ?? ""));
    const first = inType[0];
    if (!first?.m) return [];
    at = `${first.h.file}:${first.h.line}`;
    types = [...new Set(inType.map((x) => (x.m?.[1] ?? "").replace(/^(\*|\[\]|map\[[^\]]*\])+/, "").split(".").pop() ?? ""))];
  }
  return [{ level: "declaration", evidence: [{ ref: at, level: "declaration" }], why: `config key ${path2}: a chain of tagged struct fields ending at ${at}` }];
}
function structOf(ctx, file, line) {
  const lines = (ctx.repo.read(file) ?? "").split("\n");
  for (let i = line - 2; i >= 0; i--) {
    const m = /^type\s+(\w+)\s+struct\b/.exec(lines[i] ?? "");
    if (m) return m[1] ?? null;
    if (/^}/.test(lines[i] ?? "")) return null;
  }
  return null;
}
async function checkSubtest(ctx, span, fn, sub) {
  const list2 = await grepClassified(ctx, fn, true);
  if ("error" in list2) return blocked(span, `lookup failed: ${list2.error}`);
  const def = list2.find((c) => c.level === "definition");
  if (!def || span.expect === "absent") return decide(span, asFound(list2), fn, `test ${fn} appears in no code file`);
  const text4 = ctx.repo.read(def.hit.file) ?? "";
  const idx = [.../* @__PURE__ */ new Set([sub, sub.replace(/_/g, " ")])].map((v) => text4.indexOf(`"${v}`)).find((i) => i >= 0);
  if (idx === void 0) return unconfirmed(span, `${fn} exists (${def.hit.file}:${def.hit.line}) but has no subtest named "${sub}"`, [ev(def)], "reference");
  const line = text4.slice(0, idx).split("\n").length;
  return verified(span, "definition", [ev(def), { ref: `${def.hit.file}:${line}`, level: "definition" }], `subtest of ${fn} at ${def.hit.file}:${line}`);
}
function checkFlag(ctx, span, flag) {
  const name = flag.replace(/^-+/, "");
  const found = stringInCode(ctx, flag) ?? stringInCode(ctx, name);
  if (span.expect === "absent") return found ? unconfirmed(span, `said to be gone, but ${flag} is still a string in code at ${found.ref}`, [found], "reference") : verified(span, "definition", [{ ref: `no string ${flag} in code`, level: "definition" }], "absent, as the statement says");
  return found ? verified(span, "reference", [found], `a string in code at ${found.ref}`) : unconfirmed(span, `no code spells ${flag} as a string ("${flag}" or "${name}")`);
}
async function checkLiteral(ctx, span, text4) {
  const template = text4.includes("<");
  const literal = template ? text4.slice(0, text4.indexOf("<")) : text4;
  if (literal.length < 3) return blocked(span, "a template with too little literal text to look up");
  if (!template && KEBAB.test(text4)) {
    const named = [...ctx.repo.dirs, ...ctx.repo.files].filter((f) => posix5.basename(f).replace(/\.\w+$/, "") === text4);
    if (named.length && span.expect !== "absent") return verified(span, "definition", named.slice(0, 2).map((f) => ({ ref: f, level: "definition" })), `named ${named.slice(0, 2).join(", ")}`);
  }
  const hits = grep(ctx, literal, false);
  if ("error" in hits) return blocked(span, `lookup failed: ${hits.error}`);
  const kept = hits.filter((h) => {
    const before = h.text[h.column - 2] ?? "";
    const after = h.text[h.column - 1 + literal.length] ?? "";
    return !/[\w$-]/.test(before) && (template || !/[\w$-]/.test(after));
  });
  const list2 = await classifyHits(ctx, kept, literal);
  return decide(span, asFound(list2), text4, `${literal} appears in no code, config or folder name`);
}
function stringInCode(ctx, value2, pathspec = ["."]) {
  const hits = grep(ctx, value2, false, pathspec, 2e3);
  if ("error" in hits) throw new LookupError(hits.error);
  const hit = hits.find((h) => {
    const before = h.text[h.column - 2] ?? "";
    const after = h.text[h.column - 1 + value2.length] ?? "";
    return /["'`]/.test(before) && (/["'`]/.test(after) || /\s/.test(after) && !value2.startsWith("-"));
  });
  return hit ? { ref: `${hit.file}:${hit.line}`, excerpt: clip(hit.text), level: "reference" } : null;
}
async function textInCode(ctx, text4) {
  const hits = grep(ctx, text4, false, ["."], 50);
  if ("error" in hits) throw new LookupError(hits.error);
  if (!hits.length) return null;
  for (const hit of hits.slice(0, 10)) {
    const level = await classifyOccurrence(ctx.syntax, ctx.repo, hit.file, hit.line, hit.column, text4);
    if (VERIFYING_LEVELS.has(level)) return { ref: `${hit.file}:${hit.line}`, excerpt: clip(hit.text), level: "reference" };
  }
  return null;
}
async function checkPrefix(ctx, span, prefix) {
  const hits = grep(ctx, prefix, false);
  if ("error" in hits) return blocked(span, `lookup failed: ${hits.error}`);
  const found = [];
  const files2 = /* @__PURE__ */ new Set();
  for (const h of hits) {
    if (/[\w$]/.test(h.text[h.column - 2] ?? "") || files2.size >= MAX_FILES_PARSED) continue;
    const token = h.text.slice(h.column - 1).match(/^[\w$]+/)?.[0] ?? prefix;
    files2.add(h.file);
    const level = await classifyOccurrence(ctx.syntax, ctx.repo, h.file, h.line, h.column, token);
    found.push({ level, evidence: [{ ref: `${h.file}:${h.line}`, excerpt: clip(h.text), level }], why: `${token} at ${h.file}:${h.line}` });
    if (VERIFYING_LEVELS.has(level)) break;
  }
  const named = ctx.repo.files.filter((f) => new RegExp(`(^|[^A-Za-z0-9])${esc2(prefix)}`).test(posix5.basename(f)));
  if (named.length) found.push({ level: "reference", evidence: named.slice(0, 2).map((f) => ({ ref: f, level: "reference" })), why: `file names start with it: ${named.slice(0, 2).join(", ")}${named.length > 2 ? ` and ${named.length - 2} more` : ""}` });
  return decide(span, found, prefix, `no name or file in the repository starts with ${prefix}`);
}
function checkSlashCommand(ctx, span, text4) {
  const [, first = "", second] = SLASH_COMMAND.exec(text4) ?? [];
  const plugin = second ? first : null;
  const name = second ?? first;
  if (!plugin && BUILTIN_COMMANDS.has(name)) return notChecked(span, "a built-in Claude Code command");
  const definitions = ctx.repo.files.filter((f) => new RegExp(`(^|/)(skills/${esc2(name)}/SKILL\\.md|commands/(.+/)?${esc2(name)}\\.md|agents/${esc2(name)}\\.md)$`).test(f));
  const inPlugin = plugin ? definitions.filter((f) => {
    const root = f.split(/\/(?:skills|commands|agents)\//)[0] ?? "";
    const manifest = ctx.repo.structured(`${root ? `${root}/` : ""}.claude-plugin/plugin.json`, { quiet: true });
    return manifest?.name === plugin;
  }) : definitions;
  if (span.expect === "absent") return inPlugin.length ? stale(span, `said to be gone, but ${inPlugin[0]} still defines it`, [{ ref: inPlugin[0] ?? "", level: "definition" }]) : verified(span, "definition", [{ ref: `no command or skill ${name}`, level: "definition" }], "absent, as the statement says");
  if (inPlugin.length) return verified(span, "definition", inPlugin.slice(0, 2).map((f) => ({ ref: f, level: "definition" })), `defined by ${inPlugin[0]}${plugin ? ` in plugin ${plugin}` : ""}`);
  if (plugin && definitions.length) return unconfirmed(span, `${definitions[0]} defines ${name}, but not in a plugin named ${plugin}`, [{ ref: definitions[0] ?? "", level: "reference" }], "reference");
  if (!plugin) {
    const hits = grep(ctx, text4, false, ["."], 2e3);
    if ("error" in hits) throw new LookupError(hits.error);
    const route = hits.find((h) => /["'`]/.test(h.text[h.column - 2] ?? "") && !/[\w-]/.test(h.text[h.column - 1 + text4.length] ?? ""));
    if (route) return verified(span, "reference", [{ ref: `${route.file}:${route.line}`, excerpt: clip(route.text), level: "reference" }], `a URL path in code at ${route.file}:${route.line}`);
  }
  return unconfirmed(span, `no command, skill or agent in this repository defines ${text4}${plugin ? "" : ", and no code spells it as a URL path"}; fine if it comes from a user-level skill or an installed plugin`);
}

// src/verify/commands.ts
var YARN_BUILTINS = /* @__PURE__ */ new Set(["install", "add", "remove", "upgrade", "up", "init", "dlx", "why", "info", "workspaces", "global", "cache", "config", "set", "exec", "node", "bin", "pack", "publish", "link", "unlink", "audit", "outdated", "create", "import", "dedupe", "npm", "plugin", "constraints", "version", "patch", "rebuild", "explain", "upgrade-interactive", "policies"]);
var PNPM_BUILTINS = /* @__PURE__ */ new Set(["install", "i", "add", "remove", "rm", "update", "up", "exec", "dlx", "create", "init", "link", "unlink", "publish", "pack", "outdated", "audit", "why", "list", "ls", "store", "prune", "fetch", "rebuild", "deploy", "env", "setup", "config", "patch", "approve-builds"]);
var BUN_BUILTINS = /* @__PURE__ */ new Set(["install", "i", "add", "remove", "rm", "update", "x", "create", "init", "build", "link", "unlink", "pm", "upgrade", "outdated", "publish", "patch"]);
var CARGO_BUILTINS = /* @__PURE__ */ new Set(["build", "b", "check", "c", "clean", "doc", "d", "new", "init", "add", "remove", "run", "r", "test", "t", "bench", "update", "search", "publish", "install", "uninstall", "fmt", "clippy", "fix", "tree", "vendor", "metadata", "package", "login", "yank", "owner", "locate-project", "generate-lockfile", "fetch", "rustc", "rustdoc", "version", "help", "nextest", "watch", "expand", "deny", "audit", "llvm-cov", "miri", "machete", "udeps", "outdated"]);
var MAVEN_PHASES = /* @__PURE__ */ new Set(["clean", "validate", "compile", "test", "package", "verify", "install", "deploy", "site", "test-compile", "integration-test", "spotless:apply", "spotless:check", "dependency:tree"]);
function pkgIn(ctx, dir) {
  const file = join8(dir, "package.json");
  if (ctx.repo.brokenManifest(file)) return "broken";
  return ctx.repo.packages.find((p) => p.dir === dir) ?? null;
}
function checkScript(ctx, span, script, dirs, workspace) {
  if (workspace) {
    const pkg = ctx.repo.packages.find((p) => p.name === workspace || p.dir === workspace || p.dir.endsWith(`/${workspace}`));
    if (!pkg) return stale(span, `no workspace package named ${workspace}`);
    return script in pkg.scripts ? verified(span, "definition", [{ ref: `${pkg.file} scripts.${script}`, excerpt: pkg.scripts[script], level: "definition" }], `script "${script}" in ${pkg.file}`) : stale(span, `${pkg.file} defines no "${script}" script`);
  }
  for (const dir of dirs) {
    const pkg = pkgIn(ctx, dir);
    if (pkg === "broken") return blocked(span, `${join8(dir, "package.json")} does not parse: ${ctx.repo.brokenManifest(join8(dir, "package.json"))}`);
    if (!pkg) continue;
    if (script in pkg.scripts) return verified(span, "definition", [{ ref: `${pkg.file} scripts.${script}`, excerpt: pkg.scripts[script], level: "definition" }], `script "${script}" in ${pkg.file}`);
    const elsewhere = ctx.repo.packages.filter((p) => script in p.scripts && p !== pkg);
    if (elsewhere.length) return unconfirmed(span, `${pkg.file} has no "${script}" script; ${elsewhere.map((p) => p.file).join(", ")} define${elsewhere.length === 1 ? "s" : ""} one`, elsewhere.slice(0, 3).map((p) => ({ ref: `${p.file} scripts.${script}`, level: "definition" })));
    return stale(span, `no package.json defines a "${script}" script (${pkg.file} has ${Object.keys(pkg.scripts).slice(0, 8).join(", ") || "none"})`);
  }
  const anywhereDefined = ctx.repo.packages.filter((p) => script in p.scripts);
  if (anywhereDefined.length) return unconfirmed(span, `no package.json where this runs; ${anywhereDefined.map((p) => p.file).join(", ")} define "${script}"`, anywhereDefined.slice(0, 3).map((p) => ({ ref: `${p.file} scripts.${script}`, level: "definition" })));
  return stale(span, `no package.json defines a "${script}" script`);
}
function packageManager(ctx, span, argv, dirs) {
  const [bin, ...rest] = argv;
  const args = rest.filter((a2) => !/^--?(silent|s|quiet|q|frozen-lockfile|immutable|offline|prefer-offline|verbose|loglevel=.*|if-present)$/.test(a2));
  let workspace;
  const take = (flag) => {
    const i = args.findIndex((a2) => flag.test(a2));
    if (i < 0) return void 0;
    const inline = args[i]?.split("=")[1];
    const value2 = inline ?? args[i + 1];
    args.splice(i, inline ? 1 : 2);
    return value2;
  };
  workspace = take(/^(--workspace|-w|--filter|-F)(=|$)/) ?? workspace;
  if (bin === "yarn" && args[0] === "workspace") {
    workspace = args[1];
    args.splice(0, 2);
  }
  const first = args[0];
  if (!first) return notChecked(span, `plain \`${bin}\` installs dependencies`);
  if (bin === "npm") {
    if (first === "test" || first === "t" || first === "start" || first === "stop" || first === "restart") return checkScript(ctx, span, first === "t" ? "test" : first, dirs, workspace);
    if (first === "run" || first === "run-script" || first === "rum") return args[1] ? checkScript(ctx, span, args[1], dirs, workspace) : notChecked(span, "`npm run` lists scripts");
    return notChecked(span, `\`npm ${first}\` is a built-in command`);
  }
  if (first === "run") return args[1] ? checkScript(ctx, span, args[1], dirs, workspace) : notChecked(span, `\`${bin} run\` lists scripts`);
  const builtins = bin === "yarn" ? YARN_BUILTINS : bin === "pnpm" ? PNPM_BUILTINS : BUN_BUILTINS;
  if (builtins.has(first)) return notChecked(span, `\`${bin} ${first}\` is a built-in command`);
  if (bin === "bun" && /\.(ts|tsx|js|mjs|cjs)$/.test(first)) return fileArg(ctx, span, first, dirs);
  if (bin === "bun" && first === "test") return notChecked(span, "`bun test` is the built-in test runner");
  if (first === "test" && bin !== "yarn") return checkScript(ctx, span, "test", dirs, workspace);
  return checkScript(ctx, span, first, dirs, workspace);
}
function fileArg(ctx, span, file, dirs) {
  if (file.startsWith("/") || file.startsWith("~") || file.includes("$")) return notChecked(span, `runs ${file}, outside the repository`);
  for (const dir of dirs) {
    const rel = join8(dir, file);
    if (ctx.repo.exists(rel)) return verified(span, "definition", [{ ref: rel, level: "definition" }], `${rel} exists`);
  }
  const ignoredBy = ctx.repo.ignored(join8(dirs[0], file));
  if (ignoredBy) return notChecked(span, `git ignores ${ignoredBy}: built output, not committed`);
  return stale(span, `${join8(dirs[0], file)} does not exist`);
}
async function shellScript(ctx, span, file, sub, dirs) {
  const ignoredBy = ctx.repo.ignored(join8(dirs[0], file.replace(/^\.\//, "")));
  if (ignoredBy && !dirs.some((d) => ctx.repo.exists(join8(d, file)))) return notChecked(span, `git ignores ${ignoredBy}: built output, not committed`);
  const rel = dirs.map((d) => join8(d, file)).find((r) => ctx.repo.exists(r));
  if (!rel) return stale(span, `${join8(dirs[0], file)} does not exist`);
  if (!sub || sub.startsWith("-") || sub.includes("$") || /^["']/.test(sub)) return verified(span, "definition", [{ ref: rel, level: "definition" }], `${rel} exists`);
  const text4 = ctx.repo.read(rel) ?? "";
  const isShell = /\.(sh|bash|zsh)$/.test(rel) || /^#!.*\b(ba|z)?sh\b/.test(text4) || !/^#!/.test(text4);
  if (!isShell) return unconfirmed(span, `${rel} exists but is not a shell script; its subcommands are not read`, [{ ref: rel, level: "definition" }]);
  const entries = await shellEntries(ctx.syntax, ctx.repo, rel);
  const hit = entries?.get(sub);
  if (hit) return verified(span, "definition", [{ ref: `${rel}:${hit.line}`, excerpt: text4.split("\n")[hit.line - 1]?.trim(), level: "definition" }], `${hit.kind === "case" ? "case label" : "function"} ${sub} at ${rel}:${hit.line}`);
  const known = [...entries?.keys() ?? []];
  return stale(span, `${rel} defines no "${sub}" function or case label${known.length ? ` (it has ${known.slice(0, 10).join(", ")})` : ""}`);
}
function makefileTargets(text4) {
  const out = /* @__PURE__ */ new Map();
  text4.split("\n").forEach((l, i) => {
    const m = l.match(/^([^\s:=#][^:=]*?)\s*::?(?!=)/);
    if (!m?.[1] || l.startsWith("	")) return;
    for (const t of m[1].split(/\s+/)) if (t && !t.startsWith(".") && !out.has(t)) out.set(t, i + 1);
  });
  return out;
}
function make(ctx, span, argv, dirs) {
  const args = argv.slice(1);
  let dirsHere = dirs;
  let file;
  const targets = [];
  for (let i = 0; i < args.length; i++) {
    const a2 = args[i] ?? "";
    if (a2 === "-C" || a2 === "--directory") dirsHere = dirs.map((d) => join8(d, args[++i] ?? ""));
    else if (a2.startsWith("-C")) dirsHere = dirs.map((d) => join8(d, a2.slice(2)));
    else if (a2 === "-f" || a2 === "--file") file = args[++i];
    else if (a2.startsWith("-") || a2.includes("=")) continue;
    else targets.push(a2);
  }
  const names = file ? [file] : ["GNUmakefile", "makefile", "Makefile"];
  const here = dirsHere.flatMap((d) => names.map((n) => join8(d, n))).find((f) => ctx.repo.exists(f));
  const all2 = ctx.repo.find(/(^|\/)(GNUmakefile|makefile|Makefile)$/);
  if (!here) {
    if (!all2.length) return stale(span, `no Makefile${dirsHere[0] ? ` in ${dirsHere[0]}/` : ""} or anywhere in the repository`);
    const defining = all2.filter((f) => targets.every((t) => makefileTargets(ctx.repo.read(f) ?? "").has(t)));
    if (defining.length) return unconfirmed(span, `no Makefile where this runs; ${defining.join(", ")} define${defining.length === 1 ? "s" : ""} ${targets.join(" ") || "a default target"}: run it from that folder or say where`, defining.slice(0, 3).map((f) => ({ ref: f, level: "definition" })));
    return stale(span, `no Makefile where this runs, and none defines ${targets.join(" ")}`);
  }
  const text4 = ctx.repo.read(here) ?? "";
  const map = makefileTargets(text4);
  if (!targets.length) return verified(span, "definition", [{ ref: here, level: "definition" }], `${here} has a default target`);
  const missing = targets.filter((t) => !map.has(t) && !/^%/.test(t));
  const pattern = [...map.keys()].some((k) => k.includes("%"));
  if (missing.length && !pattern) return stale(span, `${here} defines no ${missing.join(", ")} target`);
  if (missing.length) return unconfirmed(span, `${here} has pattern rules that may build ${missing.join(", ")}`, [{ ref: here, level: "reference" }], "reference");
  const first = targets[0] ?? "";
  return verified(span, "definition", [{ ref: `${here}:${map.get(first)}`, excerpt: text4.split("\n")[(map.get(first) ?? 1) - 1]?.trim(), level: "definition" }], `target ${targets.join(", ")} in ${here}`);
}
function just(ctx, span, argv, dirs) {
  const recipe = argv.slice(1).find((a2) => !a2.startsWith("-"));
  const file = dirs.flatMap((d) => ["justfile", "Justfile", ".justfile"].map((n) => join8(d, n))).find((f) => ctx.repo.exists(f));
  if (!file) return stale(span, "no justfile where this runs");
  if (!recipe) return verified(span, "definition", [{ ref: file, level: "definition" }], `${file} exists`);
  const lines = (ctx.repo.read(file) ?? "").split("\n");
  const at = lines.findIndex((l) => new RegExp(`^@?${recipe.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s[^:=]*)?:(?!=)`).test(l));
  return at >= 0 ? verified(span, "definition", [{ ref: `${file}:${at + 1}`, excerpt: lines[at]?.trim(), level: "definition" }], `recipe ${recipe} in ${file}`) : stale(span, `${file} defines no "${recipe}" recipe`);
}
function task(ctx, span, argv, dirs) {
  const name = argv.slice(1).find((a2) => !a2.startsWith("-"));
  const file = dirs.flatMap((d) => ["Taskfile.yml", "Taskfile.yaml", "taskfile.yml", "taskfile.yaml"].map((n) => join8(d, n))).find((f) => ctx.repo.exists(f));
  if (!file) return stale(span, "no Taskfile where this runs");
  const data = ctx.repo.structured(file);
  if (!data) return blocked(span, `${file} does not parse`);
  if (!name) return verified(span, "definition", [{ ref: file, level: "definition" }], `${file} exists`);
  return data.tasks && name in data.tasks ? verified(span, "definition", [{ ref: `${file} tasks.${name}`, level: "definition" }], `task ${name} in ${file}`) : stale(span, `${file} defines no "${name}" task`);
}
function pythonModule(ctx, mod, dirs) {
  const p = mod.replace(/\./g, "/");
  for (const d of [...dirs, "src", ...ctx.repo.projectDirs]) {
    for (const c of [`${p}.py`, `${p}/__init__.py`, `${p}/__main__.py`]) if (ctx.repo.exists(join8(d, c))) return join8(d, c);
  }
  return null;
}
function python(ctx, span, argv, dirs) {
  const args = argv.slice(1);
  const m = args.indexOf("-m");
  if (m >= 0) {
    const mod = args[m + 1];
    if (!mod) return notChecked(span, "no module given");
    const found = pythonModule(ctx, mod, dirs);
    return found ? verified(span, "definition", [{ ref: found, level: "definition" }], `module ${mod} at ${found}`) : notChecked(span, `module ${mod} comes from the environment, not this repository`);
  }
  const file = args.find((a2) => !a2.startsWith("-"));
  if (!file || args.includes("-c")) return notChecked(span, "runs inline code");
  return fileArg(ctx, span, file, dirs);
}
function pyprojectScripts(ctx, dirs) {
  for (const d of dirs) {
    const file = join8(d, "pyproject.toml");
    const data = ctx.repo.structured(file);
    if (!data) continue;
    const names = /* @__PURE__ */ new Set([
      ...Object.keys(data.project?.scripts ?? {}),
      ...Object.keys(data.tool?.poetry?.scripts ?? {}),
      ...Object.keys(data.tool?.pdm?.scripts ?? {}),
      ...Object.values(data.tool?.hatch?.envs ?? {}).flatMap((e) => Object.keys(e?.scripts ?? {})),
      ...Object.keys(data.tool?.taskipy?.tasks ?? {}),
      ...Object.keys(data.tool?.poe?.tasks ?? {})
    ]);
    return { file, scripts: names };
  }
  return null;
}
function pythonRunner(ctx, span, argv, dirs) {
  const [bin, sub, ...rest] = argv;
  if (sub !== "run") return notChecked(span, `\`${bin} ${sub ?? ""}\` is a built-in command`);
  const target = rest.find((a2) => !a2.startsWith("-"));
  if (!target) return notChecked(span, "no command given");
  if (/\.py$/.test(target) || target.includes("/")) return fileArg(ctx, span, target, dirs);
  if (target === "python" || target === "python3") return python(ctx, span, ["python", ...rest.slice(rest.indexOf(target) + 1)], dirs);
  const py = pyprojectScripts(ctx, dirs);
  if (py?.scripts.has(target)) return verified(span, "definition", [{ ref: `${py.file} ${target}`, level: "definition" }], `script ${target} in ${py.file}`);
  return notChecked(span, `runs ${target} from the environment${py ? ` (not a script in ${py.file})` : ""}`);
}
function tox(ctx, span, argv, dirs) {
  const file = dirs.map((d) => join8(d, "tox.ini")).find((f) => ctx.repo.exists(f));
  if (!file) return stale(span, "no tox.ini where this runs");
  const e = argv.indexOf("-e");
  const env = e >= 0 ? argv[e + 1] : void 0;
  if (!env) return verified(span, "definition", [{ ref: file, level: "definition" }], `${file} exists`);
  const text4 = ctx.repo.read(file) ?? "";
  const ok3 = env.split(",").every((x) => new RegExp(`\\[testenv:${x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]|envlist\\s*=.*\\b${x}\\b`, "s").test(text4));
  return ok3 ? verified(span, "definition", [{ ref: file, level: "definition" }], `env ${env} in ${file}`) : stale(span, `${file} defines no ${env} env`);
}
function nox(ctx, span, argv, dirs) {
  const file = dirs.map((d) => join8(d, "noxfile.py")).find((f) => ctx.repo.exists(f));
  if (!file) return stale(span, "no noxfile.py where this runs");
  const s = argv.findIndex((a2) => a2 === "-s" || a2 === "--session");
  const session = s >= 0 ? argv[s + 1] : void 0;
  if (!session) return verified(span, "definition", [{ ref: file, level: "definition" }], `${file} exists`);
  const lines = (ctx.repo.read(file) ?? "").split("\n");
  const at = lines.findIndex((l) => new RegExp(`^def ${session}\\b`).test(l));
  return at >= 0 ? verified(span, "definition", [{ ref: `${file}:${at + 1}`, level: "definition" }], `session ${session} in ${file}`) : stale(span, `${file} defines no "${session}" session`);
}
var GO_VALUE_FLAGS = /* @__PURE__ */ new Set(["-o", "-C", "-p", "-ldflags", "-gcflags", "-asmflags", "-tags", "-mod", "-modfile", "-pkgdir", "-toolexec", "-overlay", "-pgo", "-run", "-skip", "-bench", "-benchtime", "-count", "-cpu", "-timeout", "-parallel", "-coverprofile", "-covermode", "-coverpkg", "-cpuprofile", "-memprofile", "-blockprofile", "-mutexprofile", "-trace", "-outputdir", "-exec", "-json", "-vet", "-shuffle", "-fuzz", "-fuzztime"]);
function goCmd(ctx, span, argv, dirs) {
  const mod = [...dirs, ...ctx.repo.projectDirs].map((d) => join8(d, "go.mod")).find((f) => ctx.repo.exists(f));
  if (!mod) return stale(span, "no go.mod in this repository");
  const sub = argv[1];
  const pkgs = argv.slice(2).filter((a2, i, all2) => /^\.{1,2}(\/|$)/.test(a2) && !GO_VALUE_FLAGS.has(all2[i - 1] ?? ""));
  for (const p of pkgs) {
    const clean = p.replace(/\/\.\.\.$/, "").replace(/^\.\/?/, "");
    if (clean === "" || clean === "...") continue;
    if (!dirs.some((d) => ctx.repo.exists(join8(d, clean)))) return stale(span, `go package ${p} does not exist`);
  }
  return verified(span, pkgs.length ? "definition" : "reference", [{ ref: mod, level: "reference" }], `go ${sub ?? ""}${pkgs.length ? ` on ${pkgs.join(" ")}` : ""} in a Go module (${mod})`);
}
function cargo(ctx, span, argv, dirs) {
  const manifest = [...dirs, ...ctx.repo.projectDirs].map((d) => join8(d, "Cargo.toml")).find((f) => ctx.repo.exists(f));
  if (!manifest) return stale(span, "no Cargo.toml in this repository");
  const sub = argv[1] ?? "";
  const aliases = [".cargo/config.toml", ".cargo/config"].map((f) => ctx.repo.structured(f)).flatMap((c) => Object.keys(c?.alias ?? {}));
  if (!CARGO_BUILTINS.has(sub) && !aliases.includes(sub)) return unconfirmed(span, `\`cargo ${sub}\` is neither a built-in command nor an alias in .cargo/config.toml; it may be a plugin`, [{ ref: manifest, level: "reference" }]);
  const p = argv.findIndex((a2) => a2 === "-p" || a2 === "--package");
  if (p >= 0) {
    const crate = argv[p + 1];
    const names = ctx.repo.find(/(^|\/)Cargo\.toml$/).map((f) => ctx.repo.structured(f)?.package?.name).filter(Boolean);
    if (crate && !names.includes(crate)) return stale(span, `no crate named ${crate} in the workspace (${names.slice(0, 8).join(", ")})`);
  }
  return verified(span, aliases.includes(sub) ? "definition" : "reference", [{ ref: manifest, level: "reference" }], `cargo ${sub} in a Cargo project (${manifest})`);
}
function compose(ctx, span, argv, dirs) {
  const args = argv[0] === "docker" ? argv.slice(2) : argv.slice(1);
  const files2 = [];
  for (let i = 0; i < args.length; i++) if (args[i] === "-f" || args[i] === "--file") files2.push(args[++i] ?? "");
  const candidates = files2.length ? files2 : ["compose.yaml", "compose.yml", "docker-compose.yaml", "docker-compose.yml"];
  const found = dirs.flatMap((d) => candidates.map((n) => join8(d, n))).filter((f) => ctx.repo.exists(f));
  if (files2.length && found.length < files2.length) return stale(span, `compose file ${files2.find((f) => !dirs.some((d) => ctx.repo.exists(join8(d, f))))} does not exist`);
  if (!found.length) return stale(span, "no compose file where this runs");
  const rest = args.filter((a2, i) => !a2.startsWith("-") && args[i - 1] !== "-f" && args[i - 1] !== "--file" && args[i - 1] !== "-p" && args[i - 1] !== "--profile");
  const sub = rest[0];
  const services = new Set(found.flatMap((f) => Object.keys(ctx.repo.structured(f)?.services ?? {})));
  const named = ["up", "run", "exec", "logs", "restart", "build", "stop", "start", "rm", "pull", "create", "kill"].includes(sub ?? "") ? rest.slice(1).filter((s) => !s.includes("=")) : [];
  const target = sub === "run" || sub === "exec" ? named.slice(0, 1) : named;
  const missing = target.filter((s) => !services.has(s));
  if (missing.length) return stale(span, `${found.join(", ")} defines no ${missing.join(", ")} service (it has ${[...services].slice(0, 10).join(", ")})`);
  return verified(span, target.length ? "definition" : "reference", found.map((f) => ({ ref: f, level: target.length ? "definition" : "reference" })), target.length ? `service ${target.join(", ")} in ${found.join(", ")}` : `${found.join(", ")} exists`);
}
async function rake(ctx, span, argv, dirs) {
  const name = argv.slice(argv[0] === "bundle" ? 3 : 1).find((a2) => !a2.startsWith("-"))?.split("[")[0];
  const files2 = [.../* @__PURE__ */ new Set([...dirs.map((d) => join8(d, "Rakefile")), ...ctx.repo.find(/(^|\/)(Rakefile|[^/]+\.rake)$/)])].filter((f) => ctx.repo.exists(f));
  if (!files2.length) return stale(span, "no Rakefile where this runs");
  if (!name) return verified(span, "definition", [{ ref: files2[0] ?? "", level: "definition" }], "Rakefile exists");
  for (const f of files2) {
    const tasks = await rakeTasks(ctx.syntax, ctx.repo, f);
    const line = name.endsWith(":*") ? [...tasks.entries()].find(([t]) => t.startsWith(name.slice(0, -1)))?.[1] : tasks.get(name);
    if (line) return verified(span, "definition", [{ ref: `${f}:${line}`, excerpt: ctx.repo.lines(f)[line - 1]?.trim(), level: "definition" }], `task ${name} at ${f}:${line}`);
  }
  return unconfirmed(span, `no "${name}" task found in ${files2.slice(0, 3).join(", ")}${files2.length > 3 ? ` and ${files2.length - 3} more` : ""}; it may come from a gem`);
}
function composer(ctx, span, argv, dirs) {
  const sub = argv[1] === "run" || argv[1] === "run-script" ? argv[2] : argv[1];
  const file = dirs.map((d) => join8(d, "composer.json")).find((f) => ctx.repo.exists(f));
  if (!file) return stale(span, "no composer.json where this runs");
  const data = ctx.repo.structured(file);
  if (!data) return blocked(span, `${file} does not parse`);
  if (!sub || ["install", "update", "require", "remove", "dump-autoload", "dumpautoload", "show", "outdated", "validate", "init", "create-project"].includes(sub)) return notChecked(span, `\`composer ${sub ?? ""}\` is a built-in command`);
  return data.scripts && sub in data.scripts ? verified(span, "definition", [{ ref: `${file} scripts.${sub}`, level: "definition" }], `script ${sub} in ${file}`) : stale(span, `${file} defines no "${sub}" script`);
}
function localBin(ctx, name) {
  for (const p of ctx.repo.packages) if (p.name === name) return p.file;
  return ctx.repo.files.find((f) => /^(bin|scripts|tools)\/[^/]+$/.test(f) && posix6.basename(f).replace(/\.\w+$/, "") === name) ?? null;
}
var binCache = /* @__PURE__ */ new WeakMap();
function projectBinaries(ctx) {
  const cached = binCache.get(ctx.repo);
  if (cached) return cached;
  const out = /* @__PURE__ */ new Map();
  for (const d of ctx.repo.dirs) {
    const m = d.match(/(?:^|\/)cmd\/([\w.-]+)$/);
    if (m?.[1] && ctx.repo.files.some((f) => f.startsWith(`${d}/`) && f.endsWith(".go"))) out.set(m[1], d);
  }
  for (const p of ctx.repo.packages) {
    const json = ctx.repo.structured(p.file, { quiet: true });
    if (typeof json?.bin === "string" && typeof json.name === "string") out.set(json.name.replace(/^@[^/]+\//, ""), p.file);
    else if (json?.bin && typeof json.bin === "object") for (const k of Object.keys(json.bin)) out.set(k, p.file);
  }
  for (const f of ctx.repo.find(/(^|\/)pyproject\.toml$/)) {
    const py = ctx.repo.structured(f, { quiet: true });
    for (const k of Object.keys({ ...py?.project?.scripts, ...py?.tool?.poetry?.scripts })) out.set(k, f);
  }
  for (const f of ctx.repo.find(/(^|\/)Cargo\.toml$/)) {
    const cargo2 = ctx.repo.structured(f, { quiet: true });
    for (const b of cargo2?.bin ?? []) if (b.name) out.set(b.name, f);
    const dir = posix6.dirname(f) === "." ? "" : posix6.dirname(f);
    if (cargo2?.package?.name && ctx.repo.exists(join8(dir, "src/main.rs"))) out.set(cargo2.package.name, f);
  }
  binCache.set(ctx.repo, out);
  return out;
}
function projectBinary(ctx, name) {
  return name ? projectBinaries(ctx).get(name) ?? null : null;
}
function projectCommand(ctx, span, argv, source) {
  const tokens = argv.slice(1).filter((a2) => !/^<.*>$/.test(a2));
  const subcommands = tokens.slice(0, tokens.findIndex((a2) => a2.startsWith("-")) >>> 0).filter((a2) => /^[a-z][\w-]*$/.test(a2)).slice(0, 3);
  const flags = tokens.filter((a2) => /^--[a-z][\w-]*$/.test(a2)).map((a2) => a2.replace(/=.*$/, ""));
  const evidence = [{ ref: source, level: "definition" }];
  const home = /\.(json|toml)$/.test(source) ? posix6.dirname(source) : source;
  const cliDirs = [.../* @__PURE__ */ new Set([home === "." ? "" : home, ...[...ctx.repo.dirs].filter((d) => /(^|\/)(cli|cmd|cmds|commands?)$/.test(d))])].filter(Boolean);
  const pathspec = cliDirs.length ? cliDirs : ["."];
  for (const word of [...subcommands, ...flags]) {
    const found = stringInCode(ctx, word, pathspec) ?? (word.startsWith("--") ? stringInCode(ctx, word.slice(2), pathspec) : null);
    if (!found) return unconfirmed(span, `${argv[0]} is built from ${source}, but "${word.replace(/^--/, "")}" appears in no string in its code`, evidence, "reference");
    evidence.push(found);
  }
  const parts = [...subcommands, ...flags];
  return verified(span, "reference", evidence.slice(0, 3), `${argv[0]} is built from ${source}${parts.length ? `; ${parts.join(", ")} ${parts.length === 1 ? "is a string" : "are strings"} in its code (${evidence[1]?.ref ?? ""})` : ""}`);
}
var BIN_PACKAGES = { tsc: "typescript", tsserver: "typescript", "ts-node": "ts-node", next: "next", nuxt: "nuxt", vite: "vite", ng: "@angular/cli", nx: "nx", turbo: "turbo", jest: "jest", vitest: "vitest", playwright: "@playwright/test", cypress: "cypress", eslint: "eslint", prettier: "prettier", biome: "@biomejs/biome", tsup: "tsup", rollup: "rollup", webpack: "webpack-cli", "drizzle-kit": "drizzle-kit", prisma: "prisma", knex: "knex", "sequelize-cli": "sequelize-cli", changeset: "@changesets/cli", lerna: "lerna", "npm-run-all": "npm-run-all", concurrently: "concurrently", husky: "husky", "lint-staged": "lint-staged", tailwindcss: "tailwindcss", storybook: "storybook", wrangler: "wrangler", vercel: "vercel", "react-scripts": "react-scripts", mocha: "mocha", c8: "c8", nyc: "nyc", rimraf: "rimraf", esbuild: "esbuild", swc: "@swc/cli", "openapi-typescript": "openapi-typescript", typedoc: "typedoc", "api-extractor": "@microsoft/api-extractor" };
function binOwner(ctx, tool) {
  for (const p of ctx.repo.packages) {
    for (const dep of Object.keys(p.deps)) {
      const manifest = ctx.repo.structured(join8(p.dir, "node_modules", dep, "package.json"), { quiet: true });
      const bin = manifest?.bin;
      if (typeof bin === "string" && dep.replace(/^@[^/]+\//, "") === tool || bin && typeof bin === "object" && tool in bin) return dep;
    }
  }
  return null;
}
var GRADLE_BUILTINS = /* @__PURE__ */ new Set(["build", "clean", "test", "check", "assemble", "jar", "javadoc", "classes", "compileJava", "compileKotlin", "compileTestJava", "processResources", "dependencies", "dependencyInsight", "tasks", "projects", "properties", "help", "init", "wrapper", "publish", "publishToMavenLocal", "run", "installDist", "distZip", "bootRun", "bootJar", "bootBuildImage", "spotlessApply", "spotlessCheck", "koverHtmlReport", "jacocoTestReport", "lint", "detekt", "ktlintCheck", "ktlintFormat"]);
function gradleTasks(ctx, span, argv, build) {
  const names = argv.slice(1).filter((a2) => !a2.startsWith("-")).map((a2) => a2.split(":").pop() ?? a2).filter(Boolean);
  if (!names.length) return verified(span, "reference", [{ ref: build, level: "reference" }], `default tasks of ${build}`);
  const files2 = ctx.repo.find(/(^|\/)(build|settings)\.gradle(\.kts)?$|\.gradle(\.kts)?$/);
  const evidence = [];
  for (const name of names) {
    const n = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`tasks\\.(?:register|create|named)(?:<[^>]*>)?\\(\\s*["']${n}["']|\\btask\\s*\\(?\\s*["']?${n}\\b`);
    const hit = files2.flatMap((f) => ctx.repo.lines(f).map((l, i) => ({ f, i, l }))).find((x) => re.test(x.l));
    if (hit) evidence.push({ ref: `${hit.f}:${hit.i + 1}`, excerpt: hit.l.trim(), level: "definition" });
    else if (GRADLE_BUILTINS.has(name)) evidence.push({ ref: `${name} is a standard Gradle task`, level: "reference" });
    else return unconfirmed(span, `no build file registers a "${name}" task; it may come from a plugin`, [{ ref: build, level: "reference" }]);
  }
  const level = evidence.every((e) => e.level === "definition") ? "definition" : "reference";
  return verified(span, level, evidence.slice(0, 3), `${names.join(", ")}: ${evidence.map((e) => e.ref).join("; ")}`);
}
async function checkCommand(ctx, span) {
  const sc = splitShell(span.text)[0];
  if (!sc?.argv.length) return notChecked(span, "empty command");
  const argv = sc.argv;
  if (/<[^>]+>/.test(span.text) && !projectBinary(ctx, argv[0] ?? "")) return notChecked(span, "a template with placeholders, not a command to run");
  const dirs = workingDirs(ctx, span);
  const bin = argv[0] ?? "";
  switch (bin) {
    case "yarn":
    case "npm":
    case "pnpm":
    case "bun":
      return packageManager(ctx, span, argv, dirs);
    case "npx":
    case "bunx":
    case "pnpx": {
      const tool = argv.slice(1).find((a2) => !a2.startsWith("-"))?.replace(/@[\d^~][\w.-]*$/, "");
      if (!tool) return notChecked(span, "no tool given");
      const pkgName = BIN_PACKAGES[tool] ?? binOwner(ctx, tool) ?? tool;
      const owner = ctx.repo.packages.find((p) => pkgName in p.deps || tool in p.deps || Object.keys(p.deps).some((d) => d.endsWith(`/${tool}`)));
      return owner ? verified(span, "reference", [{ ref: `${owner.file} depends on ${pkgName}`, level: "reference" }], `${tool} comes from ${pkgName}, a dependency in ${owner.file}`) : notChecked(span, `downloads ${tool} from the registry when run`);
    }
    case "node":
    case "deno":
    case "tsx":
    case "ts-node": {
      const file = argv.slice(1).find((a2) => !a2.startsWith("-") && a2 !== "run");
      if (!file || argv.includes("-e") || argv.includes("--eval")) return notChecked(span, "runs inline code");
      return fileArg(ctx, span, file, dirs);
    }
    case "bash":
    case "sh":
    case "zsh":
    case "source":
    case ".": {
      const file = argv.slice(1).find((a2) => !a2.startsWith("-"));
      if (!file || argv.includes("-c")) return notChecked(span, "runs inline code");
      return shellScript(ctx, span, file, argv[argv.indexOf(file) + 1], dirs);
    }
    case "make":
    case "gmake":
      return make(ctx, span, argv, dirs);
    case "just":
      return just(ctx, span, argv, dirs);
    case "task":
      return task(ctx, span, argv, dirs);
    case "python":
    case "python3":
      return python(ctx, span, argv, dirs);
    case "uv":
    case "poetry":
    case "pdm":
    case "hatch":
      return pythonRunner(ctx, span, argv, dirs);
    case "tox":
      return tox(ctx, span, argv, dirs);
    case "nox":
      return nox(ctx, span, argv, dirs);
    case "go":
      return goCmd(ctx, span, argv, dirs);
    case "cargo":
      return cargo(ctx, span, argv, dirs);
    case "docker-compose":
      return compose(ctx, span, argv, dirs);
    case "docker":
      if (argv[1] === "compose") return compose(ctx, span, argv, dirs);
      return notChecked(span, `external tool \`docker ${argv[1] ?? ""}\``);
    case "rake":
      return rake(ctx, span, argv, dirs);
    case "bundle":
      return argv[1] === "exec" && argv[2] === "rake" ? rake(ctx, span, argv, dirs) : notChecked(span, `\`bundle ${argv[1] ?? ""}\` is a built-in command`);
    case "composer":
      return composer(ctx, span, argv, dirs);
    case "mvn":
    case "./mvnw": {
      const pom = dirs.map((d) => join8(d, "pom.xml")).find((f) => ctx.repo.exists(f));
      if (!pom) return stale(span, "no pom.xml where this runs");
      const goals = argv.slice(1).filter((a2) => !a2.startsWith("-"));
      const unknown = goals.filter((g) => !MAVEN_PHASES.has(g));
      return unknown.length ? unconfirmed(span, `${unknown.join(", ")} is not a standard Maven phase; plugin goals are not read`, [{ ref: pom, level: "reference" }]) : verified(span, "reference", [{ ref: pom, level: "reference" }], `standard Maven phases on ${pom}`);
    }
    case "./gradlew":
    case "gradle":
    case "gradlew": {
      const build = dirs.flatMap((d) => ["build.gradle", "build.gradle.kts", "settings.gradle", "settings.gradle.kts"].map((n) => join8(d, n))).find((f) => ctx.repo.exists(f));
      if (bin === "./gradlew" && !dirs.some((d) => ctx.repo.exists(join8(d, "gradlew")))) return stale(span, "no gradlew wrapper where this runs");
      if (!build) return stale(span, "no Gradle build file where this runs");
      return gradleTasks(ctx, span, argv, build);
    }
    case "dotnet": {
      const proj = ctx.repo.find(/\.(sln|csproj|fsproj)$/);
      return proj.length ? verified(span, "reference", [{ ref: proj[0] ?? "", level: "reference" }], `.NET project ${proj[0]}`) : stale(span, "no .sln or .csproj in this repository");
    }
    case "pytest": {
      const declared = ctx.repo.find(/(^|\/)(pyproject\.toml|requirements[\w.-]*\.txt|setup\.cfg|tox\.ini|pytest\.ini)$/).find((f) => /pytest/.test(ctx.repo.read(f) ?? ""));
      return declared ? verified(span, "reference", [{ ref: declared, level: "reference" }], `pytest is configured in ${declared}`) : notChecked(span, "pytest comes from the environment");
    }
    default:
      break;
  }
  if (/^\/[a-z][\w-]*$/.test(bin)) {
    const handler = stringInCode(ctx, bin.slice(1), [".github"]) ?? stringInCode(ctx, bin, [".github"]);
    return handler ? verified(span, "reference", [handler], `a bot command handled at ${handler.ref}`) : notChecked(span, `a command for a bot (${bin}), not a program in this repository`);
  }
  if (/^\.{0,2}\//.test(bin) || /^[\w.-]+\/[\w./-]+$/.test(bin)) {
    const file = bin.replace(/^\.\//, "");
    if (/^\.\/(gradlew|mvnw)$/.test(bin)) return fileArg(ctx, span, file, dirs);
    return shellScript(ctx, span, file, argv[1], dirs);
  }
  const program = projectBinary(ctx, bin);
  if (program) return projectCommand(ctx, span, argv, program);
  if (KNOWN_TOOLS.has(bin)) return notChecked(span, `external tool \`${bin}\``);
  const local = localBin(ctx, bin);
  if (local) return verified(span, "reference", [{ ref: local, level: "reference" }], `${bin} is provided by ${local}`);
  return notChecked(span, `\`${bin}\` is not a command this repository defines`);
}

// src/verify/manifests.ts
var cache = /* @__PURE__ */ new WeakMap();
var pep508Name = (req) => (req.trim().match(/^([A-Za-z0-9][A-Za-z0-9._-]*)/)?.[1] ?? "").toLowerCase();
var pep508Spec = (req) => req.trim().replace(/^[A-Za-z0-9][A-Za-z0-9._-]*(\[[^\]]*\])?/, "").split(";")[0]?.trim() ?? "";
function declaredDependencies(repo) {
  const hit = cache.get(repo);
  if (hit) return hit;
  const out = [];
  for (const p of repo.packages) for (const [name, spec] of Object.entries(p.deps)) out.push({ ecosystem: "npm", name, spec: String(spec), file: p.file });
  for (const file of repo.find(/(^|\/)pyproject\.toml$/)) {
    const data = repo.structured(file);
    if (!data) continue;
    const reqs = [...data.project?.dependencies ?? [], ...Object.values(data.project?.["optional-dependencies"] ?? {}).flat(), ...Object.values(data["dependency-groups"] ?? {}).flat().filter((x) => typeof x === "string")];
    for (const r of reqs) out.push({ ecosystem: "pypi", name: pep508Name(r), spec: pep508Spec(r), file });
    for (const [name, spec] of Object.entries({ ...data.tool?.poetry?.dependencies, ...data.tool?.poetry?.["dev-dependencies"], ...Object.assign({}, ...Object.values(data.tool?.poetry?.group ?? {}).map((g) => g?.dependencies ?? {})) })) {
      out.push({ ecosystem: "pypi", name: name.toLowerCase(), spec: typeof spec === "string" ? spec : String(spec?.version ?? ""), file });
    }
  }
  for (const file of repo.find(/(^|\/)requirements[\w.-]*\.(txt|in)$/)) {
    for (const line of (repo.read(file) ?? "").split("\n")) {
      const l = line.split("#")[0]?.trim() ?? "";
      if (!l || l.startsWith("-")) continue;
      out.push({ ecosystem: "pypi", name: pep508Name(l), spec: pep508Spec(l), file });
    }
  }
  for (const file of repo.find(/(^|\/)setup\.py$/)) {
    const m = (repo.read(file) ?? "").match(/install_requires\s*=\s*\[([^\]]*)\]/s);
    for (const r of m?.[1]?.match(/["']([^"']+)["']/g) ?? []) out.push({ ecosystem: "pypi", name: pep508Name(r.slice(1, -1)), spec: pep508Spec(r.slice(1, -1)), file });
  }
  for (const file of repo.find(/(^|\/)go\.mod$/)) {
    for (const m of (repo.read(file) ?? "").matchAll(/^\s*(?:require\s+)?([\w.-]+\.[\w./-]+)\s+(v[\w.+-]+)/gm)) out.push({ ecosystem: "go", name: m[1] ?? "", spec: m[2] ?? "", file });
  }
  for (const file of repo.find(/(^|\/)Cargo\.toml$/)) {
    const data = repo.structured(file);
    if (!data) continue;
    for (const section of [data.dependencies, data["dev-dependencies"], data["build-dependencies"], data.workspace?.dependencies]) {
      for (const [name, spec] of Object.entries(section ?? {})) out.push({ ecosystem: "cargo", name, spec: typeof spec === "string" ? spec : String(spec?.version ?? ""), file });
    }
  }
  for (const file of repo.find(/(^|\/)Gemfile$/)) {
    for (const m of (repo.read(file) ?? "").matchAll(/^\s*gem\s+["']([^"']+)["'](?:\s*,\s*["']([^"']+)["'])?/gm)) out.push({ ecosystem: "gem", name: m[1] ?? "", spec: m[2] ?? "", file });
  }
  for (const file of repo.find(/(^|\/)composer\.json$/)) {
    const data = repo.structured(file);
    for (const [name, spec] of Object.entries({ ...data?.require, ...data?.["require-dev"] })) out.push({ ecosystem: "composer", name, spec: String(spec), file });
  }
  for (const file of repo.find(/(^|\/)(pom\.xml|build\.gradle(\.kts)?)$/)) {
    for (const m of (repo.read(file) ?? "").matchAll(/<groupId>([^<]+)<\/groupId>\s*<artifactId>([^<]+)<\/artifactId>|["']([\w.-]+):([\w.-]+)(?::([\w.+-]+))?["']/g)) {
      const group = m[1] ?? m[3];
      const artifact = m[2] ?? m[4];
      if (group && artifact) out.push({ ecosystem: "maven", name: `${group}:${artifact}`, spec: m[5] ?? "", file });
    }
  }
  for (const file of repo.find(/\.(csproj|fsproj)$/)) {
    for (const m of (repo.read(file) ?? "").matchAll(/<PackageReference\s+Include="([^"]+)"(?:\s+Version="([^"]+)")?/g)) out.push({ ecosystem: "nuget", name: m[1] ?? "", spec: m[2] ?? "", file });
  }
  cache.set(repo, out);
  return out;
}
function nameMatches(declared, entry) {
  if (/[/*-]$/.test(entry)) return declared.toLowerCase().startsWith(entry.replace(/\*$/, "").toLowerCase());
  return declared.toLowerCase() === entry.toLowerCase();
}

// src/verify/deps.ts
function checkDependency(ctx, span) {
  const alias = DEPENDENCY_ALIASES.find((a2) => a2.name === span.text);
  if (!alias && /^@[\w.-]+\/([\w.-]+|\*)$/.test(span.text)) return checkPackage(ctx, span);
  if (!alias) return blocked(span, `no alias rule for ${span.text}`);
  const declared = declaredDependencies(ctx.repo).filter((d) => (alias[d.ecosystem] ?? []).some((e) => nameMatches(d.name, e)));
  const files2 = [...(alias.files ?? []).flatMap((re) => ctx.repo.files.filter((f) => re.test(f))), ...contentMatches(ctx, alias.content)].slice(0, 3);
  const found = declared.length > 0 || files2.length > 0;
  if (span.expect === "absent") {
    if (!found) return verified(span, "declaration", [{ ref: `no manifest declares ${span.text}`, level: "declaration" }], "absent, as the statement says");
    const first = declared[0];
    return stale(span, `said to be gone, but ${first ? `${first.file} still depends on ${first.name}` : `${files2[0]} still exists`}`, first ? [{ ref: `${first.file} ${first.name} "${first.spec}"`, level: "declaration" }] : files2.map((f) => ({ ref: f, level: "definition" })));
  }
  if (declared.length) {
    const shown2 = declared.slice(0, 3).map((d) => ({ ref: `${d.file} ${d.name}${d.spec ? ` "${d.spec}"` : ""}`, level: "declaration" }));
    return verified(span, "declaration", shown2, `${declared[0]?.file} depends on ${declared[0]?.name}`);
  }
  if (files2.length) return verified(span, "definition", files2.map((f) => ({ ref: f, level: "definition" })), `${files2[0]} proves ${span.text} is used`);
  const ecosystems = ["npm", "pypi", "go", "cargo", "gem", "composer", "maven", "nuget"].filter((e) => alias[e]?.length);
  return unconfirmed(span, `no manifest declares ${span.text} (checked ${ecosystems.join(", ") || "files"}); fine if it names an external service`);
}
function contentMatches(ctx, rule) {
  if (!rule) return [];
  const out = [];
  for (const f of ctx.repo.find(rule.files).slice(0, 500)) {
    if (rule.pattern.test(ctx.repo.read(f) ?? "")) out.push(f);
    if (out.length >= 3) break;
  }
  return out;
}
function checkPackage(ctx, span) {
  const want = span.text;
  const prefix = want.endsWith("/*") ? want.slice(0, -1) : null;
  const declared = declaredDependencies(ctx.repo).filter((d) => d.ecosystem === "npm" && (prefix ? d.name.startsWith(prefix) : d.name === want));
  const first = declared[0];
  if (span.expect === "absent") {
    return first ? unconfirmed(span, `said to be gone, but ${first.file} still depends on ${first.name}`, [{ ref: `${first.file} ${first.name}`, level: "declaration" }], "declaration") : verified(span, "declaration", [{ ref: `no package.json declares ${want}`, level: "declaration" }], "absent, as the statement says");
  }
  if (first) return verified(span, "declaration", declared.slice(0, 2).map((d) => ({ ref: `${d.file} ${d.name} "${d.spec}"`, level: "declaration" })), `${first.file} depends on ${first.name}`);
  return unconfirmed(span, `no package.json declares ${want}`);
}

// src/verify/env.ts
var esc3 = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function checkEnv(ctx, span) {
  if (!ctx.repo.isGit) return blocked(span, "lookups need a git repository");
  const eq = span.text.indexOf("=");
  const key = span.text.slice(0, eq);
  const value2 = span.text.slice(eq + 1).replace(/^["']|["']$/g, "");
  if (!key || !value2) return notChecked(span, "not an assignment");
  const res = gitGrep(ctx.repo.root, key, { word: true, pathspec: [".", ":(exclude,glob)**/*.md", ...ctx.repo.generatedExcludes, ...docExclude(ctx)], limit: 2e3 });
  if (res.status === "error") return blocked(span, `lookup failed: ${res.message}`);
  if (res.status === "miss") return unconfirmed(span, `${key} appears nowhere in the repository`);
  const k = esc3(key);
  const v = esc3(value2);
  const declaration = [
    new RegExp(`(^|[\\s"'-])${k}\\s*=\\s*["']?${v}["']?(\\s|$|[;,#])`),
    // .env, shell, Dockerfile ENV K=v, compose list
    new RegExp(`(^|\\s|["'])${k}["']?\\s*:\\s*["']?${v}["']?\\s*(#.*)?$`),
    // YAML map
    new RegExp(`^\\s*ENV\\s+${k}\\s+["']?${v}["']?\\s*$`)
    // Dockerfile ENV K v
  ];
  const comparison = new RegExp(`${k}["'\\]\\)]*\\s*(===?|!==?|==|!=)\\s*["'\`]${v}["'\`]|["'\`]${v}["'\`]\\s*(===?|!==?|==|!=)\\s*[\\w.$\\[\\]"'(]*${k}`);
  for (const hit of res.lines) {
    if (declaration.some((re) => re.test(hit.text))) return verified(span, "declaration", [{ ref: `${hit.file}:${hit.line}`, excerpt: clip(hit.text), level: "declaration" }], `declared at ${hit.file}:${hit.line}`);
  }
  for (const hit of res.lines) {
    if (comparison.test(hit.text)) return verified(span, "definition", [{ ref: `${hit.file}:${hit.line}`, excerpt: clip(hit.text), level: "definition" }], `read and compared to "${value2}" at ${hit.file}:${hit.line}`);
  }
  const first = res.lines[0];
  return unconfirmed(span, `${key} is used${first ? ` (${first.file}:${first.line})` : ""}, but never set to or compared with "${value2}"`, first ? [{ ref: `${first.file}:${first.line}`, excerpt: clip(first.text), level: "reference" }] : [], "reference");
}

// src/verify/paths.ts
import { homedir as homedir4 } from "node:os";
import { existsSync as existsSync6 } from "node:fs";
import { isAbsolute as isAbsolute3, join as joinFs, posix as posix7 } from "node:path";

// src/core/glob.ts
var BRACE_BUDGET = 1e3;
function expandBraces(pattern) {
  let out = [pattern];
  for (let guard = 0; guard < 32; guard++) {
    let changed = false;
    const next = [];
    for (const p of out) {
      const m = /\{([^{}]*,[^{}]*)\}/.exec(p);
      if (!m) {
        next.push(p);
        continue;
      }
      changed = true;
      for (const alt of (m[1] ?? "").split(",")) next.push(p.slice(0, m.index) + alt + p.slice(m.index + m[0].length));
    }
    if (next.length > BRACE_BUDGET) return [pattern];
    out = next;
    if (!changed) break;
  }
  return out;
}
function compileGlob(pattern) {
  let re = "";
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i] ?? "";
    if (c === "\\" && i + 1 < pattern.length) {
      re += (pattern[i + 1] ?? "").replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
      i++;
    } else if (c === "*") {
      if (pattern[i + 1] === "*") {
        const slash = pattern[i + 2] === "/";
        re += slash ? "(?:[^/]+/)*" : ".*";
        i += slash ? 2 : 1;
      } else re += "[^/]*";
    } else if (c === "?") re += "[^/]";
    else if (c === "[") {
      const end = pattern.indexOf("]", i + 2);
      if (end < 0) return { error: `"${pattern}" has a [ that starts no bracket expression; Claude Code matches no file with it (write \\[ for a literal bracket)` };
      const body = pattern.slice(i + 1, end).replace(/^!/, "^").replace(/\\/g, "\\\\");
      re += `[${body}]`;
      i = end;
    } else re += c.replace(/[.+^${}()|\\/]/g, "\\$&");
  }
  return { re: new RegExp(`^${re}$`) };
}
function matchGlob(pattern, files2, base = "") {
  const prefix = base ? `${base}/` : "";
  const out = /* @__PURE__ */ new Set();
  let error = null;
  for (const p of expandBraces(pattern.replace(/^\.\//, ""))) {
    const compiled = compileGlob(p);
    if ("error" in compiled) {
      error = compiled.error;
      continue;
    }
    for (const f of files2) if (f.startsWith(prefix) && compiled.re.test(f.slice(prefix.length))) out.add(f);
  }
  return { files: [...out].sort(), error };
}

// src/verify/paths.ts
function matches(ctx, base, pattern) {
  const wantDir = pattern.endsWith("/");
  const clean = join8(base, pattern.replace(/^\.\//, "").replace(/\/$/, ""));
  if (clean === "" || clean === ".") return [""];
  if (!/[*?]/.test(clean)) {
    if (!ctx.repo.exists(clean)) return [];
    if (wantDir && !ctx.repo.isDir(clean)) return [];
    return [clean];
  }
  const re = globToRegExp(clean);
  const pool = wantDir ? [...ctx.repo.dirs] : [...ctx.repo.files, ...ctx.repo.dirs];
  return pool.filter((f) => re.test(f)).sort();
}
var shown = (all2) => {
  const head = all2.slice(0, 3).map((p) => p || ".").join(", ");
  return all2.length > 3 ? `${head} and ${all2.length - 3} more` : head;
};
function resolveIn(ctx, base, text4) {
  for (const variant of [text4, bracketsAsWildcards(text4)]) {
    const found = expandAlternatives(variant).map((p) => matches(ctx, base, p));
    if (found.every((f) => f.length > 0)) return [...new Set(found.flat())];
    if (variant === bracketsAsWildcards(variant)) break;
  }
  return null;
}
function anywhere(ctx, text4) {
  const pattern = bracketsAsWildcards(text4.replace(/^\.\//, "").replace(/\/$/, ""));
  const out = /* @__PURE__ */ new Set();
  for (const p of expandAlternatives(pattern)) {
    const re = globToRegExp(`**/${p}`);
    for (const f of [...ctx.repo.files, ...ctx.repo.dirs]) if (re.test(f)) out.add(f);
  }
  return [...out].sort();
}
function absent(span, found) {
  return found?.length ? stale(span, `said to be gone, but still exists: ${shown(found)}`, found.slice(0, 3).map((f) => ({ ref: f || ".", level: "definition" }))) : verified(span, "definition", [{ ref: `no ${span.text} in the repository`, level: "definition" }], "absent, as the statement says");
}
var PLACEHOLDER_PATH = /(^|\/)path\/to\/|(^|[/_.-])(foo|bar|baz|qux|xxx|yyy)([/_.-]|$)|(^|\/)(your|my|some)[-_]/i;
var PLACEHOLDER_SEGMENT = /(^|[/._-])(ProjectName|PackageName|ComponentName|ModuleName|ClassName|TestName|FeatureName|ServiceName|AppName|Namespace|MyProject|YourProject|MyApp|YourApp|Project|Example|Sample)(?=[/._-]|$)/;
function exportOf(ctx, segments) {
  const [name, ...rest] = segments;
  if (!name || !rest.length) return null;
  for (const p of ctx.repo.packages) {
    const short = p.name?.replace(/^@[^/]+\//, "");
    if (short !== name && posix7.basename(p.dir) !== name) continue;
    const exports = ctx.repo.structured(p.file, { quiet: true })?.exports;
    if (exports && typeof exports === "object" && `./${rest.join("/")}` in exports) return `${p.file} exports["./${rest.join("/")}"]`;
  }
  return null;
}
function checkPath(ctx, span) {
  const t = span.text.trim();
  if (t.startsWith("/") || t.startsWith("~")) return notChecked(span, "outside the repository");
  const bases = workingDirs(ctx, span);
  const primary = bases[0] ?? "";
  const rel = ctx.repo.rel(t.replace(/\/$/, ""), primary);
  if (rel === null) return notChecked(span, "outside the repository");
  const ignoredBy = ctx.repo.ignored(rel + (t.endsWith("/") ? "/" : ""));
  if (ignoredBy) return notChecked(span, `git ignores ${ignoredBy}: generated output, not committed files`);
  const candidates = [...bases, ...ctx.repo.projectDirs.filter((d) => !bases.includes(d))];
  for (const base of candidates) {
    const found = resolveIn(ctx, base, t);
    if (!found) continue;
    if (span.expect === "absent") return absent(span, found);
    const note = base && !bases.includes(base) ? `found under ${base}/: ` : "";
    return verified(span, "definition", found.slice(0, 3).map((f) => ({ ref: f || ".", level: "definition" })), `${note}${shown(found)}`);
  }
  if (span.expect === "absent") {
    const elsewhere2 = anywhere(ctx, t);
    return absent(span, elsewhere2.length ? elsewhere2 : null);
  }
  const segments = t.replace(/^\.\//, "").replace(/\/$/, "").split("/");
  const first = segments[0] ?? "";
  const elsewhere = anywhere(ctx, t);
  if (elsewhere.length) {
    if (segments.length === 1 && !t.endsWith("/")) return verified(span, "definition", elsewhere.slice(0, 3).map((f) => ({ ref: f, level: "definition" })), `found at ${shown(elsewhere)}`);
    return verified(span, "definition", elsewhere.slice(0, 3).map((f) => ({ ref: f, level: "definition" })), `found at ${shown(elsewhere)}, not relative to ${ctx.docFile}`);
  }
  if (segments.length === 1 && !t.endsWith("/")) {
    const named = stringInCode(ctx, t);
    if (named) return verified(span, "reference", [named], `not a file in the repository; the code names it at ${named.ref}`);
    return unconfirmed(span, `no file named ${first} in the repository`);
  }
  if (PLACEHOLDER_PATH.test(t) || PLACEHOLDER_SEGMENT.test(t)) return notChecked(span, "an example path, not a file the statement claims exists");
  const pkg = ctx.repo.packages.find((p) => first in p.deps);
  if (pkg) return verified(span, "declaration", [{ ref: `${pkg.file} ${first}`, level: "declaration" }], `an import path into ${first}, which ${pkg.file} declares`);
  const exported = exportOf(ctx, segments);
  if (exported) return verified(span, "declaration", [{ ref: exported, level: "declaration" }], `an export of a workspace package: ${exported}`);
  if (/<[^>]+>|\{[A-Za-z_][\w-]*\}/.test(t)) return unconfirmed(span, `no file matches the pattern ${t} yet`);
  const bare = !t.endsWith("/") && !posix7.extname(segments[segments.length - 1] ?? "");
  if (bare) {
    const named = stringInCode(ctx, t);
    if (named) return verified(span, "reference", [named], `not a path: the code spells it as a name at ${named.ref}`);
  }
  const anchored = segments.length === 1 || candidates.some((b) => ctx.repo.exists(join8(b, first)));
  if (anchored) return stale(span, `not found: ${join8(primary, t)}`);
  const homes = /^[\w-]+$/.test(first) && !bare ? [...ctx.repo.dirs].filter((d) => posix7.basename(d) === first) : [];
  if (homes.length) return stale(span, `not found: no ${segments.slice(1).join("/")} under any ${first}/ folder (${shown(homes)})`);
  if (/^@?[a-z][\w-]*\/[a-z][\w-]*$/.test(t)) return notChecked(span, `reads as "${t.replace("/", " or ")}" or a rule id, not a path`);
  return unconfirmed(span, `no ${first}/ in this repository; fine if it names a folder somewhere else`);
}
function checkLink(ctx, span) {
  const t = span.text.trim();
  if (t.startsWith("/") || t.startsWith("~")) return notChecked(span, "outside the repository");
  const rel = ctx.repo.rel(t, ctx.docDir);
  if (rel === null) return notChecked(span, "links outside the repository");
  const ignoredBy = ctx.repo.ignored(rel);
  if (ignoredBy) return notChecked(span, `git ignores ${ignoredBy}: generated output`);
  if (ctx.repo.exists(rel)) return span.expect === "absent" ? absent(span, [rel]) : verified(span, "definition", [{ ref: rel, level: "definition" }], rel);
  return span.expect === "absent" ? absent(span, null) : stale(span, `broken link: ${rel} does not exist`);
}
function checkImport(ctx, span) {
  const t = span.text.trim();
  const abs = t.startsWith("~/") ? joinFs(homedir4(), t.slice(2)) : isAbsolute3(t) ? t : null;
  if (abs) return notChecked(span, existsSync6(abs) ? "imports a file outside the repository (exists on this machine)" : "imports a file outside the repository (not on this machine)");
  const rel = ctx.repo.rel(t, ctx.docDir);
  if (rel === null) return notChecked(span, "imports a file outside the repository");
  if (ctx.repo.exists(rel)) return verified(span, "definition", [{ ref: rel, level: "definition" }], `imports ${rel}`);
  if (/^[\w.-]+\/[\w.-]+$/.test(t) && ctx.repo.packages.some((p) => `@${t}` in p.deps)) return notChecked(span, `names the package @${t}, not a file`);
  if (!posix7.extname(t) && ctx.repo.exists(`${rel}.md`)) return unconfirmed(span, `no file ${rel}; ${rel}.md exists, but Claude Code imports the path as written`, [{ ref: `${rel}.md`, level: "reference" }], "reference");
  return stale(span, `broken import: ${rel} does not exist`);
}
function checkGlob(ctx, span) {
  const base = ctx.pathBase;
  const { files: files2, error } = matchGlob(span.text, ctx.repo.files, base);
  if (files2.length) return verified(span, "definition", files2.slice(0, 3).map((f) => ({ ref: f, level: "definition" })), `matches ${shown(files2)}`);
  if (error) return stale(span, error);
  if (/\[[^\]]+\]/.test(span.text)) {
    const literal = matchGlob(span.text.replace(/\[/g, "\\[").replace(/\]/g, "\\]"), ctx.repo.files, base);
    if (literal.files.length) return stale(span, `matches no file: Claude Code reads ${span.text.match(/\[[^\]]+\]/)?.[0]} as a bracket expression; write it as ${span.text.replace(/\[/g, "\\[").replace(/\]/g, "\\]")} to match ${shown(literal.files)}`);
  }
  return stale(span, `${NO_MATCH}${base ? ` under ${base}/` : ""}`);
}
var NO_MATCH = "matches no file, so this pattern never loads the rule";

// src/verify/versions.ts
function lowerBound(range) {
  const r = range.trim().replace(/^v/, "");
  if (!r || r === "*" || r === "latest" || /^(lts|stable|nightly|beta)/.test(r)) return null;
  const parts = r.split("||").map((alt) => alt.trim().match(/(\d+)(?:\.(\d+|x|\*))?(?:\.(\d+|x|\*))?/)).filter(Boolean);
  const versions = parts.map((m) => [m[1], m[2], m[3]].filter((x) => x !== void 0 && /^\d+$/.test(x)).map(Number));
  if (!versions.length) return null;
  return versions.reduce((lo, v) => compare(v, lo) < 0 ? v : lo);
}
function compare(a2, b, depth = Math.max(a2.length, b.length)) {
  for (let i = 0; i < depth; i++) {
    const d = (a2[i] ?? 0) - (b[i] ?? 0);
    if (d) return d;
  }
  return 0;
}
var show = (v) => v.join(".");
function nodeSources(ctx) {
  const out = [];
  for (const p of ctx.repo.packages) {
    const lb = p.engines.node ? lowerBound(p.engines.node) : null;
    if (lb) out.push({ where: `${p.file} engines.node "${p.engines.node}"`, version: lb, floor: true });
  }
  for (const f of [".nvmrc", ".node-version"]) {
    const v = ctx.repo.read(f)?.trim();
    const lb = v ? lowerBound(v) : null;
    if (lb && v) out.push({ where: `${f} ${v}`, version: lb, floor: true });
  }
  out.push(...toolVersions(ctx, /^(nodejs|node)\s+(\S+)/m, "node"));
  out.push(...dockerImages(ctx, /^FROM\s+(?:--platform=\S+\s+)?(?:[\w.-]+\/)?node:(\d+(?:\.\d+)*)/gim, "FROM node"));
  out.push(...ciMatrix(ctx, "node-version"));
  return out;
}
function toolVersions(ctx, re, tool) {
  const out = [];
  const tv = ctx.repo.read(".tool-versions");
  const m = tv?.match(re);
  const lb = m?.[2] ? lowerBound(m[2]) : null;
  if (lb) out.push({ where: `.tool-versions ${m?.[0]}`, version: lb, floor: true });
  for (const f of ["mise.toml", ".mise.toml"]) {
    const data = ctx.repo.structured(f);
    const v = data?.tools?.[tool];
    const spec = typeof v === "string" ? v : Array.isArray(v) ? String(v[0]) : typeof v === "object" && v ? String(v.version ?? "") : "";
    const lbm = spec ? lowerBound(spec) : null;
    if (lbm) out.push({ where: `${f} tools.${tool} "${spec}"`, version: lbm, floor: true });
  }
  return out;
}
function dockerImages(ctx, re, label) {
  const out = [];
  for (const f of ctx.repo.find(/(^|\/)(Dockerfile[\w.-]*|[\w.-]*\.Dockerfile)$/)) {
    for (const m of (ctx.repo.read(f) ?? "").matchAll(re)) {
      const lb = m[1] ? lowerBound(m[1]) : null;
      if (lb) out.push({ where: `${f} ${label}:${m[1]}`, version: lb, floor: false });
    }
  }
  return out;
}
function composeImages(ctx, names) {
  const out = [];
  for (const f of [...ctx.repo.find(/(^|\/)(docker-)?compose[\w.-]*\.ya?ml$/), ...ctx.repo.find(/(^|\/)(Dockerfile[\w.-]*)$/)]) {
    for (const m of (ctx.repo.read(f) ?? "").matchAll(/(?:image:|FROM)\s*["']?((?:[\w.-]+\/)*([\w.-]+)):(\d+(?:\.\d+)*)/gi)) {
      if (!names.test(m[2] ?? "") && !names.test(m[1] ?? "")) continue;
      const lb = m[3] ? lowerBound(m[3]) : null;
      if (lb) out.push({ where: `${f} ${m[1]}:${m[3]}`, version: lb, floor: false });
    }
  }
  return out;
}
function ciMatrix(ctx, key) {
  const out = [];
  for (const f of ctx.repo.find(/^\.github\/workflows\/[^/]+\.ya?ml$|^\.gitlab-ci\.ya?ml$|^\.circleci\/config\.ya?ml$/)) {
    const text4 = ctx.repo.read(f) ?? "";
    for (const m of text4.matchAll(new RegExp(`${key}\\s*:\\s*\\[?([^\\]\\n]+)\\]?`, "g"))) {
      for (const v of (m[1] ?? "").split(",").map((x) => x.trim().replace(/^["']|["']$/g, ""))) {
        const lb = /^\d/.test(v) ? lowerBound(v) : null;
        if (lb) out.push({ where: `${f} ${key}: ${v}`, version: lb, floor: false });
      }
    }
  }
  return out;
}
function pythonSources(ctx) {
  const out = [];
  for (const f of ctx.repo.find(/(^|\/)pyproject\.toml$/)) {
    const data = ctx.repo.structured(f);
    const spec = data?.project?.["requires-python"] ?? data?.tool?.poetry?.dependencies?.python;
    const lb2 = typeof spec === "string" ? lowerBound(spec) : null;
    if (lb2) out.push({ where: `${f} requires-python "${spec}"`, version: lb2, floor: true });
  }
  const pv = ctx.repo.read(".python-version")?.trim().split("\n")[0];
  const lb = pv ? lowerBound(pv) : null;
  if (lb && pv) out.push({ where: `.python-version ${pv}`, version: lb, floor: true });
  out.push(...toolVersions(ctx, /^(python)\s+(\S+)/m, "python"));
  out.push(...dockerImages(ctx, /^FROM\s+(?:--platform=\S+\s+)?(?:[\w.-]+\/)?python:(\d+(?:\.\d+)*)/gim, "FROM python"));
  out.push(...ciMatrix(ctx, "python-version"));
  return out;
}
function goSources(ctx) {
  const out = [];
  for (const f of ctx.repo.find(/(^|\/)go\.mod$/)) {
    const text4 = ctx.repo.read(f) ?? "";
    const go = text4.match(/^go\s+(\d+(?:\.\d+)*)/m);
    if (go?.[1]) out.push({ where: `${f} go ${go[1]}`, version: lowerBound(go[1]) ?? [], floor: true });
    const tc = text4.match(/^toolchain\s+go(\d+(?:\.\d+)*)/m);
    if (tc?.[1]) out.push({ where: `${f} toolchain go${tc[1]}`, version: lowerBound(tc[1]) ?? [], floor: false });
  }
  out.push(...dockerImages(ctx, /^FROM\s+(?:--platform=\S+\s+)?(?:[\w.-]+\/)?golang:(\d+(?:\.\d+)*)/gim, "FROM golang"));
  out.push(...ciMatrix(ctx, "go-version"));
  return out;
}
function rustSources(ctx) {
  const out = [];
  for (const f of ["rust-toolchain", "rust-toolchain.toml"]) {
    const text4 = ctx.repo.read(f);
    const m = text4?.match(/(?:channel\s*=\s*["'])?(\d+\.\d+(?:\.\d+)?)/);
    if (m?.[1]) out.push({ where: `${f} ${m[1]}`, version: lowerBound(m[1]) ?? [], floor: true });
  }
  for (const f of ctx.repo.find(/(^|\/)Cargo\.toml$/)) {
    const data = ctx.repo.structured(f);
    const rv = data?.package?.["rust-version"] ?? data?.workspace?.package?.["rust-version"];
    if (typeof rv === "string") out.push({ where: `${f} rust-version "${rv}"`, version: lowerBound(rv) ?? [], floor: true });
  }
  return out;
}
function rubySources(ctx) {
  const out = [];
  const rv = ctx.repo.read(".ruby-version")?.trim();
  if (rv && lowerBound(rv)) out.push({ where: `.ruby-version ${rv}`, version: lowerBound(rv) ?? [], floor: true });
  const gem = ctx.repo.read("Gemfile")?.match(/^\s*ruby\s+["']([^"']+)["']/m);
  if (gem?.[1] && lowerBound(gem[1])) out.push({ where: `Gemfile ruby "${gem[1]}"`, version: lowerBound(gem[1]) ?? [], floor: true });
  out.push(...toolVersions(ctx, /^(ruby)\s+(\S+)/m, "ruby"));
  return out;
}
function phpSources(ctx) {
  const out = [];
  for (const f of ctx.repo.find(/(^|\/)composer\.json$/)) {
    const data = ctx.repo.structured(f);
    const spec = data?.require?.php;
    if (spec && lowerBound(spec)) out.push({ where: `${f} require.php "${spec}"`, version: lowerBound(spec) ?? [], floor: true });
    const platform2 = data?.config?.platform?.php;
    if (platform2 && lowerBound(platform2)) out.push({ where: `${f} config.platform.php "${platform2}"`, version: lowerBound(platform2) ?? [], floor: false });
  }
  return out;
}
function dotnetSources(ctx) {
  const out = [];
  for (const f of ctx.repo.find(/(^|\/)global\.json$/)) {
    const v = ctx.repo.structured(f, { quiet: true })?.sdk?.version;
    const m = v?.match(/^(\d+)\.(\d+)/);
    if (m) out.push({ where: `${f} sdk.version "${v}"`, version: [Number(m[1]), Number(m[2])], floor: false });
  }
  const frameworks = /* @__PURE__ */ new Map();
  for (const f of ctx.repo.find(/\.(csproj|fsproj|vbproj|props|targets)$/).slice(0, 400)) {
    for (const m of (ctx.repo.read(f) ?? "").matchAll(/<TargetFrameworks?>([^<]+)<\/TargetFrameworks?>/g)) {
      for (const tfm of (m[1] ?? "").split(";")) {
        const v = tfm.trim().match(/^net(\d+)\.(\d+)/);
        if (v && !frameworks.has(`${v[1]}.${v[2]}`)) frameworks.set(`${v[1]}.${v[2]}`, f);
      }
    }
  }
  for (const [v, f] of frameworks) out.push({ where: `${f} TargetFramework net${v}`, version: v.split(".").map(Number), floor: false });
  return out;
}
function javaSources(ctx) {
  const out = [];
  const sdkman = ctx.repo.read(".sdkmanrc")?.match(/^java=(\d+)/m);
  if (sdkman?.[1]) out.push({ where: `.sdkmanrc java=${sdkman[1]}`, version: [Number(sdkman[1])], floor: false });
  const jv = ctx.repo.read(".java-version")?.trim().match(/^(\d+)/);
  if (jv?.[1]) out.push({ where: `.java-version ${jv[1]}`, version: [Number(jv[1])], floor: false });
  for (const f of ctx.repo.find(/(^|\/)pom\.xml$/).slice(0, 50)) {
    const m = (ctx.repo.read(f) ?? "").match(/<(maven\.compiler\.release|java\.version|maven\.compiler\.source|release)>(\d+)</);
    if (m?.[2]) out.push({ where: `${f} <${m[1]}>${m[2]}`, version: [Number(m[2])], floor: true });
  }
  for (const f of ctx.repo.find(/(^|\/)build\.gradle(\.kts)?$/).slice(0, 50)) {
    const m = (ctx.repo.read(f) ?? "").match(/JavaLanguageVersion\.of\((\d+)\)|jvmToolchain\((\d+)\)|sourceCompatibility\s*=\s*(?:JavaVersion\.VERSION_)?['"]?(\d+)/);
    const v = m?.[1] ?? m?.[2] ?? m?.[3];
    if (v) out.push({ where: `${f} Java ${v}`, version: [Number(v)], floor: true });
  }
  return out;
}
function packageManagerSources(ctx, tool) {
  const out = [];
  for (const p of ctx.repo.packages) {
    const engine = p.engines[tool];
    if (engine && lowerBound(engine)) out.push({ where: `${p.file} engines.${tool} "${engine}"`, version: lowerBound(engine) ?? [], floor: true });
  }
  for (const p of ctx.repo.packages) {
    const raw = ctx.repo.read(p.file) ?? "";
    const m = raw.match(new RegExp(`"packageManager"\\s*:\\s*"${tool}@(\\d+(?:\\.\\d+)*)`));
    if (m?.[1]) out.push({ where: `${p.file} packageManager ${tool}@${m[1]}`, version: lowerBound(m[1]) ?? [], floor: false });
  }
  return out;
}
function packageSources(ctx, tech) {
  const alias = DEPENDENCY_ALIASES.find((a2) => a2.name.toLowerCase() === tech || a2.name.toLowerCase().replace(/\.js$/, "") === tech.replace(/\.js$/, "") || a2.pattern.test(tech));
  if (!alias) return null;
  const decl = declaredDependencies(ctx.repo).filter((d) => (alias[d.ecosystem] ?? []).some((e) => nameMatches(d.name, e)));
  return decl.flatMap((d) => {
    const lb = lowerBound(d.spec);
    return lb ? [{ where: `${d.file} ${d.name} "${d.spec}"`, version: lb, floor: true }] : [];
  });
}
var TECH_KEY = { "node.js": "node", golang: "go", postgres: "postgresql", "material ui": "mui", "express.js": "express", tailwindcss: "tailwind", valkey: "redis" };
function checkVersion(ctx, span) {
  const m = span.text.match(/^(.+?)\s*(?:v|version\s+)?(>=|≥|\^|~)?\s*(\d+(?:\.\d+){0,2})(\.x|\+)?$/);
  if (!m) return notChecked(span, "not a version claim");
  const raw = (m[1] ?? "").trim().toLowerCase();
  const tech = TECH_KEY[raw] ?? raw;
  const claim = (m[3] ?? "").split(".").map(Number);
  const atLeast = Boolean(m[2] && m[2] !== "~") || m[4] === "+";
  const depth = claim.length;
  const sources = tech === "node" ? nodeSources(ctx) : tech === "python" ? pythonSources(ctx) : tech === "go" ? goSources(ctx) : tech === "rust" ? rustSources(ctx) : tech === "ruby" ? rubySources(ctx) : tech === "php" ? phpSources(ctx) : tech === ".net" ? dotnetSources(ctx) : tech === "java" ? javaSources(ctx) : tech === "postgresql" ? composeImages(ctx, /^(postgres|postgis|postgresql|pgvector|timescaledb[\w-]*)$/) : tech === "redis" ? composeImages(ctx, /^(redis|valkey|redis-stack[\w-]*)$/) : tech === "mysql" ? composeImages(ctx, /^(mysql|mariadb)$/) : tech === "mongodb" ? composeImages(ctx, /^(mongo|mongodb)$/) : tech === "elasticsearch" ? composeImages(ctx, /^(elasticsearch)$/) : tech === "kafka" ? composeImages(ctx, /^(kafka|cp-kafka)$/) : tech === "pnpm" || tech === "yarn" || tech === "npm" ? packageManagerSources(ctx, tech) : packageSources(ctx, tech);
  if (sources === null) return blocked(span, `no rule reads ${m[1]} versions yet`);
  if (!sources.length) return unconfirmed(span, `nothing in the repository pins a ${m[1]} version`);
  const evidence = sources.slice(0, 4).map((s) => ({ ref: s.where, level: "declaration" }));
  if (atLeast) {
    const floors = sources.filter((s) => s.floor);
    const pool = floors.length ? floors : sources;
    const strictest = pool.reduce((hi, s) => compare(s.version, hi.version, depth) > 0 ? s : hi);
    const cmp = compare(strictest.version, claim, depth);
    if (cmp === 0) return verified(span, "declaration", evidence, `the strictest floor is ${show(strictest.version.slice(0, depth))}: ${strictest.where}`);
    if (cmp > 0) return stale(span, `the repository requires ${m[1]} ${show(strictest.version.slice(0, depth))}: ${strictest.where}`, pool.filter((s) => compare(s.version, claim, depth) > 0).slice(0, 4).map((s) => ({ ref: s.where, level: "declaration" })));
    return unconfirmed(span, `the repository allows ${m[1]} ${show(strictest.version.slice(0, depth))} (${strictest.where}); the claim is stricter than its config`, evidence, "declaration");
  }
  const equal = sources.filter((s) => compare(s.version, claim, depth) === 0);
  if (equal.length === sources.length) return verified(span, "declaration", evidence, sources.map((s) => s.where).slice(0, 3).join("; "));
  if (!equal.length) return stale(span, `the repository uses ${sources.map((s) => s.where).slice(0, 4).join("; ")}`, evidence);
  return unconfirmed(span, `versions disagree: ${sources.map((s) => s.where).slice(0, 4).join("; ")}`, evidence, "declaration");
}

// src/verify/index.ts
var normalizeRemote = (url) => url.trim().replace(/^[a-z+]+:\/\//, "").replace(/^[^@/]+@/, "").replace(/:(?!\d)/, "/").replace(/\.git$/, "").replace(/\/$/, "").toLowerCase();
var remotes = /* @__PURE__ */ new WeakMap();
function isThisRepository(ctx, url) {
  let known = remotes.get(ctx.repo);
  if (!known) {
    const res = spawnSync6("git", ["remote", "-v"], { cwd: ctx.repo.root, encoding: "utf8" });
    known = res.status === 0 ? [...new Set(res.stdout.split("\n").map((l) => l.split(/\s+/)[1] ?? "").filter(Boolean).map(normalizeRemote))] : [];
    remotes.set(ctx.repo, known);
  }
  return known.includes(normalizeRemote(url));
}
async function checkSpan(ctx, original) {
  let span = original;
  if (span.clone) {
    if (!isThisRepository(ctx, span.clone.url)) return notChecked(span, `runs in a fresh clone of ${span.clone.url}, not in this repository`);
    const dir = span.clone.dir.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    span = { ...span, text: span.text.replace(new RegExp(`(^|[\\s=])${dir}/`, "g"), "$1") };
  }
  try {
    switch (span.kind) {
      case "path":
        return checkPath(ctx, span);
      case "link":
        return checkLink(ctx, span);
      case "import":
        return checkImport(ctx, span);
      case "glob":
        return checkGlob(ctx, span);
      case "command":
        return await checkCommand(ctx, span);
      case "symbol":
        return await checkSymbol(ctx, span);
      case "env":
        return checkEnv(ctx, span);
      case "version":
        return checkVersion(ctx, span);
      case "dependency":
        return checkDependency(ctx, span);
      case "unknown":
        return await checkUnknown(ctx, span);
      case "prose":
        return notChecked(span, "nothing mechanical to check; the verifier reads it");
    }
  } catch (err) {
    if (err instanceof LookupError) return blocked(span, `lookup failed: ${err.message}`);
    return blocked(span, `check failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
async function checkUnknown(ctx, span) {
  const first = span.text.split(/\s+/)[0] ?? "";
  if (projectBinary(ctx, first)) return checkCommand(ctx, { ...span, kind: "command" });
  const text4 = span.text.trim();
  if (text4.length >= 4 && !/^[\w-]+:$/.test(text4)) {
    const found = await textInCode(ctx, text4);
    if (found) return { ...unconfirmed(span, `appears verbatim in code at ${found.ref}; what the example illustrates is not checked`, [found], "reference"), status: "NOT_CHECKED", blocked: true };
  }
  return blocked(span, "not a path, command, name or version this tool can check");
}
var TYPED = (r) => r.kind !== "prose";
function aggregate(st, results) {
  const base = { ...st, results };
  if (st.kind === "marker") return { ...base, status: "UNVERIFIED_WITH_REASON", reason: 'an ignore marker needs reason="\u2026"; without one it silences nothing', settled: false };
  const typed = results.filter(TYPED);
  const checked = typed.filter((r) => r.status !== "NOT_CHECKED");
  const firstStale = typed.find((r) => r.status === "STALE");
  const firstUnconfirmed = typed.find((r) => r.status === "UNCONFIRMED");
  const firstBlocked = typed.find((r) => r.blocked);
  let out;
  if (firstStale) out = { ...base, status: "STALE", reason: `\`${firstStale.text}\`: ${firstStale.reason}`, settled: false };
  else if (firstUnconfirmed) out = { ...base, status: "UNCONFIRMED", reason: `\`${firstUnconfirmed.text}\`: ${firstUnconfirmed.reason}`, settled: false };
  else if (firstBlocked) out = { ...base, status: "UNVERIFIED_WITH_REASON", reason: `could not check \`${firstBlocked.text}\`: ${firstBlocked.reason}`, settled: false };
  else if (checked.length && checked.every((r) => r.status === "VERIFIED")) {
    if (st.residual.length) out = { ...base, status: "UNVERIFIED_WITH_REASON", reason: `names verified; still to check: ${st.residual.join(", ")}`, settled: false };
    else out = { ...base, status: "VERIFIED", reason: "every name in it checks out", settled: checked.every((r) => r.level === "definition" || r.level === "declaration") };
  } else if (typed.length && !checked.length && !st.residual.length) out = { ...base, status: "NOT_CHECKED", reason: typed[0]?.reason ?? "outside the repository", settled: false };
  else out = { ...base, status: "UNVERIFIED_WITH_REASON", reason: st.residual.length ? `nothing mechanical settles it: ${st.residual.join(", ")}` : "nothing mechanical to check; the verifier reads it", settled: false };
  if (st.override?.reason) return { ...out, status: "OVERRIDDEN", reason: `overridden: ${st.override.reason} (was ${out.status.toLowerCase().replace(/_/g, " ")}: ${out.reason})` };
  return out;
}
function mentionedProjects(ctx, st) {
  const projects = ctx.repo.projectDirs;
  const out = /* @__PURE__ */ new Set();
  for (const s of st.spans) {
    if (s.kind !== "path" && s.kind !== "link") continue;
    const p = ctx.repo.rel(s.text.replace(/\/$/, ""), ctx.pathBase);
    if (!p) continue;
    const owner = projects.filter((d) => p === d || p.startsWith(`${d}/`)).sort((a2, b) => b.length - a2.length)[0];
    if (owner) out.add(owner);
  }
  return [...out];
}
var MEMBER_WORDS = /\b(?:with|has|have|having|contains?|exposes?|provides?|includes?|fields?|propert(?:y|ies)|methods?|members?|keys?)\b/i;
var TYPE_NAME = /^[A-Z][A-Za-z0-9]*$/;
var MEMBER_NAME = /^[a-z_$][\w$]*(\(\))?$/;
function impliedSpans(st) {
  const spans = st.spans.map((s) => {
    const fragment = s.kind === "unknown" ? /^\.([A-Za-z_$][\w$]*(?:\(\))?)$/.exec(s.text) : null;
    if (!fragment) return s;
    const owner = [...st.spans].reverse().find((o) => o.kind === "symbol" && /^[A-Z][\w$]*\.[\w$]+/.test(o.text) && st.text.indexOf(o.text) < st.text.indexOf(s.text));
    return owner ? { ...s, kind: "symbol", text: `${owner.text.split(".")[0]}.${fragment[1]}` } : s;
  });
  const type = spans.find((s) => s.kind === "symbol" && TYPE_NAME.test(s.text));
  if (!type) return spans;
  const after = st.text.slice(st.text.indexOf(`\`${type.text}\``) + type.text.length + 2);
  const cue = MEMBER_WORDS.exec(after);
  if (!cue || cue.index > 12) return spans;
  return spans.map((s) => s !== type && s.kind === "symbol" && MEMBER_NAME.test(s.text) && after.includes(`\`${s.text}\``) ? { ...s, text: `${type.text}.${s.text}` } : s);
}
async function checkStatement(ctx, st) {
  const projects = mentionedProjects(ctx, st);
  const implied = impliedSpans(st);
  const withHints = projects.length ? implied.map((s) => s.kind === "command" && s.cwd === void 0 ? { ...s, hintDirs: [...s.hintDirs ?? [], ...projects.map((d) => ctx.pathBase && d.startsWith(`${ctx.pathBase}/`) ? d.slice(ctx.pathBase.length + 1) : d)] } : s) : implied;
  const spans = withHints.length ? withHints : [{ kind: "prose", text: "(statement)", expect: "present" }];
  const results = [];
  for (const span of spans) results.push(await checkSpan(ctx, span));
  if (st.kind === "frontmatter" && results.some((r) => r.kind === "glob" && r.status === "VERIFIED")) {
    for (const [i, r] of results.entries()) if (r.kind === "glob" && r.status === "STALE" && r.reason.startsWith(NO_MATCH)) results[i] = { ...r, status: "UNCONFIRMED", reason: `${r.reason}; the rule's other patterns still load it` };
  }
  return aggregate(st, results);
}

// src/version.ts
var VERSION = true ? "0.2.0" : JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;

// src/pipeline.ts
var MAX_IMPORT_HOPS = 4;
var emptyCounts = () => ({ VERIFIED: 0, STALE: 0, UNCONFIRMED: 0, UNVERIFIED_WITH_REASON: 0, DECIDED: 0, OVERRIDDEN: 0, NOT_CHECKED: 0, FIXED: 0, FIX_REJECTED: 0 });
var emptyLevels = () => ({ definition: 0, declaration: 0, reference: 0, comment: 0, substring: 0, none: 0 });
function verdictOf(statements) {
  if (!statements.length) return "PROVEN";
  const has = (s) => statements.some((x) => x.status === s);
  if (has("STALE") || has("FIX_REJECTED")) return "NOT PROVEN";
  if (has("UNCONFIRMED") || has("UNVERIFIED_WITH_REASON")) return "PARTLY PROVEN";
  if (!statements.some((x) => x.status === "VERIFIED" || x.status === "DECIDED" || x.status === "FIXED" || x.status === "OVERRIDDEN")) return "PARTLY PROVEN";
  if (has("FIXED")) return "FIXED";
  const referenceOnly = statements.some((x) => x.status === "VERIFIED" && !x.agent && x.results.some((r) => r.status === "VERIFIED" && r.level === "reference"));
  if (has("OVERRIDDEN") || referenceOnly) return "PROVEN WITH OVERRIDES";
  return "PROVEN";
}
function improves(edited, original) {
  if (edited.status !== "UNVERIFIED_WITH_REASON" || edited.agent?.verdict === "stale") return false;
  const typed = edited.results.filter((r) => r.kind !== "prose");
  if (typed.some((r) => r.status === "STALE" || r.status === "UNCONFIRMED" || r.blocked)) return false;
  const before = new Set((original?.results ?? []).map((r) => r.text));
  const introduced = typed.filter((r) => !before.has(r.text));
  return introduced.length > 0 && introduced.every((r) => r.status === "VERIFIED");
}
function tally(r) {
  const counts = emptyCounts();
  const levels = emptyLevels();
  for (const s of r.statements) {
    counts[s.status] += 1;
    for (const x of s.results) if (x.status === "VERIFIED" || x.status === "UNCONFIRMED") levels[x.level] += 1;
  }
  r.counts = counts;
  r.evidenceLevels = levels;
  r.ownVerdict = verdictOf(r.statements);
  if (r.agent && r.agent.answered < r.agent.sent) {
    r.ownVerdict = "UNTESTED";
    r.reason = `the verifier answered ${r.agent.answered} of ${r.agent.sent} open statements: ${r.agent.failures.join("; ") || "no verdict for the rest"}`;
  }
  r.verdict = r.ownVerdict;
}
function annotateFixes(reports, fixes, dryRun) {
  for (const r of reports) {
    const f = fixes.get(r.file);
    if (!f) continue;
    r.diff = unifiedDiff(r.file, f.before, f.after);
    const outcomeOf = (e) => e.refused ? "refused" : f.rejected.includes(e) ? "rejected" : dryRun ? "dry-run" : "applied";
    r.fixes = f.proposed.map((e) => ({ statement_id: e.statementId, line: e.line, tier: e.tier, action: e.action, old: e.old, new: e.new, outcome: outcomeOf(e), reverify: f.reverified.get(e)?.verdict ?? "", refused: e.refused }));
    for (const e of f.proposed) {
      const outcome = outcomeOf(e);
      const base = { tier: e.tier, action: e.action, old: e.old, new: e.new, reason: e.reason, evidence: e.evidence, outcome, reverify: e.refused ?? f.reverified.get(e)?.verdict ?? "" };
      if (outcome === "applied") {
        const ids = new Set((f.reverified.get(e)?.statements ?? []).map((s) => s.id));
        r.statements = r.statements.map((s) => ids.has(s.id) ? s.status === "VERIFIED" || s.status === "DECIDED" ? { ...s, status: "FIXED", reason: `fixed (tier ${e.tier}) and re-verified`, fix: { ...base, was: e.was } } : { ...s, fix: { ...base, was: e.was } } : s);
        continue;
      }
      r.statements = r.statements.map((s) => {
        if (s.id !== e.statementId) return s;
        if (outcome === "rejected") return { ...s, status: "FIX_REJECTED", reason: `the fix was reverted: ${base.reverify}`, fix: base };
        return { ...s, fix: base };
      });
    }
    tally(r);
  }
  combineVerdicts(reports);
}
function combineVerdicts(reports) {
  const byFile = new Map(reports.map((r) => [r.file, r]));
  const memo = /* @__PURE__ */ new Map();
  const of = (r, stack) => {
    const known = memo.get(r.file);
    if (known) return known;
    let v = r.ownVerdict;
    stack.add(r.file);
    for (const imp of r.imports) {
      const child = imp.followed && imp.resolved ? byFile.get(imp.resolved) : void 0;
      if (child && !stack.has(child.file)) v = worst(v, of(child, stack));
    }
    stack.delete(r.file);
    memo.set(r.file, v);
    return v;
  };
  for (const r of reports) r.verdict = of(r, /* @__PURE__ */ new Set());
}
var SEVERITY = { PROVEN: 0, FIXED: 1, "PROVEN WITH OVERRIDES": 2, "PARTLY PROVEN": 3, "NOT PROVEN": 4, UNTESTED: 5 };
var worst = (a2, b) => SEVERITY[b] > SEVERITY[a2] ? b : a2;
var INSTRUCTION_EXT = /\.(md|mdc|markdown|txt)$/i;
var Run = class {
  repo;
  syntax;
  git;
  noted = false;
  constructor(cwd) {
    this.repo = new RepoContext(cwd);
    this.syntax = new Syntax(this.repo);
    this.git = this.repo.isGit ? gitState(this.repo.root) : null;
  }
  /** Languages present without a grammar are named once in the header. */
  noteGrammars() {
    if (this.noted) return;
    this.noted = true;
    for (const [re, lang] of NO_GRAMMAR) {
      const n = this.repo.files.filter((f) => re.test(f)).length;
      if (n) this.repo.degrade(`grammar ${lang}`, `no tree-sitter grammar for ${lang} (${n} file${n === 1 ? "" : "s"}): definitions there are matched by line patterns`);
    }
  }
  /** A path as the report names it: repository-relative inside the repository, absolute outside. */
  key(file, base = "") {
    const abs = file.startsWith("~/") ? join9(homedir5(), file.slice(2)) : isAbsolute4(file) ? file : resolve2(this.repo.root, base, file);
    return this.repo.rel(abs) ?? abs;
  }
  real(key) {
    try {
      return realpathSync2(isAbsolute4(key) ? key : join9(this.repo.root, key));
    } catch {
      return key;
    }
  }
  /**
   * The agent stage over reports from `checkTargets`: open statements go to the verifier, counts and
   * verdicts are recomputed, and a file whose open statements were not all answered is UNTESTED.
   */
  async verify(reports, opts) {
    const files2 = reports.filter((r) => r.statements.length).map((r) => ({ file: r.file, why: r.why, statements: r.statements }));
    const coverage = await verifyFiles(this.repo, files2, reports.map((r) => r.file), opts);
    for (const r of reports) {
      const cov = coverage.get(r.file);
      if (cov) r.agent = cov;
      tally(r);
    }
    combineVerdicts(reports);
    return reports;
  }
  /** Mechanical results for every statement of `text`, read as the file `rel`. */
  async checkText(rel, text4) {
    const doc = parseDocument(text4, rel);
    const dir = posix8.dirname(rel);
    const docDir = dir === "." ? "" : dir;
    const ctx = { repo: this.repo, syntax: this.syntax, docFile: rel, docDir, pathBase: isAbsolute4(rel) ? "" : pathBaseOf(rel, docDir) };
    const out = [];
    for (const st of doc.statements) out.push(await checkStatement(ctx, st));
    return out;
  }
  /**
   * The fix stage (spec 3.5 to 3.7): the fixer proposes an edit per stale statement, proof vets it against
   * the autofix policy, a fresh verifier re-checks each edited statement on its own, and only edits it
   * accepts are written. Every applied and rejected fix is recorded in the sidecar with tree and head.
   */
  async fix(reports, opts) {
    const out = /* @__PURE__ */ new Map();
    for (const r of reports) {
      const stale2 = r.statements.filter((s) => s.status === "STALE");
      if (!stale2.length) continue;
      const source = this.repo.read(r.file) ?? "";
      const proposed = await proposeFixes(this.repo, r.file, r.scope, stale2, r.decisions, opts);
      const outcome = { proposed: proposed.edits, accepted: [], rejected: [], failure: proposed.failure, costUsd: proposed.costUsd, before: source, after: source, reverified: /* @__PURE__ */ new Map() };
      out.set(r.file, outcome);
      const vetted = proposed.edits.filter((e) => !e.refused);
      const trial = /* @__PURE__ */ new Map();
      for (const e of vetted) {
        const candidate = applyEdits(source, [e]);
        const delta = candidate.split("\n").length - source.split("\n").length;
        const oldIds = new Set(r.statements.map((s) => s.id));
        const produced = (await this.checkText(r.file, candidate)).filter((s) => s.line >= e.line && s.line <= Math.max(e.line, e.endLine + delta) && !oldIds.has(s.id));
        trial.set(e, produced);
      }
      const toVerify = [...trial.values()].flat();
      if (toVerify.length) {
        const note = `These statements are proposed corrections that are not written yet: ${r.file} on disk still has the old text. Judge each statement exactly as given here against the repository; do not judge the file on disk.`;
        const cov = await verifyFiles(this.repo, [{ file: r.file, why: r.why, statements: toVerify, note }], reports.map((x) => x.file), { ...opts.verify, budgetUsd: Math.min(opts.verify.budgetUsd, toVerify.length * opts.verify.perStatementUsd + 0.5) });
        outcome.costUsd += cov.get(r.file)?.costUsd ?? 0;
      }
      for (const e of vetted) {
        const produced = (trial.get(e) ?? []).map((s) => toVerify.find((t) => t.id === s.id && t.line === s.line) ?? s);
        const original = r.statements.find((s) => s.id === e.statementId);
        const failed = produced.find((s) => s.status !== "VERIFIED" && s.status !== "DECIDED" && s.status !== "NOT_CHECKED" && !improves(s, original));
        const cited = failed?.agent?.evidence.find((x) => x.valid) ?? failed?.results.find((x) => x.status === "STALE")?.evidence[0];
        const verdict = failed ? `${failed.status.toLowerCase().replace(/_/g, " ")}: ${failed.agent?.rejected ?? failed.agent?.reason ?? failed.reason}${cited ? ` (${cited.ref}${"excerpt" in cited && cited.excerpt ? ` "${cited.excerpt.slice(0, 80)}"` : ""})` : ""}` : produced.length ? "verified" : "removed, with evidence of absence";
        outcome.reverified.set(e, { verdict, statements: produced });
        if (failed || e.action === "replace" && !produced.length) outcome.rejected.push(e);
        else outcome.accepted.push(e);
      }
      outcome.after = applyEdits(source, outcome.accepted);
      if (!opts.dryRun && outcome.after !== source) writeFileSync4(isAbsolute4(r.file) ? r.file : join9(this.repo.root, r.file), outcome.after);
      if (!opts.dryRun) {
        const at = (/* @__PURE__ */ new Date()).toISOString();
        const tree = this.git?.tree ?? null;
        const head = this.git?.head ?? null;
        const by = `proof ${VERSION} (${opts.model})`;
        const byId = new Map(r.statements.map((s) => [s.id, s]));
        appendDecisions(this.repo.root, r.file, [
          ...outcome.accepted.flatMap((e) => {
            const produced = outcome.reverified.get(e)?.statements ?? [];
            return (produced.length ? produced : [null]).map((p) => ({ statement_id: p?.id ?? e.statementId, text: p?.text ?? "", kind: "fixed", reason: e.reason, evidence: e.evidence.filter((x) => x.valid).map(({ kind, ref, excerpt }) => ({ kind, ref, excerpt })), by, at, tree, head, previous: byId.get(e.statementId)?.text, tier: e.tier, edit: { old: e.old, new: e.new }, line: e.line }));
          }),
          ...outcome.rejected.map((e) => ({ statement_id: e.statementId, text: byId.get(e.statementId)?.text ?? "", kind: "fix-rejected", reason: `re-verifier: ${outcome.reverified.get(e)?.verdict ?? "rejected"}`, evidence: [], by, at, tree, head, previous: byId.get(e.statementId)?.text, tier: e.tier, edit: { old: e.old, new: e.new } }))
        ]);
      }
    }
    return out;
  }
  /**
   * Check the targets and every instruction file they import, depth first, so each importer's verdict
   * includes what it pulls in. Each real file is checked once. Spec 3.1.
   */
  async checkTargets(targets, opts = {}) {
    const reports = /* @__PURE__ */ new Map();
    const order = [];
    const visit = async (target, hops, importer) => {
      const key = this.key(target.file);
      const real = this.real(key);
      const existing = reports.get(real);
      if (existing) {
        if (importer && !existing.importedBy.includes(importer)) existing.importedBy.push(importer);
        return existing;
      }
      const report = await this.checkFile(key, target);
      reports.set(real, report);
      order.push(real);
      if (importer) report.importedBy.push(importer);
      for (const imp of report.imports) {
        if (!imp.resolved) continue;
        const outside = isAbsolute4(imp.resolved);
        if (!INSTRUCTION_EXT.test(imp.resolved)) imp.note = "loaded as is; not an instruction file to check";
        else if (outside && !opts.user) imp.note = "outside the repository: pass --user to check it";
        else if (hops + 1 > MAX_IMPORT_HOPS) imp.note = `beyond ${MAX_IMPORT_HOPS} hops: Claude Code does not load it from here`;
        else {
          const child = await visit({ file: imp.resolved, why: `imported by ${report.file}`, scope: outside ? "user" : "import" }, hops + 1, report.file);
          imp.followed = true;
          imp.note = child === report ? "imports itself" : `checked: ${child.ownVerdict}`;
          report.verdict = worst(report.verdict, child.verdict);
        }
      }
      return report;
    };
    for (const t of targets) await visit(t, 0, null);
    return order.map((r) => reports.get(r)).filter((r) => Boolean(r));
  }
  /** Check one instruction file, given relative to the repository root or as an absolute path. */
  async checkFile(file, target) {
    const started = (/* @__PURE__ */ new Date()).toISOString();
    this.noteGrammars();
    const rel = this.key(file);
    const counts = emptyCounts();
    const evidenceLevels = emptyLevels();
    const base = {
      file: rel,
      scope: target?.scope ?? "project",
      why: target?.why ?? "named on the command line",
      imports: [],
      importedBy: [],
      counts,
      evidenceLevels,
      git: this.git,
      run: { started, finished: started, version: VERSION }
    };
    const text4 = this.repo.read(rel);
    if (text4 === null) return { ...base, verdict: "UNTESTED", ownVerdict: "UNTESTED", reason: `${rel} cannot be read`, coverage: { statements: 0, withResult: 0 }, degraded: [...this.repo.degraded], statements: [], decisions: [], reopened: [] };
    const doc = parseDocument(text4, rel);
    if (doc.frontmatterError) this.repo.degrade(rel, `frontmatter does not parse (${doc.frontmatterError}); Claude Code loads this rule as if it had no paths`);
    const dir = posix8.dirname(rel);
    const docDir = dir === "." ? "" : dir;
    const ctx = { repo: this.repo, syntax: this.syntax, docFile: rel, docDir, pathBase: isAbsolute4(rel) ? "" : pathBaseOf(rel, docDir) };
    this.repo.primeIgnored(doc.statements.flatMap((s) => s.spans.filter((sp) => sp.kind === "path" || sp.kind === "link").map((sp) => sp.text.replace(/^\.\//, ""))));
    const checked = [];
    for (const st of doc.statements) checked.push(await checkStatement(ctx, st));
    const sidecar = loadDecisions(this.repo.root, rel);
    if (sidecar.error) this.repo.degrade(sidecarPath(rel), `${sidecar.error}; recorded decisions are not replayed`);
    const { statements, reopened } = replayDecisions(this.repo.root, checked, sidecar.records);
    for (const s of statements) {
      counts[s.status] += 1;
      for (const r of s.results) if (r.status === "VERIFIED" || r.status === "UNCONFIRMED") evidenceLevels[r.level] += 1;
    }
    const imports = doc.imports.map((imp) => {
      const key = this.key(imp.path, isAbsolute4(rel) ? dir : ctx.docDir);
      const exists = existsSync7(isAbsolute4(key) ? key : join9(this.repo.root, key));
      return { path: imp.path, line: imp.line, resolved: exists ? key : null, followed: false, note: exists ? "" : "does not resolve to a file" };
    });
    const ownVerdict = verdictOf(statements);
    return {
      ...base,
      decisions: sidecar.records,
      reopened,
      imports,
      verdict: ownVerdict,
      ownVerdict,
      coverage: { statements: statements.length, withResult: statements.filter((s) => s.results.length > 0).length },
      degraded: [...this.repo.degraded],
      run: { ...base.run, finished: (/* @__PURE__ */ new Date()).toISOString() },
      statements: statements.sort((a2, b) => a2.line - b.line)
    };
  }
};

// src/config.ts
var DEFAULT_CONFIG = { instructionFiles: [], ownership: {}, autofix: { A: true, B: true, C: true }, budgetUsd: null };
function loadConfig(repo) {
  const raw = repo.structured(".proof.yaml");
  if (!raw || typeof raw !== "object") return DEFAULT_CONFIG;
  const tiers = raw.autofix ?? {};
  const tier = (k) => typeof tiers[k] === "boolean" ? tiers[k] : typeof tiers[k.toLowerCase()] === "boolean" ? tiers[k.toLowerCase()] : true;
  const own4 = raw.ownership && typeof raw.ownership === "object" ? Object.fromEntries(Object.entries(raw.ownership).filter(([, v]) => typeof v === "string")) : {};
  return {
    instructionFiles: Array.isArray(raw.instruction_files) ? raw.instruction_files.map(String) : [],
    ownership: own4,
    autofix: { A: tier("A"), B: tier("B"), C: tier("C") },
    budgetUsd: typeof raw.budget_usd === "number" && raw.budget_usd > 0 ? raw.budget_usd : null
  };
}

// src/human.ts
import { spawnSync as spawnSync7 } from "node:child_process";
import { writeFileSync as writeFileSync5 } from "node:fs";
import { isAbsolute as isAbsolute5, join as join10 } from "node:path";
var HumanError = class extends Error {
};
function whoAmI(root) {
  const res = spawnSync7("git", ["config", "user.name"], { cwd: root, encoding: "utf8" });
  return res.status === 0 && res.stdout.trim() || process.env.USER || "unknown";
}
function pick2(statements, which) {
  const line = /^L?(\d+)$/i.exec(which);
  const found = line ? statements.filter((s) => s.line === Number(line[1])) : statements.filter((s) => which.length >= 6 && s.id.startsWith(which));
  if (!found.length) throw new HumanError(`no statement ${which}; list them with: proof decide <file>`);
  if (found.length > 1) throw new HumanError(`${which} matches ${found.length} statements; use the id: ${found.map((s) => s.id.slice(0, 10)).join(", ")}`);
  return found[0];
}
var OPEN = /* @__PURE__ */ new Set(["UNCONFIRMED", "UNVERIFIED_WITH_REASON"]);
async function listOpen(run2, file) {
  const [report] = await run2.checkTargets([{ file, why: "named on the command line", scope: "project" }]);
  const open = (report?.statements ?? []).filter((s) => OPEN.has(s.status));
  if (!open.length) return `${file}: no open statements to decide.
`;
  return `${open.map((s) => `L${s.line}  ${s.id.slice(0, 10)}  ${s.text.slice(0, 120)}
    ${s.agent?.reason ?? s.reason}`).join("\n")}

Decide one: proof decide ${file} L<line> --rule --reason "\u2026"  or  --fact --evidence <path:line> --reason "\u2026"
`;
}
async function decide2(run2, file, which, opts) {
  if (!opts.reason.trim()) throw new HumanError('a decision needs --reason "\u2026"');
  const [report] = await run2.checkTargets([{ file, why: "named on the command line", scope: "project" }]);
  if (!report || !report.statements.length) throw new HumanError(`${file} has no statements`);
  const st = pick2(report.statements, which);
  if (st.status === "STALE" || st.status === "FIX_REJECTED") throw new HumanError(`L${st.line} is stale: the repository contradicts it (${st.reason}). Fix or delete the line instead of deciding it.`);
  if (st.status === "VERIFIED" || st.status === "DECIDED") throw new HumanError(`L${st.line} is already ${st.status.toLowerCase()}; nothing to decide`);
  const evidence = opts.evidence.map((ref) => checkEvidence(run2.repo, { kind: /:\d+(-\d+)?$/.test(ref) ? "file_line" : "command_output", ref }));
  if (opts.kind === "fact") {
    if (!evidence.length) throw new HumanError("a fact needs --evidence <path:line>; never decide a fact without evidence");
    const bad = evidence.find((e) => !e.valid);
    if (bad) throw new HumanError(`--evidence ${bad.ref} does not check out: ${bad.problem}`);
  }
  const record = {
    statement_id: st.id,
    text: st.text,
    kind: opts.kind,
    reason: opts.reason.trim(),
    evidence: evidence.map(({ kind, ref }) => ({ kind, ref })),
    by: opts.by ?? whoAmI(run2.repo.root),
    at: (/* @__PURE__ */ new Date()).toISOString(),
    tree: run2.git?.tree ?? null,
    head: run2.git?.head ?? null
  };
  appendDecisions(run2.repo.root, report.file, [record]);
  return record;
}
function revert(run2, file, id, by) {
  const rel = run2.repo.rel(file) ?? file;
  const { records } = loadDecisions(run2.repo.root, rel);
  const fixed = [...records].reverse().find((r) => r.kind === "fixed" && id.length >= 6 && r.statement_id.startsWith(id));
  if (!fixed?.edit) throw new HumanError(`no applied fix for ${id} in the sidecar of ${rel}`);
  const text4 = run2.repo.read(rel) ?? "";
  const { old, new: next } = fixed.edit;
  let reverted;
  if (next) {
    const count = text4.split(next).length - 1;
    if (count !== 1) throw new HumanError(count ? "the fixed text appears more than once; revert it by hand" : "the fixed text is no longer in the file; it was edited since");
    reverted = text4.replace(next, old);
  } else {
    const lines = text4.split("\n");
    const at = Math.max(0, Math.min(lines.length, (fixed.line ?? 1) - 1));
    reverted = [...lines.slice(0, at), old, ...lines.slice(at)].join("\n");
  }
  writeFileSync5(isAbsolute5(rel) ? rel : join10(run2.repo.root, rel), reverted);
  const record = { statement_id: fixed.statement_id, text: fixed.previous ?? "", kind: "fix-rejected", reason: `reverted by ${by ?? whoAmI(run2.repo.root)}`, evidence: [], by: by ?? whoAmI(run2.repo.root), at: (/* @__PURE__ */ new Date()).toISOString(), tree: run2.git?.tree ?? null, head: run2.git?.head ?? null, previous: fixed.previous, tier: fixed.tier, edit: fixed.edit };
  appendDecisions(run2.repo.root, rel, [record]);
  return record;
}

// src/install.ts
import { cpSync, existsSync as existsSync8, mkdirSync as mkdirSync2, readdirSync as readdirSync3, readFileSync as readFileSync4, rmSync as rmSync3, statSync as statSync3 } from "node:fs";
import { homedir as homedir6 } from "node:os";
import { dirname as dirname2, join as join11, relative as relative2 } from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";
function skillDir() {
  const here = dirname2(fileURLToPath2(import.meta.url));
  if (existsSync8(join11(here, "..", "SKILL.md"))) return join11(here, "..");
  return join11(here, "..", "plugins", "proof", "skills", "claude-md");
}
var INSTALL_TARGETS = { claude: [".claude", "skills", "claude-md"], agents: [".agents", "skills", "claude-md"] };
function files(dir) {
  const out = [];
  for (const name of readdirSync3(dir)) {
    const full = join11(dir, name);
    if (statSync3(full).isDirectory()) out.push(...files(full));
    else out.push(full);
  }
  return out;
}
var same = (a2, b) => existsSync8(b) && readFileSync4(a2).equals(readFileSync4(b));
function install(which, home = homedir6()) {
  const source = skillDir();
  const sourceFiles = files(source).map((f) => relative2(source, f));
  return which.map((key) => {
    const target = join11(home, ...INSTALL_TARGETS[key]);
    const skill = join11(target, "SKILL.md");
    if (existsSync8(skill) && !/scripts\/proof\.mjs/.test(readFileSync4(skill, "utf8"))) {
      return { target, state: "refused", note: `${skill} is a different skill; move it away to install proof there` };
    }
    const existed = existsSync8(target);
    const changed = sourceFiles.filter((f) => !same(join11(source, f), join11(target, f)));
    const extra = existed ? files(target).map((f) => relative2(target, f)).filter((f) => !sourceFiles.includes(f)) : [];
    if (existed && !changed.length && !extra.length) return { target, state: "unchanged", note: "already the same version" };
    mkdirSync2(target, { recursive: true });
    for (const f of changed) {
      mkdirSync2(dirname2(join11(target, f)), { recursive: true });
      cpSync(join11(source, f), join11(target, f));
    }
    for (const f of extra) rmSync3(join11(target, f), { force: true });
    return { target, state: existed ? "updated" : "installed", note: `${changed.length} file${changed.length === 1 ? "" : "s"} copied${extra.length ? `, ${extra.length} old removed` : ""}` };
  });
}

// src/vocabulary.ts
var STATUSES = [
  { status: "FIXED", title: "Fixed", meaning: "Edited, and a fresh verifier confirmed the new text. Review the diff.", job: "show the user the diff (`git diff -- <file>`)", expand: "always" },
  { status: "FIX_REJECTED", title: "Fix rejected", meaning: "The re-verifier refused these edits; they were reverted.", job: "correct the line by hand from the reason, or ask", expand: "always" },
  { status: "STALE", title: "Stale", meaning: "The repository contradicts these, and no fix was applied.", job: "correct it from the reason, or ask", expand: "always" },
  { status: "UNCONFIRMED", title: "Unconfirmed", meaning: "Part of each has no evidence; nothing contradicts it either.", job: "relay it to the user as a decision", expand: "always" },
  { status: "UNVERIFIED_WITH_REASON", title: "Unverified with reason", meaning: "The reason says what evidence is still missing.", job: "relay it to the user as a decision", expand: "always" },
  { status: "OVERRIDDEN", title: "Overrides", meaning: "Silenced by a proof:ignore marker with a reason.", job: "leave it unless the reason no longer holds", expand: "always" },
  { status: "DECIDED", title: "Decided", meaning: "Settled by a recorded decision.", job: "nothing", expand: "verbose" },
  { status: "VERIFIED", title: "Verified", meaning: "Proven at the level shown, or by the verifier with citations proof re-checked.", job: "nothing", expand: "verbose" },
  { status: "NOT_CHECKED", title: "Not checked", meaning: "Outside the repository: system files and external tools.", job: "nothing", expand: "verbose" }
];
var VERDICTS = [
  { verdict: "PROVEN", exit: 0, meaning: "every statement verified at definition or declaration level, or decided" },
  { verdict: "PROVEN WITH OVERRIDES", exit: 0, meaning: "as above, with at least one override or reference-level proof" },
  { verdict: "FIXED", exit: 0, meaning: "stale lines were found, and all were fixed and re-verified" },
  { verdict: "PARTLY PROVEN", exit: 0, meaning: "open items remain for a decision" },
  { verdict: "NOT PROVEN", exit: 1, meaning: "stale lines remain, or a fix was rejected" },
  { verdict: "UNTESTED", exit: 2, meaning: "unreadable, or the verifier did not answer every open statement" }
];
var COMMANDS = [
  { name: "check", usage: "proof check [file...] [--user] [--json] [--out <dir>] [--verbose]", summary: "Checks every statement of every instruction file an agent loads, and the files they `@import`, with deterministic parsers. Writes nothing." },
  { name: "run", usage: "proof run [file...] [--user] [--no-fix] [--dry-run] [--commit] [--fix-rounds <n>] [--gaps] [--model <id>] [--effort <lvl>] [--budget-usd <n>] [--jobs <n>] [--no-cache] [--json] [--out <dir>]", summary: "Checks, hands what the checks leave open to a verifier agent whose citations proof re-checks, fixes the stale lines, and re-verifies each fix with a fresh agent. Can take many minutes." },
  { name: "decide", usage: 'proof decide <file> [L<line>|<id> (--rule | --fact --evidence <path:line>) --reason "\u2026"]', summary: "Lists a file's open statements, or records a person's decision on one in <file>.proof.json." },
  { name: "revert", usage: "proof revert <file> --id <statement id>", summary: "Puts back the text a fix replaced and records the rejection, so it is not proposed again." },
  { name: "install", usage: "proof install [--claude] [--agents]", summary: "Copies this skill to ~/.claude/skills/claude-md/ and ~/.agents/skills/claude-md/, so every agent finds it." }
];
var OPTIONS = [
  { flag: "--user", help: "Also check ~/.claude/CLAUDE.md, ~/.claude/rules/ and the managed policy file, follow imports outside the repository, and let fixes edit user files (never managed ones)" },
  { flag: "--no-fix", help: "Verify only; change nothing" },
  { flag: "--dry-run", help: "Show the diff the fixes would make, without writing it" },
  { flag: "--commit", help: "Commit the fixed files and their sidecars (nothing is committed without it)" },
  { flag: "--fix-rounds <n>", help: "Fix rounds, each re-verified (default 1); a later round sees why earlier edits were rejected" },
  { flag: "--gaps", help: "Also propose up to five missing lines per file, with evidence; never written" },
  { flag: "--model <id>", help: `Verifier and fixer model (default ${DEFAULT_VERIFY.model})` },
  { flag: "--effort <lvl>", help: `Thinking effort: low, medium, high, xhigh, max (default ${DEFAULT_VERIFY.effort})` },
  { flag: "--budget-usd <n>", help: `Total spend of the agent stages across the run (default ${DEFAULT_VERIFY.budgetUsd})` },
  { flag: "--jobs <n>", help: `Verifier calls in parallel (default ${DEFAULT_VERIFY.jobs})` },
  { flag: "--no-cache", help: "Ask again even when the code and the statement are unchanged since the last run" },
  { flag: "--json", help: "Print JSON (an array, one object per file) instead of markdown" },
  { flag: "--out <dir>", help: "Also write <name>.md and <name>.json reports into <dir>" },
  { flag: "--verbose", help: "List verified, decided and not-checked statements too" }
];
function exitCodesLine() {
  const by = /* @__PURE__ */ new Map();
  for (const v of VERDICTS) by.set(v.exit, [...by.get(v.exit) ?? [], v.verdict]);
  return [...by.entries()].map(([code2, vs]) => `${code2} ${vs.join(", ")}${code2 === 2 ? " or a usage error" : ""}`).join("; ");
}
function renderHelp(version) {
  const pad = Math.max(...OPTIONS.map((o) => o.flag.length)) + 2;
  return [
    `proof ${version}: is your CLAUDE.md still true?`,
    "",
    "Usage:",
    ...COMMANDS.map((c) => `  ${c.usage}`),
    "",
    ...COMMANDS.map((c) => `${c.name.padEnd(8)}${c.summary}`),
    "",
    ...OPTIONS.map((o) => `  ${o.flag.padEnd(pad)}${o.help}`),
    "",
    `Exit codes: ${exitCodesLine()}.`
  ].join("\n");
}

// src/report.ts
var MARK = { VERIFIED: "\u2713", STALE: "\u2717", UNCONFIRMED: "?", NOT_CHECKED: "\xB7" };
var clip2 = (raw, n = 160) => {
  const t = raw.replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1)}\u2026` : t;
};
var SECTIONS = STATUSES.map((s) => ({ status: s.status, title: s.title, hint: s.meaning, expand: s.expand }));
function spanLine(r) {
  const ref = r.evidence[0];
  const where = ref && !r.reason.includes(ref.ref) ? ` (${ref.ref})` : "";
  const level = r.status === "VERIFIED" || r.status === "UNCONFIRMED" ? ` [${r.level}]` : "";
  const absent2 = r.expect === "absent" ? " [should be absent]" : "";
  const cwd = r.cwd ? ` [in ${r.cwd}/]` : "";
  return `  - ${MARK[r.status] ?? "?"}${level}${absent2}${cwd} \`${clip2(r.text, 100)}\` \u2014 ${r.reason}${where}`;
}
function agentLines(s) {
  const a2 = s.agent;
  if (!a2) return [];
  const head = `  - verifier${a2.cached ? " (cached)" : ""}: ${a2.verdict.replace(/_/g, " ")}${a2.rejected ? ` \u2014 refused: ${a2.rejected}` : a2.reason ? ` \u2014 ${clip2(a2.reason, 220)}` : ""}`;
  const evidence = a2.evidence.slice(0, 3).map((e) => `    - ${e.valid ? "\u2713" : "\u2717"} ${e.kind} \`${clip2(e.ref, 100)}\`${e.excerpt ? ` "${clip2(e.excerpt, 90)}"` : ""}${e.valid ? "" : ` \u2014 ${e.problem}`}`);
  const proposal = a2.proposedText && s.status === "STALE" ? [`  - proposed: ${clip2(a2.proposedText, 300)}`] : [];
  return [head, ...evidence, ...proposal];
}
function fixLines(s) {
  const f = s.fix;
  if (!f) return [];
  const id = s.id.slice(0, 10);
  if (f.outcome === "applied") return [`  - fixed (tier ${f.tier}, id ${id})${s.status === "FIXED" ? "" : "; what it changed is proven, the rest is still open"}: was "${clip2(f.was ?? f.old, 200)}"`, ...f.evidence.filter((e) => e.valid).slice(0, 2).map((e) => `    - \u2713 ${e.kind} \`${clip2(e.ref, 100)}\`${e.excerpt ? ` "${clip2(e.excerpt, 90)}"` : ""}`)];
  const proposal = f.action === "delete" ? "delete the statement" : `"${clip2(f.old, 120)}" \u2192 "${clip2(f.new, 160)}"`;
  if (f.outcome === "rejected") return [`  - fix rejected and reverted (tier ${f.tier}): ${proposal}`, `    - re-verifier: ${clip2(f.reverify, 220)}`];
  if (f.outcome === "refused") return [`  - fix not applied: ${f.reverify}`, `    - proposed: ${proposal}`];
  return [`  - would fix (tier ${f.tier}): ${proposal}`, `    - re-verifier: ${clip2(f.reverify, 220)}`];
}
function item(s, withSpans) {
  const lines = [`- **L${s.line}** ${clip2(s.text)}${s.section ? ` _(${s.section})_` : ""}`];
  if ((s.status === "UNVERIFIED_WITH_REASON" || s.status === "OVERRIDDEN" || s.status === "DECIDED") && !s.agent) lines.push(`  - ${s.reason}`);
  lines.push(...fixLines(s));
  lines.push(...agentLines(s));
  if (withSpans) for (const r of s.results.filter((x) => x.kind !== "prose")) lines.push(spanLine(r));
  return lines;
}
function countsLine(r) {
  const c = r.counts;
  const parts = [
    `${c.STALE} stale`,
    c.FIXED ? `${c.FIXED} fixed` : "",
    c.FIX_REJECTED ? `${c.FIX_REJECTED} fix rejected` : "",
    `${c.UNCONFIRMED} unconfirmed`,
    `${c.UNVERIFIED_WITH_REASON} unverified`,
    c.OVERRIDDEN ? `${c.OVERRIDDEN} overridden` : "",
    c.DECIDED ? `${c.DECIDED} decided` : "",
    `${c.VERIFIED} verified`,
    `${c.NOT_CHECKED} not checked`
  ];
  return parts.filter(Boolean).join(" \xB7 ");
}
function toMarkdown(r, opts = {}) {
  const lines = [`# ${r.file}: ${r.verdict}`, ""];
  if (r.reason && !r.statements.length) {
    lines.push(r.reason, "", "next:", `  Check the path, then re-run: proof check ${r.file}`);
    return `${lines.join("\n")}
`;
  }
  if (r.reason) lines.push(`> ${r.reason}`, "");
  lines.push(countsLine(r), "");
  lines.push(`loaded: ${r.why}${r.scope === "managed" || r.scope === "user" ? " (outside the repository: proof reports, never edits)" : ""}`);
  if (r.importedBy.length) lines.push(`imported by: ${r.importedBy.join(", ")}`);
  for (const i of r.imports) lines.push(`imports: @${i.path} (L${i.line}) \u2014 ${i.note || (i.followed ? "checked" : "not checked")}`);
  if (r.verdict !== r.ownVerdict) lines.push(`own statements: ${r.ownVerdict}; with what it imports: ${r.verdict}`);
  if (r.agent) {
    lines.push(`verifier: ${r.agent.answered}/${r.agent.sent} open statements answered${r.agent.cached ? ` (${r.agent.cached} cached)` : ""} \xB7 ${r.agent.model}${r.run.budgetUsedUsd !== void 0 ? ` \xB7 run spent $${r.run.budgetUsedUsd.toFixed(2)}` : ""}`);
    for (const f of r.agent.failures) lines.push(`verifier failed: ${f}`);
  }
  lines.push("");
  for (const d of r.degraded) lines.push(`degraded: ${d.subject} \u2014 ${d.reason}`);
  if (r.degraded.length) lines.push("");
  for (const d of r.reopened) lines.push(`reopened: the ${d.kind} decision on "${clip2(d.text, 120)}" (by ${d.by}) no longer matches a line; the edited line is open again`);
  if (r.reopened.length) lines.push("");
  if (r.git) {
    lines.push(`branch \`${r.git.branch ?? "detached"}\` \xB7 head \`${r.git.head?.slice(0, 12) ?? "none"}\` \xB7 tree \`${r.git.tree.slice(0, 12)}\` \xB7 proof ${r.run.version}`, "");
    if (r.git.behind) lines.push(`> **This checkout is ${r.git.behind} commits behind ${r.git.upstream}.** The file and the code were read as checked out here; check the branch people actually work on.`, "");
  }
  const levels = Object.entries(r.evidenceLevels).filter(([, n]) => n > 0).map(([l, n]) => `${l} ${n}`).join(", ");
  if (levels) lines.push(`evidence: ${levels}`, "");
  for (const sec of SECTIONS) {
    const rows = r.statements.filter((s) => s.status === sec.status);
    if (!rows.length) continue;
    lines.push(`## ${sec.title} (${rows.length})`, "", sec.hint, "");
    if (sec.expand === "verbose" && !opts.verbose) {
      lines.push(`(${rows.length} statement${rows.length === 1 ? "" : "s"}; --verbose lists them)`, "");
      continue;
    }
    for (const s of rows) lines.push(...item(s, sec.status !== "NOT_CHECKED" || Boolean(opts.verbose)));
    lines.push("");
  }
  const deleted = (r.fixes ?? []).filter((f) => f.action === "delete" && f.outcome === "applied");
  if (deleted.length) lines.push(`## Deleted (${deleted.length})`, "", "Removed with evidence that the thing is gone.", "", ...deleted.map((f) => `- **L${f.line}** ${clip2(f.old)}`), "");
  if (r.gaps?.length) lines.push("## Gap proposals (not applied)", "", "Asked for with --gaps. Each cites its evidence; add one by hand if you want it.", "", ...r.gaps.flatMap((g) => [`- ${g.section ? `_${g.section}_: ` : ""}${clip2(g.text, 200)}`, ...g.evidence.filter((e) => e.valid).slice(0, 2).map((e) => `  - \u2713 ${e.kind} \`${clip2(e.ref, 100)}\`${e.excerpt ? ` "${clip2(e.excerpt, 90)}"` : ""}`)]), "");
  if (r.diff) lines.push(`## Diff${r.fixes?.some((f) => f.outcome === "dry-run") ? " (dry run: not written)" : ""}`, "", "```diff", r.diff.trimEnd(), "```", "");
  lines.push("next:", ...nextLines(r, opts.mode ?? "check").map((l) => `  ${l}`));
  return `${lines.join("\n").trimEnd()}
`;
}
function nextLines(r, mode = "check") {
  const c = r.counts;
  const out = [];
  const open = c.UNCONFIRMED + c.UNVERIFIED_WITH_REASON;
  const applied = (r.fixes ?? []).filter((f) => f.outcome === "applied");
  if (applied.length) {
    out.push(`Review the diff: git diff -- ${r.file}`);
    out.push(`Revert one fix: proof revert ${r.file} --id <id shown on the fixed line>`);
  }
  if ((r.fixes ?? []).some((f) => f.outcome === "dry-run")) out.push(`Apply the fixes: proof run ${r.file}`);
  if (c.STALE && mode === "check") out.push(`Fix ${c.STALE} stale line${c.STALE === 1 ? "" : "s"}: proof run ${r.file}, or edit ${r.file} by the reasons above`);
  else if (c.STALE) out.push(`Fix ${c.STALE} stale line${c.STALE === 1 ? "" : "s"} by hand: ${r.file}, by the reasons and the refused proposals above`);
  if (c.FIX_REJECTED) out.push(`${c.FIX_REJECTED} fix${c.FIX_REJECTED === 1 ? " was" : "es were"} rejected by the re-verifier: correct ${c.FIX_REJECTED === 1 ? "that line" : "those lines"} by hand`);
  if (r.agent && r.agent.answered < r.agent.sent) out.push(`Finish verification: proof run ${r.file}${r.agent.failures.some((f) => f.includes("budget")) ? " --budget-usd <more>" : ""}`);
  else if (open && mode === "check") out.push(`Verify ${open} open statement${open === 1 ? "" : "s"} with the verifier agent: proof run ${r.file}`);
  else if (open) out.push(`Decide ${open} open item${open === 1 ? "" : "s"}: proof decide ${r.file}`);
  if (r.statements.some((s) => s.kind === "marker")) out.push('Give each proof:ignore marker a reason: <!-- proof:ignore reason="\u2026" -->');
  out.push(`Re-run: proof ${mode} ${r.file}`);
  return out;
}

// src/cli.ts
var HELP = renderHelp(VERSION);
var NUMBER = (name, v, fallback) => {
  if (v === void 0) return fallback;
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) throw new UsageError(`--${name} needs a positive number, got "${v}"`);
  return n;
};
var UsageError = class extends Error {
};
async function pipeline(mode, argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      json: { type: "boolean" },
      out: { type: "string" },
      verbose: { type: "boolean" },
      user: { type: "boolean" },
      model: { type: "string" },
      effort: { type: "string" },
      "budget-usd": { type: "string" },
      jobs: { type: "string" },
      "batch-size": { type: "string" },
      "no-cache": { type: "boolean" },
      "no-fix": { type: "boolean" },
      "dry-run": { type: "boolean" },
      "fix-rounds": { type: "string" },
      gaps: { type: "boolean" },
      commit: { type: "boolean" }
    }
  });
  const run2 = new Run(process.cwd());
  const found = discover(run2.repo, { user: Boolean(values.user) });
  const targets = positionals.length ? positionals.map((p) => found.files.find((d) => resolve3(run2.repo.root, d.file) === resolve3(p)) ?? { file: resolve3(p), why: "named on the command line", scope: "project" }) : found.files;
  if (!targets.length) {
    console.error(`No instruction file found. Pass one: proof ${mode} path/to/CLAUDE.md`);
    return 2;
  }
  let reports = await run2.checkTargets(targets, { user: Boolean(values.user) });
  if (!positionals.length && found.skipped.length && !values.json) {
    console.error(found.skipped.map((s) => `skipped ${s.file}: ${s.reason}`).join("\n"));
  }
  if (mode === "run") {
    const opts = {
      ...DEFAULT_VERIFY,
      model: values.model ?? DEFAULT_VERIFY.model,
      effort: values.effort ?? DEFAULT_VERIFY.effort,
      budgetUsd: NUMBER("budget-usd", values["budget-usd"], DEFAULT_VERIFY.budgetUsd),
      jobs: NUMBER("jobs", values.jobs, DEFAULT_VERIFY.jobs),
      batchSize: NUMBER("batch-size", values["batch-size"], DEFAULT_VERIFY.batchSize),
      cache: !values["no-cache"]
    };
    if (!values.json) console.error(`verifying open statements with ${opts.model} (budget $${opts.budgetUsd.toFixed(2)}); this can take minutes`);
    reports = await run2.verify(reports, opts);
    let spent = reports.reduce((n, r) => n + (r.agent?.costUsd ?? 0), 0);
    const rounds = NUMBER("fix-rounds", values["fix-rounds"], 1);
    const dryRun = Boolean(values["dry-run"]);
    const config = loadConfig(run2.repo);
    let current = run2;
    const merged = /* @__PURE__ */ new Map();
    for (let round = 1; round <= rounds && !values["no-fix"] && reports.some((r) => r.counts.STALE); round++) {
      const stale2 = reports.reduce((n, r) => n + r.counts.STALE, 0);
      if (!values.json) console.error(`fixing ${stale2} stale statement(s)${rounds > 1 ? ` (round ${round} of ${rounds})` : ""}${dryRun ? " (dry run: nothing is written)" : ""}`);
      const fixes = await current.fix(reports, { model: opts.model, effort: opts.effort, budgetUsd: Math.min(Math.max(0.1, opts.budgetUsd - spent), Math.max(1, stale2 * opts.perStatementUsd * 2)), timeoutMs: opts.timeoutMs, user: Boolean(values.user), config, dryRun, verify: opts });
      spent += [...fixes.values()].reduce((n, x) => n + x.costUsd, 0);
      const changed = [...fixes.values()].some((f) => f.after !== f.before || f.accepted.length || f.rejected.length);
      if (changed && !dryRun) {
        current = new Run(process.cwd());
        reports = await current.verify(await current.checkTargets(targets, { user: Boolean(values.user) }), opts);
        spent += reports.reduce((n, r) => n + (r.agent?.costUsd ?? 0), 0);
        if (values.commit) commitFixes(current.repo.root, [...fixes.entries()].filter(([, f]) => f.after !== f.before || f.rejected.length).map(([file]) => file), fixes);
      }
      for (const [file, f] of fixes) {
        const prev = merged.get(file);
        merged.set(file, prev ? { ...f, before: prev.before, proposed: [...prev.proposed, ...f.proposed], accepted: [...prev.accepted, ...f.accepted], rejected: [...prev.rejected, ...f.rejected], costUsd: prev.costUsd + f.costUsd, reverified: new Map([...prev.reverified, ...f.reverified]) } : f);
      }
      if (dryRun || !fixes.size || ![...fixes.values()].some((f) => f.rejected.length)) break;
    }
    if (merged.size) annotateFixes(reports, merged, dryRun);
    if (values.gaps) {
      for (const r of reports.filter((x) => x.scope !== "managed" && x.statements.length)) {
        const g = await proposeGaps(current.repo, r.file, current.repo.read(r.file) ?? "", { model: opts.model, effort: opts.effort, budgetUsd: Math.min(1, Math.max(0.1, opts.budgetUsd - spent)), timeoutMs: opts.timeoutMs });
        spent += g.costUsd;
        r.gaps = g.proposals;
        if (g.failure) r.degraded.push({ subject: "gaps", reason: `gap proposals failed: ${g.failure}` });
      }
    }
    for (const r of reports) r.run.budgetUsedUsd = spent;
    if (!values.json) console.error(`spent $${spent.toFixed(2)} of $${opts.budgetUsd.toFixed(2)}`);
  }
  if (values.out) {
    mkdirSync3(values.out, { recursive: true });
    for (const r of reports) {
      const name = r.file.replace(/[^a-z0-9._-]+/gi, "-").toLowerCase();
      writeFileSync6(join12(values.out, `${name}.md`), toMarkdown(r, { verbose: true, mode }));
      writeFileSync6(join12(values.out, `${name}.json`), `${JSON.stringify(r, null, 2)}
`);
    }
  }
  if (values.json) console.log(JSON.stringify(reports, null, 2));
  else console.log(reports.map((r) => toMarkdown(r, { verbose: Boolean(values.verbose), mode })).join("\n---\n\n"));
  return Math.max(...reports.map((r) => EXIT_CODE[r.verdict]));
}
function commitFixes(root, files2, fixes) {
  const paths = files2.flatMap((f) => [f, sidecarPath(f)]).filter((p) => existsSync9(join12(root, p)));
  if (!paths.length) return;
  const applied = [...fixes.values()].reduce((n, f) => n + f.accepted.length, 0);
  spawnSync8("git", ["add", "--", ...paths], { cwd: root });
  const res = spawnSync8("git", ["commit", "-q", "-m", `docs: proof fixed ${applied} stale statement${applied === 1 ? "" : "s"} in ${files2.join(", ")}`, "--", ...paths], { cwd: root, encoding: "utf8" });
  if (res.status !== 0) console.error(`commit failed: ${res.stderr.trim()}. The fixes are in the working tree.`);
}
async function decideCommand(argv) {
  const { values, positionals } = parseArgs({ args: argv, allowPositionals: true, options: { rule: { type: "boolean" }, fact: { type: "boolean" }, reason: { type: "string" }, evidence: { type: "string", multiple: true }, by: { type: "string" } } });
  const [file, which] = positionals;
  if (!file) throw new UsageError("proof decide needs a file");
  const run2 = new Run(process.cwd());
  if (!which) {
    process.stdout.write(await listOpen(run2, file));
    return 0;
  }
  if (values.rule === values.fact) throw new UsageError("pass exactly one of --rule or --fact");
  const record = await decide2(run2, file, which, { kind: values.rule ? "rule" : "fact", reason: values.reason ?? "", evidence: (values.evidence ?? []).flatMap((e) => e.split(",")), ...values.by ? { by: values.by } : {} });
  console.log(`decided ${record.kind}: ${record.text}
recorded in ${sidecarPath(run2.repo.rel(file) ?? file)}`);
  return 0;
}
function revertCommand(argv) {
  const { values, positionals } = parseArgs({ args: argv, allowPositionals: true, options: { id: { type: "string" }, by: { type: "string" } } });
  const [file] = positionals;
  if (!file || !values.id) throw new UsageError("proof revert needs a file and --id <statement id>");
  const run2 = new Run(process.cwd());
  const record = revert(run2, file, values.id, values.by);
  console.log(`reverted: ${record.edit?.new || "(deleted text)"} \u2192 ${record.edit?.old}
recorded as fix-rejected in ${sidecarPath(run2.repo.rel(file) ?? file)}`);
  return 0;
}
function installCommand(argv) {
  const { values } = parseArgs({ args: argv, options: { claude: { type: "boolean" }, agents: { type: "boolean" } } });
  const which = values.claude || values.agents ? ["claude", "agents"].filter((k) => values[k]) : ["claude", "agents"];
  const results = install([...which]);
  for (const r of results) console.log(`${r.state.padEnd(9)} ${r.target} (${r.note})`);
  if (results.some((r) => r.state !== "refused")) console.log("Run it in any repository: /claude-md in Claude Code, or ask your agent to use the claude-md skill.");
  return results.some((r) => r.state === "refused") ? 2 : 0;
}
async function main(argv) {
  const [first, ...rest] = argv;
  if (first === "--help" || first === "-h" || first === "help") {
    console.log(HELP);
    return 0;
  }
  if (first === "--version" || first === "-v" || first === "version") {
    console.log(VERSION);
    return 0;
  }
  try {
    if (first === "check" || first === "run") return await pipeline(first, rest);
    if (first === "decide") return await decideCommand(rest);
    if (first === "revert") return revertCommand(rest);
    if (first === "install") return installCommand(rest);
    if (!first || first.startsWith("-") || /\.(md|mdc)$|rules$/i.test(first)) return await pipeline("check", argv);
  } catch (err) {
    if (err instanceof HumanError) {
      console.error(err.message);
      return 2;
    }
    if (err instanceof UsageError || err instanceof TypeError && "code" in err && String(err.code).startsWith("ERR_PARSE_ARGS")) {
      console.error(`${err.message}. Run: proof help`);
      return 2;
    }
    throw err;
  }
  console.error(`Unknown command "${first}". Run: proof help`);
  return 2;
}
main(process.argv.slice(2)).then(
  (code2) => {
    process.exitCode = code2;
  },
  (err) => {
    console.error(err instanceof Error ? err.stack ?? err.message : String(err));
    process.exitCode = 2;
  }
);
export {
  HELP,
  main
};
