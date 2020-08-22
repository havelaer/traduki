export default {
    type: 'object',
    additionalProperties: true,
    properties: {
        runtimeModuleId: {
            type: 'string',
        },
        filename: {
            type: 'string',
        },
        minify: {
            type: 'boolean',
        },
    },
};
