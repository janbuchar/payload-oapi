export const apiKeySecurity = { ApiKey: [] };
export const generateSecuritySchemes = (tokenUrl) => ({
    ApiKey: {
        type: 'oauth2',
        flows: {
            password: {
                tokenUrl: `/api/${tokenUrl}`,
                scopes: {},
            },
        },
    },
});
//# sourceMappingURL=securitySchemes.js.map