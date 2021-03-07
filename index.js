require('dotenv').config();
const { google } = require('googleapis');
const fitness = google.fitness('v1');

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const PORT = 5999;

const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URL } = process.env;
const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
const scopes = ['https://www.googleapis.com/auth/fitness.activity.read'];

const todayAtMidnight = new Date().setHours(0, 0, 0, 0);
const sevenDaysAgo = todayAtMidnight - 604800000; // 7 days in millis
console.log('what is today at midnight', todayAtMidnight);
console.log('Last week is:', sevenDaysAgo);

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        state: JSON.stringify({
            callbackUrl: req.body.callbackUrl,
            userID: req.body.userid,
        }),
    });
    res.redirect(url);
});

app.get('/steps', async (req, res) => {
    const code = req.query.code;
    const oauthResponse = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(oauthResponse.tokens);
    google.options({ auth: oauth2Client });

    const last7Days = await getAggregatedFitnessDataFromToInMillis(sevenDaysAgo, todayAtMidnight);
    last7Days.reverse();
    console.log('Steps last 7 days: ', last7Days);
    const today = await getStepsForToday();
    console.log('Today: ', today);

    res.json({
        steps: {
            today,
            last7Days,
        },
    });
});

function getStepsForToday() {
    return getAggregatedFitnessDataFromToInMillis(todayAtMidnight);
}

async function getAggregatedFitnessDataFromToInMillis(startTimeMillis, endTimeMillis) {
    const now = Date.now();
    const fitnessRes = await fitness.users.dataset.aggregate({
        userId: 'me',
        requestBody: {
            aggregateBy: [
                {
                    dataTypeName: 'com.google.step_count.delta',
                    dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
                },
            ],
            bucketByTime: {
                durationMillis: 86400000, // Aggregate by 1 day
            },
            startTimeMillis,
            endTimeMillis: endTimeMillis || now,
        },
    });
    const stepsDataPointBucketArray = fitnessRes.data.bucket;
    const stepsArray = stepsDataPointBucketArray.map((day) => {
        return day.dataset[0].point[0].value[0].intVal;
    });
    return stepsArray;
}

app.listen(PORT, () => {
    console.log('Google FIT Dev API is live');
    const open = require('open');
    open(`http://localhost:${PORT}`);
});
