# External API

The external API (route: /api/public) is documented via the OpenAPI 2.0 specification (also called a "swagger file").
The corresponding YAML and JSON files are located under `backend/api/swagger`.

This documentation can be presented as a web page - the "Swagger UI" - to the potential users of the API, so they can read up on the definition of the API and try it out.

## How to enable Swagger UI for your EVA instance

Because this feature makes the backend application ~8MB bigger in terms of file size for the deploy and the UI may not be wanted or needed, it is disabled by default and needs to be enabled via the following steps:

1. Install the needed dependency with `npm install --save swagger-ui-dist`
2. Enable the API files to be loaded by uncommenting the `swaggerApi:` line in `backend/config/apis.js`
3. Apply any interface changes you make to the external API to both description files - external_api.json and external_api.yaml in `backend/api/swagger` - to keep them consistent, you can use the "Swagger Editor" for easier editing

Keep in mind that only the JSON file is used for the Swagger UI application, the YAML file is only there for reference because it is much more human-readable.
