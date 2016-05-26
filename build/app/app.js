(function (exports) {
    'use strict';

    var prefix = "$";

    function Map() {}

    Map.prototype = map.prototype = {
      constructor: Map,
      has: function(key) {
        return (prefix + key) in this;
      },
      get: function(key) {
        return this[prefix + key];
      },
      set: function(key, value) {
        this[prefix + key] = value;
        return this;
      },
      remove: function(key) {
        var property = prefix + key;
        return property in this && delete this[property];
      },
      clear: function() {
        for (var property in this) if (property[0] === prefix) delete this[property];
      },
      keys: function() {
        var keys = [];
        for (var property in this) if (property[0] === prefix) keys.push(property.slice(1));
        return keys;
      },
      values: function() {
        var values = [];
        for (var property in this) if (property[0] === prefix) values.push(this[property]);
        return values;
      },
      entries: function() {
        var entries = [];
        for (var property in this) if (property[0] === prefix) entries.push({key: property.slice(1), value: this[property]});
        return entries;
      },
      size: function() {
        var size = 0;
        for (var property in this) if (property[0] === prefix) ++size;
        return size;
      },
      empty: function() {
        for (var property in this) if (property[0] === prefix) return false;
        return true;
      },
      each: function(f) {
        for (var property in this) if (property[0] === prefix) f(this[property], property.slice(1), this);
      }
    };

    function map(object, f) {
      var map = new Map;

      // Copy constructor.
      if (object instanceof Map) object.each(function(value, key) { map.set(key, value); });

      // Index array by numeric index or specified key function.
      else if (Array.isArray(object)) {
        var i = -1,
            n = object.length,
            o;

        if (f == null) while (++i < n) map.set(i, object[i]);
        else while (++i < n) map.set(f(o = object[i], i, object), o);
      }

      // Convert object to map.
      else if (object) for (var key in object) map.set(key, object[key]);

      return map;
    }

    function nest() {
      var keys = [],
          sortKeys = [],
          sortValues,
          rollup,
          nest;

      function apply(array, depth, createResult, setResult) {
        if (depth >= keys.length) return rollup != null
            ? rollup(array) : (sortValues != null
            ? array.sort(sortValues)
            : array);

        var i = -1,
            n = array.length,
            key = keys[depth++],
            keyValue,
            value,
            valuesByKey = map(),
            values,
            result = createResult();

        while (++i < n) {
          if (values = valuesByKey.get(keyValue = key(value = array[i]) + "")) {
            values.push(value);
          } else {
            valuesByKey.set(keyValue, [value]);
          }
        }

        valuesByKey.each(function(values, key) {
          setResult(result, key, apply(values, depth, createResult, setResult));
        });

        return result;
      }

      function entries(map, depth) {
        if (++depth > keys.length) return map;
        var array, sortKey = sortKeys[depth - 1];
        if (rollup != null && depth >= keys.length) array = map.entries();
        else array = [], map.each(function(v, k) { array.push({key: k, values: entries(v, depth)}); });
        return sortKey != null ? array.sort(function(a, b) { return sortKey(a.key, b.key); }) : array;
      }

      return nest = {
        object: function(array) { return apply(array, 0, createObject, setObject); },
        map: function(array) { return apply(array, 0, createMap, setMap); },
        entries: function(array) { return entries(apply(array, 0, createMap, setMap), 0); },
        key: function(d) { keys.push(d); return nest; },
        sortKeys: function(order) { sortKeys[keys.length - 1] = order; return nest; },
        sortValues: function(order) { sortValues = order; return nest; },
        rollup: function(f) { rollup = f; return nest; }
      };
    }

    function createObject() {
      return {};
    }

    function setObject(object, key, value) {
      object[key] = value;
    }

    function createMap() {
      return map();
    }

    function setMap(map, key, value) {
      map.set(key, value);
    }

    var proto = map.prototype;

    var noop = {value: function() {}};

    function dispatch() {
      for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
        if (!(t = arguments[i] + "") || (t in _)) throw new Error;
        _[t] = [];
      }
      return new Dispatch(_);
    }

    function Dispatch(_) {
      this._ = _;
    }

    function parseTypenames(typenames, types) {
      return typenames.trim().split(/^|\s+/).map(function(t) {
        var name = "", i = t.indexOf(".");
        if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
        if (t && !types.hasOwnProperty(t)) throw new Error;
        return {type: t, name: name};
      });
    }

    Dispatch.prototype = dispatch.prototype = {
      constructor: Dispatch,
      on: function(typename, callback) {
        var _ = this._,
            T = parseTypenames(typename + "", _),
            t,
            i = -1,
            n = T.length;

        // If no callback was specified, return the callback of the given type and name.
        if (arguments.length < 2) {
          while (++i < n) if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name))) return t;
          return;
        }

        // If a type was specified, set the callback for the given type and name.
        // Otherwise, if a null callback was specified, remove callbacks of the given name.
        if (callback != null && typeof callback !== "function") throw new Error;
        while (++i < n) {
          if (t = (typename = T[i]).type) _[t] = set$1(_[t], typename.name, callback);
          else if (callback == null) for (t in _) _[t] = set$1(_[t], typename.name, null);
        }

        return this;
      },
      copy: function() {
        var copy = {}, _ = this._;
        for (var t in _) copy[t] = _[t].slice();
        return new Dispatch(copy);
      },
      call: function(type, that) {
        if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n; i < n; ++i) args[i] = arguments[i + 2];
        this.apply(type, that, args);
      },
      apply: function(type, that, args) {
        if (!this._.hasOwnProperty(type)) throw new Error;
        for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
      }
    };

    function get(type, name) {
      for (var i = 0, n = type.length, c; i < n; ++i) {
        if ((c = type[i]).name === name) {
          return c.value;
        }
      }
    }

    function set$1(type, name, callback) {
      for (var i = 0, n = type.length; i < n; ++i) {
        if (type[i].name === name) {
          type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
          break;
        }
      }
      if (callback != null) type.push({name: name, value: callback});
      return type;
    }

    function request(url, callback) {
      var request,
          event = dispatch("beforesend", "progress", "load", "error"),
          mimeType,
          headers = map(),
          xhr = new XMLHttpRequest,
          user = null,
          password = null,
          response,
          responseType,
          timeout = 0;

      // If IE does not support CORS, use XDomainRequest.
      if (typeof XDomainRequest !== "undefined"
          && !("withCredentials" in xhr)
          && /^(http(s)?:)?\/\//.test(url)) xhr = new XDomainRequest;

      "onload" in xhr
          ? xhr.onload = xhr.onerror = xhr.ontimeout = respond
          : xhr.onreadystatechange = function(o) { xhr.readyState > 3 && respond(o); };

      function respond(o) {
        var status = xhr.status, result;
        if (!status && hasResponse(xhr)
            || status >= 200 && status < 300
            || status === 304) {
          if (response) {
            try {
              result = response.call(request, xhr);
            } catch (e) {
              event.call("error", request, e);
              return;
            }
          } else {
            result = xhr;
          }
          event.call("load", request, result);
        } else {
          event.call("error", request, o);
        }
      }

      xhr.onprogress = function(e) {
        event.call("progress", request, e);
      };

      request = {
        header: function(name, value) {
          name = (name + "").toLowerCase();
          if (arguments.length < 2) return headers.get(name);
          if (value == null) headers.remove(name);
          else headers.set(name, value + "");
          return request;
        },

        // If mimeType is non-null and no Accept header is set, a default is used.
        mimeType: function(value) {
          if (!arguments.length) return mimeType;
          mimeType = value == null ? null : value + "";
          return request;
        },

        // Specifies what type the response value should take;
        // for instance, arraybuffer, blob, document, or text.
        responseType: function(value) {
          if (!arguments.length) return responseType;
          responseType = value;
          return request;
        },

        timeout: function(value) {
          if (!arguments.length) return timeout;
          timeout = +value;
          return request;
        },

        user: function(value) {
          return arguments.length < 1 ? user : (user = value == null ? null : value + "", request);
        },

        password: function(value) {
          return arguments.length < 1 ? password : (password = value == null ? null : value + "", request);
        },

        // Specify how to convert the response content to a specific type;
        // changes the callback value on "load" events.
        response: function(value) {
          response = value;
          return request;
        },

        // Alias for send("GET", …).
        get: function(data, callback) {
          return request.send("GET", data, callback);
        },

        // Alias for send("POST", …).
        post: function(data, callback) {
          return request.send("POST", data, callback);
        },

        // If callback is non-null, it will be used for error and load events.
        send: function(method, data, callback) {
          if (!callback && typeof data === "function") callback = data, data = null;
          if (callback && callback.length === 1) callback = fixCallback(callback);
          xhr.open(method, url, true, user, password);
          if (mimeType != null && !headers.has("accept")) headers.set("accept", mimeType + ",*/*");
          if (xhr.setRequestHeader) headers.each(function(value, name) { xhr.setRequestHeader(name, value); });
          if (mimeType != null && xhr.overrideMimeType) xhr.overrideMimeType(mimeType);
          if (responseType != null) xhr.responseType = responseType;
          if (timeout > 0) xhr.timeout = timeout;
          if (callback) request.on("error", callback).on("load", function(xhr) { callback(null, xhr); });
          event.call("beforesend", request, xhr);
          xhr.send(data == null ? null : data);
          return request;
        },

        abort: function() {
          xhr.abort();
          return request;
        },

        on: function() {
          var value = event.on.apply(event, arguments);
          return value === event ? request : value;
        }
      };

      return callback
          ? request.get(callback)
          : request;
    }

    function fixCallback(callback) {
      return function(error, xhr) {
        callback(error == null ? xhr : null);
      };
    }

    function hasResponse(xhr) {
      var type = xhr.responseType;
      return type && type !== "text"
          ? xhr.response // null on error
          : xhr.responseText; // "" on error
    }

    function type(defaultMimeType, response) {
      return function(url, callback) {
        var r = request(url).mimeType(defaultMimeType).response(response);
        return callback ? r.get(callback) : r;
      };
    }

    var json = type("application/json", function(xhr) {
      return JSON.parse(xhr.responseText);
    });

    function objectConverter(columns) {
      return new Function("d", "return {" + columns.map(function(name, i) {
        return JSON.stringify(name) + ": d[" + i + "]";
      }).join(",") + "}");
    }

    function customConverter(columns, f) {
      var object = objectConverter(columns);
      return function(row, i) {
        return f(object(row), i, columns);
      };
    }

    // Compute unique columns in order of discovery.
    function inferColumns(rows) {
      var columnSet = Object.create(null),
          columns = [];

      rows.forEach(function(row) {
        for (var column in row) {
          if (!(column in columnSet)) {
            columns.push(columnSet[column] = column);
          }
        }
      });

      return columns;
    }

    function dsv(delimiter) {
      var reFormat = new RegExp("[\"" + delimiter + "\n]"),
          delimiterCode = delimiter.charCodeAt(0);

      function parse(text, f) {
        var convert, columns, rows = parseRows(text, function(row, i) {
          if (convert) return convert(row, i - 1);
          columns = row, convert = f ? customConverter(row, f) : objectConverter(row);
        });
        rows.columns = columns;
        return rows;
      }

      function parseRows(text, f) {
        var EOL = {}, // sentinel value for end-of-line
            EOF = {}, // sentinel value for end-of-file
            rows = [], // output rows
            N = text.length,
            I = 0, // current character index
            n = 0, // the current line number
            t, // the current token
            eol; // is the current token followed by EOL?

        function token() {
          if (I >= N) return EOF; // special case: end of file
          if (eol) return eol = false, EOL; // special case: end of line

          // special case: quotes
          var j = I, c;
          if (text.charCodeAt(j) === 34) {
            var i = j;
            while (i++ < N) {
              if (text.charCodeAt(i) === 34) {
                if (text.charCodeAt(i + 1) !== 34) break;
                ++i;
              }
            }
            I = i + 2;
            c = text.charCodeAt(i + 1);
            if (c === 13) {
              eol = true;
              if (text.charCodeAt(i + 2) === 10) ++I;
            } else if (c === 10) {
              eol = true;
            }
            return text.slice(j + 1, i).replace(/""/g, "\"");
          }

          // common case: find next delimiter or newline
          while (I < N) {
            var k = 1;
            c = text.charCodeAt(I++);
            if (c === 10) eol = true; // \n
            else if (c === 13) { eol = true; if (text.charCodeAt(I) === 10) ++I, ++k; } // \r|\r\n
            else if (c !== delimiterCode) continue;
            return text.slice(j, I - k);
          }

          // special case: last token before EOF
          return text.slice(j);
        }

        while ((t = token()) !== EOF) {
          var a = [];
          while (t !== EOL && t !== EOF) {
            a.push(t);
            t = token();
          }
          if (f && (a = f(a, n++)) == null) continue;
          rows.push(a);
        }

        return rows;
      }

      function format(rows, columns) {
        if (columns == null) columns = inferColumns(rows);
        return [columns.map(formatValue).join(delimiter)].concat(rows.map(function(row) {
          return columns.map(function(column) {
            return formatValue(row[column]);
          }).join(delimiter);
        })).join("\n");
      }

      function formatRows(rows) {
        return rows.map(formatRow).join("\n");
      }

      function formatRow(row) {
        return row.map(formatValue).join(delimiter);
      }

      function formatValue(text) {
        return text == null ? ""
            : reFormat.test(text += "") ? "\"" + text.replace(/\"/g, "\"\"") + "\""
            : text;
      }

      return {
        parse: parse,
        parseRows: parseRows,
        format: format,
        formatRows: formatRows
      };
    }

    var csv$1 = dsv(",");

    var tsv = dsv("\t");

    var DataService = (function () {
        function DataService() {
            this._query = {
                country: 'denmark',
                graph: 'chart'
            };
        }
        DataService.prototype.getData = function () {
            var _this = this;
            return new Promise(function (res, rej) {
                json("http://localhost:5000/api/infographics/" + _this._query.country + "/" + _this._query.graph, function (data) {
                    res(data);
                });
            });
        };
        return DataService;
    }());

    var xhtml = "http://www.w3.org/1999/xhtml";

    var namespaces = {
      svg: "http://www.w3.org/2000/svg",
      xhtml: xhtml,
      xlink: "http://www.w3.org/1999/xlink",
      xml: "http://www.w3.org/XML/1998/namespace",
      xmlns: "http://www.w3.org/2000/xmlns/"
    };

    function namespace(name) {
      var prefix = name += "", i = prefix.indexOf(":");
      if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
      return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name;
    }

    function creatorInherit(name) {
      return function() {
        var document = this.ownerDocument,
            uri = this.namespaceURI;
        return uri === xhtml && document.documentElement.namespaceURI === xhtml
            ? document.createElement(name)
            : document.createElementNS(uri, name);
      };
    }

    function creatorFixed(fullname) {
      return function() {
        return this.ownerDocument.createElementNS(fullname.space, fullname.local);
      };
    }

    function creator(name) {
      var fullname = namespace(name);
      return (fullname.local
          ? creatorFixed
          : creatorInherit)(fullname);
    }

    var matcher = function(selector) {
      return function() {
        return this.matches(selector);
      };
    };

    if (typeof document !== "undefined") {
      var element = document.documentElement;
      if (!element.matches) {
        var vendorMatches = element.webkitMatchesSelector
            || element.msMatchesSelector
            || element.mozMatchesSelector
            || element.oMatchesSelector;
        matcher = function(selector) {
          return function() {
            return vendorMatches.call(this, selector);
          };
        };
      }
    }

    var matcher$1 = matcher;

    var filterEvents = {};

    var event = null;

    if (typeof document !== "undefined") {
      var element$1 = document.documentElement;
      if (!("onmouseenter" in element$1)) {
        filterEvents = {mouseenter: "mouseover", mouseleave: "mouseout"};
      }
    }

    function filterContextListener(listener, index, group) {
      listener = contextListener(listener, index, group);
      return function(event) {
        var related = event.relatedTarget;
        if (!related || (related !== this && !(related.compareDocumentPosition(this) & 8))) {
          listener.call(this, event);
        }
      };
    }

    function contextListener(listener, index, group) {
      return function(event1) {
        var event0 = event; // Events can be reentrant (e.g., focus).
        event = event1;
        try {
          listener.call(this, this.__data__, index, group);
        } finally {
          event = event0;
        }
      };
    }

    function parseTypenames$1(typenames) {
      return typenames.trim().split(/^|\s+/).map(function(t) {
        var name = "", i = t.indexOf(".");
        if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
        return {type: t, name: name};
      });
    }

    function onRemove(typename) {
      return function() {
        var on = this.__on;
        if (!on) return;
        for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
          if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
            this.removeEventListener(o.type, o.listener, o.capture);
          } else {
            on[++i] = o;
          }
        }
        if (++i) on.length = i;
        else delete this.__on;
      };
    }

    function onAdd(typename, value, capture) {
      var wrap = filterEvents.hasOwnProperty(typename.type) ? filterContextListener : contextListener;
      return function(d, i, group) {
        var on = this.__on, o, listener = wrap(value, i, group);
        if (on) for (var j = 0, m = on.length; j < m; ++j) {
          if ((o = on[j]).type === typename.type && o.name === typename.name) {
            this.removeEventListener(o.type, o.listener, o.capture);
            this.addEventListener(o.type, o.listener = listener, o.capture = capture);
            o.value = value;
            return;
          }
        }
        this.addEventListener(typename.type, listener, capture);
        o = {type: typename.type, name: typename.name, value: value, listener: listener, capture: capture};
        if (!on) this.__on = [o];
        else on.push(o);
      };
    }

    function selection_on(typename, value, capture) {
      var typenames = parseTypenames$1(typename + ""), i, n = typenames.length, t;

      if (arguments.length < 2) {
        var on = this.node().__on;
        if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
          for (i = 0, o = on[j]; i < n; ++i) {
            if ((t = typenames[i]).type === o.type && t.name === o.name) {
              return o.value;
            }
          }
        }
        return;
      }

      on = value ? onAdd : onRemove;
      if (capture == null) capture = false;
      for (i = 0; i < n; ++i) this.each(on(typenames[i], value, capture));
      return this;
    }

    function selector(selector) {
      return function() {
        return this.querySelector(selector);
      };
    }

    function selection_select(select) {
      if (typeof select !== "function") select = selector(select);

      for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
          if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
            if ("__data__" in node) subnode.__data__ = node.__data__;
            subgroup[i] = subnode;
          }
        }
      }

      return new Selection(subgroups, this._parents);
    }

    function selectorAll(selector) {
      return function() {
        return this.querySelectorAll(selector);
      };
    }

    function selection_selectAll(select) {
      if (typeof select !== "function") select = selectorAll(select);

      for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
          if (node = group[i]) {
            subgroups.push(select.call(node, node.__data__, i, group));
            parents.push(node);
          }
        }
      }

      return new Selection(subgroups, parents);
    }

    function selection_filter(match) {
      if (typeof match !== "function") match = matcher$1(match);

      for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
          if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
            subgroup[i] = node;
          }
        }
      }

      return new Selection(subgroups, this._parents);
    }

    function constant(x) {
      return function() {
        return x;
      };
    }

    var keyPrefix = "$"; // Protect against keys like “__proto__”.

    function bindIndex(parent, group, enter, update, exit, data) {
      var i = 0,
          node,
          groupLength = group.length,
          dataLength = data.length;

      // Put any non-null nodes that fit into update.
      // Put any null nodes into enter.
      // Put any remaining data into enter.
      for (; i < dataLength; ++i) {
        if (node = group[i]) {
          node.__data__ = data[i];
          update[i] = node;
        } else {
          enter[i] = new EnterNode(parent, data[i]);
        }
      }

      // Put any non-null nodes that don’t fit into exit.
      for (; i < groupLength; ++i) {
        if (node = group[i]) {
          exit[i] = node;
        }
      }
    }

    function bindKey(parent, group, enter, update, exit, data, key) {
      var i,
          node,
          nodeByKeyValue = {},
          groupLength = group.length,
          dataLength = data.length,
          keyValues = new Array(groupLength),
          keyValue;

      // Compute the key for each node.
      // If multiple nodes have the same key, the duplicates are added to exit.
      for (i = 0; i < groupLength; ++i) {
        if (node = group[i]) {
          keyValues[i] = keyValue = keyPrefix + key.call(node, node.__data__, i, group);
          if (keyValue in nodeByKeyValue) {
            exit[i] = node;
          } else {
            nodeByKeyValue[keyValue] = node;
          }
        }
      }

      // Compute the key for each datum.
      // If there a node associated with this key, join and add it to update.
      // If there is not (or the key is a duplicate), add it to enter.
      for (i = 0; i < dataLength; ++i) {
        keyValue = keyPrefix + key.call(parent, data[i], i, data);
        if (node = nodeByKeyValue[keyValue]) {
          update[i] = node;
          node.__data__ = data[i];
          nodeByKeyValue[keyValue] = null;
        } else {
          enter[i] = new EnterNode(parent, data[i]);
        }
      }

      // Add any remaining nodes that were not bound to data to exit.
      for (i = 0; i < groupLength; ++i) {
        if ((node = group[i]) && (nodeByKeyValue[keyValues[i]] === node)) {
          exit[i] = node;
        }
      }
    }

    function selection_data(value, key) {
      if (!value) {
        data = new Array(this.size()), j = -1;
        this.each(function(d) { data[++j] = d; });
        return data;
      }

      var bind = key ? bindKey : bindIndex,
          parents = this._parents,
          groups = this._groups;

      if (typeof value !== "function") value = constant(value);

      for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
        var parent = parents[j],
            group = groups[j],
            groupLength = group.length,
            data = value.call(parent, parent && parent.__data__, j, parents),
            dataLength = data.length,
            enterGroup = enter[j] = new Array(dataLength),
            updateGroup = update[j] = new Array(dataLength),
            exitGroup = exit[j] = new Array(groupLength);

        bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

        // Now connect the enter nodes to their following update node, such that
        // appendChild can insert the materialized enter node before this node,
        // rather than at the end of the parent node.
        for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
          if (previous = enterGroup[i0]) {
            if (i0 >= i1) i1 = i0 + 1;
            while (!(next = updateGroup[i1]) && ++i1 < dataLength);
            previous._next = next || null;
          }
        }
      }

      update = new Selection(update, parents);
      update._enter = enter;
      update._exit = exit;
      return update;
    }

    function EnterNode(parent, datum) {
      this.ownerDocument = parent.ownerDocument;
      this.namespaceURI = parent.namespaceURI;
      this._next = null;
      this._parent = parent;
      this.__data__ = datum;
    }

    EnterNode.prototype = {
      constructor: EnterNode,
      appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
      insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
      querySelector: function(selector) { return this._parent.querySelector(selector); },
      querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
    };

    function sparse(update) {
      return new Array(update.length);
    }

    function selection_enter() {
      return new Selection(this._enter || this._groups.map(sparse), this._parents);
    }

    function selection_exit() {
      return new Selection(this._exit || this._groups.map(sparse), this._parents);
    }

    function selection_merge(selection) {

      for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
        for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
          if (node = group0[i] || group1[i]) {
            merge[i] = node;
          }
        }
      }

      for (; j < m0; ++j) {
        merges[j] = groups0[j];
      }

      return new Selection(merges, this._parents);
    }

    function selection_order() {

      for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
        for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
          if (node = group[i]) {
            if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
            next = node;
          }
        }
      }

      return this;
    }

    function selection_sort(compare) {
      if (!compare) compare = ascending;

      function compareNode(a, b) {
        return a && b ? compare(a.__data__, b.__data__) : !a - !b;
      }

      for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
          if (node = group[i]) {
            sortgroup[i] = node;
          }
        }
        sortgroup.sort(compareNode);
      }

      return new Selection(sortgroups, this._parents).order();
    }

    function ascending(a, b) {
      return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
    }

    function selection_call() {
      var callback = arguments[0];
      arguments[0] = this;
      callback.apply(null, arguments);
      return this;
    }

    function selection_nodes() {
      var nodes = new Array(this.size()), i = -1;
      this.each(function() { nodes[++i] = this; });
      return nodes;
    }

    function selection_node() {

      for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
        for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
          var node = group[i];
          if (node) return node;
        }
      }

      return null;
    }

    function selection_size() {
      var size = 0;
      this.each(function() { ++size; });
      return size;
    }

    function selection_empty() {
      return !this.node();
    }

    function selection_each(callback) {

      for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
        for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
          if (node = group[i]) callback.call(node, node.__data__, i, group);
        }
      }

      return this;
    }

    function attrRemove(name) {
      return function() {
        this.removeAttribute(name);
      };
    }

    function attrRemoveNS(fullname) {
      return function() {
        this.removeAttributeNS(fullname.space, fullname.local);
      };
    }

    function attrConstant(name, value) {
      return function() {
        this.setAttribute(name, value);
      };
    }

    function attrConstantNS(fullname, value) {
      return function() {
        this.setAttributeNS(fullname.space, fullname.local, value);
      };
    }

    function attrFunction(name, value) {
      return function() {
        var v = value.apply(this, arguments);
        if (v == null) this.removeAttribute(name);
        else this.setAttribute(name, v);
      };
    }

    function attrFunctionNS(fullname, value) {
      return function() {
        var v = value.apply(this, arguments);
        if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
        else this.setAttributeNS(fullname.space, fullname.local, v);
      };
    }

    function selection_attr(name, value) {
      var fullname = namespace(name);

      if (arguments.length < 2) {
        var node = this.node();
        return fullname.local
            ? node.getAttributeNS(fullname.space, fullname.local)
            : node.getAttribute(fullname);
      }

      return this.each((value == null
          ? (fullname.local ? attrRemoveNS : attrRemove) : (typeof value === "function"
          ? (fullname.local ? attrFunctionNS : attrFunction)
          : (fullname.local ? attrConstantNS : attrConstant)))(fullname, value));
    }

    function defaultView(node) {
      return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
          || (node.document && node) // node is a Window
          || node.defaultView; // node is a Document
    }

    function styleRemove(name) {
      return function() {
        this.style.removeProperty(name);
      };
    }

    function styleConstant(name, value, priority) {
      return function() {
        this.style.setProperty(name, value, priority);
      };
    }

    function styleFunction(name, value, priority) {
      return function() {
        var v = value.apply(this, arguments);
        if (v == null) this.style.removeProperty(name);
        else this.style.setProperty(name, v, priority);
      };
    }

    function selection_style(name, value, priority) {
      var node;
      return arguments.length > 1
          ? this.each((value == null
                ? styleRemove : typeof value === "function"
                ? styleFunction
                : styleConstant)(name, value, priority == null ? "" : priority))
          : defaultView(node = this.node())
              .getComputedStyle(node, null)
              .getPropertyValue(name);
    }

    function propertyRemove(name) {
      return function() {
        delete this[name];
      };
    }

    function propertyConstant(name, value) {
      return function() {
        this[name] = value;
      };
    }

    function propertyFunction(name, value) {
      return function() {
        var v = value.apply(this, arguments);
        if (v == null) delete this[name];
        else this[name] = v;
      };
    }

    function selection_property(name, value) {
      return arguments.length > 1
          ? this.each((value == null
              ? propertyRemove : typeof value === "function"
              ? propertyFunction
              : propertyConstant)(name, value))
          : this.node()[name];
    }

    function classArray(string) {
      return string.trim().split(/^|\s+/);
    }

    function classList(node) {
      return node.classList || new ClassList(node);
    }

    function ClassList(node) {
      this._node = node;
      this._names = classArray(node.getAttribute("class") || "");
    }

    ClassList.prototype = {
      add: function(name) {
        var i = this._names.indexOf(name);
        if (i < 0) {
          this._names.push(name);
          this._node.setAttribute("class", this._names.join(" "));
        }
      },
      remove: function(name) {
        var i = this._names.indexOf(name);
        if (i >= 0) {
          this._names.splice(i, 1);
          this._node.setAttribute("class", this._names.join(" "));
        }
      },
      contains: function(name) {
        return this._names.indexOf(name) >= 0;
      }
    };

    function classedAdd(node, names) {
      var list = classList(node), i = -1, n = names.length;
      while (++i < n) list.add(names[i]);
    }

    function classedRemove(node, names) {
      var list = classList(node), i = -1, n = names.length;
      while (++i < n) list.remove(names[i]);
    }

    function classedTrue(names) {
      return function() {
        classedAdd(this, names);
      };
    }

    function classedFalse(names) {
      return function() {
        classedRemove(this, names);
      };
    }

    function classedFunction(names, value) {
      return function() {
        (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
      };
    }

    function selection_classed(name, value) {
      var names = classArray(name + "");

      if (arguments.length < 2) {
        var list = classList(this.node()), i = -1, n = names.length;
        while (++i < n) if (!list.contains(names[i])) return false;
        return true;
      }

      return this.each((typeof value === "function"
          ? classedFunction : value
          ? classedTrue
          : classedFalse)(names, value));
    }

    function textRemove() {
      this.textContent = "";
    }

    function textConstant(value) {
      return function() {
        this.textContent = value;
      };
    }

    function textFunction(value) {
      return function() {
        var v = value.apply(this, arguments);
        this.textContent = v == null ? "" : v;
      };
    }

    function selection_text(value) {
      return arguments.length
          ? this.each(value == null
              ? textRemove : (typeof value === "function"
              ? textFunction
              : textConstant)(value))
          : this.node().textContent;
    }

    function htmlRemove() {
      this.innerHTML = "";
    }

    function htmlConstant(value) {
      return function() {
        this.innerHTML = value;
      };
    }

    function htmlFunction(value) {
      return function() {
        var v = value.apply(this, arguments);
        this.innerHTML = v == null ? "" : v;
      };
    }

    function selection_html(value) {
      return arguments.length
          ? this.each(value == null
              ? htmlRemove : (typeof value === "function"
              ? htmlFunction
              : htmlConstant)(value))
          : this.node().innerHTML;
    }

    function raise() {
      if (this.nextSibling) this.parentNode.appendChild(this);
    }

    function selection_raise() {
      return this.each(raise);
    }

    function lower() {
      if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
    }

    function selection_lower() {
      return this.each(lower);
    }

    function append(create) {
      return function() {
        return this.appendChild(create.apply(this, arguments));
      };
    }

    function insert(create, select) {
      return function() {
        return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
      };
    }

    function constantNull() {
      return null;
    }

    function selection_append(name, before) {
      var create = typeof name === "function" ? name : creator(name);
      return this.select(arguments.length < 2
          ? append(create)
          : insert(create, before == null
              ? constantNull : typeof before === "function"
              ? before
              : selector(before)));
    }

    function remove() {
      var parent = this.parentNode;
      if (parent) parent.removeChild(this);
    }

    function selection_remove() {
      return this.each(remove);
    }

    function selection_datum(value) {
      return arguments.length
          ? this.property("__data__", value)
          : this.node().__data__;
    }

    function dispatchEvent(node, type, params) {
      var window = defaultView(node),
          event = window.CustomEvent;

      if (event) {
        event = new event(type, params);
      } else {
        event = window.document.createEvent("Event");
        if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
        else event.initEvent(type, false, false);
      }

      node.dispatchEvent(event);
    }

    function dispatchConstant(type, params) {
      return function() {
        return dispatchEvent(this, type, params);
      };
    }

    function dispatchFunction(type, params) {
      return function() {
        return dispatchEvent(this, type, params.apply(this, arguments));
      };
    }

    function selection_dispatch(type, params) {
      return this.each((typeof params === "function"
          ? dispatchFunction
          : dispatchConstant)(type, params));
    }

    var root = [null];

    function Selection(groups, parents) {
      this._groups = groups;
      this._parents = parents;
    }

    function selection() {
      return new Selection([[document.documentElement]], root);
    }

    Selection.prototype = selection.prototype = {
      constructor: Selection,
      select: selection_select,
      selectAll: selection_selectAll,
      filter: selection_filter,
      data: selection_data,
      enter: selection_enter,
      exit: selection_exit,
      merge: selection_merge,
      order: selection_order,
      sort: selection_sort,
      call: selection_call,
      nodes: selection_nodes,
      node: selection_node,
      size: selection_size,
      empty: selection_empty,
      each: selection_each,
      attr: selection_attr,
      style: selection_style,
      property: selection_property,
      classed: selection_classed,
      text: selection_text,
      html: selection_html,
      raise: selection_raise,
      lower: selection_lower,
      append: selection_append,
      remove: selection_remove,
      datum: selection_datum,
      on: selection_on,
      dispatch: selection_dispatch
    };

    function select(selector) {
      return typeof selector === "string"
          ? new Selection([[document.querySelector(selector)]], [document.documentElement])
          : new Selection([[selector]], root);
    }

    function node_each(callback) {
      var node = this, current, next = [node], children, i, n;
      do {
        current = next.reverse(), next = [];
        while (node = current.pop()) {
          callback(node), children = node.children;
          if (children) for (i = 0, n = children.length; i < n; ++i) {
            next.push(children[i]);
          }
        }
      } while (next.length);
      return this;
    }

    function node_eachBefore(callback) {
      var node = this, nodes = [node], children, i;
      while (node = nodes.pop()) {
        callback(node), children = node.children;
        if (children) for (i = children.length - 1; i >= 0; --i) {
          nodes.push(children[i]);
        }
      }
      return this;
    }

    function node_eachAfter(callback) {
      var node = this, nodes = [node], next = [], children, i, n;
      while (node = nodes.pop()) {
        next.push(node), children = node.children;
        if (children) for (i = 0, n = children.length; i < n; ++i) {
          nodes.push(children[i]);
        }
      }
      while (node = next.pop()) {
        callback(node);
      }
      return this;
    }

    function node_sum(value) {
      return this.eachAfter(function(node) {
        var sum = +value(node.data) || 0,
            children = node.children,
            i = children && children.length;
        while (--i >= 0) sum += children[i].value;
        node.value = sum;
      });
    }

    function node_sort(compare) {
      return this.eachBefore(function(node) {
        if (node.children) {
          node.children.sort(compare);
        }
      });
    }

    function node_path(end) {
      var start = this,
          ancestor = leastCommonAncestor(start, end),
          nodes = [start];
      while (start !== ancestor) {
        start = start.parent;
        nodes.push(start);
      }
      var k = nodes.length;
      while (end !== ancestor) {
        nodes.splice(k, 0, end);
        end = end.parent;
      }
      return nodes;
    }

    function leastCommonAncestor(a, b) {
      if (a === b) return a;
      var aNodes = a.ancestors(),
          bNodes = b.ancestors(),
          c = null;
      a = aNodes.pop();
      b = bNodes.pop();
      while (a === b) {
        c = a;
        a = aNodes.pop();
        b = bNodes.pop();
      }
      return c;
    }

    function node_ancestors() {
      var node = this, nodes = [node];
      while (node = node.parent) {
        nodes.push(node);
      }
      return nodes;
    }

    function node_descendants() {
      var nodes = [];
      this.each(function(node) {
        nodes.push(node);
      });
      return nodes;
    }

    function node_leaves() {
      var leaves = [];
      this.eachBefore(function(node) {
        if (!node.children) {
          leaves.push(node);
        }
      });
      return leaves;
    }

    function node_links() {
      var root = this, links = [];
      root.each(function(node) {
        if (node !== root) { // Don’t include the root’s parent, if any.
          links.push({source: node.parent, target: node});
        }
      });
      return links;
    }

    function hierarchy(data, children) {
      var root = new Node(data),
          valued = +data.value && (root.value = data.value),
          node,
          nodes = [root],
          child,
          childs,
          i,
          n;

      if (children == null) children = defaultChildren;

      while (node = nodes.pop()) {
        if (valued) node.value = +node.data.value;
        if ((childs = children(node.data)) && (n = childs.length)) {
          node.children = new Array(n);
          for (i = n - 1; i >= 0; --i) {
            nodes.push(child = node.children[i] = new Node(childs[i]));
            child.parent = node;
            child.depth = node.depth + 1;
          }
        }
      }

      return root.eachBefore(computeHeight);
    }

    function node_copy() {
      return hierarchy(this).eachBefore(copyData);
    }

    function defaultChildren(d) {
      return d.children;
    }

    function copyData(node) {
      node.data = node.data.data;
    }

    function computeHeight(node) {
      var height = 0;
      do node.height = height;
      while ((node = node.parent) && (node.height < ++height));
    }

    function Node(data) {
      this.data = data;
      this.depth =
      this.height = 0;
      this.parent = null;
    }

    Node.prototype = hierarchy.prototype = {
      constructor: Node,
      each: node_each,
      eachAfter: node_eachAfter,
      eachBefore: node_eachBefore,
      sum: node_sum,
      sort: node_sort,
      path: node_path,
      ancestors: node_ancestors,
      descendants: node_descendants,
      leaves: node_leaves,
      links: node_links,
      copy: node_copy
    };

    function dice(parent, x0, y0, x1, y1) {
      var nodes = parent.children,
          node,
          i = -1,
          n = nodes.length,
          k = parent.value && (x1 - x0) / parent.value;

      while (++i < n) {
        node = nodes[i], node.y0 = y0, node.y1 = y1;
        node.x0 = x0, node.x1 = x0 += node.value * k;
      }
    }

    function slice(parent, x0, y0, x1, y1) {
      var nodes = parent.children,
          node,
          i = -1,
          n = nodes.length,
          k = parent.value && (y1 - y0) / parent.value;

      while (++i < n) {
        node = nodes[i], node.x0 = x0, node.x1 = x1;
        node.y0 = y0, node.y1 = y0 += node.value * k;
      }
    }

    (function custom(ratio) {

      function squarify(parent, x0, y0, x1, y1) {
        if (parent._squarify) return resquarify(parent, x0, y0, x1, y1);

        var squarified = parent._squarify = [],
            nodes = parent.children,
            row,
            nodeValue,
            i0 = 0,
            i1,
            n = nodes.length,
            dx, dy,
            value = parent.value,
            sumValue,
            minValue,
            maxValue,
            newRatio,
            minRatio,
            alpha,
            beta;

        while (i0 < n) {
          dx = x1 - x0, dy = y1 - y0;
          minValue = maxValue = sumValue = nodes[i0].value;
          alpha = Math.max(dy / dx, dx / dy) / (value * ratio);
          beta = sumValue * sumValue * alpha;
          minRatio = Math.max(maxValue / beta, beta / minValue);

          // Keep adding nodes while the aspect ratio maintains or improves.
          for (i1 = i0 + 1; i1 < n; ++i1) {
            sumValue += nodeValue = nodes[i1].value;
            if (nodeValue < minValue) minValue = nodeValue;
            if (nodeValue > maxValue) maxValue = nodeValue;
            beta = sumValue * sumValue * alpha;
            newRatio = Math.max(maxValue / beta, beta / minValue);
            if (newRatio > minRatio) { sumValue -= nodeValue; break; }
            minRatio = newRatio;
          }

          // Position and record the row orientation.
          squarified.push(row = {value: sumValue, dice: dx < dy, children: nodes.slice(i0, i1)});
          if (row.dice) dice(row, x0, y0, x1, value ? y0 += dy * sumValue / value : y1);
          else slice(row, x0, y0, value ? x0 += dx * sumValue / value : x1, y1);
          value -= sumValue, i0 = i1;
        }
      }

      squarify.ratio = function(x) {
        return custom((x = +x) > 1 ? x : 1);
      };

      return squarify;
    })((1 + Math.sqrt(5)) / 2, false);

    function resquarify(parent, x0, y0, x1, y1) {
      var squarified = parent._squarify,
          row,
          nodes,
          i,
          j = -1,
          n,
          m = squarified.length,
          value = parent.value;

      while (++j < m) {
        row = squarified[j], nodes = row.children;
        for (i = row.value = 0, n = nodes.length; i < n; ++i) row.value += nodes[i].value;
        if (row.dice) dice(row, x0, y0, x1, y0 += (y1 - y0) * row.value / value);
        else slice(row, x0, y0, x0 += (x1 - x0) * row.value / value, y1);
        value -= row.value;
      }
    }

    var DefaultGraph = (function () {
        function DefaultGraph() {
        }
        DefaultGraph.prototype.init = function (data) {
            this.graph = select('#graph');
            this.prep(data);
        };
        DefaultGraph.prototype.prep = function (initData) {
            initData = initData.filter(function (d) { return d.YEAR == 2016; });
            var entries = nest()
                .key(function (e) { return e.CATEGORY; })
                .key(function (e) { return e.FUNDING_CATEGORY; })
                .entries(initData);
            var root = hierarchy({ values: entries }, function (d) {
                return d.values;
            }).sum(function (d) {
                if (d.TYPE === 'Total') {
                    return d.AMOUNT;
                }
            });
            console.log(root);
        };
        return DefaultGraph;
    }());

    var test = (function () {
        function test() {
            var _this = this;
            this._data = new DataService();
            this._graph = new DefaultGraph();
            this._data.getData().then(function (done) {
                _this._graph.init(done);
                console.log('hi');
            });
        }
        return test;
    }());

    exports.test = test;

}((this.infographics = this.infographics || {})));