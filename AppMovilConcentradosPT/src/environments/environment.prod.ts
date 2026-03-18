export const environment = {
  production: true,
  awsConfig: {
    region: 'us-east-2',
    userPoolId: 'us-east-2_4CJ5oH0ox',
    userPoolWebClientId: 'sim5ffsnqggslue1gp7miec3b',
    apiUrl: 'https://uswxs1ee2d.execute-api.us-east-2.amazonaws.com/prod',
    s3BaseUrl: 'https://concentrados-app-imagenes-517329182634-us-east-2-an.s3.us-east-2.amazonaws.com',
    auth: {
      enableGoogleSignIn: false,
      hostedUiDomain: 'us-east-24cj5oh0ox.auth.us-east-2.amazoncognito.com',
      redirectSignInWeb: 'https://d841ly8p4kdic.cloudfront.net/auth/callback',
      redirectSignOutWeb: 'https://d841ly8p4kdic.cloudfront.net/cuenta',
      redirectSignInNative: 'https://d841ly8p4kdic.cloudfront.net/auth/callback',
      redirectSignOutNative: 'https://d841ly8p4kdic.cloudfront.net/cuenta'
    }
  }
};
