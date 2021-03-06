import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
require('dotenv').config();

const got = require('got').default; //Error if not CommonJS https://github.com/axios/axios#note-commonjs-usage

const BASE_URL = async () => {
  let url = '';
  if (process.env.DEV_BASE_URL) {
    url = process.env.DEV_BASE_URL;
  } else {
    // url = functions.config().api.base_url;
    url = await functions.config().api.base_url;
    console.debug(url);
  }
  return url;
};

const rand = () => Math.trunc(Math.random() * 100); //TODO: remove

export const receiveQueryAndFirestoreIt = functions.https.onRequest(
  async (request, response) => {
    const _url = await BASE_URL();
    const q = request.body.q;
    if (q) {
      // Save to storage
      await admin
        .firestore()
        .collection('queries')
        .add({ data: { ...q }, _id: `${_url} - ${rand()}` });
      // Return response to client
      response.json({ q });
    } else {
      response.status(400).end();
    }
  }
);

// Authentication => identity.
// Authorization => permissions.
export const retrieveSubscriptionsForUser = functions.https.onRequest(
  async (request, response) => {
    const _url = await BASE_URL();
    //TODO: authenticate user
    const userId = await Promise.resolve(`test-${rand()}`);
    //TODO: get user ID
    if (userId) {
      //TODO: call Youtube API to get list of subscriptions
      const subscriptions = [rand(), rand()];
      // save the list of subscriptions in Firestore
      const r: { userId: string; subscriptions: number[]; error?: any } = {
        userId: userId,
        subscriptions,
      };
      try {
        // Must await, otherwise f() terminates before 'got' resolves
        await got(`${_url}receiveQueryAndFirestoreIt`, {
          method: 'POST',
          json: { q: r },
          responseType: 'json',
        });
      } catch (e) {
        r.error = e;
      }
      // TODO: clean up and return list of subscriptions to client
      response.json({ r });
    } else {
      response.status(400).end();
    }
  }
);
