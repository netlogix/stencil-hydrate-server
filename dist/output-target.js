'use strict';

var promises = require('fs/promises');
var require$$0$2 = require('path');
var rollup = require('rollup');
var require$$0 = require('module');
var fs$7 = require('fs');
var require$$3 = require('util');
var url$2 = require('url');
var require$$0$1 = require('os');
var require$$3$1 = require('events');
var require$$5 = require('assert');

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

const {builtinModules: builtinModules$1} = require$$0;

const ignoreList = [
	'sys'
];

// eslint-disable-next-line node/no-deprecated-api
var builtinModules_1 = (builtinModules$1 || (process.binding ? Object.keys(process.binding('natives')) : []) || [])
	.filter(x => !/^_|^(internal|v8|node-inspect)\/|\//.test(x) && !ignoreList.includes(x))
	.sort();

const builtinModules = builtinModules_1;

const moduleSet = new Set(builtinModules);
const NODE_PROTOCOL = 'node:';

var isBuiltinModule = moduleName => {
	if (typeof moduleName !== 'string') {
		throw new TypeError('Expected a string');
	}

	if (moduleName.startsWith(NODE_PROTOCOL)) {
		moduleName = moduleName.slice(NODE_PROTOCOL.length);
	}

	const slashIndex = moduleName.indexOf('/');
	if (slashIndex !== -1 && slashIndex !== moduleName.length - 1) {
		moduleName = moduleName.slice(0, slashIndex);
	}

	return moduleSet.has(moduleName);
};

var isBuiltinModule$1 = /*@__PURE__*/getDefaultExportFromCjs(isBuiltinModule);

var isMergeableObject = function isMergeableObject(value) {
	return isNonNullObject(value)
		&& !isSpecial(value)
};

function isNonNullObject(value) {
	return !!value && typeof value === 'object'
}

function isSpecial(value) {
	var stringValue = Object.prototype.toString.call(value);

	return stringValue === '[object RegExp]'
		|| stringValue === '[object Date]'
		|| isReactElement(value)
}

// see https://github.com/facebook/react/blob/b5ac963fb791d1298e7f396236383bc955f916c1/src/isomorphic/classic/element/ReactElement.js#L21-L25
var canUseSymbol = typeof Symbol === 'function' && Symbol.for;
var REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for('react.element') : 0xeac7;

function isReactElement(value) {
	return value.$$typeof === REACT_ELEMENT_TYPE
}

function emptyTarget(val) {
	return Array.isArray(val) ? [] : {}
}

function cloneUnlessOtherwiseSpecified(value, options) {
	return (options.clone !== false && options.isMergeableObject(value))
		? deepmerge(emptyTarget(value), value, options)
		: value
}

function defaultArrayMerge(target, source, options) {
	return target.concat(source).map(function(element) {
		return cloneUnlessOtherwiseSpecified(element, options)
	})
}

function getMergeFunction(key, options) {
	if (!options.customMerge) {
		return deepmerge
	}
	var customMerge = options.customMerge(key);
	return typeof customMerge === 'function' ? customMerge : deepmerge
}

function getEnumerableOwnPropertySymbols(target) {
	return Object.getOwnPropertySymbols
		? Object.getOwnPropertySymbols(target).filter(function(symbol) {
			return Object.propertyIsEnumerable.call(target, symbol)
		})
		: []
}

function getKeys(target) {
	return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target))
}

function propertyIsOnObject(object, property) {
	try {
		return property in object
	} catch(_) {
		return false
	}
}

// Protects from prototype poisoning and unexpected merging up the prototype chain.
function propertyIsUnsafe(target, key) {
	return propertyIsOnObject(target, key) // Properties are safe to merge if they don't exist in the target yet,
		&& !(Object.hasOwnProperty.call(target, key) // unsafe if they exist up the prototype chain,
			&& Object.propertyIsEnumerable.call(target, key)) // and also unsafe if they're nonenumerable.
}

function mergeObject(target, source, options) {
	var destination = {};
	if (options.isMergeableObject(target)) {
		getKeys(target).forEach(function(key) {
			destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
		});
	}
	getKeys(source).forEach(function(key) {
		if (propertyIsUnsafe(target, key)) {
			return
		}

		if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) {
			destination[key] = getMergeFunction(key, options)(target[key], source[key], options);
		} else {
			destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
		}
	});
	return destination
}

function deepmerge(target, source, options) {
	options = options || {};
	options.arrayMerge = options.arrayMerge || defaultArrayMerge;
	options.isMergeableObject = options.isMergeableObject || isMergeableObject;
	// cloneUnlessOtherwiseSpecified is added to `options` so that custom arrayMerge()
	// implementations can use it. The caller may not replace it.
	options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;

	var sourceIsArray = Array.isArray(source);
	var targetIsArray = Array.isArray(target);
	var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;

	if (!sourceAndTargetTypesMatch) {
		return cloneUnlessOtherwiseSpecified(source, options)
	} else if (sourceIsArray) {
		return options.arrayMerge(target, source, options)
	} else {
		return mergeObject(target, source, options)
	}
}

deepmerge.all = function deepmergeAll(array, options) {
	if (!Array.isArray(array)) {
		throw new Error('first argument should be an array')
	}

	return array.reduce(function(prev, next) {
		return deepmerge(prev, next, options)
	}, {})
};

var deepmerge_1 = deepmerge;

var cjs = deepmerge_1;

var deepMerge = /*@__PURE__*/getDefaultExportFromCjs(cjs);

// no idea what these regular expressions do,
// but i extracted it from https://github.com/yahoo/js-module-formats/blob/master/index.js#L18
var ES6ImportExportRegExp = /(?:^\s*|[}{\(\);,\n]\s*)(import\s+['"]|(import|module)\s+[^"'\(\)\n;]+\s+from\s+['"]|export\s+(\*|\{|default|function|var|const|let|[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*))/;

var ES6AliasRegExp = /(?:^\s*|[}{\(\);,\n]\s*)(export\s*\*\s*from\s*(?:'([^']+)'|"([^"]+)"))/;

var isModule = function (sauce) {
  return ES6ImportExportRegExp.test(sauce)
    || ES6AliasRegExp.test(sauce);
};

var isModule$1 = /*@__PURE__*/getDefaultExportFromCjs(isModule);

var os$2 = require$$0$1;

// adapted from https://github.com/sindresorhus/os-homedir/blob/11e089f4754db38bb535e5a8416320c4446e8cfd/index.js

var homedir$2 = os$2.homedir || function homedir() {
    var home = process.env.HOME;
    var user = process.env.LOGNAME || process.env.USER || process.env.LNAME || process.env.USERNAME;

    if (process.platform === 'win32') {
        return process.env.USERPROFILE || process.env.HOMEDRIVE + process.env.HOMEPATH || home || null;
    }

    if (process.platform === 'darwin') {
        return home || (user ? '/Users/' + user : null);
    }

    if (process.platform === 'linux') {
        return home || (process.getuid() === 0 ? '/root' : (user ? '/home/' + user : null)); // eslint-disable-line no-extra-parens
    }

    return home || null;
};

var caller$2 = function () {
    // see https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
    var origPrepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = function (_, stack) { return stack; };
    var stack = (new Error()).stack;
    Error.prepareStackTrace = origPrepareStackTrace;
    return stack[2].getFileName();
};

var pathParse = {exports: {}};

var hasRequiredPathParse;

function requirePathParse () {
	if (hasRequiredPathParse) return pathParse.exports;
	hasRequiredPathParse = 1;

	var isWindows = process.platform === 'win32';

	// Regex to split a windows path into into [dir, root, basename, name, ext]
	var splitWindowsRe =
	    /^(((?:[a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?[\\\/]?)(?:[^\\\/]*[\\\/])*)((\.{1,2}|[^\\\/]+?|)(\.[^.\/\\]*|))[\\\/]*$/;

	var win32 = {};

	function win32SplitPath(filename) {
	  return splitWindowsRe.exec(filename).slice(1);
	}

	win32.parse = function(pathString) {
	  if (typeof pathString !== 'string') {
	    throw new TypeError(
	        "Parameter 'pathString' must be a string, not " + typeof pathString
	    );
	  }
	  var allParts = win32SplitPath(pathString);
	  if (!allParts || allParts.length !== 5) {
	    throw new TypeError("Invalid path '" + pathString + "'");
	  }
	  return {
	    root: allParts[1],
	    dir: allParts[0] === allParts[1] ? allParts[0] : allParts[0].slice(0, -1),
	    base: allParts[2],
	    ext: allParts[4],
	    name: allParts[3]
	  };
	};



	// Split a filename into [dir, root, basename, name, ext], unix version
	// 'root' is just a slash, or nothing.
	var splitPathRe =
	    /^((\/?)(?:[^\/]*\/)*)((\.{1,2}|[^\/]+?|)(\.[^.\/]*|))[\/]*$/;
	var posix = {};


	function posixSplitPath(filename) {
	  return splitPathRe.exec(filename).slice(1);
	}


	posix.parse = function(pathString) {
	  if (typeof pathString !== 'string') {
	    throw new TypeError(
	        "Parameter 'pathString' must be a string, not " + typeof pathString
	    );
	  }
	  var allParts = posixSplitPath(pathString);
	  if (!allParts || allParts.length !== 5) {
	    throw new TypeError("Invalid path '" + pathString + "'");
	  }
	  
	  return {
	    root: allParts[1],
	    dir: allParts[0].slice(0, -1),
	    base: allParts[2],
	    ext: allParts[4],
	    name: allParts[3],
	  };
	};


	if (isWindows)
	  pathParse.exports = win32.parse;
	else /* posix */
	  pathParse.exports = posix.parse;

	pathParse.exports.posix = posix.parse;
	pathParse.exports.win32 = win32.parse;
	return pathParse.exports;
}

var path$a = require$$0$2;
var parse$2 = path$a.parse || requirePathParse(); // eslint-disable-line global-require

var getNodeModulesDirs = function getNodeModulesDirs(absoluteStart, modules) {
    var prefix = '/';
    if ((/^([A-Za-z]:)/).test(absoluteStart)) {
        prefix = '';
    } else if ((/^\\\\/).test(absoluteStart)) {
        prefix = '\\\\';
    }

    var paths = [absoluteStart];
    var parsed = parse$2(absoluteStart);
    while (parsed.dir !== paths[paths.length - 1]) {
        paths.push(parsed.dir);
        parsed = parse$2(parsed.dir);
    }

    return paths.reduce(function (dirs, aPath) {
        return dirs.concat(modules.map(function (moduleDir) {
            return path$a.resolve(prefix, aPath, moduleDir);
        }));
    }, []);
};

var nodeModulesPaths$2 = function nodeModulesPaths(start, opts, request) {
    var modules = opts && opts.moduleDirectory
        ? [].concat(opts.moduleDirectory)
        : ['node_modules'];

    if (opts && typeof opts.paths === 'function') {
        return opts.paths(
            request,
            start,
            function () { return getNodeModulesDirs(start, modules); },
            opts
        );
    }

    var dirs = getNodeModulesDirs(start, modules);
    return opts && opts.paths ? dirs.concat(opts.paths) : dirs;
};

var normalizeOptions$2 = function (x, opts) {
    /**
     * This file is purposefully a passthrough. It's expected that third-party
     * environments will override it at runtime in order to inject special logic
     * into `resolve` (by manipulating the options). One such example is the PnP
     * code path in Yarn.
     */

    return opts || {};
};

/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var toStr = Object.prototype.toString;
var max = Math.max;
var funcType = '[object Function]';

var concatty = function concatty(a, b) {
    var arr = [];

    for (var i = 0; i < a.length; i += 1) {
        arr[i] = a[i];
    }
    for (var j = 0; j < b.length; j += 1) {
        arr[j + a.length] = b[j];
    }

    return arr;
};

var slicy = function slicy(arrLike, offset) {
    var arr = [];
    for (var i = offset || 0, j = 0; i < arrLike.length; i += 1, j += 1) {
        arr[j] = arrLike[i];
    }
    return arr;
};

var joiny = function (arr, joiner) {
    var str = '';
    for (var i = 0; i < arr.length; i += 1) {
        str += arr[i];
        if (i + 1 < arr.length) {
            str += joiner;
        }
    }
    return str;
};

var implementation$1 = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr.apply(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slicy(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                concatty(args, arguments)
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        }
        return target.apply(
            that,
            concatty(args, arguments)
        );

    };

    var boundLength = max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs[i] = '$' + i;
    }

    bound = Function('binder', 'return function (' + joiny(boundArgs, ',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

var implementation = implementation$1;

var functionBind = Function.prototype.bind || implementation;

var call = Function.prototype.call;
var $hasOwn = Object.prototype.hasOwnProperty;
var bind = functionBind;

/** @type {import('.')} */
var hasown = bind.call(call, $hasOwn);

var assert$1 = true;
var async_hooks$1 = ">= 8";
var buffer_ieee754$1 = ">= 0.5 && < 0.9.7";
var buffer$1 = true;
var child_process$1 = true;
var cluster$1 = ">= 0.5";
var console$2 = true;
var constants$4 = true;
var crypto$1 = true;
var _debug_agent$1 = ">= 1 && < 8";
var _debugger$1 = "< 8";
var dgram$1 = true;
var diagnostics_channel$1 = [
	">= 14.17 && < 15",
	">= 15.1"
];
var dns$1 = true;
var domain$1 = ">= 0.7.12";
var events$1 = true;
var freelist$1 = "< 6";
var fs$6 = true;
var _http_agent$1 = ">= 0.11.1";
var _http_client$1 = ">= 0.11.1";
var _http_common$1 = ">= 0.11.1";
var _http_incoming$1 = ">= 0.11.1";
var _http_outgoing$1 = ">= 0.11.1";
var _http_server$1 = ">= 0.11.1";
var http$1 = true;
var http2$1 = ">= 8.8";
var https$1 = true;
var inspector$1 = ">= 8";
var _linklist$1 = "< 8";
var module$2 = true;
var net$1 = true;
var os$1 = true;
var path$9 = true;
var perf_hooks$1 = ">= 8.5";
var process$2 = ">= 1";
var punycode$1 = ">= 0.5";
var querystring$1 = true;
var readline$1 = true;
var repl$1 = true;
var smalloc$1 = ">= 0.11.5 && < 3";
var _stream_duplex$1 = ">= 0.9.4";
var _stream_transform$1 = ">= 0.9.4";
var _stream_wrap$1 = ">= 1.4.1";
var _stream_passthrough$1 = ">= 0.9.4";
var _stream_readable$1 = ">= 0.9.4";
var _stream_writable$1 = ">= 0.9.4";
var stream$1 = true;
var string_decoder$1 = true;
var sys$1 = [
	">= 0.4 && < 0.7",
	">= 0.8"
];
var timers$1 = true;
var _tls_common$1 = ">= 0.11.13";
var _tls_legacy$1 = ">= 0.11.3 && < 10";
var _tls_wrap$1 = ">= 0.11.3";
var tls$1 = true;
var trace_events$1 = ">= 10";
var tty$1 = true;
var url$1 = true;
var util$2 = true;
var v8$1 = ">= 1";
var vm$1 = true;
var wasi$1 = [
	">= 13.4 && < 13.5",
	">= 18.17 && < 19",
	">= 20"
];
var worker_threads$1 = ">= 11.7";
var zlib$1 = ">= 0.5";
var require$$1$1 = {
	assert: assert$1,
	"node:assert": [
	">= 14.18 && < 15",
	">= 16"
],
	"assert/strict": ">= 15",
	"node:assert/strict": ">= 16",
	async_hooks: async_hooks$1,
	"node:async_hooks": [
	">= 14.18 && < 15",
	">= 16"
],
	buffer_ieee754: buffer_ieee754$1,
	buffer: buffer$1,
	"node:buffer": [
	">= 14.18 && < 15",
	">= 16"
],
	child_process: child_process$1,
	"node:child_process": [
	">= 14.18 && < 15",
	">= 16"
],
	cluster: cluster$1,
	"node:cluster": [
	">= 14.18 && < 15",
	">= 16"
],
	console: console$2,
	"node:console": [
	">= 14.18 && < 15",
	">= 16"
],
	constants: constants$4,
	"node:constants": [
	">= 14.18 && < 15",
	">= 16"
],
	crypto: crypto$1,
	"node:crypto": [
	">= 14.18 && < 15",
	">= 16"
],
	_debug_agent: _debug_agent$1,
	_debugger: _debugger$1,
	dgram: dgram$1,
	"node:dgram": [
	">= 14.18 && < 15",
	">= 16"
],
	diagnostics_channel: diagnostics_channel$1,
	"node:diagnostics_channel": [
	">= 14.18 && < 15",
	">= 16"
],
	dns: dns$1,
	"node:dns": [
	">= 14.18 && < 15",
	">= 16"
],
	"dns/promises": ">= 15",
	"node:dns/promises": ">= 16",
	domain: domain$1,
	"node:domain": [
	">= 14.18 && < 15",
	">= 16"
],
	events: events$1,
	"node:events": [
	">= 14.18 && < 15",
	">= 16"
],
	freelist: freelist$1,
	fs: fs$6,
	"node:fs": [
	">= 14.18 && < 15",
	">= 16"
],
	"fs/promises": [
	">= 10 && < 10.1",
	">= 14"
],
	"node:fs/promises": [
	">= 14.18 && < 15",
	">= 16"
],
	_http_agent: _http_agent$1,
	"node:_http_agent": [
	">= 14.18 && < 15",
	">= 16"
],
	_http_client: _http_client$1,
	"node:_http_client": [
	">= 14.18 && < 15",
	">= 16"
],
	_http_common: _http_common$1,
	"node:_http_common": [
	">= 14.18 && < 15",
	">= 16"
],
	_http_incoming: _http_incoming$1,
	"node:_http_incoming": [
	">= 14.18 && < 15",
	">= 16"
],
	_http_outgoing: _http_outgoing$1,
	"node:_http_outgoing": [
	">= 14.18 && < 15",
	">= 16"
],
	_http_server: _http_server$1,
	"node:_http_server": [
	">= 14.18 && < 15",
	">= 16"
],
	http: http$1,
	"node:http": [
	">= 14.18 && < 15",
	">= 16"
],
	http2: http2$1,
	"node:http2": [
	">= 14.18 && < 15",
	">= 16"
],
	https: https$1,
	"node:https": [
	">= 14.18 && < 15",
	">= 16"
],
	inspector: inspector$1,
	"node:inspector": [
	">= 14.18 && < 15",
	">= 16"
],
	"inspector/promises": [
	">= 19"
],
	"node:inspector/promises": [
	">= 19"
],
	_linklist: _linklist$1,
	module: module$2,
	"node:module": [
	">= 14.18 && < 15",
	">= 16"
],
	net: net$1,
	"node:net": [
	">= 14.18 && < 15",
	">= 16"
],
	"node-inspect/lib/_inspect": ">= 7.6 && < 12",
	"node-inspect/lib/internal/inspect_client": ">= 7.6 && < 12",
	"node-inspect/lib/internal/inspect_repl": ">= 7.6 && < 12",
	os: os$1,
	"node:os": [
	">= 14.18 && < 15",
	">= 16"
],
	path: path$9,
	"node:path": [
	">= 14.18 && < 15",
	">= 16"
],
	"path/posix": ">= 15.3",
	"node:path/posix": ">= 16",
	"path/win32": ">= 15.3",
	"node:path/win32": ">= 16",
	perf_hooks: perf_hooks$1,
	"node:perf_hooks": [
	">= 14.18 && < 15",
	">= 16"
],
	process: process$2,
	"node:process": [
	">= 14.18 && < 15",
	">= 16"
],
	punycode: punycode$1,
	"node:punycode": [
	">= 14.18 && < 15",
	">= 16"
],
	querystring: querystring$1,
	"node:querystring": [
	">= 14.18 && < 15",
	">= 16"
],
	readline: readline$1,
	"node:readline": [
	">= 14.18 && < 15",
	">= 16"
],
	"readline/promises": ">= 17",
	"node:readline/promises": ">= 17",
	repl: repl$1,
	"node:repl": [
	">= 14.18 && < 15",
	">= 16"
],
	smalloc: smalloc$1,
	_stream_duplex: _stream_duplex$1,
	"node:_stream_duplex": [
	">= 14.18 && < 15",
	">= 16"
],
	_stream_transform: _stream_transform$1,
	"node:_stream_transform": [
	">= 14.18 && < 15",
	">= 16"
],
	_stream_wrap: _stream_wrap$1,
	"node:_stream_wrap": [
	">= 14.18 && < 15",
	">= 16"
],
	_stream_passthrough: _stream_passthrough$1,
	"node:_stream_passthrough": [
	">= 14.18 && < 15",
	">= 16"
],
	_stream_readable: _stream_readable$1,
	"node:_stream_readable": [
	">= 14.18 && < 15",
	">= 16"
],
	_stream_writable: _stream_writable$1,
	"node:_stream_writable": [
	">= 14.18 && < 15",
	">= 16"
],
	stream: stream$1,
	"node:stream": [
	">= 14.18 && < 15",
	">= 16"
],
	"stream/consumers": ">= 16.7",
	"node:stream/consumers": ">= 16.7",
	"stream/promises": ">= 15",
	"node:stream/promises": ">= 16",
	"stream/web": ">= 16.5",
	"node:stream/web": ">= 16.5",
	string_decoder: string_decoder$1,
	"node:string_decoder": [
	">= 14.18 && < 15",
	">= 16"
],
	sys: sys$1,
	"node:sys": [
	">= 14.18 && < 15",
	">= 16"
],
	"test/reporters": ">= 19.9 && < 20.2",
	"node:test/reporters": [
	">= 18.17 && < 19",
	">= 19.9",
	">= 20"
],
	"node:test": [
	">= 16.17 && < 17",
	">= 18"
],
	timers: timers$1,
	"node:timers": [
	">= 14.18 && < 15",
	">= 16"
],
	"timers/promises": ">= 15",
	"node:timers/promises": ">= 16",
	_tls_common: _tls_common$1,
	"node:_tls_common": [
	">= 14.18 && < 15",
	">= 16"
],
	_tls_legacy: _tls_legacy$1,
	_tls_wrap: _tls_wrap$1,
	"node:_tls_wrap": [
	">= 14.18 && < 15",
	">= 16"
],
	tls: tls$1,
	"node:tls": [
	">= 14.18 && < 15",
	">= 16"
],
	trace_events: trace_events$1,
	"node:trace_events": [
	">= 14.18 && < 15",
	">= 16"
],
	tty: tty$1,
	"node:tty": [
	">= 14.18 && < 15",
	">= 16"
],
	url: url$1,
	"node:url": [
	">= 14.18 && < 15",
	">= 16"
],
	util: util$2,
	"node:util": [
	">= 14.18 && < 15",
	">= 16"
],
	"util/types": ">= 15.3",
	"node:util/types": ">= 16",
	"v8/tools/arguments": ">= 10 && < 12",
	"v8/tools/codemap": [
	">= 4.4 && < 5",
	">= 5.2 && < 12"
],
	"v8/tools/consarray": [
	">= 4.4 && < 5",
	">= 5.2 && < 12"
],
	"v8/tools/csvparser": [
	">= 4.4 && < 5",
	">= 5.2 && < 12"
],
	"v8/tools/logreader": [
	">= 4.4 && < 5",
	">= 5.2 && < 12"
],
	"v8/tools/profile_view": [
	">= 4.4 && < 5",
	">= 5.2 && < 12"
],
	"v8/tools/splaytree": [
	">= 4.4 && < 5",
	">= 5.2 && < 12"
],
	v8: v8$1,
	"node:v8": [
	">= 14.18 && < 15",
	">= 16"
],
	vm: vm$1,
	"node:vm": [
	">= 14.18 && < 15",
	">= 16"
],
	wasi: wasi$1,
	"node:wasi": [
	">= 18.17 && < 19",
	">= 20"
],
	worker_threads: worker_threads$1,
	"node:worker_threads": [
	">= 14.18 && < 15",
	">= 16"
],
	zlib: zlib$1,
	"node:zlib": [
	">= 14.18 && < 15",
	">= 16"
]
};

var hasOwn = hasown;

function specifierIncluded(current, specifier) {
	var nodeParts = current.split('.');
	var parts = specifier.split(' ');
	var op = parts.length > 1 ? parts[0] : '=';
	var versionParts = (parts.length > 1 ? parts[1] : parts[0]).split('.');

	for (var i = 0; i < 3; ++i) {
		var cur = parseInt(nodeParts[i] || 0, 10);
		var ver = parseInt(versionParts[i] || 0, 10);
		if (cur === ver) {
			continue; // eslint-disable-line no-restricted-syntax, no-continue
		}
		if (op === '<') {
			return cur < ver;
		}
		if (op === '>=') {
			return cur >= ver;
		}
		return false;
	}
	return op === '>=';
}

function matchesRange(current, range) {
	var specifiers = range.split(/ ?&& ?/);
	if (specifiers.length === 0) {
		return false;
	}
	for (var i = 0; i < specifiers.length; ++i) {
		if (!specifierIncluded(current, specifiers[i])) {
			return false;
		}
	}
	return true;
}

function versionIncluded(nodeVersion, specifierValue) {
	if (typeof specifierValue === 'boolean') {
		return specifierValue;
	}

	var current = typeof nodeVersion === 'undefined'
		? process.versions && process.versions.node
		: nodeVersion;

	if (typeof current !== 'string') {
		throw new TypeError(typeof nodeVersion === 'undefined' ? 'Unable to determine current node version' : 'If provided, a valid node version is required');
	}

	if (specifierValue && typeof specifierValue === 'object') {
		for (var i = 0; i < specifierValue.length; ++i) {
			if (matchesRange(current, specifierValue[i])) {
				return true;
			}
		}
		return false;
	}
	return matchesRange(current, specifierValue);
}

var data$1 = require$$1$1;

var isCoreModule$2 = function isCore(x, nodeVersion) {
	return hasOwn(data$1, x) && versionIncluded(nodeVersion, data$1[x]);
};

var fs$5 = fs$7;
var getHomedir$1 = homedir$2;
var path$8 = require$$0$2;
var caller$1 = caller$2;
var nodeModulesPaths$1 = nodeModulesPaths$2;
var normalizeOptions$1 = normalizeOptions$2;
var isCore$2 = isCoreModule$2;

var realpathFS$1 = process.platform !== 'win32' && fs$5.realpath && typeof fs$5.realpath.native === 'function' ? fs$5.realpath.native : fs$5.realpath;

var homedir$1 = getHomedir$1();
var defaultPaths$1 = function () {
    return [
        path$8.join(homedir$1, '.node_modules'),
        path$8.join(homedir$1, '.node_libraries')
    ];
};

var defaultIsFile$1 = function isFile(file, cb) {
    fs$5.stat(file, function (err, stat) {
        if (!err) {
            return cb(null, stat.isFile() || stat.isFIFO());
        }
        if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return cb(null, false);
        return cb(err);
    });
};

var defaultIsDir$1 = function isDirectory(dir, cb) {
    fs$5.stat(dir, function (err, stat) {
        if (!err) {
            return cb(null, stat.isDirectory());
        }
        if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return cb(null, false);
        return cb(err);
    });
};

var defaultRealpath = function realpath(x, cb) {
    realpathFS$1(x, function (realpathErr, realPath) {
        if (realpathErr && realpathErr.code !== 'ENOENT') cb(realpathErr);
        else cb(null, realpathErr ? x : realPath);
    });
};

var maybeRealpath = function maybeRealpath(realpath, x, opts, cb) {
    if (opts && opts.preserveSymlinks === false) {
        realpath(x, cb);
    } else {
        cb(null, x);
    }
};

var defaultReadPackage = function defaultReadPackage(readFile, pkgfile, cb) {
    readFile(pkgfile, function (readFileErr, body) {
        if (readFileErr) cb(readFileErr);
        else {
            try {
                var pkg = JSON.parse(body);
                cb(null, pkg);
            } catch (jsonErr) {
                cb(null);
            }
        }
    });
};

var getPackageCandidates$1 = function getPackageCandidates(x, start, opts) {
    var dirs = nodeModulesPaths$1(start, opts, x);
    for (var i = 0; i < dirs.length; i++) {
        dirs[i] = path$8.join(dirs[i], x);
    }
    return dirs;
};

var async$1 = function resolve(x, options, callback) {
    var cb = callback;
    var opts = options;
    if (typeof options === 'function') {
        cb = opts;
        opts = {};
    }
    if (typeof x !== 'string') {
        var err = new TypeError('Path must be a string.');
        return process.nextTick(function () {
            cb(err);
        });
    }

    opts = normalizeOptions$1(x, opts);

    var isFile = opts.isFile || defaultIsFile$1;
    var isDirectory = opts.isDirectory || defaultIsDir$1;
    var readFile = opts.readFile || fs$5.readFile;
    var realpath = opts.realpath || defaultRealpath;
    var readPackage = opts.readPackage || defaultReadPackage;
    if (opts.readFile && opts.readPackage) {
        var conflictErr = new TypeError('`readFile` and `readPackage` are mutually exclusive.');
        return process.nextTick(function () {
            cb(conflictErr);
        });
    }
    var packageIterator = opts.packageIterator;

    var extensions = opts.extensions || ['.js'];
    var includeCoreModules = opts.includeCoreModules !== false;
    var basedir = opts.basedir || path$8.dirname(caller$1());
    var parent = opts.filename || basedir;

    opts.paths = opts.paths || defaultPaths$1();

    // ensure that `basedir` is an absolute path at this point, resolving against the process' current working directory
    var absoluteStart = path$8.resolve(basedir);

    maybeRealpath(
        realpath,
        absoluteStart,
        opts,
        function (err, realStart) {
            if (err) cb(err);
            else init(realStart);
        }
    );

    var res;
    function init(basedir) {
        if ((/^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[/\\])/).test(x)) {
            res = path$8.resolve(basedir, x);
            if (x === '.' || x === '..' || x.slice(-1) === '/') res += '/';
            if ((/\/$/).test(x) && res === basedir) {
                loadAsDirectory(res, opts.package, onfile);
            } else loadAsFile(res, opts.package, onfile);
        } else if (includeCoreModules && isCore$2(x)) {
            return cb(null, x);
        } else loadNodeModules(x, basedir, function (err, n, pkg) {
            if (err) cb(err);
            else if (n) {
                return maybeRealpath(realpath, n, opts, function (err, realN) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, realN, pkg);
                    }
                });
            } else {
                var moduleError = new Error("Cannot find module '" + x + "' from '" + parent + "'");
                moduleError.code = 'MODULE_NOT_FOUND';
                cb(moduleError);
            }
        });
    }

    function onfile(err, m, pkg) {
        if (err) cb(err);
        else if (m) cb(null, m, pkg);
        else loadAsDirectory(res, function (err, d, pkg) {
            if (err) cb(err);
            else if (d) {
                maybeRealpath(realpath, d, opts, function (err, realD) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, realD, pkg);
                    }
                });
            } else {
                var moduleError = new Error("Cannot find module '" + x + "' from '" + parent + "'");
                moduleError.code = 'MODULE_NOT_FOUND';
                cb(moduleError);
            }
        });
    }

    function loadAsFile(x, thePackage, callback) {
        var loadAsFilePackage = thePackage;
        var cb = callback;
        if (typeof loadAsFilePackage === 'function') {
            cb = loadAsFilePackage;
            loadAsFilePackage = undefined;
        }

        var exts = [''].concat(extensions);
        load(exts, x, loadAsFilePackage);

        function load(exts, x, loadPackage) {
            if (exts.length === 0) return cb(null, undefined, loadPackage);
            var file = x + exts[0];

            var pkg = loadPackage;
            if (pkg) onpkg(null, pkg);
            else loadpkg(path$8.dirname(file), onpkg);

            function onpkg(err, pkg_, dir) {
                pkg = pkg_;
                if (err) return cb(err);
                if (dir && pkg && opts.pathFilter) {
                    var rfile = path$8.relative(dir, file);
                    var rel = rfile.slice(0, rfile.length - exts[0].length);
                    var r = opts.pathFilter(pkg, x, rel);
                    if (r) return load(
                        [''].concat(extensions.slice()),
                        path$8.resolve(dir, r),
                        pkg
                    );
                }
                isFile(file, onex);
            }
            function onex(err, ex) {
                if (err) return cb(err);
                if (ex) return cb(null, file, pkg);
                load(exts.slice(1), x, pkg);
            }
        }
    }

    function loadpkg(dir, cb) {
        if (dir === '' || dir === '/') return cb(null);
        if (process.platform === 'win32' && (/^\w:[/\\]*$/).test(dir)) {
            return cb(null);
        }
        if ((/[/\\]node_modules[/\\]*$/).test(dir)) return cb(null);

        maybeRealpath(realpath, dir, opts, function (unwrapErr, pkgdir) {
            if (unwrapErr) return loadpkg(path$8.dirname(dir), cb);
            var pkgfile = path$8.join(pkgdir, 'package.json');
            isFile(pkgfile, function (err, ex) {
                // on err, ex is false
                if (!ex) return loadpkg(path$8.dirname(dir), cb);

                readPackage(readFile, pkgfile, function (err, pkgParam) {
                    if (err) cb(err);

                    var pkg = pkgParam;

                    if (pkg && opts.packageFilter) {
                        pkg = opts.packageFilter(pkg, pkgfile);
                    }
                    cb(null, pkg, dir);
                });
            });
        });
    }

    function loadAsDirectory(x, loadAsDirectoryPackage, callback) {
        var cb = callback;
        var fpkg = loadAsDirectoryPackage;
        if (typeof fpkg === 'function') {
            cb = fpkg;
            fpkg = opts.package;
        }

        maybeRealpath(realpath, x, opts, function (unwrapErr, pkgdir) {
            if (unwrapErr) return cb(unwrapErr);
            var pkgfile = path$8.join(pkgdir, 'package.json');
            isFile(pkgfile, function (err, ex) {
                if (err) return cb(err);
                if (!ex) return loadAsFile(path$8.join(x, 'index'), fpkg, cb);

                readPackage(readFile, pkgfile, function (err, pkgParam) {
                    if (err) return cb(err);

                    var pkg = pkgParam;

                    if (pkg && opts.packageFilter) {
                        pkg = opts.packageFilter(pkg, pkgfile);
                    }

                    if (pkg && pkg.main) {
                        if (typeof pkg.main !== 'string') {
                            var mainError = new TypeError('package “' + pkg.name + '” `main` must be a string');
                            mainError.code = 'INVALID_PACKAGE_MAIN';
                            return cb(mainError);
                        }
                        if (pkg.main === '.' || pkg.main === './') {
                            pkg.main = 'index';
                        }
                        loadAsFile(path$8.resolve(x, pkg.main), pkg, function (err, m, pkg) {
                            if (err) return cb(err);
                            if (m) return cb(null, m, pkg);
                            if (!pkg) return loadAsFile(path$8.join(x, 'index'), pkg, cb);

                            var dir = path$8.resolve(x, pkg.main);
                            loadAsDirectory(dir, pkg, function (err, n, pkg) {
                                if (err) return cb(err);
                                if (n) return cb(null, n, pkg);
                                loadAsFile(path$8.join(x, 'index'), pkg, cb);
                            });
                        });
                        return;
                    }

                    loadAsFile(path$8.join(x, '/index'), pkg, cb);
                });
            });
        });
    }

    function processDirs(cb, dirs) {
        if (dirs.length === 0) return cb(null, undefined);
        var dir = dirs[0];

        isDirectory(path$8.dirname(dir), isdir);

        function isdir(err, isdir) {
            if (err) return cb(err);
            if (!isdir) return processDirs(cb, dirs.slice(1));
            loadAsFile(dir, opts.package, onfile);
        }

        function onfile(err, m, pkg) {
            if (err) return cb(err);
            if (m) return cb(null, m, pkg);
            loadAsDirectory(dir, opts.package, ondir);
        }

        function ondir(err, n, pkg) {
            if (err) return cb(err);
            if (n) return cb(null, n, pkg);
            processDirs(cb, dirs.slice(1));
        }
    }
    function loadNodeModules(x, start, cb) {
        var thunk = function () { return getPackageCandidates$1(x, start, opts); };
        processDirs(
            cb,
            packageIterator ? packageIterator(x, start, thunk, opts) : thunk()
        );
    }
};

var assert = true;
var async_hooks = ">= 8";
var buffer_ieee754 = ">= 0.5 && < 0.9.7";
var buffer = true;
var child_process = true;
var cluster = ">= 0.5";
var console$1 = true;
var constants$3 = true;
var crypto = true;
var _debug_agent = ">= 1 && < 8";
var _debugger = "< 8";
var dgram = true;
var diagnostics_channel = [
	">= 14.17 && < 15",
	">= 15.1"
];
var dns = true;
var domain = ">= 0.7.12";
var events = true;
var freelist = "< 6";
var fs$4 = true;
var _http_agent = ">= 0.11.1";
var _http_client = ">= 0.11.1";
var _http_common = ">= 0.11.1";
var _http_incoming = ">= 0.11.1";
var _http_outgoing = ">= 0.11.1";
var _http_server = ">= 0.11.1";
var http = true;
var http2 = ">= 8.8";
var https = true;
var inspector = ">= 8";
var _linklist = "< 8";
var module$1 = true;
var net = true;
var os = true;
var path$7 = true;
var perf_hooks = ">= 8.5";
var process$1 = ">= 1";
var punycode = ">= 0.5";
var querystring = true;
var readline = true;
var repl = true;
var smalloc = ">= 0.11.5 && < 3";
var _stream_duplex = ">= 0.9.4";
var _stream_transform = ">= 0.9.4";
var _stream_wrap = ">= 1.4.1";
var _stream_passthrough = ">= 0.9.4";
var _stream_readable = ">= 0.9.4";
var _stream_writable = ">= 0.9.4";
var stream = true;
var string_decoder = true;
var sys = [
	">= 0.4 && < 0.7",
	">= 0.8"
];
var timers = true;
var _tls_common = ">= 0.11.13";
var _tls_legacy = ">= 0.11.3 && < 10";
var _tls_wrap = ">= 0.11.3";
var tls = true;
var trace_events = ">= 10";
var tty = true;
var url = true;
var util$1 = true;
var v8 = ">= 1";
var vm = true;
var wasi = [
	">= 13.4 && < 13.5",
	">= 18.17 && < 19",
	">= 20"
];
var worker_threads = ">= 11.7";
var zlib = ">= 0.5";
var require$$1 = {
	assert: assert,
	"node:assert": [
	">= 14.18 && < 15",
	">= 16"
],
	"assert/strict": ">= 15",
	"node:assert/strict": ">= 16",
	async_hooks: async_hooks,
	"node:async_hooks": [
	">= 14.18 && < 15",
	">= 16"
],
	buffer_ieee754: buffer_ieee754,
	buffer: buffer,
	"node:buffer": [
	">= 14.18 && < 15",
	">= 16"
],
	child_process: child_process,
	"node:child_process": [
	">= 14.18 && < 15",
	">= 16"
],
	cluster: cluster,
	"node:cluster": [
	">= 14.18 && < 15",
	">= 16"
],
	console: console$1,
	"node:console": [
	">= 14.18 && < 15",
	">= 16"
],
	constants: constants$3,
	"node:constants": [
	">= 14.18 && < 15",
	">= 16"
],
	crypto: crypto,
	"node:crypto": [
	">= 14.18 && < 15",
	">= 16"
],
	_debug_agent: _debug_agent,
	_debugger: _debugger,
	dgram: dgram,
	"node:dgram": [
	">= 14.18 && < 15",
	">= 16"
],
	diagnostics_channel: diagnostics_channel,
	"node:diagnostics_channel": [
	">= 14.18 && < 15",
	">= 16"
],
	dns: dns,
	"node:dns": [
	">= 14.18 && < 15",
	">= 16"
],
	"dns/promises": ">= 15",
	"node:dns/promises": ">= 16",
	domain: domain,
	"node:domain": [
	">= 14.18 && < 15",
	">= 16"
],
	events: events,
	"node:events": [
	">= 14.18 && < 15",
	">= 16"
],
	freelist: freelist,
	fs: fs$4,
	"node:fs": [
	">= 14.18 && < 15",
	">= 16"
],
	"fs/promises": [
	">= 10 && < 10.1",
	">= 14"
],
	"node:fs/promises": [
	">= 14.18 && < 15",
	">= 16"
],
	_http_agent: _http_agent,
	"node:_http_agent": [
	">= 14.18 && < 15",
	">= 16"
],
	_http_client: _http_client,
	"node:_http_client": [
	">= 14.18 && < 15",
	">= 16"
],
	_http_common: _http_common,
	"node:_http_common": [
	">= 14.18 && < 15",
	">= 16"
],
	_http_incoming: _http_incoming,
	"node:_http_incoming": [
	">= 14.18 && < 15",
	">= 16"
],
	_http_outgoing: _http_outgoing,
	"node:_http_outgoing": [
	">= 14.18 && < 15",
	">= 16"
],
	_http_server: _http_server,
	"node:_http_server": [
	">= 14.18 && < 15",
	">= 16"
],
	http: http,
	"node:http": [
	">= 14.18 && < 15",
	">= 16"
],
	http2: http2,
	"node:http2": [
	">= 14.18 && < 15",
	">= 16"
],
	https: https,
	"node:https": [
	">= 14.18 && < 15",
	">= 16"
],
	inspector: inspector,
	"node:inspector": [
	">= 14.18 && < 15",
	">= 16"
],
	"inspector/promises": [
	">= 19"
],
	"node:inspector/promises": [
	">= 19"
],
	_linklist: _linklist,
	module: module$1,
	"node:module": [
	">= 14.18 && < 15",
	">= 16"
],
	net: net,
	"node:net": [
	">= 14.18 && < 15",
	">= 16"
],
	"node-inspect/lib/_inspect": ">= 7.6 && < 12",
	"node-inspect/lib/internal/inspect_client": ">= 7.6 && < 12",
	"node-inspect/lib/internal/inspect_repl": ">= 7.6 && < 12",
	os: os,
	"node:os": [
	">= 14.18 && < 15",
	">= 16"
],
	path: path$7,
	"node:path": [
	">= 14.18 && < 15",
	">= 16"
],
	"path/posix": ">= 15.3",
	"node:path/posix": ">= 16",
	"path/win32": ">= 15.3",
	"node:path/win32": ">= 16",
	perf_hooks: perf_hooks,
	"node:perf_hooks": [
	">= 14.18 && < 15",
	">= 16"
],
	process: process$1,
	"node:process": [
	">= 14.18 && < 15",
	">= 16"
],
	punycode: punycode,
	"node:punycode": [
	">= 14.18 && < 15",
	">= 16"
],
	querystring: querystring,
	"node:querystring": [
	">= 14.18 && < 15",
	">= 16"
],
	readline: readline,
	"node:readline": [
	">= 14.18 && < 15",
	">= 16"
],
	"readline/promises": ">= 17",
	"node:readline/promises": ">= 17",
	repl: repl,
	"node:repl": [
	">= 14.18 && < 15",
	">= 16"
],
	smalloc: smalloc,
	_stream_duplex: _stream_duplex,
	"node:_stream_duplex": [
	">= 14.18 && < 15",
	">= 16"
],
	_stream_transform: _stream_transform,
	"node:_stream_transform": [
	">= 14.18 && < 15",
	">= 16"
],
	_stream_wrap: _stream_wrap,
	"node:_stream_wrap": [
	">= 14.18 && < 15",
	">= 16"
],
	_stream_passthrough: _stream_passthrough,
	"node:_stream_passthrough": [
	">= 14.18 && < 15",
	">= 16"
],
	_stream_readable: _stream_readable,
	"node:_stream_readable": [
	">= 14.18 && < 15",
	">= 16"
],
	_stream_writable: _stream_writable,
	"node:_stream_writable": [
	">= 14.18 && < 15",
	">= 16"
],
	stream: stream,
	"node:stream": [
	">= 14.18 && < 15",
	">= 16"
],
	"stream/consumers": ">= 16.7",
	"node:stream/consumers": ">= 16.7",
	"stream/promises": ">= 15",
	"node:stream/promises": ">= 16",
	"stream/web": ">= 16.5",
	"node:stream/web": ">= 16.5",
	string_decoder: string_decoder,
	"node:string_decoder": [
	">= 14.18 && < 15",
	">= 16"
],
	sys: sys,
	"node:sys": [
	">= 14.18 && < 15",
	">= 16"
],
	"test/reporters": ">= 19.9 && < 20.2",
	"node:test/reporters": [
	">= 18.17 && < 19",
	">= 19.9",
	">= 20"
],
	"node:test": [
	">= 16.17 && < 17",
	">= 18"
],
	timers: timers,
	"node:timers": [
	">= 14.18 && < 15",
	">= 16"
],
	"timers/promises": ">= 15",
	"node:timers/promises": ">= 16",
	_tls_common: _tls_common,
	"node:_tls_common": [
	">= 14.18 && < 15",
	">= 16"
],
	_tls_legacy: _tls_legacy,
	_tls_wrap: _tls_wrap,
	"node:_tls_wrap": [
	">= 14.18 && < 15",
	">= 16"
],
	tls: tls,
	"node:tls": [
	">= 14.18 && < 15",
	">= 16"
],
	trace_events: trace_events,
	"node:trace_events": [
	">= 14.18 && < 15",
	">= 16"
],
	tty: tty,
	"node:tty": [
	">= 14.18 && < 15",
	">= 16"
],
	url: url,
	"node:url": [
	">= 14.18 && < 15",
	">= 16"
],
	util: util$1,
	"node:util": [
	">= 14.18 && < 15",
	">= 16"
],
	"util/types": ">= 15.3",
	"node:util/types": ">= 16",
	"v8/tools/arguments": ">= 10 && < 12",
	"v8/tools/codemap": [
	">= 4.4 && < 5",
	">= 5.2 && < 12"
],
	"v8/tools/consarray": [
	">= 4.4 && < 5",
	">= 5.2 && < 12"
],
	"v8/tools/csvparser": [
	">= 4.4 && < 5",
	">= 5.2 && < 12"
],
	"v8/tools/logreader": [
	">= 4.4 && < 5",
	">= 5.2 && < 12"
],
	"v8/tools/profile_view": [
	">= 4.4 && < 5",
	">= 5.2 && < 12"
],
	"v8/tools/splaytree": [
	">= 4.4 && < 5",
	">= 5.2 && < 12"
],
	v8: v8,
	"node:v8": [
	">= 14.18 && < 15",
	">= 16"
],
	vm: vm,
	"node:vm": [
	">= 14.18 && < 15",
	">= 16"
],
	wasi: wasi,
	"node:wasi": [
	">= 18.17 && < 19",
	">= 20"
],
	worker_threads: worker_threads,
	"node:worker_threads": [
	">= 14.18 && < 15",
	">= 16"
],
	zlib: zlib,
	"node:zlib": [
	">= 14.18 && < 15",
	">= 16"
]
};

var isCoreModule$1 = isCoreModule$2;
var data = require$$1;

var core = {};
for (var mod in data) { // eslint-disable-line no-restricted-syntax
    if (Object.prototype.hasOwnProperty.call(data, mod)) {
        core[mod] = isCoreModule$1(mod);
    }
}
var core_1 = core;

var isCoreModule = isCoreModule$2;

var isCore$1 = function isCore(x) {
    return isCoreModule(x);
};

var isCore = isCoreModule$2;
var fs$3 = fs$7;
var path$6 = require$$0$2;
var getHomedir = homedir$2;
var caller = caller$2;
var nodeModulesPaths = nodeModulesPaths$2;
var normalizeOptions = normalizeOptions$2;

var realpathFS = process.platform !== 'win32' && fs$3.realpathSync && typeof fs$3.realpathSync.native === 'function' ? fs$3.realpathSync.native : fs$3.realpathSync;

var homedir = getHomedir();
var defaultPaths = function () {
    return [
        path$6.join(homedir, '.node_modules'),
        path$6.join(homedir, '.node_libraries')
    ];
};

var defaultIsFile = function isFile(file) {
    try {
        var stat = fs$3.statSync(file, { throwIfNoEntry: false });
    } catch (e) {
        if (e && (e.code === 'ENOENT' || e.code === 'ENOTDIR')) return false;
        throw e;
    }
    return !!stat && (stat.isFile() || stat.isFIFO());
};

var defaultIsDir = function isDirectory(dir) {
    try {
        var stat = fs$3.statSync(dir, { throwIfNoEntry: false });
    } catch (e) {
        if (e && (e.code === 'ENOENT' || e.code === 'ENOTDIR')) return false;
        throw e;
    }
    return !!stat && stat.isDirectory();
};

var defaultRealpathSync = function realpathSync(x) {
    try {
        return realpathFS(x);
    } catch (realpathErr) {
        if (realpathErr.code !== 'ENOENT') {
            throw realpathErr;
        }
    }
    return x;
};

var maybeRealpathSync = function maybeRealpathSync(realpathSync, x, opts) {
    if (opts && opts.preserveSymlinks === false) {
        return realpathSync(x);
    }
    return x;
};

var defaultReadPackageSync = function defaultReadPackageSync(readFileSync, pkgfile) {
    var body = readFileSync(pkgfile);
    try {
        var pkg = JSON.parse(body);
        return pkg;
    } catch (jsonErr) {}
};

var getPackageCandidates = function getPackageCandidates(x, start, opts) {
    var dirs = nodeModulesPaths(start, opts, x);
    for (var i = 0; i < dirs.length; i++) {
        dirs[i] = path$6.join(dirs[i], x);
    }
    return dirs;
};

var sync$1 = function resolveSync(x, options) {
    if (typeof x !== 'string') {
        throw new TypeError('Path must be a string.');
    }
    var opts = normalizeOptions(x, options);

    var isFile = opts.isFile || defaultIsFile;
    var readFileSync = opts.readFileSync || fs$3.readFileSync;
    var isDirectory = opts.isDirectory || defaultIsDir;
    var realpathSync = opts.realpathSync || defaultRealpathSync;
    var readPackageSync = opts.readPackageSync || defaultReadPackageSync;
    if (opts.readFileSync && opts.readPackageSync) {
        throw new TypeError('`readFileSync` and `readPackageSync` are mutually exclusive.');
    }
    var packageIterator = opts.packageIterator;

    var extensions = opts.extensions || ['.js'];
    var includeCoreModules = opts.includeCoreModules !== false;
    var basedir = opts.basedir || path$6.dirname(caller());
    var parent = opts.filename || basedir;

    opts.paths = opts.paths || defaultPaths();

    // ensure that `basedir` is an absolute path at this point, resolving against the process' current working directory
    var absoluteStart = maybeRealpathSync(realpathSync, path$6.resolve(basedir), opts);

    if ((/^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[/\\])/).test(x)) {
        var res = path$6.resolve(absoluteStart, x);
        if (x === '.' || x === '..' || x.slice(-1) === '/') res += '/';
        var m = loadAsFileSync(res) || loadAsDirectorySync(res);
        if (m) return maybeRealpathSync(realpathSync, m, opts);
    } else if (includeCoreModules && isCore(x)) {
        return x;
    } else {
        var n = loadNodeModulesSync(x, absoluteStart);
        if (n) return maybeRealpathSync(realpathSync, n, opts);
    }

    var err = new Error("Cannot find module '" + x + "' from '" + parent + "'");
    err.code = 'MODULE_NOT_FOUND';
    throw err;

    function loadAsFileSync(x) {
        var pkg = loadpkg(path$6.dirname(x));

        if (pkg && pkg.dir && pkg.pkg && opts.pathFilter) {
            var rfile = path$6.relative(pkg.dir, x);
            var r = opts.pathFilter(pkg.pkg, x, rfile);
            if (r) {
                x = path$6.resolve(pkg.dir, r); // eslint-disable-line no-param-reassign
            }
        }

        if (isFile(x)) {
            return x;
        }

        for (var i = 0; i < extensions.length; i++) {
            var file = x + extensions[i];
            if (isFile(file)) {
                return file;
            }
        }
    }

    function loadpkg(dir) {
        if (dir === '' || dir === '/') return;
        if (process.platform === 'win32' && (/^\w:[/\\]*$/).test(dir)) {
            return;
        }
        if ((/[/\\]node_modules[/\\]*$/).test(dir)) return;

        var pkgfile = path$6.join(maybeRealpathSync(realpathSync, dir, opts), 'package.json');

        if (!isFile(pkgfile)) {
            return loadpkg(path$6.dirname(dir));
        }

        var pkg = readPackageSync(readFileSync, pkgfile);

        if (pkg && opts.packageFilter) {
            // v2 will pass pkgfile
            pkg = opts.packageFilter(pkg, /*pkgfile,*/ dir); // eslint-disable-line spaced-comment
        }

        return { pkg: pkg, dir: dir };
    }

    function loadAsDirectorySync(x) {
        var pkgfile = path$6.join(maybeRealpathSync(realpathSync, x, opts), '/package.json');
        if (isFile(pkgfile)) {
            try {
                var pkg = readPackageSync(readFileSync, pkgfile);
            } catch (e) {}

            if (pkg && opts.packageFilter) {
                // v2 will pass pkgfile
                pkg = opts.packageFilter(pkg, /*pkgfile,*/ x); // eslint-disable-line spaced-comment
            }

            if (pkg && pkg.main) {
                if (typeof pkg.main !== 'string') {
                    var mainError = new TypeError('package “' + pkg.name + '” `main` must be a string');
                    mainError.code = 'INVALID_PACKAGE_MAIN';
                    throw mainError;
                }
                if (pkg.main === '.' || pkg.main === './') {
                    pkg.main = 'index';
                }
                try {
                    var m = loadAsFileSync(path$6.resolve(x, pkg.main));
                    if (m) return m;
                    var n = loadAsDirectorySync(path$6.resolve(x, pkg.main));
                    if (n) return n;
                } catch (e) {}
            }
        }

        return loadAsFileSync(path$6.join(x, '/index'));
    }

    function loadNodeModulesSync(x, start) {
        var thunk = function () { return getPackageCandidates(x, start, opts); };
        var dirs = packageIterator ? packageIterator(x, start, thunk, opts) : thunk();

        for (var i = 0; i < dirs.length; i++) {
            var dir = dirs[i];
            if (isDirectory(path$6.dirname(dir))) {
                var m = loadAsFileSync(dir);
                if (m) return m;
                var n = loadAsDirectorySync(dir);
                if (n) return n;
            }
        }
    }
};

var async = async$1;
async.core = core_1;
async.isCore = isCore$1;
async.sync = sync$1;

var resolve = async;

var resolve$1 = /*@__PURE__*/getDefaultExportFromCjs(resolve);

// @ts-check
/** @typedef { import('estree').BaseNode} BaseNode */

/** @typedef {{
	skip: () => void;
	remove: () => void;
	replace: (node: BaseNode) => void;
}} WalkerContext */

class WalkerBase {
	constructor() {
		/** @type {boolean} */
		this.should_skip = false;

		/** @type {boolean} */
		this.should_remove = false;

		/** @type {BaseNode | null} */
		this.replacement = null;

		/** @type {WalkerContext} */
		this.context = {
			skip: () => (this.should_skip = true),
			remove: () => (this.should_remove = true),
			replace: (node) => (this.replacement = node)
		};
	}

	/**
	 *
	 * @param {any} parent
	 * @param {string} prop
	 * @param {number} index
	 * @param {BaseNode} node
	 */
	replace(parent, prop, index, node) {
		if (parent) {
			if (index !== null) {
				parent[prop][index] = node;
			} else {
				parent[prop] = node;
			}
		}
	}

	/**
	 *
	 * @param {any} parent
	 * @param {string} prop
	 * @param {number} index
	 */
	remove(parent, prop, index) {
		if (parent) {
			if (index !== null) {
				parent[prop].splice(index, 1);
			} else {
				delete parent[prop];
			}
		}
	}
}

// @ts-check

/** @typedef { import('estree').BaseNode} BaseNode */
/** @typedef { import('./walker.js').WalkerContext} WalkerContext */

/** @typedef {(
 *    this: WalkerContext,
 *    node: BaseNode,
 *    parent: BaseNode,
 *    key: string,
 *    index: number
 * ) => void} SyncHandler */

class SyncWalker extends WalkerBase {
	/**
	 *
	 * @param {SyncHandler} enter
	 * @param {SyncHandler} leave
	 */
	constructor(enter, leave) {
		super();

		/** @type {SyncHandler} */
		this.enter = enter;

		/** @type {SyncHandler} */
		this.leave = leave;
	}

	/**
	 *
	 * @param {BaseNode} node
	 * @param {BaseNode} parent
	 * @param {string} [prop]
	 * @param {number} [index]
	 * @returns {BaseNode}
	 */
	visit(node, parent, prop, index) {
		if (node) {
			if (this.enter) {
				const _should_skip = this.should_skip;
				const _should_remove = this.should_remove;
				const _replacement = this.replacement;
				this.should_skip = false;
				this.should_remove = false;
				this.replacement = null;

				this.enter.call(this.context, node, parent, prop, index);

				if (this.replacement) {
					node = this.replacement;
					this.replace(parent, prop, index, node);
				}

				if (this.should_remove) {
					this.remove(parent, prop, index);
				}

				const skipped = this.should_skip;
				const removed = this.should_remove;

				this.should_skip = _should_skip;
				this.should_remove = _should_remove;
				this.replacement = _replacement;

				if (skipped) return node;
				if (removed) return null;
			}

			for (const key in node) {
				const value = node[key];

				if (typeof value !== "object") {
					continue;
				} else if (Array.isArray(value)) {
					for (let i = 0; i < value.length; i += 1) {
						if (value[i] !== null && typeof value[i].type === 'string') {
							if (!this.visit(value[i], node, key, i)) {
								// removed
								i--;
							}
						}
					}
				} else if (value !== null && typeof value.type === "string") {
					this.visit(value, node, key, null);
				}
			}

			if (this.leave) {
				const _replacement = this.replacement;
				const _should_remove = this.should_remove;
				this.replacement = null;
				this.should_remove = false;

				this.leave.call(this.context, node, parent, prop, index);

				if (this.replacement) {
					node = this.replacement;
					this.replace(parent, prop, index, node);
				}

				if (this.should_remove) {
					this.remove(parent, prop, index);
				}

				const removed = this.should_remove;

				this.replacement = _replacement;
				this.should_remove = _should_remove;

				if (removed) return null;
			}
		}

		return node;
	}
}

// @ts-check

/** @typedef { import('estree').BaseNode} BaseNode */
/** @typedef { import('./sync.js').SyncHandler} SyncHandler */
/** @typedef { import('./async.js').AsyncHandler} AsyncHandler */

/**
 *
 * @param {BaseNode} ast
 * @param {{
 *   enter?: SyncHandler
 *   leave?: SyncHandler
 * }} walker
 * @returns {BaseNode}
 */
function walk(ast, { enter, leave }) {
	const instance = new SyncWalker(enter, leave);
	return instance.visit(ast, null);
}

var utils$3 = {};

const path$5 = require$$0$2;
const WIN_SLASH = '\\\\/';
const WIN_NO_SLASH = `[^${WIN_SLASH}]`;

/**
 * Posix glob regex
 */

const DOT_LITERAL = '\\.';
const PLUS_LITERAL = '\\+';
const QMARK_LITERAL = '\\?';
const SLASH_LITERAL = '\\/';
const ONE_CHAR = '(?=.)';
const QMARK = '[^/]';
const END_ANCHOR = `(?:${SLASH_LITERAL}|$)`;
const START_ANCHOR = `(?:^|${SLASH_LITERAL})`;
const DOTS_SLASH = `${DOT_LITERAL}{1,2}${END_ANCHOR}`;
const NO_DOT = `(?!${DOT_LITERAL})`;
const NO_DOTS = `(?!${START_ANCHOR}${DOTS_SLASH})`;
const NO_DOT_SLASH = `(?!${DOT_LITERAL}{0,1}${END_ANCHOR})`;
const NO_DOTS_SLASH = `(?!${DOTS_SLASH})`;
const QMARK_NO_DOT = `[^.${SLASH_LITERAL}]`;
const STAR = `${QMARK}*?`;

const POSIX_CHARS = {
  DOT_LITERAL,
  PLUS_LITERAL,
  QMARK_LITERAL,
  SLASH_LITERAL,
  ONE_CHAR,
  QMARK,
  END_ANCHOR,
  DOTS_SLASH,
  NO_DOT,
  NO_DOTS,
  NO_DOT_SLASH,
  NO_DOTS_SLASH,
  QMARK_NO_DOT,
  STAR,
  START_ANCHOR
};

/**
 * Windows glob regex
 */

const WINDOWS_CHARS = {
  ...POSIX_CHARS,

  SLASH_LITERAL: `[${WIN_SLASH}]`,
  QMARK: WIN_NO_SLASH,
  STAR: `${WIN_NO_SLASH}*?`,
  DOTS_SLASH: `${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$)`,
  NO_DOT: `(?!${DOT_LITERAL})`,
  NO_DOTS: `(?!(?:^|[${WIN_SLASH}])${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
  NO_DOT_SLASH: `(?!${DOT_LITERAL}{0,1}(?:[${WIN_SLASH}]|$))`,
  NO_DOTS_SLASH: `(?!${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
  QMARK_NO_DOT: `[^.${WIN_SLASH}]`,
  START_ANCHOR: `(?:^|[${WIN_SLASH}])`,
  END_ANCHOR: `(?:[${WIN_SLASH}]|$)`
};

/**
 * POSIX Bracket Regex
 */

const POSIX_REGEX_SOURCE$1 = {
  alnum: 'a-zA-Z0-9',
  alpha: 'a-zA-Z',
  ascii: '\\x00-\\x7F',
  blank: ' \\t',
  cntrl: '\\x00-\\x1F\\x7F',
  digit: '0-9',
  graph: '\\x21-\\x7E',
  lower: 'a-z',
  print: '\\x20-\\x7E ',
  punct: '\\-!"#$%&\'()\\*+,./:;<=>?@[\\]^_`{|}~',
  space: ' \\t\\r\\n\\v\\f',
  upper: 'A-Z',
  word: 'A-Za-z0-9_',
  xdigit: 'A-Fa-f0-9'
};

var constants$2 = {
  MAX_LENGTH: 1024 * 64,
  POSIX_REGEX_SOURCE: POSIX_REGEX_SOURCE$1,

  // regular expressions
  REGEX_BACKSLASH: /\\(?![*+?^${}(|)[\]])/g,
  REGEX_NON_SPECIAL_CHARS: /^[^@![\].,$*+?^{}()|\\/]+/,
  REGEX_SPECIAL_CHARS: /[-*+?.^${}(|)[\]]/,
  REGEX_SPECIAL_CHARS_BACKREF: /(\\?)((\W)(\3*))/g,
  REGEX_SPECIAL_CHARS_GLOBAL: /([-*+?.^${}(|)[\]])/g,
  REGEX_REMOVE_BACKSLASH: /(?:\[.*?[^\\]\]|\\(?=.))/g,

  // Replace globs with equivalent patterns to reduce parsing time.
  REPLACEMENTS: {
    '***': '*',
    '**/**': '**',
    '**/**/**': '**'
  },

  // Digits
  CHAR_0: 48, /* 0 */
  CHAR_9: 57, /* 9 */

  // Alphabet chars.
  CHAR_UPPERCASE_A: 65, /* A */
  CHAR_LOWERCASE_A: 97, /* a */
  CHAR_UPPERCASE_Z: 90, /* Z */
  CHAR_LOWERCASE_Z: 122, /* z */

  CHAR_LEFT_PARENTHESES: 40, /* ( */
  CHAR_RIGHT_PARENTHESES: 41, /* ) */

  CHAR_ASTERISK: 42, /* * */

  // Non-alphabetic chars.
  CHAR_AMPERSAND: 38, /* & */
  CHAR_AT: 64, /* @ */
  CHAR_BACKWARD_SLASH: 92, /* \ */
  CHAR_CARRIAGE_RETURN: 13, /* \r */
  CHAR_CIRCUMFLEX_ACCENT: 94, /* ^ */
  CHAR_COLON: 58, /* : */
  CHAR_COMMA: 44, /* , */
  CHAR_DOT: 46, /* . */
  CHAR_DOUBLE_QUOTE: 34, /* " */
  CHAR_EQUAL: 61, /* = */
  CHAR_EXCLAMATION_MARK: 33, /* ! */
  CHAR_FORM_FEED: 12, /* \f */
  CHAR_FORWARD_SLASH: 47, /* / */
  CHAR_GRAVE_ACCENT: 96, /* ` */
  CHAR_HASH: 35, /* # */
  CHAR_HYPHEN_MINUS: 45, /* - */
  CHAR_LEFT_ANGLE_BRACKET: 60, /* < */
  CHAR_LEFT_CURLY_BRACE: 123, /* { */
  CHAR_LEFT_SQUARE_BRACKET: 91, /* [ */
  CHAR_LINE_FEED: 10, /* \n */
  CHAR_NO_BREAK_SPACE: 160, /* \u00A0 */
  CHAR_PERCENT: 37, /* % */
  CHAR_PLUS: 43, /* + */
  CHAR_QUESTION_MARK: 63, /* ? */
  CHAR_RIGHT_ANGLE_BRACKET: 62, /* > */
  CHAR_RIGHT_CURLY_BRACE: 125, /* } */
  CHAR_RIGHT_SQUARE_BRACKET: 93, /* ] */
  CHAR_SEMICOLON: 59, /* ; */
  CHAR_SINGLE_QUOTE: 39, /* ' */
  CHAR_SPACE: 32, /*   */
  CHAR_TAB: 9, /* \t */
  CHAR_UNDERSCORE: 95, /* _ */
  CHAR_VERTICAL_LINE: 124, /* | */
  CHAR_ZERO_WIDTH_NOBREAK_SPACE: 65279, /* \uFEFF */

  SEP: path$5.sep,

  /**
   * Create EXTGLOB_CHARS
   */

  extglobChars(chars) {
    return {
      '!': { type: 'negate', open: '(?:(?!(?:', close: `))${chars.STAR})` },
      '?': { type: 'qmark', open: '(?:', close: ')?' },
      '+': { type: 'plus', open: '(?:', close: ')+' },
      '*': { type: 'star', open: '(?:', close: ')*' },
      '@': { type: 'at', open: '(?:', close: ')' }
    };
  },

  /**
   * Create GLOB_CHARS
   */

  globChars(win32) {
    return win32 === true ? WINDOWS_CHARS : POSIX_CHARS;
  }
};

(function (exports) {

	const path = require$$0$2;
	const win32 = process.platform === 'win32';
	const {
	  REGEX_BACKSLASH,
	  REGEX_REMOVE_BACKSLASH,
	  REGEX_SPECIAL_CHARS,
	  REGEX_SPECIAL_CHARS_GLOBAL
	} = constants$2;

	exports.isObject = val => val !== null && typeof val === 'object' && !Array.isArray(val);
	exports.hasRegexChars = str => REGEX_SPECIAL_CHARS.test(str);
	exports.isRegexChar = str => str.length === 1 && exports.hasRegexChars(str);
	exports.escapeRegex = str => str.replace(REGEX_SPECIAL_CHARS_GLOBAL, '\\$1');
	exports.toPosixSlashes = str => str.replace(REGEX_BACKSLASH, '/');

	exports.removeBackslashes = str => {
	  return str.replace(REGEX_REMOVE_BACKSLASH, match => {
	    return match === '\\' ? '' : match;
	  });
	};

	exports.supportsLookbehinds = () => {
	  const segs = process.version.slice(1).split('.').map(Number);
	  if (segs.length === 3 && segs[0] >= 9 || (segs[0] === 8 && segs[1] >= 10)) {
	    return true;
	  }
	  return false;
	};

	exports.isWindows = options => {
	  if (options && typeof options.windows === 'boolean') {
	    return options.windows;
	  }
	  return win32 === true || path.sep === '\\';
	};

	exports.escapeLast = (input, char, lastIdx) => {
	  const idx = input.lastIndexOf(char, lastIdx);
	  if (idx === -1) return input;
	  if (input[idx - 1] === '\\') return exports.escapeLast(input, char, idx - 1);
	  return `${input.slice(0, idx)}\\${input.slice(idx)}`;
	};

	exports.removePrefix = (input, state = {}) => {
	  let output = input;
	  if (output.startsWith('./')) {
	    output = output.slice(2);
	    state.prefix = './';
	  }
	  return output;
	};

	exports.wrapOutput = (input, state = {}, options = {}) => {
	  const prepend = options.contains ? '' : '^';
	  const append = options.contains ? '' : '$';

	  let output = `${prepend}(?:${input})${append}`;
	  if (state.negated === true) {
	    output = `(?:^(?!${output}).*$)`;
	  }
	  return output;
	}; 
} (utils$3));

const utils$2 = utils$3;
const {
  CHAR_ASTERISK,             /* * */
  CHAR_AT,                   /* @ */
  CHAR_BACKWARD_SLASH,       /* \ */
  CHAR_COMMA,                /* , */
  CHAR_DOT,                  /* . */
  CHAR_EXCLAMATION_MARK,     /* ! */
  CHAR_FORWARD_SLASH,        /* / */
  CHAR_LEFT_CURLY_BRACE,     /* { */
  CHAR_LEFT_PARENTHESES,     /* ( */
  CHAR_LEFT_SQUARE_BRACKET,  /* [ */
  CHAR_PLUS,                 /* + */
  CHAR_QUESTION_MARK,        /* ? */
  CHAR_RIGHT_CURLY_BRACE,    /* } */
  CHAR_RIGHT_PARENTHESES,    /* ) */
  CHAR_RIGHT_SQUARE_BRACKET  /* ] */
} = constants$2;

const isPathSeparator = code => {
  return code === CHAR_FORWARD_SLASH || code === CHAR_BACKWARD_SLASH;
};

const depth = token => {
  if (token.isPrefix !== true) {
    token.depth = token.isGlobstar ? Infinity : 1;
  }
};

/**
 * Quickly scans a glob pattern and returns an object with a handful of
 * useful properties, like `isGlob`, `path` (the leading non-glob, if it exists),
 * `glob` (the actual pattern), `negated` (true if the path starts with `!` but not
 * with `!(`) and `negatedExtglob` (true if the path starts with `!(`).
 *
 * ```js
 * const pm = require('picomatch');
 * console.log(pm.scan('foo/bar/*.js'));
 * { isGlob: true, input: 'foo/bar/*.js', base: 'foo/bar', glob: '*.js' }
 * ```
 * @param {String} `str`
 * @param {Object} `options`
 * @return {Object} Returns an object with tokens and regex source string.
 * @api public
 */

const scan$1 = (input, options) => {
  const opts = options || {};

  const length = input.length - 1;
  const scanToEnd = opts.parts === true || opts.scanToEnd === true;
  const slashes = [];
  const tokens = [];
  const parts = [];

  let str = input;
  let index = -1;
  let start = 0;
  let lastIndex = 0;
  let isBrace = false;
  let isBracket = false;
  let isGlob = false;
  let isExtglob = false;
  let isGlobstar = false;
  let braceEscaped = false;
  let backslashes = false;
  let negated = false;
  let negatedExtglob = false;
  let finished = false;
  let braces = 0;
  let prev;
  let code;
  let token = { value: '', depth: 0, isGlob: false };

  const eos = () => index >= length;
  const peek = () => str.charCodeAt(index + 1);
  const advance = () => {
    prev = code;
    return str.charCodeAt(++index);
  };

  while (index < length) {
    code = advance();
    let next;

    if (code === CHAR_BACKWARD_SLASH) {
      backslashes = token.backslashes = true;
      code = advance();

      if (code === CHAR_LEFT_CURLY_BRACE) {
        braceEscaped = true;
      }
      continue;
    }

    if (braceEscaped === true || code === CHAR_LEFT_CURLY_BRACE) {
      braces++;

      while (eos() !== true && (code = advance())) {
        if (code === CHAR_BACKWARD_SLASH) {
          backslashes = token.backslashes = true;
          advance();
          continue;
        }

        if (code === CHAR_LEFT_CURLY_BRACE) {
          braces++;
          continue;
        }

        if (braceEscaped !== true && code === CHAR_DOT && (code = advance()) === CHAR_DOT) {
          isBrace = token.isBrace = true;
          isGlob = token.isGlob = true;
          finished = true;

          if (scanToEnd === true) {
            continue;
          }

          break;
        }

        if (braceEscaped !== true && code === CHAR_COMMA) {
          isBrace = token.isBrace = true;
          isGlob = token.isGlob = true;
          finished = true;

          if (scanToEnd === true) {
            continue;
          }

          break;
        }

        if (code === CHAR_RIGHT_CURLY_BRACE) {
          braces--;

          if (braces === 0) {
            braceEscaped = false;
            isBrace = token.isBrace = true;
            finished = true;
            break;
          }
        }
      }

      if (scanToEnd === true) {
        continue;
      }

      break;
    }

    if (code === CHAR_FORWARD_SLASH) {
      slashes.push(index);
      tokens.push(token);
      token = { value: '', depth: 0, isGlob: false };

      if (finished === true) continue;
      if (prev === CHAR_DOT && index === (start + 1)) {
        start += 2;
        continue;
      }

      lastIndex = index + 1;
      continue;
    }

    if (opts.noext !== true) {
      const isExtglobChar = code === CHAR_PLUS
        || code === CHAR_AT
        || code === CHAR_ASTERISK
        || code === CHAR_QUESTION_MARK
        || code === CHAR_EXCLAMATION_MARK;

      if (isExtglobChar === true && peek() === CHAR_LEFT_PARENTHESES) {
        isGlob = token.isGlob = true;
        isExtglob = token.isExtglob = true;
        finished = true;
        if (code === CHAR_EXCLAMATION_MARK && index === start) {
          negatedExtglob = true;
        }

        if (scanToEnd === true) {
          while (eos() !== true && (code = advance())) {
            if (code === CHAR_BACKWARD_SLASH) {
              backslashes = token.backslashes = true;
              code = advance();
              continue;
            }

            if (code === CHAR_RIGHT_PARENTHESES) {
              isGlob = token.isGlob = true;
              finished = true;
              break;
            }
          }
          continue;
        }
        break;
      }
    }

    if (code === CHAR_ASTERISK) {
      if (prev === CHAR_ASTERISK) isGlobstar = token.isGlobstar = true;
      isGlob = token.isGlob = true;
      finished = true;

      if (scanToEnd === true) {
        continue;
      }
      break;
    }

    if (code === CHAR_QUESTION_MARK) {
      isGlob = token.isGlob = true;
      finished = true;

      if (scanToEnd === true) {
        continue;
      }
      break;
    }

    if (code === CHAR_LEFT_SQUARE_BRACKET) {
      while (eos() !== true && (next = advance())) {
        if (next === CHAR_BACKWARD_SLASH) {
          backslashes = token.backslashes = true;
          advance();
          continue;
        }

        if (next === CHAR_RIGHT_SQUARE_BRACKET) {
          isBracket = token.isBracket = true;
          isGlob = token.isGlob = true;
          finished = true;
          break;
        }
      }

      if (scanToEnd === true) {
        continue;
      }

      break;
    }

    if (opts.nonegate !== true && code === CHAR_EXCLAMATION_MARK && index === start) {
      negated = token.negated = true;
      start++;
      continue;
    }

    if (opts.noparen !== true && code === CHAR_LEFT_PARENTHESES) {
      isGlob = token.isGlob = true;

      if (scanToEnd === true) {
        while (eos() !== true && (code = advance())) {
          if (code === CHAR_LEFT_PARENTHESES) {
            backslashes = token.backslashes = true;
            code = advance();
            continue;
          }

          if (code === CHAR_RIGHT_PARENTHESES) {
            finished = true;
            break;
          }
        }
        continue;
      }
      break;
    }

    if (isGlob === true) {
      finished = true;

      if (scanToEnd === true) {
        continue;
      }

      break;
    }
  }

  if (opts.noext === true) {
    isExtglob = false;
    isGlob = false;
  }

  let base = str;
  let prefix = '';
  let glob = '';

  if (start > 0) {
    prefix = str.slice(0, start);
    str = str.slice(start);
    lastIndex -= start;
  }

  if (base && isGlob === true && lastIndex > 0) {
    base = str.slice(0, lastIndex);
    glob = str.slice(lastIndex);
  } else if (isGlob === true) {
    base = '';
    glob = str;
  } else {
    base = str;
  }

  if (base && base !== '' && base !== '/' && base !== str) {
    if (isPathSeparator(base.charCodeAt(base.length - 1))) {
      base = base.slice(0, -1);
    }
  }

  if (opts.unescape === true) {
    if (glob) glob = utils$2.removeBackslashes(glob);

    if (base && backslashes === true) {
      base = utils$2.removeBackslashes(base);
    }
  }

  const state = {
    prefix,
    input,
    start,
    base,
    glob,
    isBrace,
    isBracket,
    isGlob,
    isExtglob,
    isGlobstar,
    negated,
    negatedExtglob
  };

  if (opts.tokens === true) {
    state.maxDepth = 0;
    if (!isPathSeparator(code)) {
      tokens.push(token);
    }
    state.tokens = tokens;
  }

  if (opts.parts === true || opts.tokens === true) {
    let prevIndex;

    for (let idx = 0; idx < slashes.length; idx++) {
      const n = prevIndex ? prevIndex + 1 : start;
      const i = slashes[idx];
      const value = input.slice(n, i);
      if (opts.tokens) {
        if (idx === 0 && start !== 0) {
          tokens[idx].isPrefix = true;
          tokens[idx].value = prefix;
        } else {
          tokens[idx].value = value;
        }
        depth(tokens[idx]);
        state.maxDepth += tokens[idx].depth;
      }
      if (idx !== 0 || value !== '') {
        parts.push(value);
      }
      prevIndex = i;
    }

    if (prevIndex && prevIndex + 1 < input.length) {
      const value = input.slice(prevIndex + 1);
      parts.push(value);

      if (opts.tokens) {
        tokens[tokens.length - 1].value = value;
        depth(tokens[tokens.length - 1]);
        state.maxDepth += tokens[tokens.length - 1].depth;
      }
    }

    state.slashes = slashes;
    state.parts = parts;
  }

  return state;
};

var scan_1 = scan$1;

const constants$1 = constants$2;
const utils$1 = utils$3;

/**
 * Constants
 */

const {
  MAX_LENGTH,
  POSIX_REGEX_SOURCE,
  REGEX_NON_SPECIAL_CHARS,
  REGEX_SPECIAL_CHARS_BACKREF,
  REPLACEMENTS
} = constants$1;

/**
 * Helpers
 */

const expandRange = (args, options) => {
  if (typeof options.expandRange === 'function') {
    return options.expandRange(...args, options);
  }

  args.sort();
  const value = `[${args.join('-')}]`;

  try {
    /* eslint-disable-next-line no-new */
    new RegExp(value);
  } catch (ex) {
    return args.map(v => utils$1.escapeRegex(v)).join('..');
  }

  return value;
};

/**
 * Create the message for a syntax error
 */

const syntaxError = (type, char) => {
  return `Missing ${type}: "${char}" - use "\\\\${char}" to match literal characters`;
};

/**
 * Parse the given input string.
 * @param {String} input
 * @param {Object} options
 * @return {Object}
 */

const parse$1 = (input, options) => {
  if (typeof input !== 'string') {
    throw new TypeError('Expected a string');
  }

  input = REPLACEMENTS[input] || input;

  const opts = { ...options };
  const max = typeof opts.maxLength === 'number' ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;

  let len = input.length;
  if (len > max) {
    throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
  }

  const bos = { type: 'bos', value: '', output: opts.prepend || '' };
  const tokens = [bos];

  const capture = opts.capture ? '' : '?:';
  const win32 = utils$1.isWindows(options);

  // create constants based on platform, for windows or posix
  const PLATFORM_CHARS = constants$1.globChars(win32);
  const EXTGLOB_CHARS = constants$1.extglobChars(PLATFORM_CHARS);

  const {
    DOT_LITERAL,
    PLUS_LITERAL,
    SLASH_LITERAL,
    ONE_CHAR,
    DOTS_SLASH,
    NO_DOT,
    NO_DOT_SLASH,
    NO_DOTS_SLASH,
    QMARK,
    QMARK_NO_DOT,
    STAR,
    START_ANCHOR
  } = PLATFORM_CHARS;

  const globstar = opts => {
    return `(${capture}(?:(?!${START_ANCHOR}${opts.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
  };

  const nodot = opts.dot ? '' : NO_DOT;
  const qmarkNoDot = opts.dot ? QMARK : QMARK_NO_DOT;
  let star = opts.bash === true ? globstar(opts) : STAR;

  if (opts.capture) {
    star = `(${star})`;
  }

  // minimatch options support
  if (typeof opts.noext === 'boolean') {
    opts.noextglob = opts.noext;
  }

  const state = {
    input,
    index: -1,
    start: 0,
    dot: opts.dot === true,
    consumed: '',
    output: '',
    prefix: '',
    backtrack: false,
    negated: false,
    brackets: 0,
    braces: 0,
    parens: 0,
    quotes: 0,
    globstar: false,
    tokens
  };

  input = utils$1.removePrefix(input, state);
  len = input.length;

  const extglobs = [];
  const braces = [];
  const stack = [];
  let prev = bos;
  let value;

  /**
   * Tokenizing helpers
   */

  const eos = () => state.index === len - 1;
  const peek = state.peek = (n = 1) => input[state.index + n];
  const advance = state.advance = () => input[++state.index] || '';
  const remaining = () => input.slice(state.index + 1);
  const consume = (value = '', num = 0) => {
    state.consumed += value;
    state.index += num;
  };

  const append = token => {
    state.output += token.output != null ? token.output : token.value;
    consume(token.value);
  };

  const negate = () => {
    let count = 1;

    while (peek() === '!' && (peek(2) !== '(' || peek(3) === '?')) {
      advance();
      state.start++;
      count++;
    }

    if (count % 2 === 0) {
      return false;
    }

    state.negated = true;
    state.start++;
    return true;
  };

  const increment = type => {
    state[type]++;
    stack.push(type);
  };

  const decrement = type => {
    state[type]--;
    stack.pop();
  };

  /**
   * Push tokens onto the tokens array. This helper speeds up
   * tokenizing by 1) helping us avoid backtracking as much as possible,
   * and 2) helping us avoid creating extra tokens when consecutive
   * characters are plain text. This improves performance and simplifies
   * lookbehinds.
   */

  const push = tok => {
    if (prev.type === 'globstar') {
      const isBrace = state.braces > 0 && (tok.type === 'comma' || tok.type === 'brace');
      const isExtglob = tok.extglob === true || (extglobs.length && (tok.type === 'pipe' || tok.type === 'paren'));

      if (tok.type !== 'slash' && tok.type !== 'paren' && !isBrace && !isExtglob) {
        state.output = state.output.slice(0, -prev.output.length);
        prev.type = 'star';
        prev.value = '*';
        prev.output = star;
        state.output += prev.output;
      }
    }

    if (extglobs.length && tok.type !== 'paren') {
      extglobs[extglobs.length - 1].inner += tok.value;
    }

    if (tok.value || tok.output) append(tok);
    if (prev && prev.type === 'text' && tok.type === 'text') {
      prev.value += tok.value;
      prev.output = (prev.output || '') + tok.value;
      return;
    }

    tok.prev = prev;
    tokens.push(tok);
    prev = tok;
  };

  const extglobOpen = (type, value) => {
    const token = { ...EXTGLOB_CHARS[value], conditions: 1, inner: '' };

    token.prev = prev;
    token.parens = state.parens;
    token.output = state.output;
    const output = (opts.capture ? '(' : '') + token.open;

    increment('parens');
    push({ type, value, output: state.output ? '' : ONE_CHAR });
    push({ type: 'paren', extglob: true, value: advance(), output });
    extglobs.push(token);
  };

  const extglobClose = token => {
    let output = token.close + (opts.capture ? ')' : '');
    let rest;

    if (token.type === 'negate') {
      let extglobStar = star;

      if (token.inner && token.inner.length > 1 && token.inner.includes('/')) {
        extglobStar = globstar(opts);
      }

      if (extglobStar !== star || eos() || /^\)+$/.test(remaining())) {
        output = token.close = `)$))${extglobStar}`;
      }

      if (token.inner.includes('*') && (rest = remaining()) && /^\.[^\\/.]+$/.test(rest)) {
        // Any non-magical string (`.ts`) or even nested expression (`.{ts,tsx}`) can follow after the closing parenthesis.
        // In this case, we need to parse the string and use it in the output of the original pattern.
        // Suitable patterns: `/!(*.d).ts`, `/!(*.d).{ts,tsx}`, `**/!(*-dbg).@(js)`.
        //
        // Disabling the `fastpaths` option due to a problem with parsing strings as `.ts` in the pattern like `**/!(*.d).ts`.
        const expression = parse$1(rest, { ...options, fastpaths: false }).output;

        output = token.close = `)${expression})${extglobStar})`;
      }

      if (token.prev.type === 'bos') {
        state.negatedExtglob = true;
      }
    }

    push({ type: 'paren', extglob: true, value, output });
    decrement('parens');
  };

  /**
   * Fast paths
   */

  if (opts.fastpaths !== false && !/(^[*!]|[/()[\]{}"])/.test(input)) {
    let backslashes = false;

    let output = input.replace(REGEX_SPECIAL_CHARS_BACKREF, (m, esc, chars, first, rest, index) => {
      if (first === '\\') {
        backslashes = true;
        return m;
      }

      if (first === '?') {
        if (esc) {
          return esc + first + (rest ? QMARK.repeat(rest.length) : '');
        }
        if (index === 0) {
          return qmarkNoDot + (rest ? QMARK.repeat(rest.length) : '');
        }
        return QMARK.repeat(chars.length);
      }

      if (first === '.') {
        return DOT_LITERAL.repeat(chars.length);
      }

      if (first === '*') {
        if (esc) {
          return esc + first + (rest ? star : '');
        }
        return star;
      }
      return esc ? m : `\\${m}`;
    });

    if (backslashes === true) {
      if (opts.unescape === true) {
        output = output.replace(/\\/g, '');
      } else {
        output = output.replace(/\\+/g, m => {
          return m.length % 2 === 0 ? '\\\\' : (m ? '\\' : '');
        });
      }
    }

    if (output === input && opts.contains === true) {
      state.output = input;
      return state;
    }

    state.output = utils$1.wrapOutput(output, state, options);
    return state;
  }

  /**
   * Tokenize input until we reach end-of-string
   */

  while (!eos()) {
    value = advance();

    if (value === '\u0000') {
      continue;
    }

    /**
     * Escaped characters
     */

    if (value === '\\') {
      const next = peek();

      if (next === '/' && opts.bash !== true) {
        continue;
      }

      if (next === '.' || next === ';') {
        continue;
      }

      if (!next) {
        value += '\\';
        push({ type: 'text', value });
        continue;
      }

      // collapse slashes to reduce potential for exploits
      const match = /^\\+/.exec(remaining());
      let slashes = 0;

      if (match && match[0].length > 2) {
        slashes = match[0].length;
        state.index += slashes;
        if (slashes % 2 !== 0) {
          value += '\\';
        }
      }

      if (opts.unescape === true) {
        value = advance();
      } else {
        value += advance();
      }

      if (state.brackets === 0) {
        push({ type: 'text', value });
        continue;
      }
    }

    /**
     * If we're inside a regex character class, continue
     * until we reach the closing bracket.
     */

    if (state.brackets > 0 && (value !== ']' || prev.value === '[' || prev.value === '[^')) {
      if (opts.posix !== false && value === ':') {
        const inner = prev.value.slice(1);
        if (inner.includes('[')) {
          prev.posix = true;

          if (inner.includes(':')) {
            const idx = prev.value.lastIndexOf('[');
            const pre = prev.value.slice(0, idx);
            const rest = prev.value.slice(idx + 2);
            const posix = POSIX_REGEX_SOURCE[rest];
            if (posix) {
              prev.value = pre + posix;
              state.backtrack = true;
              advance();

              if (!bos.output && tokens.indexOf(prev) === 1) {
                bos.output = ONE_CHAR;
              }
              continue;
            }
          }
        }
      }

      if ((value === '[' && peek() !== ':') || (value === '-' && peek() === ']')) {
        value = `\\${value}`;
      }

      if (value === ']' && (prev.value === '[' || prev.value === '[^')) {
        value = `\\${value}`;
      }

      if (opts.posix === true && value === '!' && prev.value === '[') {
        value = '^';
      }

      prev.value += value;
      append({ value });
      continue;
    }

    /**
     * If we're inside a quoted string, continue
     * until we reach the closing double quote.
     */

    if (state.quotes === 1 && value !== '"') {
      value = utils$1.escapeRegex(value);
      prev.value += value;
      append({ value });
      continue;
    }

    /**
     * Double quotes
     */

    if (value === '"') {
      state.quotes = state.quotes === 1 ? 0 : 1;
      if (opts.keepQuotes === true) {
        push({ type: 'text', value });
      }
      continue;
    }

    /**
     * Parentheses
     */

    if (value === '(') {
      increment('parens');
      push({ type: 'paren', value });
      continue;
    }

    if (value === ')') {
      if (state.parens === 0 && opts.strictBrackets === true) {
        throw new SyntaxError(syntaxError('opening', '('));
      }

      const extglob = extglobs[extglobs.length - 1];
      if (extglob && state.parens === extglob.parens + 1) {
        extglobClose(extglobs.pop());
        continue;
      }

      push({ type: 'paren', value, output: state.parens ? ')' : '\\)' });
      decrement('parens');
      continue;
    }

    /**
     * Square brackets
     */

    if (value === '[') {
      if (opts.nobracket === true || !remaining().includes(']')) {
        if (opts.nobracket !== true && opts.strictBrackets === true) {
          throw new SyntaxError(syntaxError('closing', ']'));
        }

        value = `\\${value}`;
      } else {
        increment('brackets');
      }

      push({ type: 'bracket', value });
      continue;
    }

    if (value === ']') {
      if (opts.nobracket === true || (prev && prev.type === 'bracket' && prev.value.length === 1)) {
        push({ type: 'text', value, output: `\\${value}` });
        continue;
      }

      if (state.brackets === 0) {
        if (opts.strictBrackets === true) {
          throw new SyntaxError(syntaxError('opening', '['));
        }

        push({ type: 'text', value, output: `\\${value}` });
        continue;
      }

      decrement('brackets');

      const prevValue = prev.value.slice(1);
      if (prev.posix !== true && prevValue[0] === '^' && !prevValue.includes('/')) {
        value = `/${value}`;
      }

      prev.value += value;
      append({ value });

      // when literal brackets are explicitly disabled
      // assume we should match with a regex character class
      if (opts.literalBrackets === false || utils$1.hasRegexChars(prevValue)) {
        continue;
      }

      const escaped = utils$1.escapeRegex(prev.value);
      state.output = state.output.slice(0, -prev.value.length);

      // when literal brackets are explicitly enabled
      // assume we should escape the brackets to match literal characters
      if (opts.literalBrackets === true) {
        state.output += escaped;
        prev.value = escaped;
        continue;
      }

      // when the user specifies nothing, try to match both
      prev.value = `(${capture}${escaped}|${prev.value})`;
      state.output += prev.value;
      continue;
    }

    /**
     * Braces
     */

    if (value === '{' && opts.nobrace !== true) {
      increment('braces');

      const open = {
        type: 'brace',
        value,
        output: '(',
        outputIndex: state.output.length,
        tokensIndex: state.tokens.length
      };

      braces.push(open);
      push(open);
      continue;
    }

    if (value === '}') {
      const brace = braces[braces.length - 1];

      if (opts.nobrace === true || !brace) {
        push({ type: 'text', value, output: value });
        continue;
      }

      let output = ')';

      if (brace.dots === true) {
        const arr = tokens.slice();
        const range = [];

        for (let i = arr.length - 1; i >= 0; i--) {
          tokens.pop();
          if (arr[i].type === 'brace') {
            break;
          }
          if (arr[i].type !== 'dots') {
            range.unshift(arr[i].value);
          }
        }

        output = expandRange(range, opts);
        state.backtrack = true;
      }

      if (brace.comma !== true && brace.dots !== true) {
        const out = state.output.slice(0, brace.outputIndex);
        const toks = state.tokens.slice(brace.tokensIndex);
        brace.value = brace.output = '\\{';
        value = output = '\\}';
        state.output = out;
        for (const t of toks) {
          state.output += (t.output || t.value);
        }
      }

      push({ type: 'brace', value, output });
      decrement('braces');
      braces.pop();
      continue;
    }

    /**
     * Pipes
     */

    if (value === '|') {
      if (extglobs.length > 0) {
        extglobs[extglobs.length - 1].conditions++;
      }
      push({ type: 'text', value });
      continue;
    }

    /**
     * Commas
     */

    if (value === ',') {
      let output = value;

      const brace = braces[braces.length - 1];
      if (brace && stack[stack.length - 1] === 'braces') {
        brace.comma = true;
        output = '|';
      }

      push({ type: 'comma', value, output });
      continue;
    }

    /**
     * Slashes
     */

    if (value === '/') {
      // if the beginning of the glob is "./", advance the start
      // to the current index, and don't add the "./" characters
      // to the state. This greatly simplifies lookbehinds when
      // checking for BOS characters like "!" and "." (not "./")
      if (prev.type === 'dot' && state.index === state.start + 1) {
        state.start = state.index + 1;
        state.consumed = '';
        state.output = '';
        tokens.pop();
        prev = bos; // reset "prev" to the first token
        continue;
      }

      push({ type: 'slash', value, output: SLASH_LITERAL });
      continue;
    }

    /**
     * Dots
     */

    if (value === '.') {
      if (state.braces > 0 && prev.type === 'dot') {
        if (prev.value === '.') prev.output = DOT_LITERAL;
        const brace = braces[braces.length - 1];
        prev.type = 'dots';
        prev.output += value;
        prev.value += value;
        brace.dots = true;
        continue;
      }

      if ((state.braces + state.parens) === 0 && prev.type !== 'bos' && prev.type !== 'slash') {
        push({ type: 'text', value, output: DOT_LITERAL });
        continue;
      }

      push({ type: 'dot', value, output: DOT_LITERAL });
      continue;
    }

    /**
     * Question marks
     */

    if (value === '?') {
      const isGroup = prev && prev.value === '(';
      if (!isGroup && opts.noextglob !== true && peek() === '(' && peek(2) !== '?') {
        extglobOpen('qmark', value);
        continue;
      }

      if (prev && prev.type === 'paren') {
        const next = peek();
        let output = value;

        if (next === '<' && !utils$1.supportsLookbehinds()) {
          throw new Error('Node.js v10 or higher is required for regex lookbehinds');
        }

        if ((prev.value === '(' && !/[!=<:]/.test(next)) || (next === '<' && !/<([!=]|\w+>)/.test(remaining()))) {
          output = `\\${value}`;
        }

        push({ type: 'text', value, output });
        continue;
      }

      if (opts.dot !== true && (prev.type === 'slash' || prev.type === 'bos')) {
        push({ type: 'qmark', value, output: QMARK_NO_DOT });
        continue;
      }

      push({ type: 'qmark', value, output: QMARK });
      continue;
    }

    /**
     * Exclamation
     */

    if (value === '!') {
      if (opts.noextglob !== true && peek() === '(') {
        if (peek(2) !== '?' || !/[!=<:]/.test(peek(3))) {
          extglobOpen('negate', value);
          continue;
        }
      }

      if (opts.nonegate !== true && state.index === 0) {
        negate();
        continue;
      }
    }

    /**
     * Plus
     */

    if (value === '+') {
      if (opts.noextglob !== true && peek() === '(' && peek(2) !== '?') {
        extglobOpen('plus', value);
        continue;
      }

      if ((prev && prev.value === '(') || opts.regex === false) {
        push({ type: 'plus', value, output: PLUS_LITERAL });
        continue;
      }

      if ((prev && (prev.type === 'bracket' || prev.type === 'paren' || prev.type === 'brace')) || state.parens > 0) {
        push({ type: 'plus', value });
        continue;
      }

      push({ type: 'plus', value: PLUS_LITERAL });
      continue;
    }

    /**
     * Plain text
     */

    if (value === '@') {
      if (opts.noextglob !== true && peek() === '(' && peek(2) !== '?') {
        push({ type: 'at', extglob: true, value, output: '' });
        continue;
      }

      push({ type: 'text', value });
      continue;
    }

    /**
     * Plain text
     */

    if (value !== '*') {
      if (value === '$' || value === '^') {
        value = `\\${value}`;
      }

      const match = REGEX_NON_SPECIAL_CHARS.exec(remaining());
      if (match) {
        value += match[0];
        state.index += match[0].length;
      }

      push({ type: 'text', value });
      continue;
    }

    /**
     * Stars
     */

    if (prev && (prev.type === 'globstar' || prev.star === true)) {
      prev.type = 'star';
      prev.star = true;
      prev.value += value;
      prev.output = star;
      state.backtrack = true;
      state.globstar = true;
      consume(value);
      continue;
    }

    let rest = remaining();
    if (opts.noextglob !== true && /^\([^?]/.test(rest)) {
      extglobOpen('star', value);
      continue;
    }

    if (prev.type === 'star') {
      if (opts.noglobstar === true) {
        consume(value);
        continue;
      }

      const prior = prev.prev;
      const before = prior.prev;
      const isStart = prior.type === 'slash' || prior.type === 'bos';
      const afterStar = before && (before.type === 'star' || before.type === 'globstar');

      if (opts.bash === true && (!isStart || (rest[0] && rest[0] !== '/'))) {
        push({ type: 'star', value, output: '' });
        continue;
      }

      const isBrace = state.braces > 0 && (prior.type === 'comma' || prior.type === 'brace');
      const isExtglob = extglobs.length && (prior.type === 'pipe' || prior.type === 'paren');
      if (!isStart && prior.type !== 'paren' && !isBrace && !isExtglob) {
        push({ type: 'star', value, output: '' });
        continue;
      }

      // strip consecutive `/**/`
      while (rest.slice(0, 3) === '/**') {
        const after = input[state.index + 4];
        if (after && after !== '/') {
          break;
        }
        rest = rest.slice(3);
        consume('/**', 3);
      }

      if (prior.type === 'bos' && eos()) {
        prev.type = 'globstar';
        prev.value += value;
        prev.output = globstar(opts);
        state.output = prev.output;
        state.globstar = true;
        consume(value);
        continue;
      }

      if (prior.type === 'slash' && prior.prev.type !== 'bos' && !afterStar && eos()) {
        state.output = state.output.slice(0, -(prior.output + prev.output).length);
        prior.output = `(?:${prior.output}`;

        prev.type = 'globstar';
        prev.output = globstar(opts) + (opts.strictSlashes ? ')' : '|$)');
        prev.value += value;
        state.globstar = true;
        state.output += prior.output + prev.output;
        consume(value);
        continue;
      }

      if (prior.type === 'slash' && prior.prev.type !== 'bos' && rest[0] === '/') {
        const end = rest[1] !== void 0 ? '|$' : '';

        state.output = state.output.slice(0, -(prior.output + prev.output).length);
        prior.output = `(?:${prior.output}`;

        prev.type = 'globstar';
        prev.output = `${globstar(opts)}${SLASH_LITERAL}|${SLASH_LITERAL}${end})`;
        prev.value += value;

        state.output += prior.output + prev.output;
        state.globstar = true;

        consume(value + advance());

        push({ type: 'slash', value: '/', output: '' });
        continue;
      }

      if (prior.type === 'bos' && rest[0] === '/') {
        prev.type = 'globstar';
        prev.value += value;
        prev.output = `(?:^|${SLASH_LITERAL}|${globstar(opts)}${SLASH_LITERAL})`;
        state.output = prev.output;
        state.globstar = true;
        consume(value + advance());
        push({ type: 'slash', value: '/', output: '' });
        continue;
      }

      // remove single star from output
      state.output = state.output.slice(0, -prev.output.length);

      // reset previous token to globstar
      prev.type = 'globstar';
      prev.output = globstar(opts);
      prev.value += value;

      // reset output with globstar
      state.output += prev.output;
      state.globstar = true;
      consume(value);
      continue;
    }

    const token = { type: 'star', value, output: star };

    if (opts.bash === true) {
      token.output = '.*?';
      if (prev.type === 'bos' || prev.type === 'slash') {
        token.output = nodot + token.output;
      }
      push(token);
      continue;
    }

    if (prev && (prev.type === 'bracket' || prev.type === 'paren') && opts.regex === true) {
      token.output = value;
      push(token);
      continue;
    }

    if (state.index === state.start || prev.type === 'slash' || prev.type === 'dot') {
      if (prev.type === 'dot') {
        state.output += NO_DOT_SLASH;
        prev.output += NO_DOT_SLASH;

      } else if (opts.dot === true) {
        state.output += NO_DOTS_SLASH;
        prev.output += NO_DOTS_SLASH;

      } else {
        state.output += nodot;
        prev.output += nodot;
      }

      if (peek() !== '*') {
        state.output += ONE_CHAR;
        prev.output += ONE_CHAR;
      }
    }

    push(token);
  }

  while (state.brackets > 0) {
    if (opts.strictBrackets === true) throw new SyntaxError(syntaxError('closing', ']'));
    state.output = utils$1.escapeLast(state.output, '[');
    decrement('brackets');
  }

  while (state.parens > 0) {
    if (opts.strictBrackets === true) throw new SyntaxError(syntaxError('closing', ')'));
    state.output = utils$1.escapeLast(state.output, '(');
    decrement('parens');
  }

  while (state.braces > 0) {
    if (opts.strictBrackets === true) throw new SyntaxError(syntaxError('closing', '}'));
    state.output = utils$1.escapeLast(state.output, '{');
    decrement('braces');
  }

  if (opts.strictSlashes !== true && (prev.type === 'star' || prev.type === 'bracket')) {
    push({ type: 'maybe_slash', value: '', output: `${SLASH_LITERAL}?` });
  }

  // rebuild the output if we had to backtrack at any point
  if (state.backtrack === true) {
    state.output = '';

    for (const token of state.tokens) {
      state.output += token.output != null ? token.output : token.value;

      if (token.suffix) {
        state.output += token.suffix;
      }
    }
  }

  return state;
};

/**
 * Fast paths for creating regular expressions for common glob patterns.
 * This can significantly speed up processing and has very little downside
 * impact when none of the fast paths match.
 */

parse$1.fastpaths = (input, options) => {
  const opts = { ...options };
  const max = typeof opts.maxLength === 'number' ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
  const len = input.length;
  if (len > max) {
    throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
  }

  input = REPLACEMENTS[input] || input;
  const win32 = utils$1.isWindows(options);

  // create constants based on platform, for windows or posix
  const {
    DOT_LITERAL,
    SLASH_LITERAL,
    ONE_CHAR,
    DOTS_SLASH,
    NO_DOT,
    NO_DOTS,
    NO_DOTS_SLASH,
    STAR,
    START_ANCHOR
  } = constants$1.globChars(win32);

  const nodot = opts.dot ? NO_DOTS : NO_DOT;
  const slashDot = opts.dot ? NO_DOTS_SLASH : NO_DOT;
  const capture = opts.capture ? '' : '?:';
  const state = { negated: false, prefix: '' };
  let star = opts.bash === true ? '.*?' : STAR;

  if (opts.capture) {
    star = `(${star})`;
  }

  const globstar = opts => {
    if (opts.noglobstar === true) return star;
    return `(${capture}(?:(?!${START_ANCHOR}${opts.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
  };

  const create = str => {
    switch (str) {
      case '*':
        return `${nodot}${ONE_CHAR}${star}`;

      case '.*':
        return `${DOT_LITERAL}${ONE_CHAR}${star}`;

      case '*.*':
        return `${nodot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;

      case '*/*':
        return `${nodot}${star}${SLASH_LITERAL}${ONE_CHAR}${slashDot}${star}`;

      case '**':
        return nodot + globstar(opts);

      case '**/*':
        return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${ONE_CHAR}${star}`;

      case '**/*.*':
        return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;

      case '**/.*':
        return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${DOT_LITERAL}${ONE_CHAR}${star}`;

      default: {
        const match = /^(.*?)\.(\w+)$/.exec(str);
        if (!match) return;

        const source = create(match[1]);
        if (!source) return;

        return source + DOT_LITERAL + match[2];
      }
    }
  };

  const output = utils$1.removePrefix(input, state);
  let source = create(output);

  if (source && opts.strictSlashes !== true) {
    source += `${SLASH_LITERAL}?`;
  }

  return source;
};

var parse_1 = parse$1;

const path$4 = require$$0$2;
const scan = scan_1;
const parse = parse_1;
const utils = utils$3;
const constants = constants$2;
const isObject$1 = val => val && typeof val === 'object' && !Array.isArray(val);

/**
 * Creates a matcher function from one or more glob patterns. The
 * returned function takes a string to match as its first argument,
 * and returns true if the string is a match. The returned matcher
 * function also takes a boolean as the second argument that, when true,
 * returns an object with additional information.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch(glob[, options]);
 *
 * const isMatch = picomatch('*.!(*a)');
 * console.log(isMatch('a.a')); //=> false
 * console.log(isMatch('a.b')); //=> true
 * ```
 * @name picomatch
 * @param {String|Array} `globs` One or more glob patterns.
 * @param {Object=} `options`
 * @return {Function=} Returns a matcher function.
 * @api public
 */

const picomatch$1 = (glob, options, returnState = false) => {
  if (Array.isArray(glob)) {
    const fns = glob.map(input => picomatch$1(input, options, returnState));
    const arrayMatcher = str => {
      for (const isMatch of fns) {
        const state = isMatch(str);
        if (state) return state;
      }
      return false;
    };
    return arrayMatcher;
  }

  const isState = isObject$1(glob) && glob.tokens && glob.input;

  if (glob === '' || (typeof glob !== 'string' && !isState)) {
    throw new TypeError('Expected pattern to be a non-empty string');
  }

  const opts = options || {};
  const posix = utils.isWindows(options);
  const regex = isState
    ? picomatch$1.compileRe(glob, options)
    : picomatch$1.makeRe(glob, options, false, true);

  const state = regex.state;
  delete regex.state;

  let isIgnored = () => false;
  if (opts.ignore) {
    const ignoreOpts = { ...options, ignore: null, onMatch: null, onResult: null };
    isIgnored = picomatch$1(opts.ignore, ignoreOpts, returnState);
  }

  const matcher = (input, returnObject = false) => {
    const { isMatch, match, output } = picomatch$1.test(input, regex, options, { glob, posix });
    const result = { glob, state, regex, posix, input, output, match, isMatch };

    if (typeof opts.onResult === 'function') {
      opts.onResult(result);
    }

    if (isMatch === false) {
      result.isMatch = false;
      return returnObject ? result : false;
    }

    if (isIgnored(input)) {
      if (typeof opts.onIgnore === 'function') {
        opts.onIgnore(result);
      }
      result.isMatch = false;
      return returnObject ? result : false;
    }

    if (typeof opts.onMatch === 'function') {
      opts.onMatch(result);
    }
    return returnObject ? result : true;
  };

  if (returnState) {
    matcher.state = state;
  }

  return matcher;
};

/**
 * Test `input` with the given `regex`. This is used by the main
 * `picomatch()` function to test the input string.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.test(input, regex[, options]);
 *
 * console.log(picomatch.test('foo/bar', /^(?:([^/]*?)\/([^/]*?))$/));
 * // { isMatch: true, match: [ 'foo/', 'foo', 'bar' ], output: 'foo/bar' }
 * ```
 * @param {String} `input` String to test.
 * @param {RegExp} `regex`
 * @return {Object} Returns an object with matching info.
 * @api public
 */

picomatch$1.test = (input, regex, options, { glob, posix } = {}) => {
  if (typeof input !== 'string') {
    throw new TypeError('Expected input to be a string');
  }

  if (input === '') {
    return { isMatch: false, output: '' };
  }

  const opts = options || {};
  const format = opts.format || (posix ? utils.toPosixSlashes : null);
  let match = input === glob;
  let output = (match && format) ? format(input) : input;

  if (match === false) {
    output = format ? format(input) : input;
    match = output === glob;
  }

  if (match === false || opts.capture === true) {
    if (opts.matchBase === true || opts.basename === true) {
      match = picomatch$1.matchBase(input, regex, options, posix);
    } else {
      match = regex.exec(output);
    }
  }

  return { isMatch: Boolean(match), match, output };
};

/**
 * Match the basename of a filepath.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.matchBase(input, glob[, options]);
 * console.log(picomatch.matchBase('foo/bar.js', '*.js'); // true
 * ```
 * @param {String} `input` String to test.
 * @param {RegExp|String} `glob` Glob pattern or regex created by [.makeRe](#makeRe).
 * @return {Boolean}
 * @api public
 */

picomatch$1.matchBase = (input, glob, options, posix = utils.isWindows(options)) => {
  const regex = glob instanceof RegExp ? glob : picomatch$1.makeRe(glob, options);
  return regex.test(path$4.basename(input));
};

/**
 * Returns true if **any** of the given glob `patterns` match the specified `string`.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.isMatch(string, patterns[, options]);
 *
 * console.log(picomatch.isMatch('a.a', ['b.*', '*.a'])); //=> true
 * console.log(picomatch.isMatch('a.a', 'b.*')); //=> false
 * ```
 * @param {String|Array} str The string to test.
 * @param {String|Array} patterns One or more glob patterns to use for matching.
 * @param {Object} [options] See available [options](#options).
 * @return {Boolean} Returns true if any patterns match `str`
 * @api public
 */

picomatch$1.isMatch = (str, patterns, options) => picomatch$1(patterns, options)(str);

/**
 * Parse a glob pattern to create the source string for a regular
 * expression.
 *
 * ```js
 * const picomatch = require('picomatch');
 * const result = picomatch.parse(pattern[, options]);
 * ```
 * @param {String} `pattern`
 * @param {Object} `options`
 * @return {Object} Returns an object with useful properties and output to be used as a regex source string.
 * @api public
 */

picomatch$1.parse = (pattern, options) => {
  if (Array.isArray(pattern)) return pattern.map(p => picomatch$1.parse(p, options));
  return parse(pattern, { ...options, fastpaths: false });
};

/**
 * Scan a glob pattern to separate the pattern into segments.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.scan(input[, options]);
 *
 * const result = picomatch.scan('!./foo/*.js');
 * console.log(result);
 * { prefix: '!./',
 *   input: '!./foo/*.js',
 *   start: 3,
 *   base: 'foo',
 *   glob: '*.js',
 *   isBrace: false,
 *   isBracket: false,
 *   isGlob: true,
 *   isExtglob: false,
 *   isGlobstar: false,
 *   negated: true }
 * ```
 * @param {String} `input` Glob pattern to scan.
 * @param {Object} `options`
 * @return {Object} Returns an object with
 * @api public
 */

picomatch$1.scan = (input, options) => scan(input, options);

/**
 * Compile a regular expression from the `state` object returned by the
 * [parse()](#parse) method.
 *
 * @param {Object} `state`
 * @param {Object} `options`
 * @param {Boolean} `returnOutput` Intended for implementors, this argument allows you to return the raw output from the parser.
 * @param {Boolean} `returnState` Adds the state to a `state` property on the returned regex. Useful for implementors and debugging.
 * @return {RegExp}
 * @api public
 */

picomatch$1.compileRe = (state, options, returnOutput = false, returnState = false) => {
  if (returnOutput === true) {
    return state.output;
  }

  const opts = options || {};
  const prepend = opts.contains ? '' : '^';
  const append = opts.contains ? '' : '$';

  let source = `${prepend}(?:${state.output})${append}`;
  if (state && state.negated === true) {
    source = `^(?!${source}).*$`;
  }

  const regex = picomatch$1.toRegex(source, options);
  if (returnState === true) {
    regex.state = state;
  }

  return regex;
};

/**
 * Create a regular expression from a parsed glob pattern.
 *
 * ```js
 * const picomatch = require('picomatch');
 * const state = picomatch.parse('*.js');
 * // picomatch.compileRe(state[, options]);
 *
 * console.log(picomatch.compileRe(state));
 * //=> /^(?:(?!\.)(?=.)[^/]*?\.js)$/
 * ```
 * @param {String} `state` The object returned from the `.parse` method.
 * @param {Object} `options`
 * @param {Boolean} `returnOutput` Implementors may use this argument to return the compiled output, instead of a regular expression. This is not exposed on the options to prevent end-users from mutating the result.
 * @param {Boolean} `returnState` Implementors may use this argument to return the state from the parsed glob with the returned regular expression.
 * @return {RegExp} Returns a regex created from the given pattern.
 * @api public
 */

picomatch$1.makeRe = (input, options = {}, returnOutput = false, returnState = false) => {
  if (!input || typeof input !== 'string') {
    throw new TypeError('Expected a non-empty string');
  }

  let parsed = { negated: false, fastpaths: true };

  if (options.fastpaths !== false && (input[0] === '.' || input[0] === '*')) {
    parsed.output = parse.fastpaths(input, options);
  }

  if (!parsed.output) {
    parsed = parse(input, options);
  }

  return picomatch$1.compileRe(parsed, options, returnOutput, returnState);
};

/**
 * Create a regular expression from the given regex source string.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.toRegex(source[, options]);
 *
 * const { output } = picomatch.parse('*.js');
 * console.log(picomatch.toRegex(output));
 * //=> /^(?:(?!\.)(?=.)[^/]*?\.js)$/
 * ```
 * @param {String} `source` Regular expression source string.
 * @param {Object} `options`
 * @return {RegExp}
 * @api public
 */

picomatch$1.toRegex = (source, options) => {
  try {
    const opts = options || {};
    return new RegExp(source, opts.flags || (opts.nocase ? 'i' : ''));
  } catch (err) {
    if (options && options.debug === true) throw err;
    return /$^/;
  }
};

/**
 * Picomatch constants.
 * @return {Object}
 */

picomatch$1.constants = constants;

/**
 * Expose "picomatch"
 */

var picomatch_1 = picomatch$1;

var picomatch = picomatch_1;

var pm = /*@__PURE__*/getDefaultExportFromCjs(picomatch);

const extractors = {
    ArrayPattern(names, param) {
        for (const element of param.elements) {
            if (element)
                extractors[element.type](names, element);
        }
    },
    AssignmentPattern(names, param) {
        extractors[param.left.type](names, param.left);
    },
    Identifier(names, param) {
        names.push(param.name);
    },
    MemberExpression() { },
    ObjectPattern(names, param) {
        for (const prop of param.properties) {
            // @ts-ignore Typescript reports that this is not a valid type
            if (prop.type === 'RestElement') {
                extractors.RestElement(names, prop);
            }
            else {
                extractors[prop.value.type](names, prop.value);
            }
        }
    },
    RestElement(names, param) {
        extractors[param.argument.type](names, param.argument);
    }
};
const extractAssignedNames = function extractAssignedNames(param) {
    const names = [];
    extractors[param.type](names, param);
    return names;
};

const blockDeclarations = {
    const: true,
    let: true
};
class Scope {
    constructor(options = {}) {
        this.parent = options.parent;
        this.isBlockScope = !!options.block;
        this.declarations = Object.create(null);
        if (options.params) {
            options.params.forEach((param) => {
                extractAssignedNames(param).forEach((name) => {
                    this.declarations[name] = true;
                });
            });
        }
    }
    addDeclaration(node, isBlockDeclaration, isVar) {
        if (!isBlockDeclaration && this.isBlockScope) {
            // it's a `var` or function node, and this
            // is a block scope, so we need to go up
            this.parent.addDeclaration(node, isBlockDeclaration, isVar);
        }
        else if (node.id) {
            extractAssignedNames(node.id).forEach((name) => {
                this.declarations[name] = true;
            });
        }
    }
    contains(name) {
        return this.declarations[name] || (this.parent ? this.parent.contains(name) : false);
    }
}
const attachScopes = function attachScopes(ast, propertyName = 'scope') {
    let scope = new Scope();
    walk(ast, {
        enter(n, parent) {
            const node = n;
            // function foo () {...}
            // class Foo {...}
            if (/(Function|Class)Declaration/.test(node.type)) {
                scope.addDeclaration(node, false, false);
            }
            // var foo = 1
            if (node.type === 'VariableDeclaration') {
                const { kind } = node;
                const isBlockDeclaration = blockDeclarations[kind];
                node.declarations.forEach((declaration) => {
                    scope.addDeclaration(declaration, isBlockDeclaration, true);
                });
            }
            let newScope;
            // create new function scope
            if (/Function/.test(node.type)) {
                const func = node;
                newScope = new Scope({
                    parent: scope,
                    block: false,
                    params: func.params
                });
                // named function expressions - the name is considered
                // part of the function's scope
                if (func.type === 'FunctionExpression' && func.id) {
                    newScope.addDeclaration(func, false, false);
                }
            }
            // create new for scope
            if (/For(In|Of)?Statement/.test(node.type)) {
                newScope = new Scope({
                    parent: scope,
                    block: true
                });
            }
            // create new block scope
            if (node.type === 'BlockStatement' && !/Function/.test(parent.type)) {
                newScope = new Scope({
                    parent: scope,
                    block: true
                });
            }
            // catch clause has its own block scope
            if (node.type === 'CatchClause') {
                newScope = new Scope({
                    parent: scope,
                    params: node.param ? [node.param] : [],
                    block: true
                });
            }
            if (newScope) {
                Object.defineProperty(node, propertyName, {
                    value: newScope,
                    configurable: true
                });
                scope = newScope;
            }
        },
        leave(n) {
            const node = n;
            if (node[propertyName])
                scope = scope.parent;
        }
    });
    return scope;
};

// Helper since Typescript can't detect readonly arrays with Array.isArray
function isArray(arg) {
    return Array.isArray(arg);
}
function ensureArray(thing) {
    if (isArray(thing))
        return thing;
    if (thing == null)
        return [];
    return [thing];
}

const normalizePath = function normalizePath(filename) {
    return filename.split(require$$0$2.win32.sep).join(require$$0$2.posix.sep);
};

function getMatcherString(id, resolutionBase) {
    if (resolutionBase === false || require$$0$2.isAbsolute(id) || id.startsWith('**')) {
        return normalizePath(id);
    }
    // resolve('') is valid and will default to process.cwd()
    const basePath = normalizePath(require$$0$2.resolve(resolutionBase || ''))
        // escape all possible (posix + win) path characters that might interfere with regex
        .replace(/[-^$*+?.()|[\]{}]/g, '\\$&');
    // Note that we use posix.join because:
    // 1. the basePath has been normalized to use /
    // 2. the incoming glob (id) matcher, also uses /
    // otherwise Node will force backslash (\) on windows
    return require$$0$2.posix.join(basePath, normalizePath(id));
}
const createFilter = function createFilter(include, exclude, options) {
    const resolutionBase = options && options.resolve;
    const getMatcher = (id) => id instanceof RegExp
        ? id
        : {
            test: (what) => {
                // this refactor is a tad overly verbose but makes for easy debugging
                const pattern = getMatcherString(id, resolutionBase);
                const fn = pm(pattern, { dot: true });
                const result = fn(what);
                return result;
            }
        };
    const includeMatchers = ensureArray(include).map(getMatcher);
    const excludeMatchers = ensureArray(exclude).map(getMatcher);
    return function result(id) {
        if (typeof id !== 'string')
            return false;
        if (/\0/.test(id))
            return false;
        const pathId = normalizePath(id);
        for (let i = 0; i < excludeMatchers.length; ++i) {
            const matcher = excludeMatchers[i];
            if (matcher.test(pathId))
                return false;
        }
        for (let i = 0; i < includeMatchers.length; ++i) {
            const matcher = includeMatchers[i];
            if (matcher.test(pathId))
                return true;
        }
        return !includeMatchers.length;
    };
};

const reservedWords = 'break case class catch const continue debugger default delete do else export extends finally for function if import in instanceof let new return super switch this throw try typeof var void while with yield enum await implements package protected static interface private public';
const builtins = 'arguments Infinity NaN undefined null true false eval uneval isFinite isNaN parseFloat parseInt decodeURI decodeURIComponent encodeURI encodeURIComponent escape unescape Object Function Boolean Symbol Error EvalError InternalError RangeError ReferenceError SyntaxError TypeError URIError Number Math Date String RegExp Array Int8Array Uint8Array Uint8ClampedArray Int16Array Uint16Array Int32Array Uint32Array Float32Array Float64Array Map Set WeakMap WeakSet SIMD ArrayBuffer DataView JSON Promise Generator GeneratorFunction Reflect Proxy Intl';
const forbiddenIdentifiers = new Set(`${reservedWords} ${builtins}`.split(' '));
forbiddenIdentifiers.add('');
const makeLegalIdentifier = function makeLegalIdentifier(str) {
    let identifier = str
        .replace(/-(\w)/g, (_, letter) => letter.toUpperCase())
        .replace(/[^$_a-zA-Z0-9]/g, '_');
    if (/\d/.test(identifier[0]) || forbiddenIdentifiers.has(identifier)) {
        identifier = `_${identifier}`;
    }
    return identifier || '_';
};

var version$2 = "15.2.3";
var peerDependencies$1 = {
	rollup: "^2.78.0||^3.0.0||^4.0.0"
};

require$$3.promisify(fs$7.access);
const readFile$1 = require$$3.promisify(fs$7.readFile);
const realpath$1 = require$$3.promisify(fs$7.realpath);
const stat = require$$3.promisify(fs$7.stat);
async function fileExists(filePath) {
    try {
        const res = await stat(filePath);
        return res.isFile();
    }
    catch {
        return false;
    }
}
async function resolveSymlink(path) {
    return (await fileExists(path)) ? realpath$1(path) : path;
}

const onError = (error) => {
  if (error.code === 'ENOENT') {
    return false;
  }
  throw error;
};

const makeCache = (fn) => {
  const cache = new Map();
  const wrapped = async (param, done) => {
    if (cache.has(param) === false) {
      cache.set(
        param,
        fn(param).catch((err) => {
          cache.delete(param);
          throw err;
        })
      );
    }

    try {
      const result = cache.get(param);
      const value = await result;
      return done(null, value);
    } catch (error) {
      return done(error);
    }
  };

  wrapped.clear = () => cache.clear();

  return wrapped;
};

const isDirCached = makeCache(async (file) => {
  try {
    const stats = await stat(file);
    return stats.isDirectory();
  } catch (error) {
    return onError(error);
  }
});

const isFileCached = makeCache(async (file) => {
  try {
    const stats = await stat(file);
    return stats.isFile();
  } catch (error) {
    return onError(error);
  }
});

const readCachedFile = makeCache(readFile$1);

function handleDeprecatedOptions(opts) {
  const warnings = [];

  if (opts.customResolveOptions) {
    const { customResolveOptions } = opts;
    if (customResolveOptions.moduleDirectory) {
      // eslint-disable-next-line no-param-reassign
      opts.moduleDirectories = Array.isArray(customResolveOptions.moduleDirectory)
        ? customResolveOptions.moduleDirectory
        : [customResolveOptions.moduleDirectory];

      warnings.push(
        'node-resolve: The `customResolveOptions.moduleDirectory` option has been deprecated. Use `moduleDirectories`, which must be an array.'
      );
    }

    if (customResolveOptions.preserveSymlinks) {
      throw new Error(
        'node-resolve: `customResolveOptions.preserveSymlinks` is no longer an option. We now always use the rollup `preserveSymlinks` option.'
      );
    }

    [
      'basedir',
      'package',
      'extensions',
      'includeCoreModules',
      'readFile',
      'isFile',
      'isDirectory',
      'realpath',
      'packageFilter',
      'pathFilter',
      'paths',
      'packageIterator'
    ].forEach((resolveOption) => {
      if (customResolveOptions[resolveOption]) {
        throw new Error(
          `node-resolve: \`customResolveOptions.${resolveOption}\` is no longer an option. If you need this, please open an issue.`
        );
      }
    });
  }

  return { warnings };
}

// returns the imported package name for bare module imports
function getPackageName(id) {
  if (id.startsWith('.') || id.startsWith('/')) {
    return null;
  }

  const split = id.split('/');

  // @my-scope/my-package/foo.js -> @my-scope/my-package
  // @my-scope/my-package -> @my-scope/my-package
  if (split[0][0] === '@') {
    return `${split[0]}/${split[1]}`;
  }

  // my-package/foo.js -> my-package
  // my-package -> my-package
  return split[0];
}

function getMainFields(options) {
  let mainFields;
  if (options.mainFields) {
    ({ mainFields } = options);
  } else {
    mainFields = ['module', 'main'];
  }
  if (options.browser && mainFields.indexOf('browser') === -1) {
    return ['browser'].concat(mainFields);
  }
  if (!mainFields.length) {
    throw new Error('Please ensure at least one `mainFields` value is specified');
  }
  return mainFields;
}

function getPackageInfo(options) {
  const {
    cache,
    extensions,
    pkg,
    mainFields,
    preserveSymlinks,
    useBrowserOverrides,
    rootDir,
    ignoreSideEffectsForRoot
  } = options;
  let { pkgPath } = options;

  if (cache.has(pkgPath)) {
    return cache.get(pkgPath);
  }

  // browserify/resolve doesn't realpath paths returned in its packageFilter callback
  if (!preserveSymlinks) {
    pkgPath = fs$7.realpathSync(pkgPath);
  }

  const pkgRoot = require$$0$2.dirname(pkgPath);

  const packageInfo = {
    // copy as we are about to munge the `main` field of `pkg`.
    packageJson: { ...pkg },

    // path to package.json file
    packageJsonPath: pkgPath,

    // directory containing the package.json
    root: pkgRoot,

    // which main field was used during resolution of this module (main, module, or browser)
    resolvedMainField: 'main',

    // whether the browser map was used to resolve the entry point to this module
    browserMappedMain: false,

    // the entry point of the module with respect to the selected main field and any
    // relevant browser mappings.
    resolvedEntryPoint: ''
  };

  let overriddenMain = false;
  for (let i = 0; i < mainFields.length; i++) {
    const field = mainFields[i];
    if (typeof pkg[field] === 'string') {
      pkg.main = pkg[field];
      packageInfo.resolvedMainField = field;
      overriddenMain = true;
      break;
    }
  }

  const internalPackageInfo = {
    cachedPkg: pkg,
    hasModuleSideEffects: () => null,
    hasPackageEntry: overriddenMain !== false || mainFields.indexOf('main') !== -1,
    packageBrowserField:
      useBrowserOverrides &&
      typeof pkg.browser === 'object' &&
      Object.keys(pkg.browser).reduce((browser, key) => {
        let resolved = pkg.browser[key];
        if (resolved && resolved[0] === '.') {
          resolved = require$$0$2.resolve(pkgRoot, resolved);
        }
        /* eslint-disable no-param-reassign */
        browser[key] = resolved;
        if (key[0] === '.') {
          const absoluteKey = require$$0$2.resolve(pkgRoot, key);
          browser[absoluteKey] = resolved;
          if (!require$$0$2.extname(key)) {
            extensions.reduce((subBrowser, ext) => {
              subBrowser[absoluteKey + ext] = subBrowser[key];
              return subBrowser;
            }, browser);
          }
        }
        return browser;
      }, {}),
    packageInfo
  };

  const browserMap = internalPackageInfo.packageBrowserField;
  if (
    useBrowserOverrides &&
    typeof pkg.browser === 'object' &&
    // eslint-disable-next-line no-prototype-builtins
    browserMap.hasOwnProperty(pkg.main)
  ) {
    packageInfo.resolvedEntryPoint = browserMap[pkg.main];
    packageInfo.browserMappedMain = true;
  } else {
    // index.node is technically a valid default entrypoint as well...
    packageInfo.resolvedEntryPoint = require$$0$2.resolve(pkgRoot, pkg.main || 'index.js');
    packageInfo.browserMappedMain = false;
  }

  if (!ignoreSideEffectsForRoot || rootDir !== pkgRoot) {
    const packageSideEffects = pkg.sideEffects;
    if (typeof packageSideEffects === 'boolean') {
      internalPackageInfo.hasModuleSideEffects = () => packageSideEffects;
    } else if (Array.isArray(packageSideEffects)) {
      const finalPackageSideEffects = packageSideEffects.map((sideEffect) => {
        /*
         * The array accepts simple glob patterns to the relevant files... Patterns like .css, which do not include a /, will be treated like **\/.css.
         * https://webpack.js.org/guides/tree-shaking/
         */
        if (sideEffect.includes('/')) {
          return sideEffect;
        }
        return `**/${sideEffect}`;
      });
      internalPackageInfo.hasModuleSideEffects = createFilter(finalPackageSideEffects, null, {
        resolve: pkgRoot
      });
    }
  }

  cache.set(pkgPath, internalPackageInfo);
  return internalPackageInfo;
}

function normalizeInput(input) {
  if (Array.isArray(input)) {
    return input;
  } else if (typeof input === 'object') {
    return Object.values(input);
  }

  // otherwise it's a string
  return [input];
}

/* eslint-disable no-await-in-loop */
function isModuleDir(current, moduleDirs) {
    return moduleDirs.some((dir) => current.endsWith(dir));
}
async function findPackageJson(base, moduleDirs) {
    const { root } = require$$0$2.parse(base);
    let current = base;
    while (current !== root && !isModuleDir(current, moduleDirs)) {
        const pkgJsonPath = require$$0$2.join(current, 'package.json');
        if (await fileExists(pkgJsonPath)) {
            const pkgJsonString = fs$7.readFileSync(pkgJsonPath, 'utf-8');
            return { pkgJson: JSON.parse(pkgJsonString), pkgPath: current, pkgJsonPath };
        }
        current = require$$0$2.resolve(current, '..');
    }
    return null;
}
function isUrl(str) {
    try {
        return !!new URL(str);
    }
    catch (_) {
        return false;
    }
}
/**
 * Conditions is an export object where all keys are conditions like 'node' (aka do not with '.')
 */
function isConditions(exports) {
    return typeof exports === 'object' && Object.keys(exports).every((k) => !k.startsWith('.'));
}
/**
 * Mappings is an export object where all keys start with '.
 */
function isMappings(exports) {
    return typeof exports === 'object' && !isConditions(exports);
}
/**
 * Check for mixed exports, which are exports where some keys start with '.' and some do not
 */
function isMixedExports(exports) {
    const keys = Object.keys(exports);
    return keys.some((k) => k.startsWith('.')) && keys.some((k) => !k.startsWith('.'));
}
function createBaseErrorMsg(importSpecifier, importer) {
    return `Could not resolve import "${importSpecifier}" in ${importer}`;
}
function createErrorMsg(context, reason, isImports) {
    const { importSpecifier, importer, pkgJsonPath } = context;
    const base = createBaseErrorMsg(importSpecifier, importer);
    const field = isImports ? 'imports' : 'exports';
    return `${base} using ${field} defined in ${pkgJsonPath}.${reason ? ` ${reason}` : ''}`;
}
class ResolveError extends Error {
}
class InvalidConfigurationError extends ResolveError {
    constructor(context, reason) {
        super(createErrorMsg(context, `Invalid "exports" field. ${reason}`));
    }
}
class InvalidModuleSpecifierError extends ResolveError {
    constructor(context, isImports, reason) {
        super(createErrorMsg(context, reason, isImports));
    }
}
class InvalidPackageTargetError extends ResolveError {
    constructor(context, reason) {
        super(createErrorMsg(context, reason));
    }
}

/* eslint-disable no-await-in-loop, no-undefined */
/**
 * Check for invalid path segments
 */
function includesInvalidSegments(pathSegments, moduleDirs) {
    const invalidSegments = ['', '.', '..', ...moduleDirs];
    // contains any "", ".", "..", or "node_modules" segments, including percent encoded variants
    return pathSegments.some((v) => invalidSegments.includes(v) || invalidSegments.includes(decodeURI(v)));
}
async function resolvePackageTarget(context, { target, patternMatch, isImports }) {
    // If target is a String, then
    if (typeof target === 'string') {
        // If target does not start with "./", then
        if (!target.startsWith('./')) {
            // If isImports is false, or if target starts with "../" or "/", or if target is a valid URL, then
            if (!isImports || ['/', '../'].some((p) => target.startsWith(p)) || isUrl(target)) {
                // Throw an Invalid Package Target error.
                throw new InvalidPackageTargetError(context, `Invalid mapping: "${target}".`);
            }
            // If patternMatch is a String, then
            if (typeof patternMatch === 'string') {
                // Return PACKAGE_RESOLVE(target with every instance of "*" replaced by patternMatch, packageURL + "/")
                const result = await context.resolveId(target.replace(/\*/g, patternMatch), context.pkgURL.href);
                return result ? url$2.pathToFileURL(result.location).href : null;
            }
            // Return PACKAGE_RESOLVE(target, packageURL + "/").
            const result = await context.resolveId(target, context.pkgURL.href);
            return result ? url$2.pathToFileURL(result.location).href : null;
        }
        // TODO: Drop if we do not support Node <= 16 anymore
        // This behavior was removed in Node 17 (deprecated in Node 14), see DEP0148
        if (context.allowExportsFolderMapping) {
            target = target.replace(/\/$/, '/*');
        }
        // If target split on "/" or "\"
        {
            const pathSegments = target.split(/\/|\\/);
            // after the first "." segment
            const firstDot = pathSegments.indexOf('.');
            firstDot !== -1 && pathSegments.slice(firstDot);
            if (firstDot !== -1 &&
                firstDot < pathSegments.length - 1 &&
                includesInvalidSegments(pathSegments.slice(firstDot + 1), context.moduleDirs)) {
                throw new InvalidPackageTargetError(context, `Invalid mapping: "${target}".`);
            }
        }
        // Let resolvedTarget be the URL resolution of the concatenation of packageURL and target.
        const resolvedTarget = new URL(target, context.pkgURL);
        // Assert: resolvedTarget is contained in packageURL.
        if (!resolvedTarget.href.startsWith(context.pkgURL.href)) {
            throw new InvalidPackageTargetError(context, `Resolved to ${resolvedTarget.href} which is outside package ${context.pkgURL.href}`);
        }
        // If patternMatch is null, then
        if (!patternMatch) {
            // Return resolvedTarget.
            return resolvedTarget;
        }
        // If patternMatch split on "/" or "\" contains invalid segments
        if (includesInvalidSegments(patternMatch.split(/\/|\\/), context.moduleDirs)) {
            // throw an Invalid Module Specifier error.
            throw new InvalidModuleSpecifierError(context);
        }
        // Return the URL resolution of resolvedTarget with every instance of "*" replaced with patternMatch.
        return resolvedTarget.href.replace(/\*/g, patternMatch);
    }
    // Otherwise, if target is an Array, then
    if (Array.isArray(target)) {
        // If _target.length is zero, return null.
        if (target.length === 0) {
            return null;
        }
        let lastError = null;
        // For each item in target, do
        for (const item of target) {
            // Let resolved be the result of PACKAGE_TARGET_RESOLVE of the item
            // continuing the loop on any Invalid Package Target error.
            try {
                const resolved = await resolvePackageTarget(context, {
                    target: item,
                    patternMatch,
                    isImports
                });
                // If resolved is undefined, continue the loop.
                // Else Return resolved.
                if (resolved !== undefined) {
                    return resolved;
                }
            }
            catch (error) {
                if (!(error instanceof InvalidPackageTargetError)) {
                    throw error;
                }
                else {
                    lastError = error;
                }
            }
        }
        // Return or throw the last fallback resolution null return or error
        if (lastError) {
            throw lastError;
        }
        return null;
    }
    // Otherwise, if target is a non-null Object, then
    if (target && typeof target === 'object') {
        // For each property of target
        for (const [key, value] of Object.entries(target)) {
            // If exports contains any index property keys, as defined in ECMA-262 6.1.7 Array Index, throw an Invalid Package Configuration error.
            // TODO: We do not check if the key is a number here...
            // If key equals "default" or conditions contains an entry for the key, then
            if (key === 'default' || context.conditions.includes(key)) {
                // Let targetValue be the value of the property in target.
                // Let resolved be the result of PACKAGE_TARGET_RESOLVE of the targetValue
                const resolved = await resolvePackageTarget(context, {
                    target: value,
                    patternMatch,
                    isImports
                });
                // If resolved is equal to undefined, continue the loop.
                // Return resolved.
                if (resolved !== undefined) {
                    return resolved;
                }
            }
        }
        // Return undefined.
        return undefined;
    }
    // Otherwise, if target is null, return null.
    if (target === null) {
        return null;
    }
    // Otherwise throw an Invalid Package Target error.
    throw new InvalidPackageTargetError(context, `Invalid exports field.`);
}

/* eslint-disable no-await-in-loop */
/**
 * Implementation of Node's `PATTERN_KEY_COMPARE` function
 */
function nodePatternKeyCompare(keyA, keyB) {
    // Let baseLengthA be the index of "*" in keyA plus one, if keyA contains "*", or the length of keyA otherwise.
    const baseLengthA = keyA.includes('*') ? keyA.indexOf('*') + 1 : keyA.length;
    // Let baseLengthB be the index of "*" in keyB plus one, if keyB contains "*", or the length of keyB otherwise.
    const baseLengthB = keyB.includes('*') ? keyB.indexOf('*') + 1 : keyB.length;
    // if baseLengthA is greater, return -1, if lower 1
    const rval = baseLengthB - baseLengthA;
    if (rval !== 0)
        return rval;
    // If keyA does not contain "*", return 1.
    if (!keyA.includes('*'))
        return 1;
    // If keyB does not contain "*", return -1.
    if (!keyB.includes('*'))
        return -1;
    // If the length of keyA is greater than the length of keyB, return -1.
    // If the length of keyB is greater than the length of keyA, return 1.
    // Else Return 0.
    return keyB.length - keyA.length;
}
async function resolvePackageImportsExports(context, { matchKey, matchObj, isImports }) {
    // If matchKey is a key of matchObj and does not contain "*", then
    if (!matchKey.includes('*') && matchKey in matchObj) {
        // Let target be the value of matchObj[matchKey].
        const target = matchObj[matchKey];
        // Return the result of PACKAGE_TARGET_RESOLVE(packageURL, target, null, isImports, conditions).
        const resolved = await resolvePackageTarget(context, { target, patternMatch: '', isImports });
        return resolved;
    }
    // Let expansionKeys be the list of keys of matchObj containing only a single "*"
    const expansionKeys = Object.keys(matchObj)
        // Assert: ends with "/" or contains only a single "*".
        .filter((k) => k.endsWith('/') || k.includes('*'))
        // sorted by the sorting function PATTERN_KEY_COMPARE which orders in descending order of specificity.
        .sort(nodePatternKeyCompare);
    // For each key expansionKey in expansionKeys, do
    for (const expansionKey of expansionKeys) {
        const indexOfAsterisk = expansionKey.indexOf('*');
        // Let patternBase be the substring of expansionKey up to but excluding the first "*" character.
        const patternBase = indexOfAsterisk === -1 ? expansionKey : expansionKey.substring(0, indexOfAsterisk);
        // If matchKey starts with but is not equal to patternBase, then
        if (matchKey.startsWith(patternBase) && matchKey !== patternBase) {
            // Let patternTrailer be the substring of expansionKey from the index after the first "*" character.
            const patternTrailer = indexOfAsterisk !== -1 ? expansionKey.substring(indexOfAsterisk + 1) : '';
            // If patternTrailer has zero length,
            if (patternTrailer.length === 0 ||
                // or if matchKey ends with patternTrailer and the length of matchKey is greater than or equal to the length of expansionKey, then
                (matchKey.endsWith(patternTrailer) && matchKey.length >= expansionKey.length)) {
                // Let target be the value of matchObj[expansionKey].
                const target = matchObj[expansionKey];
                // Let patternMatch be the substring of matchKey starting at the index of the length of patternBase up to the length
                // of matchKey minus the length of patternTrailer.
                const patternMatch = matchKey.substring(patternBase.length, matchKey.length - patternTrailer.length);
                // Return the result of PACKAGE_TARGET_RESOLVE
                const resolved = await resolvePackageTarget(context, {
                    target,
                    patternMatch,
                    isImports
                });
                return resolved;
            }
        }
    }
    throw new InvalidModuleSpecifierError(context, isImports);
}

/**
 * Implementation of PACKAGE_EXPORTS_RESOLVE
 */
async function resolvePackageExports(context, subpath, exports) {
    // If exports is an Object with both a key starting with "." and a key not starting with "."
    if (isMixedExports(exports)) {
        // throw an Invalid Package Configuration error.
        throw new InvalidConfigurationError(context, 'All keys must either start with ./, or without one.');
    }
    // If subpath is equal to ".", then
    if (subpath === '.') {
        // Let mainExport be undefined.
        let mainExport;
        // If exports is a String or Array, or an Object containing no keys starting with ".", then
        if (typeof exports === 'string' || Array.isArray(exports) || isConditions(exports)) {
            // Set mainExport to exports
            mainExport = exports;
            // Otherwise if exports is an Object containing a "." property, then
        }
        else if (isMappings(exports)) {
            // Set mainExport to exports["."]
            mainExport = exports['.'];
        }
        // If mainExport is not undefined, then
        if (mainExport) {
            // Let resolved be the result of PACKAGE_TARGET_RESOLVE with target = mainExport
            const resolved = await resolvePackageTarget(context, {
                target: mainExport,
                patternMatch: '',
                isImports: false
            });
            // If resolved is not null or undefined, return resolved.
            if (resolved) {
                return resolved;
            }
        }
        // Otherwise, if exports is an Object and all keys of exports start with ".", then
    }
    else if (isMappings(exports)) {
        // Let resolved be the result of PACKAGE_IMPORTS_EXPORTS_RESOLVE
        const resolvedMatch = await resolvePackageImportsExports(context, {
            matchKey: subpath,
            matchObj: exports,
            isImports: false
        });
        // If resolved is not null or undefined, return resolved.
        if (resolvedMatch) {
            return resolvedMatch;
        }
    }
    // Throw a Package Path Not Exported error.
    throw new InvalidModuleSpecifierError(context);
}

async function resolvePackageImports({ importSpecifier, importer, moduleDirs, conditions, resolveId }) {
    const result = await findPackageJson(importer, moduleDirs);
    if (!result) {
        throw new Error(`${createBaseErrorMsg(importSpecifier, importer)}. Could not find a parent package.json.`);
    }
    const { pkgPath, pkgJsonPath, pkgJson } = result;
    const pkgURL = url$2.pathToFileURL(`${pkgPath}/`);
    const context = {
        importer,
        importSpecifier,
        moduleDirs,
        pkgURL,
        pkgJsonPath,
        conditions,
        resolveId
    };
    // Assert: specifier begins with "#".
    if (!importSpecifier.startsWith('#')) {
        throw new InvalidModuleSpecifierError(context, true, 'Invalid import specifier.');
    }
    // If specifier is exactly equal to "#" or starts with "#/", then
    if (importSpecifier === '#' || importSpecifier.startsWith('#/')) {
        // Throw an Invalid Module Specifier error.
        throw new InvalidModuleSpecifierError(context, true, 'Invalid import specifier.');
    }
    const { imports } = pkgJson;
    if (!imports) {
        throw new InvalidModuleSpecifierError(context, true);
    }
    // Let packageURL be the result of LOOKUP_PACKAGE_SCOPE(parentURL).
    // If packageURL is not null, then
    return resolvePackageImportsExports(context, {
        matchKey: importSpecifier,
        matchObj: imports,
        isImports: true
    });
}

const resolveImportPath = require$$3.promisify(resolve$1);
const readFile = require$$3.promisify(fs$7.readFile);

async function getPackageJson(importer, pkgName, resolveOptions, moduleDirectories) {
  if (importer) {
    const selfPackageJsonResult = await findPackageJson(importer, moduleDirectories);
    if (selfPackageJsonResult && selfPackageJsonResult.pkgJson.name === pkgName) {
      // the referenced package name is the current package
      return selfPackageJsonResult;
    }
  }

  try {
    const pkgJsonPath = await resolveImportPath(`${pkgName}/package.json`, resolveOptions);
    const pkgJson = JSON.parse(await readFile(pkgJsonPath, 'utf-8'));
    return { pkgJsonPath, pkgJson, pkgPath: require$$0$2.dirname(pkgJsonPath) };
  } catch (_) {
    return null;
  }
}

async function resolveIdClassic({
  importSpecifier,
  packageInfoCache,
  extensions,
  mainFields,
  preserveSymlinks,
  useBrowserOverrides,
  baseDir,
  moduleDirectories,
  modulePaths,
  rootDir,
  ignoreSideEffectsForRoot
}) {
  let hasModuleSideEffects = () => null;
  let hasPackageEntry = true;
  let packageBrowserField = false;
  let packageInfo;

  const filter = (pkg, pkgPath) => {
    const info = getPackageInfo({
      cache: packageInfoCache,
      extensions,
      pkg,
      pkgPath,
      mainFields,
      preserveSymlinks,
      useBrowserOverrides,
      rootDir,
      ignoreSideEffectsForRoot
    });

    ({ packageInfo, hasModuleSideEffects, hasPackageEntry, packageBrowserField } = info);

    return info.cachedPkg;
  };

  const resolveOptions = {
    basedir: baseDir,
    readFile: readCachedFile,
    isFile: isFileCached,
    isDirectory: isDirCached,
    extensions,
    includeCoreModules: false,
    moduleDirectory: moduleDirectories,
    paths: modulePaths,
    preserveSymlinks,
    packageFilter: filter
  };

  let location;
  try {
    location = await resolveImportPath(importSpecifier, resolveOptions);
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') {
      throw error;
    }
    return null;
  }

  return {
    location: preserveSymlinks ? location : await resolveSymlink(location),
    hasModuleSideEffects,
    hasPackageEntry,
    packageBrowserField,
    packageInfo
  };
}

async function resolveWithExportMap({
  importer,
  importSpecifier,
  exportConditions,
  packageInfoCache,
  extensions,
  mainFields,
  preserveSymlinks,
  useBrowserOverrides,
  baseDir,
  moduleDirectories,
  modulePaths,
  rootDir,
  ignoreSideEffectsForRoot,
  allowExportsFolderMapping
}) {
  if (importSpecifier.startsWith('#')) {
    // this is a package internal import, resolve using package imports field
    const resolveResult = await resolvePackageImports({
      importSpecifier,
      importer,
      moduleDirs: moduleDirectories,
      conditions: exportConditions,
      resolveId(id /* , parent*/) {
        return resolveIdClassic({
          importSpecifier: id,
          packageInfoCache,
          extensions,
          mainFields,
          preserveSymlinks,
          useBrowserOverrides,
          baseDir,
          moduleDirectories,
          modulePaths
        });
      }
    });

    const location = url$2.fileURLToPath(resolveResult);
    return {
      location: preserveSymlinks ? location : await resolveSymlink(location),
      hasModuleSideEffects: () => null,
      hasPackageEntry: true,
      packageBrowserField: false,
      // eslint-disable-next-line no-undefined
      packageInfo: undefined
    };
  }

  const pkgName = getPackageName(importSpecifier);
  if (pkgName) {
    // it's a bare import, find the package.json and resolve using package exports if available
    let hasModuleSideEffects = () => null;
    let hasPackageEntry = true;
    let packageBrowserField = false;
    let packageInfo;

    const filter = (pkg, pkgPath) => {
      const info = getPackageInfo({
        cache: packageInfoCache,
        extensions,
        pkg,
        pkgPath,
        mainFields,
        preserveSymlinks,
        useBrowserOverrides,
        rootDir,
        ignoreSideEffectsForRoot
      });

      ({ packageInfo, hasModuleSideEffects, hasPackageEntry, packageBrowserField } = info);

      return info.cachedPkg;
    };

    const resolveOptions = {
      basedir: baseDir,
      readFile: readCachedFile,
      isFile: isFileCached,
      isDirectory: isDirCached,
      extensions,
      includeCoreModules: false,
      moduleDirectory: moduleDirectories,
      paths: modulePaths,
      preserveSymlinks,
      packageFilter: filter
    };

    const result = await getPackageJson(importer, pkgName, resolveOptions, moduleDirectories);

    if (result && result.pkgJson.exports) {
      const { pkgJson, pkgJsonPath } = result;
      const subpath =
        pkgName === importSpecifier ? '.' : `.${importSpecifier.substring(pkgName.length)}`;
      const pkgDr = pkgJsonPath.replace('package.json', '');
      const pkgURL = url$2.pathToFileURL(pkgDr);

      const context = {
        importer,
        importSpecifier,
        moduleDirs: moduleDirectories,
        pkgURL,
        pkgJsonPath,
        allowExportsFolderMapping,
        conditions: exportConditions
      };
      const resolvedPackageExport = await resolvePackageExports(context, subpath, pkgJson.exports);
      const location = url$2.fileURLToPath(resolvedPackageExport);
      if (location) {
        return {
          location: preserveSymlinks ? location : await resolveSymlink(location),
          hasModuleSideEffects,
          hasPackageEntry,
          packageBrowserField,
          packageInfo
        };
      }
    }
  }

  return null;
}

async function resolveWithClassic({
  importer,
  importSpecifierList,
  exportConditions,
  warn,
  packageInfoCache,
  extensions,
  mainFields,
  preserveSymlinks,
  useBrowserOverrides,
  baseDir,
  moduleDirectories,
  modulePaths,
  rootDir,
  ignoreSideEffectsForRoot
}) {
  for (let i = 0; i < importSpecifierList.length; i++) {
    // eslint-disable-next-line no-await-in-loop
    const result = await resolveIdClassic({
      importer,
      importSpecifier: importSpecifierList[i],
      exportConditions,
      warn,
      packageInfoCache,
      extensions,
      mainFields,
      preserveSymlinks,
      useBrowserOverrides,
      baseDir,
      moduleDirectories,
      modulePaths,
      rootDir,
      ignoreSideEffectsForRoot
    });

    if (result) {
      return result;
    }
  }

  return null;
}

// Resolves to the module if found or `null`.
// The first import specifier will first be attempted with the exports algorithm.
// If this is unsuccessful because export maps are not being used, then all of `importSpecifierList`
// will be tried with the classic resolution algorithm
async function resolveImportSpecifiers({
  importer,
  importSpecifierList,
  exportConditions,
  warn,
  packageInfoCache,
  extensions,
  mainFields,
  preserveSymlinks,
  useBrowserOverrides,
  baseDir,
  moduleDirectories,
  modulePaths,
  rootDir,
  ignoreSideEffectsForRoot,
  allowExportsFolderMapping
}) {
  try {
    const exportMapRes = await resolveWithExportMap({
      importer,
      importSpecifier: importSpecifierList[0],
      exportConditions,
      packageInfoCache,
      extensions,
      mainFields,
      preserveSymlinks,
      useBrowserOverrides,
      baseDir,
      moduleDirectories,
      modulePaths,
      rootDir,
      ignoreSideEffectsForRoot,
      allowExportsFolderMapping
    });
    if (exportMapRes) return exportMapRes;
  } catch (error) {
    if (error instanceof ResolveError) {
      warn(error);
      return null;
    }
    throw error;
  }

  // package has no imports or exports, use classic node resolve
  return resolveWithClassic({
    importer,
    importSpecifierList,
    exportConditions,
    warn,
    packageInfoCache,
    extensions,
    mainFields,
    preserveSymlinks,
    useBrowserOverrides,
    baseDir,
    moduleDirectories,
    modulePaths,
    rootDir,
    ignoreSideEffectsForRoot
  });
}

const versionRegexp = /\^(\d+\.\d+\.\d+)/g;

function validateVersion$1(actualVersion, peerDependencyVersion) {
  let minMajor = Infinity;
  let minMinor = Infinity;
  let minPatch = Infinity;
  let foundVersion;
  // eslint-disable-next-line no-cond-assign
  while ((foundVersion = versionRegexp.exec(peerDependencyVersion))) {
    const [foundMajor, foundMinor, foundPatch] = foundVersion[1].split('.').map(Number);
    if (foundMajor < minMajor) {
      minMajor = foundMajor;
      minMinor = foundMinor;
      minPatch = foundPatch;
    }
  }
  if (!actualVersion) {
    throw new Error(
      `Insufficient Rollup version: "@rollup/plugin-node-resolve" requires at least rollup@${minMajor}.${minMinor}.${minPatch}.`
    );
  }
  const [major, minor, patch] = actualVersion.split('.').map(Number);
  if (
    major < minMajor ||
    (major === minMajor && (minor < minMinor || (minor === minMinor && patch < minPatch)))
  ) {
    throw new Error(
      `Insufficient rollup version: "@rollup/plugin-node-resolve" requires at least rollup@${minMajor}.${minMinor}.${minPatch} but found rollup@${actualVersion}.`
    );
  }
}

/* eslint-disable no-param-reassign, no-shadow, no-undefined */

const ES6_BROWSER_EMPTY = '\0node-resolve:empty.js';
const deepFreeze = (object) => {
  Object.freeze(object);

  for (const value of Object.values(object)) {
    if (typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }

  return object;
};

const baseConditions = ['default', 'module'];
const baseConditionsEsm = [...baseConditions, 'import'];
const baseConditionsCjs = [...baseConditions, 'require'];
const defaults = {
  dedupe: [],
  // It's important that .mjs is listed before .js so that Rollup will interpret npm modules
  // which deploy both ESM .mjs and CommonJS .js files as ESM.
  extensions: ['.mjs', '.js', '.json', '.node'],
  resolveOnly: [],
  moduleDirectories: ['node_modules'],
  modulePaths: [],
  ignoreSideEffectsForRoot: false,
  // TODO: set to false in next major release or remove
  allowExportsFolderMapping: true
};
deepFreeze(deepMerge({}, defaults));

function nodeResolve(opts = {}) {
  const { warnings } = handleDeprecatedOptions(opts);

  const options = { ...defaults, ...opts };
  const { extensions, jail, moduleDirectories, modulePaths, ignoreSideEffectsForRoot } = options;
  const conditionsEsm = [...baseConditionsEsm, ...(options.exportConditions || [])];
  const conditionsCjs = [...baseConditionsCjs, ...(options.exportConditions || [])];
  const packageInfoCache = new Map();
  const idToPackageInfo = new Map();
  const mainFields = getMainFields(options);
  const useBrowserOverrides = mainFields.indexOf('browser') !== -1;
  const isPreferBuiltinsSet = options.preferBuiltins === true || options.preferBuiltins === false;
  const preferBuiltins = isPreferBuiltinsSet ? options.preferBuiltins : true;
  const rootDir = require$$0$2.resolve(options.rootDir || process.cwd());
  let { dedupe } = options;
  let rollupOptions;

  if (moduleDirectories.some((name) => name.includes('/'))) {
    throw new Error(
      '`moduleDirectories` option must only contain directory names. If you want to load modules from somewhere not supported by the default module resolution algorithm, see `modulePaths`.'
    );
  }

  if (typeof dedupe !== 'function') {
    dedupe = (importee) =>
      options.dedupe.includes(importee) || options.dedupe.includes(getPackageName(importee));
  }

  // creates a function from the patterns to test if a particular module should be bundled.
  const allowPatterns = (patterns) => {
    const regexPatterns = patterns.map((pattern) => {
      if (pattern instanceof RegExp) {
        return pattern;
      }
      const normalized = pattern.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
      return new RegExp(`^${normalized}$`);
    });
    return (id) => !regexPatterns.length || regexPatterns.some((pattern) => pattern.test(id));
  };

  const resolveOnly =
    typeof options.resolveOnly === 'function'
      ? options.resolveOnly
      : allowPatterns(options.resolveOnly);

  const browserMapCache = new Map();
  let preserveSymlinks;

  const resolveLikeNode = async (context, importee, importer, custom) => {
    // strip query params from import
    const [importPath, params] = importee.split('?');
    const importSuffix = `${params ? `?${params}` : ''}`;
    importee = importPath;

    const baseDir = !importer || dedupe(importee) ? rootDir : require$$0$2.dirname(importer);

    // https://github.com/defunctzombie/package-browser-field-spec
    const browser = browserMapCache.get(importer);
    if (useBrowserOverrides && browser) {
      const resolvedImportee = require$$0$2.resolve(baseDir, importee);
      if (browser[importee] === false || browser[resolvedImportee] === false) {
        return { id: ES6_BROWSER_EMPTY };
      }
      const browserImportee =
        (importee[0] !== '.' && browser[importee]) ||
        browser[resolvedImportee] ||
        browser[`${resolvedImportee}.js`] ||
        browser[`${resolvedImportee}.json`];
      if (browserImportee) {
        importee = browserImportee;
      }
    }

    const parts = importee.split(/[/\\]/);
    let id = parts.shift();
    let isRelativeImport = false;

    if (id[0] === '@' && parts.length > 0) {
      // scoped packages
      id += `/${parts.shift()}`;
    } else if (id[0] === '.') {
      // an import relative to the parent dir of the importer
      id = require$$0$2.resolve(baseDir, importee);
      isRelativeImport = true;
    }

    // if it's not a relative import, and it's not requested, reject it.
    if (!isRelativeImport && !resolveOnly(id)) {
      if (normalizeInput(rollupOptions.input).includes(importee)) {
        return null;
      }
      return false;
    }

    const importSpecifierList = [importee];

    if (importer === undefined && !importee[0].match(/^\.?\.?\//)) {
      // For module graph roots (i.e. when importer is undefined), we
      // need to handle 'path fragments` like `foo/bar` that are commonly
      // found in rollup config files. If importee doesn't look like a
      // relative or absolute path, we make it relative and attempt to
      // resolve it.
      importSpecifierList.push(`./${importee}`);
    }

    // TypeScript files may import '.mjs' or '.cjs' to refer to either '.mts' or '.cts'.
    // They may also import .js to refer to either .ts or .tsx, and .jsx to refer to .tsx.
    if (importer && /\.(ts|mts|cts|tsx)$/.test(importer)) {
      for (const [importeeExt, resolvedExt] of [
        ['.js', '.ts'],
        ['.js', '.tsx'],
        ['.jsx', '.tsx'],
        ['.mjs', '.mts'],
        ['.cjs', '.cts']
      ]) {
        if (importee.endsWith(importeeExt) && extensions.includes(resolvedExt)) {
          importSpecifierList.push(importee.slice(0, -importeeExt.length) + resolvedExt);
        }
      }
    }

    const warn = (...args) => context.warn(...args);
    const isRequire = custom && custom['node-resolve'] && custom['node-resolve'].isRequire;
    const exportConditions = isRequire ? conditionsCjs : conditionsEsm;

    if (useBrowserOverrides && !exportConditions.includes('browser'))
      exportConditions.push('browser');

    const resolvedWithoutBuiltins = await resolveImportSpecifiers({
      importer,
      importSpecifierList,
      exportConditions,
      warn,
      packageInfoCache,
      extensions,
      mainFields,
      preserveSymlinks,
      useBrowserOverrides,
      baseDir,
      moduleDirectories,
      modulePaths,
      rootDir,
      ignoreSideEffectsForRoot,
      allowExportsFolderMapping: options.allowExportsFolderMapping
    });

    const importeeIsBuiltin = isBuiltinModule$1(importee);
    const resolved =
      importeeIsBuiltin && preferBuiltins
        ? {
            packageInfo: undefined,
            hasModuleSideEffects: () => null,
            hasPackageEntry: true,
            packageBrowserField: false
          }
        : resolvedWithoutBuiltins;
    if (!resolved) {
      return null;
    }

    const { packageInfo, hasModuleSideEffects, hasPackageEntry, packageBrowserField } = resolved;
    let { location } = resolved;
    if (packageBrowserField) {
      if (Object.prototype.hasOwnProperty.call(packageBrowserField, location)) {
        if (!packageBrowserField[location]) {
          browserMapCache.set(location, packageBrowserField);
          return { id: ES6_BROWSER_EMPTY };
        }
        location = packageBrowserField[location];
      }
      browserMapCache.set(location, packageBrowserField);
    }

    if (hasPackageEntry && !preserveSymlinks) {
      const exists = await fileExists(location);
      if (exists) {
        location = await realpath$1(location);
      }
    }

    idToPackageInfo.set(location, packageInfo);

    if (hasPackageEntry) {
      if (importeeIsBuiltin && preferBuiltins) {
        if (!isPreferBuiltinsSet && resolvedWithoutBuiltins && resolved !== importee) {
          context.warn(
            `preferring built-in module '${importee}' over local alternative at '${resolvedWithoutBuiltins.location}', pass 'preferBuiltins: false' to disable this behavior or 'preferBuiltins: true' to disable this warning`
          );
        }
        return false;
      } else if (jail && location.indexOf(require$$0$2.normalize(jail.trim(require$$0$2.sep))) !== 0) {
        return null;
      }
    }

    if (options.modulesOnly && (await fileExists(location))) {
      const code = await readFile$1(location, 'utf-8');
      if (isModule$1(code)) {
        return {
          id: `${location}${importSuffix}`,
          moduleSideEffects: hasModuleSideEffects(location)
        };
      }
      return null;
    }
    return {
      id: `${location}${importSuffix}`,
      moduleSideEffects: hasModuleSideEffects(location)
    };
  };

  return {
    name: 'node-resolve',

    version: version$2,

    buildStart(buildOptions) {
      validateVersion$1(this.meta.rollupVersion, peerDependencies$1.rollup);
      rollupOptions = buildOptions;

      for (const warning of warnings) {
        this.warn(warning);
      }

      ({ preserveSymlinks } = buildOptions);
    },

    generateBundle() {
      readCachedFile.clear();
      isFileCached.clear();
      isDirCached.clear();
    },

    resolveId: {
      order: 'post',
      async handler(importee, importer, resolveOptions) {
        if (importee === ES6_BROWSER_EMPTY) {
          return importee;
        }
        // ignore IDs with null character, these belong to other plugins
        if (/\0/.test(importee)) return null;

        const { custom = {} } = resolveOptions;
        const { 'node-resolve': { resolved: alreadyResolved } = {} } = custom;
        if (alreadyResolved) {
          return alreadyResolved;
        }

        if (/\0/.test(importer)) {
          importer = undefined;
        }

        const resolved = await resolveLikeNode(this, importee, importer, custom);
        if (resolved) {
          // This way, plugins may attach additional meta information to the
          // resolved id or make it external. We do not skip node-resolve here
          // because another plugin might again use `this.resolve` in its
          // `resolveId` hook, in which case we want to add the correct
          // `moduleSideEffects` information.
          const resolvedResolved = await this.resolve(resolved.id, importer, {
            ...resolveOptions,
            skipSelf: false,
            custom: { ...custom, 'node-resolve': { ...custom['node-resolve'], resolved, importee } }
          });
          if (resolvedResolved) {
            // Handle plugins that manually make the result external
            if (resolvedResolved.external) {
              return false;
            }
            // Allow other plugins to take over resolution. Rollup core will not
            // change the id if it corresponds to an existing file
            if (resolvedResolved.id !== resolved.id) {
              return resolvedResolved;
            }
            // Pass on meta information added by other plugins
            return { ...resolved, meta: resolvedResolved.meta };
          }
        }
        return resolved;
      }
    },

    load(importee) {
      if (importee === ES6_BROWSER_EMPTY) {
        return 'export default {};';
      }
      return null;
    },

    getPackageInfoForId(id) {
      return idToPackageInfo.get(id);
    }
  };
}

var path$3 = require$$0$2;

var commondir = function (basedir, relfiles) {
    if (relfiles) {
        var files = relfiles.map(function (r) {
            return path$3.resolve(basedir, r);
        });
    }
    else {
        var files = basedir;
    }
    
    var res = files.slice(1).reduce(function (ps, file) {
        if (!file.match(/^([A-Za-z]:)?\/|\\/)) {
            throw new Error('relative path without a basedir');
        }
        
        var xs = file.split(/\/+|\\+/);
        for (
            var i = 0;
            ps[i] === xs[i] && i < Math.min(ps.length, xs.length);
            i++
        );
        return ps.slice(0, i);
    }, files[0].split(/\/+|\\+/));
    
    // Windows correctly handles paths with forward-slashes
    return res.length > 1 ? res.join('/') : '/'
};

var getCommonDir = /*@__PURE__*/getDefaultExportFromCjs(commondir);

var old$1 = {};

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var pathModule = require$$0$2;
var isWindows$1 = process.platform === 'win32';
var fs$2 = fs$7;

// JavaScript implementation of realpath, ported from node pre-v6

var DEBUG = process.env.NODE_DEBUG && /fs/.test(process.env.NODE_DEBUG);

function rethrow() {
  // Only enable in debug mode. A backtrace uses ~1000 bytes of heap space and
  // is fairly slow to generate.
  var callback;
  if (DEBUG) {
    var backtrace = new Error;
    callback = debugCallback;
  } else
    callback = missingCallback;

  return callback;

  function debugCallback(err) {
    if (err) {
      backtrace.message = err.message;
      err = backtrace;
      missingCallback(err);
    }
  }

  function missingCallback(err) {
    if (err) {
      if (process.throwDeprecation)
        throw err;  // Forgot a callback but don't know where? Use NODE_DEBUG=fs
      else if (!process.noDeprecation) {
        var msg = 'fs: missing callback ' + (err.stack || err.message);
        if (process.traceDeprecation)
          console.trace(msg);
        else
          console.error(msg);
      }
    }
  }
}

function maybeCallback(cb) {
  return typeof cb === 'function' ? cb : rethrow();
}

pathModule.normalize;

// Regexp that finds the next partion of a (partial) path
// result is [base_with_slash, base], e.g. ['somedir/', 'somedir']
if (isWindows$1) {
  var nextPartRe = /(.*?)(?:[\/\\]+|$)/g;
} else {
  var nextPartRe = /(.*?)(?:[\/]+|$)/g;
}

// Regex to find the device root, including trailing slash. E.g. 'c:\\'.
if (isWindows$1) {
  var splitRootRe = /^(?:[a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/][^\\\/]+)?[\\\/]*/;
} else {
  var splitRootRe = /^[\/]*/;
}

old$1.realpathSync = function realpathSync(p, cache) {
  // make p is absolute
  p = pathModule.resolve(p);

  if (cache && Object.prototype.hasOwnProperty.call(cache, p)) {
    return cache[p];
  }

  var original = p,
      seenLinks = {},
      knownHard = {};

  // current character position in p
  var pos;
  // the partial path so far, including a trailing slash if any
  var current;
  // the partial path without a trailing slash (except when pointing at a root)
  var base;
  // the partial path scanned in the previous round, with slash
  var previous;

  start();

  function start() {
    // Skip over roots
    var m = splitRootRe.exec(p);
    pos = m[0].length;
    current = m[0];
    base = m[0];
    previous = '';

    // On windows, check that the root exists. On unix there is no need.
    if (isWindows$1 && !knownHard[base]) {
      fs$2.lstatSync(base);
      knownHard[base] = true;
    }
  }

  // walk down the path, swapping out linked pathparts for their real
  // values
  // NB: p.length changes.
  while (pos < p.length) {
    // find the next part
    nextPartRe.lastIndex = pos;
    var result = nextPartRe.exec(p);
    previous = current;
    current += result[0];
    base = previous + result[1];
    pos = nextPartRe.lastIndex;

    // continue if not a symlink
    if (knownHard[base] || (cache && cache[base] === base)) {
      continue;
    }

    var resolvedLink;
    if (cache && Object.prototype.hasOwnProperty.call(cache, base)) {
      // some known symbolic link.  no need to stat again.
      resolvedLink = cache[base];
    } else {
      var stat = fs$2.lstatSync(base);
      if (!stat.isSymbolicLink()) {
        knownHard[base] = true;
        if (cache) cache[base] = base;
        continue;
      }

      // read the link if it wasn't read before
      // dev/ino always return 0 on windows, so skip the check.
      var linkTarget = null;
      if (!isWindows$1) {
        var id = stat.dev.toString(32) + ':' + stat.ino.toString(32);
        if (seenLinks.hasOwnProperty(id)) {
          linkTarget = seenLinks[id];
        }
      }
      if (linkTarget === null) {
        fs$2.statSync(base);
        linkTarget = fs$2.readlinkSync(base);
      }
      resolvedLink = pathModule.resolve(previous, linkTarget);
      // track this, if given a cache.
      if (cache) cache[base] = resolvedLink;
      if (!isWindows$1) seenLinks[id] = linkTarget;
    }

    // resolve the link, then start over
    p = pathModule.resolve(resolvedLink, p.slice(pos));
    start();
  }

  if (cache) cache[original] = p;

  return p;
};


old$1.realpath = function realpath(p, cache, cb) {
  if (typeof cb !== 'function') {
    cb = maybeCallback(cache);
    cache = null;
  }

  // make p is absolute
  p = pathModule.resolve(p);

  if (cache && Object.prototype.hasOwnProperty.call(cache, p)) {
    return process.nextTick(cb.bind(null, null, cache[p]));
  }

  var original = p,
      seenLinks = {},
      knownHard = {};

  // current character position in p
  var pos;
  // the partial path so far, including a trailing slash if any
  var current;
  // the partial path without a trailing slash (except when pointing at a root)
  var base;
  // the partial path scanned in the previous round, with slash
  var previous;

  start();

  function start() {
    // Skip over roots
    var m = splitRootRe.exec(p);
    pos = m[0].length;
    current = m[0];
    base = m[0];
    previous = '';

    // On windows, check that the root exists. On unix there is no need.
    if (isWindows$1 && !knownHard[base]) {
      fs$2.lstat(base, function(err) {
        if (err) return cb(err);
        knownHard[base] = true;
        LOOP();
      });
    } else {
      process.nextTick(LOOP);
    }
  }

  // walk down the path, swapping out linked pathparts for their real
  // values
  function LOOP() {
    // stop if scanned past end of path
    if (pos >= p.length) {
      if (cache) cache[original] = p;
      return cb(null, p);
    }

    // find the next part
    nextPartRe.lastIndex = pos;
    var result = nextPartRe.exec(p);
    previous = current;
    current += result[0];
    base = previous + result[1];
    pos = nextPartRe.lastIndex;

    // continue if not a symlink
    if (knownHard[base] || (cache && cache[base] === base)) {
      return process.nextTick(LOOP);
    }

    if (cache && Object.prototype.hasOwnProperty.call(cache, base)) {
      // known symbolic link.  no need to stat again.
      return gotResolvedLink(cache[base]);
    }

    return fs$2.lstat(base, gotStat);
  }

  function gotStat(err, stat) {
    if (err) return cb(err);

    // if not a symlink, skip to the next path part
    if (!stat.isSymbolicLink()) {
      knownHard[base] = true;
      if (cache) cache[base] = base;
      return process.nextTick(LOOP);
    }

    // stat & read the link if not read before
    // call gotTarget as soon as the link target is known
    // dev/ino always return 0 on windows, so skip the check.
    if (!isWindows$1) {
      var id = stat.dev.toString(32) + ':' + stat.ino.toString(32);
      if (seenLinks.hasOwnProperty(id)) {
        return gotTarget(null, seenLinks[id], base);
      }
    }
    fs$2.stat(base, function(err) {
      if (err) return cb(err);

      fs$2.readlink(base, function(err, target) {
        if (!isWindows$1) seenLinks[id] = target;
        gotTarget(err, target);
      });
    });
  }

  function gotTarget(err, target, base) {
    if (err) return cb(err);

    var resolvedLink = pathModule.resolve(previous, target);
    if (cache) cache[base] = resolvedLink;
    gotResolvedLink(resolvedLink);
  }

  function gotResolvedLink(resolvedLink) {
    // resolve the link, then start over
    p = pathModule.resolve(resolvedLink, p.slice(pos));
    start();
  }
};

var fs_realpath = realpath;
realpath.realpath = realpath;
realpath.sync = realpathSync;
realpath.realpathSync = realpathSync;
realpath.monkeypatch = monkeypatch;
realpath.unmonkeypatch = unmonkeypatch;

var fs$1 = fs$7;
var origRealpath = fs$1.realpath;
var origRealpathSync = fs$1.realpathSync;

var version$1 = process.version;
var ok = /^v[0-5]\./.test(version$1);
var old = old$1;

function newError (er) {
  return er && er.syscall === 'realpath' && (
    er.code === 'ELOOP' ||
    er.code === 'ENOMEM' ||
    er.code === 'ENAMETOOLONG'
  )
}

function realpath (p, cache, cb) {
  if (ok) {
    return origRealpath(p, cache, cb)
  }

  if (typeof cache === 'function') {
    cb = cache;
    cache = null;
  }
  origRealpath(p, cache, function (er, result) {
    if (newError(er)) {
      old.realpath(p, cache, cb);
    } else {
      cb(er, result);
    }
  });
}

function realpathSync (p, cache) {
  if (ok) {
    return origRealpathSync(p, cache)
  }

  try {
    return origRealpathSync(p, cache)
  } catch (er) {
    if (newError(er)) {
      return old.realpathSync(p, cache)
    } else {
      throw er
    }
  }
}

function monkeypatch () {
  fs$1.realpath = realpath;
  fs$1.realpathSync = realpathSync;
}

function unmonkeypatch () {
  fs$1.realpath = origRealpath;
  fs$1.realpathSync = origRealpathSync;
}

const isWindows = typeof process === 'object' &&
  process &&
  process.platform === 'win32';
var path$2 = isWindows ? { sep: '\\' } : { sep: '/' };

var balancedMatch = balanced$1;
function balanced$1(a, b, str) {
  if (a instanceof RegExp) a = maybeMatch(a, str);
  if (b instanceof RegExp) b = maybeMatch(b, str);

  var r = range(a, b, str);

  return r && {
    start: r[0],
    end: r[1],
    pre: str.slice(0, r[0]),
    body: str.slice(r[0] + a.length, r[1]),
    post: str.slice(r[1] + b.length)
  };
}

function maybeMatch(reg, str) {
  var m = str.match(reg);
  return m ? m[0] : null;
}

balanced$1.range = range;
function range(a, b, str) {
  var begs, beg, left, right, result;
  var ai = str.indexOf(a);
  var bi = str.indexOf(b, ai + 1);
  var i = ai;

  if (ai >= 0 && bi > 0) {
    if(a===b) {
      return [ai, bi];
    }
    begs = [];
    left = str.length;

    while (i >= 0 && !result) {
      if (i == ai) {
        begs.push(i);
        ai = str.indexOf(a, i + 1);
      } else if (begs.length == 1) {
        result = [ begs.pop(), bi ];
      } else {
        beg = begs.pop();
        if (beg < left) {
          left = beg;
          right = bi;
        }

        bi = str.indexOf(b, i + 1);
      }

      i = ai < bi && ai >= 0 ? ai : bi;
    }

    if (begs.length) {
      result = [ left, right ];
    }
  }

  return result;
}

var balanced = balancedMatch;

var braceExpansion = expandTop;

var escSlash = '\0SLASH'+Math.random()+'\0';
var escOpen = '\0OPEN'+Math.random()+'\0';
var escClose = '\0CLOSE'+Math.random()+'\0';
var escComma = '\0COMMA'+Math.random()+'\0';
var escPeriod = '\0PERIOD'+Math.random()+'\0';

function numeric(str) {
  return parseInt(str, 10) == str
    ? parseInt(str, 10)
    : str.charCodeAt(0);
}

function escapeBraces(str) {
  return str.split('\\\\').join(escSlash)
            .split('\\{').join(escOpen)
            .split('\\}').join(escClose)
            .split('\\,').join(escComma)
            .split('\\.').join(escPeriod);
}

function unescapeBraces(str) {
  return str.split(escSlash).join('\\')
            .split(escOpen).join('{')
            .split(escClose).join('}')
            .split(escComma).join(',')
            .split(escPeriod).join('.');
}


// Basically just str.split(","), but handling cases
// where we have nested braced sections, which should be
// treated as individual members, like {a,{b,c},d}
function parseCommaParts(str) {
  if (!str)
    return [''];

  var parts = [];
  var m = balanced('{', '}', str);

  if (!m)
    return str.split(',');

  var pre = m.pre;
  var body = m.body;
  var post = m.post;
  var p = pre.split(',');

  p[p.length-1] += '{' + body + '}';
  var postParts = parseCommaParts(post);
  if (post.length) {
    p[p.length-1] += postParts.shift();
    p.push.apply(p, postParts);
  }

  parts.push.apply(parts, p);

  return parts;
}

function expandTop(str) {
  if (!str)
    return [];

  // I don't know why Bash 4.3 does this, but it does.
  // Anything starting with {} will have the first two bytes preserved
  // but *only* at the top level, so {},a}b will not expand to anything,
  // but a{},b}c will be expanded to [a}c,abc].
  // One could argue that this is a bug in Bash, but since the goal of
  // this module is to match Bash's rules, we escape a leading {}
  if (str.substr(0, 2) === '{}') {
    str = '\\{\\}' + str.substr(2);
  }

  return expand$1(escapeBraces(str), true).map(unescapeBraces);
}

function embrace(str) {
  return '{' + str + '}';
}
function isPadded(el) {
  return /^-?0\d/.test(el);
}

function lte(i, y) {
  return i <= y;
}
function gte(i, y) {
  return i >= y;
}

function expand$1(str, isTop) {
  var expansions = [];

  var m = balanced('{', '}', str);
  if (!m) return [str];

  // no need to expand pre, since it is guaranteed to be free of brace-sets
  var pre = m.pre;
  var post = m.post.length
    ? expand$1(m.post, false)
    : [''];

  if (/\$$/.test(m.pre)) {    
    for (var k = 0; k < post.length; k++) {
      var expansion = pre+ '{' + m.body + '}' + post[k];
      expansions.push(expansion);
    }
  } else {
    var isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
    var isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
    var isSequence = isNumericSequence || isAlphaSequence;
    var isOptions = m.body.indexOf(',') >= 0;
    if (!isSequence && !isOptions) {
      // {a},b}
      if (m.post.match(/,.*\}/)) {
        str = m.pre + '{' + m.body + escClose + m.post;
        return expand$1(str);
      }
      return [str];
    }

    var n;
    if (isSequence) {
      n = m.body.split(/\.\./);
    } else {
      n = parseCommaParts(m.body);
      if (n.length === 1) {
        // x{{a,b}}y ==> x{a}y x{b}y
        n = expand$1(n[0], false).map(embrace);
        if (n.length === 1) {
          return post.map(function(p) {
            return m.pre + n[0] + p;
          });
        }
      }
    }

    // at this point, n is the parts, and we know it's not a comma set
    // with a single entry.
    var N;

    if (isSequence) {
      var x = numeric(n[0]);
      var y = numeric(n[1]);
      var width = Math.max(n[0].length, n[1].length);
      var incr = n.length == 3
        ? Math.abs(numeric(n[2]))
        : 1;
      var test = lte;
      var reverse = y < x;
      if (reverse) {
        incr *= -1;
        test = gte;
      }
      var pad = n.some(isPadded);

      N = [];

      for (var i = x; test(i, y); i += incr) {
        var c;
        if (isAlphaSequence) {
          c = String.fromCharCode(i);
          if (c === '\\')
            c = '';
        } else {
          c = String(i);
          if (pad) {
            var need = width - c.length;
            if (need > 0) {
              var z = new Array(need + 1).join('0');
              if (i < 0)
                c = '-' + z + c.slice(1);
              else
                c = z + c;
            }
          }
        }
        N.push(c);
      }
    } else {
      N = [];

      for (var j = 0; j < n.length; j++) {
        N.push.apply(N, expand$1(n[j], false));
      }
    }

    for (var j = 0; j < N.length; j++) {
      for (var k = 0; k < post.length; k++) {
        var expansion = pre + N[j] + post[k];
        if (!isTop || isSequence || expansion)
          expansions.push(expansion);
      }
    }
  }

  return expansions;
}

const minimatch$1 = minimatch_1 = (p, pattern, options = {}) => {
  assertValidPattern(pattern);

  // shortcut: comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    return false
  }

  return new Minimatch$1(pattern, options).match(p)
};

var minimatch_1 = minimatch$1;

const path$1 = path$2;
minimatch$1.sep = path$1.sep;

const GLOBSTAR = Symbol('globstar **');
minimatch$1.GLOBSTAR = GLOBSTAR;
const expand = braceExpansion;

const plTypes = {
  '!': { open: '(?:(?!(?:', close: '))[^/]*?)'},
  '?': { open: '(?:', close: ')?' },
  '+': { open: '(?:', close: ')+' },
  '*': { open: '(?:', close: ')*' },
  '@': { open: '(?:', close: ')' }
};

// any single thing other than /
// don't need to escape / when using new RegExp()
const qmark = '[^/]';

// * => any number of characters
const star = qmark + '*?';

// ** when dots are allowed.  Anything goes, except .. and .
// not (^ or / followed by one or two dots followed by $ or /),
// followed by anything, any number of times.
const twoStarDot = '(?:(?!(?:\\\/|^)(?:\\.{1,2})($|\\\/)).)*?';

// not a ^ or / followed by a dot,
// followed by anything, any number of times.
const twoStarNoDot = '(?:(?!(?:\\\/|^)\\.).)*?';

// "abc" -> { a:true, b:true, c:true }
const charSet = s => s.split('').reduce((set, c) => {
  set[c] = true;
  return set
}, {});

// characters that need to be escaped in RegExp.
const reSpecials = charSet('().*{}+?[]^$\\!');

// characters that indicate we have to add the pattern start
const addPatternStartSet = charSet('[.(');

// normalizes slashes.
const slashSplit = /\/+/;

minimatch$1.filter = (pattern, options = {}) =>
  (p, i, list) => minimatch$1(p, pattern, options);

const ext = (a, b = {}) => {
  const t = {};
  Object.keys(a).forEach(k => t[k] = a[k]);
  Object.keys(b).forEach(k => t[k] = b[k]);
  return t
};

minimatch$1.defaults = def => {
  if (!def || typeof def !== 'object' || !Object.keys(def).length) {
    return minimatch$1
  }

  const orig = minimatch$1;

  const m = (p, pattern, options) => orig(p, pattern, ext(def, options));
  m.Minimatch = class Minimatch extends orig.Minimatch {
    constructor (pattern, options) {
      super(pattern, ext(def, options));
    }
  };
  m.Minimatch.defaults = options => orig.defaults(ext(def, options)).Minimatch;
  m.filter = (pattern, options) => orig.filter(pattern, ext(def, options));
  m.defaults = options => orig.defaults(ext(def, options));
  m.makeRe = (pattern, options) => orig.makeRe(pattern, ext(def, options));
  m.braceExpand = (pattern, options) => orig.braceExpand(pattern, ext(def, options));
  m.match = (list, pattern, options) => orig.match(list, pattern, ext(def, options));

  return m
};





// Brace expansion:
// a{b,c}d -> abd acd
// a{b,}c -> abc ac
// a{0..3}d -> a0d a1d a2d a3d
// a{b,c{d,e}f}g -> abg acdfg acefg
// a{b,c}d{e,f}g -> abdeg acdeg abdeg abdfg
//
// Invalid sets are not expanded.
// a{2..}b -> a{2..}b
// a{b}c -> a{b}c
minimatch$1.braceExpand = (pattern, options) => braceExpand(pattern, options);

const braceExpand = (pattern, options = {}) => {
  assertValidPattern(pattern);

  // Thanks to Yeting Li <https://github.com/yetingli> for
  // improving this regexp to avoid a ReDOS vulnerability.
  if (options.nobrace || !/\{(?:(?!\{).)*\}/.test(pattern)) {
    // shortcut. no need to expand.
    return [pattern]
  }

  return expand(pattern)
};

const MAX_PATTERN_LENGTH = 1024 * 64;
const assertValidPattern = pattern => {
  if (typeof pattern !== 'string') {
    throw new TypeError('invalid pattern')
  }

  if (pattern.length > MAX_PATTERN_LENGTH) {
    throw new TypeError('pattern is too long')
  }
};

// parse a component of the expanded set.
// At this point, no pattern may contain "/" in it
// so we're going to return a 2d array, where each entry is the full
// pattern, split on '/', and then turned into a regular expression.
// A regexp is made at the end which joins each array with an
// escaped /, and another full one which joins each regexp with |.
//
// Following the lead of Bash 4.1, note that "**" only has special meaning
// when it is the *only* thing in a path portion.  Otherwise, any series
// of * is equivalent to a single *.  Globstar behavior is enabled by
// default, and can be disabled by setting options.noglobstar.
const SUBPARSE = Symbol('subparse');

minimatch$1.makeRe = (pattern, options) =>
  new Minimatch$1(pattern, options || {}).makeRe();

minimatch$1.match = (list, pattern, options = {}) => {
  const mm = new Minimatch$1(pattern, options);
  list = list.filter(f => mm.match(f));
  if (mm.options.nonull && !list.length) {
    list.push(pattern);
  }
  return list
};

// replace stuff like \* with *
const globUnescape = s => s.replace(/\\(.)/g, '$1');
const charUnescape = s => s.replace(/\\([^-\]])/g, '$1');
const regExpEscape = s => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
const braExpEscape = s => s.replace(/[[\]\\]/g, '\\$&');

let Minimatch$1 = class Minimatch {
  constructor (pattern, options) {
    assertValidPattern(pattern);

    if (!options) options = {};

    this.options = options;
    this.set = [];
    this.pattern = pattern;
    this.windowsPathsNoEscape = !!options.windowsPathsNoEscape ||
      options.allowWindowsEscape === false;
    if (this.windowsPathsNoEscape) {
      this.pattern = this.pattern.replace(/\\/g, '/');
    }
    this.regexp = null;
    this.negate = false;
    this.comment = false;
    this.empty = false;
    this.partial = !!options.partial;

    // make the set of regexps etc.
    this.make();
  }

  debug () {}

  make () {
    const pattern = this.pattern;
    const options = this.options;

    // empty patterns and comments match nothing.
    if (!options.nocomment && pattern.charAt(0) === '#') {
      this.comment = true;
      return
    }
    if (!pattern) {
      this.empty = true;
      return
    }

    // step 1: figure out negation, etc.
    this.parseNegate();

    // step 2: expand braces
    let set = this.globSet = this.braceExpand();

    if (options.debug) this.debug = (...args) => console.error(...args);

    this.debug(this.pattern, set);

    // step 3: now we have a set, so turn each one into a series of path-portion
    // matching patterns.
    // These will be regexps, except in the case of "**", which is
    // set to the GLOBSTAR object for globstar behavior,
    // and will not contain any / characters
    set = this.globParts = set.map(s => s.split(slashSplit));

    this.debug(this.pattern, set);

    // glob --> regexps
    set = set.map((s, si, set) => s.map(this.parse, this));

    this.debug(this.pattern, set);

    // filter out everything that didn't compile properly.
    set = set.filter(s => s.indexOf(false) === -1);

    this.debug(this.pattern, set);

    this.set = set;
  }

  parseNegate () {
    if (this.options.nonegate) return

    const pattern = this.pattern;
    let negate = false;
    let negateOffset = 0;

    for (let i = 0; i < pattern.length && pattern.charAt(i) === '!'; i++) {
      negate = !negate;
      negateOffset++;
    }

    if (negateOffset) this.pattern = pattern.slice(negateOffset);
    this.negate = negate;
  }

  // set partial to true to test if, for example,
  // "/a/b" matches the start of "/*/b/*/d"
  // Partial means, if you run out of file before you run
  // out of pattern, then that's fine, as long as all
  // the parts match.
  matchOne (file, pattern, partial) {
    var options = this.options;

    this.debug('matchOne',
      { 'this': this, file: file, pattern: pattern });

    this.debug('matchOne', file.length, pattern.length);

    for (var fi = 0,
        pi = 0,
        fl = file.length,
        pl = pattern.length
        ; (fi < fl) && (pi < pl)
        ; fi++, pi++) {
      this.debug('matchOne loop');
      var p = pattern[pi];
      var f = file[fi];

      this.debug(pattern, p, f);

      // should be impossible.
      // some invalid regexp stuff in the set.
      /* istanbul ignore if */
      if (p === false) return false

      if (p === GLOBSTAR) {
        this.debug('GLOBSTAR', [pattern, p, f]);

        // "**"
        // a/**/b/**/c would match the following:
        // a/b/x/y/z/c
        // a/x/y/z/b/c
        // a/b/x/b/x/c
        // a/b/c
        // To do this, take the rest of the pattern after
        // the **, and see if it would match the file remainder.
        // If so, return success.
        // If not, the ** "swallows" a segment, and try again.
        // This is recursively awful.
        //
        // a/**/b/**/c matching a/b/x/y/z/c
        // - a matches a
        // - doublestar
        //   - matchOne(b/x/y/z/c, b/**/c)
        //     - b matches b
        //     - doublestar
        //       - matchOne(x/y/z/c, c) -> no
        //       - matchOne(y/z/c, c) -> no
        //       - matchOne(z/c, c) -> no
        //       - matchOne(c, c) yes, hit
        var fr = fi;
        var pr = pi + 1;
        if (pr === pl) {
          this.debug('** at the end');
          // a ** at the end will just swallow the rest.
          // We have found a match.
          // however, it will not swallow /.x, unless
          // options.dot is set.
          // . and .. are *never* matched by **, for explosively
          // exponential reasons.
          for (; fi < fl; fi++) {
            if (file[fi] === '.' || file[fi] === '..' ||
              (!options.dot && file[fi].charAt(0) === '.')) return false
          }
          return true
        }

        // ok, let's see if we can swallow whatever we can.
        while (fr < fl) {
          var swallowee = file[fr];

          this.debug('\nglobstar while', file, fr, pattern, pr, swallowee);

          // XXX remove this slice.  Just pass the start index.
          if (this.matchOne(file.slice(fr), pattern.slice(pr), partial)) {
            this.debug('globstar found match!', fr, fl, swallowee);
            // found a match.
            return true
          } else {
            // can't swallow "." or ".." ever.
            // can only swallow ".foo" when explicitly asked.
            if (swallowee === '.' || swallowee === '..' ||
              (!options.dot && swallowee.charAt(0) === '.')) {
              this.debug('dot detected!', file, fr, pattern, pr);
              break
            }

            // ** swallows a segment, and continue.
            this.debug('globstar swallow a segment, and continue');
            fr++;
          }
        }

        // no match was found.
        // However, in partial mode, we can't say this is necessarily over.
        // If there's more *pattern* left, then
        /* istanbul ignore if */
        if (partial) {
          // ran out of file
          this.debug('\n>>> no match, partial?', file, fr, pattern, pr);
          if (fr === fl) return true
        }
        return false
      }

      // something other than **
      // non-magic patterns just have to match exactly
      // patterns with magic have been turned into regexps.
      var hit;
      if (typeof p === 'string') {
        hit = f === p;
        this.debug('string match', p, f, hit);
      } else {
        hit = f.match(p);
        this.debug('pattern match', p, f, hit);
      }

      if (!hit) return false
    }

    // Note: ending in / means that we'll get a final ""
    // at the end of the pattern.  This can only match a
    // corresponding "" at the end of the file.
    // If the file ends in /, then it can only match a
    // a pattern that ends in /, unless the pattern just
    // doesn't have any more for it. But, a/b/ should *not*
    // match "a/b/*", even though "" matches against the
    // [^/]*? pattern, except in partial mode, where it might
    // simply not be reached yet.
    // However, a/b/ should still satisfy a/*

    // now either we fell off the end of the pattern, or we're done.
    if (fi === fl && pi === pl) {
      // ran out of pattern and filename at the same time.
      // an exact hit!
      return true
    } else if (fi === fl) {
      // ran out of file, but still had pattern left.
      // this is ok if we're doing the match as part of
      // a glob fs traversal.
      return partial
    } else /* istanbul ignore else */ if (pi === pl) {
      // ran out of pattern, still have file left.
      // this is only acceptable if we're on the very last
      // empty segment of a file with a trailing slash.
      // a/* should match a/b/
      return (fi === fl - 1) && (file[fi] === '')
    }

    // should be unreachable.
    /* istanbul ignore next */
    throw new Error('wtf?')
  }

  braceExpand () {
    return braceExpand(this.pattern, this.options)
  }

  parse (pattern, isSub) {
    assertValidPattern(pattern);

    const options = this.options;

    // shortcuts
    if (pattern === '**') {
      if (!options.noglobstar)
        return GLOBSTAR
      else
        pattern = '*';
    }
    if (pattern === '') return ''

    let re = '';
    let hasMagic = false;
    let escaping = false;
    // ? => one single character
    const patternListStack = [];
    const negativeLists = [];
    let stateChar;
    let inClass = false;
    let reClassStart = -1;
    let classStart = -1;
    let cs;
    let pl;
    let sp;
    // . and .. never match anything that doesn't start with .,
    // even when options.dot is set.  However, if the pattern
    // starts with ., then traversal patterns can match.
    let dotTravAllowed = pattern.charAt(0) === '.';
    let dotFileAllowed = options.dot || dotTravAllowed;
    const patternStart = () =>
      dotTravAllowed
        ? ''
        : dotFileAllowed
        ? '(?!(?:^|\\/)\\.{1,2}(?:$|\\/))'
        : '(?!\\.)';
    const subPatternStart = (p) =>
      p.charAt(0) === '.'
        ? ''
        : options.dot
        ? '(?!(?:^|\\/)\\.{1,2}(?:$|\\/))'
        : '(?!\\.)';


    const clearStateChar = () => {
      if (stateChar) {
        // we had some state-tracking character
        // that wasn't consumed by this pass.
        switch (stateChar) {
          case '*':
            re += star;
            hasMagic = true;
          break
          case '?':
            re += qmark;
            hasMagic = true;
          break
          default:
            re += '\\' + stateChar;
          break
        }
        this.debug('clearStateChar %j %j', stateChar, re);
        stateChar = false;
      }
    };

    for (let i = 0, c; (i < pattern.length) && (c = pattern.charAt(i)); i++) {
      this.debug('%s\t%s %s %j', pattern, i, re, c);

      // skip over any that are escaped.
      if (escaping) {
        /* istanbul ignore next - completely not allowed, even escaped. */
        if (c === '/') {
          return false
        }

        if (reSpecials[c]) {
          re += '\\';
        }
        re += c;
        escaping = false;
        continue
      }

      switch (c) {
        /* istanbul ignore next */
        case '/': {
          // Should already be path-split by now.
          return false
        }

        case '\\':
          if (inClass && pattern.charAt(i + 1) === '-') {
            re += c;
            continue
          }

          clearStateChar();
          escaping = true;
        continue

        // the various stateChar values
        // for the "extglob" stuff.
        case '?':
        case '*':
        case '+':
        case '@':
        case '!':
          this.debug('%s\t%s %s %j <-- stateChar', pattern, i, re, c);

          // all of those are literals inside a class, except that
          // the glob [!a] means [^a] in regexp
          if (inClass) {
            this.debug('  in class');
            if (c === '!' && i === classStart + 1) c = '^';
            re += c;
            continue
          }

          // if we already have a stateChar, then it means
          // that there was something like ** or +? in there.
          // Handle the stateChar, then proceed with this one.
          this.debug('call clearStateChar %j', stateChar);
          clearStateChar();
          stateChar = c;
          // if extglob is disabled, then +(asdf|foo) isn't a thing.
          // just clear the statechar *now*, rather than even diving into
          // the patternList stuff.
          if (options.noext) clearStateChar();
        continue

        case '(': {
          if (inClass) {
            re += '(';
            continue
          }

          if (!stateChar) {
            re += '\\(';
            continue
          }

          const plEntry = {
            type: stateChar,
            start: i - 1,
            reStart: re.length,
            open: plTypes[stateChar].open,
            close: plTypes[stateChar].close,
          };
          this.debug(this.pattern, '\t', plEntry);
          patternListStack.push(plEntry);
          // negation is (?:(?!(?:js)(?:<rest>))[^/]*)
          re += plEntry.open;
          // next entry starts with a dot maybe?
          if (plEntry.start === 0 && plEntry.type !== '!') {
            dotTravAllowed = true;
            re += subPatternStart(pattern.slice(i + 1));
          }
          this.debug('plType %j %j', stateChar, re);
          stateChar = false;
          continue
        }

        case ')': {
          const plEntry = patternListStack[patternListStack.length - 1];
          if (inClass || !plEntry) {
            re += '\\)';
            continue
          }
          patternListStack.pop();

          // closing an extglob
          clearStateChar();
          hasMagic = true;
          pl = plEntry;
          // negation is (?:(?!js)[^/]*)
          // The others are (?:<pattern>)<type>
          re += pl.close;
          if (pl.type === '!') {
            negativeLists.push(Object.assign(pl, { reEnd: re.length }));
          }
          continue
        }

        case '|': {
          const plEntry = patternListStack[patternListStack.length - 1];
          if (inClass || !plEntry) {
            re += '\\|';
            continue
          }

          clearStateChar();
          re += '|';
          // next subpattern can start with a dot?
          if (plEntry.start === 0 && plEntry.type !== '!') {
            dotTravAllowed = true;
            re += subPatternStart(pattern.slice(i + 1));
          }
          continue
        }

        // these are mostly the same in regexp and glob
        case '[':
          // swallow any state-tracking char before the [
          clearStateChar();

          if (inClass) {
            re += '\\' + c;
            continue
          }

          inClass = true;
          classStart = i;
          reClassStart = re.length;
          re += c;
        continue

        case ']':
          //  a right bracket shall lose its special
          //  meaning and represent itself in
          //  a bracket expression if it occurs
          //  first in the list.  -- POSIX.2 2.8.3.2
          if (i === classStart + 1 || !inClass) {
            re += '\\' + c;
            continue
          }

          // split where the last [ was, make sure we don't have
          // an invalid re. if so, re-walk the contents of the
          // would-be class to re-translate any characters that
          // were passed through as-is
          // TODO: It would probably be faster to determine this
          // without a try/catch and a new RegExp, but it's tricky
          // to do safely.  For now, this is safe and works.
          cs = pattern.substring(classStart + 1, i);
          try {
            RegExp('[' + braExpEscape(charUnescape(cs)) + ']');
            // looks good, finish up the class.
            re += c;
          } catch (er) {
            // out of order ranges in JS are errors, but in glob syntax,
            // they're just a range that matches nothing.
            re = re.substring(0, reClassStart) + '(?:$.)'; // match nothing ever
          }
          hasMagic = true;
          inClass = false;
        continue

        default:
          // swallow any state char that wasn't consumed
          clearStateChar();

          if (reSpecials[c] && !(c === '^' && inClass)) {
            re += '\\';
          }

          re += c;
          break

      } // switch
    } // for

    // handle the case where we left a class open.
    // "[abc" is valid, equivalent to "\[abc"
    if (inClass) {
      // split where the last [ was, and escape it
      // this is a huge pita.  We now have to re-walk
      // the contents of the would-be class to re-translate
      // any characters that were passed through as-is
      cs = pattern.slice(classStart + 1);
      sp = this.parse(cs, SUBPARSE);
      re = re.substring(0, reClassStart) + '\\[' + sp[0];
      hasMagic = hasMagic || sp[1];
    }

    // handle the case where we had a +( thing at the *end*
    // of the pattern.
    // each pattern list stack adds 3 chars, and we need to go through
    // and escape any | chars that were passed through as-is for the regexp.
    // Go through and escape them, taking care not to double-escape any
    // | chars that were already escaped.
    for (pl = patternListStack.pop(); pl; pl = patternListStack.pop()) {
      let tail;
      tail = re.slice(pl.reStart + pl.open.length);
      this.debug('setting tail', re, pl);
      // maybe some even number of \, then maybe 1 \, followed by a |
      tail = tail.replace(/((?:\\{2}){0,64})(\\?)\|/g, (_, $1, $2) => {
        /* istanbul ignore else - should already be done */
        if (!$2) {
          // the | isn't already escaped, so escape it.
          $2 = '\\';
        }

        // need to escape all those slashes *again*, without escaping the
        // one that we need for escaping the | character.  As it works out,
        // escaping an even number of slashes can be done by simply repeating
        // it exactly after itself.  That's why this trick works.
        //
        // I am sorry that you have to see this.
        return $1 + $1 + $2 + '|'
      });

      this.debug('tail=%j\n   %s', tail, tail, pl, re);
      const t = pl.type === '*' ? star
        : pl.type === '?' ? qmark
        : '\\' + pl.type;

      hasMagic = true;
      re = re.slice(0, pl.reStart) + t + '\\(' + tail;
    }

    // handle trailing things that only matter at the very end.
    clearStateChar();
    if (escaping) {
      // trailing \\
      re += '\\\\';
    }

    // only need to apply the nodot start if the re starts with
    // something that could conceivably capture a dot
    const addPatternStart = addPatternStartSet[re.charAt(0)];

    // Hack to work around lack of negative lookbehind in JS
    // A pattern like: *.!(x).!(y|z) needs to ensure that a name
    // like 'a.xyz.yz' doesn't match.  So, the first negative
    // lookahead, has to look ALL the way ahead, to the end of
    // the pattern.
    for (let n = negativeLists.length - 1; n > -1; n--) {
      const nl = negativeLists[n];

      const nlBefore = re.slice(0, nl.reStart);
      const nlFirst = re.slice(nl.reStart, nl.reEnd - 8);
      let nlAfter = re.slice(nl.reEnd);
      const nlLast = re.slice(nl.reEnd - 8, nl.reEnd) + nlAfter;

      // Handle nested stuff like *(*.js|!(*.json)), where open parens
      // mean that we should *not* include the ) in the bit that is considered
      // "after" the negated section.
      const closeParensBefore = nlBefore.split(')').length;
      const openParensBefore = nlBefore.split('(').length - closeParensBefore;
      let cleanAfter = nlAfter;
      for (let i = 0; i < openParensBefore; i++) {
        cleanAfter = cleanAfter.replace(/\)[+*?]?/, '');
      }
      nlAfter = cleanAfter;

      const dollar = nlAfter === '' && isSub !== SUBPARSE ? '(?:$|\\/)' : '';

      re = nlBefore + nlFirst + nlAfter + dollar + nlLast;
    }

    // if the re is not "" at this point, then we need to make sure
    // it doesn't match against an empty path part.
    // Otherwise a/* will match a/, which it should not.
    if (re !== '' && hasMagic) {
      re = '(?=.)' + re;
    }

    if (addPatternStart) {
      re = patternStart() + re;
    }

    // parsing just a piece of a larger pattern.
    if (isSub === SUBPARSE) {
      return [re, hasMagic]
    }

    // if it's nocase, and the lcase/uppercase don't match, it's magic
    if (options.nocase && !hasMagic) {
      hasMagic = pattern.toUpperCase() !== pattern.toLowerCase();
    }

    // skip the regexp for non-magical patterns
    // unescape anything in it, though, so that it'll be
    // an exact match against a file etc.
    if (!hasMagic) {
      return globUnescape(pattern)
    }

    const flags = options.nocase ? 'i' : '';
    try {
      return Object.assign(new RegExp('^' + re + '$', flags), {
        _glob: pattern,
        _src: re,
      })
    } catch (er) /* istanbul ignore next - should be impossible */ {
      // If it was an invalid regular expression, then it can't match
      // anything.  This trick looks for a character after the end of
      // the string, which is of course impossible, except in multi-line
      // mode, but it's not a /m regex.
      return new RegExp('$.')
    }
  }

  makeRe () {
    if (this.regexp || this.regexp === false) return this.regexp

    // at this point, this.set is a 2d array of partial
    // pattern strings, or "**".
    //
    // It's better to use .match().  This function shouldn't
    // be used, really, but it's pretty convenient sometimes,
    // when you just want to work with a regex.
    const set = this.set;

    if (!set.length) {
      this.regexp = false;
      return this.regexp
    }
    const options = this.options;

    const twoStar = options.noglobstar ? star
      : options.dot ? twoStarDot
      : twoStarNoDot;
    const flags = options.nocase ? 'i' : '';

    // coalesce globstars and regexpify non-globstar patterns
    // if it's the only item, then we just do one twoStar
    // if it's the first, and there are more, prepend (\/|twoStar\/)? to next
    // if it's the last, append (\/twoStar|) to previous
    // if it's in the middle, append (\/|\/twoStar\/) to previous
    // then filter out GLOBSTAR symbols
    let re = set.map(pattern => {
      pattern = pattern.map(p =>
        typeof p === 'string' ? regExpEscape(p)
        : p === GLOBSTAR ? GLOBSTAR
        : p._src
      ).reduce((set, p) => {
        if (!(set[set.length - 1] === GLOBSTAR && p === GLOBSTAR)) {
          set.push(p);
        }
        return set
      }, []);
      pattern.forEach((p, i) => {
        if (p !== GLOBSTAR || pattern[i-1] === GLOBSTAR) {
          return
        }
        if (i === 0) {
          if (pattern.length > 1) {
            pattern[i+1] = '(?:\\\/|' + twoStar + '\\\/)?' + pattern[i+1];
          } else {
            pattern[i] = twoStar;
          }
        } else if (i === pattern.length - 1) {
          pattern[i-1] += '(?:\\\/|' + twoStar + ')?';
        } else {
          pattern[i-1] += '(?:\\\/|\\\/' + twoStar + '\\\/)' + pattern[i+1];
          pattern[i+1] = GLOBSTAR;
        }
      });
      return pattern.filter(p => p !== GLOBSTAR).join('/')
    }).join('|');

    // must match entire pattern
    // ending in a * or ** will make it less strict.
    re = '^(?:' + re + ')$';

    // can match anything, as long as it's not this.
    if (this.negate) re = '^(?!' + re + ').*$';

    try {
      this.regexp = new RegExp(re, flags);
    } catch (ex) /* istanbul ignore next - should be impossible */ {
      this.regexp = false;
    }
    return this.regexp
  }

  match (f, partial = this.partial) {
    this.debug('match', f, this.pattern);
    // short-circuit in the case of busted things.
    // comments, etc.
    if (this.comment) return false
    if (this.empty) return f === ''

    if (f === '/' && partial) return true

    const options = this.options;

    // windows: need to use /, not \
    if (path$1.sep !== '/') {
      f = f.split(path$1.sep).join('/');
    }

    // treat the test path as a set of pathparts.
    f = f.split(slashSplit);
    this.debug(this.pattern, 'split', f);

    // just ONE of the pattern sets in this.set needs to match
    // in order for it to be valid.  If negating, then just one
    // match means that we have failed.
    // Either way, return on the first hit.

    const set = this.set;
    this.debug(this.pattern, 'set', set);

    // Find the basename of the path by looking for the last non-empty segment
    let filename;
    for (let i = f.length - 1; i >= 0; i--) {
      filename = f[i];
      if (filename) break
    }

    for (let i = 0; i < set.length; i++) {
      const pattern = set[i];
      let file = f;
      if (options.matchBase && pattern.length === 1) {
        file = [filename];
      }
      const hit = this.matchOne(file, pattern, partial);
      if (hit) {
        if (options.flipNegate) return true
        return !this.negate
      }
    }

    // didn't get any hits.  this is success if it's a negative
    // pattern, failure otherwise.
    if (options.flipNegate) return false
    return this.negate
  }

  static defaults (def) {
    return minimatch$1.defaults(def).Minimatch
  }
};

minimatch$1.Minimatch = Minimatch$1;

var inherits = {exports: {}};

var inherits_browser = {exports: {}};

var hasRequiredInherits_browser;

function requireInherits_browser () {
	if (hasRequiredInherits_browser) return inherits_browser.exports;
	hasRequiredInherits_browser = 1;
	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  inherits_browser.exports = function inherits(ctor, superCtor) {
	    if (superCtor) {
	      ctor.super_ = superCtor;
	      ctor.prototype = Object.create(superCtor.prototype, {
	        constructor: {
	          value: ctor,
	          enumerable: false,
	          writable: true,
	          configurable: true
	        }
	      });
	    }
	  };
	} else {
	  // old school shim for old browsers
	  inherits_browser.exports = function inherits(ctor, superCtor) {
	    if (superCtor) {
	      ctor.super_ = superCtor;
	      var TempCtor = function () {};
	      TempCtor.prototype = superCtor.prototype;
	      ctor.prototype = new TempCtor();
	      ctor.prototype.constructor = ctor;
	    }
	  };
	}
	return inherits_browser.exports;
}

try {
  var util = require('util');
  /* istanbul ignore next */
  if (typeof util.inherits !== 'function') throw '';
  inherits.exports = util.inherits;
} catch (e) {
  /* istanbul ignore next */
  inherits.exports = requireInherits_browser();
}

var inheritsExports = inherits.exports;

var common = {};

common.setopts = setopts;
common.ownProp = ownProp;
common.makeAbs = makeAbs;
common.finish = finish;
common.mark = mark;
common.isIgnored = isIgnored;
common.childrenIgnored = childrenIgnored;

function ownProp (obj, field) {
  return Object.prototype.hasOwnProperty.call(obj, field)
}

var fs = fs$7;
var path = require$$0$2;
var minimatch = minimatch_1;
var isAbsolute = require$$0$2.isAbsolute;
var Minimatch = minimatch.Minimatch;

function alphasort (a, b) {
  return a.localeCompare(b, 'en')
}

function setupIgnores (self, options) {
  self.ignore = options.ignore || [];

  if (!Array.isArray(self.ignore))
    self.ignore = [self.ignore];

  if (self.ignore.length) {
    self.ignore = self.ignore.map(ignoreMap);
  }
}

// ignore patterns are always in dot:true mode.
function ignoreMap (pattern) {
  var gmatcher = null;
  if (pattern.slice(-3) === '/**') {
    var gpattern = pattern.replace(/(\/\*\*)+$/, '');
    gmatcher = new Minimatch(gpattern, { dot: true });
  }

  return {
    matcher: new Minimatch(pattern, { dot: true }),
    gmatcher: gmatcher
  }
}

function setopts (self, pattern, options) {
  if (!options)
    options = {};

  // base-matching: just use globstar for that.
  if (options.matchBase && -1 === pattern.indexOf("/")) {
    if (options.noglobstar) {
      throw new Error("base matching requires globstar")
    }
    pattern = "**/" + pattern;
  }

  self.windowsPathsNoEscape = !!options.windowsPathsNoEscape ||
    options.allowWindowsEscape === false;
  if (self.windowsPathsNoEscape) {
    pattern = pattern.replace(/\\/g, '/');
  }

  self.silent = !!options.silent;
  self.pattern = pattern;
  self.strict = options.strict !== false;
  self.realpath = !!options.realpath;
  self.realpathCache = options.realpathCache || Object.create(null);
  self.follow = !!options.follow;
  self.dot = !!options.dot;
  self.mark = !!options.mark;
  self.nodir = !!options.nodir;
  if (self.nodir)
    self.mark = true;
  self.sync = !!options.sync;
  self.nounique = !!options.nounique;
  self.nonull = !!options.nonull;
  self.nosort = !!options.nosort;
  self.nocase = !!options.nocase;
  self.stat = !!options.stat;
  self.noprocess = !!options.noprocess;
  self.absolute = !!options.absolute;
  self.fs = options.fs || fs;

  self.maxLength = options.maxLength || Infinity;
  self.cache = options.cache || Object.create(null);
  self.statCache = options.statCache || Object.create(null);
  self.symlinks = options.symlinks || Object.create(null);

  setupIgnores(self, options);

  self.changedCwd = false;
  var cwd = process.cwd();
  if (!ownProp(options, "cwd"))
    self.cwd = path.resolve(cwd);
  else {
    self.cwd = path.resolve(options.cwd);
    self.changedCwd = self.cwd !== cwd;
  }

  self.root = options.root || path.resolve(self.cwd, "/");
  self.root = path.resolve(self.root);

  // TODO: is an absolute `cwd` supposed to be resolved against `root`?
  // e.g. { cwd: '/test', root: __dirname } === path.join(__dirname, '/test')
  self.cwdAbs = isAbsolute(self.cwd) ? self.cwd : makeAbs(self, self.cwd);
  self.nomount = !!options.nomount;

  if (process.platform === "win32") {
    self.root = self.root.replace(/\\/g, "/");
    self.cwd = self.cwd.replace(/\\/g, "/");
    self.cwdAbs = self.cwdAbs.replace(/\\/g, "/");
  }

  // disable comments and negation in Minimatch.
  // Note that they are not supported in Glob itself anyway.
  options.nonegate = true;
  options.nocomment = true;

  self.minimatch = new Minimatch(pattern, options);
  self.options = self.minimatch.options;
}

function finish (self) {
  var nou = self.nounique;
  var all = nou ? [] : Object.create(null);

  for (var i = 0, l = self.matches.length; i < l; i ++) {
    var matches = self.matches[i];
    if (!matches || Object.keys(matches).length === 0) {
      if (self.nonull) {
        // do like the shell, and spit out the literal glob
        var literal = self.minimatch.globSet[i];
        if (nou)
          all.push(literal);
        else
          all[literal] = true;
      }
    } else {
      // had matches
      var m = Object.keys(matches);
      if (nou)
        all.push.apply(all, m);
      else
        m.forEach(function (m) {
          all[m] = true;
        });
    }
  }

  if (!nou)
    all = Object.keys(all);

  if (!self.nosort)
    all = all.sort(alphasort);

  // at *some* point we statted all of these
  if (self.mark) {
    for (var i = 0; i < all.length; i++) {
      all[i] = self._mark(all[i]);
    }
    if (self.nodir) {
      all = all.filter(function (e) {
        var notDir = !(/\/$/.test(e));
        var c = self.cache[e] || self.cache[makeAbs(self, e)];
        if (notDir && c)
          notDir = c !== 'DIR' && !Array.isArray(c);
        return notDir
      });
    }
  }

  if (self.ignore.length)
    all = all.filter(function(m) {
      return !isIgnored(self, m)
    });

  self.found = all;
}

function mark (self, p) {
  var abs = makeAbs(self, p);
  var c = self.cache[abs];
  var m = p;
  if (c) {
    var isDir = c === 'DIR' || Array.isArray(c);
    var slash = p.slice(-1) === '/';

    if (isDir && !slash)
      m += '/';
    else if (!isDir && slash)
      m = m.slice(0, -1);

    if (m !== p) {
      var mabs = makeAbs(self, m);
      self.statCache[mabs] = self.statCache[abs];
      self.cache[mabs] = self.cache[abs];
    }
  }

  return m
}

// lotta situps...
function makeAbs (self, f) {
  var abs = f;
  if (f.charAt(0) === '/') {
    abs = path.join(self.root, f);
  } else if (isAbsolute(f) || f === '') {
    abs = f;
  } else if (self.changedCwd) {
    abs = path.resolve(self.cwd, f);
  } else {
    abs = path.resolve(f);
  }

  if (process.platform === 'win32')
    abs = abs.replace(/\\/g, '/');

  return abs
}


// Return true, if pattern ends with globstar '**', for the accompanying parent directory.
// Ex:- If node_modules/** is the pattern, add 'node_modules' to ignore list along with it's contents
function isIgnored (self, path) {
  if (!self.ignore.length)
    return false

  return self.ignore.some(function(item) {
    return item.matcher.match(path) || !!(item.gmatcher && item.gmatcher.match(path))
  })
}

function childrenIgnored (self, path) {
  if (!self.ignore.length)
    return false

  return self.ignore.some(function(item) {
    return !!(item.gmatcher && item.gmatcher.match(path))
  })
}

var sync;
var hasRequiredSync;

function requireSync () {
	if (hasRequiredSync) return sync;
	hasRequiredSync = 1;
	sync = globSync;
	globSync.GlobSync = GlobSync;

	var rp = fs_realpath;
	var minimatch = minimatch_1;
	minimatch.Minimatch;
	requireGlob().Glob;
	var path = require$$0$2;
	var assert = require$$5;
	var isAbsolute = require$$0$2.isAbsolute;
	var common$1 = common;
	var setopts = common$1.setopts;
	var ownProp = common$1.ownProp;
	var childrenIgnored = common$1.childrenIgnored;
	var isIgnored = common$1.isIgnored;

	function globSync (pattern, options) {
	  if (typeof options === 'function' || arguments.length === 3)
	    throw new TypeError('callback provided to sync glob\n'+
	                        'See: https://github.com/isaacs/node-glob/issues/167')

	  return new GlobSync(pattern, options).found
	}

	function GlobSync (pattern, options) {
	  if (!pattern)
	    throw new Error('must provide pattern')

	  if (typeof options === 'function' || arguments.length === 3)
	    throw new TypeError('callback provided to sync glob\n'+
	                        'See: https://github.com/isaacs/node-glob/issues/167')

	  if (!(this instanceof GlobSync))
	    return new GlobSync(pattern, options)

	  setopts(this, pattern, options);

	  if (this.noprocess)
	    return this

	  var n = this.minimatch.set.length;
	  this.matches = new Array(n);
	  for (var i = 0; i < n; i ++) {
	    this._process(this.minimatch.set[i], i, false);
	  }
	  this._finish();
	}

	GlobSync.prototype._finish = function () {
	  assert.ok(this instanceof GlobSync);
	  if (this.realpath) {
	    var self = this;
	    this.matches.forEach(function (matchset, index) {
	      var set = self.matches[index] = Object.create(null);
	      for (var p in matchset) {
	        try {
	          p = self._makeAbs(p);
	          var real = rp.realpathSync(p, self.realpathCache);
	          set[real] = true;
	        } catch (er) {
	          if (er.syscall === 'stat')
	            set[self._makeAbs(p)] = true;
	          else
	            throw er
	        }
	      }
	    });
	  }
	  common$1.finish(this);
	};


	GlobSync.prototype._process = function (pattern, index, inGlobStar) {
	  assert.ok(this instanceof GlobSync);

	  // Get the first [n] parts of pattern that are all strings.
	  var n = 0;
	  while (typeof pattern[n] === 'string') {
	    n ++;
	  }
	  // now n is the index of the first one that is *not* a string.

	  // See if there's anything else
	  var prefix;
	  switch (n) {
	    // if not, then this is rather simple
	    case pattern.length:
	      this._processSimple(pattern.join('/'), index);
	      return

	    case 0:
	      // pattern *starts* with some non-trivial item.
	      // going to readdir(cwd), but not include the prefix in matches.
	      prefix = null;
	      break

	    default:
	      // pattern has some string bits in the front.
	      // whatever it starts with, whether that's 'absolute' like /foo/bar,
	      // or 'relative' like '../baz'
	      prefix = pattern.slice(0, n).join('/');
	      break
	  }

	  var remain = pattern.slice(n);

	  // get the list of entries.
	  var read;
	  if (prefix === null)
	    read = '.';
	  else if (isAbsolute(prefix) ||
	      isAbsolute(pattern.map(function (p) {
	        return typeof p === 'string' ? p : '[*]'
	      }).join('/'))) {
	    if (!prefix || !isAbsolute(prefix))
	      prefix = '/' + prefix;
	    read = prefix;
	  } else
	    read = prefix;

	  var abs = this._makeAbs(read);

	  //if ignored, skip processing
	  if (childrenIgnored(this, read))
	    return

	  var isGlobStar = remain[0] === minimatch.GLOBSTAR;
	  if (isGlobStar)
	    this._processGlobStar(prefix, read, abs, remain, index, inGlobStar);
	  else
	    this._processReaddir(prefix, read, abs, remain, index, inGlobStar);
	};


	GlobSync.prototype._processReaddir = function (prefix, read, abs, remain, index, inGlobStar) {
	  var entries = this._readdir(abs, inGlobStar);

	  // if the abs isn't a dir, then nothing can match!
	  if (!entries)
	    return

	  // It will only match dot entries if it starts with a dot, or if
	  // dot is set.  Stuff like @(.foo|.bar) isn't allowed.
	  var pn = remain[0];
	  var negate = !!this.minimatch.negate;
	  var rawGlob = pn._glob;
	  var dotOk = this.dot || rawGlob.charAt(0) === '.';

	  var matchedEntries = [];
	  for (var i = 0; i < entries.length; i++) {
	    var e = entries[i];
	    if (e.charAt(0) !== '.' || dotOk) {
	      var m;
	      if (negate && !prefix) {
	        m = !e.match(pn);
	      } else {
	        m = e.match(pn);
	      }
	      if (m)
	        matchedEntries.push(e);
	    }
	  }

	  var len = matchedEntries.length;
	  // If there are no matched entries, then nothing matches.
	  if (len === 0)
	    return

	  // if this is the last remaining pattern bit, then no need for
	  // an additional stat *unless* the user has specified mark or
	  // stat explicitly.  We know they exist, since readdir returned
	  // them.

	  if (remain.length === 1 && !this.mark && !this.stat) {
	    if (!this.matches[index])
	      this.matches[index] = Object.create(null);

	    for (var i = 0; i < len; i ++) {
	      var e = matchedEntries[i];
	      if (prefix) {
	        if (prefix.slice(-1) !== '/')
	          e = prefix + '/' + e;
	        else
	          e = prefix + e;
	      }

	      if (e.charAt(0) === '/' && !this.nomount) {
	        e = path.join(this.root, e);
	      }
	      this._emitMatch(index, e);
	    }
	    // This was the last one, and no stats were needed
	    return
	  }

	  // now test all matched entries as stand-ins for that part
	  // of the pattern.
	  remain.shift();
	  for (var i = 0; i < len; i ++) {
	    var e = matchedEntries[i];
	    var newPattern;
	    if (prefix)
	      newPattern = [prefix, e];
	    else
	      newPattern = [e];
	    this._process(newPattern.concat(remain), index, inGlobStar);
	  }
	};


	GlobSync.prototype._emitMatch = function (index, e) {
	  if (isIgnored(this, e))
	    return

	  var abs = this._makeAbs(e);

	  if (this.mark)
	    e = this._mark(e);

	  if (this.absolute) {
	    e = abs;
	  }

	  if (this.matches[index][e])
	    return

	  if (this.nodir) {
	    var c = this.cache[abs];
	    if (c === 'DIR' || Array.isArray(c))
	      return
	  }

	  this.matches[index][e] = true;

	  if (this.stat)
	    this._stat(e);
	};


	GlobSync.prototype._readdirInGlobStar = function (abs) {
	  // follow all symlinked directories forever
	  // just proceed as if this is a non-globstar situation
	  if (this.follow)
	    return this._readdir(abs, false)

	  var entries;
	  var lstat;
	  try {
	    lstat = this.fs.lstatSync(abs);
	  } catch (er) {
	    if (er.code === 'ENOENT') {
	      // lstat failed, doesn't exist
	      return null
	    }
	  }

	  var isSym = lstat && lstat.isSymbolicLink();
	  this.symlinks[abs] = isSym;

	  // If it's not a symlink or a dir, then it's definitely a regular file.
	  // don't bother doing a readdir in that case.
	  if (!isSym && lstat && !lstat.isDirectory())
	    this.cache[abs] = 'FILE';
	  else
	    entries = this._readdir(abs, false);

	  return entries
	};

	GlobSync.prototype._readdir = function (abs, inGlobStar) {

	  if (inGlobStar && !ownProp(this.symlinks, abs))
	    return this._readdirInGlobStar(abs)

	  if (ownProp(this.cache, abs)) {
	    var c = this.cache[abs];
	    if (!c || c === 'FILE')
	      return null

	    if (Array.isArray(c))
	      return c
	  }

	  try {
	    return this._readdirEntries(abs, this.fs.readdirSync(abs))
	  } catch (er) {
	    this._readdirError(abs, er);
	    return null
	  }
	};

	GlobSync.prototype._readdirEntries = function (abs, entries) {
	  // if we haven't asked to stat everything, then just
	  // assume that everything in there exists, so we can avoid
	  // having to stat it a second time.
	  if (!this.mark && !this.stat) {
	    for (var i = 0; i < entries.length; i ++) {
	      var e = entries[i];
	      if (abs === '/')
	        e = abs + e;
	      else
	        e = abs + '/' + e;
	      this.cache[e] = true;
	    }
	  }

	  this.cache[abs] = entries;

	  // mark and cache dir-ness
	  return entries
	};

	GlobSync.prototype._readdirError = function (f, er) {
	  // handle errors, and cache the information
	  switch (er.code) {
	    case 'ENOTSUP': // https://github.com/isaacs/node-glob/issues/205
	    case 'ENOTDIR': // totally normal. means it *does* exist.
	      var abs = this._makeAbs(f);
	      this.cache[abs] = 'FILE';
	      if (abs === this.cwdAbs) {
	        var error = new Error(er.code + ' invalid cwd ' + this.cwd);
	        error.path = this.cwd;
	        error.code = er.code;
	        throw error
	      }
	      break

	    case 'ENOENT': // not terribly unusual
	    case 'ELOOP':
	    case 'ENAMETOOLONG':
	    case 'UNKNOWN':
	      this.cache[this._makeAbs(f)] = false;
	      break

	    default: // some unusual error.  Treat as failure.
	      this.cache[this._makeAbs(f)] = false;
	      if (this.strict)
	        throw er
	      if (!this.silent)
	        console.error('glob error', er);
	      break
	  }
	};

	GlobSync.prototype._processGlobStar = function (prefix, read, abs, remain, index, inGlobStar) {

	  var entries = this._readdir(abs, inGlobStar);

	  // no entries means not a dir, so it can never have matches
	  // foo.txt/** doesn't match foo.txt
	  if (!entries)
	    return

	  // test without the globstar, and with every child both below
	  // and replacing the globstar.
	  var remainWithoutGlobStar = remain.slice(1);
	  var gspref = prefix ? [ prefix ] : [];
	  var noGlobStar = gspref.concat(remainWithoutGlobStar);

	  // the noGlobStar pattern exits the inGlobStar state
	  this._process(noGlobStar, index, false);

	  var len = entries.length;
	  var isSym = this.symlinks[abs];

	  // If it's a symlink, and we're in a globstar, then stop
	  if (isSym && inGlobStar)
	    return

	  for (var i = 0; i < len; i++) {
	    var e = entries[i];
	    if (e.charAt(0) === '.' && !this.dot)
	      continue

	    // these two cases enter the inGlobStar state
	    var instead = gspref.concat(entries[i], remainWithoutGlobStar);
	    this._process(instead, index, true);

	    var below = gspref.concat(entries[i], remain);
	    this._process(below, index, true);
	  }
	};

	GlobSync.prototype._processSimple = function (prefix, index) {
	  // XXX review this.  Shouldn't it be doing the mounting etc
	  // before doing stat?  kinda weird?
	  var exists = this._stat(prefix);

	  if (!this.matches[index])
	    this.matches[index] = Object.create(null);

	  // If it doesn't exist, then just mark the lack of results
	  if (!exists)
	    return

	  if (prefix && isAbsolute(prefix) && !this.nomount) {
	    var trail = /[\/\\]$/.test(prefix);
	    if (prefix.charAt(0) === '/') {
	      prefix = path.join(this.root, prefix);
	    } else {
	      prefix = path.resolve(this.root, prefix);
	      if (trail)
	        prefix += '/';
	    }
	  }

	  if (process.platform === 'win32')
	    prefix = prefix.replace(/\\/g, '/');

	  // Mark this as a match
	  this._emitMatch(index, prefix);
	};

	// Returns either 'DIR', 'FILE', or false
	GlobSync.prototype._stat = function (f) {
	  var abs = this._makeAbs(f);
	  var needDir = f.slice(-1) === '/';

	  if (f.length > this.maxLength)
	    return false

	  if (!this.stat && ownProp(this.cache, abs)) {
	    var c = this.cache[abs];

	    if (Array.isArray(c))
	      c = 'DIR';

	    // It exists, but maybe not how we need it
	    if (!needDir || c === 'DIR')
	      return c

	    if (needDir && c === 'FILE')
	      return false

	    // otherwise we have to stat, because maybe c=true
	    // if we know it exists, but not what it is.
	  }
	  var stat = this.statCache[abs];
	  if (!stat) {
	    var lstat;
	    try {
	      lstat = this.fs.lstatSync(abs);
	    } catch (er) {
	      if (er && (er.code === 'ENOENT' || er.code === 'ENOTDIR')) {
	        this.statCache[abs] = false;
	        return false
	      }
	    }

	    if (lstat && lstat.isSymbolicLink()) {
	      try {
	        stat = this.fs.statSync(abs);
	      } catch (er) {
	        stat = lstat;
	      }
	    } else {
	      stat = lstat;
	    }
	  }

	  this.statCache[abs] = stat;

	  var c = true;
	  if (stat)
	    c = stat.isDirectory() ? 'DIR' : 'FILE';

	  this.cache[abs] = this.cache[abs] || c;

	  if (needDir && c === 'FILE')
	    return false

	  return c
	};

	GlobSync.prototype._mark = function (p) {
	  return common$1.mark(this, p)
	};

	GlobSync.prototype._makeAbs = function (f) {
	  return common$1.makeAbs(this, f)
	};
	return sync;
}

// Returns a wrapper function that returns a wrapped callback
// The wrapper function should do some stuff, and return a
// presumably different callback function.
// This makes sure that own properties are retained, so that
// decorations and such are not lost along the way.
var wrappy_1 = wrappy$2;
function wrappy$2 (fn, cb) {
  if (fn && cb) return wrappy$2(fn)(cb)

  if (typeof fn !== 'function')
    throw new TypeError('need wrapper function')

  Object.keys(fn).forEach(function (k) {
    wrapper[k] = fn[k];
  });

  return wrapper

  function wrapper() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    var ret = fn.apply(this, args);
    var cb = args[args.length-1];
    if (typeof ret === 'function' && ret !== cb) {
      Object.keys(cb).forEach(function (k) {
        ret[k] = cb[k];
      });
    }
    return ret
  }
}

var once$2 = {exports: {}};

var wrappy$1 = wrappy_1;
once$2.exports = wrappy$1(once$1);
once$2.exports.strict = wrappy$1(onceStrict);

once$1.proto = once$1(function () {
  Object.defineProperty(Function.prototype, 'once', {
    value: function () {
      return once$1(this)
    },
    configurable: true
  });

  Object.defineProperty(Function.prototype, 'onceStrict', {
    value: function () {
      return onceStrict(this)
    },
    configurable: true
  });
});

function once$1 (fn) {
  var f = function () {
    if (f.called) return f.value
    f.called = true;
    return f.value = fn.apply(this, arguments)
  };
  f.called = false;
  return f
}

function onceStrict (fn) {
  var f = function () {
    if (f.called)
      throw new Error(f.onceError)
    f.called = true;
    return f.value = fn.apply(this, arguments)
  };
  var name = fn.name || 'Function wrapped with `once`';
  f.onceError = name + " shouldn't be called more than once";
  f.called = false;
  return f
}

var onceExports = once$2.exports;

var wrappy = wrappy_1;
var reqs = Object.create(null);
var once = onceExports;

var inflight_1 = wrappy(inflight);

function inflight (key, cb) {
  if (reqs[key]) {
    reqs[key].push(cb);
    return null
  } else {
    reqs[key] = [cb];
    return makeres(key)
  }
}

function makeres (key) {
  return once(function RES () {
    var cbs = reqs[key];
    var len = cbs.length;
    var args = slice(arguments);

    // XXX It's somewhat ambiguous whether a new callback added in this
    // pass should be queued for later execution if something in the
    // list of callbacks throws, or if it should just be discarded.
    // However, it's such an edge case that it hardly matters, and either
    // choice is likely as surprising as the other.
    // As it happens, we do go ahead and schedule it for later execution.
    try {
      for (var i = 0; i < len; i++) {
        cbs[i].apply(null, args);
      }
    } finally {
      if (cbs.length > len) {
        // added more in the interim.
        // de-zalgo, just in case, but don't call again.
        cbs.splice(0, len);
        process.nextTick(function () {
          RES.apply(null, args);
        });
      } else {
        delete reqs[key];
      }
    }
  })
}

function slice (args) {
  var length = args.length;
  var array = [];

  for (var i = 0; i < length; i++) array[i] = args[i];
  return array
}

var glob_1;
var hasRequiredGlob;

function requireGlob () {
	if (hasRequiredGlob) return glob_1;
	hasRequiredGlob = 1;
	// Approach:
	//
	// 1. Get the minimatch set
	// 2. For each pattern in the set, PROCESS(pattern, false)
	// 3. Store matches per-set, then uniq them
	//
	// PROCESS(pattern, inGlobStar)
	// Get the first [n] items from pattern that are all strings
	// Join these together.  This is PREFIX.
	//   If there is no more remaining, then stat(PREFIX) and
	//   add to matches if it succeeds.  END.
	//
	// If inGlobStar and PREFIX is symlink and points to dir
	//   set ENTRIES = []
	// else readdir(PREFIX) as ENTRIES
	//   If fail, END
	//
	// with ENTRIES
	//   If pattern[n] is GLOBSTAR
	//     // handle the case where the globstar match is empty
	//     // by pruning it out, and testing the resulting pattern
	//     PROCESS(pattern[0..n] + pattern[n+1 .. $], false)
	//     // handle other cases.
	//     for ENTRY in ENTRIES (not dotfiles)
	//       // attach globstar + tail onto the entry
	//       // Mark that this entry is a globstar match
	//       PROCESS(pattern[0..n] + ENTRY + pattern[n .. $], true)
	//
	//   else // not globstar
	//     for ENTRY in ENTRIES (not dotfiles, unless pattern[n] is dot)
	//       Test ENTRY against pattern[n]
	//       If fails, continue
	//       If passes, PROCESS(pattern[0..n] + item + pattern[n+1 .. $])
	//
	// Caveat:
	//   Cache all stats and readdirs results to minimize syscall.  Since all
	//   we ever care about is existence and directory-ness, we can just keep
	//   `true` for files, and [children,...] for directories, or `false` for
	//   things that don't exist.

	glob_1 = glob;

	var rp = fs_realpath;
	var minimatch = minimatch_1;
	minimatch.Minimatch;
	var inherits = inheritsExports;
	var EE = require$$3$1.EventEmitter;
	var path = require$$0$2;
	var assert = require$$5;
	var isAbsolute = require$$0$2.isAbsolute;
	var globSync = requireSync();
	var common$1 = common;
	var setopts = common$1.setopts;
	var ownProp = common$1.ownProp;
	var inflight = inflight_1;
	var childrenIgnored = common$1.childrenIgnored;
	var isIgnored = common$1.isIgnored;

	var once = onceExports;

	function glob (pattern, options, cb) {
	  if (typeof options === 'function') cb = options, options = {};
	  if (!options) options = {};

	  if (options.sync) {
	    if (cb)
	      throw new TypeError('callback provided to sync glob')
	    return globSync(pattern, options)
	  }

	  return new Glob(pattern, options, cb)
	}

	glob.sync = globSync;
	var GlobSync = glob.GlobSync = globSync.GlobSync;

	// old api surface
	glob.glob = glob;

	function extend (origin, add) {
	  if (add === null || typeof add !== 'object') {
	    return origin
	  }

	  var keys = Object.keys(add);
	  var i = keys.length;
	  while (i--) {
	    origin[keys[i]] = add[keys[i]];
	  }
	  return origin
	}

	glob.hasMagic = function (pattern, options_) {
	  var options = extend({}, options_);
	  options.noprocess = true;

	  var g = new Glob(pattern, options);
	  var set = g.minimatch.set;

	  if (!pattern)
	    return false

	  if (set.length > 1)
	    return true

	  for (var j = 0; j < set[0].length; j++) {
	    if (typeof set[0][j] !== 'string')
	      return true
	  }

	  return false
	};

	glob.Glob = Glob;
	inherits(Glob, EE);
	function Glob (pattern, options, cb) {
	  if (typeof options === 'function') {
	    cb = options;
	    options = null;
	  }

	  if (options && options.sync) {
	    if (cb)
	      throw new TypeError('callback provided to sync glob')
	    return new GlobSync(pattern, options)
	  }

	  if (!(this instanceof Glob))
	    return new Glob(pattern, options, cb)

	  setopts(this, pattern, options);
	  this._didRealPath = false;

	  // process each pattern in the minimatch set
	  var n = this.minimatch.set.length;

	  // The matches are stored as {<filename>: true,...} so that
	  // duplicates are automagically pruned.
	  // Later, we do an Object.keys() on these.
	  // Keep them as a list so we can fill in when nonull is set.
	  this.matches = new Array(n);

	  if (typeof cb === 'function') {
	    cb = once(cb);
	    this.on('error', cb);
	    this.on('end', function (matches) {
	      cb(null, matches);
	    });
	  }

	  var self = this;
	  this._processing = 0;

	  this._emitQueue = [];
	  this._processQueue = [];
	  this.paused = false;

	  if (this.noprocess)
	    return this

	  if (n === 0)
	    return done()

	  var sync = true;
	  for (var i = 0; i < n; i ++) {
	    this._process(this.minimatch.set[i], i, false, done);
	  }
	  sync = false;

	  function done () {
	    --self._processing;
	    if (self._processing <= 0) {
	      if (sync) {
	        process.nextTick(function () {
	          self._finish();
	        });
	      } else {
	        self._finish();
	      }
	    }
	  }
	}

	Glob.prototype._finish = function () {
	  assert(this instanceof Glob);
	  if (this.aborted)
	    return

	  if (this.realpath && !this._didRealpath)
	    return this._realpath()

	  common$1.finish(this);
	  this.emit('end', this.found);
	};

	Glob.prototype._realpath = function () {
	  if (this._didRealpath)
	    return

	  this._didRealpath = true;

	  var n = this.matches.length;
	  if (n === 0)
	    return this._finish()

	  var self = this;
	  for (var i = 0; i < this.matches.length; i++)
	    this._realpathSet(i, next);

	  function next () {
	    if (--n === 0)
	      self._finish();
	  }
	};

	Glob.prototype._realpathSet = function (index, cb) {
	  var matchset = this.matches[index];
	  if (!matchset)
	    return cb()

	  var found = Object.keys(matchset);
	  var self = this;
	  var n = found.length;

	  if (n === 0)
	    return cb()

	  var set = this.matches[index] = Object.create(null);
	  found.forEach(function (p, i) {
	    // If there's a problem with the stat, then it means that
	    // one or more of the links in the realpath couldn't be
	    // resolved.  just return the abs value in that case.
	    p = self._makeAbs(p);
	    rp.realpath(p, self.realpathCache, function (er, real) {
	      if (!er)
	        set[real] = true;
	      else if (er.syscall === 'stat')
	        set[p] = true;
	      else
	        self.emit('error', er); // srsly wtf right here

	      if (--n === 0) {
	        self.matches[index] = set;
	        cb();
	      }
	    });
	  });
	};

	Glob.prototype._mark = function (p) {
	  return common$1.mark(this, p)
	};

	Glob.prototype._makeAbs = function (f) {
	  return common$1.makeAbs(this, f)
	};

	Glob.prototype.abort = function () {
	  this.aborted = true;
	  this.emit('abort');
	};

	Glob.prototype.pause = function () {
	  if (!this.paused) {
	    this.paused = true;
	    this.emit('pause');
	  }
	};

	Glob.prototype.resume = function () {
	  if (this.paused) {
	    this.emit('resume');
	    this.paused = false;
	    if (this._emitQueue.length) {
	      var eq = this._emitQueue.slice(0);
	      this._emitQueue.length = 0;
	      for (var i = 0; i < eq.length; i ++) {
	        var e = eq[i];
	        this._emitMatch(e[0], e[1]);
	      }
	    }
	    if (this._processQueue.length) {
	      var pq = this._processQueue.slice(0);
	      this._processQueue.length = 0;
	      for (var i = 0; i < pq.length; i ++) {
	        var p = pq[i];
	        this._processing--;
	        this._process(p[0], p[1], p[2], p[3]);
	      }
	    }
	  }
	};

	Glob.prototype._process = function (pattern, index, inGlobStar, cb) {
	  assert(this instanceof Glob);
	  assert(typeof cb === 'function');

	  if (this.aborted)
	    return

	  this._processing++;
	  if (this.paused) {
	    this._processQueue.push([pattern, index, inGlobStar, cb]);
	    return
	  }

	  //console.error('PROCESS %d', this._processing, pattern)

	  // Get the first [n] parts of pattern that are all strings.
	  var n = 0;
	  while (typeof pattern[n] === 'string') {
	    n ++;
	  }
	  // now n is the index of the first one that is *not* a string.

	  // see if there's anything else
	  var prefix;
	  switch (n) {
	    // if not, then this is rather simple
	    case pattern.length:
	      this._processSimple(pattern.join('/'), index, cb);
	      return

	    case 0:
	      // pattern *starts* with some non-trivial item.
	      // going to readdir(cwd), but not include the prefix in matches.
	      prefix = null;
	      break

	    default:
	      // pattern has some string bits in the front.
	      // whatever it starts with, whether that's 'absolute' like /foo/bar,
	      // or 'relative' like '../baz'
	      prefix = pattern.slice(0, n).join('/');
	      break
	  }

	  var remain = pattern.slice(n);

	  // get the list of entries.
	  var read;
	  if (prefix === null)
	    read = '.';
	  else if (isAbsolute(prefix) ||
	      isAbsolute(pattern.map(function (p) {
	        return typeof p === 'string' ? p : '[*]'
	      }).join('/'))) {
	    if (!prefix || !isAbsolute(prefix))
	      prefix = '/' + prefix;
	    read = prefix;
	  } else
	    read = prefix;

	  var abs = this._makeAbs(read);

	  //if ignored, skip _processing
	  if (childrenIgnored(this, read))
	    return cb()

	  var isGlobStar = remain[0] === minimatch.GLOBSTAR;
	  if (isGlobStar)
	    this._processGlobStar(prefix, read, abs, remain, index, inGlobStar, cb);
	  else
	    this._processReaddir(prefix, read, abs, remain, index, inGlobStar, cb);
	};

	Glob.prototype._processReaddir = function (prefix, read, abs, remain, index, inGlobStar, cb) {
	  var self = this;
	  this._readdir(abs, inGlobStar, function (er, entries) {
	    return self._processReaddir2(prefix, read, abs, remain, index, inGlobStar, entries, cb)
	  });
	};

	Glob.prototype._processReaddir2 = function (prefix, read, abs, remain, index, inGlobStar, entries, cb) {

	  // if the abs isn't a dir, then nothing can match!
	  if (!entries)
	    return cb()

	  // It will only match dot entries if it starts with a dot, or if
	  // dot is set.  Stuff like @(.foo|.bar) isn't allowed.
	  var pn = remain[0];
	  var negate = !!this.minimatch.negate;
	  var rawGlob = pn._glob;
	  var dotOk = this.dot || rawGlob.charAt(0) === '.';

	  var matchedEntries = [];
	  for (var i = 0; i < entries.length; i++) {
	    var e = entries[i];
	    if (e.charAt(0) !== '.' || dotOk) {
	      var m;
	      if (negate && !prefix) {
	        m = !e.match(pn);
	      } else {
	        m = e.match(pn);
	      }
	      if (m)
	        matchedEntries.push(e);
	    }
	  }

	  //console.error('prd2', prefix, entries, remain[0]._glob, matchedEntries)

	  var len = matchedEntries.length;
	  // If there are no matched entries, then nothing matches.
	  if (len === 0)
	    return cb()

	  // if this is the last remaining pattern bit, then no need for
	  // an additional stat *unless* the user has specified mark or
	  // stat explicitly.  We know they exist, since readdir returned
	  // them.

	  if (remain.length === 1 && !this.mark && !this.stat) {
	    if (!this.matches[index])
	      this.matches[index] = Object.create(null);

	    for (var i = 0; i < len; i ++) {
	      var e = matchedEntries[i];
	      if (prefix) {
	        if (prefix !== '/')
	          e = prefix + '/' + e;
	        else
	          e = prefix + e;
	      }

	      if (e.charAt(0) === '/' && !this.nomount) {
	        e = path.join(this.root, e);
	      }
	      this._emitMatch(index, e);
	    }
	    // This was the last one, and no stats were needed
	    return cb()
	  }

	  // now test all matched entries as stand-ins for that part
	  // of the pattern.
	  remain.shift();
	  for (var i = 0; i < len; i ++) {
	    var e = matchedEntries[i];
	    if (prefix) {
	      if (prefix !== '/')
	        e = prefix + '/' + e;
	      else
	        e = prefix + e;
	    }
	    this._process([e].concat(remain), index, inGlobStar, cb);
	  }
	  cb();
	};

	Glob.prototype._emitMatch = function (index, e) {
	  if (this.aborted)
	    return

	  if (isIgnored(this, e))
	    return

	  if (this.paused) {
	    this._emitQueue.push([index, e]);
	    return
	  }

	  var abs = isAbsolute(e) ? e : this._makeAbs(e);

	  if (this.mark)
	    e = this._mark(e);

	  if (this.absolute)
	    e = abs;

	  if (this.matches[index][e])
	    return

	  if (this.nodir) {
	    var c = this.cache[abs];
	    if (c === 'DIR' || Array.isArray(c))
	      return
	  }

	  this.matches[index][e] = true;

	  var st = this.statCache[abs];
	  if (st)
	    this.emit('stat', e, st);

	  this.emit('match', e);
	};

	Glob.prototype._readdirInGlobStar = function (abs, cb) {
	  if (this.aborted)
	    return

	  // follow all symlinked directories forever
	  // just proceed as if this is a non-globstar situation
	  if (this.follow)
	    return this._readdir(abs, false, cb)

	  var lstatkey = 'lstat\0' + abs;
	  var self = this;
	  var lstatcb = inflight(lstatkey, lstatcb_);

	  if (lstatcb)
	    self.fs.lstat(abs, lstatcb);

	  function lstatcb_ (er, lstat) {
	    if (er && er.code === 'ENOENT')
	      return cb()

	    var isSym = lstat && lstat.isSymbolicLink();
	    self.symlinks[abs] = isSym;

	    // If it's not a symlink or a dir, then it's definitely a regular file.
	    // don't bother doing a readdir in that case.
	    if (!isSym && lstat && !lstat.isDirectory()) {
	      self.cache[abs] = 'FILE';
	      cb();
	    } else
	      self._readdir(abs, false, cb);
	  }
	};

	Glob.prototype._readdir = function (abs, inGlobStar, cb) {
	  if (this.aborted)
	    return

	  cb = inflight('readdir\0'+abs+'\0'+inGlobStar, cb);
	  if (!cb)
	    return

	  //console.error('RD %j %j', +inGlobStar, abs)
	  if (inGlobStar && !ownProp(this.symlinks, abs))
	    return this._readdirInGlobStar(abs, cb)

	  if (ownProp(this.cache, abs)) {
	    var c = this.cache[abs];
	    if (!c || c === 'FILE')
	      return cb()

	    if (Array.isArray(c))
	      return cb(null, c)
	  }

	  var self = this;
	  self.fs.readdir(abs, readdirCb(this, abs, cb));
	};

	function readdirCb (self, abs, cb) {
	  return function (er, entries) {
	    if (er)
	      self._readdirError(abs, er, cb);
	    else
	      self._readdirEntries(abs, entries, cb);
	  }
	}

	Glob.prototype._readdirEntries = function (abs, entries, cb) {
	  if (this.aborted)
	    return

	  // if we haven't asked to stat everything, then just
	  // assume that everything in there exists, so we can avoid
	  // having to stat it a second time.
	  if (!this.mark && !this.stat) {
	    for (var i = 0; i < entries.length; i ++) {
	      var e = entries[i];
	      if (abs === '/')
	        e = abs + e;
	      else
	        e = abs + '/' + e;
	      this.cache[e] = true;
	    }
	  }

	  this.cache[abs] = entries;
	  return cb(null, entries)
	};

	Glob.prototype._readdirError = function (f, er, cb) {
	  if (this.aborted)
	    return

	  // handle errors, and cache the information
	  switch (er.code) {
	    case 'ENOTSUP': // https://github.com/isaacs/node-glob/issues/205
	    case 'ENOTDIR': // totally normal. means it *does* exist.
	      var abs = this._makeAbs(f);
	      this.cache[abs] = 'FILE';
	      if (abs === this.cwdAbs) {
	        var error = new Error(er.code + ' invalid cwd ' + this.cwd);
	        error.path = this.cwd;
	        error.code = er.code;
	        this.emit('error', error);
	        this.abort();
	      }
	      break

	    case 'ENOENT': // not terribly unusual
	    case 'ELOOP':
	    case 'ENAMETOOLONG':
	    case 'UNKNOWN':
	      this.cache[this._makeAbs(f)] = false;
	      break

	    default: // some unusual error.  Treat as failure.
	      this.cache[this._makeAbs(f)] = false;
	      if (this.strict) {
	        this.emit('error', er);
	        // If the error is handled, then we abort
	        // if not, we threw out of here
	        this.abort();
	      }
	      if (!this.silent)
	        console.error('glob error', er);
	      break
	  }

	  return cb()
	};

	Glob.prototype._processGlobStar = function (prefix, read, abs, remain, index, inGlobStar, cb) {
	  var self = this;
	  this._readdir(abs, inGlobStar, function (er, entries) {
	    self._processGlobStar2(prefix, read, abs, remain, index, inGlobStar, entries, cb);
	  });
	};


	Glob.prototype._processGlobStar2 = function (prefix, read, abs, remain, index, inGlobStar, entries, cb) {
	  //console.error('pgs2', prefix, remain[0], entries)

	  // no entries means not a dir, so it can never have matches
	  // foo.txt/** doesn't match foo.txt
	  if (!entries)
	    return cb()

	  // test without the globstar, and with every child both below
	  // and replacing the globstar.
	  var remainWithoutGlobStar = remain.slice(1);
	  var gspref = prefix ? [ prefix ] : [];
	  var noGlobStar = gspref.concat(remainWithoutGlobStar);

	  // the noGlobStar pattern exits the inGlobStar state
	  this._process(noGlobStar, index, false, cb);

	  var isSym = this.symlinks[abs];
	  var len = entries.length;

	  // If it's a symlink, and we're in a globstar, then stop
	  if (isSym && inGlobStar)
	    return cb()

	  for (var i = 0; i < len; i++) {
	    var e = entries[i];
	    if (e.charAt(0) === '.' && !this.dot)
	      continue

	    // these two cases enter the inGlobStar state
	    var instead = gspref.concat(entries[i], remainWithoutGlobStar);
	    this._process(instead, index, true, cb);

	    var below = gspref.concat(entries[i], remain);
	    this._process(below, index, true, cb);
	  }

	  cb();
	};

	Glob.prototype._processSimple = function (prefix, index, cb) {
	  // XXX review this.  Shouldn't it be doing the mounting etc
	  // before doing stat?  kinda weird?
	  var self = this;
	  this._stat(prefix, function (er, exists) {
	    self._processSimple2(prefix, index, er, exists, cb);
	  });
	};
	Glob.prototype._processSimple2 = function (prefix, index, er, exists, cb) {

	  //console.error('ps2', prefix, exists)

	  if (!this.matches[index])
	    this.matches[index] = Object.create(null);

	  // If it doesn't exist, then just mark the lack of results
	  if (!exists)
	    return cb()

	  if (prefix && isAbsolute(prefix) && !this.nomount) {
	    var trail = /[\/\\]$/.test(prefix);
	    if (prefix.charAt(0) === '/') {
	      prefix = path.join(this.root, prefix);
	    } else {
	      prefix = path.resolve(this.root, prefix);
	      if (trail)
	        prefix += '/';
	    }
	  }

	  if (process.platform === 'win32')
	    prefix = prefix.replace(/\\/g, '/');

	  // Mark this as a match
	  this._emitMatch(index, prefix);
	  cb();
	};

	// Returns either 'DIR', 'FILE', or false
	Glob.prototype._stat = function (f, cb) {
	  var abs = this._makeAbs(f);
	  var needDir = f.slice(-1) === '/';

	  if (f.length > this.maxLength)
	    return cb()

	  if (!this.stat && ownProp(this.cache, abs)) {
	    var c = this.cache[abs];

	    if (Array.isArray(c))
	      c = 'DIR';

	    // It exists, but maybe not how we need it
	    if (!needDir || c === 'DIR')
	      return cb(null, c)

	    if (needDir && c === 'FILE')
	      return cb()

	    // otherwise we have to stat, because maybe c=true
	    // if we know it exists, but not what it is.
	  }
	  var stat = this.statCache[abs];
	  if (stat !== undefined) {
	    if (stat === false)
	      return cb(null, stat)
	    else {
	      var type = stat.isDirectory() ? 'DIR' : 'FILE';
	      if (needDir && type === 'FILE')
	        return cb()
	      else
	        return cb(null, type, stat)
	    }
	  }

	  var self = this;
	  var statcb = inflight('stat\0' + abs, lstatcb_);
	  if (statcb)
	    self.fs.lstat(abs, statcb);

	  function lstatcb_ (er, lstat) {
	    if (lstat && lstat.isSymbolicLink()) {
	      // If it's a symlink, then treat it as the target, unless
	      // the target does not exist, then treat it as a file.
	      return self.fs.stat(abs, function (er, stat) {
	        if (er)
	          self._stat2(f, abs, null, lstat, cb);
	        else
	          self._stat2(f, abs, er, stat, cb);
	      })
	    } else {
	      self._stat2(f, abs, er, lstat, cb);
	    }
	  }
	};

	Glob.prototype._stat2 = function (f, abs, er, stat, cb) {
	  if (er && (er.code === 'ENOENT' || er.code === 'ENOTDIR')) {
	    this.statCache[abs] = false;
	    return cb()
	  }

	  var needDir = f.slice(-1) === '/';
	  this.statCache[abs] = stat;

	  if (abs.slice(-1) === '/' && stat && !stat.isDirectory())
	    return cb(null, false, stat)

	  var c = true;
	  if (stat)
	    c = stat.isDirectory() ? 'DIR' : 'FILE';
	  this.cache[abs] = this.cache[abs] || c;

	  if (needDir && c === 'FILE')
	    return cb()

	  return cb(null, c, stat)
	};
	return glob_1;
}

var globExports = requireGlob();
var glob = /*@__PURE__*/getDefaultExportFromCjs(globExports);

const comma = ','.charCodeAt(0);
const semicolon = ';'.charCodeAt(0);
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const intToChar = new Uint8Array(64); // 64 possible chars.
const charToInt = new Uint8Array(128); // z is 122 in ASCII
for (let i = 0; i < chars.length; i++) {
    const c = chars.charCodeAt(i);
    intToChar[i] = c;
    charToInt[c] = i;
}
// Provide a fallback for older environments.
const td = typeof TextDecoder !== 'undefined'
    ? /* #__PURE__ */ new TextDecoder()
    : typeof Buffer !== 'undefined'
        ? {
            decode(buf) {
                const out = Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
                return out.toString();
            },
        }
        : {
            decode(buf) {
                let out = '';
                for (let i = 0; i < buf.length; i++) {
                    out += String.fromCharCode(buf[i]);
                }
                return out;
            },
        };
function encode(decoded) {
    const state = new Int32Array(5);
    const bufLength = 1024 * 16;
    const subLength = bufLength - 36;
    const buf = new Uint8Array(bufLength);
    const sub = buf.subarray(0, subLength);
    let pos = 0;
    let out = '';
    for (let i = 0; i < decoded.length; i++) {
        const line = decoded[i];
        if (i > 0) {
            if (pos === bufLength) {
                out += td.decode(buf);
                pos = 0;
            }
            buf[pos++] = semicolon;
        }
        if (line.length === 0)
            continue;
        state[0] = 0;
        for (let j = 0; j < line.length; j++) {
            const segment = line[j];
            // We can push up to 5 ints, each int can take at most 7 chars, and we
            // may push a comma.
            if (pos > subLength) {
                out += td.decode(sub);
                buf.copyWithin(0, subLength, pos);
                pos -= subLength;
            }
            if (j > 0)
                buf[pos++] = comma;
            pos = encodeInteger(buf, pos, state, segment, 0); // genColumn
            if (segment.length === 1)
                continue;
            pos = encodeInteger(buf, pos, state, segment, 1); // sourcesIndex
            pos = encodeInteger(buf, pos, state, segment, 2); // sourceLine
            pos = encodeInteger(buf, pos, state, segment, 3); // sourceColumn
            if (segment.length === 4)
                continue;
            pos = encodeInteger(buf, pos, state, segment, 4); // namesIndex
        }
    }
    return out + td.decode(buf.subarray(0, pos));
}
function encodeInteger(buf, pos, state, segment, j) {
    const next = segment[j];
    let num = next - state[j];
    state[j] = next;
    num = num < 0 ? (-num << 1) | 1 : num << 1;
    do {
        let clamped = num & 0b011111;
        num >>>= 5;
        if (num > 0)
            clamped |= 0b100000;
        buf[pos++] = intToChar[clamped];
    } while (num > 0);
    return pos;
}

class BitSet {
	constructor(arg) {
		this.bits = arg instanceof BitSet ? arg.bits.slice() : [];
	}

	add(n) {
		this.bits[n >> 5] |= 1 << (n & 31);
	}

	has(n) {
		return !!(this.bits[n >> 5] & (1 << (n & 31)));
	}
}

class Chunk {
	constructor(start, end, content) {
		this.start = start;
		this.end = end;
		this.original = content;

		this.intro = '';
		this.outro = '';

		this.content = content;
		this.storeName = false;
		this.edited = false;

		{
			this.previous = null;
			this.next = null;
		}
	}

	appendLeft(content) {
		this.outro += content;
	}

	appendRight(content) {
		this.intro = this.intro + content;
	}

	clone() {
		const chunk = new Chunk(this.start, this.end, this.original);

		chunk.intro = this.intro;
		chunk.outro = this.outro;
		chunk.content = this.content;
		chunk.storeName = this.storeName;
		chunk.edited = this.edited;

		return chunk;
	}

	contains(index) {
		return this.start < index && index < this.end;
	}

	eachNext(fn) {
		let chunk = this;
		while (chunk) {
			fn(chunk);
			chunk = chunk.next;
		}
	}

	eachPrevious(fn) {
		let chunk = this;
		while (chunk) {
			fn(chunk);
			chunk = chunk.previous;
		}
	}

	edit(content, storeName, contentOnly) {
		this.content = content;
		if (!contentOnly) {
			this.intro = '';
			this.outro = '';
		}
		this.storeName = storeName;

		this.edited = true;

		return this;
	}

	prependLeft(content) {
		this.outro = content + this.outro;
	}

	prependRight(content) {
		this.intro = content + this.intro;
	}

	reset() {
		this.intro = '';
		this.outro = '';
		if (this.edited) {
			this.content = this.original;
			this.storeName = false;
			this.edited = false;
		}
	}

	split(index) {
		const sliceIndex = index - this.start;

		const originalBefore = this.original.slice(0, sliceIndex);
		const originalAfter = this.original.slice(sliceIndex);

		this.original = originalBefore;

		const newChunk = new Chunk(index, this.end, originalAfter);
		newChunk.outro = this.outro;
		this.outro = '';

		this.end = index;

		if (this.edited) {
			// after split we should save the edit content record into the correct chunk
			// to make sure sourcemap correct
			// For example:
			// '  test'.trim()
			//     split   -> '  ' + 'test'
			//   ✔️ edit    -> '' + 'test'
			//   ✖️ edit    -> 'test' + '' 
			// TODO is this block necessary?...
			newChunk.edit('', false);
			this.content = '';
		} else {
			this.content = originalBefore;
		}

		newChunk.next = this.next;
		if (newChunk.next) newChunk.next.previous = newChunk;
		newChunk.previous = this;
		this.next = newChunk;

		return newChunk;
	}

	toString() {
		return this.intro + this.content + this.outro;
	}

	trimEnd(rx) {
		this.outro = this.outro.replace(rx, '');
		if (this.outro.length) return true;

		const trimmed = this.content.replace(rx, '');

		if (trimmed.length) {
			if (trimmed !== this.content) {
				this.split(this.start + trimmed.length).edit('', undefined, true);
				if (this.edited) {
					// save the change, if it has been edited
					this.edit(trimmed, this.storeName, true);
				}
			}
			return true;
		} else {
			this.edit('', undefined, true);

			this.intro = this.intro.replace(rx, '');
			if (this.intro.length) return true;
		}
	}

	trimStart(rx) {
		this.intro = this.intro.replace(rx, '');
		if (this.intro.length) return true;

		const trimmed = this.content.replace(rx, '');

		if (trimmed.length) {
			if (trimmed !== this.content) {
				const newChunk = this.split(this.end - trimmed.length);
				if (this.edited) {
					// save the change, if it has been edited
					newChunk.edit(trimmed, this.storeName, true);
				}
				this.edit('', undefined, true);
			}
			return true;
		} else {
			this.edit('', undefined, true);

			this.outro = this.outro.replace(rx, '');
			if (this.outro.length) return true;
		}
	}
}

function getBtoa() {
	if (typeof globalThis !== 'undefined' && typeof globalThis.btoa === 'function') {
		return (str) => globalThis.btoa(unescape(encodeURIComponent(str)));
	} else if (typeof Buffer === 'function') {
		return (str) => Buffer.from(str, 'utf-8').toString('base64');
	} else {
		return () => {
			throw new Error('Unsupported environment: `window.btoa` or `Buffer` should be supported.');
		};
	}
}

const btoa = /*#__PURE__*/ getBtoa();

class SourceMap {
	constructor(properties) {
		this.version = 3;
		this.file = properties.file;
		this.sources = properties.sources;
		this.sourcesContent = properties.sourcesContent;
		this.names = properties.names;
		this.mappings = encode(properties.mappings);
		if (typeof properties.x_google_ignoreList !== 'undefined') {
			this.x_google_ignoreList = properties.x_google_ignoreList;
		}
	}

	toString() {
		return JSON.stringify(this);
	}

	toUrl() {
		return 'data:application/json;charset=utf-8;base64,' + btoa(this.toString());
	}
}

function guessIndent(code) {
	const lines = code.split('\n');

	const tabbed = lines.filter((line) => /^\t+/.test(line));
	const spaced = lines.filter((line) => /^ {2,}/.test(line));

	if (tabbed.length === 0 && spaced.length === 0) {
		return null;
	}

	// More lines tabbed than spaced? Assume tabs, and
	// default to tabs in the case of a tie (or nothing
	// to go on)
	if (tabbed.length >= spaced.length) {
		return '\t';
	}

	// Otherwise, we need to guess the multiple
	const min = spaced.reduce((previous, current) => {
		const numSpaces = /^ +/.exec(current)[0].length;
		return Math.min(numSpaces, previous);
	}, Infinity);

	return new Array(min + 1).join(' ');
}

function getRelativePath(from, to) {
	const fromParts = from.split(/[/\\]/);
	const toParts = to.split(/[/\\]/);

	fromParts.pop(); // get dirname

	while (fromParts[0] === toParts[0]) {
		fromParts.shift();
		toParts.shift();
	}

	if (fromParts.length) {
		let i = fromParts.length;
		while (i--) fromParts[i] = '..';
	}

	return fromParts.concat(toParts).join('/');
}

const toString = Object.prototype.toString;

function isObject(thing) {
	return toString.call(thing) === '[object Object]';
}

function getLocator(source) {
	const originalLines = source.split('\n');
	const lineOffsets = [];

	for (let i = 0, pos = 0; i < originalLines.length; i++) {
		lineOffsets.push(pos);
		pos += originalLines[i].length + 1;
	}

	return function locate(index) {
		let i = 0;
		let j = lineOffsets.length;
		while (i < j) {
			const m = (i + j) >> 1;
			if (index < lineOffsets[m]) {
				j = m;
			} else {
				i = m + 1;
			}
		}
		const line = i - 1;
		const column = index - lineOffsets[line];
		return { line, column };
	};
}

const wordRegex = /\w/;

class Mappings {
	constructor(hires) {
		this.hires = hires;
		this.generatedCodeLine = 0;
		this.generatedCodeColumn = 0;
		this.raw = [];
		this.rawSegments = this.raw[this.generatedCodeLine] = [];
		this.pending = null;
	}

	addEdit(sourceIndex, content, loc, nameIndex) {
		if (content.length) {
			let contentLineEnd = content.indexOf('\n', 0);
			let previousContentLineEnd = -1;
			while (contentLineEnd >= 0) {
				const segment = [this.generatedCodeColumn, sourceIndex, loc.line, loc.column];
				if (nameIndex >= 0) {
					segment.push(nameIndex);
				}
				this.rawSegments.push(segment);

				this.generatedCodeLine += 1;
				this.raw[this.generatedCodeLine] = this.rawSegments = [];
				this.generatedCodeColumn = 0;

				previousContentLineEnd = contentLineEnd;
				contentLineEnd = content.indexOf('\n', contentLineEnd + 1);
			}

			const segment = [this.generatedCodeColumn, sourceIndex, loc.line, loc.column];
			if (nameIndex >= 0) {
				segment.push(nameIndex);
			}
			this.rawSegments.push(segment);

			this.advance(content.slice(previousContentLineEnd + 1));
		} else if (this.pending) {
			this.rawSegments.push(this.pending);
			this.advance(content);
		}

		this.pending = null;
	}

	addUneditedChunk(sourceIndex, chunk, original, loc, sourcemapLocations) {
		let originalCharIndex = chunk.start;
		let first = true;
		// when iterating each char, check if it's in a word boundary
		let charInHiresBoundary = false;

		while (originalCharIndex < chunk.end) {
			if (this.hires || first || sourcemapLocations.has(originalCharIndex)) {
				const segment = [this.generatedCodeColumn, sourceIndex, loc.line, loc.column];

				if (this.hires === 'boundary') {
					// in hires "boundary", group segments per word boundary than per char
					if (wordRegex.test(original[originalCharIndex])) {
						// for first char in the boundary found, start the boundary by pushing a segment
						if (!charInHiresBoundary) {
							this.rawSegments.push(segment);
							charInHiresBoundary = true;
						}
					} else {
						// for non-word char, end the boundary by pushing a segment
						this.rawSegments.push(segment);
						charInHiresBoundary = false;
					}
				} else {
					this.rawSegments.push(segment);
				}
			}

			if (original[originalCharIndex] === '\n') {
				loc.line += 1;
				loc.column = 0;
				this.generatedCodeLine += 1;
				this.raw[this.generatedCodeLine] = this.rawSegments = [];
				this.generatedCodeColumn = 0;
				first = true;
			} else {
				loc.column += 1;
				this.generatedCodeColumn += 1;
				first = false;
			}

			originalCharIndex += 1;
		}

		this.pending = null;
	}

	advance(str) {
		if (!str) return;

		const lines = str.split('\n');

		if (lines.length > 1) {
			for (let i = 0; i < lines.length - 1; i++) {
				this.generatedCodeLine++;
				this.raw[this.generatedCodeLine] = this.rawSegments = [];
			}
			this.generatedCodeColumn = 0;
		}

		this.generatedCodeColumn += lines[lines.length - 1].length;
	}
}

const n = '\n';

const warned = {
	insertLeft: false,
	insertRight: false,
	storeName: false,
};

class MagicString {
	constructor(string, options = {}) {
		const chunk = new Chunk(0, string.length, string);

		Object.defineProperties(this, {
			original: { writable: true, value: string },
			outro: { writable: true, value: '' },
			intro: { writable: true, value: '' },
			firstChunk: { writable: true, value: chunk },
			lastChunk: { writable: true, value: chunk },
			lastSearchedChunk: { writable: true, value: chunk },
			byStart: { writable: true, value: {} },
			byEnd: { writable: true, value: {} },
			filename: { writable: true, value: options.filename },
			indentExclusionRanges: { writable: true, value: options.indentExclusionRanges },
			sourcemapLocations: { writable: true, value: new BitSet() },
			storedNames: { writable: true, value: {} },
			indentStr: { writable: true, value: undefined },
			ignoreList: { writable: true, value: options.ignoreList },
		});

		this.byStart[0] = chunk;
		this.byEnd[string.length] = chunk;
	}

	addSourcemapLocation(char) {
		this.sourcemapLocations.add(char);
	}

	append(content) {
		if (typeof content !== 'string') throw new TypeError('outro content must be a string');

		this.outro += content;
		return this;
	}

	appendLeft(index, content) {
		if (typeof content !== 'string') throw new TypeError('inserted content must be a string');

		this._split(index);

		const chunk = this.byEnd[index];

		if (chunk) {
			chunk.appendLeft(content);
		} else {
			this.intro += content;
		}
		return this;
	}

	appendRight(index, content) {
		if (typeof content !== 'string') throw new TypeError('inserted content must be a string');

		this._split(index);

		const chunk = this.byStart[index];

		if (chunk) {
			chunk.appendRight(content);
		} else {
			this.outro += content;
		}
		return this;
	}

	clone() {
		const cloned = new MagicString(this.original, { filename: this.filename });

		let originalChunk = this.firstChunk;
		let clonedChunk = (cloned.firstChunk = cloned.lastSearchedChunk = originalChunk.clone());

		while (originalChunk) {
			cloned.byStart[clonedChunk.start] = clonedChunk;
			cloned.byEnd[clonedChunk.end] = clonedChunk;

			const nextOriginalChunk = originalChunk.next;
			const nextClonedChunk = nextOriginalChunk && nextOriginalChunk.clone();

			if (nextClonedChunk) {
				clonedChunk.next = nextClonedChunk;
				nextClonedChunk.previous = clonedChunk;

				clonedChunk = nextClonedChunk;
			}

			originalChunk = nextOriginalChunk;
		}

		cloned.lastChunk = clonedChunk;

		if (this.indentExclusionRanges) {
			cloned.indentExclusionRanges = this.indentExclusionRanges.slice();
		}

		cloned.sourcemapLocations = new BitSet(this.sourcemapLocations);

		cloned.intro = this.intro;
		cloned.outro = this.outro;

		return cloned;
	}

	generateDecodedMap(options) {
		options = options || {};

		const sourceIndex = 0;
		const names = Object.keys(this.storedNames);
		const mappings = new Mappings(options.hires);

		const locate = getLocator(this.original);

		if (this.intro) {
			mappings.advance(this.intro);
		}

		this.firstChunk.eachNext((chunk) => {
			const loc = locate(chunk.start);

			if (chunk.intro.length) mappings.advance(chunk.intro);

			if (chunk.edited) {
				mappings.addEdit(
					sourceIndex,
					chunk.content,
					loc,
					chunk.storeName ? names.indexOf(chunk.original) : -1,
				);
			} else {
				mappings.addUneditedChunk(sourceIndex, chunk, this.original, loc, this.sourcemapLocations);
			}

			if (chunk.outro.length) mappings.advance(chunk.outro);
		});

		return {
			file: options.file ? options.file.split(/[/\\]/).pop() : undefined,
			sources: [
				options.source ? getRelativePath(options.file || '', options.source) : options.file || '',
			],
			sourcesContent: options.includeContent ? [this.original] : undefined,
			names,
			mappings: mappings.raw,
			x_google_ignoreList: this.ignoreList ? [sourceIndex] : undefined,
		};
	}

	generateMap(options) {
		return new SourceMap(this.generateDecodedMap(options));
	}

	_ensureindentStr() {
		if (this.indentStr === undefined) {
			this.indentStr = guessIndent(this.original);
		}
	}

	_getRawIndentString() {
		this._ensureindentStr();
		return this.indentStr;
	}

	getIndentString() {
		this._ensureindentStr();
		return this.indentStr === null ? '\t' : this.indentStr;
	}

	indent(indentStr, options) {
		const pattern = /^[^\r\n]/gm;

		if (isObject(indentStr)) {
			options = indentStr;
			indentStr = undefined;
		}

		if (indentStr === undefined) {
			this._ensureindentStr();
			indentStr = this.indentStr || '\t';
		}

		if (indentStr === '') return this; // noop

		options = options || {};

		// Process exclusion ranges
		const isExcluded = {};

		if (options.exclude) {
			const exclusions =
				typeof options.exclude[0] === 'number' ? [options.exclude] : options.exclude;
			exclusions.forEach((exclusion) => {
				for (let i = exclusion[0]; i < exclusion[1]; i += 1) {
					isExcluded[i] = true;
				}
			});
		}

		let shouldIndentNextCharacter = options.indentStart !== false;
		const replacer = (match) => {
			if (shouldIndentNextCharacter) return `${indentStr}${match}`;
			shouldIndentNextCharacter = true;
			return match;
		};

		this.intro = this.intro.replace(pattern, replacer);

		let charIndex = 0;
		let chunk = this.firstChunk;

		while (chunk) {
			const end = chunk.end;

			if (chunk.edited) {
				if (!isExcluded[charIndex]) {
					chunk.content = chunk.content.replace(pattern, replacer);

					if (chunk.content.length) {
						shouldIndentNextCharacter = chunk.content[chunk.content.length - 1] === '\n';
					}
				}
			} else {
				charIndex = chunk.start;

				while (charIndex < end) {
					if (!isExcluded[charIndex]) {
						const char = this.original[charIndex];

						if (char === '\n') {
							shouldIndentNextCharacter = true;
						} else if (char !== '\r' && shouldIndentNextCharacter) {
							shouldIndentNextCharacter = false;

							if (charIndex === chunk.start) {
								chunk.prependRight(indentStr);
							} else {
								this._splitChunk(chunk, charIndex);
								chunk = chunk.next;
								chunk.prependRight(indentStr);
							}
						}
					}

					charIndex += 1;
				}
			}

			charIndex = chunk.end;
			chunk = chunk.next;
		}

		this.outro = this.outro.replace(pattern, replacer);

		return this;
	}

	insert() {
		throw new Error(
			'magicString.insert(...) is deprecated. Use prependRight(...) or appendLeft(...)',
		);
	}

	insertLeft(index, content) {
		if (!warned.insertLeft) {
			console.warn(
				'magicString.insertLeft(...) is deprecated. Use magicString.appendLeft(...) instead',
			); // eslint-disable-line no-console
			warned.insertLeft = true;
		}

		return this.appendLeft(index, content);
	}

	insertRight(index, content) {
		if (!warned.insertRight) {
			console.warn(
				'magicString.insertRight(...) is deprecated. Use magicString.prependRight(...) instead',
			); // eslint-disable-line no-console
			warned.insertRight = true;
		}

		return this.prependRight(index, content);
	}

	move(start, end, index) {
		if (index >= start && index <= end) throw new Error('Cannot move a selection inside itself');

		this._split(start);
		this._split(end);
		this._split(index);

		const first = this.byStart[start];
		const last = this.byEnd[end];

		const oldLeft = first.previous;
		const oldRight = last.next;

		const newRight = this.byStart[index];
		if (!newRight && last === this.lastChunk) return this;
		const newLeft = newRight ? newRight.previous : this.lastChunk;

		if (oldLeft) oldLeft.next = oldRight;
		if (oldRight) oldRight.previous = oldLeft;

		if (newLeft) newLeft.next = first;
		if (newRight) newRight.previous = last;

		if (!first.previous) this.firstChunk = last.next;
		if (!last.next) {
			this.lastChunk = first.previous;
			this.lastChunk.next = null;
		}

		first.previous = newLeft;
		last.next = newRight || null;

		if (!newLeft) this.firstChunk = first;
		if (!newRight) this.lastChunk = last;
		return this;
	}

	overwrite(start, end, content, options) {
		options = options || {};
		return this.update(start, end, content, { ...options, overwrite: !options.contentOnly });
	}

	update(start, end, content, options) {
		if (typeof content !== 'string') throw new TypeError('replacement content must be a string');

		while (start < 0) start += this.original.length;
		while (end < 0) end += this.original.length;

		if (end > this.original.length) throw new Error('end is out of bounds');
		if (start === end)
			throw new Error(
				'Cannot overwrite a zero-length range – use appendLeft or prependRight instead',
			);

		this._split(start);
		this._split(end);

		if (options === true) {
			if (!warned.storeName) {
				console.warn(
					'The final argument to magicString.overwrite(...) should be an options object. See https://github.com/rich-harris/magic-string',
				); // eslint-disable-line no-console
				warned.storeName = true;
			}

			options = { storeName: true };
		}
		const storeName = options !== undefined ? options.storeName : false;
		const overwrite = options !== undefined ? options.overwrite : false;

		if (storeName) {
			const original = this.original.slice(start, end);
			Object.defineProperty(this.storedNames, original, {
				writable: true,
				value: true,
				enumerable: true,
			});
		}

		const first = this.byStart[start];
		const last = this.byEnd[end];

		if (first) {
			let chunk = first;
			while (chunk !== last) {
				if (chunk.next !== this.byStart[chunk.end]) {
					throw new Error('Cannot overwrite across a split point');
				}
				chunk = chunk.next;
				chunk.edit('', false);
			}

			first.edit(content, storeName, !overwrite);
		} else {
			// must be inserting at the end
			const newChunk = new Chunk(start, end, '').edit(content, storeName);

			// TODO last chunk in the array may not be the last chunk, if it's moved...
			last.next = newChunk;
			newChunk.previous = last;
		}
		return this;
	}

	prepend(content) {
		if (typeof content !== 'string') throw new TypeError('outro content must be a string');

		this.intro = content + this.intro;
		return this;
	}

	prependLeft(index, content) {
		if (typeof content !== 'string') throw new TypeError('inserted content must be a string');

		this._split(index);

		const chunk = this.byEnd[index];

		if (chunk) {
			chunk.prependLeft(content);
		} else {
			this.intro = content + this.intro;
		}
		return this;
	}

	prependRight(index, content) {
		if (typeof content !== 'string') throw new TypeError('inserted content must be a string');

		this._split(index);

		const chunk = this.byStart[index];

		if (chunk) {
			chunk.prependRight(content);
		} else {
			this.outro = content + this.outro;
		}
		return this;
	}

	remove(start, end) {
		while (start < 0) start += this.original.length;
		while (end < 0) end += this.original.length;

		if (start === end) return this;

		if (start < 0 || end > this.original.length) throw new Error('Character is out of bounds');
		if (start > end) throw new Error('end must be greater than start');

		this._split(start);
		this._split(end);

		let chunk = this.byStart[start];

		while (chunk) {
			chunk.intro = '';
			chunk.outro = '';
			chunk.edit('');

			chunk = end > chunk.end ? this.byStart[chunk.end] : null;
		}
		return this;
	}

	reset(start, end) {
		while (start < 0) start += this.original.length;
		while (end < 0) end += this.original.length;

		if (start === end) return this;

		if (start < 0 || end > this.original.length) throw new Error('Character is out of bounds');
		if (start > end) throw new Error('end must be greater than start');

		this._split(start);
		this._split(end);

		let chunk = this.byStart[start];

		while (chunk) {
			chunk.reset();

			chunk = end > chunk.end ? this.byStart[chunk.end] : null;
		}
		return this;
	}

	lastChar() {
		if (this.outro.length) return this.outro[this.outro.length - 1];
		let chunk = this.lastChunk;
		do {
			if (chunk.outro.length) return chunk.outro[chunk.outro.length - 1];
			if (chunk.content.length) return chunk.content[chunk.content.length - 1];
			if (chunk.intro.length) return chunk.intro[chunk.intro.length - 1];
		} while ((chunk = chunk.previous));
		if (this.intro.length) return this.intro[this.intro.length - 1];
		return '';
	}

	lastLine() {
		let lineIndex = this.outro.lastIndexOf(n);
		if (lineIndex !== -1) return this.outro.substr(lineIndex + 1);
		let lineStr = this.outro;
		let chunk = this.lastChunk;
		do {
			if (chunk.outro.length > 0) {
				lineIndex = chunk.outro.lastIndexOf(n);
				if (lineIndex !== -1) return chunk.outro.substr(lineIndex + 1) + lineStr;
				lineStr = chunk.outro + lineStr;
			}

			if (chunk.content.length > 0) {
				lineIndex = chunk.content.lastIndexOf(n);
				if (lineIndex !== -1) return chunk.content.substr(lineIndex + 1) + lineStr;
				lineStr = chunk.content + lineStr;
			}

			if (chunk.intro.length > 0) {
				lineIndex = chunk.intro.lastIndexOf(n);
				if (lineIndex !== -1) return chunk.intro.substr(lineIndex + 1) + lineStr;
				lineStr = chunk.intro + lineStr;
			}
		} while ((chunk = chunk.previous));
		lineIndex = this.intro.lastIndexOf(n);
		if (lineIndex !== -1) return this.intro.substr(lineIndex + 1) + lineStr;
		return this.intro + lineStr;
	}

	slice(start = 0, end = this.original.length) {
		while (start < 0) start += this.original.length;
		while (end < 0) end += this.original.length;

		let result = '';

		// find start chunk
		let chunk = this.firstChunk;
		while (chunk && (chunk.start > start || chunk.end <= start)) {
			// found end chunk before start
			if (chunk.start < end && chunk.end >= end) {
				return result;
			}

			chunk = chunk.next;
		}

		if (chunk && chunk.edited && chunk.start !== start)
			throw new Error(`Cannot use replaced character ${start} as slice start anchor.`);

		const startChunk = chunk;
		while (chunk) {
			if (chunk.intro && (startChunk !== chunk || chunk.start === start)) {
				result += chunk.intro;
			}

			const containsEnd = chunk.start < end && chunk.end >= end;
			if (containsEnd && chunk.edited && chunk.end !== end)
				throw new Error(`Cannot use replaced character ${end} as slice end anchor.`);

			const sliceStart = startChunk === chunk ? start - chunk.start : 0;
			const sliceEnd = containsEnd ? chunk.content.length + end - chunk.end : chunk.content.length;

			result += chunk.content.slice(sliceStart, sliceEnd);

			if (chunk.outro && (!containsEnd || chunk.end === end)) {
				result += chunk.outro;
			}

			if (containsEnd) {
				break;
			}

			chunk = chunk.next;
		}

		return result;
	}

	// TODO deprecate this? not really very useful
	snip(start, end) {
		const clone = this.clone();
		clone.remove(0, start);
		clone.remove(end, clone.original.length);

		return clone;
	}

	_split(index) {
		if (this.byStart[index] || this.byEnd[index]) return;

		let chunk = this.lastSearchedChunk;
		const searchForward = index > chunk.end;

		while (chunk) {
			if (chunk.contains(index)) return this._splitChunk(chunk, index);

			chunk = searchForward ? this.byStart[chunk.end] : this.byEnd[chunk.start];
		}
	}

	_splitChunk(chunk, index) {
		if (chunk.edited && chunk.content.length) {
			// zero-length edited chunks are a special case (overlapping replacements)
			const loc = getLocator(this.original)(index);
			throw new Error(
				`Cannot split a chunk that has already been edited (${loc.line}:${loc.column} – "${chunk.original}")`,
			);
		}

		const newChunk = chunk.split(index);

		this.byEnd[index] = chunk;
		this.byStart[index] = newChunk;
		this.byEnd[newChunk.end] = newChunk;

		if (chunk === this.lastChunk) this.lastChunk = newChunk;

		this.lastSearchedChunk = chunk;
		return true;
	}

	toString() {
		let str = this.intro;

		let chunk = this.firstChunk;
		while (chunk) {
			str += chunk.toString();
			chunk = chunk.next;
		}

		return str + this.outro;
	}

	isEmpty() {
		let chunk = this.firstChunk;
		do {
			if (
				(chunk.intro.length && chunk.intro.trim()) ||
				(chunk.content.length && chunk.content.trim()) ||
				(chunk.outro.length && chunk.outro.trim())
			)
				return false;
		} while ((chunk = chunk.next));
		return true;
	}

	length() {
		let chunk = this.firstChunk;
		let length = 0;
		do {
			length += chunk.intro.length + chunk.content.length + chunk.outro.length;
		} while ((chunk = chunk.next));
		return length;
	}

	trimLines() {
		return this.trim('[\\r\\n]');
	}

	trim(charType) {
		return this.trimStart(charType).trimEnd(charType);
	}

	trimEndAborted(charType) {
		const rx = new RegExp((charType || '\\s') + '+$');

		this.outro = this.outro.replace(rx, '');
		if (this.outro.length) return true;

		let chunk = this.lastChunk;

		do {
			const end = chunk.end;
			const aborted = chunk.trimEnd(rx);

			// if chunk was trimmed, we have a new lastChunk
			if (chunk.end !== end) {
				if (this.lastChunk === chunk) {
					this.lastChunk = chunk.next;
				}

				this.byEnd[chunk.end] = chunk;
				this.byStart[chunk.next.start] = chunk.next;
				this.byEnd[chunk.next.end] = chunk.next;
			}

			if (aborted) return true;
			chunk = chunk.previous;
		} while (chunk);

		return false;
	}

	trimEnd(charType) {
		this.trimEndAborted(charType);
		return this;
	}
	trimStartAborted(charType) {
		const rx = new RegExp('^' + (charType || '\\s') + '+');

		this.intro = this.intro.replace(rx, '');
		if (this.intro.length) return true;

		let chunk = this.firstChunk;

		do {
			const end = chunk.end;
			const aborted = chunk.trimStart(rx);

			if (chunk.end !== end) {
				// special case...
				if (chunk === this.lastChunk) this.lastChunk = chunk.next;

				this.byEnd[chunk.end] = chunk;
				this.byStart[chunk.next.start] = chunk.next;
				this.byEnd[chunk.next.end] = chunk.next;
			}

			if (aborted) return true;
			chunk = chunk.next;
		} while (chunk);

		return false;
	}

	trimStart(charType) {
		this.trimStartAborted(charType);
		return this;
	}

	hasChanged() {
		return this.original !== this.toString();
	}

	_replaceRegexp(searchValue, replacement) {
		function getReplacement(match, str) {
			if (typeof replacement === 'string') {
				return replacement.replace(/\$(\$|&|\d+)/g, (_, i) => {
					// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_string_as_a_parameter
					if (i === '$') return '$';
					if (i === '&') return match[0];
					const num = +i;
					if (num < match.length) return match[+i];
					return `$${i}`;
				});
			} else {
				return replacement(...match, match.index, str, match.groups);
			}
		}
		function matchAll(re, str) {
			let match;
			const matches = [];
			while ((match = re.exec(str))) {
				matches.push(match);
			}
			return matches;
		}
		if (searchValue.global) {
			const matches = matchAll(searchValue, this.original);
			matches.forEach((match) => {
				if (match.index != null)
					this.overwrite(
						match.index,
						match.index + match[0].length,
						getReplacement(match, this.original),
					);
			});
		} else {
			const match = this.original.match(searchValue);
			if (match && match.index != null)
				this.overwrite(
					match.index,
					match.index + match[0].length,
					getReplacement(match, this.original),
				);
		}
		return this;
	}

	_replaceString(string, replacement) {
		const { original } = this;
		const index = original.indexOf(string);

		if (index !== -1) {
			this.overwrite(index, index + string.length, replacement);
		}

		return this;
	}

	replace(searchValue, replacement) {
		if (typeof searchValue === 'string') {
			return this._replaceString(searchValue, replacement);
		}

		return this._replaceRegexp(searchValue, replacement);
	}

	_replaceAllString(string, replacement) {
		const { original } = this;
		const stringLength = string.length;
		for (
			let index = original.indexOf(string);
			index !== -1;
			index = original.indexOf(string, index + stringLength)
		) {
			this.overwrite(index, index + stringLength, replacement);
		}

		return this;
	}

	replaceAll(searchValue, replacement) {
		if (typeof searchValue === 'string') {
			return this._replaceAllString(searchValue, replacement);
		}

		if (!searchValue.global) {
			throw new TypeError(
				'MagicString.prototype.replaceAll called with a non-global RegExp argument',
			);
		}

		return this._replaceRegexp(searchValue, replacement);
	}
}

function isReference(node, parent) {
    if (node.type === 'MemberExpression') {
        return !node.computed && isReference(node.object, node);
    }
    if (node.type === 'Identifier') {
        if (!parent)
            return true;
        switch (parent.type) {
            // disregard `bar` in `foo.bar`
            case 'MemberExpression': return parent.computed || node === parent.object;
            // disregard the `foo` in `class {foo(){}}` but keep it in `class {[foo](){}}`
            case 'MethodDefinition': return parent.computed;
            // disregard the `foo` in `class {foo=bar}` but keep it in `class {[foo]=bar}` and `class {bar=foo}`
            case 'FieldDefinition': return parent.computed || node === parent.value;
            // disregard the `bar` in `{ bar: foo }`, but keep it in `{ [bar]: foo }`
            case 'Property': return parent.computed || node === parent.value;
            // disregard the `bar` in `export { foo as bar }` or
            // the foo in `import { foo as bar }`
            case 'ExportSpecifier':
            case 'ImportSpecifier': return node === parent.local;
            // disregard the `foo` in `foo: while (...) { ... break foo; ... continue foo;}`
            case 'LabeledStatement':
            case 'BreakStatement':
            case 'ContinueStatement': return false;
            default: return true;
        }
    }
    return false;
}

var version = "25.0.7";
var peerDependencies = {
	rollup: "^2.68.0||^3.0.0||^4.0.0"
};

function tryParse(parse, code, id) {
  try {
    return parse(code, { allowReturnOutsideFunction: true });
  } catch (err) {
    err.message += ` in ${id}`;
    throw err;
  }
}

const firstpassGlobal = /\b(?:require|module|exports|global)\b/;

const firstpassNoGlobal = /\b(?:require|module|exports)\b/;

function hasCjsKeywords(code, ignoreGlobal) {
  const firstpass = ignoreGlobal ? firstpassNoGlobal : firstpassGlobal;
  return firstpass.test(code);
}

/* eslint-disable no-underscore-dangle */


function analyzeTopLevelStatements(parse, code, id) {
  const ast = tryParse(parse, code, id);

  let isEsModule = false;
  let hasDefaultExport = false;
  let hasNamedExports = false;

  for (const node of ast.body) {
    switch (node.type) {
      case 'ExportDefaultDeclaration':
        isEsModule = true;
        hasDefaultExport = true;
        break;
      case 'ExportNamedDeclaration':
        isEsModule = true;
        if (node.declaration) {
          hasNamedExports = true;
        } else {
          for (const specifier of node.specifiers) {
            if (specifier.exported.name === 'default') {
              hasDefaultExport = true;
            } else {
              hasNamedExports = true;
            }
          }
        }
        break;
      case 'ExportAllDeclaration':
        isEsModule = true;
        if (node.exported && node.exported.name === 'default') {
          hasDefaultExport = true;
        } else {
          hasNamedExports = true;
        }
        break;
      case 'ImportDeclaration':
        isEsModule = true;
        break;
    }
  }

  return { isEsModule, hasDefaultExport, hasNamedExports, ast };
}

/* eslint-disable import/prefer-default-export */


function deconflict(scopes, globals, identifier) {
  let i = 1;
  let deconflicted = makeLegalIdentifier(identifier);
  const hasConflicts = () =>
    scopes.some((scope) => scope.contains(deconflicted)) || globals.has(deconflicted);

  while (hasConflicts()) {
    deconflicted = makeLegalIdentifier(`${identifier}_${i}`);
    i += 1;
  }

  for (const scope of scopes) {
    scope.declarations[deconflicted] = true;
  }

  return deconflicted;
}

function getName(id) {
  const name = makeLegalIdentifier(require$$0$2.basename(id, require$$0$2.extname(id)));
  if (name !== 'index') {
    return name;
  }
  return makeLegalIdentifier(require$$0$2.basename(require$$0$2.dirname(id)));
}

function normalizePathSlashes(path) {
  return path.replace(/\\/g, '/');
}

const getVirtualPathForDynamicRequirePath = (path, commonDir) =>
  `/${normalizePathSlashes(require$$0$2.relative(commonDir, path))}`;

function capitalize(name) {
  return name[0].toUpperCase() + name.slice(1);
}

function getStrictRequiresFilter({ strictRequires }) {
  switch (strictRequires) {
    case true:
      return { strictRequiresFilter: () => true, detectCyclesAndConditional: false };
    // eslint-disable-next-line no-undefined
    case undefined:
    case 'auto':
    case 'debug':
    case null:
      return { strictRequiresFilter: () => false, detectCyclesAndConditional: true };
    case false:
      return { strictRequiresFilter: () => false, detectCyclesAndConditional: false };
    default:
      if (typeof strictRequires === 'string' || Array.isArray(strictRequires)) {
        return {
          strictRequiresFilter: createFilter(strictRequires),
          detectCyclesAndConditional: false
        };
      }
      throw new Error('Unexpected value for "strictRequires" option.');
  }
}

function getPackageEntryPoint(dirPath) {
  let entryPoint = 'index.js';

  try {
    if (fs$7.existsSync(require$$0$2.join(dirPath, 'package.json'))) {
      entryPoint =
        JSON.parse(fs$7.readFileSync(require$$0$2.join(dirPath, 'package.json'), { encoding: 'utf8' })).main ||
        entryPoint;
    }
  } catch (ignored) {
    // ignored
  }

  return entryPoint;
}

function isDirectory(path) {
  try {
    if (fs$7.statSync(path).isDirectory()) return true;
  } catch (ignored) {
    // Nothing to do here
  }
  return false;
}

function getDynamicRequireModules(patterns, dynamicRequireRoot) {
  const dynamicRequireModules = new Map();
  const dirNames = new Set();
  for (const pattern of !patterns || Array.isArray(patterns) ? patterns || [] : [patterns]) {
    const isNegated = pattern.startsWith('!');
    const modifyMap = (targetPath, resolvedPath) =>
      isNegated
        ? dynamicRequireModules.delete(targetPath)
        : dynamicRequireModules.set(targetPath, resolvedPath);
    for (const path of glob.sync(isNegated ? pattern.substr(1) : pattern)) {
      const resolvedPath = require$$0$2.resolve(path);
      const requirePath = normalizePathSlashes(resolvedPath);
      if (isDirectory(resolvedPath)) {
        dirNames.add(resolvedPath);
        const modulePath = require$$0$2.resolve(require$$0$2.join(resolvedPath, getPackageEntryPoint(path)));
        modifyMap(requirePath, modulePath);
        modifyMap(normalizePathSlashes(modulePath), modulePath);
      } else {
        dirNames.add(require$$0$2.dirname(resolvedPath));
        modifyMap(requirePath, resolvedPath);
      }
    }
  }
  return {
    commonDir: dirNames.size ? getCommonDir([...dirNames, dynamicRequireRoot]) : null,
    dynamicRequireModules
  };
}

const FAILED_REQUIRE_ERROR = `throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');`;

const COMMONJS_REQUIRE_EXPORT = 'commonjsRequire';
const CREATE_COMMONJS_REQUIRE_EXPORT = 'createCommonjsRequire';

function getDynamicModuleRegistry(
  isDynamicRequireModulesEnabled,
  dynamicRequireModules,
  commonDir,
  ignoreDynamicRequires
) {
  if (!isDynamicRequireModulesEnabled) {
    return `export function ${COMMONJS_REQUIRE_EXPORT}(path) {
	${FAILED_REQUIRE_ERROR}
}`;
  }
  const dynamicModuleImports = [...dynamicRequireModules.values()]
    .map(
      (id, index) =>
        `import ${
          id.endsWith('.json') ? `json${index}` : `{ __require as require${index} }`
        } from ${JSON.stringify(id)};`
    )
    .join('\n');
  const dynamicModuleProps = [...dynamicRequireModules.keys()]
    .map(
      (id, index) =>
        `\t\t${JSON.stringify(getVirtualPathForDynamicRequirePath(id, commonDir))}: ${
          id.endsWith('.json') ? `function () { return json${index}; }` : `require${index}`
        }`
    )
    .join(',\n');
  return `${dynamicModuleImports}

var dynamicModules;

function getDynamicModules() {
	return dynamicModules || (dynamicModules = {
${dynamicModuleProps}
	});
}

export function ${CREATE_COMMONJS_REQUIRE_EXPORT}(originalModuleDir) {
	function handleRequire(path) {
		var resolvedPath = commonjsResolve(path, originalModuleDir);
		if (resolvedPath !== null) {
			return getDynamicModules()[resolvedPath]();
		}
		${ignoreDynamicRequires ? 'return require(path);' : FAILED_REQUIRE_ERROR}
	}
	handleRequire.resolve = function (path) {
		var resolvedPath = commonjsResolve(path, originalModuleDir);
		if (resolvedPath !== null) {
			return resolvedPath;
		}
		return require.resolve(path);
	}
	return handleRequire;
}

function commonjsResolve (path, originalModuleDir) {
	var shouldTryNodeModules = isPossibleNodeModulesPath(path);
	path = normalize(path);
	var relPath;
	if (path[0] === '/') {
		originalModuleDir = '';
	}
	var modules = getDynamicModules();
	var checkedExtensions = ['', '.js', '.json'];
	while (true) {
		if (!shouldTryNodeModules) {
			relPath = normalize(originalModuleDir + '/' + path);
		} else {
			relPath = normalize(originalModuleDir + '/node_modules/' + path);
		}

		if (relPath.endsWith('/..')) {
			break; // Travelled too far up, avoid infinite loop
		}

		for (var extensionIndex = 0; extensionIndex < checkedExtensions.length; extensionIndex++) {
			var resolvedPath = relPath + checkedExtensions[extensionIndex];
			if (modules[resolvedPath]) {
				return resolvedPath;
			}
		}
		if (!shouldTryNodeModules) break;
		var nextDir = normalize(originalModuleDir + '/..');
		if (nextDir === originalModuleDir) break;
		originalModuleDir = nextDir;
	}
	return null;
}

function isPossibleNodeModulesPath (modulePath) {
	var c0 = modulePath[0];
	if (c0 === '/' || c0 === '\\\\') return false;
	var c1 = modulePath[1], c2 = modulePath[2];
	if ((c0 === '.' && (!c1 || c1 === '/' || c1 === '\\\\')) ||
		(c0 === '.' && c1 === '.' && (!c2 || c2 === '/' || c2 === '\\\\'))) return false;
	if (c1 === ':' && (c2 === '/' || c2 === '\\\\')) return false;
	return true;
}

function normalize (path) {
	path = path.replace(/\\\\/g, '/');
	var parts = path.split('/');
	var slashed = parts[0] === '';
	for (var i = 1; i < parts.length; i++) {
		if (parts[i] === '.' || parts[i] === '') {
			parts.splice(i--, 1);
		}
	}
	for (var i = 1; i < parts.length; i++) {
		if (parts[i] !== '..') continue;
		if (i > 0 && parts[i - 1] !== '..' && parts[i - 1] !== '.') {
			parts.splice(--i, 2);
			i--;
		}
	}
	path = parts.join('/');
	if (slashed && path[0] !== '/') path = '/' + path;
	else if (path.length === 0) path = '.';
	return path;
}`;
}

const isWrappedId = (id, suffix) => id.endsWith(suffix);
const wrapId = (id, suffix) => `\0${id}${suffix}`;
const unwrapId = (wrappedId, suffix) => wrappedId.slice(1, -suffix.length);

const PROXY_SUFFIX = '?commonjs-proxy';
const WRAPPED_SUFFIX = '?commonjs-wrapped';
const EXTERNAL_SUFFIX = '?commonjs-external';
const EXPORTS_SUFFIX = '?commonjs-exports';
const MODULE_SUFFIX = '?commonjs-module';
const ENTRY_SUFFIX = '?commonjs-entry';
const ES_IMPORT_SUFFIX = '?commonjs-es-import';

const DYNAMIC_MODULES_ID = '\0commonjs-dynamic-modules';
const HELPERS_ID = '\0commonjsHelpers.js';

const IS_WRAPPED_COMMONJS = 'withRequireFunction';

// `x['default']` is used instead of `x.default` for backward compatibility with ES3 browsers.
// Minifiers like uglify will usually transpile it back if compatibility with ES3 is not enabled.
// This could be improved by inspecting Rollup's "generatedCode" option

const HELPERS = `
export var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

export function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

export function getDefaultExportFromNamespaceIfPresent (n) {
	return n && Object.prototype.hasOwnProperty.call(n, 'default') ? n['default'] : n;
}

export function getDefaultExportFromNamespaceIfNotNamed (n) {
	return n && Object.prototype.hasOwnProperty.call(n, 'default') && Object.keys(n).length === 1 ? n['default'] : n;
}

export function getAugmentedNamespace(n) {
  if (n.__esModule) return n;
  var f = n.default;
	if (typeof f == "function") {
		var a = function a () {
			if (this instanceof a) {
        return Reflect.construct(f, arguments, this.constructor);
			}
			return f.apply(this, arguments);
		};
		a.prototype = f.prototype;
  } else a = {};
  Object.defineProperty(a, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}
`;

function getHelpersModule() {
  return HELPERS;
}

function getUnknownRequireProxy(id, requireReturnsDefault) {
  if (requireReturnsDefault === true || id.endsWith('.json')) {
    return `export { default } from ${JSON.stringify(id)};`;
  }
  const name = getName(id);
  const exported =
    requireReturnsDefault === 'auto'
      ? `import { getDefaultExportFromNamespaceIfNotNamed } from "${HELPERS_ID}"; export default /*@__PURE__*/getDefaultExportFromNamespaceIfNotNamed(${name});`
      : requireReturnsDefault === 'preferred'
      ? `import { getDefaultExportFromNamespaceIfPresent } from "${HELPERS_ID}"; export default /*@__PURE__*/getDefaultExportFromNamespaceIfPresent(${name});`
      : !requireReturnsDefault
      ? `import { getAugmentedNamespace } from "${HELPERS_ID}"; export default /*@__PURE__*/getAugmentedNamespace(${name});`
      : `export default ${name};`;
  return `import * as ${name} from ${JSON.stringify(id)}; ${exported}`;
}

async function getStaticRequireProxy(id, requireReturnsDefault, loadModule) {
  const name = getName(id);
  const {
    meta: { commonjs: commonjsMeta }
  } = await loadModule({ id });
  if (!commonjsMeta) {
    return getUnknownRequireProxy(id, requireReturnsDefault);
  }
  if (commonjsMeta.isCommonJS) {
    return `export { __moduleExports as default } from ${JSON.stringify(id)};`;
  }
  if (!requireReturnsDefault) {
    return `import { getAugmentedNamespace } from "${HELPERS_ID}"; import * as ${name} from ${JSON.stringify(
      id
    )}; export default /*@__PURE__*/getAugmentedNamespace(${name});`;
  }
  if (
    requireReturnsDefault !== true &&
    (requireReturnsDefault === 'namespace' ||
      !commonjsMeta.hasDefaultExport ||
      (requireReturnsDefault === 'auto' && commonjsMeta.hasNamedExports))
  ) {
    return `import * as ${name} from ${JSON.stringify(id)}; export default ${name};`;
  }
  return `export { default } from ${JSON.stringify(id)};`;
}

function getEntryProxy(id, defaultIsModuleExports, getModuleInfo, shebang) {
  const {
    meta: { commonjs: commonjsMeta },
    hasDefaultExport
  } = getModuleInfo(id);
  if (!commonjsMeta || commonjsMeta.isCommonJS !== IS_WRAPPED_COMMONJS) {
    const stringifiedId = JSON.stringify(id);
    let code = `export * from ${stringifiedId};`;
    if (hasDefaultExport) {
      code += `export { default } from ${stringifiedId};`;
    }
    return shebang + code;
  }
  const result = getEsImportProxy(id, defaultIsModuleExports);
  return {
    ...result,
    code: shebang + result.code
  };
}

function getEsImportProxy(id, defaultIsModuleExports) {
  const name = getName(id);
  const exportsName = `${name}Exports`;
  const requireModule = `require${capitalize(name)}`;
  let code =
    `import { getDefaultExportFromCjs } from "${HELPERS_ID}";\n` +
    `import { __require as ${requireModule} } from ${JSON.stringify(id)};\n` +
    `var ${exportsName} = ${requireModule}();\n` +
    `export { ${exportsName} as __moduleExports };`;
  if (defaultIsModuleExports === true) {
    code += `\nexport { ${exportsName} as default };`;
  } else {
    code += `export default /*@__PURE__*/getDefaultExportFromCjs(${exportsName});`;
  }
  return {
    code,
    syntheticNamedExports: '__moduleExports'
  };
}

/* eslint-disable no-param-reassign, no-undefined */


function getCandidatesForExtension(resolved, extension) {
  return [resolved + extension, `${resolved}${require$$0$2.sep}index${extension}`];
}

function getCandidates(resolved, extensions) {
  return extensions.reduce(
    (paths, extension) => paths.concat(getCandidatesForExtension(resolved, extension)),
    [resolved]
  );
}

function resolveExtensions(importee, importer, extensions) {
  // not our problem
  if (importee[0] !== '.' || !importer) return undefined;

  const resolved = require$$0$2.resolve(require$$0$2.dirname(importer), importee);
  const candidates = getCandidates(resolved, extensions);

  for (let i = 0; i < candidates.length; i += 1) {
    try {
      const stats = fs$7.statSync(candidates[i]);
      if (stats.isFile()) return { id: candidates[i] };
    } catch (err) {
      /* noop */
    }
  }

  return undefined;
}

function getResolveId(extensions, isPossibleCjsId) {
  const currentlyResolving = new Map();

  return {
    /**
     * This is a Maps of importers to Sets of require sources being resolved at
     * the moment by resolveRequireSourcesAndUpdateMeta
     */
    currentlyResolving,
    async resolveId(importee, importer, resolveOptions) {
      const customOptions = resolveOptions.custom;
      // All logic below is specific to ES imports.
      // Also, if we do not skip this logic for requires that are resolved while
      // transforming a commonjs file, it can easily lead to deadlocks.
      if (
        customOptions &&
        customOptions['node-resolve'] &&
        customOptions['node-resolve'].isRequire
      ) {
        return null;
      }
      const currentlyResolvingForParent = currentlyResolving.get(importer);
      if (currentlyResolvingForParent && currentlyResolvingForParent.has(importee)) {
        this.warn({
          code: 'THIS_RESOLVE_WITHOUT_OPTIONS',
          message:
            'It appears a plugin has implemented a "resolveId" hook that uses "this.resolve" without forwarding the third "options" parameter of "resolveId". This is problematic as it can lead to wrong module resolutions especially for the node-resolve plugin and in certain cases cause early exit errors for the commonjs plugin.\nIn rare cases, this warning can appear if the same file is both imported and required from the same mixed ES/CommonJS module, in which case it can be ignored.',
          url: 'https://rollupjs.org/guide/en/#resolveid'
        });
        return null;
      }

      if (isWrappedId(importee, WRAPPED_SUFFIX)) {
        return unwrapId(importee, WRAPPED_SUFFIX);
      }

      if (
        importee.endsWith(ENTRY_SUFFIX) ||
        isWrappedId(importee, MODULE_SUFFIX) ||
        isWrappedId(importee, EXPORTS_SUFFIX) ||
        isWrappedId(importee, PROXY_SUFFIX) ||
        isWrappedId(importee, ES_IMPORT_SUFFIX) ||
        isWrappedId(importee, EXTERNAL_SUFFIX) ||
        importee.startsWith(HELPERS_ID) ||
        importee === DYNAMIC_MODULES_ID
      ) {
        return importee;
      }

      if (importer) {
        if (
          importer === DYNAMIC_MODULES_ID ||
          // Proxies are only importing resolved ids, no need to resolve again
          isWrappedId(importer, PROXY_SUFFIX) ||
          isWrappedId(importer, ES_IMPORT_SUFFIX) ||
          importer.endsWith(ENTRY_SUFFIX)
        ) {
          return importee;
        }
        if (isWrappedId(importer, EXTERNAL_SUFFIX)) {
          // We need to return null for unresolved imports so that the proper warning is shown
          if (
            !(await this.resolve(
              importee,
              importer,
              Object.assign({ skipSelf: true }, resolveOptions)
            ))
          ) {
            return null;
          }
          // For other external imports, we need to make sure they are handled as external
          return { id: importee, external: true };
        }
      }

      if (importee.startsWith('\0')) {
        return null;
      }

      // If this is an entry point or ESM import, we need to figure out if the importee is wrapped and
      // if that is the case, we need to add a proxy.
      const resolved =
        (await this.resolve(
          importee,
          importer,
          Object.assign({ skipSelf: true }, resolveOptions)
        )) || resolveExtensions(importee, importer, extensions);
      // Make sure that even if other plugins resolve again, we ignore our own proxies
      if (
        !resolved ||
        resolved.external ||
        resolved.id.endsWith(ENTRY_SUFFIX) ||
        isWrappedId(resolved.id, ES_IMPORT_SUFFIX) ||
        !isPossibleCjsId(resolved.id)
      ) {
        return resolved;
      }
      const moduleInfo = await this.load(resolved);
      const {
        meta: { commonjs: commonjsMeta }
      } = moduleInfo;
      if (commonjsMeta) {
        const { isCommonJS } = commonjsMeta;
        if (isCommonJS) {
          if (resolveOptions.isEntry) {
            moduleInfo.moduleSideEffects = true;
            // We must not precede entry proxies with a `\0` as that will mess up relative external resolution
            return resolved.id + ENTRY_SUFFIX;
          }
          if (isCommonJS === IS_WRAPPED_COMMONJS) {
            return { id: wrapId(resolved.id, ES_IMPORT_SUFFIX), meta: { commonjs: { resolved } } };
          }
        }
      }
      return resolved;
    }
  };
}

function getRequireResolver(extensions, detectCyclesAndConditional, currentlyResolving) {
  const knownCjsModuleTypes = Object.create(null);
  const requiredIds = Object.create(null);
  const unconditionallyRequiredIds = Object.create(null);
  const dependencies = Object.create(null);
  const getDependencies = (id) => dependencies[id] || (dependencies[id] = new Set());

  const isCyclic = (id) => {
    const dependenciesToCheck = new Set(getDependencies(id));
    for (const dependency of dependenciesToCheck) {
      if (dependency === id) {
        return true;
      }
      for (const childDependency of getDependencies(dependency)) {
        dependenciesToCheck.add(childDependency);
      }
    }
    return false;
  };

  // Once a module is listed here, its type (wrapped or not) is fixed and may
  // not change for the rest of the current build, to not break already
  // transformed modules.
  const fullyAnalyzedModules = Object.create(null);

  const getTypeForFullyAnalyzedModule = (id) => {
    const knownType = knownCjsModuleTypes[id];
    if (knownType !== true || !detectCyclesAndConditional || fullyAnalyzedModules[id]) {
      return knownType;
    }
    if (isCyclic(id)) {
      return (knownCjsModuleTypes[id] = IS_WRAPPED_COMMONJS);
    }
    return knownType;
  };

  const setInitialParentType = (id, initialCommonJSType) => {
    // Fully analyzed modules may never change type
    if (fullyAnalyzedModules[id]) {
      return;
    }
    knownCjsModuleTypes[id] = initialCommonJSType;
    if (
      detectCyclesAndConditional &&
      knownCjsModuleTypes[id] === true &&
      requiredIds[id] &&
      !unconditionallyRequiredIds[id]
    ) {
      knownCjsModuleTypes[id] = IS_WRAPPED_COMMONJS;
    }
  };

  const analyzeRequiredModule = async (parentId, resolved, isConditional, loadModule) => {
    const childId = resolved.id;
    requiredIds[childId] = true;
    if (!(isConditional || knownCjsModuleTypes[parentId] === IS_WRAPPED_COMMONJS)) {
      unconditionallyRequiredIds[childId] = true;
    }

    getDependencies(parentId).add(childId);
    if (!isCyclic(childId)) {
      // This makes sure the current transform handler waits for all direct
      // dependencies to be loaded and transformed and therefore for all
      // transitive CommonJS dependencies to be loaded as well so that all
      // cycles have been found and knownCjsModuleTypes is reliable.
      await loadModule(resolved);
    }
  };

  const getTypeForImportedModule = async (resolved, loadModule) => {
    if (resolved.id in knownCjsModuleTypes) {
      // This handles cyclic ES dependencies
      return knownCjsModuleTypes[resolved.id];
    }
    const {
      meta: { commonjs }
    } = await loadModule(resolved);
    return (commonjs && commonjs.isCommonJS) || false;
  };

  return {
    getWrappedIds: () =>
      Object.keys(knownCjsModuleTypes).filter(
        (id) => knownCjsModuleTypes[id] === IS_WRAPPED_COMMONJS
      ),
    isRequiredId: (id) => requiredIds[id],
    async shouldTransformCachedModule({
      id: parentId,
      resolvedSources,
      meta: { commonjs: parentMeta }
    }) {
      // We explicitly track ES modules to handle circular imports
      if (!(parentMeta && parentMeta.isCommonJS)) knownCjsModuleTypes[parentId] = false;
      if (isWrappedId(parentId, ES_IMPORT_SUFFIX)) return false;
      const parentRequires = parentMeta && parentMeta.requires;
      if (parentRequires) {
        setInitialParentType(parentId, parentMeta.initialCommonJSType);
        await Promise.all(
          parentRequires.map(({ resolved, isConditional }) =>
            analyzeRequiredModule(parentId, resolved, isConditional, this.load)
          )
        );
        if (getTypeForFullyAnalyzedModule(parentId) !== parentMeta.isCommonJS) {
          return true;
        }
        for (const {
          resolved: { id }
        } of parentRequires) {
          if (getTypeForFullyAnalyzedModule(id) !== parentMeta.isRequiredCommonJS[id]) {
            return true;
          }
        }
        // Now that we decided to go with the cached copy, neither the parent
        // module nor any of its children may change types anymore
        fullyAnalyzedModules[parentId] = true;
        for (const {
          resolved: { id }
        } of parentRequires) {
          fullyAnalyzedModules[id] = true;
        }
      }
      const parentRequireSet = new Set((parentRequires || []).map(({ resolved: { id } }) => id));
      return (
        await Promise.all(
          Object.keys(resolvedSources)
            .map((source) => resolvedSources[source])
            .filter(({ id, external }) => !(external || parentRequireSet.has(id)))
            .map(async (resolved) => {
              if (isWrappedId(resolved.id, ES_IMPORT_SUFFIX)) {
                return (
                  (await getTypeForImportedModule(
                    (
                      await this.load({ id: resolved.id })
                    ).meta.commonjs.resolved,
                    this.load
                  )) !== IS_WRAPPED_COMMONJS
                );
              }
              return (await getTypeForImportedModule(resolved, this.load)) === IS_WRAPPED_COMMONJS;
            })
        )
      ).some((shouldTransform) => shouldTransform);
    },
    /* eslint-disable no-param-reassign */
    resolveRequireSourcesAndUpdateMeta:
      (rollupContext) => async (parentId, isParentCommonJS, parentMeta, sources) => {
        parentMeta.initialCommonJSType = isParentCommonJS;
        parentMeta.requires = [];
        parentMeta.isRequiredCommonJS = Object.create(null);
        setInitialParentType(parentId, isParentCommonJS);
        const currentlyResolvingForParent = currentlyResolving.get(parentId) || new Set();
        currentlyResolving.set(parentId, currentlyResolvingForParent);
        const requireTargets = await Promise.all(
          sources.map(async ({ source, isConditional }) => {
            // Never analyze or proxy internal modules
            if (source.startsWith('\0')) {
              return { id: source, allowProxy: false };
            }
            currentlyResolvingForParent.add(source);
            const resolved =
              (await rollupContext.resolve(source, parentId, {
                skipSelf: false,
                custom: { 'node-resolve': { isRequire: true } }
              })) || resolveExtensions(source, parentId, extensions);
            currentlyResolvingForParent.delete(source);
            if (!resolved) {
              return { id: wrapId(source, EXTERNAL_SUFFIX), allowProxy: false };
            }
            const childId = resolved.id;
            if (resolved.external) {
              return { id: wrapId(childId, EXTERNAL_SUFFIX), allowProxy: false };
            }
            parentMeta.requires.push({ resolved, isConditional });
            await analyzeRequiredModule(parentId, resolved, isConditional, rollupContext.load);
            return { id: childId, allowProxy: true };
          })
        );
        parentMeta.isCommonJS = getTypeForFullyAnalyzedModule(parentId);
        fullyAnalyzedModules[parentId] = true;
        return requireTargets.map(({ id: dependencyId, allowProxy }, index) => {
          // eslint-disable-next-line no-multi-assign
          const isCommonJS = (parentMeta.isRequiredCommonJS[dependencyId] =
            getTypeForFullyAnalyzedModule(dependencyId));
          fullyAnalyzedModules[dependencyId] = true;
          return {
            source: sources[index].source,
            id: allowProxy
              ? isCommonJS === IS_WRAPPED_COMMONJS
                ? wrapId(dependencyId, WRAPPED_SUFFIX)
                : wrapId(dependencyId, PROXY_SUFFIX)
              : dependencyId,
            isCommonJS
          };
        });
      },
    isCurrentlyResolving(source, parentId) {
      const currentlyResolvingForParent = currentlyResolving.get(parentId);
      return currentlyResolvingForParent && currentlyResolvingForParent.has(source);
    }
  };
}

function validateVersion(actualVersion, peerDependencyVersion, name) {
  const versionRegexp = /\^(\d+\.\d+\.\d+)/g;
  let minMajor = Infinity;
  let minMinor = Infinity;
  let minPatch = Infinity;
  let foundVersion;
  // eslint-disable-next-line no-cond-assign
  while ((foundVersion = versionRegexp.exec(peerDependencyVersion))) {
    const [foundMajor, foundMinor, foundPatch] = foundVersion[1].split('.').map(Number);
    if (foundMajor < minMajor) {
      minMajor = foundMajor;
      minMinor = foundMinor;
      minPatch = foundPatch;
    }
  }
  if (!actualVersion) {
    throw new Error(
      `Insufficient ${name} version: "@rollup/plugin-commonjs" requires at least ${name}@${minMajor}.${minMinor}.${minPatch}.`
    );
  }
  const [major, minor, patch] = actualVersion.split('.').map(Number);
  if (
    major < minMajor ||
    (major === minMajor && (minor < minMinor || (minor === minMinor && patch < minPatch)))
  ) {
    throw new Error(
      `Insufficient ${name} version: "@rollup/plugin-commonjs" requires at least ${name}@${minMajor}.${minMinor}.${minPatch} but found ${name}@${actualVersion}.`
    );
  }
}

const operators = {
  '==': (x) => equals(x.left, x.right, false),

  '!=': (x) => not(operators['=='](x)),

  '===': (x) => equals(x.left, x.right, true),

  '!==': (x) => not(operators['==='](x)),

  '!': (x) => isFalsy(x.argument),

  '&&': (x) => isTruthy(x.left) && isTruthy(x.right),

  '||': (x) => isTruthy(x.left) || isTruthy(x.right)
};

function not(value) {
  return value === null ? value : !value;
}

function equals(a, b, strict) {
  if (a.type !== b.type) return null;
  // eslint-disable-next-line eqeqeq
  if (a.type === 'Literal') return strict ? a.value === b.value : a.value == b.value;
  return null;
}

function isTruthy(node) {
  if (!node) return false;
  if (node.type === 'Literal') return !!node.value;
  if (node.type === 'ParenthesizedExpression') return isTruthy(node.expression);
  if (node.operator in operators) return operators[node.operator](node);
  return null;
}

function isFalsy(node) {
  return not(isTruthy(node));
}

function getKeypath(node) {
  const parts = [];

  while (node.type === 'MemberExpression') {
    if (node.computed) return null;

    parts.unshift(node.property.name);
    // eslint-disable-next-line no-param-reassign
    node = node.object;
  }

  if (node.type !== 'Identifier') return null;

  const { name } = node;
  parts.unshift(name);

  return { name, keypath: parts.join('.') };
}

const KEY_COMPILED_ESM = '__esModule';

function getDefineCompiledEsmType(node) {
  const definedPropertyWithExports = getDefinePropertyCallName(node, 'exports');
  const definedProperty =
    definedPropertyWithExports || getDefinePropertyCallName(node, 'module.exports');
  if (definedProperty && definedProperty.key === KEY_COMPILED_ESM) {
    return isTruthy(definedProperty.value)
      ? definedPropertyWithExports
        ? 'exports'
        : 'module'
      : false;
  }
  return false;
}

function getDefinePropertyCallName(node, targetName) {
  const {
    callee: { object, property }
  } = node;
  if (!object || object.type !== 'Identifier' || object.name !== 'Object') return;
  if (!property || property.type !== 'Identifier' || property.name !== 'defineProperty') return;
  if (node.arguments.length !== 3) return;

  const targetNames = targetName.split('.');
  const [target, key, value] = node.arguments;
  if (targetNames.length === 1) {
    if (target.type !== 'Identifier' || target.name !== targetNames[0]) {
      return;
    }
  }

  if (targetNames.length === 2) {
    if (
      target.type !== 'MemberExpression' ||
      target.object.name !== targetNames[0] ||
      target.property.name !== targetNames[1]
    ) {
      return;
    }
  }

  if (value.type !== 'ObjectExpression' || !value.properties) return;

  const valueProperty = value.properties.find((p) => p.key && p.key.name === 'value');
  if (!valueProperty || !valueProperty.value) return;

  // eslint-disable-next-line consistent-return
  return { key: key.value, value: valueProperty.value };
}

function isShorthandProperty(parent) {
  return parent && parent.type === 'Property' && parent.shorthand;
}

function wrapCode(magicString, uses, moduleName, exportsName, indentExclusionRanges) {
  const args = [];
  const passedArgs = [];
  if (uses.module) {
    args.push('module');
    passedArgs.push(moduleName);
  }
  if (uses.exports) {
    args.push('exports');
    passedArgs.push(uses.module ? `${moduleName}.exports` : exportsName);
  }
  magicString
    .trim()
    .indent('\t', { exclude: indentExclusionRanges })
    .prepend(`(function (${args.join(', ')}) {\n`)
    // For some reason, this line is only indented correctly when using a
    // require-wrapper if we have this leading space
    .append(` \n} (${passedArgs.join(', ')}));`);
}

function rewriteExportsAndGetExportsBlock(
  magicString,
  moduleName,
  exportsName,
  exportedExportsName,
  wrapped,
  moduleExportsAssignments,
  firstTopLevelModuleExportsAssignment,
  exportsAssignmentsByName,
  topLevelAssignments,
  defineCompiledEsmExpressions,
  deconflictedExportNames,
  code,
  HELPERS_NAME,
  exportMode,
  defaultIsModuleExports,
  usesRequireWrapper,
  requireName
) {
  const exports = [];
  const exportDeclarations = [];

  if (usesRequireWrapper) {
    getExportsWhenUsingRequireWrapper(
      magicString,
      wrapped,
      exportMode,
      exports,
      moduleExportsAssignments,
      exportsAssignmentsByName,
      moduleName,
      exportsName,
      requireName,
      defineCompiledEsmExpressions
    );
  } else if (exportMode === 'replace') {
    getExportsForReplacedModuleExports(
      magicString,
      exports,
      exportDeclarations,
      moduleExportsAssignments,
      firstTopLevelModuleExportsAssignment,
      exportsName,
      defaultIsModuleExports,
      HELPERS_NAME
    );
  } else {
    if (exportMode === 'module') {
      exportDeclarations.push(`var ${exportedExportsName} = ${moduleName}.exports`);
      exports.push(`${exportedExportsName} as __moduleExports`);
    } else {
      exports.push(`${exportsName} as __moduleExports`);
    }
    if (wrapped) {
      exportDeclarations.push(
        getDefaultExportDeclaration(exportedExportsName, defaultIsModuleExports, HELPERS_NAME)
      );
    } else {
      getExports(
        magicString,
        exports,
        exportDeclarations,
        moduleExportsAssignments,
        exportsAssignmentsByName,
        deconflictedExportNames,
        topLevelAssignments,
        moduleName,
        exportsName,
        exportedExportsName,
        defineCompiledEsmExpressions,
        HELPERS_NAME,
        defaultIsModuleExports,
        exportMode
      );
    }
  }
  if (exports.length) {
    exportDeclarations.push(`export { ${exports.join(', ')} }`);
  }

  return `\n\n${exportDeclarations.join(';\n')};`;
}

function getExportsWhenUsingRequireWrapper(
  magicString,
  wrapped,
  exportMode,
  exports,
  moduleExportsAssignments,
  exportsAssignmentsByName,
  moduleName,
  exportsName,
  requireName,
  defineCompiledEsmExpressions
) {
  exports.push(`${requireName} as __require`);
  if (wrapped) return;
  if (exportMode === 'replace') {
    rewriteModuleExportsAssignments(magicString, moduleExportsAssignments, exportsName);
  } else {
    rewriteModuleExportsAssignments(magicString, moduleExportsAssignments, `${moduleName}.exports`);
    // Collect and rewrite named exports
    for (const [exportName, { nodes }] of exportsAssignmentsByName) {
      for (const { node, type } of nodes) {
        magicString.overwrite(
          node.start,
          node.left.end,
          `${
            exportMode === 'module' && type === 'module' ? `${moduleName}.exports` : exportsName
          }.${exportName}`
        );
      }
    }
    replaceDefineCompiledEsmExpressionsAndGetIfRestorable(
      defineCompiledEsmExpressions,
      magicString,
      exportMode,
      moduleName,
      exportsName
    );
  }
}

function getExportsForReplacedModuleExports(
  magicString,
  exports,
  exportDeclarations,
  moduleExportsAssignments,
  firstTopLevelModuleExportsAssignment,
  exportsName,
  defaultIsModuleExports,
  HELPERS_NAME
) {
  for (const { left } of moduleExportsAssignments) {
    magicString.overwrite(left.start, left.end, exportsName);
  }
  magicString.prependRight(firstTopLevelModuleExportsAssignment.left.start, 'var ');
  exports.push(`${exportsName} as __moduleExports`);
  exportDeclarations.push(
    getDefaultExportDeclaration(exportsName, defaultIsModuleExports, HELPERS_NAME)
  );
}

function getDefaultExportDeclaration(exportedExportsName, defaultIsModuleExports, HELPERS_NAME) {
  return `export default ${
    defaultIsModuleExports === true
      ? exportedExportsName
      : defaultIsModuleExports === false
      ? `${exportedExportsName}.default`
      : `/*@__PURE__*/${HELPERS_NAME}.getDefaultExportFromCjs(${exportedExportsName})`
  }`;
}

function getExports(
  magicString,
  exports,
  exportDeclarations,
  moduleExportsAssignments,
  exportsAssignmentsByName,
  deconflictedExportNames,
  topLevelAssignments,
  moduleName,
  exportsName,
  exportedExportsName,
  defineCompiledEsmExpressions,
  HELPERS_NAME,
  defaultIsModuleExports,
  exportMode
) {
  let deconflictedDefaultExportName;
  // Collect and rewrite module.exports assignments
  for (const { left } of moduleExportsAssignments) {
    magicString.overwrite(left.start, left.end, `${moduleName}.exports`);
  }

  // Collect and rewrite named exports
  for (const [exportName, { nodes }] of exportsAssignmentsByName) {
    const deconflicted = deconflictedExportNames[exportName];
    let needsDeclaration = true;
    for (const { node, type } of nodes) {
      let replacement = `${deconflicted} = ${
        exportMode === 'module' && type === 'module' ? `${moduleName}.exports` : exportsName
      }.${exportName}`;
      if (needsDeclaration && topLevelAssignments.has(node)) {
        replacement = `var ${replacement}`;
        needsDeclaration = false;
      }
      magicString.overwrite(node.start, node.left.end, replacement);
    }
    if (needsDeclaration) {
      magicString.prepend(`var ${deconflicted};\n`);
    }

    if (exportName === 'default') {
      deconflictedDefaultExportName = deconflicted;
    } else {
      exports.push(exportName === deconflicted ? exportName : `${deconflicted} as ${exportName}`);
    }
  }

  const isRestorableCompiledEsm = replaceDefineCompiledEsmExpressionsAndGetIfRestorable(
    defineCompiledEsmExpressions,
    magicString,
    exportMode,
    moduleName,
    exportsName
  );

  if (
    defaultIsModuleExports === false ||
    (defaultIsModuleExports === 'auto' &&
      isRestorableCompiledEsm &&
      moduleExportsAssignments.length === 0)
  ) {
    // If there is no deconflictedDefaultExportName, then we use the namespace as
    // fallback because there can be no "default" property on the namespace
    exports.push(`${deconflictedDefaultExportName || exportedExportsName} as default`);
  } else if (
    defaultIsModuleExports === true ||
    (!isRestorableCompiledEsm && moduleExportsAssignments.length === 0)
  ) {
    exports.push(`${exportedExportsName} as default`);
  } else {
    exportDeclarations.push(
      getDefaultExportDeclaration(exportedExportsName, defaultIsModuleExports, HELPERS_NAME)
    );
  }
}

function rewriteModuleExportsAssignments(magicString, moduleExportsAssignments, exportsName) {
  for (const { left } of moduleExportsAssignments) {
    magicString.overwrite(left.start, left.end, exportsName);
  }
}

function replaceDefineCompiledEsmExpressionsAndGetIfRestorable(
  defineCompiledEsmExpressions,
  magicString,
  exportMode,
  moduleName,
  exportsName
) {
  let isRestorableCompiledEsm = false;
  for (const { node, type } of defineCompiledEsmExpressions) {
    isRestorableCompiledEsm = true;
    const moduleExportsExpression =
      node.type === 'CallExpression' ? node.arguments[0] : node.left.object;
    magicString.overwrite(
      moduleExportsExpression.start,
      moduleExportsExpression.end,
      exportMode === 'module' && type === 'module' ? `${moduleName}.exports` : exportsName
    );
  }
  return isRestorableCompiledEsm;
}

function isRequireExpression(node, scope) {
  if (!node) return false;
  if (node.type !== 'CallExpression') return false;

  // Weird case of `require()` or `module.require()` without arguments
  if (node.arguments.length === 0) return false;

  return isRequire(node.callee, scope);
}

function isRequire(node, scope) {
  return (
    (node.type === 'Identifier' && node.name === 'require' && !scope.contains('require')) ||
    (node.type === 'MemberExpression' && isModuleRequire(node, scope))
  );
}

function isModuleRequire({ object, property }, scope) {
  return (
    object.type === 'Identifier' &&
    object.name === 'module' &&
    property.type === 'Identifier' &&
    property.name === 'require' &&
    !scope.contains('module')
  );
}

function hasDynamicArguments(node) {
  return (
    node.arguments.length > 1 ||
    (node.arguments[0].type !== 'Literal' &&
      (node.arguments[0].type !== 'TemplateLiteral' || node.arguments[0].expressions.length > 0))
  );
}

const reservedMethod = { resolve: true, cache: true, main: true };

function isNodeRequirePropertyAccess(parent) {
  return parent && parent.property && reservedMethod[parent.property.name];
}

function getRequireStringArg(node) {
  return node.arguments[0].type === 'Literal'
    ? node.arguments[0].value
    : node.arguments[0].quasis[0].value.cooked;
}

function getRequireHandlers() {
  const requireExpressions = [];

  function addRequireExpression(
    sourceId,
    node,
    scope,
    usesReturnValue,
    isInsideTryBlock,
    isInsideConditional,
    toBeRemoved
  ) {
    requireExpressions.push({
      sourceId,
      node,
      scope,
      usesReturnValue,
      isInsideTryBlock,
      isInsideConditional,
      toBeRemoved
    });
  }

  async function rewriteRequireExpressionsAndGetImportBlock(
    magicString,
    topLevelDeclarations,
    reassignedNames,
    helpersName,
    dynamicRequireName,
    moduleName,
    exportsName,
    id,
    exportMode,
    resolveRequireSourcesAndUpdateMeta,
    needsRequireWrapper,
    isEsModule,
    isDynamicRequireModulesEnabled,
    getIgnoreTryCatchRequireStatementMode,
    commonjsMeta
  ) {
    const imports = [];
    imports.push(`import * as ${helpersName} from "${HELPERS_ID}"`);
    if (dynamicRequireName) {
      imports.push(
        `import { ${
          isDynamicRequireModulesEnabled ? CREATE_COMMONJS_REQUIRE_EXPORT : COMMONJS_REQUIRE_EXPORT
        } as ${dynamicRequireName} } from "${DYNAMIC_MODULES_ID}"`
      );
    }
    if (exportMode === 'module') {
      imports.push(
        `import { __module as ${moduleName} } from ${JSON.stringify(wrapId(id, MODULE_SUFFIX))}`,
        `var ${exportsName} = ${moduleName}.exports`
      );
    } else if (exportMode === 'exports') {
      imports.push(
        `import { __exports as ${exportsName} } from ${JSON.stringify(wrapId(id, EXPORTS_SUFFIX))}`
      );
    }
    const requiresBySource = collectSources(requireExpressions);
    const requireTargets = await resolveRequireSourcesAndUpdateMeta(
      id,
      needsRequireWrapper ? IS_WRAPPED_COMMONJS : !isEsModule,
      commonjsMeta,
      Object.keys(requiresBySource).map((source) => {
        return {
          source,
          isConditional: requiresBySource[source].every((require) => require.isInsideConditional)
        };
      })
    );
    processRequireExpressions(
      imports,
      requireTargets,
      requiresBySource,
      getIgnoreTryCatchRequireStatementMode,
      magicString
    );
    return imports.length ? `${imports.join(';\n')};\n\n` : '';
  }

  return {
    addRequireExpression,
    rewriteRequireExpressionsAndGetImportBlock
  };
}

function collectSources(requireExpressions) {
  const requiresBySource = Object.create(null);
  for (const requireExpression of requireExpressions) {
    const { sourceId } = requireExpression;
    if (!requiresBySource[sourceId]) {
      requiresBySource[sourceId] = [];
    }
    const requires = requiresBySource[sourceId];
    requires.push(requireExpression);
  }
  return requiresBySource;
}

function processRequireExpressions(
  imports,
  requireTargets,
  requiresBySource,
  getIgnoreTryCatchRequireStatementMode,
  magicString
) {
  const generateRequireName = getGenerateRequireName();
  for (const { source, id: resolvedId, isCommonJS } of requireTargets) {
    const requires = requiresBySource[source];
    const name = generateRequireName(requires);
    let usesRequired = false;
    let needsImport = false;
    for (const { node, usesReturnValue, toBeRemoved, isInsideTryBlock } of requires) {
      const { canConvertRequire, shouldRemoveRequire } =
        isInsideTryBlock && isWrappedId(resolvedId, EXTERNAL_SUFFIX)
          ? getIgnoreTryCatchRequireStatementMode(source)
          : { canConvertRequire: true, shouldRemoveRequire: false };
      if (shouldRemoveRequire) {
        if (usesReturnValue) {
          magicString.overwrite(node.start, node.end, 'undefined');
        } else {
          magicString.remove(toBeRemoved.start, toBeRemoved.end);
        }
      } else if (canConvertRequire) {
        needsImport = true;
        if (isCommonJS === IS_WRAPPED_COMMONJS) {
          magicString.overwrite(node.start, node.end, `${name}()`);
        } else if (usesReturnValue) {
          usesRequired = true;
          magicString.overwrite(node.start, node.end, name);
        } else {
          magicString.remove(toBeRemoved.start, toBeRemoved.end);
        }
      }
    }
    if (needsImport) {
      if (isCommonJS === IS_WRAPPED_COMMONJS) {
        imports.push(`import { __require as ${name} } from ${JSON.stringify(resolvedId)}`);
      } else {
        imports.push(`import ${usesRequired ? `${name} from ` : ''}${JSON.stringify(resolvedId)}`);
      }
    }
  }
}

function getGenerateRequireName() {
  let uid = 0;
  return (requires) => {
    let name;
    const hasNameConflict = ({ scope }) => scope.contains(name);
    do {
      name = `require$$${uid}`;
      uid += 1;
    } while (requires.some(hasNameConflict));
    return name;
  };
}

/* eslint-disable no-param-reassign, no-shadow, no-underscore-dangle, no-continue */


const exportsPattern = /^(?:module\.)?exports(?:\.([a-zA-Z_$][a-zA-Z_$0-9]*))?$/;

const functionType = /^(?:FunctionDeclaration|FunctionExpression|ArrowFunctionExpression)$/;

// There are three different types of CommonJS modules, described by their
// "exportMode":
// - exports: Only assignments to (module.)exports properties
// - replace: A single assignment to module.exports itself
// - module: Anything else
// Special cases:
// - usesRequireWrapper
// - isWrapped
async function transformCommonjs(
  parse,
  code,
  id,
  isEsModule,
  ignoreGlobal,
  ignoreRequire,
  ignoreDynamicRequires,
  getIgnoreTryCatchRequireStatementMode,
  sourceMap,
  isDynamicRequireModulesEnabled,
  dynamicRequireModules,
  commonDir,
  astCache,
  defaultIsModuleExports,
  needsRequireWrapper,
  resolveRequireSourcesAndUpdateMeta,
  isRequired,
  checkDynamicRequire,
  commonjsMeta
) {
  const ast = astCache || tryParse(parse, code, id);
  const magicString = new MagicString(code);
  const uses = {
    module: false,
    exports: false,
    global: false,
    require: false
  };
  const virtualDynamicRequirePath =
    isDynamicRequireModulesEnabled && getVirtualPathForDynamicRequirePath(require$$0$2.dirname(id), commonDir);
  let scope = attachScopes(ast, 'scope');
  let lexicalDepth = 0;
  let programDepth = 0;
  let classBodyDepth = 0;
  let currentTryBlockEnd = null;
  let shouldWrap = false;

  const globals = new Set();
  // A conditionalNode is a node for which execution is not guaranteed. If such a node is a require
  // or contains nested requires, those should be handled as function calls unless there is an
  // unconditional require elsewhere.
  let currentConditionalNodeEnd = null;
  const conditionalNodes = new Set();
  const { addRequireExpression, rewriteRequireExpressionsAndGetImportBlock } = getRequireHandlers();

  // See which names are assigned to. This is necessary to prevent
  // illegally replacing `var foo = require('foo')` with `import foo from 'foo'`,
  // where `foo` is later reassigned. (This happens in the wild. CommonJS, sigh)
  const reassignedNames = new Set();
  const topLevelDeclarations = [];
  const skippedNodes = new Set();
  const moduleAccessScopes = new Set([scope]);
  const exportsAccessScopes = new Set([scope]);
  const moduleExportsAssignments = [];
  let firstTopLevelModuleExportsAssignment = null;
  const exportsAssignmentsByName = new Map();
  const topLevelAssignments = new Set();
  const topLevelDefineCompiledEsmExpressions = [];
  const replacedGlobal = [];
  const replacedDynamicRequires = [];
  const importedVariables = new Set();
  const indentExclusionRanges = [];

  walk(ast, {
    enter(node, parent) {
      if (skippedNodes.has(node)) {
        this.skip();
        return;
      }

      if (currentTryBlockEnd !== null && node.start > currentTryBlockEnd) {
        currentTryBlockEnd = null;
      }
      if (currentConditionalNodeEnd !== null && node.start > currentConditionalNodeEnd) {
        currentConditionalNodeEnd = null;
      }
      if (currentConditionalNodeEnd === null && conditionalNodes.has(node)) {
        currentConditionalNodeEnd = node.end;
      }

      programDepth += 1;
      if (node.scope) ({ scope } = node);
      if (functionType.test(node.type)) lexicalDepth += 1;
      if (sourceMap) {
        magicString.addSourcemapLocation(node.start);
        magicString.addSourcemapLocation(node.end);
      }

      // eslint-disable-next-line default-case
      switch (node.type) {
        case 'AssignmentExpression':
          if (node.left.type === 'MemberExpression') {
            const flattened = getKeypath(node.left);
            if (!flattened || scope.contains(flattened.name)) return;

            const exportsPatternMatch = exportsPattern.exec(flattened.keypath);
            if (!exportsPatternMatch || flattened.keypath === 'exports') return;

            const [, exportName] = exportsPatternMatch;
            uses[flattened.name] = true;

            // we're dealing with `module.exports = ...` or `[module.]exports.foo = ...` –
            if (flattened.keypath === 'module.exports') {
              moduleExportsAssignments.push(node);
              if (programDepth > 3) {
                moduleAccessScopes.add(scope);
              } else if (!firstTopLevelModuleExportsAssignment) {
                firstTopLevelModuleExportsAssignment = node;
              }
            } else if (exportName === KEY_COMPILED_ESM) {
              if (programDepth > 3) {
                shouldWrap = true;
              } else {
                // The "type" is either "module" or "exports" to discern
                // assignments to module.exports vs exports if needed
                topLevelDefineCompiledEsmExpressions.push({ node, type: flattened.name });
              }
            } else {
              const exportsAssignments = exportsAssignmentsByName.get(exportName) || {
                nodes: [],
                scopes: new Set()
              };
              exportsAssignments.nodes.push({ node, type: flattened.name });
              exportsAssignments.scopes.add(scope);
              exportsAccessScopes.add(scope);
              exportsAssignmentsByName.set(exportName, exportsAssignments);
              if (programDepth <= 3) {
                topLevelAssignments.add(node);
              }
            }

            skippedNodes.add(node.left);
          } else {
            for (const name of extractAssignedNames(node.left)) {
              reassignedNames.add(name);
            }
          }
          return;
        case 'CallExpression': {
          const defineCompiledEsmType = getDefineCompiledEsmType(node);
          if (defineCompiledEsmType) {
            if (programDepth === 3 && parent.type === 'ExpressionStatement') {
              // skip special handling for [module.]exports until we know we render this
              skippedNodes.add(node.arguments[0]);
              topLevelDefineCompiledEsmExpressions.push({ node, type: defineCompiledEsmType });
            } else {
              shouldWrap = true;
            }
            return;
          }

          // Transform require.resolve
          if (
            isDynamicRequireModulesEnabled &&
            node.callee.object &&
            isRequire(node.callee.object, scope) &&
            node.callee.property.name === 'resolve'
          ) {
            checkDynamicRequire(node.start);
            uses.require = true;
            const requireNode = node.callee.object;
            replacedDynamicRequires.push(requireNode);
            skippedNodes.add(node.callee);
            return;
          }

          if (!isRequireExpression(node, scope)) {
            const keypath = getKeypath(node.callee);
            if (keypath && importedVariables.has(keypath.name)) {
              // Heuristic to deoptimize requires after a required function has been called
              currentConditionalNodeEnd = Infinity;
            }
            return;
          }

          skippedNodes.add(node.callee);
          uses.require = true;

          if (hasDynamicArguments(node)) {
            if (isDynamicRequireModulesEnabled) {
              checkDynamicRequire(node.start);
            }
            if (!ignoreDynamicRequires) {
              replacedDynamicRequires.push(node.callee);
            }
            return;
          }

          const requireStringArg = getRequireStringArg(node);
          if (!ignoreRequire(requireStringArg)) {
            const usesReturnValue = parent.type !== 'ExpressionStatement';
            const toBeRemoved =
              parent.type === 'ExpressionStatement' &&
              (!currentConditionalNodeEnd ||
                // We should completely remove requires directly in a try-catch
                // so that Rollup can remove up the try-catch
                (currentTryBlockEnd !== null && currentTryBlockEnd < currentConditionalNodeEnd))
                ? parent
                : node;
            addRequireExpression(
              requireStringArg,
              node,
              scope,
              usesReturnValue,
              currentTryBlockEnd !== null,
              currentConditionalNodeEnd !== null,
              toBeRemoved
            );
            if (parent.type === 'VariableDeclarator' && parent.id.type === 'Identifier') {
              for (const name of extractAssignedNames(parent.id)) {
                importedVariables.add(name);
              }
            }
          }
          return;
        }
        case 'ClassBody':
          classBodyDepth += 1;
          return;
        case 'ConditionalExpression':
        case 'IfStatement':
          // skip dead branches
          if (isFalsy(node.test)) {
            skippedNodes.add(node.consequent);
          } else if (isTruthy(node.test)) {
            if (node.alternate) {
              skippedNodes.add(node.alternate);
            }
          } else {
            conditionalNodes.add(node.consequent);
            if (node.alternate) {
              conditionalNodes.add(node.alternate);
            }
          }
          return;
        case 'ArrowFunctionExpression':
        case 'FunctionDeclaration':
        case 'FunctionExpression':
          // requires in functions should be conditional unless it is an IIFE
          if (
            currentConditionalNodeEnd === null &&
            !(parent.type === 'CallExpression' && parent.callee === node)
          ) {
            currentConditionalNodeEnd = node.end;
          }
          return;
        case 'Identifier': {
          const { name } = node;
          if (!isReference(node, parent) || scope.contains(name)) return;
          switch (name) {
            case 'require':
              uses.require = true;
              if (isNodeRequirePropertyAccess(parent)) {
                return;
              }
              if (!ignoreDynamicRequires) {
                if (isShorthandProperty(parent)) {
                  // as key and value are the same object, isReference regards
                  // both as references, so we need to skip now
                  skippedNodes.add(parent.value);
                  magicString.prependRight(node.start, 'require: ');
                }
                replacedDynamicRequires.push(node);
              }
              return;
            case 'module':
            case 'exports':
              shouldWrap = true;
              uses[name] = true;
              return;
            case 'global':
              uses.global = true;
              if (!ignoreGlobal) {
                replacedGlobal.push(node);
              }
              return;
            case 'define':
              magicString.overwrite(node.start, node.end, 'undefined', {
                storeName: true
              });
              return;
            default:
              globals.add(name);
              return;
          }
        }
        case 'LogicalExpression':
          // skip dead branches
          if (node.operator === '&&') {
            if (isFalsy(node.left)) {
              skippedNodes.add(node.right);
            } else if (!isTruthy(node.left)) {
              conditionalNodes.add(node.right);
            }
          } else if (node.operator === '||') {
            if (isTruthy(node.left)) {
              skippedNodes.add(node.right);
            } else if (!isFalsy(node.left)) {
              conditionalNodes.add(node.right);
            }
          }
          return;
        case 'MemberExpression':
          if (!isDynamicRequireModulesEnabled && isModuleRequire(node, scope)) {
            uses.require = true;
            replacedDynamicRequires.push(node);
            skippedNodes.add(node.object);
            skippedNodes.add(node.property);
          }
          return;
        case 'ReturnStatement':
          // if top-level return, we need to wrap it
          if (lexicalDepth === 0) {
            shouldWrap = true;
          }
          return;
        case 'ThisExpression':
          // rewrite top-level `this` as `commonjsHelpers.commonjsGlobal`
          if (lexicalDepth === 0 && !classBodyDepth) {
            uses.global = true;
            if (!ignoreGlobal) {
              replacedGlobal.push(node);
            }
          }
          return;
        case 'TryStatement':
          if (currentTryBlockEnd === null) {
            currentTryBlockEnd = node.block.end;
          }
          if (currentConditionalNodeEnd === null) {
            currentConditionalNodeEnd = node.end;
          }
          return;
        case 'UnaryExpression':
          // rewrite `typeof module`, `typeof module.exports` and `typeof exports` (https://github.com/rollup/rollup-plugin-commonjs/issues/151)
          if (node.operator === 'typeof') {
            const flattened = getKeypath(node.argument);
            if (!flattened) return;

            if (scope.contains(flattened.name)) return;

            if (
              !isEsModule &&
              (flattened.keypath === 'module.exports' ||
                flattened.keypath === 'module' ||
                flattened.keypath === 'exports')
            ) {
              magicString.overwrite(node.start, node.end, `'object'`, {
                storeName: false
              });
            }
          }
          return;
        case 'VariableDeclaration':
          if (!scope.parent) {
            topLevelDeclarations.push(node);
          }
          return;
        case 'TemplateElement':
          if (node.value.raw.includes('\n')) {
            indentExclusionRanges.push([node.start, node.end]);
          }
      }
    },

    leave(node) {
      programDepth -= 1;
      if (node.scope) scope = scope.parent;
      if (functionType.test(node.type)) lexicalDepth -= 1;
      if (node.type === 'ClassBody') classBodyDepth -= 1;
    }
  });

  const nameBase = getName(id);
  const exportsName = deconflict([...exportsAccessScopes], globals, nameBase);
  const moduleName = deconflict([...moduleAccessScopes], globals, `${nameBase}Module`);
  const requireName = deconflict([scope], globals, `require${capitalize(nameBase)}`);
  const isRequiredName = deconflict([scope], globals, `hasRequired${capitalize(nameBase)}`);
  const helpersName = deconflict([scope], globals, 'commonjsHelpers');
  const dynamicRequireName =
    replacedDynamicRequires.length > 0 &&
    deconflict(
      [scope],
      globals,
      isDynamicRequireModulesEnabled ? CREATE_COMMONJS_REQUIRE_EXPORT : COMMONJS_REQUIRE_EXPORT
    );
  const deconflictedExportNames = Object.create(null);
  for (const [exportName, { scopes }] of exportsAssignmentsByName) {
    deconflictedExportNames[exportName] = deconflict([...scopes], globals, exportName);
  }

  for (const node of replacedGlobal) {
    magicString.overwrite(node.start, node.end, `${helpersName}.commonjsGlobal`, {
      storeName: true
    });
  }
  for (const node of replacedDynamicRequires) {
    magicString.overwrite(
      node.start,
      node.end,
      isDynamicRequireModulesEnabled
        ? `${dynamicRequireName}(${JSON.stringify(virtualDynamicRequirePath)})`
        : dynamicRequireName,
      {
        contentOnly: true,
        storeName: true
      }
    );
  }

  // We cannot wrap ES/mixed modules
  shouldWrap = !isEsModule && (shouldWrap || (uses.exports && moduleExportsAssignments.length > 0));

  if (
    !(
      shouldWrap ||
      isRequired ||
      needsRequireWrapper ||
      uses.module ||
      uses.exports ||
      uses.require ||
      topLevelDefineCompiledEsmExpressions.length > 0
    ) &&
    (ignoreGlobal || !uses.global)
  ) {
    return { meta: { commonjs: { isCommonJS: false } } };
  }

  let leadingComment = '';
  if (code.startsWith('/*')) {
    const commentEnd = code.indexOf('*/', 2) + 2;
    leadingComment = `${code.slice(0, commentEnd)}\n`;
    magicString.remove(0, commentEnd).trim();
  }

  let shebang = '';
  if (code.startsWith('#!')) {
    const shebangEndPosition = code.indexOf('\n') + 1;
    shebang = code.slice(0, shebangEndPosition);
    magicString.remove(0, shebangEndPosition).trim();
  }

  const exportMode = isEsModule
    ? 'none'
    : shouldWrap
    ? uses.module
      ? 'module'
      : 'exports'
    : firstTopLevelModuleExportsAssignment
    ? exportsAssignmentsByName.size === 0 && topLevelDefineCompiledEsmExpressions.length === 0
      ? 'replace'
      : 'module'
    : moduleExportsAssignments.length === 0
    ? 'exports'
    : 'module';

  const exportedExportsName =
    exportMode === 'module' ? deconflict([], globals, `${nameBase}Exports`) : exportsName;

  const importBlock = await rewriteRequireExpressionsAndGetImportBlock(
    magicString,
    topLevelDeclarations,
    reassignedNames,
    helpersName,
    dynamicRequireName,
    moduleName,
    exportsName,
    id,
    exportMode,
    resolveRequireSourcesAndUpdateMeta,
    needsRequireWrapper,
    isEsModule,
    isDynamicRequireModulesEnabled,
    getIgnoreTryCatchRequireStatementMode,
    commonjsMeta
  );
  const usesRequireWrapper = commonjsMeta.isCommonJS === IS_WRAPPED_COMMONJS;
  const exportBlock = isEsModule
    ? ''
    : rewriteExportsAndGetExportsBlock(
        magicString,
        moduleName,
        exportsName,
        exportedExportsName,
        shouldWrap,
        moduleExportsAssignments,
        firstTopLevelModuleExportsAssignment,
        exportsAssignmentsByName,
        topLevelAssignments,
        topLevelDefineCompiledEsmExpressions,
        deconflictedExportNames,
        code,
        helpersName,
        exportMode,
        defaultIsModuleExports,
        usesRequireWrapper,
        requireName
      );

  if (shouldWrap) {
    wrapCode(magicString, uses, moduleName, exportsName, indentExclusionRanges);
  }

  if (usesRequireWrapper) {
    magicString.trim().indent('\t', {
      exclude: indentExclusionRanges
    });
    const exported = exportMode === 'module' ? `${moduleName}.exports` : exportsName;
    magicString.prepend(
      `var ${isRequiredName};

function ${requireName} () {
\tif (${isRequiredName}) return ${exported};
\t${isRequiredName} = 1;
`
    ).append(`
\treturn ${exported};
}`);
    if (exportMode === 'replace') {
      magicString.prepend(`var ${exportsName};\n`);
    }
  }

  magicString
    .trim()
    .prepend(shebang + leadingComment + importBlock)
    .append(exportBlock);

  return {
    code: magicString.toString(),
    map: sourceMap ? magicString.generateMap() : null,
    syntheticNamedExports: isEsModule || usesRequireWrapper ? false : '__moduleExports',
    meta: { commonjs: { ...commonjsMeta, shebang } }
  };
}

const PLUGIN_NAME = 'commonjs';

function commonjs(options = {}) {
  const {
    ignoreGlobal,
    ignoreDynamicRequires,
    requireReturnsDefault: requireReturnsDefaultOption,
    defaultIsModuleExports: defaultIsModuleExportsOption,
    esmExternals
  } = options;
  const extensions = options.extensions || ['.js'];
  const filter = createFilter(options.include, options.exclude);
  const isPossibleCjsId = (id) => {
    const extName = require$$0$2.extname(id);
    return extName === '.cjs' || (extensions.includes(extName) && filter(id));
  };

  const { strictRequiresFilter, detectCyclesAndConditional } = getStrictRequiresFilter(options);

  const getRequireReturnsDefault =
    typeof requireReturnsDefaultOption === 'function'
      ? requireReturnsDefaultOption
      : () => requireReturnsDefaultOption;

  let esmExternalIds;
  const isEsmExternal =
    typeof esmExternals === 'function'
      ? esmExternals
      : Array.isArray(esmExternals)
      ? ((esmExternalIds = new Set(esmExternals)), (id) => esmExternalIds.has(id))
      : () => esmExternals;

  const getDefaultIsModuleExports =
    typeof defaultIsModuleExportsOption === 'function'
      ? defaultIsModuleExportsOption
      : () =>
          typeof defaultIsModuleExportsOption === 'boolean' ? defaultIsModuleExportsOption : 'auto';

  const dynamicRequireRoot =
    typeof options.dynamicRequireRoot === 'string'
      ? require$$0$2.resolve(options.dynamicRequireRoot)
      : process.cwd();
  const { commonDir, dynamicRequireModules } = getDynamicRequireModules(
    options.dynamicRequireTargets,
    dynamicRequireRoot
  );
  const isDynamicRequireModulesEnabled = dynamicRequireModules.size > 0;

  const ignoreRequire =
    typeof options.ignore === 'function'
      ? options.ignore
      : Array.isArray(options.ignore)
      ? (id) => options.ignore.includes(id)
      : () => false;

  const getIgnoreTryCatchRequireStatementMode = (id) => {
    const mode =
      typeof options.ignoreTryCatch === 'function'
        ? options.ignoreTryCatch(id)
        : Array.isArray(options.ignoreTryCatch)
        ? options.ignoreTryCatch.includes(id)
        : typeof options.ignoreTryCatch !== 'undefined'
        ? options.ignoreTryCatch
        : true;

    return {
      canConvertRequire: mode !== 'remove' && mode !== true,
      shouldRemoveRequire: mode === 'remove'
    };
  };

  const { currentlyResolving, resolveId } = getResolveId(extensions, isPossibleCjsId);

  const sourceMap = options.sourceMap !== false;

  // Initialized in buildStart
  let requireResolver;

  function transformAndCheckExports(code, id) {
    const normalizedId = normalizePathSlashes(id);
    const { isEsModule, hasDefaultExport, hasNamedExports, ast } = analyzeTopLevelStatements(
      this.parse,
      code,
      id
    );

    const commonjsMeta = this.getModuleInfo(id).meta.commonjs || {};
    if (hasDefaultExport) {
      commonjsMeta.hasDefaultExport = true;
    }
    if (hasNamedExports) {
      commonjsMeta.hasNamedExports = true;
    }

    if (
      !dynamicRequireModules.has(normalizedId) &&
      (!(hasCjsKeywords(code, ignoreGlobal) || requireResolver.isRequiredId(id)) ||
        (isEsModule && !options.transformMixedEsModules))
    ) {
      commonjsMeta.isCommonJS = false;
      return { meta: { commonjs: commonjsMeta } };
    }

    const needsRequireWrapper =
      !isEsModule && (dynamicRequireModules.has(normalizedId) || strictRequiresFilter(id));

    const checkDynamicRequire = (position) => {
      const normalizedDynamicRequireRoot = normalizePathSlashes(dynamicRequireRoot);

      if (normalizedId.indexOf(normalizedDynamicRequireRoot) !== 0) {
        this.error(
          {
            code: 'DYNAMIC_REQUIRE_OUTSIDE_ROOT',
            normalizedId,
            normalizedDynamicRequireRoot,
            message: `"${normalizedId}" contains dynamic require statements but it is not within the current dynamicRequireRoot "${normalizedDynamicRequireRoot}". You should set dynamicRequireRoot to "${require$$0$2.dirname(
              normalizedId
            )}" or one of its parent directories.`
          },
          position
        );
      }
    };

    return transformCommonjs(
      this.parse,
      code,
      id,
      isEsModule,
      ignoreGlobal || isEsModule,
      ignoreRequire,
      ignoreDynamicRequires && !isDynamicRequireModulesEnabled,
      getIgnoreTryCatchRequireStatementMode,
      sourceMap,
      isDynamicRequireModulesEnabled,
      dynamicRequireModules,
      commonDir,
      ast,
      getDefaultIsModuleExports(id),
      needsRequireWrapper,
      requireResolver.resolveRequireSourcesAndUpdateMeta(this),
      requireResolver.isRequiredId(id),
      checkDynamicRequire,
      commonjsMeta
    );
  }

  return {
    name: PLUGIN_NAME,

    version,

    options(rawOptions) {
      // We inject the resolver in the beginning so that "catch-all-resolver" like node-resolver
      // do not prevent our plugin from resolving entry points ot proxies.
      const plugins = Array.isArray(rawOptions.plugins)
        ? [...rawOptions.plugins]
        : rawOptions.plugins
        ? [rawOptions.plugins]
        : [];
      plugins.unshift({
        name: 'commonjs--resolver',
        resolveId
      });
      return { ...rawOptions, plugins };
    },

    buildStart({ plugins }) {
      validateVersion(this.meta.rollupVersion, peerDependencies.rollup, 'rollup');
      const nodeResolve = plugins.find(({ name }) => name === 'node-resolve');
      if (nodeResolve) {
        validateVersion(nodeResolve.version, '^13.0.6', '@rollup/plugin-node-resolve');
      }
      if (options.namedExports != null) {
        this.warn(
          'The namedExports option from "@rollup/plugin-commonjs" is deprecated. Named exports are now handled automatically.'
        );
      }
      requireResolver = getRequireResolver(
        extensions,
        detectCyclesAndConditional,
        currentlyResolving
      );
    },

    buildEnd() {
      if (options.strictRequires === 'debug') {
        const wrappedIds = requireResolver.getWrappedIds();
        if (wrappedIds.length) {
          this.warn({
            code: 'WRAPPED_IDS',
            ids: wrappedIds,
            message: `The commonjs plugin automatically wrapped the following files:\n[\n${wrappedIds
              .map((id) => `\t${JSON.stringify(require$$0$2.relative(process.cwd(), id))}`)
              .join(',\n')}\n]`
          });
        } else {
          this.warn({
            code: 'WRAPPED_IDS',
            ids: wrappedIds,
            message: 'The commonjs plugin did not wrap any files.'
          });
        }
      }
    },

    load(id) {
      if (id === HELPERS_ID) {
        return getHelpersModule();
      }

      if (isWrappedId(id, MODULE_SUFFIX)) {
        const name = getName(unwrapId(id, MODULE_SUFFIX));
        return {
          code: `var ${name} = {exports: {}}; export {${name} as __module}`,
          meta: { commonjs: { isCommonJS: false } }
        };
      }

      if (isWrappedId(id, EXPORTS_SUFFIX)) {
        const name = getName(unwrapId(id, EXPORTS_SUFFIX));
        return {
          code: `var ${name} = {}; export {${name} as __exports}`,
          meta: { commonjs: { isCommonJS: false } }
        };
      }

      if (isWrappedId(id, EXTERNAL_SUFFIX)) {
        const actualId = unwrapId(id, EXTERNAL_SUFFIX);
        return getUnknownRequireProxy(
          actualId,
          isEsmExternal(actualId) ? getRequireReturnsDefault(actualId) : true
        );
      }

      // entry suffix is just appended to not mess up relative external resolution
      if (id.endsWith(ENTRY_SUFFIX)) {
        const acutalId = id.slice(0, -ENTRY_SUFFIX.length);
        const {
          meta: { commonjs: commonjsMeta }
        } = this.getModuleInfo(acutalId);
        const shebang = commonjsMeta?.shebang ?? '';
        return getEntryProxy(
          acutalId,
          getDefaultIsModuleExports(acutalId),
          this.getModuleInfo,
          shebang
        );
      }

      if (isWrappedId(id, ES_IMPORT_SUFFIX)) {
        const actualId = unwrapId(id, ES_IMPORT_SUFFIX);
        return getEsImportProxy(actualId, getDefaultIsModuleExports(actualId));
      }

      if (id === DYNAMIC_MODULES_ID) {
        return getDynamicModuleRegistry(
          isDynamicRequireModulesEnabled,
          dynamicRequireModules,
          commonDir,
          ignoreDynamicRequires
        );
      }

      if (isWrappedId(id, PROXY_SUFFIX)) {
        const actualId = unwrapId(id, PROXY_SUFFIX);
        return getStaticRequireProxy(actualId, getRequireReturnsDefault(actualId), this.load);
      }

      return null;
    },

    shouldTransformCachedModule(...args) {
      return requireResolver.shouldTransformCachedModule.call(this, ...args);
    },

    transform(code, id) {
      if (!isPossibleCjsId(id)) return null;

      try {
        return transformAndCheckExports.call(this, code, id);
      } catch (err) {
        return this.error(err, err.pos);
      }
    }
  };
}

const hydrateServerOutputTarget = (outputTarget) => ({
    type: 'custom',
    name: 'nlx-hydrate-server',
    validate(config) {
        return;
    },
    async generator(config, compilerCtx, buildCtx) {
        if ((buildCtx.hydrateAppFilePath || '').length === 0) {
            return;
        }
        try {
            const buildDirPath = require$$0$2.join(buildCtx.config.cacheDir || require$$0$2.join(buildCtx.config.rootDir, '.stencil'), 'nlx-hydrate-server');
            await promises.mkdir(buildDirPath, { recursive: true });
            const outputDirPath = outputTarget.dir;
            await promises.mkdir(outputDirPath, { recursive: true });
            await promises.copyFile(require$$0$2.join(__dirname, 'server.js'), require$$0$2.join(buildDirPath, 'server.js'));
            await promises.copyFile(buildCtx.hydrateAppFilePath, require$$0$2.join(buildDirPath, 'hydrate-app.js'));
            await promises.writeFile(require$$0$2.join(buildDirPath, 'index.js'), `
const {createServer} = require('./server.js');
const {renderToString} = require('./hydrate-app.js');

const PORT = process.env.PORT || 80;

createServer(renderToString).listen(PORT, (error) => {
    if (error) throw error;
    console.log('Hydrate server listening on', PORT);
});`);
            const rollupOptions = {
                input: require$$0$2.join(buildDirPath, 'index.js'),
                treeshake: false,
                plugins: [
                    commonjs(),
                    nodeResolve(),
                ],
            };
            const rollupBuild = await rollup.rollup(rollupOptions);
            const outputFilePath = require$$0$2.join(outputDirPath, 'index.js');
            const rollupOutput = await rollupBuild.generate({
                file: outputFilePath,
                format: 'cjs',
            });
            await compilerCtx.fs.writeFile(outputFilePath, rollupOutput.output[0].code, { immediateWrite: true });
        }
        catch (e) {
            console.log(e);
        }
    }
});

exports.hydrateServerOutputTarget = hydrateServerOutputTarget;
