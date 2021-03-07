# Google Fit Steps

A simple app showing your last weeks steps synced into Google FIT
To run the app you will need to set up an OAuth2 App in the [Google Projects Console](https://console.developers.google.com/flows/enableapi?apiid=fitness)

Add a new **OAuth2 Credential** together with an appropriate **Consent Form**.

Name your app whatever you like. You will however need these redirect urls added to the app: 
```
http://localhost:5999/
http://localhost:5999/steps
```

Then create your `.env` file and place the `ClientId` and `ClientSecret` variables for authentication.

Run app with `npm start` and happy stepping!
