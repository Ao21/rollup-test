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

    var DefaultGraph = (function () {
        function DefaultGraph() {
        }
        DefaultGraph.prototype.init = function (data) {
            console.log(data);
        };
        DefaultGraph.prototype.prep = function () { };
        return DefaultGraph;
    }());

    var test = (function () {
        function test() {
            var _this = this;
            this._data = new DataService();
            this._graph = new DefaultGraph();
            this._data.getData().then(function (done) {
                _this._graph.init(done);
            });
        }
        return test;
    }());

    exports.test = test;

}((this.infographics = this.infographics || {})));