import { Amplify } from 'aws-amplify'

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'eu-west-1_fOnlrfcGQ',
      userPoolClientId: 'tsd3tqn0gbn76779l08k488j3',
    },
  },
})