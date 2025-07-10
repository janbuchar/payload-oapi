const redoc = ({ specEndpoint = '/openapi.json', docsUrl = '/docs', enabled = true, }) => ({ endpoints = [], ...config }) => {
    if (!enabled) {
        return { ...config, endpoints };
    }
    return {
        ...config,
        endpoints: [
            ...endpoints,
            {
                method: 'get',
                path: docsUrl,
                handler: async (req) => new Response(`
              <!DOCTYPE html>
              <html lang="en">
                <head>
                  <title>Redoc</title>
                  <!-- needed for adaptive design -->
                  <meta charset="utf-8"/>
                  <meta name="viewport" content="width=device-width, initial-scale=1">

                  <!--
                  Redoc doesn't change outer page styles
                  -->
                  <style>
                    body {
                      margin: 0;
                      padding: 0;
                    }
                  </style>
                </head>
                <body>
                  <redoc spec-url="${req.protocol}//${req.headers.get('host')}/api${specEndpoint}"></redoc>
                  <script src="https://cdn.jsdelivr.net/npm/redoc@2.4.0/bundles/redoc.standalone.js"></script>
                </body>
              </html>`, { headers: { 'content-type': 'text/html' } }),
            },
        ],
    };
};
export default redoc;
//# sourceMappingURL=redocPlugin.js.map