'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.getAllEndPoints = exports.loadSchema = exports.getSchema = undefined;

var _jsonSchemaRefParser = require('json-schema-ref-parser');

var _jsonSchemaRefParser2 = _interopRequireDefault(_jsonSchemaRefParser);

var _nodeRequestBySwagger = require('node-request-by-swagger');

var _nodeRequestBySwagger2 = _interopRequireDefault(_nodeRequestBySwagger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// @flow

var __schema = void 0;

var getSchema = exports.getSchema = function getSchema() {
  if (!__schema || !Object.keys(__schema).length) {
    throw new Error('Schema was not loaded');
  }
  return __schema;
};

var getGQLTypeNameFromURL = function getGQLTypeNameFromURL(method, url) {
  var fromUrl = url.replace(/[\{\}]+/g, '').replace(/[^a-zA-Z0-9_]+/g, '_');
  return '' + method + fromUrl;
};

var getSuccessResponse = function getSuccessResponse(responses) {
  var resp = void 0;

  if (!responses) return null;

  Object.keys(responses).some(function (code) {
    resp = responses[code];
    return code[0] === '2';
  });

  return resp && resp.schema;
};

var loadSchema = exports.loadSchema = function loadSchema(pathToSchema) {
  var schema = _jsonSchemaRefParser2.default.dereference(pathToSchema);
  __schema = schema;
  return schema;
};

var replaceOddChars = function replaceOddChars(str) {
  return str.replace(/[^_a-zA-Z0-9]/g, '_');
};

/**
 * Going throw schema and grab routes
 * @returns Promise<T>
 */
var getAllEndPoints = exports.getAllEndPoints = function getAllEndPoints(schema) {
  var allTypes = {};
  Object.keys(schema.paths).forEach(function (path) {
    var route = schema.paths[path];
    Object.keys(route).forEach(function (method) {
      var obj = route[method];
      var isMutation = ['post', 'put', 'patch', 'delete'].indexOf(method) !== -1;
      var typeName = obj.operationId || getGQLTypeNameFromURL(method, path);
      var parameters = obj.parameters ? obj.parameters.map(function (param) {
        var type = param.type;
        return { name: replaceOddChars(param.name), type: type, jsonSchema: param };
      }) : [];
      allTypes[typeName] = {
        parameters: parameters,
        description: obj.description,
        response: getSuccessResponse(obj.responses),
        request: function request(args, server) {
          var url = '' + server.baseUrl + path;
          return (0, _nodeRequestBySwagger2.default)(obj, {
            request: args,
            url: url,
            method: method
          }, '');
        },
        mutation: isMutation
      };
    });
  });
  return allTypes;
};