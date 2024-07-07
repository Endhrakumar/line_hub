// Require axios library to make API requests
const axios = require('axios');

exports.main = async (context, sendResponse) => {

  // console.log(context);
  // access key
  const userId = context.body?.events[0].source.userId;
  const LINE_CHANNEL_ACCESS_TOKEN = '';
  const AUTH_KEY = '';

  // check contact is present or not
  var checkContactHub = async function (mail) {
    var checkContactHubValue = null;
    const payload = {
      filterGroups: [
        {
          filters: [
            {
              propertyName: "email",
              value: `${mail}`,
              operator: "EQ"
            }
          ]
        }
      ]
    }
    await axios.post('https://api.hubapi.com/crm/v3/objects/contacts/search', payload,
                     { headers: 
                      { 'Authorization': `Bearer ${AUTH_KEY}`,
                       'Content-Type': 'application/json' 
                      }
                     })
      .then(async function(response) {
      console.log(response.data.total);
      checkContactHubValue = response.data.total;
    })
    return checkContactHubValue;
  }

  // create contact in Hub
  var createContactHub = async function(val){
    let BatchInputSimplePublicObjectBatchInput = {
      "inputs": [
        val
      ]
    }
    var createContactHubValue = null;
    try {
      const response = await axios.post( 'https://api.hubapi.com/crm/v3/objects/contacts/batch/create',BatchInputSimplePublicObjectBatchInput,{
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_KEY}`,
        },
      });
      createContactHubValue = response.data.results[0]?.id;
      sendResponse({ body: { response: 'Contact Created' }, statusCode: 200 }); 
    } catch (error) {
      createContactHubValue = 0;
      console.log(error.data)
      sendResponse({ body: { response: 'Contact Create Error' }, statusCode: 500 }); 
    }
    return createContactHubValue;
  }


  // line function call
  await axios.get(`https://api.line.me/v2/bot/profile/${userId}`, {
    headers: {
      'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
    }
  })
    .then(response => {
    const profile = response.data;
    const contact = {
      "properties": {
        "email": `${userId}@line.me`,
        "firstname": `${profile.displayName}`,
        "lifecyclestage": "marketingqualifiedlead"
      }
    }

    async function checkContactHubLet(){
      var value = await checkContactHub(`${userId}@line.me`);
      console.log(value);
      if(value == 0 ){
        let createContactHubCall = createContactHub(contact);
        console.log("checks");
      }else{
        console.log(value);
        sendResponse({ body: { response: 'Already exits' }, statusCode: 200 });
      }
    }
    checkContactHubLet();
  })
    .catch(error => {
    sendResponse({ body: { response: error.data }, statusCode: 500 });
  });
};

