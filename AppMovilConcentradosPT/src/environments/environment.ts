// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  awsConfig: {
    region: 'us-east-2',
    userPoolId: 'us-east-2_4CJ5oH0ox',
    userPoolWebClientId: 'sim5ffsnqggslue1gp7miec3b',
    apiUrl: 'https://uswxs1ee2d.execute-api.us-east-2.amazonaws.com/prod',
    s3BaseUrl: 'https://concentrados-app-imagenes-517329182634-us-east-2-an.s3.us-east-2.amazonaws.com'
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
